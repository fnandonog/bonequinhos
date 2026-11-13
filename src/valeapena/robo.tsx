// ROBÔ ASPIRADOR detalhado + CASA real (perfil Vale a Pena?). 1 unidade = 1 metro.
// Robô da faixa R$ 299 (sem LiDAR): Ø 33 cm × 7,8 cm, 1 escovinha lateral, rolo central, 2 rodas de tração + roda boba,
// para-choque com sensor IR, botão com LED, depósito de 0,3 L com filtro, motor de sucção, bateria 4 células, placa.
// `explode` separa as camadas (vista explodida); `corte` tira a tampa e um quarto da carcaça (raio-x).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, Instancias, Visual, clamp01, lerp, suave, texPilula} from '../v4/kit';
import {texCanvas} from '../cozinha/pecas';
import {texTexto, Placa, Medidor, Meia, Moeda, Cabo, TESTADOR} from './pecas';

const F = "'Baloo 2', sans-serif";
export const rng = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};

// ---------- primitivas com material próprio (liso, com brilho/metal quando precisa) ----------
type MP = {c: string; rug?: number; met?: number; e?: string; ei?: number; op?: number; dupla?: boolean; costas?: boolean; map?: THREE.Texture | null; flat?: boolean};
const Mt: React.FC<MP> = ({c, rug = 0.6, met = 0, e, ei = 1, op = 1, dupla, costas, map, flat}) => (
  <meshStandardMaterial color={c} roughness={rug} metalness={met} emissive={e ?? '#000000'} emissiveIntensity={e ? ei : 0} transparent={op < 1} opacity={op}
    depthWrite={op >= 1} side={costas ? THREE.BackSide : dupla ? THREE.DoubleSide : THREE.FrontSide} map={map ?? null} />
);
type GP = MP & {p?: V3; rot?: V3; sombra?: boolean; esc?: V3};
export const Bx: React.FC<GP & {s: V3}> = ({p = [0, 0, 0], rot = [0, 0, 0], s, sombra = true, esc, ...m}) => (
  <mesh position={p} rotation={rot} scale={esc ?? [1, 1, 1]} castShadow={sombra && (m.op ?? 1) >= 1} receiveShadow>
    <boxGeometry args={s} />
    <Mt {...m} />
  </mesh>
);
export const Cy: React.FC<GP & {r: number; r2?: number; h: number; seg?: number; aberto?: boolean; t0?: number; tl?: number}> = ({p = [0, 0, 0], rot = [0, 0, 0], r, r2, h, seg = 24, aberto, t0 = 0, tl = Math.PI * 2, sombra = true, esc, ...m}) => (
  <mesh position={p} rotation={rot} scale={esc ?? [1, 1, 1]} castShadow={sombra && (m.op ?? 1) >= 1} receiveShadow>
    <cylinderGeometry args={[r2 ?? r, r, h, seg, 1, !!aberto, t0, tl]} />
    <Mt {...m} />
  </mesh>
);
const Esf: React.FC<GP & {r: number}> = ({p = [0, 0, 0], rot = [0, 0, 0], r, esc, sombra = true, ...m}) => (
  <mesh position={p} rotation={rot} scale={esc ?? [1, 1, 1]} castShadow={sombra}>
    <sphereGeometry args={[r, 20, 14]} />
    <Mt {...m} />
  </mesh>
);

// plaquinha flutuante (sempre legível, tamanho fixo na tela)
export const Pill: React.FC<{texto: string; pos: V3; fundo?: string; cor?: string; vis?: number; tam?: number}> = ({texto, pos, fundo = '#ffffff', cor = '#1d1b26', vis = 1, tam = 1}) =>
  vis > 0.01 ? (
    <sprite position={pos} scale={[0.17 * suave(vis) * tam, 0.04 * suave(vis) * tam, 1]} renderOrder={10}>
      <spriteMaterial map={texPilula(texto, fundo, cor)} depthTest={false} sizeAttenuation={false} />
    </sprite>
  ) : null;

// ---------- texturas ----------
const texTopo = (k: 'branco' | 'preto') =>
  texCanvas(`rb2-topo-${k}`, 512, 512, (g) => {
    const c = CORES[k];
    g.fillStyle = c.topo;
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 42; i++) {
      g.strokeStyle = i % 2 ? 'rgba(0,0,0,0.045)' : 'rgba(255,255,255,0.08)';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(256, 256, 20 + i * 5.6, 0, Math.PI * 2);
      g.stroke();
    }
    // tampa do depósito (atrás = topo do canvas)
    g.strokeStyle = 'rgba(0,0,0,0.45)';
    g.lineWidth = 5;
    const a0 = Math.PI * 1.2, a1 = Math.PI * 1.8;
    g.beginPath();
    g.arc(256, 256, 238, a0, a1);
    g.lineTo(256 + 238 * Math.cos(a0), 256 + 238 * Math.sin(a0));
    g.stroke();
    // faixa escura da frente (janela do sensor) e logo genérico
    g.fillStyle = c.painel;
    g.beginPath();
    g.arc(256, 256, 250, Math.PI * 0.3, Math.PI * 0.7);
    g.arc(256, 256, 214, Math.PI * 0.7, Math.PI * 0.3, true);
    g.fill();
    g.fillStyle = k === 'branco' ? '#7a8290' : '#c9a24a';
    g.font = `800 40px ${F}`;
    g.textAlign = 'center';
    g.fillText(k === 'branco' ? 'CLEAN·BOT' : 'LIDAR·MAX', 256, 250);
    g.font = `800 22px ${F}`;
    g.fillText(k === 'branco' ? 'AUTO · 2000 Pa' : 'SMART MAP', 256, 282);
  });
const texPCB = () =>
  texCanvas('rb2-pcb', 256, 256, (g) => {
    g.fillStyle = '#1f7a45';
    g.fillRect(0, 0, 256, 256);
    const r = rng(11);
    g.strokeStyle = '#d6b45a';
    g.lineWidth = 3;
    for (let i = 0; i < 26; i++) {
      const x = r() * 256, y = r() * 256;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (r() - 0.5) * 120, y);
      g.lineTo(x + (r() - 0.5) * 120, y + (r() - 0.5) * 120);
      g.stroke();
    }
    g.fillStyle = '#e9e4cf';
    g.font = `800 18px ${F}`;
    g.fillText('MCU', 110, 120);
    g.fillText('RB-300 v2', 20, 240);
    for (let i = 0; i < 30; i++) {
      g.fillStyle = '#d6b45a';
      g.beginPath();
      g.arc(r() * 256, r() * 256, 4, 0, Math.PI * 2);
      g.fill();
    }
  });
const texBateria = () =>
  texTexto('rb2-bat', [{t: 'Li-ion 14,4 V', tam: 70, cor: '#ffffff'}, {t: '2.000 mAh', tam: 90, cor: '#ffd23f'}], '#1d3f8a', 512, 300);
const texEtiquetaFundo = () =>
  texTexto('rb2-fundo', [{t: 'MODELO RB-300', tam: 54, cor: '#16151c'}, {t: '14,4 V · 25 W', tam: 46, cor: '#16151c'}, {t: 'MADE IN ...', tam: 34, cor: '#555'}], '#e9e6dc', 512, 300);

const CORES = {
  branco: {topo: '#eceef1', lado: '#d3d8de', aro: '#aab3be', bumper: '#3b3f47', painel: '#1d2026'},
  preto: {topo: '#2d3036', lado: '#22252b', aro: '#c9a24a', bumper: '#15171a', painel: '#0b0c0f'},
};

// partículas: sujeira entra pela boca → duto → depósito; o ar segue → filtro → motor → saída lateral
const CAM_SUJ: V3[] = [[0, 0.004, 0.11], [0, 0.012, 0.04], [0.03, 0.022, 0.0], [0.03, 0.028, -0.05], [0.03, 0.026, -0.095]];
const CAM_AR: V3[] = [...CAM_SUJ.slice(0, 4), [0.0, 0.034, -0.095], [-0.045, 0.036, -0.098], [-0.075, 0.036, -0.09], [-0.12, 0.036, -0.09], [-0.2, 0.04, -0.1]];
const CAM_VARRE: V3[] = [[0.2, 0.004, 0.2], [0.17, 0.004, 0.16], [0.12, 0.004, 0.13], [0.06, 0.004, 0.1], [0.0, 0.006, 0.05]];
function naLinha(pts: V3[], s: number): V3 {
  const k = clamp01(s) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(k));
  const f = k - i;
  const a = pts[i], b = pts[i + 1];
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
}
const geoPart = new THREE.IcosahedronGeometry(0.0042, 0);

