// ZÉ 2.0 de produção (aprovado pelo Fernando em 12/11/2026, ver lab/antes-depois.png).
// Substitui o Boneco low-poly em TODOS os motores: mesma interface (pos, rotY, acao, t, v, esc, ferramenta),
// mesma altura (~1,7 m com esc 0,92) e as mesmas roupas/peças de época do Boneco antigo.
// Novidades: EXPRESSÕES (feliz, sério, medo, triste, surpreso), mãos que seguram objetos de verdade
// (encaixes maoD / maoE / frente), pose sentada com coxa no assento e canela para baixo, joelho e cotovelo.
//
// Encaixes (slots): o conteúdo usa a MESMA escala de antes (as medidas que as peças tinham sobre o Boneco),
// e fica preso à parte do corpo, acompanhando o movimento:
//   maoD / maoE: na palma (y do objeto = ao longo do antebraço, +z = para a frente do punho fechado)
//   frente: entre as duas mãos na pose 'carrega' (prancheta, caixa, pote)
//   peito / costas: na superfície do peito / das costas (mochila, paraquedas, crachá)
//   topo: no alto da cabeça (chapéus de cena)
import React, {createContext, useContext} from 'react';
import * as THREE from 'three';
import {MBrilho, MN, QUAL, V3, geoArred} from './visual';

export type AcaoBoneco = 'parado' | 'anda' | 'aponta' | 'acena' | 'comemora' | 'cava' | 'martela' | 'pinta' | 'carrega' | 'senta' | 'fala';
// 'normal' (sorriso calmo), 'bravo' (rabugento: sobrancelha franzida, boca torta), 'espanto' (olhão e boca de O), 'ri' (gargalhada, olhos apertados)
export type Expressao = 'feliz' | 'serio' | 'medo' | 'triste' | 'surpreso' | 'normal' | 'bravo' | 'espanto' | 'ri';
export type Ferramenta = 'pa' | 'rolo' | 'colher' | 'planta' | 'bloco' | 'martelo' | 'gladio' | 'rudis' | 'tridente' | 'chicote' | 'tocha' | 'taca' | 'bengala' | null;
export type Visual = {
  camisa?: string; colete?: string | null; capacete?: string | null; calca?: string; pele?: string; cabelo?: string; chef?: boolean;
  // peças de época (Você na História)
  elmo?: {cor: string; penacho?: string}; escudo?: string; toga?: string; coroa?: string;
  // Como Ficou Rico: cartola (cor da copa) e gravata (com gravata e camisa escura vira terno com lapela)
  cartola?: string; gravata?: string;
  // boné de pano (cor)
  bone?: string;
  // novos (Zé 2.0)
  expressao?: Expressao;
  cabeloTipo?: 'curto' | 'longo' | 'coque';
  tunica?: boolean; // saia da túnica romana na cor da camisa + cinto
  saia?: string; // saia (uniforme)
  chapeu?: {tipo: 'fedora' | 'quepe' | 'comissaria'; cor: string; fita?: string};
  gola?: string; // gola de sobretudo
  oculos?: 'escuro' | 'grau';
  mic?: boolean; // microfone de lapela
  suspensorio?: string;
  travesseiro?: boolean; // travesseiro amarrado na cabeça (Pompeia)
  sapato?: string;
  // senhor de idade (Seu Tostão): careca com coroa de cabelo branco, bigode, sobrancelhas grossas, óculos redondos,
  // rugas, nariz maior, postura curvada e manga comprida (camisa vira cardigã sobre camisa social branca)
  vovo?: boolean;
};
export const CHEF: Visual = {camisa: '#ffffff', colete: null, capacete: null, calca: '#2b2233', chef: true};
export const OBREIRO: Visual = {camisa: '#4f8cff', colete: '#ff8a1f', capacete: '#ffd23f', calca: '#30406b'};
export const SERVENTE: Visual = {camisa: '#e9e4d8', colete: null, capacete: '#ffffff', calca: '#5b4a3a', pele: '#c98e62'};
export const ENGENHEIRA: Visual = {camisa: '#ffffff', colete: '#2fbf71', capacete: '#ffffff', calca: '#2b2b3a', pele: '#8d5a3b', cabelo: '#1d1b26', cabeloTipo: 'coque'};
export const MORADOR: Visual = {camisa: '#ff5d73', colete: null, capacete: null, calca: '#2f5d8a', cabelo: '#3b2a20'};
export const CRIANCA: Visual = {camisa: '#ffd23f', colete: null, capacete: null, calca: '#4f8cff', cabelo: '#6b3e26'};

// o Zé 2.0 nasceu com esc 1,08 no lab; o Boneco antigo usava 0,92 para a mesma altura
export const K_ZE = 1.08 / 0.92;
const IK = 1 / K_ZE;

const tom = (hex: string, k: number) => {
  const c = new THREE.Color(hex);
  return '#' + (k >= 0 ? c.lerp(new THREE.Color('#ffffff'), k) : c.lerp(new THREE.Color('#000000'), -k)).getHexString();
};
const lum = (hex: string) => {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
};

const Sup: React.FC<{lat: number; lon: number; r: number; children: React.ReactNode}> = ({lat, lon, r, children}) => (
  <group rotation={[-lat, lon, 0, 'YXZ']}>
    <group position={[0, 0, r]}>{children}</group>
  </group>
);

const Esf: React.FC<{r?: number; pos?: V3; esc?: V3; rot?: V3; seg?: number; fixo?: boolean; sombra?: boolean; children: React.ReactNode}> = ({r = 1, pos, esc, rot, seg = 32, fixo, sombra = true, children}) => {
  const k = fixo ? 1 : QUAL.seg;
  return (
    <mesh position={pos} scale={esc} rotation={rot} castShadow={sombra}>
      <sphereGeometry args={[r, Math.max(10, Math.round(seg * k)), Math.max(8, Math.round(seg * 0.66 * k))]} />
      {children}
    </mesh>
  );
};

const Cap: React.FC<{r: number; len: number; pos?: V3; rot?: V3; esc?: V3; sombra?: boolean; children: React.ReactNode}> = ({r, len, pos, rot, esc, sombra = true, children}) => (
  <mesh position={pos} rotation={rot} scale={esc} castShadow={sombra}>
    <capsuleGeometry args={[r, len, Math.max(3, Math.round(10 * QUAL.seg)), Math.max(10, Math.round(28 * QUAL.seg))]} />
    {children}
  </mesh>
);

const latheCache = new Map<string, THREE.LatheGeometry>();
const Lathe: React.FC<{pts: [number, number][]; pos?: V3; esc?: V3; rot?: V3; lado?: THREE.Side; sombra?: boolean; children: React.ReactNode}> = ({pts, pos, esc, rot, sombra = true, children}) => {
  const k = JSON.stringify(pts);
  let g = latheCache.get(k);
  if (!g) {
    g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 40);
    latheCache.set(k, g);
  }
  return (
    <mesh geometry={g} position={pos} scale={esc} rotation={rot} castShadow={sombra} receiveShadow>
      {children}
    </mesh>
  );
};

// cilindro e caixa lisos para as ferramentas (medidas na escala antiga do Boneco)
const Cl: React.FC<{pos?: V3; rot?: V3; r: number; r2?: number; h: number; cor: string; rug?: number; metal?: number}> = ({pos, rot, r, r2, h, cor, rug = 0.6, metal = 0}) => (
  <mesh position={pos} rotation={rot} castShadow>
    <cylinderGeometry args={[r, r2 ?? r, h, 20]} />
    <MN cor={cor} r={rug} metal={metal} />
  </mesh>
);
const Cx: React.FC<{pos?: V3; rot?: V3; tam: V3; cor: string; rug?: number; metal?: number; raio?: number}> = ({pos, rot, tam, cor, rug = 0.6, metal = 0, raio}) => (
  <mesh position={pos} rotation={rot} castShadow geometry={geoArred(tam[0], tam[1], tam[2], raio ?? Math.min(0.012, Math.min(...tam) * 0.3), 2)}>
    <MN cor={cor} r={rug} metal={metal} />
  </mesh>
);

