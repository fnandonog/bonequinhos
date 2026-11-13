// Escritório da agência (/admin/escritorio): o dono vê os agentes trabalhando (cena em pixel art), o quadro de tarefas e o
// feed ao vivo; os agentes (Claude Code rodando no Mac pelo tools/agencia/run.mjs) mandam batimento, registro, tarefas e
// artefatos por esta API. Nenhuma ação para fora (postar, enviar, gastar) acontece aqui: o escritório só registra e pede aprovação.
// Montado por server.js (mount(app, engine)). Guia: tools/agencia/LEIA-ME.md.
const store = require('./store');
const roster = require('./roster');
const page = require('./page');
const data = require('./data');
const gerente = require('./gerente');
const files = require('./files');
const entrega = require('./entrega');
const inbox = require('./inbox');
let mdCache = null;
const mdSource = () => (mdCache ||= require('fs').readFileSync(require.resolve('./markdown'), 'utf8'));
const { access, accessSensitive, pageGuard, agentTokens } = require('./access');
const multer = require('multer');
// Anexos: memória (no máximo 10 × 25 MB por envio), validados e cifrados por lib/office/files.js antes de ir para o disco
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: files.MAX_BYTES, files: files.MAX_PER_TASK, fields: 5 } });
const receive = (req, res) => new Promise((resolve, reject) => upload.array('files', files.MAX_PER_TASK)(req, res, (err) => {
  if (!err) return resolve();
  const big = err.code === 'LIMIT_FILE_SIZE';
  reject(Object.assign(new Error(big ? 'Arquivo passa de 25 MB.' : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? `No máximo ${files.MAX_PER_TASK} arquivos por vez (campo "files").` : 'Envio inválido.'), { status: big ? 413 : 400 }));
}));

const STALE_MS = 45 * 60000; // sem batimento há 45 min: o personagem aparece como "fora"
const bad = (msg, status = 400) => Object.assign(new Error(msg), { status });
const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((e) => {
  if (!e.status) console.error('[escritorio]', e);
  if (!res.headersSent) res.status(e.status || 500).json({ error: e.status ? e.message : 'Erro interno. Tente de novo.', ...(e.extra || {}) });
});
const str = (v, n) => (v === undefined || v === null ? undefined : String(v).slice(0, n));
const safeUrl = (u) => {
  const s = String(u || '').trim();
  return /^https?:\/\/[^\s]+$/i.test(s) || /^\/[^\s/][^\s]*$/.test(s) || s === '/' ? s.slice(0, 1000) : null;
};
function parseLinks(v) {
  if (v === undefined) return undefined;
  let arr = v;
  if (typeof v === 'string') { try { arr = JSON.parse(v); } catch { arr = [v]; } }
  if (!Array.isArray(arr)) throw bad('links deve ser uma lista de { label, url }.');
  return arr.slice(0, 20).map((l) => (typeof l === 'string' ? { label: l, url: safeUrl(l) } : { label: str(l.label, 120) || '', url: safeUrl(l.url) }))
    .filter((l) => l.url);
}
function parseWhen(v) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (typeof v === 'number' || /^\d{10,13}$/.test(String(v))) { const n = Number(v); return n < 1e12 ? n * 1000 : n; }
  let s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) s += '-03:00';
  const t = Date.parse(s);
  if (!Number.isFinite(t)) throw bad(`Data inválida: ${v}. Use 2026-10-20T12:00.`);
  return t;
}
// Revisão da área zerada quando a tarefa volta para Revisão (entrega nova = olhar de novo)
const AREA_RESET = { area_review_by: null, area_review: null, area_review_note: null, area_review_at: null };
const taskLink = (id) => `/admin/escritorio#tarefa-${id}`;
const agentName = (id) => (roster.byId[id] ? roster.byId[id].name : id === 'admin' ? 'Você' : id || 'Sistema');