// ======================================================================
// O ROBÔ
// ======================================================================
export const RB = {R: 0.165, H: 0.078};
export type RoboProps = {
  pos: V3; rotY?: number; t: number;
  explode?: number; corte?: boolean; virado?: boolean;
  escova?: number; rolo?: number; rodas?: number; // velocidades (rad/s)
  bate?: number; led?: string; ledPisca?: boolean;
  binOut?: number; semBin?: boolean; binFill?: number; fluxo?: number; varre?: number;
  lidar?: boolean; cor?: 'branco' | 'preto'; tremor?: number; enrosco?: boolean;
  rotulos?: number; so?: string[]; destaque?: string[]; carga?: number;
};
export const Robo: React.FC<RoboProps> = (pr) => {
  const {pos, rotY = 0, t, explode = 0, corte = false, virado = false, escova = 0, rolo = 0, rodas = 0, bate = 0, led = '#2fbf71', ledPisca = false,
    binOut = 0, semBin = false, binFill = 0, fluxo = 0, varre = 0, lidar = false, cor = 'branco', tremor = 0, enrosco = false, rotulos = 0, so, destaque = [], carga = -1} = pr;
  const {R, H} = RB;
  const k = CORES[cor];
  const e = suave(explode);
  const aberto = corte || e > 0.02;
  const tr = tremor * Math.sin(t * 46) * 0.004;
  const ledI = ledPisca ? (Math.sin(t * 14) > 0 ? 2.2 : 0.1) : 1.2 + 0.5 * Math.sin(t * 4);
  const bateZ = -bate * 0.008;
  // posições das camadas (explodida)
  const pcb: V3 = [0, 0.062 + e * 0.15, 0.045];
  const bat: V3 = [0, 0.036 + e * 0.085, 0.072];
  const mot: V3 = [-0.072 - e * 0.06, 0.036 + e * 0.05, -0.088];
  const bin: V3 = [0.028, 0.012 + e * 0.04, -0.098 - e * 0.08 - binOut * 0.24];
  const rodaX = 0.112 + e * 0.07;
  const esc: V3 = [0.112 + e * 0.04, 0.009, 0.108 + e * 0.04];
  const bumpZ = bateZ + e * 0.08;
  const capaY = H - 0.004 + e * 0.23;
  const giroEsc = t * escova;
  // paredes: fechado = 360°, explodido = metade de trás, corte = tira o quarto da frente-direita
  const [p0, pl] = corte ? [Math.PI / 2, Math.PI * 1.5] : e > 0.02 ? [Math.PI / 2, Math.PI] : [0, Math.PI * 2];
  const rotT: {nome: string; txt: string; a: V3; l: V3}[] = [
    {nome: 'escova', txt: 'ESCOVINHA', a: [esc[0] + 0.03, esc[1], esc[2] + 0.04], l: [0.21, 0.07, 0.17]},
    {nome: 'motor', txt: 'MOTOR', a: [mot[0] - 0.02, mot[1] + 0.02, mot[2]], l: [-0.19, mot[1] + 0.06, -0.06]},
    {nome: 'sensor', txt: 'SENSOR', a: [-(R + 0.008) * 0.64, H * 0.5, (R + 0.008) * 0.77 + bumpZ], l: [-0.18, H * 1.2, R * 0.6 + bumpZ]},
    {nome: 'bateria', txt: 'BATERIA', a: [bat[0] + 0.03, bat[1] + 0.012, bat[2] + 0.03], l: [0.19, bat[1] + 0.04, 0.14]},
    {nome: 'deposito', txt: 'DEPÓSITO', a: [bin[0] + 0.06, bin[1] + 0.05, bin[2]], l: [0.2, bin[1] + 0.1, bin[2] - 0.05]},
    {nome: 'filtro', txt: 'FILTRO', a: [bin[0] - 0.068, bin[1] + 0.04, bin[2]], l: [-0.15, bin[1] + 0.16, bin[2] - 0.12]},
    {nome: 'placa', txt: 'PLACA', a: [pcb[0] - 0.05, pcb[1] + 0.004, pcb[2]], l: [-0.18, pcb[1] + 0.07, 0.06]},
    {nome: 'roda', txt: 'RODA', a: [rodaX + 0.012, 0.06, 0], l: [0.23, 0.0, -0.08]},
  ];
  const rot = rotT.filter((r) => !so || so.includes(r.nome));
  return (
    <group position={[pos[0] + tr, pos[1] + (virado ? H + 0.004 : 0), pos[2]]} rotation={[virado ? Math.PI : 0, rotY, 0]}>
      {/* ---------- fundo (visto quando vira) ---------- */}
      <Cy p={[0, 0.013, 0]} r={R - 0.006} h={0.006} c="#30333a" seg={48} />
      <mesh position={[0.02, 0.0095, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.07, 0.04]} />
        <meshStandardMaterial map={texEtiquetaFundo()} />
      </mesh>
      {/* tampa da bateria com 4 parafusos */}
      <Bx p={[0, 0.0095, 0.075]} s={[0.1, 0.002, 0.075]} c="#272a30" sombra={false} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (<Cy key={'pf' + i} p={[sx * 0.043, 0.0083, 0.075 + sz * 0.031]} r={0.0028} h={0.002} c="#9aa3ad" met={0.8} rug={0.3} seg={8} />))}
      {/* sensores de degrau (4) e contatos de carga */}
      {[[0.09, 0.12], [-0.09, 0.12], [0.135, -0.04], [-0.135, -0.04]].map(([x, z], i) => (<Cy key={'cl' + i} p={[x, 0.009, z]} r={0.007} h={0.002} c="#0a0a0c" rug={0.1} seg={12} />))}
      {[-1, 1].map((s) => (<Bx key={'ct' + s} p={[s * 0.03, 0.0088, 0.138]} s={[0.022, 0.002, 0.008]} c="#d9dde2" met={0.9} rug={0.25} sombra={false} />))}
      {/* boca + rolo central (gira) */}
      <Bx p={[0, 0.011, 0.035]} s={[0.165, 0.004, 0.05]} c="#16171b" />
      <group position={[0, 0.02, 0.035]} rotation={[t * rolo, 0, 0]}>
        <Cy rot={[0, 0, Math.PI / 2]} r={0.011} h={0.15} c="#5d6270" seg={14} />
        {[0, 1, 2, 3].map((i) => (<Bx key={'al' + i} rot={[(i * Math.PI) / 2, 0, 0]} p={[0, 0, 0]} s={[0.148, 0.004, 0.03]} c={i % 2 ? '#e8e2d0' : '#2b2e35'} sombra={false} />))}
      </group>
      {[-0.06, -0.03, 0, 0.03, 0.06].map((x) => (<Bx key={'gr' + x} p={[x, 0.0085, 0.035]} s={[0.004, 0.003, 0.05]} c="#3a3d44" sombra={false} />))}
      {/* rodas de tração (com cravos) */}
      {([-1, 1] as const).map((s) => (
        <group key={'rd' + s} position={[s * rodaX, 0.034, 0]}>
          <group rotation={[t * rodas, 0, 0]}>
            <Cy rot={[0, 0, Math.PI / 2]} r={0.034} h={0.022} c="#141518" rug={0.9} seg={20} />
            <Cy rot={[0, 0, Math.PI / 2]} p={[s * 0.004, 0, 0]} r={0.02} h={0.02} c="#7d8592" met={0.4} seg={14} />
            {Array.from({length: 12}).map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return <Bx key={i} p={[0, Math.cos(a) * 0.034, Math.sin(a) * 0.034]} rot={[-a, 0, 0]} s={[0.022, 0.004, 0.008]} c="#24262b" sombra={false} />;
            })}
          </group>
          {aberto && <Bx p={[-s * 0.016, 0.012, 0]} s={[0.012, 0.05, 0.085]} c="#5d6270" />}
          {aberto && <Cy p={[-s * 0.03, 0.016, -0.03]} rot={[0, 0, Math.PI / 2]} r={0.011} h={0.03} c="#c3c8cf" met={0.7} rug={0.3} />}
        </group>
      ))}
      {/* roda boba da frente */}
      <Cy p={[0, 0.01, 0.128]} rot={[0, 0, Math.PI / 2]} r={0.01} h={0.008} c="#222" />
      <Bx p={[0, 0.017, 0.128]} s={[0.018, 0.006, 0.022]} c="#3a3d44" />
      {/* escovinha lateral (gira; 3 tufos) */}
      <group position={esc} rotation={[0, giroEsc, 0]}>
        <Cy r={0.013} h={0.006} c="#d33a2c" seg={14} />
        <Cy p={[0, -0.0035, 0]} r={0.003} h={0.002} c="#c3c8cf" met={0.8} seg={8} />
        {[0, 1, 2].map((i) =>
          [-0.16, -0.08, 0, 0.08, 0.16].map((d, j) => {
            const a = (i / 3) * Math.PI * 2 + d;
            return <Barra key={i + '-' + j} a={[0, -0.001, 0]} b={[Math.cos(a) * 0.085, -0.006, Math.sin(a) * 0.085]} r={0.0013} cor={j === 2 ? '#d33a2c' : '#ece6d8'} sombra={false} />;
          }),
        )}
        {enrosco && [0, 1, 2].map((i) => (
          <mesh key={'en' + i} position={[0, -0.002 + i * 0.002, 0]} rotation={[Math.PI / 2, 0, i]}>
            <torusGeometry args={[0.017 + i * 0.003, 0.0022, 10, 28]} />
            <meshStandardMaterial color="#16151c" roughness={0.6} />
          </mesh>
        ))}
      </group>
      {/* ---------- carcaça ---------- */}
      <Cy p={[0, H / 2 + 0.002, 0]} r={R} h={H - 0.018} c={k.lado} rug={0.45} seg={64} aberto t0={p0} tl={pl} />
      <Cy p={[0, H / 2 + 0.002, 0]} r={R - 0.004} h={H - 0.018} c="#2b2e34" seg={64} aberto t0={p0} tl={pl} costas />
      <Cy p={[0, H - 0.011, 0]} r={R + 0.0008} h={0.004} c={k.aro} met={0.6} rug={0.3} seg={64} aberto t0={p0} tl={pl} />
      {/* saída de ar (lado esquerdo) */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = Math.PI * 1.42 + i * 0.07;
        return <Bx key={'sa' + i} p={[Math.sin(a) * (R + 0.001), H * 0.5, Math.cos(a) * (R + 0.001)]} rot={[0, a, 0]} s={[0.006, 0.03, 0.003]} c="#16171b" sombra={false} />;
      })}
      {/* bordas laranja do corte */}
      {corte && [Math.PI / 2, 0].map((a) => (<Bx key={'cb' + a} p={[Math.sin(a) * (R - 0.002), H / 2 + 0.002, Math.cos(a) * (R - 0.002)]} rot={[0, a, 0]} s={[0.008, H - 0.016, 0.004]} c="#ff8a1f" e="#ff6a00" ei={0.4} />))}
      {/* para-choque com janela do sensor IR */}
      <group position={[0, 0, bumpZ]}>
        <Cy p={[0, H * 0.46, 0]} r={R + 0.006} h={H * 0.62} c={k.bumper} rug={0.5} seg={48} aberto t0={-1.3} tl={2.6} dupla />
        <Cy p={[0, H * 0.5, 0]} r={R + 0.0072} h={0.016} c="#08090b" rug={0.12} met={0.3} seg={40} aberto t0={-0.75} tl={1.5} e="#ff2020" ei={bate * 2.5} />
        <Cy p={[0, H * 0.19, 0]} r={R + 0.0066} h={0.006} c="#101114" seg={48} aberto t0={-1.3} tl={2.6} />
        {aberto && [-0.5, 0, 0.5].map((a) => (<Bx key={'ir' + a} p={[Math.sin(a) * (R - 0.008), H * 0.5, Math.cos(a) * (R - 0.008)]} rot={[0, a, 0]} s={[0.008, 0.006, 0.006]} c="#ff3b30" e="#ff2020" ei={0.6 + bate * 2} />))}
        {aberto && [-1, 1].map((s) => (
          <group key={'mc' + s} position={[s * 0.095, 0.035, 0.122]}>
            <Bx s={[0.014, 0.01, 0.008]} c="#111" />
            <Bx p={[0, 0, 0.007]} rot={[0, 0, 0.3 * s]} s={[0.012, 0.0015, 0.004]} c="#e9e9ee" sombra={false} />
          </group>
        ))}
      </group>
      {bate > 0.05 && <pointLight position={[0, H * 0.5, R + 0.05]} color="#ff3030" intensity={0.6 * bate} distance={0.5} />}
      {/* ---------- tampa (sobe na explodida; some no corte) ---------- */}
      {!corte && (
        <group position={[0, capaY, 0]} rotation={[-0.32 * e, 0, 0]}>
          <Cy r={R - 0.003} h={0.008} c={k.topo} rug={0.3} seg={64} />
          <mesh position={[0, 0.0042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[R - 0.006, 64]} />
            <meshStandardMaterial map={texTopo(cor)} roughness={0.28} metalness={0.05} />
          </mesh>
          {/* botão com anel de LED + botão "casa" */}
          <Cy p={[0, 0.007, 0.1]} r={0.017} h={0.005} c={k.painel} rug={0.25} />
          <mesh position={[0, 0.0098, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.0135, 0.0022, 10, 28]} />
            <meshStandardMaterial color={led} emissive={led} emissiveIntensity={ledI} />
          </mesh>
          <Cy p={[0.034, 0.0065, 0.098]} r={0.0075} h={0.004} c={k.painel} rug={0.3} />
          <Bx p={[0.034, 0.0092, 0.098]} s={[0.006, 0.001, 0.006]} c="#9aa3ad" sombra={false} />
          {/* puxador da tampa do depósito */}
          <Bx p={[0, 0.006, -0.135]} s={[0.06, 0.004, 0.012]} c={k.painel} />
          {lidar && (
            <group position={[0, 0.016, -0.02]}>
              <Cy r={0.042} h={0.024} c={k.painel} rug={0.3} />
              <Cy p={[0, 0.0135, 0]} r={0.044} h={0.004} c={k.aro} met={0.7} rug={0.3} />
              <Cy p={[0, -0.001, 0]} r={0.0425} h={0.008} c="#0b0c0f" rug={0.1} seg={28} e="#4f8cff" ei={0.6} />
              <Bx p={[Math.cos(t * 9) * 0.03, -0.001, Math.sin(t * 9) * 0.03]} s={[0.012, 0.009, 0.012]} c="#4f8cff" e="#4f8cff" ei={2.5} sombra={false} />
            </group>
          )}
        </group>
      )}
      {!corte && !aberto && <pointLight position={[0, H + 0.03, 0.1]} color={led} intensity={0.1} distance={0.25} />}
      {/* ---------- miolo (aparece aberto) ---------- */}
      {aberto && (
        <group>
          {/* bandeja do chassi com nervuras */}
          {[-0.08, -0.04, 0, 0.04, 0.08].map((x) => (<Bx key={'nv' + x} p={[x, 0.019, -0.01]} s={[0.003, 0.008, 0.2]} c="#3a3d44" sombra={false} />))}
          {/* duto: boca → depósito */}
          <Bx p={[0.03, 0.023, -0.015]} s={[0.05, 0.016, 0.07]} c="#6b7280" op={0.55} rug={0.2} />
          {/* motor da escovinha */}
          <Cy p={[esc[0], 0.03, esc[2]]} r={0.01} h={0.03} c="#c3c8cf" met={0.7} rug={0.3} />
          {/* BATERIA: 4 células 18650 */}
          <group position={bat}>
            {[-0.029, -0.0097, 0.0097, 0.029].map((z) => (
              <group key={'cel' + z} position={[0, 0, z]}>
                <Cy rot={[0, 0, Math.PI / 2]} r={0.0094} h={0.064} c="#2f6fd6" rug={0.35} seg={16} />
                {[-1, 1].map((s) => (<Cy key={s} p={[s * 0.0335, 0, 0]} rot={[0, 0, Math.PI / 2]} r={0.0088} h={0.003} c="#d9dde2" met={0.8} rug={0.25} seg={16} />))}
              </group>
            ))}
            <mesh position={[0, 0.0098, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.062, 0.072]} />
              <meshStandardMaterial map={texBateria()} roughness={0.5} />
            </mesh>
            {carga >= 0 && (
              <group position={[0, 0.0105, -0.045]}>
                <Bx s={[0.06, 0.004, 0.012]} c="#16151c" sombra={false} />
                <Bx p={[-0.028 + 0.028 * carga, 0.001, 0]} s={[0.056 * carga, 0.005, 0.009]} c="#2fbf71" e="#2fbf71" ei={1.2} sombra={false} />
              </group>
            )}
          </group>
          <Barra a={[bat[0] + 0.03, bat[1] + 0.008, bat[2] - 0.03]} b={[pcb[0] + 0.04, pcb[1], pcb[2] - 0.03]} r={0.0013} cor="#e8322b" sombra={false} />
          <Barra a={[bat[0] + 0.025, bat[1] + 0.008, bat[2] - 0.033]} b={[pcb[0] + 0.035, pcb[1], pcb[2] - 0.033]} r={0.0013} cor="#16151c" sombra={false} />
          {/* PLACA eletrônica */}
          <group position={pcb}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0013, 0]}>
              <planeGeometry args={[0.13, 0.1]} />
              <meshStandardMaterial map={texPCB()} roughness={0.5} />
            </mesh>
            <Bx s={[0.13, 0.0024, 0.1]} c="#185f37" />
            <Bx p={[0, 0.003, 0]} s={[0.022, 0.004, 0.022]} c="#141414" rug={0.3} />
            {[[0.035, 0.03], [-0.035, -0.025], [0.04, -0.03], [-0.02, 0.035]].map(([x, z], i) => (<Bx key={'ci' + i} p={[x, 0.0025, z]} s={[0.012, 0.003, 0.008]} c="#1b1b1b" />))}
            {[[0.05, 0.015, '#2a4bd1'], [0.053, -0.012, '#141414'], [-0.05, 0.01, '#2a4bd1']].map(([x, z, c], i) => (<Cy key={'cp' + i} p={[x as number, 0.006, z as number]} r={0.0045} h={0.009} c={c as string} seg={10} />))}
            {[[-0.05, 0.04], [0.02, 0.043], [-0.055, -0.04]].map(([x, z], i) => (<Bx key={'cn' + i} p={[x, 0.004, z]} s={[0.02, 0.006, 0.007]} c="#f2efe6" />))}
            <Cy p={[0.02, 0.005, -0.035]} r={0.008} h={0.007} c="#111" seg={14} />
            {[-0.01, 0.0, 0.01].map((x, i) => (<Bx key={'le' + i} p={[x - 0.03, 0.0032, 0.015]} s={[0.003, 0.002, 0.003]} c={['#ff3b30', '#2fbf71', '#4f8cff'][i]} e={['#ff3b30', '#2fbf71', '#4f8cff'][i]} ei={2} sombra={false} />))}
          </group>
          {/* MOTOR DE SUCÇÃO: ventoinha girando + motor com bobina de cobre */}
          <group position={mot}>
            <Cy rot={[0, 0, Math.PI / 2]} r={0.03} h={0.028} c="#8f99a8" op={0.35} rug={0.2} seg={24} />
            <group rotation={[t * 22, 0, 0]}>
              <Cy rot={[0, 0, Math.PI / 2]} r={0.007} h={0.024} c="#c3c8cf" met={0.7} seg={10} />
              {Array.from({length: 7}).map((_, i) => (
                <group key={'pa' + i} rotation={[(i / 7) * Math.PI * 2, 0, 0]}>
                  <Bx p={[0, 0.016, 0]} rot={[0.4, 0, 0]} s={[0.022, 0.018, 0.0022]} c="#e9edf2" met={0.3} rug={0.3} />
                </group>
              ))}
            </group>
            <Cy p={[-0.03, 0, 0]} rot={[0, 0, Math.PI / 2]} r={0.017} h={0.032} c="#c3c8cf" met={0.75} rug={0.3} />
            <mesh position={[-0.024, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.016, 0.0035, 10, 28]} />
              <meshStandardMaterial color="#c87533" metalness={0.7} roughness={0.35} />
            </mesh>
            <Cy p={[-0.048, 0, 0]} rot={[0, 0, Math.PI / 2]} r={0.012} h={0.006} c="#16151c" />
          </group>
          <Barra a={[pcb[0] - 0.055, pcb[1], pcb[2] - 0.04]} b={[mot[0] - 0.04, mot[1] + 0.015, mot[2]]} r={0.0012} cor="#e8322b" sombra={false} />
        </group>
      )}
      {/* DEPÓSITO (caixa transparente) + FILTRO sanfonado */}
      {!semBin && (aberto || binOut > 0.01) && (
        <Deposito pos={bin} binFill={binFill} />
      )}
      {/* fluxo: sujeira (marrom) e ar (azul) */}
      {fluxo > 0.01 && (
        <group>
          {Array.from({length: 24}).map((_, i) => {
            const s = (t * 0.6 + i * 0.618) % 1;
            return <mesh key={'su' + i} geometry={geoPart} position={naLinha(CAM_SUJ, s)} scale={1.3}><meshStandardMaterial color={i % 3 ? '#8a5a2b' : '#c9a36b'} /></mesh>;
          })}
          {Array.from({length: 22}).map((_, i) => {
            const s = (t * 0.75 + i * 0.381) % 1;
            return <mesh key={'ar' + i} geometry={geoPart} position={naLinha(CAM_AR, s)} scale={0.9}><meshStandardMaterial color="#8fe3ff" emissive="#4fc3ff" emissiveIntensity={1.2} transparent opacity={0.85 * fluxo} depthWrite={false} /></mesh>;
          })}
        </group>
      )}
      {varre > 0.01 && Array.from({length: 18}).map((_, i) => {
        const s = (t * 0.9 + i * 0.618) % 1;
        return <mesh key={'va' + i} geometry={geoPart} position={naLinha(CAM_VARRE, s)} scale={1.4}><meshStandardMaterial color={i % 2 ? '#c9a36b' : '#7a4f2a'} /></mesh>;
      })}
      {/* rótulos das peças */}
      {rotulos > 0.01 && rot.map((r, i) => {
        const vis = clamp01(rotulos * rot.length - i);
        if (vis <= 0.01) return null;
        const d = destaque.includes(r.nome);
        return (
          <group key={'rt' + r.nome}>
            <Barra a={r.a} b={[lerp(r.a[0], r.l[0], vis), lerp(r.a[1], r.l[1], vis), lerp(r.a[2], r.l[2], vis)]} r={0.0012} cor="#16151c" sombra={false} />
            <Esf p={r.a} r={0.0035} c="#16151c" sombra={false} />
            <Pill texto={r.txt} pos={r.l} vis={vis} fundo={d ? '#ffd23f' : '#ffffff'} tam={0.8} />
          </group>
        );
      })}
    </group>
  );
};

