#!/usr/bin/env node
// Linha de comando dos agentes para o escritório (/admin/escritorio). Cada agente se identifica com OFFICE_AGENT_ID (ou --as).
//
//   node plataforma/escritorio/tools/office.mjs me                                   # minhas tarefas, mensagens do dono e se posso rodar
//   node plataforma/escritorio/tools/office.mjs comments 12                          # conversa da tarefa (dono ↔ agentes)
//   node plataforma/escritorio/tools/office.mjs comment 12 "Plano: …"                # responde ao dono na conversa da tarefa (ele vê ao vivo)
//   node plataforma/escritorio/tools/office.mjs heartbeat --status working --task "Escrevendo 3 legendas" [--task-id 12] ["linha no feed"]
//   node plataforma/escritorio/tools/office.mjs log "Achei 5 pautas novas" [--level info|success|warn|error] [--task 12] [--link https://…]
//   node plataforma/escritorio/tools/office.mjs task create --title "Carrossel etiqueta" [--description …] [--assignee social-media]
//                                             [--status backlog|doing|review] [--priority 1|2|3] [--ref chave-unica] [--link "Rótulo=https://…"]
//                                             [--parent 7]  (sub-tarefa de um pedido do dono: aparece no progresso do pedido)
//   node plataforma/escritorio/tools/office.mjs task update 12 [--status doing] [--title …] [--description …] [--assignee …]
//   node plataforma/escritorio/tools/office.mjs task list [--mine] [--status backlog,doing] [--tag pedido-do-dono] [--parent 7]   |   task show 12
//   node plataforma/escritorio/tools/office.mjs task create --title "Reel: …" --assignee pauteiro --tag estudio [--description-file x.md]   (linha do Estúdio)
//   node plataforma/escritorio/tools/office.mjs attach 12 --kind texto --label "E-mail para Fulano" --file docs/agencia/b2b/fulano.md
//   node plataforma/escritorio/tools/office.mjs attach 12 --kind post --label "Post #34" --url "/admin/social"
//   node plataforma/escritorio/tools/office.mjs files 12                             # anexos da tarefa (fatura, foto, planilha…)
//   node plataforma/escritorio/tools/office.mjs download 12 [--dest docs/agencia/entrada/12/] [--file 7]   # baixa para ler com o Read
//   node plataforma/escritorio/tools/office.mjs attach-file 12 docs/agencia/financeiro/relatorio.pdf [mais arquivos]  # devolve um arquivo
//   node plataforma/escritorio/tools/office.mjs review 12 "Pronto para você aprovar"   # manda para Revisão e fica "esperando você"
//   node plataforma/escritorio/tools/office.mjs data ops|financeiro|analytics|anuncios|suporte|social|precos
// Só o Financeiro e o Gerente Financeiro: lançar gasto no /admin/financeiro (sempre ligado à tarefa do pedido)
//   node plataforma/escritorio/tools/office.mjs custo list
//   node plataforma/escritorio/tools/office.mjs custo add --tarefa 37 --nome "ElevenLabs Starter" --valor 39.99 --recorrencia anual --categoria infra --inicio 2026-10-15 [--moeda USD] [--notas "fatura Hostinger"]
//     categorias: infra, software, marketing, pessoal, contabilidade, impostos_fixos, outros · recorrência: mensal, anual, unico, uso
//   node plataforma/escritorio/tools/office.mjs custo editar 12 --tarefa 37 [--valor 1055.76] [--recorrencia unico] [--nome …] [--categoria …] [--inicio …] [--fim …] [--notas …]
//   node plataforma/escritorio/tools/office.mjs custo apagar 12 --tarefa 37          (duplicado ou lançado errado; o valor antigo fica no feed)
//   node plataforma/escritorio/tools/office.mjs check                                 # botão de emergência, agente ligado, teto do dia
//
// Comentários das redes (a Comunidade responde; nada sai sem aprovação do Gerente Geral ou do dono; o servidor envia depois):
//   node plataforma/escritorio/tools/office.mjs comentarios list [--rede instagram|facebook|threads|youtube] [--status novo,rascunho,aguardando,…]
//   node plataforma/escritorio/tools/office.mjs comentarios responder 41 "Oi! Dá sim: …" [--classe duvida|elogio|reclamacao|spam|outro] [--sensivel "motivo"]
//   node plataforma/escritorio/tools/office.mjs comentarios ignorar 42 "spam de sorteio"
//
// Só o Gerente (OFFICE_AGENT_ID=gerente); comentário obrigatório (mínimo 10 caracteres):
//   node plataforma/escritorio/tools/office.mjs gerente fila                          # tarefas em Revisão, posts aguardando, agentes livres, modo
//   node plataforma/escritorio/tools/office.mjs gerente aprovar|ajustar|comentar 12 "o que conferiu / o que mudar"
//   node plataforma/escritorio/tools/office.mjs gerente post-aprovar|post-ajustar|post-comentar 34 "comentário"
//   node plataforma/escritorio/tools/office.mjs gerente comentario-aprovar|comentario-ajustar 41 "comentário"   (resposta a comentário das redes)
//
// Só os gerentes de área (OFFICE_AGENT_ID=gerente-marketing|gerente-crescimento|gerente-produto|gerente-comercial|gerente-financeiro).
// Coordenam a própria equipe; "pré-aprovar" é só uma marca: a aprovação final é do Gerente Geral ou do dono.
//   node plataforma/escritorio/tools/office.mjs area fila                             # equipe, tarefas abertas e em Revisão da equipe
//   node plataforma/escritorio/tools/office.mjs area pre-aprovar|ajustar|comentar 12 "o que conferiu / o que mudar"
//
// Ambiente: BASE_URL (padrão http://localhost:4380), OFFICE_AGENT_TOKEN (ou SOCIAL_AGENT_TOKEN), OFFICE_AGENT_ID. --json imprime a resposta crua.
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
// Downloads só dentro de docs/agencia/ (a área em que os agentes podem escrever e ler)
const AGENCY_DIR = path.join(ROOT, 'docs', 'agencia');
const fmtSize = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
async function raw(agent, p, { method = 'GET', body } = {}) {
  if (!TOKEN) throw new Error('Defina OFFICE_AGENT_TOKEN (ou SOCIAL_AGENT_TOKEN), o mesmo valor configurado no servidor.');
  if (!agent) throw new Error('Defina OFFICE_AGENT_ID (ou use --as <agente>).');
  let r;
  try { r = await fetch(`${BASE}/admin/api/office${p}`, { method, headers: { authorization: `Bearer ${TOKEN}`, 'x-agent-id': agent }, body, signal: AbortSignal.timeout(120000) }); }
  catch (e) { const err = new Error(`Sem conexão com ${BASE}: ${e.cause?.message || e.message}`); err.offline = true; throw err; }
  if (!r.ok) { const j = await r.json().catch(() => ({})); const e = new Error(j.error || `HTTP ${r.status}`); e.status = r.status; throw e; }
  return r;
}

