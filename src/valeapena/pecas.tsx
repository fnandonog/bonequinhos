// Peças do perfil VALE A PENA? em ESCALA REAL (1 unidade = 1 metro).
// Air fryer de 4 L / 1.500 W: 28,5 (L) × 29,5 (A) × 36,5 (P) cm (ficha técnica), aberta em corte para mostrar o mecanismo.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {AcaoBoneco, Barra, Boneco, Caixa, Cil, Expressao, Instancias, Mat, Visual, clamp01, lerp, suave} from '../v4/kit';
import {texCanvas} from '../cozinha/pecas';

export {clamp01, lerp, suave};
const F = "'Baloo 2', sans-serif";
export const BANCADA = 0.9; // altura do tampo da bancada de teste
export const AF = {L: 0.285, A: 0.295, P: 0.365};
const COR = {corpo: '#25262c', corpo2: '#34363e', dentro: '#17181c', cuba: '#2c2e35', cesto: '#3a3d46', inox: '#c3c8cf', corteBorda: '#ff8a1f'};
export const BATATA = {crua: '#f3dc9a', dourada: '#dc9433', mole: '#ecdca6'};

// material que pode sumir (a metade da frente some quando a air fryer abre em corte)
const MatF: React.FC<{cor: string; op?: number; emissivo?: string; ei?: number; rugoso?: number}> = ({cor, op = 1, emissivo = '#000000', ei = 1, rugoso = 0.7}) => (
  <meshStandardMaterial color={cor} roughness={rugoso} transparent={op < 1} opacity={op} depthWrite={op >= 1} emissive={emissivo} emissiveIntensity={ei} />
);
const Bloco: React.FC<{pos: V3; tam: V3; cor: string; op?: number; rot?: V3}> = ({pos, tam, cor, op = 1, rot = [0, 0, 0]}) =>
  op <= 0.01 ? null : (
    <mesh position={pos} rotation={rot} castShadow={op >= 1} receiveShadow>
      <boxGeometry args={tam} />
      <MatF cor={cor} op={op} />
    </mesh>
  );

// ---------- texturas ----------
const texDialAF = (tipo: 'temp' | 'timer') =>
  texCanvas(`vp-dial-${tipo}`, 256, 256, (g) => {
    g.fillStyle = '#1f2026';
    g.fillRect(0, 0, 256, 256);
    g.translate(128, 128);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const marcas = tipo === 'temp' ? ['80', '120', '160', '200'] : ['0', '15', '30', '60'];
    marcas.forEach((m, i) => {
      const a = (-120 + i * 80) * (Math.PI / 180);
      g.save();
      g.rotate(a);
      const destaque = (tipo === 'temp' && m === '200') || (tipo === 'timer' && m === '15');
      g.font = `800 ${destaque ? 46 : 36}px ${F}`;
      g.fillStyle = destaque ? '#ff8a1f' : '#e9e9ee';
      g.fillText(m, 0, -96);
      g.restore();
    });
  });
// posição do ponteiro do dial de temperatura: 80 °C = -120°, 200 °C = +120°
export const DIAL_TEMP = (graus: number) => ((-120 + ((graus - 80) / 120) * 240) * Math.PI) / 180;

const texCesto = () =>
  texCanvas('vp-cesto', 128, 128, (g) => {
    g.fillStyle = '#3a3d46';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#0d0e11';
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      g.beginPath();
      g.arc(8 + i * 16, 8 + j * 16, 4.5, 0, Math.PI * 2);
      g.fill();
    }
  });

export const texTexto = (id: string, linhas: {t: string; cor?: string; tam?: number}[], fundo: string, w = 512, h = 512) =>
  texCanvas(`vp-txt-${id}`, w, h, (g) => {
    g.fillStyle = fundo;
    g.fillRect(0, 0, w, h);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const total = linhas.reduce((s, l) => s + (l.tam ?? 64) * 1.15, 0);
    let y = h / 2 - total / 2;
    for (const l of linhas) {
      const fs = l.tam ?? 64;
      g.font = `800 ${fs}px ${F}`;
      g.fillStyle = l.cor ?? '#ffffff';
      g.fillText(l.t, w / 2, y + fs * 0.6);
      y += fs * 1.15;
    }
  });

// placa com texto (etiqueta de preço, rótulo da caixa, tela do medidor)
export const Placa: React.FC<{pos: V3; w: number; h: number; tex: THREE.Texture; rot?: V3; brilho?: number}> = ({pos, w, h, tex, rot = [0, 0, 0], brilho = 0}) => (
  <mesh position={pos} rotation={rot}>
    <planeGeometry args={[w, h]} />
    <meshStandardMaterial map={tex} roughness={0.7} emissive="#ffffff" emissiveMap={brilho > 0 ? tex : null} emissiveIntensity={brilho} />
  </mesh>
);

// ---------- batatas (palitos 1,1 × 1,1 × 7 cm) ----------
export type Carga = 'nenhuma' | 'fina' | 'lotado';
const geoBatata = new THREE.BoxGeometry(0.011, 0.011, 0.07);
export function posBatatas(carga: Carga, lado = 0.17, seed = 5) {
  if (carga === 'nenhuma') return [] as THREE.Matrix4[];
  let s = seed;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const camadas = carga === 'fina' ? 1 : 7;
  const porCamada = carga === 'fina' ? 14 : 22;
  const out: THREE.Matrix4[] = [];
  for (let c = 0; c < camadas; c++) {
    for (let i = 0; i < porCamada; i++) {
      // pilha mais alta no meio (monte)
      const x = (r() - 0.5) * (lado - 0.05);
      const z = (r() - 0.5) * (lado - 0.05);
      const centro = 1 - Math.min(1, Math.hypot(x, z) / (lado * 0.6));
      const y = 0.007 + c * 0.0135 * (0.7 + 0.6 * centro) + r() * 0.004;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.4, r() * Math.PI, (r() - 0.5) * 0.4));
      out.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1)));
    }
  }
  return out;
}
export const Batatas: React.FC<{pos: V3; carga: Carga; cor: string; lado?: number; seed?: number; chacoalha?: number; t?: number}> = ({pos, carga, cor, lado, seed, chacoalha = 0, t = 0}) => {
  const mats = useMemo(() => posBatatas(carga, lado, seed), [carga, lado, seed]);
  if (!mats.length) return null;
  const sh = chacoalha * Math.sin(t * 22);
  return (
    <group position={[pos[0] + sh * 0.01, pos[1] + Math.abs(sh) * 0.01, pos[2]]}>
      <Instancias matrizes={mats} n={mats.length} geo={geoBatata} cor={cor} />
    </group>
  );
};

