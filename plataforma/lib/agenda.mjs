// Próximo horário "HH:MM" (hora do Mac) a partir de agora, em ISO.
export function proximoHorario(hhmm = '12:00', depois = new Date()) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(depois);
  d.setHours(h, m, 0, 0);
  if (d <= depois) d.setDate(d.getDate() + 1);
  return d.toISOString();
}
