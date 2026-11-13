// PEÇAS do perfil Caso Explicado (voo MH370) em ESCALA REAL (1 unidade = 1 metro), menos o MAPA,
// que é um mapa em relevo (K unidades por grau; ver abaixo) e o set do satélite, que é esquemático.
// Boeing 777-200ER: 63,7 m de comprimento, 60,9 m de envergadura, fuselagem de 6,2 m, 18,5 m de altura.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, Caixa, Cil, Mat, Visual, Expressao, clamp01, lerp, suave, texPilula} from '../v4/kit';

export {clamp01, lerp, suave};

// ---------- figurino ----------
export const ZE_DETETIVE: Visual = {camisa: '#c9a46a', calca: '#5a4636', colete: null, capacete: null, cabelo: '#3b2a20'};
export const PILOTO: Visual = {camisa: '#f4f4f4', calca: '#1d2233', colete: null, capacete: null, cabelo: '#2b2233'};
export const CONTROLADOR: Visual = {camisa: '#7da2d6', calca: '#2b2b3a', colete: null, capacete: null, cabelo: '#3b2a20', pele: '#e7b48c'};
export const MILITAR: Visual = {camisa: '#5b6b3f', calca: '#4a5634', colete: null, capacete: '#4a5634', pele: '#c98e62'};
export const PISTA: Visual = {camisa: '#30406b', calca: '#30406b', colete: '#ff8a1f', capacete: null, cabelo: '#1d1b26', pele: '#c98e62'};
export const GARI: Visual = {camisa: '#2f8f5a', calca: '#2b2b3a', colete: '#ffd23f', capacete: null, cabelo: '#1d1b26', pele: '#b98a66'};
export const FAMILIA: Visual[] = [
  {camisa: '#f2f2f2', calca: '#2b2b3a', colete: null, capacete: null, cabelo: '#1d1b26'},
  {camisa: '#d9d4e6', calca: '#3a3a4a', colete: null, capacete: null, cabelo: '#2b2233', pele: '#e7b48c'},
  {camisa: '#e9e1cf', calca: '#2f3b55', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#c98e62'},
  {camisa: '#ffffff', calca: '#4a4a55', colete: null, capacete: null, cabelo: '#c8c8c8'},
];

// gerador pseudo-aleatório determinístico
export const rnd = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};

// plaquinha flutuante sem linha guia
export const Pilula: React.FC<{texto: string; pos: V3; fundo: string; cor?: string; vis?: number; tam?: number}> = ({texto, pos, fundo, cor = '#ffffff', vis = 1, tam = 1}) =>
  vis > 0.01 ? (
    <sprite position={pos} scale={[0.22 * suave(vis) * tam, 0.052 * suave(vis) * tam, 1]} renderOrder={10}>
      <spriteMaterial map={texPilula(texto, fundo, cor)} depthTest={false} sizeAttenuation={false} />
    </sprite>
  ) : null;

// placa de texto presa no mundo (escala em metros, sem virar para a câmera)
export const Placa: React.FC<{texto: string; pos: V3; rot?: V3; larg: number; fundo?: string; cor?: string}> = ({texto, pos, rot = [0, 0, 0], larg, fundo = '#ffffff', cor = '#1d1b26'}) => (
  <mesh position={pos} rotation={rot}>
    <planeGeometry args={[larg, larg * (150 / 640)]} />
    <meshBasicMaterial map={texPilula(texto, fundo, cor)} transparent />
  </mesh>
);

// ---------- o Zé investigador: chapéu e lupa por cima do Boneco de sempre ----------
// A mão direita do Boneco fica em (0.30, 0.97, 0.45) quando ele "aponta" e em (0.39, 0.56, 0) quando está parado (escala 1).
export const Lupa: React.FC<{pos: V3; rot?: V3; esc?: number}> = ({pos, rot = [0, 0, 0], esc = 1}) => (
  <group position={pos} rotation={rot} scale={esc}>
    <Cil pos={[0, 0, 0]} rot={[Math.PI / 2, 0, 0]} r={0.025} h={0.16} cor="#5a3a22" />
    <group position={[0, 0, 0.2]}>
      <mesh rotation={[0, 0, 0]}><torusGeometry args={[0.11, 0.018, 10, 28]} /><Mat cor="#c9a24a" rugoso={0.4} /></mesh>
      <mesh><circleGeometry args={[0.1, 40]} /><meshStandardMaterial color="#bfe6ff" transparent opacity={0.45} side={2} roughness={0.1} /></mesh>
    </group>
  </group>
);

export const ZeDetetive: React.FC<{pos: V3; rotY?: number; t: number; aponta?: boolean; esc?: number; expressao?: Expressao}> = ({pos, rotY = 0, t, aponta = true, esc = 0.92, expressao = 'serio'}) => (
  // Zé 2.0 investigador: fedora, gola de sobretudo e lupa NA MÃO; sério (Caso Explicado)
  <Boneco pos={pos} rotY={rotY} acao={aponta ? 'aponta' : 'parado'} t={t} v={{...ZE_DETETIVE, chapeu: {tipo: 'fedora', cor: '#4a3426'}, gola: '#b08a52'}} esc={esc} expressao={expressao}
    maoD={<Lupa pos={[0, 0, 0.02]} esc={1.1} />} />
);