// DEPÓSITO (caixa transparente de 0,3 L) + FILTRO sanfonado; origem = fundo do depósito
export const Deposito: React.FC<{pos: V3; binFill?: number; rot?: V3}> = ({pos, binFill = 0, rot = [0, 0, 0]}) => (
  <group position={pos} rotation={rot}>
          <Bx p={[0, 0.025, 0]} s={[0.14, 0.05, 0.085]} c="#9fb4c9" op={0.32} rug={0.1} />
          {[[0, 0.05, 0.0425, 0.14, 0.004, 0.003], [0, 0.05, -0.0425, 0.14, 0.004, 0.003], [0.07, 0.05, 0, 0.003, 0.004, 0.085], [-0.07, 0.05, 0, 0.003, 0.004, 0.085], [0, 0.001, 0, 0.14, 0.002, 0.085]].map(([x, y, z, a, b, c], i) => (
            <Bx key={'bd' + i} p={[x, y, z]} s={[a, b, c]} c="#33363c" />
          ))}
          <Bx p={[0, 0.055, -0.04]} s={[0.06, 0.008, 0.014]} c="#2b2e35" />
          <Bx p={[0.0, 0.025, 0.0435]} s={[0.04, 0.02, 0.003]} c="#16171b" />
          {binFill > 0.01 && (
            <group>
              <Bx p={[0.005, 0.003 + 0.022 * binFill, 0]} s={[0.125, 0.044 * binFill, 0.078]} c="#8a6a4a" rug={1} flat />
              <Pelos centro={[0.005, 0.005 + 0.044 * binFill, 0]} lado={[0.12, 0.07]} n={Math.round(30 + 60 * binFill)} seed={4} cor="#b9773f" />
            </group>
          )}
          <group position={[-0.066, 0.026, 0]}>
            {Array.from({length: 9}).map((_, i) => (<Bx key={'pl' + i} p={[0, 0, -0.034 + i * 0.0085]} rot={[0, i % 2 ? 0.7 : -0.7, 0]} s={[0.002, 0.04, 0.011]} c="#f3efe0" rug={0.95} />))}
            {[[0, 0.022, 0, 0.004, 0.004, 0.08], [0, -0.022, 0, 0.004, 0.004, 0.08], [0, 0, 0.04, 0.004, 0.048, 0.004], [0, 0, -0.04, 0.004, 0.048, 0.004]].map(([x, y, z, a, b, c], i) => (
              <Bx key={'fr' + i} p={[x, y, z]} s={[a, b, c]} c="#2d6cdf" />
            ))}
          </group>
  </group>
);

