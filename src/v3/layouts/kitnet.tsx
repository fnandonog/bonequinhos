import React from 'react';
import {Arbusto, Arvore, Bancada, Caixa, Cama, Cerca, Chuveiro, Cilindro, Geladeira, Janela, Pedra, Placa, Porta, Sofa, Telhado, Vaso, Armario} from '../Pecas';

// Layout da kitnet: cada peça tem um id que o roteiro "mostra" numa cena.
// A casa fica centrada na origem: 5 m (x) por 6 m (z), frente virada para +z.
export type Peca = {id: string; grupo: string; node: React.ReactNode};

const H = 2.6;
const Y = 0.25 + H / 2;

const paredes = (cor: string, esp: number, alt = H) => [
  <Caixa key="tras" pos={[0, Y, -3]} tam={[5.2, alt, esp]} cor={cor} />,
  <Caixa key="esq" pos={[-2.5, Y, 0]} tam={[esp, alt, 6]} cor={cor} />,
  <Caixa key="dir" pos={[2.5, Y, 0]} tam={[esp, alt, 6]} cor={cor} />,
  <Caixa key="fe" pos={[-2.1, Y, 3]} tam={[0.8 + esp, alt, esp]} cor={cor} />,
  <Caixa key="fd" pos={[0.9, Y, 3]} tam={[3.2 + esp, alt, esp]} cor={cor} />,
  <Caixa key="verga" pos={[-1.2, 0.25 + H - 0.25, 3]} tam={[1.05, 0.5, esp]} cor={cor} />,
  <Caixa key="banh1" pos={[0.7, Y, -2.1]} tam={[esp, alt, 1.8]} cor={cor} />,
  <Caixa key="banh2" pos={[1.9, Y, -1.2]} tam={[1.2, alt, esp]} cor={cor} />,
];

