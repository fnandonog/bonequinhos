// CENÁRIOS do "Você na História: você no Titanic" (abril de 1912). Cada set é um LUGAR diferente da viagem.
// Escala real (1 unidade = 1 m): Titanic com 269 m de comprimento e 28 m de boca, linha d'água em y = 0, proa para +X.
// Medidas e fatos: roteiros/voce-no-titanic-na-noite-do-naufragio.pesquisa.md. Sets com prefixo "ti_" (não colidem com o gladiador).
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, Caixa, Cil, Rotulo, Visual, Expressao, texPilula} from '../v4/kit';
import {orb} from '../v4/sets';
import type {SetHistoria} from './sets';
import {clamp01, lerp, rnd, suave} from './pecas';

// ---------- figurino de 1912 ----------
const ZE_1912: Visual = {camisa: '#7a5a3a', calca: '#4a4a52', colete: null, capacete: null, bone: '#6b6258', cabelo: '#3b2a20'};
const IMIGRANTES: Visual[] = [
  {camisa: '#5a4a3a', calca: '#3a3a42', colete: null, capacete: null, bone: '#4a4038', pele: '#f2c9a4'},
  {camisa: '#8a4a5a', calca: '#8a4a5a', colete: null, capacete: null, toga: '#6a3a4a', cabelo: '#c98a3a', pele: '#f2c9a4'},
  {camisa: '#4a5a6a', calca: '#2b2b3a', colete: null, capacete: null, bone: '#2b2b3a', pele: '#e8b892'},
  {camisa: '#6a7a5a', calca: '#6a7a5a', colete: null, capacete: null, toga: '#4f5f45', cabelo: '#1d1b26', pele: '#e8b892'},
  {camisa: '#9a7a5a', calca: '#3a3a42', colete: null, capacete: null, cabelo: '#8a6a43'},
];
const RICO: Visual = {camisa: '#1d1b26', calca: '#1d1b26', colete: null, capacete: null, cartola: '#1d1b26', gravata: '#f4f4f4', cabelo: '#6b6b6b'};
const RICA: Visual = {camisa: '#e8cfe0', calca: '#e8cfe0', colete: null, capacete: null, toga: '#f2dce8', cabelo: '#8a5a3a'};
const RICA2: Visual = {camisa: '#c9d8f0', calca: '#c9d8f0', colete: null, capacete: null, toga: '#dbe6f5', cabelo: '#2b2233'};
const OFICIAL: Visual = {camisa: '#1f2a44', calca: '#1f2a44', colete: null, capacete: null, bone: '#1f2a44', gravata: '#f4f4f4'};
const MARUJO: Visual = {camisa: '#2b3550', calca: '#2b3550', colete: null, capacete: null, bone: '#2b3550', pele: '#f2c9a4'};
const MULHER: Visual = {camisa: '#b86a4a', calca: '#b86a4a', colete: null, capacete: null, toga: '#9a5a3a', cabelo: '#3b2a20'};
const MENINA: Visual = {camisa: '#ffd23f', calca: '#4f8cff', colete: null, capacete: null, toga: '#e0b64a', cabelo: '#6b3e26'};
const CINZA: Visual = {camisa: '#5b6170', calca: '#4a4f5c', colete: null, capacete: null, pele: '#8a8f9c', cabelo: '#3a3f4c'};

const CEU_NOITE: [string, string] = ['#070b1c', '#18223d'];
const CEU_DIA: [string, string] = ['#8fc4ea', '#eef0ea'];
const MAR_NOITE = '#0b1628';
const MAR_DIA = '#3d6f8f';

// ---------- casco do Titanic (planta: meia-boca por x) ----------
const CASCO: [number, number][] = [[-134.5, 0], [-133.6, 4], [-131.2, 8], [-126.5, 11.2], [-118, 13.4], [-105, 14], [75, 14], [98, 12.6], [114, 9.6], [125, 6], [131, 3], [134.5, 0]];
const meiaBoca = (x: number) => {
  for (let i = 1; i < CASCO.length; i++) {
    const [x0, w0] = CASCO[i - 1];
    const [x1, w1] = CASCO[i];
    if (x <= x1) return w0 + ((w1 - w0) * (x - x0)) / (x1 - x0);
  }
  return 0;
};
const formaDe = (pts: [number, number][], ex = 1, ez = 1, dz = 0) => {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0] * ex, 0);
  pts.forEach(([x, w]) => s.lineTo(x * ex, Math.max(0, w * ez - dz)));
  [...pts].reverse().forEach(([x, w]) => s.lineTo(x * ex, -Math.max(0, w * ez - dz)));
  s.closePath();
  return s;
};
// extrusão "em pé": a forma fica no plano XZ e a altura vai de y = 0 a y = h
const extrude = (s: THREE.Shape, h: number) => {
  const g = new THREE.ExtrudeGeometry(s, {depth: h, bevelEnabled: false});
  g.rotateX(-Math.PI / 2);
  return g;
};

// ---------- instâncias (janelas, postes da grade) ----------
const Inst: React.FC<{mats: THREE.Matrix4[]; geo: THREE.BufferGeometry; cor: string; brilha?: boolean}> = ({mats, geo, cor, brilha}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    mats.forEach((mx, i) => m.setMatrixAt(i, mx));
    m.instanceMatrix.needsUpdate = true;
  }, [mats]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, Math.max(1, mats.length)]} frustumCulled={false}>
      {brilha ? <meshBasicMaterial color={cor} /> : <meshStandardMaterial color={cor} />}
    </instancedMesh>
  );
};
const mt = (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz));

// posições dos 16 botes de madeira nos turcos (8 de cada lado) e dos turcos
const BOTES_X = [57, 47, 37, 27, -45, -55, -65, -75];
const DECK = 19.6; // convés dos botes
const ZB = 12.25; // centro do bote no turco (para dentro da grade)

// ---------- bote salva-vidas (9,1 × 2,8 m, fundo em y = 0) ----------
const BOTE_PTS: [number, number][] = [[-4.55, 0], [-4.0, 0.72], [-3.0, 1.2], [-1.5, 1.385], [1.5, 1.385], [3.0, 1.2], [4.0, 0.72], [4.55, 0]];
const useBoteGeo = () =>
  useMemo(() => {
    const fora = formaDe(BOTE_PTS);
    const parede = formaDe(BOTE_PTS);
    parede.holes.push(formaDe(BOTE_PTS, 0.975, 1, 0.09) as unknown as THREE.Path);
    return {fundo: extrude(fora, 0.3), parede: extrude(parede, 0.8), piso: extrude(formaDe(BOTE_PTS, 0.97, 1, 0.1), 0.03)};
  }, []);
