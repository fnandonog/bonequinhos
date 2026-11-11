// YouTube (só estatísticas públicas, com chave de API) e Telegram (membros do grupo de ofertas, com o token do bot).
import {env} from './dados.mjs';

export async function canalYouTube(handle) {
  const k = env().YOUTUBE_API_KEY;
  if (!k || !handle) return null;
  const u = new URL('https://www.googleapis.com/youtube/v3/channels');
  u.search = new URLSearchParams({part: 'snippet,statistics', forHandle: '@' + handle.replace(/^@/, ''), key: k});
  const j = await (await fetch(u)).json();
  if (j.error) throw new Error(`YouTube: ${j.error.message}`);
  const c = j.items?.[0];
  if (!c) return {erro: 'canal não encontrado'};
  return {
    id: c.id, titulo: c.snippet.title,
    inscritos: Number(c.statistics.subscriberCount ?? 0), views: Number(c.statistics.viewCount ?? 0), videos: Number(c.statistics.videoCount ?? 0),
  };
}

export async function membrosTelegram() {
  const {TELEGRAM_BOT_TOKEN: t, TELEGRAM_GRUPO_ID: g} = env();
  if (!t || !g) return null;
  const j = await (await fetch(`https://api.telegram.org/bot${t}/getChatMemberCount?chat_id=${encodeURIComponent(g)}`)).json();
  if (!j.ok) throw new Error(`Telegram: ${j.description}`);
  return j.result;
}