// ---------- a AIR FRYER ----------
// medidas internas (locais; y = 0 na base, frente = +z)
const W = AF.L, H = AF.A, D = AF.P;
export const AF_IN = {
  cubaY0: 0.02, cubaY1: 0.18, cubaX: 0.118, cubaZ: 0.118, cubaZc: 0.0,
  cestoY: 0.045, cestoY1: 0.158, cestoX: 0.095,
  resY: 0.205, ventY: 0.237, rRes: 0.095,
};
const GAVETA_Y1 = 0.19; // topo da frente da gaveta

// resistência em espiral achatada (como as de verdade, logo abaixo da ventoinha)
const geoResistencia = (() => {
  const pts: THREE.Vector3[] = [];
  const voltas = 3.2;
  for (let i = 0; i <= 160; i++) {
    const k = i / 160;
    const a = k * voltas * Math.PI * 2;
    const r = 0.025 + k * (AF_IN.rRes - 0.025);
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.0045, 6, false);
})();

export const Resistencia: React.FC<{calor: number; pos?: V3}> = ({calor, pos = [0, AF_IN.resY, 0]}) => (
  <group position={pos}>
    <mesh geometry={geoResistencia}>
      <meshStandardMaterial color={new THREE.Color('#6b6b70').lerp(new THREE.Color('#ff5a1a'), calor).getStyle()} emissive="#ff3a00" emissiveIntensity={calor * 2.2} roughness={0.5} />
    </mesh>
    {[0, 1, 2].map((i) => (<Barra key={i} a={[Math.cos(i * 2.09) * 0.1, 0, Math.sin(i * 2.09) * 0.1]} b={[0, 0, 0]} r={0.002} cor="#8a8f99" sombra={false} />))}
    {calor > 0.05 && <pointLight position={[0, -0.03, 0]} color="#ff7a2a" intensity={0.5 * calor} distance={0.5} decay={1.5} />}
  </group>
);