export const Bote: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => {
  const g = useBoteGeo();
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh geometry={g.fundo} castShadow receiveShadow><meshStandardMaterial color="#f4f2ea" /></mesh>
      <mesh geometry={g.parede} position={[0, 0.3, 0]} castShadow receiveShadow><meshStandardMaterial color="#f4f2ea" side={2} /></mesh>
      <mesh geometry={g.piso} position={[0, 0.3, 0]} receiveShadow><meshStandardMaterial color="#a8743f" /></mesh>
      {/* friso de madeira na borda */}
      <mesh geometry={g.piso} position={[0, 1.08, 0]} scale={[1.03, 1, 1.08]}><meshStandardMaterial color="#8b5a3c" /></mesh>
      {[-3, -1.5, 0, 1.5, 3].map((x) => (<Caixa key={x} pos={[x, 0.7, 0]} tam={[0.3, 0.05, 2 * Math.max(0.3, lerpW(x)) - 0.25]} cor="#b98a55" />))}
    </group>
  );
};
const lerpW = (x: number) => {
  for (let i = 1; i < BOTE_PTS.length; i++) {
    const [x0, w0] = BOTE_PTS[i - 1];
    const [x1, w1] = BOTE_PTS[i];
    if (x <= x1) return w0 + ((w1 - w0) * (x - x0)) / (x1 - x0);
  }
  return 0;
};
// passageiro sentado no bote (banco em y = 0,72 do bote)
const Sentado: React.FC<{bote: V3; x: number; z: number; t: number; v: Visual; rotY?: number; colete?: boolean}> = ({bote, x, z, t, v, rotY = 0, colete = true}) => (
  <ComColete pos={[bote[0] + x, bote[1] + 0.62, bote[2] + z]} rotY={rotY} t={t} v={v} acao="senta" colete={colete} />
);

// colete salva-vidas branco (blocos de cortiça) preso ao peito e às costas do Zé 2.0
export const ComColete: React.FC<{pos: V3; rotY?: number; t: number; v: Visual; acao?: 'parado' | 'anda' | 'aponta' | 'acena' | 'senta' | 'carrega'; colete?: boolean; esc?: number; expressao?: Expressao; simples?: boolean}> = ({pos, rotY = 0, t, v, acao = 'parado', colete = true, esc = 0.92, expressao, simples}) => {
  const bloco = (z: number) => (
    <group position={[0, -0.06, z]}>
      <Caixa pos={[0, 0, 0]} tam={[0.44, 0.38, 0.1]} cor="#f4f0e2" sombra={false} />
      {z > 0 && [-0.1, 0.12].map((y) => (<Caixa key={y} pos={[0, y, 0.052]} tam={[0.42, 0.025, 0.01]} cor="#c9c2ad" sombra={false} />))}
    </group>
  );
  return <Boneco pos={pos} rotY={rotY} acao={acao} t={t} v={v} esc={esc} expressao={expressao} simples={simples} peito={colete ? bloco(0.03) : undefined} costas={colete ? bloco(-0.03) : undefined} />;
};

// ---------- o navio inteiro ----------
type NavioProps = {noite?: boolean; botes?: boolean[]; luzes?: boolean};
export const Titanic: React.FC<NavioProps> = ({noite = true, botes, luzes = true}) => {
  const geo = useMemo(() => {
    const s = formaDe(CASCO);
    return {
      vermelho: extrude(s, 9.6),
      preto: extrude(s, 14.6),
      convés: extrude(formaDe(CASCO, 0.995, 1, 0.25), 0.12),
      faixa: extrude(formaDe(CASCO, 1, 1, -0.03), 0.25),
      janela: new THREE.BoxGeometry(1, 1, 1),
    };
  }, []);
  const janelas = useMemo(() => {
    const casco: THREE.Matrix4[] = [];
    const sup: THREE.Matrix4[] = [];
    const r = rnd(7);
    for (const y of [4.2, 7.2, 10.2, 12.6]) {
      for (let x = -124; x <= 122; x += 1.7) {
        const w = meiaBoca(x);
        if (w < 3) continue;
        if (r() < 0.18) continue;
        for (const sg of [-1, 1]) casco.push(mt(x, y, sg * (w + 0.04), 0.42, 0.42, 0.08));
      }
    }
    for (const y of [15.6, 18.0]) {
      for (let x = -98; x <= 68; x += 1.4) {
        if (r() < 0.12) continue;
        for (const sg of [-1, 1]) sup.push(mt(x, y, sg * 12.54, 0.9, 1.05, 0.08));
      }
    }
    return {casco, sup};
  }, []);
  const postes = useMemo(() => {
    const m: THREE.Matrix4[] = [];
    for (let x = -100; x <= 70; x += 1.5) for (const sg of [-1, 1]) m.push(mt(x, DECK + 0.55, sg * 12.62, 0.05, 1.1, 0.05));
    return m;
  }, []);
  const corJan = noite && luzes ? '#ffd98a' : noite ? '#20242e' : '#2a2a33';
  return (
    <group>
      <mesh geometry={geo.vermelho} position={[0, -10, 0]}><meshStandardMaterial color="#8f2a22" /></mesh>
      <mesh geometry={geo.preto} position={[0, -0.4, 0]} castShadow receiveShadow><meshStandardMaterial color="#17161c" roughness={0.7} /></mesh>
      <mesh geometry={geo.faixa} position={[0, 13.0, 0]}><meshStandardMaterial color="#c9a24a" /></mesh>
      <mesh geometry={geo.convés} position={[0, 14.2, 0]} receiveShadow><meshStandardMaterial color="#c9a97a" /></mesh>
      {/* castelo de proa (mais alto) e popa */}
      <Caixa pos={[112, 15.4, 0]} tam={[34, 2.4, 2 * meiaBoca(112) - 1]} cor="#17161c" />
      <Caixa pos={[-118, 15.4, 0]} tam={[24, 2.4, 25]} cor="#17161c" />
      {/* superestrutura branca (conveses A e B) e convés dos botes */}
      <Caixa pos={[-15, 16.9, 0]} tam={[170, 5.4, 25]} cor="#f2efe6" />
      <Caixa pos={[-15, DECK - 0.05, 0]} tam={[170, 0.1, 25.3]} cor="#c9a97a" />
      {/* passadiço (ponte de comando) com as asas */}
      <Caixa pos={[65, DECK + 1.5, 0]} tam={[8, 3, 18]} cor="#f2efe6" />
      <Caixa pos={[68.9, DECK + 2.2, 0]} tam={[0.1, 0.9, 16]} cor="#2a3040" sombra={false} />
      <Caixa pos={[68.5, DECK + 2.9, 0]} tam={[3, 0.5, 26.4]} cor="#f2efe6" />
      {/* casarias do convés dos botes */}
      <Caixa pos={[-12, DECK + 1.4, 0]} tam={[124, 2.8, 9]} cor="#ece6d6" />
      <Caixa pos={[-12, DECK + 2.85, 0]} tam={[124.4, 0.12, 9.4]} cor="#b8a27a" />
      {/* quatro chaminés (a 4ª era falsa), inclinadas para trás */}
      {[50, 25, 0, -25].map((x) => (
        <group key={x} position={[x, DECK + 2.8, 0]} rotation={[0, 0, 0.1]}>
          <mesh position={[0, 10.5, 0]} scale={[1.15, 1, 0.85]} castShadow><cylinderGeometry args={[3.4, 3.4, 21, 24]} /><meshStandardMaterial color="#d79a3a" /></mesh>
          <mesh position={[0, 19.2, 0]} scale={[1.15, 1, 0.85]}><cylinderGeometry args={[3.45, 3.45, 3.8, 24]} /><meshStandardMaterial color="#141318" /></mesh>
        </group>
      ))}
      {/* mastros, cesto da gávea e antena */}
      <Cil pos={[100, 37, 0]} r={0.3} r2={0.42} h={46} cor="#b8935a" />
      <group position={[100, 29, 0]}>
        <mesh><cylinderGeometry args={[1.05, 0.95, 1.3, 24, 1, true]} /><meshStandardMaterial color="#f2efe6" side={2} /></mesh>
        <Cil pos={[0, -0.62, 0]} r={0.95} h={0.08} cor="#8b5a3c" />
      </group>
      <Cil pos={[-108, 35, 0]} r={0.3} r2={0.4} h={42} cor="#b8935a" />
      <Barra a={[100, 59, 0]} b={[-108, 55, 0]} r={0.04} cor="#2a2a30" sombra={false} />
      <Barra a={[100, 58, 0]} b={[133, 15.5, 0]} r={0.06} cor="#2a2a30" sombra={false} />
      <Barra a={[-108, 54, 0]} b={[-133, 16, 0]} r={0.06} cor="#2a2a30" sombra={false} />
      {/* guarda-corpo do convés dos botes */}
      {[-1, 1].map((sg) => (<Barra key={sg} a={[-100, DECK + 1.1, sg * 12.62]} b={[70, DECK + 1.1, sg * 12.62]} r={0.05} cor="#f2efe6" sombra={false} />))}
      <Inst mats={postes} geo={geo.janela} cor="#f2efe6" />
      {/* janelas e escotilhas (acesas à noite) */}
      <Inst mats={janelas.casco} geo={geo.janela} cor={corJan} brilha={noite} />
      <Inst mats={janelas.sup} geo={geo.janela} cor={corJan} brilha={noite} />
      {/* botes nos turcos */}
      {BOTES_X.flatMap((x, i) => [-1, 1].map((sg) => {
        const k = i * 2 + (sg > 0 ? 1 : 0);
        const tem = botes ? botes[k] !== false : true;
        return (
          <group key={k}>
            {[-3.6, 3.6].map((dx) => (
              <group key={dx}>
                <Barra a={[x + dx, DECK, sg * 11.6]} b={[x + dx, DECK + 3.4, sg * 12.1]} r={0.1} cor="#f2efe6" />
                <Barra a={[x + dx, DECK + 3.4, sg * 12.1]} b={[x + dx, DECK + 3.3, sg * 13.4]} r={0.09} cor="#f2efe6" />
              </group>
            ))}
            {tem && <Bote pos={[x, DECK + 0.55, sg * ZB]} />}
          </group>
        );
      }))}
    </group>
  );
};

