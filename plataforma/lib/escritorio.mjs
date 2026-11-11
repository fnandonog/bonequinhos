// A agência conta ao escritório o que está fazendo (mesma API que os agentes usam pelo escritorio/tools/office.mjs).
// Se o painel estiver desligado, nada quebra: a produção segue e só o escritório fica sem a atualização.
import crypto from 'node:crypto';
import {env, salvarEnv} from './dados.mjs';

export function token() {
  let t = env().OFFICE_AGENT_TOKEN;
  if (!t) {
    t = crypto.randomBytes(24).toString('hex');
    salvarEnv({OFFICE_AGENT_TOKEN: t});
  }
  return t;
}
const BASE = () => `http://127.0.0.1:${env().PORTA || 4380}/admin/api/office`;

async function call(agente, caminho, metodo = 'GET', corpo) {
  try {
    const r = await fetch(BASE() + caminho, {
      method: metodo,
      headers: {authorization: `Bearer ${token()}`, 'x-agent-id': agente, 'content-type': 'application/json'},
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const j = await r.json().catch(() => ({}));
    return r.ok ? j : (j.task ? j : null);
  } catch {
    return null;
  }
}

export const batida = (agente, status, tarefa, taskId, mensagem, nivel) =>
  call(agente, '/heartbeat', 'POST', {status, task: tarefa, task_id: taskId ?? undefined, message: mensagem, level: nivel});

// Tarefa do vídeo (uma por vídeo, ref "video:<id>"); devolve o id da tarefa
export async function tarefaDoVideo(id, titulo, descricao) {
  const j = await call('showrunner', '/tasks', 'POST', {title: titulo, description: descricao, assignee: 'pauteiro', status: 'doing', ref: `video:${id}`, tags: ['video']});
  return j?.task?.id ?? null;
}
export const mover = (taskId, agente, campos) => taskId && call('showrunner', `/tasks/${taskId}`, 'PATCH', {assignee: agente, ...campos});
export const anexar = (taskId, agente, a) => taskId && call(agente, `/tasks/${taskId}/artifacts`, 'POST', a);
export const comentar = (taskId, agente, texto) => taskId && call(agente, `/tasks/${taskId}/comments`, 'POST', {text: texto});

// Comentários novos nas redes: uma tarefa por dia para a Comunidade (etiqueta comentarios acorda a agente pelo agendador)
export async function tarefaComentarios(qtd) {
  const dia = new Date().toLocaleDateString('en-CA', {timeZone: 'America/Sao_Paulo'});
  return call('gerente-marketing', '/tasks', 'POST', {title: `Responder comentários de ${dia}`, description: `${qtd} comentário(s) novo(s). Rascunhos com node plataforma/cli.mjs rascunho.`,
    assignee: 'comunidade', status: 'backlog', ref: `comentarios-${dia}`, tags: ['comentarios']});
}
