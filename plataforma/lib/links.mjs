// Página de links da rede (link na bio): uma página geral (site/index.html) e uma por perfil (site/<perfil>/index.html).
// HTML estático, sem dependências: dá para publicar no GitHub Pages, Cloudflare Pages ou Netlify.
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ, PLAT, perfis, fila, env} from './dados.mjs';

const AVATAR = {cozinha: 'receitas', historia: 'historia', construiu: 'construiu', caso: 'crimes', rico: 'ricos', valeapena: 'valeapena'};
const SITE = path.join(RAIZ, 'site');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
// UTM para saber de qual perfil veio o clique (aparece no analytics do site de destino e no link do Telegram com convite próprio)
const utm = (url, perfil) => {
  try {
    const u = new URL(url);
    if (!/t\.me|instagram\.com|youtube\.com|tiktok\.com/.test(u.host)) u.searchParams.set('utm_source', 'linkbio'), u.searchParams.set('utm_campaign', perfil || 'rede');
    return u.toString();
  } catch {
    return url;
  }
};

export const config = () => JSON.parse(fs.readFileSync(path.join(PLAT, 'links.json'), 'utf8'));
export function salvarConfig(c) {
  const atual = config();
  for (const k of ['titulo', 'descricao', 'grupo', 'extras']) if (k in c) atual[k] = c[k];
  fs.writeFileSync(path.join(PLAT, 'links.json'), JSON.stringify(atual, null, 2) + '\n');
  return atual;
}

// Aviso de visita e de clique para o painel (plataforma/lib/cliques.mjs). Só conta; o link abre igual sem o painel.
const beacon = () => {
  const url = `${(env().PAINEL_URL || 'https://painel.zeexplica.com.br').replace(/\/$/, '')}/c`;
  return `<script>(function(){var u=${JSON.stringify(url)},p=location.pathname;function m(k){try{navigator.sendBeacon(u,JSON.stringify({p:p,k:k}))}catch(e){}}
m('ver');document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-k]');if(a)m(a.getAttribute('data-k'))})})();</script>`;
};
const botao = (b, base) => `<a class="bt${b.pri ? ' pri' : ''}" href="${esc(b.url)}"${/^https?:/.test(b.url) ? ' target="_blank" rel="noopener"' : ''}${b.k ? ` data-k="${esc(b.k)}"` : ''}>${b.img ? `<img src="${base}img/${b.img}.png" alt="">` : `<b>${b.icone ?? '🔗'}</b>`}<span>${esc(b.rotulo)}${b.sub ? `<small>${esc(b.sub)}</small>` : ''}</span>›</a>`;

