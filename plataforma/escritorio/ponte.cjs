// Ponte entre o escritório (tarefas) e a fila de vídeos da plataforma (plataforma/dados/fila.json).
// Cada vídeo produzido vira uma tarefa com ref "video:<id>". Aprovar a tarefa no escritório (você ou o Gerente Geral, dentro dos
// limites) aprova o vídeo na fila, que o postador publica no horário do perfil. Pedir ajustes devolve o vídeo como "rejeitado".
const store = require('./lib/office/store');

let D = null;
const dados = async () => (D ||= await import('../lib/dados.mjs'));
const agenda = () => import('../lib/agenda.mjs');

function ligar() {
  store.bus.on('event', async ({ type, data }) => {
    if (type !== 'task' || !data || !data.ref || !String(data.ref).startsWith('video:')) return;
    const id = String(data.ref).slice(6);
    try {
      const d = await dados();
      const it = d.item(id);
      if (!it || ['publicado', 'publicando'].includes(it.status)) return;
      if (data.approval === 'aprovado' && !['aprovado'].includes(it.status)) {
        const p = d.perfil(it.perfil);
        // aprovado no escritório (pelo Fernando ou pelo Gerente Geral): sai no melhor horário do perfil, não na hora
        const quando = p ? (await agenda()).proximoHorario(p.horario) : null;
        d.salvarItem({ id, status: 'aprovado', agendado_para: quando, tentativas: 0 });
        store.log(`Vídeo "${it.tema}" aprovado: o Postador publica ${quando ? `em ${new Date(quando).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}` : 'agora'}.`, { agent_id: 'social-media', level: 'success', task_id: data.id });
      } else if (data.approval === 'rejeitado' && it.status === 'aguardando_aprovacao') {
        d.salvarItem({ id, status: 'rejeitado', erro: data.feedback || null });
      }
    } catch (e) { console.error('[ponte]', e.message); }
  });
}

// Aprovação/rejeição feita pelo painel da fila: espelha na tarefa do escritório
function espelhar(videoId, approval) {
  const t = store.listTasks({ limit: 500 }).find((x) => x.ref === `video:${videoId}`);
  if (!t || t.approval === approval) return;
  store.updateTask(t.id, approval === 'aprovado'
    ? { status: 'done', approval: 'aprovado', reviewed_by: 'admin', escalated: 0 }
    : { status: 'doing', approval: 'rejeitado', reviewed_by: 'admin', escalated: 0 });
  store.log(`Você ${approval === 'aprovado' ? 'aprovou' : 'rejeitou'} pelo painel: ${t.title}`, { agent_id: 'admin', level: approval === 'aprovado' ? 'success' : 'warn', task_id: t.id });
}

module.exports = { ligar, espelhar };
