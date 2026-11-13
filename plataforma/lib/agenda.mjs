// Horários de postagem. Cada perfil tem uma lista de horários ("horarios": ["11:30", "19:00"]; sem ela vale "horario").
import {fila} from './dados.mjs';

// Próximo horário "HH:MM" (hora do Mac) a partir de agora, em ISO.
export function proximoHorario(hhmm = '12:00', depois = new Date()) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(depois);
  d.setHours(h, m, 0, 0);
  if (d <= depois) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

// Próximo horário LIVRE do perfil: o mais cedo dos seus horários que ainda não tem vídeo marcado nem publicado
// (assim 2, 3 ou 4 vídeos aprovados no mesmo dia se espalham pelos horários, em vez de saírem juntos).
export function proximoSlot(p, depois = new Date()) {
  const horarios = (p.horarios?.length ? p.horarios : [p.horario || '12:00']).slice().sort();
  const ocupados = new Set(fila().filter((x) => x.perfil === p.id && (x.agendado_para || x.publicado_em))
    .map((x) => new Date(x.agendado_para || x.publicado_em).toISOString().slice(0, 16)));
  for (let dia = 0; dia < 30; dia++) {
    for (const hhmm of horarios) {
      const [h, m] = hhmm.split(':').map(Number);
      const d = new Date(depois);
      d.setDate(d.getDate() + dia);
      d.setHours(h, m, 0, 0);
      if (d <= depois) continue;
      // publicado perto desse horário (até 1 h antes ou depois) também conta como ocupado
      const perto = [...ocupados].some((o) => Math.abs(new Date(o + ':00Z') - d) < 3600000);
      if (!perto) return d.toISOString();
    }
  }
  return proximoHorario(horarios[0], depois);
}
