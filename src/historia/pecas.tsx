// PEÇAS de época (Você na História) em ESCALA REAL (1 unidade = 1 metro).
// Coliseu: planta 189 × 156 m, arena 87,5 × 54,8 m, 48 m de altura, 80 arcos por andar (roteiros/um-dia-como-gladiador-em-roma.pesquisa.md).
// Arena no centro (0, 0, 0); eixo maior em X, menor em Z. Camarote do imperador (pulvinar) no lado -Z.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, Caixa, Cil, Mat, Visual, clamp01, lerp, suave} from '../v4/kit';

export {clamp01, lerp, suave};

// ---------- figurino (Zé e romanos) ----------
const PELE = '#ffd2ad';
export const ZE_GLAD: Visual = {camisa: '#b8322b', calca: PELE, colete: null, capacete: null, elmo: {cor: '#c9a24a', penacho: '#d6282b'}, escudo: '#8f1f1a'};
export const ZE_SEM_ESCUDO: Visual = {...ZE_GLAD, escudo: undefined};
export const ZE_ESCRAVO: Visual = {camisa: '#cbb79a', calca: PELE, colete: null, capacete: null, cabelo: '#3b2a20'};
export const PRISIONEIRO: Visual = {camisa: '#7a6a55', calca: '#d9b38c', colete: null, capacete: null, pele: '#f2c9a4', cabelo: '#d9a85a'};
export const CONDENADO: Visual = {camisa: '#5c5048', calca: '#b98a66', colete: null, capacete: null, pele: '#b98a66', cabelo: '#1d1b26'};
export const LANISTA: Visual = {camisa: '#efe8d8', calca: '#efe8d8', colete: null, capacete: null, toga: '#f4efe2', cabelo: '#6b6b6b'};
export const MERCADOR: Visual = {camisa: '#d9c68f', calca: '#d9c68f', colete: null, capacete: null, toga: '#cdb877', cabelo: '#3b2a20', pele: '#e7b48c'};
export const CIDADAO: Visual = {camisa: '#e9e1cf', calca: '#e9e1cf', colete: null, capacete: null, toga: '#f2ecdf', cabelo: '#5a4030'};
export const MEDICO: Visual = {camisa: '#f2efe6', calca: '#f2efe6', colete: null, capacete: null, cabelo: '#c8c8c8', pele: '#e8b892'};
export const IMPERADOR: Visual = {camisa: '#f2efe6', calca: '#f2efe6', colete: null, capacete: null, toga: '#6b2a7a', coroa: '#3f8a3a', cabelo: '#3b2a20'};
export const RETIARIO: Visual = {camisa: '#3f6fb0', calca: '#e7b48c', colete: null, capacete: null, pele: '#e7b48c', cabelo: '#2b2233'};
export const TREINO: Visual[] = [
  {camisa: '#8a6a4a', calca: '#d9b38c', colete: null, capacete: null, pele: '#d9b38c', cabelo: '#1d1b26'},
  {camisa: '#5f7f4f', calca: '#f2c9a4', colete: null, capacete: null, pele: '#f2c9a4', cabelo: '#c98a3a'},
  {camisa: '#6b5a8a', calca: '#8d5a3b', colete: null, capacete: null, pele: '#8d5a3b', cabelo: '#1d1b26'},
];

export const COR = {
  travertino: '#e3d5b6',
  travertinoEsc: '#cdbd98',
  degrau: '#ece2c8',
  podio: '#b9583b',
  areia: '#e8cf98',
  pedra: '#9c8f7e',
  pedraEsc: '#6f645a',
  madeira: '#8b5a3c',
  telha: '#c0603a',
  arco: '#3a2f28',
};

// ---------- instâncias com cor por peça (multidão, cidade) ----------
export const InstCor: React.FC<{geo: THREE.BufferGeometry; mats: THREE.Matrix4[]; cores: string[]; sombra?: boolean; rugoso?: number}> = ({geo, mats, cores, sombra = false, rugoso = 0.9}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = new THREE.Color();
    mats.forEach((mx, i) => {
      m.setMatrixAt(i, mx);
      m.setColorAt(i, c.set(cores[i % cores.length]));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [mats, cores]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, Math.max(1, mats.length)]} castShadow={sombra} receiveShadow frustumCulled={false}>
      <meshStandardMaterial flatShading roughness={rugoso} />
    </instancedMesh>
  );
};

// gerador pseudo-aleatório determinístico (o mesmo vídeo em todo render)
export const rnd = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};

// ================= COLISEU =================
export const A0 = 43.75; // semieixo maior da arena (87,5 / 2)
export const B0 = 27.4; // semieixo menor da arena (54,8 / 2)
export const LARG = 50.6; // largura da arquibancada: (189 - 87,5) / 2
export const ALT = 48;
export const PODIO = 4; // muro em volta da arena
const SEG = 160;

