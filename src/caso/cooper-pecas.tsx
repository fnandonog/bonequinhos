// PEÇAS do caso D.B. Cooper (24/11/1971) em ESCALA REAL (1 unidade = 1 metro).
// Boeing 727-100: 40,6 m de comprimento, 32,9 m de envergadura, fuselagem de 3,76 m, escada traseira (airstair) sob a cauda.
// Tudo genérico: nenhuma marca de companhia real, personagens são o Zé (sem rosto real).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, Caixa, Cil, Instancias, Mat, Visual, AcaoBoneco, Expressao, clamp01, lerp, suave} from '../v4/kit';

export {clamp01, lerp, suave};

export const rnd = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};

// ---------- texturas pintadas em canvas (cache) ----------
const cache = new Map<string, THREE.CanvasTexture>();
export function tela(id: string, w: number, h: number, pinta: (g: CanvasRenderingContext2D) => void, rep: [number, number] = [1, 1]) {
  const k = `${id}:${rep[0]}x${rep[1]}`;
  const c0 = cache.get(k);
  if (c0) return c0;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  pinta(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(k, t);
  return t;
}
const ruido = (g: CanvasRenderingContext2D, w: number, h: number, cores: string[], n: number, tam: [number, number], seed = 3) => {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = cores[Math.floor(r() * cores.length)];
    const s = tam[0] + r() * (tam[1] - tam[0]);
    g.fillRect(r() * w, r() * h, s, s * (0.5 + r()));
  }
};

