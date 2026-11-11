// PISCINA DE FIBRA 6 × 3 m no quintal, em todas as fases da obra. Mesma escala do motor v4 (1 unidade = 1 metro).
// Cenários com prefixo "pi" (entram em SETS por PI_SETS). Não usa a planta da casa: o quintal tem chão próprio.
// Medidas: casco 6,0 × 3,0 m por dentro, 1,40 m de fundo, parede de fibra de 6 cm, aba de 15 cm, escada de canto.
// O centro da piscina fica em z = 3,6 (linha da vista em corte do motor): no corte, a piscina aparece cortada ao meio no comprido.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import type {Cam, SetDef} from './sets';
import {Arvore, Barra, Boneco, Caixa, Cil, CRIANCA, ENGENHEIRA, Instancias, MORADOR, Mat, MonteTerra, Rotulo, SERVENTE, clamp01, lerp, suave, texTerra} from './kit';
import {V3} from './planta';

// ---------- medidas ----------
export const PI = {zc: 3.6, L: 6.0, W: 3.0, H: 1.4};
const ZC = PI.zc;
const ESP = 0.06; // parede de fibra
const FUNDO_IN = -1.37; // piso interno da piscina
const FUNDO_EXT = -1.43; // por baixo do casco (em cima do pó de pedra)
const BURACO = {x0: -3.3, x1: 3.3, z0: ZC - 1.8, z1: ZC + 1.8, prof: 1.5};
const BASE_Y = -1.8; // fundo da maquete de terra
const CM = {x0: 4.55, x1: 5.95, z0: 3.0, z1: 4.2, prof: 1.0}; // casa de máquinas enterrada
const VALA = {x0: 3.3, x1: 4.55, z0: 3.2, z1: 3.95, prof: 1.2}; // vala dos canos (só aberta na obra)
const BORDA_IN = {x: 3.06, z: 1.56};
const BORDA_EXT = {x: 3.41, z: 1.91};
const CALC_EXT = {x: 4.41, z: 2.91};

// câmera por órbita (cópia local da orb de sets.tsx, para não criar import circular)
const orb = (alvo: V3, az: number, el: number, d0: number, d1: number, fov = 44, giro = 6, corte?: boolean): Cam => {
  const pt = (a: number, d: number): V3 => {
    const r = (Math.PI / 180) * a, e = (Math.PI / 180) * el;
    return [alvo[0] + Math.sin(r) * Math.cos(e) * d, alvo[1] + Math.sin(e) * d, alvo[2] + Math.cos(r) * Math.cos(e) * d];
  };
  return {de: pt(az, d0), para: pt(az + giro, d1), alvo, fov, corte};
};

// caixa por limites (x0..x1, y0..y1, z0..z1). Com corte, para no plano z = zc: a face cortada fica fechada e aparece.
const Bl: React.FC<{x: [number, number]; y: [number, number]; z: [number, number]; cor: string; corte?: boolean; zc?: number; sombra?: boolean; rugoso?: number}> = ({x, y, z, cor, corte, zc = ZC, sombra = true, rugoso}) => {
  const z1 = corte ? Math.min(z[1], zc) : z[1];
  if (z1 - z[0] < 0.001 || x[1] - x[0] < 0.001 || y[1] - y[0] < 0.001) return null;
  return (
    <mesh position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z1) / 2]} castShadow={sombra} receiveShadow>
      <boxGeometry args={[x[1] - x[0], y[1] - y[0], z1 - z[0]]} />
      <Mat cor={cor} rugoso={rugoso} />
    </mesh>
  );
};

// ---------- chão do quintal (maquete de terra com buracos retangulares) ----------
type Furo = {x0: number; x1: number; z0: number; z1: number; prof: number};
const PiChao: React.FC<{furos?: Furo[]; corte?: boolean; topo?: 'terra' | 'grama'}> = ({furos = [], corte = false, topo = 'grama'}) => {
  const terra = texTerra();
  const corTopo = topo === 'grama' ? '#7cc576' : '#b98b5e';
  const X0 = -16, X1 = 16, Z0 = -12, Z1 = corte ? ZC : 14;
  const celulas = useMemo(() => {
    const xs = new Set<number>([X0, X1]);
    const zs = new Set<number>([Z0, Z1]);
    furos.forEach((f) => {
      xs.add(f.x0); xs.add(f.x1);
      zs.add(Math.max(Z0, Math.min(Z1, f.z0))); zs.add(Math.max(Z0, Math.min(Z1, f.z1)));
    });
    const X = [...xs].sort((a, b) => a - b);
    const Z = [...zs].sort((a, b) => a - b);
    const out: {x0: number; x1: number; z0: number; z1: number; prof: number}[] = [];
    for (let i = 0; i < X.length - 1; i++) for (let j = 0; j < Z.length - 1; j++) {
      if (X[i + 1] - X[i] < 1e-4 || Z[j + 1] - Z[j] < 1e-4) continue;
      const cx = (X[i] + X[i + 1]) / 2, cz = (Z[j] + Z[j + 1]) / 2;
      let prof = 0;
      furos.forEach((f) => {
        if (cx > f.x0 && cx < f.x1 && cz > f.z0 && cz < f.z1) prof = Math.max(prof, f.prof);
      });
      out.push({x0: X[i], x1: X[i + 1], z0: Z[j], z1: Z[j + 1], prof});
    }
    return out;
  }, [JSON.stringify(furos), corte]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BASE_Y - 0.01, -10]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <Mat cor="#8fcf7a" />
      </mesh>
      {celulas.map((c, i) => {
        const top = -c.prof;
        const h = top - BASE_Y;
        if (h <= 0.001) return null;
        return (
          <mesh key={i} position={[(c.x0 + c.x1) / 2, BASE_Y + h / 2, (c.z0 + c.z1) / 2]} receiveShadow>
            <boxGeometry args={[c.x1 - c.x0, h, c.z1 - c.z0]} />
            <meshStandardMaterial attach="material-0" color="#ffffff" map={terra} flatShading />
            <meshStandardMaterial attach="material-1" color="#ffffff" map={terra} flatShading />
            <meshStandardMaterial attach="material-2" color={c.prof > 0 ? '#8a5a35' : corTopo} flatShading />
            <meshStandardMaterial attach="material-3" color="#8a5a35" />
            <meshStandardMaterial attach="material-4" color="#ffffff" map={terra} flatShading />
            <meshStandardMaterial attach="material-5" color="#ffffff" map={terra} flatShading />
          </mesh>
        );
      })}
    </group>
  );
};

