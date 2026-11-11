// AGÊNCIA: produz os vídeos sozinha, de noite, usando o Claude Code deste Mac (com as skills e agentes daqui).
// Para cada perfil ativo: pauta → (agentes do /video ou /produzir) roteiro + cenas + QA → narração ElevenLabs
// → acelera 1,3x → render → legenda → fila de aprovação do painel.
//
// Uso: node plataforma/agencia.mjs [--perfil construiu] [--tema "..."] [--max 1] [--seco]
//   --seco  mostra o que faria, sem chamar o Claude nem gastar ElevenLabs.
import {spawn, execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ, DADOS, perfis, perfil as umPerfil, pautas, salvarPautas, salvarItem, item, log, env} from './lib/dados.mjs';
import {proximoHorario} from './lib/agenda.mjs';
import * as ESC from './lib/escritorio.mjs';

const args = process.argv.slice(2);
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const SECO = args.includes('--seco');
const E = env();
const MAX = Number(arg('--max') ?? E.AGENCIA_MAX_POR_PERFIL ?? 1);
const LIMITE_MIN = Number(E.AGENCIA_LIMITE_MINUTOS ?? 120); // tempo máximo de um vídeo no Claude

// O que o Claude pode fazer sem perguntar (rodando sozinho de noite). Nada de git push, rm, curl etc.
const FERRAMENTAS = [
  'Read', 'Write', 'Edit', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'Task', 'Agent', 'Skill', 'TodoWrite',
  'Bash(python3 tools/*)', 'Bash(node plataforma/cli.mjs *)', 'Bash(node tools/*)', 'Bash(npx remotion *)', 'Bash(npx tsc *)',
  'Bash(ls *)', 'Bash(mkdir *)', 'Bash(cat *)', 'Bash(head *)', 'Bash(ffmpeg *)', 'Bash(ffprobe *)',
];

const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

function rodar(cmd, argv, {nome, minutos = 30, extraEnv = {}} = {}) {
  return new Promise((ok, falha) => {
    const arqLog = fs.openSync(path.join(DADOS, 'logs', `${nome}.log`), 'a');
    const p = spawn(cmd, argv, {cwd: RAIZ, env: {...process.env, ...extraEnv}, stdio: ['ignore', 'pipe', arqLog]});
    let saida = '';
    p.stdout.on('data', (d) => {
      saida += d;
      fs.writeSync(arqLog, d);
    });
    const t = setTimeout(() => p.kill('SIGTERM'), minutos * 60000);
    p.on('close', (c) => {
      clearTimeout(t);
      fs.closeSync(arqLog);
      c === 0 ? ok(saida) : falha(new Error(`${cmd} saiu com código ${c} (ver plataforma/dados/logs/${nome}.log)`));
    });
  });
}

function claude(prompt, nome, minutos = LIMITE_MIN) {
  const argv = ['-p', prompt, '--output-format', 'json', '--permission-mode', 'acceptEdits', '--allowedTools', ...FERRAMENTAS];
  if (E.AGENCIA_MODELO) argv.push('--model', E.AGENCIA_MODELO);
  // CLAUDE_CODE_OAUTH_TOKEN (gerado com `claude setup-token`) deixa o Claude logado mesmo rodando pelo launchd
  const extraEnv = E.CLAUDE_CODE_OAUTH_TOKEN ? {CLAUDE_CODE_OAUTH_TOKEN: E.CLAUDE_CODE_OAUTH_TOKEN} : {};
  return rodar(E.CLAUDE_BIN || 'claude', argv, {nome, minutos, extraEnv}).then((s) => {
    try {
      return JSON.parse(s).result ?? s;
    } catch {
      return s;
    }
  });
}

// Mantém pelo menos 3 pautas novas por perfil (agente pauteiro).
async function reabastecer(p) {
  const d = pautas(p.id);
  if (d.pautas.filter((x) => x.status === 'nova').length >= 3) return;
  log('agencia', `${p.nome}: pedindo pautas novas ao pauteiro`);
  if (SECO) return;
  const feitas = d.pautas.map((x) => x.tema).join('; ');
  const r = await claude(
    `Use o agente pauteiro. Perfil "${p.nome}" (${p.nicho}). Já usadas: ${feitas}. ` +
      `Responda SÓ com um JSON: {"pautas": ["tema 1", ... 5 temas]}.`,
    `pauteiro-${p.id}`,
    15,
  );
  const m = String(r).match(/\{[\s\S]*\}/);
  const novas = m ? JSON.parse(m[0]).pautas ?? [] : [];
  for (const tema of novas) d.pautas.push({tema, status: 'nova'});
  salvarPautas(p.id, d);
  log('agencia', `${p.nome}: +${novas.length} pautas`);
}

