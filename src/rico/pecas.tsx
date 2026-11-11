// PEÇAS do perfil Como Ficou Rico (escala real: 1 unidade = 1 metro).
// Rua do Rio de 1945, rádio, barca, pensão do Baú, estúdio de TV, emissora, banco, gráficos 3D e a pilha de dinheiro.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, Caixa, Cil, Visual, clamp01, lerp, suave, texPilula} from '../v4/kit';
import {InstCor, rnd} from '../historia/pecas';

export {clamp01, lerp, suave};

// ---------- personagens ----------
// Zé jovem (camelô de 14–17 anos): um pouco menor
export const ZE_JOVEM: Visual = {camisa: '#f2ecdf', calca: '#3a3f55', colete: null, capacete: null, cabelo: '#2b1d14'};
// Zé de cartola (o dono): terno escuro, gravata vermelha
export const ZE_RICO: Visual = {camisa: '#2b2d45', calca: '#2b2d45', colete: null, capacete: null, cabelo: '#2b1d14', cartola: '#1d1b26', gravata: '#d6282b'};
export const AMIGO: Visual = {camisa: '#8a6a4a', calca: '#4a3a2a', colete: null, capacete: null, cabelo: '#c8c8c8', pele: '#f0c8a0', gravata: '#2f5d8a'};
export const EXECUTIVO: Visual = {camisa: '#5a6270', calca: '#3a404a', colete: null, capacete: null, cabelo: '#1d1b26', gravata: '#ffd23f', pele: '#e8b892'};
export const PASSANTES: Visual[] = [
  {camisa: '#d9cdb0', calca: '#4a4a55', colete: null, capacete: null, cabelo: '#3b2a20', gravata: '#7a3a2a'},
  {camisa: '#c94f4f', calca: '#2b2b3a', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#c98e62'},
  {camisa: '#4f7fb0', calca: '#e9e1cf', colete: null, capacete: null, cabelo: '#8a6a43'},
  {camisa: '#f2efe6', calca: '#5b4a3a', colete: null, capacete: null, cabelo: '#2b1d14', pele: '#8d5a3b', gravata: '#2b2233'},
  {camisa: '#e7c25a', calca: '#3a3f55', colete: null, capacete: null, cabelo: '#c8c8c8'},
  {camisa: '#6b8f5a', calca: '#2b2233', colete: null, capacete: null, cabelo: '#5a4030', pele: '#e7b48c'},
];

export const CORES_ROUPA = ['#c94f4f', '#4f7fb0', '#e7c25a', '#6b8f5a', '#f2efe6', '#8a5aa0', '#e98a3a', '#3fa0a0'];
export const CORES_PELE = ['#ffd2ad', '#e7b48c', '#c98e62', '#8d5a3b', '#f2c9a4'];

// plaquinha flutuante sem linha guia (texto 3D sempre de frente)
export const Pilula: React.FC<{texto: string; pos: V3; fundo: string; vis?: number; tam?: number; cor?: string}> = ({texto, pos, fundo, vis = 1, tam = 1, cor = '#ffffff'}) =>
  vis > 0.01 ? (
    <sprite position={pos} scale={[0.22 * suave(vis) * tam, 0.052 * suave(vis) * tam, 1]} renderOrder={10}>
      <spriteMaterial map={texPilula(texto, fundo, cor)} depthTest={false} sizeAttenuation={false} />
    </sprite>
  ) : null;

// ---------- texturas ----------
const cache = new Map<string, THREE.Texture>();
function tex(id: string, w: number, h: number, pinta: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) {
  const c0 = cache.get(id);
  if (c0) return c0;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  pinta(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (rep) t.repeat.set(rep[0], rep[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(id, t);
  return t;
}

// calçada de pedra portuguesa em ondas (preto e branco, como no Rio)
export const texCalcada = () =>
  tex('calcada', 256, 256, (g) => {
    g.fillStyle = '#efe9dc';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#2b2b30';
    for (let y = -64; y < 320; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + Math.sin((x / 256) * Math.PI * 2) * 18);
      for (let x = 256; x >= 0; x -= 8) g.lineTo(x, y + 26 + Math.sin((x / 256) * Math.PI * 2) * 18);
      g.closePath();
      g.fill();
    }
  }, [6, 6]);

// fachada com janelas (prédio dos anos 40)
const texFachada = (cor: string, janela: string) =>
  tex('fach:' + cor, 128, 128, (g) => {
    g.fillStyle = cor;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = janela;
    g.fillRect(20, 30, 32, 60);
    g.fillRect(76, 30, 32, 60);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.fillRect(0, 118, 128, 10);
  });

// nota de 100 vista de cima (maço)
const texMaco = () =>
  tex('maco', 128, 64, (g) => {
    g.fillStyle = '#5aa0c8';
    g.fillRect(0, 0, 128, 64);
    g.fillStyle = '#3f7fa8';
    g.fillRect(8, 8, 112, 48);
    g.fillStyle = '#e9f2f8';
    g.beginPath();
    g.ellipse(88, 32, 16, 18, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#f2e6c8';
    g.fillRect(54, 0, 14, 64);
    g.fillStyle = '#1d1b26';
    g.font = '800 20px sans-serif';
    g.fillText('100', 12, 40);
  });

// ---------- rua do Rio, 1945 ----------
export const Predio: React.FC<{pos: V3; tam: V3; cor: string; rotY?: number}> = ({pos, tam, cor, rotY = 0}) => {
  const [w, h, d] = tam;
  const m = useMemo(() => {
    const t = texFachada(cor, '#3b4a5a').clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 3.2)));
    return t;
  }, [cor, w, h]);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#ffffff" map={m} flatShading roughness={0.9} />
      </mesh>
      {/* platibanda art déco e marquise do térreo */}
      <Caixa pos={[0, h + 0.4, 0]} tam={[w * 0.6, 0.8, d * 0.6]} cor={cor} />
      <Caixa pos={[0, 3.3, d / 2 + 0.6]} tam={[w, 0.15, 1.2]} cor="#5a4a3a" />
      <Caixa pos={[0, 1.5, d / 2 + 0.01]} tam={[w * 0.9, 3, 0.04]} cor="#2f3a44" sombra={false} />
    </group>
  );
};