// ---------- base de carregamento ----------
export const Base: React.FC<{pos: V3; rotY?: number; t: number; pisca?: boolean}> = ({pos, rotY = 0, t, pisca}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Bx p={[0, 0.005, 0.06]} s={[0.22, 0.01, 0.11]} c="#e4e7eb" rug={0.4} />
    <Bx p={[0, 0.058, -0.03]} s={[0.22, 0.116, 0.07]} c="#f3f4f6" rug={0.35} />
    <Bx p={[0, 0.118, -0.028]} rot={[-0.25, 0, 0]} s={[0.222, 0.012, 0.078]} c="#2a2d33" rug={0.3} />
    <Bx p={[0, 0.066, 0.0065]} s={[0.13, 0.05, 0.004]} c="#121317" rug={0.15} met={0.3} />
    <Cy p={[0, 0.098, 0.006]} rot={[Math.PI / 2, 0, 0]} r={0.006} h={0.004} c="#4fc3ff" e="#4fc3ff" ei={pisca ? (Math.sin(t * 6) > 0 ? 2.5 : 0.3) : 1.6} />
    {[-1, 1].map((s) => (<Bx key={s} p={[s * 0.035, 0.013, 0.072]} s={[0.026, 0.008, 0.032]} c="#d9dde2" met={0.9} rug={0.2} />))}
    {[0, 1, 2, 3].map((i) => (<Bx key={'v' + i} p={[0.111, 0.04 + i * 0.016, -0.03]} s={[0.002, 0.006, 0.05]} c="#b9c0c9" sombra={false} />))}
  </group>
);

// ---------- pelos e migalhas ----------
const geoPelo = new THREE.BoxGeometry(0.0013, 0.0013, 0.03);
export const Pelos: React.FC<{centro: V3; lado: [number, number]; n: number; seed?: number; cor?: string}> = ({centro, lado, n, seed = 3, cor = '#b9773f'}) => {
  const mats = useMemo(() => {
    const r = rng(seed);
    return Array.from({length: n}).map(() => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.3, r() * Math.PI * 2, 0));
      const s = 0.6 + r() * 1.0;
      return new THREE.Matrix4().compose(new THREE.Vector3(centro[0] + (r() - 0.5) * lado[0], centro[1] + r() * 0.002, centro[2] + (r() - 0.5) * lado[1]), q, new THREE.Vector3(1, 1, s));
    });
  }, [n, seed, centro[0], centro[1], centro[2], lado[0], lado[1]]);
  return <Instancias matrizes={mats} n={mats.length} geo={geoPelo} cor={cor} sombra={false} />;
};
// bolinhas de pelo (tufos)
export const Tufos: React.FC<{centro: V3; lado: [number, number]; n: number; seed?: number; cor?: string}> = ({centro, lado, n, seed = 8, cor = '#c48a52'}) => {
  const r = rng(seed);
  return (
    <group>
      {Array.from({length: n}).map((_, i) => {
        const x = centro[0] + (r() - 0.5) * lado[0], z = centro[2] + (r() - 0.5) * lado[1], s = 0.6 + r() * 0.8;
        return <Esf key={i} p={[x, centro[1] + 0.006 * s, z]} r={0.014} esc={[s * 1.3, s * 0.45, s]} c={i % 2 ? cor : '#a9a29a'} rug={1} flat sombra={false} />;
      })}
    </group>
  );
};

export type Caminho = (t: number) => {x: number; z: number; ang: number};
type Pt = [number, number];
export function trilha(pts: Pt[], vel: number, t0 = 0): Caminho {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = L[L.length - 1];
  const at = (d: number): Pt => {
    const dd = Math.max(0, Math.min(tot, d));
    let i = 1;
    while (i < L.length - 1 && L[i] < dd) i++;
    const f = (dd - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)];
  };
  return (t: number) => {
    const d = (t + t0) * vel;
    const [x, z] = at(d);
    const a = at(Math.min(d, tot - 0.06) - 0.06), b = at(Math.min(d, tot - 0.06) + 0.06);
    return {x, z, ang: Math.atan2(b[0] - a[0], b[1] - a[1])};
  };
}
export function pontosAte(pts: Pt[], vel: number, t: number): Pt[] {
  const out: Pt[] = [pts[0]];
  let rest = t * vel;
  for (let i = 1; i < pts.length && rest > 0; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (rest >= l) out.push(pts[i]);
    else out.push([lerp(pts[i - 1][0], pts[i][0], rest / l), lerp(pts[i - 1][1], pts[i][1], rest / l)]);
    rest -= l;
  }
  return out;
}

const geoMig = new THREE.IcosahedronGeometry(0.006, 0);
// migalhas no chão; somem quando o robô passa por cima (o caminho é fixo, então dá pra saber quando cada uma é aspirada)
export const Migalhas: React.FC<{area: [number, number, number, number]; n: number; seed?: number; t: number; robo?: Caminho; raio?: number; cor?: string}> = ({area, n, seed = 5, t, robo, raio = 0.15, cor = '#c9a36b'}) => {
  const base = useMemo(() => {
    const r = rng(seed);
    return Array.from({length: n}).map(() => ({x: lerp(area[0], area[2], r()), z: lerp(area[1], area[3], r()), s: 0.6 + r() * 1.1, a: r() * 6}));
  }, [n, seed, area[0], area[1], area[2], area[3]]);
  const tCome = useMemo(() => base.map((b) => {
    if (!robo) return 1e9;
    for (let tt = 0; tt < 12; tt += 0.033) {
      const p = robo(tt);
      if (Math.hypot(p.x - b.x, p.z - b.z) < raio) return tt;
    }
    return 1e9;
  }), [base, robo, raio]);
  const mats = base.map((b, i) => {
    const k = t < tCome[i] ? b.s : 0.0001;
    return new THREE.Matrix4().compose(new THREE.Vector3(b.x, 0.005, b.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(b.a, b.a * 2, 0)), new THREE.Vector3(k, k * 0.7, k));
  });
  return <Instancias matrizes={mats} n={mats.length} geo={geoMig} cor={cor} sombra={false} />;
};

// faixa no chão (rastro do robô)
export const Rastro: React.FC<{pts: Pt[]; larg?: number; cor: string; y?: number; op?: number}> = ({pts, larg = 0.05, cor, y = 0.006, op = 0.85}) => {
  const geo = useMemo(() => {
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dz = b[1] - a[1];
      const l = Math.hypot(dx, dz) || 1;
      dx /= l;
      dz /= l;
      const nx = (-dz * larg) / 2, nz = (dx * larg) / 2;
      pos.push(pts[i][0] + nx, y, pts[i][1] + nz, pts[i][0] - nx, y, pts[i][1] - nz);
      if (i > 0) {
        const k = (i - 1) * 2;
        idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    return g;
  }, [JSON.stringify(pts), larg, y]);
  if (pts.length < 2) return null;
  return (
    <mesh geometry={geo} renderOrder={2}>
      <meshBasicMaterial color={cor} transparent opacity={op} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
};

// passeio aleatório (bate-gira-segue) dentro de um retângulo
export function passeio(seed: number, x0: number, z0: number, x1: number, z1: number, n: number): Pt[] {
  const r = rng(seed);
  let x = (x0 + x1) / 2 + 0.1, z = (z0 + z1) / 2;
  let a = r() * Math.PI * 2;
  const pts: Pt[] = [[x, z]];
  for (let i = 0; i < n; i++) {
    const dx = Math.sin(a), dz = Math.cos(a);
    const tx = dx > 0 ? (x1 - x) / dx : dx < 0 ? (x0 - x) / dx : 1e9;
    const tz = dz > 0 ? (z1 - z) / dz : dz < 0 ? (z0 - z) / dz : 1e9;
    const s = Math.min(tx, tz);
    x += dx * s;
    z += dz * s;
    pts.push([x, z]);
    a = Math.atan2((x0 + x1) / 2 - x, (z0 + z1) / 2 - z) + (r() - 0.5) * 2.2;
  }
  return pts;
}
export function zigue(x0: number, z0: number, x1: number, z1: number, passo: number): Pt[] {
  const pts: Pt[] = [];
  let i = 0;
  for (let z = z0; z <= z1 + 1e-6; z += passo, i++) {
    if (i % 2 === 0) pts.push([x0, z], [x1, z]);
    else pts.push([x1, z], [x0, z]);
  }
  return pts;
}

// ======================================================================
// CASA (sala de apartamento): piso, paredes com rodapé, sofá, tapete, mesa de centro, rack + TV, janela, quadros,
// luminária, planta, mesa de jantar com cadeiras, base do robô e tomada.
// ======================================================================
export const SALA = {fundoZ: -2.2, esqX: -2.6, dirX: 3.0, base: [-2.5, 0, 0.9] as V3, tomada: [-2.592, 0.3, 1.22] as V3};

const texPiso = (tipo: 'madeira' | 'porcelanato') =>
  texCanvas(`rb2-piso-${tipo}`, 512, 512, (g) => {
    const r = rng(tipo === 'madeira' ? 21 : 33);
    if (tipo === 'madeira') {
      for (let row = 0; row < 8; row++) {
        let x = -r() * 200;
        while (x < 512) {
          const w = 160 + r() * 200;
          const tom = 0.85 + r() * 0.3;
          g.fillStyle = `rgb(${Math.round(196 * tom)},${Math.round(146 * tom)},${Math.round(98 * tom)})`;
          g.fillRect(x, row * 64, w, 64);
          g.strokeStyle = 'rgba(90,55,25,0.18)';
          g.lineWidth = 2;
          for (let k = 0; k < 4; k++) {
            g.beginPath();
            const y0 = row * 64 + 8 + r() * 48;
            g.moveTo(x, y0);
            g.bezierCurveTo(x + w * 0.3, y0 + (r() - 0.5) * 10, x + w * 0.6, y0 + (r() - 0.5) * 10, x + w, y0);
            g.stroke();
          }
          g.fillStyle = 'rgba(60,35,15,0.55)';
          g.fillRect(x, row * 64, 3, 64);
          x += w;
        }
        g.fillStyle = 'rgba(60,35,15,0.5)';
        g.fillRect(0, row * 64, 512, 3);
      }
    } else {
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const tom = 0.94 + r() * 0.06;
        g.fillStyle = `rgb(${Math.round(232 * tom)},${Math.round(228 * tom)},${Math.round(220 * tom)})`;
        g.fillRect(i * 256, j * 256, 256, 256);
        g.strokeStyle = 'rgba(150,140,130,0.35)';
        g.lineWidth = 2;
        for (let k = 0; k < 3; k++) {
          g.beginPath();
          g.moveTo(i * 256 + r() * 256, j * 256);
          g.bezierCurveTo(i * 256 + r() * 256, j * 256 + 90, i * 256 + r() * 256, j * 256 + 170, i * 256 + r() * 256, j * 256 + 256);
          g.stroke();
        }
      }
      g.fillStyle = '#b9b2a6';
      g.fillRect(0, 0, 512, 4);
      g.fillRect(0, 254, 512, 4);
      g.fillRect(0, 0, 4, 512);
      g.fillRect(254, 0, 4, 512);
    }
  }, true);
const texParede = (cor: string) =>
  texCanvas(`rb2-par-${cor}`, 256, 256, (g) => {
    g.fillStyle = cor;
    g.fillRect(0, 0, 256, 256);
    const r = rng(7);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
      g.fillRect(r() * 256, r() * 256, 2 + r() * 4, 2 + r() * 4);
    }
  }, true);
