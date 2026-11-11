// HTML do escritório /admin/escritorio. A cena (canvas), o quadro e o feed são desenhados no navegador
// (public/escritorio.js) a partir do estado inicial abaixo e ficam ao vivo pelo /admin/api/office/stream.
const fs = require('fs');
const path = require('path');
const brand = require('../brand');
let nav = null; // barra comum das telas do dono (lib/admin/nav.js), se existir
try { nav = require('../admin/nav'); } catch {}

const ver = (f) => { try { return Math.round(fs.statSync(path.join(__dirname, '../../public', f)).mtimeMs).toString(36); } catch { return '1'; } };
const mdVer = (() => { try { return Math.round(fs.statSync(path.join(__dirname, 'markdown.js')).mtimeMs).toString(36); } catch { return '1'; } })();
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, (c) => (c === '\u2028' ? '\\u2028' : '\\u2029'));

function render({ state, user }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Escritório | Agência do Zé</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="theme-color" content="${brand.COLORS.violet}" />
  <link rel="icon" href="${esc(brand.faviconDataUri)}" />
  <link rel="stylesheet" href="/fonts/fonts.css" />
  <link rel="stylesheet" href="/styles.css" />
  ${nav ? nav.CSS : ''}
  <link rel="stylesheet" href="/cockpit.css?v=${ver('cockpit.css')}" />
  <link rel="stylesheet" href="/escritorio.css?v=${ver('escritorio.css')}" />
  <script>try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body class="of">
  <header class="ck-top of-top">
    <div class="ck-top-in">
      <a class="ck-brand" href="/admin" aria-label="Voltar ao painel"><svg viewBox="0 0 64 64" aria-hidden="true">${brand.markPaths()}</svg></a>
      <div class="ck-title"><a class="ck-crumb" href="/admin">Painel</a><h1>Escritório da agência</h1></div>
      <div class="ck-actions">
        <button type="button" class="ck-btn ck-btn-ghost of-usage" id="usage" aria-live="polite" title="Rodadas e gasto de hoje. Clique para mudar o teto diário de gasto"></button>
        <button type="button" class="ck-btn of-kill" id="kill" aria-pressed="false"><span class="of-kill-dot"></span><span class="of-kill-t">Parar todos</span></button>
        <button type="button" class="ck-icon-btn" id="themeToggle" aria-label="Alternar tema claro/escuro"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button>
      </div>
    </div>
    ${nav ? nav.html('escritorio') : ''}
  </header>
  <div class="of-head">
    <div class="ck-bar of-bar">
      <div class="ck-seg of-tabs" role="tablist" aria-label="Visões do escritório">
        <button type="button" role="tab" data-view="office" aria-selected="true">Escritório</button>
        <button type="button" role="tab" data-view="inbox" aria-selected="false">Aprovar <span class="of-badge" id="inboxCount"${state.inbox_count ? '' : ' hidden'}>${state.inbox_count || ''}</span></button>
        <button type="button" role="tab" data-view="board" aria-selected="false">Quadro <span class="of-badge" id="reviewCount" hidden></span></button>
        <button type="button" role="tab" data-view="org" aria-selected="false">Organograma</button>
        <button type="button" role="tab" data-view="feed" aria-selected="false">Atividade</button>
        <button type="button" role="tab" data-view="pedidos" aria-selected="false">Conversa <span class="of-badge" id="convCount" hidden></span></button>
      </div>
      <span class="grow"></span>
      <div class="of-ger" id="gerente" aria-label="Modo do Gerente Geral"></div>
    </div>
    <form class="of-ask" id="ask" autocomplete="off" aria-label="Pedir ao time">
      <div class="of-ask-in">
        <svg class="ic of-ask-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <textarea name="text" rows="1" maxlength="8000" placeholder="Pedir ao time: escreva o que você precisa (abre uma conversa com o Diretor)…" aria-label="O que você precisa?"></textarea>
        <label class="of-ask-clip" title="Anexar arquivo"><input type="file" multiple name="files" hidden /><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg><span class="of-ask-n" hidden></span></label>
        <button type="submit" class="ck-btn ck-btn-primary ck-btn-sm">Enviar</button>
      </div>
    </form>
    <div id="banner"></div>
    <div class="of-gposts" id="gerPosts" aria-label="Posts aprovados pelo Gerente Geral que ainda vão sair"></div>
  </div>
  <main class="of-main" id="main">
    <nav class="of-subnav" id="subnav" aria-label="Visões do escritório">
      <button type="button" data-view="office" aria-pressed="true">Cena</button><button type="button" data-view="board" aria-pressed="false">Quadro</button><button type="button" data-view="org" aria-pressed="false">Organograma</button>
    </nav>
    <section class="of-view of-office" data-view="office">
      <div class="of-scene-wrap">
        <canvas id="scene" class="of-scene" role="img" aria-label="Escritório em pixel art: uma coluna por área (Direção, Marketing, Crescimento, Produto, Comercial e Finanças), com o gerente no alto de cada coluna e a equipe embaixo"></canvas>
        <div class="of-legend" aria-hidden="true">
          <span><i class="lg-working"></i>trabalhando</span><span><i class="lg-waiting"></i>esperando você</span>
          <span><i class="lg-idle"></i>livre</span><span><i class="lg-error"></i>erro</span><span><i class="lg-off"></i>fora</span>
          <span class="lg-sep"></span>${Object.values(state.teams || {}).map((t) => `<span><i class="lg-team" style="background:${esc(t.color)}"></i>${esc(t.short || t.name)}</span>`).join('')}
        </div>
      </div>
      <ul class="of-roster" id="roster" aria-label="Agentes"></ul>
    </section>
    <section class="of-view of-inbox" data-view="inbox" hidden aria-label="Caixa de aprovação"><div id="inbox" class="of-ib"><p class="of-empty">Carregando…</p></div></section>
    <section class="of-view of-pedidos" data-view="pedidos" hidden aria-label="Conversa com o time"><div id="pedidos" class="of-cw"><p class="of-empty">Carregando…</p></div></section>
    <section class="of-view of-board" data-view="board" hidden>
      <div class="of-board-bar">
        <button type="button" class="of-btn of-btn-primary" id="newTask"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Nova tarefa</button>
        <label class="of-filter">Agente <select id="boardFilter"><option value="">Todos</option></select></label>
        <div class="of-quick" role="group" aria-label="Filtros rápidos">
          <button type="button" class="of-btn of-needyou" id="needYou" aria-pressed="false" title="Só o que é sensível ou o Gerente deixou para você">Precisa de você <span class="of-badge" id="needYouCount" hidden></span></button>
          <button type="button" class="of-btn of-stale" id="staleOnly" aria-pressed="false" title="Só o que está em A fazer ou Fazendo sem nenhuma atividade há mais de 24 h">Paradas <span class="of-badge" id="staleCount" hidden></span></button>
        </div>
      </div>
      <div class="of-cols" id="board"></div>
    </section>
    <section class="of-view of-orgv" data-view="org" hidden>
      <div id="org"></div>
    </section>
    <section class="of-view of-feedv" data-view="feed" hidden>
      <div class="of-card">
        <div class="of-card-h"><h2><span class="of-live" id="liveDot"></span>Atividade ao vivo</h2><span class="of-feed-mode" id="feedMode">conectando…</span></div>
        <ol class="of-feed" id="feed"></ol>
      </div>
    </section>
    <aside class="of-side" aria-label="Atividade recente">
      <div class="of-card">
        <div class="of-card-h"><h2><span class="of-live" id="liveDot2"></span>Ao vivo</h2></div>
        <ol class="of-feed of-feed-mini" id="feedMini"></ol>
      </div>
    </aside>
  </main>
  <div class="of-scrim" id="scrim" hidden></div>
  <aside class="of-drawer" id="drawer" aria-label="Detalhes" aria-hidden="true" tabindex="-1"></aside>
  <nav class="of-tabbar" id="tabbar" aria-label="Navegação do escritório">
    <button type="button" data-tab="office" aria-current="page"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V7l8-4 8 4v14M9 21v-6h6v6"/></svg><span>Escritório</span></button>
    <button type="button" data-tab="inbox"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg><span>Aprovar</span><b class="of-badge" id="inboxCount2"${state.inbox_count ? '' : ' hidden'}>${state.inbox_count || ''}</b></button>
    <button type="button" data-tab="pedidos"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>Conversa</span><b class="of-badge" id="convCount2" hidden></b></button>
    <button type="button" data-tab="feed"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg><span>Feed</span></button>
  </nav>
  <div class="of-toasts" id="toasts" aria-live="polite"></div>
  <script>window.__OFFICE__=${json(state)};window.__ME__=${json({ email: user.email, name: user.name || '' })};</script>
  <script src="/escritorio-md.js?v=${mdVer}"></script>
  <script src="/escritorio.js?v=${ver('escritorio.js')}" type="module"></script>
  <script src="/escritorio-caixa.js?v=${ver('escritorio-caixa.js')}" type="module"></script>
  <script src="/escritorio-conversa.js?v=${ver('escritorio-conversa.js')}" type="module"></script>
</body>
</html>`;
}

module.exports = { render };