// ---------- Boeing 777 (nariz para +X; origem no centro da fuselagem) ----------
const trapezio = (pts: [number, number][], esp: number) => {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return new THREE.ExtrudeGeometry(s, {depth: esp, bevelEnabled: false});
};

export const Aviao: React.FC<{pos?: V3; rot?: V3; esc?: number; t?: number; luzes?: boolean; janelas?: boolean; trem?: boolean}> = ({pos = [0, 0, 0], rot = [0, 0, 0], esc = 1, t = 0, luzes = true, janelas = true, trem = false}) => {
  // asa: raiz de x=+8 a x=-4 (z=2,5); ponta de x=-15 a x=-18 (z=30,45)
  const asa = useMemo(() => trapezio([[8, 0], [-4, 0], [-18, 27.9], [-15.2, 27.9]], 0.7), []);
  const prof = useMemo(() => trapezio([[0, 0], [-5.5, 0], [-9.5, 8.6], [-7.3, 8.6]], 0.35), []);
  const deriva = useMemo(() => trapezio([[0, 0], [-8, 0], [-12, 9.5], [-8.5, 9.5]], 0.4), []);
  const pisca = luzes && Math.sin(t * 9) > 0.6;
  const BRANCO = '#f4f5f7';
  return (
    <group position={pos} rotation={rot} scale={esc}>
      {/* fuselagem */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[3.1, 3.1, 44, 24]} /><Mat cor={BRANCO} rugoso={0.5} /></mesh>
      <mesh position={[25.5, -0.2, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow><cylinderGeometry args={[0.6, 3.1, 7, 24]} /><Mat cor={BRANCO} rugoso={0.5} /></mesh>
      <mesh position={[29.2, -0.35, 0]}><sphereGeometry args={[0.65, 20, 14]} /><Mat cor="#e7e9ee" /></mesh>
      <mesh position={[-27, 0.9, 0]} rotation={[0, 0, Math.PI / 2 + 0.08]} castShadow><cylinderGeometry args={[3.0, 0.7, 10.5, 24]} /><Mat cor={BRANCO} rugoso={0.5} /></mesh>
      {/* faixa da barriga e faixa colorida da lateral */}
      <mesh position={[0, -1.25, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[2.85, 2.85, 44.2, 24, 1, true, Math.PI * 0.62, Math.PI * 0.76]} /><meshStandardMaterial color="#1f3c7a" side={2} /></mesh>
      {/* para-brisa */}
      <mesh position={[25.6, 0.85, 0]} rotation={[0, 0, -0.55]}><boxGeometry args={[1.2, 0.5, 3.0]} /><meshStandardMaterial color="#1d2233" roughness={0.2} /></mesh>
      {/* janelas (faixa escura dos dois lados) */}
      {janelas && [-1, 1].map((s) => (<Caixa key={s} pos={[1, 0.85, s * 3.03]} tam={[42, 0.32, 0.08]} cor="#2a3550" sombra={false} />))}
      {/* asas */}
      {[1, -1].map((s) => (
        <group key={s} position={[2, -1.6, s * 2.5]} rotation={[s > 0 ? Math.PI / 2 - 0.08 : -Math.PI / 2 + 0.08, 0, 0]}>
          <mesh geometry={asa} castShadow><Mat cor="#e3e6ec" rugoso={0.5} /></mesh>
        </group>
      ))}
      {/* motores */}
      {[1, -1].map((s) => (
        <group key={'m' + s} position={[7.5, -3.0, s * 9.8]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[1.75, 1.55, 7.2, 24]} /><Mat cor="#d9dce3" rugoso={0.4} /></mesh>
          <mesh position={[3.62, 0, 0]} rotation={[0, 0, Math.PI / 2]}><circleGeometry args={[1.55, 40]} /><meshStandardMaterial color="#2b2f3a" side={2} /></mesh>
          <Caixa pos={[0.8, 1.6, 0]} tam={[4, 1.2, 0.5]} cor="#e3e6ec" />
        </group>
      ))}
      {/* estabilizadores */}
      {[1, -1].map((s) => (
        <group key={'e' + s} position={[-25.5, 1.2, s * 1.2]} rotation={[s > 0 ? Math.PI / 2 - 0.1 : -Math.PI / 2 + 0.1, 0, 0]}>
          <mesh geometry={prof} castShadow><Mat cor="#e3e6ec" /></mesh>
        </group>
      ))}
      <group position={[-23.5, 2.6, -0.2]}>
        <mesh geometry={deriva} castShadow><Mat cor="#1f3c7a" /></mesh>
      </group>
      {/* trem de pouso */}
      {trem && [[19, 0], [-2, 3.2], [-2, -3.2]].map(([x, z], i) => (
        <group key={'t' + i}>
          <Cil pos={[x, -3.6, z]} r={0.18} h={1.6} cor="#9aa0aa" />
          <Cil pos={[x, -4.45, z]} rot={[Math.PI / 2, 0, 0]} r={0.62} h={i ? 1.4 : 0.6} cor="#1d1b26" seg={12} />
        </group>
      ))}
      {/* luzes de navegação: vermelha à esquerda, verde à direita, pisca branco */}
      {luzes && (
        <>
          <mesh position={[-15.5, -1.0, -30.5]}><sphereGeometry args={[0.35, 20, 14]} /><meshBasicMaterial color="#ff3b3b" /></mesh>
          <mesh position={[-15.5, -1.0, 30.5]}><sphereGeometry args={[0.35, 20, 14]} /><meshBasicMaterial color="#3bff7a" /></mesh>
          {pisca && <mesh position={[-1, 3.3, 0]}><sphereGeometry args={[0.45, 20, 14]} /><meshBasicMaterial color="#ff4040" /></mesh>}
          {pisca && <pointLight position={[-15.5, -0.5, 31]} color="#ffffff" intensity={60} distance={20} decay={1.5} />}
        </>
      )}
    </group>
  );
};

// ---------- MAPA em relevo (K unidades por grau de latitude/longitude; centro em 100°L, equador) ----------
export const K = 3;
export const W = (lon: number, lat: number, h = 0): V3 => [(lon - 100) * K, h, -lat * K];
type LL = [number, number];

const TERRAS: LL[][] = [
  // Ásia (Arábia, Índia, Indochina, península malaia e China)
  [[43, 12.5], [45, 13], [48, 14], [52, 16], [55, 17.5], [57, 19], [59.5, 22.5], [58.5, 23.6], [56.3, 26], [57, 25.6], [62, 25.2], [66.5, 25.4], [68.5, 23.5], [70, 22.5], [72.6, 21.5],
    [72.8, 19], [73.5, 16], [75, 13], [76.5, 9.5], [77.5, 8], [79.8, 10.3], [80.2, 13], [80.3, 15.5], [82.5, 17], [85, 19.3], [86.5, 20], [88, 22], [91, 22.5], [92, 21], [94, 18],
    [94.5, 16], [95.5, 15.8], [97.6, 16.5], [98.2, 13], [98.6, 10], [98.3, 8], [99.2, 7], [100.3, 5.5], [100.8, 4], [101.3, 2.9], [102.5, 1.9], [103.5, 1.3], [104.2, 1.5],
    [103.4, 3.5], [103.2, 5.3], [102.2, 6.2], [101.2, 6.9], [100.4, 7.2], [100.2, 8.5], [99.8, 9.5], [99.2, 10.5], [99.6, 12], [100.1, 13.4], [100.9, 13.4], [101.5, 12.7],
    [102.5, 12.1], [103, 11], [104.5, 10.4], [105, 8.6], [106.5, 9.5], [107.5, 10.5], [109.2, 11.5], [109.3, 13], [108.8, 15.4], [107, 17], [105.8, 19], [106.7, 20.5],
    [108, 21.6], [110, 21], [111, 21.5], [113, 22.3], [115, 22.8], [117, 23.6], [119, 25.5], [120.5, 28], [122, 30], [121, 32], [120, 34], [119.5, 35], [122.5, 37],
    [121, 37.5], [118, 38], [117.5, 39], [119, 39.5], [121.5, 39], [122, 40.5], [124, 40], [128, 41], [130, 42.5], [131, 50], [30, 50], [30, 31], [34, 31.5], [35, 28], [39, 21]],
  // África (costa leste)
  [[33, 31], [34.5, 28], [39, 21], [43, 12.5], [51, 12], [51, 10.5], [49, 6], [46, 2], [42, -1], [40, -3], [39.3, -6], [39.5, -10], [40.5, -15], [37, -18], [35, -21],
    [35.5, -24], [32.5, -26], [32.5, -29], [30, -31], [27, -34], [22, -34.5], [18.5, -34.2], [18, -30], [15, -25], [11, -17], [13, -10], [10, -2], [9, 4], [5, 5], [5, 31]],
  // Madagascar
  [[49.3, -12], [50.5, -15.5], [49.8, -17], [48.5, -20], [47.3, -25], [45, -25.5], [43.7, -23.5], [43.3, -21.5], [44.4, -19], [44, -17], [46, -15.7], [48, -13.5]],
  // Sri Lanka
  [[79.9, 9.8], [81, 8.5], [81.9, 7], [81.6, 6.2], [80.6, 5.9], [80, 6.5], [79.8, 8]],
  // Sumatra
  [[95.3, 5.6], [97.5, 5.2], [98.7, 3.8], [100.4, 2.2], [101.5, 1.6], [103.5, 0], [104.5, -1.5], [106, -3], [105.8, -5.9], [104.5, -5.9], [102.3, -4], [100.5, -1.2], [99, 1.4], [97.5, 2.7], [95.5, 4.6]],
  // Java
  [[105.2, -6.8], [106, -5.9], [108.3, -6.3], [110.5, -6.9], [112.6, -6.9], [114.5, -7.7], [114.4, -8.7], [111, -8.2], [108, -7.8], [106.4, -7.4]],
  // Bornéu
  [[109, 1.5], [109.6, 2], [111, 1.7], [113, 3.2], [114, 4.5], [115.5, 5.3], [116.8, 6.9], [117.7, 6], [119.2, 5.2], [118, 4.3], [118, 2.5], [119, 1], [117.9, 0.5], [117.5, -1],
    [116.5, -2.3], [116, -3.9], [114.5, -4], [113, -3.2], [111.6, -3.3], [110.2, -2.9], [110, -1.5], [109.1, -0.3], [109, 0.8]],
  // Sulawesi
  [[119.5, -5.5], [120.4, -5.6], [120.5, -3], [121.5, -4.7], [122.8, -4.5], [121.5, -2], [123.3, -0.9], [121.2, -1], [121.2, 0.5], [124.5, 0.4], [125, 1.5], [120.7, 1.2], [120, 0], [119.6, -1.5], [118.8, -2.9]],
  // Filipinas (Luzon e Mindanao), Taiwan, Hainan, Timor
  [[120, 18.5], [122.3, 18.5], [122, 16.5], [121.6, 14.3], [124, 13], [122.5, 13.5], [120.6, 13.9], [120.3, 16], [119.8, 17]],
  [[122, 7], [123.5, 8], [125.5, 9.5], [126.5, 7.3], [125.5, 5.8], [124, 6.5], [122.2, 6.8]],
  [[120.1, 23], [121, 25.2], [122, 25], [120.8, 22]],
  [[108.6, 19.2], [110, 20.1], [111, 19.6], [110.2, 18.3], [109, 18.4]],
  [[124, -9.9], [125, -9], [127.3, -8.4], [126, -9], [124.5, -10.2]],
  // Nova Guiné
  [[131, -1.5], [134, -0.8], [136, -2.3], [138, -1.6], [141, -2.6], [145, -4.5], [146, -6], [147.5, -6], [150, -10.5], [147, -10], [145, -7.8], [143, -9.1], [141, -9.1],
    [138, -8.3], [137.8, -5.3], [135, -4.4], [133, -4], [132, -2.8]],
  // Austrália
  [[113.4, -22], [114, -26], [115, -30], [115.7, -32], [115, -34.4], [118, -35], [121, -33.9], [124, -33], [126, -32.3], [129, -31.6], [131, -31.5], [134, -32.5], [136, -34.5],
    [138, -35], [140, -37.5], [143, -38.7], [146.5, -39], [150, -37.5], [151.5, -33], [153, -31], [153.5, -28], [153, -25], [151, -23.2], [149, -21], [146, -18.5], [145.3, -15],
    [143.5, -14], [142.5, -10.8], [141.6, -13], [141.5, -16.7], [140, -17.6], [137.5, -16], [135.5, -15], [136.7, -12.2], [132.5, -11.5], [130.5, -12.3], [129.5, -14.9],
    [128, -15], [125.5, -14.5], [123.5, -16.5], [122.2, -18], [121, -19.6], [118.8, -20.3], [116.7, -20.6], [114.5, -21.8]],
];
export const ALT_TERRA = 0.7;

const terraGeo = (pol: LL[]) => {
  const s = new THREE.Shape();
  pol.forEach(([lon, lat], i) => (i ? s.lineTo((lon - 100) * K, lat * K) : s.moveTo((lon - 100) * K, lat * K)));
  s.closePath();
  return new THREE.ExtrudeGeometry(s, {depth: ALT_TERRA, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.3, bevelSegments: 1, curveSegments: 1});
};
let terrasCache: THREE.ExtrudeGeometry[] | null = null;

// rota (pontos em lon/lat)
export const PTS = {
  KL: [101.7, 2.75] as LL,
  IGARI: [103.59, 6.94] as LL,
  PENANG: [100.3, 5.4] as LL,
  RADAR: [97.7, 6.8] as LL, // último ponto no radar militar (02:22)
  FIM: [93.8, -35] as LL, // fim calculado no 7º arco (área de busca)
  PEQUIM: [116.4, 39.9] as LL,
  REUNIAO: [55.5, -21.1] as LL,
  SAT: [64.5, 0] as LL, // satélite da Inmarsat sobre o Índico
};
const ROTA_A: LL[] = [PTS.KL, [102.6, 4.8], PTS.IGARI];
const ROTA_B: LL[] = [PTS.IGARI, [103.0, 6.6], [102.25, 6.1], [101.0, 5.7], PTS.PENANG, [99.4, 5.9], [98.6, 6.5], PTS.RADAR];
const ROTA_C: LL[] = [PTS.RADAR, [96.2, 5.0], [95, 1], [94, -6], [93.4, -15], [93.3, -25], PTS.FIM];
const PLANO: LL[] = [PTS.IGARI, [108, 12], [112, 20], [114.5, 30], PTS.PEQUIM];

const comprimentos = (l: LL[]) => {
  const c = [0];
  for (let i = 1; i < l.length; i++) c.push(c[i - 1] + Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]));
  return c;
};
// ponto e direção a uma fração k (0..1) da polilinha
const naRota = (l: LL[], k: number): {p: LL; ang: number; i: number} => {
  const c = comprimentos(l);
  const alvo = clamp01(k) * c[c.length - 1];
  let i = 1;
  while (i < l.length - 1 && c[i] < alvo) i++;
  const a = l[i - 1], b = l[i];
  const u = (alvo - c[i - 1]) / Math.max(1e-6, c[i] - c[i - 1]);
  return {p: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], ang: Math.atan2(b[1] - a[1], b[0] - a[0]), i};
};
// p (0..1) da viagem: 0–0,1 KL→IGARI; 0,1–0,55 volta pela Malásia até o último radar; 0,55–1 rota calculada para o sul
export const posAviao = (p: number) => {
  if (p < 0.1) return naRota(ROTA_A, p / 0.1);
  if (p < 0.55) return naRota(ROTA_B, (p - 0.1) / 0.45);
  return naRota(ROTA_C, (p - 0.55) / 0.45);
};

