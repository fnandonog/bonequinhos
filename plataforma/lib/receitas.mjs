// Site Receitas do Zé (zeexplica.com.br/receitas): gera páginas estáticas a partir de receitas/dados/*.json.
// Uso: node plataforma/lib/receitas.mjs   → site/receitas/**, site/receita/<slug>/, site/sitemap-receitas.xml, site/robots.txt
// Campos de cada receita: t título, c categoria, e emoji, tp preparo (min), tc cozimento (min), tg tempo extra (texto),
// r rendimento (texto), n porções (número), d dificuldade 1-3, u utensílios, in introdução, i ingredientes ("## Seção" abre grupo),
// p passos, dc dicas, g como guardar, k palavras-chave extras, v id de vídeo do YouTube (opcional).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = path.join(RAIZ, 'receitas');
const SITE = path.join(RAIZ, 'site');
const DATA = '2026-11-11';

export const CATEGORIAS = {
  cafe: {nome: 'Café da manhã', plural: 'Receitas de café da manhã', e: '☕', desc: 'Pães, ovos, tapiocas e bolos rápidos para começar o dia sem complicação.'},
  almoco: {nome: 'Almoço e jantar', plural: 'Receitas de almoço e jantar', e: '🍛', desc: 'Pratos do dia a dia, baratos e com ingredientes que você acha em qualquer mercado.'},
  lanche: {nome: 'Lanches e salgados', plural: 'Receitas de lanche', e: '🥪', desc: 'Salgados, sanduíches e petiscos para a tarde ou para receber visita.'},
  doce: {nome: 'Doces e sobremesas', plural: 'Receitas de doces', e: '🍰', desc: 'Bolos, pudins, brigadeiros e sobremesas de geladeira que dão certo de primeira.'},
  bebida: {nome: 'Sucos e bebidas', plural: 'Receitas de sucos e bebidas', e: '🥤', desc: 'Sucos, vitaminas, cafés gelados e bebidas para o calor.'},
  fit: {nome: 'Fit e leves', plural: 'Receitas fit', e: '🥗', desc: 'Receitas leves, com mais proteína e menos açúcar, sem perder o sabor.'},
};
export const COLECOES = {
  'air-fryer': {nome: 'Receitas na air fryer', e: '🍟', desc: 'Tudo o que dá para fazer na air fryer, com temperatura e tempo certos.', f: (r) => r.u.includes('air fryer')},
  'liquidificador': {nome: 'Receitas de liquidificador', e: '🌀', desc: 'Bate tudo e pronto: bolos, tortas, pães e sucos de liquidificador.', f: (r) => r.u.includes('liquidificador')},
  'panela-de-pressao': {nome: 'Receitas na panela de pressão', e: '♨️', desc: 'Feijão, carnes e sobremesas em menos tempo, com o passo a passo seguro.', f: (r) => r.u.includes('panela de pressão')},
  'micro-ondas': {nome: 'Receitas de micro-ondas', e: '📦', desc: 'Receitas prontas em minutos no micro-ondas.', f: (r) => r.u.includes('micro-ondas')},
  'sem-forno': {nome: 'Receitas sem forno', e: '🔥', desc: 'Para quem não tem forno ou não quer esquentar a cozinha.', f: (r) => !r.u.includes('forno') && !r.u.includes('air fryer')},
  'rapidas': {nome: 'Receitas rápidas (até 20 minutos)', e: '⏱️', desc: 'Do começo ao prato em até 20 minutos.', f: (r) => r.total <= 20 && !r.tg},
};
const DIFS = {1: 'Muito fácil', 2: 'Fácil', 3: 'Médio'};
// ingredientes do filtro "O que tenho em casa" (chave → expressão)
export const INGREDIENTES = {
  ovo: /\bovos?\b/, leite: /\bleite\b(?! condensado| de coco| em pó)/, 'leite condensado': /leite condensado/, 'creme de leite': /creme de leite/,
  queijo: /queijo|muçarela|mussarela|parmesão/, requeijão: /requeijão/, manteiga: /manteiga|margarina/, iogurte: /iogurte/,
  'farinha de trigo': /farinha de trigo/, aveia: /aveia/, polvilho: /polvilho/, 'fubá': /fubá/, tapioca: /tapioca|goma/, arroz: /\barroz\b/, macarrão: /macarrão|espaguete|penne|parafuso|lasanha/, pão: /\bpão\b|pães|pão de forma|torrada/,
  frango: /frango|peito|coxa|sobrecoxa|asa/, 'carne moída': /carne moída/, carne: /carne(?! moída)|patinho|acém|músculo|alcatra|costela|cupim/, linguiça: /linguiça|calabresa/, presunto: /presunto|peito de peru/, atum: /atum|sardinha/, peixe: /peixe|tilápia|merluza|filé de pescada/, porco: /porco|lombo|bisteca|bacon/,
  batata: /batata(?! doce)/, 'batata-doce': /batata.doce/, mandioca: /mandioca|aipim|macaxeira/, cenoura: /cenoura/, tomate: /tomate/, cebola: /cebola/, alho: /\balho\b/, abobrinha: /abobrinha/, abóbora: /abóbora|cabotiá/, brócolis: /brócolis/, couve: /couve/, espinafre: /espinafre/, milho: /\bmilho\b/, ervilha: /ervilha/, feijão: /feijão/, 'grão-de-bico': /grão.de.bico/, lentilha: /lentilha/, repolho: /repolho/, chuchu: /chuchu/, berinjela: /berinjela/, pimentão: /pimentão/,
  banana: /banana/, limão: /limão/, laranja: /laranja/, maçã: /maçã/, morango: /morango/, abacaxi: /abacaxi/, maracujá: /maracujá/, manga: /manga\b/, coco: /\bcoco\b|coco ralado/, abacate: /abacate/, melancia: /melancia/,
  chocolate: /chocolate|cacau|achocolatado/, café: /\bcafé\b/, mel: /\bmel\b/, amendoim: /amendoim/,
};
const BASICOS = /^(sal|açúcar|óleo|azeite|água|fermento|pimenta|canela|cebola|alho|cheiro-verde|salsinha|orégano|colorau|páprica)/;

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dur = (m) => `PT${Math.floor(m / 60) ? Math.floor(m / 60) + 'H' : ''}${m % 60 ? (m % 60) + 'M' : (m ? '' : '0M')}`;
const tempoTxt = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}`);

export function carregar() {
  const cfg = JSON.parse(fs.readFileSync(path.join(DIR, 'config.json'), 'utf8'));
  const produtos = JSON.parse(fs.readFileSync(path.join(DIR, 'produtos.json'), 'utf8'));
  const lista = [];
  const vistos = new Set();
  for (const f of fs.readdirSync(path.join(DIR, 'dados')).filter((x) => x.endsWith('.json')).sort()) {
    for (const r of JSON.parse(fs.readFileSync(path.join(DIR, 'dados', f), 'utf8'))) {
      const s = r.s || slug(r.t);
      if (vistos.has(s)) throw new Error(`receita repetida: ${s} (${f})`);
      if (!CATEGORIAS[r.c]) throw new Error(`categoria inválida em ${s}: ${r.c}`);
      for (const k of ['t', 'r', 'in', 'i', 'p']) if (!r[k] || (Array.isArray(r[k]) && !r[k].length)) throw new Error(`falta ${k} em ${s}`);
      vistos.add(s);
      const u = r.u ?? [];
      const ingTxt = r.i.filter((x) => !x.startsWith('## ')).join(' | ').toLowerCase();
      const ings = Object.entries(INGREDIENTES).filter(([, re]) => re.test(ingTxt)).map(([k]) => k);
      lista.push({...r, s, u, tp: r.tp ?? 10, tc: r.tc ?? 0, total: (r.tp ?? 10) + (r.tc ?? 0), d: r.d ?? 1, ings, arq: f});
    }
  }
  return {cfg, produtos, lista};
}

// ---------- pedaços de HTML ----------
function cabeca({cfg, titulo, desc, url, img, tipo = 'website', ld = [], base}) {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}"><meta name="theme-color" content="${cfg.cor}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="${tipo}"><meta property="og:site_name" content="${esc(cfg.nome)}"><meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}receitas/ze.png"><link rel="stylesheet" href="${base}receitas/estilo.css?v=2">
${ld.map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head><body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
<header class="topo"><div class="w">
<a class="marca" href="${base}receitas/"><img src="${base}receitas/ze.png" alt="" width="40" height="40"><span>Receitas do <b>Zé</b></span></a>
<nav class="menu"><a href="${base}receitas/#buscar">Buscar</a><a href="${base}receitas/minha-lista/">❤️ Minha lista</a><a class="bt-g" href="${esc(cfg.grupos.ofertas_whatsapp.url)}" target="_blank" rel="noopener">Ofertas do Zé</a></nav>
</div>
<nav class="cats w">${Object.entries(CATEGORIAS).map(([k, c]) => `<a href="${base}receitas/${k}/">${c.e} ${c.nome}</a>`).join('')}${Object.entries(COLECOES).slice(0, 4).map(([k, c]) => `<a href="${base}receitas/${k}/">${c.e} ${c.nome.replace(/^Receitas (na |de )?/, '').replace(/^./, (x) => x.toUpperCase())}</a>`).join('')}</nav>
</header><main id="conteudo">`;
}