export const elipse = (off: number, th: number): [number, number] => [(A0 + off) * Math.cos(th), (B0 + off) * Math.sin(th)];
// normal para fora da elipse no ângulo th, convertida em rotação Y (o +Z local olha para fora)
const rotFora = (off: number, th: number) => {
  const nx = Math.cos(th) / (A0 + off), nz = Math.sin(th) / (B0 + off);
  return Math.atan2(nx, nz);
};

// "torno" elíptico: gira um perfil (off, y) em volta da arena seguindo elipses paralelas
function torno(perfil: [number, number][], seg = SEG) {
  const pos: number[] = [];
  for (let i = 0; i < seg; i++) {
    const t0 = (2 * Math.PI * i) / seg, t1 = (2 * Math.PI * (i + 1)) / seg;
    for (let k = 0; k < perfil.length - 1; k++) {
      const [o0, y0] = perfil[k], [o1, y1] = perfil[k + 1];
      const a = elipse(o0, t0), b = elipse(o0, t1), c = elipse(o1, t1), d = elipse(o1, t0);
      pos.push(a[0], y0, a[1], c[0], y1, c[1], b[0], y0, b[1]);
      pos.push(a[0], y0, a[1], d[0], y1, d[1], c[0], y1, c[1]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// perfil da arquibancada: pódio, 3 setores de degraus de pedra (maeniana) com muretas, galeria de madeira no alto
type Degrau = {o0: number; o1: number; y: number};
const perfilCavea = (() => {
  const pts: [number, number][] = [[0, PODIO], [3, PODIO]];
  const degraus: Degrau[] = [];
  const ult = () => pts[pts.length - 1];
  const sobe = (h: number) => pts.push([ult()[0], ult()[1] + h]);
  const anda = (r: number) => pts.push([ult()[0] + r, ult()[1]]);
  const escada = (n: number, run: number, rise: number) => {
    for (let i = 0; i < n; i++) {
      sobe(rise);
      const o0 = ult()[0];
      anda(run);
      degraus.push({o0, o1: ult()[0], y: ult()[1]});
    }
  };
  escada(16, 0.75, 0.5); // 3 → 15 m, 4 → 12 m
  sobe(2);
  escada(20, 0.75, 0.5); // 15 → 30 m
  sobe(2);
  escada(16, 0.75, 0.5); // 30 → 42 m
  sobe(5);
  escada(8, 0.8, 0.5); // galeria do alto
  sobe(ALT - ult()[1]);
  anda(LARG - ult()[0]);
  return {pts, degraus};
})();
export const DEGRAUS = perfilCavea.degraus;

let geoCache: Record<string, THREE.BufferGeometry> | null = null;
const geos = () => {
  if (geoCache) return geoCache;
  const g: Record<string, THREE.BufferGeometry> = {
    podio: torno([[0, 0], [0, PODIO], [0.01, PODIO]]),
    cavea: torno(perfilCavea.pts),
    fachada: torno([[LARG, ALT], [LARG, 0]]),
    interno: torno([[2.9, PODIO], [2.9, 0]]),
  };
  [11, 22, 33, ALT - 0.6].forEach((y, i) => {
    g['cornija' + i] = torno([[LARG, y], [LARG + 0.7, y], [LARG + 0.7, y + 0.9], [LARG, y + 0.9]], 160);
  });
  g.cornijaPodio = torno([[-0.15, PODIO], [-0.15, PODIO + 0.25], [0.3, PODIO + 0.25]], 120);
  geoCache = g;
  return g;
};

// arcos, colunas e janelas da fachada (instanciados)
const fachadaInst = (() => {
  let cache: null | {arcos: THREE.Matrix4[]; topos: THREE.Matrix4[]; colunas: THREE.Matrix4[]; janelas: THREE.Matrix4[]; geoArco: THREE.BufferGeometry; geoTopo: THREE.BufferGeometry; geoCol: THREE.BufferGeometry; geoJan: THREE.BufferGeometry} = null;
  return () => {
    if (cache) return cache;
    const N = 80;
    const arcos: THREE.Matrix4[] = [], topos: THREE.Matrix4[] = [], colunas: THREE.Matrix4[] = [], janelas: THREE.Matrix4[] = [];
    const m = (x: number, y: number, z: number, ry: number) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
    for (let i = 0; i < N; i++) {
      const th = (2 * Math.PI * (i + 0.5)) / N;
      const [x, z] = elipse(LARG - 0.15, th);
      const ry = rotFora(LARG, th);
      [0, 11, 22].forEach((y0) => {
        arcos.push(m(x, y0 + 3.0, z, ry));
        topos.push(m(x, y0 + 6.0, z, ry));
      });
      if (i % 2 === 0) janelas.push(m(x, 38.5, z, ry));
      const th2 = (2 * Math.PI * i) / N;
      const [x2, z2] = elipse(LARG + 0.25, th2);
      const ry2 = rotFora(LARG, th2);
      [0, 11, 22].forEach((y0) => colunas.push(m(x2, y0 + 5.5, z2, ry2)));
      colunas.push(m(x2, 40.2, z2, ry2));
    }
    cache = {
      arcos, topos, colunas, janelas,
      geoArco: new THREE.BoxGeometry(4.0, 6.0, 0.6),
      geoTopo: new THREE.CylinderGeometry(2.0, 2.0, 0.6, 12, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2),
      geoCol: new THREE.BoxGeometry(1.0, 11, 0.5),
      geoJan: new THREE.BoxGeometry(1.4, 2.2, 0.6),
    };
    return cache;
  };
})();

const Inst: React.FC<{geo: THREE.BufferGeometry; mats: THREE.Matrix4[]; cor: string; sombra?: boolean}> = ({geo, mats, cor, sombra = false}) => {
  const cores = useMemo(() => [cor], [cor]);
  return <InstCor geo={geo} mats={mats} cores={cores} sombra={sombra} />;
};

// entradas (vomitórios) nas muretas entre os setores
const Vomitorios: React.FC = () => {
  const ms = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    [[15, 12], [30, 24]].forEach(([off, y]) => {
      for (let i = 0; i < 32; i++) {
        const th = (2 * Math.PI * (i + 0.25)) / 32;
        const [x, z] = elipse(off - 0.05, th);
        out.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y + 1.0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotFora(off, th), 0)), new THREE.Vector3(1, 1, 1)));
      }
    });
    return out;
  }, []);
  const geo = useMemo(() => new THREE.BoxGeometry(1.6, 2.0, 0.3), []);
  return <Inst geo={geo} mats={ms} cor="#2a221d" />;
};

