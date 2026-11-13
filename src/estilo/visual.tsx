// PADRÃO VISUAL de produção (aprovado pelo Fernando em 12/11/2026, ver lab/antes-depois.png):
// 3D "toy" arredondado, sombreamento suave, luz de estúdio. Tudo em escala real (1 unidade = 1 metro).
import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

export type V3 = [number, number, number];

// ---------- paleta (quente, harmônica; o azul do Zé é o contraponto frio) ----------
export const PAL = {
  creme: '#f4e9d8',
  parede: '#efe2cf',
  paredeFundo: '#a9c4b3', // verde sálvia
  rodape: '#fbf7f0',
  madeira: '#c48a55',
  madeiraEsc: '#8a5a3b',
  terracota: '#d9774b',
  mostarda: '#e7b347',
  petroleo: '#2f7f7a',
  marinho: '#2d4a6b',
  coral: '#e4685d',
  folha: '#4f9a5b',
  folhaEsc: '#2f6e44',
  latao: '#c9a14a',
  linho: '#efe3cf',
};

// ---------- chaves de qualidade ----------
// Padrão = perfil OTIMIZADO (1 sombra PCF, sol da janela como decalque, environment só nos materiais brilhantes).
// "luxo" volta o perfil caro (2 sombras VSM, environment em tudo, luz do abajur, esferas cheias).
// desl: vsm,sol,env,ponto,rim,fisico,aa (desligam um recurso), mapa2k, seg75 (sobem qualidade); só para medir custo.
export const QUAL = {vsm: false, sol: false, mapa: 1024, envGlobal: false, envBrilho: true, ponto: false, rim: true, fisico: true, aa: true, seg: 0.5, segCaixa: 3};
export const aplicarDesl = (desl?: string) => {
  const d = new Set((desl ?? '').split(',').filter(Boolean));
  const luxo = d.has('luxo');
  QUAL.vsm = luxo && !d.has('vsm');
  QUAL.sol = luxo && !d.has('sol');
  QUAL.mapa = luxo || d.has('mapa2k') ? 2048 : 1024;
  QUAL.envGlobal = luxo && !d.has('env');
  QUAL.envBrilho = !d.has('env');
  QUAL.ponto = luxo && !d.has('ponto');
  QUAL.rim = !d.has('rim');
  QUAL.fisico = !d.has('fisico');
  QUAL.aa = !d.has('aa');
  QUAL.segCaixa = luxo ? 5 : 3;
  QUAL.seg = luxo ? 1 : d.has('seg75') ? 0.75 : 0.5;
};

// environment (PMREM) por renderer: cada canvas tem o seu
const ENV = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();
const envDe = (gl: THREE.WebGLRenderer) => {
  let t = ENV.get(gl);
  if (!t) {
    const pm = new THREE.PMREMGenerator(gl);
    t = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    ENV.set(gl, t);
  }
  return t;
};

// ---------- materiais: SEM flatShading, rugosidade por tipo de superfície ----------
export const MN: React.FC<{cor: string; r?: number; metal?: number; map?: THREE.Texture | null; emissivo?: string; ei?: number; lado?: THREE.Side}> = ({
  cor,
  r = 0.75,
  metal = 0,
  map,
  emissivo,
  ei = 1,
  lado,
}) => <meshStandardMaterial color={cor} roughness={r} metalness={metal} map={map ?? null} emissive={emissivo ?? '#000000'} emissiveIntensity={ei} side={lado ?? THREE.FrontSide} />;

// verniz / plástico brilhante (olhos, cerâmica, laca)
export const MBrilho: React.FC<{cor: string; r?: number}> = ({cor, r = 0.25}) => {
  const {gl} = useThree();
  const env = QUAL.envBrilho && !QUAL.envGlobal ? envDe(gl) : null;
  return QUAL.fisico ? (
    <meshPhysicalMaterial color={cor} roughness={r} clearcoat={1} clearcoatRoughness={0.08} envMap={env} envMapIntensity={0.8} />
  ) : (
    <meshStandardMaterial color={cor} roughness={r} envMap={env} envMapIntensity={0.8} />
  );
};