export const KITNET: Peca[] = [
  // cenário em volta (aparece desde o começo)
  {id: 'terreno', grupo: 'cenario', node: <Caixa pos={[0, 0.01, 0.6]} tam={[8.5, 0.02, 9.5]} cor="#c8a77a" />},
  ...[[-6, -5], [-7, 1], [-6.5, 6], [6.5, -5.5], [7, 0.5], [6.2, 6.5], [-2, -7.5], [3, -8], [0, 8.5]].map(([x, z], i) => ({id: 'cenario', grupo: 'cenario', node: <Arvore key={`a${i}`} pos={[x, 0, z]} esc={0.9 + (i % 3) * 0.2} cor={i % 2 ? '#3f9b5a' : '#56b06a'} />})),
  ...[[-4.8, 4.8], [4.6, -4], [-4.5, -3.5], [4.8, 3.8], [-1, 6.2]].map(([x, z], i) => ({id: 'cenario', grupo: 'cenario', node: <Arbusto key={`b${i}`} pos={[x, 0, z]} esc={0.8 + (i % 2) * 0.3} />})),
  ...[[-3.6, 5.6], [3.9, 5.2], [-4.2, -1]].map(([x, z], i) => ({id: 'cenario', grupo: 'cenario', node: <Pedra key={`p${i}`} pos={[x, 0, z]} esc={1 + (i % 2) * 0.6} />})),
  {id: 'cenario', grupo: 'cenario', node: <Cerca pos={[0, 0, -4.4]} comp={8.5} />},
  {id: 'cenario', grupo: 'cenario', node: <Cerca pos={[-4.25, 0, 0.6]} rot={Math.PI / 2} comp={10} />},
  {id: 'cenario', grupo: 'cenario', node: <Cerca pos={[4.25, 0, 0.6]} rot={Math.PI / 2} comp={10} />},

  // obra
  {id: 'fundacao', grupo: 'obra', node: <Caixa pos={[0, 0.125, 0]} tam={[5.4, 0.25, 6.4]} cor="#a7a39b" />},
  ...paredes('#c4623f', 0.2).map((n, i) => ({id: 'paredes', grupo: 'obra', node: <React.Fragment key={i}>{n}</React.Fragment>})),
  // elétrica (fios) e hidráulica (canos)
  ...[[-2.38, 0], [2.38, 0.5], [-1, -2.88]].map(([x, z], i) => ({id: 'eletrica', grupo: 'obra', node: <Caixa key={`e${i}`} pos={[x, 1.6, z]} tam={i === 2 ? [2.2, 0.05, 0.04] : [0.04, 0.05, 2.5]} cor="#ff8a1f" />})),
  ...[[-2.38, 1.8], [2.38, 2], [-0.2, -2.88]].map(([x, z], i) => ({id: 'eletrica', grupo: 'obra', node: <Caixa key={`t${i}`} pos={[x, 1.0, z]} tam={i === 2 ? [0.18, 0.12, 0.04] : [0.04, 0.12, 0.18]} cor="#f4f4f4" />})),
  {id: 'hidraulica', grupo: 'obra', node: <Cilindro pos={[1.6, 0.35, -2.85]} r={0.05} h={0.2} cor="#3d8bff" />},
  {id: 'hidraulica', grupo: 'obra', node: <group><mesh position={[0.3, 0.32, -2.85]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, 3.6, 8]} /><meshStandardMaterial color="#3d8bff" flatShading /></mesh></group>},
  {id: 'hidraulica', grupo: 'obra', node: <Cilindro pos={[-1.4, 0.7, -2.85]} r={0.05} h={0.8} cor="#3d8bff" />},
  // acabamento
  {id: 'piso', grupo: 'obra', node: <Caixa pos={[0, 0.27, 0]} tam={[4.8, 0.04, 5.8]} cor="#ead9bd" />},
  ...paredes('#f4efe6', 0.24, H + 0.02).map((n, i) => ({id: 'pintura', grupo: 'obra', node: <React.Fragment key={i}>{n}</React.Fragment>})),
  // banheiro
  {id: 'banheiro', grupo: 'obra', node: <Vaso pos={[2.1, 0.29, -2.55]} />},
  {id: 'banheiro', grupo: 'obra', node: <Chuveiro pos={[1.25, 0.29, -2.4]} />},
  {id: 'banheiro', grupo: 'obra', node: <group><Caixa pos={[2.3, 0.75, -1.7]} tam={[0.3, 0.12, 0.5]} cor="#ffffff" /><Cilindro pos={[2.3, 0.45, -1.7]} r={0.05} h={0.5} cor="#f4f4f4" /></group>},
  // cozinha
  {id: 'cozinha', grupo: 'obra', node: <Bancada pos={[-1.3, 0.29, -2.6]} />},
  {id: 'cozinha', grupo: 'obra', node: <Geladeira pos={[0.15, 0.29, -2.6]} />},
  // móveis
  {id: 'moveis', grupo: 'obra', node: <Cama pos={[-1.6, 0.29, 0.5]} />},
  {id: 'moveis', grupo: 'obra', node: <Armario pos={[-2.1, 0.29, -1.2]} rot={Math.PI / 2} />},
  {id: 'moveis', grupo: 'obra', node: <Sofa pos={[1.5, 0.29, 1.9]} rot={Math.PI} cor="#ff7a59" />},
  // esquadrias
  {id: 'esquadrias', grupo: 'obra', node: <Porta pos={[-1.2, 0.27, 3.06]} />},
  {id: 'esquadrias', grupo: 'obra', node: <Janela pos={[1.1, 1.7, 3.08]} />},
  {id: 'esquadrias', grupo: 'obra', node: <Janela pos={[-2.58, 1.7, 0.6]} rot={Math.PI / 2} />},
  {id: 'esquadrias', grupo: 'obra', node: <Janela pos={[2.58, 1.7, 0.9]} rot={Math.PI / 2} />},
  // telhado
  {id: 'telhado', grupo: 'obra', node: <Telhado pos={[0, 2.85, 0]} larg={5.8} prof={7} alt={1.5} />},
  {id: 'placa', grupo: 'obra', node: <Placa pos={[2.9, 0, 4.4]} rot={-0.3} texto="ALUGA-SE" />},
];
