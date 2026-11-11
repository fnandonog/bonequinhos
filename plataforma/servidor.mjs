// PAINEL: http://localhost:4380 (só no próprio Mac).
// Uso: node plataforma/servidor.mjs   (ou npm run painel)
import fs from 'node:fs';
import {createRequire} from 'node:module';
import express from 'express';
import path from 'node:path';
import {spawn} from 'node:child_process';
import * as D from './lib/dados.mjs';
import {descobrirContas, credenciais, chaveEnv} from './lib/meta.mjs';
import {proximoHorario} from './lib/agenda.mjs';
import {publicar} from './postar.mjs';
import {sincronizar, analytics, comentarios, salvarComentario} from './sincronizar.mjs';
import {responderComentario} from './lib/meta.mjs';
import * as LINKS from './lib/links.mjs';
import {tendencias, cacar} from './tendencias.mjs';
import * as YT from './lib/youtube.mjs';
import * as DIRECT from './lib/direct.mjs';

const PORTA = Number(process.env.PORTA ?? 4380);
const CONFIG_VISIVEL = ['CLAUDE_CODE_OAUTH_TOKEN', 'META_USER_TOKEN', 'YOUTUBE_API_KEY', 'YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_PRIVACIDADE', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_GRUPO_ID', 'RECEITA_AFILIADO_MES', 'META_GRAPH_VERSION', 'ELEVENLABS_API_KEY', 'AUTO_PUBLICAR', 'PRODUCAO_AUTOMATICA', 'ELEVENLABS_VOZ', 'META_POSTAR_FACEBOOK',
  'AGENCIA_MAX_POR_PERFIL', 'AGENCIA_MODELO', 'NARRACAO_VELOCIDADE'];
const SEGREDOS = ['CLAUDE_CODE_OAUTH_TOKEN', 'META_USER_TOKEN', 'ELEVENLABS_API_KEY', 'YOUTUBE_API_KEY', 'YOUTUBE_CLIENT_SECRET', 'TELEGRAM_BOT_TOKEN'];
const TIPOS = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.png': 'image/png'};

let agencia = null; // processo da agência disparado pelo painel

function estado() {
  const e = D.env();
  const config = Object.fromEntries(CONFIG_VISIVEL.map((k) => [k, SEGREDOS.includes(k) ? D.mascarar(e[k]) : e[k] ?? '']));
  try { config.AGENTES_LIGADOS = JSON.parse(fs.readFileSync(path.join(D.PLAT, 'escritorio/tools/agencia.json'), 'utf8')).enabled ? '1' : '0'; } catch {}
  const perfis = D.perfis().map((p) => {
    const c = credenciais(p.id);
    const pt = D.pautas(p.id).pautas;
    return {...p, conectado: {instagram: !!(c.ig && c.token), facebook: !!(c.page && c.pageToken), youtube: YT.conectado(p.id), youtube_canal: YT.canal(p.id)?.split('|')[1] ?? null},
      pautas_novas: pt.filter((x) => x.status === 'nova').length, pautas: pt};
  });
  return {perfis, fila: D.fila(), config, agencia_rodando: !!agencia, analytics: analytics(), comentarios: comentarios().filter((c) => c.status === 'novo').length, links: LINKS.config()};
}

function arquivo(res, f, req) {
  if (!fs.existsSync(f)) return enviar(res, 404, {erro: 'não encontrado'});
  const tam = fs.statSync(f).size;
  const tipo = TIPOS[path.extname(f)] ?? 'application/octet-stream';
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const ini = Number(range[1] || 0), fim = range[2] ? Number(range[2]) : tam - 1;
    res.writeHead(206, {'Content-Type': tipo, 'Content-Range': `bytes ${ini}-${fim}/${tam}`, 'Accept-Ranges': 'bytes', 'Content-Length': fim - ini + 1});
    return fs.createReadStream(f, {start: ini, end: fim}).pipe(res);
  }
  res.writeHead(200, {'Content-Type': tipo, 'Content-Length': tam, 'Accept-Ranges': 'bytes'});
  fs.createReadStream(f).pipe(res);
}

function enviar(res, cod, dados) {
  res.writeHead(cod, {'Content-Type': 'application/json; charset=utf-8'});
  res.end(JSON.stringify(dados));
}

const corpo = async (req) => req.body ?? {};