// ---------- caixa arredondada (geometria em cache por medida) ----------
const geoCache = new Map<string, THREE.BufferGeometry>();
export const geoArred = (w: number, h: number, d: number, raio: number, seg = 4) => {
  const k = `${w}|${h}|${d}|${raio}|${seg}`;
  let g = geoCache.get(k);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, seg, Math.min(raio, w / 2, h / 2, d / 2) - 1e-4);
    geoCache.set(k, g);
  }
  return g;
};

type Base = {pos?: V3; rot?: V3 | number; sombra?: boolean};
const rotV = (r?: V3 | number): V3 => (typeof r === 'number' ? [0, r, 0] : r ?? [0, 0, 0]);

export const CaixaR: React.FC<Base & {tam: V3; raio?: number; cor: string; r?: number; map?: THREE.Texture | null; seg?: number}> = ({pos = [0, 0, 0], rot, tam, raio = 0.03, cor, r, map, sombra = true, seg}) => (
  <mesh position={pos} rotation={rotV(rot)} geometry={geoArred(tam[0], tam[1], tam[2], raio, Math.min(seg ?? 4, QUAL.segCaixa))} castShadow={sombra} receiveShadow>
    <MN cor={cor} r={r} map={map} />
  </mesh>
);

export const CilN: React.FC<Base & {r: number; r2?: number; h: number; cor: string; rug?: number; metal?: number; aberto?: boolean}> = ({pos = [0, 0, 0], rot, r, r2, h, cor, rug, metal, aberto, sombra = true}) => (
  <mesh position={pos} rotation={rotV(rot)} castShadow={sombra} receiveShadow>
    <cylinderGeometry args={[r, r2 ?? r, h, 40, 1, aberto]} />
    <MN cor={cor} r={rug} metal={metal} lado={aberto ? THREE.DoubleSide : undefined} />
  </mesh>
);

export const Bola: React.FC<Base & {r: number; cor: string; esc?: V3; rug?: number}> = ({pos = [0, 0, 0], rot, r, cor, esc = [1, 1, 1], rug, sombra = true}) => (
  <mesh position={pos} rotation={rotV(rot)} scale={esc} castShadow={sombra} receiveShadow>
    <sphereGeometry args={[r, Math.round(32 * QUAL.seg), Math.round(20 * QUAL.seg)]} />
    <MN cor={cor} r={rug} />
  </mesh>
);

// sólido de revolução a partir de um perfil [raio, altura] (vasos, xícaras, abajur)
export const Torno: React.FC<Base & {perfil: [number, number][]; cor: string; rug?: number; brilho?: boolean; lado?: THREE.Side}> = ({pos = [0, 0, 0], rot, perfil, cor, rug, brilho, lado, sombra = true}) => {
  const g = useMemo(() => new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), 40), [JSON.stringify(perfil)]);
  return (
    <mesh position={pos} rotation={rotV(rot)} geometry={g} castShadow={sombra} receiveShadow>
      {brilho ? <MBrilho cor={cor} r={rug} /> : <MN cor={cor} r={rug} lado={lado} />}
    </mesh>
  );
};