export const TX = {
  // piso de terminal anos 70: ladrilho xadrez bege/marrom
  ladrilho: (rep: [number, number]) => tela('ladrilho', 256, 256, (g) => {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.fillStyle = (i + j) % 2 ? '#c9b48a' : '#8a6a48';
      g.fillRect(i * 64, j * 64, 64, 64);
    }
    ruido(g, 256, 256, ['rgba(0,0,0,0.06)', 'rgba(255,255,255,0.06)'], 600, [1, 3]);
    g.strokeStyle = 'rgba(40,30,20,0.35)';
    g.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); }
  }, rep),
  // lambri de madeira
  lambri: (rep: [number, number]) => tela('lambri', 256, 256, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = ['#7a5232', '#6e4a2c', '#83593a', '#744d2f'][i % 4];
      g.fillRect(i * 32, 0, 32, 256);
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(i * 32, 0, 2, 256);
    }
    const r = rnd(9);
    g.strokeStyle = 'rgba(40,22,10,0.25)';
    for (let i = 0; i < 60; i++) { const x = r() * 256; g.beginPath(); g.moveTo(x, r() * 256); g.lineTo(x + (r() - 0.5) * 6, r() * 256); g.stroke(); }
  }, rep),
  // carpete azul com losangos laranja (corredor do avião)
  carpete: (rep: [number, number]) => tela('carpete', 128, 128, (g) => {
    g.fillStyle = '#2b3f6e';
    g.fillRect(0, 0, 128, 128);
    ruido(g, 128, 128, ['#24365e', '#33497c'], 500, [1, 2]);
    g.fillStyle = '#c96a2a';
    for (const [x, y] of [[32, 32], [96, 96]]) { g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 14, y); g.lineTo(x, y + 14); g.lineTo(x - 14, y); g.closePath(); g.fill(); }
  }, rep),
  // painel da cabine (creme com frisos)
  painel: (rep: [number, number]) => tela('painel', 128, 128, (g) => {
    g.fillStyle = '#e4dccb';
    g.fillRect(0, 0, 128, 128);
    ruido(g, 128, 128, ['rgba(0,0,0,0.04)'], 200, [1, 3]);
    g.fillStyle = '#b9b09c';
    g.fillRect(0, 0, 3, 128);
    g.fillRect(0, 62, 128, 2);
  }, rep),
  // tecido da poltrona (xadrez anos 70)
  tecido: (cor: string, cor2: string) => tela('tecido' + cor, 64, 64, (g) => {
    g.fillStyle = cor;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = cor2;
    for (let i = 0; i < 64; i += 16) { g.fillRect(i, 0, 5, 64); g.fillRect(0, i, 64, 5); }
  }, [2, 2]),
  // asfalto molhado: ruído, remendos e poças
  asfalto: (rep: [number, number]) => tela('asfalto', 512, 512, (g) => {
    g.fillStyle = '#3e4148';
    g.fillRect(0, 0, 512, 512);
    ruido(g, 512, 512, ['#363940', '#474a52', '#2f3238'], 4000, [1, 4], 5);
    const r = rnd(17);
    for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(150,170,200,${0.12 + r() * 0.12})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 50, 8 + r() * 20, r() * 3, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(20,20,24,0.6)';
    for (let i = 0; i < 12; i++) { g.beginPath(); let x = r() * 512, y = r() * 512; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
  }, rep),
  // chão da floresta: musgo, agulhas, terra
  mato: (rep: [number, number]) => tela('mato', 256, 256, (g) => {
    g.fillStyle = '#2e4a2a';
    g.fillRect(0, 0, 256, 256);
    ruido(g, 256, 256, ['#3b5a31', '#24391f', '#4a3a26', '#556b35'], 2500, [2, 6], 7);
  }, rep),
  // areia do rio
  areia: (rep: [number, number]) => tela('areia', 256, 256, (g) => {
    g.fillStyle = '#b79a6c';
    g.fillRect(0, 0, 256, 256);
    ruido(g, 256, 256, ['#a88a5c', '#c9ad7d', '#8f7a58', '#d4bd92'], 3000, [1, 3], 13);
  }, rep),
  // cortiça
  cortica: (rep: [number, number]) => tela('cortica', 256, 256, (g) => {
    g.fillStyle = '#c08f5a';
    g.fillRect(0, 0, 256, 256);
    ruido(g, 256, 256, ['#a8784a', '#d4a46c', '#8f6440'], 3500, [1, 3], 21);
  }, rep),
  // parede de escritório: papel de parede listrado
  papel: (rep: [number, number]) => tela('papel', 128, 128, (g) => {
    g.fillStyle = '#5a6a5c';
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 128; i += 32) { g.fillStyle = '#647566'; g.fillRect(i, 0, 14, 128); g.fillStyle = '#c9b46a'; g.fillRect(i + 22, 0, 2, 128); }
  }, rep),
  // concreto/piso industrial
  concreto: (rep: [number, number]) => tela('concreto', 256, 256, (g) => {
    g.fillStyle = '#8d8f92';
    g.fillRect(0, 0, 256, 256);
    ruido(g, 256, 256, ['#7f8184', '#9a9c9f', '#85878a'], 2500, [1, 4], 29);
    g.strokeStyle = 'rgba(40,40,40,0.4)';
    g.strokeRect(0, 0, 256, 256);
  }, rep),
  // fachada envidraçada do terminal (janelas acesas)
  vidro: (rep: [number, number]) => tela('vidro', 256, 128, (g) => {
    g.fillStyle = '#23262e';
    g.fillRect(0, 0, 256, 128);
    const r = rnd(3);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) {
      const on = r() > 0.25;
      g.fillStyle = on ? (r() > 0.5 ? '#ffd98a' : '#ffe9b8') : '#3a4a66';
      g.fillRect(i * 32 + 3, j * 64 + 4, 26, 56);
    }
  }, rep),
  // nota de 20 (genérica, sem rosto)
  nota: () => tela('nota20', 256, 112, (g) => {
    g.fillStyle = '#cfd8bf';
    g.fillRect(0, 0, 256, 112);
    g.strokeStyle = '#4f6a48';
    g.lineWidth = 6;
    g.strokeRect(6, 6, 244, 100);
    g.fillStyle = '#7f9a72';
    g.beginPath(); g.ellipse(128, 56, 34, 40, 0, 0, 7); g.fill();
    g.fillStyle = '#3f5a3a';
    g.font = "800 34px 'Baloo 2', sans-serif";
    g.fillText('20', 16, 42);
    g.fillText('20', 196, 98);
    g.font = "800 18px 'Baloo 2', sans-serif";
    g.fillText('VINTE', 180, 30);
  }),
  // nota velha, desbotada e comida pela areia (1980)
  notaVelha: () => tela('notavelha', 256, 112, (g) => {
    g.fillStyle = '#9a9070';
    g.fillRect(0, 0, 256, 112);
    g.strokeStyle = '#5a5a40';
    g.lineWidth = 6;
    g.strokeRect(6, 6, 244, 100);
    g.fillStyle = '#6f6a4a';
    g.beginPath(); g.ellipse(128, 56, 34, 40, 0, 0, 7); g.fill();
    g.font = "800 34px 'Baloo 2', sans-serif";
    g.fillStyle = '#4a4630';
    g.fillText('20', 16, 42);
    ruido(g, 256, 112, ['#5a4a30', '#b8a880', '#3a3020'], 500, [2, 8], 41);
    g.fillStyle = '#b79a6c';
    g.beginPath(); g.moveTo(256, 0); g.lineTo(200, 0); g.lineTo(230, 40); g.lineTo(256, 70); g.fill();
  }),
  // retrato falado (desenho a lápis de um rosto genérico de boneco, com óculos escuros)
  retrato: () => tela('retrato', 256, 320, (g) => {
    g.fillStyle = '#f2ecdc';
    g.fillRect(0, 0, 256, 320);
    ruido(g, 256, 320, ['rgba(0,0,0,0.04)'], 400, [1, 3], 2);
    g.strokeStyle = '#3a3a3a';
    g.lineWidth = 4;
    g.beginPath(); g.ellipse(128, 150, 72, 90, 0, 0, 7); g.stroke();
    g.fillStyle = '#2a2a2a';
    g.beginPath(); g.ellipse(128, 90, 76, 40, 0, Math.PI, 0); g.fill();
    g.fillRect(80, 132, 40, 22);
    g.fillRect(136, 132, 40, 22);
    g.fillRect(118, 138, 20, 5);
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(108, 200); g.quadraticCurveTo(128, 210, 148, 200); g.stroke();
    g.beginPath(); g.moveTo(128, 160); g.lineTo(122, 182); g.lineTo(134, 182); g.stroke();
    // terno e gravata
    g.beginPath(); g.moveTo(40, 320); g.lineTo(70, 250); g.lineTo(128, 240); g.lineTo(186, 250); g.lineTo(216, 320); g.stroke();
    g.fillStyle = '#2a2a2a';
    g.beginPath(); g.moveTo(120, 248); g.lineTo(136, 248); g.lineTo(140, 310); g.lineTo(128, 320); g.lineTo(116, 310); g.fill();
    g.strokeStyle = 'rgba(60,60,60,0.35)';
    for (let i = 0; i < 40; i++) { g.beginPath(); g.moveTo(60 + i * 3, 260 + (i % 5) * 8); g.lineTo(70 + i * 3, 300); g.stroke(); }
  }),
  // placa retangular com texto
  placa: (texto: string, fundo = '#1d1b26', cor = '#ffffff', w = 512, h = 128) => tela(`placa:${texto}:${fundo}:${cor}:${w}x${h}`, w, h, (g) => {
    g.fillStyle = fundo;
    g.fillRect(0, 0, w, h);
    let fs = Math.round(h * 0.62);
    g.font = `800 ${fs}px 'Baloo 2', sans-serif`;
    while (g.measureText(texto).width > w * 0.9 && fs > 10) { fs -= 2; g.font = `800 ${fs}px 'Baloo 2', sans-serif`; }
    g.fillStyle = cor;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(texto, w / 2, h / 2 + fs * 0.06);
  }),
};

// plano com textura de texto (placa no mundo)
export const Letreiro: React.FC<{texto: string; pos: V3; rot?: V3; larg: number; alt?: number; fundo?: string; cor?: string; brilho?: boolean}> = ({texto, pos, rot = [0, 0, 0], larg, alt, fundo = '#1d1b26', cor = '#ffffff', brilho = false}) => {
  const h = alt ?? larg / 4;
  const map = TX.placa(texto, fundo, cor, 512, Math.round(512 * (h / larg)));
  return (
    <mesh position={pos} rotation={rot}>
      <planeGeometry args={[larg, h]} />
      {brilho ? <meshBasicMaterial map={map} toneMapped={false} /> : <meshStandardMaterial map={map} roughness={0.7} />}
    </mesh>
  );
};

