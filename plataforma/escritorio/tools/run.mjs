#!/usr/bin/env node
// Executor da agência: roda UM agente (Claude Code sem tela, `claude -p --agent <id>`) com limites e avisando o escritório.
//
//   node plataforma/escritorio/tools/run.mjs <agente> [--prompt "tarefa extra"] [--trigger agenda|pedido|manual] [--dry-run]
//
// Antes de começar confere, nesta ordem, e NÃO roda se algum falhar (falha fechada):
//   1. interruptor geral do agencia.json ("enabled": true) e o agente ligado lá;
//   2. limites do dia no Mac (rodadas por agente, rodadas e gasto total);
//   3. o escritório: botão de emergência, agente ligado no painel e teto diário do servidor (sem conexão = não roda).
// Durante a rodada confere o botão de emergência a cada 2 min e encerra o Claude se ele for ligado.
// Log em ~/Library/Logs/Bonequinhos/agencia/AAAA-MM-DD-<agente>.log. Segredos em .env do projeto (chmod 600).
// --dry-run faz as conferências e mostra o comando, sem rodar o Claude nem registrar rodada.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { ROOT, LOG_DIR, STATE_DIR, loadConfig, agentConfig, readState, writeState, todayUsage, addUsage, brtParts, OWNER_TRIGGERS, ownerCap } from './schedule.mjs';

// Segredos e endereço: .env do projeto (KEY=valor por linha). O ambiente tem prioridade.
const ENV_FILE = process.env.AGENCIA_ENV_FILE || path.join(ROOT, '.env');
try {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}
const { office, BASE } = await import('./office.mjs');

const argv = process.argv.slice(2);
const flag = (k) => argv.includes(`--${k}`);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
let id = null;
for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) { if (['prompt', 'trigger'].includes(argv[i].slice(2))) i++; continue; } id ??= argv[i]; }
const DRY = flag('dry-run');
const trigger = opt('trigger') || 'manual';
const extraPrompt = opt('prompt');