async function api(metodo, partes, req) {
  const [recurso, id, acao] = partes;
  const b = metodo === 'POST' ? await corpo(req) : {};
  if (metodo === 'GET' && recurso === 'estado') return estado();
  if (metodo === 'GET' && recurso === 'log') {
    const f = path.join(D.DADOS, 'logs', path.basename(id) + '.log');
    return {texto: fs.existsSync(f) ? fs.readFileSync(f, 'utf8').slice(-20000) : ''};
  }
  if (metodo === 'GET' && recurso === 'analytics') return analytics();
  if (metodo === 'GET' && recurso === 'comentarios') return comentarios();
  if (metodo === 'GET' && recurso === 'links') return LINKS.config();
  if (metodo === 'GET' && recurso === 'tendencias') return tendencias();
  if (metodo === 'GET' && recurso === 'direct') return {config: DIRECT.config(), resumo: DIRECT.resumo(), rodando: !!roboDirect};
  if (metodo !== 'POST') throw new Error('rota desconhecida');

  if (recurso === 'sincronizar') return sincronizar({forcar: true});
  if (recurso === 'tendencias') return cacar({dias: Number(b.dias) || 7});
  if (recurso === 'comentarios') {
    const c = comentarios().find((x) => x.id === id);
    if (!c) throw new Error('comentário não encontrado');
    if (b.ignorar) return salvarComentario(id, {status: 'ignorado'});
    if (b.rascunho != null) return salvarComentario(id, {rascunho: String(b.rascunho).slice(0, 2000)});
    if (b.responder) {
      // o dono clicou em Enviar: é a aprovação dele
      await responderComentario(c.perfil, c.id, String(b.responder).slice(0, 2000));
      return salvarComentario(id, {status: 'respondido', resposta: b.responder, respondido_em: new Date().toISOString()});
    }
  }
  if (recurso === 'direct') {
    // ligar/desligar e editar é o dono no painel; "testar" é a rodada seca (lê, não manda nada)
    if (id === 'testar') return DIRECT.rodar({perfil: b.perfil || null, seco: true});
    if (id === 'rodar') return DIRECT.rodar({perfil: b.perfil || null});
    DIRECT.salvarConfig(b);
    agendarDirect();
    return {config: DIRECT.config(), resumo: DIRECT.resumo(), rodando: !!roboDirect};
  }
  if (recurso === 'links') {
    if (Object.keys(b).length) LINKS.salvarConfig(b);
    return {...LINKS.config(), gerado: LINKS.gerar()};
  }

  if (recurso === 'perfis') return D.salvarPerfil(id, b);
  if (recurso === 'pautas') {
    if (b.tema) D.adicionarPauta(id, b.tema.trim());
    if (b.remover != null) {
      const d = D.pautas(id);
      d.pautas.splice(b.remover, 1);
      D.salvarPautas(id, d);
    }
    return D.pautas(id);
  }
  if (recurso === 'fila') {
    const it = D.item(id);
    if (!it) throw new Error('vídeo não está na fila');
    if (acao === 'legenda') return D.salvarItem({id, legenda: b.legenda});
    if (acao === 'entrega') return D.salvarItem({id, entrega: String(b.entrega ?? '').slice(0, 900)});
    if (acao === 'rejeitar') {
      ponte.espelhar(id, 'rejeitado');
      return D.salvarItem({id, status: 'rejeitado'});
    }
    if (acao === 'aprovar') {
      const p = D.perfil(it.perfil);
      const quando = b.quando === 'agora' ? null : b.quando || proximoHorario(p.horario);
      D.salvarItem({id, status: 'aprovado', agendado_para: quando, legenda: b.legenda ?? it.legenda, tentativas: 0});
      ponte.espelhar(id, 'aprovado');
      if (!quando) publicar(D.item(id)); // não espera: o painel acompanha pelo status
      return D.item(id);
    }
  }
  if (recurso === 'config') {
    const ok = Object.fromEntries(Object.entries(b).filter(([k, v]) => CONFIG_VISIVEL.includes(k) && !String(v).includes('••••')));
    D.salvarEnv(ok);
    // interruptor geral dos agentes do escritório (plataforma/escritorio/tools/agencia.json)
    if (b.AGENTES_LIGADOS != null) {
      const f = path.join(D.PLAT, 'escritorio/tools/agencia.json');
      const cfg = JSON.parse(fs.readFileSync(f, 'utf8'));
      cfg.enabled = b.AGENTES_LIGADOS === '1';
      fs.writeFileSync(f, JSON.stringify(cfg, null, 2));
    }
    return estado().config;
  }
  if (recurso === 'meta' && id === 'descobrir') {
    const contas = await descobrirContas();
    const ligados = [];
    for (const p of D.perfis()) {
      const alvo = (p.instagram || '').toLowerCase();
      const c = contas.find((x) => x.ig_usuario?.toLowerCase() === alvo);
      if (!c) continue;
      D.salvarEnv({[chaveEnv(p.id, 'IG_ID')]: c.ig_id, [chaveEnv(p.id, 'PAGE_ID')]: c.page_id, [chaveEnv(p.id, 'PAGE_TOKEN')]: c.page_token});
      ligados.push(p.id);
    }
    return {ligados, contas: contas.map(({page_token, ...r}) => r)};
  }
  if (recurso === 'agencia' && id === 'rodar') {
    if (agencia) throw new Error('a agência já está rodando');
    const argv = ['plataforma/agencia.mjs'];
    if (b.perfil) argv.push('--perfil', b.perfil);
    if (b.tema) argv.push('--tema', b.tema);
    agencia = spawn(process.execPath, argv, {cwd: D.RAIZ, stdio: 'ignore'});
    agencia.on('close', () => (agencia = null));
    return {ok: true};
  }
  throw new Error('rota desconhecida');
}

