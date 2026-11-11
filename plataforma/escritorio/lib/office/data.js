// Dados de leitura para os agentes (GET /admin/api/office/data/:nome), sem dados pessoais por padrão.
// Cada fonte é opcional: se o módulo/tabela não existir, devolve { disponivel: false }.
const { one, all, now } = require('../db');

const safe = (fn, d = null) => { try { return fn(); } catch { return d; } };
const DAY = 86400000;
// "maria@empresa.com.br" → "m***@empresa.com.br"
const maskEmail = (e) => String(e || '').replace(/^(.)[^@]*@/, '$1***@');

// Resumo dos comentários das redes (lib/social/comments.js) e quais redes podem ler/responder (a verdade do servidor)
function comentarios() {
  const cm = safe(() => require('../social/comments'));
  if (!cm) return { disponivel: false };
  const s = safe(() => cm.summary());
  if (!s) return { disponivel: false };
  const perm = Object.fromEntries(Object.entries(s.permissions).map(([n, p]) => [n, p.supported === false
    ? { pode_ler_e_responder: false, motivo: p.howto }
    : { pode_ler_e_responder: p.ok === true, conectado: !!p.connected, ...(p.ok === null ? { incerto: 'conexão antiga sem a lista de permissões' } : {}), ...(p.missing.length ? { falta: p.missing } : {}), ...(p.error ? { erro: p.error } : {}), ...(p.ok === true ? {} : { como_resolver: p.howto }) }]));
  return {
    novos: s.counts.novo, ajuste_pedido: s.counts.rascunho, aguardando_aprovacao: s.counts.aguardando, aprovados_para_sair: s.counts.aprovado, com_erro: s.counts.erro,
    enviados_24h: s.enviados_24h, por_rede: Object.fromEntries(Object.entries(s.por_rede).map(([n, c]) => [n, { novos: c.novo, aguardando: c.aguardando, enviados_24h: s.enviados_24h_por_rede[n] || 0 }])),
    ultima_leitura: s.last_sync, permissoes: perm,
    regra: 'O servidor lê os comentários a cada 10 min. A Comunidade responde (office.mjs comentarios), o Gerente Geral aprova o que não é sensível e o dono o resto; o servidor envia só depois da aprovação. TikTok não tem API de resposta: fica fora.',
  };
}