// fundo do quintal: muro e a casa do dono (para dar escala e lugar)
const PiFundo: React.FC<{corte?: boolean}> = ({corte}) => (
  <group>
    <Caixa pos={[0, 0.9, -3.2]} tam={[17, 1.8, 0.14]} cor="#e7dccb" />
    {[-8.5, 8.5].map((x) => (<Bl key={x} x={[x - 0.07, x + 0.07]} y={[0, 1.8]} z={[-3.2, 11]} cor="#e7dccb" corte={corte} />))}
    <Caixa pos={[-1, 1.5, -7.5]} tam={[11, 3.0, 6]} cor="#f5d491" />
    <mesh position={[-1, 3.0 + 0.9, -7.5]} rotation={[0, 0, 0]} scale={[1, 1, 1]} castShadow>
      <cylinderGeometry args={[0.01, 4.4, 1.8, 4, 1]} />
      <Mat cor="#c8582f" />
    </mesh>
    <Caixa pos={[-3.0, 1.55, -4.49]} tam={[1.6, 1.2, 0.04]} cor="#7fb7e6" />
    <Caixa pos={[1.6, 1.05, -4.49]} tam={[0.9, 2.1, 0.04]} cor="#8b5a3c" />
    <Arvore pos={[-7.2, 0, -1.5]} esc={1.3} />
    <Arvore pos={[7.0, 0, -1.8]} esc={1.1} cor="#4fae63" />
  </group>
);

// ---------- casco de fibra ----------
// pos = centro da piscina com a aba no nível 0. deforma = parede curta empurrada para dentro (aterro errado).
export const Casco: React.FC<{pos?: V3; rotY?: number; corte?: boolean; deforma?: number; cor?: string}> = ({pos = [0, 0, ZC], rotY = 0, corte = false, deforma = 0, cor = '#7fd6f2'}) => {
  const hx = PI.L / 2, hz = PI.W / 2;
  const fat = 6;
  const alt = -FUNDO_EXT;
  const cut = corte && rotY === 0 ? pos[2] : undefined; // corte só quando a piscina está no lugar
  const c = cut !== undefined;
  const zc = 0;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Bl x={[-hx - ESP, hx + ESP]} y={[FUNDO_EXT, FUNDO_IN]} z={[-hz - ESP, hz + ESP]} cor={cor} corte={c} zc={zc} rugoso={0.45} />
      <Bl x={[-hx - ESP, hx + ESP]} y={[FUNDO_EXT, 0]} z={[-hz - ESP, -hz]} cor={cor} corte={c} zc={zc} rugoso={0.45} />
      <Bl x={[-hx - ESP, hx + ESP]} y={[FUNDO_EXT, 0]} z={[hz, hz + ESP]} cor={cor} corte={c} zc={zc} rugoso={0.45} />
      {[-1, 1].map((s) =>
        Array.from({length: fat}).map((_, i) => {
          const y0 = FUNDO_EXT + (alt * i) / fat, y1 = FUNDO_EXT + (alt * (i + 1)) / fat;
          const dx = -s * deforma * 0.32 * Math.sin((Math.PI * (i + 0.5)) / fat);
          const x0 = s > 0 ? hx : -hx - ESP;
          return <Bl key={s + ':' + i} x={[x0 + dx, x0 + ESP + dx]} y={[y0, y1 + 0.005]} z={[-hz, hz]} cor={cor} corte={c} zc={zc} rugoso={0.45} />;
        }),
      )}
      {/* aba (borda da própria fibra) */}
      <Bl x={[-hx - 0.21, hx + 0.21]} y={[-0.04, 0]} z={[-hz - 0.21, -hz - ESP]} cor={cor} corte={c} zc={zc} />
      <Bl x={[-hx - 0.21, hx + 0.21]} y={[-0.04, 0]} z={[hz + ESP, hz + 0.21]} cor={cor} corte={c} zc={zc} />
      {[-1, 1].map((s) => (<Bl key={'a' + s} x={s > 0 ? [hx + ESP, hx + 0.21] : [-hx - 0.21, -hx - ESP]} y={[-0.04, 0]} z={[-hz - ESP, hz + ESP]} cor={cor} corte={c} zc={zc} />))}
      {/* escada de canto: 3 degraus de 35 cm */}
      {[1, 2, 3].map((i) => (
        <Bl key={'d' + i} x={[-hx + 0.3 * (i - 1), -hx + 0.3 * i]} y={[FUNDO_IN, -0.35 * i]} z={[-hz, -hz + 1.2]} cor="#9fe2f6" corte={c} zc={zc} rugoso={0.45} />
      ))}
    </group>
  );
};