// bonde do Rio (aberto, amarelo) — 9 m
export const Bonde: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.65, 0]} tam={[9, 0.5, 2.4]} cor="#3a5a3a" />
    <Caixa pos={[0, 2.85, 0]} tam={[9.4, 0.2, 2.6]} cor="#e7c25a" />
    {Array.from({length: 10}).map((_, i) => (<Cil key={i} pos={[-4.3 + i * 0.95, 1.9, 1.15]} r={0.04} h={1.9} cor="#5a4a3a" seg={5} />))}
    {Array.from({length: 10}).map((_, i) => (<Cil key={'b' + i} pos={[-4.3 + i * 0.95, 1.9, -1.15]} r={0.04} h={1.9} cor="#5a4a3a" seg={5} />))}
    {Array.from({length: 7}).map((_, i) => (<Caixa key={'s' + i} pos={[-3.6 + i * 1.2, 1.15, 0]} tam={[0.5, 0.5, 2.2]} cor="#8b5a3c" />))}
    <Barra a={[0, 2.95, 0]} b={[-3, 6, 0]} r={0.03} cor="#2b2b30" />
    {[-3, 3].map((x) => (<Cil key={x} pos={[x, 0.3, 0]} rot={[Math.PI / 2, 0, 0]} r={0.3} h={2.2} cor="#2b2b30" />))}
  </group>
);

