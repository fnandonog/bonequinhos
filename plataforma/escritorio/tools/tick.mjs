#!/usr/bin/env node
// Agendador da agência: o launchd chama a cada 5 minutos. Vê na agenda do agencia.json (horário de Brasília) quem deve rodar
// desde a última passada e os pedidos de "rodar agora" feitos no escritório, e chama o run.mjs um de cada vez.
//
//   node plataforma/escritorio/tools/tick.mjs [--dry-run] [--now 2026-10-19T09:00]
//
// Depois de o Mac dormir, recupera no máximo limits.catch_up_minutes (padrão 20) para não disparar o dia inteiro de uma vez.
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import os from 'os';
import { HERE, ROOT, LOG_DIR, loadConfig, dueEntries, readState, writeState, agentConfig, todayUsage, brtParts, isOwnerRequest, limitReason } from './schedule.mjs';

// O launchd não carrega o shell: lê o mesmo arquivo de segredos do run.mjs (o ambiente tem prioridade)
try {
  const envFile = process.env.AGENCIA_ENV_FILE || path.join(ROOT, '.env');
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const nowArg = (() => { const i = argv.indexOf('--now'); return i >= 0 ? argv[i + 1] : null; })();
const NOW = nowArg ? Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(nowArg) ? nowArg : `${nowArg}-03:00`) : Date.now();
const stamp = () => new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
fs.mkdirSync(LOG_DIR, { recursive: true });
const logLine = (s) => { const l = `[${stamp()}] ${s}`; console.log(l); if (!DRY) fs.appendFileSync(path.join(LOG_DIR, 'agendador.log'), l + '\n'); };

let cfg;
try { cfg = loadConfig(); } catch (e) { logLine(`✖ ${e.message}`); process.exit(2); }
if (!cfg.enabled && !DRY) { logLine('Interruptor geral desligado (agencia.json "enabled": false). Nada a fazer.'); process.exit(0); }

const state = readState();
const catchUp = (Number(cfg.limits.catch_up_minutes) || 20) * 60000;
const from = Math.max(state.last_tick || 0, NOW - catchUp);
const due = dueEntries(cfg, from, NOW);

// Pedidos do escritório ("Pedir rodada agora")
let requests = [];
try {
  const { office } = await import('./office.mjs');
  requests = (await office('diretor', `/runner/requests${DRY ? '' : '?claim=1'}`)).requests || [];
} catch (e) { if (!DRY) logLine(`⚠ sem pedidos do escritório: ${e.message}`); }