// ---------- Estado ----------
function settings() {
  return { kill: store.getSetting('kill') === '1', daily_usd: Number(store.getSetting('daily_usd')) || 0, gerente_mode: gerente.normMode(store.getSetting('gerente_mode')),
    files_days: Number(store.getSetting('files_days')) || files.DEFAULT_DAYS };
}
// Central de Redes Sociais (opcional): carregada só quando precisa, para o escritório funcionar sem ela
const social = () => { try { return require('../social'); } catch { return null; } };
// Comentários das redes (lib/social/comments.js), também opcional
const comments = () => { try { return require('../social/comments'); } catch { return null; } };
const COMMENT_READERS = ['comunidade', gerente.ID, 'gerente-marketing', 'diretor']; // leem a lista; só a comunidade (e o dono) escreve
// Posts aprovados pelo Gerente que ainda não saíram (contagem regressiva + "Barrar" no painel)
function gerentePosts() {
  try {
    const { all } = require('../db');
    return all("SELECT id, kind, networks, substr(caption, 1, 160) AS caption, scheduled_at, approved_at, review_note FROM social_posts WHERE status = 'agendado' AND approved_by = 'gerente' AND scheduled_at > ? ORDER BY scheduled_at LIMIT 30", Date.now())
      .map((p) => ({ ...p, networks: (() => { try { return JSON.parse(p.networks); } catch { return []; } })() }));
  } catch { return []; }
}
// Quem esperava aprovação desta tarefa volta a ficar livre
function releaseWaiting(row) {
  if (!row.assignee) return;
  const a = store.getAgent(row.assignee);
  if (a && a.status === 'waiting' && (!a.task_id || a.task_id === row.id)) store.updateAgent(a.id, { status: 'idle', current_task: null, task_id: null });
}
// "Esperando você" (e "Travado") só valem quando há mesmo algo do agente na caixa Aprovar (tarefa em Revisão). Agente que
// "espera" outro agente, ou cuja rodada acabou sem deixar nada para o dono, volta a ficar livre: o "!" na cena não pode
// apontar para uma caixa vazia.
const awaitsOwner = (agentId) => store.listTasks({ status: ['review'], assignee: agentId, limit: 1 }).length > 0;
// Pedido do dono com todas as partes feitas vai sozinho para a caixa Aprovar (o Diretor só acorda com novidade do dono,
// então sem isto o pedido ficava em "Fazendo" sem nada para fazer). A conversa ganha o resumo das partes.
function rollupParent(parentId) {
  if (!parentId) return null;
  const p = store.getTask(parentId);
  if (!p || !['backlog', 'doing'].includes(p.status) || !(p.tags || []).includes(store.PEDIDO_TAG)) return null;
  const kids = store.listTasks({ parent: p.id, limit: 100 });
  if (!kids.length || kids.some((k) => k.status !== 'done')) return null;
  store.addComment(p.id, 'diretor', `Todas as partes deste pedido estão feitas: ${kids.map((k) => `#${k.id} ${k.title}`).join('; ')}. Confira e feche (Aprovar) ou peça ajustes.`);
  const t = store.updateTask(p.id, { status: 'review', approval: 'pendente', feedback: null, reviewed_by: null, escalated: 0, review_note: null, ...AREA_RESET });
  store.log(`Pedido #${p.id} pronto: todas as partes feitas, foi para a sua aprovação.`, { agent_id: 'diretor', level: 'warn', task_id: p.id, link: taskLink(p.id) });
  return t;
}
function sweepStuck() {
  for (const p of store.listTasks({ status: ['backlog', 'doing'], tag: store.PEDIDO_TAG, limit: 200 })) rollupParent(p.id);
  for (const a of store.listAgents()) {
    if ((a.status === 'waiting' || a.status === 'blocked') && !awaitsOwner(a.id)) store.updateAgent(a.id, { status: 'idle', current_task: null, task_id: null });
  }
  // tarefa que saiu da Revisão antes desta regra e ficou marcada "aguardando você"
  for (const t of store.listTasks({ status: ['backlog', 'doing'], limit: 500 })) if (t.approval === 'pendente') store.updateTask(t.id, { approval: null, escalated: 0 });
}
function state() {
  return {
    now: Date.now(), staleMs: STALE_MS, agents: store.listAgents(), tasks: store.listTasks({ limit: 300 }).filter((t) => t.status !== 'done' || t.updated_at > Date.now() - 14 * 86400000),
    events: store.recentEvents({ limit: 80 }), settings: settings(), usage: store.usageToday(), runs: store.recentRuns(20),
    gerente: { mode: gerente.normMode(store.getSetting('gerente_mode')), modes: gerente.MODES, veto_ms: gerente.VETO_MS, posts: gerentePosts() },
    teams: roster.TEAMS, inbox_count: inbox.count(), pedido_tag: store.PEDIDO_TAG,
    config: { agentToken: agentTokens().length > 0, files: { accept: files.ACCEPT, max_mb: files.MAX_BYTES / 1048576, max_per_task: files.MAX_PER_TASK } },
  };
}
// O executor pergunta antes de rodar: botão de emergência, agente ligado e teto diário do servidor
function runnerCheck(agentId) {
  const s = settings();
  const a = store.getAgent(agentId);
  const usage = store.usageToday();
  const reasons = [];
  if (s.kill) reasons.push('Botão de emergência ligado no escritório: todos os agentes parados.');
  if (!a) reasons.push(`Agente desconhecido: ${agentId}.`);
  else if (!a.enabled) reasons.push(`${a.name} está desligado no escritório.`);
  if (s.daily_usd > 0 && usage.total.usd >= s.daily_usd) reasons.push(`Teto diário de US$ ${s.daily_usd.toFixed(2)} atingido (gasto hoje: US$ ${usage.total.usd.toFixed(2)}).`);
  return { allowed: reasons.length === 0, reasons, kill: s.kill, enabled: !!(a && a.enabled), daily_usd: s.daily_usd, usage };
}

// ---------- Rotas ----------
function mount(app, engine) {
  try { sweepStuck(); } catch (e) { console.error('[escritorio] status presos:', e.message); }
  const admin = access();
  const either = access({ agent: true });
  const A = '/admin/api/office';

  // Página: login para quem não entrou, 404 para quem não é admin (guarda comum das telas do dono)
  const notFound = (req, res) => engine.send(res, engine.pages.notFound(engine.pageCtx(req)), 404);
  app.get('/admin/escritorio', pageGuard(notFound), (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    res.type('html').send(page.render({ state: state(), user: req.user }));
  });

  // Entrega de agente e anexo em tela cheia (mesma guarda da página)
  app.get('/admin/escritorio/entrega/:id', pageGuard(notFound), (req, res) => {
    const x = /^\d+$/.test(req.params.id) ? store.getArtifact(req.params.id) : null;
    const task = x && x.task_id ? store.getTask(x.task_id) : null;
    if (!x || !task) return notFound(req, res);
    res.set('Cache-Control', 'private, no-store');
    const agents = Object.fromEntries(store.listAgents().map((a) => [a.id, { name: a.name, color: a.color }]));
    res.type('html').send(entrega.renderArtifact({ artifact: x, task, agent: roster.byId[x.agent_id] ? store.getAgent(x.agent_id) : null, files: task.files, comments: store.listComments(task.id), agents }));
  });
  app.get('/admin/escritorio/arquivo/:fid', pageGuard(notFound), (req, res) => {
    const f = /^\d+$/.test(req.params.fid) ? files.get(Number(req.params.fid)) : null;
    const task = f ? store.getTask(f.task_id) : null;
    if (!f || !task) return notFound(req, res);
    res.set('Cache-Control', 'private, no-store');
    res.type('html').send(entrega.renderFile({ file: f, task, agent: roster.byId[f.uploaded_by] ? store.getAgent(f.uploaded_by) : null }));
  });
  // Renderizador de Markdown das entregas, o mesmo do servidor (código público, sem dado nenhum)
  app.get('/escritorio-md.js', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300').type('application/javascript').send(mdSource());
  });

  app.get(`${A}/state`, admin, (req, res) => res.set('Cache-Control', 'no-store').json(state()));

  // Feed ao vivo (SSE): agent, task, log, settings, run
  app.get(`${A}/stream`, admin, (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    const send = (type, data) => { res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`); if (res.flush) res.flush(); };
    send('hello', { now: Date.now() });
    const onEvent = ({ type, data }) => send(type, data);
    store.bus.on('event', onEvent);
    const ping = setInterval(() => { res.write(`: ping ${Date.now()}\n\n`); if (res.flush) res.flush(); }, 20000);
    req.on('close', () => { clearInterval(ping); store.bus.off('event', onEvent); });
  });

  // ---- Agente: quem sou eu, minhas tarefas, posso rodar? ----
  app.get(`${A}/me`, either, (req, res) => {
    const id = req.isAgent ? req.actor : String(req.query.agent || '');
    const a = store.getAgent(id);
    if (!a) return res.status(404).json({ error: 'Agente não encontrado.' });
    // Conversa: as últimas mensagens de cada tarefa aberta (dono ↔ agentes) e o que o dono escreveu e ainda não teve resposta
    const tasks = store.listTasks({ assignee: id, status: ['backlog', 'doing', 'review'], limit: 50 }).map((t) => ({ ...t, comments: t.comments_count ? store.listComments(t.id, { limit: 10 }) : [] }));
    const pending = tasks.filter((t) => t.owner_last_at && t.comments_count && (!t.agent_last_at || t.owner_last_at > t.agent_last_at) && t.last_comment && t.last_comment.author === 'admin');
    res.json({ agent: a, tasks, check: runnerCheck(id), feedback: store.listTasks({ assignee: id, limit: 20 }).filter((t) => t.feedback),
      messages: pending.map((t) => ({ task_id: t.id, title: t.title, tags: t.tags, comments: t.comments.slice(-5) })) });
  });
  app.get(`${A}/runner/check`, either, (req, res) => res.json(runnerCheck(req.isAgent ? req.actor : String(req.query.agent || ''))));

  // Batimento: status + tarefa atual (+ linha opcional no feed)
  app.post(`${A}/heartbeat`, either, wrap(async (req, res) => {
    const b = req.body || {};
    const id = req.isAgent ? req.actor : String(b.agent || '');
    if (!roster.byId[id]) throw bad('Agente desconhecido.');
    const f = { last_heartbeat: Date.now() };
    if (b.status !== undefined) {
      if (!store.AGENT_STATUSES.includes(b.status)) throw bad(`status inválido. Use ${store.AGENT_STATUSES.join(', ')}.`);
      // esperando outro agente (nada na caixa do dono): fica "trabalhando", com o texto do que espera
      f.status = b.status === 'waiting' && !awaitsOwner(id) ? 'working' : b.status;
    }
    if (b.task !== undefined) f.current_task = str(b.task, 300) || null;
    if (b.task_id !== undefined) f.task_id = b.task_id ? Number(b.task_id) : null;
    if (b.status === 'idle' && b.task === undefined) { f.current_task = null; f.task_id = null; }
    const agent = store.updateAgent(id, f);
    let event = null;
    if (b.message) event = store.log(b.message, { agent_id: id, level: b.level || (b.status === 'error' ? 'error' : 'info'), task_id: f.task_id || null, link: safeUrl(b.link) });
    res.json({ ok: true, agent, event, check: runnerCheck(id) });
  }));

  app.post(`${A}/log`, either, wrap(async (req, res) => {
    const b = req.body || {};
    if (!b.message) throw bad('Informe a mensagem.');
    const id = req.isAgent ? req.actor : 'admin';
    if (req.isAgent) store.updateAgent(id, { last_heartbeat: Date.now() });
    const event = store.log(b.message, { agent_id: id, level: b.level, task_id: b.task_id ? Number(b.task_id) : null, link: safeUrl(b.link) });
    res.status(201).json({ ok: true, event });
  }));
  app.get(`${A}/events`, either, (req, res) => res.json({ events: store.recentEvents({ limit: Math.min(Number(req.query.limit) || 80, 300), agent: req.query.agent || null, before: req.query.before ? Number(req.query.before) : null }) }));

  // ---- Tarefas (quadro: backlog | doing | review | done) ----
  app.get(`${A}/tasks`, either, (req, res) => {
    const status = req.query.status ? String(req.query.status).split(',').filter((s) => store.TASK_STATUSES.includes(s)) : null;
    const assignee = req.query.mine && req.isAgent ? req.actor : (req.query.assignee || null);
    res.json({ tasks: store.listTasks({ status, assignee, since: req.query.since ? parseWhen(String(req.query.since)) : null, tag: req.query.tag ? String(req.query.tag).slice(0, 60) : null,
      parent: req.query.parent ? Number(req.query.parent) : null, limit: Math.min(Number(req.query.limit) || 200, 500) }) });
  });
  app.get(`${A}/tasks/:id`, either, (req, res) => {
    const t = store.getTask(Number(req.params.id));
    if (!t) return res.status(404).json({ error: 'Tarefa não encontrada.' });
    res.json({ task: t, events: store.recentEvents({ limit: 200 }).filter((e) => e.task_id === t.id).slice(0, 50), comments: store.listComments(t.id),
      children: store.listTasks({ parent: t.id, limit: 100 }).map((c) => ({ id: c.id, title: c.title, status: c.status, assignee: c.assignee, approval: c.approval, created_by: c.created_by, created_at: c.created_at, updated_at: c.updated_at })) });
  });
  app.post(`${A}/tasks`, either, wrap(async (req, res) => {
    const b = req.body || {};
    const title = str(b.title, 200);
    if (!title || !title.trim()) throw bad('Informe o título da tarefa.');
    const assignee = b.assignee !== undefined && b.assignee !== null && b.assignee !== '' ? String(b.assignee) : (req.isAgent ? req.actor : null);
    if (assignee && !roster.byId[assignee]) throw bad(`Responsável desconhecido: ${assignee}.`);
    // Gerente de área: só distribui para a própria equipe (ou para si)
    if (req.isAgent) { const blk = gerente.assignBlock(req.actor, assignee); if (blk) throw bad(blk, 403); }
    const status = b.status || 'backlog';
    if (!store.TASK_STATUSES.includes(status) || (req.isAgent && status === 'done')) throw bad('status inválido. Use backlog, doing ou review.');
    const ref = b.ref ? str(b.ref, 200) : null;
    if (ref) {
      const ex = store.listTasks({ limit: 500 }).find((t) => t.ref === ref);
      if (ex) throw Object.assign(bad('Já existe uma tarefa com esse ref.', 409), { extra: { task: ex } });
    }
    const description = str(b.description, 8000) || '';
    // Sub-tarefa (ex.: o Diretor quebrando um pedido do dono): parent_id precisa existir
    const parentId = b.parent_id !== undefined && b.parent_id !== null && b.parent_id !== '' ? Number(b.parent_id) : null;
    if (parentId && !store.getTaskRow(parentId)) throw bad(`Tarefa-mãe #${b.parent_id} não existe.`);
    // Etiquetas: o "pedido-do-dono" só nasce pelo dono (POST /pedidos ou aqui, pelo painel)
    const tags = (Array.isArray(b.tags) ? b.tags : typeof b.tags === 'string' ? b.tags.split(',') : []).map((x) => String(x).trim().toLowerCase().slice(0, 40)).filter(Boolean)
      .filter((x) => !req.isAgent || x !== store.PEDIDO_TAG).slice(0, 8);
    // Sensível: automático pelo texto/agente; o dono marca ou desmarca de vez; o agente só pode marcar
    const explicit = b.sensitive === undefined || b.sensitive === null ? null : { value: b.sensitive === true || b.sensitive === 1 || b.sensitive === '1' || b.sensitive === 'true', by: req.isAgent ? 'agente' : 'admin' };
    const sens = gerente.sensitiveFields({ title, description, assignee, created_by: req.actor }, null, explicit && (explicit.value || explicit.by === 'admin') ? explicit : null);
    const task = store.createTask({
      title: title.trim(), description, status, assignee, created_by: req.actor,
      priority: Math.min(3, Math.max(1, Number(b.priority) || 2)), links: parseLinks(b.links) || [], ref,
      approval: status === 'review' ? 'pendente' : null, due_at: parseWhen(b.due_at) || null, ...sens, tags, parent_id: parentId,
    });
    store.log(`${agentName(req.actor)} criou a tarefa #${task.id}: ${task.title}${assignee && assignee !== req.actor ? ` (para ${agentName(assignee)})` : ''}${parentId ? ` · parte de #${parentId}` : ''}`, { agent_id: req.isAgent ? req.actor : 'admin', task_id: task.id, link: taskLink(task.id) });
    res.status(201).json({ task });
  }));
  app.patch(`${A}/tasks/:id`, either, wrap(async (req, res) => {
    const row = store.getTaskRow(Number(req.params.id));
    if (!row) throw bad('Tarefa não encontrada.', 404);
    const b = req.body || {};
    // Gerente de área: só mexe em tarefas da própria equipe e só reatribui dentro dela
    if (req.isAgent) {
      const blk = gerente.editBlock(req.actor, row) || (b.assignee !== undefined ? gerente.assignBlock(req.actor, b.assignee || null) : null);
      if (blk) throw bad(blk, 403);
    }
    const f = {};
    if (b.title !== undefined) f.title = str(b.title, 200);
    if (b.description !== undefined) f.description = str(b.description, 8000);
    if (b.priority !== undefined) f.priority = Math.min(3, Math.max(1, Number(b.priority) || 2));
    if (b.links !== undefined) f.links = parseLinks(b.links);
    if (b.due_at !== undefined) f.due_at = parseWhen(b.due_at);
    if (b.assignee !== undefined) {
      if (b.assignee && !roster.byId[b.assignee]) throw bad(`Responsável desconhecido: ${b.assignee}.`);
      f.assignee = b.assignee || null;
    }
    if (b.status !== undefined && b.status !== row.status) {
      if (!store.TASK_STATUSES.includes(b.status)) throw bad('status inválido. Use backlog, doing, review ou done.');
      // O agente não fecha o que espera aprovação do dono: manda para "review" e o dono aprova
      if (req.isAgent && b.status === 'done' && (row.approval === 'pendente' || b.needs_approval)) throw bad('Esta tarefa precisa da aprovação do dono: use status review.', 409);
      // Tarefa sensível só fecha pelo dono
      if (req.isAgent && b.status === 'done' && row.sensitive) throw bad('Tarefa sensível: só o dono fecha. Mande para review.', 409);
      f.status = b.status;
      if (b.status === 'review') Object.assign(f, { approval: 'pendente', feedback: null, reviewed_by: null, escalated: 0, review_note: null, ...AREA_RESET });
      // saiu da Revisão sem decisão (voltou para A fazer/Fazendo): não fica "aguardando você" fora da caixa Aprovar
      else if (row.approval === 'pendente') Object.assign(f, { approval: null, escalated: 0 });
    }
    // Recalcula "sensível" quando o texto ou o responsável mudam (ou alguém marca na mão)
    const explicit = b.sensitive === undefined || b.sensitive === null ? null : { value: b.sensitive === true || b.sensitive === 1 || b.sensitive === '1' || b.sensitive === 'true', by: req.isAgent ? 'agente' : 'admin' };
    if (explicit && req.isAgent && !explicit.value) throw bad('Só o dono desmarca "sensível".', 403);
    if (explicit || f.title !== undefined || f.description !== undefined || f.assignee !== undefined) {
      Object.assign(f, gerente.sensitiveFields({ title: f.title ?? row.title, description: f.description ?? row.description, assignee: f.assignee !== undefined ? f.assignee : row.assignee, created_by: row.created_by }, row, explicit));
    }
    const task = store.updateTask(row.id, f);
    if (f.status === 'done') rollupParent(row.parent_id);
    if (f.status) {
      const msg = f.status === 'review' ? `${agentName(req.actor)} mandou #${row.id} para aprovação: ${task.title}` : `${agentName(req.actor)} moveu #${row.id} para ${({ backlog: 'A fazer', doing: 'Fazendo', review: 'Revisão', done: 'Feito' })[f.status]}.`;
      store.log(msg, { agent_id: req.isAgent ? req.actor : 'admin', level: f.status === 'review' ? 'warn' : f.status === 'done' ? 'success' : 'info', task_id: row.id, link: taskLink(row.id) });
    }
    res.json({ task });
  }));
  // Artefatos: link para post da Central, proposta de anúncio, arquivo no Mac, ou texto (rascunho de e-mail/resposta, até 64 KB)
  app.post(`${A}/tasks/:id/artifacts`, either, wrap(async (req, res) => {
    const row = store.getTaskRow(Number(req.params.id));
    if (!row) throw bad('Tarefa não encontrada.', 404);
    const b = req.body || {};
    const kind = b.kind || (b.content ? 'texto' : b.path && !b.url ? 'arquivo' : 'link');
    if (!store.ARTIFACT_KINDS.includes(kind)) throw bad(`kind inválido. Use ${store.ARTIFACT_KINDS.join(', ')}.`);
    const url = b.url ? safeUrl(b.url) : null;
    if (b.url && !url) throw bad('url inválida: use https://… ou um caminho do site começando com /.');
    const content = b.content !== undefined ? String(b.content) : null;
    if (content && Buffer.byteLength(content) > 64 * 1024) throw bad('Texto grande demais (máximo 64 KB). Salve num arquivo e anexe o caminho.');
    if (!url && !content && !b.path) throw bad('Informe url, path ou content.');
    const art = store.addArtifact({ task_id: row.id, agent_id: req.actor, kind, label: str(b.label, 200) || '', url, path: str(b.path, 500) || null, content });
    store.log(`${agentName(req.actor)} anexou ${kind === 'post' ? 'um post da Central' : kind === 'anuncio' ? 'uma proposta de anúncio' : kind === 'texto' ? 'um rascunho' : kind === 'arquivo' ? 'um arquivo' : 'um link'} em #${row.id}${art.label ? `: ${art.label}` : ''}`,
      { agent_id: req.isAgent ? req.actor : 'admin', task_id: row.id, link: url || taskLink(row.id) });
    res.status(201).json({ artifact: art });
  }));

  // ---- Conversa da tarefa (dono ↔ agentes). Os agentes leem no `me` (messages) e respondem com office.mjs comment ----
  app.get(`${A}/tasks/:id/comments`, either, wrap(async (req, res) => {
    const t = store.getTaskRow(Number(req.params.id));
    if (!t) throw bad('Tarefa não encontrada.', 404);
    res.set('Cache-Control', 'no-store').json({ task_id: t.id, comments: store.listComments(t.id, { since: req.query.since ? Number(req.query.since) : null }) });
  }));
  app.post(`${A}/tasks/:id/comments`, either, wrap(async (req, res) => {
    const t = store.getTaskRow(Number(req.params.id));
    if (!t) throw bad('Tarefa não encontrada.', 404);
    const body = String((req.body || {}).body || (req.body || {}).text || '').trim();
    if (!body) throw bad('Escreva a mensagem.');
    if (body.length > 4000) throw bad('Mensagem grande demais (máximo 4.000 caracteres). Anexe um texto na tarefa.');
    const author = req.isAgent ? req.actor : 'admin';
    if (req.isAgent) store.updateAgent(author, { last_heartbeat: Date.now() });
    // O dono escreveu numa tarefa concluída: ela volta para "Fazendo" para o agente responder (a Conversa promete isso)
    if (!req.isAgent && t.status === 'done') {
      store.updateTask(t.id, { status: 'doing', approval: null, escalated: 0 });
      store.log(`Você reabriu #${t.id} ao escrever na conversa.`, { agent_id: 'admin', task_id: t.id, link: taskLink(t.id) });
    }
    const c = store.addComment(t.id, author, body);
    const snip = body.replace(/\s+/g, ' ').slice(0, 140);
    store.log(req.isAgent ? `${agentName(author)} respondeu em #${t.id}: ${snip}` : `Você escreveu em #${t.id}: ${snip}`, { agent_id: req.isAgent ? author : 'admin', task_id: t.id, link: taskLink(t.id) });
    res.status(201).json({ comment: c });
  }));

  // ---- Pedidos do dono ("Pedir ao time"): viram tarefa do Diretor com a etiqueta pedido-do-dono, prioridade alta ----
  // O agendador do Mac (tools/agencia/tick.mjs) acorda o Diretor na próxima passada (até 5 min), a qualquer hora e sem a espera
  // entre rodadas; o botão de emergência e os limites do dia continuam valendo. Anexos: POST /tasks/:id/files depois.
  app.post(`${A}/pedidos`, admin, wrap(async (req, res) => {
    const text = String((req.body || {}).text || '').trim();
    if (text.length < 3) throw bad('Escreva o que você precisa (uma frase já basta).');
    if (text.length > 8000) throw bad('Pedido grande demais (máximo 8.000 caracteres). Anexe um arquivo com o resto.');
    const first = text.split('\n').find((l) => l.trim()) || text;
    const title = first.trim().replace(/\s+/g, ' ').slice(0, 120) + (first.trim().length > 120 ? '…' : '');
    const task = store.createTask({ title, description: text, status: 'backlog', assignee: 'diretor', created_by: 'admin', priority: 1, tags: [store.PEDIDO_TAG] });
    store.log(`Você pediu ao time (#${task.id}): ${title} · o Diretor pega na próxima passada do agendador do Mac (até 5 min).`, { agent_id: 'admin', level: 'warn', task_id: task.id, link: taskLink(task.id) });
    res.status(201).json({ task });
  }));
  app.get(`${A}/pedidos`, admin, (req, res) => {
    const list = store.listTasks({ tag: store.PEDIDO_TAG, limit: 60 }).map((t) => ({ ...t, children: store.listTasks({ parent: t.id, limit: 100 }).map((c) => ({ id: c.id, title: c.title, status: c.status, assignee: c.assignee, approval: c.approval, created_by: c.created_by, created_at: c.created_at, updated_at: c.updated_at })) }));
    res.set('Cache-Control', 'no-store').json({ pedidos: list });
  });

  // ---- Caixa de aprovação: tarefas em Revisão, posts aguardando e propostas de anúncio numa lista (lib/office/inbox.js) ----
  app.get(`${A}/inbox`, admin, (req, res) => res.set('Cache-Control', 'no-store').json(inbox.list()));
  // Post da Central: aprovar (agenda) ou pedir ajuste (volta para Rascunhos com o comentário)
  app.post(`${A}/inbox/posts/:id`, admin, wrap(async (req, res) => {
    const sc = inbox.social();
    if (!sc || !sc.ownerReview) throw bad('Central de Redes Sociais indisponível.', 503);
    const b = req.body || {};
    const post = sc.ownerReview(Number(req.params.id), { action: String(b.action || ''), comment: str(b.comment, 1000) || '' });
    store.log(b.action === 'approve' ? `Você aprovou o post #${post.id} da Central (agendado).` : `Você pediu ajustes no post #${post.id} da Central${b.comment ? `: ${str(b.comment, 200)}` : '.'}`,
      { agent_id: 'admin', level: b.action === 'approve' ? 'success' : 'warn', link: '/admin/social' });
    res.json({ post });
  }));
  // Comentário das redes: approve (com a resposta editada; envia já) | changes (volta para a Comunidade) | ignore | veto (barra o que o Gerente aprovou no modo 2h)
  app.post(`${A}/inbox/comentarios/:id`, admin, wrap(async (req, res) => {
    const cm = comments();
    if (!cm) throw bad('Central de Redes Sociais indisponível.', 503);
    const b = req.body || {};
    const action = String(b.action || '');
    const c = cm.ownerReview(Number(req.params.id), { action, reply: b.reply !== undefined ? str(b.reply, 4000) : undefined, comment: str(b.comment, 1000) || '' });
    const what = { approve: 'aprovou a resposta ao comentário', changes: 'pediu ajuste na resposta ao comentário', ignore: 'ignorou o comentário', veto: 'barrou a resposta ao comentário' }[action];
    store.log(`Você ${what} #${c.id} (${c.network})${action === 'approve' ? ': enviando' : ''}${b.comment ? ` · ${str(b.comment, 160)}` : '.'}`,
      { agent_id: 'admin', level: action === 'approve' ? 'success' : 'warn', link: '/admin/social' });
    res.json({ comentario: c });
  }));
  // Kit pronto: "Já postei" (o dono postou pelo app; permalink opcional)
  app.post(`${A}/inbox/posts/:id/kit`, admin, wrap(async (req, res) => {
    const sc = inbox.social();
    if (!sc || !sc.kitDone) throw bad('Central de Redes Sociais indisponível.', 503);
    const b = req.body || {};
    const post = sc.kitDone(Number(req.params.id), { permalink: str(b.permalink, 500) || '', actor: 'admin' });
    store.log(`Você postou pelo app o post #${post.id} da Central (Kit).`, { agent_id: 'admin', level: 'success', link: '/admin/social' });
    res.json({ post });
  }));
  // Legenda editada antes de aprovar: guarda a versão anterior (histórico) e atualiza o post
  app.post(`${A}/inbox/posts/:id/caption`, admin, wrap(async (req, res) => {
    const sc = inbox.social();
    if (!sc || !sc.ownerCaption) throw bad('Central de Redes Sociais indisponível.', 503);
    const caption = (req.body || {}).caption;
    if (typeof caption !== 'string' || !caption.trim()) throw bad('A legenda não pode ficar vazia.');
    const r = sc.ownerCaption(Number(req.params.id), caption);
    const versions = store.addPostVersion(r.post.id, { original: r.before, originalAuthor: r.before_author, caption: r.post.caption });
    res.json({ post: r.post, versions });
  }));
  app.get(`${A}/inbox/posts/:id/versions`, admin, (req, res) => res.json({ versions: store.postVersions(Number(req.params.id)) }));
  // Entrega em texto editada pelo dono: vira uma versão nova (a original e as anteriores ficam no histórico)
  app.post(`${A}/artifacts/:id/edit`, admin, wrap(async (req, res) => {
    const a = store.getArtifact(req.params.id);
    if (!a || !a.task_id) throw bad('Entrega não encontrada.', 404);
    if (a.kind !== 'texto') throw bad('Só entregas em texto podem ser editadas aqui.', 409);
    const content = (req.body || {}).content;
    if (typeof content !== 'string' || !content.trim()) throw bad('O texto não pode ficar vazio.');
    if (Buffer.byteLength(content) > 64 * 1024) throw bad('Texto grande demais (máximo 64 KB).');
    const art = store.addArtifactVersion(a.id, content, 'admin');
    store.log(`Você editou a entrega "${a.label || `#${a.id}`}" de #${a.task_id} (versão ${art.version}).`, { agent_id: 'admin', task_id: a.task_id, link: taskLink(a.task_id) });
    res.status(201).json({ artifact: art, versions: store.artifactVersions(art.id) });
  }));
  app.get(`${A}/artifacts/:id/versions`, either, (req, res) => res.json({ versions: store.artifactVersions(req.params.id) }));

  // ---- Anexos (arquivos) das tarefas: lib/office/files.js ----
  // Leem e enviam: o dono, o responsável, o gerente da área dele, o Gerente Geral e o Diretor. Só o dono remove.
  const fileTask = (req) => {
    const t = store.getTaskRow(Number(req.params.id));
    if (!t) throw bad('Tarefa não encontrada.', 404);
    if (!files.canRead(req.actor, t)) throw bad('Só o responsável pela tarefa, o gerente da área dele, o Gerente Geral e o Diretor veem os anexos.', 403);
    return t;
  };
  app.get(`${A}/tasks/:id/files`, either, wrap(async (req, res) => {
    const t = fileTask(req);
    res.set('Cache-Control', 'no-store').json({ task_id: t.id, files: files.list(t.id) });
  }));
  app.post(`${A}/tasks/:id/files`, either, wrap(async (req, res) => {
    fileTask(req); // confere antes de ler o corpo
    await receive(req, res);
    const t = fileTask(req);
    const added = await files.add(t.id, req.files || [], req.actor);
    store.updateTask(t.id, {}); // avisa o painel (SSE) com a lista nova
    store.log(`${agentName(req.actor)} anexou ${added.length === 1 ? `o arquivo ${added[0].name}` : `${added.length} arquivos`} em #${t.id}`, { agent_id: req.isAgent ? req.actor : 'admin', task_id: t.id, link: taskLink(t.id) });
    res.status(201).json({ files: added });
  }));
  app.get(`${A}/files/:fid/download`, either, wrap(async (req, res) => {
    const f = files.get(Number(req.params.fid));
    if (!f) throw bad('Arquivo não encontrado.', 404);
    const t = store.getTaskRow(f.task_id);
    if (!files.canRead(req.actor, t)) throw bad('Sem acesso a este anexo.', 403);
    const buf = await files.read(f);
    // auditoria: todo download de agente fica no feed
    if (req.isAgent) store.log(`${agentName(req.actor)} baixou o anexo ${f.name} de #${t.id}`, { agent_id: req.actor, task_id: t.id, link: taskLink(t.id) });
    files.sendHeaders(res, f, { inline: req.query.inline === '1' && !req.isAgent });
    res.send(buf);
  }));
  app.delete(`${A}/files/:fid`, admin, wrap(async (req, res) => {
    const f = files.get(Number(req.params.fid));
    if (!f) throw bad('Arquivo não encontrado.', 404);
    await files.remove(f);
    store.updateTask(f.task_id, {});
    store.log(`Você removeu o anexo ${f.name} de #${f.task_id}`, { agent_id: 'admin', level: 'warn', task_id: f.task_id, link: taskLink(f.task_id) });
    res.json({ ok: true });
  }));
  // Retenção: apaga anexos antigos ao subir e uma vez por dia
  const purge = () => files.purge(Number(store.getSetting('files_days')) || files.DEFAULT_DAYS).then((n) => { if (n) store.log(`${n} anexo(s) com mais de ${store.getSetting('files_days')} dias apagado(s) (retenção).`, { agent_id: 'admin' }); }).catch((e) => console.error('[escritorio] retenção dos anexos:', e.message));
  setTimeout(purge, 30000).unref();
  setInterval(purge, 86400000).unref();

  // ---- Rodadas do executor (custo e resumo) ----
  app.post(`${A}/runs`, either, wrap(async (req, res) => {
    const b = req.body || {};
    const id = req.isAgent ? req.actor : String(b.agent || '');
    if (!roster.byId[id]) throw bad('Agente desconhecido.');
    if (b.phase === 'start') {
      const check = runnerCheck(id);
      if (!check.allowed && !b.force_log) return res.status(423).json({ error: check.reasons.join(' '), check });
      const runId = store.startRun(id, str(b.trigger, 60));
      store.updateAgent(id, { status: 'working', current_task: str(b.task, 300) || 'Começando a rodada', last_heartbeat: Date.now() });
      store.log(`${agentName(id)} começou uma rodada${b.trigger ? ` (${str(b.trigger, 60)})` : ''}.`, { agent_id: id });
      store.emit('run', { id: runId, agent_id: id, status: 'running' });
      return res.status(201).json({ run_id: runId, check });
    }
    if (b.phase === 'end') {
      const status = ['ok', 'error', 'skipped'].includes(b.status) ? b.status : 'ok';
      const cost = b.cost_usd !== undefined && b.cost_usd !== null && Number.isFinite(Number(b.cost_usd)) ? Number(b.cost_usd) : null;
      const r = b.run_id ? store.endRun(Number(b.run_id), { status, cost_usd: cost, summary: str(b.summary, 2000) || null }) : null;
      const cur = store.getAgent(id);
      const keep = (cur.status === 'waiting' || cur.status === 'blocked') && awaitsOwner(id); // só fica "esperando você" com algo em Aprovar
      store.updateAgent(id, { status: status === 'error' ? 'error' : (keep ? cur.status : 'idle'), last_heartbeat: Date.now(), ...(status === 'error' || keep ? {} : { current_task: null, task_id: null }) });
      store.log(`${agentName(id)} terminou a rodada${status === 'error' ? ' com erro' : ''}${cost !== null ? ` (US$ ${cost.toFixed(2)})` : ''}${b.summary ? `: ${str(b.summary, 300)}` : '.'}`, { agent_id: id, level: status === 'error' ? 'error' : 'success' });
      store.emit('run', r || { agent_id: id, status });
      return res.json({ ok: true, run: r, usage: store.usageToday() });
    }
    throw bad('phase deve ser start ou end.');
  }));
  // ---- Lançar gasto no Financeiro (/admin/financeiro) a pedido do dono: só o time de finanças e sempre ligado a uma tarefa.
  // O lançamento entra com a origem nas notas e no feed; o dono edita ou apaga na tela do Financeiro. Valor por item até R$ 20 mil.
  const FIN_AGENTS = ['financeiro', 'gerente-financeiro'];
  const finance = () => require('../cockpit/finance');
  app.get(`${A}/financeiro/custos`, either, wrap(async (req, res) => {
    if (req.isAgent && !FIN_AGENTS.includes(req.actor)) throw bad('Só o time de finanças vê os custos lançados.', 403);
    await finance().ready;
    res.json({ costs: finance().listCosts().map((c) => ({ id: c.id, name: c.name, category: c.category, amount_cents: c.amount_cents, currency: c.currency, recurrence: c.recurrence, start_date: c.start_date, end_date: c.end_date, notes: c.notes })),
      categories: finance().CATEGORIES, recurrences: finance().RECURRENCES });
  }));
  app.post(`${A}/financeiro/custos`, either, wrap(async (req, res) => {
    const b = req.body || {};
    if (req.isAgent && !FIN_AGENTS.includes(req.actor)) throw bad('Só o Financeiro e o Gerente Financeiro lançam gastos.', 403);
    const task = store.getTaskRow(Number(b.task_id));
    if (!task) throw bad('Informe a tarefa do pedido (task_id): todo lançamento fica ligado a uma tarefa.');
    const cents = Math.round(Number(b.amount_cents));
    if (!Number.isFinite(cents) || cents <= 0) throw bad('Valor inválido (amount_cents, em centavos).');
    if (cents > 2000000) throw bad('Acima de R$ 20.000 por item: peça para o dono lançar na tela do Financeiro.');
    await finance().ready;
    const who = req.isAgent ? agentName(req.actor) : 'você';
    const notes = [String(b.notes || '').trim().slice(0, 380), `Lançado por ${who} na tarefa #${task.id}.`].filter(Boolean).join(' ');
    const id = finance().createCost({ ...b, amount_cents: cents, notes });
    const brl = (cents / 100).toFixed(2).replace('.', ',');
    store.log(`${req.isAgent ? agentName(req.actor) : 'Você'} lançou no Financeiro: ${String(b.name || '').slice(0, 80)} (${b.currency === 'USD' ? 'US$' : 'R$'} ${brl}, ${b.recurrence || 'mensal'}).`, { agent_id: req.isAgent ? req.actor : 'admin', level: 'success', task_id: task.id, link: '/admin/financeiro' });
    res.status(201).json({ id });
  }));

  // Corrigir ou apagar um lançamento (o dono pediu na tarefa): o valor antigo vai para o feed, para dar para desfazer
  const finCtx = (req) => {
    if (req.isAgent && !FIN_AGENTS.includes(req.actor)) throw bad('Só o Financeiro e o Gerente Financeiro mexem nos gastos.', 403);
    const task = store.getTaskRow(Number((req.body || {}).task_id || req.query.task_id));
    if (!task) throw bad('Informe a tarefa do pedido (task_id): toda mudança fica ligada a uma tarefa.');
    return { task, who: req.isAgent ? agentName(req.actor) : 'Você', agent_id: req.isAgent ? req.actor : 'admin' };
  };
  const costLine = (c) => `${c.name} (${c.currency === 'USD' ? 'US$' : 'R$'} ${(c.amount_cents / 100).toFixed(2).replace('.', ',')}, ${c.recurrence}${c.start_date ? `, desde ${c.start_date}` : ''})`;
  app.patch(`${A}/financeiro/custos/:id`, either, wrap(async (req, res) => {
    const { task, who, agent_id } = finCtx(req);
    await finance().ready;
    const before = finance().listCosts().find((c) => c.id === Number(req.params.id));
    if (!before) throw bad('Custo não encontrado.', 404);
    const b = req.body || {};
    const f = {};
    for (const k of ['name', 'category', 'recurrence', 'currency', 'start_date', 'end_date', 'notes']) if (b[k] !== undefined) f[k] = b[k];
    if (b.amount_cents !== undefined) {
      const cents = Math.round(Number(b.amount_cents));
      if (!Number.isFinite(cents) || cents <= 0) throw bad('Valor inválido (amount_cents, em centavos).');
      if (cents > 2000000) throw bad('Acima de R$ 20.000 por item: peça para o dono ajustar na tela do Financeiro.');
      f.amount_cents = cents;
    }
    finance().updateCost(before.id, f);
    const after = finance().listCosts().find((c) => c.id === before.id);
    store.log(`${who} corrigiu o gasto #${before.id} no Financeiro: antes ${costLine(before)} → agora ${costLine(after)}.`, { agent_id, level: 'success', task_id: task.id, link: '/admin/financeiro' });
    res.json({ cost: after, before });
  }));
  app.delete(`${A}/financeiro/custos/:id`, either, wrap(async (req, res) => {
    const { task, who, agent_id } = finCtx(req);
    await finance().ready;
    const before = finance().listCosts().find((c) => c.id === Number(req.params.id));
    if (!before) throw bad('Custo não encontrado.', 404);
    finance().deleteCost(before.id);
    store.log(`${who} apagou o gasto #${before.id} do Financeiro: ${costLine(before)}${before.notes ? ` · notas: ${String(before.notes).slice(0, 120)}` : ''}.`, { agent_id, level: 'warn', task_id: task.id, link: '/admin/financeiro' });
    res.json({ ok: true, before });
  }));

  // Pedidos de "rodar agora" feitos no painel: o agendador do Mac busca e consome
  app.get(`${A}/runner/requests`, either, (req, res) => {
    const list = JSON.parse(store.getSetting('run_requests') || '[]');
    if (req.isAgent && req.query.claim) store.setSetting('run_requests', '[]');
    res.json({ requests: list });
  });

  // ---- Comentários das redes (lib/social/comments.js): a Comunidade lê, responde (rascunho → aguardando) ou ignora ----
  // Nada sai daqui: quem aprova é o Gerente Geral (não sensível, modo do Gerente) ou o dono (caixa Aprovar); o servidor envia depois.
  const cmOr503 = () => { const cm = comments(); if (!cm) throw bad('Central de Redes Sociais indisponível.', 503); return cm; };
  app.get(`${A}/comentarios`, either, wrap(async (req, res) => {
    const cm = cmOr503();
    if (req.isAgent && !COMMENT_READERS.includes(req.actor)) throw bad('Comentários das redes: só a Comunidade, o Gerente Geral, o Gerente de Marketing e o Diretor leem.', 403);
    const status = req.query.status ? String(req.query.status) : (req.isAgent && req.actor === 'comunidade' ? 'novo,rascunho' : null);
    res.set('Cache-Control', 'no-store').json({ comentarios: cm.list({ network: req.query.rede || req.query.network || null, status, limit: Number(req.query.limit) || 100 }),
      resumo: cm.summary(), classes: cm.CLASSES });
  }));
  const onlyCommunity = (req) => { if (req.isAgent && req.actor !== 'comunidade') throw bad('Só a Comunidade (e o dono) responde ou ignora comentários. O Gerente Geral revisa com /gerente/comentarios.', 403); };
  app.post(`${A}/comentarios/:id/responder`, either, wrap(async (req, res) => {
    const cm = cmOr503();
    onlyCommunity(req);
    const b = req.body || {};
    if (req.isAgent) store.updateAgent(req.actor, { last_heartbeat: Date.now() });
    const c = cm.draft(Number(req.params.id), { text: b.texto ?? b.text ?? b.reply, classification: b.classe ?? b.classification, sensitive: b.sensivel ?? b.sensitive ?? null, actor: req.actor });
    store.log(`${agentName(req.actor)} respondeu o comentário #${c.id} (${c.network}) para aprovação${c.sensitive ? ` · sensível: ${c.sensitive_reason}` : ''}.`, { agent_id: req.isAgent ? req.actor : 'admin', level: c.sensitive ? 'warn' : 'info', link: '/admin/escritorio' });
    res.json({ comentario: c });
  }));
  app.post(`${A}/comentarios/:id/ignorar`, either, wrap(async (req, res) => {
    const cm = cmOr503();
    onlyCommunity(req);
    const b = req.body || {};
    const c = cm.ignore(Number(req.params.id), { reason: b.motivo ?? b.reason, actor: req.actor });
    store.log(`${agentName(req.actor)} ignorou o comentário #${c.id} (${c.network}): ${str(c.ignore_reason, 160)}${c.hide_suggested ? ' · sugestão: ocultar no app' : ''}`, { agent_id: req.isAgent ? req.actor : 'admin' });
    res.json({ comentario: c });
  }));

  // Dados de leitura para os agentes (ops, financeiro, analytics, anuncios, suporte, social): ver lib/office/data.js
  app.get(`${A}/data/:name`, either, wrap(async (req, res) => {
    const d = await data.get(req.params.name);
    if (!d) throw bad(`Fonte desconhecida. Use: ${data.NAMES.join(', ')}.`, 404);
    res.set('Cache-Control', 'no-store').json(d);
  }));

  // ---- Só o dono ----
  // Configurações do escritório: risco médio (parar/religar, retenção, baixar o teto). Subir ou tirar o teto diário de gasto
  // é risco alto (dinheiro): pede o código recente (lib/security, docs/seguranca.md).
  const high = accessSensitive();
  const raisesCap = (b) => {
    if (!b || b.daily_usd === undefined) return false;
    const cur = Number(store.getSetting('daily_usd')) || 0, v = Math.max(0, Number(b.daily_usd) || 0);
    return (cur > 0 && v === 0) || (cur > 0 && v > cur);
  };
  app.post(`${A}/settings`, (req, res, next) => (raisesCap(req.body) ? high : admin)(req, res, next), wrap(async (req, res) => {
    const b = req.body || {};
    if (b.kill !== undefined) {
      const on = b.kill === true || b.kill === '1' || b.kill === 1;
      store.setSetting('kill', on ? '1' : '0');
      store.log(on ? 'Botão de emergência LIGADO: nenhum agente começa rodada nova e as rodadas em andamento são encerradas.' : 'Botão de emergência desligado: agentes liberados.', { agent_id: 'admin', level: on ? 'error' : 'success' });
    }
    if (b.daily_usd !== undefined) {
      const v = Math.max(0, Math.min(1000, Number(b.daily_usd) || 0));
      store.setSetting('daily_usd', v);
      store.log(v ? `Teto diário da agência: US$ ${v.toFixed(2)}.` : 'Teto diário do servidor desligado (vale o do agencia.json).', { agent_id: 'admin' });
    }
    if (b.files_days !== undefined) {
      const v = Math.max(1, Math.min(3650, Math.round(Number(b.files_days)) || files.DEFAULT_DAYS));
      store.setSetting('files_days', v);
      store.log(`Anexos das tarefas ficam guardados por ${v} dias.`, { agent_id: 'admin' });
    }
    store.emit('settings', settings());
    res.json({ settings: settings() });
  }));
  app.post(`${A}/agents/:id`, admin, wrap(async (req, res) => {
    const id = req.params.id;
    if (!roster.byId[id]) throw bad('Agente não encontrado.', 404);
    const b = req.body || {};
    const f = {};
    if (b.enabled !== undefined) f.enabled = b.enabled ? 1 : 0;
    if (b.status !== undefined) { if (!store.AGENT_STATUSES.includes(b.status)) throw bad('status inválido.'); f.status = b.status; if (b.status === 'idle') { f.current_task = null; f.task_id = null; } }
    const agent = store.updateAgent(id, f);
    if (f.enabled !== undefined) store.log(`Você ${f.enabled ? 'ligou' : 'desligou'} ${agent.name}.`, { agent_id: 'admin', level: f.enabled ? 'success' : 'warn' });
    res.json({ agent });
  }));
  app.post(`${A}/agents/:id/run`, admin, wrap(async (req, res) => {
    const id = req.params.id;
    if (!roster.byId[id]) throw bad('Agente não encontrado.', 404);
    const list = JSON.parse(store.getSetting('run_requests') || '[]').filter((r) => r.agent !== id);
    list.push({ agent: id, at: Date.now(), prompt: str((req.body || {}).prompt, 2000) || null });
    store.setSetting('run_requests', JSON.stringify(list.slice(-20)));
    store.log(`Você pediu uma rodada de ${agentName(id)} (o agendador do Mac começa em até 5 minutos, se estiver ligado).`, { agent_id: 'admin' });
    res.json({ ok: true, requests: list });
  }));
  app.post(`${A}/tasks/:id/action`, admin, wrap(async (req, res) => {
    const row = store.getTaskRow(Number(req.params.id));
    if (!row) throw bad('Tarefa não encontrada.', 404);
    const b = req.body || {};
    const feedback = str(b.feedback, 2000) || null;
    let task;
    if (b.action === 'approve') {
      task = store.updateTask(row.id, { status: 'done', approval: 'aprovado', feedback, reviewed_by: 'admin', escalated: 0 });
      store.log(`Você aprovou #${row.id}: ${row.title}${feedback ? ` (${feedback})` : ''}`, { agent_id: 'admin', level: 'success', task_id: row.id, link: taskLink(row.id) });
    } else if (b.action === 'flag') {
      // "Sensível" na mão: o dono decide de vez (o automático não recalcula mais esta tarefa)
      const on = b.sensitive === true || b.sensitive === 1 || b.sensitive === '1' || b.sensitive === 'true';
      task = store.updateTask(row.id, gerente.sensitiveFields(row, row, { value: on, by: 'admin' }));
      store.log(on ? `Você marcou #${row.id} como sensível: só você aprova.` : `Você desmarcou "sensível" em #${row.id}: o Gerente pode aprovar.`, { agent_id: 'admin', level: on ? 'warn' : 'info', task_id: row.id, link: taskLink(row.id) });
      return res.json({ task });
    } else if (b.action === 'reject') {
      task = store.updateTask(row.id, { status: 'doing', approval: 'rejeitado', feedback, reviewed_by: 'admin', escalated: 0 });
      store.log(`Você pediu ajustes em #${row.id}${feedback ? `: ${feedback}` : '.'}`, { agent_id: 'admin', level: 'warn', task_id: row.id, link: taskLink(row.id) });
    } else if (b.action === 'move') {
      if (!store.TASK_STATUSES.includes(b.status)) throw bad('status inválido.');
      task = store.updateTask(row.id, { status: b.status, ...(b.status === 'review' ? { approval: 'pendente', ...AREA_RESET } : row.approval === 'pendente' && b.status !== 'done' ? { approval: null, escalated: 0 } : {}) });
      store.log(`Você moveu #${row.id} para ${({ backlog: 'A fazer', doing: 'Fazendo', review: 'Revisão', done: 'Feito' })[b.status]}.`, { agent_id: 'admin', task_id: row.id });
    } else throw bad('action deve ser approve, reject, flag ou move.');
    if (b.action !== 'move') releaseWaiting(row);
    if (task && task.status === 'done') rollupParent(row.parent_id);
    res.json({ task });
  }));

  // ---- Gerente (X-Agent-Id: gerente): revisa e aprova pelo dono, dentro dos limites de lib/office/gerente.js ----
  const onlyGerente = (req, res, next) => {
    if (!req.isAgent || req.actor !== gerente.ID) return res.status(403).json({ error: 'Rota só do Gerente Geral (X-Agent-Id: gerente). Os gerentes de área usam /area/*; os outros agentes e o dono, as próprias telas.' });
    store.updateAgent(gerente.ID, { last_heartbeat: Date.now() });
    next();
  };
  const G = `${A}/gerente`;
  const modeNow = () => gerente.normMode(store.getSetting('gerente_mode'));
  const needComment = (c) => {
    const s = String(c || '').trim();
    if (s.length < gerente.MIN_COMMENT) throw bad(`Escreva um comentário concreto (mínimo ${gerente.MIN_COMMENT} caracteres): o que conferiu, o que mudar e por quê.`);
    return s.slice(0, 2000);
  };

  // Fila: tarefas em Revisão (com "pode aprovar?" e o motivo), posts esperando aprovação, agentes livres e o modo
  app.get(`${G}/queue`, either, onlyGerente, (req, res) => {
    const review = store.listTasks({ status: ['review'], limit: 200 }).map((t) => ({ ...t, can_approve: !gerente.approveBlock(t), block: gerente.approveBlock(t) }));
    const sc = social();
    const posts = sc && sc.gerenteQueue ? (() => { try { return sc.gerenteQueue(); } catch { return []; } })() : [];
    const open = store.listTasks({ status: ['backlog', 'doing'], limit: 300 });
    const idle = store.listAgents().filter((a) => a.enabled && a.id !== gerente.ID && a.status === 'idle' && !open.some((t) => t.assignee === a.id)).map((a) => ({ id: a.id, name: a.name, role: a.role }));
    const pending = review.filter((t) => !t.reviewed_by);
    // Respostas a comentários esperando aprovação (as sensíveis aparecem com o motivo: ficam com o dono)
    const cm = comments();
    const coms = cm ? (() => { try { return cm.gerenteQueue(modeNow()); } catch { return []; } })() : [];
    // pré-aprovadas pela área primeiro (já passaram pela coordenação), depois as demais
    review.sort((x, y) => Number(y.pre_approved) - Number(x.pre_approved));
    const comActionable = coms.filter((c) => c.can_approve).length; // sensível ou modo Desligado: fica com o dono
    res.json({ mode: modeNow(), modes: gerente.MODES, tasks: review, posts, comentarios: coms, idle_agents: idle,
      actionable: { tasks: pending.length, posts: posts.length, comentarios: comActionable, total: pending.length + posts.length + comActionable, pre_approved: pending.filter((t) => t.pre_approved).length } });
  });

  app.post(`${G}/tasks/:id/review`, either, onlyGerente, wrap(async (req, res) => {
    const row = store.getTaskRow(Number(req.params.id));
    if (!row) throw bad('Tarefa não encontrada.', 404);
    const b = req.body || {};
    const comment = needComment(b.comment);
    const t = store.getTask(row.id);
    const mode = modeNow();
    let task;
    if (b.action === 'approve') {
      const block = gerente.approveBlock(t);
      if (block) {
        // Fica "esperando você": marca como escalada (o Gerente não acorda de novo por ela) e registra o parecer
        if (t.status === 'review') {
          store.updateTask(row.id, { escalated: 1, reviewed_by: gerente.ID, review_note: comment });
          store.log(`Gerente: #${row.id} precisa de você (${block.replace(/\s*A tarefa fica "esperando você"\.|\s*Ela fica "esperando você"\./, '')}). Parecer: ${comment}`, { agent_id: gerente.ID, level: 'warn', task_id: row.id, link: taskLink(row.id) });
        }
        throw Object.assign(bad(block, t.status === 'review' ? 403 : 409), { extra: { sensitive: !!t.sensitive, escalated: t.status === 'review' } });
      }
      if (mode === 'off') throw bad('Modo do Gerente: Desligado. O Gerente só comenta (action: comment); quem aprova é o dono.', 409);
      task = store.updateTask(row.id, { status: 'done', approval: 'aprovado', reviewed_by: gerente.ID, review_note: comment, escalated: 0 });
      store.log(`Gerente aprovou #${row.id}: ${row.title} · ${comment}`, { agent_id: gerente.ID, level: 'success', task_id: row.id, link: taskLink(row.id) });
      releaseWaiting(row);
      rollupParent(row.parent_id);
    } else if (b.action === 'changes') {
      if (row.status !== 'review') throw bad('O Gerente só pede ajustes em tarefa que está em Revisão.', 409);
      if (mode === 'off') throw bad('Modo do Gerente: Desligado. O Gerente só comenta (action: comment).', 409);
      task = store.updateTask(row.id, { status: 'doing', approval: 'rejeitado', feedback: `Gerente: ${comment}`, reviewed_by: gerente.ID, review_note: comment, escalated: 0 });
      store.log(`Gerente pediu ajustes em #${row.id}: ${comment}`, { agent_id: gerente.ID, level: 'warn', task_id: row.id, link: taskLink(row.id) });
      releaseWaiting(row);
    } else if (b.action === 'comment' || b.action === 'escalate') {
      if (row.status !== 'review') throw bad('O Gerente só comenta tarefa que está em Revisão.', 409);
      task = store.updateTask(row.id, { reviewed_by: gerente.ID, review_note: comment, escalated: 1 });
      store.log(`Gerente comentou #${row.id} e deixou para você: ${comment}`, { agent_id: gerente.ID, level: 'info', task_id: row.id, link: taskLink(row.id) });
    } else throw bad('action deve ser approve, changes ou comment.');
    res.json({ task, mode });
  }));

  app.post(`${G}/posts/:id/review`, either, onlyGerente, wrap(async (req, res) => {
    const sc = social();
    if (!sc || !sc.gerenteReview) throw bad('Central de Redes Sociais indisponível.', 503);
    const b = req.body || {};
    const comment = needComment(b.comment);
    const mode = modeNow();
    const post = sc.gerenteReview(Number(req.params.id), { action: String(b.action || ''), comment, mode });
    if (b.action === 'approve') {
      store.log(`Gerente aprovou o post #${post.id} da Central${mode === '2h' ? ` · sai ${new Date(post.scheduled_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} (dá para barrar até lá)` : ''} · ${comment}`, { agent_id: gerente.ID, level: 'success', link: '/admin/social' });
      store.emit('gerente', { posts: gerentePosts() });
    } else if (b.action === 'changes') store.log(`Gerente pediu ajustes no post #${post.id} da Central: ${comment}`, { agent_id: gerente.ID, level: 'warn', link: '/admin/social' });
    res.json({ post, mode });
  }));

  // Resposta a comentário: approve (não sensível; direto = envia já, 2h = sai em 2 h, off = recusado) | changes (volta para a Comunidade)
  app.post(`${G}/comentarios/:id/review`, either, onlyGerente, wrap(async (req, res) => {
    const cm = cmOr503();
    const b = req.body || {};
    const comment = needComment(b.comment);
    const mode = modeNow();
    const c = cm.gerenteReview(Number(req.params.id), { action: String(b.action || ''), comment, mode });
    store.log(b.action === 'approve' ? `Gerente aprovou a resposta ao comentário #${c.id} (${c.network})${mode === '2h' ? ' · sai em 2 h (dá para barrar na caixa Aprovar)' : ' · enviando'} · ${comment}`
      : `Gerente pediu ajuste na resposta ao comentário #${c.id}: ${comment}`, { agent_id: gerente.ID, level: b.action === 'approve' ? 'success' : 'warn', link: '/admin/escritorio' });
    res.json({ comentario: c, mode });
  }));

  // ---- Gerentes de área (X-Agent-Id: gerente-marketing | -crescimento | -produto | -comercial | -financeiro) ----
  // Coordenam a própria equipe e marcam "pré-aprovado pela área". Nunca dão a aprovação final (só o Gerente Geral e o dono).
  const onlyArea = (req, res, next) => {
    if (!req.isAgent || !gerente.isAreaManager(req.actor)) return res.status(403).json({ error: `Rota só dos gerentes de área (X-Agent-Id: ${roster.AREA_MANAGERS.join(', ')}).` });
    store.updateAgent(req.actor, { last_heartbeat: Date.now() });
    next();
  };
  const AR = `${A}/area`;
  app.get(`${AR}/queue`, either, onlyArea, (req, res) => {
    const me = req.actor;
    const team = roster.teamOf(me);
    const mine = store.listTasks({ status: ['backlog', 'doing', 'review'], limit: 500 }).filter((t) => team.includes(t.assignee) || t.assignee === me);
    const review = mine.filter((t) => t.status === 'review' && t.assignee !== me).map((t) => ({ ...t, can_preapprove: !gerente.areaReviewBlock(me, t, 'preapprove', modeNow()) }));
    const members = store.listAgents().filter((a) => team.includes(a.id)).map((a) => ({ id: a.id, name: a.name, role: a.role, status: a.status, enabled: a.enabled, current_task: a.current_task,
      open: mine.filter((t) => t.assignee === a.id && t.status !== 'review').length }));
    const pending = review.filter((t) => !t.area_review);
    res.json({ manager: me, area: gerente.areaLabel(me), team, mode: modeNow(), members, review, open: mine.filter((t) => t.status !== 'review'),
      idle_members: members.filter((m) => m.enabled && m.status === 'idle' && !m.open).map((m) => m.id),
      actionable: { tasks: pending.length, total: pending.length } });
  });
  app.post(`${AR}/tasks/:id/review`, either, onlyArea, wrap(async (req, res) => {
    const row = store.getTaskRow(Number(req.params.id));
    if (!row) throw bad('Tarefa não encontrada.', 404);
    const b = req.body || {};
    const action = String(b.action || '');
    const comment = needComment(b.comment);
    const t = store.getTask(row.id);
    const block = gerente.areaReviewBlock(req.actor, t, action, modeNow());
    if (block) throw bad(block, t.status !== 'review' ? 409 : /Modo do Gerente/.test(block) ? 409 : /action deve/.test(block) ? 400 : 403);
    const me = roster.byId[req.actor];
    const now = Date.now();
    let task;
    if (action === 'preapprove') {
      // Só uma marca: a tarefa continua em Revisão, "pendente", e sensível continua sensível. Quem fecha é o Gerente Geral ou o dono.
      task = store.updateTask(row.id, { area_review_by: req.actor, area_review: 'pre_aprovado', area_review_note: comment, area_review_at: now });
      store.log(`${me.name} pré-aprovou #${row.id} (${gerente.areaLabel(req.actor)}): ${row.title} · ${comment}`, { agent_id: req.actor, level: 'info', task_id: row.id, link: taskLink(row.id) });
    } else if (action === 'changes') {
      task = store.updateTask(row.id, { status: 'doing', approval: 'rejeitado', feedback: `${me.name}: ${comment}`, area_review_by: req.actor, area_review: 'ajustes', area_review_note: comment, area_review_at: now });
      store.log(`${me.name} pediu ajustes em #${row.id}: ${comment}`, { agent_id: req.actor, level: 'warn', task_id: row.id, link: taskLink(row.id) });
      releaseWaiting(row);
    } else {
      task = store.updateTask(row.id, { area_review_by: req.actor, area_review: 'comentado', area_review_note: comment, area_review_at: now });
      store.log(`${me.name} comentou #${row.id}: ${comment}`, { agent_id: req.actor, level: 'info', task_id: row.id, link: taskLink(row.id) });
    }
    res.json({ task });
  }));

  // Modo do Gerente: qualquer um lê; só o dono muda, com a 2FA confirmada há pouco (ação sensível)
  app.get(`${G}/mode`, either, (req, res) => res.json({ mode: modeNow(), modes: gerente.MODES }));
  app.post(`${G}/mode`, accessSensitive(), wrap(async (req, res) => {
    const m = String((req.body || {}).mode || '');
    if (!Object.prototype.hasOwnProperty.call(gerente.MODES, m)) throw bad(`Modo inválido. Use ${Object.keys(gerente.MODES).join(', ')}.`);
    if (m !== modeNow()) {
      store.setSetting('gerente_mode', m);
      const msg = { direto: 'Modo do Gerente: Publicar direto. Post aprovado pelo Gerente entra na agenda no horário normal.', '2h': 'Modo do Gerente: Publicar depois de 2 horas. Post aprovado pelo Gerente só sai 2 h depois (você pode barrar).', off: 'Modo do Gerente: Desligado. O Gerente só comenta; nada é aprovado sem você.' }[m];
      store.log(msg, { agent_id: 'admin', level: m === 'direto' ? 'warn' : 'info' });
      try { require('../social/store').log(msg, { actor: 'admin' }); require('../social/store').emit('settings', {}); } catch {}
    }
    store.emit('settings', settings());
    res.json({ mode: modeNow(), settings: settings() });
  }));
  app.delete(`${A}/tasks/:id`, admin, wrap(async (req, res) => {
    const row = store.getTaskRow(Number(req.params.id));
    if (!row) throw bad('Tarefa não encontrada.', 404);
    await files.removeForTask(row.id);
    store.deleteTask(row.id);
    store.log(`Você excluiu a tarefa #${row.id}: ${row.title}`, { agent_id: 'admin', level: 'warn' });
    res.json({ ok: true });
  }));
}

module.exports = { mount, state, runnerCheck, STALE_MS };