const texTapete = () =>
  texCanvas('rb2-tapete', 512, 360, (g) => {
    g.fillStyle = '#efe4cf';
    g.fillRect(0, 0, 512, 360);
    g.fillStyle = '#b8483a';
    g.fillRect(0, 0, 512, 34);
    g.fillRect(0, 326, 512, 34);
    g.fillRect(0, 0, 34, 360);
    g.fillRect(478, 0, 34, 360);
    g.fillStyle = '#2d4a6b';
    for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) {
      const x = 70 + i * 47, y = 70 + j * 55;
      g.beginPath();
      g.moveTo(x, y - 16);
      g.lineTo(x + 16, y);
      g.lineTo(x, y + 16);
      g.lineTo(x - 16, y);
      g.closePath();
      if ((i + j) % 2) g.fill();
      else {
        g.strokeStyle = '#d99a3a';
        g.lineWidth = 5;
        g.stroke();
      }
    }
  });
const texTecido = (cor: string) =>
  texCanvas(`rb2-tec-${cor}`, 128, 128, (g) => {
    g.fillStyle = cor;
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < 128; i += 4) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 128);
      g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 128; i += 4) {
      g.beginPath();
      g.moveTo(0, i);
      g.lineTo(128, i);
      g.stroke();
    }
  }, true);
const texQuadro = (n: number) =>
  texCanvas(`rb2-qd-${n}`, 256, 256, (g) => {
    g.fillStyle = n ? '#f4ead8' : '#e9eef2';
    g.fillRect(0, 0, 256, 256);
    const cs = n ? ['#d0643f', '#e0a63a', '#2d4a6b'] : ['#3f9b5a', '#7fb6d9', '#e85a4f'];
    g.fillStyle = cs[0];
    g.beginPath();
    g.arc(90, 110, 60, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = cs[1];
    g.fillRect(120, 120, 100, 100);
    g.fillStyle = cs[2];
    g.beginPath();
    g.moveTo(30, 230);
    g.lineTo(130, 150);
    g.lineTo(230, 230);
    g.fill();
  });
const texTV = () =>
  texCanvas('rb2-tv', 512, 288, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 288);
    gr.addColorStop(0, '#6fb7ff');
    gr.addColorStop(1, '#cfe9ff');
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 288);
    g.fillStyle = '#3f9b5a';
    g.beginPath();
    g.moveTo(0, 220);
    g.bezierCurveTo(140, 140, 260, 260, 512, 170);
    g.lineTo(512, 288);
    g.lineTo(0, 288);
    g.fill();
    g.fillStyle = '#ffd23f';
    g.beginPath();
    g.arc(400, 70, 34, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.fillRect(20, 250, 180, 22);
  });

