// Login do painel quando ele é aberto pela internet (painel.zeexplica.com.br, via túnel até o Mac).
// No próprio Mac (localhost) não pede login. Pela internet: senha + código de 6 dígitos do app autenticador (TOTP).
// .env: PAINEL_SENHA_HASH (scrypt) e PAINEL_TOTP (segredo base32). Os dois são criados na página /seguranca, que só abre no Mac.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {DADOS, env, salvarEnv} from './dados.mjs';

const F_SESSOES = path.join(DADOS, 'sessoes.json');
const DIAS = 30;
const lerSessoes = () => (fs.existsSync(F_SESSOES) ? JSON.parse(fs.readFileSync(F_SESSOES, 'utf8')) : {});
const gravarSessoes = (s) => fs.writeFileSync(F_SESSOES, JSON.stringify(s), {mode: 0o600});

// Pedido que veio pela internet: o Caddy da VPS manda X-Forwarded-For; no Mac, o host é localhost.
export function remoto(req) {
  const host = String(req.headers.host || '').split(':')[0];
  return !!req.headers['x-forwarded-for'] || !['localhost', '127.0.0.1', '[::1]'].includes(host);
}

// ---------- senha ----------
export function definirSenha(senha) {
  if (String(senha).length < 10) throw new Error('A senha precisa ter pelo menos 10 caracteres.');
  const sal = crypto.randomBytes(16);
  const h = crypto.scryptSync(String(senha), sal, 64);
  salvarEnv({PAINEL_SENHA_HASH: `${sal.toString('hex')}:${h.toString('hex')}`});
}
function senhaOk(senha) {
  const [sal, h] = String(env().PAINEL_SENHA_HASH || '').split(':');
  if (!sal || !h) return false;
  const got = crypto.scryptSync(String(senha), Buffer.from(sal, 'hex'), 64);
  return crypto.timingSafeEqual(got, Buffer.from(h, 'hex'));
}

// ---------- TOTP (RFC 6238, 30 s, 6 dígitos) ----------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const base32 = (buf) => {
  let bits = '', out = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
};
const deBase32 = (s) => {
  let bits = '';
  for (const c of s.replace(/=+$/, '').toUpperCase()) bits += B32.indexOf(c).toString(2).padStart(5, '0');
  const out = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
};
function codigo(segredo, passo) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(passo));
  const h = crypto.createHmac('sha1', deBase32(segredo)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}
export function novoTotp() {
  const s = base32(crypto.randomBytes(20));
  salvarEnv({PAINEL_TOTP_NOVO: s});
  return {segredo: s, uri: `otpauth://totp/Ag%C3%AAncia%20do%20Z%C3%A9:fernando?secret=${s}&issuer=Agencia%20do%20Ze`};
}
// Confirma o primeiro código antes de trocar o segredo de vez (evita se trancar fora)
export function confirmarTotp(cod) {
  const s = env().PAINEL_TOTP_NOVO;
  if (!s || !totpOk(cod, s)) throw new Error('Código errado. Confira a hora do celular e tente o código novo.');
  salvarEnv({PAINEL_TOTP: s, PAINEL_TOTP_NOVO: null});
}
function totpOk(cod, s = env().PAINEL_TOTP) {
  if (!s || !/^\d{6}$/.test(String(cod))) return false;
  const t = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some((d) => codigo(s, t + d) === String(cod));
}

export const configurado = () => !!(env().PAINEL_SENHA_HASH && env().PAINEL_TOTP);

// ---------- sessões ----------
const tentativas = new Map(); // ip → [horários]
export function entrar(ip, senha, cod) {
  const agora = Date.now();
  const t = (tentativas.get(ip) || []).filter((x) => agora - x < 15 * 60000);
  if (t.length >= 5) throw new Error('Muitas tentativas. Espere 15 minutos.');
  tentativas.set(ip, [...t, agora]);
  if (!configurado()) throw new Error('O acesso pela internet ainda não foi configurado (abra /seguranca no Mac).');
  if (!senhaOk(senha) || !totpOk(cod)) throw new Error('Senha ou código errado.');
  tentativas.delete(ip);
  const id = crypto.randomBytes(32).toString('hex');
  const s = lerSessoes();
  for (const [k, v] of Object.entries(s)) if (v.ate < agora) delete s[k];
  s[crypto.createHash('sha256').update(id).digest('hex')] = {ip, criada: agora, ate: agora + DIAS * 86400000};
  gravarSessoes(s);
  return id;
}
const cookie = (req) => (String(req.headers.cookie || '').match(/(?:^|;\s*)zs=([a-f0-9]{64})/) || [])[1];
export function logado(req) {
  const id = cookie(req);
  if (!id) return false;
  const s = lerSessoes()[crypto.createHash('sha256').update(id).digest('hex')];
  return !!s && s.ate > Date.now();
}
export function sair(req) {
  const id = cookie(req);
  if (!id) return;
  const s = lerSessoes();
  delete s[crypto.createHash('sha256').update(id).digest('hex')];
  gravarSessoes(s);
}
export const cookieSessao = (id) => `zs=${id}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DIAS * 86400}`;