// O pauteiro (como editor-chefe) escolhe entre as pautas novas a que tem mais chance de viralizar agora.
async function escolherPauta(p, d) {
  const novas = d.pautas.filter((x) => x.status === 'nova');
  if (novas.length <= 1) return novas[0];
  ESC.batida('pauteiro', 'working', `Escolhendo a melhor pauta de ${p.nome}`);
  try {
    const r = await claude(
      `Use o agente pauteiro como editor-chefe do perfil "${p.nome}" (${p.nicho}). Escolha a pauta com mais chance de viralizar ` +
        `e de vender como afiliado agora. Use os dados: \`node plataforma/cli.mjs tendencias ${p.id}\` e \`node plataforma/cli.mjs retencao ${p.id}\`:\n${novas.map((x, i) => `${i}. ${x.tema}`).join('\n')}\n` +
        `Responda SÓ com JSON: {"escolhida": <número>, "motivo": "uma frase"}`,
      `pauteiro-${p.id}`,
      15,
    );
    const j = JSON.parse(String(r).match(/\{[\s\S]*\}/)[0]);
    const e = novas[j.escolhida] ?? novas[0];
    e.motivo = j.motivo;
    log('agencia', `${p.nome}: pauteiro escolheu "${e.tema}" (${j.motivo})`);
    return e;
  } catch (e) {
    log('agencia', `${p.nome}: escolha automática falhou (${e.message}); usando a primeira`);
    return novas[0];
  }
}

const registrado = (id) => fs.readFileSync(path.join(RAIZ, 'src/Root.tsx'), 'utf8').includes(`id="${id}"`);