export const Ventoinha: React.FC<{giro: number; pos?: V3}> = ({giro, pos = [0, AF_IN.ventY, 0]}) => (
  <group position={pos}>
    <group rotation={[0, giro, 0]}>
      <Cil r={0.022} h={0.012} cor="#9aa0aa" seg={12} />
      {Array.from({length: 8}).map((_, i) => (
        <group key={i} rotation={[0, (i * Math.PI) / 4, 0]}>
          <group position={[0.055, 0, 0]} rotation={[0.55, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.07, 0.022, 0.003]} />
              <meshStandardMaterial color="#c7ccd6" roughness={0.35} metalness={0.4} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
    {/* motor */}
    <Cil pos={[0, 0.026, 0]} r={0.045} h={0.03} cor="#5d6270" seg={14} />
    <Cil pos={[0, 0.015, 0]} r={0.006} h={0.02} cor="#c3c8cf" seg={8} />
  </group>
);

// partículas de ar quente: descem pelo centro, passam pela comida, abrem no fundo e sobem pelas laterais
function caminhoAr(s: number, ang: number, bloqueio: number, topoPilha: number): {p: V3; quente: number; vis: number} {
  const sq = (r: number): [number, number] => {
    const c = Math.cos(ang), sn = Math.sin(ang);
    const m = Math.max(Math.abs(c), Math.abs(sn));
    return [(c / m) * r, (sn / m) * r];
  };
  const {resY, cubaY0} = AF_IN;
  let r: number, y: number, quente: number;
  if (s < 0.38) {
    const k = s / 0.38;
    r = 0.015 + 0.05 * k;
    y = lerp(resY - 0.01, cubaY0 + 0.012, k);
    quente = 1 - k * 0.4;
  } else if (s < 0.5) {
    const k = (s - 0.38) / 0.12;
    r = lerp(0.065, 0.106, k);
    y = cubaY0 + 0.012;
    quente = 0.6;
  } else if (s < 0.84) {
    const k = (s - 0.5) / 0.34;
    r = 0.106;
    y = lerp(cubaY0 + 0.012, resY + 0.005, k);
    quente = 0.5;
  } else {
    const k = (s - 0.84) / 0.16;
    r = lerp(0.106, 0.02, k);
    y = resY + 0.012;
    quente = 0.75 + k * 0.25;
  }
  let vis = 1;
  if (bloqueio > 0) {
    // cesto lotado: o ar bate no monte e não desce; só o trecho de cima aparece, acumulado em cima da pilha
    if (s < 0.38) {
      if (y < topoPilha) { y = topoPilha + ((s * 37) % 1) * 0.012; r *= 1.3; quente = 0.9; }
    } else vis = 1 - bloqueio;
  }
  const [x, z] = sq(r);
  return {p: [x, y, z], quente, vis};
}

const geoAr = new THREE.IcosahedronGeometry(0.0075, 0);
export const ArQuente: React.FC<{t: number; fluxo: number; bloqueio?: number; topoPilha?: number; n?: number}> = ({t, fluxo, bloqueio = 0, topoPilha = 0.15, n = 64}) => {
  if (fluxo <= 0.01) return null;
  const itens: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const ang = (i * 2.399) % (Math.PI * 2);
    const s = (t * 0.55 + (i * 0.618) % 1) % 1;
    const {p, quente, vis} = caminhoAr(s, ang, bloqueio, topoPilha);
    if (vis <= 0.05) continue;
    const cor = quente > 0.7 ? '#ff5a1a' : quente > 0.55 ? '#ff9a2a' : '#ffc94a';
    itens.push(
      <mesh key={i} position={p} geometry={geoAr} scale={0.8 + quente * 0.6}>
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.9} transparent opacity={0.9 * fluxo * vis} depthWrite={false} />
      </mesh>,
    );
  }
  return <group>{itens}</group>;
};

// gaveta: frente + alça + cuba + cesto (+ batatas). "cortada" tira a metade da frente das paredes.
const Gaveta: React.FC<{cortada: boolean; carga: Carga; corBatata: string; chacoalha: number; t: number; opFrente: number}> = ({cortada, carga, corBatata, chacoalha, t, opFrente}) => {
  const {cubaY0, cubaY1, cubaX, cubaZ, cestoY, cestoY1, cestoX} = AF_IN;
  const hC = cubaY1 - cubaY0, yc = (cubaY0 + cubaY1) / 2;
  const hK = cestoY1 - cestoY, yk = (cestoY + cestoY1) / 2;
  const tc = texCesto();
  const meia = (largura: number) => (cortada ? largura / 2 : largura);
  const zMeia = (z: number) => (cortada ? -z / 2 : 0);
  const sh = chacoalha * Math.sin(t * 22) * 0.008;
  return (
    <group>
      {/* frente da gaveta e alça */}
      <Bloco pos={[0, (0.015 + GAVETA_Y1) / 2, D / 2 - 0.006]} tam={[W - 0.012, GAVETA_Y1 - 0.015, 0.012]} cor={COR.corpo2} op={opFrente} />
      {opFrente > 0.01 && (
        <group>
          <Bloco pos={[0, 0.12, D / 2 + 0.035]} tam={[0.05, 0.035, 0.06]} cor="#1b1c21" op={opFrente} />
          <Bloco pos={[0, 0.1, D / 2 + 0.06]} tam={[0.055, 0.1, 0.03]} cor="#1b1c21" op={opFrente} />
        </group>
      )}
      {/* cuba (panela que segura o ar quente) */}
      <Bloco pos={[0, cubaY0 + 0.003, 0]} tam={[cubaX * 2, 0.006, cubaZ * 2]} cor={COR.cuba} />
      <Bloco pos={[0, yc, -cubaZ]} tam={[cubaX * 2, hC, 0.006]} cor={COR.cuba} />
      {!cortada && <Bloco pos={[0, yc, cubaZ]} tam={[cubaX * 2, hC, 0.006]} cor={COR.cuba} />}
      {[-1, 1].map((sx) => (<Bloco key={sx} pos={[sx * cubaX, yc, zMeia(cubaZ)]} tam={[0.006, hC, meia(cubaZ * 2)]} cor={COR.cuba} />))}
      {cortada && [-1, 1].map((sx) => (<Bloco key={'b' + sx} pos={[sx * cubaX, yc, 0.001]} tam={[0.008, hC, 0.004]} cor={COR.corteBorda} />))}
      {/* cesto furado */}
      <group position={[sh, 0, 0]}>
        <mesh position={[0, cestoY, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[cestoX * 2, cestoX * 2]} />
          <meshStandardMaterial map={tc} side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
        <Bloco pos={[0, yk, -cestoX]} tam={[cestoX * 2, hK, 0.004]} cor={COR.cesto} />
        {!cortada && <Bloco pos={[0, yk, cestoX]} tam={[cestoX * 2, hK, 0.004]} cor={COR.cesto} />}
        {[-1, 1].map((sx) => (<Bloco key={sx} pos={[sx * cestoX, yk, zMeia(cestoX)]} tam={[0.004, hK, meia(cestoX * 2)]} cor={COR.cesto} />))}
        {[-1, 1].map((sz) => (<Bloco key={'p' + sz} pos={[0, cestoY - 0.012, sz * 0.06]} tam={[0.03, 0.024, 0.03]} cor={COR.cesto} />))}
        <Batatas pos={[0, cestoY, 0]} carga={carga} cor={corBatata} lado={cestoX * 2} t={t} chacoalha={chacoalha} />
      </group>
    </group>
  );
};

export type AirFryerProps = {
  pos: V3; rotY?: number; t: number;
  corte?: number; // 0 = fechada; 1 = metade da frente some (vista em corte)
  calor?: number; giro?: number; fluxo?: number; bloqueio?: number;
  carga?: Carga; corBatata?: string; chacoalha?: number; gaveta?: number; dialTemp?: number; dialTimer?: number; luzOn?: boolean;
};
export const AirFryer: React.FC<AirFryerProps> = ({pos, rotY = 0, t, corte = 0, calor = 0, giro = 0, fluxo = 0, bloqueio = 0, carga = 'nenhuma', corBatata = BATATA.crua, chacoalha = 0, gaveta = 0, dialTemp = 80, dialTimer = 0, luzOn = false}) => {
  const op = 1 - suave(corte);
  const cortada = corte > 0.5;
  const esp = 0.012;
  const zf = cortada ? 0 : D / 2; // até onde vão as paredes
  const zc = cortada ? -D / 4 : 0;
  const pd = cortada ? D / 2 : D;
  const topoPilha = AF_IN.cestoY + (carga === 'lotado' ? 0.105 : 0.02);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {/* pés e base */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (<Cil key={i} pos={[sx * (W / 2 - 0.03), 0.004, sz * (D / 2 - 0.04)]} r={0.012} h={0.008} cor="#111" seg={8} />))}
      <Bloco pos={[0, 0.012, zc]} tam={[W, 0.01, pd]} cor={COR.corpo} />
      {/* paredes laterais, fundo e topo (metade de trás sempre; a da frente some no corte) */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <Bloco pos={[sx * (W / 2 - esp / 2), H / 2, -D / 4]} tam={[esp, H - 0.01, D / 2]} cor={COR.corpo} />
          <Bloco pos={[sx * (W / 2 - esp / 2), H / 2, D / 4]} tam={[esp, H - 0.01, D / 2]} cor={COR.corpo} op={op} />
        </group>
      ))}
      <Bloco pos={[0, H / 2, -D / 2 + esp / 2]} tam={[W, H - 0.01, esp]} cor={COR.corpo} />
      {/* saída de ar atrás */}
      {[0, 1, 2, 3].map((i) => (<Bloco key={'s' + i} pos={[0, 0.22 + i * 0.014, -D / 2 - 0.001]} tam={[0.12, 0.005, 0.003]} cor="#0d0e11" />))}
      <Bloco pos={[0, H - 0.008, -D / 4]} tam={[W, 0.016, D / 2]} cor={COR.corpo2} />
      <Bloco pos={[0, H - 0.008, D / 4]} tam={[W, 0.016, D / 2]} cor={COR.corpo2} op={op} />
      {/* teto interno escuro + parede interna de trás (para o corte ficar legível) */}
      <Bloco pos={[0, H - 0.02, zc]} tam={[W - 2 * esp, 0.006, pd - 0.02]} cor={COR.dentro} />
      <Bloco pos={[0, (GAVETA_Y1 + H) / 2, -D / 2 + esp + 0.003]} tam={[W - 2 * esp, H - GAVETA_Y1, 0.004]} cor={COR.dentro} />
      {/* painel da frente (em cima da gaveta) com os dois botões */}
      {op > 0.01 && (
        <group>
          <Bloco pos={[0, (GAVETA_Y1 + H) / 2 - 0.004, D / 2 - 0.006]} tam={[W, H - GAVETA_Y1 - 0.008, 0.012]} cor={COR.corpo2} op={op} />
          {[{x: -0.065, tipo: 'temp' as const, ang: DIAL_TEMP(dialTemp)}, {x: 0.065, tipo: 'timer' as const, ang: ((-120 + (dialTimer / 60) * 240) * Math.PI) / 180}].map((d) => (
            <group key={d.tipo} position={[d.x, (GAVETA_Y1 + H) / 2, D / 2 + 0.001]}>
              <mesh>
                <circleGeometry args={[0.04, 40]} />
                <meshStandardMaterial map={texDialAF(d.tipo)} transparent={op < 1} opacity={op} />
              </mesh>
              <group rotation={[0, 0, -d.ang]}>
                <Cil pos={[0, 0, 0.01]} rot={[Math.PI / 2, 0, 0]} r={0.022} h={0.02} cor="#3a3c44" seg={16} />
                <Caixa pos={[0, 0.012, 0.021]} tam={[0.005, 0.02, 0.003]} cor="#ff8a1f" sombra={false} />
              </group>
            </group>
          ))}
          <mesh position={[0, H - 0.02, D / 2 + 0.001]}>
            <circleGeometry args={[0.005, 40]} />
            <meshStandardMaterial color={luzOn ? '#ff3a1a' : '#552222'} emissive="#ff2a00" emissiveIntensity={luzOn ? 2 : 0} transparent={op < 1} opacity={op} />
          </mesh>
        </group>
      )}
      {/* borda laranja onde a carcaça foi "serrada" */}
      {cortada && (
        <group>
          {[-1, 1].map((sx) => (<Bloco key={sx} pos={[sx * (W / 2 - esp / 2), H / 2, 0.001]} tam={[esp + 0.002, H - 0.01, 0.004]} cor={COR.corteBorda} />))}
          <Bloco pos={[0, H - 0.008, 0.001]} tam={[W, 0.018, 0.004]} cor={COR.corteBorda} />
        </group>
      )}
      {/* mecanismo */}
      <Ventoinha giro={giro} />
      <Resistencia calor={calor} />
      <group position={[0, 0, gaveta * 0.22]}>
        <Gaveta cortada={cortada} carga={carga} corBatata={corBatata} chacoalha={chacoalha} t={t} opFrente={op} />
        <ArQuente t={t} fluxo={fluxo} bloqueio={bloqueio} topoPilha={topoPilha} />
      </group>
    </group>
  );
};