const Linha: React.FC<{l: LL[]; k: number; cor: string; tracejada?: boolean; r?: number; h?: number}> = ({l, k, cor, tracejada = false, r = 0.22, h = ALT_TERRA + 0.6}) => {
  if (k <= 0.001) return null;
  const fim = naRota(l, k);
  const pts: LL[] = [...l.slice(0, fim.i), fim.p];
  const segs: [LL, LL][] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (!tracejada) {
      segs.push([a, b]);
      continue;
    }
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.floor(d / 0.9));
    for (let j = 0; j < n; j += 2) {
      const u0 = j / n, u1 = Math.min(1, (j + 1) / n);
      segs.push([[lerp(a[0], b[0], u0), lerp(a[1], b[1], u0)], [lerp(a[0], b[0], u1), lerp(a[1], b[1], u1)]]);
    }
  }
  return (
    <group>
      {segs.map(([a, b], i) => (<Barra key={i} a={W(a[0], a[1], h)} b={W(b[0], b[1], h)} r={r} cor={cor} sombra={false} />))}
    </group>
  );
};

// alfinete do mapa
export const Pino: React.FC<{ll: LL; cor: string; alt?: number}> = ({ll, cor, alt = 3}) => {
  const [x, , z] = W(ll[0], ll[1]);
  return (
    <group position={[x, ALT_TERRA, z]}>
      <Cil pos={[0, alt / 2, 0]} r={0.12} h={alt} cor="#1d1b26" seg={6} />
      <mesh position={[0, alt, 0]} castShadow><sphereGeometry args={[0.7, 20, 14]} /><Mat cor={cor} rugoso={0.4} /></mesh>
    </group>
  );
};