async function produzir(p, tema, pautaMotivo) {
  const id = slug(tema);
  if (SECO) return log('agencia', `${p.nome}: faria "${tema}" (${id})`);
  const it = salvarItem({id, perfil: p.id, tema, status: 'produzindo', etapa: 'roteiro', criado: new Date().toISOString()});
  // Escritório: uma tarefa por vídeo, que anda pelos agentes do Estúdio até a sua caixa de aprovação
  const tarefa = item(id)?.tarefa ?? (await ESC.tarefaDoVideo(id, `${p.nome}: ${tema}`, `Vídeo do perfil @${p.instagram}.${pautaMotivo ? `\n\nPor que esta pauta: ${pautaMotivo}` : ''}`));
  if (tarefa) salvarItem({id, tarefa});
  const AGENTE = {roteiro: 'roteirista', narracao: 'editor', render: 'editor', legenda: 'legendista'};
  const FAZ = {roteiro: 'Pesquisa, roteiro, cenas e QA (agentes do /video)', narracao: 'Narração com a voz do Fernando', render: 'Renderizando o vídeo', legenda: 'Legenda e hashtags'};
  const passo = (etapa) => {
    const ag = AGENTE[etapa];
    ESC.batida(ag, 'working', `${FAZ[etapa]}: ${tema}`, tarefa, `${FAZ[etapa]} · ${tema}`);
    if (ag !== 'legendista') ESC.mover(tarefa, ag, {status: 'doing'});
    return salvarItem({id, etapa});
  };
  const livre = (ag) => ESC.batida(ag, 'idle');
  ESC.batida('pauteiro', 'idle', undefined, tarefa, `Pauta escolhida para ${p.nome}: ${tema}`, 'success');
  passo('roteiro');
  log('agencia', `${p.nome}: produzindo "${tema}" (${id})`);
  try {
    // 1. Agentes: pesquisa → roteiro → direção → cenografia → edição → QA (o comando do formato)
    if (!fs.existsSync(path.join(RAIZ, `roteiros/${id}.json`)) || !registrado(id)) {
      await claude(
        `${p.comando} ${tema}\n\n` +
          `Regras desta execução automática (não tem ninguém olhando):\n` +
          `- Perfil: ${p.nome} (formato "${p.formato}"). Se existir docs/formatos/${p.formato}.md, siga-o.\n` +
          `- Use o id "${id}" (roteiros/${id}.json, composição id="${id}" em src/Root.tsx).\n` +
          `- Não peça confirmação; decida sozinho seguindo docs/PIPELINE.md.\n` +
          `- NÃO rode tools/narrar.sh, git, nem o render final: a plataforma faz isso depois.\n` +
          `- Pare quando o QA aprovar e a composição estiver registrada com tempos estimados.`,
        `video-${id}`,
      );
    }
    if (!registrado(id)) throw new Error('o Claude terminou sem registrar a composição no src/Root.tsx');

    // 2. Narração com a voz aprovada do roteiro, acelerada para o padrão do canal
    livre('roteirista');
    passo('narracao');
    const tim = path.join(RAIZ, `public/audio/${id}/timings.json`);
    const jaNarrado = fs.existsSync(tim) && !JSON.parse(fs.readFileSync(tim, 'utf8')).estimado;
    if (!jaNarrado) {
      if (!E.ELEVENLABS_API_KEY) throw new Error('falta ELEVENLABS_API_KEY no .env');
      if (E.ELEVENLABS_VOZ) {
        // a voz escolhida no painel vale para todos os vídeos (a do Fernando por padrão)
        const fr = path.join(RAIZ, `roteiros/${id}.json`);
        const rot = JSON.parse(fs.readFileSync(fr, 'utf8'));
        rot.elevenlabs = {...(rot.elevenlabs ?? {}), voz_id: E.ELEVENLABS_VOZ, modelo: rot.elevenlabs?.modelo ?? 'eleven_multilingual_v2'};
        fs.writeFileSync(fr, JSON.stringify(rot, null, 2));
      }
      await rodar('python3', ['tools/tts_elevenlabs.py', `roteiros/${id}.json`], {nome: `video-${id}`, extraEnv: {ELEVENLABS_API_KEY: E.ELEVENLABS_API_KEY}});
      const f = Number(E.NARRACAO_VELOCIDADE ?? 1.3);
      if (f !== 1) {
        // mesmo processo do casa-50m2: original guardado em <id>-original, versão acelerada em <id>
        const pa = path.join(RAIZ, `public/audio/${id}`);
        fs.rmSync(pa + '-original', {recursive: true, force: true});
        fs.renameSync(pa, pa + '-original');
        await rodar('python3', ['tools/acelerar.py', `${id}-original`, id, String(f)], {nome: `video-${id}`});
      }
    }

    // 3. Render final
    passo('render');
    fs.mkdirSync(path.join(RAIZ, 'out'), {recursive: true});
    if (!fs.existsSync(path.join(RAIZ, 'node_modules/.bin/remotion'))) await rodar('npm', ['install', '--no-audit', '--no-fund'], {nome: `video-${id}`});
    const mp4 = `out/${id}.mp4`;
    const mtime = (a) => (fs.existsSync(path.join(RAIZ, a)) ? fs.statSync(path.join(RAIZ, a)).mtimeMs : Infinity);
    const renderAtual = mtime(mp4) !== Infinity && mtime(mp4) > Math.max(mtime(`roteiros/${id}.json`), mtime(`public/audio/${id}/timings.json`));
    if (!renderAtual) await rodar('npx', ['remotion', 'render', 'src/index.ts', id, mp4], {nome: `video-${id}`, minutos: 60});
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1.5', '-i', mp4, '-frames:v', '1', '-vf', 'scale=360:-1', `out/${id}.jpg`], {cwd: RAIZ});

    // 4. Legenda (agente legendista)
    passo('legenda');
    const fLeg = path.join(RAIZ, `out/${id}.legenda.json`);
    const r = fs.existsSync(fLeg) ? fs.readFileSync(fLeg, 'utf8') : await claude(
      `Use o agente legendista. Perfil ${p.nome} (@${p.instagram}). Vídeo: roteiros/${id}.json. ` +
        `CTA: "${p.cta}". Hashtags base: ${p.hashtags.join(' ')}. Responda SÓ com o JSON pedido pelo agente.`,
      `legenda-${id}`,
      15,
    ).catch((e) => (log('agencia', `legenda automática falhou (${e.message}); usando a padrão`), ''));
    if (!fs.existsSync(fLeg) && r) fs.writeFileSync(fLeg, String(r).match(/\{[\s\S]*\}/)?.[0] ?? '');
    const m = String(r).match(/\{[\s\S]*\}/);
    const padrao = {legenda: `${tema}\n\n${p.cta}\n\n${p.hashtags.map((h) => '#' + h).join(' ')}`, titulo_youtube: `${tema} #shorts`};
    let leg = padrao;
    try {
      if (m) leg = {...padrao, ...JSON.parse(m[0])};
    } catch {}

    // 5. Guarda no git local (sem push) para nada se perder
    try {
      const arquivos = [`roteiros/${id}.json`, `roteiros/${id}.pesquisa.md`, `public/audio/${id}`, `public/audio/${id}-original`, 'src', 'tools']
        .filter((a) => fs.existsSync(path.join(RAIZ, a)));
      execFileSync('git', ['add', ...arquivos], {cwd: RAIZ, stdio: 'ignore'});
      // só esses caminhos: não leva junto o que estiver preparado para outro commit
      execFileSync('git', ['commit', '-qm', `Produção automática: ${id} (${p.nome})`, '--', ...arquivos], {cwd: RAIZ, stdio: 'ignore'});
    } catch {}

    livre('editor');
    livre('legendista');
    ESC.anexar(tarefa, 'editor', {kind: 'link', label: 'Vídeo pronto (mp4)', url: `/${mp4}`});
    ESC.anexar(tarefa, 'legendista', {kind: 'texto', label: 'Legenda do post', content: `${leg.legenda}\n\nTítulo do Shorts: ${leg.titulo_youtube}`});
    const auto = E.AUTO_PUBLICAR === '1';
    if (!auto) {
      await ESC.mover(tarefa, 'editor', {status: 'review'});
      ESC.batida('showrunner', 'waiting', `Esperando sua aprovação: ${tema}`, tarefa, `Vídeo pronto para você aprovar: ${tema}`, 'warn');
    } else {
      ESC.batida('social-media', 'working', `Agendado: ${tema}`, tarefa, `Publicação automática ligada: "${tema}" vai sair às ${p.horario}`, 'success');
    }
    return salvarItem({
      id,
      status: auto ? 'aprovado' : 'aguardando_aprovacao',
      etapa: 'pronto',
      video: mp4,
      capa: `out/${id}.jpg`,
      legenda: leg.legenda,
      titulo_youtube: leg.titulo_youtube,
      agendado_para: auto ? proximoHorario(p.horario) : null,
      erro: null,
    });
  } catch (e) {
    log('agencia', `${p.nome}: ERRO em ${id}: ${e.message}`);
    ESC.batida(AGENTE[item(id)?.etapa] ?? 'showrunner', 'error', `Erro: ${tema}`, tarefa, `Erro na produção de "${tema}": ${e.message}`, 'error');
    return salvarItem({id, status: 'erro', erro: e.message});
  }
}