function rodape({cfg, base}) {
  return `</main>
<footer class="rodape"><div class="w">
<div><a class="marca" href="${base}receitas/"><img src="${base}receitas/ze.png" alt="" width="40" height="40"><span>Receitas do <b>Zé</b></span></a>
<p>${esc(cfg.slogan)}. Receitas escritas e conferidas pela equipe do Zé na Cozinha, com medidas caseiras.</p></div>
<div><b>Receitas</b>${Object.entries(CATEGORIAS).map(([k, c]) => `<a href="${base}receitas/${k}/">${c.nome}</a>`).join('')}<a href="${base}receitas/todas/">Todas de A a Z</a></div>
<div><b>Do jeito que você cozinha</b>${Object.entries(COLECOES).map(([k, c]) => `<a href="${base}receitas/${k}/">${c.nome}</a>`).join('')}</div>
<div><b>Grupos grátis</b>${Object.values(cfg.grupos).map((g) => `<a href="${esc(g.url)}" target="_blank" rel="noopener">${esc(g.nome)}</a>`).join('')}${Object.entries(cfg.redes).map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join('')}</div>
</div>
<p class="w aviso">${esc(cfg.aviso_afiliado)} · <a href="${base}privacidade.html">Privacidade</a> · <a href="${base}termos.html">Termos</a> · © ${DATA.slice(0, 4)} Zé Explica</p>
</footer>
<script src="${base}receitas/app.js?v=2" defer></script>
</body></html>`;
}

const ctaGrupos = (cfg, compacto = false) => `<div class="ctas${compacto ? ' compacto' : ''}">
<a class="bt zap" href="${esc(cfg.grupos.ofertas_whatsapp.url)}" target="_blank" rel="noopener"><span>💬</span><span>${esc(cfg.grupos.ofertas_whatsapp.nome)}<small>${esc(cfg.grupos.ofertas_whatsapp.sub)}</small></span></a>
<a class="bt tg" href="${esc(cfg.grupos.receitas_telegram.url)}" target="_blank" rel="noopener"><span>✈️</span><span>${esc(cfg.grupos.receitas_telegram.nome)}<small>${esc(cfg.grupos.receitas_telegram.sub)}</small></span></a>
</div>`;

const card = (r, base) => `<a class="card" href="${base}receita/${r.s}/" data-s="${r.s}">
<img src="${base}receitas/img/${r.s}.jpg" alt="${esc(r.t)}" width="400" height="300" loading="lazy">
<span class="ct">${esc(r.t)}</span>
<span class="mt">⏱️ ${tempoTxt(r.total)}${r.tg ? ' +' : ''} · ${DIFS[r.d]} · ${CATEGORIAS[r.c].e}</span></a>`;

