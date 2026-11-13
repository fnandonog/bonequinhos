// Agenda da agência: cron de 5 campos (minuto hora dia mês dia-da-semana) avaliado no horário de Brasília,
// leitura/validação do agencia.json e a pasta de estado/logs. Usado por run.mjs, tick.mjs e launchd.mjs.
import fs from 'fs';
import os from 'os';
import path from 'path';

export const HERE = path.dirname(new URL(import.meta.url).pathname);
export const ROOT = path.resolve(HERE, '..', '..', '..');
export const TZ = 'America/Sao_Paulo';
export const LOG_DIR = process.env.AGENCIA_LOG_DIR || path.join(os.homedir(), 'Library', 'Logs', 'Bonequinhos', 'agencia');
export const STATE_DIR = process.env.AGENCIA_STATE_DIR || path.join(os.homedir(), '.config', 'bonequinhos', 'agencia');
export const CONFIG_FILE = process.env.AGENCIA_CONFIG || path.join(HERE, 'agencia.json');

// ---------- cron ----------
const RANGES = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];
function field(spec, [lo, hi], idx) {
  const out = new Set();
  for (const part of String(spec).split(',')) {
    const m = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part.trim());
    if (!m) throw new Error(`cron inválido: "${spec}"`);
    let [a, b] = m[1] === '*' ? [lo, hi] : m[1].split('-').map(Number);
    if (b === undefined) b = m[2] ? hi : a;
    const step = m[2] ? Number(m[2]) : 1;
    if (a < lo || b > hi || a > b || step < 1) throw new Error(`cron fora do intervalo: "${spec}" (campo ${idx + 1})`);
    for (let v = a; v <= b; v += step) out.add(idx === 4 && v === 7 ? 0 : v);
  }
  return out;
}
export function parseCron(expr) {
  const parts = String(expr).trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`cron precisa de 5 campos: "${expr}"`);
  return parts.map((p, i) => ({ set: field(p, RANGES[i], i), any: p === '*' }));
}
// Partes da data em Brasília
export function brtParts(ms) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'short' });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { minute: Number(p.minute), hour: Number(p.hour) % 24, day: Number(p.day), month: Number(p.month), dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), date: `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}` };
}
export function cronMatches(expr, ms) {
  const [mi, h, dom, mon, dow] = parseCron(expr);
  const p = brtParts(ms);
  if (!mi.set.has(p.minute) || !h.set.has(p.hour) || !mon.set.has(p.month)) return false;
  // regra clássica do cron: se dia do mês e dia da semana são restritos, vale qualquer um dos dois
  if (!dom.any && !dow.any) return dom.set.has(p.day) || dow.set.has(p.dow);
  return dom.set.has(p.day) && dow.set.has(p.dow);
}
// Entradas da agenda que caíram no intervalo (from, to]. Cada uma dispara no máximo uma vez por intervalo.
export function dueEntries(cfg, from, to) {
  const out = [];
  const start = Math.floor(from / 60000) * 60000 + 60000;
  for (const e of cfg.schedule || []) {
    if (e.enabled === false) continue;
    for (let t = start; t <= to; t += 60000) {
      if (cronMatches(e.cron, t)) { out.push({ ...e, at: t }); break; }
    }
  }
  return out;
}

// ---------- configuração ----------
export function loadConfig(file = CONFIG_FILE) {
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const errs = validateConfig(cfg);
  if (errs.length) throw new Error(`agencia.json inválido:\n- ${errs.join('\n- ')}`);
  return cfg;
}
export function validateConfig(cfg) {
  const errs = [];
  if (!cfg || typeof cfg !== 'object') return ['não é um objeto'];
  if (typeof cfg.enabled !== 'boolean') errs.push('"enabled" (true/false) é obrigatório: é o interruptor geral no Mac');
  if (!cfg.agents || typeof cfg.agents !== 'object') errs.push('"agents" ausente');
  const L = cfg.limits || {};
  for (const k of ['max_runs_per_day', 'max_usd_per_day', 'run_timeout_minutes']) if (!(Number(L[k]) > 0)) errs.push(`limits.${k} deve ser > 0`);
  for (const [id, a] of Object.entries(cfg.agents || {})) {
    if (!/^[a-z0-9-]+$/.test(id)) errs.push(`agente com id inválido: ${id}`);
    if (a.max_budget_usd !== undefined && !(Number(a.max_budget_usd) > 0)) errs.push(`${id}.max_budget_usd deve ser > 0`);
    if (a.allowed_tools && !Array.isArray(a.allowed_tools)) errs.push(`${id}.allowed_tools deve ser lista`);
  }
  for (const [i, e] of (cfg.schedule || []).entries()) {
    if (!cfg.agents || !cfg.agents[e.agent]) errs.push(`schedule[${i}]: agente "${e.agent}" não está em "agents"`);
    try { parseCron(e.cron); } catch (err) { errs.push(`schedule[${i}]: ${err.message}`); }
  }
  return errs;
}
// Configuração efetiva de um agente (padrões + específicos)
export function agentConfig(cfg, id) {
  const a = (cfg.agents || {})[id];
  if (!a) return null;
  const d = cfg.defaults || {};
  return {
    id, enabled: a.enabled !== false,
    model: a.model || d.model || null,
    max_budget_usd: Number(a.max_budget_usd || d.max_budget_usd || 1),
    max_runs_per_day: Number(a.max_runs_per_day || d.max_runs_per_day || 2),
    permission_mode: a.permission_mode || d.permission_mode || 'default',
    allowed_tools: [...(d.allowed_tools || []), ...(a.allowed_tools || [])],
    disallowed_tools: [...(d.disallowed_tools || []), ...(a.disallowed_tools || [])],
    prompt: a.prompt || d.prompt || 'Faça a sua rodada de hoje.',
    effort: a.effort || d.effort || null,
    social_token: a.social_token === true, // só quem posta na Central recebe SOCIAL_AGENT_TOKEN
  };
}