const quote = (s) => (/^[\w@%+=:,./-]+$/.test(s) ? s : `'${String(s).replace(/'/g, `'\\''`)}'`);
const stamp = () => new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
function stop(msg, code) { console.error(`✖ ${msg}`); process.exit(code); }

if (!id) stop('Informe o agente: node plataforma/escritorio/tools/run.mjs <agente> [--dry-run]', 2);
let cfg;
try { cfg = loadConfig(); } catch (e) { stop(e.message, 2); }
const ac = agentConfig(cfg, id);
if (!ac) stop(`Agente "${id}" não está no agencia.json.`, 2);
const agentFile = path.join(ROOT, '.claude', 'agents', `${id}.md`);
if (!fs.existsSync(agentFile)) stop(`Falta o arquivo do agente: ${agentFile}`, 2);

// 1. interruptores locais
const warn = [];
if (!cfg.enabled) warn.push('Interruptor geral desligado no agencia.json ("enabled": false): uma rodada de verdade não começaria.');
if (!cfg.enabled && !DRY) stop('Interruptor geral desligado no agencia.json ("enabled": false). Ligue só depois de aprovar (ver LEIA-ME).', 5);
if (!ac.enabled && !DRY) stop(`${id} está desligado no agencia.json.`, 5);
if (!ac.enabled) warn.push(`${id} está desligado no agencia.json: uma rodada de verdade não começaria.`);

// 2. limites do dia no Mac
const state = readState();
const day = todayUsage(state);
const L = cfg.limits;
const OWNER = OWNER_TRIGGERS.has(trigger); // acordado pelo dono: cota própria (não gasta as rodadas de rotina do agente)
if (OWNER && ((day.owner || {})[id] || 0) >= ownerCap(cfg)) stop(`${id} já atendeu ${day.owner[id]} chamado(s) do dono hoje (limite ${ownerCap(cfg)}).`, 6);
if (!OWNER && (day.per[id] || 0) >= ac.max_runs_per_day) stop(`${id} já rodou ${day.per[id]} vez(es) hoje (limite ${ac.max_runs_per_day}).`, 6);
if (!OWNER && day.runs >= L.max_runs_per_day) stop(`A agência já fez ${day.runs} rodadas hoje (limite ${L.max_runs_per_day}).`, 6);
if (day.usd + ac.max_budget_usd > L.max_usd_per_day) stop(`Gasto do dia US$ ${day.usd.toFixed(2)} + teto desta rodada US$ ${ac.max_budget_usd.toFixed(2)} passaria do limite de US$ ${L.max_usd_per_day}.`, 6);

// 3. escritório (falha fechada)
let check;
try { check = await office(id, '/runner/check'); } catch (e) { stop(`Não deu para falar com o escritório (${e.message}). Sem confirmação, o agente não roda.`, 4); }
if (!check.allowed) stop(`Escritório não liberou: ${check.reasons.join(' ')}`, 3);

// Comando
const today = brtParts(Date.now()).date;
const prompt = [
  `Hoje é ${today} (${stamp()}, horário de Brasília). Esta é uma rodada ${trigger === 'agenda' ? 'agendada' : trigger === 'pedido' ? 'pedida pelo dono no escritório' : trigger === 'pedido-do-dono' ? 'acordada por um PEDIDO DO DONO (Pedir ao time)' : trigger === 'dono' ? 'acordada por uma TAREFA OU MENSAGEM DO DONO (responda na conversa da tarefa)' : trigger === 'estudio' ? 'acordada pela LINHA DO ESTÚDIO (uma tarefa de vídeo chegou para você)' : trigger === 'comentarios' ? 'acordada por COMENTÁRIOS NOVOS NAS REDES (responda pela linha de comando: office.mjs comentarios)' : 'manual'}.`,
  ac.prompt,
  extraPrompt ? `Pedido extra: ${extraPrompt}` : '',
  'Siga as suas instruções de agente: comece com `node plataforma/escritorio/tools/office.mjs me`, mande batimentos, e termine com um resumo curto do que fez.',
].filter(Boolean).join('\n\n');
const bin = cfg.claude_bin || 'claude';
const cmd = ['-p', prompt, '--agent', id, '--output-format', 'json', '--max-budget-usd', String(ac.max_budget_usd), '--permission-mode', ac.permission_mode];
if (ac.model) cmd.push('--model', ac.model);
if (ac.effort) cmd.push('--effort', ac.effort);
if (ac.allowed_tools.length) cmd.push('--allowed-tools', ...ac.allowed_tools);
if (ac.disallowed_tools.length) cmd.push('--disallowed-tools', ...ac.disallowed_tools);
const printable = `${bin} ${cmd.map(quote).join(' ')}`;

if (DRY) {
  for (const w of warn) console.log(`⚠ ${w}`);
  console.log(`Escritório: liberado (hoje: ${check.usage.total.runs} rodadas, US$ ${check.usage.total.usd.toFixed(2)}). Mac: ${day.runs} rodadas, US$ ${day.usd.toFixed(2)}.`);
  console.log(`Pasta: ${ROOT}\nLog: ${path.join(LOG_DIR, `${today}-${id}.log`)}\n\n${printable.replace(/^\S+/, 'claude')}`);
  process.exit(0);
}

// Trava: uma rodada por agente de cada vez
fs.mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 });
const lock = path.join(STATE_DIR, `${id}.lock`);
try {
  const pid = Number(fs.readFileSync(lock, 'utf8'));
  if (pid) { try { process.kill(pid, 0); stop(`${id} já está rodando (pid ${pid}).`, 7); } catch {} }
} catch {}
fs.writeFileSync(lock, String(process.pid));
const unlock = () => { try { fs.rmSync(lock); } catch {} };

fs.mkdirSync(LOG_DIR, { recursive: true });
const logFile = path.join(LOG_DIR, `${today}-${id}.log`);
const logOut = fs.createWriteStream(logFile, { flags: 'a' });
logOut.write(`\n===== ${stamp()} · ${id} · ${trigger} =====\n$ ${printable}\n`);

let runId = null;
try { runId = (await office(id, '/runs', { method: 'POST', body: { phase: 'start', trigger } })).run_id; } catch (e) { unlock(); logOut.end(`✖ ${e.message}\n`); stop(`Escritório recusou o início: ${e.message}`, 3); }

// Ambiente do Claude: identidade e token do escritório; o token da Central só para quem posta lá (social_token no agencia.json)
const childEnv = { ...process.env, OFFICE_AGENT_ID: id, BASE_URL: BASE, BONEQUINHOS_AGENCIA: '1', OFFICE_AGENT_TOKEN: process.env.OFFICE_AGENT_TOKEN || process.env.SOCIAL_AGENT_TOKEN || '' };
if (!ac.social_token) delete childEnv.SOCIAL_AGENT_TOKEN;
const child = spawn(bin, cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: childEnv });
let out = '';
child.stdout.on('data', (d) => { out += d; });
child.stderr.on('data', (d) => logOut.write(d));
let killedBy = null;
const timeout = setTimeout(() => { killedBy = `tempo esgotado (${L.run_timeout_minutes} min)`; child.kill('SIGTERM'); }, L.run_timeout_minutes * 60000);
const watch = setInterval(async () => {
  try { const c = await office(id, '/runner/check'); if (c.kill) { killedBy = 'botão de emergência'; child.kill('SIGTERM'); } } catch {}
}, 120000);
child.on('error', (e) => { killedBy = `não abriu o Claude: ${e.message}`; });
const code = await new Promise((r) => child.on('close', r));
clearTimeout(timeout); clearInterval(watch);

let res = {};
try { res = JSON.parse(out.trim().split('\n').pop()); } catch { res = { result: out.slice(-2000), is_error: true }; }
const cost = Number.isFinite(Number(res.total_cost_usd)) ? Number(res.total_cost_usd) : null;
const failed = !!killedBy || code !== 0 || res.is_error;
const summary = (killedBy ? `Interrompido: ${killedBy}. ` : '') + String(res.result || '').replace(/\s+/g, ' ').trim().slice(0, 600);
logOut.write(`\n--- resultado (código ${code}${cost !== null ? `, US$ ${cost.toFixed(4)}` : ''}${res.num_turns ? `, ${res.num_turns} turnos` : ''}) ---\n${res.result || out}\n`);
logOut.end();

writeState(addUsage(readState(), id, cost ?? ac.max_budget_usd, undefined, { owner: OWNER }));
try { await office(id, '/runs', { method: 'POST', body: { phase: 'end', run_id: runId, status: failed ? 'error' : 'ok', cost_usd: cost, summary } }); } catch (e) { console.error(`⚠ não avisei o fim ao escritório: ${e.message}`); }
unlock();
console.log(`${failed ? '✖' : '✔'} ${id}: ${summary.slice(0, 200)}${cost !== null ? ` (US$ ${cost.toFixed(2)})` : ''}\nLog: ${logFile}`);
process.exit(failed ? 1 : 0);
