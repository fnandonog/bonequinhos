// Planta real da casa de 50 m² (unidades em METROS, 1 unidade = 1 m).
// Frente da casa olha para +Z. Retângulo externo: X de -3.5 a 3.5 (7,0 m) e Z de -3.6 a 3.6 (7,2 m) = 50,4 m².
// Quem mexer aqui muda TODAS as cenas (gabarito, baldrame, paredes, laje, telhado, casa pronta).

export type V2 = [number, number];
export type V3 = [number, number, number];

export const NIVEL_PISO = 0.15; // topo do baldrame / piso acabado
export const PE_DIREITO = 2.8; // altura da parede acima do piso
export const ESP_PAREDE = 0.14; // bloco cerâmico de 14 cm
export const TOPO_PAREDE = NIVEL_PISO + PE_DIREITO;
export const ESP_LAJE = 0.12;
export const TOPO_LAJE = TOPO_PAREDE + ESP_LAJE;

export const CASA = {x0: -3.5, x1: 3.5, z0: -3.6, z1: 3.6};
export const LOTE = {x0: -6, x1: 6, z0: -10, z1: 3.6, fundo: -1.8};

export type Vao = {c: number; larg: number; base: number; alt: number; tipo: 'porta' | 'janela' | 'passagem'};
export type Parede = {id: string; a: V2; b: V2; ext: boolean; vaos: Vao[]};

const porta = (c: number, larg = 0.8): Vao => ({c, larg, base: 0, alt: 2.1, tipo: 'porta'});
const janela = (c: number, larg = 1.2, base = 1.0, alt = 1.2): Vao => ({c, larg, base, alt, tipo: 'janela'});

export const PAREDES: Parede[] = [
  // externas
  {id: 'frente', a: [-3.5, 3.6], b: [3.5, 3.6], ext: true, vaos: [janela(1.7, 1.5), porta(5.0, 0.9)]},
  {id: 'fundo', a: [-3.5, -3.6], b: [3.5, -3.6], ext: true, vaos: [janela(1.5), janela(3.75, 0.6, 1.6, 0.6), janela(5.75)]},
  {id: 'esq', a: [-3.5, -3.6], b: [-3.5, 3.6], ext: true, vaos: [janela(5.4, 1.5)]},
  {id: 'dir', a: [3.5, -3.6], b: [3.5, 3.6], ext: true, vaos: [janela(5.6, 1.2, 1.1, 1.0)]},
  // internas
  {id: 'meio', a: [-3.5, -0.6], b: [3.5, -0.6], ext: false, vaos: [porta(2.3), {c: 3.75, larg: 0.8, base: 0, alt: 2.1, tipo: 'passagem'}, porta(5.3)]},
  {id: 'q1', a: [-0.5, -3.6], b: [-0.5, -0.6], ext: false, vaos: []},
  {id: 'q2', a: [1.0, -3.6], b: [1.0, -0.6], ext: false, vaos: []},
  {id: 'ban', a: [-0.5, -1.4], b: [1.0, -1.4], ext: false, vaos: [porta(0.75, 0.6)]},
];

// pilares (encontros de paredes) — também são as sapatas da fundação
export const PILARES: V2[] = [
  [-3.5, -3.6], [-0.5, -3.6], [1.0, -3.6], [3.5, -3.6],
  [-3.5, -0.6], [-0.5, -0.6], [1.0, -0.6], [3.5, -0.6],
  [-3.5, 3.6], [0.0, 3.6], [3.5, 3.6], [-3.5, 1.5], [3.5, 1.5],
];

export const COMODOS: {nome: string; c: V2; area: number}[] = [
  {nome: 'QUARTO 1', c: [-2.0, -2.1], area: 9.0},
  {nome: 'QUARTO 2', c: [2.25, -2.1], area: 7.5},
  {nome: 'BANHEIRO', c: [0.25, -2.5], area: 3.3},
  {nome: 'SALA + COZINHA', c: [0, 1.5], area: 29.4},
];

export const comprimento = (p: Parede) => Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]);
export const angulo = (p: Parede) => Math.atan2(-(p.b[1] - p.a[1]), p.b[0] - p.a[0]);

// retângulos sólidos da parede (u ao longo da parede, v para cima), já descontando portas e janelas
export function solidos(p: Parede): {u0: number; u1: number; v0: number; v1: number}[] {
  const L = comprimento(p);
  const vs = [...p.vaos].sort((a, b) => a.c - b.c);
  const out: {u0: number; u1: number; v0: number; v1: number}[] = [];
  let u = 0;
  for (const v of vs) {
    const a = v.c - v.larg / 2;
    const b = v.c + v.larg / 2;
    if (a > u) out.push({u0: u, u1: a, v0: 0, v1: PE_DIREITO});
    if (v.base > 0) out.push({u0: a, u1: b, v0: 0, v1: v.base});
    out.push({u0: a, u1: b, v0: v.base + v.alt, v1: PE_DIREITO});
    u = b;
  }
  if (u < L) out.push({u0: u, u1: L, v0: 0, v1: PE_DIREITO});
  return out;
}

// área de parede (m²) e blocos 14x19x29 (≈ 17 por m² com 1 cm de junta) — só para conferência do roteirista
export function contarBlocos() {
  let area = 0;
  for (const p of PAREDES) for (const s of solidos(p)) area += (s.u1 - s.u0) * (s.v1 - s.v0);
  return {area: Math.round(area), blocos: Math.round(area * 17)};
}