// sombra de contato falsa (oclusão no chão), barata: um disco com degradê radial
export const SombraContato: React.FC<{pos: V3; raio: number; esc?: [number, number]; forca?: number}> = ({pos, raio, esc = [1, 1], forca = 0.45}) => (
  <mesh position={[pos[0], pos[1] + 0.004, pos[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[esc[0], esc[1], 1]} renderOrder={1}>
    <circleGeometry args={[raio, 40]} />
    <meshBasicMaterial map={texRadial()} transparent opacity={forca} depthWrite={false} color="#3a2a1c" />
  </mesh>
);

// ---------- texturas procedurais (geradas uma vez) ----------
const texCache = new Map<string, THREE.Texture>();
export function texN(id: string, w: number, h: number, pinta: (g: CanvasRenderingContext2D) => void, srgb = true) {
  const c0 = texCache.get(id);
  if (c0) return c0;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  pinta(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  texCache.set(id, t);
  return t;
}
const rnd = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};

export const texRadial = () =>
  texN('radial', 128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });

// assoalho de tábuas (8 tábuas de 18 cm = 1,44 m por repetição), com veio e junta
export const texAssoalho = () =>
  texN('assoalho', 1024, 1024, (g) => {
    const r = rnd(3);
    const tons = ['#c99062', '#bf8456', '#d39d6c', '#b97c4f', '#c78c5c'];
    const n = 8;
    const ph = 1024 / n;
    for (let i = 0; i < n; i++) {
      let x = -r() * 600;
      while (x < 1024) {
        const len = 500 + r() * 500;
        g.fillStyle = tons[Math.floor(r() * tons.length)];
        g.fillRect(x, i * ph, len, ph);
        for (let k = 0; k < 9; k++) {
          g.strokeStyle = `rgba(90,50,25,${0.05 + r() * 0.08})`;
          g.lineWidth = 1 + r() * 2;
          g.beginPath();
          const y0 = i * ph + 6 + r() * (ph - 12);
          g.moveTo(x, y0);
          g.bezierCurveTo(x + len * 0.3, y0 + (r() - 0.5) * 14, x + len * 0.7, y0 + (r() - 0.5) * 14, x + len, y0);
          g.stroke();
        }
        g.fillStyle = 'rgba(60,35,20,0.55)';
        g.fillRect(x, i * ph, 3, ph);
        x += len;
      }
      g.fillStyle = 'rgba(60,35,20,0.5)';
      g.fillRect(0, i * ph, 1024, 3);
    }
  });

// tapete com padrão geométrico (losangos), borda e franja desenhada
export const texTapete = () =>
  texN('tapete', 1024, 720, (g) => {
    g.fillStyle = '#f3e7d2';
    g.fillRect(0, 0, 1024, 720);
    g.fillStyle = PAL.marinho;
    g.fillRect(40, 40, 944, 640);
    g.fillStyle = '#f3e7d2';
    g.fillRect(64, 64, 896, 592);
    g.fillStyle = PAL.terracota;
    g.fillRect(84, 84, 856, 552);
    g.fillStyle = '#f6ecdc';
    g.fillRect(100, 100, 824, 520);
    const cores = [PAL.mostarda, PAL.petroleo, PAL.terracota];
    for (let iy = 0; iy < 4; iy++)
      for (let ix = 0; ix < 6; ix++) {
        const cx = 170 + ix * 137;
        const cy = 175 + iy * 123;
        g.fillStyle = cores[(ix + iy) % 3];
        g.beginPath();
        g.moveTo(cx, cy - 50);
        g.lineTo(cx + 55, cy);
        g.lineTo(cx, cy + 50);
        g.lineTo(cx - 55, cy);
        g.closePath();
        g.fill();
        g.fillStyle = '#f6ecdc';
        g.beginPath();
        g.moveTo(cx, cy - 22);
        g.lineTo(cx + 24, cy);
        g.lineTo(cx, cy + 22);
        g.lineTo(cx - 24, cy);
        g.closePath();
        g.fill();
      }
    // textura de trama
    const r = rnd(9);
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
      g.fillRect(r() * 1024, r() * 720, 2, 2);
    }
    for (let x = 0; x < 1024; x += 8) {
      g.fillStyle = '#efe0c6';
      g.fillRect(x, 0, 4, 34);
      g.fillRect(x, 686, 4, 34);
    }
  });

// quadro: paisagem abstrata na paleta
export const texQuadro = () =>
  texN('quadro', 512, 640, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 640);
    gr.addColorStop(0, '#f6d7b0');
    gr.addColorStop(1, '#f1b98a');
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 640);
    g.fillStyle = '#fff1d6';
    g.beginPath();
    g.arc(340, 220, 90, 0, Math.PI * 2);
    g.fill();
    const morro = (y: number, a: number, cor: string, f: number) => {
      g.fillStyle = cor;
      g.beginPath();
      g.moveTo(0, 640);
      for (let x = 0; x <= 512; x += 16) g.lineTo(x, y + Math.sin(x / 512 * Math.PI * f + a) * 50);
      g.lineTo(512, 640);
      g.fill();
    };
    morro(380, 0.5, PAL.terracota, 1.4);
    morro(450, 2.2, PAL.petroleo, 1.1);
    morro(530, 4.0, PAL.marinho, 1.7);
  });