// ---------- ferramentas na mão direita (y = ao longo do antebraço, +z = para a frente do punho) ----------
// chao: distância do punho ao chão (só a bengala usa; o Boneco já entrega o objeto no prumo)
const FerramentaNaMao: React.FC<{f: Ferramenta; t: number; chao?: number}> = ({f, t, chao = 0.5}) => {
  const MAD = '#8b5a3c';
  if (f === 'bengala') {
    // bengala de madeira envernizada: cabo curvo (gancho para a frente), anel de latão e ponteira de borracha
    const R = 0.052;
    const z0 = -0.03;
    const L = Math.max(0.2, chao - 0.012);
    const BEN = '#7a4526';
    return (
      <group>
        <Cl pos={[0, -L / 2, z0]} r={0.016} r2={0.019} h={L} cor={BEN} rug={0.32} />
        <mesh position={[0, 0, z0 + R]} rotation={[0, -Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[R, 0.019, 14, 32, Math.PI]} />
          <MN cor={BEN} r={0.32} />
        </mesh>
        <Esf r={0.019} pos={[0, 0, z0]} seg={16} sombra={false}><MN cor={BEN} r={0.32} /></Esf>
        <Esf r={1} pos={[0, -0.006, z0 + 2 * R]} esc={[0.021, 0.026, 0.021]} seg={16} sombra={false}><MN cor={tom(BEN, -0.15)} r={0.32} /></Esf>
        <Cl pos={[0, -0.03, z0]} r={0.021} h={0.022} cor="#c9a24a" rug={0.3} metal={0.75} />
        <Cl pos={[0, -L + 0.025, z0]} r={0.021} r2={0.023} h={0.05} cor="#26232a" rug={0.8} />
      </group>
    );
  }
  if (f === 'pa')
    return (
      <group position={[0, 0, 0.02]} rotation={[0.25, 0, 0]}>
        <Cl pos={[0, -0.1, 0]} r={0.02} h={1.0} cor={MAD} />
        <Cl pos={[0, 0.42, 0]} rot={[0, 0, Math.PI / 2]} r={0.022} h={0.14} cor="#2b2b30" />
        <Cx pos={[0, -0.66, 0.02]} rot={[0.15, 0, 0]} tam={[0.22, 0.28, 0.025]} cor="#8a929c" rug={0.4} metal={0.6} />
      </group>
    );
  if (f === 'rolo')
    return (
      <group>
        <Cl pos={[0, 0, 0]} r={0.022} h={0.14} cor="#e8402f" />
        <Cl pos={[0, 0.25, 0]} r={0.012} h={0.38} cor="#c9ced6" metal={0.6} rug={0.35} />
        <Cl pos={[0, 0.46, 0]} rot={[0, 0, Math.PI / 2]} r={0.055} h={0.24} cor="#f2f2f2" rug={0.95} />
      </group>
    );
  if (f === 'colher')
    return (
      <group position={[0, 0, 0.02]}>
        <Cl rot={[Math.PI / 2, 0, 0]} pos={[0, 0, 0]} r={0.022} h={0.11} cor={MAD} />
        <Cx pos={[0, -0.02, 0.13]} rot={[0.2, 0, 0]} tam={[0.12, 0.012, 0.16]} cor="#9aa0aa" rug={0.35} metal={0.7} />
      </group>
    );
  if (f === 'martelo')
    return (
      <group>
        <Cl pos={[0, 0, 0.1]} rot={[Math.PI / 2, 0, 0]} r={0.017} h={0.32} cor={MAD} />
        <Cx pos={[0, 0, 0.26]} tam={[0.13, 0.05, 0.05]} cor="#5a5d63" rug={0.35} metal={0.7} />
      </group>
    );
  if (f === 'bloco') return <Cx pos={[0, -0.05, 0.12]} tam={[0.29, 0.19, 0.14]} cor="#d9773e" rug={0.9} />;
  if (f === 'gladio' || f === 'rudis') {
    const lam = f === 'gladio' ? '#d7dde6' : '#a8743f';
    return (
      <group>
        <Cl pos={[0, 0, 0.02]} rot={[Math.PI / 2, 0, 0]} r={0.025} h={0.14} cor="#6b3e26" />
        <Cx pos={[0, 0, 0.1]} tam={[0.14, 0.03, 0.03]} cor="#c9a24a" rug={0.35} metal={0.7} />
        <Cx pos={[0, 0, 0.4]} tam={[0.06, 0.018, 0.56]} cor={lam} rug={f === 'gladio' ? 0.25 : 0.8} metal={f === 'gladio' ? 0.8 : 0} />
      </group>
    );
  }
  if (f === 'tridente')
    return (
      <group>
        <Cl pos={[0, 0.3, 0]} r={0.018} h={1.9} cor={MAD} />
        {[-0.08, 0, 0.08].map((x) => (
          <Cx key={x} pos={[x, 1.32, 0]} tam={[0.02, 0.22, 0.02]} cor="#c9ced6" rug={0.3} metal={0.8} />
        ))}
        <Cx pos={[0, 1.22, 0]} tam={[0.2, 0.02, 0.02]} cor="#c9ced6" rug={0.3} metal={0.8} />
      </group>
    );
  if (f === 'chicote')
    return (
      <group>
        <Cl pos={[0, 0, 0.08]} rot={[Math.PI / 2, 0, 0]} r={0.02} h={0.22} cor="#4a3426" />
        {[0, 1, 2, 3].map((i) => {
          const a: V3 = [0, -i * 0.12 + Math.sin(t * 6 + i) * 0.03, 0.19 + i * 0.12];
          const b: V3 = [0, -(i + 1) * 0.12 + Math.sin(t * 6 + i + 1) * 0.03, 0.19 + (i + 1) * 0.12];
          const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
          return (
            <mesh key={i} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} quaternion={q}>
              <cylinderGeometry args={[0.011, 0.011, d.length(), 8]} />
              <MN cor="#3b2a20" r={0.6} />
            </mesh>
          );
        })}
      </group>
    );
  if (f === 'tocha')
    return (
      <group>
        <Cl pos={[0, 0.2, 0]} r={0.025} r2={0.03} h={0.5} cor="#6b3e26" rug={0.9} />
        <mesh position={[0, 0.52, 0]} scale={[1, 1 + Math.sin(t * 14) * 0.12, 1]}>
          <coneGeometry args={[0.07, 0.24, 16]} />
          <meshStandardMaterial color="#ffb03a" emissive="#ff6a00" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      </group>
    );
  if (f === 'taca')
    return (
      <group position={[0, -0.03, 0.06]}>
        <Cl pos={[0, 0.06, 0]} r={0.06} r2={0.04} h={0.12} cor="#9a8f80" rug={0.35} metal={0.5} />
        <Cl pos={[0, 0.115, 0]} r={0.05} h={0.01} cor="#6f2a3a" />
      </group>
    );
  if (f === 'planta')
    return (
      <group position={[0, -0.02, 0.14]} rotation={[-0.6, 0, 0]}>
        <Cx tam={[0.5, 0.35, 0.008]} cor="#2f6fd6" rug={0.8} raio={0.003} />
        {[-0.1, 0, 0.1].map((y) => (
          <mesh key={y} position={[0, y, 0.005]}>
            <planeGeometry args={[0.38, 0.006]} />
            <meshBasicMaterial color="#cfe0ff" />
          </mesh>
        ))}
      </group>
    );
  return null;
};

// remendo colado na frente do tronco (segue o perfil do Lathe do peito, achatado 0,86 em z):
// faixa entre x = esq(y) e x = dir(y), de y0 a y1, afastada `off` da superfície. Usado no cardigã do vovô.
const PERFIL_PEITO: [number, number][] = [[0.17, 0.02], [0.197, 0.06], [0.208, 0.15], [0.203, 0.26], [0.19, 0.34], [0.155, 0.4], [0.095, 0.435], [0.001, 0.445]];
const raioPeito = (y: number) => {
  for (let i = 0; i < PERFIL_PEITO.length - 1; i++) {
    const [r0, a] = PERFIL_PEITO[i];
    const [r1, b] = PERFIL_PEITO[i + 1];
    if (y <= b) return r0 + (r1 - r0) * Math.max(0, (y - a) / (b - a));
  }
  return 0.001;
};
const remendoCache = new Map<string, THREE.BufferGeometry>();
const remendo = (k: string, y0: number, y1: number, esq: (y: number) => number, dir: (y: number) => number, off: number) => {
  let g = remendoCache.get(k);
  if (g) return g;
  const N = 14;
  const M = 8;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const y = y0 + ((y1 - y0) * i) / N;
    const r = raioPeito(y);
    for (let j = 0; j <= M; j++) {
      const x = esq(y) + ((dir(y) - esq(y)) * j) / M;
      const z = 0.86 * Math.sqrt(Math.max(0, r * r - x * x)) + off;
      pos.push(x, y, z);
    }
  }
  for (let i = 0; i < N; i++)
    for (let j = 0; j < M; j++) {
      const a = i * (M + 1) + j;
      const b = a + M + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  remendoCache.set(k, g);
  return g;
};
// decote em V: ponta em y 0,215, topo (0,43) com meia largura 0,085; faixas de tricô de 0,035 nas bordas
const V0 = 0.215;
const V1 = 0.43;
const meiaV = (y: number) => 0.085 * Math.max(0, (y - V0) / (V1 - V0));
const peitoCamisa = () => remendo('camisa', V0, V1, (y) => -meiaV(y), (y) => meiaV(y), 0.004);
const peitoFaixa = (s: 1 | -1) =>
  remendo('faixa' + s, V0 - 0.01, V1 - 0.005, (y) => (s > 0 ? meiaV(y) - 0.004 : -meiaV(y) - 0.036), (y) => (s > 0 ? meiaV(y) + 0.036 : -meiaV(y) + 0.004), 0.009);
const peitoFecho = () => remendo('fecho', 0.07, V0 + 0.005, () => -0.02, () => 0.02, 0.009);

// ---------- mão de luva de desenho: palma, dedos juntos, polegar (ou indicador esticado, ou punho que segura) ----------
const Mao: React.FC<{pele: string; lado: 1 | -1; aponta?: boolean; segura?: boolean; simples?: boolean}> = ({pele, lado, aponta, segura, simples}) => (
  <group>
    <Esf r={1} esc={[0.052, 0.058, 0.042]}><MN cor={pele} r={0.55} /></Esf>
    {aponta ? (
      <>
        <Esf r={1} pos={[0, -0.045, 0.004]} esc={[0.044, 0.036, 0.04]}><MN cor={pele} r={0.55} /></Esf>
        <Cap r={0.016} len={0.06} pos={[0, -0.085, 0.012]}><MN cor={pele} r={0.55} /></Cap>
      </>
    ) : segura ? (
      // dedos dobrados por cima do cabo (punho fechado)
      <Esf r={1} pos={[0, -0.042, 0.03]} rot={[0.5, 0, 0]} esc={[0.05, 0.04, 0.046]}><MN cor={pele} r={0.55} /></Esf>
    ) : (
      <Esf r={1} pos={[0, -0.05, 0.002]} esc={[0.05, 0.045, 0.04]}><MN cor={pele} r={0.55} /></Esf>
    )}
    {!simples && <Cap r={0.018} len={0.035} pos={[-lado * 0.03, -0.015, 0.03]} rot={[0.9, 0, lado * 0.5]} sombra={false}><MN cor={pele} r={0.55} /></Cap>}
  </group>
);