// tabuleiro de camelô sobre cavalete (0,9 m de altura) com capinhas de título de eleitor
export const Tabuleiro: React.FC<{pos: V3; rotY?: number; n?: number; moedas?: number}> = ({pos, rotY = 0, n = 12, moedas = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {[-1, 1].map((s) => (
      <group key={s}>
        <Barra a={[-0.32, 0, s * 0.18]} b={[0.32, 0.86, s * 0.18]} r={0.015} cor="#7a5034" />
        <Barra a={[0.32, 0, s * 0.18]} b={[-0.32, 0.86, s * 0.18]} r={0.015} cor="#7a5034" />
      </group>
    ))}
    <Caixa pos={[0, 0.88, 0]} tam={[0.8, 0.03, 0.5]} cor="#a8743f" />
    <Caixa pos={[0, 0.91, 0.24]} tam={[0.8, 0.04, 0.02]} cor="#8b5a3c" />
    {Array.from({length: Math.floor(n)}).map((_, i) => {
      const x = (i % 4) * 0.17 - 0.255, z = Math.floor(i / 4) * 0.15 - 0.15;
      return (
        <group key={i} position={[x, 0.905, z]} rotation={[0, ((i * 37) % 10) * 0.02 - 0.1, 0]}>
          <Caixa tam={[0.1, 0.008, 0.13]} cor="#2f6fd6" sombra={false} />
          <Caixa pos={[0, 0.005, -0.03]} tam={[0.07, 0.003, 0.03]} cor="#e9f2f8" sombra={false} />
        </group>
      );
    })}
    {Array.from({length: Math.floor(moedas)}).map((_, i) => (<Cil key={'m' + i} pos={[0.3 - (i % 3) * 0.03, 0.91 + Math.floor(i / 3) * 0.006, 0.17]} r={0.014} h={0.005} cor="#d9b44a" seg={10} />))}
  </group>
);

// ---------- rádio, 1948 ----------
export const Microfone: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Cil pos={[0, 0.01, 0]} r={0.14} h={0.03} cor="#2b2b30" seg={14} />
    <Cil pos={[0, 0.7, 0]} r={0.015} h={1.4} cor="#9aa0aa" />
    <group position={[0, 1.45, 0]}>
      <mesh castShadow><capsuleGeometry args={[0.06, 0.12, 4, 10]} /><meshStandardMaterial color="#c9ced6" metalness={0.6} roughness={0.3} /></mesh>
      {[-0.05, 0, 0.05].map((y) => (<mesh key={y} position={[0, y, 0]}><torusGeometry args={[0.062, 0.006, 4, 12]} /><meshStandardMaterial color="#5c5f66" /></mesh>))}
    </group>
  </group>
);

// ---------- barca Rio–Niterói (estilizada, 34 m) ----------
export const Barca: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {/* casco */}
    <Caixa pos={[0, 0.4, 0]} tam={[34, 2.2, 10]} cor="#f2f2ee" />
    <Caixa pos={[0, -0.4, 0]} tam={[34.2, 0.6, 10.2]} cor="#2f6f5a" />
    <Caixa pos={[0, 1.55, 0]} tam={[33, 0.1, 9.4]} cor="#a8743f" />
    {/* cabine de passageiros */}
    <Caixa pos={[0, 2.9, 0]} tam={[22, 2.6, 7.4]} cor="#e9e4d8" />
    {Array.from({length: 11}).map((_, i) => (<Caixa key={i} pos={[-10 + i * 2, 3.1, 3.72]} tam={[1.2, 0.9, 0.04]} cor="#3b4a5a" sombra={false} />))}
    <Caixa pos={[0, 4.3, 0]} tam={[22.6, 0.2, 8]} cor="#2f6f5a" />
    {/* deque de cima com guarda-corpo */}
    {Array.from({length: 23}).map((_, i) => (<Cil key={'g' + i} pos={[-11 + i, 4.85, 3.9]} r={0.03} h={0.9} cor="#f2f2ee" seg={5} />))}
    <Barra a={[-11, 5.3, 3.9]} b={[11, 5.3, 3.9]} r={0.04} cor="#f2f2ee" />
    {/* chaminé */}
    <Cil pos={[-4, 5.6, 0]} r={0.7} h={2.4} cor="#e8c23a" seg={12} />
    <Cil pos={[-4, 6.9, 0]} r={0.75} h={0.3} cor="#1d1b26" seg={12} />
  </group>
);

// alto-falante tipo corneta
export const Corneta: React.FC<{pos: V3; rot?: V3}> = ({pos, rot = [0, 0, 0]}) => (
  <group position={pos} rotation={rot}>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.25]} castShadow>
      <cylinderGeometry args={[0.32, 0.06, 0.6, 14, 1, true]} />
      <meshStandardMaterial color="#c9ced6" metalness={0.5} roughness={0.35} side={2} flatShading />
    </mesh>
    <Cil pos={[0, 0, -0.1]} rot={[Math.PI / 2, 0, 0]} r={0.1} h={0.2} cor="#5c5f66" />
  </group>
);

// notas musicais saindo de um ponto
export const Notas: React.FC<{orig: V3; dir: V3; t: number; n?: number}> = ({orig, dir, t, n = 5}) => (
  <>
    {Array.from({length: n}).map((_, i) => {
      const k = ((t * 0.6 + i / n) % 1);
      const p: V3 = [orig[0] + dir[0] * k * 4, orig[1] + dir[1] * k * 4 + Math.sin((k + i) * 6) * 0.2, orig[2] + dir[2] * k * 4];
      return <Pilula key={i} texto={i % 2 ? '♪' : '♫'} pos={p} fundo="#ffd23f" cor="#1d1b26" vis={Math.min(1, (1 - k) * 3)} tam={0.55} />;
    })}
  </>
);

