// Gerente Geral: o agente que revisa e dá a aprovação final pelo dono. Aqui ficam as regras que valem NO CÓDIGO (não só no prompt):
// o que é "sensível" (só o dono aprova), o que o Gerente Geral nunca aprova, os três modos (direto | 2h | off) e o que os
// gerentes de área podem (coordenar a própria equipe e marcar "pré-aprovado pela área"; nunca a aprovação final).
// Usado por lib/office/index.js (rotas /admin/api/office/gerente/* e /area/*) e pelo painel. Guia: tools/agencia/LEIA-ME.md, "Gerente" e "Organograma".
const roster = require('./roster');

const ID = 'gerente'; // Gerente Geral (o id ficou "gerente" por compatibilidade)
// Só estes dão a aprovação final (fecham uma tarefa em Revisão como aprovada). Gerentes de área NUNCA.
const FINAL_APPROVERS = [ID, 'admin'];
const MODES = {
  direto: 'Publicar direto',
  '2h': 'Publicar depois de 2 horas',
  off: 'Desligado',
};
const DEFAULT_MODE = '2h';
const VETO_MS = 2 * 3600000; // modo "2h": o post só sai 2 horas depois da aprovação do Gerente (o dono pode barrar)
// Agentes cujo trabalho o Gerente nunca aprova, mesmo que o dono desmarque "sensível" (envio para fora)
const NEVER_APPROVE = ['captacao-b2b', 'gerente-comercial'];
const MIN_COMMENT = 10; // aprovar ou pedir ajustes exige um comentário concreto

// Palavras que tornam uma tarefa sensível. Sem \b depois de letra acentuada (o \b do JS só conhece ASCII).
const RX = {
  // gestor de tráfego: ativar campanha, aumentar orçamento/teto
  ads: /\b(ativa(r|ção|cao)?|reativ|ligar|aumentar|subir|escalar|dobrar)[^.\n]{0,40}(campanha|anúncio|anuncio|orçamento|orcamento|verba|teto|budget)|\b(orçamento|orcamento|verba|budget|tetos?\b|lance)/i,
  // financeiro: decisões (preço, plano, cobrança, reembolso…)
  finance: /decis|decidir|reembols|estorn|cobran|pre(ç|c)o|desconto|planos?\b|assinatura|cancelament|inadimpl/i,
  // qualquer agente: dinheiro, preço, plano pago, cobrança
  money: /\bpre(ç|c)os?\b|precifica|\bR\$\s?\d|cobran(ç|c)a|faturamento|billing|reembols|estorn|\bdescontos?\b|\bcupo(m|ns)\b|mensalidade|\bplanos?\s+(pro|business|empresas|gr(á|a)tis|pago|anual|mensal|api|expedi)|pagamento|\bpix\b|cart(ã|a)o de cr(é|e)dito|or(ç|c)amento|\bverba\b|\bbudget\b/i,
  // qualquer agente: enviar/disparar e-mail ou mensagem para fora
  send: /\b(enviar|disparar|mandar|envio|disparo)\b[^.\n]{0,30}(e-?mails?|mensage(m|ns)|whats|sms|newsletter|outbound|prospec)/i,
};

// Motivo pelo qual a tarefa é sensível (ou null). Entrada: { title, description, assignee, created_by }
function autoSensitive(t) {
  const who = [t.assignee, t.created_by];
  const text = `${t.title || ''}\n${t.description || ''}`;
  if (who.includes('captacao-b2b')) return 'Captação B2B (e-mails para fora)';
  if (who.includes('gerente-comercial')) return 'Comercial e parcerias (contato para fora)';
  if ((who.includes('gestor-trafego') || who.includes('gerente-crescimento')) && RX.ads.test(text)) return 'Anúncios: ativação, orçamento ou teto';
  if ((who.includes('financeiro') || who.includes('gerente-financeiro')) && RX.finance.test(text)) return 'Decisão financeira';
  if (RX.send.test(text)) return 'Envio de e-mail ou mensagem para fora';
  if (RX.money.test(text)) return 'Dinheiro, preço, plano ou cobrança';
  return null;
}