// ---------- o Zé testador (de prancheta) ----------
export const TESTADOR: Visual = {camisa: '#ffffff', colete: '#2fbf71', capacete: null, calca: '#2b3550', cabelo: '#3b2a20'};
const texFicha = () =>
  texCanvas('vp-ficha', 256, 340, (g) => {
    g.fillStyle = '#fbfaf5';
    g.fillRect(0, 0, 256, 340);
    g.fillStyle = '#2fbf71';
    g.fillRect(0, 0, 256, 54);
    g.fillStyle = '#ffffff';
    g.font = `800 34px ${F}`;
    g.textAlign = 'center';
    g.fillText('TESTE', 128, 38);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = '#c9c6bb';
      g.fillRect(70, 90 + i * 40, 160, 8);
      g.strokeStyle = '#1d1b26';
      g.lineWidth = 5;
      g.strokeRect(24, 80 + i * 40, 26, 26);
      if (i < 4) {
        g.strokeStyle = '#2fbf71';
        g.lineWidth = 7;
        g.beginPath();
        g.moveTo(28, 92 + i * 40);
        g.lineTo(37, 102 + i * 40);
        g.lineTo(52, 78 + i * 40);
        g.stroke();
      }
    }
  });
export const Prancheta: React.FC<{pos?: V3; rot?: V3; esc?: number}> = ({pos = [0, 0, 0], rot = [0, 0, 0], esc = 1}) => (
  <group position={pos} rotation={rot} scale={esc}>
    <Caixa tam={[0.62, 0.8, 0.025]} cor="#b9824f" />
    <mesh position={[0, -0.03, 0.014]}>
      <planeGeometry args={[0.54, 0.68]} />
      <meshStandardMaterial map={texFicha()} roughness={0.9} />
    </mesh>
    <Caixa pos={[0, 0.36, 0.02]} tam={[0.22, 0.07, 0.03]} cor={COR.inox} />
  </group>
);
// Zé segurando a prancheta com as duas mãos (encaixe "frente" do Zé 2.0: as mãos pegam a borda de baixo)
export const ZeTestador: React.FC<{t: number; pos: V3; rotY?: number; acao?: AcaoBoneco; esc?: number; prancheta?: boolean; expressao?: Expressao; maoD?: React.ReactNode}> = ({t, pos, rotY = 0, acao = 'carrega', esc = 0.92, prancheta = true, expressao, maoD}) => (
  <Boneco pos={pos} rotY={rotY} acao={acao} t={t} v={TESTADOR} esc={esc} expressao={expressao} maoD={maoD}
    frente={prancheta && acao === 'carrega' ? <Prancheta pos={[0, 0.06, 0.1]} rot={[-1.05, 0, 0]} esc={0.8} /> : undefined} />
);