function pagina({titulo, descricao, avatar, botoes, base, corpo = ''}) {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title><meta name="description" content="${esc(descricao)}">
<meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(descricao)}"><meta property="og:image" content="${base}img/${avatar}.png">
<link rel="icon" href="${base}img/${avatar}.png">
<style>
:root{--bg:#fff7ee;--tx:#1d1b18;--card:#fff;--lin:#f0dcc6;--pri:#ff7a1a}
@media (prefers-color-scheme:dark){:root{--bg:#171310;--tx:#f6efe6;--card:#221c17;--lin:#3a2e24}}
*{box-sizing:border-box}body{margin:0;font:16px/1.4 -apple-system,system-ui,sans-serif;background:var(--bg);color:var(--tx);display:flex;justify-content:center}
main{width:100%;max-width:480px;padding:32px 16px 48px;text-align:center}
img.av{width:112px;height:112px;border-radius:50%;border:4px solid var(--pri);object-fit:cover}
h1{font-size:22px;margin:12px 0 4px}p{margin:0 0 22px;opacity:.8}
a.bt{display:flex;align-items:center;gap:12px;padding:14px 16px;margin:10px 0;border-radius:14px;background:var(--card);border:1px solid var(--lin);color:inherit;text-decoration:none;font-weight:600;text-align:left}
a.bt img{width:40px;height:40px;border-radius:50%}a.bt.pri{background:var(--pri);border-color:var(--pri);color:#fff}
a.bt span{flex:1}small{display:block;font-weight:400;opacity:.75}footer{margin-top:28px;font-size:13px;opacity:.6}
h2{font-size:15px;margin:26px 0 4px;text-align:left;opacity:.75}.txt{text-align:left;background:var(--card);border:1px solid var(--lin);border-radius:14px;padding:14px 16px;margin:10px 0;white-space:pre-line}
.tag{display:inline-block;font-size:12px;font-weight:700;background:var(--pri);color:#fff;border-radius:99px;padding:2px 10px;margin-bottom:6px}
</style></head><body><main>
<img class="av" src="${base}img/${avatar}.png" alt="">
<h1>${esc(titulo)}</h1><p>${esc(descricao)}</p>
${corpo}
${botoes.map((b) => (b.titulo ? `<h2>${esc(b.titulo)}</h2>` : botao(b, base))).join('\n')}
<footer>Rede do Zé · bonequinhos que explicam tudo<br>Alguns links são de afiliado: o Zé ganha uma comissão e você não paga a mais.</footer>
</main>${beacon()}</body></html>`;
}

const ig = (u) => (u ? `https://instagram.com/${u}` : null);
const yt = (u) => (u ? `https://youtube.com/@${u}` : null);

const semRepetir = (bs) => {
  const vistos = new Set();
  return bs.filter((b) => b && (b.titulo || (!vistos.has(b.url) && vistos.add(b.url))));
};

// Os canais do Telegram do Zé de um perfil: o canal principal (Receitas do Zé, ou o "Ofertas do Zé" do nicho), o de
// ofertas do nicho e o Ofertas do Zé geral, sem repetir.
function canaisDoPerfil(p, geral) {
  const receita = p.id === 'cozinha';
  return semRepetir([
    p.grupo?.url && {rotulo: p.grupo.nome, sub: 'Grátis no Telegram', url: p.grupo.url, pri: true, icone: receita ? '🍳' : '🔥', k: 'tg-principal'},
    p.ofertas?.url && {rotulo: p.ofertas.nome, sub: 'Grátis no Telegram', url: p.ofertas.url, icone: '🛒', k: 'tg-ofertas'},
    geral && {...geral, pri: false},
  ]);
}

// Os vídeos que já foram ao ar (fila do painel), com o roteiro quando existe.
function videosPublicados(ps) {
  const ids = new Set(ps.map((p) => p.id));
  const roteiro = (id) => {
    try { return JSON.parse(fs.readFileSync(path.join(RAIZ, 'roteiros', `${id}.json`), 'utf8')); } catch { return {}; }
  };
  return fila()
    .filter((it) => ['publicado', 'publicando', 'aprovado'].includes(it.status) && ids.has(it.perfil) && /^[a-z0-9-]{1,80}$/.test(it.id))
    .sort((a, b) => String(b.publicado_em || b.agendado_para || b.atualizado || '').localeCompare(String(a.publicado_em || a.agendado_para || a.atualizado || '')))
    .map((it) => {
      const r = roteiro(it.id);
      const nome = (s) => String(s || '').toLowerCase().replace(/(^|[\s(])\S/g, (c) => c.toUpperCase());
      return {id: it.id, perfil: it.perfil, titulo: it.tema || nome(r.titulo) || it.id, sub: r.linha2 || '', entrega: it.entrega || r.pagina?.texto || '',
        afiliados: (it.afiliados ?? []).filter((a) => /^https?:\/\//.test(a.url)), itens: r.monetizacao?.afiliados ?? []};
    });
}

// A página do vídeo: o que o vídeo prometeu (receita, conta, resumo), os produtos que aparecem nele e os canais do Zé.
function paginaVideo(p, v, canais) {
  const corpo = [
    `<p class="tag">O vídeo que você viu</p>`,
    v.entrega ? `<div class="txt">${esc(v.entrega)}</div>` : '',
    v.afiliados.length ? '<h2>O que aparece no vídeo</h2>' : '',
    ...v.afiliados.slice(0, 6).map((a, i) => botao({rotulo: a.produto, sub: 'Ver o preço de hoje', url: a.url, icone: '🛍️', k: `produto-${i + 1}`}, '../../')),
    !v.afiliados.length && v.itens.length ? `<h2>O que aparece no vídeo</h2><div class="txt">${v.itens.slice(0, 6).map((x) => `• ${esc(x)}`).join('\n')}\n\nO Zé posta a melhor oferta desses itens no Telegram 👇</div>` : '',
  ].join('\n');
  return pagina({titulo: v.titulo, descricao: v.sub || p.nome, avatar: AVATAR[p.id], base: '../../', corpo,
    botoes: [{titulo: 'Telegram do Zé'}, ...canais, {rotulo: `Mais vídeos do ${p.nome}`, url: '../', icone: '🎬', k: 'perfil'}]});
}

export function gerar() {
  const c = config();
  const ps = perfis();
  fs.mkdirSync(path.join(SITE, 'img'), {recursive: true});
  for (const a of Object.values(AVATAR)) {
    const src = path.join(RAIZ, 'perfis/imagens', `avatar-${a}.png`);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(SITE, 'img', `${a}.png`));
  }
  const grupo = c.grupo?.url ? [{rotulo: c.grupo.nome || 'Grupo de ofertas', sub: 'Ofertas e cupons todo dia, grátis', url: c.grupo.url, pri: true, icone: '🔥', k: 'tg-geral'}] : [];
  const extras = (c.extras ?? []).filter((x) => x.url).map((x) => ({rotulo: x.rotulo, url: x.url, k: 'extra'}));
  const videos = videosPublicados(ps);
  // página geral
  fs.writeFileSync(path.join(SITE, 'index.html'), pagina({
    titulo: c.titulo, descricao: c.descricao, avatar: 'construiu', base: '',
    botoes: [...grupo, ...ps.map((p) => ({rotulo: p.nome, sub: p.nicho, url: `${p.id}/`, img: AVATAR[p.id], k: `perfil-${p.id}`})), ...extras.map((x) => ({...x, url: utm(x.url)}))],
  }));
  // uma por perfil, e uma por vídeo publicado (zeexplica.com.br/<perfil>/<vídeo>/)
  let nVideos = 0;
  for (const p of ps) {
    fs.mkdirSync(path.join(SITE, p.id), {recursive: true});
    const canais = canaisDoPerfil(p, grupo[0]);
    const doPerfil = videos.filter((v) => v.perfil === p.id);
    const botoes = semRepetir([
      ...canais,
      p.link_bio ? {rotulo: p.link_bio_rotulo || 'Mais no site', url: utm(p.link_bio, p.id), icone: '📖', k: 'site'} : null,
      ...(doPerfil.length ? [{titulo: 'Vídeos do Zé'}, ...doPerfil.slice(0, 12).map((v) => ({rotulo: v.titulo, sub: v.sub, url: `${v.id}/`, icone: '🎬', k: `video-${v.id}`.slice(0, 40)}))] : []),
      {titulo: 'Siga o Zé'},
      ig(p.instagram) && {rotulo: `Instagram @${p.instagram}`, url: ig(p.instagram), icone: '📸', k: 'instagram'},
      yt(p.youtube) && {rotulo: `YouTube @${p.youtube}`, url: yt(p.youtube), icone: '▶️', k: 'youtube'},
      ...extras.map((x) => ({...x, url: utm(x.url, p.id)})),
      {rotulo: 'Conheça os outros canais do Zé', url: '../', icone: '🧑‍🔧', k: 'rede'},
    ]);
    fs.writeFileSync(path.join(SITE, p.id, 'index.html'), pagina({titulo: p.nome, descricao: p.nicho, avatar: AVATAR[p.id], base: '../', botoes}));
    for (const v of doPerfil) {
      fs.mkdirSync(path.join(SITE, p.id, v.id), {recursive: true});
      fs.writeFileSync(path.join(SITE, p.id, v.id, 'index.html'), paginaVideo(p, v, canais));
      nVideos++;
    }
  }

  // Sitemap das páginas da rede (início, perfis e vídeos) para o Google Search Console
  const SITE_URL = 'https://zeexplica.com.br';
  const urls = ['/', ...ps.map((p) => `/${p.id}/`), ...videos.map((v) => `/${v.perfil}/${v.id}/`)];
  fs.writeFileSync(path.join(SITE, 'sitemap-paginas.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${SITE_URL}${esc(u)}</loc></url>`).join('\n')}\n</urlset>\n`);

  // Política de privacidade e termos (exigidos pelos apps do Google, Meta e TikTok)
  const doc = (titulo, corpo) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${titulo} · Zé Explica</title>
<style>body{font:16px/1.6 -apple-system,system-ui,sans-serif;max-width:720px;margin:0 auto;padding:32px 16px;color:#1d1b18;background:#fff7ee}h1{font-size:24px}h2{font-size:18px;margin-top:24px}</style></head><body><h1>${titulo}</h1>${corpo}<p><a href="/">Voltar</a></p></body></html>`;
  fs.writeFileSync(path.join(SITE, 'privacidade.html'), doc('Política de privacidade', `
<p>Atualizada em 11/11/2026. A rede Zé Explica (perfis Zé na Cozinha, Você na História, Você Construiu, Caso Explicado, Como Ficou Rico e Vale a Pena?) publica vídeos curtos nas redes sociais.</p>
<h2>O que usamos</h2><p>Nosso aplicativo acessa apenas as contas e canais dos próprios perfis da rede, autorizados pelo dono, para publicar vídeos, ler métricas e responder comentários e mensagens. Não vendemos nem compartilhamos dados com terceiros.</p>
<h2>Dados de quem interage</h2><p>Quando você comenta ou manda mensagem para um dos nossos perfis, usamos o seu nome de usuário e o texto apenas para responder. Não guardamos e-mail, telefone ou dados sensíveis.</p>
<h2>Links</h2><p>Alguns links são de afiliado: podemos ganhar uma comissão sem custo extra para você.</p>
<h2>Exclusão</h2><p>Para pedir a exclusão de qualquer dado, escreva para sfernandonogueira@gmail.com. Respondemos em até 15 dias.</p>`));
  fs.writeFileSync(path.join(SITE, 'termos.html'), doc('Termos de uso', `
<p>Atualizados em 11/11/2026. O conteúdo da rede Zé Explica é informativo e de entretenimento. Preços e números são aproximados, com a fonte e a data indicadas no vídeo, e podem mudar.</p>
<p>Ofertas e links de afiliado levam a lojas de terceiros, responsáveis pela venda e entrega. Dúvidas: sfernandonogueira@gmail.com.</p>`));
  return {pasta: 'site/', paginas: 3 + ps.length + nVideos, videos: nVideos};
}