// morros do Rio ao fundo (Pão de Açúcar e Urca, estilizados)
export const Morros: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <group position={pos} scale={esc}>
    <mesh position={[0, 180, 0]} scale={[90, 200, 80]} castShadow><sphereGeometry args={[1, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#5f7f5a" flatShading /></mesh>
    <mesh position={[0, 0, 0]} scale={[100, 180, 90]}><cylinderGeometry args={[0.9, 1, 1, 10]} /><meshStandardMaterial color="#5f7f5a" flatShading /></mesh>
    <mesh position={[-200, 0, 30]} scale={[130, 120, 110]}><sphereGeometry args={[1, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#6b8f5a" flatShading /></mesh>
    <mesh position={[260, 0, -60]} scale={[200, 160, 140]}><sphereGeometry args={[1, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#6b8f5a" flatShading /></mesh>
  </group>
);

// ---------- pensão do Baú, 1958 ----------
export const Bau: React.FC<{pos: V3; rotY?: number; abre?: number; t?: number}> = ({pos, rotY = 0, abre = 0, t = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.22, 0]} tam={[0.8, 0.44, 0.5]} cor="#9a5a2a" />
    {[-0.3, 0.3].map((x) => (<Caixa key={x} pos={[x, 0.22, 0]} tam={[0.05, 0.46, 0.52]} cor="#d9a83a" />))}
    {/* presentes de Natal dentro */}
    {abre > 0.2 && [[-0.2, '#d6282b'], [0.05, '#2f6fd6'], [0.25, '#2fbf71']].map(([x, c], i) => (
      <group key={i} position={[x as number, 0.48 + Math.sin(t * 4 + i) * 0.02, (i - 1) * 0.06]}>
        <Caixa tam={[0.18, 0.16, 0.16]} cor={c as string} />
        <Caixa tam={[0.19, 0.17, 0.04]} cor="#ffd23f" sombra={false} />
      </group>
    ))}
    {/* tampa abrindo (dobradiça atrás) */}
    <group position={[0, 0.44, -0.25]} rotation={[-1.9 * suave(abre), 0, 0]}>
      <mesh position={[0, 0.06, 0.25]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.8, 10, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#a8642f" flatShading />
      </mesh>
      <Caixa pos={[0, 0.09, 0.5]} tam={[0.1, 0.1, 0.03]} cor="#d9a83a" />
    </group>
  </group>
);

// carnê do Baú (bloquinho de 10 × 15 cm)
export const Carne: React.FC<{pos: V3; rot?: V3; aberto?: boolean}> = ({pos, rot = [0, 0, 0], aberto = false}) => (
  <group position={pos} rotation={rot}>
    <Caixa tam={[0.1, 0.012, 0.15]} cor="#f2ead6" sombra={false} />
    <Caixa pos={[0, 0.007, 0.05]} tam={[0.1, 0.003, 0.04]} cor="#d6282b" sombra={false} />
    {aberto && <Caixa pos={[0, 0.008, -0.03]} tam={[0.08, 0.002, 0.07]} cor="#c9c0a8" sombra={false} />}
  </group>
);

export const Cama: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.2, 0]} tam={[0.9, 0.4, 1.9]} cor="#7a5034" />
    <Caixa pos={[0, 0.45, 0]} tam={[0.85, 0.12, 1.85]} cor="#e9e4d8" />
    <Caixa pos={[0, 0.53, 0.2]} tam={[0.86, 0.06, 1.3]} cor="#8a5aa0" />
    <Caixa pos={[0, 0.56, -0.72]} tam={[0.6, 0.12, 0.35]} cor="#ffffff" />
    <Caixa pos={[0, 0.6, -0.97]} tam={[0.9, 1.2, 0.06]} cor="#7a5034" />
  </group>
);

// ---------- estúdio de TV, anos 60 ----------
export const CameraTV: React.FC<{pos: V3; rotY?: number; t?: number}> = ({pos, rotY = 0, t = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {[0, 2.09, 4.19].map((a) => (<Barra key={a} a={[Math.cos(a) * 0.45, 0.05, Math.sin(a) * 0.45]} b={[0, 0.9, 0]} r={0.03} cor="#2b2b30" />))}
    <Cil pos={[0, 1.1, 0]} r={0.06} h={0.5} cor="#5c5f66" />
    <Caixa pos={[0, 1.5, -0.1]} tam={[0.5, 0.45, 0.8]} cor="#3a3a44" />
    {/* torre de lentes */}
    {[-0.1, 0.1].map((x, i) => (<Cil key={x} pos={[x, 1.5 + i * 0.1, 0.42]} rot={[Math.PI / 2, 0, 0]} r={0.07} h={0.3} cor="#1d1b26" />))}
    <mesh position={[0.18, 1.78, 0.25]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#ff3030" emissive="#ff2020" emissiveIntensity={Math.sin(t * 6) > 0 ? 2 : 0.6} /></mesh>
    <Barra a={[0, 1.4, -0.5]} b={[0, 1.2, -1.1]} r={0.02} cor="#5c5f66" />
  </group>
);

export const Holofote: React.FC<{pos: V3; alvo: V3}> = ({pos, alvo}) => {
  const d = new THREE.Vector3(alvo[0] - pos[0], alvo[1] - pos[1], alvo[2] - pos[2]).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d);
  return (
    <group position={pos} quaternion={q}>
      <Cil r={0.18} r2={0.25} h={0.4} cor="#2b2b30" />
      <mesh position={[0, -0.21, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.22, 12]} /><meshBasicMaterial color="#fff6d8" side={2} /></mesh>
    </group>
  );
};

// cédulas: maço de notas (15,6 × 7 cm; 100 notas ≈ 1,1 cm)
export const Maco: React.FC<{pos: V3; rot?: V3}> = ({pos, rot = [0, 0, 0]}) => (
  <group position={pos} rotation={rot}>
    <mesh castShadow><boxGeometry args={[0.156, 0.011, 0.07]} /><meshStandardMaterial color="#ffffff" map={texMaco()} flatShading /></mesh>
  </group>
);

// plateia em arquibancada (instanciada)
export const Plateia: React.FC<{pos: V3; filas?: number; porFila?: number; t: number; agito?: number; rotY?: number}> = ({pos, filas = 4, porFila = 14, t, agito = 0, rotY = 0}) => {
  const ls = useMemo(() => {
    const out: {x: number; y: number; z: number; ph: number}[] = [];
    const r = rnd(5);
    for (let f = 0; f < filas; f++) for (let i = 0; i < porFila; i++) out.push({x: (i - (porFila - 1) / 2) * 0.62 + (f % 2) * 0.3, y: 0.45 + f * 0.45, z: -f * 0.8, ph: r() * 6});
    return out;
  }, [filas, porFila]);
  const geoC = useMemo(() => new THREE.BoxGeometry(0.42, 0.55, 0.3), []);
  const geoH = useMemo(() => new THREE.IcosahedronGeometry(0.17, 0), []);
  const cC = useMemo(() => ls.map((_, i) => CORES_ROUPA[(i * 7) % CORES_ROUPA.length]), [ls]);
  const cH = useMemo(() => ls.map((_, i) => CORES_PELE[(i * 3) % CORES_PELE.length]), [ls]);
  const {mc, mh} = useMemo(() => {
    const mc: THREE.Matrix4[] = [], mh: THREE.Matrix4[] = [];
    ls.forEach((l) => {
      const pulo = Math.max(0, Math.sin(t * 8 + l.ph)) * 0.12 * agito;
      mc.push(new THREE.Matrix4().makeTranslation(l.x, l.y + 0.3 + pulo, l.z));
      mh.push(new THREE.Matrix4().makeTranslation(l.x, l.y + 0.72 + pulo, l.z));
    });
    return {mc, mh};
  }, [ls, Math.round(t * 30), agito]);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {Array.from({length: filas}).map((_, f) => (<Caixa key={f} pos={[0.15, f * 0.45 + 0.2, -f * 0.8]} tam={[porFila * 0.62 + 0.8, 0.45 + f * 0.9, 0.8]} cor={f % 2 ? '#7a3a4a' : '#8a4a5a'} />))}
      <InstCor geo={geoC} mats={mc} cores={cC} />
      <InstCor geo={geoH} mats={mh} cores={cH} />
    </group>
  );
};

// ---------- emissora: prédio e torre treliçada ----------
export const Torre: React.FC<{pos: V3; h?: number}> = ({pos, h = 80}) => {
  const n = Math.round(h / 5);
  const base = 6;
  const lado = (y: number) => lerp(base, 1, y / h);
  return (
    <group position={pos}>
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], i) => (<Barra key={i} a={[sx * base / 2, 0, sz * base / 2]} b={[sx * 0.5, h, sz * 0.5]} r={0.25} cor={'#d6282b'} />))}
      {Array.from({length: n}).map((_, k) => {
        const y = k * 5 + 2.5;
        const l = lado(y) / 2;
        const c = k % 2 ? '#f2f2ee' : '#d6282b';
        return (
          <group key={k}>
            <Barra a={[-l, y, -l]} b={[l, y, -l]} r={0.12} cor={c} />
            <Barra a={[l, y, -l]} b={[l, y, l]} r={0.12} cor={c} />
            <Barra a={[l, y, l]} b={[-l, y, l]} r={0.12} cor={c} />
            <Barra a={[-l, y, l]} b={[-l, y, -l]} r={0.12} cor={c} />
            <Barra a={[-l, y, l]} b={[lado(y + 5) / 2, y + 5, lado(y + 5) / 2]} r={0.08} cor={c} />
          </group>
        );
      })}
      <Cil pos={[0, h + 4, 0]} r={0.3} h={8} cor="#f2f2ee" />
      <mesh position={[0, h + 8.3, 0]}><sphereGeometry args={[0.5, 8, 8]} /><meshStandardMaterial color="#ff3030" emissive="#ff2020" emissiveIntensity={1.5} /></mesh>
      {/* antenas parabólicas */}
      {[0.4, 0.62].map((k, i) => (
        <group key={k} position={[0, h * k, 0]} rotation={[0, i * 2.2, 0]}>
          <mesh position={[0, 0, lado(h * k) / 2 + 0.8]} rotation={[Math.PI / 2 - 0.2, 0, 0]}><cylinderGeometry args={[1.6, 0.3, 0.6, 14, 1, true]} /><meshStandardMaterial color="#e9e9ee" side={2} flatShading /></mesh>
        </group>
      ))}
    </group>
  );
};