// Pedido do dono (etiqueta pedido-do-dono, criado em "Pedir ao time" no escritório): acorda o Diretor NA HORA, a qualquer hora
// do dia e sem a espera entre rodadas (cooldown), uma vez por novidade do dono (pedido novo ou mensagem nova na conversa que
// ainda não teve resposta). Só o PRÓPRIO pedido (tarefa do Diretor, sem tarefa-mãe) fura a fila: as sub-tarefas que o Diretor
// distribui (e qualquer tarefa de outro agente, mesmo com a etiqueta) seguem o caminho normal de "Tarefas esperando", com
// horário de trabalho e espera. O filtro é conferido aqui também (servidor antigo que ignore ?tag= não acorda o time inteiro).
// O interruptor do agencia.json, o agente ligado, o botão de emergência e os limites do dia continuam valendo.
const urgent = [];
// Toda mensagem do dono tem resposta de um agente. Marca por tarefa no estado local: { m: marca da novidade, at: quando
// acordou, n: tentativas }. Se a rodada acabar sem resposta na conversa, tenta de novo depois de owner_retry_minutes
// (padrão 25) e, na terceira vez, chama o Diretor para responder e redistribuir. Vale também para pedido/tarefa em
// Revisão (o dono pode escrever lá) e, como o servidor reabre a tarefa concluída quando o dono escreve, para essas também.
const RETRY_MS = (Number((cfg.limits || {}).owner_retry_minutes) || 25) * 60000;
const agentOn = (id) => !!cfg.agents[id] && cfg.agents[id].enabled !== false;
function ownerNews(bucket, t, mark, answered) {
  state[bucket] = state[bucket] || {};
  let st = state[bucket][t.id];
  if (typeof st === 'string' || typeof st === 'number') st = { m: st, at: 0, n: 1 }; // estado antigo
  if (!mark || answered) return null;
  if (!st || st.m !== mark) { if (!DRY) state[bucket][t.id] = { m: mark, at: NOW, n: 1 }; return 'novo'; }
  if (st.n >= 3 || NOW - (st.at || 0) < RETRY_MS) return null;
  if (!DRY) state[bucket][t.id] = { m: mark, at: NOW, n: st.n + 1 };
  return st.n === 1 ? 'de novo' : 'diretor';
}
const fallback = []; // tarefas que ninguém respondeu: o Diretor responde e redistribui
try {
  const { office } = await import('./office.mjs');
  const open = ((await office('diretor', '/tasks?status=backlog,doing,review&tag=pedido-do-dono')).tasks || []).filter(isOwnerRequest);
  const list = [];
  for (const t of open) {
    if (!agentOn('diretor')) break;
    const mark = t.owner_last_at || t.created_at;
    const k = ownerNews('pedidos', t, mark, t.agent_last_at && t.agent_last_at >= mark);
    if (k) list.push(t);
  }
  if (list.length) urgent.push({ agent: 'diretor', trigger: 'pedido-do-dono', ids: list.map((t) => t.id), prompt: `Pedido do dono (prioridade máxima): ${list.map((t) => `#${t.id} "${t.title}"`).join(', ')}. Leia com \`office.mjs task show N\` e a conversa com \`office.mjs comments N\`, responda na tarefa com \`office.mjs comment N "…"\` (o plano ou a novidade) e siga as regras de "Pedido do dono" das suas instruções. O dono SEMPRE recebe resposta sua na conversa nesta rodada.` });
  // esquece pedidos fechados (o estado não cresce para sempre)
  if (!DRY) for (const id of Object.keys(state.pedidos || {})) if (!open.some((t) => String(t.id) === id)) delete state.pedidos[id];
} catch (e) { if (!DRY) logLine(`⚠ sem pedidos do dono: ${e.message}`); }

// Tarefa do dono com outro agente: criada pelo dono, sub-tarefa de um pedido do dono ou com mensagem do dono ainda sem
// resposta. Acorda o responsável NA HORA (qualquer horário, sem a espera entre rodadas), na cota do dono
// (limits.owner_runs_per_agent). Responsável desligado ou fora do agencia.json: vai direto para o Diretor.
try {
  const { office } = await import('./office.mjs');
  const open = (await office('diretor', '/tasks?status=backlog,doing,review&limit=300')).tasks || [];
  const owners = new Set(open.filter(isOwnerRequest).map((t) => t.id));
  const byAgent = new Map();
  for (const t of open) {
    if (isOwnerRequest(t)) continue;
    const fromOwner = t.created_by === 'admin' || owners.has(t.parent_id);
    if (!fromOwner && !t.owner_last_at) continue;
    const mark = t.owner_last_at || t.created_at;
    if (!t.owner_last_at && t.created_by !== 'admin') {
      // sub-tarefa de pedido sem mensagem do dono: a resposta de outro agente (ex.: o Diretor cobrando) não conta;
      // acorda o responsável uma vez por tarefa, sem novas tentativas
      state.dono = state.dono || {};
      const st = state.dono[t.id];
      if (st && (st === mark || st.m === mark)) continue;
      if (!DRY) state.dono[t.id] = { m: mark, at: NOW, n: 3 };
      if (agentOn(t.assignee)) { if (!byAgent.has(t.assignee)) byAgent.set(t.assignee, []); byAgent.get(t.assignee).push(t); }
      continue;
    }
    const k = ownerNews('dono', t, mark, t.agent_last_at && t.agent_last_at >= mark);
    if (!k) continue;
    if (k === 'diretor' || !t.assignee || !agentOn(t.assignee)) { fallback.push(t); continue; }
    if (!byAgent.has(t.assignee)) byAgent.set(t.assignee, []);
    byAgent.get(t.assignee).push(t);
  }
  for (const [agent, ts] of byAgent) {
    if (urgent.some((j) => j.agent === agent)) continue;
    urgent.push({ agent, trigger: 'dono', ids: ts.map((t) => t.id), prompt: `Tarefa(s) do dono esperando você (prioridade máxima): ${ts.map((t) => `#${t.id} "${t.title}"`).join(', ')}. Leia com \`office.mjs task show N\` e a conversa com \`office.mjs comments N\`, faça o que foi pedido e responda na tarefa com \`office.mjs comment N "…"\` (feito, ou o que falta e de quem). O dono SEMPRE recebe resposta sua na conversa nesta rodada. Se precisar de aprovação, mande para Revisão.` });
  }
  if (!DRY) for (const id of Object.keys(state.dono || {})) if (!open.some((t) => String(t.id) === id)) delete state.dono[id];
} catch (e) { if (!DRY) logLine(`⚠ sem tarefas do dono: ${e.message}`); }
// Rede de segurança: mensagem do dono sem resposta depois de 2 tentativas (ou com responsável desligado) vai para o Diretor
if (fallback.length && agentOn('diretor')) {
  const txt = `Mensagem(ns) do dono SEM RESPOSTA: ${fallback.map((t) => `#${t.id} "${t.title}" (${t.assignee || 'sem responsável'})`).join(', ')}. Responda você mesmo na conversa de cada uma agora (\`office.mjs comment N "…"\`) e, se o trabalho for de outra área, passe para quem faz (\`task update N --assignee …\` ou uma sub-tarefa) e diga ao dono quem vai fazer e quando.`;
  const j = urgent.find((x) => x.agent === 'diretor');
  if (j) { j.prompt += ` Além disso: ${txt}`; j.ids = [...(j.ids || []), ...fallback.map((t) => t.id)]; }
  else urgent.push({ agent: 'diretor', trigger: 'dono', ids: fallback.map((t) => t.id), prompt: txt });
}

// Linha do Estúdio de vídeo: tarefa com a etiqueta `estudio` acorda o responsável assim que muda de mãos (Pauteiro → Roteirista
// → Editor e Arte → Chefe do Estúdio, ou devolvida para ajuste), dentro de estudio.hours (padrão 7–23h) e sem a espera entre
// rodadas. Uma vez por responsável: se ele não terminar, a tarefa segue a regra normal de tarefas esperando. Conta na cota
// de rotina do agente.
const estudio = [];
const hourNow = Number(new Date(NOW).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false })) % 24;
const est = { hours: [7, 23], ...(cfg.estudio || {}) };
if (hourNow >= est.hours[0] && hourNow < est.hours[1]) {
  try {
    const { office } = await import('./office.mjs');
    const open = ((await office('diretor', '/tasks?status=backlog,doing&tag=estudio&limit=300')).tasks || []).filter((t) => (t.tags || []).includes('estudio'));
    state.estudio = state.estudio || {};
    const byAgent = new Map();
    for (const t of open) {
      if (!t.assignee || !cfg.agents[t.assignee] || cfg.agents[t.assignee].enabled === false) continue;
      if (state.estudio[t.id] === t.assignee) continue;
      if (!byAgent.has(t.assignee)) byAgent.set(t.assignee, []);
      byAgent.get(t.assignee).push(t);
      if (!DRY) state.estudio[t.id] = t.assignee;
    }
    for (const [agent, ts] of byAgent) estudio.push({ agent, trigger: 'estudio', prompt: `Linha do Estúdio: chegou para você ${ts.map((t) => `#${t.id} "${t.title}"`).join(', ')}. Leia com \`office.mjs task show N\`, faça a sua etapa (docs/agencia/estudio/LINHA.md) e passe para a próxima com \`task update N --assignee …\` + \`comment N "…"\`.` });
    if (!DRY) for (const id of Object.keys(state.estudio)) if (!open.some((t) => String(t.id) === id)) delete state.estudio[id];
  } catch (e) { if (!DRY) logLine(`⚠ sem linha do Estúdio: ${e.message}`); }
}

// Comentários das redes: a tarefa "Responder comentários" (etiqueta `comentarios`, criada pelo servidor quando chegam comentários
// novos, uma por lote) acorda a Comunidade na mesma regra do Estúdio: uma vez por tarefa e responsável, sem a espera entre rodadas,
// dentro de comentarios.hours (padrão 8–23h). Fora disso a tarefa segue a regra normal de tarefas esperando.
const cmt = { hours: [8, 23], ...(cfg.comentarios || {}) };
if (hourNow >= cmt.hours[0] && hourNow < cmt.hours[1]) {
  try {
    const { office } = await import('./office.mjs');
    const open = ((await office('diretor', '/tasks?status=backlog,doing&tag=comentarios&limit=50')).tasks || []).filter((t) => (t.tags || []).includes('comentarios'));
    state.comentarios = state.comentarios || {};
    const byAgent = new Map();
    for (const t of open) {
      if (!t.assignee || !cfg.agents[t.assignee] || cfg.agents[t.assignee].enabled === false) continue;
      if (state.comentarios[t.id] === t.assignee) continue;
      if (!byAgent.has(t.assignee)) byAgent.set(t.assignee, []);
      byAgent.get(t.assignee).push(t);
      if (!DRY) state.comentarios[t.id] = t.assignee;
    }
    for (const [agent, ts] of byAgent) {
      if (estudio.some((j) => j.agent === agent)) continue;
      estudio.push({ agent, trigger: 'comentarios', prompt: `Comentários novos nas redes (${ts.map((t) => `#${t.id}`).join(', ')}): rode \`office.mjs comentarios list\`, responda cada um com \`comentarios responder ID "texto" --classe …\` (ou ignore o spam com \`comentarios ignorar ID "motivo"\`). Nada é enviado sem aprovação.` });
    }
    if (!DRY) for (const id of Object.keys(state.comentarios)) if (!open.some((t) => String(t.id) === id)) delete state.comentarios[id];
  } catch (e) { if (!DRY) logLine(`⚠ sem comentários: ${e.message}`); }
}

// Tarefas esperando: agente com tarefa a fazer (backlog/doing) é acordado fora da agenda, dentro do horário de trabalho
// (work_on_tasks.hours, padrão 8–23h) e no máximo uma vez a cada cooldown_minutes (padrão 120) por agente.
// O Gerente Geral também é acordado assim quando há tarefa em Revisão ou post aguardando na Central (GET /gerente/queue),
// e cada gerente de área quando a equipe dele tem entrega em Revisão que a área ainda não olhou (GET /area/queue).
const pending = [];
const wot = { enabled: true, hours: [8, 23], cooldown_minutes: 120, ...(cfg.work_on_tasks || {}) };
const hourBRT = Number(new Date(NOW).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false })) % 24;
if (wot.enabled && hourBRT >= wot.hours[0] && hourBRT < wot.hours[1]) {
  try {
    const { office } = await import('./office.mjs');
    const tasks = (await office('diretor', '/tasks?status=backlog,doing')).tasks || [];
    state.woke = state.woke || {};
    for (const a of new Set(tasks.map((t) => t.assignee).filter(Boolean))) {
      if (!cfg.agents[a] || cfg.agents[a].enabled === false) continue;
      if (NOW - (state.woke[a] || 0) < wot.cooldown_minutes * 60000) continue;
      pending.push({ agent: a, trigger: 'tarefa', prompt: 'Você tem tarefas esperando no escritório: pegue a de maior prioridade e entregue.' });
      if (!DRY) state.woke[a] = NOW;
    }
  } catch (e) { if (!DRY) logLine(`⚠ sem tarefas do escritório: ${e.message}`); }
  // Gerente: acorda (mesmo horário e mesma espera por agente) quando há tarefa em Revisão ou post aguardando que ele ainda não olhou
  if (cfg.agents.gerente && cfg.agents.gerente.enabled !== false && !pending.some((j) => j.agent === 'gerente')) {
    try {
      const { office } = await import('./office.mjs');
      const q = await office('gerente', '/gerente/queue');
      const n = q.actionable || { tasks: 0, posts: 0, comentarios: 0, total: 0 };
      state.woke = state.woke || {};
      if (n.total > 0 && NOW - (state.woke.gerente || 0) >= wot.cooldown_minutes * 60000) {
        pending.push({ agent: 'gerente', trigger: 'revisao', prompt: `Há ${n.tasks} tarefa(s) em Revisão, ${n.posts} post(s) aguardando na Central e ${n.comentarios || 0} resposta(s) a comentários esperando a sua revisão: rode a fila (gerente fila) e decida.` });
        if (!DRY) state.woke.gerente = NOW;
      }
    } catch (e) { if (!DRY) logLine(`⚠ sem fila do gerente: ${e.message}`); }
  }
  // Gerentes de área (id gerente-<área> no agencia.json): acordam do mesmo jeito quando a equipe tem tarefa em Revisão
  // que a área ainda não olhou (GET /area/queue), respeitando o mesmo horário e a mesma espera por agente.
  for (const m of Object.keys(cfg.agents).filter((id) => /^gerente-[a-z-]+$/.test(id))) {
    if (cfg.agents[m].enabled === false || pending.some((j) => j.agent === m)) continue;
    state.woke = state.woke || {};
    if (NOW - (state.woke[m] || 0) < wot.cooldown_minutes * 60000) continue;
    try {
      const { office } = await import('./office.mjs');
      const q = await office(m, '/area/queue');
      const n = (q.actionable && q.actionable.total) || 0;
      if (n > 0) {
        pending.push({ agent: m, trigger: 'revisao', prompt: `Há ${n} entrega(s) da sua equipe em Revisão que você ainda não olhou: rode a fila (area fila), pré-aprove, peça ajustes ou comente.` });
        if (!DRY) state.woke[m] = NOW;
      }
    } catch (e) { if (!DRY) logLine(`⚠ sem fila de ${m}: ${e.message}`); }
  }
}

const jobs = [
  ...urgent,
  ...estudio,
  ...requests.filter((r) => cfg.agents[r.agent]).map((r) => ({ agent: r.agent, trigger: 'pedido', prompt: r.prompt || null })),
  ...due.map((d) => ({ agent: d.agent, trigger: 'agenda', prompt: d.prompt || null })),
  ...pending,
];
// mesmo agente duas vezes na mesma passada: roda uma só
const seen = new Set();
const list = jobs.filter((j) => (seen.has(j.agent) ? false : seen.add(j.agent)));

// Limites do dia (os mesmos do run.mjs) conferidos ANTES de chamar o executor: agente que já bateu o limite não é chamado e
// o aviso entra no log uma vez por agente por dia (sem repetir a cada 5 minutos).
const today = brtParts(NOW).date;
const usage = todayUsage(readState(), today);
const blocked = new Map();
for (const j of list) { const why = limitReason(cfg, usage, j.agent, j.trigger); if (why) blocked.set(j.agent, why); }

if (DRY) {
  console.log(`${cfg.enabled ? '' : '⚠ Interruptor geral desligado: de verdade, nada rodaria.\n'}Janela: ${new Date(from).toISOString()} → ${new Date(NOW).toISOString()}`);
  console.log(list.length ? list.map((j) => `- ${j.agent} (${j.trigger})${blocked.has(j.agent) ? ` [não roda: ${blocked.get(j.agent)}]` : ''}${j.prompt ? `: ${j.prompt}` : ''}`).join('\n') : 'Nenhum agente para rodar nesta janela.');
  process.exit(0);
}

// avisos já registrados hoje (um por agente e motivo)
const logOnce = (key, msg) => {
  const st = readState();
  if (!st.avisos || st.avisos.dia !== today) st.avisos = { dia: today, chaves: [] };
  if (st.avisos.chaves.includes(key)) return;
  st.avisos.chaves.push(key);
  writeState(st);
  logLine(msg);
};
const retry = (j) => { if (!j.ids) return; const st = readState(); for (const k of ['pedidos', 'dono']) { st[k] = st[k] || {}; for (const id of j.ids) delete st[k][id]; } writeState(st); }; // não rodou: a novidade volta a contar como nova

state.last_tick = NOW;
writeState(state);
// Código do Mac em dia: a cada 30 min, se a pasta estiver na main, puxa a main do GitHub só por avanço rápido (--ff-only).
// As mudanças locais dos agentes (docs, roteiros) ficam como estão; se algum arquivo do GitHub bater com uma delas, não
// atualiza e avisa uma vez por dia no agendador.log. Desligar: "auto_update": false no agencia.json (ou AGENCIA_AUTO_UPDATE=0).
if (cfg.auto_update !== false && process.env.AGENCIA_AUTO_UPDATE !== '0' && NOW - (readState().last_update || 0) > 30 * 60000) {
  { const st = readState(); st.last_update = NOW; writeState(st); }
  const git = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8', timeout: 90000 });
  const head = () => (git('rev-parse', 'HEAD').stdout || '').trim();
  if ((git('rev-parse', '--abbrev-ref', 'HEAD').stdout || '').trim() === 'main') {
    const before = head();
    const f = git('fetch', '--quiet', 'origin', 'main');
    const m = f.status === 0 ? git('merge', '--ff-only', '--quiet', 'origin/main') : f;
    if (m.status !== 0) logOnce('atualizar', `⚠ não consegui atualizar o código da agência (git ${f.status === 0 ? 'merge --ff-only' : 'fetch'}): ${(m.stderr || m.stdout || '').trim().split('\n').slice(0, 3).join(' | ')}`);
    else if (head() !== before) logLine(`⬆ código da agência atualizado: ${before.slice(0, 7)} → ${head().slice(0, 7)}`);
  }
}
if (!list.length) process.exit(0);
for (const j of list) {
  if (blocked.has(j.agent)) {
    logOnce(`limite:${j.agent}:${j.trigger === 'dono' || j.trigger === 'pedido-do-dono' ? 'dono' : 'rotina'}`, `⏸ ${j.agent} não roda mais hoje: ${blocked.get(j.agent)} (próximos chamados de hoje ficam só aqui, sem repetir no log)`);
    retry(j); // pedido do dono que não rodou: tenta de novo quando liberar (amanhã), sem repetir o aviso
    continue;
  }
  const args = [path.join(HERE, 'run.mjs'), j.agent, '--trigger', j.trigger, ...(j.prompt ? ['--prompt', j.prompt] : [])];
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', env: process.env });
  const out = (r.stdout + r.stderr).trim().split('\n').slice(-2).join(' | ');
  // recusa do executor (interruptor/agente desligado = 5, limite = 6, escritório não liberou = 3): uma linha por agente por dia
  if ([3, 5, 6].includes(r.status)) { logOnce(`recusa:${j.agent}:${r.status}`, `⏸ ${j.agent} (${j.trigger}) não rodou: ${out.replace(/^✖ /, '')}`); retry(j); continue; }
  logLine(`→ ${j.agent} (${j.trigger})`);
  logLine(`${r.status === 0 ? '✔' : '✖'} ${j.agent} (código ${r.status}) ${out}`);
  // pedido do dono que não rodou (erro): tenta de novo na próxima passada
  if (r.status !== 0) retry(j);
}
