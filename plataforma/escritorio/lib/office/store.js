// Escritório da agência: tabelas (agentes, tarefas, artefatos, eventos, rodadas, configurações) e eventos ao vivo (SSE).
// Generaliza o registro do agente da Central de Redes Sociais para vários agentes com identidade própria.
const { EventEmitter } = require('events');
const { db, one, all, run, now } = require('../db');
const roster = require('./roster');

db.exec(`
-- status: idle | working | waiting | blocked | error
CREATE TABLE IF NOT EXISTS office_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'idle',
  current_task TEXT,
  task_id INTEGER,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_heartbeat INTEGER,
  updated_at INTEGER NOT NULL
);
-- status: backlog | doing | review | done ; approval: null | pendente | aprovado | rejeitado
CREATE TABLE IF NOT EXISTS office_tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'backlog',
  assignee TEXT,
  created_by TEXT NOT NULL DEFAULT 'admin',
  priority INTEGER NOT NULL DEFAULT 2,
  links TEXT NOT NULL DEFAULT '[]',
  approval TEXT,
  feedback TEXT,
  ref TEXT UNIQUE,
  due_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_office_tasks_status ON office_tasks(status, updated_at);
-- kind: link | post | anuncio | arquivo | texto (rascunho de e-mail, resposta, relatório curto)
CREATE TABLE IF NOT EXISTS office_artifacts (
  id INTEGER PRIMARY KEY,
  task_id INTEGER REFERENCES office_tasks(id) ON DELETE CASCADE,
  agent_id TEXT,
  kind TEXT NOT NULL DEFAULT 'link',
  label TEXT NOT NULL DEFAULT '',
  url TEXT,
  path TEXT,
  content TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_office_artifacts_task ON office_artifacts(task_id);
CREATE TABLE IF NOT EXISTS office_events (
  id INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,
  agent_id TEXT,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  task_id INTEGER,
  link TEXT
);
CREATE INDEX IF NOT EXISTS idx_office_events_ts ON office_events(ts);
-- Rodadas do executor no Mac (tools/agencia/run.mjs): status running | ok | error | skipped
CREATE TABLE IF NOT EXISTS office_runs (
  id INTEGER PRIMARY KEY,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  trigger TEXT,
  cost_usd REAL,
  summary TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_office_runs_agent ON office_runs(agent_id, started_at);
-- Anexos das tarefas (conteúdo cifrado em disco: lib/office/files.js). path = nome do arquivo na pasta privada
CREATE TABLE IF NOT EXISTS office_files (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_office_files_task ON office_files(task_id);
CREATE TABLE IF NOT EXISTS office_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
-- Conversa de cada tarefa (dono ↔ agentes). author = 'admin' (o dono) ou o id do agente
CREATE TABLE IF NOT EXISTS office_comments (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_office_comments_task ON office_comments(task_id, id);
-- Histórico das legendas dos posts da Central editadas pelo dono na Caixa de aprovação (versão 1 = a original)
CREATE TABLE IF NOT EXISTS office_post_versions (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  caption TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_office_post_versions ON office_post_versions(post_id, version);
`);

// Colunas novas (bancos antigos): sensitive = só o dono aprova (o Gerente nunca); sensitive_by = auto | admin | agente;
// reviewed_by = quem revisou por último (admin | gerente); escalated = o Gerente mandou para o dono; review_note = parecer do Gerente
// area_review_by = gerente de área que revisou; area_review = pre_aprovado | ajustes | comentado; area_review_note = parecer da área
{
  const cols = all('PRAGMA table_info(office_tasks)').map((c) => c.name);
  for (const [k, def] of [['sensitive', 'INTEGER NOT NULL DEFAULT 0'], ['sensitive_by', 'TEXT'], ['sensitive_reason', 'TEXT'], ['reviewed_by', 'TEXT'], ['escalated', 'INTEGER NOT NULL DEFAULT 0'], ['review_note', 'TEXT'],
    ['area_review_by', 'TEXT'], ['area_review', 'TEXT'], ['area_review_note', 'TEXT'], ['area_review_at', 'INTEGER'],
    // tags (JSON, ex.: ["pedido-do-dono"]) e parent_id (sub-tarefa de um pedido: o Diretor quebra o pedido do dono em partes)
    ['tags', "TEXT NOT NULL DEFAULT '[]'"], ['parent_id', 'INTEGER']]) {
    if (!cols.includes(k)) db.exec(`ALTER TABLE office_tasks ADD COLUMN ${k} ${def}`);
  }
  // Versões das entregas: a edição do dono vira um artefato novo (parent_id = o original, version = 2, 3…)
  const acols = all('PRAGMA table_info(office_artifacts)').map((c) => c.name);
  for (const [k, def] of [['parent_id', 'INTEGER'], ['version', 'INTEGER NOT NULL DEFAULT 1']]) {
    if (!acols.includes(k)) db.exec(`ALTER TABLE office_artifacts ADD COLUMN ${k} ${def}`);
  }
}
const PEDIDO_TAG = 'pedido-do-dono';

