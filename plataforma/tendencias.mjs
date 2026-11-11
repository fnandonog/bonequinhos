// CAÇADOR DE TENDÊNCIAS: o que está viralizando agora em cada nicho, com números, para o pauteiro e o roteirista.
// - YouTube (com YOUTUBE_API_KEY): Shorts em português publicados nos últimos N dias para as buscas do perfil (perfis.json → busca),
//   ordenados por views por dia (velocidade), com título, canal e duração.
// - Google Trends: o que o Brasil está buscando hoje (RSS público), para pegar assunto quente que encaixa em algum perfil.
// Saída: plataforma/dados/tendencias.json. Uso: node plataforma/tendencias.mjs [--dias 7] [--perfil construiu]
import fs from 'node:fs';
import path from 'node:path';
import {DADOS, perfis, env, log} from './lib/dados.mjs';

const F = path.join(DADOS, 'tendencias.json');
export const tendencias = () => (fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : {atualizado: null, perfis: {}, google_trends: []});

const segundos = (iso) => {
  const m = String(iso).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) || [];
  return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
};

async function yt(caminho, params) {
  const u = new URL(`https://www.googleapis.com/youtube/v3/${caminho}`);
  u.search = new URLSearchParams({...params, key: env().YOUTUBE_API_KEY});
  const j = await (await fetch(u)).json();
  if (j.error) throw new Error(`YouTube: ${j.error.message}`);
  return j;
}

// Shorts que mais cresceram (views/dia) para as buscas de um perfil. Custo: 100 unidades por busca + 1 por lote de vídeos (cota grátis: 10.000/dia).
async function shortsDoNicho(p, dias) {
  const desde = new Date(Date.now() - dias * 86400000).toISOString();
  const ids = new Set();
  for (const q of p.busca ?? []) {
    const r = await yt('search', {part: 'id', q: `${q} #shorts`, type: 'video', videoDuration: 'short', order: 'viewCount',
      publishedAfter: desde, regionCode: 'BR', relevanceLanguage: 'pt', maxResults: '25'});
    for (const it of r.items ?? []) ids.add(it.id.videoId);
  }
  if (!ids.size) return [];
  const v = await yt('videos', {part: 'snippet,statistics,contentDetails', id: [...ids].slice(0, 50).join(',')});
  return (v.items ?? [])
    .map((x) => {
      const idadeDias = Math.max(0.25, (Date.now() - new Date(x.snippet.publishedAt)) / 86400000);
      const views = Number(x.statistics.viewCount ?? 0);
      return {
        titulo: x.snippet.title, canal: x.snippet.channelTitle, link: `https://youtube.com/shorts/${x.id}`,
        publicado: x.snippet.publishedAt, duracao_s: segundos(x.contentDetails.duration), views,
        likes: Number(x.statistics.likeCount ?? 0), comentarios: Number(x.statistics.commentCount ?? 0),
        views_por_dia: Math.round(views / idadeDias),
        // só Shorts em português (a busca do YouTube mistura outros idiomas)
        pt: /^pt/i.test(x.snippet.defaultAudioLanguage || x.snippet.defaultLanguage || '') ||
          /[ãõç]|\b(você|voce|não|como|quanto|receita|casa|dinheiro|história|caso|vale)\b/i.test(x.snippet.title),
      };
    })
    .filter((x) => x.duracao_s <= 180 && x.pt)
    .sort((a, b) => b.views_por_dia - a.views_por_dia)
    .slice(0, 15);
}

async function googleTrends() {
  const xml = await (await fetch('https://trends.google.com/trending/rss?geo=BR')).text();
  return [...xml.matchAll(/<item>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/g)]
    .map((m) => ({termo: m[1].trim(), buscas: m[2].trim()}))
    .slice(0, 25);
}

export async function cacar({dias = 7, so = null} = {}) {
  const ant = tendencias();
  const out = {atualizado: new Date().toISOString(), dias, perfis: {...ant.perfis}, google_trends: ant.google_trends, erros: []};
  if (env().YOUTUBE_API_KEY) {
    for (const p of perfis().filter((p) => !so || p.id === so)) {
      try {
        out.perfis[p.id] = await shortsDoNicho(p, dias);
      } catch (e) {
        out.erros.push(`${p.nome}: ${e.message}`);
      }
    }
  } else out.erros.push('Sem YOUTUBE_API_KEY: os Shorts do nicho ficam de fora (Configurações → Chave da API do YouTube).');
  try {
    out.google_trends = await googleTrends();
  } catch (e) {
    out.erros.push(`Google Trends: ${e.message}`);
  }
  fs.writeFileSync(F, JSON.stringify(out, null, 2));
  log('tendencias', `ok · ${Object.values(out.perfis).flat().length} shorts · ${out.google_trends.length} buscas em alta${out.erros.length ? ` · ${out.erros.join(' | ')}` : ''}`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2);
  const arg = (k) => (a.includes(k) ? a[a.indexOf(k) + 1] : undefined);
  await cacar({dias: Number(arg('--dias') ?? 7), so: arg('--perfil') ?? null});
}