// camarote do imperador (pulvinar), no pódio do lado -Z
export const PULVINAR: V3 = [0, PODIO, -(B0 + 1.6)];
const Pulvinar: React.FC = () => (
  <group position={PULVINAR}>
    <Caixa pos={[0, 0.25, 0]} tam={[6, 0.5, 3.2]} cor="#efe6d2" />
    {[-2.7, 2.7].flatMap((x) => [-1.3, 1.3].map((z) => (
      <Cil key={x + ':' + z} pos={[x, 2.1, z]} r={0.18} h={3.3} cor="#f4efe2" seg={10} />
    )))}
    <Caixa pos={[0, 3.9, 0]} tam={[6.4, 0.45, 3.6]} cor="#e3d5b6" />
    <mesh position={[0, 4.6, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.9, 1, 1.05]} castShadow><coneGeometry args={[3.2, 1.0, 4]} /><Mat cor={COR.telha} /></mesh>
    {/* panos roxos */}
    <Caixa pos={[0, 0.9, 1.62]} tam={[5.4, 0.9, 0.06]} cor="#6b2a7a" />
    <Caixa pos={[0, 1.3, 1.66]} tam={[5.4, 0.12, 0.04]} cor="#e0b64a" sombra={false} />
    {/* trono */}
    <Caixa pos={[0, 0.85, -0.4]} tam={[1.1, 0.7, 0.9]} cor="#e0b64a" />
    <Caixa pos={[0, 1.6, -0.82]} tam={[1.1, 1.2, 0.12]} cor="#e0b64a" />
  </group>
);

export const ArenaPiso: React.FC<{cor?: string}> = ({cor = COR.areia}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[A0, B0, 1]} receiveShadow>
    <circleGeometry args={[1, 96]} />
    <Mat cor={cor} />
  </mesh>
);

export const Coliseu: React.FC<{pulvinar?: boolean}> = ({pulvinar = true}) => {
  const g = geos();
  const f = fachadaInst();
  return (
    <group>
      <ArenaPiso />
      <mesh geometry={g.podio} receiveShadow castShadow><meshStandardMaterial color={COR.podio} flatShading side={THREE.DoubleSide} /></mesh>
      <mesh geometry={g.cornijaPodio}><meshStandardMaterial color="#f4efe2" flatShading side={THREE.DoubleSide} /></mesh>
      <mesh geometry={g.interno}><meshStandardMaterial color={COR.travertinoEsc} flatShading side={THREE.DoubleSide} /></mesh>
      <mesh geometry={g.cavea} receiveShadow castShadow><meshStandardMaterial color={COR.degrau} flatShading side={THREE.DoubleSide} roughness={0.95} /></mesh>
      <mesh geometry={g.fachada} receiveShadow castShadow><meshStandardMaterial color={COR.travertino} flatShading side={THREE.DoubleSide} /></mesh>
      {[0, 1, 2, 3].map((i) => (<mesh key={i} geometry={g['cornija' + i]}><meshStandardMaterial color={COR.travertinoEsc} flatShading side={THREE.DoubleSide} /></mesh>))}
      <Inst geo={f.geoArco} mats={f.arcos} cor={COR.arco} />
      <Inst geo={f.geoTopo} mats={f.topos} cor={COR.arco} />
      <Inst geo={f.geoCol} mats={f.colunas} cor="#efe4c9" />
      <Inst geo={f.geoJan} mats={f.janelas} cor={COR.arco} />
      <Vomitorios />
      {pulvinar && <Pulvinar />}
    </group>
  );
};