// caixa com textura (repetição em metros)
export const CaixaTx: React.FC<{pos: V3; tam: V3; map: THREE.Texture; rot?: V3; cor?: string; sombra?: boolean}> = ({pos, tam, map, rot = [0, 0, 0], cor = '#ffffff', sombra = true}) => (
  <mesh position={pos} rotation={rot} castShadow={sombra} receiveShadow>
    <boxGeometry args={tam} />
    <meshStandardMaterial map={map} color={cor} roughness={0.85} />
  </mesh>
);
export const Chao: React.FC<{pos: V3; tam: [number, number]; map: THREE.Texture; cor?: string; rough?: number}> = ({pos, tam, map, cor = '#ffffff', rough = 0.85}) => (
  <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={tam} />
    <meshStandardMaterial map={map} color={cor} roughness={rough} />
  </mesh>
);

// ---------- figurino ----------
export const COOPER: Visual = {camisa: '#2a2d36', calca: '#2a2d36', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#e2b48e', gravata: '#0b0b0e'};
export const COMISSARIA: Visual = {camisa: '#3d5f9e', calca: '#3d5f9e', colete: null, capacete: null, cabelo: '#c99a5a', pele: '#f0c8a8'};
// tripulação de cabine de 1971: paletó azul-marinho, gravata e quepe com fita dourada
const quepe = {tipo: 'quepe' as const, cor: '#1b2440', fita: '#d8b45a'};
export const TRIPULANTES: Visual[] = [
  {camisa: '#1b2440', calca: '#1b2440', colete: null, capacete: null, cabelo: '#9a9a9a', pele: '#e2b48e', gravata: '#0b0b0e', chapeu: quepe}, // piloto
  {camisa: '#1b2440', calca: '#1b2440', colete: null, capacete: null, cabelo: '#3b2a20', pele: '#c98e62', gravata: '#0b0b0e', chapeu: quepe}, // copiloto
  {camisa: '#1b2440', calca: '#1b2440', colete: null, capacete: null, cabelo: '#6b3e26', pele: '#f0c8a8', gravata: '#0b0b0e', chapeu: quepe}, // engenheiro de voo
];
export const COMISSARIA2: Visual = {camisa: '#3d5f9e', calca: '#3d5f9e', colete: null, capacete: null, cabelo: '#3b2a20', pele: '#d9a37a'};
export const ATENDENTE: Visual = {camisa: '#c96a2a', calca: '#2b2f3a', colete: null, capacete: null, cabelo: '#5a3a28', pele: '#f0c8a8'};
export const AGENTE: Visual = {camisa: '#3a3f4c', calca: '#3a3f4c', colete: null, capacete: null, cabelo: '#2b2233', pele: '#d9a37a', gravata: '#7a1f24'};
export const DETETIVE: Visual = {camisa: '#c9a46a', calca: '#5a4636', colete: null, capacete: null, cabelo: '#3b2a20'};
export const PATIO: Visual = {camisa: '#2f3b55', calca: '#2f3b55', colete: '#ff8a1f', capacete: null, cabelo: '#1d1b26', pele: '#c98e62'};
export const PASSAGEIROS: Visual[] = [
  {camisa: '#8a5a2b', calca: '#4a3a2a', colete: null, capacete: null, cabelo: '#3b2a20', gravata: '#c9a03a'},
  {camisa: '#c94f3a', calca: '#3a3a4a', colete: null, capacete: null, cabelo: '#c99a5a', pele: '#f0c8a8'},
  {camisa: '#5f7f3f', calca: '#2b2b3a', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#b98a66'},
  {camisa: '#d9c27a', calca: '#5a4636', colete: null, capacete: null, cabelo: '#6b3e26'},
  {camisa: '#6a4a8a', calca: '#2b2b3a', colete: null, capacete: null, cabelo: '#2b2233', pele: '#8d5a3b'},
  {camisa: '#2f6f8f', calca: '#3a3a4a', colete: null, capacete: null, cabelo: '#c8c8c8', gravata: '#8a2b2b'},
  {camisa: '#e9e1cf', calca: '#2f3b55', colete: null, capacete: null, cabelo: '#3b2a20', pele: '#e7b48c'},
];

// pasta executiva (60 × 33 × 9 cm) — fechada, ou aberta mostrando a "bomba" (cilindros vermelhos, bateria e fios)
export const Pasta: React.FC<{pos: V3; rot?: V3; aberta?: number; t?: number}> = ({pos, rot = [0, 0, 0], aberta = 0, t = 0}) => {
  const a = suave(aberta) * 1.75;
  return (
    <group position={pos} rotation={rot}>
      <Caixa pos={[0, 0.03, 0]} tam={[0.46, 0.06, 0.33]} cor="#1a1a1e" />
      <Caixa pos={[0, 0.061, 0]} tam={[0.44, 0.004, 0.31]} cor="#5a2a2a" sombra={false} />
      {/* tampa articulada atrás */}
      <group position={[0, 0.06, -0.165]} rotation={[-a, 0, 0]}>
        <Caixa pos={[0, 0.022, 0.165]} tam={[0.46, 0.045, 0.33]} cor="#202026" />
        {[-0.14, 0.14].map((x) => (<Caixa key={x} pos={[x, 0.03, 0.332]} tam={[0.04, 0.03, 0.01]} cor="#c9a046" sombra={false} />))}
        <Barra a={[-0.06, 0.03, 0.335]} b={[0.06, 0.03, 0.335]} r={0.008} cor="#111" sombra={false} />
      </group>
      {aberta > 0.05 && (
        <group position={[0, 0.06, 0]}>
          {[-0.16, -0.12, -0.08, -0.04, 0.0, 0.04, 0.08, 0.12].map((x, i) => (
            <mesh key={i} position={[x, 0.022, -0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.018, 0.018, 0.2, 24]} /><Mat cor="#c9302c" /></mesh>
          ))}
          <Caixa pos={[0.0, 0.02, 0.08]} tam={[0.16, 0.05, 0.07]} cor="#2b2f3a" />
          <Caixa pos={[0.0, 0.047, 0.08]} tam={[0.1, 0.004, 0.05]} cor="#ffd23f" sombra={false} />
          <Barra a={[-0.16, 0.04, 0.05]} b={[-0.04, 0.05, 0.08]} r={0.004} cor="#d6282b" sombra={false} />
          <Barra a={[0.12, 0.04, 0.05]} b={[0.04, 0.05, 0.08]} r={0.004} cor="#2f6fd6" sombra={false} />
          <Barra a={[0.08, 0.05, 0.08]} b={[0.17, 0.03, 0.12]} r={0.004} cor="#ffd23f" sombra={false} />
          <mesh position={[0.17, 0.035, 0.12]}><sphereGeometry args={[0.012, 20, 14]} /><meshBasicMaterial color={Math.sin(t * 8) > 0 ? '#ff3b3b' : '#5a1010'} /></mesh>
        </group>
      )}
    </group>
  );
};

// o homem de terno escuro, gravata preta e óculos escuros (Zé como personagem). Zé 2.0: terno com lapela automático
// (gravata + camisa escura), óculos escuros no rosto, pasta NA MÃO ESQUERDA (braço caído), sacola no peito, paraquedas nas costas. Sério.
export const Cooper: React.FC<{pos: V3; rotY?: number; t: number; acao?: AcaoBoneco; esc?: number; pasta?: boolean; sacola?: boolean; paraquedas?: boolean; capa?: boolean; expressao?: Expressao; maoD?: React.ReactNode; maoE?: React.ReactNode; frente?: React.ReactNode}> = ({pos, rotY = 0, t, acao = 'parado', esc = 0.92, pasta = false, sacola = false, paraquedas = false, capa = false, expressao = 'serio', maoD, maoE, frente}) => (
  <Boneco
    pos={pos}
    rotY={rotY}
    acao={acao}
    t={t}
    v={{...(capa ? {...COOPER, camisa: '#6b5a44', calca: '#2a2d36'} : COOPER), oculos: 'escuro'}}
    esc={esc}
    expressao={expressao}
    pegada="lado"
    maoD={maoD}
    maoE={maoE ?? (pasta && acao !== 'senta' ? (
      <group position={[0, -0.2, 0.0]}>
        <Barra a={[0, 0.2, -0.05]} b={[0, 0.2, 0.05]} r={0.012} cor="#111" />
        <Caixa pos={[0, 0, 0]} tam={[0.09, 0.33, 0.46]} cor="#1a1a1e" />
        {[-0.12, 0.12].map((z) => (<Caixa key={z} pos={[0, 0.15, z]} tam={[0.095, 0.03, 0.04]} cor="#c9a046" sombra={false} />))}
      </group>
    ) : undefined)}
    frente={frente ?? (sacola && acao === 'carrega' ? (
      // carregando: a sacola fica ENTRE as mãos (as mãos fecham nas alças laterais, nada atravessa)
      <group position={[0, -0.04, -0.02]}>
        <mesh scale={[0.72, 0.9, 0.62]} castShadow><sphereGeometry args={[0.24, 24, 16]} /><Mat cor="#d9d0b8" /></mesh>
        <mesh position={[0, 0.2, 0]} castShadow><coneGeometry args={[0.07, 0.12, 20]} /><Mat cor="#cfc5aa" /></mesh>
        <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.05, 0.01, 8, 24]} /><Mat cor="#8a6a3a" /></mesh>
        {[-1, 1].map((s) => (<mesh key={s} position={[s * 0.17, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.045, 0.012, 8, 20]} /><Mat cor="#8a6a3a" /></mesh>))}
        <Caixa pos={[0, 0.0, 0.15]} tam={[0.18, 0.08, 0.01]} cor="#3d6b45" sombra={false} />
        {[0, 1].map((i) => (<Barra key={i} a={[-0.17, -0.06 + i * 0.1, 0.02]} b={[0.17, -0.06 + i * 0.1, 0.02]} r={0.008} cor="#5a4630" sombra={false} />))}
      </group>
    ) : undefined)}
    peito={sacola && acao !== 'carrega' ? (
      <group position={[0, -0.12, 0.12]}>
        <mesh scale={[1, 0.85, 0.6]} castShadow><sphereGeometry args={[0.24, 20, 14]} /><Mat cor="#d9d0b8" /></mesh>
        <Caixa pos={[0, 0.02, 0.13]} tam={[0.2, 0.08, 0.01]} cor="#3d6b45" sombra={false} />
      </group>
    ) : undefined}
    costas={paraquedas ? (
      <group position={[0, 0.08, -0.1]}>
        <Caixa pos={[0, 0, 0]} tam={[0.46, 0.55, 0.2]} cor="#5b6b3f" />
        <Caixa pos={[0, 0.0, -0.105]} tam={[0.36, 0.45, 0.01]} cor="#4a5634" sombra={false} />
        {/* alças: saem do topo da mochila e passam por cima dos ombros (não atravessam a cabeça) */}
        {[-0.15, 0.15].map((x) => (<Barra key={x} a={[x, 0.2, 0.06]} b={[x * 1.05, 0.1, 0.24]} r={0.018} cor="#c9b88a" sombra={false} />))}
        <Caixa pos={[0, -0.24, 0.12]} tam={[0.44, 0.04, 0.2]} cor="#c9b88a" sombra={false} />
      </group>
    ) : undefined}
  />
);