// ---------- laboratório de teste ----------
const texPegboard = () =>
  texCanvas('vp-peg', 128, 128, (g) => {
    g.fillStyle = '#7fb6d9';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#5b8fb3';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.beginPath();
      g.arc(16 + i * 32, 16 + j * 32, 4, 0, Math.PI * 2);
      g.fill();
    }
  }, true);
const texPisoLab = () =>
  texCanvas('vp-piso', 128, 128, (g) => {
    g.fillStyle = '#d9d4cb';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#cbc5ba';
    g.fillRect(0, 0, 64, 64);
    g.fillRect(64, 64, 64, 64);
  }, true);

export const Bancada: React.FC<{pos?: V3; larg?: number; prof?: number}> = ({pos = [0, 0, 0], larg = 1.6, prof = 0.75}) => (
  <group position={pos}>
    <Caixa pos={[0, BANCADA - 0.025, 0]} tam={[larg, 0.05, prof]} cor="#d7a46b" />
    <Caixa pos={[0, BANCADA - 0.055, prof / 2 - 0.01]} tam={[larg, 0.02, 0.02]} cor="#b9824f" sombra={false} />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (<Caixa key={i} pos={[sx * (larg / 2 - 0.05), (BANCADA - 0.05) / 2, sz * (prof / 2 - 0.05)]} tam={[0.06, BANCADA - 0.05, 0.06]} cor="#5d6270" />))}
    <Caixa pos={[0, 0.18, 0]} tam={[larg - 0.1, 0.03, prof - 0.1]} cor="#8b929e" />
    {/* gaveteiro */}
    <Caixa pos={[-larg / 2 + 0.3, 0.55, 0]} tam={[0.45, 0.6, prof - 0.12]} cor="#e85a4f" />
    {[0.38, 0.58, 0.78].map((y) => (<Caixa key={y} pos={[-larg / 2 + 0.3, y, prof / 2 - 0.05]} tam={[0.2, 0.02, 0.02]} cor={COR.inox} sombra={false} />))}
  </group>
);

const Ferramentas: React.FC = () => (
  <group>
    {/* chave, martelo, alicate e trena pendurados no painel perfurado */}
    <Caixa pos={[-1.1, 1.75, -1.17]} tam={[0.04, 0.3, 0.02]} cor="#c3c8cf" />
    <Caixa pos={[-0.85, 1.8, -1.17]} tam={[0.16, 0.05, 0.03]} cor="#555b66" />
    <Caixa pos={[-0.85, 1.65, -1.17]} tam={[0.03, 0.26, 0.03]} cor="#8b5a3c" />
    <Cil pos={[-0.55, 1.72, -1.16]} rot={[Math.PI / 2, 0, 0]} r={0.07} h={0.04} cor="#ffd23f" seg={12} />
    <Caixa pos={[0.95, 1.7, -1.17]} tam={[0.03, 0.28, 0.02]} cor="#e8322b" />
    <Caixa pos={[1.1, 1.7, -1.17]} tam={[0.03, 0.28, 0.02]} cor="#e8322b" />
  </group>
);

// cenário base: piso, parede com painel perfurado, placa "LAB DO ZÉ", relógio, prateleira
export const Laboratorio: React.FC<{t?: number; semBancada?: boolean}> = ({semBancada}) => {
  const peg = texPegboard();
  const k = peg.clone();
  k.needsUpdate = true;
  k.repeat.set(10, 4);
  const piso = texPisoLab();
  const kp = piso.clone();
  kp.needsUpdate = true;
  kp.repeat.set(16, 16);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial map={kp} roughness={0.95} />
      </mesh>
      <Caixa pos={[0, 1.6, -1.3]} tam={[9, 3.2, 0.1]} cor="#f1ece2" />
      <Caixa pos={[-3.2, 1.6, 0]} tam={[0.1, 3.2, 8]} cor="#e8e1d3" />
      <Caixa pos={[3.2, 1.6, 0]} tam={[0.1, 3.2, 8]} cor="#e8e1d3" />
      <mesh position={[0, 1.55, -1.24]}>
        <planeGeometry args={[3.2, 1.2]} />
        <meshStandardMaterial map={k} roughness={0.8} />
      </mesh>
      <Ferramentas />
      <Placa pos={[0, 2.45, -1.24]} w={1.3} h={0.32} tex={texTexto('lab', [{t: 'LAB DO ZÉ', tam: 110, cor: '#ffd23f'}], '#16151c', 640, 160)} brilho={0.2} />
      {/* prateleira com caixas de produtos */}
      <Caixa pos={[-2.2, 1.5, -1.12]} tam={[1.2, 0.04, 0.3]} cor="#d7a46b" />
      {[[-2.55, '#ff8a1f'], [-2.25, '#4f8cff'], [-1.95, '#2fbf71']].map(([x, c], i) => (<Caixa key={i} pos={[x as number, 1.65, -1.12]} tam={[0.24, 0.26, 0.24]} cor={c as string} />))}
      <Caixa pos={[2.2, 1.5, -1.12]} tam={[1.2, 0.04, 0.3]} cor="#d7a46b" />
      {[[1.85, '#ffd23f'], [2.2, '#e85a4f'], [2.55, '#7fb6d9']].map(([x, c], i) => (<Caixa key={i} pos={[x as number, 1.63, -1.12]} tam={[0.26, 0.22, 0.22]} cor={c as string} />))}
      {!semBancada && <Bancada pos={[0, 0, 0]} />}
    </group>
  );
};

// etiqueta de preço pendurada (cartão amarelo)
export const EtiquetaPreco: React.FC<{pos: V3; texto: string; sub?: string; rot?: V3; esc?: number}> = ({pos, texto, sub, rot = [0, 0, 0], esc = 1}) => (
  <group position={pos} rotation={rot} scale={esc}>
    <Caixa tam={[0.16, 0.1, 0.004]} cor="#ffd23f" />
    <Placa pos={[0, 0, 0.0025]} w={0.155} h={0.095} tex={texTexto(`preco-${texto}-${sub}`, [{t: texto, tam: 120, cor: '#16151c'}, ...(sub ? [{t: sub, tam: 54, cor: '#16151c'}] : [])], '#ffd23f', 512, 320)} />
  </group>
);

