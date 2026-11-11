// Escritório: "Caixa de aprovação" (tudo que espera o dono numa lista: tarefas em Revisão, posts aguardando e rascunhos com
// mídia da Central, respostas a comentários das redes e propostas de anúncio). "Pedir ao time" e a aba Conversa ficam em public/escritorio-conversa.js. Usa a ponte
// window.OfficeApp criada por public/escritorio.js (estado, API, toasts, gaveta, conversa). Atalhos da caixa: j/k navegar, a aprovar,
// r pedir ajuste, x marcar, e editar, Shift+A aprovar os marcados, ? ajuda.
const boot = () => {
  const O = window.OfficeApp;
  const { S, api, toast, esc, MD, agentOf, ink, initials, ago, fmt } = O;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const TYPE = { task: 'Tarefa', post: 'Post', kit: 'Postar no app', comentario: 'Comentário', ad: 'Anúncio', ad_budget: 'Orçamento' };
  const CLS = { duvida: 'Dúvida', elogio: 'Elogio', reclamacao: 'Reclamação', spam: 'Spam', outro: 'Outro' };
  const AREA = { direcao: 'Direção', marketing: 'Marketing', crescimento: 'Crescimento', produto: 'Produto', comercial: 'Comercial', financas: 'Finanças' };
  const teamColor = (k) => (S.teams && S.teams[k] && S.teams[k].color) || '#9a96ab';
  const isPhone = () => window.matchMedia('(max-width: 760px)').matches;

  // =====================================================================
  // Caixa de aprovação
  // =====================================================================
  const box = $('#inbox');
  const IB = { items: [], loaded: false, area: '', type: '', cur: null, sel: new Set(), editing: null, versions: {}, slide: {}, busy: false, open: false };
  const visible = () => IB.items.filter((i) => (!IB.area || i.area === IB.area) && (!IB.type || i.type === IB.type || (IB.type === 'ad' && i.type === 'ad_budget') || (IB.type === 'post' && i.type === 'kit')));
  // Kit: "Já postei" é um por vez; resposta já aprovada pelo Gerente (sai em 2 h): "Enviar já" ou "Barrar", uma por vez
  const selectable = (i) => i.type !== 'ad_budget' && i.type !== 'kit' && !(i.type === 'comentario' && i.pending_send);
  const isPost = (i) => i.type === 'post' || i.type === 'kit';
  const curItem = () => IB.items.find((i) => i.key === IB.cur) || null;

  function setBadge(n) {
    for (const id of ['inboxCount', 'inboxCount2']) { const b = document.getElementById(id); if (b) { b.hidden = !n; b.textContent = n || ''; } }
    S.inbox_count = n;
  }
  let loading = null;
  async function load({ quiet = false } = {}) {
    if (loading) return loading;
    loading = (async () => {
      try {
        const r = await api('/inbox');
        IB.items = r.items;
        IB.loaded = true;
        const keys = new Set(IB.items.map((i) => i.key));
        for (const k of [...IB.sel]) if (!keys.has(k)) IB.sel.delete(k);
        if (!keys.has(IB.cur)) IB.cur = (visible()[0] || {}).key || null;
        setBadge(IB.items.length);
        if (O.view === 'inbox') render();
      } catch (e) { if (!quiet) toast(e.message, true); } finally { loading = null; }
    })();
    return loading;
  }

  function chipsFilter() {
    const areas = Object.keys(AREA).filter((k) => IB.items.some((i) => i.area === k));
    const n = (f) => IB.items.filter(f).length;
    return `<div class="of-ib-filters" role="toolbar" aria-label="Filtros">
      <div class="ck-seg of-ib-seg" role="radiogroup" aria-label="Tipo">${[['', 'Tudo', n(() => true)], ['task', 'Tarefas', n((i) => i.type === 'task')], ['post', 'Posts', n(isPost)], ['comentario', 'Comentários', n((i) => i.type === 'comentario')], ['ad', 'Anúncios', n((i) => i.type === 'ad' || i.type === 'ad_budget')]]
        .map(([k, l, c]) => `<button type="button" role="radio" data-ftype="${k}" aria-checked="${IB.type === k}" class="${IB.type === k ? 'on' : ''}">${l}${c ? ` <small>${c}</small>` : ''}</button>`).join('')}</div>
      <label class="of-filter">Área <select data-farea><option value="">Todas</option>${areas.map((k) => `<option value="${k}"${IB.area === k ? ' selected' : ''}>${AREA[k]} (${n((i) => i.area === k)})</option>`).join('')}</select></label>
    </div>`;
  }
  const NET = { instagram: 'Instagram', facebook: 'Facebook', threads: 'Threads', youtube: 'YouTube', tiktok: 'TikTok' };
  const KIND = { imagem: 'Feed', carrossel: 'Carrossel', reels: 'Reels', video: 'Vídeo', short: 'Short', texto: 'Só texto', story: 'Story' };
  const when = (ms) => new Date(ms).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\.,?/, ',');
  // Texto corrido para o resumo da linha (sem marcação de Markdown)
  const plain = (src) => String(src || '').replace(/```[\s\S]*?```/g, ' ').replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, '').replace(/^\s*\|?[-:| ]+\|?\s*$/gm, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*~`]+|\b_+|_+\b/g, '').replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
  const firstLine = (src) => String(src || '').split('\n').map((l) => l.trim()).find(Boolean) || '';
  const ratio = (m, kind) => (kind === 'story' ? 9 / 16 : m && m.width && m.height ? Math.max(9 / 16, Math.min(1.91, m.width / m.height)) : kind === 'reels' || kind === 'short' ? 9 / 16 : 4 / 5);
  function thumbHtml(i) {
    if (!isPost(i)) return '';
    const m = (i.media || [])[0];
    const n = i.media_count || (i.media || []).length;
    if (!m) return '<span class="of-ib-th k-text" aria-hidden="true">Aa</span>';
    const src = m.thumb || (m.video ? '' : m.url);
    return `<span class="of-ib-th k-${esc(i.kind)}" style="--ar:${ratio(m, i.kind).toFixed(4)}">${src ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async"/>` : ''}${m.video ? '<i class="of-ib-play" aria-hidden="true"></i>' : ''}${n > 1 ? `<b class="of-ib-n" title="${n} slides"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="13" height="13" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></svg>${n}</b>` : ''}</span>`;
  }
  function row(i) {
    const a = agentOf(i.agent);
    const on = IB.sel.has(i.key);
    let title = i.title;
    let sub = '';
    if (isPost(i)) {
      const cap = String(i.caption || '');
      const fl = firstLine(cap);
      title = fl || i.title;
      sub = plain(fl ? cap.slice(cap.indexOf(fl) + fl.length) : '') || (i.kind === 'story' ? 'Story: o texto está na arte' : '');
      if (!sub && i.hashtags) sub = i.hashtags;
    } else if (i.type === 'task') {
      const t = (i.texts || [])[0];
      sub = plain(t ? t.content : i.description);
      if (sub.toLowerCase().startsWith(String(i.title).toLowerCase())) sub = sub.slice(String(i.title).length).trim();
      sub = sub.slice(0, 320);
    } else if (i.type === 'ad') sub = [i.budget_brl ? `${i.budget_brl}/dia` : '', i.objective || ''].filter(Boolean).join(' · ');
    else if (i.type === 'comentario') { title = `${whoC(i)}: ${i.text || i.title}`; sub = i.error ? `Erro no envio: ${i.error}` : i.reply ? `Resposta: ${i.reply}` : 'Sem resposta sugerida ainda'; }
    const chips = [`<span class="of-chip t-${i.type === 'kit' ? 'post' : i.type}${i.type === 'kit' ? ' sens' : ''}">${TYPE[i.type]}</span>`];
    if (i.draft) chips.push('<span class="of-chip draft" title="Rascunho da Central com mídia pronta: ninguém mandou para aprovação ainda">Rascunho</span>');
    if (i.type === 'post' && i.entrega === 'kit') chips.push('<span class="of-chip pre" title="Na hora marcada você posta pelo app com o áudio em alta">Kit</span>');
    if (i.type === 'comentario') {
      chips.push(`<span class="of-chip net n-${esc(i.network)}">${esc(NET[i.network] || i.network)}</span>`);
      if (i.classification) chips.push(`<span class="of-chip k">${esc(CLS[i.classification] || i.classification)}</span>`);
      if (i.pending_send) chips.push(`<span class="of-chip pre" title="Aprovada pelo Gerente: sai sozinha na hora marcada">sai ${esc(when(i.send_at))}</span>`);
      if (i.error) chips.push('<span class="of-chip sens">erro no envio</span>');
    } else if (isPost(i)) {
      chips.push(`<span class="of-chip k">${esc(KIND[i.kind] || i.kind)}</span>`);
      for (const n of i.networks || []) chips.push(`<span class="of-chip net n-${esc(n)}">${esc(NET[n] || n)}</span>`);
    } else chips.push(`<span class="of-team" style="--tc:${esc(teamColor(i.area))}">${esc(AREA[i.area] || i.area)}</span>`);
    if (i.sensitive) chips.push(`<span class="of-chip sens" title="${esc(i.sensitive_reason || '')}">${i.type === 'ad_budget' ? 'mais gasto' : 'sensível'}</span>`);
    if (i.pre_approved) chips.push('<span class="of-chip pre">pré-aprovado</span>');
    if ((i.problems || []).length) chips.push(`<span class="of-chip sens" title="${esc(i.problems.join(' '))}">não agenda</span>`);
    return `<li class="of-ib-it${i.key === IB.cur ? ' cur' : ''}${on ? ' sel' : ''}" data-key="${esc(i.key)}" style="--tc:${esc(teamColor(i.area))}">
      ${selectable(i) ? `<label class="of-ib-ck" aria-label="Marcar"><input type="checkbox" data-sel="${esc(i.key)}" ${on ? 'checked' : ''}/></label>` : '<span class="of-ib-ck"></span>'}
      <button type="button" class="of-ib-main" data-open="${esc(i.key)}">${thumbHtml(i)}
        <span class="of-ib-tx">
          <span class="of-ib-chips">${chips.join('')}</span>
          <span class="of-ib-t">${esc(title)}</span>
          ${sub ? `<span class="of-ib-x">${esc(sub)}</span>` : ''}
          <span class="of-ib-m">${i.type === 'post' ? `<span class="of-ib-when" title="Horário pedido">${i.scheduled_at ? `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>${esc(when(i.scheduled_at))}` : 'próximo horário livre'}</span>` : ''}
            ${a ? `<span class="of-ib-who"><i style="background:${esc(a.color)};color:${ink(a.color)}">${esc(initials(a.name))}</i>${esc(a.name)}</span>` : ''}<span class="of-ib-ago">${ago(i.at)}</span></span>
        </span>
      </button></li>`;
  }

  // ---------- Prévia ----------
  function editorHtml(kind, id, text) {
    return `<div class="of-ed" data-ed="${kind}:${id}">
      <div class="of-ed-panes"><label class="of-ed-l"><span>Texto (Markdown)</span><textarea data-ed-text spellcheck="true">${esc(text)}</textarea></label>
      <div class="of-ed-l"><span>Prévia</span><div class="md of-ed-prev" data-ed-prev>${MD.render(text)}</div></div></div>
      <div class="of-row"><button type="button" class="of-btn of-btn-ok of-btn-sm" data-ed-save="approve">Salvar e aprovar</button>
        <button type="button" class="of-btn of-btn-sm" data-ed-save="only">Salvar versão</button>
        <button type="button" class="of-btn of-btn-sm" data-ed-cancel>Cancelar</button>
        <span class="of-hint">Vira uma versão nova; a original fica no histórico.</span></div></div>`;
  }
  function versionsHtml(key) {
    const v = IB.versions[key];
    if (!v) return '';
    return `<ol class="of-vers">${v.map((x) => `<li><b>Versão ${x.version}</b> · ${x.agent_id === 'admin' || x.author === 'admin' ? 'você' : esc((agentOf(x.agent_id || x.author) || {}).name || x.agent_id || x.author || 'agente')} · ${fmt(x.created_at)}
      <details><summary>ver texto</summary><div class="md md-box">${MD.render(x.content ?? x.caption ?? '')}</div></details></li>`).join('')}</ol>`;
  }
  function decisionHtml(i) {
    if (i.type === 'comentario') {
      if (i.pending_send) {
        return `<div class="of-ib-act"><textarea class="of-ib-cm" data-cm="${esc(i.key)}" rows="2" maxlength="1000" placeholder="Motivo (opcional no Barrar)"></textarea>
          <div class="of-row"><button type="button" class="of-btn of-btn-ok" data-act="approve" data-key="${esc(i.key)}">Enviar agora</button>
          <button type="button" class="of-btn of-btn-warn" data-act="veto" data-key="${esc(i.key)}">Barrar</button></div>
          <p class="of-hint">Aprovada pelo Gerente Geral: sai sozinha ${esc(when(i.send_at))}. Barrar volta para você decidir.</p></div>`;
      }
      return `<div class="of-ib-act">
        <textarea class="of-ib-cm" data-cm="${esc(i.key)}" rows="2" maxlength="1000" placeholder="Comentário para a Comunidade (diga o que mudar no Pedir ajuste; motivo no Ignorar)"></textarea>
        <div class="of-row"><button type="button" class="of-btn of-btn-ok" data-act="approve" data-key="${esc(i.key)}">${i.error ? 'Tentar de novo' : 'Aprovar e enviar'} <kbd>a</kbd></button>
        <button type="button" class="of-btn of-btn-warn" data-act="changes" data-key="${esc(i.key)}">Pedir ajuste <kbd>r</kbd></button>
        <button type="button" class="of-btn" data-act="ignore" data-key="${esc(i.key)}">Ignorar</button></div>
        <p class="of-hint">Aprovar envia a resposta (com o texto da caixa acima, se você editou) pela API do ${esc(NET[i.network] || i.network)}. Nada é ocultado nem apagado na rede.</p></div>`;
    }
    if (i.type === 'kit') {
      return `<div class="of-ib-act">
        <input class="of-ib-cm" data-kit-link="${esc(i.key)}" type="url" inputmode="url" maxlength="500" placeholder="Link do post no Instagram/Facebook (opcional)"/>
        <div class="of-row"><button type="button" class="of-btn of-btn-ok" data-act="approve" data-key="${esc(i.key)}">Já postei <kbd>a</kbd></button>
        <a class="of-btn" href="/admin/social?post=${i.id}">Abrir o Kit na Central</a></div>
        <p class="of-hint">Marca como publicado. O link é opcional (aparece no histórico do post).</p></div>`;
    }
    if (i.type === 'ad_budget') {
      return `<div class="of-ib-act"><p class="of-hint"><b>Aumento de orçamento é risco alto:</b> aprove na tela de Anúncios (pede o código da verificação em duas etapas e "CONFIRMAR").</p>
        <a class="of-btn of-btn-primary" href="/admin/anuncios">Abrir em Anúncios</a></div>`;
    }
    return `<div class="of-ib-act">
      <textarea class="of-ib-cm" data-cm="${esc(i.key)}" rows="2" maxlength="2000" placeholder="${i.type === 'ad' ? 'Motivo (opcional; vai para a proposta)' : 'Comentário para o agente (opcional no Aprovar; diga o que mudar no Pedir ajuste)'}"></textarea>
      <div class="of-row"><button type="button" class="of-btn of-btn-ok" data-act="approve" data-key="${esc(i.key)}">${i.type === 'post' ? 'Aprovar e agendar' : i.type === 'ad' ? 'Aprovar proposta (fica pausada)' : 'Aprovar'} <kbd>a</kbd></button>
      <button type="button" class="of-btn of-btn-warn" data-act="changes" data-key="${esc(i.key)}">${i.type === 'ad' ? 'Rejeitar' : 'Pedir ajuste'} <kbd>r</kbd></button></div>
      ${i.type === 'ad' ? '<p class="of-hint">Aprovar <b>não</b> liga a campanha: ela fica pausada na Meta. Ativar é sempre separado, na tela de Anúncios, com "ATIVAR" digitado e o código da 2FA.</p>' : ''}
    </div>`;
  }
  function previewTask(i) {
    const a = agentOf(i.agent);
    const notes = [
      i.sensitive ? `<p class="of-ib-note sens"><b>Sensível:</b> ${esc(i.sensitive_reason || 'só você aprova')}</p>` : '',
      i.area_review_note ? `<p class="of-ib-note"><b>${i.pre_approved ? 'Pré-aprovado' : 'Comentário'} pela área:</b> ${MD.renderInline(i.area_review_note)}</p>` : '',
      i.review_note ? `<p class="of-ib-note"><b>Parecer do Gerente Geral:</b> ${MD.renderInline(i.review_note)}</p>` : '',
    ].join('');
    const texts = i.texts.map((x) => {
      const key = `art:${x.id}`;
      if (IB.editing === key) return `<div class="of-art"><div class="of-row"><span class="of-chip">Rascunho</span><b>${esc(x.label || '')}</b><span class="of-chip">editando</span></div>${editorHtml('art', x.id, x.content)}</div>`;
      return `<div class="of-art"><div class="of-row"><span class="of-chip">Rascunho</span><b>${esc(x.label || '')}</b>${x.version > 1 ? `<span class="of-chip ok">versão ${x.version} (sua)</span>` : ''}</div>
        <div class="md md-box">${MD.render(x.content)}</div>
        <div class="of-row"><button type="button" class="of-btn of-btn-sm" data-edit="${esc(key)}">Editar antes de aprovar <kbd>e</kbd></button>
          ${x.versions > 1 ? `<button type="button" class="of-btn of-btn-sm" data-vers="${esc(key)}">Histórico (${x.versions})</button>` : ''}
          <a class="of-btn of-btn-sm" href="/admin/escritorio/entrega/${x.id}" target="_blank" rel="noopener">Tela cheia</a></div>${versionsHtml(key)}</div>`;
    }).join('');
    const others = (i.others || []).map((x) => `<div class="of-art"><div class="of-row"><span class="of-chip">${esc({ post: 'Post na Central', anuncio: 'Proposta de anúncio', arquivo: 'Arquivo', link: 'Link' }[x.kind] || x.kind)}</span><b>${esc(x.label || '')}</b></div>
      ${O.href(x.url) ? `<a class="of-btn of-btn-sm" href="${O.href(x.url)}"${/^https?:/.test(x.url) ? ' target="_blank" rel="noopener"' : ''}>Abrir</a>` : ''}${x.path ? `<div>No Mac: <code>${esc(x.path)}</code></div>` : ''}</div>`).join('');
    const files = (i.files || []).length ? `<div><h3>Anexos</h3><ul class="of-files">${i.files.map((f) => `<li>${/^image\/(jpeg|png)$/.test(f.mime) ? `<a class="of-file-thumb" href="/admin/escritorio/arquivo/${f.id}" target="_blank" rel="noopener"><img src="${O.API}/files/${f.id}/download?inline=1" alt="" loading="lazy"/></a>` : `<span class="of-file-ic">${esc(O.ftype(f.mime))}</span>`}
      <span class="of-file-t"><b>${esc(f.name)}</b><small>${O.fsize(f.size)}</small></span><a class="of-btn of-btn-sm" href="/admin/escritorio/arquivo/${f.id}" target="_blank" rel="noopener">Ver</a></li>`).join('')}</ul></div>` : '';
    return `<div class="of-ib-h"><span class="of-chip t-task">Tarefa #${i.id}</span><span class="of-team" style="--tc:${esc(teamColor(i.area))}">${esc(AREA[i.area] || '')}</span>${a ? `<span class="of-ib-who"><i style="background:${esc(a.color)};color:${ink(a.color)}">${esc(initials(a.name))}</i>${esc(a.name)}</span>` : ''}<span class="of-ib-ago">${ago(i.at)}</span></div>
      <h2>${esc(i.title)}</h2>${notes}
      ${i.description ? `<details class="of-ib-desc"${i.texts.length ? '' : ' open'}><summary>Pedido / descrição</summary><div class="md">${MD.render(i.description)}</div></details>` : ''}
      ${texts}${others}${files}
      ${!i.texts.length && !i.others.length && !(i.files || []).length ? '<p class="of-hint">Sem entrega anexada: confira a descrição e a conversa.</p>' : ''}
      ${O.threadHtml(i.id)}
      <p><button type="button" class="linklike of-ib-link" data-task-open="${i.id}">Abrir a tarefa completa</button></p>`;
  }
  // Mídia do post: slide atual grande (carrossel com setas, contador e miniaturas), story em 9:16
  function viewerHtml(i) {
    const media = i.media || [];
    if (!media.length) return '';
    const n = media.length;
    const k = Math.max(0, Math.min(n - 1, IB.slide[i.key] || 0));
    const m = media[k];
    const ar = ratio(m, i.kind);
    const stage = m.video
      ? `<video src="${esc(m.url)}" ${m.thumb ? `poster="${esc(m.thumb)}"` : ''} controls preload="metadata" playsinline></video>`
      : `<a href="${esc(m.url)}" target="_blank" rel="noopener" title="Abrir em tamanho real"><img src="${esc(m.url)}" alt="${n > 1 ? `Slide ${k + 1} de ${n}` : 'Imagem do post'}" decoding="async"/></a>`;
    return `<div class="of-cv k-${esc(i.kind)}" data-cv="${esc(i.key)}" style="--ar:${ar.toFixed(4)}">
      <div class="of-cv-stage">${stage}
        ${n > 1 ? `<button type="button" class="of-cv-nav prev" data-slide="${k - 1}" ${k === 0 ? 'disabled' : ''} aria-label="Slide anterior"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>
          <button type="button" class="of-cv-nav next" data-slide="${k + 1}" ${k === n - 1 ? 'disabled' : ''} aria-label="Próximo slide"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg></button>
          <span class="of-cv-count" aria-live="polite">${k + 1}/${n}</span>` : ''}
      </div>
      ${n > 1 ? `<div class="of-cv-strip" role="tablist" aria-label="Slides">${media.map((x, j) => `<button type="button" role="tab" aria-selected="${j === k}" data-slide="${j}" aria-label="Slide ${j + 1}"${x.thumb || !x.video ? '' : ' class="v"'}>${x.thumb || !x.video ? `<img src="${esc(x.thumb || x.url)}" alt="" loading="lazy"/>` : ''}<span>${j + 1}</span></button>`).join('')}</div>` : ''}
    </div>`;
  }
  function setSlide(key, k) {
    const i = IB.items.find((x) => x.key === key);
    if (!i || !(i.media || []).length) return;
    IB.slide[key] = Math.max(0, Math.min(i.media.length - 1, k));
    const el = $(`[data-cv="${CSS.escape(key)}"]`, box);
    if (el) el.outerHTML = viewerHtml(i);
  }
  function previewPost(i) {
    const key = `post:${i.id}`;
    const a = agentOf(i.agent);
    const isText = !(i.media || []).length;
    const cap = String(i.caption || '');
    const capHtml = cap.trim()
      ? `<div class="md of-ib-cap${isText ? ' of-ib-cap-text' : ''}">${MD.render(cap)}</div>`
      : `<p class="of-hint">${i.kind === 'story' ? 'Story não leva legenda: o texto está na arte.' : 'Sem legenda.'}</p>`;
    const tags = String(i.hashtags || '').split(/\s+/).filter(Boolean);
    const limit = (i.networks || []).includes('threads') ? 500 : (i.networks || []).includes('instagram') ? 2200 : 0;
    const len = cap.length + (tags.length ? tags.join(' ').length + 2 : 0);
    const capBlock = IB.editing === key ? editorHtml('post', i.id, cap) : `${capHtml}
      ${tags.length ? `<p class="of-ib-tags">${tags.map((t) => `<span>${esc(t)}</span>`).join('')}</p>` : ''}
      <div class="of-row">${i.kind === 'story' && !cap.trim() ? '' : `<button type="button" class="of-btn of-btn-sm" data-edit="${esc(key)}">${isText ? 'Editar texto' : 'Editar legenda'} <kbd>e</kbd></button>`}${i.versions ? `<button type="button" class="of-btn of-btn-sm" data-vers="${esc(key)}">Histórico (${i.versions})</button>` : ''}
        ${limit && cap ? `<span class="of-hint of-ib-len${len > limit ? ' over' : ''}">${len}/${limit} caracteres</span>` : ''}</div>${versionsHtml(key)}`;
    return `<div class="of-ib-h"><span class="of-chip t-post">Post #${i.id}</span>${i.draft ? '<span class="of-chip draft">Rascunho</span>' : ''}<span class="of-chip k">${esc(KIND[i.kind] || i.kind)}${(i.media_count || 0) > 1 ? ` · ${i.media_count} slides` : ''}</span>${(i.networks || []).map((n) => `<span class="of-chip net n-${esc(n)}">${esc(NET[n] || n)}</span>`).join('')}
        ${a ? `<span class="of-ib-who"><i style="background:${esc(a.color)};color:${ink(a.color)}">${esc(initials(a.name))}</i>${esc(a.name)}</span>` : ''}<span class="of-ib-ago">${ago(i.at)}</span></div>
      <p class="of-ib-sched"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>${i.scheduled_at ? `<span>Horário pedido: <b>${esc(when(i.scheduled_at))}</b></span>` : '<span>Ao aprovar, entra no <b>próximo horário livre</b> da agenda.</span>'}</p>
      ${i.draft ? '<p class="of-ib-note"><b>Rascunho parado na Central:</b> a mídia já está pronta, mas ninguém mandou para aprovação. Aprovar aqui agenda direto; Pedir ajuste devolve ao agente com o seu comentário.</p>' : ''}
      ${(i.problems || []).length ? `<p class="of-ib-note sens"><b>Impede de agendar:</b> ${esc(i.problems.join(' '))}</p>` : ''}
      ${i.review_note ? `<p class="of-ib-note"><b>${i.reviewed_by === 'gerente' ? 'Parecer do Gerente Geral' : 'Nota'}:</b> ${esc(i.review_note)}</p>` : ''}
      ${i.destaque ? `<p class="of-ib-note"><b>Destaque:</b> depois de publicar, fixe no Destaque "${esc(i.destaque)}" pelo app.</p>` : ''}
      ${i.notes ? `<p class="of-ib-note"><b>Observação do agente:</b> ${esc(i.notes)}</p>` : ''}
      <div class="of-ib-post${isText ? ' text' : ''}">${viewerHtml(i)}
        <div class="of-ib-copy">
          ${i.title_text ? `<h3>Título</h3><p class="of-ib-ytt">${esc(i.title_text)}</p>` : ''}
          <h3>${isText ? 'Texto do post' : 'Legenda'}</h3>${capBlock}
          ${(i.warnings || []).length ? `<details class="of-ib-warn"><summary>Avisos (${i.warnings.length})</summary><ul>${i.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></details>` : ''}
          <p class="of-hint"><a href="/admin/social?post=${i.id}">Abrir na Central</a></p>
        </div>
      </div>`;
  }
  // Kit para postar (Instagram/Facebook com áudio em alta): o áudio, o passo a passo e os arquivos para baixar no celular
  const audioTxt = (a) => (a && a.nome ? a.nome : '');
  function kitNote(i) {
    const a = i.audio_sugerido;
    return `<p class="of-ib-note"><b>Entrega pelo Kit:</b> na hora marcada o Instagram/Facebook não publicam pela API; você recebe "Postar no app" e posta pelo celular${audioTxt(a) ? ` com o áudio <b>${esc(a.nome)}</b>` : ' (sem áudio sugerido ainda)'}.</p>`;
  }
  function kitHtml(i) {
    const a = i.audio_sugerido || {};
    const v = (i.media || []).find((m) => m.video) || (i.media || [])[0];
    const busca = a.nome ? a.nome.split('·')[0].trim() : 'um áudio em alta';
    return `<div class="of-ib-kit">
      <p class="of-ib-note sens"><b>Kit pronto:</b> poste pelo app em ${(i.kit_networks || []).map((n) => esc(NET[n] || n)).join(' e ') || 'Instagram'} e toque em "Já postei".</p>
      <p class="of-ib-note"><b>Áudio:</b> ${a.nome ? esc(a.nome) : 'escolha um áudio em alta no app'}${a.link ? ` · <a href="${esc(a.link)}" target="_blank" rel="noopener">abrir a página do áudio</a>` : ''}${a.notas ? `<br><small>${esc(a.notas)}</small>` : ''}<br><small>Se não achar: ${esc(a.alternativa || 'qualquer áudio em alta instrumental, sem voz cantada por cima da narração')}.</small></p>
      <ol class="of-ib-steps"><li>Baixe o vídeo${v ? ` (<a href="${esc(v.url)}" download>vídeo</a>${v.thumb ? ` · <a href="${esc(v.thumb)}" download>capa</a>` : ''})` : ''} e copie a legenda abaixo.</li>
        <li>Instagram → <b>Reels</b> → selecione o vídeo → <b>Áudio</b> → busque "${esc(busca)}".</li>
        <li>Volume do áudio em <b>10–20%</b> (não cobrir a narração) → cole a legenda → capa = primeiro quadro → <b>Compartilhar</b>.</li>
        ${(i.kit_networks || []).includes('facebook') ? '<li>Facebook: Reels → mesmo vídeo, mesmo áudio e legenda → Compartilhar.</li>' : ''}</ol></div>`;
  }
  function previewAd(i) {
    if (i.type === 'ad_budget') {
      return `<div class="of-ib-h"><span class="of-chip t-ad">Orçamento</span><span class="of-team" style="--tc:${esc(teamColor('crescimento'))}">Crescimento</span><span class="of-ib-ago">${ago(i.at)}</span></div>
        <h2>${esc(i.title)}</h2><p>De <b>${esc(i.from_brl || '—')}</b> para <b>${esc(i.to_brl || '—')}</b> por dia.</p>`;
    }
    const sp = i.spec || {};
    const line = (k, v) => (v ? `<li><b>${k}:</b> ${esc(typeof v === 'string' ? v : JSON.stringify(v)).slice(0, 600)}</li>` : '');
    return `<div class="of-ib-h"><span class="of-chip t-ad">Proposta de anúncio #${i.id}</span><span class="of-team" style="--tc:${esc(teamColor('crescimento'))}">Crescimento</span><span class="of-ib-ago">${ago(i.at)}</span></div>
      <h2>${esc(i.title)}</h2>
      <ul class="of-ib-spec">${line('Objetivo', i.objective)}${line('Orçamento por dia', i.budget_brl)}${line('Público', sp.audience)}${line('Posicionamentos', sp.placements)}${line('Criativo', sp.creative)}${line('Link', sp.url)}</ul>
      ${i.notes ? `<div class="md md-box">${MD.render(i.notes)}</div>` : ''}${i.last_error ? `<p class="of-ib-note sens">${esc(i.last_error)}</p>` : ''}
      <p><a class="of-btn of-btn-sm" href="/admin/anuncios">Abrir em Anúncios (ativar fica lá)</a></p>`;
  }
  // Comentário das redes: post (miniatura e legenda curta), autor, comentário e a resposta sugerida (editável)
  const whoC = (i) => (i.author && i.author.username ? `@${i.author.username}` : (i.author && i.author.name) || 'Anônimo');
  function previewComment(i) {
    const a = agentOf(i.agent);
    const p = i.post;
    const len = String(i.reply || '').length;
    return `<div class="of-ib-h"><span class="of-chip t-comentario">Comentário #${i.id}</span><span class="of-chip net n-${esc(i.network)}">${esc(NET[i.network] || i.network)}</span>${i.classification ? `<span class="of-chip k">${esc(CLS[i.classification] || i.classification)}</span>` : ''}
        ${a ? `<span class="of-ib-who"><i style="background:${esc(a.color)};color:${ink(a.color)}">${esc(initials(a.name))}</i>${esc(a.name)}</span>` : ''}<span class="of-ib-ago">${ago(i.at)}</span></div>
      ${i.sensitive ? `<p class="of-ib-note sens"><b>Sensível:</b> ${esc(i.sensitive_reason || 'só você aprova')}. O Gerente Geral não aprova este.</p>` : ''}
      ${i.error ? `<p class="of-ib-note sens"><b>Erro no envio${i.attempts > 1 ? ` (${i.attempts} tentativas)` : ''}:</b> ${esc(i.error)}</p>` : ''}
      ${i.review_note ? `<p class="of-ib-note"><b>${i.reviewed_by === 'gerente' ? 'Parecer do Gerente Geral' : 'Nota'}:</b> ${esc(i.review_note)}</p>` : ''}
      ${p ? `<a class="of-ib-cpost" href="/admin/social?post=${p.id}">${p.thumb ? `<img src="${esc(p.thumb)}" alt="" loading="lazy"/>` : '<span class="of-ib-th k-text" aria-hidden="true">Aa</span>'}<span><small>Post #${p.id}</small>${esc(p.caption || 'Sem legenda')}</span></a>` : ''}
      <blockquote class="of-ib-cmt"><b>${esc(whoC(i))}</b>${i.author && i.author.username && i.author.name ? ` <small>${esc(i.author.name)}</small>` : ''}<span>${esc(i.text || '(texto apagado pela faxina de 90 dias)')}</span>${i.commented_at ? `<small>${esc(when(i.commented_at))}</small>` : ''}</blockquote>
      <label class="of-ib-reply-l"><span>Resposta sugerida${i.agent ? ' pela Comunidade' : ''} (edite antes de aprovar, se quiser)</span>
        <textarea class="of-ib-reply" data-reply="${esc(i.key)}" rows="4" maxlength="${i.reply_max || 2200}" ${i.pending_send ? 'readonly' : ''}>${esc(i.reply || '')}</textarea>
        <small class="of-hint" data-reply-len="${esc(i.key)}">${len}/${i.reply_max || 2200} caracteres</small></label>
      ${i.hide_suggested ? '<p class="of-ib-note"><b>Parece spam:</b> se quiser, oculte pelo app da rede (a Central nunca oculta nem apaga sozinha).</p>' : ''}`;
  }
  function previewHtml(i) {
    if (!i) return `<div class="of-ib-zero"><h2>${IB.items.length ? 'Escolha um item' : 'Nada esperando você'}</h2><p>${IB.items.length ? 'Use j/k para navegar.' : 'Quando um agente mandar algo para aprovar, aparece aqui.'}</p></div>`;
    const body = i.type === 'task' ? previewTask(i) : i.type === 'comentario' ? previewComment(i) : i.type === 'kit' ? kitHtml(i) + previewPost(i) : i.type === 'post' ? (i.entrega === 'kit' ? kitNote(i) : '') + previewPost(i) : previewAd(i);
    return `${isPhone() ? '<div class="of-ib-sheet-h"><button type="button" class="of-btn of-btn-sm" data-close-prev>← Voltar</button></div>' : ''}<div class="of-ib-body">${body}</div>${decisionHtml(i)}`;
  }

  function render() {
    if (!IB.loaded) { box.innerHTML = '<p class="of-empty">Carregando…</p>'; return; }
    const keep = document.activeElement && box.contains(document.activeElement) && /TEXTAREA|INPUT/.test(document.activeElement.tagName) ? document.activeElement : null;
    if (keep && keep.closest('.of-ib-prev')) { renderList(); return; } // escrevendo na prévia: só a lista muda
    const list = visible();
    const nSel = IB.sel.size;
    box.innerHTML = `<div class="of-ib-side">
        <div class="of-ib-top">${chipsFilter()}
          <div class="of-ib-bulk${nSel ? ' on' : ''}">
            <label class="of-ib-all"><input type="checkbox" data-all ${nSel && list.filter(selectable).every((i) => IB.sel.has(i.key)) ? 'checked' : ''}/> ${nSel ? `${nSel} marcado${nSel > 1 ? 's' : ''}` : 'Marcar todos'}</label>
            <input class="of-ib-bcm" data-bulk-cm type="text" maxlength="2000" placeholder="Comentário para todos (opcional)" ${nSel ? '' : 'hidden'}/>
            <button type="button" class="of-btn of-btn-ok of-btn-sm" data-bulk="approve" ${nSel ? '' : 'disabled'}>Aprovar selecionados</button>
            <button type="button" class="of-btn of-btn-warn of-btn-sm" data-bulk="changes" ${nSel ? '' : 'disabled'}>Pedir ajuste</button>
          </div>
        </div>
        <ul class="of-ib-list" id="ibList">${list.length ? list.map(row).join('') : `<li class="of-empty">${IB.items.length ? 'Nada com esse filtro.' : 'Tudo em dia: nada esperando você.'}</li>`}</ul>
        <p class="of-ib-keys"><kbd>j</kbd>/<kbd>k</kbd> navegar · <kbd>a</kbd> aprovar · <kbd>r</kbd> ajuste · <kbd>x</kbd> marcar · <kbd>e</kbd> editar · <kbd>⇧A</kbd> aprovar marcados</p>
      </div>
      <section class="of-ib-prev${IB.open ? ' open' : ''}" aria-label="Prévia" tabindex="-1">${previewHtml(curItem())}</section>`;
    fitTop();
    const c = $('.of-ib-it.cur', box);
    if (c && !isPhone()) c.scrollIntoView({ block: 'nearest' });
  }
  // A caixa cabe na tela do computador: lista e prévia rolam por dentro (altura = janela − o que está acima)
  function fitTop() { box.style.setProperty('--ib-top', `${Math.max(0, Math.round(box.getBoundingClientRect().top + window.scrollY))}px`); }
  window.addEventListener('resize', () => { if (O.view === 'inbox') fitTop(); });
  function renderList() {
    const ul = $('#ibList', box);
    if (!ul) return render();
    ul.innerHTML = visible().map(row).join('') || '<li class="of-empty">Nada com esse filtro.</li>';
  }
  function renderPreview() {
    const p = $('.of-ib-prev', box);
    if (!p) return render();
    p.innerHTML = previewHtml(curItem());
    p.classList.toggle('open', IB.open);
    p.scrollTop = 0;
    $$('.of-ib-it', box).forEach((li) => li.classList.toggle('cur', li.dataset.key === IB.cur));
    const t = $('.of-thread', p); if (t) t.scrollTop = t.scrollHeight;
  }
  function select(key, { open = true } = {}) {
    if (IB.editing && IB.cur !== key && !confirm('Descartar a edição que não foi salva?')) return;
    if (IB.cur !== key) IB.editing = null;
    IB.cur = key;
    if (open && isPhone()) { IB.open = true; document.body.classList.add('of-lock'); }
    renderPreview();
    if (!isPhone()) { const c = $('.of-ib-it.cur', box); if (c) c.scrollIntoView({ block: 'nearest' }); }
  }
  function closeSheet() { IB.open = false; document.body.classList.remove('of-lock'); const p = $('.of-ib-prev', box); if (p) p.classList.remove('open'); }
  function move(d) {
    const list = visible();
    if (!list.length) return;
    let i = list.findIndex((x) => x.key === IB.cur);
    i = Math.max(0, Math.min(list.length - 1, (i < 0 ? 0 : i + d)));
    select(list[i].key, { open: false });
  }

  // ---------- Ações ----------
  async function rawJson(url, body) {
    const r = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || `Erro ${r.status}`), { code: j.code, url: j.url, status: r.status });
    return j;
  }
  async function decide(i, action, comment) {
    if (i.type === 'task') return api(`/tasks/${i.id}/action`, { method: 'POST', body: JSON.stringify({ action: action === 'approve' ? 'approve' : 'reject', feedback: comment || '' }) });
    if (i.type === 'post') return api(`/inbox/posts/${i.id}`, { method: 'POST', body: JSON.stringify({ action, comment: comment || '' }) });
    if (i.type === 'comentario') {
      const el = $(`[data-reply="${CSS.escape(i.key)}"]`, box);
      const reply = el && action === 'approve' && el.value.trim() !== String(i.reply || '').trim() ? el.value : undefined;
      return api(`/inbox/comentarios/${i.id}`, { method: 'POST', body: JSON.stringify({ action, comment: comment || '', ...(reply !== undefined ? { reply } : {}) }) });
    }
    if (i.type === 'ad') return rawJson(`/admin/api/ads/campaigns/${i.id}/${action === 'approve' ? 'approve' : 'reject'}`, action === 'approve' ? {} : { reason: comment || '' });
    if (i.type === 'kit') { const el = $(`[data-kit-link="${CSS.escape(i.key)}"]`, box); return action === 'approve' ? api(`/inbox/posts/${i.id}/kit`, { method: 'POST', body: JSON.stringify({ permalink: el ? el.value.trim() : '' }) }) : Promise.reject(new Error('Kit: use "Já postei" ou abra na Central.')); }
    throw new Error('Este item se aprova na própria tela.');
  }
  async function act(keys, action, comment) {
    const items = keys.map((k) => IB.items.find((i) => i.key === k)).filter((i) => i && (selectable(i) || ((i.type === 'kit' || i.type === 'comentario') && keys.length === 1)));
    if (!items.length) return;
    if (action === 'changes' && !comment && !confirm(items.length > 1 ? `Pedir ajuste em ${items.length} itens sem comentário? Os agentes não vão saber o que mudar.` : 'Pedir ajuste sem comentário? O agente não vai saber o que mudar.')) return false;
    IB.busy = true;
    let ok = 0;
    const fails = [];
    for (const [n, i] of items.entries()) {
      if (items.length > 1) toast(`${action === 'approve' ? 'Aprovando' : action === 'ignore' ? 'Ignorando' : 'Pedindo ajuste'} ${n + 1} de ${items.length}…`);
      try { await decide(i, action, comment); ok++; IB.sel.delete(i.key); IB.items = IB.items.filter((x) => x.key !== i.key); }
      catch (e) { if (!O.stepUp(e)) fails.push(`${TYPE[i.type]} "${i.title.slice(0, 40)}": ${e.message}`); }
    }
    IB.busy = false;
    if (ok) toast(action === 'approve' ? `${ok} aprovado${ok > 1 ? 's' : ''}.` : action === 'ignore' ? `${ok} ignorado${ok > 1 ? 's' : ''}.` : action === 'veto' ? 'Barrado: voltou para você decidir.' : `Ajuste pedido em ${ok} item${ok > 1 ? 's' : ''}.`);
    if (fails.length) toast(`Não deu em ${fails.length}: ${fails.join(' · ')}`, true);
    if (!IB.items.some((x) => x.key === IB.cur)) { IB.cur = (visible()[0] || {}).key || null; IB.editing = null; if (isPhone()) closeSheet(); }
    setBadge(IB.items.length);
    render();
    load({ quiet: true });
    return true;
  }
  async function saveEdit(edKey, andApprove) {
    const ed = $(`[data-ed="${edKey}"]`, box);
    if (!ed) return;
    const text = $('[data-ed-text]', ed).value;
    if (!text.trim()) return toast('O texto não pode ficar vazio.', true);
    const [kind, id] = edKey.split(':');
    $$('button', ed).forEach((b) => { b.disabled = true; });
    try {
      if (kind === 'art') {
        const r = await api(`/artifacts/${id}/edit`, { method: 'POST', body: JSON.stringify({ content: text }) });
        IB.versions[`art:${id}`] = null;
        const it = IB.items.find((x) => x.type === 'task' && x.texts.some((t) => String(t.id) === id));
        if (it) it.texts = it.texts.map((t) => (String(t.id) === id ? { ...t, id: r.artifact.id, content: text, version: r.artifact.version, versions: r.versions.length } : t));
      } else {
        const r = await api(`/inbox/posts/${id}/caption`, { method: 'POST', body: JSON.stringify({ caption: text }) });
        const it = IB.items.find((x) => x.key === `post:${id}`);
        if (it) { it.caption = r.post.caption; it.versions = r.versions.length; it.problems = r.post.problems || it.problems; }
        IB.versions[`post:${id}`] = null;
      }
      IB.editing = null;
      toast('Edição salva como versão nova.');
      const cur = curItem();
      if (andApprove && cur) await act([cur.key], 'approve', ($(`[data-cm="${CSS.escape(cur.key)}"]`, box) || {}).value || '');
      else renderPreview();
    } catch (e) { if (!O.stepUp(e)) toast(e.message, true); $$('button', ed).forEach((b) => { b.disabled = false; }); }
  }
  async function showVersions(key) {
    if (IB.versions[key]) { IB.versions[key] = null; return renderPreview(); }
    const [kind, id] = key.split(':');
    try {
      const r = kind === 'art' ? await api(`/artifacts/${id}/versions`) : await api(`/inbox/posts/${id}/versions`);
      IB.versions[key] = r.versions.slice().reverse();
      renderPreview();
    } catch (e) { toast(e.message, true); }
  }
  function startEdit() {
    const i = curItem();
    if (!i) return;
    if (i.type === 'comentario') { const ta = $(`[data-reply="${CSS.escape(i.key)}"]`, box); if (ta && !ta.readOnly) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } return; }
    const key = i.type === 'post' ? `post:${i.id}` : i.type === 'task' && i.texts[0] ? `art:${i.texts[0].id}` : null;
    if (!key) return toast(i.type === 'task' ? 'Esta tarefa não tem entrega em texto para editar.' : 'Anúncio se edita na tela de Anúncios.', true);
    IB.editing = key;
    renderPreview();
    const ta = $('[data-ed-text]', box); if (ta) { ta.focus(); ta.setSelectionRange(0, 0); }
  }

  // ---------- Eventos ----------
  box.addEventListener('click', (e) => {
    const t = e.target;
    const b = t.closest('button, a, input');
    if (!b) return;
    if (b.matches('[data-sel]')) { if (b.checked) IB.sel.add(b.dataset.sel); else IB.sel.delete(b.dataset.sel); return render(); }
    if (b.matches('[data-all]')) { const list = visible().filter(selectable); if (b.checked) list.forEach((i) => IB.sel.add(i.key)); else IB.sel.clear(); return render(); }
    if (b.dataset.open) return select(b.dataset.open);
    if (b.dataset.slide !== undefined) { const cv = b.closest('[data-cv]'); if (cv) setSlide(cv.dataset.cv, Number(b.dataset.slide)); return; }
    if (b.dataset.ftype !== undefined) { IB.type = b.dataset.ftype; IB.sel.clear(); if (!visible().some((i) => i.key === IB.cur)) IB.cur = (visible()[0] || {}).key || null; return render(); }
    if (b.hasAttribute('data-close-prev')) return closeSheet();
    if (b.dataset.taskOpen) return O.openTask(Number(b.dataset.taskOpen));
    if (b.dataset.edit) { IB.editing = b.dataset.edit; renderPreview(); const ta = $('[data-ed-text]', box); if (ta) ta.focus(); return; }
    if (b.hasAttribute('data-ed-cancel')) { IB.editing = null; return renderPreview(); }
    if (b.dataset.edSave) return saveEdit(b.closest('[data-ed]').dataset.ed, b.dataset.edSave === 'approve');
    if (b.dataset.vers) return showVersions(b.dataset.vers);
    if (b.dataset.act) { const cm = $(`[data-cm="${CSS.escape(b.dataset.key)}"]`, box); return act([b.dataset.key], b.dataset.act, cm ? cm.value.trim() : ''); }
    if (b.dataset.bulk) { const cm = $('[data-bulk-cm]', box); return act([...IB.sel], b.dataset.bulk, cm ? cm.value.trim() : ''); }
  });
  box.addEventListener('change', (e) => { if (e.target.matches('[data-farea]')) { IB.area = e.target.value; IB.sel.clear(); if (!visible().some((i) => i.key === IB.cur)) IB.cur = (visible()[0] || {}).key || null; render(); } });
  // Prévia ao vivo do editor
  let raf = 0;
  box.addEventListener('input', (e) => {
    if (e.target.matches('[data-reply]')) { const c = $(`[data-reply-len="${CSS.escape(e.target.dataset.reply)}"]`, box); if (c) c.textContent = `${e.target.value.length}/${e.target.maxLength} caracteres`; return; }
    if (!e.target.matches('[data-ed-text]')) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { const prev = $('[data-ed-prev]', e.target.closest('[data-ed]')); if (prev) prev.innerHTML = MD.render(e.target.value); });
  });
  // Atalhos (só na aba Aprovar, sem gaveta aberta e fora de campos de texto)
  document.addEventListener('keydown', (e) => {
    if (O.view !== 'inbox' || O.drawerOpen || e.metaKey || e.ctrlKey || e.altKey || IB.busy) return;
    const el = document.activeElement;
    const typing = el && (/^(TEXTAREA|SELECT)$/.test(el.tagName) || (el.tagName === 'INPUT' && !/checkbox|radio|button/.test(el.type)) || el.isContentEditable);
    if (typing) {
      if (e.key === 'Escape') { el.blur(); e.preventDefault(); }
      // no comentário da prévia: Enter (sem Shift) depois de "r" manda o ajuste
      else if (e.key === 'Enter' && !e.shiftKey && el.matches('[data-cm]') && el.dataset.pending === 'changes') { e.preventDefault(); delete el.dataset.pending; act([el.dataset.cm], 'changes', el.value.trim()); }
      return;
    }
    const k = e.key;
    if (k === 'j' || k === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (k === 'k' || k === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (k === 'A' && e.shiftKey) { if (IB.sel.size) { e.preventDefault(); act([...IB.sel], 'approve', (($('[data-bulk-cm]', box) || {}).value || '').trim()); } }
    else if (k === 'a') { const i = curItem(); if (i && selectable(i)) { e.preventDefault(); act([i.key], 'approve', (($(`[data-cm="${CSS.escape(i.key)}"]`, box) || {}).value || '').trim()); } }
    else if (k === 'r') {
      const i = curItem(); if (!i || !selectable(i)) return;
      e.preventDefault();
      const cm = $(`[data-cm="${CSS.escape(i.key)}"]`, box);
      if (cm && cm.value.trim()) return act([i.key], 'changes', cm.value.trim());
      if (cm) { cm.dataset.pending = 'changes'; cm.placeholder = 'Diga o que ajustar e aperte Enter (Esc cancela)'; cm.focus(); }
    } else if (k === 'x') { const i = curItem(); if (i && selectable(i)) { e.preventDefault(); if (IB.sel.has(i.key)) IB.sel.delete(i.key); else IB.sel.add(i.key); render(); } }
    else if (k === 'e') { e.preventDefault(); startEdit(); }
    else if (k === 'ArrowLeft' || k === 'ArrowRight') { const i = curItem(); if (i && (i.media || []).length > 1) { e.preventDefault(); setSlide(i.key, (IB.slide[i.key] || 0) + (k === 'ArrowRight' ? 1 : -1)); } }
    else if (k === 'Enter' && isPhone()) { const i = curItem(); if (i) select(i.key); }
    else if (k === '?') { e.preventDefault(); toast('Atalhos: j/k navegar · a aprovar · r pedir ajuste · x marcar · e editar · Shift+A aprovar os marcados'); }
  });

  // =====================================================================
  // Ligações com o resto do escritório
  // =====================================================================
  let refreshT = 0;
  const soon = () => { clearTimeout(refreshT); refreshT = setTimeout(() => load({ quiet: true }), 700); };
  window.addEventListener('office:view', (e) => {
    if (e.detail === 'inbox') { if (!IB.loaded) render(); load(); }
    if (e.detail !== 'inbox' && IB.open) closeSheet();
  });
  window.addEventListener('office:task', (e) => {
    const t = e.detail || {};
    if (t.status === 'review' || IB.items.some((i) => i.key === `task:${t.id}`) || t.deleted) soon();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load({ quiet: true }); });
  window.addEventListener('resize', () => { if (!isPhone() && IB.open) closeSheet(); });
  setInterval(() => { if (!document.hidden) load({ quiet: true }); }, 120000); // posts, comentários e anúncios não chegam pelo SSE do escritório
  if (O.view === 'inbox') load(); else load({ quiet: true });
};
if (window.OfficeApp) boot(); else window.addEventListener('office:ready', boot, { once: true });