// arco do satélite (círculo em volta do ponto abaixo do satélite), de th0 a th1 graus (0 = leste, 90 = norte)
const Arco: React.FC<{raio: number; th0: number; th1: number; cor: string; vis: number; r?: number}> = ({raio, th0, th1, cor, vis, r = 0.28}) => {
  if (vis <= 0.01) return null;
  const c = W(PTS.SAT[0], PTS.SAT[1], ALT_TERRA + 0.4);
  const ang = ((th1 - th0) * Math.PI) / 180;
  return (
    <group position={c} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh rotation={[0, 0, (th0 * Math.PI) / 180]}>
        <torusGeometry args={[raio * K, r, 10, 90, ang * suave(vis)]} />
        <meshBasicMaterial color={cor} transparent opacity={0.9} />
      </mesh>
    </group>
  );
};
// faixa da área de busca ao longo do 7º arco
const Faixa: React.FC<{r0: number; r1: number; th0: number; th1: number; cor: string; vis: number; dy?: number}> = ({r0, r1, th0, th1, cor, vis, dy = 0}) => {
  if (vis <= 0.01) return null;
  const c = W(PTS.SAT[0], PTS.SAT[1], ALT_TERRA + 0.2 + dy);
  return (
    <group position={c} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[r0 * K, r1 * K, 40, 1, (th0 * Math.PI) / 180, (((th1 - th0) * Math.PI) / 180) * suave(vis)]} />
        <meshBasicMaterial color={cor} transparent opacity={0.75} side={2} />
      </mesh>
    </group>
  );
};

