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

// padrão visual novo: sombreamento suave (sem flatShading); rugosidade por tipo (0,4 metal/plástico, 0,8 tecido/pintura, 0,95 terra)
export const Mat: React.FC<{cor: string; rugoso?: number; map?: THREE.Texture | null; emissivo?: string}> = ({cor, rugoso = 0.82, map, emissivo}) => (
  <meshStandardMaterial color={cor} roughness={rugoso} metalness={rugoso < 0.5 ? 0.15 : 0} map={map ?? null} emissive={emissivo ?? '#000000'} />
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
    <cylinderGeometry args={[r, r2 ?? r, h, seg <= 4 ? seg : Math.max(seg * 2, 20)]} />
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
      {quadrada ? <boxGeometry args={[r * 2, len, r * 2]} /> : <cylinderGeometry args={[r, r, len, 24]} />}
      <Mat cor={cor} rugoso={0.55} />
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
        <sphereGeometry args={[0.06, 20, 14]} />
        <meshBasicMaterial color="#1d1b26" />
      </mesh>
      <sprite position={topo} scale={[0.19 * s, 0.045 * s, 1]} renderOrder={10}>
        <spriteMaterial map={t} depthTest={false} sizeAttenuation={false} />
      </sprite>
    </group>
  );
};

// ---------- personagens ----------
// O Boneco agora é o Zé 2.0 (src/estilo/ze.tsx): mesma interface, visual novo aprovado.
export {Boneco, CHEF, OBREIRO, SERVENTE, ENGENHEIRA, MORADOR, CRIANCA, K_ZE} from '../estilo/ze';
export type {AcaoBoneco, Visual, Ferramenta, Expressao, ZeProps} from '../estilo/ze';

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
    <coneGeometry args={[0.9, 1.1, 24]} />
    <Mat cor={cor} />
  </mesh>
);

export const Arvore: React.FC<{pos: V3; esc?: number; cor?: string}> = ({pos, esc = 1, cor = '#3f9b5a'}) => (
  <group position={pos} scale={esc}>
    <Cil pos={[0, 0.6, 0]} r={0.15} r2={0.2} h={1.2} seg={6} cor="#8b5a3c" />
    <mesh position={[0, 1.9, 0]} castShadow><icosahedronGeometry args={[0.95, 3]} /><Mat cor={cor} rugoso={0.9} /></mesh>
    <mesh position={[0.4, 2.4, 0.2]} castShadow><icosahedronGeometry args={[0.6, 3]} /><Mat cor={cor} rugoso={0.9} /></mesh>
  </group>
);

export const Tufo: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <group position={pos} scale={esc}>
    {[0, 1.2, 2.4, 3.6, 4.8].map((a, i) => (<mesh key={i} position={[Math.cos(a) * 0.06, 0.13, Math.sin(a) * 0.06]} rotation={[Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4]}><coneGeometry args={[0.04, 0.3, 24]} /><Mat cor={i % 2 ? '#6fb35a' : '#5aa04a'} /></mesh>))}
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
      <meshStandardMaterial color={cor} roughness={0.82} />
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
      <mesh key={i} position={[x, y, z]}><icosahedronGeometry args={[r, 3]} /><meshStandardMaterial color={cor} roughness={1} emissive={cor} emissiveIntensity={0.25} /></mesh>
    ))}
  </group>
);