const AGENT_STATUSES = ['idle', 'working', 'waiting', 'blocked', 'error'];
const TASK_STATUSES = ['backlog', 'doing', 'review', 'done'];
const ARTIFACT_KINDS = ['link', 'post', 'anuncio', 'arquivo', 'texto'];
const LEVELS = ['info', 'success', 'warn', 'error'];
const areaOf = (id) => { const a = roster.byId[id]; return a ? roster.teamName(a.team) : id; };
const parse = (s, d) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };

// Garante uma linha por agente do elenco (nome e papel seguem o roster; status e tarefa ficam)
for (const a of roster.ROSTER) {
  run(`INSERT INTO office_agents (id, name, role, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, role = excluded.role`, a.id, a.name, a.role, now());
}

// ---------- Configurações ----------
// kill = '1' para TODOS os executores antes de começar; daily_usd = teto diário de gasto estimado (0 = sem teto no servidor)
// gerente_mode: direto | 2h | off (ver lib/office/gerente.js). Padrão: depois de 2 horas (o dono pode barrar).
// files_days = retenção dos anexos (dias)
const DEFAULTS = { kill: '0', daily_usd: '0', run_requests: '[]', gerente_mode: '2h', files_days: '180' };
function getSetting(k) { const r = one('SELECT value FROM office_settings WHERE key = ?', k); return r ? r.value : (DEFAULTS[k] ?? null); }
function setSetting(k, v) {
  if (v === null || v === undefined) run('DELETE FROM office_settings WHERE key = ?', k);
  else run('INSERT INTO office_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', k, String(v));
}

// ---------- Eventos ao vivo ----------
const bus = new EventEmitter();
bus.setMaxListeners(100);
const emit = (type, data) => bus.emit('event', { type, data });

function log(message, { agent_id = null, level = 'info', task_id = null, link = null } = {}) {
  const row = { ts: now(), agent_id, level: LEVELS.includes(level) ? level : 'info', message: String(message).slice(0, 1000), task_id, link };
  const r = run('INSERT INTO office_events (ts, agent_id, level, message, task_id, link) VALUES (?, ?, ?, ?, ?, ?)',
    row.ts, row.agent_id, row.level, row.message, row.task_id, row.link);
  row.id = Number(r.lastInsertRowid);
  emit('log', row);
  return row;
}
const recentEvents = ({ limit = 80, agent = null, before = null } = {}) => {
  const where = [], args = [];
  if (agent) { where.push('agent_id = ?'); args.push(agent); }
  if (before) { where.push('id < ?'); args.push(before); }
  return all(`SELECT * FROM office_events ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT ?`, ...args, limit);
};

// ---------- Agentes ----------
function serializeAgent(a) {
  if (!a) return null;
  const r = roster.byId[a.id] || {};
  const tm = roster.TEAMS[r.team] || null;
  return { id: a.id, name: a.name, role: a.role, status: a.status, current_task: a.current_task, task_id: a.task_id, enabled: !!a.enabled,
    last_heartbeat: a.last_heartbeat, updated_at: a.updated_at, color: r.color || '#888', hair: r.hair || '#333', skin: r.skin || '#e0ac7e',
    style: r.style || 'short', team: r.team || null, team_name: tm ? roster.teamName(r.team) : null, team_color: tm ? tm.color : null,
    area_manager: !!r.manager, leads: r.leads || [], reports_to: r.manager ? 'gerente' : roster.managerOf(a.id) };
}
const getAgent = (id) => serializeAgent(one('SELECT * FROM office_agents WHERE id = ?', id));
function listAgents() {
  const order = Object.fromEntries(roster.IDS.map((id, i) => [id, i]));
  return all('SELECT * FROM office_agents').map(serializeAgent).sort((a, b) => (order[a.id] ?? 99) - (order[b.id] ?? 99));
}
function updateAgent(id, fields) {
  const keys = Object.keys(fields);
  if (keys.length) run(`UPDATE office_agents SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = ? WHERE id = ?`, ...keys.map((k) => fields[k]), now(), id);
  const a = getAgent(id);
  emit('agent', a);
  return a;
}