// ---------- mar, céu e gelo ----------
const Mar: React.FC<{cor?: string}> = ({cor = MAR_NOITE}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
    <planeGeometry args={[9000, 9000]} />
    <meshStandardMaterial color={cor} roughness={0.35} metalness={0.15} />
  </mesh>
);
const Estrelas: React.FC = () => {
  const geo = useMemo(() => {
    const r = rnd(42);
    const p: number[] = [];
    for (let i = 0; i < 1400; i++) {
      const az = r() * Math.PI * 2;
      const el = 0.02 + Math.pow(r(), 0.7) * 1.45;
      const R = 2000;
      p.push(Math.cos(el) * Math.cos(az) * R, Math.sin(el) * R, Math.cos(el) * Math.sin(az) * R);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial color="#ffffff" size={2.2} sizeAttenuation={false} fog={false} />
    </points>
  );
};
// luz extra da noite sem lua: o céu estrelado ilumina o suficiente para ver o navio
const LuzNoite: React.FC<{forca?: number}> = ({forca = 1}) => (
  <>
    <hemisphereLight args={['#9fb4e8', '#1a2238', 0.9 * forca]} />
    <directionalLight position={[-300, 400, 500]} color="#b8c8f0" intensity={0.9 * forca} />
  </>
);
const NoiteAberta: React.FC<{forca?: number}> = ({forca}) => (
  <>
    <Mar />
    <Estrelas />
    <LuzNoite forca={forca} />
  </>
);

const useGelo = (seed: number, det = 1) =>
  useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, det);
    const pos = g.attributes.position;
    const r = rnd(seed);
    const mapa = new Map<string, number>();
    for (let i = 0; i < pos.count; i++) {
      const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
      if (!mapa.has(k)) mapa.set(k, 0.75 + r() * 0.5);
      const f = mapa.get(k)!;
      pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f, pos.getZ(i) * f);
    }
    g.computeVertexNormals();
    return g;
  }, [seed, det]);