// ---------- estado local (contagem do dia, último tick) ----------
export function readState() {
  try { return JSON.parse(fs.readFileSync(path.join(STATE_DIR, 'state.json'), 'utf8')); } catch { return {}; }
}
export function writeState(s) {
  fs.mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 });
  const f = path.join(STATE_DIR, 'state.json');
  fs.writeFileSync(f + '.tmp', JSON.stringify(s, null, 2));
  fs.renameSync(f + '.tmp', f);
}
export function todayUsage(state, date = brtParts(Date.now()).date) {
  const d = (state.days || {})[date] || { runs: 0, usd: 0, per: {} };
  return d;
}
// Rodada acordada pelo dono (pedido ou mensagem dele): conta na cota própria do dono (limits.owner_runs_per_agent, padrão 12
// por agente), não nas rodadas de rotina do agente. As rodadas e o gasto totais do dia continuam somando tudo.
export const OWNER_TRIGGERS = new Set(['pedido-do-dono', 'dono']);
export const ownerCap = (cfg) => Number((cfg.limits || {}).owner_runs_per_agent) || 12;
export function addUsage(state, agent, usd, date = brtParts(Date.now()).date, { owner = false } = {}) {
  state.days = state.days || {};
  const d = state.days[date] || { runs: 0, usd: 0, per: {} };
  d.runs += 1;
  d.usd = Math.round((d.usd + (Number(usd) || 0)) * 100) / 100;
  if (owner) { d.owner = d.owner || {}; d.owner[agent] = (d.owner[agent] || 0) + 1; } else d.per[agent] = (d.per[agent] || 0) + 1;
  state.days[date] = d;
  // guarda só os últimos 14 dias
  for (const k of Object.keys(state.days).sort().slice(0, -14)) delete state.days[k];
  return state;
}

// ---------- pedido do dono e limites (tick.mjs) ----------
export const PEDIDO_TAG = 'pedido-do-dono';
// Só o pedido em si fura a fila (acorda na hora): tarefa com a etiqueta, criada pelo dono, do Diretor e sem tarefa-mãe.
// As tarefas do dono com outros agentes (criadas por ele, sub-tarefas de um pedido ou com mensagem dele) acordam o responsável
// pelo bloco "Tarefa do dono" do tick.mjs; as demais seguem a regra de tarefas esperando (horário de trabalho + espera).
export function isOwnerRequest(t) {
  return !!t && Array.isArray(t.tags) && t.tags.includes(PEDIDO_TAG) && !t.parent_id && (t.assignee || 'diretor') === 'diretor' && (!t.created_by || t.created_by === 'admin');
}
// Motivo para NÃO chamar o executor (mesmas contas do run.mjs) ou null
export function limitReason(cfg, usage, id, trigger = null) {
  const ac = agentConfig(cfg, id);
  if (!ac) return null;
  const L = cfg.limits || {};
  if (OWNER_TRIGGERS.has(trigger)) {
    const own = (usage.owner || {})[id] || 0;
    if (own >= ownerCap(cfg)) return `já atendeu ${own} chamado(s) do dono hoje (limite ${ownerCap(cfg)})`;
  } else {
    const per = (usage.per || {})[id] || 0;
    if (per >= ac.max_runs_per_day) return `já rodou ${per} vez(es) hoje (limite ${ac.max_runs_per_day})`;
  }
  // chamado do dono não para no limite de rodadas do dia (só no teto em US$): a agenda e o Estúdio não podem deixar o dono sem resposta
  if (!OWNER_TRIGGERS.has(trigger) && usage.runs >= Number(L.max_runs_per_day)) return `a agência já fez ${usage.runs} rodadas hoje (limite ${L.max_runs_per_day})`;
  if (usage.usd + ac.max_budget_usd > Number(L.max_usd_per_day)) return `gasto do dia US$ ${usage.usd.toFixed(2)} + teto da rodada US$ ${ac.max_budget_usd.toFixed(2)} passaria de US$ ${L.max_usd_per_day}`;
  return null;
}