// ---------- multidão sentada nos degraus (cerca de 28 mil bonequinhos instanciados) ----------
const CORES_ROUPA = ['#efe6d2', '#d8c7a0', '#b8432f', '#4f7bbf', '#e0b64a', '#8a5a9a', '#7a9a5a', '#c47a4a', '#ffffff', '#e9e1cf', '#d6282b'];
const CORES_PELE = ['#ffd2ad', '#e8b892', '#c98e62', '#8d5a3b', '#f2c9a4'];
type Lugar = {x: number; y: number; z: number; ph: number};
let lugaresCache: Lugar[] | null = null;
const lugares = () => {
  if (lugaresCache) return lugaresCache;
  const r = rnd(5);
  const out: Lugar[] = [];
  DEGRAUS.forEach((d) => {
    const off = d.o0 + 0.3;
    const a = A0 + off, b = B0 + off;
    const per = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    const n = Math.floor(per / 0.8);
    for (let i = 0; i < n; i++) {
      const th = (2 * Math.PI * (i + r() * 0.3)) / n;
      const [x, z] = elipse(off, th);
      // camarote do imperador livre
      if (d.y < 13 && z < 0 && Math.abs(x) < 4.2) continue;
      if (r() < 0.04) continue;
      out.push({x, y: d.y, z, ph: r() * 6.28});
    }
  });
  lugaresCache = out;
  return out;
};

export const Publico: React.FC<{t: number; agito?: number}> = ({t, agito = 1}) => {
  const ls = lugares();
  const geoC = useMemo(() => new THREE.BoxGeometry(0.46, 0.62, 0.34), []);
  const geoH = useMemo(() => new THREE.IcosahedronGeometry(0.17, 0), []);
  const coresC = useMemo(() => {
    const r = rnd(9);
    return ls.map(() => CORES_ROUPA[Math.floor(r() * CORES_ROUPA.length)]);
  }, [ls]);
  const coresH = useMemo(() => {
    const r = rnd(13);
    return ls.map(() => CORES_PELE[Math.floor(r() * CORES_PELE.length)]);
  }, [ls]);
  const {mc, mh} = useMemo(() => {
    const mc: THREE.Matrix4[] = [], mh: THREE.Matrix4[] = [];
    ls.forEach((l) => {
      const pulo = Math.max(0, Math.sin(t * 7 + l.ph)) * 0.18 * agito;
      mc.push(new THREE.Matrix4().makeTranslation(l.x, l.y + 0.31 + pulo, l.z));
      mh.push(new THREE.Matrix4().makeTranslation(l.x, l.y + 0.8 + pulo, l.z));
    });
    return {mc, mh};
  }, [ls, Math.round(t * 30), agito]);
  return (
    <group>
      <InstCor geo={geoC} mats={mc} cores={coresC} />
      <InstCor geo={geoH} mats={mh} cores={coresH} />
    </group>
  );
};