async function main() {
  // Pelo agendador (sem argumentos) só produz se a produção automática estiver ligada no painel.
  if (!args.length && E.PRODUCAO_AUTOMATICA !== '1') return log('agencia', 'produção automática desligada no painel; nada a fazer');
  log('agencia', `início${SECO ? ' (seco)' : ''}`);
  // Não deixa o Mac dormir enquanto a agência roda (só durante este processo).
  if (process.platform === 'darwin' && !SECO) spawn('caffeinate', ['-i', '-w', String(process.pid)], {stdio: 'ignore', detached: true}).unref();

  const lista = arg('--perfil') ? [umPerfil(arg('--perfil'))] : perfis().filter((p) => p.ativo);
  for (const p of lista) {
    if (!p) continue;
    if (arg('--tema')) {
      await produzir(p, arg('--tema'));
      continue;
    }
    await reabastecer(p).catch((e) => log('agencia', `${p.nome}: pauteiro falhou: ${e.message}`));
    for (let n = 0; n < MAX; n++) {
      const d = pautas(p.id);
      const pauta = SECO ? d.pautas.find((x) => x.status === 'nova') : await escolherPauta(p, d);
      if (!pauta) break;
      if (!SECO) {
        pauta.status = 'usada';
        salvarPautas(p.id, d);
      }
      await produzir(p, pauta.tema, pauta.motivo);
    }
  }
  log('agencia', 'fim');
}

main();
