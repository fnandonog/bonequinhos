// Biblioteca de peças 3D low-poly em ESCALA REAL (1 unidade = 1 metro).
// Regra do cenógrafo: toda medida aqui vem do mundo real (bloco 14x19x29 cm, porta 0,8x2,1 m, pessoa ~1,7 m).
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {V3} from './planta';

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const suave = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

export const Mat: React.FC<{cor: string; rugoso?: number; map?: THREE.Texture | null; emissivo?: string}> = ({cor, rugoso = 0.9, map, emissivo}) => (
  <meshStandardMaterial color={cor} flatShading roughness={rugoso} map={map ?? null} emissive={emissivo ?? '#000000'} />
);

type Base = {pos?: V3; rot?: V3 | number; esc?: number | V3};
const rotV = (r?: V3 | number): V3 => (typeof r === 'number' ? [0, r, 0] : r ?? [0, 0, 0]);

export const Caixa: React.FC<Base & {tam: V3; cor: string; map?: THREE.Texture | null; sombra?: boolean}> = ({pos = [0, 0, 0], rot, tam, cor, map, sombra = true}) => (
  <mesh position={pos} rotation={rotV(rot)} castShadow={sombra} receiveShadow>
    <boxGeometry args={tam} />
    <Mat cor={cor} map={map} />
  </mesh>
);

export const Cil: React.FC<Base & {r: number; h: number; cor: string; seg?: number; r2?: number}> = ({pos = [0, 0, 0], rot, r, r2, h, cor, seg = 10}) => (
  <mesh position={pos} rotation={rotV(rot)} castShadow receiveShadow>
    <cylinderGeometry args={[r, r2 ?? r, h, seg]} />
    <Mat cor={cor} />
  </mesh>
);

// barra entre dois pontos (ferro, linha de nylon, caibro...)
export const Barra: React.FC<{a: V3; b: V3; r?: number; cor: string; quadrada?: boolean; sombra?: boolean}> = ({a, b, r = 0.01, cor, quadrada, sombra = true}) => {
  const {pos, quat, len} = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const d = vb.clone().sub(va);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    return {pos: va.add(vb).multiplyScalar(0.5), quat: q, len: d.length()};
  }, [a[0], a[1], a[2], b[0], b[1], b[2]]);
  return (
    <mesh position={pos} quaternion={quat} castShadow={sombra}>
      {quadrada ? <boxGeometry args={[r * 2, len, r * 2]} /> : <cylinderGeometry args={[r, r, len, 6]} />}
      <Mat cor={cor} rugoso={0.6} />
    </mesh>
  );
};

// ---------- texturas (geradas uma vez) ----------
const cache = new Map<string, THREE.Texture>();
function tex(id: string, w: number, h: number, pinta: (g: CanvasRenderingContext2D) => void) {
  const c0 = cache.get(id);
  if (c0) return c0;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  pinta(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(id, t);
  return t;
}

// 2 fiadas x 2 blocos (módulo 0,60 x 0,40 m) com junta de argamassa, juntas desencontradas
export const texBloco = () =>
  tex('bloco', 256, 172, (g) => {
    g.fillStyle = '#cfc6b8';
    g.fillRect(0, 0, 256, 172);
    const bl = (x: number, y: number, w: number) => {
      g.fillStyle = '#d9773e';
      g.fillRect(x + 2, y + 2, w - 4, 82);
      g.fillStyle = 'rgba(0,0,0,0.10)';
      g.fillRect(x + 2, y + 66, w - 4, 18);
      g.fillStyle = 'rgba(255,255,255,0.12)';
      g.fillRect(x + 2, y + 2, w - 4, 10);
    };
    bl(0, 0, 128);
    bl(128, 0, 128);
    bl(-64, 86, 128);
    bl(64, 86, 128);
    bl(192, 86, 128);
  });

// terra em corte: camada escura em cima, argila laranja com pedrinhas embaixo (v de 0 a 1 = base ao topo)
export const texTerra = () =>
  tex('terra', 128, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#6b4a2f');
    gr.addColorStop(0.16, '#6b4a2f');
    gr.addColorStop(0.2, '#a9652f');
    gr.addColorStop(1, '#b8743a');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 256);
    let s = 7;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = i % 3 ? 'rgba(90,60,40,0.35)' : 'rgba(220,200,170,0.5)';
      g.beginPath();
      g.ellipse(r() * 128, 60 + r() * 190, 3 + r() * 5, 2 + r() * 3, 0, 0, Math.PI * 2);
      g.fill();
    }
  });