type Braco = {x: number; abre: number; cot: number; cotZ?: number; aponta?: boolean};

// expressões: boca, sobrancelha (altura e inclinação: + = ponta de dentro sobe), olho, pálpebra
// abre: abertura mínima da boca (riso); olhoY: olho apertado (riso)
const EXPR: Record<Expressao, {boca: 'sorriso' | 'reta' | 'o' | 'triste' | 'torta'; sobr: number; inc: number; olho: number; pup: number; palp: number; palpRot: number; boch: number; abre?: number; olhoY?: number}> = {
  feliz: {boca: 'sorriso', sobr: 0, inc: 0, olho: 1, pup: 1, palp: 0, palpRot: 0, boch: 1},
  serio: {boca: 'reta', sobr: -0.04, inc: -0.14, olho: 1, pup: 1, palp: 0.24, palpRot: 0, boch: 0},
  medo: {boca: 'o', sobr: 0.0, inc: 0.42, olho: 1.12, pup: 0.68, palp: 0, palpRot: 0, boch: 0},
  triste: {boca: 'triste', sobr: -0.03, inc: 0.45, olho: 0.96, pup: 1, palp: 0.28, palpRot: -0.3, boch: 0},
  surpreso: {boca: 'o', sobr: 0.02, inc: 0.05, olho: 1.14, pup: 0.75, palp: 0, palpRot: 0, boch: 0.6},
  normal: {boca: 'sorriso', sobr: 0, inc: 0.04, olho: 1, pup: 1, palp: 0.14, palpRot: 0, boch: 0.35},
  bravo: {boca: 'torta', sobr: -0.07, inc: -0.42, olho: 0.96, pup: 0.95, palp: 0.32, palpRot: 0.28, boch: 0},
  espanto: {boca: 'o', sobr: 0.06, inc: 0.18, olho: 1.22, pup: 0.6, palp: 0, palpRot: 0, boch: 0},
  ri: {boca: 'sorriso', sobr: 0.03, inc: 0.12, olho: 1, pup: 1, palp: 0, palpRot: 0, boch: 1.15, abre: 0.75, olhoY: 0.42},
};

// clima da cena: expressão padrão de todo mundo no set (ex.: 'medo' com o fluxo piroclástico chegando).
// Os motores envolvem o render do set com <ClimaZe.Provider value={set.clima}>. A prop expressao vence.
export const ClimaZe = createContext<Expressao | undefined>(undefined);

export type ZeProps = {
  pos: V3;
  rotY?: number;
  acao?: AcaoBoneco;
  t: number;
  v?: Visual;
  esc?: number;
  ferramenta?: Ferramenta;
  expressao?: Expressao;
  maoD?: React.ReactNode;
  maoE?: React.ReactNode;
  frente?: React.ReactNode;
  peito?: React.ReactNode;
  costas?: React.ReactNode;
  topo?: React.ReactNode;
  simples?: boolean; // figurante distante: menos peças (mesma silhueta)
  pegada?: 'frente' | 'lado'; // objeto da mão: antebraço dobrado para a frente (padrão) ou braço caído ao lado (mala, sacola)
};