export const RAIOS_ARCOS = [36, 37.6, 39.2, 40.8, 42.4, 44, 45.6];
const R7 = Math.hypot(PTS.FIM[0] - PTS.SAT[0], PTS.FIM[1] - PTS.SAT[1]);

/** mapa do caso.
 * p 0–1: viagem do avião (rota vermelha observada, amarela tracejada calculada);
 * p 1–1,5: as três buscas aparecem na faixa do 7º arco; p 1,5–2: a peça viaja até a Ilha da Reunião. */
export const Mapa: React.FC<{p: number; t: number; pergunta?: boolean}> = ({p, t, pergunta = true}) => {
  if (!terrasCache) terrasCache = TERRAS.map(terraGeo);
  const geos = terrasCache;
  const r = Math.min(1, p);
  const kA = clamp01(r / 0.1), kB = clamp01((r - 0.1) / 0.45), kC = clamp01((r - 0.55) / 0.45);
  const av = posAviao(Math.min(r, 0.999));
  const [ax, , az] = W(av.p[0], av.p[1], 0);
  const busca = clamp01((p - 1) / 0.45);
  const deriva = clamp01((p - 1.5) / 0.45);
  const arcos = clamp01((r - 0.55) / 0.04);
  const grade = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let lon = 30; lon <= 150; lon += 10) out.push(<Caixa key={'lo' + lon} pos={[(lon - 100) * K, 0.02, 0]} tam={[0.12, 0.02, 300]} cor="#3d86b8" sombra={false} />);
    for (let lat = -45; lat <= 45; lat += 10) out.push(<Caixa key={'la' + lat} pos={[-30, 0.02, -lat * K]} tam={[400, 0.02, 0.12]} cor="#3d86b8" sombra={false} />);
    return out;
  }, []);
  const trecho = (a: number, b: number) => clamp01((busca - a) / (b - a));
  const drift: LL = [lerp(PTS.FIM[0], PTS.REUNIAO[0], deriva), lerp(PTS.FIM[1], PTS.REUNIAO[1], deriva)];
  return (
    <group>
      {/* mar */}
      <mesh position={[-30, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[420, 320]} /><meshStandardMaterial color="#2c77ad" roughness={0.6} /></mesh>
      {grade}
      {/* terras */}
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={i === 1 || i === 0 ? '#d9c98f' : '#a9cf7a'} roughness={0.9} />
        </mesh>
      ))}
      {/* Ilha da Reunião e Maurício */}
      <Cil pos={W(55.5, -21.1, 0.4)} r={1.3} r2={1.6} h={0.9} cor="#a9cf7a" seg={7} />
      <Cil pos={W(57.6, -20.3, 0.3)} r={0.9} r2={1.2} h={0.6} cor="#a9cf7a" seg={6} />
      {/* rota planejada até Pequim (cinza tracejada) */}
      <Linha l={[PTS.KL, ...PLANO]} k={1} cor="#e8eef5" tracejada r={0.16} />
      {/* rota vista: KL → IGARI → volta pela Malásia → último radar */}
      <Linha l={ROTA_A} k={kA} cor="#ff4d4d" />
      <Linha l={ROTA_B} k={kB} cor="#ff4d4d" />
      {/* rota calculada pelo satélite (tracejada amarela) */}
      <Linha l={ROTA_C} k={kC} cor="#ffd23f" tracejada r={0.3} />
      {/* arcos do satélite */}
      {RAIOS_ARCOS.map((ra, i) => (
        <Arco key={i} raio={i === 6 ? R7 : ra} th0={-75} th1={18} cor={i === 6 ? '#ff4d4d' : '#ffffff'} vis={clamp01(arcos * 7 - i)} r={i === 6 ? 0.45 : 0.18} />
      ))}
      <Pino ll={PTS.SAT} cor="#6fd3ff" alt={2.5} />
      {/* as três buscas no 7º arco */}
      <Faixa r0={R7 - 1.6} r1={R7 + 1.6} th0={-60} th1={-44} cor="#ff8a1f" vis={trecho(0, 0.4)} />
      <Faixa r0={R7 - 1.2} r1={R7 + 1.2} th0={-44} th1={-34} cor="#ffb347" vis={trecho(0.35, 0.7)} dy={0.05} />
      <Faixa r0={R7 - 0.9} r1={R7 + 0.9} th0={-52} th1={-47} cor="#ff5d5d" vis={trecho(0.65, 1)} dy={0.1} />
      {/* deriva da peça até a Ilha da Reunião */}
      {deriva > 0 && <Linha l={[PTS.FIM, [80, -33], [66, -27], PTS.REUNIAO]} k={deriva} cor="#ffffff" tracejada r={0.35} />}
      {deriva > 0 && <Caixa pos={W(drift[0], drift[1], ALT_TERRA + 0.9)} rot={[0, 0.4, 0]} tam={[2.6, 0.6, 1.1]} cor="#f4f5f7" />}
      {/* pinos */}
      <Pino ll={PTS.KL} cor="#ffd23f" />
      <Pino ll={PTS.PEQUIM} cor="#ffffff" />
      {deriva > 0 && <Pino ll={PTS.REUNIAO} cor="#ffffff" alt={3.5} />}
      {deriva > 0.6 && <Pilula texto="ILHA DA REUNIÃO" pos={W(PTS.REUNIAO[0], PTS.REUNIAO[1], 14)} fundo="#1d1b26" tam={0.9} />}
      {r >= 0.55 && <Pino ll={PTS.RADAR} cor="#ff4d4d" alt={2.4} />}
      {/* o avião na rota (marcador do mapa: ~3 unidades) */}
      {r < 0.999 && <Aviao pos={[ax, ALT_TERRA + 2.2, az]} rot={[0, av.ang, 0]} esc={0.05} t={t} luzes={false} janelas={false} />}
      {/* ponto de interrogação onde o sinal acabou */}
      {pergunta && r >= 0.999 && (
        <group position={W(PTS.FIM[0], PTS.FIM[1], 0)}>
          <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={1 + 0.15 * Math.sin(t * 5)}><ringGeometry args={[2.2, 3.0, 24]} /><meshBasicMaterial color="#ff4d4d" side={2} /></mesh>
          <Pilula texto="?" pos={[0, 6, 0]} fundo="#ff4d4d" tam={0.75} />
        </group>
      )}
    </group>
  );
};