export const PredioTV: React.FC<{pos: V3; letreiro?: string}> = ({pos, letreiro}) => (
  <group position={pos}>
    <Predio pos={[0, 0, 0]} tam={[32, 14, 18]} cor="#e9e4d8" />
    <Caixa pos={[0, 7, 9.05]} tam={[32, 1.2, 0.1]} cor="#2f6fd6" sombra={false} />
    {/* faixa colorida */}
    {['#d6282b', '#ffd23f', '#2fbf71', '#2f6fd6'].map((c, i) => (<Caixa key={c} pos={[-10.5 + i * 7, 15.2, 5]} tam={[6, 1.4, 0.6]} cor={c} />))}
    {letreiro && <Pilula texto={letreiro} pos={[0, 19, 6]} fundo="#1d1b26" tam={1.2} />}
  </group>
);

// ---------- banco (fachada clássica, 14 m de frente) ----------
export const PredioBanco: React.FC<{pos: V3; afunda?: number; racha?: number}> = ({pos, afunda = 0, racha = 0}) => (
  <group position={[pos[0], pos[1] - afunda * 3, pos[2]]} rotation={[0, 0, afunda * 0.06]}>
    {[0, 1, 2].map((k) => (<Caixa key={k} pos={[0, 0.2 + k * 0.4, 7.4 - k * 0.5]} tam={[15 - k * 0.6, 0.4 + k * 0.8, 2.2]} cor="#d9d2c0" />))}
    <Caixa pos={[0, 6.5, 0]} tam={[12, 11, 12]} cor="#e3dccb" />
    {Array.from({length: 4}).map((_, i) => (<Cil key={i} pos={[-5.1 + i * 3.4, 6.5, 6.4]} r={0.55} h={9.4} cor="#f2ede0" seg={12} />))}
    <Caixa pos={[0, 11.6, 6.4]} tam={[13.4, 1.2, 1.6]} cor="#f2ede0" />
    <mesh position={[0, 13.2, 6.4]} scale={[7.4, 2.0, 1]} castShadow>
      <coneGeometry args={[1, 1, 3]} />
      <meshStandardMaterial color="#f2ede0" flatShading />
    </mesh>
    <Caixa pos={[0, 3.6, 6.05]} tam={[2.6, 4.4, 0.1]} cor="#5a4030" />
    <Pilula texto="BANCO" pos={[0, 11.6, 7.3]} fundo="#2b2d45" tam={0.9} />
    {/* rachaduras na fachada */}
    {racha > 0.05 && ([[-3.4, 7, 0.6], [2.4, 5, -0.5], [4.2, 9, 0.3], [-1.2, 8.5, 1.1]] as V3[]).map(([x, y, a], i) => (
      <Caixa key={i} pos={[x, y, 6.12]} rot={[0, 0, a]} tam={[0.14, 4 * clamp01(racha * 1.6 - i * 0.2), 0.08]} cor="#1d1b26" sombra={false} />
    ))}
  </group>
);