const grade = (rs, base) => `<div class="grade">${rs.map((r) => card(r, base)).join('')}</div>`;

// ---------- páginas ----------
function paginaReceita(r, ctx) {
  const {cfg, produtos, lista, porCat} = ctx;
  const base = '../../';
  const url = `${cfg.site}/receita/${r.s}/`;
  const img = `${cfg.site}/receitas/img/${r.s}.jpg`;
  const cat = CATEGORIAS[r.c];
  const ings = r.i.filter((x) => !x.startsWith('## '));
  const desc = `${r.in.split(/(?<=\.)\s/)[0]} ${tempoTxt(r.total)}, ${DIFS[r.d].toLowerCase()}, rende ${r.r}.`.slice(0, 158);
  const titulo = `${r.t}: receita fácil passo a passo | Receitas do Zé`;
  const utens = r.u;
  const faq = [
    [`Quanto tempo leva ${r.t.toLowerCase()}?`, `São cerca de ${tempoTxt(r.tp)} de preparo${r.tc ? ` e ${tempoTxt(r.tc)} no fogo ou no forno` : ''}${r.tg ? `, ${r.tg}` : ''}. No total, ${tempoTxt(r.total)}${r.tg ? ` ${r.tg}` : ''}.`],
    [`Quanto rende essa receita?`, `Rende ${r.r}. Para dobrar, use o dobro de todos os ingredientes${r.u.includes('forno') || r.u.includes('air fryer') ? ' e asse em duas levas ou em uma forma maior, conferindo o ponto antes do tempo acabar' : ' e uma panela maior'}.`],
    r.g && [`Como guardar ${r.t.toLowerCase()}?`, r.g],
    r.u.includes('air fryer') && ['Dá para fazer no forno em vez da air fryer?', 'Dá sim. Use o forno preaquecido a 200 °C e conte de 5 a 10 minutos a mais, virando na metade do tempo.'],
    r.dc?.[0] && [`Qual o segredo para ${r.t.toLowerCase()} dar certo?`, r.dc[0]],
  ].filter(Boolean);
  let passoN = 0;
  const ld = [
    {'@context': 'https://schema.org', '@type': 'Recipe', name: r.t, description: r.in, image: [img], author: {'@type': 'Organization', name: 'Zé na Cozinha', url: `${cfg.site}/cozinha/`},
      publisher: {'@type': 'Organization', name: 'Zé Explica', url: cfg.site, logo: {'@type': 'ImageObject', url: `${cfg.site}/receitas/ze.png`}},
      datePublished: r.dt || DATA, prepTime: dur(r.tp), ...(r.tc ? {cookTime: dur(r.tc)} : {}), totalTime: dur(r.total), recipeYield: [String(r.n || 4), r.r],
      recipeCategory: cat.nome, recipeCuisine: 'Brasileira', keywords: [r.t.toLowerCase(), 'receita fácil', ...(r.k ?? []), ...r.u.map((u) => `receita ${u}`)].join(', '),
      recipeIngredient: ings, recipeInstructions: r.p.map((p) => ({'@type': 'HowToStep', text: p, url: `${url}#passo-${++passoN}`})),
      ...(r.v ? {video: {'@type': 'VideoObject', name: r.t, description: r.in, thumbnailUrl: [img], contentUrl: `https://www.youtube.com/shorts/${r.v}`, embedUrl: `https://www.youtube.com/embed/${r.v}`, uploadDate: r.dt || DATA}} : {})},
    {'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'Receitas do Zé', item: `${cfg.site}/receitas/`},
      {'@type': 'ListItem', position: 2, name: cat.plural, item: `${cfg.site}/receitas/${r.c}/`},
      {'@type': 'ListItem', position: 3, name: r.t, item: url}]},
    {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({'@type': 'Question', name: q, acceptedAnswer: {'@type': 'Answer', text: a}}))},
  ];
  // relacionadas: mesma categoria, com ingrediente em comum primeiro
  const rel = porCat[r.c].filter((x) => x.s !== r.s).map((x) => [x, x.ings.filter((g) => r.ings.includes(g)).length + (x.u.some((u) => r.u.includes(u)) ? 0.5 : 0)])
    .sort((a, b) => b[1] - a[1] || a[0].t.localeCompare(b[0].t)).slice(0, 6).map(([x]) => x);
  const mesmoUt = r.u[0] ? lista.filter((x) => x.s !== r.s && x.c !== r.c && x.u.includes(r.u[0])).slice(0, 3) : [];
  const achados = utens.map((u) => produtos[u] && {u, ...produtos[u]}).filter(Boolean);
  passoN = 0;
  let grupoAberto = false;
  const ingHtml = r.i.map((x) => {
    if (x.startsWith('## ')) { const h = `${grupoAberto ? '</ul>' : ''}<h3>${esc(x.slice(3))}</h3><ul class="ing">`; grupoAberto = true; return h; }
    const basico = BASICOS.test(x.toLowerCase());
    return `<li><label><input type="checkbox" data-i="${esc(x)}"${basico ? ' data-basico' : ''}> <span>${esc(x)}</span></label></li>`;
  }).join('');
  return cabeca({cfg, titulo, desc, url, img, tipo: 'article', ld, base}) + `
<div class="w receita" data-s="${r.s}" data-t="${esc(r.t)}">
<nav class="migalha"><a href="${base}receitas/">Receitas</a> › <a href="${base}receitas/${r.c}/">${cat.plural}</a> › <span>${esc(r.t)}</span></nav>
<div class="hero">
<div class="hero-tx">
<h1>${esc(r.t)}</h1>
<p class="intro">${esc(r.in)}</p>
<ul class="selos"><li>⏱️ <b>${tempoTxt(r.total)}</b>${r.tg ? ` <small>${esc(r.tg)}</small>` : ''}</li><li>🍽️ <b>${esc(r.r)}</b></li><li>👨‍🍳 <b>${DIFS[r.d]}</b></li><li>${cat.e} <a href="${base}receitas/${r.c}/">${cat.nome}</a></li></ul>
<div class="acoes"><a class="bt pri" href="#ingredientes">Ver a receita</a><button class="bt salvar" type="button" data-salvar="${r.s}">🤍 Salvar</button><button class="bt" type="button" onclick="window.print()">🖨️ Imprimir</button></div>
</div>
<img class="hero-img" src="${base}receitas/img/${r.s}.jpg" alt="${esc(r.t)}" width="800" height="600" fetchpriority="high">
</div>
${ctaGrupos(cfg, true)}
<div class="corpo">
<section class="bloco" id="ingredientes"><h2>Ingredientes</h2>
<p class="nota">Marque o que você já tem em casa. O que ficar sem marcar vai para a sua lista de compras.</p>
${grupoAberto || r.i[0].startsWith('## ') ? '' : '<ul class="ing">'}${ingHtml}</ul>
<button class="bt lista" type="button" data-lista>🛒 Mandar o que falta para a lista de compras</button>
<p class="ut">🍳 ${utens.length ? `Você vai usar: ${utens.map(esc).join(', ')}.` : 'Não precisa de fogão: só tigela, faca e colher.'}</p>
</section>
<section class="bloco" id="modo-de-preparo"><h2>Modo de preparo</h2>
<ol class="passos">${r.p.map((p) => `<li id="passo-${++passoN}">${esc(p)}</li>`).join('')}</ol>
</section>
${r.dc?.length ? `<section class="bloco dicas"><h2>Dicas do Zé para acertar de primeira</h2><ul>${r.dc.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></section>` : ''}
${r.g ? `<section class="bloco"><h2>Como guardar</h2><p>${esc(r.g)}</p></section>` : ''}
${r.v ? `<section class="bloco"><h2>Veja o Zé fazendo</h2><div class="video"><iframe src="https://www.youtube.com/embed/${esc(r.v)}" title="${esc(r.t)}" loading="lazy" allowfullscreen></iframe></div></section>` : ''}
${achados.length ? `<section class="bloco achados"><h2>🛍️ Achados do Zé para essa receita</h2><p class="nota">Utensílios que facilitam essa receita. O Zé posta os melhores preços no grupo de ofertas.</p>
<div class="prods">${achados.map((a) => `<div class="prod"><b>${esc(a.nome)}</b><span>${esc(a.por_que)}</span><a class="bt ${a.url ? 'pri' : 'zap'}" href="${esc(a.url || cfg.grupos.ofertas_whatsapp.url)}" target="_blank" rel="${a.url ? 'sponsored noopener' : 'noopener'}">${a.url ? 'Ver preço de hoje' : 'Receber a oferta no grupo'}</a></div>`).join('')}</div>
<p class="aviso">${esc(cfg.aviso_afiliado)}</p></section>` : ''}
<section class="bloco faq"><h2>Perguntas frequentes</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
<section class="bloco grupo-box"><h2>Receba receitas como essa de graça</h2><p>Todo dia o Zé manda uma receita fácil, com medida caseira e passo a passo curto, e os achados de cozinha com preço conferido.</p>${ctaGrupos(cfg)}</section>
<section class="bloco"><h2>Mais ${cat.plural.toLowerCase().replace('receitas de ', 'receitas de ')}</h2>${grade(rel, base)}<p><a class="mais" href="${base}receitas/${r.c}/">Ver todas as ${cat.plural.toLowerCase()} →</a></p></section>
${mesmoUt.length ? `<section class="bloco"><h2>Também dá para fazer na ${esc(r.u[0])}</h2>${grade(mesmoUt, base)}</section>` : ''}
</div></div>` + rodape({cfg, base});
}