export const Boneco: React.FC<ZeProps> = ({pos, rotY = 0, acao = 'parado', t, v = OBREIRO, esc = 0.92, ferramenta = null, expressao, maoD, maoE, frente, peito, costas, topo, simples = false, pegada = 'frente'}) => {
  const vovo = !!v.vovo;
  const {camisa = '#4f8cff', colete = null, capacete = null, calca = '#30406b', pele = '#ffd2ad', cabelo = vovo ? '#eeece6' : '#3b2a20', chef = false, elmo, escudo, toga, coroa, cartola, gravata, bone} = v;
  const oculos = v.oculos ?? (vovo ? 'grau' : undefined);
  const clima = useContext(ClimaZe);
  const nomeEx: Expressao = expressao ?? v.expressao ?? clima ?? 'feliz';
  const ex = EXPR[nomeEx];
  const H = 0.4;
  const resp = Math.sin(t * 2.4) * 0.01;
  const senta = acao === 'senta';
  const dyPose = senta ? -0.2 : 0;
  const pernaNua = calca.toLowerCase() === pele.toLowerCase();
  const terno = !vovo && !!gravata && lum(camisa) < 0.45; // vovô de gravata usa cardigã, não terno
  const mangaLonga = terno || vovo; // vovô: cardigã de manga comprida (punho da camisa branca aparecendo)
  const bengala = ferramenta === 'bengala';
  const segD = !!ferramenta || !!maoD;
  const segE = !!maoE;

  // ---------- pose ----------
  let passo = 0;
  let pulo = 0;
  let tronco = 0;
  let giro = 0;
  let cab: V3 = [0, 0, 0];
  let boca = 0.15;
  let sobr = 0;
  let D: Braco = {x: 0.06 + Math.sin(t * 1.3) * 0.03, abre: 0.14, cot: -0.25};
  let E: Braco = {x: 0.06 + Math.sin(t * 1.3 + 1) * 0.03, abre: 0.14, cot: -0.25};
  if (segD && acao === 'parado') D = pegada === 'lado' ? {x: 0.02, abre: 0.2, cot: -0.08} : {x: -0.15, abre: 0.16, cot: -0.75};
  if (segE && acao === 'parado') E = pegada === 'lado' ? {x: 0.02, abre: 0.2, cot: -0.08} : {x: -0.15, abre: 0.16, cot: -0.75};
  if (acao === 'anda') {
    passo = Math.sin(t * 9) * 0.55;
    pulo = Math.abs(Math.sin(t * 9)) * 0.035;
    D = {x: -passo * (pegada === 'lado' && segD ? 0.3 : 0.8), abre: 0.12, cot: segD ? (pegada === 'lado' ? -0.1 : -0.8) : -0.45};
    E = {x: passo * (pegada === 'lado' && segE ? 0.3 : 0.8), abre: 0.12, cot: segE ? (pegada === 'lado' ? -0.1 : -0.8) : -0.45};
    tronco = 0.06;
  }
  if (acao === 'fala') {
    const fala = 0.6 + 0.4 * Math.sin(t * 3.7);
    boca = 0.2 + 0.8 * Math.abs(Math.sin(t * 10.5)) * fala;
    D = {x: -0.42 + 0.2 * Math.sin(t * 3.3), abre: 0.4 + 0.1 * Math.sin(t * 2.1), cot: -0.95 + 0.3 * Math.sin(t * 4.1 + 0.6), cotZ: -0.35 + 0.2 * Math.sin(t * 2.9)};
    E = {x: -0.28 + 0.15 * Math.sin(t * 2.7 + 1.9), abre: 0.36, cot: -0.75 + 0.25 * Math.sin(t * 3.6 + 2.2), cotZ: 0.3};
    cab = [0.05 * Math.sin(t * 3.1), 0.12 * Math.sin(t * 1.3), 0.07 * Math.sin(t * 1.7)];
    sobr = 0.5 + 0.5 * Math.sin(t * 2.3);
    giro = 0.05 * Math.sin(t * 1.6);
  }
  if (acao === 'aponta') {
    D = {x: -1.38, abre: 0.2, cot: -0.1, aponta: !segD};
    E = {x: 0.1, abre: 0.25, cot: -0.5};
    cab = [0, -0.25, 0.04];
    boca = 0.45;
    sobr = 0.8;
  }
  if (acao === 'acena') {
    D = {x: 0, abre: 2.45, cot: -0.15, cotZ: 0.45 * Math.sin(t * 10)};
    cab = [0, 0, 0.1];
    boca = 0.6;
    sobr = 1;
  }
  if (acao === 'comemora') {
    pulo = Math.abs(Math.sin(t * 6)) * 0.3;
    D = {x: 0, abre: 2.6, cot: -0.3};
    E = {x: 0, abre: 2.6, cot: -0.3};
    boca = 1;
    sobr = 1;
  }
  if (acao === 'cava') {
    const k = (Math.sin(t * 5) + 1) / 2;
    D = {x: -0.35 - k * 0.8, abre: -0.22, cot: -0.35};
    E = {x: -0.65 - k * 0.8, abre: -0.3, cot: -0.55};
    tronco = 0.15 + k * 0.3;
  }
  if (acao === 'martela') {
    const k = Math.abs(Math.sin(t * 8));
    D = {x: -0.75 - k * 1.1, abre: 0.15, cot: -1.0 + k * 0.45};
    E = {x: -0.45, abre: 0.2, cot: -0.9};
    tronco = 0.1;
  }
  if (acao === 'pinta') {
    D = {x: -2.4 + Math.sin(t * 4) * 0.5, abre: 0.25, cot: -0.3};
    E = {x: -0.3, abre: 0.15, cot: -0.6};
  }
  if (acao === 'carrega') {
    D = {x: -0.9, abre: -0.15, cot: -0.7};
    E = {x: -0.9, abre: -0.15, cot: -0.7};
  }
  if (senta) {
    D = segD ? {x: -0.5, abre: 0.12, cot: -0.95} : {x: -0.42, abre: 0.1, cot: -0.8};
    E = segE ? {x: -0.5, abre: 0.12, cot: -0.95} : {x: -0.42, abre: 0.1, cot: -0.8};
  }
  // mala/pasta ao lado do corpo: o braço que segura fica caído (menos quando o próprio braço faz o gesto)
  if (pegada === 'lado' && !['comemora', 'carrega', 'senta', 'cava', 'martela', 'pinta'].includes(acao)) {
    const cai = {x: acao === 'anda' ? passo * 0.3 : 0.02, abre: 0.2, cot: -0.08};
    if (segE) E = {...cai, x: acao === 'anda' ? -cai.x : cai.x};
    if (segD && acao !== 'aponta' && acao !== 'acena') D = cai;
  }
  // escudo no braço esquerdo: antebraço na horizontal, atrás do escudo
  if (escudo && !senta && acao !== 'comemora') E = {x: -0.25, abre: 0.1, cot: -1.25};
  // bengala: braço direito meio estendido para a frente, apoiado (no 'fala' só a mão esquerda gesticula)
  if (bengala && !senta && ['parado', 'anda', 'fala'].includes(acao)) D = {x: -0.32 - (acao === 'anda' ? passo * 0.22 : 0), abre: 0.15, cot: -0.28};
  // vovô: costas levemente curvadas, cabeça compensando para olhar para a frente
  if (vovo && !senta) {
    tronco += 0.17;
    cab = [cab[0] - 0.14, cab[1], cab[2]];
  }
  // gargalhada: boca abre e fecha, cabeça balança
  if (nomeEx === 'ri' && acao !== 'fala') {
    boca = Math.max(boca, (ex.abre ?? 0.7) + 0.2 * Math.abs(Math.sin(t * 13)));
    cab = [cab[0] - 0.04 + 0.03 * Math.sin(t * 13), cab[1], cab[2]];
  }

  // bengala no prumo: desfaz a rotação acumulada (tronco, braço, antebraço) e mede a altura do punho até o chão
  const prumo = (() => {
    if (!bengala) return null;
    const eu = (x: number, y: number, z: number) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
    const qT = eu(tronco, giro, 0);
    const qA = qT.clone().multiply(eu(D.x, 0, D.abre));
    const qC = qA.clone().multiply(eu(D.cot, 0, D.cotZ ?? 0));
    const p = new THREE.Vector3(0, H + dyPose, 0)
      .add(new THREE.Vector3(0.205, 0.36, 0).applyQuaternion(qT))
      .add(new THREE.Vector3(0, -0.18, 0).applyQuaternion(qA))
      .add(new THREE.Vector3(0, -0.19 - 0.045, 0.02).applyQuaternion(qC));
    return {q: qC.clone().invert(), chao: p.y * K_ZE};
  })();

  const aro = vovo ? '#b8923a' : '#15151a'; // óculos do vovô: aro dourado fino
  const piscar = (t + 0.7) % 3.3 < 0.12 ? 0.12 : 1;
  const sombraTec = tom(camisa, -0.12);
  const dy = senta ? -0.2 : 0;

  // ---------- partes ----------
  const braco = (b: Braco, lado: 1 | -1, mao: React.ReactNode, q?: THREE.Quaternion) => (
    <group position={[lado * 0.205, 0.36, 0]} rotation={[b.x, 0, lado * b.abre]}>
      <Esf r={1} pos={[0, -0.02, 0]} esc={[0.075, 0.075, 0.075]}><MN cor={camisa} r={0.85} /></Esf>
      <Cap r={0.068} len={0.06} pos={[0, -0.075, 0]}><MN cor={camisa} r={0.85} /></Cap>
      {!mangaLonga && (
        <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.064, 0.012, 8, 24]} />
          <MN cor={sombraTec} r={0.85} />
        </mesh>
      )}
      {/* braço de terno / jaleco vai até o punho */}
      <Cap r={mangaLonga ? 0.058 : 0.05} len={0.07} pos={[0, -0.14, 0]}><MN cor={mangaLonga ? camisa : pele} r={mangaLonga ? 0.85 : 0.55} /></Cap>
      <group position={[0, -0.18, 0]} rotation={[b.cot, 0, lado * (b.cotZ ?? 0)]}>
        <Esf r={mangaLonga ? 0.058 : 0.05}><MN cor={mangaLonga ? camisa : pele} r={0.6} /></Esf>
        <Cap r={mangaLonga ? 0.055 : 0.047} len={0.1} pos={[0, -0.08, 0]}><MN cor={mangaLonga ? camisa : pele} r={mangaLonga ? 0.85 : 0.55} /></Cap>
        {vovo && (
          // punho de tricô do cardigã
          <mesh position={[0, -0.128, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.052, 0.014, 8, 20]} />
            <MN cor={tom(camisa, -0.1)} r={0.9} />
          </mesh>
        )}
        {mangaLonga && (
          <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.045, 0.012, 8, 20]} />
            <MN cor="#f4f4f4" r={0.6} />
          </mesh>
        )}
        <group position={[0, -0.19, 0]}>
          <Mao pele={pele} lado={lado} aponta={b.aponta} segura={!!mao} simples={simples} />
          {mao && (
            <group position={[0, -0.045, 0.02]}>
              <group {...(q ? {quaternion: q} : {})} scale={IK}>{mao}</group>
            </group>
          )}
        </group>
      </group>
    </group>
  );

  const corSapato = v.sapato ?? (pernaNua ? '#7a4f2e' : '#4a3426');
  const perna = (lado: 1 | -1, ang: number, joelho: number) => (
    <group position={[lado * 0.085, H - 0.02, 0]} rotation={[ang, 0, 0]}>
      <Cap r={0.072} len={0.06} pos={[0, -0.1, 0]}><MN cor={calca} r={pernaNua ? 0.55 : 0.85} /></Cap>
      <group position={[0, -0.19, 0]} rotation={[joelho, 0, 0]}>
        <Esf r={0.071} seg={20}><MN cor={calca} r={pernaNua ? 0.55 : 0.85} /></Esf>
        <Cap r={0.07} len={0.05} pos={[0, -0.055, 0]}><MN cor={calca} r={pernaNua ? 0.55 : 0.85} /></Cap>
        {!pernaNua && (
          <mesh position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.07, 0.014, 8, 24]} />
            <MN cor={tom(calca, -0.15)} r={0.85} />
          </mesh>
        )}
        {/* sapato: cabedal, biqueira, sola clara, cadarço (sandália quando a perna é de fora) */}
        <group position={[0, -0.13, 0.035]}>
          <Esf r={1} esc={[0.082, pernaNua ? 0.045 : 0.062, 0.128]}><MN cor={corSapato} r={0.5} /></Esf>
          {!pernaNua && <Esf r={1} pos={[0, -0.006, 0.07]} esc={[0.07, 0.045, 0.06]} sombra={false}><MN cor={tom(corSapato, 0.15)} r={0.45} /></Esf>}
          <Esf r={1} pos={[0, -0.042, 0.004]} esc={[0.088, 0.022, 0.135]}><MN cor={pernaNua ? '#5a3a22' : '#f6f1e8'} r={0.6} /></Esf>
          {!simples && !pernaNua &&
            [0.0, 0.035].map((z) => (
              <mesh key={z} position={[0, 0.052, z]} rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.008, 0.06, 3, 8]} />
                <MN cor="#f6f1e8" r={0.7} />
              </mesh>
            ))}
          {pernaNua && (
            <mesh position={[0, 0.06, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.062, 0.01, 6, 20]} />
              <MN cor="#5a3a22" r={0.6} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );

  // pernas: em pé (passo), sentado (coxa no assento, canela para baixo, balançando de leve)
  const balanca = Math.sin(t * 1.6) * 0.08;
  const pernaD = senta ? perna(1, -Math.PI / 2, Math.PI / 2 * 0.86 + balanca) : perna(1, -passo, Math.max(0, passo) * 0.5);
  const pernaE = senta ? perna(-1, -Math.PI / 2, Math.PI / 2 * 0.86 - balanca) : perna(-1, passo, Math.max(0, -passo) * 0.5);

  // olhos: tamanho e pupila mudam com a expressão
  const olhos = [-1, 1].map((s) => ex.olhoY ? (
    // gargalhada: olho fechado em arco (^ ^)
    <Sup key={'o' + s} lat={0.03} lon={s * 0.36} r={0.312}>
      <mesh position={[0, -0.03, 0]} rotation={[0, 0, Math.PI * 0.12]}>
        <torusGeometry args={[0.048, 0.013, 10, 24, Math.PI * 0.76]} />
        <MN cor="#2a1a14" r={0.5} />
      </mesh>
    </Sup>
  ) : (
    <Sup key={'o' + s} lat={0.03} lon={s * 0.36} r={0.285}>
      <group scale={[ex.olho, piscar * ex.olho, 1]}>
        <Esf r={1} esc={[0.066, 0.086, 0.04]} seg={24} fixo sombra={false}><MBrilho cor="#ffffff" r={0.15} /></Esf>
        <group scale={[ex.pup, ex.pup, 1]}>
          <Esf r={1} pos={[-s * 0.004, -0.008, 0.028]} esc={[0.046, 0.056, 0.02]} seg={20} fixo sombra={false}><MBrilho cor="#5a3a22" r={0.12} /></Esf>
          <Esf r={1} pos={[-s * 0.004, -0.01, 0.043]} esc={[0.028, 0.034, 0.01]} seg={20} sombra={false}><MBrilho cor="#120c0a" r={0.08} /></Esf>
        </group>
        <mesh position={[s * 0.012 - 0.002, 0.016, 0.052]}>
          <sphereGeometry args={[0.013, 12, 8]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        {!simples && (
          <mesh position={[-s * 0.018, -0.03, 0.05]}>
            <sphereGeometry args={[0.006, 8, 6]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        )}
        {/* pálpebra (sério / triste): calota da cor da pele sobre o alto do olho + linha dos cílios, inclinada */}
        {ex.palp > 0 && (() => {
          const yb = 1 - 2 * ex.palp;
          const th = Math.acos(yb);
          const w = Math.sqrt(1 - yb * yb);
          return (
            <group rotation={[0, 0, s * ex.palpRot]}>
              <mesh scale={[0.069, 0.09, 0.043]}>
                <sphereGeometry args={[1, 28, 10, 0, Math.PI * 2, 0, th]} />
                <MN cor={pele} r={0.5} />
              </mesh>
              <mesh position={[0, yb * 0.09, 0.043 * w * 0.98]} rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.007, 0.069 * w * 1.7, 3, 8]} />
                <MN cor="#2a1a14" r={0.6} />
              </mesh>
            </group>
          );
        })()}
      </group>
    </Sup>
  ));

  const sobrancelhas = [-1, 1].map((s) => (
    <Sup key={'s' + s} lat={0.375 + (vovo ? 0.045 : 0) + sobr * 0.02 + ex.sobr} lon={s * 0.36} r={0.317}>
      <group rotation={[0, 0, -s * ex.inc]}>
        <mesh position={[0, -0.04, 0]} rotation={[0, 0, Math.PI / 2 - 0.8 - s * 0.1 - (vovo ? 0.12 : 0)]} scale={vovo ? [1.08, 1.08, 1.25] : undefined}>
          <torusGeometry args={[0.05, vovo ? 0.024 : 0.014, 10, 20, vovo ? 1.85 : 1.6]} />
          <MN cor={cabelo} r={vovo ? 0.9 : 0.6} />
        </mesh>
        {vovo &&
          // tufos rebeldes na ponta de fora (sobrancelha de vô)
          [0, 1].map((i) => (
            <Esf key={i} r={1} pos={[s * (0.042 + i * 0.012), 0.0 - i * 0.012, 0.004]} rot={[0, 0, s * (0.5 + i * 0.4)]} esc={[0.03, 0.016, 0.016]} seg={14} sombra={false}>
              <MN cor={cabelo} r={0.9} />
            </Esf>
          ))}
      </group>
    </Sup>
  ));

  const fala = acao === 'fala' ? boca : 0;
  const bocaMesh = (() => {
    if (ex.boca === 'sorriso')
      return (
        <group rotation={[0.18, 0, 0]}>
          <mesh scale={[0.072 + boca * 0.012, 0.016 + boca * 0.05, 0.03]}>
            <sphereGeometry args={[1, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <MN cor="#5a1f2b" r={0.6} />
          </mesh>
          {boca > 0.3 && (
            <mesh position={[0, -0.012 - boca * 0.02, 0.006]} scale={[0.034, 0.014 + boca * 0.012, 0.02]}>
              <sphereGeometry args={[1, 16, 10]} />
              <MN cor="#ff7d86" r={0.5} />
            </mesh>
          )}
          <mesh position={[0, 0.001, 0.008]} scale={[0.068 + boca * 0.01, 0.008, 0.02]}>
            <sphereGeometry args={[1, 16, 8]} />
            <MN cor="#ffffff" r={0.3} />
          </mesh>
        </group>
      );
    if (ex.boca === 'reta')
      return fala > 0.25 ? (
        <mesh scale={[0.04, 0.008 + fala * 0.03, 0.02]}>
          <sphereGeometry args={[1, 20, 12]} />
          <MN cor="#5a1f2b" r={0.6} />
        </mesh>
      ) : (
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.004, 0]}>
          <capsuleGeometry args={[0.009, 0.06, 4, 12]} />
          <MN cor="#5a1f2b" r={0.6} />
        </mesh>
      );
    if (ex.boca === 'triste')
      return (
        <mesh position={[0, -0.018, 0]}>
          <torusGeometry args={[0.042, 0.01, 8, 20, Math.PI]} />
          <MN cor="#5a1f2b" r={0.6} />
        </mesh>
      );
    if (ex.boca === 'torta')
      // rabugento: canto direito caído, esquerdo meio levantado
      return fala > 0.25 ? (
        <mesh position={[0.008, -0.004, 0]} rotation={[0, 0, 0.22]} scale={[0.038, 0.008 + fala * 0.028, 0.02]}>
          <sphereGeometry args={[1, 20, 12]} />
          <MN cor="#5a1f2b" r={0.6} />
        </mesh>
      ) : (
        <group position={[0.006, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2 + 0.2]}>
            <capsuleGeometry args={[0.009, 0.05, 4, 12]} />
            <MN cor="#5a1f2b" r={0.6} />
          </mesh>
          <mesh position={[-0.033, -0.012, 0]} rotation={[0, 0, Math.PI / 2 - 0.55]}>
            <capsuleGeometry args={[0.008, 0.016, 4, 10]} />
            <MN cor="#5a1f2b" r={0.6} />
          </mesh>
        </group>
      );
    // 'o': boca aberta de susto / surpresa / espanto
    const medo = nomeEx === 'medo';
    const espanto = nomeEx === 'espanto';
    return (
      <group>
        <mesh scale={[medo ? 0.046 : espanto ? 0.038 : 0.032, (medo ? 0.03 : espanto ? 0.052 : 0.04) + fala * 0.015, 0.022]}>
          <sphereGeometry args={[1, 24, 14]} />
          <MN cor="#4a1622" r={0.6} />
        </mesh>
        {medo && (
          <mesh position={[0, 0.02, 0.008]} scale={[0.036, 0.007, 0.018]}>
            <sphereGeometry args={[1, 14, 6]} />
            <MN cor="#ffffff" r={0.3} />
          </mesh>
        )}
      </group>
    );
  })();

  // ---------- chapéus e cabelo ----------
  const cabeloCurto = (
    <group>
      <mesh rotation={[-0.45, 0, 0]} castShadow scale={[1.045, 1.0, 1.035]}>
        <sphereGeometry args={[0.332, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <MN cor={cabelo} r={0.55} />
      </mesh>
      {(simples
        ? [[0.68, -0.28, 0.11, 0.45], [0.68, 0.28, 0.11, 0.25], [0.95, 0.0, 0.12, 0.2]]
        : [
            [0.6, -0.55, 0.1, 0.55],
            [0.68, -0.28, 0.11, 0.45],
            [0.71, 0.0, 0.115, 0.35],
            [0.68, 0.28, 0.11, 0.25],
            [0.58, 0.55, 0.095, 0.15],
            [0.42, 0.85, 0.08, -0.3],
            [0.42, -0.85, 0.08, 0.3],
            [0.95, -0.2, 0.12, 0.2],
            [0.95, 0.35, 0.115, -0.1],
          ]
      ).map(([lat, lon, r, rz], i) => (
        <Sup key={i} lat={lat} lon={lon} r={0.282}>
          <Esf r={r} esc={[1.35, 0.62, 0.8]} rot={[0, 0, rz]} sombra={false}><MN cor={cabelo} r={0.55} /></Esf>
        </Sup>
      ))}
      {[-1, 1].map((s) => (
        <Sup key={s} lat={0.12} lon={s * 1.32} r={0.3}>
          <Esf r={1} esc={[0.05, 0.08, 0.035]} sombra={false}><MN cor={cabelo} r={0.55} /></Esf>
        </Sup>
      ))}
      {!simples && <Esf r={1} pos={[0.05, 0.325, -0.02]} rot={[0.35, 0, -0.75]} esc={[0.02, 0.05, 0.016]} sombra={false}><MN cor={cabelo} r={0.55} /></Esf>}
      {v.cabeloTipo === 'longo' && (
        <>
          <Esf r={1} pos={[0, -0.1, -0.1]} esc={[0.345, 0.33, 0.27]}><MN cor={cabelo} r={0.55} /></Esf>
          {[-1, 1].map((s) => (
            <Esf key={'l' + s} r={1} pos={[s * 0.3, -0.16, -0.02]} esc={[0.07, 0.17, 0.12]} sombra={false}><MN cor={cabelo} r={0.55} /></Esf>
          ))}
        </>
      )}
      {v.cabeloTipo === 'coque' && <Esf r={0.11} pos={[0, 0.2, -0.29]}><MN cor={cabelo} r={0.55} /></Esf>}
    </group>
  );

  // vovô: careca no alto, coroa de cabelo branco fofo dos lados e atrás (tufos assentados na superfície da cabeça)
  const raioCab = (lat: number, lon: number) => {
    const d = [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
    return 1 / Math.sqrt((d[0] / 0.335) ** 2 + (d[1] / 0.315) ** 2 + (d[2] / 0.315) ** 2);
  };
  const tufosVovo: [number, number, number, number, number][] = [];
  for (const s of [-1, 1]) {
    for (const [lat, lon, w, h] of [[0.3, 1.36, 0.07, 0.065], [0.36, 1.66, 0.08, 0.075], [0.28, 1.98, 0.09, 0.08], [0.24, 2.36, 0.09, 0.08], [0.2, 2.75, 0.09, 0.08], [0.02, 1.95, 0.08, 0.075], [-0.02, 2.35, 0.085, 0.075], [-0.06, 2.75, 0.085, 0.075]] as const)
      tufosVovo.push([lat, s * lon, w, h, s]);
  }
  tufosVovo.push([0.22, Math.PI, 0.095, 0.085, 0], [-0.08, Math.PI, 0.09, 0.075, 0]);
  const cabeloVovo = (
    <group>
      {tufosVovo.map(([lat, lon, w, h, s], i) => (
        <Sup key={i} lat={lat} lon={lon} r={raioCab(lat, lon) * 0.985}>
          <Esf r={1} esc={[w, h, 0.05]} rot={[0, 0, s * (i % 3) * 0.25]} seg={18} sombra={i % 2 === 0}><MN cor={cabelo} r={0.92} /></Esf>
        </Sup>
      ))}
      {/* tufo fofo saindo por cima da orelha (vô de desenho) */}
      {[-1, 1].map((s) => (
        <Sup key={'p' + s} lat={0.27} lon={s * 1.62} r={raioCab(0.27, 1.62)}>
          <Esf r={1} esc={[0.08, 0.085, 0.07]} rot={[0, 0, s * 0.35]} seg={20}><MN cor={cabelo} r={0.92} /></Esf>
        </Sup>
      ))}
      {/* dois fios teimosos no alto da careca */}
      {!simples &&
        [-1, 1].map((s) => (
          <mesh key={'f' + s} position={[s * 0.02, 0.322, 0.02]} rotation={[0.2, s * 0.5, Math.PI / 2]}>
            <torusGeometry args={[0.035, 0.005, 6, 16, Math.PI * 0.9]} />
            <MN cor={cabelo} r={0.9} />
          </mesh>
        ))}
    </group>
  );

  const cobertura = (() => {
    if (elmo)
      return (
        <group position={[0, 0.03, 0]}>
          <mesh castShadow scale={[1.05, 1.0, 1.05]}>
            <sphereGeometry args={[0.35, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <MN cor={elmo.cor} r={0.35} metal={0.65} />
          </mesh>
          <mesh position={[0, 0.0, 0]}>
            <cylinderGeometry args={[0.385, 0.4, 0.05, 40]} />
            <MN cor={tom(elmo.cor, -0.12)} r={0.35} metal={0.65} />
          </mesh>
          <mesh position={[0, -0.06, -0.27]} rotation={[0.55, 0, 0]} geometry={geoArred(0.56, 0.05, 0.18, 0.02, 2)} castShadow>
            <MN cor={elmo.cor} r={0.35} metal={0.65} />
          </mesh>
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * 0.33, -0.16, 0.08]} rotation={[0, sx * 0.4, 0]} geometry={geoArred(0.04, 0.24, 0.17, 0.015, 2)} castShadow>
              <MN cor={elmo.cor} r={0.35} metal={0.65} />
            </mesh>
          ))}
          {elmo.penacho && (
            <mesh position={[0, 0.3, -0.02]} rotation={[0, Math.PI / 2, 0]} scale={[1, 1, 0.5]} castShadow>
              <torusGeometry args={[0.24, 0.07, 10, 24, Math.PI]} />
              <MN cor={elmo.penacho} r={0.95} />
            </mesh>
          )}
        </group>
      );
    if (chef)
      return (
        <group position={[0, 0.24, 0]}>
          <mesh castShadow position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.3, 0.33, 0.2, 36]} />
            <MN cor="#ffffff" r={0.9} />
          </mesh>
          {[[-0.13, 0.22, 0], [0.13, 0.22, 0], [0, 0.25, 0.11], [0, 0.25, -0.11], [0, 0.3, 0]].map((q, i) => (
            <Esf key={i} r={0.17} pos={q as V3} seg={20}><MN cor="#ffffff" r={0.9} /></Esf>
          ))}
        </group>
      );
    if (capacete)
      return (
        <group position={[0, 0.06, -0.01]}>
          <mesh castShadow>
            <sphereGeometry args={[0.35, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <MBrilho cor={capacete} r={0.3} />
          </mesh>
          <mesh position={[0, 0.0, 0.05]} castShadow scale={[1, 1, 1.12]}>
            <cylinderGeometry args={[0.41, 0.41, 0.03, 40]} />
            <MBrilho cor={capacete} r={0.3} />
          </mesh>
          <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.5]}>
            <torusGeometry args={[0.1, 0.03, 8, 20, Math.PI]} />
            <MN cor={tom(capacete, -0.08)} r={0.3} />
          </mesh>
        </group>
      );
    if (bone)
      return (
        <group position={[0, 0.05, 0]} rotation={[-0.12, 0, 0]}>
          <mesh castShadow scale={[1, 0.62, 1.03]}>
            <sphereGeometry args={[0.345, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <MN cor={bone} r={0.85} />
          </mesh>
          <mesh position={[0, 0.0, 0.32]} rotation={[0.12, 0, 0]} scale={[1, 1, 0.6]}>
            <cylinderGeometry args={[0.27, 0.27, 0.025, 32, 1, false, -Math.PI / 2, Math.PI]} />
            <MN cor={bone} r={0.85} />
          </mesh>
        </group>
      );
    return vovo ? cabeloVovo : cabeloCurto;
  })();

  const chapeus = (
    <>
      {cartola && (
        <group position={[0, 0.25, -0.02]} rotation={[-0.08, 0, 0.06]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.03, 40]} />
            <MN cor={cartola} r={0.4} />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.24, 0.38, 36]} />
            <MN cor={cartola} r={0.4} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.255, 0.255, 0.07, 36]} />
            <MN cor="#c9302c" r={0.7} />
          </mesh>
        </group>
      )}
      {coroa && (
        <group position={[0, 0.17, -0.02]} rotation={[Math.PI / 2 - 0.15, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.33, 0.03, 8, 36]} />
            <MN cor={tom(coroa, -0.2)} r={0.7} />
          </mesh>
          {Array.from({length: 14}).map((_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return (
              <Esf key={i} r={1} pos={[Math.cos(a) * 0.335, Math.sin(a) * 0.335, -0.01]} rot={[0, 0, a + 0.6]} esc={[0.06, 0.028, 0.02]} seg={12} sombra={false}>
                <MN cor={coroa} r={0.7} />
              </Esf>
            );
          })}
        </group>
      )}
      {v.chapeu?.tipo === 'fedora' && (
        <group position={[0, 0.22, -0.01]} rotation={[-0.08, 0, 0]}>
          <mesh castShadow scale={[1, 1, 1.08]}>
            <cylinderGeometry args={[0.46, 0.46, 0.03, 40]} />
            <MN cor={v.chapeu.cor} r={0.85} />
          </mesh>
          <mesh position={[0, 0.13, 0]} castShadow scale={[1, 1, 1.08]}>
            <cylinderGeometry args={[0.27, 0.31, 0.24, 36]} />
            <MN cor={v.chapeu.cor} r={0.85} />
          </mesh>
          <mesh position={[0, 0.25, 0]} scale={[1, 0.3, 1.08]}>
            <sphereGeometry args={[0.27, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <MN cor={v.chapeu.cor} r={0.85} />
          </mesh>
          <mesh position={[0, 0.05, 0]} scale={[1, 1, 1.08]}>
            <cylinderGeometry args={[0.312, 0.312, 0.06, 36]} />
            <MN cor={v.chapeu.fita ?? '#1d1b26'} r={0.6} />
          </mesh>
        </group>
      )}
      {(v.chapeu?.tipo === 'comissaria' || v.chapeu?.tipo === 'quepe') && (
        <group position={[0.04, 0.3, 0.02]} rotation={[-0.15, 0, 0.12]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.16, 0.17, 0.11, 32]} />
            <MN cor={v.chapeu.cor} r={0.8} />
          </mesh>
          <mesh position={[0, -0.035, 0]}>
            <cylinderGeometry args={[0.175, 0.175, 0.03, 32]} />
            <MN cor={v.chapeu.fita ?? '#ffd23f'} r={0.4} metal={0.4} />
          </mesh>
        </group>
      )}
      {v.travesseiro && (
        <group position={[0, 0.38, -0.02]} rotation={[0.1, 0, 0.08]}>
          <mesh castShadow scale={[1, 0.42, 0.8]}>
            <sphereGeometry args={[0.4, 28, 14]} />
            <MN cor="#f0ebe0" r={0.95} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.34, -0.2, 0]} rotation={[0, 0, s * 0.3]} geometry={geoArred(0.035, 0.36, 0.05, 0.012, 2)}>
              <MN cor="#b85c4a" r={0.9} />
            </mesh>
          ))}
        </group>
      )}
    </>
  );

  return (
    <group position={[pos[0], pos[1] + pulo * esc * K_ZE, pos[2]]} rotation={[0, rotY, 0]} scale={esc * K_ZE}>
      <group position={[0, dy, 0]}>
        {pernaD}
        {pernaE}
        {/* quadril / calça */}
        <Lathe pts={[[0.001, -0.07], [0.13, -0.07], [0.172, -0.03], [0.19, 0.03], [0.195, 0.08], [0.001, 0.08]]} pos={[0, H, 0]} esc={[1, 1, 0.86]}>
          <MN cor={calca} r={pernaNua ? 0.55 : 0.85} />
        </Lathe>
        {/* saia da túnica / toga / saia de uniforme (cai do quadril até a coxa ou o joelho) */}
        {(v.tunica || toga || v.saia) && (
          <Lathe
            pts={toga ? [[0.2, 0.08], [0.215, -0.05], [0.235, -0.2], [0.25, -0.27]] : v.saia ? [[0.198, 0.08], [0.215, -0.05], [0.235, -0.18]] : [[0.2, 0.08], [0.215, -0.04], [0.24, -0.13]]}
            pos={[0, H, 0]}
            esc={senta ? [1, 0.35, 1.1] : [1, 1, 0.9]}
          >
            <meshStandardMaterial color={toga ?? v.saia ?? camisa} roughness={0.9} side={THREE.DoubleSide} />
          </Lathe>
        )}
        <group position={[0, H, 0]} rotation={[tronco, giro, 0]}>
          <group scale={[1, 1 + resp, 1]}>
            <group scale={[1, 1, 0.86]}>
              <Lathe pts={[[0.001, 0.02], [0.17, 0.02], [0.197, 0.06], [0.208, 0.15], [0.203, 0.26], [0.19, 0.34], [0.155, 0.4], [0.095, 0.435], [0.001, 0.445]]}>
                <MN cor={camisa} r={0.85} />
              </Lathe>
              <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.197, vovo ? 0.02 : 0.012, 8, 40]} />
                <MN cor={vovo ? tom(camisa, -0.1) : v.tunica ? '#5a3a22' : '#3d2a1e'} r={vovo ? 0.9 : 0.45} />
              </mesh>
              <mesh position={[0, 0.425, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.09, vovo ? 0.02 : 0.026, 10, 32]} />
                <MN cor={terno || vovo ? '#f4f4f4' : tom(camisa, 0.12)} r={0.85} />
              </mesh>
              {v.gola && (
                <mesh position={[0, 0.41, 0]} rotation={[Math.PI / 2 - 0.15, 0, 0]}>
                  <torusGeometry args={[0.125, 0.042, 10, 32]} />
                  <MN cor={v.gola} r={0.85} />
                </mesh>
              )}
              {chef && (
                <mesh position={[0, 0.42, 0.02]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
                  <torusGeometry args={[0.1, 0.035, 10, 32]} />
                  <MN cor="#e8322b" r={0.8} />
                </mesh>
              )}
            </group>
            {!v.tunica && !vovo && (
              <mesh position={[0, 0.055, 0.172]} geometry={geoArred(0.05, 0.036, 0.014, 0.006, 3)}>
                <MN cor="#d8b45a" r={0.3} metal={0.7} />
              </mesh>
            )}
            {/* frente da camisa: gola V e botões, ou jaleco de chef (botões duplos), ou terno (camisa branca + lapelas) */}
            {vovo ? (
              // cardigã: camisa social branca no decote em V, golas da camisa, faixas de tricô, botões e bolsos
              <>
                <mesh geometry={peitoCamisa()}>
                  <MN cor="#f4f4f4" r={0.7} />
                </mesh>
                {[-1, 1].map((s) => (
                  <Esf key={'g' + s} r={1} pos={[s * 0.042, 0.408, 0.118]} rot={[0.5, 0, s * 0.6]} esc={[0.044, 0.024, 0.012]} sombra={false}><MN cor="#f4f4f4" r={0.7} /></Esf>
                ))}
                {[-1, 1].map((s) => (
                  <mesh key={s} geometry={peitoFaixa(s as 1 | -1)}>
                    <MN cor={tom(camisa, -0.16)} r={0.9} />
                  </mesh>
                ))}
                <mesh geometry={peitoFecho()}>
                  <MN cor={tom(camisa, -0.16)} r={0.9} />
                </mesh>
                {[0.09, 0.15].map((y) => (
                  <Esf key={y} r={0.013} seg={12} pos={[0, y, 0.86 * raioPeito(y) + 0.012]} sombra={false}><MN cor="#5a3a22" r={0.4} /></Esf>
                ))}
                {!simples &&
                  [-1, 1].map((s) => (
                    <mesh key={'b' + s} position={[s * 0.115, 0.12, 0.158]} rotation={[0, s * 0.55, 0]} geometry={geoArred(0.075, 0.065, 0.012, 0.006, 2)}>
                      <MN cor={tom(camisa, -0.06)} r={0.9} />
                    </mesh>
                  ))}
              </>
            ) : terno ? (
              <>
                <mesh position={[0, 0.37, 0.158]} rotation={[-0.25, 0, 0]} scale={[0.07, 0.085, 0.014]}>
                  <sphereGeometry args={[1, 20, 12]} />
                  <MN cor="#f4f4f4" r={0.7} />
                </mesh>
                {[-1, 1].map((s) => (
                  <mesh key={s} position={[s * 0.062, 0.31, 0.166]} rotation={[-0.2, s * 0.2, s * 0.42]} geometry={geoArred(0.045, 0.2, 0.014, 0.006, 2)}>
                    <MN cor={tom(camisa, -0.18)} r={0.7} />
                  </mesh>
                ))}
                {[0.13, 0.2].map((y) => (
                  <Esf key={y} r={0.011} seg={10} pos={[0.03, y, 0.178]} sombra={false}><MN cor="#1d1b26" r={0.35} /></Esf>
                ))}
              </>
            ) : chef ? (
              [0.14, 0.24, 0.33].flatMap((y) => [-1, 1].map((s) => (
                <Esf key={y + ':' + s} r={0.012} seg={10} pos={[s * 0.06, y, 0.17 - (y - 0.14) * 0.06]} sombra={false}><MN cor="#2b2233" r={0.35} /></Esf>
              )))
            ) : v.tunica || toga ? null : (
              <>
                {[-1, 1].map((s) => (
                  <Esf key={s} r={1} pos={[s * 0.045, 0.405, 0.115]} rot={[0.5, 0, s * 0.55]} esc={[0.04, 0.022, 0.012]} sombra={false}><MN cor={tom(camisa, 0.12)} r={0.85} /></Esf>
                ))}
                {!simples && !gravata &&
                  [0.14, 0.23, 0.32].map((y) => (
                    <Esf key={y} r={0.011} seg={10} pos={[0, y, 0.176 - (y - 0.14) * 0.06]} sombra={false}><MN cor="#f4f1ea" r={0.35} /></Esf>
                  ))}
                {!simples && (
                  <mesh position={[-0.085, 0.29, 0.162]} rotation={[-0.12, -0.32, 0]} geometry={geoArred(0.07, 0.07, 0.012, 0.006, 3)}>
                    <MN cor={sombraTec} r={0.9} />
                  </mesh>
                )}
              </>
            )}
            {toga && (
              // faixa da toga: do ombro esquerdo ao quadril direito, por cima do peito
              <group rotation={[0, 0, -0.62]} position={[0.0, 0.25, 0]}>
                <mesh scale={[1.0, 1, 0.92]}>
                  <cylinderGeometry args={[0.215, 0.215, 0.13, 36, 1, true]} />
                  <meshStandardMaterial color={toga} roughness={0.9} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}
            {colete && (
              <group scale={[1.06, 1, 0.92]}>
                <Lathe pts={[[0.19, 0.1], [0.21, 0.15], [0.207, 0.26], [0.195, 0.34], [0.16, 0.39], [0.159, 0.395]]}>
                  <meshStandardMaterial color={colete} roughness={0.7} side={THREE.DoubleSide} />
                </Lathe>
                {!vovo && [0.18, 0.28].map((y) => (
                  <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.21, 0.01, 6, 40]} />
                    <MN cor="#f4f4f4" r={0.3} />
                  </mesh>
                ))}
              </group>
            )}
            {v.suspensorio &&
              [-1, 1].map((s) => (
                <group key={s}>
                  <mesh position={[s * 0.085, 0.24, 0.17]} rotation={[-0.08, 0, 0]} geometry={geoArred(0.032, 0.34, 0.012, 0.005, 2)}>
                    <MN cor={v.suspensorio!} r={0.7} />
                  </mesh>
                  <mesh position={[s * 0.085, 0.24, -0.17]} rotation={[0.08, 0, 0]} geometry={geoArred(0.032, 0.34, 0.012, 0.005, 2)}>
                    <MN cor={v.suspensorio!} r={0.7} />
                  </mesh>
                </group>
              ))}
            {gravata && (
              <group position={[0, 0.365, 0.168]} rotation={[-0.18, 0, 0]}>
                <Esf r={1} esc={[0.028, 0.022, 0.018]} sombra={false}><MN cor={gravata} r={0.5} /></Esf>
                <mesh position={[0, -0.09, 0.004]} geometry={geoArred(0.045, 0.15, 0.014, 0.012, 2)}>
                  <MN cor={gravata} r={0.5} />
                </mesh>
              </group>
            )}
            {v.mic && (
              <group position={[0.075, 0.33, 0.165]}>
                <Cap r={0.012} len={0.03} rot={[0.3, 0, 0]} sombra={false}><MN cor="#1d1b26" r={0.4} /></Cap>
                <Esf r={0.016} pos={[0, 0.022, 0.006]} seg={12} sombra={false}><MN cor="#3a3d44" r={0.6} /></Esf>
              </group>
            )}
            {escudo && (
              <group position={[-0.26, 0.17, 0.27]} rotation={[0, -0.18, 0]}>
                <group scale={IK}>
                  <mesh castShadow geometry={geoArred(0.55, 0.85, 0.05, 0.04, 3)}>
                    <MN cor={escudo} r={0.75} />
                  </mesh>
                  {[-0.3, 0.3].map((y) => (
                    <mesh key={y} position={[0, y, 0.03]} geometry={geoArred(0.42, 0.04, 0.012, 0.006, 2)}>
                      <MN cor="#e0b64a" r={0.35} metal={0.7} />
                    </mesh>
                  ))}
                  <mesh position={[0, 0, 0.03]}>
                    <sphereGeometry args={[0.09, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <MN cor="#e0b64a" r={0.35} metal={0.7} />
                  </mesh>
                </group>
              </group>
            )}
            {peito && (
              <group position={[0, 0.3, 0.17]}>
                <group scale={IK}>{peito}</group>
              </group>
            )}
            {costas && (
              <group position={[0, 0.27, -0.17]}>
                <group scale={IK}>{costas}</group>
              </group>
            )}
            {frente && (
              <group position={[0, 0.253, 0.33]}>
                <group scale={IK}>{frente}</group>
              </group>
            )}
            {braco(D, 1, ferramenta || maoD ? (<>{ferramenta && <FerramentaNaMao f={ferramenta} t={t} chao={prumo?.chao} />}{maoD}</>) : null, prumo?.q)}
            {braco(E, -1, maoE ?? null)}
            <mesh position={[0, 0.47, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.075, 0.08, 20]} />
              <MN cor={pele} r={0.55} />
            </mesh>
            {/* ---------- cabeça ---------- */}
            <group position={[0, 0.5, 0]} rotation={cab}>
              <group position={[0, 0.3, 0]}>
                <Esf r={1} esc={[0.335, 0.315, 0.315]} seg={44} fixo><MN cor={pele} r={vovo ? 0.36 : 0.5} /></Esf>
                {[-1, 1].map((s) => (
                  <group key={s} position={[s * 0.322, -0.02, -0.01]} scale={vovo ? 1.16 : 1}>
                    <Esf r={1} esc={[0.04, 0.068, 0.058]} sombra={false}><MN cor={pele} r={0.5} /></Esf>
                    {!simples && <Esf r={1} pos={[s * 0.012, 0, 0.005]} esc={[0.02, 0.04, 0.032]} sombra={false}><MN cor={tom(pele, -0.12)} r={0.6} /></Esf>}
                  </group>
                ))}
                {olhos}
                {sobrancelhas}
                <Sup lat={vovo ? -0.1 : -0.12} lon={0} r={0.31}>
                  {vovo ? (
                    <Esf r={1} esc={[0.056, 0.048, 0.05]} seg={24}><MN cor={tom(pele, -0.08)} r={0.42} /></Esf>
                  ) : (
                    <Esf r={1} esc={[0.03, 0.024, 0.022]} sombra={false}><MN cor={tom(pele, -0.06)} r={0.5} /></Esf>
                  )}
                </Sup>
                {vovo && (() => {
                  const ruga = tom(pele, -0.2);
                  const caido = nomeEx === 'bravo' ? 0.48 : nomeEx === 'ri' ? 0.12 : 0.3;
                  return (
                    <>
                      {/* bigode branco cheio: dois gomos sob o nariz, pontas caindo */}
                      {[-1, 1].map((s) => (
                        <Sup key={'b' + s} lat={-0.25} lon={s * 0.115} r={0.302}>
                          <group rotation={[0, 0, -s * caido]}>
                            <Esf r={1} esc={[0.072, 0.036, 0.042]} seg={24}><MN cor={cabelo} r={0.92} /></Esf>
                            <Esf r={1} pos={[s * 0.058, -0.008, -0.006]} esc={[0.04, 0.028, 0.032]} seg={18} sombra={false}><MN cor={cabelo} r={0.92} /></Esf>
                          </group>
                        </Sup>
                      ))}
                      {/* rugas da testa */}
                      {!simples &&
                        [0.57, 0.66].map((lat, i) => (
                          <Sup key={'r' + i} lat={lat} lon={0} r={0.316}>
                            <mesh position={[0, -0.14, 0]} rotation={[0, 0, Math.PI / 2 - 0.36 + i * 0.05]}>
                              <torusGeometry args={[0.14, 0.0055, 6, 18, 0.72 - i * 0.1]} />
                              <MN cor={ruga} r={0.6} />
                            </mesh>
                          </Sup>
                        ))}
                      {/* pés de galinha */}
                      {!simples &&
                        [-1, 1].flatMap((s) =>
                          [0.06, -0.03].map((lat, i) => (
                            <Sup key={'g' + s + i} lat={lat} lon={s * 0.7} r={0.316}>
                              <mesh rotation={[0, 0, Math.PI / 2 + s * (i ? -0.3 : 0.3)]}>
                                <capsuleGeometry args={[0.0045, 0.03, 3, 6]} />
                                <MN cor={ruga} r={0.6} />
                              </mesh>
                            </Sup>
                          )),
                        )}
                      {/* rabugento: vinco entre as sobrancelhas */}
                      {nomeEx === 'bravo' &&
                        [-1, 1].map((s) => (
                          <Sup key={'v' + s} lat={0.31} lon={s * 0.045} r={0.316}>
                            <mesh rotation={[0, 0, s * 0.15]}>
                              <capsuleGeometry args={[0.0045, 0.035, 3, 6]} />
                              <MN cor={ruga} r={0.6} />
                            </mesh>
                          </Sup>
                        ))}
                    </>
                  );
                })()}
                {ex.boch > 0 &&
                  [-1, 1].map((s) => (
                    <Sup key={s} lat={-0.2} lon={s * 0.6} r={0.31}>
                      <Esf r={1} esc={[0.058 * ex.boch, 0.036 * Math.sqrt(ex.boch), 0.014]} sombra={false}><MN cor="#ff9c8f" r={0.8} /></Esf>
                    </Sup>
                  ))}
                <Sup lat={vovo ? -0.42 : -0.33} lon={0} r={0.292}>{ex.boca === 'sorriso' ? bocaMesh : <group position={[0, 0, 0.017]} rotation={[0.25, 0, 0]}>{bocaMesh}</group>}</Sup>
                {oculos && (
                  <group>
                    {[-1, 1].map((s) => (
                      <Sup key={s} lat={0.03} lon={s * 0.36} r={0.345}>
                        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.82]}>
                          <cylinderGeometry args={[0.085, 0.085, 0.02, 28]} />
                          {oculos === 'escuro' ? <MBrilho cor="#0b0b10" r={0.1} /> : <meshStandardMaterial color="#cfe8ff" transparent opacity={0.25} roughness={0.05} />}
                        </mesh>
                        <mesh>
                          <torusGeometry args={[0.087, vovo ? 0.008 : 0.009, 8, 32]} />
                          <MN cor={aro} r={0.35} metal={vovo ? 0.8 : 0.3} />
                        </mesh>
                      </Sup>
                    ))}
                    {/* hastes até a orelha */}
                    {[-1, 1].map((s) => (
                      <mesh key={'h' + s} position={[s * 0.318, 0.03, 0.07]} rotation={[Math.PI / 2, s * 0.12, 0]}>
                        <capsuleGeometry args={[0.008, 0.2, 3, 8]} />
                        <MN cor={aro} r={0.4} metal={vovo ? 0.8 : 0} />
                      </mesh>
                    ))}
                    <Sup lat={0.06} lon={0} r={0.345}>
                      <mesh rotation={[0, 0, Math.PI / 2]}>
                        <capsuleGeometry args={[0.008, 0.07, 3, 8]} />
                        <MN cor={aro} r={0.4} metal={vovo ? 0.8 : 0} />
                      </mesh>
                    </Sup>
                  </group>
                )}
                {cobertura}
                {chapeus}
                {topo && (
                  <group position={[0, 0.33, 0]}>
                    <group scale={IK}>{topo}</group>
                  </group>
                )}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