// UVs da caixa em METROS / módulo, para a textura repetir em escala real em qualquer tamanho
export function caixaUV(w: number, h: number, d: number, mu: number, mv: number, ou = 0, ov = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // faces: +x,-x,+y,-y,+z,-z ; 4 vértices cada
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    const frente = f >= 4;
    uv.setXY(i, (uv.getX(i) * dims[f][0] + (frente ? ou : 0)) / mu, (uv.getY(i) * dims[f][1] + (f !== 2 && f !== 3 ? ov : 0)) / mv);
  }
  uv.needsUpdate = true;
  return g;
}

// ---------- rótulo 3D (pílula com linha guia), tamanho constante na tela ----------
export function texPilula(texto: string, fundo = '#ffffff', cor = '#1d1b26') {
  return tex(`pil:${texto}:${fundo}`, 640, 150, (g) => {
    let fs = 84;
    g.font = `800 ${fs}px 'Baloo 2', sans-serif`;
    while (g.measureText(texto).width > 540 && fs > 40) {
      fs -= 4;
      g.font = `800 ${fs}px 'Baloo 2', sans-serif`;
    }
    const w = Math.min(620, g.measureText(texto).width + 80);
    const x0 = (640 - w) / 2;
    g.fillStyle = fundo;
    g.beginPath();
    g.roundRect(x0, 14, w, 122, 61);
    g.fill();
    g.lineWidth = 9;
    g.strokeStyle = '#1d1b26';
    g.stroke();
    g.fillStyle = cor;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(texto, 320, 80);
  });
}

export const Rotulo: React.FC<{texto: string; ancora: V3; sobe?: number; lado?: number; vis?: number; fundo?: string; cor?: string; tam?: number}> = ({texto, ancora, sobe = 1.2, lado = 0, vis = 1, fundo, cor, tam = 1}) => {
  const {camera} = useThree();
  if (vis <= 0.01) return null;
  const t = texPilula(texto, fundo, cor);
  // posição desejada no mundo, depois "puxada" para dentro da área segura da tela (nada de rótulo cortado na borda)
  camera.updateMatrixWorld();
  const v = new THREE.Vector3(ancora[0] + lado, ancora[1] + sobe, ancora[2]).project(camera);
  const lim = 0.5 - 0.14 * tam;
  v.x = Math.max(-lim, Math.min(lim, v.x));
  v.y = Math.max(-0.3, Math.min(0.42, v.y));
  const w = v.unproject(camera);
  const topo: V3 = [w.x, w.y, w.z];
  const s = vis * tam;
  return (
    <group>
      <Barra a={ancora} b={[lerp(ancora[0], topo[0], vis), lerp(ancora[1], topo[1], vis), lerp(ancora[2], topo[2], vis)]} r={0.02} cor="#1d1b26" sombra={false} />
      <mesh position={ancora}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#1d1b26" />
      </mesh>
      <sprite position={topo} scale={[0.19 * s, 0.045 * s, 1]} renderOrder={10}>
        <spriteMaterial map={t} depthTest={false} sizeAttenuation={false} />
      </sprite>
    </group>
  );
};