// água dentro do casco (nivel 0 a 1; cor muda de verde para azul)
const VERDE = new THREE.Color('#5f9a3c');
const AZUL = new THREE.Color('#2fa8e0');
export const Agua: React.FC<{nivel?: number; limpa?: number; corte?: boolean}> = ({nivel = 1, limpa = 1, corte = false}) => {
  const h = (FUNDO_IN * -1 - 0.12) * clamp01(nivel);
  if (h < 0.01) return null;
  const cor = VERDE.clone().lerp(AZUL, clamp01(limpa));
  const hz = PI.W / 2 - 0.005;
  const z1 = corte ? ZC : ZC + hz;
  return (
    <mesh position={[0, FUNDO_IN + h / 2, (ZC - hz + z1) / 2]}>
      <boxGeometry args={[PI.L - 0.01, h, z1 - (ZC - hz)]} />
      <meshStandardMaterial color={cor} transparent opacity={0.72} roughness={0.15} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
};

// lastro de concreto e pó de pedra no fundo do buraco (andam da esquerda para a direita)
const Base: React.FC<{lastro?: number; po?: number; corte?: boolean}> = ({lastro = 1, po = 1, corte}) => {
  const {x0, x1, z0, z1} = BURACO;
  return (
    <group>
      {lastro > 0 && <Bl x={[x0, lerp(x0, x1, clamp01(lastro))]} y={[-BURACO.prof, -1.45]} z={[z0, z1]} cor="#9aa0a6" corte={corte} />}
      {po > 0 && <Bl x={[x0, lerp(x0, x1, clamp01(po))]} y={[-1.45, FUNDO_EXT]} z={[z0, z1]} cor="#d6cdb8" corte={corte} />}
    </group>
  );
};

// aterro entre o casco e a parede do buraco (k = altura, 0 a 1)
const Aterro: React.FC<{k: number; cor: string; corte?: boolean}> = ({k, cor, corte}) => {
  if (k <= 0) return null;
  const y1 = lerp(FUNDO_EXT, -0.04, clamp01(k));
  const y: [number, number] = [FUNDO_EXT, y1];
  const {x0, x1, z0, z1} = BURACO;
  const ix = PI.L / 2 + ESP, iz = PI.W / 2 + ESP;
  return (
    <group>
      <Bl x={[x0, x1]} y={y} z={[z0, ZC - iz]} cor={cor} corte={corte} />
      <Bl x={[x0, x1]} y={y} z={[ZC + iz, z1]} cor={cor} corte={corte} />
      <Bl x={[x0, -ix]} y={y} z={[ZC - iz, ZC + iz]} cor={cor} corte={corte} />
      <Bl x={[ix, x1]} y={y} z={[ZC - iz, ZC + iz]} cor={cor} corte={corte} />
    </group>
  );
};

// ---------- máquinas ----------
// escavadeira (retroescavadeira): braço cavando dentro do buraco. Frente da máquina olha para +X.
export const Retro: React.FC<{pos: V3; t: number; rotY?: number}> = ({pos, t, rotY = 0}) => {
  const w = t * 2.2;
  const a1 = 0.38 + 0.2 * Math.sin(w);
  const a2 = -1.4 + 0.3 * Math.sin(w + 1.2);
  const P0: V3 = [1.7, 1.45, 0];
  const P1: V3 = [P0[0] + 2.4 * Math.cos(a1), P0[1] + 2.4 * Math.sin(a1), 0];
  const P2: V3 = [P1[0] + 2.8 * Math.cos(a2), P1[1] + 2.8 * Math.sin(a2), 0];
  const am = '#ffc21f';
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Caixa pos={[0, 0.95, 0]} tam={[3.4, 0.8, 1.9]} cor={am} />
      <Caixa pos={[-1.15, 1.55, 0]} tam={[1.1, 0.45, 1.6]} cor={am} />
      <Caixa pos={[0.25, 2.05, 0]} tam={[1.3, 1.5, 1.4]} cor="#2b2b3a" />
      <Caixa pos={[0.25, 2.85, 0]} tam={[1.45, 0.1, 1.55]} cor={am} />
      {[[-1.1, 0.65], [1.1, 0.45]].map(([x, r]) => [-1, 1].map((s) => (
        <Cil key={x + ':' + s} pos={[x, r, s * 1.0]} rot={[Math.PI / 2, 0, 0]} r={r} h={0.45} cor="#26252b" seg={12} />
      )))}
      {/* pá carregadeira na frente (lado oposto ao buraco) */}
      <Caixa pos={[-2.25, 0.45, 0]} tam={[0.5, 0.7, 2.1]} cor="#6f7378" />
      {/* braço da retro */}
      <Barra a={P0} b={P1} r={0.14} quadrada cor={am} />
      <Barra a={P1} b={P2} r={0.11} quadrada cor={am} />
      <Barra a={[P0[0] - 0.2, P0[1] - 0.3, 0]} b={[(P0[0] + P1[0]) / 2, (P0[1] + P1[1]) / 2 - 0.1, 0]} r={0.05} cor="#c9ced6" />
      <group position={P2} rotation={[0, 0, a2 + 0.9]}>
        <Caixa pos={[0, -0.15, 0]} tam={[0.6, 0.5, 0.8]} cor="#4a4d52" />
        <Caixa pos={[0.05, 0.05, 0]} tam={[0.45, 0.18, 0.7]} cor="#8a5a35" />
      </group>
    </group>
  );
};

// caçamba de entulho (4 a 5 m³), enchendo de terra
export const Cacamba: React.FC<{pos: V3; rotY?: number; carga?: number}> = ({pos, rotY = 0, carga = 0}) => {
  const k = clamp01(carga);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Caixa pos={[0, 0.06, 0]} tam={[3.0, 0.12, 1.6]} cor="#c45a1f" />
      {[-1, 1].map((s) => (<Caixa key={'l' + s} pos={[0, 0.6, s * 0.78]} rot={[s * 0.12, 0, 0]} tam={[3.2, 1.05, 0.06]} cor="#e8742a" />))}
      {[-1, 1].map((s) => (<Caixa key={'f' + s} pos={[s * 1.62, 0.6, 0]} rot={[0, 0, -s * 0.45]} tam={[0.06, 1.15, 1.75]} cor="#e8742a" />))}
      {k > 0.02 && (
        <mesh position={[0, 0.12 + 0.45 * k, 0]} scale={[1.45, 0.45 * k + 0.05, 0.75]} castShadow>
          <icosahedronGeometry args={[1, 1]} />
          <Mat cor="#a9652f" />
        </mesh>
      )}
    </group>
  );
};