// figurante sentado (plateia, passageiros, bote): versão leve do Zé 2.0 (8 peças), para multidões.
// Origem no assento (como o Sentado antigo): corpo de 0 a ~1,1 m com esc 1.
export const Sentado2: React.FC<{pos: V3; rotY?: number; roupa: string; pele: string; cabelo?: string; bracos?: number; esc?: number}> = ({pos, rotY = 0, roupa, pele, cabelo = '#3b2a20', bracos = 0, esc = 1}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={esc}>
    <Lathe pts={[[0.001, 0.0], [0.2, 0.0], [0.235, 0.08], [0.24, 0.3], [0.215, 0.46], [0.15, 0.54], [0.001, 0.56]]} esc={[1, 1, 0.86]}>
      <MN cor={roupa} r={0.85} />
    </Lathe>
    <Esf r={1} pos={[0, 0.8, 0]} esc={[0.27, 0.255, 0.255]} seg={24} fixo><MN cor={pele} r={0.5} /></Esf>
    <mesh position={[0, 0.82, -0.01]} rotation={[-0.45, 0, 0]} scale={[1.04, 1, 1.03]} castShadow>
      <sphereGeometry args={[0.27, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      <MN cor={cabelo} r={0.55} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={'o' + s} position={[s * 0.085, 0.82, 0.225]} scale={[0.035, 0.045, 0.02]}>
        <sphereGeometry args={[1, 12, 8]} />
        <MBrilho cor="#1d1410" r={0.1} />
      </mesh>
    ))}
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 0.22, 0.46, 0.02]} rotation={[-0.4 * (1 - bracos), 0, s * (0.2 + bracos * 2.5)]}>
        <Cap r={0.06} len={0.22} pos={[0, -0.15, 0]}><MN cor={roupa} r={0.85} /></Cap>
        <Esf r={0.06} pos={[0, -0.3, 0]} seg={14}><MN cor={pele} r={0.55} /></Esf>
      </group>
    ))}
  </group>
);