// ---------- a cidade em volta (Roma de 80 d.C. em blocos) ----------
type Bloco = {x: number; z: number; w: number; d: number; h: number; ry: number};
let cidadeCache: Bloco[] | null = null;
const blocos = () => {
  if (cidadeCache) return cidadeCache;
  const r = rnd(21);
  const out: Bloco[] = [];
  for (let i = 0; i < 420; i++) {
    const ang = r() * Math.PI * 2;
    const rad = 150 + Math.pow(r(), 0.7) * 520;
    const x = Math.cos(ang) * rad * 1.1, z = Math.sin(ang) * rad;
    // rua larga (Via Sacra) em direção ao fórum
    if (Math.abs(z + x * 0.25) < 22 && x < 0) continue;
    out.push({x, z, w: 10 + r() * 18, d: 10 + r() * 16, h: 6 + r() * 14, ry: Math.round(r() * 3) * 0.12});
  }
  cidadeCache = out;
  return out;
};
export const Cidade: React.FC = () => {
  const bs = blocos();
  const geoB = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), []);
  const geoT = useMemo(() => new THREE.ConeGeometry(0.75, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0), []);
  const {mb, mt, cb} = useMemo(() => {
    const r = rnd(3);
    const mb: THREE.Matrix4[] = [], mt: THREE.Matrix4[] = [], cb: string[] = [];
    const paredes = ['#e8d9b8', '#e2c9a0', '#d9b48a', '#efe4cc', '#d8a47a', '#c98e62'];
    bs.forEach((b) => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, b.ry, 0));
      mb.push(new THREE.Matrix4().compose(new THREE.Vector3(b.x, 0, b.z), q, new THREE.Vector3(b.w, b.h, b.d)));
      mt.push(new THREE.Matrix4().compose(new THREE.Vector3(b.x, b.h, b.z), q, new THREE.Vector3(b.w, 3.5, b.d)));
      cb.push(paredes[Math.floor(r() * paredes.length)]);
    });
    return {mb, mt, cb};
  }, [bs]);
  const coresT = useMemo(() => ['#c0603a', '#b5552f', '#cc6b42'], []);
  const arv = useMemo(() => {
    const r = rnd(77);
    const ms: THREE.Matrix4[] = [];
    for (let i = 0; i < 260; i++) {
      const ang = r() * Math.PI * 2, rad = 112 + r() * 500;
      ms.push(new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(ang) * rad * 1.1, 0, Math.sin(ang) * rad), new THREE.Quaternion(), new THREE.Vector3(1, 0.8 + r() * 0.6, 1)));
    }
    return ms;
  }, []);
  const geoArv = useMemo(() => new THREE.ConeGeometry(2.2, 14, 6).translate(0, 7, 0), []);
  const coresArv = useMemo(() => ['#3f6b3a', '#4a7a3f', '#365f33'], []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[3000, 3000]} />
        <Mat cor="#b7ab7c" />
      </mesh>
      {/* praça de terra batida em volta do Coliseu */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} scale={[A0 + LARG + 30, B0 + LARG + 30, 1]} receiveShadow>
        <circleGeometry args={[1, 64]} />
        <Mat cor="#d8c7a0" />
      </mesh>
      <InstCor geo={geoB} mats={mb} cores={cb} sombra />
      <InstCor geo={geoT} mats={mt} cores={coresT} />
      <InstCor geo={geoArv} mats={arv} cores={coresArv} />
      {/* colinas (Palatino, Célio, Esquilino) */}
      {[[-260, -320, 120], [300, -380, 140], [-420, 160, 110], [380, 300, 120], [0, 560, 150]].map(([x, z, s], i) => (
        <mesh key={i} position={[x, -s * 0.55, z]} scale={[s * 1.6, s * 0.8, s * 1.3]}>
          <icosahedronGeometry args={[1, 1]} />
          <Mat cor={i % 2 ? '#8fa166' : '#9aa86f'} />
        </mesh>
      ))}
    </group>
  );
};

// ================= peças de cena =================
export const Coluna: React.FC<{pos: V3; h?: number; r?: number; cor?: string}> = ({pos, h = 3.2, r = 0.2, cor = '#efe6d2'}) => (
  <group position={pos}>
    <Caixa pos={[0, 0.08, 0]} tam={[r * 2.6, 0.16, r * 2.6]} cor={cor} />
    <Cil pos={[0, h / 2, 0]} r={r * 0.9} r2={r} h={h - 0.36} cor={cor} seg={12} />
    <Caixa pos={[0, h - 0.1, 0]} tam={[r * 2.8, 0.2, r * 2.8]} cor={cor} />
  </group>
);

// fachada de prédio público com colunata (fundo do mercado/fórum)
export const Templo: React.FC<{pos: V3; rotY?: number; larg?: number; n?: number}> = ({pos, rotY = 0, larg = 12, n = 6}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.6, 0]} tam={[larg + 1, 1.2, 8]} cor="#e3d5b6" />
    {Array.from({length: n}).map((_, i) => (<Coluna key={i} pos={[-larg / 2 + (larg / (n - 1)) * i, 1.2, 3.4]} h={7} r={0.42} />))}
    <Caixa pos={[0, 4.6, -1]} tam={[larg - 1, 7, 5]} cor="#d9c9a6" />
    <Caixa pos={[0, 8.6, 0]} tam={[larg + 1, 0.9, 8]} cor="#e3d5b6" />
    <mesh position={[0, 10.1, 0]} rotation={[0, 0, 0]} scale={[1, 1, 1]} castShadow>
      <cylinderGeometry args={[0.01, (larg + 1) / 2, 2.2, 3, 1]} />
      <Mat cor="#e3d5b6" />
    </mesh>
  </group>
);

// sobrado romano (insula) com telhado de telha
export const Casa: React.FC<{pos: V3; tam: V3; cor?: string; rotY?: number}> = ({pos, tam, cor = '#e2c9a0', rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, tam[1] / 2, 0]} tam={tam} cor={cor} />
    {Array.from({length: Math.max(1, Math.floor(tam[0] / 2.2))}).map((_, i, a) => (
      <Caixa key={i} pos={[-tam[0] / 2 + (tam[0] / a.length) * (i + 0.5), tam[1] * 0.68, tam[2] / 2 + 0.02]} tam={[0.7, 0.9, 0.06]} cor="#4a3426" sombra={false} />
    ))}
    <mesh position={[0, tam[1] + 0.6, 0]} rotation={[0, Math.PI / 4, 0]} scale={[tam[0] / 1.41, 1.2, tam[2] / 1.41]} castShadow>
      <coneGeometry args={[1, 1, 4]} />
      <Mat cor={COR.telha} />
    </mesh>
  </group>
);