// ---------- tela de radar (escopo verde) ----------
export const TelaRadar: React.FC<{pos: V3; rot?: V3; r?: number; t: number; blip: number; rumo?: number; rastro?: number}> = ({pos, rot = [0, 0, 0], r = 0.6, t, blip, rumo = 0, rastro = 0}) => {
  const varre = t * 2.2;
  const pisca = 0.6 + 0.4 * Math.max(0, Math.cos(varre - 0.9));
  return (
    <group position={pos} rotation={rot}>
      <Cil pos={[0, 0, -0.04]} rot={[Math.PI / 2, 0, 0]} r={r + 0.08} h={0.08} cor="#2b2f3a" seg={28} />
      <mesh><circleGeometry args={[r, 40]} /><meshBasicMaterial color="#06261a" /></mesh>
      {[0.33, 0.66, 0.99].map((k) => (<mesh key={k} position={[0, 0, 0.003]}><ringGeometry args={[r * k - 0.006, r * k, 48]} /><meshBasicMaterial color="#2fbf71" transparent opacity={0.5} /></mesh>))}
      <Caixa pos={[0, 0, 0.004]} tam={[r * 2, 0.006, 0.001]} cor="#1f7f4f" sombra={false} />
      <Caixa pos={[0, 0, 0.004]} tam={[0.006, r * 2, 0.001]} cor="#1f7f4f" sombra={false} />
      {/* costa (Malásia, esquemática) */}
      <mesh position={[-r * 0.45, -r * 0.1, 0.004]} rotation={[0, 0, 0.5]}><planeGeometry args={[r * 0.35, r * 1.3]} /><meshBasicMaterial color="#0f4a30" /></mesh>
      {/* feixe girando */}
      <group rotation={[0, 0, -varre]} position={[0, 0, 0.006]}>
        <mesh><circleGeometry args={[r, 40, 0, 0.5]} /><meshBasicMaterial color="#3bff9a" transparent opacity={0.25} /></mesh>
        <Caixa pos={[r / 2, 0.003, 0]} tam={[r, 0.008, 0.001]} cor="#3bff9a" sombra={false} />
      </group>
      {/* rastro (pontos antigos) */}
      {Array.from({length: Math.round(rastro * 8)}).map((_, i) => {
        const a = rumo + Math.PI - i * 0.12;
        return <mesh key={i} position={[r * 0.25 + Math.cos(a) * r * 0.06 * i, r * 0.2 + Math.sin(a) * r * 0.035 * i, 0.007]}><circleGeometry args={[0.012, 40]} /><meshBasicMaterial color="#3bff9a" transparent opacity={0.6 - i * 0.06} /></mesh>;
      })}
      {blip > 0.01 && (
        <group position={[r * 0.25, r * 0.2, 0.008]}>
          <mesh><circleGeometry args={[0.028, 40]} /><meshBasicMaterial color="#b6ffd6" transparent opacity={blip * pisca} /></mesh>
          <Placa texto="MH370" pos={[0.12, 0.05, 0]} larg={0.26 * blip} fundo="#0f4a30" cor="#b6ffd6" />
        </group>
      )}
    </group>
  );
};