// comissária de 1971 (uniforme com saia, chapéu e cabelo comprido); bilhete na mão
export const Comissaria: React.FC<{pos: V3; rotY?: number; t: number; acao?: AcaoBoneco; v?: Visual; esc?: number; bilhete?: boolean; expressao?: Expressao}> = ({pos, rotY = 0, t, acao = 'parado', v = COMISSARIA, esc = 0.88, bilhete = false, expressao}) => (
  <Boneco
    pos={pos}
    rotY={rotY}
    acao={acao}
    t={t}
    v={{...v, saia: v.camisa ?? '#3d5f9e', chapeu: {tipo: 'comissaria', cor: v.camisa ?? '#3d5f9e'}, cabeloTipo: 'longo', gola: '#f4f4f4'}}
    esc={esc}
    expressao={expressao}
    maoD={bilhete ? (<mesh position={[0, -0.02, 0.07]} rotation={[-0.3, 0, 0.1]}><planeGeometry args={[0.16, 0.11]} /><meshStandardMaterial color="#f4efe2" side={2} /></mesh>) : undefined}
  />
);

// ---------- dinheiro ----------
// maço de 100 notas de US$ 20 (US$ 2.000): 15,6 × 6,6 × 1,1 cm, com cinta de papel
export const Maco: React.FC<{pos: V3; rotY?: number; velho?: boolean; esc?: number}> = ({pos, rotY = 0, velho = false, esc = 1}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={esc}>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.156, 0.011, 0.066]} />
      <meshStandardMaterial attach="material-0" color={velho ? '#8a8060' : '#e9eadf'} />
      <meshStandardMaterial attach="material-1" color={velho ? '#8a8060' : '#e9eadf'} />
      <meshStandardMaterial attach="material-2" map={velho ? TX.notaVelha() : TX.nota()} />
      <meshStandardMaterial attach="material-3" color="#bfc6b0" />
      <meshStandardMaterial attach="material-4" color={velho ? '#8a8060' : '#e9eadf'} />
      <meshStandardMaterial attach="material-5" color={velho ? '#8a8060' : '#e9eadf'} />
    </mesh>
    {!velho && <Caixa pos={[0, 0, 0]} tam={[0.03, 0.0125, 0.067]} cor="#d8b04a" sombra={false} />}
    {velho && <mesh position={[0.03, 0.006, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.035, 0.003, 10, 28]} /><Mat cor="#6a3a2a" /></mesh>}
  </group>
);

