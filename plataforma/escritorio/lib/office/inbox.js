// Caixa de aprovação do escritório: tudo que espera o dono numa lista só — tarefas em Revisão (inclusive as sensíveis),
// posts "Aguardando aprovação" da Central de Redes Sociais (lib/social), rascunhos da Central que já têm mídia (vídeo/imagem pronto
// esperando alguém mandar para aprovação: o dono aprova e agenda daqui), Kits prontos ("Postar no app"), respostas a comentários das
// redes (lib/social/comments.js) e propostas de anúncio (lib/ads). Cada módulo é
// carregado só quando existe (o escritório funciona sem eles). Ativar campanha NUNCA acontece aqui: fica na tela de Anúncios,
// com a confirmação digitada e a 2FA de risco alto.
const store = require('./store');
const roster = require('./roster');

const social = () => { try { return require('../social'); } catch { return null; } };
const socialStore = () => { try { return require('../social/store'); } catch { return null; } };
const adsStore = () => { try { return require('../ads/store'); } catch { return null; } };
const teamOf = (agentId) => { const a = roster.byId[agentId]; return a ? a.team : null; };
const brl = (cents) => (cents == null ? null : `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`);

// Entrega em texto mais recente de cada "família" (original + edições do dono): é ela que aparece e que se edita
function latestTexts(artifacts) {
  const byRoot = new Map();
  for (const a of artifacts || []) {
    if (a.kind !== 'texto' || !a.content) continue;
    const root = a.parent_id || a.id;
    const cur = byRoot.get(root);
    if (!cur || (a.version || 1) > (cur.version || 1) || ((a.version || 1) === (cur.version || 1) && a.id > cur.id)) byRoot.set(root, { ...a, versions: 0 });
  }
  for (const a of artifacts || []) { const r = byRoot.get(a.parent_id || a.id); if (r && a.kind === 'texto') r.versions++; }
  return [...byRoot.values()];
}

function taskItems() {
  return store.listTasks({ status: ['review'], limit: 300 }).map((t) => {
    const texts = latestTexts(t.artifacts);
    return {
      key: `task:${t.id}`, type: 'task', id: t.id, area: teamOf(t.assignee) || 'direcao', agent: t.assignee, title: t.title,
      at: t.updated_at, sensitive: t.sensitive, sensitive_reason: t.sensitive_reason, escalated: t.escalated, pre_approved: t.pre_approved,
      area_review_by: t.area_review_by, area_review_note: t.area_review_note, review_note: t.reviewed_by === 'gerente' ? t.review_note : null,
      description: t.description, links: t.links, files: t.files, tags: t.tags, parent_id: t.parent_id,
      texts: texts.map((a) => ({ id: a.id, label: a.label, content: a.content, version: a.version || 1, versions: a.versions, agent_id: a.agent_id, created_at: a.created_at })),
      others: (t.artifacts || []).filter((a) => a.kind !== 'texto').map((a) => ({ id: a.id, kind: a.kind, label: a.label, url: a.url, path: a.path })),
      comments_count: t.comments_count, last_comment: t.last_comment,
    };
  });
}

// Título da linha: 1ª linha da legenda (ou o título do YouTube); story sem legenda vira "Story · Destaque X"
const KIND_NAMES = { imagem: 'Imagem', carrossel: 'Carrossel', reels: 'Reels', video: 'Vídeo', short: 'Short', texto: 'Texto', story: 'Story' };
function postTitle(p) {
  const first = String(p.title || p.caption || '').split('\n').map((l) => l.trim()).find(Boolean) || '';
  if (first) return first.replace(/\s+/g, ' ').slice(0, 110);
  const k = KIND_NAMES[p.kind] || 'Post';
  return p.destaque ? `${k} · Destaque "${p.destaque}"` : `${k} #${p.id}`;
}