// ---------- satélite (Inmarsat, esquemático) ----------
export const Satelite: React.FC<{pos: V3; esc?: number; rotY?: number}> = ({pos, esc = 1, rotY = 0}) => (
  <group position={pos} scale={esc} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0, 0]} tam={[1.6, 1.8, 1.6]} cor="#d9b45a" />
    <Caixa pos={[0, 0, 0.81]} tam={[1.2, 1.2, 0.02]} cor="#c9a24a" sombra={false} />
    {[-1, 1].map((s) => (
      <group key={s}>
        <Cil pos={[s * 1.4, 0, 0]} rot={[0, 0, Math.PI / 2]} r={0.06} h={1.2} cor="#9aa0aa" />
        <Caixa pos={[s * 4.2, 0, 0]} tam={[4.6, 0.06, 1.7]} cor="#2f5fb0" />
        {[-1.5, -0.5, 0.5, 1.5].map((x) => (<Caixa key={x} pos={[s * 4.2 + x, 0.035, 0]} tam={[0.04, 0.01, 1.7]} cor="#c9d6ee" sombra={false} />))}
      </group>
    ))}
    {/* antena virada para a Terra */}
    <mesh position={[0, -1.25, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.95, 0.5, 24, 1, true]} /><meshStandardMaterial color="#eef0f4" side={2} /></mesh>
    <Cil pos={[0, -1.0, 0]} r={0.05} h={0.5} cor="#9aa0aa" />
  </group>
);

// ---------- navio de busca (~78 m) e drone submarino (~6 m) ----------
export const Navio: React.FC<{pos: V3; rotY?: number; t: number}> = ({pos, rotY = 0, t}) => {
  const bal = Math.sin(t * 1.3) * 0.02;
  return (
    <group position={pos} rotation={[bal, rotY, bal * 0.5]}>
      {/* casco */}
      <Caixa pos={[0, -1.5, 0]} tam={[68, 7, 16]} cor="#d63a2b" />
      <mesh position={[37, -1.5, 0]} rotation={[0, 0, 0]}><cylinderGeometry args={[8, 8, 7, 3, 1, false, Math.PI / 2 - Math.PI / 3, (Math.PI * 2) / 3]} /><Mat cor="#d63a2b" /></mesh>
      <Caixa pos={[0, -4.6, 0]} tam={[68, 0.8, 15.6]} cor="#1d1b26" />
      <Caixa pos={[0, 2.15, 0]} tam={[70, 0.3, 16.2]} cor="#f2f2f2" />
      {/* superestrutura e ponte */}
      <Caixa pos={[18, 6.5, 0]} tam={[16, 8.4, 13]} cor="#f4f5f7" />
      <Caixa pos={[21, 12, 0]} tam={[10, 2.6, 14]} cor="#f4f5f7" />
      {[-5, -2.5, 0, 2.5, 5].map((z) => (<Caixa key={z} pos={[26.05, 12, z]} tam={[0.1, 1.2, 1.8]} cor="#1d2233" sombra={false} />))}
      <Cil pos={[16, 16, 0]} r={0.3} h={6} cor="#e3e6ec" />
      <mesh position={[16, 19.2, 0]}><sphereGeometry args={[1.1, 20, 14]} /><Mat cor="#ffffff" /></mesh>
      {/* convés de popa com guindaste (pórtico) e o drone pronto */}
      <group position={[-28, 2.3, 0]}>
        {[-6, 6].map((z) => (<Caixa key={z} pos={[0, 5, z]} tam={[1, 10, 1]} cor="#ff8a1f" />))}
        <Caixa pos={[0, 10, 0]} tam={[1.2, 1.2, 13]} cor="#ff8a1f" />
      </group>
      {[-15, -10, -5].map((x) => (<Caixa key={x} pos={[x, 3.6, 4]} tam={[4, 2.6, 2.6]} cor={x === -10 ? '#2f5fb0' : '#f2c14e'} />))}
    </group>
  );
};