function paginaLista({cfg, titulo, h1, desc, url, rs, base, intro, extra = ''}) {
  const ld = [{'@context': 'https://schema.org', '@type': 'ItemList', name: h1, itemListElement: rs.slice(0, 100).map((r, i) => ({'@type': 'ListItem', position: i + 1, url: `${cfg.site}/receita/${r.s}/`}))}];
  return cabeca({cfg, titulo, desc, url, img: `${cfg.site}/receitas/capa.jpg`, ld, base}) + `
<div class="w"><nav class="migalha"><a href="${base}receitas/">Receitas</a> › <span>${esc(h1)}</span></nav>
<h1>${esc(h1)}</h1><p class="intro">${esc(intro)} <b>${rs.length} receitas.</b></p>
${ctaGrupos(cfg, true)}${extra}
${grade(rs, base)}
<section class="bloco grupo-box"><h2>Receba uma receita fácil por dia</h2>${ctaGrupos(cfg)}</section></div>` + rodape({cfg, base});
}

function paginaInicio(ctx) {
  const {cfg, lista, porCat} = ctx;
  const base = '../';
  const n = lista.length;
  const titulo = `Receitas fáceis e baratas: ${n} receitas passo a passo | Receitas do Zé`;
  const desc = `${n} receitas fáceis, baratas e testadas, com medida caseira: almoço, lanche, doces, fit, air fryer e liquidificador. Busque pelo que você tem em casa.`;
  const ld = [{'@context': 'https://schema.org', '@type': 'WebSite', name: cfg.nome, url: `${cfg.site}/receitas/`,
    potentialAction: {'@type': 'SearchAction', target: `${cfg.site}/receitas/?q={busca}`, 'query-input': 'required name=busca'}},
  {'@context': 'https://schema.org', '@type': 'Organization', name: 'Zé Explica', url: cfg.site, logo: `${cfg.site}/receitas/ze.png`, sameAs: Object.values(cfg.redes).filter((u) => !u.includes('zeexplica'))}];
  const chips = ['ovo', 'leite', 'frango', 'carne moída', 'queijo', 'tomate', 'batata', 'banana', 'chocolate', 'leite condensado', 'farinha de trigo', 'aveia', 'arroz', 'cenoura', 'milho', 'limão', 'creme de leite', 'macarrão', 'pão', 'linguiça', 'mandioca', 'abobrinha', 'atum', 'coco'];
  return cabeca({cfg, titulo, desc, url: `${cfg.site}/receitas/`, img: `${cfg.site}/receitas/capa.jpg`, ld, base}) + `
<div class="w">
<section class="topo-inicio"><div><h1>Receitas fáceis e baratas do Zé</h1>
<p class="intro">${n} receitas que qualquer um consegue fazer, com medida caseira, tempo certo e o segredo para dar certo de primeira. Escolha pelo que tem na geladeira.</p></div>
<img src="ze.png" alt="Zé na Cozinha" width="140" height="140"></section>
${ctaGrupos(cfg, true)}
<nav class="atalhos">${Object.entries(CATEGORIAS).map(([k, c]) => `<a href="${k}/"><span>${c.e}</span>${c.nome}<small>${porCat[k].length} receitas</small></a>`).join('')}${Object.entries(COLECOES).map(([k, c]) => `<a href="${k}/"><span>${c.e}</span>${c.nome.replace(/^Receitas (na |de )?/, '').replace(/^./, (x) => x.toUpperCase())}<small>${lista.filter(c.f).length} receitas</small></a>`).join('')}</nav>
<section class="bloco busca" id="buscar"><h2>🔎 O que tem na sua casa?</h2>
<input id="q" type="search" placeholder="Busque: bolo, frango, air fryer..." aria-label="Buscar receita">
<div class="chips" id="chips">${chips.map((c) => `<button type="button" data-ing="${esc(c)}">${esc(c)}</button>`).join('')}</div>
<div class="filtros"><label>Tempo <select id="ftempo"><option value="">qualquer</option><option value="15">até 15 min</option><option value="30">até 30 min</option><option value="60">até 1 hora</option></select></label>
<label>Utensílio <select id="fut"><option value="">qualquer</option><option>air fryer</option><option>liquidificador</option><option>panela de pressão</option><option>micro-ondas</option><option>forno</option><option>frigideira</option></select></label>
<label>Tipo <select id="fcat"><option value="">todas</option>${Object.entries(CATEGORIAS).map(([k, c]) => `<option value="${k}">${c.nome}</option>`).join('')}</select></label></div>
<p class="nota">Sal, açúcar, óleo, alho, cebola e fermento a gente considera que quase toda casa tem.</p>
<p id="res-n" class="res-n"></p><div class="grade" id="res"></div></section>
<section class="bloco" id="salvas" hidden><h2>❤️ Suas receitas salvas</h2><div class="grade" id="salvas-g"></div><p><a class="mais" href="minha-lista/">Ver minha lista de compras →</a></p></section>
${Object.entries(CATEGORIAS).map(([k, c]) => `<section class="bloco vitrine"><h2>${c.e} ${c.plural}</h2>${grade(porCat[k].slice(0, 8), base)}<p><a class="mais" href="${k}/">Ver as ${porCat[k].length} ${c.plural.toLowerCase()} →</a></p></section>`).join('')}
<section class="bloco grupo-box"><h2>Receba de graça no WhatsApp ou no Telegram</h2><ul><li>Uma receita fácil por dia, com medida caseira.</li><li>Achados de cozinha com preço conferido no grupo Ofertas do Zé.</li><li>Sem spam: sai quando quiser.</li></ul>${ctaGrupos(cfg)}</section>
<p><a class="mais" href="todas/">Todas as ${n} receitas de A a Z →</a></p>
</div>` + rodape({cfg, base});
}