// sacola de lona do banco (dinheiro do resgate)
export const Sacola: React.FC<{pos: V3; rotY?: number; esc?: number}> = ({pos, rotY = 0, esc = 1}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={esc}>
    <mesh position={[0, 0.22, 0]} scale={[1, 1.1, 0.75]} castShadow><sphereGeometry args={[0.22, 20, 14]} /><Mat cor="#ddd4bc" /></mesh>
    <mesh position={[0, 0.45, 0]} castShadow><coneGeometry args={[0.1, 0.16, 24]} /><Mat cor="#cfc5aa" /></mesh>
    <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.07, 0.012, 10, 28]} /><Mat cor="#8a6a3a" /></mesh>
    <mesh position={[0, 0.22, 0.166]}><planeGeometry args={[0.2, 0.12]} /><meshStandardMaterial map={TX.placa('BANCO', '#ddd4bc', '#3d6b45', 256, 154)} transparent /></mesh>
  </group>
);

// paraquedas dobrado (mochila de costas ou reserva de peito)
export const Paraquedas: React.FC<{pos: V3; rotY?: number; reserva?: boolean}> = ({pos, rotY = 0, reserva = false}) => {
  const [w, h, d] = reserva ? [0.38, 0.24, 0.18] : [0.46, 0.18, 0.56];
  const cor = reserva ? '#d9d6c8' : '#5b6b3f';
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Caixa pos={[0, h / 2, 0]} tam={[w, h, d]} cor={cor} />
      <Caixa pos={[0, h + 0.005, 0]} tam={[w * 0.8, 0.01, d * 0.8]} cor={reserva ? '#bdb9a8' : '#4a5634'} sombra={false} />
      {[-w * 0.3, w * 0.3].map((x) => (<Caixa key={x} pos={[x, h / 2, 0]} tam={[0.04, h + 0.02, d + 0.02]} cor="#c9b88a" sombra={false} />))}
      <Cil pos={[0, h + 0.02, d * 0.3]} r={0.03} h={0.03} cor="#c9ced6" seg={8} />
    </group>
  );
};

// ---------- árvores (pinheiros do Noroeste americano) ----------
export const Pinheiro: React.FC<{pos: V3; h?: number; cor?: string; larg?: number}> = ({pos, h = 14, cor = '#2f5330', larg = 1}) => (
  <group position={pos}>
    <Cil pos={[0, h * 0.2, 0]} r={h * 0.025} h={h * 0.4} cor="#4a3426" seg={6} />
    {[0.3, 0.5, 0.7].map((y, i) => (
      <mesh key={i} position={[0, h * y + h * 0.12, 0]} castShadow><coneGeometry args={[h * (0.24 - i * 0.06) * larg, h * 0.36, 24]} /><Mat cor={i % 2 ? cor : '#284a29'} /></mesh>
    ))}
  </group>
);

// floresta instanciada (milhares de pinheiros baratos): área [x0,x1]×[z0,z1]
export const Floresta: React.FC<{x: [number, number]; z: [number, number]; n: number; h: [number, number]; y?: number; seed?: number; fora?: (x: number, z: number) => boolean}> = ({x, z, n, h, y = 0, seed = 7, fora}) => {
  const geoC = useMemo(() => new THREE.ConeGeometry(1, 1, 6).translate(0, 0.5, 0), []);
  const geoT = useMemo(() => new THREE.CylinderGeometry(0.1, 0.12, 1, 5).translate(0, 0.5, 0), []);
  const {a, b, tr} = useMemo(() => {
    const r = rnd(seed);
    const a: THREE.Matrix4[] = [], b: THREE.Matrix4[] = [], tr: THREE.Matrix4[] = [];
    for (let i = 0; i < n; i++) {
      const px = lerp(x[0], x[1], r()), pz = lerp(z[0], z[1], r());
      if (fora && fora(px, pz)) continue;
      const hh = lerp(h[0], h[1], r());
      const raio = hh * (0.2 + r() * 0.06);
      (i % 2 ? a : b).push(new THREE.Matrix4().compose(new THREE.Vector3(px, y + hh * 0.2, pz), new THREE.Quaternion(), new THREE.Vector3(raio, hh * 0.85, raio)));
      tr.push(new THREE.Matrix4().compose(new THREE.Vector3(px, y, pz), new THREE.Quaternion(), new THREE.Vector3(hh * 0.25, hh * 0.25, hh * 0.25)));
    }
    return {a, b, tr};
  }, [n, seed, x[0], x[1], z[0], z[1], h[0], h[1], y]);
  return (
    <group>
      <Instancias matrizes={a} n={a.length} geo={geoC} cor="#2a4d2c" />
      <Instancias matrizes={b} n={b.length} geo={geoC} cor="#355e33" />
      <Instancias matrizes={tr} n={tr.length} geo={geoT} cor="#4a3426" sombra={false} />
    </group>
  );
};