// ---------- gráfico 3D de barras ----------
export const Grafico: React.FC<{pos: V3; valores: number[]; cores?: string[]; p: number; larg?: number; rotY?: number}> = ({pos, valores, cores, p, larg = 1.4, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.05, 0]} tam={[valores.length * larg * 1.4 + 1, 0.1, larg * 2]} cor="#2b2d45" />
    {valores.map((v, i) => {
      const k = suave(clamp01(p * valores.length * 0.8 - i * 0.7));
      const h = Math.max(0.02, Math.abs(v) * k);
      const neg = v < 0;
      return <Caixa key={i} pos={[(i - (valores.length - 1) / 2) * larg * 1.4, neg ? -h / 2 + 0.1 : h / 2 + 0.1, 0]} tam={[larg, h, larg]} cor={cores ? cores[i % cores.length] : neg ? '#d6282b' : '#2fbf71'} />;
    })}
  </group>
);

// ---------- pilha de dinheiro (R$ 1,6 bi em notas de 100 ≈ 16 milhões de notas ≈ 19 m³) ----------
export const PilhaDinheiro: React.FC<{pos: V3; raio?: number; alt?: number}> = ({pos, raio = 2.6, alt = 2.8}) => {
  const geo = useMemo(() => new THREE.BoxGeometry(0.156, 0.011 * 6, 0.07), []);
  const mats = useMemo(() => {
    const r = rnd(77);
    const out: THREE.Matrix4[] = [];
    for (let i = 0; i < 2600; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * raio;
      const y = alt * Math.pow(1 - d / raio, 0.8);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.6, r() * Math.PI, (r() - 0.5) * 0.6));
      out.push(new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * d, y, Math.sin(a) * d), q, new THREE.Vector3(1, 1, 1)));
    }
    return out;
  }, [raio, alt]);
  const cores = useMemo(() => ['#5aa0c8', '#4f93ba', '#66aed4', '#3f7fa8'], []);
  return (
    <group position={pos}>
      {/* miolo (o que não aparece) */}
      <mesh position={[0, 0, 0]} scale={[raio, alt - 0.05, raio]} castShadow receiveShadow>
        <coneGeometry args={[1, 1, 16]} />
        <meshStandardMaterial color="#3f7fa8" flatShading />
      </mesh>
      <group position={[0, -alt / 2 + 0.03, 0]}>
        <InstCor geo={geo} mats={mats} cores={cores} sombra />
      </group>
    </group>
  );
};