// ---------- Tarefas ----------
function serializeTask(t, { withArtifacts = true } = {}) {
  if (!t) return null;
  const out = { id: t.id, title: t.title, description: t.description, status: t.status, assignee: t.assignee, created_by: t.created_by, priority: t.priority,
    links: parse(t.links, []), approval: t.approval, feedback: t.feedback, ref: t.ref, due_at: t.due_at, created_at: t.created_at, updated_at: t.updated_at,
    sensitive: !!t.sensitive, sensitive_by: t.sensitive_by || null, sensitive_reason: t.sensitive_reason || null, reviewed_by: t.reviewed_by || null, escalated: !!t.escalated, review_note: t.review_note || null,
    area_review_by: t.area_review_by || null, area_review: t.area_review || null, area_review_note: t.area_review_note || null, area_review_at: t.area_review_at || null,
    pre_approved: t.area_review === 'pre_aprovado', pre_approved_label: t.area_review === 'pre_aprovado' && t.area_review_by ? `pré-aprovado por ${areaOf(t.area_review_by)}` : null,
    tags: parse(t.tags, []), parent_id: t.parent_id || null };
  if (withArtifacts) {
    out.artifacts = all('SELECT id, task_id, agent_id, kind, label, url, path, content, created_at, parent_id, version FROM office_artifacts WHERE task_id = ? ORDER BY id', t.id);
    // Conversa: total, a última mensagem e quando o dono e os agentes falaram por último (o agendador acorda quem deve responder)
    const cs = one(`SELECT COUNT(*) AS n, MAX(CASE WHEN author = 'admin' THEN created_at END) AS owner_at, MAX(CASE WHEN author != 'admin' THEN created_at END) AS agent_at FROM office_comments WHERE task_id = ?`, t.id);
    const last = cs.n ? one('SELECT id, author, substr(body, 1, 280) AS body, created_at FROM office_comments WHERE task_id = ? ORDER BY id DESC LIMIT 1', t.id) : null;
    out.comments_count = cs.n;
    out.last_comment = last;
    out.owner_last_at = Math.max(t.created_by === 'admin' ? t.created_at : 0, cs.owner_at || 0) || null;
    out.agent_last_at = cs.agent_at || null;
    out.files = all('SELECT id, task_id, name, mime, size, sha256, uploaded_by, created_at FROM office_files WHERE task_id = ? ORDER BY id', t.id);
  }
  return out;
}
const getTaskRow = (id) => one('SELECT * FROM office_tasks WHERE id = ?', id);
const getTask = (id) => serializeTask(getTaskRow(id));
function listTasks({ status = null, assignee = null, since = null, tag = null, parent = null, limit = 300 } = {}) {
  const where = [], args = [];
  if (tag) { where.push('tags LIKE ?'); args.push(`%${JSON.stringify(String(tag))}%`); }
  if (parent) { where.push('parent_id = ?'); args.push(Number(parent)); }
  if (status && status.length) { where.push(`status IN (${status.map(() => '?').join(',')})`); args.push(...status); }
  if (assignee) { where.push('assignee = ?'); args.push(assignee); }
  if (since) { where.push('updated_at >= ?'); args.push(since); }
  return all(`SELECT * FROM office_tasks ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY updated_at DESC LIMIT ?`, ...args, limit).map((t) => serializeTask(t));
}
function createTask(f) {
  const t = now();
  const r = run(`INSERT INTO office_tasks (title, description, status, assignee, created_by, priority, links, approval, ref, due_at, sensitive, sensitive_by, sensitive_reason, tags, parent_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, f.title, f.description || '', f.status || 'backlog', f.assignee || null, f.created_by || 'admin',
  f.priority ?? 2, JSON.stringify(f.links || []), f.approval || null, f.ref || null, f.due_at || null, f.sensitive ? 1 : 0, f.sensitive_by || null, f.sensitive_reason || null,
  JSON.stringify(f.tags || []), f.parent_id || null, t, t);
  const task = getTask(Number(r.lastInsertRowid));
  emit('task', task);
  return task;
}
function updateTask(id, fields) {
  const keys = Object.keys(fields);
  if (keys.length) run(`UPDATE office_tasks SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = ? WHERE id = ?`,
    ...keys.map((k) => (k === 'links' || k === 'tags' ? JSON.stringify(fields[k]) : fields[k])), now(), id);
  const task = getTask(id);
  emit('task', task);
  return task;
}
function deleteTask(id) { run('DELETE FROM office_comments WHERE task_id = ?', id); run('DELETE FROM office_tasks WHERE id = ?', id); emit('task', { id, deleted: true }); }
const getArtifact = (id) => one('SELECT * FROM office_artifacts WHERE id = ?', Number(id)) || null;
function addArtifact(f) {
  const r = run('INSERT INTO office_artifacts (task_id, agent_id, kind, label, url, path, content, parent_id, version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    f.task_id || null, f.agent_id || null, f.kind, f.label || '', f.url || null, f.path || null, f.content || null, f.parent_id || null, f.version || 1, now());
  if (f.task_id) { run('UPDATE office_tasks SET updated_at = ? WHERE id = ?', now(), f.task_id); emit('task', getTask(f.task_id)); }
  return one('SELECT * FROM office_artifacts WHERE id = ?', Number(r.lastInsertRowid));
}

// Versões de uma entrega: a original e as edições (mais nova por último)
function artifactVersions(id) {
  const a = getArtifact(id);
  if (!a) return [];
  const root = a.parent_id || a.id;
  return all('SELECT id, task_id, agent_id, kind, label, content, parent_id, version, created_at FROM office_artifacts WHERE id = ? OR parent_id = ? ORDER BY version, id', root, root);
}
// Edição do dono: nova versão (o artefato original e as versões anteriores ficam)
function addArtifactVersion(id, content, author = 'admin') {
  const a = getArtifact(id);
  if (!a) return null;
  const root = a.parent_id || a.id;
  const v = one('SELECT MAX(version) AS v FROM office_artifacts WHERE id = ? OR parent_id = ?', root, root).v || 1;
  return addArtifact({ task_id: a.task_id, agent_id: author, kind: a.kind === 'texto' ? 'texto' : a.kind, label: a.label, url: a.url, path: null, content, parent_id: root, version: v + 1 });
}

// ---------- Conversa das tarefas ----------
function addComment(taskId, author, body) {
  const r = run('INSERT INTO office_comments (task_id, author, body, created_at) VALUES (?, ?, ?, ?)', taskId, author, String(body).slice(0, 4000), now());
  const c = one('SELECT * FROM office_comments WHERE id = ?', Number(r.lastInsertRowid));
  run('UPDATE office_tasks SET updated_at = ? WHERE id = ?', now(), taskId);
  emit('comment', c);
  emit('task', getTask(taskId));
  return c;
}
const listComments = (taskId, { limit = 200, since = null } = {}) => (since
  ? all('SELECT * FROM office_comments WHERE task_id = ? AND created_at > ? ORDER BY id LIMIT ?', taskId, since, limit)
  : all('SELECT * FROM (SELECT * FROM office_comments WHERE task_id = ? ORDER BY id DESC LIMIT ?) ORDER BY id', taskId, limit));

// ---------- Legendas editadas pelo dono (posts da Central) ----------
const postVersions = (postId) => all('SELECT * FROM office_post_versions WHERE post_id = ? ORDER BY version', postId);
function addPostVersion(postId, { original, originalAuthor, caption, author = 'admin' }) {
  if (!postVersions(postId).length) run('INSERT INTO office_post_versions (post_id, version, caption, author, created_at) VALUES (?, 1, ?, ?, ?)', postId, String(original || ''), originalAuthor || 'agente', now());
  const v = one('SELECT MAX(version) AS v FROM office_post_versions WHERE post_id = ?', postId).v || 1;
  run('INSERT INTO office_post_versions (post_id, version, caption, author, created_at) VALUES (?, ?, ?, ?, ?)', postId, v + 1, String(caption), author, now());
  return postVersions(postId);
}

// ---------- Rodadas e custo ----------
const dayStart = (ms = now()) => Date.parse(`${new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })}T00:00:00-03:00`);
function startRun(agent_id, trigger) {
  const r = run('INSERT INTO office_runs (agent_id, status, trigger, started_at) VALUES (?, ?, ?, ?)', agent_id, 'running', trigger || null, now());
  return Number(r.lastInsertRowid);
}
function endRun(id, { status = 'ok', cost_usd = null, summary = null } = {}) {
  run('UPDATE office_runs SET status = ?, cost_usd = ?, summary = ?, ended_at = ? WHERE id = ?', status, cost_usd, summary, now(), id);
  return one('SELECT * FROM office_runs WHERE id = ?', id);
}
function usageToday() {
  const t0 = dayStart();
  const rows = all('SELECT agent_id, COUNT(*) AS runs, COALESCE(SUM(cost_usd), 0) AS usd FROM office_runs WHERE started_at >= ? GROUP BY agent_id', t0);
  const per = Object.fromEntries(rows.map((r) => [r.agent_id, { runs: r.runs, usd: Math.round(r.usd * 100) / 100 }]));
  const total = rows.reduce((s, r) => ({ runs: s.runs + r.runs, usd: s.usd + r.usd }), { runs: 0, usd: 0 });
  total.usd = Math.round(total.usd * 100) / 100;
  return { per, total };
}
const recentRuns = (limit = 30) => all('SELECT * FROM office_runs ORDER BY id DESC LIMIT ?', limit);

module.exports = {
  AGENT_STATUSES, TASK_STATUSES, ARTIFACT_KINDS, LEVELS, getSetting, setSetting, bus, emit, log, recentEvents,
  getAgent, listAgents, updateAgent, getTask, getTaskRow, listTasks, createTask, updateTask, deleteTask, addArtifact, getArtifact,
  artifactVersions, addArtifactVersion, addComment, listComments, postVersions, addPostVersion, PEDIDO_TAG,
  startRun, endRun, usageToday, recentRuns, dayStart,
};