function paginaMinhaLista({cfg}) {
  const base = '../../';
  return cabeca({cfg, titulo: 'Minhas receitas e lista de compras | Receitas do Zé', desc: 'Suas receitas salvas e a lista de compras do Zé, guardadas no seu celular.', url: `${cfg.site}/receitas/minha-lista/`, img: `${cfg.site}/receitas/capa.jpg`, base})
    .replace('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex">') + `
<div class="w"><nav class="migalha"><a href="${base}receitas/">Receitas</a> › <span>Minha lista</span></nav>
<h1>❤️ Minha lista</h1><p class="intro">Fica guardada só neste aparelho.</p>
<section class="bloco"><h2>🛒 Lista de compras</h2><ul class="ing" id="compras"></ul><p id="compras-vazia" class="nota">Sua lista está vazia. Abra uma receita, marque o que já tem e toque em “Mandar o que falta para a lista”.</p>
<div class="acoes"><button class="bt pri" type="button" id="compras-zap">Mandar a lista no meu WhatsApp</button><button class="bt" type="button" id="compras-limpar">Limpar comprados</button></div></section>
<section class="bloco"><h2>Receitas salvas</h2><div class="grade" id="salvas-g"></div><p id="salvas-vazia" class="nota">Toque em 🤍 Salvar em qualquer receita para ela aparecer aqui.</p></section>
${ctaGrupos(cfg)}</div>` + rodape({cfg, base});
}

