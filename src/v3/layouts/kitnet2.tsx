import React from 'react';
import {Arbusto, Arvore, Bancada, Caixa, Cama, Cerca, Chuveiro, Cilindro, Geladeira, Janela, Pedra, Placa, Porta, Sofa, Telhado, Vaso, Armario} from '../Pecas';
import {Peca} from './kitnet';

// Kitnet detalhada: obra montando por etapas. Casa 5 m (x) x 6 m (z), frente para +z.
// some: a peça sai de cena quando a etapa indicada aparece (evita camadas sobrepostas)
export type Peca2 = Peca & {atraso?: number; parede?: boolean; some?: string};

const H = 2.6;
const BASE = 0.25;
// segmentos de parede: [cx, cz, compX, compZ]
const SEG: [number, number, number, number][] = [
  [0, -3, 5.2, 0.2],
  [-2.5, 0, 0.2, 6],
  [2.5, 0, 0.2, 6],
  [-2.1, 3, 1.0, 0.2],
  [0.9, 3, 3.4, 0.2],
  [0.7, -2.1, 0.2, 1.8],
  [1.9, -1.2, 1.2, 0.2],
];

const fiadas = (): Peca2[] => {
  const out: Peca2[] = [];
  const n = 10;
  const h = H / n;
  for (let r = 0; r < n; r++) {
    const y = BASE + h * r + h / 2;
    const cor = r % 2 ? '#c4623f' : '#b8573a';
    SEG.forEach(([x, z, lx, lz], i) => out.push({id: 'paredes', grupo: 'obra', parede: true, some: 'reboco', atraso: r * 7, node: <Caixa key={`${r}-${i}`} pos={[x, y, z]} tam={[lx, h * 0.96, lz]} cor={cor} />}));
    if (r >= 8) out.push({id: 'paredes', grupo: 'obra', parede: true, some: 'reboco', atraso: r * 7, node: <Caixa key={`v${r}`} pos={[-1.2, y, 3]} tam={[1.05, h * 0.96, 0.2]} cor={cor} />});
  }
  return out;
};

const camada = (id: string, cor: string, esp: number, atraso = 0): Peca2[] =>
  [...SEG, [-1.2, 3, 1.05, 0.2] as [number, number, number, number]].map(([x, z, lx, lz], i) => {
    const verga = i === SEG.length;
    const alt = verga ? 0.52 : H + 0.01;
    const y = verga ? BASE + H - 0.26 : BASE + H / 2;
    return {id, grupo: 'obra', parede: true, atraso, some: id === 'reboco' ? 'pintura' : undefined, node: <Caixa key={`${id}${i}`} pos={[x, y, z]} tam={[lx + (lz < lx ? esp : esp), alt, lz + (lz < lx ? esp : esp)]} cor={cor} />};
  });

const P = (id: string, node: React.ReactNode, extra: Partial<Peca2> = {}): Peca2 => ({id, grupo: 'obra', node, ...extra});