// ---------- carro sedã de 1970 (5,3 m) ----------
export const Carro: React.FC<{pos: V3; rotY?: number; cor?: string; farol?: boolean; t?: number}> = ({pos, rotY = 0, cor = '#7a2a2a', farol = true}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.55, 0]} tam={[5.3, 0.55, 1.95]} cor={cor} />
    <Caixa pos={[-0.3, 1.05, 0]} tam={[2.6, 0.5, 1.75]} cor={cor} />
    {[-1, 1].map((s) => (<Caixa key={s} pos={[-0.3, 1.05, s * 0.88]} tam={[2.3, 0.38, 0.02]} cor="#1d2233" sombra={false} />))}
    <Caixa pos={[1.02, 1.05, 0]} rot={[0, 0, -0.5]} tam={[0.02, 0.5, 1.6]} cor="#2a3550" sombra={false} />
    <Caixa pos={[-1.62, 1.05, 0]} rot={[0, 0, 0.5]} tam={[0.02, 0.45, 1.6]} cor="#2a3550" sombra={false} />
    {[2.67, -2.67].map((x) => (<Caixa key={x} pos={[x, 0.42, 0]} tam={[0.1, 0.16, 2.0]} cor="#d9dde3" />))}
    <Caixa pos={[0, 0.62, 0]} tam={[5.32, 0.04, 1.97]} cor="#c9ced6" sombra={false} />
    {[[1.7, 1], [1.7, -1], [-1.6, 1], [-1.6, -1]].map(([x, s], i) => (
      <group key={i} position={[x, 0.36, s * 0.92]}>
        <Cil pos={[0, 0, 0]} rot={[Math.PI / 2, 0, 0]} r={0.36} h={0.24} cor="#151518" seg={12} />
        <Cil pos={[0, 0, s * 0.125]} rot={[Math.PI / 2, 0, 0]} r={0.18} h={0.02} cor="#c9ced6" seg={10} />
      </group>
    ))}
    {[-0.6, 0.6].map((z) => (
      <group key={z}>
        <mesh position={[2.66, 0.62, z]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.12, 40]} /><meshBasicMaterial color={farol ? '#fff4c9' : '#9a9a9a'} toneMapped={false} /></mesh>
        <Caixa pos={[-2.66, 0.62, z]} tam={[0.04, 0.12, 0.4]} cor="#c9302c" sombra={false} />
      </group>
    ))}
    {farol && <spotLight position={[2.8, 0.7, 0]} target-position={[30, 0, 0]} angle={0.5} penumbra={0.6} intensity={80} distance={40} decay={1.2} color="#fff0c0" />}
  </group>
);

// poste de luz do pátio
export const Poste: React.FC<{pos: V3; h?: number; luz?: number; cor?: string}> = ({pos, h = 12, luz = 0, cor = '#ffd59a'}) => (
  <group position={pos}>
    <Cil pos={[0, h / 2, 0]} r={0.15} r2={0.2} h={h} cor="#6b707c" seg={8} />
    <Caixa pos={[0, h + 0.2, 0]} tam={[1.6, 0.35, 0.8]} cor="#4a4e58" />
    <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[1.4, 0.6]} /><meshBasicMaterial color={cor} toneMapped={false} side={2} /></mesh>
    {luz > 0 && <pointLight position={[0, h - 0.5, 0]} intensity={luz} distance={h * 3.5} decay={1.2} color={cor} />}
  </group>
);

// ---------- Boeing 727-100 (nariz para +X; origem no centro da fuselagem) ----------
const shapeGeo = (pts: [number, number][], esp: number) => {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return new THREE.ExtrudeGeometry(s, {depth: esp, bevelEnabled: false});
};
export const R727 = 1.88; // raio da fuselagem
export const CHAO727 = 3.3; // altura do centro da fuselagem com o trem no chão
export const ESCADA_X = -12.2; // dobradiça da escada traseira (barriga, logo atrás da cabine)
export const ESCADA_L = 4.2;
// ângulo da escada: guardada (rente à barriga da cauda) → aberta
export const angEscada = (k: number, noChao = false) => lerp(-0.26, noChao ? Math.asin((CHAO727 - R727) / ESCADA_L) : 0.62, suave(k));

export const Escada727: React.FC<{ang: number}> = ({ang}) => (
  <group position={[ESCADA_X, -R727 + 0.05, 0]} rotation={[0, 0, ang]}>
    <Caixa pos={[-ESCADA_L / 2, -0.06, 0]} tam={[ESCADA_L, 0.12, 0.96]} cor="#b9bec7" />
    {Array.from({length: 12}).map((_, i) => (<Caixa key={i} pos={[-0.25 - i * 0.33, 0.02, 0]} tam={[0.1, 0.05, 0.86]} cor={i % 2 ? '#5a5f6b' : '#6b707c'} sombra={false} />))}
    {[-0.46, 0.46].map((z) => (
      <group key={z}>
        <Caixa pos={[-ESCADA_L / 2, 0.05, z]} tam={[ESCADA_L, 0.2, 0.05]} cor="#9aa0aa" />
        {[0.4, 1.6, 2.8, 3.9].map((x) => (<Barra key={x} a={[-x, 0.1, z]} b={[-x - 0.15, 0.95, z]} r={0.02} cor="#d9dde3" />))}
        <Barra a={[-0.4, 0.95, z]} b={[-4.05, 0.95, z]} r={0.025} cor="#d9dde3" />
      </group>
    ))}
  </group>
);