// lombadas de livro: faixas claras perto do topo e da base
export const texLombada = () =>
  texN('lombada', 64, 256, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 64, 256);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(0, 30, 64, 10);
    g.fillRect(0, 216, 64, 10);
    g.fillStyle = 'rgba(255,255,255,0.0)';
  });

// céu visto da janela (emissivo)
export const texCeuJanela = () =>
  texN('ceuJanela', 256, 512, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, '#8ec5f0');
    gr.addColorStop(0.65, '#dff0fb');
    gr.addColorStop(1, '#fff3dc');
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 512);
  });

// pintura de parede com leve variação (tira o "paredão de uma cor")
export const texParede = (base: string) =>
  texN('parede:' + base, 512, 512, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 512);
    const r = rnd(5);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.03)';
      g.beginPath();
      g.arc(r() * 512, r() * 512, 10 + r() * 40, 0, Math.PI * 2);
      g.fill();
    }
  });

// ---------- ambiente: environment map (sem download), névoa e tone mapping ----------
export const Ambiente: React.FC<{nevoa?: string; perto?: number; longe?: number; env?: number; exposicao?: number}> = ({nevoa = '#efe2cf', perto = 9, longe = 26, env = 0.45, exposicao = 1.0}) => {
  const {gl, scene} = useThree();
  const fog = useMemo(() => new THREE.Fog(nevoa, perto, longe), [nevoa, perto, longe]);
  scene.environment = QUAL.envGlobal ? envDe(gl) : null;
  scene.environmentIntensity = env;
  scene.fog = fog;
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = exposicao;
  return null;
};

// câmera fixa (mesmo enquadramento nos dois padrões)
export const CamFixa: React.FC<{pos: V3; alvo: V3; fov: number}> = ({pos, alvo, fov}) => {
  const {camera} = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = fov;
  cam.position.set(...pos);
  cam.lookAt(...alvo);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  return null;
};


// ---------- LUZ DE ESTÚDIO dos motores de vídeo (perfil OTIMIZADO do lab) ----------
// hemisférica + 1 direcional com sombra PCF soft 1024 centrada no que a câmera olha + contraluz fria
// (direcional sem sombra que vem de trás do assunto, separa o Zé do fundo) + ACES + névoa leve.
// Noite nunca é preta: céu azul-marinho, lua azulada e uma fonte quente baixa.
export type LuzCfg = {hemi: [string, string, number]; sol: [string, number]; dir: V3};
export const NOITE_MIN = {hemi: ['#6f8fd8', '#3a3550', 1.05] as [string, string, number], lua: ['#b9cbff', 1.1] as [string, number], quente: ['#ffad5c', 0.55] as [string, number]};