const SOURCES = {
  // operacoes: erros do navegador, rodadas com erro, posts com erro, fila de e-mail, processo
  ops() {
    return {
      client_errors: safe(() => all('SELECT page, message, count, first_at, last_at FROM client_errors ORDER BY last_at DESC LIMIT 25'), []),
      runs_com_erro_7d: safe(() => all("SELECT agent_id, summary, started_at FROM office_runs WHERE status = 'error' AND started_at > ? ORDER BY id DESC LIMIT 20", now() - 7 * DAY), []),
      posts_com_erro: safe(() => all("SELECT id, kind, error, updated_at FROM social_posts WHERE status = 'erro' ORDER BY updated_at DESC LIMIT 20"), []),
      fila_email: safe(() => all('SELECT status, COUNT(*) AS n FROM mail_queue GROUP BY status'), []),
      emails_falhos_7d: safe(() => all("SELECT subject, last_error, next_at FROM mail_queue WHERE status = 'failed' AND next_at > ? ORDER BY id DESC LIMIT 10", now() - 7 * DAY), []),
      processo: { uptime_s: Math.round(process.uptime()), memoria_mb: Math.round(process.memoryUsage().rss / 1048576), node: process.version },
      backups: { disponivel: false, nota: 'O status dos backups fica na VPS (tools/vps-check.sh, só o dono roda). Peça ao dono o resultado ou proponha uma tarefa.' },
    };
  },
  // financeiro: o mesmo relatório do /admin/financeiro (agregados por mês, sem clientes)
  async financeiro() {
    const finance = safe(() => require('../cockpit/finance'));
    if (!finance) return { disponivel: false };
    await finance.ready;
    const r = finance.report({ months: 3 });
    return { meses: r.months, to: r.to };
  },
  analytics() {
    const a = safe(() => require('../cockpit/analytics'));
    return a ? a.report({}) : { disponivel: false };
  },
  // gestor-trafego: campanhas e gasto (leitura). Criar campanha é só no /admin/anuncios, sempre pausada, pelo dono ou pela API de anúncios.
  anuncios() {
    return {
      campanhas: safe(() => all('SELECT id, platform, name, objective, status, remote_status, daily_budget_cents, origin, created_by, updated_at FROM ads_campaigns ORDER BY updated_at DESC LIMIT 50'), []),
      gasto_14d: safe(() => all('SELECT day, platform, campaign_id, campaign_name, spend_cents, currency, impressions, clicks, conversions, conversion_value_cents FROM ads_spend WHERE day >= ? ORDER BY day DESC LIMIT 400',
        new Date(now() - 14 * DAY).toISOString().slice(0, 10)), []),
      // spend_cents fica na moeda da conta (coluna currency); limites e gasto abaixo já estão em reais (cotação PTAX, lib/ads/fx.js)
      limites: safe(() => { const caps = require('../ads/caps'); return { limites: caps.limits(), gasto: caps.spend(), alcance: caps.scope(), cambio: require('../ads/fx').view() }; }, null),
    };
  },
  // suporte: chamados abertos. Mensagens de clientes só saem se o dono ligar OFFICE_SHARE_TICKETS=1 (LGPD: o texto vai para o Claude).
  suporte() {
    if (process.env.OFFICE_SHARE_TICKETS !== '1') {
      return { compartilhado: false, abertos: safe(() => one("SELECT COUNT(*) AS n FROM tickets WHERE status = 'open'").n, null),
        nota: 'Mensagens não compartilhadas. O dono liga com OFFICE_SHARE_TICKETS=1 no servidor (ver tools/agencia/LEIA-ME.md, LGPD).' };
    }
    return { compartilhado: true, chamados: safe(() => all("SELECT protocol, name, email, topic, message, created_at FROM tickets WHERE status = 'open' ORDER BY created_at LIMIT 30"), [])
      .map((t) => ({ protocolo: t.protocol, nome: String(t.name || '').split(/\s+/)[0] || null, email: maskEmail(t.email), assunto: t.topic, mensagem: String(t.message).slice(0, 4000), criado_em: t.created_at })) };
  },
  // gerente (e quem escreve para o público): fatos de preço e limite direto do código (lib/plans.js), para conferir posts e textos.
  // Em reais e MB. "ilimitado" no lugar de Infinity. A página pública é /precos.
  precos() {
    const plans = safe(() => require('../plans'));
    if (!plans) return { disponivel: false };
    const reais = (c) => Math.round(c) / 100;
    const mb = (b) => Math.round(b / 1048576);
    const lim = (v) => (v === Infinity ? 'ilimitado' : v);
    return {
      pagina: '/precos', moeda: 'BRL',
      site: {
        pro: { mensal: reais(plans.PRICES.pro.monthly), anual: reais(plans.PRICES.pro.annual) },
        passe_24h: reais(plans.PRICES.pass.day),
        empresas_por_usuario: { mensal: reais(plans.PRICES.business.monthly), anual: reais(plans.PRICES.business.annual), minimo_usuarios: plans.BUSINESS_MIN_SEATS },
      },
      limites: Object.fromEntries(Object.entries(plans.LIMITS).map(([k, v]) => [k, { nome: v.label, arquivo_max_mb: mb(v.maxFileBytes), arquivos_por_vez: v.maxFiles, pesados_por_dia: lim(v.heavyPerDay), tarefas_por_hora: v.jobsPerHour, anuncios: v.ads }])),
      expedicao: Object.values(plans.EXP_PLANS).map((p) => ({ nome: p.label, mensal: reais(p.price.monthly), anual: reais(p.price.annual), pedidos_mes: p.orders })),
      expedicao_pedidos_mes_fora_dos_planos: plans.EXP_QUOTAS,
      api: Object.values(plans.API_PLANS).map((p) => ({ nome: p.label, mensal: reais(p.price.monthly), anual: reais(p.price.annual), creditos_mes: p.credits, por_minuto: p.perMinute, arquivo_max_mb: mb(p.maxFileBytes) })),
      api_pacotes_avulsos: Object.entries(plans.CREDIT_PACKS).map(([n, c]) => ({ creditos: Number(n), preco: reais(c), validade_meses: 12 })),
      api_creditos_inclusos: plans.BUNDLE_CREDITS,
      nota: 'Fonte: lib/plans.js (o que o site cobra de verdade). Qualquer número diferente disto num post ou texto é afirmação falsa.',
    };
  },
  // social: posts da Central para evitar repetidos
  social() {
    // Contas conectadas e modo de cada rede (a verdade do servidor: não suponha nada além disto)
    const acc = safe(() => all("SELECT network, expires_at, refresh_enc IS NOT NULL AS renova, connected_at FROM social_accounts"), []);
    const set = Object.fromEntries(safe(() => all("SELECT key, value FROM social_settings WHERE key IN ('mode','yt_privacy','tiktok_mode','tiktok_audited','slots')"), []).map((r) => [r.key, r.value]));
    const con = (n) => { const a = acc.find((x) => x.network === n); return a ? { conectado: true, desde: a.connected_at, token_expira: a.expires_at || null, renova_sozinho: !!a.renova } : { conectado: false }; };
    const tiktokDireto = set.tiktok_mode === 'direct';
    return {
      contas: { instagram: con('instagram'), facebook: con('facebook'), youtube: con('youtube'), tiktok: con('tiktok'), threads: con('threads') },
      ajustes: set,
      como_publica: {
        regra: 'Post AGENDADO sai sozinho na hora marcada em todas as redes conectadas. Post AGUARDANDO precisa do Gerente Geral ou do dono aprovar. Só posts com entrega "kit" vão para "Postar no app" (Instagram/Facebook com áudio em alta posto à mão).',
        instagram_facebook: 'Automático pela API da Meta (Reels, carrossel, imagem e story), com legenda, hashtags e capa. Exceção: entrega kit.',
        youtube: `Automático (vídeo, título, descrição, tags, #Shorts; sem thumb personalizada em Shorts). Privacidade pedida: ${set.yt_privacy || 'public'}; até a auditoria do Google o YouTube trava como privado.`,
        tiktok: tiktokDireto
          ? `Modo direto: publica sozinho, mas ${set.tiktok_audited === '1' ? 'o app já foi auditado' : 'enquanto o app não for auditado pelo TikTok o vídeo sai PRIVADO (só a conta vê); o modo "inbox" manda para os rascunhos do app para o dono publicar com som'}.`
          : 'Modo inbox: o vídeo vai para os rascunhos do app do TikTok (notificação no celular); o dono escolhe o som e publica.',
        threads: 'Automático (texto e imagem), se a conta estiver conectada.',
        avisos: 'Notificação de kit e de rascunho: app ntfy no celular (o tópico está configurado no servidor).',
      },
      posts: safe(() => all("SELECT id, status, kind, networks, substr(caption, 1, 300) AS caption, ref, scheduled_at, published_at FROM social_posts WHERE updated_at > ? ORDER BY updated_at DESC LIMIT 80", now() - 30 * DAY), []),
      comentarios: comentarios() };
  },
};

async function get(name) {
  const fn = SOURCES[name];
  if (!fn) return null;
  return { fonte: name, gerado_em: now(), ...(await fn()) };
}

module.exports = { get, NAMES: Object.keys(SOURCES), maskEmail };