// corrente: elos de ferro entre dois pontos
export const Corrente: React.FC<{a: V3; b: V3; elo?: number}> = ({a, b, elo = 0.06}) => {
  const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / elo));
  return (
    <group>
      {Array.from({length: n}).map((_, i) => {
        const k = (i + 0.5) / n;
        const queda = Math.sin(k * Math.PI) * 0.12;
        return (
          <mesh key={i} position={[lerp(a[0], b[0], k), lerp(a[1], b[1], k) - queda, lerp(a[2], b[2], k)]} rotation={[0, i % 2 ? Math.PI / 2 : 0, Math.atan2(b[1] - a[1], b[0] - a[0])]}>
            <torusGeometry args={[elo * 0.45, elo * 0.12, 4, 8]} />
            <meshStandardMaterial color="#5c5f66" roughness={0.5} metalness={0.4} flatShading />
          </mesh>
        );
      })}
    </group>
  );
};

// plaquinha pendurada no pescoço (titulus): escravos à venda usavam uma
export const Placa: React.FC<{pos: V3; texto?: boolean}> = ({pos}) => (
  <group position={pos}>
    <Caixa pos={[0, 0, 0]} tam={[0.3, 0.2, 0.02]} cor="#f2ead6" sombra={false} />
    {[0.04, -0.01, -0.06].map((y) => (<Caixa key={y} pos={[0, y, 0.012]} tam={[0.2, 0.018, 0.005]} cor="#5a4030" sombra={false} />))}
    <Barra a={[-0.13, 0.1, 0]} b={[0, 0.3, -0.1]} r={0.006} cor="#5a4030" sombra={false} />
    <Barra a={[0.13, 0.1, 0]} b={[0, 0.3, -0.1]} r={0.006} cor="#5a4030" sombra={false} />
  </group>
);

// braseiro com ferros em brasa
export const Braseiro: React.FC<{pos: V3; t: number; ferros?: boolean}> = ({pos, t, ferros = true}) => (
  <group position={pos}>
    {[0, 2.09, 4.19].map((a) => (<Barra key={a} a={[Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32]} b={[Math.cos(a) * 0.18, 0.75, Math.sin(a) * 0.18]} r={0.025} cor="#2b2b30" />))}
    <Cil pos={[0, 0.8, 0]} r={0.36} r2={0.22} h={0.18} cor="#3a3a40" seg={12} />
    <mesh position={[0, 0.88, 0]}><cylinderGeometry args={[0.33, 0.33, 0.04, 12]} /><meshStandardMaterial color="#ff5a1a" emissive="#ff3a00" emissiveIntensity={1.6 + Math.sin(t * 9) * 0.25} /></mesh>
    {[0, 1, 2, 3, 4].map((i) => (
      <mesh key={i} position={[Math.cos(i * 1.3) * 0.15, 1.02 + Math.sin(t * 11 + i) * 0.03, Math.sin(i * 1.3) * 0.15]} scale={[1, 1 + Math.sin(t * 13 + i * 2) * 0.25, 1]}>
        <coneGeometry args={[0.06, 0.22, 5]} />
        <meshStandardMaterial color="#ffb23a" emissive="#ff7a00" emissiveIntensity={1.3} transparent opacity={0.85} />
      </mesh>
    ))}
    {ferros && [-0.4, 0.15, 0.6].map((a, i) => (
      <group key={i}>
        <Barra a={[Math.cos(a) * 0.05, 0.9, Math.sin(a) * 0.05]} b={[Math.cos(a) * 0.7, 1.15, Math.sin(a) * 0.7]} r={0.016} cor="#3a3a40" />
        <mesh position={[Math.cos(a) * 0.1, 0.92, Math.sin(a) * 0.1]}><sphereGeometry args={[0.04, 6, 6]} /><meshStandardMaterial color="#ff5a1a" emissive="#ff3a00" emissiveIntensity={2} /></mesh>
      </group>
    ))}
    <pointLight position={[0, 1.4, 0]} color="#ff8a3a" intensity={6} distance={7} decay={1.6} />
  </group>
);