export const KITNET2: Peca2[] = [
  // cenário
  ...[[-6, -5], [-7, 1], [-6.5, 6], [6.5, -5.5], [7, 0.5], [6.2, 6.5], [-2, -7.5], [3, -8], [0, 8.8], [-8, -2], [8.5, 3]].map(([x, z], i) => ({id: 'cenario', grupo: 'cenario', node: <Arvore key={`a${i}`} pos={[x, 0, z]} esc={0.9 + (i % 3) * 0.2} cor={i % 2 ? '#3f9b5a' : '#56b06a'} />})),
  ...[[-4.8, 4.8], [4.6, -4], [-4.5, -3.5], [4.8, 3.8], [-1, 6.2], [5.2, 6.8]].map(([x, z], i) => ({id: 'cenario', grupo: 'cenario', node: <Arbusto key={`b${i}`} pos={[x, 0, z]} esc={0.8 + (i % 2) * 0.3} />})),
  ...[[-3.6, 5.6], [3.9, 5.2], [-4.2, -1]].map(([x, z], i) => ({id: 'cenario', grupo: 'cenario', node: <Pedra key={`p${i}`} pos={[x, 0, z]} esc={1 + (i % 2) * 0.6} />})),
  {id: 'cenario', grupo: 'cenario', node: <Cerca pos={[0, 0, -4.4]} comp={8.5} />},
  {id: 'cenario', grupo: 'cenario', node: <Cerca pos={[-4.25, 0, 0.6]} rot={Math.PI / 2} comp={10} />},
  {id: 'cenario', grupo: 'cenario', node: <Cerca pos={[4.25, 0, 0.6]} rot={Math.PI / 2} comp={10} />},
  {id: 'terreno', grupo: 'cenario', node: <Caixa pos={[0, 0.01, 0.6]} tam={[8.5, 0.02, 9.5]} cor="#c8a77a" />},
  // demarcação do terreno (gabarito)
  ...[[-2.7, -3.2, 5.4, 0.04], [-2.7, 3.2, 5.4, 0.04], [-2.7, -3.2, 0.04, 6.4], [2.7, -3.2, 0.04, 6.4]].map(([x, z, lx, lz], i) => P('gabarito', <Caixa key={`g${i}`} pos={[x + lx / 2, 0.04, z + lz / 2]} tam={[lx, 0.03, lz]} cor="#ffffff" />, {atraso: i * 3})),
  ...[[-2.8, -3.3], [2.8, -3.3], [-2.8, 3.3], [2.8, 3.3]].map(([x, z], i) => P('gabarito', <Cilindro key={`e${i}`} pos={[x, 0.3, z]} r={0.04} h={0.6} cor="#ff8a1f" />, {atraso: i * 3})),

  // fundação em etapas
  P('escavacao', <Caixa pos={[0, 0.02, 0]} tam={[5.6, 0.04, 6.6]} cor="#8b6a45" />, {some: 'concreto'}),
  P('brita', <Caixa pos={[0, 0.05, 0]} tam={[5.4, 0.06, 6.4]} cor="#9a958c" />, {some: 'concreto'}),
  P('lona', <Caixa pos={[0, 0.085, 0]} tam={[5.4, 0.02, 6.4]} cor="#2b2b3a" />, {some: 'concreto'}),
  ...Array.from({length: 12}).map((_, i) => P('malha', <Caixa key={`mx${i}`} pos={[-2.6 + i * 0.47, 0.12, 0]} tam={[0.03, 0.03, 6.2]} cor="#5a5a6a" />, {atraso: i, some: 'concreto'})),
  ...Array.from({length: 14}).map((_, i) => P('malha', <Caixa key={`mz${i}`} pos={[0, 0.13, -3.05 + i * 0.47]} tam={[5.2, 0.03, 0.03]} cor="#5a5a6a" />, {atraso: 12 + i, some: 'concreto'})),
  P('concreto', <Caixa pos={[0, 0.125, 0]} tam={[5.4, 0.25, 6.4]} cor="#a7a39b" />),

  // paredes fiada por fiada
  ...fiadas(),

  // elétrica e hidráulica
  P('padrao', <group><Cilindro pos={[3.6, 1.6, 3.8]} r={0.09} h={3.2} cor="#9aa0aa" /><Caixa pos={[3.6, 1.3, 3.93]} tam={[0.45, 0.6, 0.18]} cor="#e6e8ec" /><Caixa pos={[3.6, 1.32, 4.03]} tam={[0.22, 0.22, 0.02]} cor="#2b2b3a" /></group>),
  P('quadro', <Caixa pos={[-0.6, 1.6, 2.86]} tam={[0.4, 0.5, 0.08]} cor="#f4f4f4" />, {parede: true}),
  ...[[-2.38, 0, 0.04, 5.2], [2.38, 0.5, 0.04, 4.2], [-0.8, -2.88, 3.0, 0.04], [0.6, 2.88, 2.4, 0.04]].map(([x, z, lx, lz], i) => P('fios', <Caixa key={`f${i}`} pos={[x, 2.2, z]} tam={[lx, 0.05, lz]} cor="#ff8a1f" />, {atraso: i * 4, parede: true})),
  ...[[-2.38, 1.8], [2.38, 2], [-0.2, -2.88], [-2.38, -1.6], [1.6, 2.88]].map(([x, z], i) => P('fios', <Caixa key={`t${i}`} pos={[x, 0.7, z]} tam={Math.abs(x) > 2 ? [0.04, 0.12, 0.18] : [0.18, 0.12, 0.04]} cor="#f4f4f4" />, {atraso: 16 + i * 3, parede: true})),
  P('canos', <mesh position={[0.4, 0.32, -2.85]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, 3.6, 8]} /><meshStandardMaterial color="#3d8bff" flatShading /></mesh>),
  P('canos', <Cilindro pos={[1.6, 1.2, -2.85]} r={0.05} h={1.8} cor="#3d8bff" />, {atraso: 4, parede: true}),
  P('canos', <Cilindro pos={[-1.4, 0.7, -2.85]} r={0.05} h={0.8} cor="#3d8bff" />, {atraso: 8}),
  P('caixadagua', <group><Caixa pos={[-3.4, 1.0, -2.2]} tam={[0.1, 2, 0.1]} cor="#8b5a3c" /><Caixa pos={[-3.4, 1.0, -1.4]} tam={[0.1, 2, 0.1]} cor="#8b5a3c" /><Caixa pos={[-3.4, 2.02, -1.8]} tam={[1.1, 0.08, 1.1]} cor="#8b5a3c" /><Cilindro pos={[-3.4, 2.45, -1.8]} r={0.5} h={0.8} seg={12} cor="#3d8bff" /></group>),
  P('fossa', <group><Cilindro pos={[2.6, 0.06, -3.9]} r={0.55} h={0.12} seg={12} cor="#9aa0aa" /><Cilindro pos={[2.6, 0.14, -3.9]} r={0.15} h={0.06} seg={8} cor="#5a5a6a" /></group>),

  // acabamento
  ...camada('reboco', '#cfc8bd', 0.22),
  P('contrapiso', <Caixa pos={[0, 0.265, 0]} tam={[4.8, 0.03, 5.8]} cor="#bdb8ae" />),
  ...Array.from({length: 6}).map((_, i) => P('porcelanato', <Caixa key={`pc${i}`} pos={[-2.0 + i * 0.8, 0.285, 0]} tam={[0.78, 0.02, 5.8]} cor={i % 2 ? '#ead9bd' : '#e3d0b1'} />, {atraso: i * 3})),
  ...camada('pintura', '#f7f3ea', 0.25),

  // banheiro
  P('vaso', <Vaso pos={[2.1, 0.29, -2.55]} />),
  P('pia', <group><Caixa pos={[2.3, 0.75, -1.7]} tam={[0.3, 0.12, 0.5]} cor="#ffffff" /><Cilindro pos={[2.3, 0.45, -1.7]} r={0.05} h={0.5} cor="#f4f4f4" /></group>),
  P('chuveiro', <Chuveiro pos={[1.25, 0.29, -2.4]} />),
  P('chuveiro', <Caixa pos={[1.25, 1.3, -1.92]} tam={[0.9, 2, 0.03]} cor="#bfe6ff" />, {atraso: 8, parede: true}),
  P('banheiro', <Caixa pos={[1.6, 1.0, -2.86]} tam={[1.7, 1.5, 0.03]} cor="#d7f0f7" />, {parede: true}),

  // cozinha
  P('bancada', <Bancada pos={[-1.3, 0.29, -2.6]} />),
  P('bancada', <Caixa pos={[-1.3, 2.0, -2.78]} tam={[1.8, 0.6, 0.35]} cor="#e9d8b6" />, {atraso: 6, parede: true}),
  P('geladeira', <Geladeira pos={[0.15, 0.29, -2.6]} />),

  // móveis
  P('cama', <Cama pos={[-1.6, 0.29, 0.5]} />),
  P('armario', <Armario pos={[-2.1, 0.29, -1.2]} rot={Math.PI / 2} />),
  P('sofa', <Sofa pos={[1.5, 0.29, 1.9]} rot={Math.PI} cor="#ff7a59" />),
  P('sofa', <group><Cilindro pos={[-0.4, 0.31, 1.8]} r={0.5} h={0.02} seg={14} cor="#7c6cf0" /><Cilindro pos={[0.6, 0.6, -0.6]} r={0.05} h={0.6} cor="#2b2b3a" /></group>, {atraso: 6}),

  // esquadrias
  P('esquadrias', <Porta pos={[-1.2, 0.27, 3.1]} />),
  P('esquadrias', <Porta pos={[1.1, 0.27, -1.2]} cor="#e9d8b6" />, {atraso: 4}),
  P('esquadrias', <Janela pos={[1.1, 1.7, 3.12]} />, {atraso: 7}),
  P('esquadrias', <Janela pos={[-2.62, 1.7, 0.6]} rot={Math.PI / 2} />, {atraso: 10}),
  P('esquadrias', <Janela pos={[2.62, 1.7, 0.9]} rot={Math.PI / 2} />, {atraso: 13}),

  // telhado em etapas
  ...Array.from({length: 8}).map((_, i) => P('madeiramento', <group key={`m${i}`}><mesh position={[-2.6 + i * 0.74, 3.45, -1.75]} rotation={[-0.4, 0, 0]}><boxGeometry args={[0.08, 0.1, 3.8]} /><meshStandardMaterial color="#a9744f" flatShading /></mesh><mesh position={[-2.6 + i * 0.74, 3.45, 1.75]} rotation={[0.4, 0, 0]}><boxGeometry args={[0.08, 0.1, 3.8]} /><meshStandardMaterial color="#a9744f" flatShading /></mesh></group>, {atraso: i * 3})),
  P('madeiramento', <Caixa pos={[0, 4.3, 0]} tam={[5.8, 0.12, 0.12]} cor="#8b5a3c" />, {atraso: 26}),
  P('telhado', <Telhado pos={[0, 2.85, 0]} larg={5.8} prof={7} alt={1.5} />),
  P('placa', <Placa pos={[2.9, 0, 4.6]} rot={-0.3} texto="ALUGA-SE" />),
];