for (const [k, v] of Object.entries(D.env())) if (k.startsWith('OFFICE_')) process.env[k] = v;
const app = express();
app.disable('x-powered-by');
app.use(express.json({limit: '2mb'}));
// O painel só escuta em 127.0.0.1: quem abre é o dono, no próprio Mac.
app.use((req, res, next) => {
  req.user = {email: 'dono@localhost', name: 'Fernando'};
  next();
});

// Escritório da agência (pixel art, quadro, caixa de aprovação), portado da skill agencia-marketing-completa.
const require = createRequire(import.meta.url);
const office = require('./escritorio/lib/office');
const ESC = path.join(D.PLAT, 'escritorio', 'public');
app.get('/admin', (req, res) => res.redirect('/'));
app.use(express.static(ESC, {index: false}));
office.mount(app, {
  send: (res, html, cod = 200) => res.status(cod).type('html').send(html),
  pages: {notFound: () => '<!doctype html><meta charset="utf-8"><p>Não encontrado. <a href="/">Voltar ao painel</a></p>'},
  pageCtx: (req) => ({req}),
});
const ponte = require('./escritorio/ponte.cjs');
ponte.ligar();

// YouTube: login do Google por perfil (cada perfil escolhe o próprio canal na tela do Google)
app.get('/youtube/conectar', (req, res) => {
  try {
    res.redirect(YT.urlLogin(String(req.query.perfil)));
  } catch (e) {
    res.status(400).type('html').send(`<meta charset="utf-8"><p>${e.message} <a href="/#config">Configurações</a></p>`);
  }
});
app.get('/youtube/callback', async (req, res) => {
  try {
    if (req.query.error) throw new Error(String(req.query.error));
    const r = await YT.concluirLogin(String(req.query.state), String(req.query.code));
    res.redirect(`/?yt=${encodeURIComponent(r.canal)}#redes`);
  } catch (e) {
    res.status(400).type('html').send(`<meta charset="utf-8"><p>Não conectou: ${e.message} <a href="/#redes">Voltar</a></p>`);
  }
});

app.all(/^\/api\/.*/, async (req, res) => {
  const partes = req.path.split('/').filter(Boolean).map(decodeURIComponent).slice(1);
  try {
    enviar(res, 200, await api(req.method, partes, req));
  } catch (e) {
    enviar(res, 400, {erro: e.message});
  }
});
app.get('/out/:f', (req, res) => arquivo(res, path.join(D.RAIZ, 'out', path.basename(req.params.f)), req));
app.get('/perfis/:f', (req, res) => arquivo(res, path.join(D.RAIZ, 'perfis/imagens', path.basename(req.params.f)), req));
app.use('/links', express.static(path.join(D.RAIZ, 'site')));
app.get(['/', '/index.html'], (req, res) => arquivo(res, path.join(D.PLAT, 'painel', 'index.html'), req));

// Robô comentário → direct: roda a cada intervalo_min enquanto o interruptor geral estiver ligado (painel → Comentários)
let roboDirect = null, rodadaDirect = false;
function agendarDirect() {
  clearInterval(roboDirect);
  roboDirect = null;
  const cfg = DIRECT.config();
  if (!cfg.ligado) return;
  roboDirect = setInterval(async () => {
    if (rodadaDirect) return;
    rodadaDirect = true;
    try { await DIRECT.rodar(); } catch (e) { D.log('direct', `rodada falhou: ${e.message}`); } finally { rodadaDirect = false; }
  }, (cfg.intervalo_min || 2) * 60000);
}
agendarDirect();

app.listen(PORTA, '127.0.0.1', () => console.log(`Painel: http://localhost:${PORTA} · Escritório: http://localhost:${PORTA}/admin/escritorio`));