export const Sofa: React.FC<{pos: V3; larg?: number; prof?: number; cor?: string}> = ({pos, larg = 2.1, prof = 0.9, cor = '#7088b8'}) => {
  const tec = texTecido(cor);
  const w = (larg - 0.32) / 3;
  return (
    <group position={pos}>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (<Cy key={i} p={[sx * (larg / 2 - 0.09), 0.06, sz * (prof / 2 - 0.09)]} r={0.022} r2={0.015} h={0.12} c="#5a3b25" />))}
      <Bx p={[0, 0.22, 0]} s={[larg, 0.2, prof]} c="#ffffff" map={tec} rug={0.95} />
      <Bx p={[0, 0.47, -prof / 2 + 0.08]} s={[larg, 0.5, 0.16]} c="#ffffff" map={tec} rug={0.95} />
      {[-1, 0, 1].map((i) => (
        <group key={i}>
          <Bx p={[i * (w + 0.006), 0.375, 0.08]} s={[w, 0.11, prof - 0.24]} c="#ffffff" map={tec} rug={0.95} />
          <Bx p={[i * (w + 0.006), 0.6, -prof / 2 + 0.24]} rot={[-0.14, 0, 0]} s={[w, 0.36, 0.15]} c="#ffffff" map={tec} rug={0.95} />
        </group>
      ))}
      {[-1, 1].map((s) => (<Bx key={'b' + s} p={[s * (larg / 2 - 0.08), 0.43, 0]} s={[0.16, 0.3, prof]} c="#ffffff" map={tec} rug={0.95} />))}
      <Bx p={[-larg / 2 + 0.32, 0.56, -prof / 2 + 0.36]} rot={[-0.25, 0.3, 0.12]} s={[0.36, 0.34, 0.1]} c="#e0a63a" rug={1} />
      <Bx p={[larg / 2 - 0.34, 0.56, -prof / 2 + 0.36]} rot={[-0.25, -0.25, -0.1]} s={[0.36, 0.34, 0.1]} c="#d0643f" rug={1} />
      <Bx p={[larg / 2 - 0.08, 0.5, 0.05]} s={[0.2, 0.2, 0.5]} c="#efe2c8" rug={1} />
      <Bx p={[larg / 2 - 0.08, 0.6, 0.05]} s={[0.21, 0.02, 0.5]} c="#b8483a" rug={1} sombra={false} />
    </group>
  );
};
export const MesaCentro: React.FC<{pos: V3}> = ({pos}) => {
  const mad = texPiso('madeira');
  return (
    <group position={pos}>
      <Bx p={[0, 0.4, 0]} s={[1.0, 0.04, 0.55]} c="#ffffff" map={mad} rug={0.5} />
      <Bx p={[0, 0.13, 0]} s={[0.9, 0.02, 0.45]} c="#d9b98f" />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (<Cy key={i} p={[sx * 0.44, 0.19, sz * 0.22]} r={0.022} r2={0.016} h={0.38} c="#5a3b25" />))}
      {/* caneca, controle, revistas, tigela de pipoca */}
      <Cy p={[0.3, 0.465, 0.08]} r={0.04} h={0.09} c="#f4f1ea" rug={0.3} />
      <mesh position={[0.345, 0.47, 0.08]} rotation={[0, 0, 0]}><torusGeometry args={[0.025, 0.007, 10, 28]} /><meshStandardMaterial color="#f4f1ea" /></mesh>
      <Bx p={[-0.05, 0.43, 0.12]} rot={[0, 0.4, 0]} s={[0.045, 0.02, 0.17]} c="#16151c" />
      <Bx p={[-0.3, 0.428, -0.05]} rot={[0, 0.2, 0]} s={[0.24, 0.016, 0.32]} c="#4f8cff" />
      <Bx p={[-0.29, 0.444, -0.04]} rot={[0, -0.1, 0]} s={[0.22, 0.014, 0.3]} c="#ffd23f" />
      <Cy p={[0.1, 0.45, -0.1]} r={0.06} r2={0.1} h={0.06} c="#e85a4f" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (<Esf key={i} p={[0.1 + Math.cos(i * 1.7) * 0.05, 0.485, -0.1 + Math.sin(i * 1.7) * 0.05]} r={0.022} c="#fbf2d6" flat sombra={false} />))}
    </group>
  );
};
const Luminaria: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Cy p={[0, 0.01, 0]} r={0.15} h={0.02} c="#16151c" />
    <Cy p={[0, 0.78, 0]} r={0.012} h={1.5} c="#2b2e35" met={0.5} />
    <Cy p={[0, 1.55, 0]} r={0.21} r2={0.14} h={0.3} c="#f4ead2" e="#ffd9a0" ei={0.5} aberto dupla />
    <pointLight position={[0, 1.45, 0]} color="#ffcf8a" intensity={0.8} distance={3} decay={1.5} />
  </group>
);
const Planta: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <group position={pos} scale={esc}>
    <Cy p={[0, 0.17, 0]} r={0.13} r2={0.17} h={0.34} c="#c8693f" />
    <Cy p={[0, 0.335, 0]} r={0.16} h={0.02} c="#4a3426" />
    {Array.from({length: 11}).map((_, i) => {
      const a = i * 2.4, inc = 0.35 + (i % 3) * 0.2;
      return (
        <group key={i} position={[0, 0.35, 0]} rotation={[0, a, inc]}>
          <Esf p={[0, 0.28, 0]} r={0.06} esc={[0.9, 4.5, 0.25]} c={i % 2 ? '#3f9b5a' : '#2e7d46'} flat />
        </group>
      );
    })}
  </group>
);
const Janela: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Bx p={[0, 0, 0]} s={[1.2, 1.3, 0.06]} c="#f6f6f2" />
    <Bx p={[0, 0, 0.02]} s={[1.08, 1.18, 0.02]} c="#cde9ff" e="#cde9ff" ei={0.55} rug={0.1} />
    <Bx p={[0, 0, 0.04]} s={[0.04, 1.18, 0.03]} c="#f6f6f2" />
    <Bx p={[0, 0.1, 0.04]} s={[1.08, 0.04, 0.03]} c="#f6f6f2" />
    <Bx p={[0, -0.68, 0.08]} s={[1.3, 0.04, 0.16]} c="#e9e4d8" />
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 0.72, -0.1, 0.1]}>
        {[0, 1, 2, 3, 4].map((i) => (<Bx key={i} p={[i * 0.05 * s, 0, (i % 2) * 0.03]} s={[0.06, 1.75, 0.03]} c={i % 2 ? '#f0e6d0' : '#e6d9bd'} rug={1} />))}
      </group>
    ))}
  </group>
);
const Quadro: React.FC<{pos: V3; w: number; h: number; n: number; rotY?: number}> = ({pos, w, h, n, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Bx s={[w + 0.06, h + 0.06, 0.03]} c="#3b2a20" />
    <Placa pos={[0, 0, 0.016]} w={w} h={h} tex={texQuadro(n)} />
  </group>
);
const Rack: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Bx p={[0, 0.3, 0]} s={[0.42, 0.42, 1.6]} c="#8a5a3b" />
    {[-0.4, 0.4].map((z) => (<Bx key={z} p={[0.212, 0.3, z]} s={[0.006, 0.36, 0.76]} c="#a8744a" />))}
    {[-0.08, 0.08].map((z) => (<Bx key={'h' + z} p={[0.22, 0.3, z]} s={[0.012, 0.1, 0.012]} c="#d9dde2" met={0.8} />))}
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (<Cy key={i} p={[sx * 0.16, 0.045, sz * 0.74]} r={0.018} h={0.09} c="#16151c" />))}
    <Cy p={[0, 0.6, 0.55]} r={0.06} r2={0.045} h={0.18} c="#2fbf71" />
    <Bx p={[0.0, 0.57, -0.55]} s={[0.12, 0.12, 0.22]} c="#16151c" />
    {/* TV na parede */}
    <Bx p={[-0.17, 1.25, 0]} s={[0.04, 0.7, 1.22]} c="#121317" rug={0.3} />
    <Placa pos={[-0.148, 1.25, 0]} rot={[0, Math.PI / 2, 0]} w={1.14} h={0.63} tex={texTV()} brilho={0.5} />
  </group>
);
export const Tomada: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = Math.PI / 2}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Bx s={[0.08, 0.12, 0.012]} c="#f6f6f2" />
    {[-0.012, 0.012].map((x) => (<Cy key={x} p={[x, 0.0, 0.007]} rot={[Math.PI / 2, 0, 0]} r={0.004} h={0.004} c="#1d1b26" seg={8} />))}
  </group>
);
const Jantar: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Bx p={[0, 0.74, 0]} s={[0.85, 0.035, 1.25]} c="#efe8dc" rug={0.4} />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (<Cy key={i} p={[sx * 0.36, 0.37, sz * 0.55]} r={0.02} h={0.73} c="#16151c" met={0.4} />))}
    {[[-0.55, -0.3, 1], [-0.55, 0.3, 1], [0.55, -0.3, -1], [0.55, 0.3, -1]].map(([x, z, s], i) => (
      <group key={'c' + i} position={[x, 0, z]}>
        <Bx p={[0, 0.45, 0]} s={[0.42, 0.04, 0.42]} c="#c8955c" />
        <Bx p={[-s * 0.2, 0.7, 0]} s={[0.03, 0.46, 0.42]} c="#c8955c" />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], j) => (<Cy key={j} p={[a * 0.18, 0.22, b * 0.18]} r={0.014} h={0.45} c="#5a3b25" seg={8} />))}
      </group>
    ))}
    <Cy p={[0, 0.8, 0]} r={0.12} r2={0.09} h={0.08} c="#ffffff" rug={0.3} />
    {[0, 1, 2].map((i) => (<Esf key={i} p={[Math.cos(i * 2.1) * 0.05, 0.86, Math.sin(i * 2.1) * 0.05]} r={0.035} c={['#e8322b', '#ffd23f', '#2fbf71'][i]} />))}
  </group>
);
const Prateleira: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Bx s={[0.9, 0.03, 0.22]} c="#a8744a" />
    {Array.from({length: 9}).map((_, i) => (<Bx key={i} p={[-0.38 + i * 0.05, 0.11, 0]} rot={[0, 0, i === 7 ? 0.25 : 0]} s={[0.04, 0.18 + (i % 3) * 0.03, 0.16]} c={['#e85a4f', '#2d4a6b', '#ffd23f', '#3f9b5a', '#f4ead2', '#7fb6d9', '#d0643f', '#16151c', '#b8483a'][i]} />))}
    <Planta pos={[0.33, 0.015, 0]} esc={0.35} />
  </group>
);
// lupa de destaque: aro + lente + cabo, com o visor do medidor ampliado dentro (o medidor real tem só 7,5 × 13 cm).
// "de" (opcional) = ponto do objeto ampliado; dois fios finos ligam o aro a ele. Cabo para cima (cima) ou para baixo.
export const Lupa: React.FC<{pos: V3; rotY?: number; de?: V3; kwh: number; watts: number; r?: number; cima?: boolean}> = ({pos, rotY = 0, de, kwh, watts, r = 0.15, cima = false}) => {
  const txt = kwh.toFixed(2).replace('.', ',');
  const tela = texTexto(`lcd-${txt}-${watts}`, [{t: `${txt} kWh`, tam: 110, cor: '#16151c'}, {t: `${watts} W`, tam: 70, cor: '#2c4a3a'}], '#b8e0a8', 512, 300);
  const fios = !de ? [] : [-1, 1].map((s) => {
    const a: V3 = [pos[0] + Math.cos(rotY) * s * r * 0.7, pos[1] - r * 0.7, pos[2] - Math.sin(rotY) * s * r * 0.7];
    const dx = de[0] - a[0], dy = de[1] - a[1], dz = de[2] - a[2];
    const L = Math.hypot(dx, dy, dz);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L));
    const e = new THREE.Euler().setFromQuaternion(q);
    return {p: [a[0] + dx / 2, a[1] + dy / 2, a[2] + dz / 2] as V3, rot: [e.x, e.y, e.z] as V3, L};
  });
  return (
    <group>
      {fios.map((f, i) => (<Cy key={i} p={f.p} rot={f.rot} r={0.002} h={f.L} c="#ffd23f" e="#ffd23f" ei={0.4} seg={6} sombra={false} />))}
      <group position={pos} rotation={[0, rotY, 0]}>
        <Placa pos={[0, 0, 0.002]} w={r * 1.5} h={r * 0.88} tex={tela} brilho={0.45} />
        <Cy p={[0, 0, -0.004]} rot={[Math.PI / 2, 0, 0]} r={r} h={0.006} c="#f6f6f2" rug={0.6} />
        <mesh><torusGeometry args={[r, 0.014, 12, 48]} /><meshStandardMaterial color="#16151c" roughness={0.35} metalness={0.3} /></mesh>
        <Cy p={[0, 0, 0.012]} rot={[Math.PI / 2, 0, 0]} r={r} h={0.004} c="#cfeaff" op={0.18} rug={0.05} sombra={false} />
        <group scale={[1, cima ? -1 : 1, 1]}>
          <Cy p={[r * 0.78, -r * 1.25, 0]} rot={[0, 0, 0.6]} r={r * 0.107} h={r * 1.07} c="#e0a63a" rug={0.5} />
          {[0, 1, 2].map((i) => (<Cy key={i} p={[r * 0.66 + i * r * 0.16, -r * 1.07 - i * r * 0.24, 0]} rot={[0, 0, 0.6]} r={r * 0.12} h={r * 0.04} c="#16151c" sombra={false} />))}
        </group>
      </group>
    </group>
  );
};
// tapetinho solto (passadeira) com franja: objeto de cena para quebrar o piso liso
export const Tapetinho: React.FC<{pos: V3; larg: number; prof: number; rotY?: number}> = ({pos, larg, prof, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0075, 0]} receiveShadow>
      <planeGeometry args={[larg, prof]} />
      <meshStandardMaterial map={texTapete()} roughness={1} />
    </mesh>
    <Bx p={[0, 0.003, 0]} s={[larg, 0.006, prof]} c="#b8483a" sombra={false} />
    {[-1, 1].map((s) => Array.from({length: Math.round(prof / 0.06)}).map((_, i) => (<Bx key={s + '-' + i} p={[s * (larg / 2 + 0.02), 0.004, -prof / 2 + 0.03 + i * 0.06]} s={[0.04, 0.004, 0.012]} c="#efe4cf" sombra={false} />)))}
  </group>
);
export {Planta};
// tapete felpudo (tufos altos onde o robô barato enrosca)
const geoTufo = new THREE.CylinderGeometry(0.009, 0.013, 0.045, 5);
const TapeteFelpudo: React.FC<{pos: V3; larg: number; prof: number}> = ({pos, larg, prof}) => {
  const mats = useMemo(() => {
    const r = rng(17);
    const out: THREE.Matrix4[] = [];
    for (let x = -larg / 2; x < larg / 2; x += 0.028) for (let z = -prof / 2; z < prof / 2; z += 0.028) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.6, r() * 3, (r() - 0.5) * 0.6));
      out.push(new THREE.Matrix4().compose(new THREE.Vector3(pos[0] + x + (r() - 0.5) * 0.02, 0.02, pos[2] + z + (r() - 0.5) * 0.02), q, new THREE.Vector3(1, 0.8 + r() * 0.5, 1)));
    }
    return out;
  }, [pos[0], pos[2], larg, prof]);
  return (
    <group>
      <Bx p={[pos[0], 0.006, pos[2]]} s={[larg, 0.012, prof]} c="#d8cdb8" sombra={false} />
      <Instancias matrizes={mats} n={mats.length} geo={geoTufo} cor="#e9dfcc" sombra={false} />
    </group>
  );
};

