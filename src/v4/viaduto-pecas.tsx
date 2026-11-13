// VIADUTO URBANO: peças em ESCALA REAL (1 unidade = 1 metro) para "Quanto custa construir um viaduto".
// Referência: viaduto de 385 m × 21 m, 4 faixas (2 por sentido), vãos de 35 m, vigas pré-moldadas de 1,8 m de altura,
// pilares de ~7 m sobre blocos de 6 estacas de 22 m (pesquisa: roteiros/quanto-custa-construir-um-viaduto.pesquisa.md).
// Eixo do viaduto = X; a avenida que ele cruza corre em Z (x de -11 a 11).
import React, {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Arvore, Barra, Boneco, Caixa, Cil, Mat, OBREIRO, Visual, caixaUV, clamp01, lerp, suave} from './kit';
import type {V3} from './planta';

// ---------- medidas ----------
export const VD = {
  vao: 35,
  apoios: [-87.5, -52.5, -17.5, 17.5, 52.5, 87.5],
  meia: 10.5, // meia largura do tabuleiro (21 m)
  yPlano: 10.6, // topo do tabuleiro no trecho reto
  xPlano: 20,
  rampa: 0.075,
  xFim: 20 + 10.6 / 0.075, // onde a rampa chega no chão (~161 m)
  laje: 0.25,
  viga: 1.8,
  trav: 1.6,
  apoio: 0.1,
  zPilar: 5.5,
  rPilar: 0.8,
  zVigas: [-8.75, -6.25, -3.75, -1.25, 1.25, 3.75, 6.25, 8.75],
  prof: 22,
  rEst: 0.4,
};
export const yTop = (x: number) => {
  const a = Math.abs(x);
  return a <= VD.xPlano ? VD.yPlano : Math.max(0, VD.yPlano - (a - VD.xPlano) * VD.rampa);
};
export const yFundoViga = (x: number) => yTop(x) - VD.laje - VD.viga;
export const yTopoTrav = (x: number) => yFundoViga(x) - VD.apoio;
export const VAOS: [number, number][] = [[-87.5, -52.5], [-52.5, -17.5], [-17.5, 17.5], [17.5, 52.5], [52.5, 87.5]];
export const PILARES_X = [-52.5, -17.5, 17.5, 52.5];
// estacas de um bloco (2 × 3, espaçamento de 3 diâmetros)
export const ESTACAS_BLOCO: [number, number][] = [[-2.4, -1.2], [0, -1.2], [2.4, -1.2], [-2.4, 1.2], [0, 1.2], [2.4, 1.2]];
export const BLOCO = {w: 7.4, d: 4.6, h: 1.8};