// caixa do produto (embalagem 34 × 36 × 42 cm)
export const CaixaProduto: React.FC<{pos: V3; rotY?: number; aberta?: number}> = ({pos, rotY = 0, aberta = 0}) => {
  const frente = texTexto('caixa-frente', [{t: 'AIR FRYER', tam: 92, cor: '#ffffff'}, {t: 'SEM ÓLEO', tam: 70, cor: '#ffd23f'}, {t: '4 L · 1.500 W', tam: 62, cor: '#ffffff'}, {t: 'até 200 °C', tam: 54, cor: '#ffffff'}], '#e8322b');
  const lado = texTexto('caixa-lado', [{t: '4 L', tam: 160, cor: '#e8322b'}, {t: 'até 4 pessoas*', tam: 46, cor: '#16151c'}], '#fbf7ee');
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Caixa pos={[0, 0.18, 0]} tam={[0.34, 0.36, 0.42]} cor="#e8322b" />
      <Placa pos={[0, 0.18, 0.211]} w={0.33} h={0.35} tex={frente} />
      <Placa pos={[0.171, 0.18, 0]} rot={[0, Math.PI / 2, 0]} w={0.41} h={0.35} tex={lado} />
      {/* abas abertas */}
      {aberta > 0 && [-1, 1].map((s) => (
        <group key={s} position={[s * 0.17, 0.36, 0]} rotation={[0, 0, s * (Math.PI / 2 + 0.4) * aberta * -1]}>
          <Caixa pos={[s * -0.085, 0, 0]} tam={[0.17, 0.004, 0.42]} cor="#c9281f" />
        </group>
      ))}
    </group>
  );
};

// medidor de energia de tomada (wattímetro) com tela de LCD
export const Medidor: React.FC<{pos: V3; kwh: number; watts: number; rot?: V3}> = ({pos, kwh, watts, rot = [0, 0, 0]}) => {
  const txt = kwh.toFixed(2).replace('.', ',');
  const tela = texTexto(`lcd-${txt}-${watts}`, [{t: `${txt} kWh`, tam: 110, cor: '#16151c'}, {t: `${watts} W`, tam: 70, cor: '#2c4a3a'}], '#b8e0a8', 512, 300);
  return (
    <group position={pos} rotation={rot}>
      <Caixa pos={[0, 0, 0.03]} tam={[0.075, 0.13, 0.06]} cor="#f2f2f0" />
      <Placa pos={[0, 0.02, 0.0605]} w={0.062} h={0.036} tex={tela} brilho={0.35} />
      {[-0.018, 0, 0.018].map((x) => (<Cil key={x} pos={[x, -0.035, 0.061]} rot={[Math.PI / 2, 0, 0]} r={0.006} h={0.004} cor="#3a3c44" seg={8} />))}
    </group>
  );
};

export const Tomada: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Caixa tam={[0.08, 0.12, 0.012]} cor="#ffffff" />
  </group>
);

// fio entre dois pontos passando por um ponto do meio (cabo de força)
export const Cabo: React.FC<{pts: V3[]; cor?: string}> = ({pts, cor = '#16151c'}) => {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 40, 0.004, 6, false), [JSON.stringify(pts)]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={cor} roughness={0.6} />
    </mesh>
  );
};

// moeda (10 centavos = 20 mm; 1 real = 27 mm)
export const Moeda: React.FC<{pos: V3; r?: number; cor?: string; rot?: V3}> = ({pos, r = 0.0135, cor = '#d9b44a', rot = [0, 0, 0]}) => (
  <group position={pos} rotation={rot}>
    <Cil r={r} h={0.002} cor={cor} seg={16} />
  </group>
);
export const PilhaMoedas: React.FC<{pos: V3; n: number; r?: number; cor?: string}> = ({pos, n, r, cor}) => (
  <group position={pos}>
    {Array.from({length: Math.max(0, Math.floor(n))}).map((_, i) => (<Moeda key={i} pos={[((i * 7) % 3) * 0.0008, 0.001 + i * 0.0022, ((i * 5) % 3) * 0.0008]} r={r} cor={cor} />))}
  </group>
);
// nota de dinheiro (cédula ~14 × 6,5 cm)
export const Nota: React.FC<{pos: V3; rot?: V3; cor?: string}> = ({pos, rot = [0, 0, 0], cor = '#8fc7a0'}) => (
  <group position={pos} rotation={rot}>
    <Caixa tam={[0.14, 0.001, 0.065]} cor={cor} sombra={false} />
    <Caixa pos={[0.03, 0.0008, 0]} tam={[0.04, 0.0005, 0.04]} cor="#5c9a6e" sombra={false} />
  </group>
);

// raio (símbolo de energia)
export const Raio: React.FC<{pos: V3; esc?: number; rotY?: number}> = ({pos, esc = 1, rotY = 0}) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.02, 0.1);
    s.lineTo(-0.035, -0.005);
    s.lineTo(0.0, -0.005);
    s.lineTo(-0.02, -0.1);
    s.lineTo(0.045, 0.02);
    s.lineTo(0.008, 0.02);
    s.lineTo(0.03, 0.1);
    s.lineTo(0.02, 0.1);
    return new THREE.ExtrudeGeometry(s, {depth: 0.012, bevelEnabled: false});
  }, []);
  return (
    <mesh geometry={geo} position={pos} rotation={[0, rotY, 0]} scale={esc}>
      <meshStandardMaterial color="#ffd23f" emissive="#ffb000" emissiveIntensity={0.6} />
    </mesh>
  );
};