// ---------- personagens ----------
export type AcaoBoneco = 'parado' | 'anda' | 'aponta' | 'acena' | 'comemora' | 'cava' | 'martela' | 'pinta' | 'carrega' | 'senta';
export type Visual = {
  camisa?: string; colete?: string | null; capacete?: string | null; calca?: string; pele?: string; cabelo?: string; chef?: boolean;
  // peças de época (opcionais; usadas pelo perfil Você na História). Sem elas o boneco é idêntico ao de sempre.
  elmo?: {cor: string; penacho?: string}; escudo?: string; toga?: string; coroa?: string;
};
export const CHEF: Visual = {camisa: '#ffffff', colete: null, capacete: null, calca: '#2b2233', chef: true};
export const OBREIRO: Visual = {camisa: '#4f8cff', colete: '#ff8a1f', capacete: '#ffd23f', calca: '#30406b'};
export const SERVENTE: Visual = {camisa: '#e9e4d8', colete: null, capacete: '#ffffff', calca: '#5b4a3a', pele: '#c98e62'};
export const ENGENHEIRA: Visual = {camisa: '#ffffff', colete: '#2fbf71', capacete: '#ffffff', calca: '#2b2b3a', pele: '#8d5a3b', cabelo: '#1d1b26'};
export const MORADOR: Visual = {camisa: '#ff5d73', colete: null, capacete: null, calca: '#2f5d8a', cabelo: '#3b2a20'};
export const CRIANCA: Visual = {camisa: '#ffd23f', colete: null, capacete: null, calca: '#4f8cff', cabelo: '#6b3e26'};