export const Iceberg: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => {
  const a = useGelo(3, 1);
  const b = useGelo(9, 1);
  return (
    <group position={pos} scale={esc}>
      <mesh geometry={a} scale={[17, 21, 14]} position={[0, 0, 0]} castShadow><meshStandardMaterial color="#eaf6ff" emissive="#4a6a8a" emissiveIntensity={0.35} roughness={0.6} /></mesh>
      <mesh geometry={b} scale={[11, 13, 10]} position={[-12, 0, 3]} rotation={[0, 0.7, 0]} castShadow><meshStandardMaterial color="#dff0ff" emissive="#4a6a8a" emissiveIntensity={0.35} roughness={0.6} /></mesh>
      <mesh geometry={b} scale={[8, 9, 8]} position={[11, 0, -2]} rotation={[0.4, 1.7, 0]}><meshStandardMaterial color="#f4fbff" emissive="#4a6a8a" emissiveIntensity={0.35} roughness={0.6} /></mesh>
    </group>
  );
};
const Pedacos: React.FC<{centro: V3; raio: number; n?: number; esc?: number; seed?: number; t?: number}> = ({centro, raio, n = 30, esc = 0.5, seed = 5, t = 0}) => {
  const g = useGelo(seed + 100, 0);
  const lista = useMemo(() => {
    const r = rnd(seed);
    return Array.from({length: n}).map(() => ({x: (r() - 0.5) * 2 * raio, z: (r() - 0.5) * 2 * raio, s: 0.4 + r() * 0.9, ry: r() * 6}));
  }, [n, raio, seed]);
  return (
    <group position={centro}>
      {lista.map((q, i) => (
        <mesh key={i} geometry={g} position={[q.x, 0.05 + Math.sin(t * 1.5 + i) * 0.03, q.z]} rotation={[0, q.ry, 0]} scale={[q.s * esc, q.s * esc * 0.45, q.s * esc]}>
          <meshStandardMaterial color="#e6f3ff" emissive="#3a5a7a" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
};
// destroços boiando (tábuas e cadeiras de convés)
const Destrocos: React.FC<{centro: V3; raio: number; n?: number; seed?: number}> = ({centro, raio, n = 20, seed = 11}) => {
  const lista = useMemo(() => {
    const r = rnd(seed);
    return Array.from({length: n}).map(() => ({x: (r() - 0.5) * 2 * raio, z: (r() - 0.5) * 2 * raio, ry: r() * 6, tipo: r()}));
  }, [n, raio, seed]);
  return (
    <group position={centro}>
      {lista.map((q, i) => (q.tipo < 0.6 ? (
        <Caixa key={i} pos={[q.x, 0.04, q.z]} rot={q.ry} tam={[1.8, 0.08, 0.25]} cor="#8b5a3c" sombra={false} />
      ) : (
        <group key={i} position={[q.x, 0.06, q.z]} rotation={[0, q.ry, 0]}>
          <Caixa pos={[0, 0, 0]} tam={[0.6, 0.06, 1.5]} cor="#a8743f" sombra={false} />
          <Caixa pos={[0, 0.2, -0.6]} rot={[0.6, 0, 0]} tam={[0.6, 0.5, 0.05]} cor="#a8743f" sombra={false} />
        </group>
      )))}
    </group>
  );
};

const Pilula: React.FC<{texto: string; pos: V3; fundo: string; vis: number; tam?: number}> = ({texto, pos, fundo, vis, tam = 1}) =>
  vis > 0.01 ? (
    <sprite position={pos} scale={[0.22 * suave(vis) * tam, 0.052 * suave(vis) * tam, 1]} renderOrder={10}>
      <spriteMaterial map={texPilula(texto, fundo, '#ffffff')} depthTest={false} sizeAttenuation={false} />
    </sprite>
  ) : null;

// mala de couro
const Mala: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.2, 0]} tam={[0.55, 0.38, 0.2]} cor="#6b4429" />
    <Caixa pos={[0, 0.2, 0]} tam={[0.57, 0.04, 0.22]} cor="#3b2a20" sombra={false} />
    <Caixa pos={[0, 0.42, 0]} tam={[0.16, 0.05, 0.05]} cor="#3b2a20" sombra={false} />
  </group>
);

// ---------- interiores ----------
const Sala: React.FC<{larg: number; prof: number; alt: number; parede: string; chao: string; teto?: string}> = ({larg, prof, alt, parede, chao, teto}) => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[larg, 0.1, prof]} cor={chao} />
    <Caixa pos={[0, alt / 2, -prof / 2]} tam={[larg, alt, 0.12]} cor={parede} />
    <Caixa pos={[-larg / 2, alt / 2, 0]} tam={[0.12, alt, prof]} cor={parede} />
    <Caixa pos={[larg / 2, alt / 2, 0]} tam={[0.12, alt, prof]} cor={parede} />
    {teto && <Caixa pos={[0, alt + 0.05, -prof / 4]} tam={[larg, 0.1, prof / 2]} cor={teto} sombra={false} />}
  </group>
);
const Beliche: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {[0.4, 1.35].map((y) => (
      <group key={y}>
        <Caixa pos={[0, y, 0]} tam={[1.9, 0.12, 0.75]} cor="#f2efe6" />
        <Caixa pos={[0, y + 0.1, 0]} tam={[1.8, 0.1, 0.68]} cor="#c9302c" />
        <Caixa pos={[-0.7, y + 0.18, 0]} tam={[0.35, 0.1, 0.5]} cor="#f4f4f4" />
      </group>
    ))}
    {[-0.95, 0.95].map((x) => [-0.36, 0.36].map((z) => (<Caixa key={x + ':' + z} pos={[x, 0.85, z]} tam={[0.06, 1.7, 0.06]} cor="#d9d2c0" />)))}
  </group>
);
const Escotilha: React.FC<{pos: V3; rotY?: number; noite?: boolean}> = ({pos, rotY = 0, noite = false}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <mesh><torusGeometry args={[0.2, 0.04, 10, 28]} /><meshStandardMaterial color="#b88a3a" /></mesh>
    <mesh position={[0, 0, -0.01]}><circleGeometry args={[0.2, 40]} /><meshBasicMaterial color={noite ? '#0d1a30' : '#8fc4ea'} /></mesh>
  </group>
);
const Canos: React.FC<{larg: number; alt: number; prof: number}> = ({larg, alt, prof}) => (
  <>
    {[-0.35, -0.1, 0.2].map((z, i) => (<Barra key={z} a={[-larg / 2, alt - 0.18 - i * 0.04, z - prof / 4]} b={[larg / 2, alt - 0.18 - i * 0.04, z - prof / 4]} r={0.05 - i * 0.01} cor={['#8a8f99', '#b07a4a', '#6f747d'][i]} />))}
  </>
);
const Banheira: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Caixa pos={[0, 0.3, 0]} tam={[1.7, 0.6, 0.78]} cor="#f4f4f4" />
    <Caixa pos={[0, 0.58, 0]} tam={[1.5, 0.06, 0.6]} cor="#bcd8e8" sombra={false} />
    {[-0.7, 0.7].map((x) => [-0.3, 0.3].map((z) => (<Cil key={x + ':' + z} pos={[x, 0.05, z]} r={0.06} h={0.1} cor="#c9a24a" />)))}
    <Barra a={[0.8, 0.62, -0.3]} b={[0.8, 0.95, -0.38]} r={0.025} cor="#c9a24a" />
  </group>
);
const Lampada: React.FC<{pos: V3; luz?: boolean; forca?: number}> = ({pos, luz = true, forca = 6}) => (
  <group position={pos}>
    <mesh><sphereGeometry args={[0.09, 20, 14]} /><meshBasicMaterial color="#fff2c0" /></mesh>
    {luz && <pointLight color="#ffe0a0" intensity={forca} distance={9} decay={1.6} />}
  </group>
);

// grande escadaria da primeira classe (carvalho, domo de vidro e lustre)
const Escadaria: React.FC = () => {
  const degraus = 14;
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[12, 0.1, 10]} cor="#d9cfb8" />
      {/* piso xadrez */}
      {Array.from({length: 6}).flatMap((_, i) => Array.from({length: 5}).map((__, j) => ((i + j) % 2 === 0 ? (
        <Caixa key={i + ':' + j} pos={[-5 + i * 2, 0.005, -4 + j * 2]} tam={[1, 0.01, 1]} cor="#a8423a" sombra={false} />
      ) : null)))}
      {/* paredes de carvalho */}
      <Caixa pos={[0, 3, -5]} tam={[12, 6, 0.2]} cor="#7a5030" />
      <Caixa pos={[-6, 3, 0]} tam={[0.2, 6, 10]} cor="#7a5030" />
      <Caixa pos={[6, 3, 0]} tam={[0.2, 6, 10]} cor="#7a5030" />
      {[-4, -2, 2, 4].map((x) => (<Caixa key={x} pos={[x, 3, -4.88]} tam={[1.2, 4.6, 0.04]} cor="#8f6038" sombra={false} />))}
      {/* relógio no patamar */}
      <group position={[0, 4.1, -4.85]}>
        <Caixa pos={[0, 0, 0]} tam={[1.8, 1.3, 0.1]} cor="#5a3a20" />
        <mesh position={[0, 0, 0.07]}><circleGeometry args={[0.35, 40]} /><meshStandardMaterial color="#f4efe2" /></mesh>
      </group>
      {/* degraus largos subindo até o patamar */}
      {Array.from({length: degraus}).map((_, i) => (
        <Caixa key={i} pos={[0, 0.1 + i * 0.18, 1.6 - i * 0.3]} tam={[4.2 - i * 0.04, 0.2, 0.32]} cor={i % 2 ? '#cbb796' : '#d6c4a2'} />
      ))}
      <Caixa pos={[0, 1.25, -3.8]} tam={[6, 2.5, 2.2]} cor="#cbb796" />
      {/* corrimãos com balaústres */}
      {[-1, 1].map((sg) => (
        <group key={sg}>
          <Barra a={[sg * 2.2, 1.0, 1.8]} b={[sg * 2.2, 3.5, -2.6]} r={0.07} cor="#5a3a20" />
          {Array.from({length: 9}).map((_, i) => (<Cil key={i} pos={[sg * 2.2, 0.5 + i * 0.28, 1.6 - i * 0.48]} r={0.04} h={0.9} cor="#e0c88a" seg={6} />))}
          <Cil pos={[sg * 2.2, 0.75, 1.9]} r={0.16} h={1.5} cor="#5a3a20" />
          <mesh position={[sg * 2.2, 1.65, 1.9]}><sphereGeometry args={[0.16, 20, 14]} /><meshBasicMaterial color="#fff2c0" /></mesh>
        </group>
      ))}
      {/* domo de vidro e lustre */}
      <Caixa pos={[0, 6.05, 0]} tam={[12, 0.1, 10]} cor="#e8dcc0" sombra={false} />
      <mesh position={[0, 6.0, 0]} rotation={[Math.PI, 0, 0]}><sphereGeometry args={[3.2, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#cfe6f0" emissive="#8fb8d0" emissiveIntensity={0.4} side={2} /></mesh>
      <group position={[0, 4.6, 0.3]}>
        <Barra a={[0, 1.4, 0]} b={[0, 0.3, 0]} r={0.02} cor="#c9a24a" />
        <mesh><torusGeometry args={[0.6, 0.04, 10, 28]} /><meshStandardMaterial color="#c9a24a" /></mesh>
        {Array.from({length: 8}).map((_, i) => (<mesh key={i} position={[Math.cos(i * 0.785) * 0.6, 0.05, Math.sin(i * 0.785) * 0.6]}><sphereGeometry args={[0.07, 20, 14]} /><meshBasicMaterial color="#fff2c0" /></mesh>))}
        <pointLight color="#ffe0a0" intensity={14} distance={14} decay={1.4} />
      </group>
    </group>
  );
};