export const Drone: React.FC<{pos: V3; rotY?: number; t: number; sonar?: number}> = ({pos, rotY = 0, t, sonar = 1}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow><capsuleGeometry args={[0.45, 5, 6, 16]} /><Mat cor="#ffd23f" rugoso={0.5} /></mesh>
    <mesh position={[-3.0, 0, 0]} rotation={[t * 8, 0, 0]}><boxGeometry args={[0.08, 0.9, 0.12]} /><Mat cor="#1d1b26" /></mesh>
    {[-1, 1].map((s) => (<Caixa key={s} pos={[-2.4, 0, s * 0.55]} tam={[0.6, 0.06, 0.5]} cor="#ff8a1f" />))}
    <Caixa pos={[-2.4, 0.55, 0]} tam={[0.6, 0.5, 0.06]} cor="#ff8a1f" />
    {/* leque do sonar varrendo o fundo para os dois lados */}
    {sonar > 0 && [-1, 1].map((s) => (
      <mesh key={s} position={[0, -0.2, 0]} rotation={[s * (Math.PI / 2 + 0.55), 0, 0]}>
        <coneGeometry args={[9, 18, 3, 1, true]} />
        <meshBasicMaterial color="#6fffd0" transparent opacity={(0.14 + 0.08 * Math.sin(t * 6)) * sonar} side={2} depthWrite={false} />
      </mesh>
    ))}
  </group>
);

// ---------- flaperon (pedaço da asa achado na Reunião: ~2,5 m × 1 m) ----------
export const Flaperon: React.FC<{pos: V3; rot?: V3}> = ({pos, rot = [0, 0, 0]}) => {
  const geo = useMemo(() => trapezio([[0, 0], [2.5, 0], [2.4, 0.9], [0.15, 1.05]], 0.22), []);
  const cracas = useMemo(() => {
    const r = rnd(5);
    return Array.from({length: 40}).map(() => [0.1 + r() * 2.3, 0.1 + r() * 0.8, 0.025 + r() * 0.025] as V3);
  }, []);
  return (
    <group position={pos} rotation={rot}>
      <group rotation={[-Math.PI / 2, 0, 0]} position={[-1.25, 0, 0.5]}>
        <mesh geometry={geo} castShadow receiveShadow><Mat cor="#eef0f2" /></mesh>
        {/* borda quebrada e cracas (bichinhos do mar) */}
        <Caixa pos={[0.05, 0.55, 0.11]} tam={[0.1, 1.0, 0.24]} cor="#8a8f96" />
        {cracas.map(([x, y, r], i) => (<mesh key={i} position={[x, y, 0.23]}><sphereGeometry args={[r, 20, 14]} /><Mat cor={i % 3 ? '#b8ad95' : '#8f8672'} /></mesh>))}
      </group>
    </group>
  );
};

// ---------- vela acesa ----------
export const Vela: React.FC<{pos: V3; t: number; h?: number}> = ({pos, t, h = 0.16}) => (
  <group position={pos}>
    <Cil pos={[0, h / 2, 0]} r={0.035} h={h} cor="#f4efe2" seg={8} />
    <mesh position={[0, h + 0.04, 0]} scale={[1, 1 + Math.sin(t * 13 + pos[0] * 7) * 0.15, 1]}><coneGeometry args={[0.018, 0.07, 24]} /><meshStandardMaterial color="#ffb347" emissive="#ff8a1f" emissiveIntensity={1.6} /></mesh>
  </group>
);

// ---------- palmeira ----------
export const Palmeira: React.FC<{pos: V3; esc?: number; inc?: number}> = ({pos, esc = 1, inc = 0.15}) => (
  <group position={pos} scale={esc} rotation={[0, 0, inc]}>
    <Cil pos={[0, 3, 0]} r={0.16} r2={0.24} h={6} cor="#8b6a45" seg={6} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <mesh key={i} position={[Math.cos(i * 1.05) * 1.1, 5.8, Math.sin(i * 1.05) * 1.1]} rotation={[Math.sin(i * 1.05) * 0.6, -i * 1.05, -Math.cos(i * 1.05) * 0.6]} castShadow>
        <boxGeometry args={[2.4, 0.05, 0.6]} />
        <Mat cor={i % 2 ? '#3f9b5a' : '#4fae64'} />
      </mesh>
    ))}
  </group>
);