export const TochaParede: React.FC<{pos: V3; t: number; luz?: boolean}> = ({pos, t, luz = true}) => (
  <group position={pos}>
    <Barra a={[0, -0.25, 0]} b={[0, 0.15, 0.15]} r={0.03} cor="#4a3426" />
    <mesh position={[0, 0.3, 0.18]} scale={[1, 1 + Math.sin(t * 12) * 0.15, 1]}><coneGeometry args={[0.09, 0.32, 6]} /><meshStandardMaterial color="#ffb23a" emissive="#ff7a00" emissiveIntensity={1.6} /></mesh>
    {luz && <pointLight position={[0, 0.4, 0.4]} color="#ff9a4a" intensity={3} distance={6} decay={1.6} />}
  </group>
);

// poste de treino (palus) com marcas de golpe
export const Palus: React.FC<{pos: V3; abalo?: number}> = ({pos, abalo = 0}) => (
  <group position={pos} rotation={[0, 0, abalo]}>
    <Cil pos={[0, 0.9, 0]} r={0.13} r2={0.15} h={1.8} cor="#9a6a43" seg={8} />
    {[0.7, 1.05, 1.35].map((y) => (<Cil key={y} pos={[0, y, 0]} r={0.152} h={0.04} cor="#6b4429" seg={8} />))}
    <Caixa pos={[0, 0.03, 0]} tam={[0.5, 0.06, 0.5]} cor="#7a5034" />
  </group>
);

export const Mesa: React.FC<{pos: V3; larg?: number; prof?: number; alt?: number}> = ({pos, larg = 3, prof = 0.8, alt = 0.75}) => (
  <group position={pos}>
    <Caixa pos={[0, alt - 0.03, 0]} tam={[larg, 0.06, prof]} cor="#9a6a43" />
    {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (<Caixa key={sx + ':' + sz} pos={[sx * (larg / 2 - 0.1), (alt - 0.06) / 2, sz * (prof / 2 - 0.08)]} tam={[0.08, alt - 0.06, 0.08]} cor="#7a5034" />)))}
  </group>
);

export const Banco: React.FC<{pos: V3; larg?: number; alt?: number}> = ({pos, larg = 3, alt = 0.45}) => (
  <group position={pos}>
    <Caixa pos={[0, alt - 0.03, 0]} tam={[larg, 0.06, 0.32]} cor="#9a6a43" />
    {[-1, 1].map((sx) => (<Caixa key={sx} pos={[sx * (larg / 2 - 0.12), (alt - 0.06) / 2, 0]} tam={[0.06, alt - 0.06, 0.28]} cor="#7a5034" />))}
  </group>
);

// tigela de barro com grãos (cevada ou feijão)
export const Tigela: React.FC<{pos: V3; grao: string; r?: number; seed?: number}> = ({pos, grao, r = 0.11, seed = 1}) => {
  const gs = useMemo(() => {
    const rr = rnd(seed);
    return Array.from({length: 26}).map(() => {
      const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * r * 0.8;
      return [Math.cos(a) * d, 0.055 + rr() * 0.02, Math.sin(a) * d] as V3;
    });
  }, [seed, r]);
  return (
    <group position={pos}>
      <mesh position={[0, 0.035, 0]} castShadow><cylinderGeometry args={[r, r * 0.6, 0.07, 14, 1, true]} /><meshStandardMaterial color="#b5653a" flatShading side={THREE.DoubleSide} /></mesh>
      <Cil pos={[0, 0.005, 0]} r={r * 0.6} h={0.01} cor="#a35a33" seg={14} />
      <Cil pos={[0, 0.05, 0]} r={r * 0.92} h={0.012} cor={grao} seg={14} />
      {gs.map((g, i) => (<mesh key={i} position={g}><icosahedronGeometry args={[0.012, 0]} /><Mat cor={grao} /></mesh>))}
    </group>
  );
};

export const Anfora: React.FC<{pos: V3; esc?: number; rot?: number}> = ({pos, esc = 1, rot = 0}) => {
  const geo = useMemo(() => {
    const p = [[0, 0], [0.04, 0.02], [0.12, 0.2], [0.17, 0.42], [0.15, 0.6], [0.06, 0.7], [0.05, 0.82], [0.07, 0.84], [0, 0.84]].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(p, 10);
  }, []);
  return (
    <group position={pos} scale={esc} rotation={[0, 0, rot]}>
      <mesh geometry={geo} castShadow><Mat cor="#c0703f" /></mesh>
      {[-1, 1].map((s) => (<mesh key={s} position={[s * 0.08, 0.72, 0]} rotation={[0, 0, s * 0.3]}><torusGeometry args={[0.05, 0.012, 4, 8, Math.PI]} /><Mat cor="#c0703f" /></mesh>))}
    </group>
  );
};

export const Pao: React.FC<{pos: V3}> = ({pos}) => (
  <mesh position={pos} scale={[1, 0.45, 1]} castShadow><sphereGeometry args={[0.09, 10, 6]} /><Mat cor="#c98a4a" /></mesh>
);