const corMin = (a: string, b: string, k: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();

export const LuzEstudio: React.FC<{
  L: LuzCfg;
  alvo: V3;
  R: number; // meia largura da área com sombra (m)
  noite?: boolean;
  nevoa?: [string, number, number] | null; // [cor, perto, longe]; sem = névoa leve automática
  corNevoa?: string;
  rim?: number;
  exposicao?: number;
}> = ({L, alvo, R, noite = false, nevoa, corNevoa = '#dfe9f2', rim = 1, exposicao = 1}) => {
  const {gl, scene, camera} = useThree();
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = exposicao;
  if (gl.shadowMap.type !== THREE.PCFSoftShadowMap) {
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.shadowMap.needsUpdate = true;
  }
  scene.environment = null;
  // névoa: a do cenário, ou uma leve que só tinge o fundo distante (perspectiva aérea)
  const dist = camera.position.distanceTo(new THREE.Vector3(...alvo));
  const nv: [string, number, number] = nevoa ?? [corNevoa, Math.max(18, dist * 2.4), Math.max(18, dist * 2.4) * 6];
  const fog = useMemo(() => new THREE.Fog(nv[0], nv[1], nv[2]), [nv[0], Math.round(nv[1] * 10), Math.round(nv[2] * 10)]);
  scene.fog = fog;

  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(alvo[0], alvo[1], alvo[2]);
  tgt.updateMatrixWorld();
  const n = Math.hypot(...L.dir) || 1;
  const pos: V3 = [alvo[0] + (L.dir[0] / n) * R * 2, alvo[1] + (L.dir[1] / n) * R * 2, alvo[2] + (L.dir[2] / n) * R * 2];
  // contraluz: vem de trás do assunto (lado oposto à câmera) e de cima
  const fwd = new THREE.Vector3(alvo[0] - camera.position.x, 0, alvo[2] - camera.position.z);
  if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1);
  fwd.normalize();
  const rimPos: V3 = [alvo[0] + fwd.x * 10, alvo[1] + 7, alvo[2] + fwd.z * 10];
  const quentePos: V3 = [alvo[0] - L.dir[0] * 10, alvo[1] + 2.5, alvo[2] - L.dir[2] * 10];

  const hemi: [string, string, number] = noite
    ? [corMin(L.hemi[0], NOITE_MIN.hemi[0], 0.7), corMin(L.hemi[1], NOITE_MIN.hemi[1], 0.6), Math.max(L.hemi[2], NOITE_MIN.hemi[2])]
    : L.hemi;
  const sol: [string, number] = noite ? [corMin(L.sol[0], NOITE_MIN.lua[0], 0.5), Math.max(L.sol[1], NOITE_MIN.lua[1])] : L.sol;
  return (
    <>
      <primitive object={tgt} />
      <hemisphereLight args={hemi} />
      <directionalLight target={tgt} position={pos} color={sol[0]} intensity={sol[1]} castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-R} shadow-camera-right={R} shadow-camera-top={R} shadow-camera-bottom={-R} shadow-camera-near={0.5} shadow-camera-far={R * 5} shadow-bias={-0.0005} shadow-normalBias={0.02} />
      {rim > 0 && <directionalLight userData={{vd: true, rim: true}} target={tgt} position={rimPos} color={noite ? '#a9c4ff' : '#dfeaff'} intensity={(noite ? 1.3 : 1.1) * rim} />}
      {noite && <directionalLight userData={{vd: true}} target={tgt} position={quentePos} color={NOITE_MIN.quente[0]} intensity={NOITE_MIN.quente[1]} />}
    </>
  );
};

// ---------- LUZ POR BATIDA (referências do Fernando, 12/11): dia = normal, dourado = drama/queda, azul-noite = explicação ----------
// Opção por plano no roteiro: "batida": "dia" | "drama" | "noite". Sem batida, vale a luz do cenário.
export type Batida = 'dia' | 'drama' | 'noite';
export const LUZ_BATIDA: Record<Batida, LuzCfg> = {
  dia: {hemi: ['#ffffff', '#b9a57a', 1.05], sol: ['#fff2dc', 2.1], dir: [0.45, 0.8, 0.4]},
  drama: {hemi: ['#ffd7a3', '#6a4030', 0.85], sol: ['#ffae55', 2.5], dir: [-0.75, 0.32, 0.55]},
  noite: {hemi: ['#6f8fd8', '#2e2c48', 1.0], sol: ['#b9cbff', 1.1], dir: [0.3, 0.8, 0.5]},
};
// céu (degradê de fundo) e cor da névoa (= horizonte, a 2ª cor) de cada batida
export const CEU_BATIDA: Record<Batida, [string, string]> = {
  dia: ['#6fbcf2', '#fdf0d8'],
  drama: ['#e9874a', '#ffd9a0'],
  noite: ['#14224d', '#3b4f8c'],
};
export const luzDaBatida = (b: Batida | undefined, base: LuzCfg, noiteBase = false): {L: LuzCfg; noite: boolean} =>
  b ? {L: LUZ_BATIDA[b], noite: b === 'noite'} : {L: base, noite: noiteBase};

