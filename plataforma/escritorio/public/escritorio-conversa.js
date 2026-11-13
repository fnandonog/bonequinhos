// Escritório: aba "Conversa" (pedidos do dono como um app de mensagens) e a caixa "Pedir ao time" do topo.
// Cada pedido é uma tarefa do Diretor com a etiqueta pedido-do-dono (POST /pedidos); a conversa junta o texto do pedido, as
// mensagens (POST /tasks/:id/comments: o agendador do Mac acorda o Diretor pela mensagem nova), os anexos e linhas discretas
// com o que aconteceu nas partes (sub-tarefas). Ao vivo pelo SSE do escritório (eventos office:* de public/escritorio.js).
// Lista à esquerda e conversa à direita no computador; no celular, lista e conversa em tela cheia com "voltar".
const boot = () => {
  const O = window.OfficeApp;
  const { S, api, toast, esc, MD, agentOf, ink, initials, fmt } = O;
  const $ = (s, el = document) => el.querySelector(s);
  const box = $('#pedidos');
  if (!box) return;
  const TAG = S.pedido_tag || 'pedido-do-dono';
  const isPedido = (t) => (t.tags || []).includes(TAG);
  const isPhone = () => window.matchMedia('(max-width: 760px)').matches;
  const TZ = 'America/Sao_Paulo';

  // Estado: pedidos antigos que não vêm no estado inicial (GET /pedidos), detalhes de cada conversa aberta e o que está na tela
  const C = { extra: new Map(), detail: new Map(), cur: null, isNew: false, open: false, staged: [], listLoaded: false };

  // "Não lida": mensagem de agente depois da última vez que o dono abriu a conversa (marca guardada neste navegador)
  const SEEN_KEY = 'of-conv-seen';
  let seen = {};
  try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {}; } catch { seen = {}; }
  function markSeen(id) {
    seen[id] = Date.now();
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch {}
  }
  const agentAt = (t) => {
    const lc = t.last_comment;
    return Math.max(t.agent_last_at || 0, lc && lc.author !== 'admin' ? lc.created_at : 0);
  };
  const unread = (t) => {
    const a = agentAt(t);
    if (!a) return false;
    const mark = seen[t.id] || t.owner_last_at || t.created_at || 0;
    return a > mark;
  };

  // ---------- Dados ----------
  function pedidos() {
    const map = new Map(C.extra);
    for (const t of S.tasks) if (isPedido(t)) map.set(t.id, t);
    return [...map.values()].sort((a, b) => lastAt(b) - lastAt(a));
  }
  const lastAt = (t) => Math.max(t.updated_at || 0, (t.last_comment && t.last_comment.created_at) || 0, t.created_at || 0);
  const taskById = (id) => S.tasks.find((x) => x.id === id) || C.extra.get(id) || (C.detail.get(id) || {}).task || null;
  const kidsOf = (t) => {
    const d = C.detail.get(t.id);
    const fromS = S.tasks.filter((x) => x.parent_id === t.id);
    const list = d && d.children ? d.children.slice() : (t.children || []).slice();
    for (const k of fromS) { const i = list.findIndex((x) => x.id === k.id); if (i >= 0) list[i] = { ...list[i], ...k }; else list.push(k); }
    return list;
  };
  function state(t) {
    if (t.status === 'done') return ['done', 'Concluído'];
    if (t.status === 'review') return ['you', 'Esperando você'];
    if (kidsOf(t).some((k) => k.status === 'review')) return ['you', 'Parte esperando você'];
    return ['doing', 'Em andamento'];
  }
  async function loadList() {
    try {
      const r = await api('/pedidos');
      C.extra = new Map(r.pedidos.filter((t) => !S.tasks.some((x) => x.id === t.id)).map((t) => [t.id, t]));
    } catch (e) { toast(e.message, true); }
    C.listLoaded = true;
    renderList();
    badge();
  }
  async function loadDetail(id) {
    try {
      const r = await api(`/tasks/${id}`);
      C.detail.set(id, { task: r.task, events: r.events || [], children: r.children || [] });
      O.threads.set(id, r.comments || []);
      return true;
    } catch (e) { toast(e.message, true); return false; }
  }

  // ---------- Formatos ----------
  const dayKey = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: TZ });
  const hhmm = (ms) => new Date(ms).toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  function dayLabel(ms) {
    const k = dayKey(ms);
    if (k === dayKey(Date.now())) return 'Hoje';
    if (k === dayKey(Date.now() - 86400000)) return 'Ontem';
    return new Date(ms).toLocaleDateString('pt-BR', { timeZone: TZ, weekday: 'long', day: '2-digit', month: '2-digit' });
  }
  function rel(ms) {
    if (!ms) return '';
    const s = (Date.now() - ms) / 1000;
    if (s < 60) return 'agora';
    if (s < 3600) return `${Math.floor(s / 60)} min`;
    if (dayKey(ms) === dayKey(Date.now())) return hhmm(ms);
    if (dayKey(ms) === dayKey(Date.now() - 86400000)) return 'ontem';
    return new Date(ms).toLocaleDateString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit' });
  }
  const who = (id) => (id === 'admin' ? 'Você' : (agentOf(id) || {}).name || id || 'alguém');
  const oneLine = (s) => String(s || '').replace(/[#*_`>|[\]]+/g, ' ').replace(/\s+/g, ' ').trim();
  const avatar = (id, cls = '') => {
    if (id === 'admin') return `<span class="of-cw-av admin ${cls}" aria-hidden="true">EU</span>`;
    const a = agentOf(id);
    return `<span class="of-cw-av ${cls}" style="background:${esc(a ? a.color : '#9a96ab')};color:${ink(a ? a.color : '#9a96ab')}" aria-hidden="true">${esc(initials(a ? a.name : id))}</span>`;
  };

  // ---------- Lista de conversas ----------
  function itemHtml(t) {
    const lc = t.last_comment;
    const [cls, label] = state(t);
    const kids = kidsOf(t);
    const done = kids.filter((k) => k.status === 'done').length;
    const un = unread(t);
    const prev = lc ? `<b>${esc(who(lc.author))}:</b> ${esc(oneLine(lc.body).slice(0, 140))}` : `<b>Você:</b> ${esc(oneLine(t.description || t.title).slice(0, 140))}`;
    return `<li><button type="button" class="of-cw-it${t.id === C.cur && !C.isNew ? ' cur' : ''}${un ? ' unread' : ''}" data-conv="${t.id}"${t.id === C.cur && !C.isNew ? ' aria-current="true"' : ''}>
      ${avatar(t.assignee || 'diretor')}
      <span class="of-cw-it-tx">
        <span class="of-cw-it-r"><b class="of-cw-it-t">${esc(t.title)}</b><time datetime="${new Date(lastAt(t)).toISOString()}">${esc(rel(lastAt(t)))}</time></span>
        <span class="of-cw-it-r"><span class="of-cw-prev">${prev}</span>${un ? '<i class="of-cw-dot" aria-label="Mensagem nova"></i>' : ''}</span>
        <span class="of-cw-it-m"><span class="of-ped-st st-${cls}">${esc(label)}</span>${kids.length ? `<small>${done}/${kids.length} parte${kids.length > 1 ? 's' : ''}</small>` : ''}<small>#${t.id}</small></span>
      </span></button></li>`;
  }
  function renderList() {
    const ul = $('.of-cw-list', box);
    if (!ul) return;
    const list = pedidos();
    ul.innerHTML = list.length ? list.map(itemHtml).join('') : '<li class="of-empty">Nenhuma conversa ainda. Toque em "Nova conversa" e escreva o que você precisa.</li>';
  }
  function badge() {
    const n = pedidos().filter((t) => unread(t) && !(t.id === C.cur && O.view === 'pedidos' && (!isPhone() || C.open))).length;
    for (const id of ['convCount', 'convCount2']) { const b = document.getElementById(id); if (b) { b.hidden = !n; b.textContent = n || ''; } }
  }

  // ---------- Conversa ----------
  // Linha do tempo: o texto do pedido (1ª mensagem do dono), mensagens, anexos, eventos do pedido e das partes
  const EV_SKIP = /respondeu em #|escreveu em #|pediu ao time|anexou /;
  function timeline(t) {
    const d = C.detail.get(t.id) || {};
    const out = [];
    if (t.description) out.push({ at: t.created_at, kind: 'msg', author: t.created_by || 'admin', body: t.description, first: true });
    for (const c of O.threads.get(t.id) || []) out.push({ at: c.created_at, kind: 'msg', author: c.author, body: c.body, id: c.id });
    for (const f of (d.task || t).files || []) out.push({ at: f.created_at, kind: 'file', author: f.uploaded_by, file: f });
    for (const e of d.events || []) if (!EV_SKIP.test(e.message)) out.push({ at: e.ts, kind: 'ev', text: e.message, level: e.level });
    for (const k of kidsOf(t)) {
      const name = who(k.assignee);
      if (k.created_at) out.push({ at: k.created_at, kind: 'ev', text: `${who(k.created_by || 'diretor')} passou a parte #${k.id} para ${k.assignee ? name : 'a equipe'}: ${k.title}`, task: k.id });
      if (k.status === 'done') out.push({ at: k.updated_at, kind: 'ev', text: `${name} terminou #${k.id}`, task: k.id, level: 'success' });
      else if (k.status === 'review') out.push({ at: k.updated_at, kind: 'ev', text: `#${k.id} (${k.title}) foi para a sua aprovação`, task: k.id, level: 'warn' });
    }
    return out.sort((a, b) => a.at - b.at);
  }
  const PREVIEW = /^(application\/pdf|image\/jpeg|image\/png)$/;
  function fileHtml(f) {
    const img = /^image\/(jpeg|png)$/.test(f.mime);
    return `<span class="of-cw-chip">${img ? `<img src="${O.API}/files/${f.id}/download?inline=1" alt="" loading="lazy"/>` : `<span class="of-file-ic">${esc(O.ftype(f.mime))}</span>`}
      <span class="of-cw-chip-t"><b title="${esc(f.name)}">${esc(f.name)}</b><small>${O.fsize(f.size)}</small></span>
      ${PREVIEW.test(f.mime) ? `<a href="/admin/escritorio/arquivo/${f.id}" target="_blank" rel="noopener">Ver</a>` : ''}<a href="${O.API}/files/${f.id}/download" download>Baixar</a></span>`;
  }
  function msgsHtml(t) {
    const items = timeline(t);
    if (!items.length) return '<li class="of-empty">Sem mensagens ainda.</li>';
    let day = '', prev = null;
    return items.map((x) => {
      let h = '';
      const k = dayKey(x.at);
      if (k !== day) { day = k; prev = null; h += `<li class="of-cw-day"><span>${esc(dayLabel(x.at))}</span></li>`; }
      if (x.kind === 'ev') {
        prev = null;
        return `${h}<li class="of-cw-ev ${esc(x.level || '')}"><span>${esc(x.text)}${x.task ? ` <button type="button" class="linklike" data-task-open="${x.task}">abrir</button>` : ''}</span><time>${hhmm(x.at)}</time></li>`;
      }
      const me = x.author === 'admin';
      const cont = prev && prev.author === x.author && x.at - prev.at < 10 * 60000; // mesma pessoa em seguida: sem repetir nome e avatar
      prev = x;
      const a = me ? null : agentOf(x.author);
      const body = x.kind === 'file' ? fileHtml(x.file) : `<div class="md">${MD.render(x.body)}</div>`;
      return `${h}<li class="of-cw-msg${me ? ' me' : ''}${cont ? ' cont' : ''}${x.kind === 'file' ? ' file' : ''}">
        ${me ? '' : cont ? '<span class="of-cw-av gap" aria-hidden="true"></span>' : avatar(x.author)}
        <div class="of-cw-b">${!me && !cont ? `<b class="of-cw-who" style="--ac:${esc(a ? a.color : '#9a96ab')}"><span>${esc(who(x.author))}</span>${a && a.role ? `<small>${esc(a.role)}</small>` : ''}</b>` : ''}${x.first ? '<small class="of-cw-first">Pedido</small>' : ''}${body}<time>${hhmm(x.at)}</time></div></li>`;
    }).join('');
  }
  function headHtml(t) {
    const [cls, label] = state(t);
    const kids = kidsOf(t);
    const done = kids.filter((k) => k.status === 'done').length;
    const people = [...new Set([t.assignee, ...kids.map((k) => k.assignee)].filter(Boolean))].map(who);
    return `${isPhone() ? '<button type="button" class="of-cw-back" data-back aria-label="Voltar para as conversas"><svg class="ic" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>' : ''}
      <div class="of-cw-h-t"><h2 title="${esc(t.title)}">${esc(t.title)}</h2>
        <p><span class="of-ped-st st-${cls}">${esc(label)}</span><span>#${t.id}</span>${people.length ? `<span>${esc(people.slice(0, 4).join(', '))}${people.length > 4 ? ` +${people.length - 4}` : ''}</span>` : ''}${kids.length ? `<span>${done}/${kids.length} parte${kids.length > 1 ? 's' : ''} feita${done === 1 ? '' : 's'}</span>` : ''}</p></div>
      <button type="button" class="of-btn of-btn-sm" data-task-open="${t.id}" title="Partes, anexos, histórico e responsável">Detalhes</button>`;
  }
  function barHtml(t) {
    if (t.status === 'review') {
      return `<div class="of-cw-bar"><span><b>Pronto para você conferir.</b> Aprove para fechar o pedido ou diga o que ajustar.</span>
        <div class="of-row"><button type="button" class="of-btn of-btn-ok of-btn-sm" data-cw-act="approve">Aprovar e fechar</button>
        <button type="button" class="of-btn of-btn-warn of-btn-sm" data-cw-act="reject">Pedir ajuste</button></div>
        <form class="of-cw-fix" data-cw-fix hidden><textarea rows="2" maxlength="2000" placeholder="O que ajustar? (vai para o Diretor)"></textarea><div class="of-row"><button type="submit" class="of-btn of-btn-warn of-btn-sm">Enviar ajuste</button><button type="button" class="of-btn of-btn-sm" data-cw-fix-cancel>Cancelar</button></div></form></div>`;
    }
    const k = kidsOf(t).filter((x) => x.status === 'review');
    if (k.length) return `<div class="of-cw-bar soft"><span><b>${k.length === 1 ? `A parte #${k[0].id} espera` : `${k.length} partes esperam`} a sua aprovação</b> na caixa Aprovar.</span><button type="button" class="of-btn of-btn-sm" data-goto-inbox>Abrir a caixa Aprovar</button></div>`;
    return '';
  }
  // "Diretor está trabalhando…": o responsável pelo pedido está rodando agora (neste pedido, numa parte dele ou sem tarefa marcada)
  function typingHtml(t) {
    const a = agentOf(t.assignee);
    if (!a || t.status === 'done' || O.vis(a) !== 'working') return '';
    const ids = [t.id, ...kidsOf(t).map((k) => k.id)];
    if (a.task_id && !ids.includes(a.task_id)) return '';
    return `${avatar(a.id, 'sm')}<span>${esc(a.name)} está trabalhando</span><i class="of-cw-dots" aria-hidden="true"><b></b><b></b><b></b></i>`;
  }
  const FCFG = (S.config && S.config.files) || { max_mb: 25, max_per_task: 10 };
  function composerHtml(isNew) {
    return `<form class="of-cw-comp" data-cw-form autocomplete="off">
      <div class="of-cw-staged" hidden></div>
      <div class="of-cw-comp-in">
        <label class="of-cw-clip" title="Anexar arquivo (até ${FCFG.max_mb} MB cada, ${FCFG.max_per_task} por pedido)"><input type="file" multiple hidden data-cw-file/><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg><span class="of-sr">Anexar arquivo</span></label>
        <textarea rows="1" maxlength="${isNew ? 8000 : 4000}" placeholder="${isNew ? (isPhone() ? 'O que você precisa?' : 'Escreva o que você precisa, como falaria com uma pessoa…') : 'Escreva uma mensagem'}" aria-label="Mensagem"></textarea>
        <button type="submit" class="of-cw-send" aria-label="Enviar"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>
      </div>
      <p class="of-cw-tip">Enter envia · Shift+Enter quebra a linha</p></form>`;
  }
  function paneHtml() {
    if (C.isNew) {
      return `<header class="of-cw-h">${isPhone() ? '<button type="button" class="of-cw-back" data-back aria-label="Voltar para as conversas"><svg class="ic" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>' : ''}<div class="of-cw-h-t"><h2>Nova conversa</h2><p><span>Com o Diretor e o time</span></p></div></header>
        <div class="of-cw-scroll"><div class="of-cw-hello">${avatar('diretor', 'lg')}<h3>O que você precisa?</h3>
          <p>O <b>Diretor</b> recebe na hora (o agendador do Mac passa a cada 5 min), quebra o pedido em tarefas para as áreas e responde aqui. Pode anexar foto, PDF ou planilha.</p>
          <p class="of-cw-ex">Ex.: “Quero um carrossel e um reels sobre etiqueta 10×15 para a semana que vem, e um e-mail para os contadores parceiros.”</p></div></div>
        ${composerHtml(true)}`;
    }
    const t = taskById(C.cur);
    if (!t) return '<div class="of-cw-zero"><h2>Escolha uma conversa</h2><p>Ou comece uma nova: o Diretor responde aqui.</p></div>';
    return `<header class="of-cw-h">${headHtml(t)}</header><div class="of-cw-barw">${barHtml(t)}</div>
      <div class="of-cw-scroll"><ol class="of-cw-msgs" aria-live="polite">${C.detail.has(t.id) ? msgsHtml(t) : '<li class="of-empty">Carregando a conversa…</li>'}</ol></div>
      <div class="of-cw-typing">${typingHtml(t)}</div>
      ${t.status === 'done' ? '<p class="of-cw-closed">Pedido concluído. Escrever aqui reabre a conversa com o Diretor.</p>' : ''}${composerHtml(false)}`;
  }
  function render() {
    if (!$('.of-cw-side', box)) {
      box.innerHTML = `<div class="of-cw-side"><div class="of-cw-side-h"><h2>Conversas</h2><button type="button" class="of-btn of-btn-primary of-btn-sm" data-new><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Nova conversa</button></div>
        <ul class="of-cw-list"></ul></div><section class="of-cw-pane" aria-label="Conversa"></section>`;
    }
    renderList();
    renderPane();
    fitTop();
  }
  function renderPane() {
    const p = $('.of-cw-pane', box);
    if (!p) return;
    const keep = $('[data-cw-form] textarea', p);
    const draft = keep ? keep.value : '';
    p.innerHTML = paneHtml();
    p.classList.toggle('open', C.open);
    const ta = $('[data-cw-form] textarea', p);
    if (ta && draft) { ta.value = draft; grow(ta); }
    showStaged();
    toBottom(true);
  }
  // Atualiza só o que muda (cabeçalho, barra, mensagens, "trabalhando"), sem apagar o que o dono está escrevendo
  function refreshPane({ stick = false } = {}) {
    const p = $('.of-cw-pane', box);
    const t = C.cur && !C.isNew ? taskById(C.cur) : null;
    if (!p || !t || !$('.of-cw-msgs', p)) return renderPane();
    const sc = $('.of-cw-scroll', p);
    const near = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 140;
    $('.of-cw-h', p).innerHTML = headHtml(t);
    const bw = $('.of-cw-barw', p);
    if (!bw.contains(document.activeElement)) bw.innerHTML = barHtml(t);
    $('.of-cw-msgs', p).innerHTML = C.detail.has(t.id) ? msgsHtml(t) : '<li class="of-empty">Carregando a conversa…</li>';
    $('.of-cw-typing', p).innerHTML = typingHtml(t);
    if (near || stick) toBottom();
  }
  function toBottom() {
    const sc = $('.of-cw-pane .of-cw-scroll', box);
    if (sc) requestAnimationFrame(() => { sc.scrollTop = sc.scrollHeight; });
  }
  // Computador: lista e conversa cabem na tela (altura = janela − o que está acima)
  function fitTop() { box.style.setProperty('--cw-top', `${Math.max(0, Math.round(box.getBoundingClientRect().top + window.scrollY))}px`); }
  window.addEventListener('resize', () => { if (O.view === 'pedidos') fitTop(); if (!isPhone() && C.open) { C.open = false; document.body.classList.remove('of-lock'); renderPane(); } });

  async function openConv(id, { focus = false } = {}) {
    C.cur = id; C.isNew = false;
    if (isPhone()) { C.open = true; document.body.classList.add('of-lock'); }
    if (history.replaceState) history.replaceState(null, '', `#conversa-${id}`);
    render();
    if (await loadDetail(id)) { if (C.cur === id && !C.isNew) { refreshPane({ stick: true }); } }
    markSeen(id); renderList(); badge();
    if (focus && !isPhone()) { const ta = $('.of-cw-pane [data-cw-form] textarea', box); if (ta) ta.focus(); }
  }
  function openNew() {
    C.isNew = true; C.cur = null; C.staged = [];
    if (isPhone()) { C.open = true; document.body.classList.add('of-lock'); }
    if (history.replaceState) history.replaceState(null, '', location.pathname);
    render();
    const ta = $('.of-cw-pane [data-cw-form] textarea', box); if (ta) ta.focus();
  }
  function closeConv() {
    C.open = false; document.body.classList.remove('of-lock');
    const p = $('.of-cw-pane', box); if (p) p.classList.remove('open');
    if (history.replaceState) history.replaceState(null, '', location.pathname);
    renderList(); badge();
  }

  // ---------- Enviar ----------
  function grow(ta) { ta.style.height = 'auto'; ta.style.height = `${Math.min(180, ta.scrollHeight)}px`; ta.style.overflowY = ta.scrollHeight > 180 ? 'auto' : 'hidden'; }
  function showStaged() {
    const el = $('.of-cw-pane .of-cw-staged', box);
    if (!el) return;
    el.hidden = !C.staged.length;
    el.innerHTML = C.staged.map((f, i) => `<span class="of-cw-st"><b>${esc(f.name)}</b><small>${O.fsize(f.size)}</small><button type="button" data-unstage="${i}" aria-label="Tirar ${esc(f.name)}">×</button></span>`).join('');
  }
  function stage(list) {
    const t = C.cur && !C.isNew ? taskById(C.cur) : null;
    const next = [...C.staged, ...list];
    try { O.checkFiles(next, t && t.files ? t.files.length : 0); C.staged = next; } catch (e) { toast(e.message, true); }
    showStaged();
  }
  // Pedido novo (POST /pedidos, anexos depois) — usado pela conversa nova e pela caixa do topo
  async function createPedido(text, files = []) {
    text = String(text || '').trim();
    if (text.length < 3) { toast('Escreva o que você precisa (uma frase já basta).', true); return null; }
    O.checkFiles(files);
    const r = await api('/pedidos', { method: 'POST', body: JSON.stringify({ text }) });
    O.upsertTask(r.task);
    if (files.length) { try { await O.uploadFiles(r.task.id, files); } catch (e) { toast(`Pedido enviado, mas o anexo falhou: ${e.message}`, true); } }
    toast('Pedido enviado ao Diretor. Ele responde nesta conversa.');
    return r.task;
  }
  async function submit(form) {
    const ta = $('textarea', form);
    const btn = $('[type=submit]', form);
    const text = ta.value.trim();
    const files = C.staged.slice();
    if (!text && !files.length) return;
    btn.disabled = true;
    try {
      if (C.isNew) {
        const t = await createPedido(text, files);
        if (!t) return;
        ta.value = ''; C.staged = [];
        markSeen(t.id);
        await openConv(t.id, { focus: true });
        return;
      }
      const id = C.cur;
      if (files.length) { await O.uploadFiles(id, files); C.staged = []; showStaged(); }
      if (text) { await O.sendComment(id, text); ta.value = ''; grow(ta); }
      markSeen(id);
      if (files.length) await loadDetail(id); // anexos novos aparecem como mensagem
      refreshPane({ stick: true }); renderList();
    } catch (e) { if (!O.stepUp(e)) toast(e.message, true); } finally { btn.disabled = false; if (!isPhone()) ta.focus(); }
  }
  async function decide(action, feedback = '') {
    const id = C.cur;
    try {
      const r = await api(`/tasks/${id}/action`, { method: 'POST', body: JSON.stringify({ action, feedback }) });
      O.upsertTask(r.task);
      toast(action === 'approve' ? 'Pedido aprovado e fechado.' : 'Ajuste pedido: o Diretor recebe na próxima passada.');
      await loadDetail(id);
      refreshPane({ stick: true }); renderList();
    } catch (e) { if (!O.stepUp(e)) toast(e.message, true); }
  }

  // ---------- Eventos ----------
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button, a');
    if (!b || !box.contains(b)) return;
    if (b.dataset.conv) return openConv(Number(b.dataset.conv), { focus: true });
    if (b.hasAttribute('data-new')) return openNew();
    if (b.hasAttribute('data-back')) return closeConv();
    if (b.dataset.taskOpen) return O.openTask(Number(b.dataset.taskOpen));
    if (b.hasAttribute('data-goto-inbox')) { if (C.open) closeConv(); return O.setView('inbox'); }
    if (b.dataset.unstage !== undefined) { C.staged.splice(Number(b.dataset.unstage), 1); return showStaged(); }
    if (b.dataset.cwAct === 'approve') { b.disabled = true; return decide('approve').finally(() => { b.disabled = false; }); }
    if (b.dataset.cwAct === 'reject') { const f = $('[data-cw-fix]', box); if (f) { f.hidden = false; $('textarea', f).focus(); } return; }
    if (b.hasAttribute('data-cw-fix-cancel')) { const f = $('[data-cw-fix]', box); if (f) f.hidden = true; }
  });
  box.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (e.target.matches('[data-cw-form]')) return submit(e.target);
    if (e.target.matches('[data-cw-fix]')) {
      const ta = $('textarea', e.target);
      if (!ta.value.trim() && !confirm('Pedir ajuste sem dizer o quê? O Diretor não vai saber o que mudar.')) return;
      $('[type=submit]', e.target).disabled = true;
      await decide('reject', ta.value.trim());
    }
  });
  box.addEventListener('keydown', (e) => {
    const ta = e.target;
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing || ta.tagName !== 'TEXTAREA') return;
    const f = ta.closest('[data-cw-form], [data-cw-fix]');
    if (!f) return;
    e.preventDefault();
    f.requestSubmit();
  });
  box.addEventListener('input', (e) => { if (e.target.matches('[data-cw-form] textarea')) grow(e.target); });
  box.addEventListener('change', (e) => { if (e.target.matches('[data-cw-file]')) { stage([...e.target.files]); e.target.value = ''; } });
  // Arrastar arquivos para a conversa
  box.addEventListener('dragover', (e) => { const p = e.target.closest('.of-cw-pane'); if (p && $('[data-cw-form]', p) && e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { e.preventDefault(); p.classList.add('over'); } });
  box.addEventListener('dragleave', (e) => { const p = e.target.closest('.of-cw-pane'); if (p && !p.contains(e.relatedTarget)) p.classList.remove('over'); });
  box.addEventListener('drop', (e) => { const p = e.target.closest('.of-cw-pane'); if (!p || !$('[data-cw-form]', p)) return; e.preventDefault(); p.classList.remove('over'); stage([...e.dataTransfer.files]); });

  // Ao vivo: mensagem nova, tarefa mudou (pedido ou parte), registro do pedido, agente começou/parou
  window.addEventListener('office:comment', (e) => {
    const c = e.detail || {};
    const t = taskById(c.task_id);
    if (t && (!t.last_comment || t.last_comment.id < c.id)) {
      t.last_comment = { ...c, body: String(c.body).slice(0, 280) };
      if (c.author !== 'admin') t.agent_last_at = c.created_at;
    }
    if (c.task_id === C.cur && !C.isNew) {
      if (O.view === 'pedidos' && !document.hidden && (!isPhone() || C.open)) markSeen(c.task_id);
      refreshPane({ stick: c.author === 'admin' });
    }
    renderList(); badge();
  });
  window.addEventListener('office:task', (e) => {
    const t = e.detail || {};
    const curT = C.cur ? taskById(C.cur) : null;
    if (C.extra.has(t.id) && !t.deleted) C.extra.set(t.id, t);
    const d = C.detail.get(t.parent_id);
    if (d && t.parent_id) {
      const i = d.children.findIndex((k) => k.id === t.id);
      const k = { id: t.id, title: t.title, status: t.status, assignee: t.assignee, approval: t.approval, created_by: t.created_by, created_at: t.created_at, updated_at: t.updated_at };
      if (t.deleted) { if (i >= 0) d.children.splice(i, 1); } else if (i >= 0) d.children[i] = k; else d.children.push(k);
    }
    if (C.detail.has(t.id) && !t.deleted) C.detail.get(t.id).task = t;
    if (O.view !== 'pedidos') { badge(); return; }
    if (curT && (t.id === curT.id || t.parent_id === curT.id)) refreshPane();
    if (isPedido(t) || t.parent_id || t.deleted) renderList();
    badge();
  });
  window.addEventListener('office:log', (e) => {
    const ev = e.detail || {};
    const d = C.detail.get(ev.task_id);
    if (!d || d.events.some((x) => x.id === ev.id)) return;
    d.events.unshift(ev);
    if (ev.task_id === C.cur && O.view === 'pedidos') refreshPane();
  });
  window.addEventListener('office:agent', () => {
    if (O.view !== 'pedidos' || !C.cur || C.isNew) return;
    const el = $('.of-cw-pane .of-cw-typing', box);
    const t = taskById(C.cur);
    if (el && t) el.innerHTML = typingHtml(t);
  });
  window.addEventListener('office:view', (e) => {
    if (e.detail === 'pedidos') {
      render();
      loadList();
      if (C.cur && !C.isNew) { loadDetail(C.cur).then((ok) => { if (ok && O.view === 'pedidos') { refreshPane({ stick: true }); markSeen(C.cur); badge(); } }); }
    } else if (C.open) { C.open = false; document.body.classList.remove('of-lock'); }
  });
  setInterval(() => { if (O.view === 'pedidos' && !document.hidden) renderList(); }, 60000); // "5 min", "ontem"…

  // ---------- Caixa "Pedir ao time" do topo: Enter envia e abre a conversa nova na aba Conversa ----------
  const ask = $('#ask');
  let askFiles = [];
  if (ask) {
    const ta = $('textarea', ask);
    const n = $('.of-ask-n', ask);
    const showN = () => { if (n) { n.hidden = !askFiles.length; n.textContent = askFiles.length || ''; } };
    ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = `${Math.min(140, ta.scrollHeight)}px`; });
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask.requestSubmit(); } });
    ask.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('[type=submit]', ask);
      btn.disabled = true;
      try {
        const t = await createPedido(ta.value, askFiles);
        if (!t) return;
        ta.value = ''; ta.style.height = ''; ta.blur(); askFiles = []; showN();
        markSeen(t.id);
        C.cur = t.id; C.isNew = false;
        O.setView('pedidos');
        openConv(t.id);
      } catch (err) { if (!O.stepUp(err)) toast(err.message, true); } finally { btn.disabled = false; }
    });
    $('input[type=file]', ask).addEventListener('change', (e) => {
      const next = [...askFiles, ...e.target.files];
      try { O.checkFiles(next); askFiles = next; toast(`${askFiles.length} arquivo${askFiles.length > 1 ? 's vão' : ' vai'} junto com o pedido.`); } catch (err) { toast(err.message, true); }
      e.target.value = ''; showN();
    });
  }

  // ---------- Início ----------
  const m = /^#conversa-(\d+)$/.exec(location.hash);
  if (m) C.cur = Number(m[1]);
  else { const first = pedidos()[0]; if (first && !isPhone()) C.cur = first.id; }
  if (O.view === 'pedidos') {
    render();
    loadList();
    if (C.cur) openConv(C.cur);
  } else { badge(); loadList(); }
};
if (window.OfficeApp) boot(); else window.addEventListener('office:ready', boot, { once: true });