// corredor comprido da terceira classe (o "labirinto")
const Corredor: React.FC<{agua: number; t: number}> = ({agua, t}) => {
  const L = 34;
  const portas: number[] = [];
  for (let z = 1; z > -L + 2; z -= 2.6) portas.push(z);
  return (
    <group>
      <Caixa pos={[0, -0.05, -L / 2 + 2]} tam={[2.6, 0.1, L]} cor="#8a6a4a" />
      <Caixa pos={[0, 2.45, -L / 2 + 2]} tam={[2.6, 0.1, L]} cor="#d9d2c0" sombra={false} />
      {[-1.3, 1.3].map((x) => (
        <group key={x}>
          {/* parede com aberturas para corredores laterais */}
          {[[-0.2, 7.6], [-9.4, 8.8], [-19.8, 9.4], [-30, 8]].map(([z0, len]) => (<Caixa key={z0} pos={[x, 1.2, z0 - len / 2 + 2]} tam={[0.1, 2.4, len]} cor="#ece6d6" />))}
          {portas.map((z) => (<Caixa key={z} pos={[x * 0.97, 1.0, z]} tam={[0.04, 2.0, 0.8]} cor="#7a5034" sombra={false} />))}
        </group>
      ))}
      {/* corredores laterais escuros */}
      {[-6.4, -16.2, -26.5].map((z) => [-1, 1].map((sg) => (
        <group key={z + ':' + sg}>
          <Caixa pos={[sg * 4.3, -0.05, z]} tam={[6, 0.1, 1.2]} cor="#7a5a3a" />
          <Caixa pos={[sg * 4.3, 1.2, z - 0.7]} tam={[6, 2.4, 0.1]} cor="#cfc8b6" />
          <Caixa pos={[sg * 4.3, 1.2, z + 0.7]} tam={[6, 2.4, 0.1]} cor="#cfc8b6" />
          <Caixa pos={[sg * 7.3, 1.2, z]} tam={[0.1, 2.4, 1.5]} cor="#4a4438" />
        </group>
      )))}
      <Caixa pos={[0, 1.2, -L + 2]} tam={[2.6, 2.4, 0.1]} cor="#cfc8b6" />
      {/* canos no teto */}
      {[-0.6, 0.5].map((x, i) => (<Barra key={x} a={[x, 2.25, 2]} b={[x, 2.25, -L + 2]} r={0.06 - i * 0.015} cor={i ? '#b07a4a' : '#8a8f99'} sombra={false} />))}
      {[-2, -9, -16, -23, -30].map((z, i) => (<Lampada key={z} pos={[0, 2.3, z]} luz={i < 4} forca={(i === 1 ? 4 : 3) * (0.85 + 0.15 * Math.sin(t * 23 + i))} />))}
      {/* água subindo no chão */}
      <mesh position={[0, 0.02 + agua, -L / 2 + 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.5, L]} /><meshStandardMaterial color="#2a6a8a" transparent opacity={0.7} roughness={0.2} /></mesh>
    </group>
  );
};

// ---------- convés dos botes (multidão de colete) ----------
const Multidao: React.FC<{t: number; x0: number; x1: number; n: number; seed?: number; zMin?: number; zMax?: number}> = ({t, x0, x1, n, seed = 3, zMin = 6, zMax = 11.2}) => {
  const lista = useMemo(() => {
    const r = rnd(seed);
    return Array.from({length: n}).map((_, i) => ({x: lerp(x0, x1, (i + r() * 0.8) / n), z: lerp(zMin, zMax, r()), ry: r() * 1.4 + 0.2, v: i % 4 === 0 ? (i % 8 === 0 ? RICA : RICO) : IMIGRANTES[i % IMIGRANTES.length]}));
  }, [x0, x1, n, seed, zMin, zMax]);
  return (
    <>
      {lista.map((q, i) => (<ComColete key={i} pos={[q.x, DECK, q.z]} rotY={q.ry} t={t + i} v={q.v} acao={i % 5 === 0 ? 'aponta' : 'parado'} />))}
    </>
  );
};

// botes: o bote "lançado" sai do turco e desce pelo costado
const BOTE_DESCE_X = -45;