// Campos de sensibilidade ao criar/editar. explicit: { value, by } quando alguém marcou na mão.
// Regras: o dono (admin) decide de vez (sensitive_by = admin, não recalcula); agente só pode LIGAR; o automático recalcula.
function sensitiveFields(t, prev = null, explicit = null) {
  if (explicit && explicit.by === 'admin') {
    return { sensitive: explicit.value ? 1 : 0, sensitive_by: 'admin', sensitive_reason: explicit.value ? (autoSensitive(t) || 'Marcada por você') : null };
  }
  if (prev && prev.sensitive_by === 'admin') return {};
  if (explicit && explicit.value) return { sensitive: 1, sensitive_by: explicit.by || 'agente', sensitive_reason: autoSensitive(t) || 'Marcada pelo agente' };
  if (prev && prev.sensitive_by === 'agente' && prev.sensitive) return {}; // o agente não desliga o que ligou
  const reason = autoSensitive(t);
  return { sensitive: reason ? 1 : 0, sensitive_by: reason ? 'auto' : null, sensitive_reason: reason };
}

// Por que o Gerente NÃO pode aprovar esta tarefa (null = pode). task = serializeTask (com artifacts).
function approveBlock(task) {
  if (!task) return 'Tarefa não encontrada.';
  if (task.status !== 'review') return 'A tarefa não está em Revisão: o Gerente só aprova o que foi mandado para aprovação.';
  if (NEVER_APPROVE.includes(task.assignee) || NEVER_APPROVE.includes(task.created_by)) return 'Comercial / captação B2B: contato para fora só sai com o dono. A tarefa fica "esperando você".';
  if (task.assignee === ID) return 'O Gerente Geral não aprova o próprio trabalho: o resumo do dia e as tarefas dele ficam com o dono.';
  if (task.sensitive) return `Tarefa sensível (${task.sensitive_reason || 'marcada'}): só o dono aprova. Ela fica "esperando você".`;
  // defesa extra: se o texto mudou e virou sensível, mas a marcação automática ainda não pegou (o dono pode desmarcar na mão)
  if (task.sensitive_by !== 'admin') { const r = autoSensitive(task); if (r) return `Tarefa sensível (${r}): só o dono aprova. Ela fica "esperando você".`; }
  if ((task.artifacts || []).some((a) => a.kind === 'anuncio')) return 'Proposta de anúncio: ativar campanha ou mudar orçamento é só com o dono. A tarefa fica "esperando você".';
  return null;
}

// ---------- Comentários das redes (lib/social/comments.js) ----------
// Mesmo espírito das tarefas: o que é sensível só o dono aprova. Confere o comentário E a resposta sugerida.
const COMMENT_RX = {
  refund: /reembols|estorn|cobran(ç|c)|cobrad|cobrar(am)?\b|chargeback|fatura|cancelar (a |minha )?assinatura|cancelament|\bdinheiro de volta|paguei/i,
  // e-mail, telefone (com DDD) e CPF/CNPJ escritos no texto
  personal: /[\w.+-]+@[\w-]+\.[\w.-]+|\(?\b\d{2}\)?\s?9?\d{4}[-\s.]?\d{4}\b|\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/,
  offense: /\b(idiota|burr[oa]s?|lixo|merda|porra|caralho|fdp|otári|imbecil|vagabund|safad|golpe|golpista|fraude|enganaç|engana(m|ram)\b|ladr|roub|vergonha|ridícul|palhaçad|incompetent|pior (app|site|serviço|empresa))/i,
  price: /\bpre(ç|c)os?\b|quanto (custa|é|sai|fica|cobra)|\bvalor(es)?\b|\bdescontos?\b|\bcupo(m|ns)\b|promo(ç|c)|\bR\$\s?\d|mensalidade|\bplanos?\s+(pro|business|empresas|pago|anual|mensal)|black friday/i,
  legal: /procon|advogad|\bprocess(ar|o judicial)|justi(ç|c)a|jur(í|i)dic|reclame ?aqui|consumidor\.gov|\banpd\b|danos morais|\blgpd\b/i,
  kids: /crian(ç|c)a|menor de idade|\bmeu filho|\bminha filha|\bfilh(o|a|os|as) (de|com) \d|adolescente|\b\d{1,2} anos de idade/i,
};
// Motivo pelo qual o comentário (ou a resposta) é sensível, ou null. Entrada: { text, reply, classification }
function commentSensitive(c) {
  const text = `${c.text || ''}\n${c.reply || ''}`;
  if (c.classification === 'reclamacao') return 'Reclamação';
  if (COMMENT_RX.refund.test(text)) return 'Reembolso ou cobrança';
  if (COMMENT_RX.personal.test(text)) return 'Dado pessoal no texto (e-mail, telefone ou CPF)';
  if (COMMENT_RX.offense.test(text)) return 'Ofensa, acusação ou briga';
  if (COMMENT_RX.legal.test(text)) return 'Jurídico, Procon ou órgão de defesa do consumidor';
  if (COMMENT_RX.price.test(text)) return 'Preço, plano ou desconto';
  if (COMMENT_RX.kids.test(text)) return 'Menção a crianças';
  return null;
}
// Por que o Gerente NÃO pode aprovar esta resposta (null = pode). c = linha serializada de social_comments.
function commentApproveBlock(c, mode = DEFAULT_MODE) {
  if (!c) return 'Comentário não encontrado.';
  if (c.status !== 'aguardando') return `O Gerente só aprova resposta em "aguardando" (esta está em ${c.status}).`;
  if (!String(c.reply || '').trim()) return 'Sem resposta sugerida para aprovar.';
  if (c.sensitive) return `Comentário sensível (${c.sensitive_reason || 'marcado'}): só o dono aprova. Fica "esperando você".`;
  if (c.sensitive_by !== 'admin') { const r = commentSensitive(c); if (r) return `Comentário sensível (${r}): só o dono aprova. Fica "esperando você".`; }
  if (mode === 'off') return 'Modo do Gerente: Desligado. O Gerente só comenta; quem aprova é o dono.';
  return null;
}