export type Ferramenta = 'pa' | 'rolo' | 'colher' | 'planta' | 'bloco' | 'martelo' | 'gladio' | 'rudis' | 'tridente' | 'chicote' | 'tocha' | 'taca' | null;
export const Boneco: React.FC<{pos: V3; rotY?: number; acao?: AcaoBoneco; t: number; v?: Visual; esc?: number; ferramenta?: Ferramenta}> = ({pos, rotY = 0, acao = 'parado', t, v = OBREIRO, esc = 0.92, ferramenta = null}) => {
  const {camisa = '#4f8cff', colete = '#ff8a1f', capacete = '#ffd23f', calca = '#30406b', pele = '#ffd2ad', cabelo = '#3b2a20', chef = false, elmo, escudo, toga, coroa} = v;
  const passo = acao === 'anda' ? Math.sin(t * 9) * 0.6 : 0;
  const pulo = acao === 'comemora' ? Math.abs(Math.sin(t * 6)) * 0.3 : acao === 'anda' ? Math.abs(Math.sin(t * 9)) * 0.04 : 0;
  let bD = passo * -0.8, bE = passo * 0.8, bDz = -0.15, bEz = 0.15, tronco = 0;
  if (acao === 'aponta') { bD = -1.5; bDz = -0.1; }
  if (acao === 'acena') { bDz = -2.6 + Math.sin(t * 10) * 0.35; bD = 0; }
  if (acao === 'comemora') { bDz = -2.7; bEz = 2.7; }
  if (acao === 'cava') { const k = (Math.sin(t * 5) + 1) / 2; bD = -0.4 - k * 1.1; bE = -0.4 - k * 1.1; tronco = 0.15 + k * 0.35; }
  if (acao === 'martela') { bD = -1.2 - Math.abs(Math.sin(t * 8)) * 1.2; tronco = 0.1; }
  if (acao === 'pinta') { bD = -2.2 + Math.sin(t * 4) * 0.6; bE = -0.3; }
  if (acao === 'carrega') { bD = -1.1; bE = -1.1; bDz = 0.1; bEz = -0.1; }
  const pernaY = acao === 'senta' ? 0.25 : 0.28;
  const prop = (() => {
    if (ferramenta === 'pa') return (<group position={[0, -0.45, 0.05]} rotation={[0.3, 0, 0]}><Cil pos={[0, 0.1, 0]} r={0.02} h={1.0} cor="#8b5a3c" /><Caixa pos={[0, -0.45, 0]} tam={[0.22, 0.28, 0.03]} cor="#7f8790" /></group>);
    if (ferramenta === 'rolo') return (<group position={[0, -0.45, 0.05]}><Cil pos={[0, 0.25, 0]} r={0.015} h={0.5} cor="#ddd" /><Cil pos={[0, 0.55, 0]} rot={[0, 0, Math.PI / 2]} r={0.05} h={0.24} cor="#f2f2f2" /></group>);
    if (ferramenta === 'colher') return (<group position={[0, -0.48, 0.08]}><Cil r={0.02} h={0.1} cor="#8b5a3c" /><Caixa pos={[0, -0.03, 0.09]} tam={[0.12, 0.01, 0.16]} cor="#9aa0aa" /></group>);
    if (ferramenta === 'martelo') return (<group position={[0, -0.48, 0.05]}><Cil pos={[0, 0, 0.1]} rot={[Math.PI / 2, 0, 0]} r={0.015} h={0.3} cor="#8b5a3c" /><Caixa pos={[0, 0, 0.25]} tam={[0.12, 0.05, 0.05]} cor="#555" /></group>);
    if (ferramenta === 'bloco') return (<Caixa pos={[0, -0.5, 0.2]} tam={[0.29, 0.19, 0.14]} cor="#d9773e" />);
    if (ferramenta === 'gladio' || ferramenta === 'rudis') {
      const lam = ferramenta === 'gladio' ? '#d7dde6' : '#a8743f';
      return (<group position={[0, -0.48, 0.05]}><Cil pos={[0, 0, 0.02]} rot={[Math.PI / 2, 0, 0]} r={0.025} h={0.14} cor="#6b3e26" /><Caixa pos={[0, 0, 0.1]} tam={[0.14, 0.03, 0.03]} cor="#c9a24a" /><Caixa pos={[0, 0, 0.4]} tam={[0.06, 0.02, 0.56]} cor={lam} /></group>);
    }
    if (ferramenta === 'tridente') return (<group position={[0, -0.48, 0.05]}><Cil pos={[0, 0.3, 0]} r={0.018} h={1.9} cor="#8b5a3c" />{[-0.08, 0, 0.08].map((x) => (<Caixa key={x} pos={[x, 1.32, 0]} tam={[0.02, 0.22, 0.02]} cor="#c9ced6" />))}<Caixa pos={[0, 1.22, 0]} tam={[0.2, 0.02, 0.02]} cor="#c9ced6" /></group>);
    if (ferramenta === 'chicote') return (<group position={[0, -0.48, 0.05]}><Cil pos={[0, 0, 0.08]} rot={[Math.PI / 2, 0, 0]} r={0.02} h={0.22} cor="#4a3426" />{[0, 1, 2, 3].map((i) => (<Barra key={i} a={[0, -i * 0.12 + Math.sin(t * 6 + i) * 0.03, 0.19 + i * 0.12]} b={[0, -(i + 1) * 0.12 + Math.sin(t * 6 + i + 1) * 0.03, 0.19 + (i + 1) * 0.12]} r={0.012} cor="#3b2a20" sombra={false} />))}</group>);
    if (ferramenta === 'tocha') return (<group position={[0, -0.48, 0.05]}><Cil pos={[0, 0.2, 0]} r={0.025} h={0.5} cor="#6b3e26" /><mesh position={[0, 0.52, 0]} scale={[1, 1 + Math.sin(t * 14) * 0.12, 1]}><coneGeometry args={[0.07, 0.22, 6]} /><meshStandardMaterial color="#ff9a2a" emissive="#ff6a00" emissiveIntensity={1.4} /></mesh></group>);
    if (ferramenta === 'taca') return (<group position={[0, -0.5, 0.1]}><Cil pos={[0, 0.06, 0]} r={0.06} r2={0.04} h={0.12} cor="#9a8f80" /><Cil pos={[0, 0.115, 0]} r={0.05} h={0.01} cor="#6f6a66" /></group>);
    if (ferramenta === 'planta') return (<Caixa pos={[0, -0.5, 0.15]} rot={[-0.6, 0, 0]} tam={[0.5, 0.35, 0.01]} cor="#2f6fd6" />);
    return null;
  })();
  return (
    <group position={[pos[0], pos[1] + pulo, pos[2]]} rotation={[0, rotY, 0]} scale={esc}>
      <mesh position={[-0.13, pernaY, 0]} rotation={[acao === 'senta' ? -1.5 : passo, 0, 0]} castShadow><capsuleGeometry args={[0.1, 0.32, 3, 8]} /><Mat cor={calca} /></mesh>
      <mesh position={[0.13, pernaY, 0]} rotation={[acao === 'senta' ? -1.5 : -passo, 0, 0]} castShadow><capsuleGeometry args={[0.1, 0.32, 3, 8]} /><Mat cor={calca} /></mesh>
      {acao !== 'senta' && <Caixa pos={[-0.13, 0.05, 0.06]} tam={[0.2, 0.1, 0.3]} cor="#4a3426" />}
      {acao !== 'senta' && <Caixa pos={[0.13, 0.05, 0.06]} tam={[0.2, 0.1, 0.3]} cor="#4a3426" />}
      <group position={[0, 0.55, 0]} rotation={[tronco, 0, 0]}>
        <group position={[0, -0.55, 0]}>
          <mesh position={[0, 0.78, 0]} castShadow><capsuleGeometry args={[0.27, 0.38, 4, 10]} /><Mat cor={camisa} /></mesh>
          {chef && (
            <>
              {[0.68, 0.86].map((y) => (<mesh key={'b' + y} position={[0.08, y, 0.27]}><sphereGeometry args={[0.035, 6, 6]} /><Mat cor="#2b2233" /></mesh>))}
              <mesh position={[0, 1.07, 0.18]} rotation={[0.3, 0, 0]}><torusGeometry args={[0.16, 0.05, 6, 12]} /><Mat cor="#e8322b" /></mesh>
            </>
          )}
          {toga && (
            <>
              <mesh position={[0, 0.74, 0.0]}><cylinderGeometry args={[0.3, 0.33, 0.56, 10, 1, true]} /><meshStandardMaterial color={toga} flatShading side={2} /></mesh>
              <mesh position={[0.02, 0.84, 0.25]} rotation={[0.25, 0, 0.75]}><boxGeometry args={[0.16, 0.62, 0.06]} /><Mat cor={toga} /></mesh>
            </>
          )}
          {colete && (
            <>
              <mesh position={[0, 0.78, 0.0]}><cylinderGeometry args={[0.3, 0.3, 0.48, 10, 1, true]} /><meshStandardMaterial color={colete} flatShading side={2} /></mesh>
              {[0.68, 0.86].map((y) => (<mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.305, 0.305, 0.05, 10, 1, true]} /><meshStandardMaterial color="#f4f4f4" side={2} /></mesh>))}
            </>
          )}
          <group position={[0.34, 1.0, 0]} rotation={[bD, 0, bDz]}>
            <mesh position={[0, -0.22, 0]} castShadow><capsuleGeometry args={[0.08, 0.3, 3, 8]} /><Mat cor={camisa} /></mesh>
            <mesh position={[0, -0.45, 0]}><sphereGeometry args={[0.09, 8, 8]} /><Mat cor={pele} /></mesh>
            {prop}
          </group>
          <group position={[-0.34, 1.0, 0]} rotation={[bE, 0, bEz]}>
            <mesh position={[0, -0.22, 0]} castShadow><capsuleGeometry args={[0.08, 0.3, 3, 8]} /><Mat cor={camisa} /></mesh>
            <mesh position={[0, -0.45, 0]}><sphereGeometry args={[0.09, 8, 8]} /><Mat cor={pele} /></mesh>
            {escudo && (
              <group position={[0.02, -0.36, 0.2]} rotation={[-bE, 0, -bEz]}>
                <mesh castShadow><boxGeometry args={[0.55, 0.85, 0.05]} /><Mat cor={escudo} /></mesh>
                <Caixa pos={[0, 0, 0.03]} tam={[0.47, 0.77, 0.02]} cor={escudo} sombra={false} />
                {[-0.3, 0.3].map((y) => (<Caixa key={y} pos={[0, y, 0.045]} tam={[0.4, 0.04, 0.01]} cor="#e0b64a" sombra={false} />))}
                <mesh position={[0, 0, 0.06]}><sphereGeometry args={[0.09, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat cor="#e0b64a" /></mesh>
              </group>
            )}
          </group>
          <group position={[0, 1.5, 0]}>
            <mesh castShadow><sphereGeometry args={[0.36, 16, 12]} /><Mat cor={pele} /></mesh>
            {[-0.12, 0.12].map((x) => (<mesh key={x} position={[x, 0.02, 0.32]}><sphereGeometry args={[0.055, 8, 8]} /><meshStandardMaterial color="#1d1b26" /></mesh>))}
            {[-0.2, 0.2].map((x) => (<mesh key={x} position={[x, -0.1, 0.28]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#ff9b8a" /></mesh>))}
            <mesh position={[0, -0.14, 0.31]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.07, 0.02, 6, 10, Math.PI]} /><meshStandardMaterial color="#5a1f2b" /></mesh>
            {coroa && (<mesh position={[0, 0.14, -0.02]} rotation={[Math.PI / 2 - 0.15, 0, 0]}><torusGeometry args={[0.37, 0.05, 5, 14]} /><Mat cor={coroa} /></mesh>)}
            {elmo ? (
              <>
                <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat cor={elmo.cor} rugoso={0.45} /></mesh>
                <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.42, 0.44, 0.07, 16]} /><Mat cor={elmo.cor} rugoso={0.45} /></mesh>
                <mesh position={[0, 0.03, -0.3]} rotation={[0.5, 0, 0]}><boxGeometry args={[0.6, 0.06, 0.2]} /><Mat cor={elmo.cor} rugoso={0.45} /></mesh>
                {[-1, 1].map((sx) => (<mesh key={sx} position={[sx * 0.33, -0.1, 0.12]} rotation={[0, sx * 0.35, 0]}><boxGeometry args={[0.06, 0.3, 0.2]} /><Mat cor={elmo.cor} rugoso={0.45} /></mesh>))}
                {elmo.penacho && (<mesh position={[0, 0.2, -0.02]} rotation={[0, Math.PI / 2, 0]} scale={[1, 1, 0.55]} castShadow><torusGeometry args={[0.36, 0.09, 6, 14, Math.PI]} /><Mat cor={elmo.penacho} /></mesh>)}
              </>
            ) : chef ? (
              <group position={[0, 0.3, 0]}>
                <mesh castShadow><cylinderGeometry args={[0.33, 0.3, 0.3, 14]} /><Mat cor="#ffffff" /></mesh>
                {[[-0.15, 0.25, 0], [0.15, 0.25, 0], [0, 0.3, 0.12], [0, 0.3, -0.12], [0, 0.36, 0]].map((q, i) => (<mesh key={i} position={q as V3}><sphereGeometry args={[0.2, 10, 8]} /><Mat cor="#ffffff" /></mesh>))}
              </group>
            ) : capacete ? (
              <>
                <mesh position={[0, 0.12, 0]} castShadow><sphereGeometry args={[0.39, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat cor={capacete} /></mesh>
                <mesh position={[0, 0.12, 0.08]}><cylinderGeometry args={[0.46, 0.46, 0.04, 16]} /><Mat cor={capacete} /></mesh>
              </>
            ) : (
              <mesh position={[0, 0.08, -0.03]} castShadow><sphereGeometry args={[0.375, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.1]} /><Mat cor={cabelo} /></mesh>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};

// ---------- máquinas e materiais de obra ----------
export const Betoneira: React.FC<{pos: V3; rotY?: number; t: number}> = ({pos, rotY = 0, t}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.35, 0]} tam={[0.9, 0.08, 0.5]} cor="#ff8a1f" />
    {[-0.35, 0.35].map((x) => (<Cil key={x} pos={[x, 0.2, 0.28]} rot={[Math.PI / 2, 0, 0]} r={0.2} h={0.08} cor="#2b2b3a" />))}
    <Caixa pos={[0.38, 0.75, 0]} tam={[0.08, 0.8, 0.08]} cor="#ff8a1f" />
    <group position={[-0.05, 0.95, 0]} rotation={[0, 0, 0.55]}>
      <group rotation={[0, t * 4, 0]}>
        <Cil pos={[0, 0, 0]} r={0.36} r2={0.42} h={0.45} cor="#e8402f" seg={12} />
        <Cil pos={[0, 0.38, 0]} r={0.2} r2={0.36} h={0.3} cor="#e8402f" seg={12} />
        <Caixa pos={[0.4, 0, 0]} tam={[0.04, 0.4, 0.06]} cor="#ffd23f" />
      </group>
    </group>
  </group>
);

export const Carrinho: React.FC<{pos: V3; rotY?: number; carga?: string}> = ({pos, rotY = 0, carga = '#9b9b9b'}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Cil pos={[0, 0.17, 0.55]} rot={[0, 0, Math.PI / 2]} r={0.17} h={0.08} cor="#2b2b3a" />
    <Cil pos={[0, 0.48, 0.05]} r={0.4} r2={0.25} h={0.3} cor="#3c7dd9" seg={10} />
    <Cil pos={[0, 0.6, 0.05]} r={0.36} h={0.05} cor={carga} seg={10} />
    <Barra a={[-0.2, 0.4, 0.4]} b={[-0.25, 0.65, -0.75]} r={0.02} cor="#555" />
    <Barra a={[0.2, 0.4, 0.4]} b={[0.25, 0.65, -0.75]} r={0.02} cor="#555" />
  </group>
);

export const SacosCimento: React.FC<{pos: V3; n?: number; rotY?: number}> = ({pos, n = 12, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {Array.from({length: n}).map((_, i) => {
      const cam = Math.floor(i / 4);
      const k = i % 4;
      return <Caixa key={i} pos={[(k % 2) * 0.42 - 0.21 + (cam % 2) * 0.03, 0.07 + cam * 0.14, Math.floor(k / 2) * 0.62 - 0.31]} tam={[0.4, 0.13, 0.6]} cor={cam % 2 ? '#d8d2c2' : '#cfc8b5'} />;
    })}
    <Caixa pos={[0, 0.07 + Math.ceil(n / 4) * 0.14 - 0.06, -0.31]} tam={[0.38, 0.005, 0.2]} cor="#2f6fd6" sombra={false} />
  </group>
);

export const PilhaBlocos: React.FC<{pos: V3; nx?: number; ny?: number; nz?: number; rotY?: number}> = ({pos, nx = 4, ny = 5, nz = 3, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.06, 0]} tam={[nx * 0.3 + 0.1, 0.12, nz * 0.15 + 0.1]} cor="#b98a5b" />
    {Array.from({length: nx * ny * nz}).map((_, i) => {
      const x = i % nx, z = Math.floor(i / nx) % nz, y = Math.floor(i / (nx * nz));
      return <Caixa key={i} pos={[(x - (nx - 1) / 2) * 0.3, 0.12 + 0.095 + y * 0.19, (z - (nz - 1) / 2) * 0.15]} tam={[0.29, 0.19, 0.14]} cor={(x + y + z) % 3 ? '#d9773e' : '#cc6c35'} />;
    })}
  </group>
);

export const MonteTerra: React.FC<{pos: V3; esc?: number; cor?: string}> = ({pos, esc = 1, cor = '#a9652f'}) => (
  <mesh position={[pos[0], pos[1], pos[2]]} scale={[esc, esc * 0.55, esc]} castShadow receiveShadow>
    <coneGeometry args={[0.9, 1.1, 7]} />
    <Mat cor={cor} />
  </mesh>
);

export const Arvore: React.FC<{pos: V3; esc?: number; cor?: string}> = ({pos, esc = 1, cor = '#3f9b5a'}) => (
  <group position={pos} scale={esc}>
    <Cil pos={[0, 0.6, 0]} r={0.15} r2={0.2} h={1.2} seg={6} cor="#8b5a3c" />
    <mesh position={[0, 1.9, 0]} castShadow><icosahedronGeometry args={[0.95, 0]} /><Mat cor={cor} /></mesh>
    <mesh position={[0.4, 2.4, 0.2]} castShadow><icosahedronGeometry args={[0.6, 0]} /><Mat cor={cor} /></mesh>
  </group>
);

export const Tufo: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <group position={pos} scale={esc}>
    {[0, 1.2, 2.4, 3.6, 4.8].map((a, i) => (<mesh key={i} position={[Math.cos(a) * 0.06, 0.13, Math.sin(a) * 0.06]} rotation={[Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4]}><coneGeometry args={[0.04, 0.3, 3]} /><Mat cor={i % 2 ? '#6fb35a' : '#5aa04a'} /></mesh>))}
  </group>
);

// telhas: InstancedMesh (milhares de peças sem pesar)
export const Instancias: React.FC<{matrizes: THREE.Matrix4[]; n: number; geo: THREE.BufferGeometry; cor: string; sombra?: boolean}> = ({matrizes, n, geo, cor, sombra = true}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    matrizes.forEach((mx, i) => m.setMatrixAt(i, mx));
    m.instanceMatrix.needsUpdate = true;
  }, [matrizes]);
  useLayoutEffect(() => {
    if (ref.current) ref.current.count = Math.max(0, Math.min(matrizes.length, Math.floor(n)));
  });
  return (
    <instancedMesh ref={ref} args={[geo, undefined, Math.max(1, matrizes.length)]} castShadow={sombra} receiveShadow frustumCulled={false}>
      <meshStandardMaterial color={cor} flatShading roughness={0.85} />
    </instancedMesh>
  );
};

// chuva: riscos caindo em volta de um centro
export const Chuva: React.FC<{t: number; centro?: V3; raio?: number; n?: number}> = ({t, centro = [0, 0, 0], raio = 9, n = 500}) => {
  const geo = useMemo(() => new THREE.BoxGeometry(0.015, 0.45, 0.015), []);
  const base = useMemo(() => {
    let s = 11;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return Array.from({length: n}).map(() => [r() * 2 - 1, r(), r() * 2 - 1, 0.7 + r() * 0.6]);
  }, [n]);
  const mats = useMemo(
    () =>
      base.map(([x, y0, z, v]) => {
        const y = ((y0 * 12 - t * 14 * v) % 12 + 12) % 12;
        return new THREE.Matrix4().makeTranslation(centro[0] + x * raio, y - 0.5, centro[2] + z * raio);
      }),
    [base, t, centro[0], centro[2], raio],
  );
  return <Instancias matrizes={mats} n={mats.length} geo={geo} cor="#cfe3ff" sombra={false} />;
};

export const Nuvem: React.FC<{pos: V3; esc?: number; cor?: string}> = ({pos, esc = 1, cor = '#ffffff'}) => (
  <group position={pos} scale={esc}>
    {[[0, 0, 0, 1.2], [1.2, -0.2, 0.2, 0.9], [-1.1, -0.25, 0, 0.85], [0.4, 0.5, -0.2, 0.8]].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]}><icosahedronGeometry args={[r, 0]} /><meshStandardMaterial color={cor} flatShading emissive={cor} emissiveIntensity={0.25} /></mesh>
    ))}
  </group>
);