// ---------- utilidades ----------
export const rng = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};
const cache = new Map<string, THREE.Texture>();
export function tx(id: string, w: number, h: number, pinta: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) {
  const c0 = cache.get(id);
  if (c0) return c0;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  pinta(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (rep) t.repeat.set(rep[0], rep[1]);
  cache.set(id, t);
  return t;
}

// concreto: base clara com manchas e marcas de forma (o material tinge a cor)
export const texConcreto = () =>
  tx('vd-concreto', 128, 128, (g) => {
    g.fillStyle = '#ededed';
    g.fillRect(0, 0, 128, 128);
    const r = rng(3);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${90 + r() * 60},${90 + r() * 60},${90 + r() * 60},${0.05 + r() * 0.08})`;
      g.fillRect(r() * 128, r() * 128, 1 + r() * 5, 1 + r() * 4);
    }
    g.fillStyle = 'rgba(0,0,0,0.10)';
    g.fillRect(0, 63, 128, 2);
    g.fillRect(63, 0, 2, 128);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    [[20, 30], [100, 30], [20, 96], [100, 96]].forEach(([x, y]) => g.fillRect(x, y, 3, 3));
  });

// pista: asfalto com faixas. u = comprimento (10 m), v = largura (19 m do tabuleiro ou 10 m da avenida)
export const texPista = (tipo: 'tabuleiro' | 'avenida' | 'rua') =>
  tx('vd-pista-' + tipo, 256, 256, (g) => {
    g.fillStyle = '#3b3d43';
    g.fillRect(0, 0, 256, 256);
    const r = rng(tipo.length * 7);
    for (let i = 0; i < 900; i++) {
      const k = 40 + r() * 50;
      g.fillStyle = `rgba(${k},${k},${k + 4},0.5)`;
      g.fillRect(r() * 256, r() * 256, 2, 2);
    }
    // marcas de pneu
    g.fillStyle = 'rgba(20,20,24,0.22)';
    const linha = (v: number, larg: number) => g.fillRect(0, v * 256 - larg / 2, 256, larg);
    const tracej = (v: number) => {
      g.fillStyle = '#f2f2ee';
      g.fillRect(0, v * 256 - 2.5, 100, 5);
    };
    if (tipo === 'tabuleiro') {
      [0.14, 0.33, 0.67, 0.86].forEach((v) => linha(v, 14));
      g.fillStyle = '#f2f2ee';
      linha(0.03, 5);
      linha(0.97, 5);
      g.fillStyle = '#ffcf33';
      linha(0.455, 5);
      linha(0.545, 5);
      tracej(0.24);
      tracej(0.76);
    } else if (tipo === 'avenida') {
      [0.17, 0.5, 0.83].forEach((v) => linha(v, 16));
      g.fillStyle = '#f2f2ee';
      linha(0.02, 5);
      linha(0.98, 5);
      tracej(1 / 3);
      tracej(2 / 3);
    } else {
      g.fillStyle = '#ffcf33';
      g.fillRect(0, 126, 110, 5);
    }
  });

// fachada de prédio: 4 vãos × 4 andares (10 m × 12 m), janelas escuras; versão "luz" para a noite
export const texJanelas = (luz: boolean) =>
  tx('vd-janelas-' + (luz ? 'luz' : 'dia'), 128, 128, (g) => {
    g.fillStyle = luz ? '#000000' : '#f4f1ea';
    g.fillRect(0, 0, 128, 128);
    const r = rng(luz ? 17 : 5);
    for (let a = 0; a < 4; a++)
      for (let b = 0; b < 4; b++) {
        const x = b * 32 + 6, y = a * 32 + 8;
        if (luz) {
          if (r() < 0.45) {
            g.fillStyle = r() < 0.5 ? '#ffd27a' : '#fff1c9';
            g.fillRect(x, y, 20, 16);
          }
        } else {
          g.fillStyle = r() < 0.2 ? '#7d93ab' : '#4b5d73';
          g.fillRect(x, y, 20, 16);
          g.fillStyle = 'rgba(255,255,255,0.35)';
          g.fillRect(x + 2, y + 2, 6, 12);
          g.fillStyle = 'rgba(0,0,0,0.18)';
          g.fillRect(x - 2, y + 17, 24, 3);
        }
      }
  });

export const texLetreiro = (texto: string, fundo: string, cor = '#ffffff') =>
  tx(`vd-let:${texto}:${fundo}`, 512, 128, (g) => {
    g.fillStyle = fundo;
    g.fillRect(0, 0, 512, 128);
    g.strokeStyle = 'rgba(0,0,0,0.35)';
    g.lineWidth = 10;
    g.strokeRect(5, 5, 502, 118);
    let fs = 86;
    g.font = `800 ${fs}px 'Baloo 2', sans-serif`;
    while (g.measureText(texto).width > 470 && fs > 30) {
      fs -= 4;
      g.font = `800 ${fs}px 'Baloo 2', sans-serif`;
    }
    g.fillStyle = cor;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(texto, 256, 70);
  });

// painéis de terra armada (rampas): 3 m × 1,5 m
export const texTerraArmada = () =>
  tx(
    'vd-terra-armada',
    128,
    64,
    (g) => {
      g.fillStyle = '#d6d0c4';
      g.fillRect(0, 0, 128, 64);
      g.strokeStyle = '#9f998e';
      g.lineWidth = 3;
      g.strokeRect(0, 0, 128, 64);
      g.beginPath();
      g.moveTo(64, 0);
      g.lineTo(64, 32);
      g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.06)';
      g.fillRect(4, 40, 120, 6);
    },
    [1 / 3, 1 / 1.5],
  );

// camadas do solo em corte: v=0 → 26 m de fundo, v=1 → superfície
export const texSolo = () =>
  tx('vd-solo', 64, 512, (g) => {
    const faixas: [number, string][] = [
      [0, '#7a5a3c'], // aterro (topo)
      [0.06, '#b8643a'], // argila vermelha
      [0.3, '#c99a5b'], // silte arenoso
      [0.55, '#d8c27a'], // areia
      [0.72, '#8d8a80'], // argila cinza
      [0.88, '#6f6a66'], // rocha alterada
    ];
    faixas.forEach(([y, c], i) => {
      const y1 = i + 1 < faixas.length ? faixas[i + 1][0] : 1;
      g.fillStyle = c;
      g.fillRect(0, y * 512, 64, (y1 - y) * 512 + 1);
    });
    const r = rng(9);
    for (let i = 0; i < 240; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(60,40,25,0.30)' : 'rgba(240,225,190,0.35)';
      g.beginPath();
      g.ellipse(r() * 64, r() * 512, 1 + r() * 3, 1 + r() * 2, 0, 0, Math.PI * 2);
      g.fill();
    }
  });

export const texGrama = () =>
  tx('vd-grama', 128, 128, (g) => {
    g.fillStyle = '#86b36a';
    g.fillRect(0, 0, 128, 128);
    const r = rng(21);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(60,110,50,0.35)' : 'rgba(170,200,120,0.35)';
      g.fillRect(r() * 128, r() * 128, 2, 3);
    }
  });

export const texPlanta = () =>
  tx('vd-planta', 512, 320, (g) => {
    g.fillStyle = '#1f4f9a';
    g.fillRect(0, 0, 512, 320);
    g.strokeStyle = 'rgba(255,255,255,0.18)';
    g.lineWidth = 1;
    for (let x = 0; x < 512; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 320); g.stroke(); }
    for (let y = 0; y < 320; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    g.strokeStyle = '#ffffff';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(20, 190); g.lineTo(130, 120); g.lineTo(382, 120); g.lineTo(492, 190);
    g.stroke();
    g.lineWidth = 3;
    [150, 220, 292, 362].forEach((x) => { g.strokeRect(x - 6, 132, 12, 60); g.strokeRect(x - 22, 192, 44, 14); });
    g.setLineDash([6, 5]);
    [150, 220, 292, 362].forEach((x) => { [-12, 0, 12].forEach((d) => { g.beginPath(); g.moveTo(x + d, 206); g.lineTo(x + d, 300); g.stroke(); }); });
    g.setLineDash([]);
    g.fillStyle = '#ffffff';
    g.font = "800 26px 'Baloo 2', sans-serif";
    g.fillText('VIADUTO · ELEVAÇÃO', 24, 40);
    g.font = "700 18px 'Baloo 2', sans-serif";
    g.fillText('ESTACAS 22 m', 380, 290);
    g.fillText('VÃO 35 m', 200, 110);
  });

// ---------- materiais e caixas com textura em escala ----------
export const MatT: React.FC<{cor: string; map?: THREE.Texture | null; rug?: number; emis?: string; emisMap?: THREE.Texture | null; emisI?: number; side?: THREE.Side}> = ({cor, map, rug = 0.9, emis, emisMap, emisI = 1, side}) => (
  <meshStandardMaterial color={cor} map={map ?? null} roughness={rug} emissive={emis ?? '#000000'} emissiveMap={emisMap ?? null} emissiveIntensity={emisI} side={side ?? THREE.FrontSide} />
);

type BoxTProps = {pos?: V3; rot?: V3; tam: V3; cor: string; map?: THREE.Texture | null; mu?: number; mv?: number; sombra?: boolean; emis?: string; emisMap?: THREE.Texture | null; emisI?: number; rug?: number};
export const BoxT: React.FC<BoxTProps> = ({pos = [0, 0, 0], rot = [0, 0, 0], tam, cor, map, mu = 2.4, mv = 2.4, sombra = true, emis, emisMap, emisI, rug}) => {
  const geo = useMemo(() => caixaUV(tam[0], tam[1], tam[2], mu, mv), [tam[0], tam[1], tam[2], mu, mv]);
  return (
    <mesh position={pos} rotation={rot} geometry={geo} castShadow={sombra} receiveShadow>
      <MatT cor={cor} map={map} emis={emis} emisMap={emisMap} emisI={emisI} rug={rug} />
    </mesh>
  );
};
// caixa de concreto por limites
export const Bx: React.FC<{x: [number, number]; y: [number, number]; z: [number, number]; cor?: string; map?: THREE.Texture | null; mu?: number; mv?: number; sombra?: boolean}> = ({x, y, z, cor = '#c9c4ba', map, mu, mv, sombra}) => {
  if (x[1] - x[0] < 0.001 || y[1] - y[0] < 0.001 || z[1] - z[0] < 0.001) return null;
  return <BoxT pos={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2]} tam={[x[1] - x[0], y[1] - y[0], z[1] - z[0]]} cor={cor} map={map === undefined ? texConcreto() : map} mu={mu} mv={mv} sombra={sombra} />;
};
// segmento inclinado ao longo de X (tabuleiro, viga, asfalto), centro em z
export const SegX: React.FC<{x0: number; x1: number; y0: number; y1: number; z: number; w: number; h: number; cor: string; map?: THREE.Texture | null; mu?: number; mv?: number; children?: React.ReactNode; sombra?: boolean}> = ({x0, x1, y0, y1, z, w, h, cor, map, mu, mv, children, sombra}) => {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ang = Math.atan2(y1 - y0, x1 - x0);
  return (
    <group position={[(x0 + x1) / 2, (y0 + y1) / 2, z]} rotation={[0, 0, ang]}>
      {len > 0.01 && <BoxT tam={[len, h, w]} cor={cor} map={map === undefined ? texConcreto() : map} mu={mu} mv={mv} sombra={sombra} />}
      {children}
    </group>
  );
};

// plano deitado no chão com UV em metros
export const PlanoChao: React.FC<{x: [number, number]; z: [number, number]; y?: number; cor: string; map?: THREE.Texture | null; mu?: number; mv?: number; rotUV?: boolean}> = ({x, z, y = 0, cor, map, mu = 10, mv = 10, rotUV}) => {
  const w = x[1] - x[0], d = z[1] - z[0];
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, d);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i) * w, v = uv.getY(i) * d;
      if (rotUV) uv.setXY(i, v / mu, u / mv);
      else uv.setXY(i, u / mu, v / mv);
    }
    uv.needsUpdate = true;
    return g;
  }, [w, d, mu, mv, rotUV]);
  return (
    <mesh geometry={geo} position={[(x[0] + x[1]) / 2, y, (z[0] + z[1]) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <MatT cor={cor} map={map} />
    </mesh>
  );
};

// plano com um buraco retangular (para valas e cortes no chão da cidade)
export const PlanoFurado: React.FC<{x: [number, number]; z: [number, number]; y?: number; cor: string; map?: THREE.Texture | null; mu?: number; mv?: number; furo?: Zona; rotUV?: boolean}> = ({furo, ...p}) => {
  if (!furo || furo.x[0] >= p.x[1] || furo.x[1] <= p.x[0] || furo.z[0] >= p.z[1] || furo.z[1] <= p.z[0]) return <PlanoChao {...p} />;
  const fx0 = Math.max(p.x[0], furo.x[0]), fx1 = Math.min(p.x[1], furo.x[1]);
  const fz0 = Math.max(p.z[0], furo.z[0]), fz1 = Math.min(p.z[1], furo.z[1]);
  const rs: [[number, number], [number, number]][] = [
    [[p.x[0], p.x[1]], [p.z[0], fz0]],
    [[p.x[0], p.x[1]], [fz1, p.z[1]]],
    [[p.x[0], fx0], [fz0, fz1]],
    [[fx1, p.x[1]], [fz0, fz1]],
  ];
  return <>{rs.filter(([a, b]) => a[1] - a[0] > 0.01 && b[1] - b[0] > 0.01).map(([a, b], i) => (<PlanoChao key={i} {...p} x={a} z={b} />))}</>;
};

// ---------- ambiente: luz do dia/noite, sombra que cobre a cena grande, névoa de profundidade ----------
export type LuzVD = 'dia' | 'tarde' | 'quente' | 'noite';
const LUZES: Record<LuzVD, {hemi: [string, string, number]; sol: [string, number]; dir: V3}> = {
  dia: {hemi: ['#ffffff', '#8fae7a', 1.0], sol: ['#fff4e0', 2.1], dir: [0.5, 1, 0.62]},
  tarde: {hemi: ['#ffe2c4', '#8f7a6a', 0.95], sol: ['#ffc58a', 2.3], dir: [-0.8, 0.75, 0.7]},
  quente: {hemi: ['#fff1d6', '#a08a6a', 1.05], sol: ['#ffe2ad', 2.6], dir: [0.35, 1, 0.5]},
  noite: {hemi: ['#7f97e0', '#3a3550', 1.05], sol: ['#b9cbff', 1.0], dir: [-0.45, 1, 0.55]}, // noite azul-marinho, nunca preta
};
export const Ambiente: React.FC<{luz?: LuzVD; c?: V3; r?: number; nevoa?: [string, number, number]}> = ({luz = 'dia', c = [0, 0, 0], r = 40, nevoa}) => {
  const {scene} = useThree();
  const fog = useMemo(() => (nevoa ? new THREE.Fog(nevoa[0], nevoa[1], nevoa[2]) : null), [nevoa?.[0], nevoa?.[1], nevoa?.[2]]);
  useLayoutEffect(() => {
    const L = LUZES[luz];
    scene.traverse((o) => {
      for (let q: THREE.Object3D | null = o; q; q = q.parent) if (q.userData.vd) return;
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        const ty = m.geometry?.type;
        if (ty === 'ConeGeometry') m.visible = false; // morros do céu padrão (cairiam no meio da cidade)
        if (ty === 'IcosahedronGeometry') m.visible = luz !== 'noite';
      }
      const d = o as THREE.DirectionalLight;
      if (d.isDirectionalLight) {
        const n = new THREE.Vector3(...L.dir).normalize();
        d.position.set(c[0] + n.x * r * 2.5, c[1] + n.y * r * 2.5, c[2] + n.z * r * 2.5);
        d.target.position.set(c[0], c[1], c[2]);
        d.target.updateMatrixWorld();
        d.color.set(L.sol[0]);
        d.intensity = L.sol[1];
        const cam = d.shadow.camera as THREE.OrthographicCamera;
        cam.left = -r;
        cam.right = r;
        cam.top = r;
        cam.bottom = -r;
        cam.near = 0.5;
        cam.far = r * 5.5;
        cam.updateProjectionMatrix();
        d.shadow.bias = -0.0006;
        d.shadow.normalBias = 0.04;
      }
      const h = o as THREE.HemisphereLight;
      if (h.isHemisphereLight) {
        h.color.set(L.hemi[0]);
        h.groundColor.set(L.hemi[1]);
        h.intensity = L.hemi[2];
      }
    });
    scene.fog = fog;
  });
  return null;
};
// raiz de todo cenário do viaduto (marca o grupo como "nosso" para o Ambiente)
export const Raiz: React.FC<{children: React.ReactNode}> = ({children}) => <group userData={{vd: true}}>{children}</group>;

// ---------- cidade ----------
type Predio = {x: number; z: number; w: number; d: number; h: number; cor: string; loja?: string; corLoja?: string; rotLoja?: number};
const CORES_PREDIO = ['#f1e3c6', '#d9e2ea', '#f3c9a8', '#cfd8c4', '#e8d1d6', '#c9d3e3', '#f5ead2', '#d7c8b4', '#bfcad6'];
const LOJAS: [string, string][] = [['PADARIA', '#d9534f'], ['FARMÁCIA', '#2fa36b'], ['MERCADO', '#2f6fd6'], ['LANCHES', '#ff8a1f'], ['ÓTICA', '#6a4bc4'], ['PET SHOP', '#14a3b8'], ['AÇOUGUE', '#b23b3b'], ['SALÃO', '#e05aa0'], ['BAZAR', '#c58b16'], ['PIZZARIA', '#c0392b']];
export const PREDIOS: Predio[] = (() => {
  const r = rng(42);
  const out: Predio[] = [];
  let k = 0;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      for (let ix = 0; ix < 7; ix++)
        for (let iz = 0; iz < 7; iz++) {
          if (r() < 0.28) continue;
          const w = 10 + r() * 8, d = 10 + r() * 8;
          const x = sx * (34 + ix * 21 + r() * 3);
          const z = sz * (30 + iz * 21 + r() * 3);
          if (Math.abs(x) - w / 2 < 26 || Math.abs(z) - d / 2 < 22) continue;
          if (sx < 0 && x + w / 2 > -35) continue; // faixa da ferrovia
          const perto = ix === 0;
          const h = perto ? 9 + r() * 18 : r() < 0.15 ? 40 + r() * 25 : 6 + r() * 26;
          const p: Predio = {x, z, w, d, h: Math.round(h / 3) * 3, cor: CORES_PREDIO[Math.floor(r() * CORES_PREDIO.length)]};
          if (perto) {
            const [l, c] = LOJAS[k++ % LOJAS.length];
            p.loja = l;
            p.corLoja = c;
            p.rotLoja = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
          }
          out.push(p);
        }
  return out;
})();

export type Zona = {x: [number, number]; z: [number, number]};
const dentro = (p: {x: number; z: number; w: number; d: number}, q?: Zona) => !!q && p.x + p.w / 2 > q.x[0] && p.x - p.w / 2 < q.x[1] && p.z + p.d / 2 > q.z[0] && p.z - p.d / 2 < q.z[1];
export const Predios: React.FC<{noite?: boolean; raio?: number; excluir?: Zona}> = ({noite, raio = 999, excluir}) => {
  const jan = texJanelas(false), luz = texJanelas(true);
  return (
    <group>
      {PREDIOS.filter((p) => Math.abs(p.x) < raio && Math.abs(p.z) < raio && !dentro(p, excluir)).map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <BoxT pos={[0, p.h / 2, 0]} tam={[p.w, p.h, p.d]} cor={p.cor} map={jan} mu={10} mv={12} emis={noite ? '#ffd890' : undefined} emisMap={noite ? luz : null} emisI={noite ? 1.1 : 0} />
          <Caixa pos={[0, p.h + 0.15, 0]} tam={[p.w + 0.3, 0.3, p.d + 0.3]} cor="#8d8a84" />
          <Caixa pos={[p.w * 0.2, p.h + 1.1, -p.d * 0.15]} tam={[2.2, 1.6, 2.2]} cor="#b9b4ab" />
          <Cil pos={[-p.w * 0.25, p.h + 1.0, p.d * 0.2]} r={0.7} h={1.4} cor="#3c7dd9" seg={10} />
          {p.loja && (
            <group rotation={[0, p.rotLoja ?? 0, 0]}>
              <BoxT pos={[0, 4.2, p.w / 2 + 0.25]} tam={[Math.min(p.d, 9), 1.3, 0.3]} cor="#ffffff" map={texLetreiro(p.loja, p.corLoja!)} mu={Math.min(p.d, 9)} mv={1.3} emis={noite ? '#ffffff' : undefined} emisMap={noite ? texLetreiro(p.loja, p.corLoja!) : null} emisI={noite ? 0.8 : 0} />
              <Caixa pos={[0, 3.3, p.w / 2 + 0.9]} rot={[0.25, 0, 0]} tam={[Math.min(p.d, 9), 0.08, 1.8]} cor={p.corLoja!} />
              <Caixa pos={[0, 1.4, p.w / 2 + 0.03]} tam={[Math.min(p.d, 9) * 0.8, 2.6, 0.06]} cor={noite ? '#ffe2a8' : '#5e7a92'} />
            </group>
          )}
        </group>
      ))}
    </group>
  );
};

// luz acesa: placa opaca sem sombreamento (nada de esfera translúcida, que vira disco no quadro)
export const Farol: React.FC<{pos: V3; tam: V3; cor: string; aceso?: boolean}> = ({pos, tam, cor, aceso = true}) => (
  <mesh position={pos}>
    <boxGeometry args={tam} />
    {aceso ? <meshBasicMaterial color={cor} toneMapped={false} /> : <meshStandardMaterial color={cor} />}
  </mesh>
);
export const Poste: React.FC<{pos: V3; rotY?: number; h?: number; noite?: boolean; duplo?: boolean; aceso?: boolean}> = ({pos, rotY = 0, h = 10, noite, duplo, aceso}) => {
  const on = aceso ?? noite;
  const braco = (s: number) => (
    <group key={s} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
      <Barra a={[0, h - 0.4, 0]} b={[0, h, 2.0]} r={0.07} cor="#7d838c" />
      <Caixa pos={[0, h - 0.05, 2.2]} tam={[0.4, 0.18, 0.9]} cor="#5a5f66" />
      <Caixa pos={[0, h - 0.16, 2.2]} tam={[0.32, 0.04, 0.7]} cor={on ? '#fff3c4' : '#d8dde4'} sombra={false} />
    </group>
  );
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Cil pos={[0, h / 2, 0]} r={0.09} r2={0.14} h={h} cor="#8a9099" seg={8} />
      <Cil pos={[0, 0.3, 0]} r={0.22} h={0.6} cor="#6f747c" seg={8} />
      {braco(1)}
      {duplo && braco(-1)}
      {on && <Farol pos={[0, h - 0.19, 2.2]} tam={[0.34, 0.03, 0.74]} cor="#fff1b8" />}
      {on && duplo && <Farol pos={[0, h - 0.19, -2.2]} tam={[0.34, 0.03, 0.74]} cor="#fff1b8" />}
    </group>
  );
};

export const Semaforo: React.FC<{pos: V3; rotY?: number; cor?: 'verde' | 'vermelho'}> = ({pos, rotY = 0, cor = 'vermelho'}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Cil pos={[0, 2.8, 0]} r={0.08} h={5.6} cor="#4a4f57" seg={8} />
    <Barra a={[0, 5.4, 0]} b={[0, 5.4, 4]} r={0.06} cor="#4a4f57" />
    <Caixa pos={[0, 4.9, 3.8]} tam={[0.4, 1.1, 0.3]} cor="#1d1b26" />
    {[['vermelho', 5.25, '#ff3b30'], ['amarelo', 4.9, '#ffcc00'], ['verde', 4.55, '#34c759']].map(([n, y, c]) => (
      <mesh key={n as string} position={[0.21, y as number, 3.8]}>
        <sphereGeometry args={[0.12, 20, 14]} />
        <meshStandardMaterial color={n === cor ? (c as string) : '#333'} emissive={n === cor ? (c as string) : '#000'} emissiveIntensity={1.5} />
      </mesh>
    ))}
  </group>
);

// carro, ônibus e caminhão (frente = +Z local)
export type TipoCarro = 'carro' | 'suv' | 'onibus' | 'caminhao';
export const Carro: React.FC<{pos: V3; rotY?: number; cor: string; tipo?: TipoCarro; noite?: boolean; incl?: number}> = ({pos, rotY = 0, cor, tipo = 'carro', noite, incl = 0}) => {
  const grande = tipo === 'onibus' || tipo === 'caminhao';
  const L = tipo === 'onibus' ? 12 : tipo === 'caminhao' ? 8 : tipo === 'suv' ? 4.6 : 4.2;
  const W = grande ? 2.5 : 1.8;
  const rodas = grande ? [-L / 2 + 2, L / 2 - 2] : [-L / 2 + 0.85, L / 2 - 0.85];
  const farol = noite ? '#fff6d0' : '#e9eef2';
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <group rotation={[-incl, 0, 0]}>
        {tipo === 'onibus' ? (
          <>
            <Caixa pos={[0, 1.75, 0]} tam={[W, 2.7, L]} cor={cor} />
            <Caixa pos={[0, 2.3, -0.3]} tam={[W + 0.02, 0.95, L - 1.4]} cor="#22303c" />
            <Caixa pos={[0, 2.0, L / 2 - 0.02]} tam={[W - 0.2, 1.5, 0.06]} cor="#22303c" />
            <Caixa pos={[0, 3.0, L / 2 - 0.02]} tam={[W - 0.5, 0.3, 0.08]} cor={noite ? '#ffb000' : '#3a2a10'} />
            <Caixa pos={[0, 1.2, 0]} tam={[W + 0.02, 0.25, L]} cor="#ffffff" />
          </>
        ) : tipo === 'caminhao' ? (
          <>
            <Caixa pos={[0, 1.6, L / 2 - 1.1]} tam={[W, 2.2, 2.0]} cor={cor} />
            <Caixa pos={[0, 2.1, L / 2 - 0.08]} tam={[W - 0.2, 0.8, 0.06]} cor="#22303c" />
            <Caixa pos={[0, 2.0, -1.0]} tam={[W, 2.8, L - 2.4]} cor="#e9e6df" />
            <Caixa pos={[0, 0.65, 0]} tam={[W - 0.4, 0.3, L]} cor="#2b2b30" />
          </>
        ) : (
          <>
            <Caixa pos={[0, 0.6, 0]} tam={[W, tipo === 'suv' ? 0.8 : 0.65, L]} cor={cor} />
            <Caixa pos={[0, tipo === 'suv' ? 1.3 : 1.15, -0.2]} tam={[W * 0.86, 0.55, L * 0.5]} cor="#26303a" />
            <Caixa pos={[0, tipo === 'suv' ? 1.6 : 1.44, -0.2]} tam={[W * 0.84, 0.06, L * 0.44]} cor={cor} />
          </>
        )}
        {rodas.map((z) => [-1, 1].map((s) => (<Cil key={z + ':' + s} pos={[s * (W / 2 - 0.05), 0.36, z]} rot={[0, 0, Math.PI / 2]} r={grande ? 0.5 : 0.34} h={0.26} cor="#1f1f24" seg={10} />)))}
        {[-1, 1].map((s) => (
          <React.Fragment key={s}>
            <Caixa pos={[s * (W / 2 - 0.3), grande ? 0.9 : 0.7, L / 2 + 0.01]} tam={[0.35, 0.16, 0.04]} cor={farol} sombra={false} />
            <Caixa pos={[s * (W / 2 - 0.3), grande ? 0.9 : 0.75, -L / 2 - 0.01]} tam={[0.3, 0.16, 0.04]} cor={noite ? '#ff2b2b' : '#b3262b'} sombra={false} />
          </React.Fragment>
        ))}
        {noite && [-1, 1].map((s) => (
          <React.Fragment key={'l' + s}>
            <Farol pos={[s * (W / 2 - 0.3), grande ? 0.9 : 0.7, L / 2 + 0.035]} tam={[0.36, 0.17, 0.02]} cor="#fff6d0" />
            <Farol pos={[s * (W / 2 - 0.3), grande ? 0.9 : 0.75, -L / 2 - 0.035]} tam={[0.31, 0.17, 0.02]} cor="#ff3030" />
          </React.Fragment>
        ))}
      </group>
    </group>
  );
};

const CORES_CARRO = ['#e8402f', '#f2f2f2', '#2f6fd6', '#1d1b26', '#9aa0aa', '#ffd23f', '#2fbf71', '#c0c4ca', '#7a2b2b', '#f2f2f2'];
const tipoDe = (i: number): TipoCarro => (i % 11 === 3 ? 'onibus' : i % 7 === 5 ? 'caminhao' : i % 3 === 0 ? 'suv' : 'carro');
const CORES_ONIBUS = ['#2f8f5b', '#e8a317', '#2f6fd6'];

// trânsito na avenida (corre em Z). fechadas = faixas fechadas (0 a 2, contando da direita do sentido +z)
export const TransitoAvenida: React.FC<{t: number; noite?: boolean; parado?: boolean; fechadas?: number; densidade?: number; desvio?: boolean}> = ({t, noite, parado, fechadas = 0, densidade = 1, desvio}) => {
  const carros = useMemo(() => {
    const r = rng(77);
    const out: {x: number; z0: number; v: number; dir: number; cor: string; tipo: TipoCarro; faixa: number}[] = [];
    const faixas = [2.7, 6.0, 9.3];
    let i = 0;
    for (const dir of [1, -1])
      faixas.forEach((fx, fi) => {
        for (let k = 0; k < 9; k++) {
          if (r() > densidade) continue;
          const tipo = tipoDe(i);
          out.push({x: dir > 0 ? fx : -fx, z0: -160 + k * 36 + r() * 14, v: 11 - fi * 1.2, dir, cor: tipo === 'onibus' ? CORES_ONIBUS[i % 3] : CORES_CARRO[i % CORES_CARRO.length], tipo, faixa: fi});
          i++;
        }
      });
    return out;
  }, [densidade]);
  return (
    <group>
      {carros.map((c, i) => {
        // faixas fechadas: carros só do lado esquerdo; no desvio eles costuram para a faixa livre perto da obra
        if (c.faixa >= 3 - fechadas && !desvio && (fechadas >= 3 || c.dir > 0)) return null;
        let z: number;
        if (parado) {
          // fila no semáforo: carros parados antes do cruzamento
          const fila = ((c.z0 + 160) % 120) * 0.5;
          z = c.dir > 0 ? -16 - fila - (c.faixa * 3) % 5 + Math.sin(t * 0.8 + i) * 0.05 : 16 + fila + (c.faixa * 3) % 5;
          if (Math.abs(z) > 120) return null;
        } else {
          z = ((c.z0 + c.dir * c.v * t + 160) % 320 + 320) % 320 - 160;
        }
        const x = c.x;
        if (desvio && c.dir > 0 && c.faixa >= 3 - fechadas && z > -75 && z < 50) return null; // faixa fechada: ninguém passa
        return <Carro key={i} pos={[x, 0, z]} rotY={c.dir > 0 ? 0 : Math.PI} cor={c.cor} tipo={c.tipo} noite={noite} />;
      })}
    </group>
  );
};

// trânsito em cima do viaduto (corre em X, sobe e desce a rampa)
export const TransitoViaduto: React.FC<{t: number; noite?: boolean}> = ({t, noite}) => {
  const carros = useMemo(() => {
    const r = rng(91);
    const out: {z: number; x0: number; v: number; dir: number; cor: string; tipo: TipoCarro}[] = [];
    let i = 0;
    for (const dir of [1, -1])
      [2.4, 5.9].forEach((fz) => {
        for (let k = 0; k < 6; k++) {
          const tipo = tipoDe(i + 4);
          out.push({z: dir > 0 ? fz : -fz, x0: -200 + k * 68 + r() * 25, v: fz > 3 ? 12 : 15, dir, cor: tipo === 'onibus' ? CORES_ONIBUS[i % 3] : CORES_CARRO[(i * 3) % CORES_CARRO.length], tipo});
          i++;
        }
      });
    return out;
  }, []);
  return (
    <group>
      {carros.map((c, i) => {
        const x = ((c.x0 + c.dir * c.v * t + 200) % 400 + 400) % 400 - 200;
        const y = yTop(x) + 0.05;
        const ang = Math.abs(x) > VD.xPlano && Math.abs(x) < VD.xFim ? Math.atan(VD.rampa) * Math.sign(x) * c.dir : 0;
        return <Carro key={i} pos={[x, y, c.z]} rotY={c.dir > 0 ? Math.PI / 2 : -Math.PI / 2} cor={c.cor} tipo={c.tipo} noite={noite} incl={ang} />;
      })}
    </group>
  );
};

// ---------- ferrovia (o viaduto de Hortolândia passa sobre a linha do trem) ----------
export const FERROVIA = {x0: -31.5, x1: -23.5, trilhos: [-29.3, -25.7]};
export const texDormentes = () =>
  tx('vd-dormentes', 128, 32, (g) => {
    g.fillStyle = '#8d877c';
    g.fillRect(0, 0, 128, 32);
    const r = rng(5);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(60,55,50,0.4)' : 'rgba(200,195,185,0.4)';
      g.fillRect(r() * 128, r() * 32, 2, 2);
    }
    g.fillStyle = '#6b4a32';
    g.fillRect(6, 6, 116, 14);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(6, 17, 116, 3);
  });
export const Trem: React.FC<{z: number; x: number; dir?: number; vagoes?: number; noite?: boolean}> = ({z, x, dir = 1, vagoes = 10, noite}) => (
  <group position={[x, 0.45, z]} rotation={[0, dir > 0 ? 0 : Math.PI, 0]}>
    {/* locomotiva */}
    <Caixa pos={[0, 2.3, 0]} tam={[3.0, 3.4, 20]} cor="#ffc21f" />
    <Caixa pos={[0, 2.0, 0]} tam={[3.02, 0.4, 20]} cor="#2b2b30" />
    <Caixa pos={[0, 3.4, 9.0]} tam={[2.8, 1.1, 0.06]} cor="#22303c" />
    <Caixa pos={[0, 4.1, 3]} tam={[1.2, 0.3, 4]} cor="#3a3d44" />
    {[-7, 7].map((zz) => (<Caixa key={zz} pos={[0, 0.45, zz]} tam={[2.6, 0.7, 3.6]} cor="#2b2b30" />))}
    {noite && <Farol pos={[0, 3.0, 10.04]} tam={[0.7, 0.4, 0.04]} cor="#fff2c0" />}
    {/* vagões graneleiros */}
    {Array.from({length: vagoes}).map((_, i) => {
      const zz = -10 - 1.0 - 8 - i * 17;
      return (
        <group key={i} position={[0, 0, zz]}>
          <Caixa pos={[0, 2.4, 0]} tam={[3.0, 3.2, 16]} cor={i % 3 === 1 ? '#8b6b4a' : '#7a5a3c'} />
          {[-5, 0, 5].map((k) => (<Caixa key={k} pos={[0, 2.4, k]} tam={[3.04, 3.0, 0.15]} cor="#5e4530" />))}
          <Caixa pos={[0, 4.05, 0]} tam={[2.4, 0.1, 15]} cor="#6f6a62" />
          {[-5.5, 5.5].map((k) => (<Caixa key={k} pos={[0, 0.45, k]} tam={[2.6, 0.7, 2.8]} cor="#2b2b30" />))}
        </group>
      );
    })}
  </group>
);
export const Ferrovia: React.FC<{t?: number; noite?: boolean; passagem?: boolean; tremZ?: number}> = ({t = 0, noite, passagem, tremZ}) => {
  const dorm = texDormentes();
  const {x0, x1, trilhos} = FERROVIA;
  const zT = tremZ ?? (((t * 9 + 60) % 500) + 500) % 500 - 250;
  return (
    <group>
      <Caixa pos={[(x0 + x1) / 2, 0.15, 0]} tam={[x1 - x0, 0.3, 800]} cor="#9a9386" />
      {trilhos.map((xc) => (
        <React.Fragment key={xc}>
          <PlanoChao x={[xc - 1.4, xc + 1.4]} z={[-400, 400]} y={0.31} cor="#ffffff" map={dorm} mu={2.8} mv={0.6} />
          {[-0.8, 0.8].map((d) => (<Caixa key={d} pos={[xc + d, 0.4, 0]} tam={[0.08, 0.16, 800]} cor="#9aa0a8" sombra={false} />))}
        </React.Fragment>
      ))}
      {/* alambrado */}
      {[x0 - 0.3, x1 + 0.3].map((xf) => (
        <React.Fragment key={xf}>
          <mesh position={[xf, 0.9, 0]}>
            <boxGeometry args={[0.03, 1.8, 800]} />
            <meshStandardMaterial color="#b9c0c8" transparent opacity={0.35} />
          </mesh>
          {Array.from({length: 31}).map((_, i) => {
            const z = -180 + i * 12;
            if (passagem && Math.abs(z) < 9) return null;
            return <Cil key={i} pos={[xf, 0.95, z]} r={0.04} h={1.9} cor="#7d838c" seg={6} />;
          })}
        </React.Fragment>
      ))}
      {passagem && (
        <>
          <PlanoChao x={[x0 - 0.4, x1 + 0.4]} z={[-8, 8]} y={0.33} cor="#43454b" />
          {[[x1 + 0.8, 8.5, 1], [x0 - 0.8, -8.5, -1]].map(([x, z, s], i) => (
            <group key={i} position={[x, 0, z]}>
              <Cil pos={[0, 0.7, 0]} r={0.12} h={1.4} cor="#e9e6df" seg={8} />
              <group position={[0, 1.1, 0]}>
                {Array.from({length: 6}).map((_, k) => (<Caixa key={k} pos={[0, 0, -s * (0.6 + k * 1.1)]} tam={[0.12, 0.12, 1.1]} cor={k % 2 ? '#ffffff' : '#e8402f'} />))}
              </group>
              <Cil pos={[0.3, 1.6, 0]} r={0.04} h={3.2} cor="#4a4f57" seg={6} />
              <Caixa pos={[0.3, 3.0, 0]} tam={[0.1, 0.5, 1.4]} cor="#1d1b26" />
              {[-0.4, 0.4].map((dz, k) => (
                <mesh key={k} position={[0.36, 3.0, dz]}>
                  <sphereGeometry args={[0.13, 20, 14]} />
                  <meshBasicMaterial color={(Math.floor(t * 3) + k) % 2 ? '#ff2b2b' : '#4a1010'} />
                </mesh>
              ))}
              <BoxT pos={[0.3, 3.7, 0]} rot={[0, Math.PI / 2, 0]} tam={[1.6, 0.5, 0.05]} cor="#ffffff" map={texLetreiro('PARE: TREM', '#ffd23f', '#1d1b26')} mu={1.6} mv={0.5} />
            </group>
          ))}
        </>
      )}
      <Trem z={zT} x={trilhos[1]} noite={noite} />
    </group>
  );
};

// chão da cidade: avenida em Z com canteiro central, calçadas, rua transversal em X (antes) ou praça sob o viaduto (depois)
export type FaseCidade = 'antes' | 'obra' | 'pronto';
export const Cidade: React.FC<{fase: FaseCidade; noite?: boolean; predios?: boolean; raio?: number; arvores?: boolean; excluir?: Zona; furo?: Zona; t?: number; tremZ?: number}> = ({fase, noite, predios = true, raio, arvores = true, excluir, furo, t = 0, tremZ}) => {
  const av = texPista('avenida');
  const rua = texPista('rua');
  const grama = texGrama();
  const arvs = useMemo(() => {
    const out: V3[] = [];
    for (let z = -150; z <= 150; z += 15) if (Math.abs(z) > 24) { out.push([-14, 0, z]); out.push([14, 0, z]); }
    for (let x = -150; x <= 150; x += 18) if (Math.abs(x) > 30 && (x < -36 || x > -20)) { out.push([x, 0, 19]); out.push([x, 0, -19]); }
    return out;
  }, []);
  return (
    <group>
      <PlanoFurado x={[-400, 400]} z={[-400, 400]} y={-0.02} cor="#bdb6a8" map={texConcreto()} mu={6} mv={6} furo={furo} />
      {/* quarteirões: grama entre as ruas */}
      {[-1, 1].map((sx) => [-1, 1].map((sz) => (<PlanoChao key={sx + ':' + sz} x={sx > 0 ? [24, 260] : [-260, -24]} z={sz > 0 ? [22, 260] : [-260, -22]} y={0.0} cor="#9fc27f" map={grama} mu={8} mv={8} />)))}
      {/* avenida: duas pistas de 10 m, canteiro de 2 m */}
      <PlanoChao x={[1, 11]} z={[-400, 400]} y={0.02} cor="#ffffff" map={av} mu={10} mv={12} rotUV />
      <PlanoChao x={[-11, -1]} z={[-400, 400]} y={0.02} cor="#ffffff" map={av} mu={10} mv={12} rotUV />
      <Caixa pos={[0, 0.1, 0]} tam={[2, 0.2, 800]} cor="#c9c4ba" />
      <PlanoChao x={[-0.85, 0.85]} z={[-400, 400]} y={0.21} cor="#7fb562" map={grama} />
      {/* meio-fio e calçadas */}
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <Caixa pos={[s * 11.1, 0.08, 0]} tam={[0.2, 0.16, 800]} cor="#e2ddd2" />
          <PlanoChao x={s > 0 ? [11.2, 16] : [-16, -11.2]} z={[-400, 400]} y={0.15} cor="#d8d2c6" map={texConcreto()} mu={1.2} mv={1.2} />
        </React.Fragment>
      ))}
      {/* faixa de pedestre perto do cruzamento */}
      {[-1, 1].map((s) => Array.from({length: 7}).map((_, i) => (<Caixa key={s + ':' + i} pos={[s * (2.2 + i * 1.3), 0.04, s * 0 + (fase === 'antes' ? 10 : 24) * 1]} tam={[0.6, 0.02, 3]} cor="#f2f2ee" sombra={false} />)))}
      {/* rua transversal (em X) */}
      {fase === 'antes' && (
        <>
          <PlanoChao x={[11.2, 400]} z={[-8, 8]} y={0.03} cor="#ffffff" map={rua} mu={10} mv={16} />
          <PlanoChao x={[-400, -11.2]} z={[-8, 8]} y={0.03} cor="#ffffff" map={rua} mu={10} mv={16} />
          <PlanoChao x={[-11, 11]} z={[-8, 8]} y={0.035} cor="#43454b" />
          <Semaforo pos={[12, 0, 9]} rotY={-Math.PI / 2} cor="vermelho" />
          <Semaforo pos={[-12, 0, -9]} rotY={Math.PI / 2} cor="vermelho" />
          <Semaforo pos={[-12, 0, 9]} rotY={Math.PI} cor="verde" />
        </>
      )}
      {fase === 'obra' && (
        <>
          <PlanoFurado x={[11.2, 175]} z={[-14, 14]} y={0.03} cor="#b9926a" map={texConcreto()} mu={3} mv={3} furo={furo} />
          <PlanoChao x={[-175, -11.2]} z={[-14, 14]} y={0.03} cor="#b9926a" map={texConcreto()} mu={3} mv={3} />
          <PlanoChao x={[175, 400]} z={[-8, 8]} y={0.03} cor="#ffffff" map={rua} mu={10} mv={16} />
          <PlanoChao x={[-400, -175]} z={[-8, 8]} y={0.03} cor="#ffffff" map={rua} mu={10} mv={16} />
        </>
      )}
      {fase === 'pronto' && (
        <>
          <PlanoChao x={[16, 175]} z={[-13, 13]} y={0.03} cor="#9fc27f" map={grama} mu={8} mv={8} />
          <PlanoChao x={[-175, -16]} z={[-13, 13]} y={0.03} cor="#9fc27f" map={grama} mu={8} mv={8} />
          <PlanoChao x={[VD.xFim - 2, 400]} z={[-9.5, 9.5]} y={0.04} cor="#ffffff" map={texPista('tabuleiro')} mu={10} mv={19} />
          <PlanoChao x={[-400, -VD.xFim + 2]} z={[-9.5, 9.5]} y={0.04} cor="#ffffff" map={texPista('tabuleiro')} mu={10} mv={19} />
          {/* calçadinha sob o viaduto */}
          <PlanoChao x={[16, 150]} z={[-12.5, -11]} y={0.06} cor="#d8d2c6" />
          <PlanoChao x={[-150, -16]} z={[11, 12.5]} y={0.06} cor="#d8d2c6" />
        </>
      )}
      {/* postes do canteiro central */}
      {Array.from({length: 11}).map((_, i) => {
        const z = -150 + i * 30;
        if (Math.abs(z) < 14) return null;
        return <Poste key={i} pos={[0, 0.2, z]} rotY={Math.PI / 2} h={10} duplo noite={noite} />;
      })}
      {arvores && arvs.filter((p) => !(excluir && p[0] > excluir.x[0] && p[0] < excluir.x[1] && p[2] > excluir.z[0] && p[2] < excluir.z[1])).map((p, i) => (<Arvore key={i} pos={p} esc={1.5 + (i % 3) * 0.2} cor={i % 2 ? '#3f9b5a' : '#4aa864'} />))}
      <Ferrovia t={t} noite={noite} passagem={fase === 'antes'} tremZ={tremZ} />
      {predios && <Predios noite={noite} raio={raio} excluir={excluir} />}
    </group>
  );
};

// ---------- estrutura do viaduto (por fases) ----------
export const corConcreto = '#c9c4ba';
const corViga = '#d3cec4';

// viga I protendida de 35 m, pré-moldada (eixo X local; centro no meio da altura)
export const VigaI: React.FC<{len?: number; cor?: string}> = ({len = 34.2, cor = corViga}) => {
  const cz = texConcreto();
  return (
    <group>
      <BoxT pos={[0, -0.775, 0]} tam={[len, 0.25, 0.75]} cor={cor} map={cz} />
      <BoxT pos={[0, -0.55, 0]} tam={[len, 0.2, 0.45]} cor={cor} map={cz} />
      <BoxT pos={[0, 0, 0]} tam={[len, 1.3, 0.2]} cor={cor} map={cz} />
      <BoxT pos={[0, 0.6, 0]} tam={[len, 0.12, 0.5]} cor={cor} map={cz} />
      <BoxT pos={[0, 0.8, 0]} tam={[len, 0.2, 1.1]} cor={cor} map={cz} />
      {/* cabeças maciças nas pontas e alças de içamento */}
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <BoxT pos={[s * (len / 2 - 0.6), 0, 0]} tam={[1.2, 1.8, 0.75]} cor={cor} map={cz} />
          <Caixa pos={[s * (len / 2 - 1.8), 1.0, 0]} tam={[0.08, 0.25, 0.3]} cor="#5a5f66" />
          {/* cordoalhas de protensão aparecendo na ponta */}
          {[-0.18, 0, 0.18].map((z) => (<Cil key={z} pos={[s * (len / 2 + 0.03), -0.7, z]} rot={[0, 0, Math.PI / 2]} r={0.03} h={0.08} cor="#3a3d44" seg={6} />))}
        </React.Fragment>
      ))}
    </group>
  );
};

// barreira New Jersey (perfil real: base 0,40, topo 0,15, altura 0,87) ao longo de X
export const NewJersey: React.FC<{len: number; cor?: string}> = ({len, cor = '#e2ded6'}) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.2, 0);
    s.lineTo(0.2, 0);
    s.lineTo(0.2, 0.08);
    s.lineTo(0.09, 0.33);
    s.lineTo(0.075, 0.87);
    s.lineTo(-0.075, 0.87);
    s.lineTo(-0.09, 0.33);
    s.lineTo(-0.2, 0.08);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth: len, bevelEnabled: false});
    g.translate(0, 0, -len / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }, [len]);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <MatT cor={cor} />
    </mesh>
  );
};

export type FaseVD = {
  bloco?: number; // 0..1 (blocos aparecem)
  pilar?: number; // 0..1 altura dos pilares
  trav?: number; // 0..1 travessas
  vigas?: number; // vãos completos na ordem [1,3,0,4,2] + fração de vigas do próximo
  prelaje?: number; // 0..1 ao longo de X
  laje?: number; // 0..1 ao longo de X
  asfalto?: number;
  barreira?: number;
  postes?: number;
  rampa?: number; // 0..1 altura do aterro das rampas
  noite?: boolean;
  aceso?: boolean;
  estacas?: boolean; // desenha as estacas embaixo do chão (só em corte)
};
export const ORDEM_VAOS = [1, 3, 0, 4, 2];

// quantas vigas cada vão tem no estado "vigas"
export const vigasPorVao = (vigas: number) => {
  const n = [0, 0, 0, 0, 0];
  for (let k = 0; k < ORDEM_VAOS.length; k++) {
    const f = clamp01(vigas - k);
    n[ORDEM_VAOS[k]] = Math.floor(f * 8 + 1e-6);
  }
  return n;
};

const Encontro: React.FC<{s: number; k: number}> = ({s, k}) => {
  const x = s * 87.5;
  const yt = yTopoTrav(x);
  if (k <= 0) return null;
  return (
    <group>
      <Bx x={[x - 1.0, x + 1.0]} y={[0, yt * k]} z={[-VD.meia, VD.meia]} />
      <Bx x={[x - 1.4, x + 1.4]} y={[-0.4, 0.2]} z={[-VD.meia - 0.4, VD.meia + 0.4]} />
    </group>
  );
};

// aterro da rampa com paredes de terra armada
const Rampa: React.FC<{s: number; k: number; asfalto: number; barreira: number}> = ({s, k, asfalto, barreira}) => {
  const ta = texTerraArmada();
  const geo = useMemo(() => {
    const sh = new THREE.Shape();
    const x0 = 88.5, x1 = VD.xFim + 1;
    sh.moveTo(x0, 0);
    sh.lineTo(x1, 0);
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const x = lerp(x1, x0, i / n);
      sh.lineTo(x, Math.max(0.05, yTop(x) - 0.3));
    }
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, {depth: VD.meia * 2, bevelEnabled: false});
    g.translate(0, 0, -VD.meia);
    return g;
  }, []);
  const pista = useMemo(() => {
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    const n = 24, x0 = 88.5, x1 = VD.xFim + 1;
    for (let i = 0; i <= n; i++) {
      const x = lerp(x0, x1, i / n);
      const y = yTop(x) - 0.3 + 0.32;
      pos.push(x, y, -9.5, x, y, 9.5);
      uv.push(x / 10, 0, x / 10, 1);
      if (i < n) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  if (k <= 0) return null;
  return (
    <group scale={[s, 1, 1]}>
      <mesh geometry={geo} scale={[1, k, 1]} castShadow receiveShadow>
        <MatT cor="#ffffff" map={ta} side={THREE.DoubleSide} />
      </mesh>
      {asfalto > 0 && k >= 1 && (
        <mesh geometry={pista} receiveShadow>
          <MatT cor="#ffffff" map={texPista('tabuleiro')} side={THREE.DoubleSide} />
        </mesh>
      )}
      {barreira > 0 && k >= 1 &&
        Array.from({length: 8}).map((_, i) => {
          const xa = 88.5 + i * 9.1, xb = xa + 9.1;
          return [-1, 0, 1].map((zz) => (
            <group key={i + ':' + zz} position={[(xa + xb) / 2, (yTop(xa) + yTop(xb)) / 2 + 0.02, zz * 9.8]} rotation={[0, 0, -Math.atan(VD.rampa)]}>
              <NewJersey len={9.12} />
            </group>
          ));
        })}
    </group>
  );
};

export const Viaduto: React.FC<FaseVD & {t?: number}> = (f) => {
  const {bloco = 1, pilar = 1, trav = 1, vigas = 5, prelaje = 1, laje = 1, asfalto = 1, barreira = 1, postes = 1, rampa = 1, noite, aceso, estacas} = f;
  const nv = vigasPorVao(vigas);
  const xLaje = lerp(-88, 88, laje), xPre = lerp(-88, 88, prelaje), xAsf = lerp(-88, 88, asfalto), xBar = lerp(-88, 88, barreira);
  const cz = texConcreto();
  return (
    <group>
      {/* fundação: blocos (topo no nível do chão) e estacas */}
      {PILARES_X.map((x) => [-1, 1].map((sz) => {
        const z = sz * VD.zPilar;
        return (
          <group key={x + ':' + sz}>
            {bloco > 0 && <Bx x={[x - BLOCO.w / 2, x + BLOCO.w / 2]} y={[-BLOCO.h + 0.25 - (1 - bloco) * 2, 0.25 - (1 - bloco) * 2]} z={[z - BLOCO.d / 2, z + BLOCO.d / 2]} />}
            {estacas && ESTACAS_BLOCO.map(([dx, dz], i) => (<Cil key={i} pos={[x + dx, -BLOCO.h + 0.25 - VD.prof / 2, z + dz]} r={VD.rEst} h={VD.prof} cor="#b7b1a6" seg={10} />))}
            {pilar > 0 && (
              <group>
                <Cil pos={[x, (yTopoTrav(x) - VD.trav) * pilar / 2 + 0.2, z]} r={VD.rPilar} h={(yTopoTrav(x) - VD.trav) * pilar} cor={corConcreto} seg={16} />
                {/* anéis das juntas de concretagem */}
                {[2, 4, 6].filter((y) => y < (yTopoTrav(x) - VD.trav) * pilar).map((y) => (<Cil key={y} pos={[x, y, z]} r={VD.rPilar + 0.015} h={0.04} cor="#a9a398" seg={16} />))}
              </group>
            )}
          </group>
        );
      }))}
      {/* travessas sobre os pilares, com aparelhos de apoio (neoprene) */}
      {trav > 0 && PILARES_X.map((x) => {
        const yt = yTopoTrav(x);
        return (
          <group key={'tv' + x}>
            <Bx x={[x - 1.0, x + 1.0]} y={[yt - VD.trav, yt]} z={[-9.8 * trav, 9.8 * trav]} />
            <Bx x={[x - 0.8, x + 0.8]} y={[yt - VD.trav - 0.6, yt - VD.trav]} z={[-7.5 * trav, 7.5 * trav]} />
            {trav >= 1 && VD.zVigas.map((z) => [-0.45, 0.45].map((dx) => (<group key={z + ':' + dx} position={[x + dx, yt, z]}>{[0, 1, 2, 3, 4].map((i) => (<Caixa key={i} pos={[0, 0.01 + i * 0.02, 0]} tam={i % 2 ? [0.38, 0.008, 0.48] : [0.4, 0.016, 0.5]} cor={i % 2 ? '#d7dce4' : '#1f1f24'} sombra={false} />))}</group>)))}
          </group>
        );
      })}
      <Encontro s={-1} k={trav} />
      <Encontro s={1} k={trav} />
      {/* vigas */}
      {VAOS.map(([xa, xb], vi) =>
        VD.zVigas.slice(0, nv[vi]).map((z) => {
          const ya = yFundoViga(xa) + VD.viga / 2, yb = yFundoViga(xb) + VD.viga / 2;
          return (
            <group key={vi + ':' + z} position={[(xa + xb) / 2, (ya + yb) / 2, z]} rotation={[0, 0, Math.atan2(yb - ya, xb - xa)]}>
              <VigaI />
            </group>
          );
        }),
      )}
      {/* pré-lajes, laje, asfalto, barreiras: por vão, até onde a frente de trabalho chegou */}
      {VAOS.map(([xa, xb], vi) => {
        const corta = (lim: number) => Math.min(xb, Math.max(xa, lim));
        const yA = (x: number) => yTop(x);
        const xp = corta(xPre), xl = corta(xLaje), xs = corta(xAsf), xbz = corta(xBar);
        return (
          <group key={'tb' + vi}>
            {xp > xa && xl < xp && <SegX x0={Math.max(xa, xl)} x1={xp} y0={yA(Math.max(xa, xl)) - VD.laje + 0.04} y1={yA(xp) - VD.laje + 0.04} z={0} w={20.6} h={0.08} cor="#bdb7ab" map={cz} />}
            {xl > xa && <SegX x0={xa} x1={xl} y0={yA(xa) - VD.laje / 2} y1={yA(xl) - VD.laje / 2} z={0} w={21} h={VD.laje} cor={corConcreto} map={cz} />}
            {xs > xa && <SegX x0={xa} x1={xs} y0={yA(xa) + 0.035} y1={yA(xs) + 0.035} z={0} w={19.2} h={0.07} cor="#ffffff" map={texPista('tabuleiro')} mu={10} mv={19} />}
            {xbz > xa && [-1, 0, 1].map((zz) => (
              <group key={zz} position={[(xa + xbz) / 2, (yA(xa) + yA(xbz)) / 2, zz * 9.85 + (zz === 0 ? 0 : 0)]} rotation={[0, 0, Math.atan2(yA(xbz) - yA(xa), xbz - xa)]}>
                <NewJersey len={xbz - xa} />
              </group>
            ))}
            {/* pingadeira/faixa escura na borda do tabuleiro */}
            {xl > xa && [-1, 1].map((s) => (<SegX key={s} x0={xa} x1={xl} y0={yA(xa) - 0.12} y1={yA(xl) - 0.12} z={s * 10.55} w={0.12} h={0.3} cor="#9f998e" map={null} />))}
          </group>
        );
      })}
      {/* juntas de dilatação sobre cada apoio */}
      {asfalto >= 1 && VD.apoios.map((x) => (<Caixa key={'j' + x} pos={[x, yTop(x) + 0.075, 0]} tam={[0.25, 0.02, 19.2]} cor="#5a5f66" sombra={false} />))}
      {/* postes no canteiro central do viaduto */}
      {postes > 0 && Array.from({length: 7}).map((_, i) => {
        const x = -75 + i * 25;
        if (x > lerp(-90, 90, postes)) return null;
        return <Poste key={'pv' + i} pos={[x, yTop(x) + 0.87, 0]} rotY={Math.PI / 2} h={9} duplo noite={noite} aceso={aceso} />;
      })}
      <Rampa s={1} k={rampa} asfalto={asfalto} barreira={barreira} />
      <Rampa s={-1} k={rampa} asfalto={asfalto} barreira={barreira} />
    </group>
  );
};

// ---------- canteiro: cones, tapume, placas, torre de luz ----------
export const Cone: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Caixa pos={[0, 0.02, 0]} tam={[0.45, 0.04, 0.45]} cor="#1d1b26" />
    <Cil pos={[0, 0.38, 0]} r={0.03} r2={0.18} h={0.72} cor="#ff6a1a" seg={10} />
    <Cil pos={[0, 0.42, 0]} r={0.105} r2={0.125} h={0.12} cor="#f4f4f4" seg={10} />
    <Cil pos={[0, 0.2, 0]} r={0.15} r2={0.165} h={0.1} cor="#f4f4f4" seg={10} />
  </group>
);

export const Cavalete: React.FC<{pos: V3; rotY?: number; noite?: boolean; t?: number}> = ({pos, rotY = 0, noite, t = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {[-0.8, 0.8].map((x) => (<Barra key={x} a={[x, 0, 0.25]} b={[x, 1.1, 0]} r={0.03} cor="#5a5f66" />))}
    {[0.55, 0.95].map((y) => (<BoxT key={y} pos={[0, y, 0.05]} tam={[1.9, 0.22, 0.05]} cor="#ffffff" map={texLetreiro('', '#ff6a1a')} mu={1.9} mv={0.22} />))}
    {noite && Math.sin(t * 9 + pos[2]) > 0 && (
      <mesh position={[0.8, 1.2, 0.05]}>
        <sphereGeometry args={[0.1, 20, 14]} />
        <meshBasicMaterial color="#ffb000" />
      </mesh>
    )}
  </group>
);

export const Placa: React.FC<{pos: V3; rotY?: number; texto: string; fundo?: string; cor?: string; larg?: number; alt?: number; h?: number}> = ({pos, rotY = 0, texto, fundo = '#ff8a1f', cor = '#1d1b26', larg = 2.4, alt = 0.9, h = 1.6}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {[-larg * 0.35, larg * 0.35].map((x) => (<Cil key={x} pos={[x, h / 2, -0.03]} r={0.04} h={h} cor="#7d838c" seg={6} />))}
    <BoxT pos={[0, h + alt / 2 - 0.1, 0]} tam={[larg, alt, 0.05]} cor="#ffffff" map={texLetreiro(texto, fundo, cor)} mu={larg} mv={alt} />
  </group>
);

export const Tapume: React.FC<{a: [number, number]; b: [number, number]; h?: number}> = ({a, b, h = 2.2}) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const n = Math.max(1, Math.round(L / 2.2));
  return (
    <group position={[(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2]} rotation={[0, -ang, 0]}>
      {Array.from({length: n}).map((_, i) => {
        const x = -L / 2 + (i + 0.5) * (L / n);
        return (
          <React.Fragment key={i}>
            <Caixa pos={[x, h / 2, 0]} tam={[L / n - 0.04, h, 0.04]} cor={i % 2 ? '#f2f2ee' : '#2f6fd6'} />
            <Caixa pos={[x, h - 0.2, 0.03]} tam={[L / n - 0.04, 0.15, 0.02]} cor="#ff8a1f" sombra={false} />
          </React.Fragment>
        );
      })}
      <Caixa pos={[0, 0.05, 0]} tam={[L, 0.1, 0.4]} cor="#7d838c" />
    </group>
  );
};

export const TorreLuz: React.FC<{pos: V3; rotY?: number; luz?: boolean}> = ({pos, rotY = 0, luz = true}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.6, 0]} tam={[1.4, 1.0, 2.6]} cor="#ffd23f" />
    {[-0.6, 0.6].map((z) => (<Cil key={z} pos={[0.75, 0.35, z]} rot={[0, 0, Math.PI / 2]} r={0.3} h={0.2} cor="#1f1f24" />))}
    <Cil pos={[0, 5, 0]} r={0.08} h={8.5} cor="#9aa0aa" seg={8} />
    <Caixa pos={[0, 9.1, 0]} tam={[0.2, 0.2, 2.0]} cor="#5a5f66" />
    {[-0.7, -0.25, 0.25, 0.7].map((z) => (
      <group key={z} position={[0.15, 9.1, z]} rotation={[0, 0, -0.4]}>
        <Caixa tam={[0.12, 0.45, 0.4]} cor="#3a3d44" />
        <mesh position={[0.07, 0, 0]}>
          <boxGeometry args={[0.02, 0.38, 0.34]} />
          <meshBasicMaterial color={luz ? '#fffbe6' : '#bbbbbb'} />
        </mesh>
      </group>
    ))}
  </group>
);

// caminhão de sinalização com painel de seta luminosa
export const CaminhaoSeta: React.FC<{pos: V3; rotY?: number; t: number}> = ({pos, rotY = 0, t}) => {
  const pisca = Math.floor(t * 3) % 2 === 0;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Carro pos={[0, 0, 0]} cor="#ffd23f" tipo="caminhao" noite />
      <group position={[0, 3.6, -3.6]}>
        <Caixa tam={[2.4, 1.5, 0.15]} cor="#1d1b26" />
        {[-0.8, -0.4, 0, 0.4].map((x, i) => (
          <mesh key={i} position={[x, 0, -0.09]}>
            <sphereGeometry args={[0.12, 20, 14]} />
            <meshBasicMaterial color={pisca || i > 1 ? '#ffb000' : '#3a2a10'} />
          </mesh>
        ))}
        {[[0.75, 0.3], [0.75, -0.3], [0.95, 0]].map(([x, y], i) => (
          <mesh key={'p' + i} position={[x, y, -0.09]}>
            <sphereGeometry args={[0.12, 20, 14]} />
            <meshBasicMaterial color="#ffb000" />
          </mesh>
        ))}
      </group>
      <Caixa pos={[0, 3.25, 0.4]} tam={[1.2, 0.15, 0.3]} cor={pisca ? '#ffb000' : '#ff6a1a'} />
    </group>
  );
};

// ---------- máquinas ----------
const amarelo = '#ffc21f';

// esteira de máquina pesada
const Esteira: React.FC<{pos: V3; len: number; larg?: number; alt?: number}> = ({pos, len, larg = 0.9, alt = 1.0}) => (
  <group position={pos}>
    <Caixa pos={[0, alt / 2, 0]} tam={[larg, alt, len]} cor="#2b2b30" />
    {Array.from({length: Math.floor(len / 0.35)}).map((_, i) => (<Caixa key={i} pos={[0, alt + 0.02, -len / 2 + 0.17 + i * 0.35]} tam={[larg + 0.04, 0.05, 0.2]} cor="#45454c" sombra={false} />))}
    {[-1, 1].map((s) => (<Cil key={s} pos={[larg / 2 + 0.02, alt / 2, s * (len / 2 - alt / 2)]} rot={[0, 0, Math.PI / 2]} r={alt / 2 - 0.05} h={0.06} cor="#6f747c" seg={10} />))}
    {Array.from({length: 4}).map((_, i) => (<Cil key={'r' + i} pos={[larg / 2 + 0.02, 0.3, -len / 2 + alt + i * ((len - 2 * alt) / 3)]} rot={[0, 0, Math.PI / 2]} r={0.2} h={0.05} cor="#8a9099" seg={8} />))}
  </group>
);

// guindaste de esteira com lança treliçada. base = centro no chão; alvo = onde fica o moitão (gancho)
export const Guindaste: React.FC<{base: V3; alvo: V3; L?: number; cargas?: V3[]; cor?: string; rotBase?: number}> = ({base, alvo, L = 54, cargas = [], cor = amarelo, rotBase}) => {
  const yaw = Math.atan2(alvo[0] - base[0], alvo[2] - base[2]);
  const piv: V3 = [base[0] + Math.sin(yaw) * 2.6, base[1] + 3.4, base[2] + Math.cos(yaw) * 2.6];
  const R = Math.hypot(alvo[0] - piv[0], alvo[2] - piv[2]);
  const ang = Math.acos(Math.min(0.96, Math.max(0.15, R / L)));
  const Rr = L * Math.cos(ang);
  const tip: V3 = [piv[0] + Math.sin(yaw) * Rr, piv[1] + L * Math.sin(ang), piv[2] + Math.cos(yaw) * Rr];
  const gantry: V3 = [base[0] - Math.sin(yaw) * 1.5, base[1] + 9.5, base[2] - Math.cos(yaw) * 1.5];
  const contra: V3 = [base[0] - Math.sin(yaw) * 5.0, base[1] + 5.0, base[2] - Math.cos(yaw) * 5.0];
  const moitao: V3 = alvo;
  const seg = 14;
  const lado = (y: number) => 1.0 - (Math.abs(y / L - 0.5) * 2) ** 3 * 0.45;
  return (
    <group>
      {/* parte de baixo (não gira) */}
      <group position={base} rotation={[0, rotBase ?? yaw, 0]}>
        <Esteira pos={[-3.2, 0, 0]} len={9.5} larg={1.3} alt={1.3} />
        <Esteira pos={[3.2, 0, 0]} len={9.5} larg={1.3} alt={1.3} />
        <Caixa pos={[0, 1.1, 0]} tam={[5.2, 0.9, 4.4]} cor="#3a3d44" />
        <Cil pos={[0, 1.75, 0]} r={1.8} h={0.4} cor="#5a5f66" seg={16} />
      </group>
      {/* superestrutura (gira) */}
      <group position={base} rotation={[0, yaw, 0]}>
        <Caixa pos={[0, 2.9, -0.6]} tam={[4.4, 2.0, 7.0]} cor={cor} />
        <Caixa pos={[0, 2.95, -0.6]} tam={[4.45, 0.15, 7.05]} cor="#1d1b26" sombra={false} />
        {/* contrapeso em placas */}
        {[0, 1, 2, 3].map((i) => (<Caixa key={i} pos={[0, 2.3 + i * 0.6, -4.9]} tam={[4.8, 0.55, 1.6]} cor={i % 2 ? '#3a3d44' : '#45484f'} />))}
        <Caixa pos={[0, 4.75, -4.9]} tam={[4.8, 0.12, 1.6]} cor={cor} />
        {/* cabine */}
        <Caixa pos={[2.65, 2.9, 2.0]} tam={[1.3, 1.9, 2.0]} cor={cor} />
        <Caixa pos={[2.65, 3.2, 3.0]} tam={[1.15, 1.1, 0.04]} cor="#9fd0f0" />
        <Caixa pos={[3.31, 3.2, 2.0]} tam={[0.04, 1.1, 1.6]} cor="#9fd0f0" />
        {/* cavalete (A) */}
        <Barra a={[-1.8, 3.9, -1.0]} b={[0, 9.5, -1.5]} r={0.12} cor={cor} />
        <Barra a={[1.8, 3.9, -1.0]} b={[0, 9.5, -1.5]} r={0.12} cor={cor} />
        <Barra a={[0, 3.9, -3.8]} b={[0, 9.5, -1.5]} r={0.12} cor={cor} />
        {/* guinchos */}
        {[0.6, -1.2].map((z) => (<Cil key={z} pos={[0, 4.2, z]} rot={[0, 0, Math.PI / 2]} r={0.45} h={2.6} cor="#5a5f66" seg={12} />))}
        {/* lança treliçada */}
        <group position={[0, 3.4, 2.6]} rotation={[Math.PI / 2 - ang, 0, 0]}>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (<Barra key={i} a={[sx * 1.0, 0, sz * 1.0]} b={[sx * 0.4, L, sz * 0.4]} r={0.1} cor={cor} />))}
          {Array.from({length: seg}).map((_, i) => {
            const y0 = (i / seg) * L, y1 = ((i + 1) / seg) * L;
            const a0 = lado(y0) * lerp(1, 0.4, i / seg) / 1, a1 = lado(y1) * lerp(1, 0.4, (i + 1) / seg);
            const w0 = lerp(1.0, 0.4, y0 / L), w1 = lerp(1.0, 0.4, y1 / L);
            void a0; void a1;
            return (
              <React.Fragment key={i}>
                {[-1, 1].map((s) => (<Barra key={'x' + s} a={[s * w0, y0, -w0]} b={[s * w1, y1, w1]} r={0.045} cor={cor} sombra={false} />))}
                {[-1, 1].map((s) => (<Barra key={'z' + s} a={[-w0, y0, s * w0]} b={[w1, y1, s * w1]} r={0.045} cor={cor} sombra={false} />))}
              </React.Fragment>
            );
          })}
          <Cil pos={[0, L + 0.3, 0.2]} rot={[0, 0, Math.PI / 2]} r={0.55} h={0.9} cor="#3a3d44" seg={12} />
        </group>
      </group>
      {/* cabos: estais da lança, cabo do gancho, lingas */}
      <Barra a={gantry} b={tip} r={0.04} cor="#2b2b30" sombra={false} />
      <Barra a={gantry} b={contra} r={0.04} cor="#2b2b30" sombra={false} />
      <Barra a={tip} b={[moitao[0], moitao[1] + 0.8, moitao[2]]} r={0.035} cor="#2b2b30" sombra={false} />
      <group position={moitao}>
        <Caixa pos={[0, 0.3, 0]} tam={[0.9, 1.2, 0.55]} cor="#e8402f" />
        <Caixa pos={[0, 0.3, 0.29]} tam={[0.6, 0.25, 0.02]} cor={cor} sombra={false} />
        <mesh position={[0, -0.55, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.22, 0.07, 10, 28, Math.PI * 1.4]} />
          <Mat cor="#3a3d44" />
        </mesh>
      </group>
      {cargas.map((c, i) => (<Barra key={i} a={[moitao[0], moitao[1] - 0.6, moitao[2]]} b={c} r={0.04} cor={i % 2 ? '#ffd23f' : '#ff8a1f'} sombra={false} />))}
    </group>
  );
};

// carreta extensiva com uma viga de 35 m (cavalo mecânico + dolly traseiro), frente = +Z local
export const Carreta: React.FC<{pos: V3; rotY?: number; viga?: boolean; noite?: boolean; t?: number}> = ({pos, rotY = 0, viga = true, noite, t = 0}) => {
  const pisca = Math.floor(t * 3) % 2 === 0;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {/* cavalo mecânico */}
      <group position={[0, 0, 15.5]}>
        <Caixa pos={[0, 0.8, 0]} tam={[2.5, 0.4, 6.0]} cor="#2b2b30" />
        <Caixa pos={[0, 2.25, 2.0]} tam={[2.5, 2.6, 2.1]} cor="#e8402f" />
        <Caixa pos={[0, 2.75, 3.06]} tam={[2.2, 1.0, 0.04]} cor="#22303c" />
        <Caixa pos={[0, 1.4, 3.08]} tam={[1.8, 0.7, 0.04]} cor="#9aa0aa" />
        <Caixa pos={[0, 3.7, 1.8]} tam={[2.3, 0.3, 1.6]} cor="#e8402f" />
        <Caixa pos={[0, 3.95, 2.6]} tam={[1.6, 0.18, 0.2]} cor={noite && pisca ? '#ffb000' : '#ff8a1f'} sombra={false} />
        {[-1, 1].map((s) => (<Cil key={s} pos={[s * 1.0, 3.2, 0.6]} r={0.08} h={1.6} cor="#9aa0aa" seg={6} />))}
        {[2.0, -0.8, -2.2].map((z) => [-1, 1].map((s) => (<Cil key={z + ':' + s} pos={[s * 1.15, 0.52, z]} rot={[0, 0, Math.PI / 2]} r={0.52} h={0.35} cor="#1f1f24" seg={12} />)))}
        <Cil pos={[0, 1.1, -1.5]} r={0.7} h={0.15} cor="#5a5f66" seg={12} />
        {[-1, 1].map((s) => (<Farol key={'f' + s} pos={[s * 0.95, 1.0, 3.09]} tam={[0.4, 0.2, 0.03]} cor={noite ? '#fff2c0' : '#e9eef2'} aceso={noite} />))}
      </group>
      {/* dolly traseiro de 4 eixos */}
      <group position={[0, 0, -15.5]}>
        <Caixa pos={[0, 1.0, 0]} tam={[2.8, 0.45, 5.4]} cor="#ff8a1f" />
        {[-1.9, -0.65, 0.65, 1.9].map((z) => [-1, 1].map((s) => (<Cil key={z + ':' + s} pos={[s * 1.1, 0.45, z]} rot={[0, 0, Math.PI / 2]} r={0.45} h={0.55} cor="#1f1f24" seg={12} />)))}
        <Caixa pos={[0, 1.6, 0]} tam={[1.6, 0.8, 1.6]} cor="#5a5f66" />
        <BoxT pos={[0, 1.2, -2.75]} tam={[2.6, 0.4, 0.05]} cor="#ffffff" map={texLetreiro('CARGA LONGA', '#ffd23f', '#1d1b26')} mu={2.6} mv={0.4} />
      </group>
      {viga && (
        <group position={[0, 2.0 + 0.9, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <VigaI len={34.2} cor="#e8dcc4" />
        </group>
      )}
    </group>
  );
};

// perfuratriz de estaca hélice contínua: esteira + torre de 26 m + mesa rotativa + trado em espiral
export const Perfuratriz: React.FC<{pos: V3; rotY?: number; t: number; prof: number; girando?: boolean; trado?: boolean}> = ({pos, rotY = 0, t, prof, girando = true, trado = true}) => {
  const H = 26; // altura da torre
  const yCabeca = H - 1.5 - prof; // a mesa desce conforme o trado entra
  const LT = 24; // trado de 24 m
  const helice = useMemo(() => {
    const voltas = LT / 0.6;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= voltas * 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.3, (i / (voltas * 10)) * LT, Math.sin(a) * 0.3));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.floor(voltas * 10), 0.1, 4, false);
  }, []);
  const mastZ = 2.6;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Esteira pos={[-1.6, 0, 0]} len={5.2} larg={0.8} alt={0.9} />
      <Esteira pos={[1.6, 0, 0]} len={5.2} larg={0.8} alt={0.9} />
      <Caixa pos={[0, 1.1, 0]} tam={[3.6, 0.5, 3.4]} cor="#3a3d44" />
      <Caixa pos={[0, 2.2, -0.6]} tam={[3.4, 1.7, 4.2]} cor="#2f6fd6" />
      <Caixa pos={[0, 2.25, -0.6]} tam={[3.45, 0.12, 4.25]} cor="#ffd23f" sombra={false} />
      <Caixa pos={[0, 2.2, -2.85]} tam={[3.6, 1.6, 0.5]} cor="#3a3d44" />
      <Caixa pos={[1.25, 3.4, 0.9]} tam={[1.0, 1.6, 1.4]} cor="#2f6fd6" />
      <Caixa pos={[1.25, 3.6, 1.61]} tam={[0.85, 0.9, 0.04]} cor="#9fd0f0" />
      {/* torre (mastro) com trilhos */}
      <Caixa pos={[0, H / 2 + 0.8, mastZ]} tam={[0.7, H, 0.7]} cor="#2f6fd6" />
      {[-0.32, 0.32].map((x) => (<Caixa key={x} pos={[x, H / 2 + 0.8, mastZ + 0.38]} tam={[0.08, H, 0.08]} cor="#d8dde4" sombra={false} />))}
      {Array.from({length: 12}).map((_, i) => (<Caixa key={'f' + i} pos={[0, 1.5 + i * 2.1, mastZ - 0.36]} tam={[0.72, 0.05, 0.05]} cor="#ffd23f" sombra={false} />))}
      <Barra a={[0, 3.1, -0.5]} b={[0, 10, mastZ - 0.3]} r={0.12} cor="#5a5f66" />
      <Barra a={[0.2, 3.0, 0.2]} b={[0.2, 6.0, mastZ - 0.35]} r={0.1} cor="#5a5f66" />
      <Caixa pos={[0, H + 1.1, mastZ + 0.2]} tam={[0.9, 0.6, 1.2]} cor="#3a3d44" />
      {/* mesa rotativa (motor hidráulico) */}
      <group position={[0, Math.max(1.4, yCabeca) + 0.8, mastZ + 1.0]}>
        <Caixa tam={[1.4, 1.6, 1.3]} cor="#e8402f" />
        <Caixa pos={[0, 0.82, 0]} tam={[1.2, 0.08, 1.1]} cor="#1d1b26" sombra={false} />
        <Cil pos={[0.75, 0.2, 0]} r={0.08} h={1.2} cor="#1d1b26" seg={6} />
      </group>
      {/* trado: tubo central + hélice, gira */}
      {trado && (
        <group position={[0, Math.max(1.4, yCabeca) - LT, mastZ + 1.0]} rotation={[0, girando ? t * 5 : 0, 0]}>
          <Cil pos={[0, LT / 2, 0]} r={0.1} h={LT} cor="#5a5f66" seg={8} />
          <mesh geometry={helice} castShadow>
            <Mat cor="#8a9099" rugoso={0.5} />
          </mesh>
          <mesh position={[0, -0.15, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.4, 0.4, 24]} />
            <Mat cor="#3a3d44" />
          </mesh>
        </group>
      )}
      {/* mangueira de concreto do topo da torre */}
      <Barra a={[0, H + 0.8, mastZ + 0.6]} b={[0, Math.max(1.4, yCabeca) + 1.6, mastZ + 1.0]} r={0.09} cor="#1d1b26" sombra={false} />
    </group>
  );
};

// caminhão betoneira (frente = +Z local): balão girando e bica
export const Betoneira: React.FC<{pos: V3; rotY?: number; t: number; bica?: boolean}> = ({pos, rotY = 0, t, bica}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.85, 0]} tam={[2.3, 0.35, 8.2]} cor="#2b2b30" />
    <Caixa pos={[0, 2.05, 3.3]} tam={[2.45, 2.1, 1.8]} cor="#f2f2ee" />
    <Caixa pos={[0, 2.45, 4.21]} tam={[2.2, 0.9, 0.04]} cor="#22303c" />
    <Caixa pos={[0, 1.3, 4.22]} tam={[1.7, 0.5, 0.04]} cor="#9aa0aa" />
    {[3.1, -1.2, -2.6].map((z) => [-1, 1].map((s) => (<Cil key={z + ':' + s} pos={[s * 1.1, 0.5, z]} rot={[0, 0, Math.PI / 2]} r={0.5} h={0.35} cor="#1f1f24" seg={12} />)))}
    <group position={[0, 2.6, -1.0]} rotation={[Math.PI / 2 - 0.22, 0, 0]}>
      <group rotation={[0, t * 2.5, 0]}>
        <Cil pos={[0, 0, 0]} r={1.15} r2={1.25} h={2.2} cor="#ff8a1f" seg={14} />
        <Cil pos={[0, 1.9, 0]} r={0.55} r2={1.15} h={1.6} cor="#ff8a1f" seg={14} />
        <Cil pos={[0, -1.6, 0]} r={1.25} r2={0.9} h={1.0} cor="#ff8a1f" seg={14} />
        {[0, 1, 2].map((i) => (<Caixa key={i} pos={[Math.cos(i * 2.1) * 1.2, 0, Math.sin(i * 2.1) * 1.2]} rot={[0, -i * 2.1, 0.4]} tam={[0.1, 2.4, 0.3]} cor="#2f6fd6" />))}
      </group>
    </group>
    {bica && <Barra a={[0, 2.0, -4.3]} b={[0, 1.0, -6.0]} r={0.2} quadrada cor="#9aa0aa" />}
  </group>
);

// caminhão-bomba de concreto com lança articulada (3 braços). alvo = ponta da mangueira
export const Bomba: React.FC<{pos: V3; rotY?: number; alvo: V3}> = ({pos, rotY = 0, alvo}) => {
  const torre: V3 = [pos[0], pos[1] + 3.6, pos[2]];
  // lança em "Z" alto: sobe íngreme da torre, dobra no alto e desce até ficar sobre o ponto de lançamento
  const meio: V3 = [lerp(torre[0], alvo[0], 0.22), Math.max(torre[1], alvo[1]) + 13, lerp(torre[2], alvo[2], 0.22)];
  const cot: V3 = [lerp(torre[0], alvo[0], 0.72), Math.max(torre[1], alvo[1]) + 9, lerp(torre[2], alvo[2], 0.72)];
  const ponta: V3 = [alvo[0], alvo[1] + 5, alvo[2]];
  return (
    <group>
      <group position={pos} rotation={[0, rotY, 0]}>
        <Caixa pos={[0, 0.9, 0]} tam={[2.5, 0.4, 10]} cor="#2b2b30" />
        <Caixa pos={[0, 2.1, 4.1]} tam={[2.5, 2.0, 1.8]} cor="#f2f2ee" />
        <Caixa pos={[0, 2.5, 5.01]} tam={[2.2, 0.85, 0.04]} cor="#22303c" />
        <Caixa pos={[0, 1.7, -1.0]} tam={[2.4, 1.2, 6.5]} cor={amarelo} />
        {[3.9, -0.8, -2.2, -3.6].map((z) => [-1, 1].map((s) => (<Cil key={z + ':' + s} pos={[s * 1.1, 0.5, z]} rot={[0, 0, Math.PI / 2]} r={0.5} h={0.35} cor="#1f1f24" seg={12} />)))}
        {[-1, 1].map((s) => [2.2, -4.2].map((z) => (<group key={s + ':' + z}><Barra a={[s * 1.2, 1.2, z]} b={[s * 3.6, 0.3, z]} r={0.12} quadrada cor={amarelo} /><Caixa pos={[s * 3.6, 0.1, z]} tam={[0.6, 0.2, 0.6]} cor="#5a5f66" /></group>)))}
        <Cil pos={[0, 2.9, 0]} r={0.6} h={1.4} cor={amarelo} seg={12} />
      </group>
      <Barra a={torre} b={meio} r={0.28} quadrada cor={amarelo} />
      <Barra a={meio} b={cot} r={0.24} quadrada cor={amarelo} />
      <Barra a={cot} b={ponta} r={0.2} quadrada cor={amarelo} />
      <Barra a={ponta} b={[alvo[0], alvo[1] + 1.2, alvo[2]]} r={0.12} cor="#1d1b26" />
      <Barra a={[alvo[0], alvo[1] + 1.2, alvo[2]]} b={[alvo[0] + 0.5, alvo[1] + 0.25, alvo[2]]} r={0.12} cor="#1d1b26" />
      {/* tubulação de concreto correndo pela lança */}
      {[[torre, meio], [meio, cot], [cot, ponta]].map(([u, v], i) => (<Barra key={'tb' + i} a={[u[0], u[1] + 0.32, u[2]]} b={[v[0], v[1] + 0.32, v[2]]} r={0.07} cor="#7d838c" sombra={false} />))}
      {[torre, meio, cot].map((p, i) => (<Cil key={i} pos={p} rot={[Math.PI / 2, 0, 0]} r={0.35} h={0.7} cor="#3a3d44" seg={10} />))}
    </group>
  );
};

// tripé da sondagem SPT: martelo de 65 kg cai 75 cm e crava o amostrador
export const TripeSPT: React.FC<{pos: V3; t: number; corte?: boolean}> = ({pos, t}) => {
  const ciclo = (t * 1.1) % 1;
  // sobe devagar (puxado na corda) e cai rápido
  const hM = ciclo < 0.75 ? suave(ciclo / 0.75) * 0.75 : 0.75 * (1 - ((ciclo - 0.75) / 0.25) ** 2);
  const yBate = 1.1;
  return (
    <group position={pos}>
      {[0, 2.1, 4.2].map((a) => (<Barra key={a} a={[Math.cos(a) * 1.7, 0, Math.sin(a) * 1.7]} b={[0, 5.2, 0]} r={0.05} cor="#7d838c" />))}
      <Cil pos={[0, 5.15, 0]} rot={[Math.PI / 2, 0, 0]} r={0.18} h={0.1} cor="#3a3d44" seg={10} />
      {/* haste e cabeça de bater */}
      <Cil pos={[0, yBate / 2 - 0.2, 0]} r={0.025} h={yBate + 0.4} cor="#5a5f66" seg={6} />
      <Cil pos={[0, yBate, 0]} r={0.06} h={0.1} cor="#3a3d44" seg={8} />
      {/* martelo de 65 kg */}
      <Cil pos={[0, yBate + 0.05 + hM + 0.17, 0]} r={0.12} h={0.34} cor="#e8402f" seg={10} />
      <Barra a={[0, yBate + hM + 0.4, 0]} b={[0, 5.1, 0]} r={0.012} cor="#c9a24a" sombra={false} />
      <Barra a={[0.18, 5.1, 0]} b={[1.6, 1.2, 0.6]} r={0.012} cor="#c9a24a" sombra={false} />
      {/* poeira na pancada */}
      {ciclo > 0.95 || ciclo < 0.08 ? (
        <group>
          {[0, 1, 2, 3, 4, 5].map((i) => (<Caixa key={i} pos={[Math.cos(i * 1.05) * 0.32, 0.06 + (i % 2) * 0.05, Math.sin(i * 1.05) * 0.32]} tam={[0.07, 0.07, 0.07]} cor="#c9a77a" sombra={false} />))}
        </group>
      ) : null}
    </group>
  );
};

// solo em corte: bloco de terra com camadas, face cortada em z = zc, de x0 a x1, até 'fundo' de profundidade
export const SoloCorte: React.FC<{x: [number, number]; z0: number; zc: number; fundo?: number; topo?: string; furos?: {x: number; r: number; prof: number}[]}> = ({x, z0, zc, fundo = 26, topo = '#9fc27f'}) => {
  const solo = texSolo();
  return (
    <group>
      <BoxT pos={[(x[0] + x[1]) / 2, -fundo / 2, (z0 + zc) / 2]} tam={[x[1] - x[0], fundo, zc - z0]} cor="#ffffff" map={solo} mu={4} mv={fundo} />
      <Caixa pos={[(x[0] + x[1]) / 2, 0.01, (z0 + zc) / 2]} tam={[x[1] - x[0], 0.02, zc - z0]} cor={topo} sombra={false} />
      {/* régua de profundidade na face do corte */}
      {Array.from({length: Math.floor(fundo / 2) + 1}).map((_, i) => (<Caixa key={i} pos={[x[0] + 0.4, -i * 2, zc + 0.02]} tam={[i % 5 === 0 ? 0.8 : 0.4, 0.06, 0.02]} cor="#1d1b26" sombra={false} />))}
    </group>
  );
};

// vibroacabadora (frente = +X local, despeja o asfalto atrás): esteiras, caçamba com rolos de empurrar,
// rosca distribuidora girando e mesa vibratória atrás; posto do operador com toldo
export const Vibroacabadora: React.FC<{pos: V3; t: number; incl?: number}> = ({pos, t, incl = 0}) => {
  const vib = Math.sin(t * 40) * 0.008;
  return (
    <group position={pos} rotation={[0, 0, incl]}>
      {/* esteiras ao longo de X, por fora do chassi */}
      {[-1, 1].map((s) => (
        <group key={'e' + s} position={[0.3, 0, s * 1.05]} rotation={[0, Math.PI / 2, 0]}>
          <Esteira pos={[0, 0, 0]} len={3.0} larg={0.42} alt={0.62} />
        </group>
      ))}
      {/* chassi e cofre do motor com grade */}
      <Caixa pos={[0.3, 0.75, 0]} tam={[3.0, 0.3, 1.66]} cor="#3a3d44" />
      <Caixa pos={[0.15, 1.3, 0]} tam={[1.9, 0.8, 1.7]} cor={amarelo} />
      {[0, 1, 2, 3, 4].map((i) => (<Caixa key={'g' + i} pos={[0.15 - 0.6 + i * 0.3, 1.35, 0.86]} tam={[0.14, 0.5, 0.02]} cor="#2b2b30" sombra={false} />))}
      <Caixa pos={[0.15, 1.72, 0]} tam={[1.95, 0.05, 1.75]} cor="#e0a800" sombra={false} />
      <BoxT pos={[0.15, 1.3, -0.86]} tam={[1.4, 0.32, 0.02]} cor="#ffffff" map={texLetreiro('PAVIMENTA', '#1d1b26', amarelo)} mu={1.4} mv={0.32} sombra={false} />
      {/* escapamento */}
      <Cil pos={[0.7, 2.1, 0.5]} r={0.07} h={0.8} cor="#2b2b30" seg={8} />
      {/* caçamba na frente (abas abertas) + rolos de empurrar o caminhão */}
      <Caixa pos={[1.95, 0.75, 0]} tam={[1.1, 0.12, 1.9]} cor="#3a3d44" />
      {[-1, 1].map((s) => (<Caixa key={'aba' + s} pos={[1.95, 1.12, s * 1.15]} rot={[s * 0.5, 0, 0]} tam={[1.1, 0.7, 0.06]} cor={amarelo} />))}
      <Caixa pos={[2.45, 1.0, 0]} tam={[0.08, 0.45, 1.9]} cor="#e0a800" />
      <Caixa pos={[1.95, 0.84, 0]} tam={[1.0, 0.06, 1.7]} cor="#2b2b30" sombra={false} />
      {[-0.55, 0.55].map((z) => (
        <group key={'rp' + z} position={[2.68, 0.42, z]}>
          <Cil rot={[Math.PI / 2, 0, 0]} r={0.2} h={0.5} cor="#6f747c" seg={12} />
          <Cil rot={[Math.PI / 2, 0, 0]} r={0.06} h={0.56} cor="#2b2b30" seg={8} />
        </group>
      ))}
      {/* rosca distribuidora (espalha o asfalto na largura) */}
      <group position={[-1.35, 0.28, 0]}>
        <Cil rot={[Math.PI / 2, 0, 0]} r={0.06} h={3.4} cor="#5a5f66" seg={8} />
        {Array.from({length: 14}).map((_, i) => (
          <Caixa key={'r' + i} pos={[0, 0, -1.6 + i * 0.245]} rot={[0, 0, t * 9 + i * 0.7 * (i < 7 ? 1 : -1)]} tam={[0.4, 0.05, 0.06]} cor="#8a9099" sombra={false} />
        ))}
        <Caixa pos={[0, 0.02, 0]} tam={[0.5, 0.18, 3.0]} cor="#1d1b26" sombra={false} />
      </group>
      {/* mesa vibratória (aquecida) com extensões laterais */}
      <group position={[-1.95, 0.32 + vib, 0]}>
        <Caixa tam={[0.7, 0.5, 3.0]} cor="#3a3d44" />
        {[-1, 1].map((s) => (<Caixa key={'ex' + s} pos={[0, 0, s * 1.75]} tam={[0.66, 0.46, 0.5]} cor={amarelo} />))}
        {[-1, 1].map((s) => (<Caixa key={'pl' + s} pos={[0.1, 0.05, s * 2.02]} tam={[0.9, 0.6, 0.04]} cor="#e0a800" />))}
        <Caixa pos={[-0.36, 0.08, 0]} tam={[0.03, 0.12, 3.9]} cor="#ffc21f" sombra={false} />
        <Caixa pos={[-0.37, -0.12, 0]} tam={[0.02, 0.06, 3.9]} cor="#ff7a3a" sombra={false} />
        {/* passarela do mesista */}
        <Caixa pos={[-0.5, 0.15, 0]} tam={[0.35, 0.04, 3.6]} cor="#5a5f66" />
      </group>
      {/* posto do operador: banco, painel, volante e toldo */}
      <Caixa pos={[-0.95, 1.75, 0]} tam={[0.9, 0.08, 1.7]} cor="#5a5f66" />
      <Caixa pos={[-1.05, 2.0, 0.45]} tam={[0.45, 0.4, 0.45]} cor="#2b2b30" />
      <Caixa pos={[-0.6, 2.15, -0.2]} tam={[0.25, 0.7, 0.6]} cor="#3a3d44" />
      <Caixa pos={[-0.62, 2.35, -0.2]} tam={[0.2, 0.18, 0.5]} cor="#22303c" sombra={false} />
      <mesh position={[-0.75, 2.5, -0.2]} rotation={[0, 0, 0.9]}><torusGeometry args={[0.16, 0.025, 8, 20]} /><Mat cor="#1d1b26" /></mesh>
      {[[-1.35, -0.75], [-1.35, 0.75], [-0.25, -0.75], [-0.25, 0.75]].map(([x, z], i) => (<Barra key={'pt' + i} a={[x, 1.75, z]} b={[x, 3.05, z]} r={0.035} cor="#2b2b30" />))}
      <Caixa pos={[-0.8, 3.1, 0]} tam={[1.5, 0.08, 1.8]} cor={amarelo} />
      <Caixa pos={[-0.8, 3.16, 0]} tam={[1.3, 0.04, 1.6]} cor="#e0a800" sombra={false} />
      <Cil pos={[-0.8, 3.25, 0]} r={0.09} h={0.14} cor={Math.floor(t * 3) % 2 ? '#ff8a1f' : '#ffb000'} seg={10} />
    </group>
  );
};
// rolo compactador tandem: dois cilindros de aço que giram, quadros amarelos, cabine com toldo e tanque d'água
export const Rolo: React.FC<{pos: V3; incl?: number; giro?: number}> = ({pos, incl = 0, giro = 0}) => (
  <group position={pos} rotation={[0, 0, incl]}>
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 1.5, 0.62, 0]}>
        <group rotation={[0, 0, -giro]}>
          <Cil rot={[Math.PI / 2, 0, 0]} r={0.62} h={1.7} cor="#8a9099" seg={16} />
          {[0, 1, 2, 3].map((k) => (<Caixa key={k} rot={[0, 0, (k * Math.PI) / 4]} tam={[1.25, 0.04, 1.72]} cor="#6f747c" sombra={false} />))}
        </group>
        {/* quadro do cilindro */}
        {[-1, 1].map((z) => (<Caixa key={z} pos={[0, 0.15, z * 0.9]} tam={[1.5, 0.95, 0.08]} cor={amarelo} />))}
        <Caixa pos={[0, 0.72, 0]} tam={[1.4, 0.1, 1.9]} cor={amarelo} />
        <Cil rot={[Math.PI / 2, 0, 0]} r={0.12} h={1.9} cor="#2b2b30" seg={10} />
      </group>
    ))}
    {/* chassi articulado e motor */}
    <Caixa pos={[0, 1.1, 0]} tam={[1.6, 0.7, 1.5]} cor={amarelo} />
    {[0, 1, 2, 3].map((i) => (<Caixa key={'g' + i} pos={[-0.45 + i * 0.3, 1.1, 0.76]} tam={[0.14, 0.45, 0.02]} cor="#2b2b30" sombra={false} />))}
    <Caixa pos={[0.9, 1.55, 0]} tam={[0.6, 0.35, 1.3]} cor="#2f6fd6" />
    <Caixa pos={[0, 1.48, 0]} tam={[1.65, 0.06, 1.55]} cor="#e0a800" sombra={false} />
    {/* posto do operador */}
    <Caixa pos={[-0.2, 1.75, 0]} tam={[0.5, 0.4, 0.5]} cor="#2b2b30" />
    {[[-0.75, -0.7], [-0.75, 0.7], [0.45, -0.7], [0.45, 0.7]].map(([x, z], i) => (<Barra key={'pt' + i} a={[x, 1.45, z]} b={[x, 2.9, z]} r={0.04} cor="#2b2b30" />))}
    <Caixa pos={[-0.15, 2.95, 0]} tam={[1.5, 0.08, 1.6]} cor={amarelo} />
    <Cil pos={[-0.15, 3.05, 0]} r={0.08} h={0.12} cor="#ff8a1f" seg={10} />
  </group>
);

// caminhão basculante (frente = +Z local)
export const Basculante: React.FC<{pos: V3; rotY?: number; cor?: string; carga?: string; incl?: number}> = ({pos, rotY = 0, cor = '#2f6fd6', carga = '#8d6a45', incl = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <group rotation={[-incl, 0, 0]}>
      <Caixa pos={[0, 0.85, 0]} tam={[2.4, 0.35, 7.5]} cor="#2b2b30" />
      <Caixa pos={[0, 2.0, 2.9]} tam={[2.45, 2.0, 1.7]} cor={cor} />
      <Caixa pos={[0, 2.4, 3.76]} tam={[2.2, 0.85, 0.04]} cor="#22303c" />
      <Caixa pos={[0, 2.0, -1.0]} tam={[2.5, 1.5, 5.0]} cor="#d9d4c7" />
      <Caixa pos={[0, 2.8, -1.0]} tam={[2.3, 0.2, 4.8]} cor={carga} />
      {[2.8, -1.6, -2.9].map((z) => [-1, 1].map((s) => (<Cil key={z + ':' + s} pos={[s * 1.1, 0.5, z]} rot={[0, 0, Math.PI / 2]} r={0.5} h={0.35} cor="#1f1f24" seg={12} />)))}
    </group>
  </group>
);

// operário com colete refletivo (noite: colete laranja aceso)
export const OPERARIO_NOITE: Visual = {...OBREIRO, colete: '#ffb347'};
export const Operario = Boneco;
export const corAco = '#7d838c';
export {Caixa, Cil, Barra};