const normMode = (m) => (Object.prototype.hasOwnProperty.call(MODES, m) ? m : DEFAULT_MODE);

// ---------- Gerentes de área ----------
// Coordenam a própria equipe: criam/atribuem tarefas para ela (ou para si), comentam, pedem ajustes e marcam
// "pré-aprovado pela área". Herdam todas as proibições dos agentes (não ativam anúncio, não mudam orçamento, não enviam,
// não mexem em preço, não desmarcam "sensível") e NUNCA dão a aprovação final (só o Gerente Geral e o dono).
const AREA_ACTIONS = { preapprove: 'pré-aprovou', changes: 'pediu ajustes em', comment: 'comentou' };
const canFinalApprove = (actor) => FINAL_APPROVERS.includes(actor);
const isAreaManager = (id) => roster.isAreaManager(id);
const inTeam = (manager, id) => !!id && (id === manager || roster.teamOf(manager).includes(id));
const areaLabel = (manager) => { const a = roster.byId[manager]; return a ? roster.teamName(a.team) : manager; };

// Por que este agente NÃO pode atribuir a tarefa para `assignee` (null = pode). Só restringe gerentes de área.
function assignBlock(actor, assignee) {
  if (!isAreaManager(actor) || !assignee) return null;
  if (inTeam(actor, assignee)) return null;
  return `${roster.byId[actor].name} só distribui tarefas para a própria equipe (${roster.teamOf(actor).join(', ')}) ou para si. Para outra área, peça ao Gerente Geral ou ao Diretor.`;
}
// Por que o gerente de área NÃO pode mexer nesta tarefa existente (null = pode): só tarefas da equipe, dele ou criadas por ele
function editBlock(actor, row) {
  if (!isAreaManager(actor) || !row) return null;
  if (inTeam(actor, row.assignee) || row.created_by === actor || !row.assignee) return null;
  return `${roster.byId[actor].name} só mexe em tarefas da própria equipe. #${row.id} é de ${row.assignee}.`;
}
// Por que o gerente de área NÃO pode revisar (pré-aprovar / pedir ajustes / comentar) esta tarefa (null = pode)
function areaReviewBlock(actor, task, action, mode = DEFAULT_MODE) {
  if (!isAreaManager(actor)) return 'Rota só dos gerentes de área.';
  if (!task) return 'Tarefa não encontrada.';
  if (!Object.prototype.hasOwnProperty.call(AREA_ACTIONS, action)) return 'action deve ser preapprove, changes ou comment.';
  if (task.status !== 'review') return 'A tarefa não está em Revisão: o gerente de área só revisa o que foi mandado para aprovação.';
  if (task.assignee === actor) return 'O gerente de área não revisa o próprio trabalho: ele vai direto para o Gerente Geral / o dono.';
  if (!inTeam(actor, task.assignee)) return `${roster.byId[actor].name} só revisa tarefas da própria equipe.`;
  if (action === 'changes' && mode === 'off') return 'Modo do Gerente: Desligado. Os gerentes só comentam ou pré-aprovam; quem decide é o dono.';
  return null;
}

module.exports = { ID, FINAL_APPROVERS, MODES, DEFAULT_MODE, VETO_MS, NEVER_APPROVE, MIN_COMMENT, RX, COMMENT_RX, AREA_ACTIONS, autoSensitive, sensitiveFields, approveBlock, normMode,
  commentSensitive, commentApproveBlock,
  canFinalApprove, isAreaManager, inTeam, areaLabel, assignBlock, editBlock, areaReviewBlock };