const CSS = `:root{--pri:#e8590c;--pri2:#c2410c;--bg:#fffaf3;--card:#fff;--tx:#1f1a17;--tx2:#5f564f;--lin:#f1e2d0;--zap:#1fa855;--tg:#2481cc;--sh:0 1px 2px rgba(60,30,0,.06),0 4px 14px rgba(60,30,0,.06)}
@media (prefers-color-scheme:dark){:root{--bg:#16120f;--card:#211b17;--tx:#f5ede4;--tx2:#bdb1a5;--lin:#3a2f27;--sh:none}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font:17px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,system-ui,sans-serif;background:var(--bg);color:var(--tx)}
a{color:var(--pri2)}@media (prefers-color-scheme:dark){a{color:#ff9b5c}}
.w{max-width:1080px;margin:0 auto;padding:0 16px}.pular{position:absolute;left:-999px}.pular:focus{left:8px;top:8px;background:#fff;padding:8px;z-index:9}
.topo{background:var(--card);border-bottom:1px solid var(--lin);position:sticky;top:0;z-index:5}.topo>.w{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:8px;padding-bottom:8px}
.marca{display:flex;align-items:center;gap:8px;color:var(--tx);text-decoration:none;font-size:19px}.marca img{border-radius:50%;border:2px solid var(--pri)}.marca b{color:var(--pri)}
.menu{display:flex;gap:14px;align-items:center;font-size:15px}.menu a{color:var(--tx);text-decoration:none}.menu .bt-g{background:var(--zap);color:#fff;padding:6px 12px;border-radius:999px;font-weight:600}
@media (max-width:560px){.menu a:not(.bt-g){display:none}}
.cats{display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;scrollbar-width:none}.cats a{white-space:nowrap;font-size:14px;padding:5px 11px;border:1px solid var(--lin);border-radius:999px;color:var(--tx);text-decoration:none;background:var(--bg)}
h1{font-size:clamp(28px,5vw,42px);line-height:1.12;margin:16px 0 10px;letter-spacing:-.02em}h2{font-size:23px;margin:0 0 12px;line-height:1.2}h3{font-size:17px;margin:14px 0 4px;color:var(--pri2)}
.intro{font-size:18px;color:var(--tx2);margin:0 0 14px}.nota{font-size:14px;color:var(--tx2)}.migalha{font-size:14px;color:var(--tx2);padding-top:14px}.migalha a{color:var(--tx2)}
.bt{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border-radius:12px;border:1px solid var(--lin);background:var(--card);color:var(--tx);font:600 15px/1.2 inherit;text-decoration:none;cursor:pointer}
.bt.pri{background:var(--pri);border-color:var(--pri);color:#fff}.bt.zap{background:var(--zap);border-color:var(--zap);color:#fff}.bt.tg{background:var(--tg);border-color:var(--tg);color:#fff}
.bt small{display:block;font-weight:400;font-size:13px;opacity:.9}.bt.salvo{border-color:#e11d48;color:#e11d48}
.ctas{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.ctas .bt{padding:12px 14px}.ctas .bt>span:first-child{font-size:22px}
@media (max-width:640px){.ctas{grid-template-columns:1fr}.ctas.compacto .bt small{display:none}}
.hero{display:grid;grid-template-columns:1.1fr 1fr;gap:28px;align-items:center}.hero-img{width:100%;height:auto;border-radius:20px;box-shadow:var(--sh);aspect-ratio:4/3;object-fit:cover}
@media (max-width:760px){.hero{grid-template-columns:1fr;gap:12px}.hero-img{order:-1;margin-top:10px}}
.selos{list-style:none;padding:0;margin:0 0 16px;display:flex;flex-wrap:wrap;gap:8px}.selos li{background:var(--card);border:1px solid var(--lin);border-radius:10px;padding:6px 10px;font-size:15px}.selos small{color:var(--tx2)}
.acoes{display:flex;flex-wrap:wrap;gap:8px}
.corpo{max-width:760px}.bloco{background:var(--card);border:1px solid var(--lin);border-radius:18px;padding:20px;margin:18px 0;box-shadow:var(--sh)}
.ing{list-style:none;padding:0;margin:6px 0 12px}.ing li{border-bottom:1px dashed var(--lin);padding:7px 0}.ing label{display:flex;gap:10px;align-items:flex-start;cursor:pointer}.ing input{width:20px;height:20px;margin-top:3px;accent-color:var(--pri);flex:none}.ing input:checked+span{color:var(--tx2);text-decoration:line-through}
.passos{counter-reset:p;list-style:none;padding:0;margin:0}.passos li{counter-increment:p;position:relative;padding:0 0 16px 46px;min-height:34px}.passos li:before{content:counter(p);position:absolute;left:0;top:-2px;width:32px;height:32px;border-radius:50%;background:var(--pri);color:#fff;font-weight:700;display:grid;place-items:center}
.passos li:target{background:#fff3e6;border-radius:8px}@media (prefers-color-scheme:dark){.passos li:target{background:#3a2a1d}}
.dicas ul{padding-left:20px;margin:0}.dicas li{margin-bottom:8px}.ut{font-size:15px;color:var(--tx2);margin:6px 0 0}
.prods{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.prod{border:1px solid var(--lin);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px}.prod span{font-size:14px;color:var(--tx2);flex:1}.prod .bt{justify-content:center}
.aviso{font-size:12.5px;color:var(--tx2)}
.faq details{border-bottom:1px solid var(--lin);padding:10px 0}.faq summary{font-weight:600;cursor:pointer}.faq p{margin:8px 0 0;color:var(--tx2)}
.grupo-box{background:linear-gradient(135deg,#fff1e2,#ffe4cc);border-color:#ffd2ad}@media (prefers-color-scheme:dark){.grupo-box{background:linear-gradient(135deg,#2c1d12,#3a2414);border-color:#5a3a22}}
.grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}@media (max-width:480px){.grade{grid-template-columns:1fr 1fr;gap:10px}}
.card{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--lin);border-radius:14px;overflow:hidden;color:var(--tx);text-decoration:none;box-shadow:var(--sh);transition:transform .15s}.card:hover{transform:translateY(-2px)}
.card img{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;background:#ffe8d3}.card .ct{font-weight:650;padding:8px 10px 2px;line-height:1.25;font-size:15.5px}.card .mt{font-size:13px;color:var(--tx2);padding:2px 10px 10px}
.mais{font-weight:600}.vitrine{background:none;border:0;box-shadow:none;padding:6px 0}
.topo-inicio{display:flex;gap:20px;align-items:center;justify-content:space-between}.topo-inicio img{border-radius:50%;border:4px solid var(--pri);flex:none}@media (max-width:560px){.topo-inicio img{width:84px;height:84px}}
.atalhos{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:18px 0}.atalhos a{background:var(--card);border:1px solid var(--lin);border-radius:14px;padding:12px;color:var(--tx);text-decoration:none;font-weight:600;font-size:15px;display:flex;flex-direction:column}.atalhos span{font-size:26px}.atalhos small{font-weight:400;color:var(--tx2);font-size:13px}
.busca input[type=search]{width:100%;font:inherit;padding:12px 14px;border-radius:12px;border:2px solid var(--lin);background:var(--bg);color:var(--tx)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}.chips button{font:inherit;font-size:14px;padding:6px 11px;border-radius:999px;border:1px solid var(--lin);background:var(--bg);color:var(--tx);cursor:pointer}.chips button.on{background:var(--pri);border-color:var(--pri);color:#fff}
.filtros{display:flex;flex-wrap:wrap;gap:10px;font-size:14px}.filtros select{font:inherit;padding:6px;border-radius:8px;border:1px solid var(--lin);background:var(--bg);color:var(--tx)}.res-n{font-weight:600}
.video{position:relative;aspect-ratio:9/16;max-width:340px}.video iframe{position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:14px}
.az{columns:2 260px;padding-left:18px}.az li{margin-bottom:4px}
.rodape{margin-top:40px;background:var(--card);border-top:1px solid var(--lin);padding:26px 0 18px;font-size:14px}.rodape>.w:first-child{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:20px}.rodape a{display:block;color:var(--tx2);text-decoration:none;margin:4px 0}.rodape .marca{display:flex;color:var(--tx)}.rodape p{color:var(--tx2)}
.rodape .aviso a{display:inline}@media (max-width:760px){.rodape>.w:first-child{grid-template-columns:1fr 1fr}}
@media print{.topo,.rodape,.ctas,.acoes,.achados,.grupo-box,.bloco:has(.grade),.cats,.migalha,.faq,.bt{display:none!important}.bloco{border:0;box-shadow:none;padding:0}body{background:#fff;color:#000}}`;