// ---------- MIXAGEM: voz em 1; trilha e efeitos ~6 dB abaixo (0,5 de amplitude) ----------
export const MIX = {voz: 1, trilha: 0.5, sfx: 0.5};
export const vSfx = (v: number) => Math.min(v, MIX.sfx);

// ---------- FUNDO DE HORIZONTE para cena externa: morros, árvores e casinhas num anel distante ----------
// Barato (InstancedMesh, sem sombra). A névoa da LuzEstudio tinge tudo da cor do horizonte = profundidade.
// Uso por set: horizonte: true (ou {raio, y}) nos motores Obra, História, Caso e Rico.
const rndH = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};
const InstH: React.FC<{geo: THREE.BufferGeometry; mats: THREE.Matrix4[]; cor: string; rug?: number}> = ({geo, mats, cor, rug = 0.95}) => {
  const ref = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    mats.forEach((mx, i) => m.setMatrixAt(i, mx));
    m.instanceMatrix.needsUpdate = true;
  }, [mats]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, mats.length]} frustumCulled={false}>
      <meshStandardMaterial color={cor} roughness={rug} />
    </instancedMesh>
  );
};
export const FundoHorizonte: React.FC<{centro?: V3; raio?: number; y?: number; seed?: number}> = ({centro = [0, 0, 0], raio = 140, y = 0, seed = 7}) => {
  const d = useMemo(() => {
    const r = rndH(seed);
    const M = (x: number, yy: number, z: number, sx: number, sy: number, sz: number, ry = 0) =>
      new THREE.Matrix4().compose(new THREE.Vector3(centro[0] + x, y + yy, centro[2] + z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz));
    const morros: THREE.Matrix4[] = [], morros2: THREE.Matrix4[] = [], copas: THREE.Matrix4[] = [], troncos: THREE.Matrix4[] = [], casas: THREE.Matrix4[] = [], telhados: THREE.Matrix4[] = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + r() * 0.2;
      const rr = raio * (1.05 + r() * 0.35);
      const w = raio * (0.18 + r() * 0.16);
      (i % 2 ? morros : morros2).push(M(Math.cos(a) * rr, -w * 0.15, Math.sin(a) * rr, w, w * (0.35 + r() * 0.3), w));
    }
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2;
      const rr = raio * (0.72 + r() * 0.28);
      const h = 4 + r() * 5;
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      troncos.push(M(x, h * 0.25, z, 0.5, h * 0.5, 0.5));
      copas.push(M(x, h * 0.65, z, h * 0.38, h * 0.42, h * 0.38));
    }
    for (let i = 0; i < 24; i++) {
      const a = r() * Math.PI * 2;
      const rr = raio * (0.8 + r() * 0.2);
      const w = 6 + r() * 4;
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      casas.push(M(x, 2.2, z, w, 4.4, w * 0.8, -a));
      telhados.push(M(x, 5.6, z, w * 0.78, 2.4, w * 0.62, -a + Math.PI / 4));
    }
    return {morros, morros2, copas, troncos, casas, telhados};
  }, [centro[0], centro[2], raio, y, seed]);
  const g = useMemo(() => ({esf: new THREE.SphereGeometry(1, 20, 12), cil: new THREE.CylinderGeometry(1, 1, 1, 8), cx: new THREE.BoxGeometry(1, 1, 1), tel: new THREE.ConeGeometry(1, 1, 4)}), []);
  return (
    <group>
      <InstH geo={g.esf} mats={d.morros} cor="#7fb46a" />
      <InstH geo={g.esf} mats={d.morros2} cor="#6aa35d" />
      <InstH geo={g.cil} mats={d.troncos} cor="#7a5537" />
      <InstH geo={g.esf} mats={d.copas} cor="#4f9a5b" />
      <InstH geo={g.cx} mats={d.casas} cor="#efe2cf" />
      <InstH geo={g.tel} mats={d.telhados} cor="#c8643f" />
    </group>
  );
};