export type CasaOpts = {piso?: 'madeira' | 'porcelanato'; tapete?: 'normal' | 'felpudo' | null; base?: boolean; jantar?: boolean; mesa?: boolean; t?: number; poeira?: boolean};
export const Casa: React.FC<CasaOpts> = ({piso = 'madeira', tapete = 'normal', base = true, jantar = true, mesa = true, t = 0, poeira = false}) => {
  const tp = texPiso(piso).clone();
  tp.needsUpdate = true;
  tp.repeat.set(piso === 'madeira' ? 5.8 / 1.6 : 5.8 / 1.2, piso === 'madeira' ? 5.4 / 1.6 : 5.4 / 1.2);
  const pFundo = texParede('#b9c9b0').clone();
  pFundo.needsUpdate = true;
  pFundo.repeat.set(4, 2);
  const pLado = texParede('#ece0cc').clone();
  pLado.needsUpdate = true;
  pLado.repeat.set(4, 2);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0, 0.5]} receiveShadow>
        <planeGeometry args={[5.8, 5.4]} />
        <meshStandardMaterial map={tp} roughness={piso === 'porcelanato' ? 0.18 : 0.42} metalness={piso === 'porcelanato' ? 0.08 : 0} />
      </mesh>
      {/* paredes + rodapé */}
      <mesh position={[0.2, 1.35, -2.25]} receiveShadow><boxGeometry args={[5.9, 2.7, 0.1]} /><meshStandardMaterial map={pFundo} roughness={0.95} /></mesh>
      <mesh position={[-2.65, 1.35, 0.5]} receiveShadow><boxGeometry args={[0.1, 2.7, 5.5]} /><meshStandardMaterial map={pLado} roughness={0.95} /></mesh>
      <mesh position={[3.05, 1.35, 0.5]} receiveShadow><boxGeometry args={[0.1, 2.7, 5.5]} /><meshStandardMaterial map={pLado} roughness={0.95} /></mesh>
      <Bx p={[0.2, 0.04, -2.192]} s={[5.9, 0.08, 0.016]} c="#fbfaf6" />
      <Bx p={[-2.592, 0.04, 0.5]} s={[0.016, 0.08, 5.5]} c="#fbfaf6" />
      <Bx p={[2.992, 0.04, 0.5]} s={[0.016, 0.08, 5.5]} c="#fbfaf6" />
      {/* móveis */}
      <Sofa pos={[0.2, 0, -1.74]} />
      {tapete === 'normal' && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0.004, -0.55]} receiveShadow>
            <planeGeometry args={[2.2, 1.5]} />
            <meshStandardMaterial map={texTapete()} roughness={1} />
          </mesh>
          {[-1, 1].map((s) => Array.from({length: 22}).map((_, i) => (<Bx key={s + '-' + i} p={[0.2 + s * 1.12, 0.004, -1.25 + i * 0.066]} s={[0.05, 0.004, 0.012]} c="#efe4cf" sombra={false} />)))}
        </group>
      )}
      {tapete === 'felpudo' && <TapeteFelpudo pos={[0.2, 0, -0.55]} larg={2.2} prof={1.5} />}
      {mesa && <MesaCentro pos={[0.2, tapete === 'felpudo' ? 0.03 : 0, -0.6]} />}
      <Luminaria pos={[-1.2, 0, -1.95]} />
      <Planta pos={[1.62, 0, -1.95]} />
      <Janela pos={[2.35, 1.5, -2.17]} />
      <Quadro pos={[-0.25, 1.5, -2.185]} w={0.6} h={0.45} n={0} />
      <Quadro pos={[0.65, 1.55, -2.185]} w={0.42} h={0.6} n={1} />
      <Prateleira pos={[-1.75, 1.35, -2.08]} />
      <Rack pos={[-2.37, 0, -0.25]} />
      {jantar && <Jantar pos={[2.25, 0, -0.45]} />}
      <Tomada pos={SALA.tomada} />
      {base && <Base pos={SALA.base} rotY={Math.PI / 2} t={t} />}
      {base && <Cabo pts={[[-2.585, 0.05, 0.9], [-2.585, 0.01, 1.05], [-2.582, 0.08, 1.2], [-2.586, 0.27, 1.22]]} cor="#e9e9ee" />}
      {poeira && <Tufos centro={[0.2, 0, -1.6]} lado={[1.8, 0.5]} n={14} seed={2} cor="#9a948c" />}
    </group>
  );
};

// ---------- cachorro (vira-lata caramelo, ~50 cm de comprimento) ----------
export const Cachorro: React.FC<{pos: V3; rotY?: number; t: number; pose?: 'empe' | 'senta' | 'deita'}> = ({pos, rotY = 0, t, pose = 'empe'}) => {
  const pelo = '#c98a4b', claro = '#f1dcc0', escuro = '#7a4a22';
  const rabo = Math.sin(t * 12) * 0.5;
  const resp = 1 + Math.sin(t * 2.5) * 0.03;
  const Cabeca: React.FC<{p: V3; r?: V3}> = ({p, r = [0, 0, 0]}) => (
    <group position={p} rotation={r}>
      <Bx s={[0.17, 0.15, 0.17]} c={pelo} flat />
      <Bx p={[0, -0.035, 0.11]} s={[0.095, 0.075, 0.1]} c={claro} flat />
      <Bx p={[0, -0.01, 0.164]} s={[0.04, 0.03, 0.02]} c="#16151c" rug={0.3} />
      {[-1, 1].map((s) => (<Esf key={'o' + s} p={[s * 0.045, 0.03, 0.087]} r={0.013} c="#16151c" rug={0.2} />))}
      {[-1, 1].map((s) => (<Bx key={'e' + s} p={[s * 0.095, -0.015, -0.01]} rot={[0, 0, s * 0.25]} s={[0.035, 0.12, 0.08]} c={escuro} flat />))}
    </group>
  );
  if (pose === 'deita')
    return (
      <group position={pos} rotation={[0, rotY, 0]}>
        <Bx p={[0, 0.09, 0]} s={[0.22, 0.17, 0.46]} esc={[1, resp, 1]} c={pelo} flat />
        <Bx p={[0, 0.06, 0.2]} s={[0.17, 0.1, 0.06]} c={claro} flat />
        {[-1, 1].map((s) => (<Bx key={'f' + s} p={[s * 0.07, 0.025, 0.3]} s={[0.055, 0.05, 0.18]} c={claro} flat />))}
        {[-1, 1].map((s) => (<Bx key={'t' + s} p={[s * 0.115, 0.05, -0.14]} s={[0.05, 0.09, 0.18]} c={pelo} flat />))}
        <Cabeca p={[0, 0.12, 0.33]} r={[0.15, 0, 0]} />
        <Barra a={[0, 0.1, -0.23]} b={[0.18, 0.02, -0.34]} r={0.018} cor={pelo} />
      </group>
    );
  if (pose === 'senta')
    return (
      <group position={pos} rotation={[0, rotY, 0]}>
        <Bx p={[0, 0.27, 0.0]} rot={[-0.75, 0, 0]} s={[0.21, 0.19, 0.4]} c={pelo} flat />
        <Bx p={[0, 0.3, 0.13]} rot={[-0.75, 0, 0]} s={[0.15, 0.15, 0.05]} c={claro} flat />
        {[-1, 1].map((s) => (<Cy key={'p' + s} p={[s * 0.065, 0.14, 0.14]} r={0.03} h={0.28} c={pelo} flat />))}
        {[-1, 1].map((s) => (<Bx key={'pf' + s} p={[s * 0.065, 0.015, 0.17]} s={[0.05, 0.03, 0.07]} c={claro} flat />))}
        {[-1, 1].map((s) => (<Bx key={'c' + s} p={[s * 0.11, 0.08, -0.08]} s={[0.06, 0.15, 0.2]} c={pelo} flat />))}
        <Cabeca p={[0, 0.53, 0.17]} r={[0, Math.sin(t * 1.5) * 0.2, 0]} />
        <mesh position={[0, 0.44, 0.15]} rotation={[Math.PI / 2 - 0.5, 0, 0]}><torusGeometry args={[0.07, 0.012, 10, 28]} /><meshStandardMaterial color="#e8322b" /></mesh>
        <Barra a={[0, 0.06, -0.18]} b={[Math.sin(rabo) * 0.2, 0.02, -0.33]} r={0.018} cor={pelo} />
      </group>
    );
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (<Cy key={i} p={[sx * 0.075, 0.13, sz * 0.16]} r={0.032} h={0.26} c={i > 1 ? claro : pelo} flat />))}
      <Bx p={[0, 0.34, 0]} s={[0.21, 0.19, 0.46]} c={pelo} flat />
      <Bx p={[0, 0.31, 0.22]} s={[0.15, 0.13, 0.05]} c={claro} flat />
      <Cabeca p={[0, 0.5, 0.29]} />
      <mesh position={[0, 0.43, 0.24]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.075, 0.012, 10, 28]} /><meshStandardMaterial color="#e8322b" /></mesh>
      <Barra a={[0, 0.4, -0.23]} b={[Math.sin(rabo) * 0.12, 0.55, -0.36]} r={0.018} cor={pelo} />
    </group>
  );
};

// ---------- aspirador de pó convencional (de arrastar, 1.200 W) ----------
export const AspiradorPo: React.FC<{pos: V3; mao: V3; bocal: V3; rotY?: number}> = ({pos, mao, bocal, rotY = 0}) => {
  const porta: V3 = [pos[0] + Math.sin(rotY) * 0.2, 0.15, pos[2] + Math.cos(rotY) * 0.2];
  const meio: V3 = [(porta[0] + mao[0]) / 2, Math.max(porta[1], mao[1]) + 0.05, (porta[2] + mao[2]) / 2 + 0.1];
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([porta, meio, mao].map((p) => new THREE.Vector3(...p))), 30, 0.019, 8, false), [JSON.stringify([porta, mao])]);
  const rotulo = texTexto('asp-1200', [{t: '1.200 W', tam: 120, cor: '#ffffff'}], '#a51f19', 512, 200);
  const dir = new THREE.Vector3(bocal[0] - mao[0], 0, bocal[2] - mao[2]);
  const angB = Math.atan2(dir.x, dir.z);
  return (
    <group>
      <group position={pos} rotation={[0, rotY, 0]}>
        <Cy p={[0, 0.14, 0]} rot={[Math.PI / 2, 0, 0]} r={0.125} h={0.34} c="#d8322b" rug={0.35} seg={20} />
        <Bx p={[0, 0.24, -0.02]} s={[0.16, 0.06, 0.24]} c="#2b2e35" rug={0.4} />
        <Barra a={[0, 0.27, -0.1]} b={[0, 0.33, 0.0]} r={0.012} cor="#2b2e35" />
        <Barra a={[0, 0.33, 0.0]} b={[0, 0.27, 0.08]} r={0.012} cor="#2b2e35" />
        {[-1, 1].map((s) => (<Cy key={s} p={[s * 0.13, 0.085, -0.1]} rot={[0, 0, Math.PI / 2]} r={0.085} h={0.035} c="#16151c" seg={18} />))}
        <Cy p={[0, 0.025, 0.14]} r={0.025} h={0.03} c="#16151c" />
        <Cy p={[0, 0.15, 0.175]} rot={[Math.PI / 2, 0, 0]} r={0.03} h={0.03} c="#2b2e35" />
        <Placa pos={[0.127, 0.15, 0]} rot={[0, Math.PI / 2, 0]} w={0.18} h={0.07} tex={rotulo} />
        {[0, 1, 2, 3].map((i) => (<Bx key={'v' + i} p={[-0.127, 0.11 + i * 0.022, 0.0]} s={[0.003, 0.008, 0.12]} c="#16151c" sombra={false} />))}
      </group>
      <mesh geometry={geo} castShadow><meshStandardMaterial color="#4a4f59" roughness={0.6} /></mesh>
      <Barra a={mao} b={bocal} r={0.013} cor="#c3c8cf" />
      <Cy p={[mao[0], mao[1] + 0.03, mao[2]]} r={0.02} h={0.12} c="#2b2e35" />
      <group position={[bocal[0], 0.02, bocal[2]]} rotation={[0, angB, 0]}>
        <Bx s={[0.28, 0.035, 0.08]} c="#2b2e35" />
        <Bx p={[0, -0.016, 0.03]} s={[0.26, 0.006, 0.01]} c="#e9e4d8" sombra={false} />
      </group>
    </group>
  );
};

