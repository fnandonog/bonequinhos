// Leitura e escrita dos dados da plataforma.
// perfis.json e pautas/ vão para o GitHub; dados/ (fila, logs) e .env ficam só no Mac.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const PLAT = path.join(RAIZ, 'plataforma');
export const DADOS = path.join(PLAT, 'dados');
const ENV = path.join(RAIZ, '.env');
fs.mkdirSync(path.join(DADOS, 'logs'), {recursive: true});

const ler = (f, padrao) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : padrao);
const gravar = (f, d) => {
  fs.writeFileSync(f + '.tmp', JSON.stringify(d, null, 2));
  fs.renameSync(f + '.tmp', f);
};

export const perfis = () => ler(path.join(PLAT, 'perfis.json'), {perfis: []}).perfis;
export const perfil = (id) => perfis().find((p) => p.id === id);
export function salvarPerfil(id, mudancas) {
  const f = path.join(PLAT, 'perfis.json');
  const d = ler(f, {perfis: []});
  const p = d.perfis.find((x) => x.id === id);
  if (!p) throw new Error('perfil não existe: ' + id);
  for (const k of ['ativo', 'horario', 'cta', 'link_bio', 'instagram', 'youtube']) if (k in mudancas) p[k] = mudancas[k];
  gravar(f, d);
  return p;
}

const fPauta = (id) => path.join(PLAT, 'pautas', `${id}.json`);
export const pautas = (id) => ler(fPauta(id), {perfil: id, pautas: []});
export const salvarPautas = (id, d) => gravar(fPauta(id), d);
export function adicionarPauta(id, tema) {
  const d = pautas(id);
  d.pautas.push({tema, status: 'nova'});
  salvarPautas(id, d);
}

// Fila de vídeos. Status: produzindo → aguardando_aprovacao → aprovado → publicado (ou erro / rejeitado)
const fFila = path.join(DADOS, 'fila.json');
export const fila = () => ler(fFila, []);
export function salvarItem(item) {
  const f = fila();
  const i = f.findIndex((x) => x.id === item.id);
  item.atualizado = new Date().toISOString();
  if (i >= 0) f[i] = {...f[i], ...item};
  else f.unshift(item);
  gravar(fFila, f);
  return f[i >= 0 ? i : 0];
}
export const item = (id) => fila().find((x) => x.id === id);

export function log(nome, ...msg) {
  const linha = `[${new Date().toLocaleString('pt-BR')}] ${msg.join(' ')}\n`;
  fs.appendFileSync(path.join(DADOS, 'logs', `${nome}.log`), linha);
  process.stdout.write(linha);
}

// .env: lido a cada chamada para pegar o que foi salvo pelo painel sem reiniciar.
export function env() {
  const r = {};
  if (!fs.existsSync(ENV)) return r;
  for (const l of fs.readFileSync(ENV, 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) r[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return r;
}
export function salvarEnv(mudancas) {
  const linhas = fs.existsSync(ENV) ? fs.readFileSync(ENV, 'utf8').split('\n').filter((l) => l.trim()) : [];
  for (const [k, v] of Object.entries(mudancas)) {
    if (!/^[A-Z0-9_]+$/.test(k)) continue;
    const i = linhas.findIndex((l) => l.startsWith(k + '='));
    const nova = `${k}=${String(v).replace(/[\r\n]/g, '')}`;
    if (v === null || v === '') {
      if (i >= 0) linhas.splice(i, 1);
    } else if (i >= 0) linhas[i] = nova;
    else linhas.push(nova);
  }
  fs.writeFileSync(ENV, linhas.join('\n') + '\n', {mode: 0o600});
}
// Para mostrar no painel sem revelar o segredo.
export const mascarar = (v) => (!v ? '' : v.length <= 8 ? '••••' : v.slice(0, 4) + '••••' + v.slice(-4));
