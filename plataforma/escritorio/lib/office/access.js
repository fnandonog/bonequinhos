// Acesso ao escritório: admin logado (lib/security/admin-guard.js se existir; senão ADMIN_EMAILS) ou um agente com token.
// Agentes: Authorization: Bearer <OFFICE_AGENT_TOKEN (ou SOCIAL_AGENT_TOKEN)> + X-Agent-Id: <id do elenco>.
const crypto = require('crypto');
const path = require('path');
const config = require('../config');
const roster = require('./roster');

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// Guarda de admin: lib/admin/guard.js (comum às telas do dono; ele já usa lib/security/admin-guard.js com 2FA quando existir).
// Sem ele, tenta lib/security/admin-guard.js direto; sem nenhum, vale ADMIN_EMAILS (mesma regra do /admin).
let shared, direct;
function loadShared() {
  if (shared !== undefined) return shared;
  try { shared = require(require.resolve(path.join(__dirname, '..', 'admin', 'guard'))); if (typeof shared.requireApi !== 'function') shared = null; } catch { shared = null; }
  return shared;
}
function loadGuard() {
  if (direct) return direct;
  try { const m = require(require.resolve(path.join(__dirname, '..', 'security', 'admin-guard'))); direct = typeof m.requireAdmin === 'function' ? m : null; } catch { direct = null; }
  return direct;
}
const isAdminEmail = (req) => !!(req.user && (config.ADMIN_EMAILS.includes(String(req.user.email).toLowerCase()) || (!config.PROD && !config.ADMIN_EMAILS.length)));

function agentTokens() {
  return [process.env.OFFICE_AGENT_TOKEN, process.env.SOCIAL_AGENT_TOKEN].filter((t) => t && t.length >= 16);
}
// true = token válido, false = token errado, null = sem Bearer
function bearerOk(req) {
  const h = String(req.headers.authorization || '');
  if (!h.startsWith('Bearer ')) return null;
  const got = h.slice(7).trim();
  return agentTokens().some((t) => safeEqual(got, t));
}
function sameOrigin(req) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  const origin = req.headers.origin || req.headers.referer || '';
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

// Checagem do admin. Chama ok() ou responde (401 sem login, 404 sem permissão, 403 de outro site).
function adminCheck(req, res, ok) {
  const sh = loadShared();
  if (sh) return sh.requireApi(req, res, ok);
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origem não permitida.' });
  const g = loadGuard();
  if (g && typeof g.requireAdminApi === 'function') return g.requireAdminApi(req, res, ok);
  if (!req.user) return res.status(401).json({ error: 'Entre na sua conta para continuar.' });
  if (!isAdminEmail(req)) return res.status(404).json({ error: 'Não encontrado.' });
  ok();
}
// Página: sem login → entrar; sem permissão → notFound(req, res)
function pageGuard(notFound) {
  const sh = loadShared();
  if (sh && typeof sh.requirePage === 'function') return sh.requirePage(notFound);
  return (req, res, next) => {
    const g = loadGuard();
    if (g) return g.requireAdmin(req, res, next);
    if (!req.user) return res.redirect(`/entrar?next=${encodeURIComponent(req.originalUrl)}`);
    if (!isAdminEmail(req)) return notFound(req, res);
    next();
  };
}

// Middleware: { agent: true } aceita agente com token; admin sempre aceito (com proteção de origem).
const access = ({ agent = false } = {}) => (req, res, next) => {
  const b = bearerOk(req);
  if (b === false) return res.status(401).json({ error: 'Token do agente inválido.' });
  if (b === true) {
    if (!agent) return res.status(401).json({ error: 'Esta rota é só do dono.' });
    const id = String(req.headers['x-agent-id'] || '').trim().toLowerCase();
    if (!roster.byId[id]) return res.status(400).json({ error: `Cabeçalho X-Agent-Id ausente ou desconhecido. Use um de: ${roster.IDS.join(', ')}.` });
    req.actor = id;
    req.isAgent = true;
    return next();
  }
  adminCheck(req, res, () => {
    req.actor = 'admin';
    req.isAgent = false;
    next();
  });
};

// Ação sensível do dono (ex.: Modo do Gerente): exige a 2FA confirmada há pouco (lib/security/admin-guard.js, sensitive: true).
// Sem o módulo de segurança, vale a regra comum do admin. O token dos agentes nunca passa.
const accessSensitive = () => (req, res, next) => {
  const b = bearerOk(req);
  if (b === false) return res.status(401).json({ error: 'Token do agente inválido.' });
  if (b === true) return res.status(401).json({ error: 'Esta rota é só do dono.' });
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origem não permitida.' });
  const done = () => { req.actor = 'admin'; req.isAgent = false; next(); };
  const g = loadGuard();
  if (g && typeof g.requireAdminApi === 'function') return g.requireAdminApi({ sensitive: true })(req, res, done);
  adminCheck(req, res, done);
};

module.exports = { access, accessSensitive, adminCheck, pageGuard, isAdminEmail, bearerOk, agentTokens };