export const BASE = (process.env.BASE_URL || 'http://localhost:4380').replace(/\/$/, '');
export const TOKEN = process.env.OFFICE_AGENT_TOKEN || process.env.SOCIAL_AGENT_TOKEN || '';

export async function office(agent, p, { method = 'GET', body } = {}) {
  if (!TOKEN) throw new Error('Defina OFFICE_AGENT_TOKEN (ou SOCIAL_AGENT_TOKEN), o mesmo valor configurado no servidor.');
  if (!agent) throw new Error('Defina OFFICE_AGENT_ID (ou use --as <agente>).');
  let r;
  try {
    r = await fetch(`${BASE}/admin/api/office${p}`, {
      method, headers: { authorization: `Bearer ${TOKEN}`, 'x-agent-id': agent, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000),
    });
  } catch (e) { const err = new Error(`Sem conexão com ${BASE}: ${e.cause?.message || e.message}`); err.offline = true; throw err; }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || `HTTP ${r.status}`); e.status = r.status; e.body = j; throw e; }
  return j;
}

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split(/=(.*)/s);
      if (v !== undefined) out[k] = v;
      else if (['json', 'mine'].includes(k) || argv[i + 1] === undefined || argv[i + 1].startsWith('--')) out[k] = true;
      else out[k] = argv[++i];
      if (k === 'link') { out.links = out.links || []; out.links.push(out[k]); }
    } else out._.push(a);
  }
  return out;
}
const linkOf = (s) => { const i = String(s).indexOf('='); return i > 0 && !/^https?:/.test(s) ? { label: s.slice(0, i), url: s.slice(i + 1) } : { label: s, url: s }; };

