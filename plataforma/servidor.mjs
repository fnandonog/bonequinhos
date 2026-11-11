// PAINEL: http://localhost:4321 (só no próprio Mac).
// Uso: node plataforma/servidor.mjs   (ou npm run painel)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import * as D from './lib/dados.mjs';
import {descobrirContas, credenciais, chaveEnv} from './lib/meta.mjs';
import {proximoHorario} from './lib/agenda.mjs';
import {publicar} from './postar.mjs';

const PORTA = Number(process.env.PORTA ?? 4321);
const CONFIG_VISIVEL = ['CLAUDE_CODE_OAUTH_TOKEN', 'META_USER_TOKEN', 'META_GRAPH_VERSION', 'ELEVENLABS_API_KEY', 'AUTO_PUBLICAR', 'PRODUCAO_AUTOMATICA', 'ELEVENLABS_VOZ', 'META_POSTAR_FACEBOOK',
  'AGENCIA_MAX_POR_PERFIL', 'AGENCIA_MODELO', 'NARRACAO_VELOCIDADE'];
const SEGREDOS = ['CLAUDE_CODE_OAUTH_TOKEN', 'META_USER_TOKEN', 'ELEVENLABS_API_KEY'];
const TIPOS = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.png': 'image/png'};

let agencia = null; // processo da agência disparado pelo painel

function estado() {
  const e = D.env();
  const config = Object.fromEntries(CONFIG_VISIVEL.map((k) => [k, SEGREDOS.includes(k) ? D.mascarar(e[k]) : e[k] ?? '']));
  const perfis = D.perfis().map((p) => {
    const c = credenciais(p.id);
    const pt = D.pautas(p.id).pautas;
    return {...p, conectado: {instagram: !!(c.ig && c.token), facebook: !!(c.page && c.pageToken)},
      pautas_novas: pt.filter((x) => x.status === 'nova').length, pautas: pt};
  });
  return {perfis, fila: D.fila(), config, agencia_rodando: !!agencia};
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

const corpo = (req) =>
  new Promise((ok) => {
    let s = '';
    req.on('data', (d) => (s += d));
    req.on('end', () => ok(s ? JSON.parse(s) : {}));
  });

async function api(metodo, partes, req) {
  const [recurso, id, acao] = partes;
  const b = metodo === 'POST' ? await corpo(req) : {};
  if (metodo === 'GET' && recurso === 'estado') return estado();
  if (metodo === 'GET' && recurso === 'log') {
    const f = path.join(D.DADOS, 'logs', path.basename(id) + '.log');
    return {texto: fs.existsSync(f) ? fs.readFileSync(f, 'utf8').slice(-20000) : ''};
  }
  if (metodo !== 'POST') throw new Error('rota desconhecida');

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
    if (acao === 'rejeitar') return D.salvarItem({id, status: 'rejeitado'});
    if (acao === 'aprovar') {
      const p = D.perfil(it.perfil);
      const quando = b.quando === 'agora' ? null : b.quando || proximoHorario(p.horario);
      D.salvarItem({id, status: 'aprovado', agendado_para: quando, legenda: b.legenda ?? it.legenda, tentativas: 0});
      if (!quando) publicar(D.item(id)); // não espera: o painel acompanha pelo status
      return D.item(id);
    }
  }
  if (recurso === 'config') {
    const ok = Object.fromEntries(Object.entries(b).filter(([k, v]) => CONFIG_VISIVEL.includes(k) && !String(v).includes('••••')));
    D.salvarEnv(ok);
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

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const partes = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    try {
      if (partes[0] === 'api') return enviar(res, 200, await api(req.method, partes.slice(1), req));
      if (partes[0] === 'out') return arquivo(res, path.join(D.RAIZ, 'out', path.basename(partes[1] ?? '')), req);
      if (partes[0] === 'perfis') return arquivo(res, path.join(D.RAIZ, 'perfis/imagens', path.basename(partes[1] ?? '')), req);
      return arquivo(res, path.join(D.PLAT, 'painel', path.basename(partes[0] ?? 'index.html')), req);
    } catch (e) {
      enviar(res, 400, {erro: e.message});
    }
  })
  .listen(PORTA, '127.0.0.1', () => console.log(`Painel: http://localhost:${PORTA}`));