// Rascunho parado: já tem mídia e ninguém pediu ajuste nele depois da última mudança (o ajuste pedido pelo dono ou pelo
// Gerente volta o post para Rascunhos; esse fica com o agente até ele mexer de novo). Sem mídia é ideia, não entra.
const draftReady = (p) => (p.media || []).length > 0 && !(p.reviewed_by && p.reviewed_at && p.reviewed_at + 2000 >= p.updated_at);
function postItems() {
  const ss = socialStore();
  const sc = social();
  if (!ss) return [];
  try {
    const waiting = ss.listPosts({ status: ['aguardando'], limit: 100 });
    const drafts = ss.listPosts({ status: ['rascunho'], limit: 100 }).filter(draftReady);
    return [...waiting, ...drafts].map((p) => {
      const versions = store.postVersions(p.id);
      return {
        key: `post:${p.id}`, type: 'post', id: p.id, area: 'marketing', agent: p.source === 'agente' ? 'social-media' : null,
        title: postTitle(p),
        at: p.updated_at, caption: p.caption || '', kind: p.kind, networks: p.networks, scheduled_at: p.scheduled_at, title_text: p.title, hashtags: p.hashtags || '',
        destaque: p.destaque || '', notes: p.notes || '', media_count: (p.media || []).length, entrega: p.entrega || 'automatica', audio_sugerido: p.audio_sugerido || null,
        media: (p.media || []).slice(0, 20).map((m) => ({ id: m.id, url: m.url, thumb: m.thumb, video: m.video, mime: m.mime, width: m.width || null, height: m.height || null })),
        review_note: p.review_note || null, reviewed_by: p.reviewed_by || null,
        problems: sc && sc.problems ? sc.problems(p) : [], warnings: sc && sc.warnings ? sc.warnings(p) : [],
        versions: versions.length, sensitive: false, draft: p.status === 'rascunho',
      };
    });
  } catch (e) { console.error('[escritorio] caixa: posts', e.message); return []; }
}

// Kit pronto (entrega pelo Kit, hora marcada já passou): "Postar no app" até o dono tocar em "Já postei"
function kitItems() {
  const ss = socialStore();
  if (!ss) return [];
  try {
    return ss.listPosts({ status: ['kit'], limit: 50 }).map((p) => {
      // TikTok pelo Chrome sai sozinho: só vira tarefa do dono quando a extensão falhou ou ficou sem resposta
      const pend = Object.keys(p.remote || {}).filter((n) => p.remote[n] && p.remote[n].kit && !p.remote[n].postado && (!p.remote[n].chrome || ['falhou', 'incerto'].includes(p.remote[n].chrome)));
      if (!pend.length) return null;
      return {
        key: `kit:${p.id}`, type: 'kit', id: p.id, area: 'marketing', agent: p.source === 'agente' ? 'social-media' : null,
        title: `Postar no app: ${postTitle(p)}`, at: p.updated_at, caption: p.caption || '', kind: p.kind, networks: p.networks, kit_networks: pend,
        scheduled_at: p.scheduled_at, title_text: p.title, hashtags: p.hashtags || '', notes: p.notes || '', media_count: (p.media || []).length,
        media: (p.media || []).slice(0, 20).map((m) => ({ id: m.id, url: m.url, thumb: m.thumb, video: m.video, mime: m.mime, width: m.width || null, height: m.height || null })),
        entrega: 'kit', audio_sugerido: p.audio_sugerido || null, problems: [], warnings: [], versions: 0, sensitive: false,
      };
    }).filter(Boolean);
  } catch (e) { console.error('[escritorio] caixa: kits', e.message); return []; }
}

// Respostas a comentários das redes (lib/social/comments.js): aguardando aprovação, com erro de envio e as aprovadas pelo Gerente
// no modo "2h" que ainda não saíram (o dono pode enviar já ou barrar). Sensível = só o dono aprova.
const comments = () => { try { return require('../social/comments'); } catch { return null; } };
function commentItems() {
  const cm = comments();
  if (!cm) return [];
  try {
    const t = Date.now();
    return [...cm.list({ status: 'aguardando,erro', limit: 150 }), ...cm.list({ status: 'aprovado', limit: 50 }).filter((c) => c.send_at && c.send_at > t)]
      .map((c) => ({
        key: `comentario:${c.id}`, type: 'comentario', id: c.id, area: 'marketing', agent: c.drafted_by && c.drafted_by !== 'admin' ? c.drafted_by : 'comunidade',
        title: String(c.text || '(comentário apagado pela faxina de 90 dias)').replace(/\s+/g, ' ').slice(0, 110), at: c.updated_at,
        network: c.network, networks: [c.network], author: c.author, text: c.text || '', reply: c.reply || '', classification: c.classification, status: c.status,
        post: c.post || null, commented_at: c.commented_at, sensitive: c.sensitive, sensitive_reason: c.sensitive_reason, escalated: c.escalated,
        review_note: c.review_note, reviewed_by: c.reviewed_by, approved_by: c.approved_by, send_at: c.status === 'aprovado' ? c.send_at : null,
        pending_send: c.status === 'aprovado', error: c.status === 'erro' ? c.error : null, attempts: c.attempts, hide_suggested: c.hide_suggested,
        reply_max: cm.REPLY_MAX[c.network] || 2200,
      }));
  } catch (e) { console.error('[escritorio] caixa: comentários', e.message); return []; }
}