async function main() {
  const a = args(process.argv.slice(2));
  const me = (typeof a.as === 'string' ? a.as : process.env.OFFICE_AGENT_ID || '').trim();
  const [cmd, sub, ...rest] = a._;
  const call = (p, o) => office(me, p, o);
  const print = (j, human) => console.log(a.json ? JSON.stringify(j, null, 2) : human(j));
  const fbWho = (f) => { const m = /^((?:Gerente|Ger\.)[^:]{0,40}): /.exec(f); return m ? [`comentário de ${m[1]}`, f.slice(m[0].length)] : ['comentário do dono', f]; };
  const NETN = { instagram: 'Instagram', facebook: 'Facebook', threads: 'Threads', youtube: 'YouTube' };
  const cline = (c) => `#${c.id} [${NETN[c.network] || c.network} · ${c.status}${c.classification ? ` · ${c.classification}` : ''}${c.sensitive ? ` · SENSÍVEL: ${c.sensitive_reason}` : ''}] ${c.author && c.author.username ? '@' + c.author.username : (c.author && c.author.name) || 'anônimo'}: ${String(c.text || '').replace(/\s+/g, ' ').slice(0, 300)}`
    + `${c.post ? `\n    post #${c.post.id} (${c.post.kind}): ${c.post.caption}` : ''}${c.parent_remote_id ? '\n    (é resposta a outro comentário do mesmo post)' : ''}`
    + `${c.reply ? `\n    resposta: ${String(c.reply).replace(/\s+/g, ' ')}` : ''}${c.review_note ? `\n    ${c.reviewed_by === 'admin' ? 'dono' : 'Gerente'}: ${c.review_note}` : ''}${c.error ? `\n    erro no envio: ${c.error}` : ''}`;
  const tline = (t) => `#${t.id}${(t.tags || []).includes('pedido-do-dono') ? ' [PEDIDO DO DONO]' : ''}${(t.tags || []).includes('estudio') ? ' [ESTÚDIO]' : ''}${t.parent_id ? ` (parte de #${t.parent_id})` : ''} [${t.status}${t.approval ? `/${t.approval}` : ''}${t.sensitive ? '/sensível' : ''}${t.pre_approved ? '/pré-aprovada' : ''}] ${t.title}${t.assignee ? ` (${t.assignee})` : ''}${t.feedback ? `\n    ${fbWho(t.feedback).join(': ')}` : ''}`;

  switch (cmd) {
    case 'me': return print(await call('/me'), (j) => [
      `${j.agent.name} (${j.agent.id}) · ${j.agent.status}${j.agent.enabled ? '' : ' · DESLIGADO'}`,
      j.check.allowed ? 'Pode rodar.' : `NÃO RODAR: ${j.check.reasons.join(' ')}`,
      j.tasks.length ? `Tarefas abertas:\n${j.tasks.map((t) => '  ' + tline(t)).join('\n')}` : 'Sem tarefas abertas.',
      j.feedback.length ? `Comentários do dono:\n${j.feedback.map((t) => `  #${t.id} ${t.title}: ${t.feedback}`).join('\n')}` : '',
      (j.messages || []).length ? `MENSAGENS DO DONO SEM RESPOSTA (responda com: comment N "texto"):\n${j.messages.map((m) => `  #${m.task_id} ${m.title}${(m.tags || []).includes('pedido-do-dono') ? ' [PEDIDO DO DONO]' : ''}\n${m.comments.map((c) => `    ${c.author === 'admin' ? 'dono' : c.author}: ${String(c.body).replace(/\s+/g, ' ').slice(0, 400)}`).join('\n')}`).join('\n')}` : '',
    ].filter(Boolean).join('\n'));
    case 'comments': {
      const id = Number(sub);
      if (!id) throw new Error('Informe o número da tarefa.');
      return print(await call(`/tasks/${id}/comments`), (j) => (j.comments.length ? j.comments.map((c) => `[${new Date(c.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}] ${c.author === 'admin' ? 'dono' : c.author}: ${c.body}`).join('\n') : 'Sem mensagens nesta tarefa.'));
    }
    case 'comment': {
      const id = Number(sub);
      const text = rest.join(' ').trim() || (typeof a.file === 'string' ? fs.readFileSync(a.file, 'utf8') : '');
      if (!id || !text) throw new Error('Use: comment <tarefa> "mensagem" (ou --file texto.md)');
      return print(await call(`/tasks/${id}/comments`, { method: 'POST', body: { body: text } }), () => `✔ mensagem enviada em #${id} (o dono vê ao vivo no escritório)`);
    }
    case 'check': {
      const j = await call('/runner/check');
      print(j, (x) => (x.allowed ? 'Pode rodar.' : `NÃO RODAR: ${x.reasons.join(' ')}`));
      process.exitCode = j.allowed ? 0 : 3;
      return;
    }
    case 'heartbeat': case 'hb': {
      const body = {};
      if (typeof a.status === 'string') body.status = a.status;
      if (typeof a.task === 'string') body.task = a.task;
      if (a['task-id'] !== undefined) body.task_id = Number(a['task-id']) || null;
      if (typeof a.level === 'string') body.level = a.level;
      if (typeof a.link === 'string') body.link = a.link;
      const msg = [sub, ...rest].filter(Boolean).join(' ');
      if (msg) body.message = msg;
      return print(await call('/heartbeat', { method: 'POST', body }), (j) => `✔ ${j.agent.name}: ${j.agent.status}${j.agent.current_task ? ` · ${j.agent.current_task}` : ''}${j.check.allowed ? '' : `\n⚠ ${j.check.reasons.join(' ')}`}`);
    }
    case 'log': {
      const msg = [sub, ...rest].filter(Boolean).join(' ');
      if (!msg) throw new Error('Informe a mensagem.');
      const body = { message: msg };
      if (typeof a.level === 'string') body.level = a.level;
      if (a.task !== undefined) body.task_id = Number(a.task);
      if (typeof a.link === 'string') body.link = a.link;
      return print(await call('/log', { method: 'POST', body }), (j) => `✔ ${j.event.message}`);
    }
    case 'task': {
      if (sub === 'create' || sub === 'new') {
        const body = { title: a.title };
        for (const k of ['description', 'assignee', 'status', 'ref', 'due_at']) if (typeof a[k] === 'string') body[k] = a[k];
        if (a.priority !== undefined) body.priority = Number(a.priority);
        if (a.parent !== undefined) body.parent_id = Number(a.parent);
        if (typeof a.tag === 'string') body.tags = a.tag.split(',');
        if (a.links) body.links = a.links.map(linkOf);
        if (typeof a['description-file'] === 'string') body.description = fs.readFileSync(a['description-file'], 'utf8').slice(0, 8000);
        try { return print(await call('/tasks', { method: 'POST', body }), (j) => `✔ criada ${tline(j.task)}`); } catch (e) {
          if (e.status === 409 && e.body?.task) return print(e.body, (j) => `= já existia ${tline(j.task)}`);
          throw e;
        }
      }
      if (sub === 'update') {
        const id = Number(rest[0]);
        if (!id) throw new Error('Informe o número da tarefa.');
        const body = {};
        for (const k of ['status', 'title', 'description', 'assignee', 'due_at']) if (typeof a[k] === 'string') body[k] = a[k];
        if (a.priority !== undefined) body.priority = Number(a.priority);
        if (a.links) body.links = a.links.map(linkOf);
        return print(await call(`/tasks/${id}`, { method: 'PATCH', body }), (j) => `✔ ${tline(j.task)}`);
      }
      if (sub === 'list') {
        const q = new URLSearchParams();
        if (a.mine) q.set('mine', '1');
        if (typeof a.status === 'string') q.set('status', a.status);
        if (typeof a.assignee === 'string') q.set('assignee', a.assignee);
        if (typeof a.tag === 'string') q.set('tag', a.tag);
        if (a.parent !== undefined) q.set('parent', String(Number(a.parent)));
        return print(await call(`/tasks?${q}`), (j) => j.tasks.map(tline).join('\n') || 'Nenhuma tarefa.');
      }
      if (sub === 'show') {
        return print(await call(`/tasks/${Number(rest[0])}`), (j) => [tline(j.task), j.task.description, ...j.task.artifacts.map((x) => `  anexo ${x.kind}: ${x.label} ${x.url || x.path || ''}`),
          ...(j.task.files || []).map((f) => `  arquivo ${f.id}: ${f.name} (${fmtSize(f.size)}) · baixe com: download ${j.task.id}`),
          ...((j.children || []).length ? ['  sub-tarefas:', ...j.children.map((c) => `    #${c.id} [${c.status}${c.approval ? `/${c.approval}` : ''}] ${c.title}${c.assignee ? ` (${c.assignee})` : ''}`)] : []),
          ...((j.comments || []).length ? ['  conversa:', ...j.comments.slice(-15).map((c) => `    ${c.author === 'admin' ? 'dono' : c.author}: ${String(c.body).replace(/\s+/g, ' ').slice(0, 500)}`)] : [])].filter(Boolean).join('\n'));
      }
      throw new Error('Use: task create | update | list | show');
    }
    case 'attach': {
      const id = Number(sub);
      if (!id) throw new Error('Informe o número da tarefa.');
      const body = {};
      for (const k of ['kind', 'label', 'url', 'path']) if (typeof a[k] === 'string') body[k] = a[k];
      if (typeof a.file === 'string') {
        body.content = fs.readFileSync(a.file, 'utf8');
        body.path = body.path || path.relative(process.cwd(), path.resolve(a.file));
        body.kind = body.kind || 'texto';
      }
      if (typeof a.content === 'string') body.content = a.content;
      return print(await call(`/tasks/${id}/artifacts`, { method: 'POST', body }), (j) => `✔ anexado (${j.artifact.kind}) ${j.artifact.label}`);
    }
    case 'files': {
      const id = Number(sub);
      if (!id) throw new Error('Informe o número da tarefa.');
      return print(await call(`/tasks/${id}/files`), (j) => (j.files.length ? j.files.map((f) => `  arquivo ${f.id}: ${f.name} (${f.mime}, ${fmtSize(f.size)}) enviado por ${f.uploaded_by}`).join('\n') : 'Sem anexos.'));
    }
    case 'download': {
      const id = Number(sub);
      if (!id) throw new Error('Informe o número da tarefa.');
      const dest = path.resolve(ROOT, typeof a.dest === 'string' ? a.dest : path.join('docs', 'agencia', 'entrada', String(id)));
      if (dest !== AGENCY_DIR && !dest.startsWith(AGENCY_DIR + path.sep)) throw new Error('O destino precisa ficar dentro de docs/agencia/ (ex.: docs/agencia/entrada/12/).');
      const list = (await call(`/tasks/${id}/files`)).files.filter((f) => a.file === undefined || String(f.id) === String(a.file));
      if (!list.length) return console.log('Sem anexos para baixar.');
      fs.mkdirSync(dest, { recursive: true });
      const saved = [];
      for (const f of list) {
        const r = await raw(me, `/files/${f.id}/download`);
        const name = path.basename(f.name).replace(/[^\p{L}\p{N} ._()-]/gu, '_') || `arquivo-${f.id}`;
        const out = path.join(dest, name);
        fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
        saved.push(path.relative(ROOT, out));
      }
      return print({ saved }, (j) => `✔ baixado(s): ${j.saved.join(', ')}\n  Leia com o Read (PDF, imagem, CSV, XML, TXT). Não copie dados pessoais para outros arquivos.`);
    }
    case 'attach-file': {
      const id = Number(sub);
      if (!id || !rest.length) throw new Error('Use: attach-file <tarefa> <arquivo> [mais arquivos]');
      const fd = new FormData();
      for (const f of rest) {
        const abs = path.resolve(process.cwd(), f);
        fd.append('files', await fs.openAsBlob(abs), path.basename(abs));
      }
      const r = await raw(me, `/tasks/${id}/files`, { method: 'POST', body: fd });
      const j = await r.json();
      return print(j, (x) => `✔ anexado(s) em #${id}: ${x.files.map((f) => `${f.name} (${fmtSize(f.size)})`).join(', ')}`);
    }
    case 'review': {
      const id = Number(sub);
      if (!id) throw new Error('Informe o número da tarefa.');
      const msg = rest.join(' ');
      const r = await call(`/tasks/${id}`, { method: 'PATCH', body: { status: 'review' } });
      await call('/heartbeat', { method: 'POST', body: { status: 'waiting', task: `Esperando aprovação: ${r.task.title}`, task_id: id, ...(msg ? { message: msg } : {}) } });
      return print(r, (j) => `✔ #${j.task.id} em Revisão: o dono aprova no escritório.`);
    }
    case 'gerente': {
      const ACT = { aprovar: 'approve', ajustar: 'changes', comentar: 'comment' };
      if (sub === 'fila' || sub === 'queue') {
        return print(await call('/gerente/queue'), (j) => [
          `Modo do Gerente: ${j.modes[j.mode]}${j.mode === 'off' ? ' (só comente)' : ''}`,
          j.tasks.length ? `Tarefas em Revisão:\n${j.tasks.map((t) => `  ${tline(t)}${t.sensitive ? ` [SENSÍVEL: ${t.sensitive_reason}]` : ''}${t.reviewed_by === 'gerente' ? ' [você já revisou]' : ''}${t.pre_approved_label ? ` [${t.pre_approved_label}: ${t.area_review_note}]` : t.area_review === 'comentado' ? ` [comentário da área: ${t.area_review_note}]` : ''}\n    ${t.can_approve ? 'pode aprovar' : `NÃO pode aprovar: ${t.block}`}`).join('\n')}` : 'Nenhuma tarefa em Revisão.',
          j.posts.length ? `Posts aguardando na Central:\n${j.posts.map((p) => `  post #${p.id} [${p.kind} · ${p.networks.join(', ')}${p.entrega === 'kit' ? ` · KIT${p.audio_sugerido && p.audio_sugerido.nome ? ` (áudio: ${p.audio_sugerido.nome})` : ' (sem áudio sugerido)'}` : ''}] ${String(p.caption).replace(/\s+/g, ' ').slice(0, 140)}${p.problems.length ? `\n    impede: ${p.problems.join(' ')}` : ''}${p.warnings.length ? `\n    avisos: ${p.warnings.join(' ')}` : ''}`).join('\n')}` : 'Nenhum post aguardando.',
          (j.comentarios || []).length ? `Respostas a comentários esperando aprovação:\n${j.comentarios.map((c) => `  ${cline(c)}\n    ${c.can_approve ? 'pode aprovar' : `NÃO pode aprovar: ${c.block}`}`).join('\n')}` : 'Nenhuma resposta a comentário esperando.',
          j.idle_agents.length ? `Livres sem tarefa: ${j.idle_agents.map((a) => a.id).join(', ')}` : '',
        ].filter(Boolean).join('\n'));
      }
      if (sub === 'comentario-aprovar' || sub === 'comentario-ajustar') {
        const id = Number(rest[0]);
        const comment = rest.slice(1).join(' ');
        if (!id) throw new Error('Use: gerente comentario-aprovar|comentario-ajustar <id> "comentário"');
        try {
          return print(await call(`/gerente/comentarios/${id}/review`, { method: 'POST', body: { action: sub === 'comentario-aprovar' ? 'approve' : 'changes', comment } }),
            (j) => `✔ comentário #${j.comentario.id}: ${j.comentario.status}${j.comentario.status === 'aprovado' ? (j.mode === '2h' ? ` · sai ${new Date(j.comentario.send_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (o dono pode barrar)` : ' · enviando') : ''}`);
        } catch (e) {
          if (e.status === 403 && e.body?.escalated) { console.log(`= comentário #${id} fica com o dono: ${e.message}`); return; }
          throw e;
        }
      }
      const post = sub && sub.startsWith('post-');
      const action = ACT[post ? sub.slice(5) : sub];
      const id = Number(rest[0]);
      const comment = rest.slice(1).join(' ');
      if (!action || !id) throw new Error('Use: gerente fila | aprovar|ajustar|comentar <tarefa> "comentário" | post-aprovar|post-ajustar|post-comentar <post> "comentário"');
      if (post) {
        return print(await call(`/gerente/posts/${id}/review`, { method: 'POST', body: { action, comment } }), (j) => `✔ post #${j.post.id}: ${j.post.status}${j.post.status === 'agendado' ? ` para ${new Date(j.post.scheduled_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}` : ''}`);
      }
      try {
        return print(await call(`/gerente/tasks/${id}/review`, { method: 'POST', body: { action, comment } }), (j) => `✔ ${tline(j.task)}`);
      } catch (e) {
        if (e.status === 403 && e.body?.escalated) { console.log(`= #${id} fica com o dono: ${e.message}`); return; }
        throw e;
      }
    }
    case 'area': {
      const ACT = { 'pre-aprovar': 'preapprove', preaprovar: 'preapprove', ajustar: 'changes', comentar: 'comment' };
      if (sub === 'fila' || sub === 'queue') {
        return print(await call('/area/queue'), (j) => [
          `Área: ${j.area} · equipe: ${j.team.join(', ')} · modo do Gerente: ${j.mode}`,
          `Equipe:\n${j.members.map((m) => `  ${m.id} · ${m.enabled ? m.status : 'DESLIGADO'} · ${m.open} tarefa(s) aberta(s)${m.current_task ? ` · ${m.current_task}` : ''}`).join('\n')}`,
          j.review.length ? `Em Revisão (da equipe):\n${j.review.map((t) => `  ${tline(t)}${t.sensitive ? ` [SENSÍVEL: ${t.sensitive_reason}]` : ''}${t.area_review ? ` [área: ${t.area_review}]` : ''}`).join('\n')}` : 'Nada da equipe em Revisão.',
          j.open.length ? `Abertas:\n${j.open.map((t) => '  ' + tline(t)).join('\n')}` : 'Sem tarefas abertas na equipe.',
          j.idle_members.length ? `Livres sem tarefa: ${j.idle_members.join(', ')}` : '',
        ].filter(Boolean).join('\n'));
      }
      const action = ACT[sub];
      const id = Number(rest[0]);
      const comment = rest.slice(1).join(' ');
      if (!action || !id) throw new Error('Use: area fila | pre-aprovar|ajustar|comentar <tarefa> "comentário"');
      return print(await call(`/area/tasks/${id}/review`, { method: 'POST', body: { action, comment } }), (j) => `✔ ${tline(j.task)}`);
    }
    case 'custo': {
      if (sub === 'list') return print(await call('/financeiro/custos'), (j) => j.costs.map((c) => `#${c.id} ${c.name} · ${c.currency} ${(c.amount_cents / 100).toFixed(2)} · ${c.recurrence} · ${c.category}${c.start_date ? ` · desde ${c.start_date}` : ''}`).join('\n') || 'Nenhum custo lançado.');
      if (sub === 'add') {
        const valor = Number(String(a.valor || '').replace(',', '.'));
        if (!a.tarefa || !a.nome || !(valor > 0)) throw new Error('Use: custo add --tarefa N --nome "…" --valor 39.99 [--recorrencia mensal|anual|unico|uso] [--categoria infra] [--inicio AAAA-MM-DD] [--moeda BRL|USD] [--notas "…"]');
        const body = { task_id: Number(a.tarefa), name: a.nome, amount_cents: Math.round(valor * 100), recurrence: a.recorrencia || 'mensal', category: a.categoria || 'outros', currency: a.moeda || 'BRL',
          ...(a.inicio ? { start_date: a.inicio } : {}), ...(a.fim ? { end_date: a.fim } : {}), ...(a.notas ? { notes: a.notas } : {}) };
        return print(await call('/financeiro/custos', { method: 'POST', body }), (j) => `✔ custo #${j.id} lançado no Financeiro (o dono vê em /admin/financeiro)`);
      }
      if (sub === 'editar' || sub === 'apagar') {
        const id = Number(rest[0]);
        if (!id || !a.tarefa) throw new Error(`Use: custo ${sub} <id> --tarefa N${sub === 'editar' ? ' [--valor …] [--recorrencia …] …' : ''}`);
        if (sub === 'apagar') return print(await call(`/financeiro/custos/${id}?task_id=${Number(a.tarefa)}`, { method: 'DELETE', body: { task_id: Number(a.tarefa) } }), () => `✔ custo #${id} apagado (o valor antigo ficou no feed)`);
        const body = { task_id: Number(a.tarefa) };
        if (a.valor !== undefined) body.amount_cents = Math.round(Number(String(a.valor).replace(',', '.')) * 100);
        const M = { nome: 'name', categoria: 'category', recorrencia: 'recurrence', moeda: 'currency', inicio: 'start_date', fim: 'end_date', notas: 'notes' };
        for (const [k, v] of Object.entries(M)) if (typeof a[k] === 'string') body[v] = a[k];
        return print(await call(`/financeiro/custos/${id}`, { method: 'PATCH', body }), (j) => `✔ custo #${id}: ${j.cost.name} · ${j.cost.currency} ${(j.cost.amount_cents / 100).toFixed(2)} · ${j.cost.recurrence}`);
      }
      throw new Error('Use: custo list | custo add … | custo editar <id> … | custo apagar <id> --tarefa N');
    }
    case 'comentarios': case 'comentários': {
      if (sub === 'list' || sub === 'listar' || !sub) {
        const q = new URLSearchParams();
        if (typeof a.rede === 'string') q.set('rede', a.rede);
        if (typeof a.status === 'string') q.set('status', a.status);
        return print(await call(`/comentarios?${q}`), (j) => {
          const p = j.resumo.permissions;
          const sem = Object.entries(p).filter(([, x]) => x.ok !== true).map(([n, x]) => `  ${n}: ${x.supported === false ? 'sem API de resposta (fica fora)' : !x.connected ? 'não conectado' : x.ok === null ? 'permissão incerta (conexão antiga)' : `falta ${x.missing.join(', ')}${x.error ? ` (${x.error})` : ''}`}`);
          return [j.comentarios.length ? j.comentarios.map(cline).join('\n') : 'Nenhum comentário com esse filtro.',
            `Resumo: ${j.resumo.counts.novo} novo(s), ${j.resumo.counts.rascunho} com ajuste pedido, ${j.resumo.counts.aguardando} aguardando aprovação, ${j.resumo.enviados_24h} enviado(s) em 24 h.`,
            sem.length ? `Redes sem leitura/resposta:\n${sem.join('\n')}` : ''].filter(Boolean).join('\n');
        });
      }
      const id = Number(rest[0]);
      const text = rest.slice(1).join(' ').trim() || (typeof a.file === 'string' ? fs.readFileSync(a.file, 'utf8').trim() : '');
      if (sub === 'responder') {
        if (!id || !text) throw new Error('Use: comentarios responder <id> "texto" [--classe duvida|elogio|reclamacao|spam|outro] [--sensivel "motivo"]');
        const body = { texto: text };
        if (typeof a.classe === 'string') body.classe = a.classe;
        if (typeof a.sensivel === 'string') body.sensivel = a.sensivel;
        return print(await call(`/comentarios/${id}/responder`, { method: 'POST', body }), (j) => `✔ resposta do comentário #${j.comentario.id} aguardando aprovação${j.comentario.sensitive ? ` · SENSÍVEL (${j.comentario.sensitive_reason}): só o dono aprova` : ' · o Gerente Geral revisa'}`);
      }
      if (sub === 'ignorar') {
        if (!id || !text) throw new Error('Use: comentarios ignorar <id> "motivo"');
        return print(await call(`/comentarios/${id}/ignorar`, { method: 'POST', body: { motivo: text } }), (j) => `✔ comentário #${j.comentario.id} ignorado${j.comentario.hide_suggested ? ' · sugestão para o dono: ocultar no app' : ''}`);
      }
      throw new Error('Use: comentarios list | responder <id> "texto" | ignorar <id> "motivo"');
    }
    case 'data': {
      if (!sub) throw new Error('Informe a fonte: ops, financeiro, analytics, anuncios, suporte, social ou precos.');
      const j = await call(`/data/${encodeURIComponent(sub)}`);
      return console.log(JSON.stringify(j, null, 2));
    }
    default:
      console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
      if (cmd) process.exitCode = 2;
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('office.mjs')) {
  main().catch((e) => { console.error(`✖ ${e.message}`); process.exit(e.offline ? 4 : 1); });
}