// caminhão munck: guindaste no caminhão. O casco sai da carroceria, gira e desce no buraco conforme p.
const CAM = {x: 8.4, zCab: 7.6, zCol: 6.3, zCarga: 2.6, yCarga: 1.55};
export const Munck: React.FC<{p: number; t: number}> = ({p, t}) => {
  const sobe = suave(p / 0.25), gira = suave((p - 0.25) / 0.3), desce = suave((p - 0.55) / 0.45);
  const yTopo = CAM.yCarga - FUNDO_EXT; // aba do casco em cima da carroceria
  const y = lerp(lerp(yTopo, 4.9, sobe), 0, desce);
  const cx = lerp(CAM.x, 0, gira), cz = lerp(CAM.zCarga, ZC, gira);
  const rot = lerp(Math.PI / 2, 0, gira);
  const tip: V3 = [cx, y + 2.4, cz];
  const col: V3 = [CAM.x, 3.9, CAM.zCol];
  const cantos = [[-2.6, -1.2], [2.6, -1.2], [-2.6, 1.2], [2.6, 1.2]].map(([lx, lz]) => {
    const c = Math.cos(rot), s = Math.sin(rot);
    return [cx + lx * c + lz * s, y + 0.02, cz - lx * s + lz * c] as V3;
  });
  return (
    <group>
      {/* caminhão */}
      <Caixa pos={[CAM.x, 1.2, 3.0]} tam={[2.5, 0.35, 8.6]} cor="#3a3d44" />
      <Caixa pos={[CAM.x, 1.45, 2.6]} tam={[2.5, 0.12, 6.6]} cor="#6f6a62" />
      <Caixa pos={[CAM.x, 2.0, CAM.zCab]} tam={[2.5, 2.0, 1.9]} cor="#2f6fd6" />
      <Caixa pos={[CAM.x, 2.45, CAM.zCab + 0.96]} tam={[2.2, 0.8, 0.04]} cor="#bfe3ff" />
      {[-1.4, 0.4, 7.4].map((z) => [-1, 1].map((s) => (
        <Cil key={z + ':' + s} pos={[CAM.x + s * 1.2, 0.5, z]} rot={[0, 0, Math.PI / 2]} r={0.5} h={0.4} cor="#26252b" seg={12} />
      )))}
      {/* coluna e lança telescópica */}
      <Cil pos={[CAM.x, 2.7, CAM.zCol]} r={0.28} h={2.4} cor="#ffc21f" seg={10} />
      <Barra a={col} b={tip} r={0.16} quadrada cor="#ffc21f" />
      <Barra a={col} b={[lerp(col[0], tip[0], 0.45), lerp(col[1], tip[1], 0.45), lerp(col[2], tip[2], 0.45)]} r={0.2} quadrada cor="#e0a50f" />
      {/* cabos até os cantos do casco */}
      {cantos.map((c, i) => (<Barra key={i} a={tip} b={c} r={0.015} cor="#1d1b26" sombra={false} />))}
      <Caixa pos={[tip[0], tip[1] - 0.15, tip[2]]} tam={[0.25, 0.3, 0.25]} cor="#c84b31" />
      <Casco pos={[cx, y, cz]} rotY={rot} />
      {/* operador no controle do munck */}
      <Boneco pos={[CAM.x - 1.9, 0, CAM.zCol]} rotY={-Math.PI / 2 - 0.4 + Math.sin(t) * 0.05} acao="aponta" t={t} />
    </group>
  );
};