// moedas de ouro e prata (áureos e denários) e o saco do dono
export const Moedas: React.FC<{pos: V3; n?: number; cor?: string}> = ({pos, n = 10, cor = '#e0b64a'}) => (
  <group position={pos}>
    {Array.from({length: n}).map((_, i) => (<Cil key={i} pos={[Math.sin(i * 1.7) * 0.004, 0.005 + i * 0.009, Math.cos(i * 1.3) * 0.004]} r={0.022} h={0.008} cor={cor} seg={12} />))}
  </group>
);
export const Saco: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <group position={pos} scale={esc}>
    <mesh position={[0, 0.1, 0]} scale={[1, 0.85, 1]} castShadow><icosahedronGeometry args={[0.12, 1]} /><Mat cor="#8a6a43" /></mesh>
    <Cil pos={[0, 0.22, 0]} r={0.035} r2={0.05} h={0.06} cor="#7a5a35" />
    <Cil pos={[0, 0.2, 0]} r={0.045} h={0.015} cor="#c9a24a" />
  </group>
);

// mão gigante (gesto do polegar): punho fechado de frente, polegar esticado para BAIXO quando ang = 0 (ang = PI: para cima)
export const Mao: React.FC<{pos: V3; ang: number; esc?: number}> = ({pos, ang, esc = 1}) => (
  <group position={pos} rotation={[0, 0.25, ang]} scale={esc}>
    {/* antebraço na horizontal, com a manga roxa da toga */}
    <Caixa pos={[0.95, 0.05, -0.1]} tam={[0.7, 0.7, 0.6]} cor="#f2bf96" />
    <Caixa pos={[1.75, 0.05, -0.1]} tam={[1.0, 0.95, 0.85]} cor="#6b2a7a" />
    <Caixa pos={[1.27, 0.05, -0.1]} tam={[0.08, 1.0, 0.9]} cor="#e0b64a" />
    {/* punho */}
    <Caixa pos={[0, 0, -0.1]} tam={[1.1, 1.05, 0.7]} cor="#e8a882" />
    {/* 4 dedos dobrados (nós dos dedos virados para a câmera) */}
    {[0.39, 0.13, -0.13, -0.39].map((y, i) => (
      <group key={y}>
        <Caixa pos={[-0.02, y, 0.32]} tam={[0.98, 0.25, 0.36]} cor={i % 2 ? '#ffd2ad' : '#f7c8a2'} />
        <Caixa pos={[0.48, y, 0.32]} tam={[0.04, 0.2, 0.37]} cor="#c98e62" sombra={false} />
      </group>
    ))}
    {/* polegar esticado */}
    <Caixa pos={[-0.36, -1.05, 0.12]} tam={[0.42, 1.15, 0.44]} cor="#ffd2ad" />
    <Caixa pos={[-0.36, -1.48, 0.35]} tam={[0.28, 0.24, 0.02]} cor="#fff0e4" sombra={false} />
  </group>
);

// rede do retiário (malha)
export const Rede: React.FC<{pos: V3; t: number}> = ({pos, t}) => (
  <mesh position={pos} rotation={[0.2 + Math.sin(t * 3) * 0.1, 0, 0.3]}>
    <sphereGeometry args={[0.45, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
    <meshStandardMaterial color="#d8c7a0" wireframe />
  </mesh>
);

// pétalas/flores jogadas pelo público
export const Petalas: React.FC<{t: number; centro?: V3; raio?: number; n?: number}> = ({t, centro = [0, 0, 0], raio = 4, n = 120}) => {
  const base = useMemo(() => {
    const r = rnd(31);
    return Array.from({length: n}).map(() => [r() * 2 - 1, r(), r() * 2 - 1, 0.6 + r() * 0.6, r() * 6]);
  }, [n]);
  const geo = useMemo(() => new THREE.BoxGeometry(0.07, 0.01, 0.05), []);
  const mats = useMemo(
    () => base.map(([x, y0, z, v, ph]) => {
      const y = ((y0 * 7 - t * 1.4 * v) % 7 + 7) % 7;
      return new THREE.Matrix4().compose(new THREE.Vector3(centro[0] + x * raio + Math.sin(t * 2 + ph) * 0.2, y, centro[2] + z * raio), new THREE.Quaternion().setFromEuler(new THREE.Euler(t * 3 + ph, ph, 0)), new THREE.Vector3(1, 1, 1));
    }),
    [base, t, centro[0], centro[2], raio],
  );
  const cores = useMemo(() => ['#ff5d73', '#ffd23f', '#ffffff', '#ff9fb2'], []);
  return <InstCor geo={geo} mats={mats} cores={cores} />;
};

// um bonequinho da torcida em pé (para planos médios)
export const Torcedor: React.FC<{pos: V3; t: number; v: Visual; rotY?: number}> = ({pos, t, v, rotY = 0}) => (
  <Boneco pos={pos} rotY={rotY} acao="comemora" t={t} v={v} />
);