// calendário de mesa com as semanas marcadas
export const Calendario: React.FC<{pos: V3; marcas: number; rotY?: number}> = ({pos, marcas, rotY = 0}) => {
  const n = Math.floor(marcas);
  const tex = texCanvas(`vp-cal-${n}`, 512, 400, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 512, 400);
    g.fillStyle = '#e8322b';
    g.fillRect(0, 0, 512, 80);
    g.fillStyle = '#ffffff';
    g.font = `800 56px ${F}`;
    g.textAlign = 'center';
    g.fillText('SEMANA', 256, 58);
    const dias = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    dias.forEach((d, i) => {
      g.fillStyle = '#16151c';
      g.font = `800 40px ${F}`;
      g.fillText(d, 40 + i * 72, 130);
    });
    for (let s = 0; s < 3; s++) for (let i = 0; i < 7; i++) {
      const x = 40 + i * 72, y = 200 + s * 70;
      g.fillStyle = '#e9e6dc';
      g.fillRect(x - 28, y - 28, 56, 56);
      const k = s * 2 + (i === 2 ? 0 : i === 5 ? 1 : -1);
      if ((i === 2 || i === 5) && k < n) {
        g.fillStyle = '#2fbf71';
        g.beginPath();
        g.arc(x, y, 24, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <group rotation={[-0.35, 0, 0]} position={[0, 0.11, 0]}>
        <Caixa tam={[0.3, 0.24, 0.01]} cor="#ffffff" />
        <Placa pos={[0, 0, 0.0055]} w={0.3} h={0.235} tex={tex} />
      </group>
      <Caixa pos={[0, 0.005, -0.04]} tam={[0.3, 0.01, 0.12]} cor="#16151c" />
    </group>
  );
};

// carimbo grande de veredito (desce e bate no papel)
export const Carimbo: React.FC<{pos: V3; desce: number; texto: string; cor: string}> = ({pos, desce, texto, cor}) => {
  const y = lerp(0.35, 0.0, suave(desce));
  const marca = texTexto(`selo-${texto}`, [{t: texto, tam: 220, cor}], '#00000000', 512, 300);
  return (
    <group position={pos}>
      {/* papel */}
      <Caixa pos={[0, 0.001, 0]} tam={[0.3, 0.002, 0.4]} cor="#fbfaf5" sombra={false} />
      {desce > 0.95 && (
        <mesh position={[0, 0.0025, 0]} rotation={[-Math.PI / 2, 0, 0.12]}>
          <planeGeometry args={[0.26, 0.15]} />
          <meshBasicMaterial map={marca} transparent />
        </mesh>
      )}
      <group position={[0, y + 0.01, 0]}>
        <Caixa pos={[0, 0.02, 0]} tam={[0.2, 0.04, 0.12]} cor="#16151c" />
        <Caixa pos={[0, 0.002, 0]} tam={[0.19, 0.006, 0.11]} cor={cor} />
        <Cil pos={[0, 0.09, 0]} r={0.02} h={0.1} cor="#8b5a3c" seg={10} />
        <mesh position={[0, 0.16, 0]} castShadow><sphereGeometry args={[0.045, 20, 14]} /><Mat cor="#8b5a3c" /></mesh>
      </group>
    </group>
  );
};

// travessa com batatas douradas / pão de queijo (final)
export const PratoBatata: React.FC<{pos: V3; cor?: string}> = ({pos, cor = BATATA.dourada}) => (
  <group position={pos}>
    <Cil pos={[0, 0.006, 0]} r={0.1} r2={0.08} h={0.012} cor="#ffffff" seg={24} />
    <Batatas pos={[0, 0.012, 0]} carga="fina" cor={cor} lado={0.13} seed={9} />
  </group>
);
export const PaoDeQueijo: React.FC<{pos: V3; n?: number}> = ({pos, n = 6}) => (
  <group position={pos}>
    <Cil pos={[0, 0.006, 0]} r={0.1} r2={0.08} h={0.012} cor="#ffffff" seg={24} />
    {Array.from({length: n}).map((_, i) => {
      const a = (i / n) * Math.PI * 2;
      const r = i === 0 ? 0 : 0.05;
      return (
        <mesh key={i} position={[Math.cos(a) * r, 0.026, Math.sin(a) * r]} scale={[1, 0.8, 1]} castShadow>
          <sphereGeometry args={[0.022, 20, 14]} />
          <meshStandardMaterial color={i % 2 ? '#e8b85a' : '#f0c56a'} roughness={0.8} />
        </mesh>
      );
    })}
  </group>
);

// ---------- ROBÔ ASPIRADOR ----------
// Dimensões reais: ~32 cm de diâmetro, 7.7 cm de altura (faixa R$299, sem LiDAR)
export const ROBO = {R: 0.155, H: 0.077};

export const RoboAspirador: React.FC<{
  pos: V3; t: number; rotY?: number;
  corte?: number; // 0 = fechado, 1 = internos visíveis (tampa levantada)
  ligado?: boolean; andando?: boolean; stuck?: boolean;
}> = ({pos, t, rotY = 0, corte = 0, ligado = false, andando = false, stuck = false}) => {
  const {R, H} = ROBO;
  const mostraTampa = corte < 0.5;
  const mostraInternos = corte > 0.4;
  const giroEscova = andando ? t * 8 : stuck ? t * 1.5 : 0;
  const wobble = stuck ? Math.sin(t * 24) * 0.006 : 0;
  return (
    <group position={[pos[0] + wobble, pos[1], pos[2]]} rotation={[0, rotY, 0]}>
      {/* disco principal */}
      <Cil pos={[0, H / 2, 0]} r={R} h={H} cor="#252628" seg={40} />
      {/* bumper frontal */}
      {mostraTampa && <Bloco pos={[0, H / 2, R * 0.08]} tam={[R * 1.08, H * 0.76, R * 0.54]} cor="#38393d" />}
      {/* tampa */}
      {mostraTampa && (
        <>
          <Cil pos={[0, H + 0.002, 0]} r={R * 0.98} h={0.006} cor="#2d2f33" seg={36} />
          <Cil pos={[0, H + 0.006, 0]} r={0.038} h={0.016} cor="#1f2124" seg={14} />
          <Cil pos={[R * 0.3, H + 0.019, 0.015]} r={0.007} h={0.004} cor={ligado ? '#2fbf71' : '#1c3022'} seg={8} />
          {ligado && <pointLight position={[R * 0.3, H + 0.02, 0.015]} color="#2fbf71" intensity={0.3} distance={0.4} />}
        </>
      )}
      {/* fundo */}
      <Cil pos={[0, 0.004, 0]} r={R * 0.97} h={0.008} cor="#111" seg={36} />
      <Bloco pos={[0, 0.005, R * 0.25]} tam={[0.065, 0.006, 0.08]} cor="#050506" />
      {/* escovinha lateral */}
      <group position={[R * 0.75, 0.004, R * 0.52]} rotation={[0, giroEscova, 0]}>
        <Cil r={0.012} h={0.004} cor="#444" seg={8} />
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return <Barra key={i} a={[0, 0.001, 0]} b={[Math.cos(a) * 0.052, 0.001, Math.sin(a) * 0.052]} r={0.0025} cor="#c0c0c0" sombra={false} />;
        })}
      </group>
      {/* rodas */}
      {([-1, 1] as const).map((s) => (
        <Cil key={s} pos={[s * R * 0.78, H * 0.3, 0]} rot={[Math.PI / 2, 0, 0]} r={0.026} h={0.016} cor="#111" seg={16} />
      ))}
      <Cil pos={[0, 0.012, R * 0.76]} rot={[Math.PI / 2, 0, 0]} r={0.012} h={0.009} cor="#222" seg={8} />
      {/* internos no corte */}
      {mostraInternos && (
        <>
          <Cil pos={[-0.038, H * 0.42, 0.005]} r={0.028} h={H * 0.68} cor="#888" seg={12} />
          <Cil pos={[-0.038, H * 0.82, 0.005]} r={0.038} h={0.014} cor="#555" seg={12} />
          <Bloco pos={[0.055, H * 0.42, -0.012]} tam={[0.08, H * 0.65, 0.105]} cor="#c8b898" />
          <Bloco pos={[0.055, H * 0.8, -0.012]} tam={[0.08, H * 0.15, 0.105]} cor="#f0ece6" />
          <Bloco pos={[0.052, H * 0.18, 0.07]} tam={[0.09, H * 0.28, 0.065]} cor="#4870b8" />
          <Bloco pos={[-0.04, H * 0.88, 0.04]} tam={[0.09, 0.004, 0.072]} cor="#2a5c35" />
          {([-1, 1] as const).map((s) => (
            <Cil key={s} pos={[s * 0.112, H * 0.5, R * 0.62]} r={0.007} h={0.015} cor="#111" seg={8} />
          ))}
        </>
      )}
    </group>
  );
};

