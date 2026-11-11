// YouTube: login do Google (OAuth) por canal e envio dos Shorts.
// .env: YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET (cliente OAuth "Aplicativo da Web" no Google Cloud, com o redirecionamento
//       http://localhost:4380/youtube/callback) e, por perfil, YT_<PERFIL>_REFRESH (gravado pelo painel ao conectar) e YT_<PERFIL>_CANAL.
// Projeto do Google sem auditoria: a própria API deixa os vídeos privados até a auditoria sair.
import fs from 'node:fs';
import {env, salvarEnv} from './dados.mjs';

// Tudo de uma vez (pedido do Fernando, para não reautorizar depois): gerenciar canal, enviar, comentários e analytics
const ESCOPOS = ['youtube', 'youtube.upload', 'youtube.force-ssl', 'youtube.readonly', 'yt-analytics.readonly', 'yt-analytics-monetary.readonly']
  .map((e) => `https://www.googleapis.com/auth/${e}`).join(' ');
const chave = (perfil, k) => `YT_${perfil.toUpperCase()}_${k}`;
export const redirecionamento = () => `http://localhost:${env().PORTA || 4380}/youtube/callback`;
export const conectado = (perfil) => !!env()[chave(perfil, 'REFRESH')];
export const canal = (perfil) => env()[chave(perfil, 'CANAL')] || null;

export function urlLogin(perfil) {
  const e = env();
  if (!e.YOUTUBE_CLIENT_ID) throw new Error('Falta o YOUTUBE_CLIENT_ID (Configurações → YouTube).');
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.search = new URLSearchParams({
    client_id: e.YOUTUBE_CLIENT_ID, redirect_uri: redirecionamento(), response_type: 'code', scope: ESCOPOS,
    access_type: 'offline', prompt: 'consent select_account', state: perfil,
  });
  return u.toString();
}

async function token(params) {
  const e = env();
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({client_id: e.YOUTUBE_CLIENT_ID, client_secret: e.YOUTUBE_CLIENT_SECRET, ...params}),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Google: ${j.error_description || j.error}`);
  return j;
}

// Volta do login: guarda o refresh token e o canal escolhido
export async function concluirLogin(perfil, code) {
  const t = await token({code, grant_type: 'authorization_code', redirect_uri: redirecionamento()});
  if (!t.refresh_token) throw new Error('O Google não devolveu o refresh token. Remova o acesso do app na conta Google e conecte de novo.');
  const c = await (await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {headers: {Authorization: `Bearer ${t.access_token}`}})).json();
  const ch = c.items?.[0];
  salvarEnv({[chave(perfil, 'REFRESH')]: t.refresh_token, [chave(perfil, 'CANAL')]: ch ? `${ch.id}|${ch.snippet.customUrl ?? ch.snippet.title}` : ''});
  return {canal: ch?.snippet?.title ?? '(sem canal)', handle: ch?.snippet?.customUrl};
}

async function acesso(perfil) {
  const r = env()[chave(perfil, 'REFRESH')];
  if (!r) throw new Error(`YouTube de "${perfil}" não está conectado.`);
  return (await token({refresh_token: r, grant_type: 'refresh_token'})).access_token;
}

// Envio resumable: cria a sessão com os metadados e manda o arquivo inteiro
export async function enviarShort(perfil, arquivo, {titulo, descricao, tags = []}) {
  const at = await acesso(perfil);
  const bytes = fs.readFileSync(arquivo);
  const meta = {
    snippet: {title: titulo.slice(0, 100), description: descricao.slice(0, 4900), tags: tags.slice(0, 15), categoryId: '27', defaultLanguage: 'pt-BR', defaultAudioLanguage: 'pt-BR'},
    status: {privacyStatus: env().YOUTUBE_PRIVACIDADE || 'public', selfDeclaredMadeForKids: false},
  };
  const ini = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {Authorization: `Bearer ${at}`, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Length': String(bytes.length), 'X-Upload-Content-Type': 'video/mp4'},
    body: JSON.stringify(meta),
  });
  if (!ini.ok) throw new Error(`YouTube: ${(await ini.json().catch(() => ({}))).error?.message ?? ini.status}`);
  const up = await fetch(ini.headers.get('location'), {method: 'PUT', headers: {'Content-Type': 'video/mp4', 'Content-Length': String(bytes.length)}, body: bytes});
  const j = await up.json().catch(() => ({}));
  if (!up.ok) throw new Error(`YouTube: ${j.error?.message ?? up.status}`);
  return {id: j.id, link: `https://youtube.com/shorts/${j.id}`, privacidade: j.status?.privacyStatus};
}