const JS = `(()=>{const L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},S=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const raiz=document.querySelector('link[rel=stylesheet]').getAttribute('href').replace(/receitas\\/estilo\\.css.*$/,'');
const cardH=r=>'<a class="card" href="'+raiz+'receita/'+r.s+'/"><img src="'+raiz+'receitas/img/'+r.s+'.jpg" alt="" width="400" height="300" loading="lazy"><span class="ct">'+r.t+'</span><span class="mt">⏱️ '+(r.m<60?r.m+' min':Math.floor(r.m/60)+' h'+(r.m%60?' '+r.m%60+' min':''))+' · '+r.e+'</span></a>';
let IDX=null;const idx=async()=>IDX||(IDX=await (await fetch(raiz+'receitas/indice.json')).json());
const norm=s=>s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
// salvar
const sal=new Set(L('ze-salvas',[]));document.querySelectorAll('[data-salvar]').forEach(b=>{const s=b.dataset.salvar,pinta=()=>{b.textContent=sal.has(s)?'❤️ Salva':'🤍 Salvar';b.classList.toggle('salvo',sal.has(s))};pinta();b.onclick=()=>{sal.has(s)?sal.delete(s):sal.add(s);S('ze-salvas',[...sal]);pinta()}});
const salvasG=document.getElementById('salvas-g');if(salvasG&&sal.size){idx().then(I=>{const rs=I.filter(r=>sal.has(r.s));salvasG.innerHTML=rs.map(cardH).join('');const sec=document.getElementById('salvas');if(sec&&rs.length)sec.hidden=false;const v=document.getElementById('salvas-vazia');if(v&&rs.length)v.hidden=true})}
// ingredientes → lista de compras
const rec=document.querySelector('.receita');if(rec){const s=rec.dataset.s,tem=L('ze-tem-'+s,[]);document.querySelectorAll('[data-i]').forEach(c=>{if(tem.includes(c.dataset.i))c.checked=true;c.onchange=()=>S('ze-tem-'+s,[...document.querySelectorAll('[data-i]:checked')].map(x=>x.dataset.i))});
const bl=document.querySelector('[data-lista]');if(bl)bl.onclick=()=>{const falta=[...document.querySelectorAll('[data-i]:not(:checked)')].map(x=>x.dataset.i),lista=L('ze-compras',[]);falta.forEach(i=>{if(!lista.some(x=>x.i===i))lista.push({i,r:rec.dataset.t,ok:false})});S('ze-compras',lista);bl.textContent=falta.length?'✅ '+falta.length+' itens na sua lista':'✅ Você já tem tudo!';setTimeout(()=>{bl.innerHTML='🛒 Mandar o que falta para a lista de compras · <a href="'+raiz+'receitas/minha-lista/">ver lista</a>'},2500)}}
const ul=document.getElementById('compras');if(ul){const desenha=()=>{const lista=L('ze-compras',[]);document.getElementById('compras-vazia').hidden=!!lista.length;ul.innerHTML=lista.map((x,n)=>'<li><label><input type="checkbox" data-n="'+n+'"'+(x.ok?' checked':'')+'> <span>'+x.i.replace(/</g,'&lt;')+' <small class="nota">('+x.r.replace(/</g,'&lt;')+')</small></span></label></li>').join('');ul.querySelectorAll('input').forEach(c=>c.onchange=()=>{const l=L('ze-compras',[]);l[c.dataset.n].ok=c.checked;S('ze-compras',l)})};desenha();
document.getElementById('compras-limpar').onclick=()=>{S('ze-compras',L('ze-compras',[]).filter(x=>!x.ok));desenha()};document.getElementById('compras-zap').onclick=()=>{const l=L('ze-compras',[]).filter(x=>!x.ok);location.href='https://wa.me/?text='+encodeURIComponent('🛒 Lista de compras (Receitas do Zé)\\n'+l.map(x=>'• '+x.i).join('\\n'))}}
// busca
const q=document.getElementById('q');if(q){const res=document.getElementById('res'),n=document.getElementById('res-n'),on=new Set(),ft=document.getElementById('ftempo'),fu=document.getElementById('fut'),fc=document.getElementById('fcat');
const roda=async()=>{const t=norm(q.value.trim());if(!t&&!on.size&&!ft.value&&!fu.value&&!fc.value){res.innerHTML='';n.textContent='';return}const I=await idx();let rs=I.filter(r=>(!t||norm(r.t+' '+r.k).includes(t))&&(!ft.value||r.m<=+ft.value)&&(!fu.value||r.u.includes(fu.value))&&(!fc.value||r.c===fc.value)&&[...on].every(i=>r.g.includes(i)));
if(on.size)rs.sort((a,b)=>a.g.length-b.g.length);n.textContent=rs.length?rs.length+' receitas encontradas':'Nenhuma receita com esse filtro. Tente tirar um ingrediente.';res.innerHTML=rs.slice(0,60).map(cardH).join('')};
q.oninput=roda;[ft,fu,fc].forEach(s=>s.onchange=roda);document.querySelectorAll('[data-ing]').forEach(b=>b.onclick=()=>{const i=b.dataset.ing;on.has(i)?on.delete(i):on.add(i);b.classList.toggle('on');roda()});const p=new URLSearchParams(location.search).get('q');if(p){q.value=p;roda()}}
})();`;