// caixa do produto (robô aspirador, 38 × 40 × 38 cm)
export const CaixaRobo: React.FC<{pos: V3; rotY?: number; aberta?: number}> = ({pos, rotY = 0, aberta = 0}) => {
  const frente = texTexto('caixa-robo-frente', [{t: 'ROBÔ ASPIRADOR', tam: 72, cor: '#fff'}, {t: 'AUTO-RETORNO', tam: 56, cor: '#ffd23f'}, {t: '2.000 Pa · 90 min', tam: 48, cor: '#fff'}], '#1a3a6b');
  const lado = texTexto('caixa-robo-lado', [{t: '2000', tam: 158, cor: '#1a3a6b'}, {t: 'Pa sucção', tam: 44, cor: '#16151c'}], '#fbf7ee');
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Bloco pos={[0, 0.2, 0]} tam={[0.38, 0.4, 0.38]} cor="#1a3a6b" />
      <Placa pos={[0, 0.2, 0.191]} w={0.37} h={0.39} tex={frente} />
      <Placa pos={[0.191, 0.2, 0]} rot={[0, Math.PI / 2, 0]} w={0.37} h={0.39} tex={lado} />
      {aberta > 0 && ([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.19, 0.4, 0]} rotation={[0, 0, s * (Math.PI / 2 + 0.4) * aberta * -1]}>
          <Bloco pos={[s * -0.095, 0, 0]} tam={[0.19, 0.004, 0.38]} cor="#152f5a" />
        </group>
      ))}
    </group>
  );
};

// meia no chão (obstáculo para o robô)
export const Meia: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Bloco pos={[0, 0.016, 0]} tam={[0.055, 0.032, 0.14]} cor="#6b7de8" />
    <mesh position={[0, 0.016, 0.07]}>
      <sphereGeometry args={[0.027, 20, 14]} />
      <meshStandardMaterial color="#5a6cd0" roughness={0.9} />
    </mesh>
    <mesh position={[0, 0.022, -0.07]}>
      <sphereGeometry args={[0.03, 20, 14]} />
      <meshStandardMaterial color="#5a6cd0" roughness={0.9} />
    </mesh>
  </group>
);

// pelo de animal no chão (representado como fios curtos)
export const PeloAnimal: React.FC<{pos: V3; n?: number; seed?: number}> = ({pos, n = 30, seed = 7}) => {
  let s = seed;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return (
    <group position={pos}>
      {Array.from({length: n}).map((_, i) => {
        const x = (r() - 0.5) * 0.1, z = (r() - 0.5) * 0.1;
        const ang = r() * Math.PI, len = 0.018 + r() * 0.028;
        return (
          <Barra key={i} a={[x - Math.cos(ang) * len / 2, 0.001, z - Math.sin(ang) * len / 2]} b={[x + Math.cos(ang) * len / 2, 0.001, z + Math.sin(ang) * len / 2]} r={0.0007} cor={i % 3 === 0 ? '#6b3a1f' : '#8b4a2a'} sombra={false} />
        );
      })}
    </group>
  );
};

// mesa de jantar simples (1,6 × 0,9 m, 0,75 m de altura)
export const Mesa: React.FC<{pos: V3; larg?: number; prof?: number; cor?: string}> = ({pos, larg = 1.6, prof = 0.9, cor = '#c8955c'}) => (
  <group position={pos}>
    <Caixa pos={[0, 0.73, 0]} tam={[larg, 0.04, prof]} cor={cor} />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (<Caixa key={i} pos={[sx * (larg / 2 - 0.06), 0.36, sz * (prof / 2 - 0.06)]} tam={[0.05, 0.72, 0.05]} cor="#8b5a3c" />))}
  </group>
);