export const B727: React.FC<{pos?: V3; rot?: V3; esc?: number; t?: number; escada?: number; noChao?: boolean; trem?: boolean; luzes?: boolean; janelasAcesas?: boolean}> = ({pos = [0, 0, 0], rot = [0, 0, 0], esc = 1, t = 0, escada = 0, noChao = false, trem = true, luzes = true, janelasAcesas = true}) => {
  const asa = useMemo(() => shapeGeo([[5.6, 0], [-2.2, 0], [-7.2, 14.6], [-5.2, 14.6]], 0.34), []);
  const deriva = useMemo(() => shapeGeo([[-10.2, 0], [-17.4, 0], [-21.0, 7.0], [-18.2, 7.0]], 0.32), []);
  const prof = useMemo(() => shapeGeo([[0, 0], [-2.8, 0], [-5.0, 5.4], [-3.8, 5.4]], 0.22), []);
  const pisca = luzes && Math.sin(t * 7) > 0.55;
  const BR = '#eef0f3', MET = '#b9bec7', AZ = '#1f3c6e', AM = '#e9a23b';
  const janelas = useMemo(() => {
    const out: number[] = [];
    for (let x = -10.5; x <= 12.2; x += 0.51) if (Math.abs(x - 1.2) > 0.6) out.push(x);
    return out;
  }, []);
  const k = clamp01(escada);
  return (
    <group position={pos} rotation={rot} scale={esc}>
      {/* fuselagem: parte reta, nariz e cauda levantada */}
      <mesh position={[1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow><cylinderGeometry args={[R727, R727, 27.4, 20]} /><Mat cor={BR} rugoso={0.45} /></mesh>
      <mesh position={[1.5, -0.55, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[R727 + 0.012, R727 + 0.012, 27.4, 20, 1, true, Math.PI * 0.62, Math.PI * 0.76]} /><meshStandardMaterial color={MET} side={2} metalness={0.4} roughness={0.4} /></mesh>
      {/* faixa (cheatline) azul e amarela na altura das janelas */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Caixa pos={[1.5, 0.12, s * (R727 - 0.02)]} tam={[27.4, 0.34, 0.06]} cor={AZ} sombra={false} />
          <Caixa pos={[1.5, -0.12, s * (R727 - 0.03)]} tam={[27.4, 0.08, 0.06]} cor={AM} sombra={false} />
        </group>
      ))}
      <mesh position={[17.4, -0.15, 0]} rotation={[0, 0, -Math.PI / 2 - 0.04]} castShadow><cylinderGeometry args={[0.45, R727, 4.8, 20]} /><Mat cor={BR} rugoso={0.45} /></mesh>
      <mesh position={[19.85, -0.27, 0]}><sphereGeometry args={[0.47, 20, 14]} /><Mat cor="#2b2f3a" /></mesh>
      <mesh position={[-16.25, 0.45, 0]} rotation={[0, 0, Math.PI / 2 - 0.105]} castShadow><cylinderGeometry args={[0.55, R727, 8.6, 20]} /><Mat cor={BR} rugoso={0.45} /></mesh>
      <mesh position={[-20.55, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.5, 0.5, 0.2, 24]} /><Mat cor="#2b2f3a" /></mesh>
      {/* cabine de comando */}
      {[-1, 1].map((s) => (<Caixa key={s} pos={[17.2, 0.72, s * 0.95]} rot={[s * 0.5, 0, -0.35]} tam={[1.1, 0.34, 0.5]} cor="#1d2233" sombra={false} />))}
      <Caixa pos={[17.55, 0.85, 0]} rot={[0, 0, -0.55]} tam={[0.7, 0.32, 1.1]} cor="#1d2233" sombra={false} />
      {/* janelas (acesas à noite) */}
      {[-1, 1].map((s) => janelas.map((x) => (
        <mesh key={s + ':' + x} position={[x, 0.45, s * (R727 - 0.045)]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[0.24, 0.3]} />
          <meshBasicMaterial color={janelasAcesas ? '#ffdf9a' : '#2a3550'} toneMapped={false} />
        </mesh>
      )))}
      {/* portas (contorno) */}
      {[[14.2, 1], [14.2, -1], [-9.6, 1]].map(([x, s], i) => (<Caixa key={i} pos={[x, 0.1, s * (R727 - 0.01)]} tam={[0.9, 1.75, 0.04]} cor="#d3d7de" sombra={false} />))}
      <Letreiro texto="305" pos={[-17.6, 3.3, 0.18]} larg={1.6} alt={0.7} fundo={AZ} cor="#ffffff" />
      {/* asas (enflechamento de 32°) com flaps abaixados */}
      {[1, -1].map((s) => (
        <group key={s} position={[1.6, -1.25, s * 1.4]} rotation={[s > 0 ? Math.PI / 2 - 0.05 : -Math.PI / 2 + 0.05, 0, 0]}>
          <mesh geometry={asa} castShadow receiveShadow><Mat cor="#dfe3ea" rugoso={0.45} /></mesh>
          <group position={[-2.6, 4.5, 0.17]} rotation={[0, 0, -0.33]}>
            <Caixa pos={[0, 0, 0]} rot={[0, 0.25, 0]} tam={[1.1, 8.5, 0.12]} cor="#9aa0aa" />
          </group>
          {[3, 7, 11].map((y) => (<Caixa key={y} pos={[-1.2 - y * 0.34, y, -0.1]} tam={[1.6, 0.18, 0.3]} cor="#9aa0aa" sombra={false} />))}
        </group>
      ))}
      {/* motores traseiros (2 laterais + 1 central na deriva) */}
      {[1, -1].map((s) => (
        <group key={'m' + s} position={[-14.2, 0.85, s * 2.85]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.72, 0.6, 4.4, 24]} /><Mat cor="#d3d7de" rugoso={0.35} /></mesh>
          <mesh position={[2.21, 0, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.66, 40]} /><meshStandardMaterial color="#25282f" side={2} /></mesh>
          <mesh position={[2.22, 0, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.16, 40]} /><meshStandardMaterial color="#c9ced6" side={2} /></mesh>
          <Caixa pos={[-0.2, 0, -s * 0.7]} tam={[2.6, 0.35, 0.9]} cor="#dfe3ea" />
        </group>
      ))}
      <mesh position={[-11.2, 2.15, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.8]}><cylinderGeometry args={[0.6, 0.66, 1.4, 24]} /><Mat cor="#d3d7de" /></mesh>
      <mesh position={[-10.49, 2.15, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.8, 1, 1]}><circleGeometry args={[0.55, 40]} /><meshStandardMaterial color="#25282f" side={2} /></mesh>
      {/* deriva em T e profundor no topo */}
      <group position={[0, 1.4, -0.16]}>
        <mesh geometry={deriva} castShadow><Mat cor={AZ} rugoso={0.5} /></mesh>
        <Caixa pos={[-17.6, 3.6, 0.16]} rot={[0, 0, 1.03]} tam={[7.6, 0.25, 0.34]} cor={AM} sombra={false} />
      </group>
      {[1, -1].map((s) => (
        <group key={'p' + s} position={[-18.4, 8.45, s * 0.1]} rotation={[s > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0]}>
          <mesh geometry={prof} castShadow><Mat cor={AZ} /></mesh>
        </group>
      ))}
      {/* trem de pouso (no voo do Cooper ficou ABAIXADO) */}
      {trem && [[-0.8, 2.9], [-0.8, -2.9], [14.0, 0]].map(([x, z], i) => (
        <group key={'t' + i}>
          <Cil pos={[x, -2.0, z]} r={0.12} h={1.4} cor="#9aa0aa" />
          {(i < 2 ? [-0.35, 0.35] : [-0.15, 0.15]).map((dz) => (<Cil key={dz} pos={[x, -2.75, z + dz]} rot={[Math.PI / 2, 0, 0]} r={i < 2 ? 0.55 : 0.38} h={0.3} cor="#151518" seg={12} />))}
        </group>
      ))}
      {/* escada traseira e a porta acesa da cabine */}
      <Escada727 ang={angEscada(k, noChao)} />
      {k > 0.05 && <mesh position={[ESCADA_X - 0.45, -R727 + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[0.9, 0.9]} /><meshBasicMaterial color="#ffdf9a" side={2} toneMapped={false} /></mesh>}
      {k > 0.05 && <pointLight position={[ESCADA_X - 1.2, -R727 - 1.0, 0]} intensity={14 * k} distance={9} decay={1.3} color="#ffd59a" />}
      {/* luzes de navegação e farol rotativo */}
      {luzes && (
        <>
          <mesh position={[-5.3, -1.0, -16.1]}><sphereGeometry args={[0.18, 20, 14]} /><meshBasicMaterial color="#ff3b3b" toneMapped={false} /></mesh>
          <mesh position={[-5.3, -1.0, 16.1]}><sphereGeometry args={[0.18, 20, 14]} /><meshBasicMaterial color="#3bff7a" toneMapped={false} /></mesh>
          <mesh position={[2, R727 + 0.1, 0]}><sphereGeometry args={[0.2, 20, 14]} /><meshBasicMaterial color={pisca ? '#ff4040' : '#5a1414'} toneMapped={false} /></mesh>
          <mesh position={[2, -R727 - 0.1, 0]}><sphereGeometry args={[0.2, 20, 14]} /><meshBasicMaterial color={!pisca ? '#ff4040' : '#5a1414'} toneMapped={false} /></mesh>
          {pisca && <pointLight position={[2, R727 + 0.8, 0]} color="#ff4040" intensity={25} distance={14} decay={1.5} />}
        </>
      )}
    </group>
  );
};

// ---------- poltrona de avião (anos 70, com capa branca no encosto) ----------
export const Poltrona: React.FC<{pos: V3; cor: string; cor2: string}> = ({pos, cor, cor2}) => {
  const map = TX.tecido(cor, cor2);
  return (
    <group position={pos}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow><boxGeometry args={[0.44, 0.12, 0.46]} /><meshStandardMaterial map={map} roughness={0.9} /></mesh>
      <mesh position={[-0.24, 0.82, 0]} rotation={[0, 0, 0.12]} castShadow receiveShadow><boxGeometry args={[0.1, 0.78, 0.44]} /><meshStandardMaterial map={map} roughness={0.9} /></mesh>
      <Caixa pos={[-0.22, 1.13, 0]} rot={[0, 0, 0.12]} tam={[0.12, 0.22, 0.36]} cor="#f2efe6" />
      {[-0.235, 0.235].map((z) => (<Caixa key={z} pos={[-0.02, 0.58, z]} tam={[0.4, 0.05, 0.05]} cor="#5a5f6b" />))}
      <Caixa pos={[-0.02, 0.18, 0]} tam={[0.3, 0.36, 0.06]} cor="#6b707c" />
    </group>
  );
};

// árvore de cidade / arbusto
export const Arbusto: React.FC<{pos: V3; esc?: number; cor?: string}> = ({pos, esc = 1, cor = '#3f7a42'}) => (
  <group position={pos} scale={esc}>
    {[[0, 0.35, 0, 0.45], [0.3, 0.3, 0.1, 0.32], [-0.28, 0.28, -0.05, 0.3]].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} castShadow><icosahedronGeometry args={[r, 0]} /><Mat cor={i ? '#4a8a4a' : cor} /></mesh>
    ))}
  </group>
);

// mala
export const Mala: React.FC<{pos: V3; rotY?: number; cor?: string; tam?: V3}> = ({pos, rotY = 0, cor = '#8a5a2b', tam = [0.6, 0.45, 0.2]}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, tam[1] / 2, 0]} tam={tam} cor={cor} />
    <Caixa pos={[0, tam[1] / 2, 0]} tam={[tam[0] + 0.01, 0.04, tam[2] + 0.01]} cor="#3a2a1a" sombra={false} />
    <Barra a={[-0.08, tam[1] + 0.01, 0]} b={[0.08, tam[1] + 0.01, 0]} r={0.015} cor="#2b2233" />
  </group>
);