// casa de máquinas enterrada, com filtro de areia e motobomba (aberta = sem tampa)
const Filtro: React.FC<{t: number}> = ({t}) => {
  const y0 = -CM.prof + 0.1;
  return (
    <group>
      <Caixa pos={[5.0, y0 + 0.05, 3.45]} tam={[0.6, 0.1, 0.6]} cor="#6f7378" />
      <Cil pos={[5.0, y0 + 0.5, 3.45]} r={0.27} h={0.8} cor="#2f6fd6" seg={14} />
      <mesh position={[5.0, y0 + 0.9, 3.45]} castShadow><sphereGeometry args={[0.27, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat cor="#2f6fd6" /></mesh>
      <Cil pos={[5.0, y0 + 1.22, 3.45]} r={0.1} h={0.12} cor="#1d1b26" seg={10} />
      <Barra a={[5.0, y0 + 1.3, 3.45]} b={[5.0 + Math.cos(t) * 0.15, y0 + 1.3, 3.45 + Math.sin(t) * 0.15]} r={0.02} cor="#e8402f" />
      {/* motobomba: pré-filtro transparente + corpo + motor */}
      <Cil pos={[5.55, y0 + 0.25, 3.45]} r={0.1} h={0.25} cor="#bfe3ff" seg={10} />
      <Cil pos={[5.55, y0 + 0.2, 3.25]} rot={[Math.PI / 2, 0, 0]} r={0.12} h={0.22} cor="#2f6fd6" seg={10} />
      <Cil pos={[5.55, y0 + 0.2, 2.98 + 0.12]} rot={[Math.PI / 2, 0, 0]} r={0.13} h={0.12} cor="#8a9099" seg={10} />
      <Barra a={[5.55, y0 + 0.4, 3.45]} b={[5.55, y0 + 0.4, 3.62]} r={0.025} cor="#f2f2f2" />
      <Barra a={[5.55, y0 + 0.2, 3.37]} b={[5.27, y0 + 0.2, 3.45]} r={0.025} cor="#f2f2f2" />
      <Barra a={[5.0, y0 + 1.15, 3.45]} b={[4.6, y0 + 1.15, 3.45]} r={0.025} cor="#f2f2f2" />
    </group>
  );
};

const CasaMaquinas: React.FC<{corte?: boolean; tampa?: boolean; t: number}> = ({corte, tampa = true, t}) => {
  const {x0, x1, z0, z1, prof} = CM;
  const e = 0.1;
  const y: [number, number] = [-prof, 0.12];
  const cor = '#b9b4ab';
  return (
    <group>
      <Bl x={[x0, x1]} y={[-prof, -prof + 0.1]} z={[z0, z1]} cor={cor} corte={corte} />
      <Bl x={[x0, x0 + e]} y={y} z={[z0, z1]} cor={cor} corte={corte} />
      <Bl x={[x1 - e, x1]} y={y} z={[z0, z1]} cor={cor} corte={corte} />
      <Bl x={[x0, x1]} y={y} z={[z0, z0 + e]} cor={cor} corte={corte} />
      <Bl x={[x0, x1]} y={y} z={[z1 - e, z1]} cor={cor} corte={corte} />
      <Filtro t={t} />
      {tampa ? (
        <Bl x={[x0 - 0.04, x1 + 0.04]} y={[0.12, 0.17]} z={[z0 - 0.04, z1 + 0.04]} cor="#7d8087" corte={corte} />
      ) : (
        <Caixa pos={[x1 + 0.75, 0.04, (z0 + z1) / 2]} rot={[0, 0, 0.08]} tam={[1.45, 0.05, 1.25]} cor="#7d8087" />
      )}
    </group>
  );
};

// quadro de luz no poste, conduíte amarelo descendo até a casa de máquinas
const Quadro: React.FC = () => (
  <group>
    <Caixa pos={[6.45, 0.75, 3.1]} tam={[0.1, 1.5, 0.1]} cor="#8a9099" />
    <Caixa pos={[6.45, 1.3, 3.18]} tam={[0.4, 0.5, 0.14]} cor="#e9e6df" />
    <Caixa pos={[6.45, 1.3, 3.26]} tam={[0.3, 0.38, 0.02]} cor="#c9c4ba" sombra={false} />
    <Barra a={[6.45, 1.05, 3.2]} b={[6.45, -0.5, 3.2]} r={0.02} cor="#ffd23f" />
    <Barra a={[6.45, -0.5, 3.2]} b={[5.9, -0.5, 3.2]} r={0.02} cor="#ffd23f" />
  </group>
);

// canos de PVC da piscina até a casa de máquinas (skimmer, retorno, aspiração), crescendo com p
const Canos: React.FC<{p: number}> = ({p}) => {
  const z = 3.45;
  const xs = PI.L / 2 + ESP, xe = CM.x0 + 0.05;
  return (
    <group>
      {[-0.25, -0.55, -0.85].map((y, i) => {
        const k = clamp01(p * 3.2 - i * 0.7);
        if (k <= 0) return null;
        return <Barra key={i} a={[xs, y, z - i * 0.12]} b={[lerp(xs, xe, k), y, z - i * 0.12]} r={0.032} cor="#f2f2f2" />;
      })}
      {/* aterramento: haste de cobre fincada no fundo da vala, com o fio verde e amarelo */}
      {p > 0.5 && <Barra a={[4.1, -1.15, 3.7]} b={[4.1, -0.3, 3.7]} r={0.018} cor="#c87533" />}
      {p > 0.6 && <Barra a={[4.1, -0.3, 3.7]} b={[PI.L / 2 + ESP, -0.3, 3.7]} r={0.012} cor="#3fae4a" />}
    </group>
  );
};

// borda atérmica: 38 peças de 50 cm em volta (anda peça por peça)
const PECAS_BORDA = (() => {
  const out: {pos: V3; tam: V3}[] = [];
  const zi = BORDA_IN.z, ze = BORDA_EXT.z, xi = BORDA_IN.x, xe = BORDA_EXT.x;
  const lx = 2 * xe, nx = 14, nz = 6;
  for (let i = 0; i < nx; i++) out.push({pos: [-xe + (lx / nx) * (i + 0.5), 0.04, ZC - (zi + ze) / 2], tam: [lx / nx - 0.015, 0.05, ze - zi]});
  for (let i = 0; i < nz; i++) out.push({pos: [xe - (xe - xi) / 2, 0.04, ZC - zi + ((2 * zi) / nz) * (i + 0.5)], tam: [xe - xi, 0.05, (2 * zi) / nz - 0.015]});
  for (let i = nx - 1; i >= 0; i--) out.push({pos: [-xe + (lx / nx) * (i + 0.5), 0.04, ZC + (zi + ze) / 2], tam: [lx / nx - 0.015, 0.05, ze - zi]});
  for (let i = nz - 1; i >= 0; i--) out.push({pos: [-xe + (xe - xi) / 2, 0.04, ZC - zi + ((2 * zi) / nz) * (i + 0.5)], tam: [xe - xi, 0.05, (2 * zi) / nz - 0.015]});
  return out;
})();
const Borda: React.FC<{p?: number}> = ({p = 1}) => {
  const n = Math.floor(PECAS_BORDA.length * clamp01(p) + 1e-6);
  return <group>{PECAS_BORDA.slice(0, n).map((b, i) => (<Caixa key={i} pos={b.pos} tam={b.tam} cor="#efe7d6" />))}</group>;
};

// calçada antiderrapante de 1 m em volta (placas 50 × 50, do fundo para a frente)
const Calcada: React.FC<{p?: number}> = ({p = 1}) => {
  const geo = useMemo(() => new THREE.BoxGeometry(0.485, 0.04, 0.485), []);
  const mats = useMemo(() => {
    const m: THREE.Matrix4[] = [];
    for (let z = ZC - CALC_EXT.z + 0.25; z < ZC + CALC_EXT.z; z += 0.5) for (let x = -CALC_EXT.x + 0.25; x < CALC_EXT.x; x += 0.5) {
      if (Math.abs(x) < BORDA_EXT.x + 0.01 && Math.abs(z - ZC) < BORDA_EXT.z + 0.01) continue;
      m.push(new THREE.Matrix4().makeTranslation(x, 0.02, z));
    }
    return m;
  }, []);
  return <Instancias matrizes={mats} n={mats.length * clamp01(p)} geo={geo} cor="#cbc3b3" />;
};

// guarda-sol e espreguiçadeira (só na piscina pronta)
const Lazer: React.FC = () => (
  <group>
    <Cil pos={[-5.3, 1.1, 1.3]} r={0.03} h={2.2} cor="#e9e6df" />
    <Cil pos={[-5.3, 2.25, 1.3]} r={0.02} r2={1.3} h={0.45} cor="#ff5d73" seg={8} />
    {[[-5.6, 2.9], [-4.6, 2.9]].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <Caixa pos={[0, 0.3, 0.2]} tam={[0.6, 0.08, 1.4]} cor="#ffffff" />
        <Caixa pos={[0, 0.55, -0.6]} rot={[0.9, 0, 0]} tam={[0.6, 0.08, 0.7]} cor="#ffffff" />
        <Caixa pos={[0, 0.13, 0.2]} tam={[0.5, 0.26, 1.2]} cor="#b9b4ab" />
      </group>
    ))}
  </group>
);