// cadeado grande
export const Cadeado: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <group position={pos} scale={esc}>
    <Caixa pos={[0, 0, 0]} tam={[1.2, 1.0, 0.4]} cor="#c9a24a" />
    <mesh position={[0, 0.55, 0]}><torusGeometry args={[0.38, 0.09, 6, 14, Math.PI]} /><meshStandardMaterial color="#9aa0aa" metalness={0.5} roughness={0.4} flatShading /></mesh>
    <Cil pos={[0, 0, 0.21]} rot={[Math.PI / 2, 0, 0]} r={0.1} h={0.02} cor="#1d1b26" />
  </group>
);

// boneco passante andando numa linha (vai e volta)
export const Passante: React.FC<{t: number; de: V3; ate: V3; v: Visual; fase?: number}> = ({t, de, ate, v, fase = 0}) => {
  const L = Math.hypot(ate[0] - de[0], ate[2] - de[2]);
  const k = ((t * 1.1 + fase * L) % L) / L;
  const x = lerp(de[0], ate[0], k), z = lerp(de[2], ate[2], k);
  return <Boneco pos={[x, de[1], z]} rotY={Math.atan2(ate[0] - de[0], ate[2] - de[2])} acao="anda" t={t + fase * 3} v={v} />;
};

export {Barra, Boneco, Caixa, Cil};