function adItems() {
  const as = adsStore();
  if (!as) return [];
  try {
    const out = [];
    for (const c of as.listCampaigns()) {
      const spec = c.spec || {};
      const budget = c.daily_budget_cents ?? (spec.daily_budget_brl ? Math.round(spec.daily_budget_brl * 100) : null);
      if (c.status === 'proposta') {
        out.push({ key: `ad:${c.id}`, type: 'ad', id: c.id, area: 'crescimento', agent: c.created_by === 'agente' ? 'gestor-trafego' : null, title: c.name, at: c.updated_at,
          objective: spec.objective || c.objective, budget_brl: brl(budget), notes: c.notes || '', pushed: !!c.remote_id, last_error: c.last_error || null,
          spec: specSummary(spec),
          sensitive: false });
      }
      // Aumento de orçamento pendente: risco alto (2FA + CONFIRMAR) — só aparece aqui com o link; aprova-se em Anúncios
      if (c.pending_budget_cents && ['pausada', 'ativa'].includes(c.status)) {
        out.push({ key: `adbudget:${c.id}`, type: 'ad_budget', id: c.id, area: 'crescimento', agent: 'gestor-trafego', title: `Aumentar orçamento: ${c.name}`, at: c.updated_at,
          from_brl: brl(c.daily_budget_cents), to_brl: brl(c.pending_budget_cents), actionable: false, sensitive: true, sensitive_reason: 'mais gasto: aprove em Anúncios (pede o código e CONFIRMAR)' });
      }
    }
    return out;
  } catch (e) { console.error('[escritorio] caixa: anúncios', e.message); return []; }
}

// Resumo legível da proposta (conjuntos de anúncios → público, criativos → texto e link)
function specSummary(spec) {
  const sets = Array.isArray(spec.adsets) ? spec.adsets : [];
  const tg = (t) => {
    if (!t) return '';
    const bits = [];
    if (t.age_min || t.age_max) bits.push(`${t.age_min || 18}–${t.age_max || 65} anos`);
    if (Array.isArray(t.interests) && t.interests.length) bits.push(`interesses: ${t.interests.map((i) => (typeof i === 'string' ? i : i.name)).filter(Boolean).slice(0, 8).join(', ')}`);
    if (t.advantage_audience) bits.push('público Advantage+');
    if (t.exclude_registered) bits.push('sem quem já tem conta');
    return bits.join(' · ');
  };
  const ads = sets.flatMap((a) => (Array.isArray(a.ads) ? a.ads : []));
  return {
    audience: sets.map((a) => `${a.name ? `${a.name}: ` : ''}${tg(a.targeting)}`).filter((x) => x.trim()).join(' | ') || null,
    placements: spec.placements || null,
    creative: ads.slice(0, 3).map((a) => [a.headline, a.primary_text].filter(Boolean).join(' — ')).filter(Boolean).join(' | ') || null,
    url: (ads.find((a) => a.link) || {}).link || spec.url || null,
  };
}

const AREA_NAMES = Object.fromEntries(Object.entries(roster.TEAMS).map(([k, t]) => [k, t.short || t.name]));
function list() {
  const items = [...taskItems(), ...kitItems(), ...postItems(), ...commentItems(), ...adItems()]
    .sort((a, b) => Number(!!b.sensitive) - Number(!!a.sensitive) || Number(!!a.draft) - Number(!!b.draft) || b.at - a.at); // rascunhos por último
  const count = (f) => items.filter(f).length;
  return {
    items, total: items.length, areas: AREA_NAMES,
    counts: { task: count((i) => i.type === 'task'), post: count((i) => i.type === 'post' || i.type === 'kit'), kit: count((i) => i.type === 'kit'), draft: count((i) => i.draft), ad: count((i) => i.type === 'ad' || i.type === 'ad_budget'),
      comentario: count((i) => i.type === 'comentario'),
      areas: Object.fromEntries(Object.keys(AREA_NAMES).map((k) => [k, count((i) => i.area === k)])) },
  };
}
const count = () => { try { return list().total; } catch { return 0; } };

module.exports = { list, count, latestTexts, social, socialStore };