export const SETS_TITANIC: Record<string, SetHistoria> = {
  // ===== gancho: o navio inteiro na noite estrelada =====
  ti_navio: {
    ceu: CEU_NOITE,
    luz: 'noite',
    nevoa: [500, 2600],
    render: ({t}) => (
      <>
        <NoiteAberta />
        <Titanic />
        <ComColete pos={[-30, DECK, 11.7]} rotY={0.2} t={t} v={ZE_1912} acao="parado" colete={false} />
        <ComColete pos={[-28.8, DECK, 11.6]} rotY={-0.3} t={t + 1} v={IMIGRANTES[1]} colete={false} />
        <ComColete pos={[-31.4, DECK, 11.5]} rotY={0.5} t={t + 2} v={IMIGRANTES[0]} colete={false} />
      </>
    ),
    cams: {
      drone: orb([5, 18, 0], 42, 12, 360, 320, 40, 10),
      ze: orb([-30, DECK + 1.2, 11.7], 22, 14, 4.6, 3.8, 40, 8),
    },
  },
  // ===== convés dos botes: gente demais, botes de menos =====
  ti_botes: {
    clima: 'serio',
    ceu: CEU_NOITE,
    luz: 'noite',
    nevoa: [300, 2200],
    render: ({t, p}) => (
      <>
        <NoiteAberta forca={1.1} />
        <Titanic />
        <Multidao t={t} x0={-80} x1={-40} n={22} />
        <ComColete pos={[-50.5, DECK, 10.5]} rotY={0.4} t={t} v={OFICIAL} acao="aponta" colete={false} />
        <ComColete pos={[-60.5, DECK, 10.6]} rotY={-0.3} t={t + 1} v={OFICIAL} acao="acena" colete={false} />
        <Pilula texto="lei: 16 botes" pos={[-60, DECK + 4.6, 12]} fundo="#d6282b" vis={clamp01((p - 0.62) * 8)} />
        <Pilula texto="Titanic: 20" pos={[-60, DECK + 3.6, 12]} fundo="#2a7a4a" vis={clamp01((p - 0.7) * 8)} />
      </>
    ),
    cams: {
      metade: orb([-60, DECK + 1, 9], 35, 40, 46, 40, 42, 8),
      geral: orb([-57, DECK + 1.6, 9.5], 105, 16, 26, 22, 44, 8),
      lei: orb([-55, DECK + 1.2, 11], 20, 25, 12, 10, 40, 8),
      dezesseis: orb([-60, DECK + 2.6, 11], 60, 22, 15, 13, 42, 8),
    },
  },
  // ===== Southampton: o cais e o casco gigante =====
  ti_cais: {
    ceu: CEU_DIA,
    luz: 'dia',
    nevoa: [400, 2400],
    render: ({t}) => (
      <>
        <Mar cor={MAR_DIA} />
        <Titanic noite={false} />
        {/* cais de pedra, galpões e guindaste */}
        <Caixa pos={[0, 1.5, 55]} tam={[420, 3.2, 80]} cor="#a39a88" />
        <Caixa pos={[0, 3.12, 55]} tam={[420, 0.05, 80]} cor="#b9b09c" sombra={false} />
        {[-60, 20, 90].map((x) => (
          <group key={x}>
            <Caixa pos={[x, 3.1 + 5, 82]} tam={[50, 10, 20]} cor="#8a4a3a" />
            <mesh position={[x, 3.1 + 10, 82]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[10.2, 10.2, 50, 3]} /><meshStandardMaterial color="#5a5f6a" /></mesh>
          </group>
        ))}
        <group position={[-20, 3.1, 22]}>
          <Caixa pos={[0, 9, 0]} tam={[1.2, 18, 1.2]} cor="#3a3f4a" />
          <Barra a={[0, 18, 0]} b={[0, 20, -14]} r={0.25} cor="#3a3f4a" />
        </group>
        {/* prancha de embarque até a porta no casco */}
        <Barra a={[12, 3.2, 21]} b={[12, 7.6, 14.3]} r={0.6} cor="#7a5034" quadrada />
        <Caixa pos={[12, 8.6, 14.0]} tam={[2.2, 2.2, 0.2]} cor="#2a2a30" sombra={false} />
        {/* você, com a mala, e outros imigrantes na fila */}
        <ComColete pos={[11.2, 3.15, 24.6]} rotY={Math.PI - 0.15} t={t} v={ZE_1912} acao="parado" colete={false} />
        <Mala pos={[10.6, 3.15, 24.3]} rotY={0.2} />
        {[[13.2, 23.2], [14.2, 25.5], [9.0, 26.4], [15.6, 27.2], [11.9, 28.4], [8.0, 23.4]].map(([x, z], i) => (
          <group key={i}>
            <ComColete pos={[x, 3.15, z]} rotY={Math.PI + (i % 2 ? 0.3 : -0.3)} t={t + i} v={IMIGRANTES[i % IMIGRANTES.length]} colete={false} />
            {i % 2 === 0 && <Mala pos={[x + 0.45, 3.15, z + 0.1]} rotY={0.5} />}
          </group>
        ))}
        <ComColete pos={[12.4, 3.15, 21.6]} rotY={0.4} t={t} v={OFICIAL} acao="aponta" colete={false} />
      </>
    ),
    cams: {
      geral: orb([11, 9, 20], 28, 14, 48, 40, 46, 8),
      passagem: orb([11.2, 4.3, 24.6], 200, 4, 3.6, 3.0, 40, 10),
      casco: {de: [34, 4.2, 30], para: [26, 4.6, 28], alvo: [8, 26, 0], alvoPara: [4, 28, 0], fov: 52},
    },
  },
  // ===== a cabine da terceira classe =====
  ti_cabine: {
    ceu: ['#2a2420', '#3a3028'],
    luz: 'interior',
    render: ({t}) => (
      <>
        <Sala larg={2.6} prof={2.4} alt={2.4} parede="#f2efe6" chao="#8a6a4a" />
        <Canos larg={2.6} alt={2.4} prof={2.4} />
        <Beliche pos={[-0.32, 0, -0.75]} />
        <Escotilha pos={[0.9, 1.6, -1.13]} noite={false} />
        {/* pia pequena */}
        <Caixa pos={[1.05, 0.85, -0.4]} tam={[0.35, 0.12, 0.45]} cor="#f4f4f4" />
        <Caixa pos={[1.05, 0.45, -0.4]} tam={[0.08, 0.8, 0.08]} cor="#d9d2c0" />
        <Lampada pos={[0, 2.25, 0]} forca={3} />
        <Mala pos={[0.25, 0, 0.15]} rotY={0} />
        <ComColete pos={[0.25, 0.35, 0.15]} t={t} v={ZE_1912} acao="senta" colete={false} />
        <ComColete pos={[-0.85, 0, 0.35]} rotY={0.5} t={t + 1} v={IMIGRANTES[2]} colete={false} />
        <Rotulo texto="perto das máquinas" ancora={[-1.0, 2.2, -0.95]} sobe={0.35} vis={1} fundo="#ffd23f" tam={0.9} />
      </>
    ),
    cams: {
      geral: orb([-0.1, 1.05, -0.2], 12, 10, 4.6, 4.0, 50, 8),
    },
  },
  // ===== 2 banheiras para ~700 pessoas =====
  ti_banheira: {
    ceu: ['#2a2420', '#3a3028'],
    luz: 'interior',
    render: ({t}) => (
      <>
        <Sala larg={5} prof={3.6} alt={2.5} parede="#e6eef0" chao="#d9d2c0" />
        {Array.from({length: 10}).map((_, i) => (<Caixa key={i} pos={[-2.25 + i * 0.5, 0.005, 0]} tam={[0.25, 0.01, 3.6]} cor="#bfc8cc" sombra={false} />))}
        <Banheira pos={[-1.2, 0, -1.3]} />
        <Banheira pos={[1.2, 0, -1.3]} />
        <Lampada pos={[0, 2.35, -0.6]} forca={4} />
        {/* a fila sai pela porta e não acaba */}
        {Array.from({length: 9}).map((_, i) => (
          <ComColete key={i} pos={[2.0 - (i % 2) * 0.25, 0, 0.1 + i * 0.75]} rotY={Math.PI + 0.1} t={t + i} v={i === 1 ? ZE_1912 : IMIGRANTES[i % IMIGRANTES.length]} colete={false} />
        ))}
        <Pilula texto="1" pos={[-1.2, 1.15, -1.3]} fundo="#d6282b" vis={1} tam={0.6} />
        <Pilula texto="2" pos={[1.2, 1.15, -1.3]} fundo="#d6282b" vis={1} tam={0.6} />
      </>
    ),
    cams: {
      fila: orb([0.2, 0.9, -0.3], -18, 18, 7.2, 6.2, 46, 8),
    },
  },
  // ===== primeira classe: a grande escadaria =====
  ti_primeira: {
    ceu: ['#2a2018', '#3a2a1e'],
    luz: 'interior',
    render: ({t}) => (
      <>
        <Escadaria />
        <ComColete pos={[-0.5, 0.1 + 6 * 0.18 + 0.1, 1.6 - 6 * 0.3]} rotY={0.1} t={t} v={RICO} acao="parado" colete={false} />
        <ComColete pos={[0.5, 0.1 + 6 * 0.18 + 0.1, 1.6 - 6 * 0.3]} rotY={-0.1} t={t + 1} v={RICA} acao="acena" colete={false} />
        <ComColete pos={[-3.2, 0, 2.6]} rotY={0.7} t={t + 2} v={RICA2} colete={false} />
        <ComColete pos={[3.3, 0, 2.4]} rotY={-0.8} t={t + 3} v={OFICIAL} colete={false} />
      </>
    ),
    cams: {
      escada: orb([0, 2.0, -0.4], 8, 8, 8.4, 7.0, 46, 8),
    },
  },
  // ===== o cesto da gávea: o vigia vê o iceberg =====
  ti_gavea: {
    clima: 'surpreso',
    ceu: CEU_NOITE,
    luz: 'noite',
    nevoa: [250, 2400],
    render: ({t, p}) => (
      <>
        <NoiteAberta forca={1.2} />
        <Titanic />
        <ComColete pos={[100.1, 28.35, 0.45]} rotY={Math.PI / 2} t={t} v={MARUJO} acao={p > 0.45 ? 'aponta' : 'parado'} colete={false} />
        <ComColete pos={[99.8, 28.35, -0.5]} rotY={Math.PI / 2 - 0.2} t={t + 1} v={MARUJO} colete={false} />
        {/* sino do cesto */}
        <Cil pos={[100.95, 29.0, -0.1]} r={0.12} r2={0.2} h={0.3} cor="#c9a24a" />
        <Iceberg pos={[lerp(470, 330, p), 0, 30]} />
        {p > 0.5 && <Pilula texto="ICEBERG!" pos={[lerp(470, 330, p), 26, 30]} fundo="#d6282b" vis={clamp01((p - 0.55) * 6)} />}
      </>
    ),
    cams: {
      vigia: orb([100.1, 29.6, 0], 75, 28, 5.2, 4.4, 42, 10),
      frente: {de: [97.4, 30.6, -1.6], para: [97.8, 30.4, -1.3], alvo: [400, 12, 30], alvoPara: [360, 10, 30], fov: 30},
    },
  },
  // ===== a batida: o casco raspa no iceberg =====
  ti_iceberg: {
    clima: 'medo',
    ceu: CEU_NOITE,
    luz: 'noite',
    nevoa: [300, 2400],
    render: ({t, p}) => {
      const dx = lerp(-45, 0, p);
      const contato = 88;
      return (
        <>
          <NoiteAberta forca={1.2} />
          <group position={[dx, 0, 0]}><Titanic /></group>
          <Iceberg pos={[contato + 12, 0, 29]} />
          <Pedacos centro={[contato + 4, 0, 16]} raio={6} n={22} esc={0.9} t={t} />
          {/* gelo caindo no convés da proa */}
          {p > 0.45 && Array.from({length: 18}).map((_, i) => {
            const k = ((t * 0.9 + i * 0.13) % 1);
            return (<mesh key={i} position={[contato - 6 + (i % 6) * 2.2, 26 - k * 10, 9 + (i % 3) * 1.4]}><icosahedronGeometry args={[0.35, 0]} /><meshStandardMaterial color="#eaf6ff" emissive="#4a6a8a" emissiveIntensity={0.4} /></mesh>);
          })}
          {/* água espirrando no ponto da batida */}
          {p > 0.45 && Array.from({length: 26}).map((_, i) => {
            const k = ((t * 1.6 + i * 0.077) % 1);
            return (<mesh key={'s' + i} position={[contato - 10 + i * 0.8, 1 + Math.sin(k * Math.PI) * 4, 14.6 + k * 1.5]}><sphereGeometry args={[0.28, 20, 14]} /><meshBasicMaterial color="#cfe6ff" /></mesh>);
          })}
        </>
      );
    },
    cams: {
      geral: orb([70, 10, 10], 62, 16, 175, 150, 40, 10),
      raspa: orb([84, 4, 18], 60, 55, 70, 60, 44, 10),
    },
  },
  // ===== o bote descendo pelo costado (e embarque de mulheres e crianças) =====
  ti_bote: {
    clima: 'medo',
    ceu: CEU_NOITE,
    luz: 'noite',
    nevoa: [300, 2400],
    render: ({t, p}) => {
      const y = lerp(DECK + 0.4, 8.0, suave(p));
      const bote: V3 = [BOTE_DESCE_X, y, 14.2];
      const botes = BOTES_X.flatMap((_, i) => [true, i !== 4]);
      return (
        <>
          <NoiteAberta forca={1.2} />
          <Titanic botes={botes} />
          <Bote pos={bote} />
          {[-3.6, 3.6].map((dx) => (<Barra key={dx} a={[BOTE_DESCE_X + dx, DECK + 3.3, 13.9]} b={[BOTE_DESCE_X + dx * 0.9, y + 1.1, 14.2]} r={0.03} cor="#d9cfb8" sombra={false} />))}
          {/* poucos dentro: nem metade cheio */}
          <Sentado bote={bote} x={-1.5} z={-0.5} t={t} v={RICA} />
          <Sentado bote={bote} x={-1.5} z={0.5} t={t + 1} v={MENINA} />
          <Sentado bote={bote} x={0} z={-0.4} t={t + 2} v={RICA2} />
          <Sentado bote={bote} x={1.5} z={0.4} t={t + 3} v={RICO} />
          <Sentado bote={bote} x={3} z={0} t={t + 4} v={MARUJO} colete={false} />
          {/* no convés: o oficial chama mulheres e crianças */}
          <ComColete pos={[BOTE_DESCE_X - 2.4, DECK, 11.4]} rotY={0.9} t={t} v={OFICIAL} acao="aponta" colete={false} />
          <ComColete pos={[BOTE_DESCE_X - 0.4, DECK, 11.6]} rotY={0.2} t={t + 1} v={MULHER} acao="anda" />
          <ComColete pos={[BOTE_DESCE_X + 0.3, DECK, 11.3]} rotY={0.2} t={t + 2} v={MENINA} acao="anda" esc={0.62} />
          <ComColete pos={[BOTE_DESCE_X - 4.2, DECK, 10.4]} rotY={0.6} t={t + 3} v={RICA} />
          <ComColete pos={[BOTE_DESCE_X - 5.4, DECK, 9.6]} rotY={0.8} t={t + 4} v={RICO} acao="acena" />
          <Multidao t={t} x0={-80} x1={-52} n={10} seed={8} />
        </>
      );
    },
    cams: {
      desce: orb([BOTE_DESCE_X, 10, 15], 58, 12, 30, 26, 44, 8),
      mulheres: orb([BOTE_DESCE_X - 1, DECK + 1.0, 11], 95, 18, 9, 7.6, 44, 8),
    },
  },
  // ===== o labirinto de corredores, com água no chão =====
  ti_corredor: {
    clima: 'medo',
    ceu: ['#1a1612', '#1a1612'],
    luz: 'tunel',
    render: ({t, p}) => {
      const z = lerp(-11, -6, p);
      return (
        <>
          <Corredor agua={0.05 + 0.2 * p} t={t} />
          <ComColete pos={[0.15, 0.02, z]} rotY={0.05} t={t} v={ZE_1912} acao="anda" />
          <ComColete pos={[-0.5, 0.02, z - 6]} rotY={0} t={t + 1} v={IMIGRANTES[1]} acao="anda" />
          <ComColete pos={[0.5, 0.02, z - 9]} rotY={Math.PI / 2} t={t + 2} v={IMIGRANTES[0]} acao="anda" />
          <hemisphereLight args={['#fff0d8', '#3a3028', 0.5]} />
        </>
      );
    },
    cams: {
      ze: {de: [0.35, 1.75, -6.6], para: [0.3, 1.7, -2.2], alvo: [0, 1.1, -12], alvoPara: [0, 1.1, -7.5], fov: 50},
    },
  },
  // ===== a classe decide quem vive: 62% x 25% =====
  ti_placar: {
    ceu: CEU_NOITE,
    luz: 'noite',
    nevoa: [200, 2000],
    render: ({t, p}) => {
      const salvos1 = [0, 1, 3, 4, 6]; // 5 de 8 = 62%
      const salvos3 = [2, 5]; // 2 de 8 = 25%
      const v1 = [RICO, RICA, RICO, RICA2, RICO, RICA, RICA2, RICO];
      return (
        <>
          <NoiteAberta forca={1.2} />
          {/* um pedaço de convés de madeira com a grade */}
          <Caixa pos={[0, -0.1, 0]} tam={[24, 0.2, 7]} cor="#a8875a" />
          <Barra a={[-12, 1.1, -3.3]} b={[12, 1.1, -3.3]} r={0.05} cor="#f2efe6" />
          {Array.from({length: 17}).map((_, i) => (<Caixa key={i} pos={[-12 + i * 1.5, 0.55, -3.3]} tam={[0.05, 1.1, 0.05]} cor="#f2efe6" />))}
          {Array.from({length: 8}).map((_, i) => {
            const ok = salvos1.includes(i);
            return (<ComColete key={'a' + i} pos={[-9.4 + i * 0.95, 0, (i % 2) * 0.5]} t={t + i} v={ok ? v1[i] : CINZA} colete={ok} acao={ok && p < 0.5 ? 'acena' : 'parado'} />);
          })}
          {Array.from({length: 8}).map((_, i) => {
            const ok = salvos3.includes(i);
            return (<ComColete key={'b' + i} pos={[2.75 + i * 0.95, 0, (i % 2) * 0.5]} t={t + i} v={ok ? (i === 2 ? ZE_1912 : IMIGRANTES[i % 5]) : CINZA} colete={ok} acao={ok && p >= 0.5 ? 'acena' : 'parado'} />);
          })}
          <Rotulo texto="1ª classe" ancora={[-6.1, 2.0, 0]} sobe={0.6} vis={p < 0.5 ? 1 : 0} fundo="#2a7a4a" />
          <Rotulo texto="3ª classe" ancora={[6.1, 2.0, 0]} sobe={0.6} vis={p >= 0.5 ? 1 : 0} fundo="#d6282b" />
          <hemisphereLight args={['#ffffff', '#2a3048', 0.5]} />
        </>
      );
    },
    cams: {
      primeira: orb([-6.1, 1.0, 0.2], 8, 10, 9.4, 8.2, 42, 8),
      terceira: orb([6.1, 1.0, 0.2], -8, 10, 9.4, 8.2, 42, -8),
    },
  },
  // ===== 2h20: o navio afunda de proa =====
  ti_naufragio: {
    clima: 'medo',
    ceu: CEU_NOITE,
    luz: 'noite',
    nevoa: [400, 2600],
    render: ({p}) => {
      const ang = lerp(0.1, 0.62, suave(p));
      const desce = lerp(-6, -30, suave(p));
      return (
        <>
          <NoiteAberta forca={1.2} />
          <group position={[0, desce, 0]} rotation={[0, 0, -ang]}>
            <Titanic luzes={p < 0.8} botes={BOTES_X.flatMap(() => [false, false])} />
          </group>
          {[[-60, 160], [40, 210], [-150, 240], [120, 260], [-20, 300]].map(([x, z], i) => (
            <group key={i}>
              <Bote pos={[x, -0.45, z]} rotY={0.4 * i} />
              {[-1.5, 0, 1.5].map((dx) => (<ComColete key={dx} pos={[x + dx, 0.17, z]} rotY={Math.PI} t={i} v={IMIGRANTES[(i + 2) % 5]} acao="senta" />))}
            </group>
          ))}
          <Destrocos centro={[60, 0, 40]} raio={45} n={30} />
        </>
      );
    },
    cams: {
      geral: orb([0, 10, 0], 20, 5, 230, 205, 40, 8),
      popa: orb([-70, 20, 0], 10, 6, 320, 280, 40, 8),
    },
  },
  // ===== a água a -2 °C, vista de dentro do bote =====
  ti_agua: {
    clima: 'medo',
    ceu: CEU_NOITE,
    luz: 'noite',
    nevoa: [200, 2400],
    render: ({t}) => {
      const bote: V3 = [0, -0.45, 0];
      return (
        <>
          <NoiteAberta forca={1.3} />
          <Bote pos={bote} rotY={Math.sin(t) * 0.02} />
          <Sentado bote={bote} x={0} z={-0.45} t={t} v={ZE_1912} />
          <Sentado bote={bote} x={0} z={0.45} t={t + 1} v={MULHER} />
          <Sentado bote={bote} x={-1.5} z={0.45} t={t + 2} v={IMIGRANTES[0]} />
          <Sentado bote={bote} x={1.5} z={-0.45} t={t + 3} v={MENINA} />
          <Pedacos centro={[0, 0, 0]} raio={9} n={46} esc={0.7} t={t} seed={21} />
          <Destrocos centro={[0, 0, 0]} raio={10} n={10} seed={4} />
          {/* vapor do frio saindo da boca */}
          {Array.from({length: 6}).map((_, i) => {
            const k = (t * 0.6 + i / 6) % 1;
            return (<mesh key={i} position={[0.05, 1.82 + k * 0.4, -0.15 + k * 0.5]}><sphereGeometry args={[0.04 + k * 0.08, 20, 14]} /><meshBasicMaterial color="#dfe8f5" transparent opacity={0.5 * (1 - k)} /></mesh>);
          })}
          <Pilula texto="-2 °C" pos={[2.4, 0.6, 2.6]} fundo="#2a6a9a" vis={1} tam={0.7} />
        </>
      );
    },
    cams: {
      bote: orb([0, 1.0, -0.3], 24, 14, 5.2, 4.4, 42, 8),
    },
  },
  // ===== fecho: botes espalhados no mar escuro e a pergunta =====
  ti_fim: {
    clima: 'triste',
    ceu: CEU_NOITE,
    luz: 'noite',
    nevoa: [300, 2400],
    render: ({t}) => {
      const bz: V3 = [0, -0.45, 0];
      return (
        <>
          <NoiteAberta forca={1.3} />
          <Bote pos={bz} rotY={0.1} />
          <Sentado bote={bz} x={0} z={-0.45} t={t} v={ZE_1912} rotY={0} />
          <Sentado bote={bz} x={-1.5} z={0.45} t={t + 1} v={MULHER} />
          <Sentado bote={bz} x={1.5} z={0.45} t={t + 2} v={IMIGRANTES[2]} />
          {[[-26, -14], [22, -30], [-44, 18], [36, 16], [8, 40], [-12, -46], [52, -8]].map(([x, z], i) => (
            <group key={i}>
              <Bote pos={[x, -0.45, z]} rotY={i * 0.8} />
              {[-1.5, 1.5].map((dx) => (<ComColete key={dx} pos={[x + Math.cos(i * 0.8) * dx, 0.17, z - Math.sin(i * 0.8) * dx]} rotY={i * 0.8 + Math.PI / 2} t={i} v={IMIGRANTES[i % 5]} acao="senta" />))}
            </group>
          ))}
          <Pedacos centro={[0, 0, 0]} raio={60} n={90} esc={1.2} seed={31} t={t} />
          <Destrocos centro={[0, 0, 0]} raio={50} n={40} seed={9} />
          <ComColete pos={[2.6, 0.17, 0.3]} rotY={0} t={t} v={OFICIAL} acao="senta" colete={false} />
        </>
      );
    },
    cams: {
      aereo: orb([0, 0, 0], 30, 58, 110, 90, 42, 10),
      botes: orb([4, 1.2, 0], 70, 16, 30, 24, 42, 8),
      ze: orb([0, 1.05, -0.45], 6, 4, 3.0, 2.5, 40, 6),
    },
  },
};
