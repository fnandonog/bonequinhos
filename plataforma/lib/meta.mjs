// Publicação na Meta (Instagram Reels e Reels da Página do Facebook) pelo app "fnexus CRM".
// Usa upload resumable direto do arquivo: não precisa hospedar o vídeo em lugar nenhum.
//
// .env (preenchido pelo painel):
//   META_USER_TOKEN                token de usuário de longa duração do app (instagram_content_publish,
//                                  instagram_basic, pages_show_list, pages_read_engagement, pages_manage_posts)
//   META_<PERFIL>_PAGE_ID          Página do Facebook ligada ao Instagram do perfil
//   META_<PERFIL>_PAGE_TOKEN       token da Página (descoberto automaticamente)
//   META_<PERFIL>_IG_ID            id da conta profissional do Instagram
import fs from 'node:fs';
import {env} from './dados.mjs';

const V = () => env().META_GRAPH_VERSION || 'v22.0';
const G = (p) => `https://graph.facebook.com/${V()}${p}`;
const chave = (perfil, k) => `META_${perfil.toUpperCase()}_${k}`;

async function graph(metodo, caminho, params = {}) {
  const url = new URL(G(caminho));
  const corpo = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) (metodo === 'GET' ? url.searchParams : corpo).set(k, v);
  const r = await fetch(url, metodo === 'GET' ? {} : {method: metodo, body: corpo});
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`Meta ${caminho}: ${j.error?.message ?? r.status}`);
  return j;
}

async function enviarArquivo(url, token, arquivo) {
  const bytes = fs.readFileSync(arquivo);
  const r = await fetch(url, {
    method: 'POST',
    headers: {Authorization: `OAuth ${token}`, offset: '0', file_size: String(bytes.length)},
    body: bytes,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error || j.success === false) throw new Error(`upload: ${j.error?.message ?? j.debug_info?.message ?? r.status}`);
  return j;
}

// Lista as Páginas do token de usuário e as contas de Instagram ligadas.
export async function descobrirContas() {
  const token = env().META_USER_TOKEN;
  if (!token) throw new Error('Falta o META_USER_TOKEN (cole nas Configurações).');
  const j = await graph('GET', '/me/accounts', {
    fields: 'id,name,access_token,instagram_business_account{id,username}',
    limit: '100',
    access_token: token,
  });
  return j.data.map((p) => ({
    page_id: p.id,
    page_nome: p.name,
    page_token: p.access_token,
    ig_id: p.instagram_business_account?.id,
    ig_usuario: p.instagram_business_account?.username,
  }));
}

export function credenciais(perfil) {
  const e = env();
  return {
    ig: e[chave(perfil, 'IG_ID')],
    page: e[chave(perfil, 'PAGE_ID')],
    pageToken: e[chave(perfil, 'PAGE_TOKEN')],
    token: e[chave(perfil, 'PAGE_TOKEN')] || e.META_USER_TOKEN,
  };
}
export const chaveEnv = chave;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

export async function publicarInstagram(perfil, arquivo, legenda, capaMs) {
  const c = credenciais(perfil);
  if (!c.ig || !c.token) throw new Error(`Instagram de "${perfil}" não está conectado.`);
  const params = {media_type: 'REELS', upload_type: 'resumable', caption: legenda, share_to_feed: 'true', access_token: c.token};
  if (capaMs != null) params.thumb_offset = String(capaMs);
  const cont = await graph('POST', `/${c.ig}/media`, params);
  await enviarArquivo(cont.uri ?? `https://rupload.facebook.com/ig-api-upload/${V()}/${cont.id}`, c.token, arquivo);
  for (let i = 0; i < 60; i++) {
    const s = await graph('GET', `/${cont.id}`, {fields: 'status_code,status', access_token: c.token});
    if (s.status_code === 'FINISHED') break;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`Instagram recusou o vídeo: ${s.status}`);
    await esperar(10000);
  }
  const pub = await graph('POST', `/${c.ig}/media_publish`, {creation_id: cont.id, access_token: c.token});
  const info = await graph('GET', `/${pub.id}`, {fields: 'permalink', access_token: c.token}).catch(() => ({}));
  return {id: pub.id, link: info.permalink};
}

export async function publicarFacebook(perfil, arquivo, legenda) {
  const c = credenciais(perfil);
  if (!c.page || !c.pageToken) throw new Error(`Página do Facebook de "${perfil}" não está conectada.`);
  const ini = await graph('POST', `/${c.page}/video_reels`, {upload_phase: 'start', access_token: c.pageToken});
  await enviarArquivo(ini.upload_url, c.pageToken, arquivo);
  await graph('POST', `/${c.page}/video_reels`, {
    upload_phase: 'finish',
    video_id: ini.video_id,
    video_state: 'PUBLISHED',
    description: legenda,
    access_token: c.pageToken,
  });
  return {id: ini.video_id, link: `https://www.facebook.com/reel/${ini.video_id}`};
}