// ---------- coluna de energia (cada bloco = 0,03 kWh) ----------
const texRaio = () =>
  texCanvas('rb2-raio', 128, 128, (g) => {
    g.fillStyle = '#ffd23f';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#16151c';
    g.beginPath();
    g.moveTo(74, 14);
    g.lineTo(36, 72);
    g.lineTo(62, 72);
    g.lineTo(50, 116);
    g.lineTo(92, 54);
    g.lineTo(66, 54);
    g.closePath();
    g.fill();
  });
export const ColunaEnergia: React.FC<{pos: V3; n: number}> = ({pos, n}) => (
  <group position={pos}>
    {Array.from({length: Math.max(0, Math.ceil(n))}).map((_, i) => {
      const k = clamp01(n - i);
      return (
        <mesh key={i} position={[0, 0.02 + i * 0.038, 0]} scale={[1, Math.max(0.01, k), 1]} castShadow>
          <boxGeometry args={[0.13, 0.034, 0.13]} />
          <meshStandardMaterial map={texRaio()} emissive="#ffb000" emissiveIntensity={0.15} />
        </mesh>
      );
    })}
  </group>
);

// ---------- props menores ----------
export const Requeijao: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Cy p={[0, 0.03, 0]} r={0.038} h={0.058} c="#f6f1e2" rug={0.6} />
    <Cy p={[0, 0.043, 0]} r={0.04} r2={0.0435} h={0.086} c="#dff0fa" op={0.4} rug={0.05} />
    <Cy p={[0, 0.045, 0]} r={0.0445} h={0.034} c="#2f6fd6" aberto dupla />
    <Placa pos={[0, 0.045, 0.0452]} w={0.05} h={0.026} tex={texTexto('reqj', [{t: 'REQUEIJÃO', tam: 90, cor: '#ffffff'}], '#2f6fd6', 512, 260)} />
  </group>
);
export const Lixeira: React.FC<{pos: V3; rotY?: number; abre?: number}> = ({pos, rotY = 0, abre = 1}) => (
  // lixeira de pedal (Ø 26 cm × 40 cm): tampa articulada na dobradiça de trás, aberta ~100° (abre = 0..1)
  <group position={pos} rotation={[0, rotY, 0]}>
    <Cy p={[0, 0.2, 0]} r={0.13} r2={0.145} h={0.4} c="#b9c0c9" met={0.6} rug={0.3} seg={24} />
    {/* frisos do inox e aro de cima */}
    {[0.12, 0.28].map((y) => (<Cy key={y} p={[0, y, 0]} r={0.1365 - (y - 0.2) * 0.04} h={0.01} c="#8e959e" met={0.7} rug={0.35} seg={24} />))}
    <Cy p={[0, 0.395, 0]} r={0.134} h={0.014} c="#2b2e35" seg={24} />
    {/* saco de lixo preto dobrado na borda + sujeira dentro */}
    <Cy p={[0, 0.39, 0]} r={0.124} h={0.02} c="#16151c" rug={0.9} seg={24} aberto dupla />
    <Cy p={[0, 0.33, 0]} r={0.118} h={0.004} c="#6b5039" rug={1} seg={20} />
    {/* dobradiça atrás */}
    <Bx p={[0, 0.4, -0.137]} s={[0.07, 0.025, 0.02]} c="#2b2e35" met={0.4} />
    <Cy p={[0, 0.41, -0.145]} rot={[0, 0, Math.PI / 2]} r={0.007} h={0.08} c="#6d737c" met={0.8} seg={10} />
    <group position={[0, 0.41, -0.145]} rotation={[-1.75 * abre, 0, 0]}>
      <Cy p={[0, 0, 0.145]} r={0.142} h={0.016} c="#9aa3ad" met={0.6} rug={0.3} seg={24} />
      <Cy p={[0, -0.009, 0.145]} r={0.128} h={0.003} c="#d7dce2" rug={0.5} seg={24} />
    </group>
    {/* pedal + haste */}
    <Bx p={[0, 0.02, 0.16]} s={[0.1, 0.02, 0.06]} c="#16151c" />
    <Bx p={[0, 0.02, 0.135]} s={[0.02, 0.012, 0.02]} c="#6d737c" met={0.8} />
  </group>
);
export const Balde: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Cy p={[0, 0.12, 0]} r={0.11} r2={0.135} h={0.24} c="#3d7fd9" />
    <Cy p={[0, 0.2, 0]} r={0.125} h={0.01} c="#a9d8f0" e="#a9d8f0" ei={0.2} />
    <mesh position={[0, 0.24, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.13, 0.006, 10, 28, Math.PI]} /><meshStandardMaterial color="#2b2e35" /></mesh>
    <Barra a={[0.15, 0.02, 0.05]} b={[0.22, 1.25, 0.0]} r={0.013} cor="#e0a63a" />
    <Bx p={[0.15, 0.03, 0.05]} s={[0.07, 0.05, 0.07]} c="#efe8dc" />
  </group>
);
export const Calculadora: React.FC<{pos: V3; rotY?: number; texto: string}> = ({pos, rotY = 0, texto}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Bx p={[0, 0.007, 0]} s={[0.085, 0.014, 0.15]} c="#2b2e35" />
    <Placa pos={[0, 0.0145, -0.045]} rot={[-Math.PI / 2, 0, 0]} w={0.072} h={0.032} tex={texTexto(`calc-${texto}`, [{t: texto, tam: 150, cor: '#16151c'}], '#b8e0a8', 512, 220)} brilho={0.3} />
    {Array.from({length: 4}).map((_, i) => Array.from({length: 4}).map((__, j) => (
      <Bx key={i + '-' + j} p={[-0.027 + i * 0.018, 0.0155, -0.012 + j * 0.019]} s={[0.014, 0.004, 0.014]} c={i === 3 ? '#ff8a1f' : '#d9dde2'} sombra={false} />
    )))}
  </group>
);
export const Recibo: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Placa pos={[0, 0.006, 0]} rot={[-Math.PI / 2, 0, 0]} w={0.075} h={0.2} tex={texTexto('recibo', [{t: 'NOTA', tam: 60, cor: '#16151c'}, {t: 'ROBÔ', tam: 50, cor: '#16151c'}, {t: 'ASPIRADOR', tam: 40, cor: '#16151c'}, {t: '------', tam: 40, cor: '#888'}, {t: 'R$ 299', tam: 70, cor: '#e8322b'}], '#fbfaf5', 256, 640)} />
  </group>
);
// ferramentas na bancada: tapete de corte, chave de fenda, parafusos, bandeja de peças, luminária de mesa
const texMat = () =>
  texCanvas('rb2-mat', 512, 340, (g) => {
    g.fillStyle = '#2f8a5b';
    g.fillRect(0, 0, 512, 340);
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 1.5;
    for (let x = 0; x < 512; x += 24) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 340);
      g.stroke();
    }
    for (let y = 0; y < 340; y += 24) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y);
      g.stroke();
    }
    g.fillStyle = '#ffffff';
    g.font = `800 14px ${F}`;
    for (let i = 0; i < 20; i++) g.fillText(String(i), 4 + i * 24, 14);
  });
export const Ferramentas: React.FC<{y: number}> = ({y}) => (
  <group>
    <mesh position={[0, y + 0.002, 0.02]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[0.78, 0.5]} />
      <meshStandardMaterial map={texMat()} roughness={0.8} />
    </mesh>
    <group position={[0.3, y + 0.012, 0.2]} rotation={[0, 0.7, 0]}>
      <Cy rot={[Math.PI / 2, 0, 0]} r={0.013} h={0.1} c="#e8322b" />
      <Cy p={[0, 0, 0.1]} rot={[Math.PI / 2, 0, 0]} r={0.003} h={0.1} c="#c3c8cf" met={0.8} />
    </group>
    {[[0.22, 0.12], [0.25, 0.1], [0.2, 0.08], [0.27, 0.14]].map(([x, z], i) => (<Cy key={i} p={[x, y + 0.004, z]} r={0.003} h={0.008} c="#9aa3ad" met={0.8} seg={6} />))}
    <Bx p={[-0.3, y + 0.012, 0.18]} s={[0.14, 0.02, 0.09]} c="#4f8cff" />
    <Bx p={[-0.3, y + 0.02, 0.18]} s={[0.13, 0.004, 0.08]} c="#2b5fc4" />
    {/* luminária articulada */}
    <group position={[-0.32, y, -0.12]}>
      <Cy p={[0, 0.01, 0]} r={0.06} h={0.02} c="#16151c" />
      <Barra a={[0, 0.02, 0]} b={[0.05, 0.3, 0.04]} r={0.008} cor="#ffd23f" />
      <Barra a={[0.05, 0.3, 0.04]} b={[0.2, 0.36, 0.1]} r={0.008} cor="#ffd23f" />
      <group position={[0.22, 0.34, 0.11]} rotation={[0.4, 0, -0.6]}>
        <Cy r={0.03} r2={0.055} h={0.07} c="#ffd23f" aberto dupla />
      </group>
      <pointLight position={[0.24, 0.3, 0.13]} color="#fff2d6" intensity={0.6} distance={1.2} />
    </group>
  </group>
);

// ---------- ondas de som e pessoas ----------
export const Ondas: React.FC<{pos: V3; t: number; cor?: string; r0?: number; alcance?: number}> = ({pos, t, cor = '#7fd6ff', r0 = 0.18, alcance = 0.25}) => (
  <group position={pos}>
    {[0, 1, 2].map((i) => {
      const k = (t * 0.8 + i / 3) % 1;
      return (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <torusGeometry args={[r0 + k * alcance, 0.003, 10, 40]} />
          <meshBasicMaterial color={cor} transparent opacity={(1 - k) * 0.8} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);
export const DIARISTA = (camisa: string, pele: string, cabelo: string): Visual => ({camisa, colete: null, capacete: null, calca: '#2d3e5a', pele, cabelo});
export {Boneco, TESTADOR, Medidor, Meia, Moeda, Cabo};