// ---------- gerar ----------
export function gerar() {
  const ctx = carregar();
  const {cfg, lista} = ctx;
  lista.sort((a, b) => a.t.localeCompare(b.t, 'pt-BR'));
  ctx.porCat = Object.fromEntries(Object.keys(CATEGORIAS).map((k) => [k, lista.filter((r) => r.c === k)]));
  // vitrines: as mais fáceis e rápidas primeiro
  for (const k in ctx.porCat) ctx.porCat[k].sort((a, b) => a.d - b.d || (a.tg ? 1 : 0) - (b.tg ? 1 : 0) || a.total - b.total);
  const R = path.join(SITE, 'receitas');
  fs.rmSync(R, {recursive: true, force: true});
  fs.rmSync(path.join(SITE, 'receita'), {recursive: true, force: true});
  fs.mkdirSync(path.join(R, 'img'), {recursive: true});
  fs.writeFileSync(path.join(R, 'estilo.css'), CSS);
  fs.writeFileSync(path.join(R, 'app.js'), JS);
  fs.copyFileSync(path.join(DIR, 'ze.png'), path.join(R, 'ze.png'));
  const imgDir = path.join(DIR, 'img');
  for (const f of fs.readdirSync(imgDir)) fs.copyFileSync(path.join(imgDir, f), path.join(R, 'img', f));
  if (fs.existsSync(path.join(imgDir, '_capa.jpg'))) fs.copyFileSync(path.join(imgDir, '_capa.jpg'), path.join(R, 'capa.jpg'));
  fs.writeFileSync(path.join(R, 'indice.json'), JSON.stringify(lista.map((r) => ({s: r.s, t: r.t, c: r.c, m: r.total, u: r.u, g: r.ings, e: `${DIFS[r.d]} · ${CATEGORIAS[r.c].e}`, k: [...(r.k ?? []), CATEGORIAS[r.c].nome, ...r.u].join(' ')}))));
  for (const r of lista) {
    fs.mkdirSync(path.join(SITE, 'receita', r.s), {recursive: true});
    fs.writeFileSync(path.join(SITE, 'receita', r.s, 'index.html'), paginaReceita(r, ctx));
  }
  fs.writeFileSync(path.join(R, 'index.html'), paginaInicio(ctx));
  const urls = [`${cfg.site}/receitas/`];
  const lst = (dir, o) => { fs.mkdirSync(path.join(R, dir), {recursive: true}); fs.writeFileSync(path.join(R, dir, 'index.html'), paginaLista({cfg, base: '../../', url: `${cfg.site}/receitas/${dir}/`, ...o})); urls.push(`${cfg.site}/receitas/${dir}/`); };
  for (const [k, c] of Object.entries(CATEGORIAS)) lst(k, {titulo: `${c.plural} fáceis: ${ctx.porCat[k].length} receitas | Receitas do Zé`, h1: `${c.e} ${c.plural} fáceis`, desc: `${c.desc} ${ctx.porCat[k].length} receitas com passo a passo e medida caseira.`, intro: c.desc, rs: ctx.porCat[k]});
  for (const [k, c] of Object.entries(COLECOES)) { const rs = lista.filter(c.f); lst(k, {titulo: `${c.nome}: ${rs.length} receitas fáceis | Receitas do Zé`, h1: `${c.e} ${c.nome}`, desc: `${c.desc} ${rs.length} receitas com passo a passo.`, intro: c.desc, rs}); }
  lst('todas', {titulo: `Todas as ${lista.length} receitas de A a Z | Receitas do Zé`, h1: 'Todas as receitas de A a Z', desc: `Índice com as ${lista.length} receitas do Zé, em ordem alfabética.`, intro: 'O índice completo, em ordem alfabética.', rs: [],
    extra: `<section class="bloco"><ul class="az">${lista.map((r) => `<li><a href="../../receita/${r.s}/">${esc(r.t)}</a></li>`).join('')}</ul></section>`});
  fs.mkdirSync(path.join(R, 'minha-lista'), {recursive: true});
  fs.writeFileSync(path.join(R, 'minha-lista', 'index.html'), paginaMinhaLista(ctx));
  urls.push(...lista.map((r) => `${cfg.site}/receita/${r.s}/`));
  fs.writeFileSync(path.join(SITE, 'sitemap-receitas.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.map((u) => {
    const s = u.match(/\/receita\/([^/]+)\//)?.[1];
    return `<url><loc>${u}</loc><lastmod>${DATA}</lastmod>${s ? `<image:image><image:loc>${cfg.site}/receitas/img/${s}.jpg</image:loc></image:image>` : ''}</url>`;
  }).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(SITE, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /receitas/minha-lista/\n\nSitemap: ${cfg.site}/sitemap-receitas.xml\n`);
  const semImg = lista.filter((r) => !fs.existsSync(path.join(imgDir, `${r.s}.jpg`))).length;
  return {receitas: lista.length, paginas: lista.length + urls.length - lista.length + 1, semImagem: semImg};
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) console.log(gerar());