const Marcacao: React.FC<{p: number}> = ({p}) => {
  const x0 = BURACO.x0, x1 = BURACO.x1, z0 = BURACO.z0, z1 = BURACO.z1;
  const lados: [V3, V3][] = [[[x0, 0.3, z0], [x1, 0.3, z0]], [[x1, 0.3, z0], [x1, 0.3, z1]], [[x1, 0.3, z1], [x0, 0.3, z1]], [[x0, 0.3, z1], [x0, 0.3, z0]]];
  return (
    <group>
      {[[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([x, z], i) => (<Caixa key={i} pos={[x, 0.2, z]} tam={[0.06, 0.4, 0.06]} cor="#9c6b42" />))}
      {lados.map(([a, b], i) => {
        const k = clamp01(p * 4 - i);
        if (k <= 0) return null;
        return <Barra key={'l' + i} a={a} b={[lerp(a[0], b[0], k), 0.3, lerp(a[2], b[2], k)]} r={0.015} cor="#ff3b6b" sombra={false} />;
      })}
      {p > 0.8 && <Caixa pos={[0, 0.006, ZC]} tam={[6.4, 0.01, 3.4]} cor="#e9e1c9" sombra={false} />}
    </group>
  );
};

// seta vermelha (empurrão do barro)
const Seta: React.FC<{de: V3; para: V3; vis: number}> = ({de, para, vis}) => {
  if (vis <= 0.01) return null;
  const b: V3 = [lerp(de[0], para[0], vis), lerp(de[1], para[1], vis), lerp(de[2], para[2], vis)];
  const dir = Math.sign(para[0] - de[0]);
  return (
    <group>
      <Barra a={de} b={b} r={0.05} cor="#ff3b3b" sombra={false} />
      <mesh position={b} rotation={[0, 0, -dir * Math.PI / 2]}>
        <coneGeometry args={[0.13, 0.28, 8]} />
        <meshBasicMaterial color="#ff3b3b" />
      </mesh>
    </group>
  );
};

const FURO_PISCINA: Furo = BURACO;
const FUROS_OBRA: Furo[] = [FURO_PISCINA, CM];
const FUROS_VALA: Furo[] = [FURO_PISCINA, CM, VALA];

// ======================================================================
// CENÁRIOS
// ======================================================================
export const PI_SETS: Record<string, SetDef> = {
  // piscina pronta (gancho e final)
  piFinal: {
    luz: 'tarde',
    ceu: ['#ffb37a', '#ffe7c7'],
    render: ({t}) => (
      <>
        <PiChao furos={FUROS_OBRA} topo="grama" />
        <PiFundo />
        <Aterro k={1} cor="#cbbd9a" />
        <Casco />
        <Agua nivel={1} />
        <Borda />
        <Calcada />
        <CasaMaquinas t={t} />
        <Quadro />
        <Lazer />
        <Boneco pos={[-2.55, -0.7, 2.75]} rotY={0.5} acao="acena" t={t} v={CRIANCA} esc={0.6} />
        <Boneco pos={[1.2, -0.95, 3.5]} rotY={0.2} acao="comemora" t={t} v={{...MORADOR, camisa: '#2fbf71', cabelo: '#1d1b26'}} />
        <Boneco pos={[2.0, 0.04, 6.0]} rotY={2.8} acao="acena" t={t} v={MORADOR} />
        <Arvore pos={[6.5, 0, 9]} esc={1.0} />
      </>
    ),
    cams: {
      drone: orb([0, 0, 3.2], 30, 34, 19, 15.5, 46),
      cima: orb([0, 0, 3.4], 10, 62, 17, 14.5, 46),
      baixa: orb([0, 0.4, 3.6], -20, 9, 11.5, 9.5, 46),
      cima2: orb([0, 0, 3.4], -15, 58, 17, 14.5, 46),
      agua: orb([-1.6, -0.2, 3.3], 35, 18, 6.0, 5.0, 44),
      drone2: orb([0, 0, 3.2], -30, 34, 19, 15.5, 46),
    },
  },
  // a loja: o casco sozinho em cima dos paletes
  piLoja: {
    luz: 'dia',
    ceu: ['#cfe8ff', '#eef7ff'],
    render: ({t}) => (
      <>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[140, 140]} />
          <Mat cor="#cfcac0" />
        </mesh>
        {[-2, 0, 2].map((x) => (<Caixa key={x} pos={[x, 0.07, 0]} tam={[1.2, 0.14, 3.2]} cor="#b98a5b" />))}
        <Casco pos={[0, 0.14 - FUNDO_EXT, 0]} />
        <group position={[-3.5, 0, -6]} rotation={[0, 0.5, 0.25]}>
          <Casco pos={[0, 1.4, 0]} cor="#9ad8ee" />
        </group>
        <Caixa pos={[5.5, 1.6, -3.5]} tam={[3.4, 1.4, 0.15]} cor="#2f6fd6" />
        <Caixa pos={[5.5, 1.25, -3.42]} tam={[3.2, 0.3, 0.02]} cor="#ffd23f" />
        {[-1.4, 1.4].map((x) => (<Caixa key={x} pos={[5.5 + x, 0.5, -3.5]} tam={[0.1, 1.0, 0.1]} cor="#6f7378" />))}
        <Boneco pos={[3.9, 0, 1.8]} rotY={-1.9} acao="aponta" t={t} v={{...MORADOR, camisa: '#ff8a1f'}} />
        <Rotulo texto="SÓ O CASCO" ancora={[0, 1.6, 0]} sobe={1.4} />
      </>
    ),
    cams: {
      geral: orb([0, 1.0, 0], 28, 22, 15, 12.5, 46),
      geral2: orb([0, 1.0, 0], -32, 26, 14.5, 12, 46),
    },
  },
  // quintal vazio: marcação do buraco
  piQuintal: {
    luz: 'dia',
    render: ({t, p}) => (
      <>
        <PiChao topo="grama" />
        <PiFundo />
        <Marcacao p={p} />
        <Boneco pos={[-4.4, 0, 6.2]} rotY={0.7} acao="aponta" t={t} v={ENGENHEIRA} ferramenta="planta" />
        <Rotulo texto="6 × 3 m" ancora={[0, 0.3, ZC]} sobe={1.6} vis={clamp01(p * 3 - 1.2)} />
      </>
    ),
    cams: {geral: orb([0, 0, 3.4], 22, 38, 18, 15, 46)},
  },
  // escavação: a escavadeira tira a terra; caçamba enchendo
  piEscavacao: {
    luz: 'dia',
    render: ({t, p}) => {
      const cava = 0.2 + 0.8 * suave(p);
      return (
        <>
          <PiChao furos={[{...BURACO, prof: BURACO.prof * cava}]} topo="terra" />
          <PiFundo />
          <Retro pos={[-6.6, 0, ZC]} t={t} />
          <Cacamba pos={[6.2, 0, 8.2]} rotY={0.15} carga={0.2 + 0.8 * p} />
          <MonteTerra pos={[4.8, 0, 0.6]} esc={0.9 + 0.5 * p} />
          <Boneco pos={[3.8, 0, 7.4]} rotY={-0.6} acao="aponta" t={t} v={SERVENTE} />
          <Rotulo texto="1,40 m" ancora={[1.5, -BURACO.prof * cava, ZC]} sobe={1.9} vis={clamp01(p * 3 - 1.5)} tam={0.85} />
        </>
      );
    },
    cams: {
      geral: orb([0, -0.3, 3.6], 25, 36, 19, 16, 46),
      braco: orb([-3.4, 0.6, 3.6], 35, 16, 7.5, 6.2, 44),
      cacamba: orb([5.8, 0.6, 8.0], 40, 22, 7.0, 5.8, 44),
      cima: orb([0, -0.6, 3.6], -10, 58, 15, 13, 46),
    },
  },
  // base: concreto e pó de pedra no fundo (vista em corte)
  piBase: {
    luz: 'dia',
    corte: true,
    render: ({t, p}) => (
      <>
        <PiChao furos={[BURACO]} topo="terra" corte />
        <PiFundo corte />
        <Base lastro={suave(p * 1.6)} po={clamp01(p * 2.2 - 1.1)} corte />
        <Boneco pos={[lerp(-2.2, 2.0, suave(p)), -1.43, 2.6]} rotY={Math.PI / 2} acao="cava" t={t} ferramenta="pa" />
        <Boneco pos={[-4.6, 0, 2.4]} rotY={0.4} acao="carrega" t={t} v={SERVENTE} />
        <Rotulo texto="CONCRETO" ancora={[-2.6, -1.48, ZC]} sobe={1.2} lado={-0.2} vis={clamp01(p * 4 - 0.4)} tam={0.85} />
        <Rotulo texto="PÓ DE PEDRA" ancora={[1.6, -1.44, ZC]} sobe={1.0} lado={0.4} vis={clamp01(p * 3 - 1.9)} tam={0.85} fundo="#e6e3dc" />
      </>
    ),
    cams: {
      corte: orb([0, -0.8, ZC], 0, 8, 15, 13, 46, 4),
      close: orb([-1.2, -1.2, ZC], 12, 10, 5.5, 4.6, 44),
    },
  },
  // guindaste (caminhão munck) desce o casco inteiro no buraco
  piGuindaste: {
    luz: 'dia',
    render: ({t, p}) => (
      <>
        <PiChao furos={[BURACO]} topo="terra" />
        <PiFundo />
        <Base />
        <Munck p={p} t={t} />
        <Boneco pos={[-4.3, 0, 2.2]} rotY={0.9} acao="aponta" t={t} v={ENGENHEIRA} />
        <Rotulo texto="CASCO INTEIRO" ancora={[lerp(CAM.x, 0, suave((p - 0.25) / 0.3)), 1.5, 3.0]} sobe={2.4} vis={p > 0.3 && p < 0.86 ? 1 : 0} tam={0.85} />
      </>
    ),
    cams: {
      geral: orb([4.2, 1.5, 3.6], 30, 24, 21, 18, 46),
      caminhao: orb([7.4, 2.4, 3.4], 70, 14, 11, 9.5, 44),
      desce: orb([0.5, 1.2, 3.6], 15, 22, 15, 13, 46),
      encaixe: orb([1.5, 0, 3.6], -25, 16, 8.5, 7.2, 44),
    },
  },
  // o erro: aterro com o barro do buraco empurra a parede de fibra (corte)
  piErro: {
    luz: 'nublado',
    ceu: ['#9aa7b4', '#d5dde6'],
    corte: true,
    render: ({t, p}) => {
      const k = suave(p * 1.4);
      const def = suave(p * 1.6 - 0.5);
      return (
        <>
          <PiChao furos={[BURACO]} topo="terra" corte />
          <PiFundo corte />
          <Base corte />
          <Aterro k={k} cor="#6b4a2f" corte />
          <Casco corte deforma={def} />
          <Seta de={[-4.3, -0.75, ZC + 0.05]} para={[-3.2 + def * 0.2, -0.75, ZC + 0.05]} vis={clamp01(p * 3 - 1.2)} />
          <Seta de={[4.3, -0.75, ZC + 0.05]} para={[3.2 - def * 0.2, -0.75, ZC + 0.05]} vis={clamp01(p * 3 - 1.2)} />
          <Boneco pos={[-4.6, 0, 2.6]} rotY={Math.PI / 2} acao="cava" t={t} ferramenta="pa" />
          <Rotulo texto="BARRO" ancora={[-3.18, -0.5, ZC]} sobe={1.3} lado={-0.6} vis={clamp01(p * 4 - 0.8)} fundo="#ff5d5d" cor="#ffffff" tam={0.85} />
        </>
      );
    },
    cams: {
      geral: orb([0, -0.4, ZC], 18, 30, 16, 14, 46, 4),
      corte: orb([0, -0.7, ZC], 0, 6, 14.5, 12.5, 46, 3),
      close: orb([2.9, -0.7, ZC], -8, 4, 5.4, 4.5, 44),
    },
  },
  // o certo: areia com cimento nas laterais e a água subindo junto (corte)
  piAterro: {
    luz: 'dia',
    corte: true,
    render: ({t, p}) => (
      <>
        <PiChao furos={[BURACO]} topo="terra" corte />
        <PiFundo corte />
        <Base corte />
        <Aterro k={suave(p)} cor="#cbbd9a" corte />
        <Casco corte />
        <Agua nivel={0.05 + 0.95 * p} corte />
        {/* mangueira enchendo */}
        <Barra a={[-5.2, 0.02, 2.4]} b={[-3.4, 0.02, 2.4]} r={0.03} cor="#2fbf71" />
        <Barra a={[-3.4, 0.02, 2.4]} b={[-2.6, 0.25, 2.6]} r={0.03} cor="#2fbf71" />
        <Barra a={[-2.6, 0.22, 2.6]} b={[-2.45, lerp(-1.3, -0.15, p), 2.65]} r={0.035} cor="#9fdcff" sombra={false} />
        <Boneco pos={[4.4, 0, 2.5]} rotY={-Math.PI / 2} acao="cava" t={t} v={SERVENTE} ferramenta="pa" />
        <Rotulo texto="AREIA + CIMENTO" ancora={[3.18, lerp(-1.3, -0.3, p), ZC]} sobe={1.4} lado={0.4} vis={clamp01(p * 6)} fundo="#2fbf71" cor="#ffffff" tam={0.85} />
      </>
    ),
    cams: {
      corte: orb([0, -0.7, ZC], 0, 7, 14.5, 12.5, 46, 3),
      close: orb([-2.6, -0.8, ZC], 10, 8, 5.6, 4.8, 44),
      cima: orb([0, -0.4, ZC], -15, 40, 13.5, 12, 46, 4),
      mangueira: orb([-3.2, 0.0, 2.8], 30, 20, 5.2, 4.4, 44),
    },
  },
  // filtro: a água verde fica azul quando a motobomba liga
  piFiltro: {
    luz: 'dia',
    render: ({t, p}) => (
      <>
        <PiChao furos={FUROS_OBRA} topo="terra" />
        <PiFundo />
        <Aterro k={1} cor="#cbbd9a" />
        <Casco />
        <Agua nivel={1} limpa={suave((p - 0.45) / 0.5)} />
        <CasaMaquinas t={t * 4} tampa={false} />
        <Boneco pos={[5.25, 0, 5.0]} rotY={Math.PI} acao="aponta" t={t} />
        <Rotulo texto="FILTRO DE AREIA" ancora={[5.0, -0.1, 3.45]} sobe={1.5} lado={-0.3} vis={clamp01(p * 5 - 2)} tam={0.8} />
        <Rotulo texto="MOTOBOMBA" ancora={[5.55, -0.7, 3.25]} sobe={1.1} lado={0.6} vis={clamp01(p * 5 - 2.6)} tam={0.8} fundo="#e6e3dc" />
      </>
    ),
    cams: {
      verde: orb([0, -0.2, 3.6], 15, 50, 15, 13, 46),
      filtro: orb([5.25, -0.4, 3.6], 25, 48, 5.2, 4.4, 44),
      limpa: orb([1.2, -0.2, 3.6], -35, 30, 12, 10.5, 46),
    },
  },
  // casa de máquinas em corte: canos pela vala, quadro e aterramento
  piMaquinas: {
    luz: 'dia',
    corte: true,
    render: ({t, p}) => (
      <>
        <PiChao furos={FUROS_VALA} topo="terra" corte />
        <PiFundo corte />
        <Base corte />
        <Aterro k={1} cor="#cbbd9a" corte />
        <Casco corte />
        <Agua nivel={1} corte />
        <CasaMaquinas corte tampa={false} t={t * 4} />
        <Canos p={p} />
        <Quadro />
        <Boneco pos={[7.2, 0, 2.6]} rotY={-1.2} acao="aponta" t={t} v={ENGENHEIRA} />
        <Rotulo texto="CANOS" ancora={[4.0, -0.55, 3.45]} sobe={1.6} lado={-0.4} vis={clamp01(p * 4 - 0.6)} tam={0.8} />
        <Rotulo texto="ATERRAMENTO" ancora={[4.1, -1.0, 3.7]} sobe={1.1} lado={0.6} vis={clamp01(p * 4 - 2.4)} tam={0.8} fundo="#e6e3dc" />
        <Rotulo texto="QUADRO" ancora={[6.45, 1.3, 3.2]} sobe={0.9} vis={p > 0.55 ? 1 : 0} tam={0.8} />
      </>
    ),
    cams: {
      corte: orb([4.0, -0.4, ZC], -5, 6, 8.5, 7.2, 44, 3),
      quadro: orb([5.4, 0.2, ZC], 18, 14, 6.5, 5.4, 44),
    },
  },
  // borda atérmica peça por peça
  piBorda: {
    luz: 'dia',
    render: ({t, p}) => {
      const n = Math.min(PECAS_BORDA.length - 1, Math.floor(PECAS_BORDA.length * clamp01(p)));
      const b = PECAS_BORDA[n].pos;
      const fora: V3 = [b[0] + Math.sign(b[0] || 1) * 0.0, 0, b[2] + (b[2] > ZC ? 0.9 : b[2] < ZC ? -0.9 : 0)];
      if (Math.abs(b[2] - ZC) < 1.5) fora[0] = b[0] + Math.sign(b[0]) * 0.9;
      return (
        <>
          <PiChao furos={FUROS_OBRA} topo="terra" />
          <PiFundo />
          <Aterro k={1} cor="#cbbd9a" />
          <Casco />
          <Agua nivel={1} />
          <Borda p={p} />
          <CasaMaquinas t={t} />
          <Boneco pos={fora} rotY={Math.atan2(b[0] - fora[0], b[2] - fora[2])} acao="martela" t={t} ferramenta="colher" />
          <Rotulo texto="NÃO ESQUENTA" ancora={[-1.5, 0.07, ZC - 1.73]} sobe={1.3} vis={clamp01(p * 4 - 2.2)} tam={0.85} />
        </>
      );
    },
    cams: {
      geral: orb([0, 0, 3.6], 20, 46, 17, 14.5, 46),
      close: orb([-1.5, 0.1, 2.2], 30, 28, 4.8, 4.0, 44),
    },
  },
  // calçada antiderrapante, placa por placa
  piCalcada: {
    luz: 'dia',
    render: ({t, p}) => (
      <>
        <PiChao furos={FUROS_OBRA} topo="terra" />
        <PiFundo />
        <Aterro k={1} cor="#cbbd9a" />
        <Casco />
        <Agua nivel={1} />
        <Borda />
        <Calcada p={p} />
        <CasaMaquinas t={t} />
        <Quadro />
        <Boneco pos={[-5.0, 0, lerp(1.2, 6.0, p)]} rotY={Math.PI / 2} acao="martela" t={t} ferramenta="martelo" />
        <Boneco pos={[5.6, 0, 6.6]} rotY={-2.3} acao="carrega" t={t} v={SERVENTE} ferramenta="bloco" />
        <Rotulo texto="1 m EM VOLTA" ancora={[0, 0.04, ZC + 2.4]} sobe={1.2} vis={clamp01(p * 4 - 1)} tam={0.85} />
      </>
    ),
    cams: {
      cima: orb([0, 0, 3.6], 5, 64, 17, 14.5, 46),
      rente: orb([2.5, 0.2, 6.5], 40, 9, 6.5, 5.4, 44),
    },
  },
};

