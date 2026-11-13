// CENÁRIOS do "Caso Explicado: o mistério do voo MH370". Cada set é um LUGAR diferente do caso.
// Escala real (1 unidade = 1 m), menos o mapa (K unidades por grau, ver pecas.tsx) e o satélite (esquemático).
// O diretor escolhe no roteiro: {"set": "mapa", "cam": "volta", "p": [0.1, 0.42]}.
import type {Expressao} from '../estilo/ze';
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, Caixa, Cil, Nuvem, Rotulo, texPilula} from '../v4/kit';
import {orb, Cam, Ctx} from '../v4/sets';
import {
  Aviao, CONTROLADOR, Drone, FAMILIA, Flaperon, GARI, MILITAR, Mapa, Navio, PILOTO, PISTA, Palmeira, Placa, Satelite,
  TelaRadar, Vela, W, ZeDetetive, clamp01, lerp, rnd, suave,
} from './pecas';
import {SETS_COOPER} from './cooper';
import {SETS_IDENTIDADES} from './identidades';

export type LuzCaso = 'dia' | 'noite' | 'interior' | 'espaco' | 'nublado' | 'tarde' | 'fundo' | 'mapa';
export type SetCaso = {
  ceu?: [string, string];
  luz?: LuzCaso;
  clima?: Expressao; // expressão padrão dos bonecos no set
  horizonte?: boolean | {raio?: number; y?: number}; // cena externa: morros, árvores e casas ao longe (src/estilo/visual.tsx)
  nevoa?: [number, number];
  render: (c: Ctx) => React.ReactNode;
  cams: Record<string, Cam>;
};

const CEU_NOITE: [string, string] = ['#0a1430', '#34497e'];
const CEU_DIA: [string, string] = ['#5fb6ef', '#e9f5ff'];
const CEU_TARDE: [string, string] = ['#e8743f', '#ffd9a0'];

// câmera de trilho: começa em "de" olhando "alvo" e termina em "para" olhando "alvoPara"
const trilho = (de: V3, para: V3, alvo: V3, alvoPara: V3, fov = 42): Cam => ({de, para, alvo, alvoPara, fov});

// ---------- estrelas (pontos fixos numa esfera grande) ----------
const Estrelas: React.FC<{raio?: number; n?: number; centro?: V3}> = ({raio = 900, n = 700, centro = [0, 0, 0]}) => {
  const pos = useMemo(() => {
    const r = rnd(77);
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = r() * Math.PI * 2, u = r() * 1.6 - 0.6;
      const c = Math.sqrt(1 - u * u);
      a[i * 3] = centro[0] + Math.cos(th) * c * raio;
      a[i * 3 + 1] = centro[1] + u * raio;
      a[i * 3 + 2] = centro[2] + Math.sin(th) * c * raio;
    }
    return a;
  }, [raio, n, centro[0], centro[1], centro[2]]);
  return (
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial color="#ffffff" size={2.2} sizeAttenuation={false} />
    </points>
  );
};

// ---------- mar com ondas (malha low-poly) ----------
const Mar: React.FC<{t: number; cor?: string; tam?: number; amp?: number}> = ({t, cor = '#2f6f9a', tam = 1600, amp = 0.9}) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(tam, tam, 60, 60).rotateX(-Math.PI / 2), [tam]);
  useMemo(() => {
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, Math.sin(x * 0.045 + t * 1.1) * amp + Math.cos(z * 0.06 + t * 0.8) * amp * 0.7);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  }, [geo, Math.round(t * 30), amp]);
  return <mesh geometry={geo} receiveShadow><meshStandardMaterial color={cor} roughness={0.5} /></mesh>;
};

// ================= sets =================
// nuvens abaixo do avião, correndo para trás (o avião anda a ~250 m/s)
const Nuvens: React.FC<{t: number; y?: number; n?: number; cor?: string}> = ({t, y = -45, n = 26, cor = '#c9d3f0'}) => {
  const base = useMemo(() => {
    const r = rnd(31);
    return Array.from({length: n}).map(() => [r() * 900 - 450, r() * 500 - 300, 9 + r() * 10] as V3);
  }, [n]);
  return (
    <>
      {base.map(([x0, z, e], i) => {
        const x = ((((x0 - t * 70) % 900) + 900) % 900) - 450;
        return <Nuvem key={i} pos={[x, y - (i % 3) * 6, z]} esc={e} cor={cor} />;
      })}
    </>
  );
};

// cabine do 777 (nariz para -Z; capitão à esquerda). p controla o transponder (desliga em 0,6) e o manche (vira em p).
const Cabine: React.FC<{t: number; p: number; pilotos?: boolean; manche?: number}> = ({t, p, pilotos = true, manche = 0}) => {
  const ligado = p < 0.6;
  const telas: [number, string][] = [[-1.0, '#2f6fd6'], [-0.62, '#1f8f5a'], [-0.2, '#2f6fd6'], [0.2, '#1f8f5a'], [0.62, '#2f6fd6'], [1.0, '#1f8f5a']];
  return (
    <group>
      <Caixa pos={[0, -0.05, -0.2]} tam={[3.4, 0.1, 3.6]} cor="#3a3d47" />
      {/* paredes laterais e teto */}
      {[-1.65, 1.65].map((x) => (<Caixa key={x} pos={[x, 1.0, -0.4]} tam={[0.12, 2.1, 3.2]} cor="#8d929e" />))}
      <Caixa pos={[0, 2.12, -1.2]} tam={[3.4, 0.12, 1.1]} cor="#8d929e" />
      <Caixa pos={[0, 2.0, -1.0]} tam={[2.4, 0.1, 0.8]} cor="#6b707c" />
      {/* painel e glare shield */}
      <Caixa pos={[0, 0.65, -1.45]} tam={[3.1, 0.9, 0.3]} cor="#2b2f3a" />
      <Caixa pos={[0, 1.15, -1.32]} tam={[3.1, 0.12, 0.5]} cor="#1d1b26" />
      {telas.map(([x, c]) => (
        <mesh key={x} position={[x, 0.78, -1.29]}><planeGeometry args={[0.32, 0.3]} /><meshBasicMaterial color={c} /></mesh>
      ))}
      {telas.map(([x]) => (<Caixa key={'h' + x} pos={[x, 0.8, -1.285]} tam={[0.26, 0.012, 0.002]} cor="#bfe6ff" sombra={false} />))}
      {/* para-brisa: molduras (o vão mostra o céu da noite) */}
      <Caixa pos={[0, 1.25, -1.6]} tam={[3.2, 0.1, 0.1]} cor="#5a5f6b" />
      <Caixa pos={[0, 1.85, -1.5]} tam={[3.2, 0.12, 0.12]} cor="#5a5f6b" />
      {[-1.5, -0.55, 0, 0.55, 1.5].map((x) => (<Caixa key={x} pos={[x, 1.55, -1.55]} rot={[0.25, 0, 0]} tam={[0.09, 0.62, 0.09]} cor="#5a5f6b" />))}
      <Caixa pos={[0, 0.2, -1.8]} tam={[3.4, 1.1, 0.1]} cor="#2b2f3a" />
      {/* pedestal central: manetes e o transponder */}
      <Caixa pos={[0, 0.38, -0.75]} tam={[0.5, 0.76, 0.9]} cor="#2b2f3a" />
      {[-0.08, 0.08].map((x) => (<Barra key={x} a={[x, 0.76, -0.95]} b={[x, 0.95, -0.85]} r={0.018} cor="#cfd3da" />))}
      <group position={[0, 0.775, -0.45]}>
        <Caixa pos={[0, 0, 0]} tam={[0.42, 0.03, 0.22]} cor="#1d1b26" />
        <mesh position={[0, 0.017, -0.02]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.26, 0.06]} /><meshBasicMaterial map={texPilula(ligado ? 'TRANSP. ON' : 'TRANSP. OFF', ligado ? '#1f8f5a' : '#8f1f1a', '#ffffff')} transparent /></mesh>
        <mesh position={[0.16, 0.02, 0.06]}><sphereGeometry args={[0.014, 20, 14]} /><meshBasicMaterial color={ligado ? '#3bff7a' : '#3a1414'} /></mesh>
        {[-0.12, -0.06, 0, 0.06].map((x) => (<Cil key={x} pos={[x, 0.02, 0.06]} r={0.012} h={0.02} cor="#9aa0aa" seg={8} />))}
      </group>
      {/* manches (yokes) */}
      {[-0.55, 0.55].map((x, i) => (
        <group key={x} position={[x, 0.55, -1.0]}>
          <Cil pos={[0, 0, 0]} r={0.035} h={0.5} cor="#1d1b26" />
          <group position={[0, 0.3, 0.05]} rotation={[0, 0, i === 0 ? manche : 0]}>
            <Caixa pos={[0, 0, 0]} tam={[0.34, 0.05, 0.05]} cor="#c9ced6" />
            {[-0.17, 0.17].map((dx) => (<Caixa key={dx} pos={[dx, 0.07, 0]} tam={[0.05, 0.17, 0.05]} cor="#c9ced6" />))}
          </group>
        </group>
      ))}
      {/* poltronas */}
      {[-0.55, 0.55].map((x) => (
        <group key={x} position={[x, 0, -0.1]}>
          <Caixa pos={[0, 0.42, 0]} tam={[0.55, 0.12, 0.55]} cor="#4a4e5a" />
          <Caixa pos={[0, 0.85, 0.27]} rot={[-0.12, 0, 0]} tam={[0.55, 0.8, 0.12]} cor="#4a4e5a" />
          <Cil pos={[0, 0.2, 0]} r={0.06} h={0.4} cor="#2b2f3a" />
        </group>
      ))}
      {pilotos && [-0.55, 0.55].map((x, i) => (<Boneco key={x} pos={[x, 0.24, -0.2]} rotY={Math.PI} acao="senta" t={t + i} v={PILOTO} esc={0.8} />))}
      <Estrelas centro={[0, 0, -40]} raio={300} n={300} />
      <mesh position={[3, 7, -45]}><sphereGeometry args={[2.5, 20, 14]} /><meshBasicMaterial color="#f4f0d8" /></mesh>
      <pointLight position={[0, 1.1, -0.6]} color="#7fb2ff" intensity={2.2} distance={4} decay={1.5} />
    </group>
  );
};

// sala do controle de tráfego aéreo (noite)
const SalaControle: React.FC<{t: number; p: number}> = ({t, p}) => {
  const blip = 1 - clamp01((p - 0.6) * 12);
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[8, 0.1, 6]} cor="#30343f" />
      <Caixa pos={[0, 1.6, -3]} tam={[8, 3.2, 0.2]} cor="#3f4554" />
      <Caixa pos={[-4, 1.6, 0]} tam={[0.2, 3.2, 6]} cor="#3f4554" />
      {/* janelão para a pista à noite */}
      <mesh position={[0, 1.9, -2.88]}><planeGeometry args={[6, 1.4]} /><meshBasicMaterial color="#0e1a36" /></mesh>
      {Array.from({length: 18}).map((_, i) => (<mesh key={i} position={[-2.8 + i * 0.33, 1.4 + (i % 2) * 0.02, -2.87]}><circleGeometry args={[0.015, 6]} /><meshBasicMaterial color="#ffd27a" /></mesh>))}
      {/* console */}
      <Caixa pos={[0, 0.45, -1.7]} tam={[4.2, 0.9, 0.9]} cor="#2b2f3a" />
      <Caixa pos={[0, 0.93, -1.55]} tam={[4.2, 0.06, 1.2]} cor="#1d1b26" />
      <TelaRadar pos={[0, 1.45, -1.95]} rot={[-0.25, 0, 0]} r={0.5} t={t} blip={blip} />
      {[-1.3, 1.3].map((x) => (
        <group key={x}>
          <Caixa pos={[x, 1.3, -2.0]} rot={[-0.2, 0, 0]} tam={[0.8, 0.5, 0.05]} cor="#1d1b26" />
          <mesh position={[x, 1.3, -1.97]} rotation={[-0.2, 0, 0]}><planeGeometry args={[0.72, 0.42]} /><meshBasicMaterial color={x < 0 ? '#14365e' : '#1b4a33'} /></mesh>
        </group>
      ))}
      <Boneco pos={[1.45, 0, -0.85]} rotY={-2.3} acao="aponta" t={t} v={CONTROLADOR} />
      <Cil pos={[1.4, 0.98, -1.4]} r={0.04} h={0.1} cor="#d9d4c4" />
      <pointLight position={[0, 1.6, -1.2]} color="#7affb8" intensity={2.5} distance={4} decay={1.4} />
      <pointLight position={[1.5, 2.7, 0.5]} color="#ffe6c0" intensity={6} distance={9} decay={1.4} />
    </group>
  );
};

// pista do aeroporto de Kuala Lumpur (noite). Avião: anda em p, decola a partir de p = 0,6.
const Pista: React.FC<{t: number; p: number}> = ({t, p}) => {
  const x = -60 + 200 * Math.pow(p, 1.6);
  const sobe = p > 0.6 ? Math.pow((p - 0.6) / 0.4, 1.5) * 45 : 0;
  const pitch = p > 0.55 ? Math.min(0.17, (p - 0.55) * 1.0) : 0;
  const luzes = useMemo(() => {
    const out: V3[] = [];
    for (let xx = -300; xx <= 700; xx += 30) out.push([xx, 0.3, 31], [xx, 0.3, -31]);
    return out;
  }, []);
  return (
    <group>
      <Caixa pos={[200, -0.06, 0]} tam={[2400, 0.1, 1400]} cor="#2f4a3a" />
      <Caixa pos={[200, 0, 0]} tam={[1200, 0.04, 60]} cor="#4a4e58" />
      {Array.from({length: 24}).map((_, i) => (<Caixa key={i} pos={[-280 + i * 50, 0.03, 0]} tam={[30, 0.02, 0.9]} cor="#e9e9e9" sombra={false} />))}
      {luzes.map((q, i) => (<mesh key={i} position={q}><sphereGeometry args={[0.45, 20, 14]} /><meshBasicMaterial color={i % 2 ? '#ffd27a' : '#fff3c9'} /></mesh>))}
      {/* terminal e torre ao fundo, com janelas acesas */}
      <Caixa pos={[60, 9, -240]} tam={[420, 18, 40]} cor="#3a3f4c" />
      <mesh position={[60, 10, -219.9]}><planeGeometry args={[400, 5]} /><meshBasicMaterial color="#ffd98a" /></mesh>
      <Cil pos={[-140, 30, -200]} r={4} h={60} cor="#4a4f5c" />
      <Cil pos={[-140, 64, -200]} r={9} r2={6} h={8} cor="#2b3040" />
      <mesh position={[-140, 64, -191]}><planeGeometry args={[14, 3]} /><meshBasicMaterial color="#9ad0ff" /></mesh>
      <Aviao pos={[x, 5.07 + sobe, 0]} rot={[0, 0, pitch]} t={t} trem={sobe < 8} />
      {/* operador de pátio (1,7 m) para dar a escala do 777 */}
      <Boneco pos={[-48, 0, 38]} rotY={-0.6} acao="acena" t={t} v={PISTA} ferramenta="tocha" />
      <pointLight position={[-48, 3, 38]} color="#ffb070" intensity={30} distance={14} decay={1.5} />
      <Estrelas />
    </group>
  );
};

// estação de radar militar num morro, à noite
const RadarMilitar: React.FC<{t: number}> = ({t}) => (
  <group>
    <Caixa pos={[0, -0.06, 0]} tam={[600, 0.1, 600]} cor="#22301f" />
    <mesh position={[0, -18, -260]}><coneGeometry args={[160, 60, 24]} /><meshStandardMaterial color="#1c2a1c" /></mesh>
    <mesh position={[0, -2, -300]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1200, 200]} /><meshStandardMaterial color="#1b3550" /></mesh>
    {/* torre treliçada de 14 m */}
    {[[-2, -2], [2, -2], [-2, 2], [2, 2]].map(([x, z], i) => (<Barra key={i} a={[x * 1.4, 0, z * 1.4]} b={[x * 0.6, 14, z * 0.6]} r={0.18} cor="#9aa0aa" quadrada />))}
    {[3, 6.5, 10].map((y) => (<Caixa key={y} pos={[0, y, 0]} tam={[5.2 - y * 0.25, 0.25, 5.2 - y * 0.25]} cor="#9aa0aa" />))}
    <Caixa pos={[0, 14.2, 0]} tam={[3.4, 0.5, 3.4]} cor="#c9ced6" />
    {/* antena girando (refletor de 12 × 3,5 m) */}
    <group position={[0, 15.5, 0]} rotation={[0, t * 1.4, 0]}>
      <Cil pos={[0, 0, 0]} r={0.4} h={1.6} cor="#c9ced6" />
      <mesh position={[0, 2.2, -0.8]} rotation={[0.25, 0, 0]}>
        <cylinderGeometry args={[6, 6, 3.5, 24, 1, true, -0.55, 1.1]} />
        <meshStandardMaterial color="#e3e6ec" side={2} />
      </mesh>
      <Barra a={[0, 0.6, 0]} b={[0, 2.2, 4.4]} r={0.12} cor="#9aa0aa" />
    </group>
    <mesh position={[0, 21.2, 0]}><sphereGeometry args={[0.3, 20, 14]} /><meshBasicMaterial color={Math.sin(t * 6) > 0 ? '#ff3b3b' : '#4a1010'} /></mesh>
    {/* prédio, cerca e o vigia (1,7 m) */}
    <Caixa pos={[9, 1.6, 4]} tam={[8, 3.2, 4.5]} cor="#6b7356" />
    <mesh position={[9, 1.7, 6.26]}><planeGeometry args={[2.2, 0.9]} /><meshBasicMaterial color="#ffd98a" /></mesh>
    {Array.from({length: 14}).map((_, i) => (<Cil key={i} pos={[-13 + i * 2, 1, 10]} r={0.05} h={2} cor="#8a8f96" seg={5} />))}
    <Caixa pos={[0, 1.8, 10]} tam={[26, 0.04, 0.04]} cor="#8a8f96" />
    <Boneco pos={[5.5, 0, 7]} rotY={-0.4} t={t} v={MILITAR} />
    <pointLight position={[9, 3, 8]} color="#ffd98a" intensity={20} distance={14} decay={1.5} />
    <Estrelas />
  </group>
);

// satélite e Terra (esquemático): anéis = pontos com a mesma distância até o satélite
const RT = 40;
const anelY = (a: number) => -RT + (RT + 0.25) * Math.cos(a);
const anelR = (a: number) => (RT + 0.25) * Math.sin(a);
const ALFAS = [20, 24, 28, 32, 36, 40, 44].map((g) => (g * Math.PI) / 180);
const Espaco: React.FC<{t: number}> = ({t}) => {
  const manchas = useMemo(() => {
    const r = rnd(12);
    return Array.from({length: 14}).map(() => {
      const a = r() * 1.2, ph = r() * 6.28;
      return {pos: [Math.sin(a) * Math.cos(ph) * RT, -RT + Math.cos(a) * RT, Math.sin(a) * Math.sin(ph) * RT] as V3, e: 2.5 + r() * 4};
    });
  }, []);
  const aP = ALFAS[4], fP = 0.5;
  const av: V3 = [Math.sin(aP) * Math.cos(fP) * (RT + 0.6), -RT + Math.cos(aP) * (RT + 0.6), Math.sin(aP) * Math.sin(fP) * (RT + 0.6)];
  const sat: V3 = [0, 45, 0];
  const k = (t * 0.8) % 1;
  const pulso: V3 = [lerp(av[0], sat[0], k), lerp(av[1], sat[1], k), lerp(av[2], sat[2], k)];
  return (
    <group>
      <mesh position={[0, -RT, 0]} receiveShadow><icosahedronGeometry args={[RT, 4]} /><meshStandardMaterial color="#2c77ad" roughness={0.7} /></mesh>
      {manchas.map((m, i) => (<mesh key={i} position={m.pos} scale={[m.e, m.e * 0.06, m.e]} rotation={[m.pos[2] * 0.02, 0, -m.pos[0] * 0.02]}><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#8fbf6a" /></mesh>))}
      <mesh position={[0, -RT, 0]}><sphereGeometry args={[RT * 1.04, 32, 24]} /><meshBasicMaterial color="#7fc4ff" transparent opacity={0.12} depthWrite={false} /></mesh>
      {ALFAS.map((a, i) => (
        <mesh key={i} position={[0, anelY(a), 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[anelR(a), i === 6 ? 0.9 : 0.5, 10, 80]} />
          <meshBasicMaterial color={i === 4 ? '#ffd23f' : i === 6 ? '#ff4d4d' : '#ffffff'} />
        </mesh>
      ))}
      <Satelite pos={sat} esc={1.2} rotY={0.6} />
      <Aviao pos={av} rot={[0, -fP, 0]} esc={0.04} t={t} luzes={false} janelas={false} />
      {/* sinal: linha tracejada e pulso do avião até o satélite */}
      {Array.from({length: 16}).map((_, i) => {
        const u0 = i / 16, u1 = u0 + 1 / 32;
        return <Barra key={i} a={[lerp(av[0], sat[0], u0), lerp(av[1], sat[1], u0), lerp(av[2], sat[2], u0)]} b={[lerp(av[0], sat[0], u1), lerp(av[1], sat[1], u1), lerp(av[2], sat[2], u1)]} r={0.12} cor="#6fd3ff" sombra={false} />;
      })}
      <mesh position={pulso}><sphereGeometry args={[0.9, 20, 14]} /><meshBasicMaterial color="#bff0ff" /></mesh>
      <Rotulo texto="satélite" ancora={[sat[0], sat[1] + 1.5, sat[2]]} sobe={3} lado={4} fundo="#6fd3ff" />
      <Estrelas />
      <mesh position={[300, 160, -500]}><sphereGeometry args={[22, 20, 14]} /><meshBasicMaterial color="#fff3c9" /></mesh>
    </group>
  );
};

// fundo do mar (sul do Índico): relevo e o drone com sonar (nada achado)
const FundoMar: React.FC<{t: number}> = ({t}) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(300, 300, 50, 50).rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, Math.sin(x * 0.08) * 1.6 + Math.cos(z * 0.05 + x * 0.02) * 2.4 + Math.sin(x * 0.31 + z * 0.17) * 0.5);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const x = -6 + t * 2.2;
  return (
    <group>
      <mesh geometry={geo} position={[0, -2, 0]} receiveShadow><meshStandardMaterial color="#5f6f72" roughness={1} /></mesh>
      {[[-12, -8], [9, -14], [16, 6], [-20, 10], [4, 12]].map(([rx, rz], i) => (<mesh key={i} position={[rx, -1.2, rz]} scale={[2 + i, 1 + (i % 2), 2]}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#4f5c5f" /></mesh>))}
      <Drone pos={[x, 3.2, 0]} t={t} />
      <pointLight position={[x + 3, 2.5, 0]} color="#bff0ff" intensity={30} distance={22} decay={1.4} />
      {/* partículas em suspensão */}
      {Array.from({length: 40}).map((_, i) => {
        const r = rnd(i + 3);
        return <mesh key={i} position={[r() * 50 - 25, r() * 14 - 1 + Math.sin(t + i) * 0.2, r() * 40 - 20]}><sphereGeometry args={[0.06, 20, 14]} /><meshBasicMaterial color="#9fc6d6" /></mesh>;
      })}
    </group>
  );
};

// praia de Saint-André, Ilha da Reunião: seixos escuros, mar, palmeiras, montanha verde
const Praia: React.FC<{t: number}> = ({t}) => (
  <group>
    <Caixa pos={[0, -0.06, 20]} tam={[200, 0.1, 60]} cor="#4d4945" />
    {Array.from({length: 120}).map((_, i) => {
      const r = rnd(i + 11);
      const x = r() * 16 - 8, z = r() * 10 - 4;
      if (Math.hypot(x, z) < 1.6) return null;
      return <mesh key={i} position={[x, 0.02, z]} scale={[1, 0.5, 0.8]}><dodecahedronGeometry args={[0.06 + r() * 0.08, 0]} /><meshStandardMaterial color={i % 3 ? '#3a3734' : '#5c5650'} /></mesh>;
    })}
    <group position={[0, -0.25, -60]}><Mar t={t} cor="#2a88b8" tam={240} amp={0.25} /></group>
    {/* espuma das ondas chegando */}
    {[0, 1, 2].map((i) => {
      const k = ((t * 0.35 + i / 3) % 1);
      return <Caixa key={i} pos={[0, 0.0, -10 + k * 4.5]} tam={[200, 0.04, 0.5 + (1 - k) * 0.8]} cor="#eaf6ff" sombra={false} />;
    })}
    <mesh position={[60, 0, 70]}><coneGeometry args={[60, 45, 24]} /><meshStandardMaterial color="#3f8f4a" /></mesh>
    <mesh position={[-40, 0, 90]}><coneGeometry args={[70, 55, 24]} /><meshStandardMaterial color="#357a40" /></mesh>
    {[[-9, 4], [-6, 7], [8, 5], [11, 9], [-13, 9]].map(([x, z], i) => (<Palmeira key={i} pos={[x, 0, z]} esc={0.9 + (i % 2) * 0.2} inc={i % 2 ? 0.15 : -0.12} />))}
    <Flaperon pos={[0, 0.12, 0]} rot={[0, 0.35, 0.05]} />
    <Boneco pos={[-2.3, 0, 0.9]} rotY={1.9} acao="aponta" t={t} v={GARI} />
    <Boneco pos={[-2.7, 0, -0.5]} rotY={1.2} t={t + 1} v={{...GARI, pele: '#e7b48c', cabelo: '#3b2a20'}} />
    <ZeDetetive pos={[1.25, 0, 1.15]} rotY={-2.3} t={t} />
  </group>
);

// quadro de investigação (escritório à noite, abajur aceso)
const TEORIAS = [
  {x: -0.95, txt: '1 · FANTASMA', peso: 0.5, cor: '#ffd23f'},
  {x: 0, txt: '2 · SEQUESTRO', peso: 0.18, cor: '#ff5d5d'},
  {x: 0.95, txt: '3 · DESVIO', peso: 0.82, cor: '#2fbf71'},
];
const PISTAS: {txt: string; pos: [number, number]; rot: number}[] = [
  {txt: '00:42 DECOLA', pos: [-1.1, 2.15], rot: 0.04},
  {txt: '01:19 BOA NOITE', pos: [-0.35, 2.2], rot: -0.03},
  {txt: '02:22 RADAR', pos: [0.4, 2.15], rot: 0.05},
  {txt: '08:19 SINAL', pos: [1.1, 2.2], rot: -0.04},
  {txt: '7º ARCO', pos: [-1.15, 1.75], rot: -0.05},
  {txt: 'FLAPERON', pos: [1.15, 1.75], rot: 0.04},
];
const Quadro: React.FC<{t: number; p: number}> = ({t, p}) => {
  const ativo = p >= 0.3 && p < 0.55 ? 1 : p >= 0.55 && p < 0.8 ? 2 : -1;
  const barra = clamp01(p / 0.3);
  const fim = p >= 0.8;
  const pergunta = p >= 0.999;
  const Z = -0.02;
  const pinos: V3[] = PISTAS.map((q) => [q.pos[0], q.pos[1] + 0.07, Z + 0.03]);
  return (
    <group>
      <Caixa pos={[0, -0.05, 1]} tam={[7, 0.1, 5]} cor="#5a4030" />
      <Caixa pos={[0, 1.6, -0.15]} tam={[7, 3.2, 0.2]} cor="#3d4a5c" />
      {/* cortiça e moldura */}
      <Caixa pos={[0, 1.65, -0.07]} tam={[3.2, 1.9, 0.06]} cor="#6b4429" />
      <Caixa pos={[0, 1.65, -0.04]} tam={[3.0, 1.7, 0.03]} cor="#c49563" />
      {/* mapinha no centro */}
      <mesh position={[0, 1.88, Z]}><planeGeometry args={[0.55, 0.42]} /><meshBasicMaterial color="#2c77ad" /></mesh>
      <mesh position={[-0.08, 1.95, Z + 0.001]} rotation={[0, 0, 0.4]}><planeGeometry args={[0.1, 0.3]} /><meshBasicMaterial color="#a9cf7a" /></mesh>
      <Barra a={[-0.05, 1.98, Z + 0.004]} b={[-0.02, 1.72, Z + 0.004]} r={0.006} cor="#ffd23f" sombra={false} />
      <mesh position={[-0.02, 1.71, Z + 0.004]}><circleGeometry args={[0.025, 40]} /><meshBasicMaterial color="#ff4d4d" /></mesh>
      {PISTAS.map((q, i) => (
        <group key={i} position={[q.pos[0], q.pos[1], Z]} rotation={[0, 0, q.rot]}>
          <mesh position={[0, 0, -0.002]}><planeGeometry args={[0.56, 0.17]} /><meshBasicMaterial color="#f4efe2" /></mesh>
          <Placa texto={q.txt} pos={[0, 0, 0.001]} larg={0.54} fundo="#f4efe2" cor="#1d1b26" />
        </group>
      ))}
      {/* barbantes vermelhos ligando as pistas ao mapa */}
      {pinos.map((a, i) => (<Barra key={'b' + i} a={a} b={[0, 1.95, Z + 0.03]} r={0.005} cor="#d6282b" sombra={false} />))}
      {pinos.map((a, i) => (<mesh key={'p' + i} position={a}><sphereGeometry args={[0.022, 20, 14]} /><meshStandardMaterial color="#d6282b" /></mesh>))}
      {/* as três teorias com o peso das evidências */}
      {TEORIAS.map((te, i) => {
        const on = ativo === i;
        const s = on ? 1.08 : 1;
        return (
          <group key={i} position={[te.x, 1.2, Z + (on ? 0.02 : 0)]} scale={s}>
            {on && <mesh position={[0, -0.05, -0.004]}><planeGeometry args={[0.86, 0.5]} /><meshBasicMaterial color="#ffd23f" /></mesh>}
            <mesh position={[0, -0.05, -0.002]}><planeGeometry args={[0.8, 0.44]} /><meshBasicMaterial color="#ffffff" /></mesh>
            <Placa texto={te.txt} pos={[0, 0.06, 0]} larg={0.76} fundo="#1d1b26" cor="#ffffff" />
            <mesh position={[0, -0.13, 0.001]}><planeGeometry args={[0.66, 0.08]} /><meshBasicMaterial color="#d9d4c4" /></mesh>
            <mesh position={[-0.33 + (0.66 * te.peso * barra) / 2, -0.13, 0.002]}><planeGeometry args={[Math.max(0.001, 0.66 * te.peso * barra), 0.08]} /><meshBasicMaterial color={te.cor} /></mesh>
            <mesh position={[0, 0.19, 0.01]}><sphereGeometry args={[0.025, 20, 14]} /><meshStandardMaterial color="#d6282b" /></mesh>
          </group>
        );
      })}
      {fim && <Placa texto="?" pos={[1.25, 2.55, Z + 0.05]} larg={0.9 * suave((p - 0.8) * 6)} fundo="#d6282b" cor="#ffffff" />}
      {/* mesa, abajur, xícara e pasta */}
      <Caixa pos={[-2.3, 0.74, 0.5]} tam={[1.6, 0.06, 0.8]} cor="#6b4429" />
      {[[-3.0, 0.2], [-1.6, 0.2], [-3.0, 0.8], [-1.6, 0.8]].map(([x, z], i) => (<Caixa key={i} pos={[x, 0.36, z]} tam={[0.06, 0.72, 0.06]} cor="#4a3426" />))}
      <Cil pos={[-2.7, 0.79, 0.35]} r={0.1} h={0.04} cor="#2b2f3a" />
      <Barra a={[-2.7, 0.8, 0.35]} b={[-2.6, 1.2, 0.4]} r={0.012} cor="#2b2f3a" />
      <mesh position={[-2.55, 1.2, 0.42]} rotation={[0.4, 0, -0.5]}><coneGeometry args={[0.13, 0.18, 24, 1, true]} /><meshStandardMaterial color="#2f6f4f" side={2} /></mesh>
      <Cil pos={[-1.9, 0.82, 0.6]} r={0.045} h={0.1} cor="#f4efe2" />
      <Caixa pos={[-2.2, 0.78, 0.65]} rot={0.2} tam={[0.34, 0.02, 0.24]} cor="#d9a85a" />
      <pointLight position={[-2.5, 1.15, 0.5]} color="#ffd9a0" intensity={4} distance={5} decay={1.5} />
      <pointLight position={[0, 2.8, 1.8]} color="#fff0d8" intensity={9} distance={8} decay={1.3} />
      <ZeDetetive pos={pergunta ? [1.95, 0, 0.9] : [1.95, 0, 0.75]} rotY={pergunta ? -0.35 : -1.75} t={t} aponta={!pergunta} />
    </group>
  );
};

// vigília: velas, recados no muro, pessoas de costas (sem rosto, sem nome)
const Vigilia: React.FC<{t: number}> = ({t}) => {
  const recados = useMemo(() => {
    const r = rnd(41);
    return Array.from({length: 46}).map(() => ({x: r() * 5.4 - 2.7, y: 0.5 + r() * 1.05, c: ['#ffd23f', '#ffffff', '#ffb3c6', '#bfe6ff', '#c9f2c7'][Math.floor(r() * 5)], rot: r() * 0.4 - 0.2}));
  }, []);
  const velas = useMemo(() => {
    const out: V3[] = [];
    for (let i = 0; i < 30; i++) out.push([-2.6 + (i % 15) * 0.37, 0, -1.9 + Math.floor(i / 15) * 0.3 + ((i * 7) % 3) * 0.05]);
    return out;
  }, []);
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[16, 0.1, 10]} cor="#3a3d44" />
      <Caixa pos={[0, 1.1, -2.5]} tam={[7, 2.2, 0.25]} cor="#d9d4c4" />
      {recados.map((q, i) => (<mesh key={i} position={[q.x, q.y, -2.36]} rotation={[0, 0, q.rot]}><planeGeometry args={[0.2, 0.16]} /><meshStandardMaterial color={q.c} /></mesh>))}
      <Placa texto="MH370 · 239" pos={[0, 1.95, -2.35]} larg={2.0} fundo="#1d2233" cor="#ffffff" />
      {velas.map((q, i) => (<Vela key={i} pos={q} t={t} h={0.1 + (i % 4) * 0.04} />))}
      {[[-2.1, 0.6], [-1.2, 0.8], [1.2, 0.7], [2.1, 0.9]].map(([x, z], i) => (<Boneco key={i} pos={[x, 0, z]} rotY={Math.PI + (i - 1.5) * 0.08} t={t + i} v={FAMILIA[i]} />))}
      <pointLight position={[0, 0.5, -1.6]} color="#ffb347" intensity={8} distance={6} decay={1.4} />
      <pointLight position={[0, 3, 2]} color="#8fa0d0" intensity={4} distance={10} decay={1.3} />
    </group>
  );
};

export const SETS: Record<string, SetCaso> = {
  // ===== o 777 voando à noite sobre as nuvens (p > 0,6: some na escuridão) =====
  voo: {
    ceu: CEU_NOITE,
    luz: 'noite',
    render: ({t, p}) => (
      <>
        <Aviao pos={[0, p > 0.6 ? -Math.pow((p - 0.6) / 0.4, 1.4) * 60 : 0, 0]} rot={[0, 0, p > 0.6 ? -0.08 : 0]} t={t} luzes={p < 0.75} />
        <Nuvens t={t} />
        <Estrelas />
        <mesh position={[-260, 160, -520]}><sphereGeometry args={[24, 20, 14]} /><meshBasicMaterial color="#f4f0d8" /></mesh>
      </>
    ),
    cams: {
      lado: orb([0, -2, 0], 40, 24, 125, 108, 42, 8),
      some: orb([0, -20, 0], 35, 22, 140, 160, 42, 6),
    },
  },
  // ===== teoria 1: o avião fantasma (luzes apagadas, neblina) =====
  fantasma: {
    ceu: ['#1a1f2e', '#4a5470'],
    luz: 'noite',
    nevoa: [60, 330],
    render: ({t}) => (
      <>
        <Aviao pos={[0, 0, 0]} rot={[0.06, 0, -0.05]} t={t} luzes={false} janelas />
        <Nuvens t={t} y={-30} cor="#9aa3bf" />
      </>
    ),
    cams: {
      geral: orb([0, 0, 0], 140, 18, 150, 130, 42, 10),
    },
  },
  // ===== tela do radar civil: o ponto do MH370 some =====
  radar: {
    ceu: ['#0a0f1c', '#141b2e'],
    luz: 'interior',
    render: ({t, p}) => <SalaControle t={t} p={p} />,
    cams: {
      tela: orb([0, 1.45, -1.95], 0, 14, 1.75, 1.45, 40, 4),
      sala: orb([0.4, 1.3, -1.6], -22, 10, 4.2, 3.6, 44, 8),
    },
  },
  // ===== decolagem em Kuala Lumpur à meia-noite =====
  aeroporto: {
    ceu: CEU_NOITE,
    luz: 'noite',
    render: ({t, p}) => <Pista t={t} p={p} />,
    cams: {
      pista: orb([-42, 4, 5], 50, 20, 120, 105, 42, 8),
      decola: trilho([-150, 14, 50], [-140, 16, 48], [-23, 6, 0], [66, 12, 0], 42),
    },
  },
  // ===== cabine do 777 =====
  cockpit: {
    ceu: CEU_NOITE,
    luz: 'interior',
    render: ({t}) => <Cabine t={t} p={0} />,
    cams: {
      painel: orb([0, 0.85, -1.15], 0, 38, 3.0, 2.6, 50, 6),
      janela: orb([0, 1.55, -2.2], 6, 4, 2.3, 1.8, 50, 6),
    },
  },
  // ===== o manche virando à mão (sem ninguém: o relatório não diz quem) =====
  manche: {
    ceu: CEU_NOITE,
    luz: 'interior',
    render: ({t, p}) => <Cabine t={t} p={p} pilotos={false} manche={0.75 * suave(p * 1.4)} />,
    cams: {
      yoke: orb([-0.4, 0.85, -1.0], 22, 26, 1.9, 1.6, 42, 8),
      transponder: orb([0, 0.8, -0.45], 15, 50, 1.0, 0.8, 40, 8),
    },
  },
  // ===== radar militar num morro =====
  radarmil: {
    ceu: CEU_NOITE,
    luz: 'noite',
    render: ({t}) => <RadarMilitar t={t} />,
    cams: {
      antena: orb([2, 12, 0], 30, 8, 56, 48, 44, 10),
    },
  },
  // ===== satélite e Terra (esquemático) =====
  satelite: {
    ceu: ['#04050d', '#0c1430'],
    luz: 'espaco',
    render: ({t}) => <Espaco t={t} />,
    cams: {
      geral: orb([0, 6, 0], 30, 10, 205, 185, 40, 8),
      sat: orb([0, 44, 0], 35, 12, 34, 28, 40, 10),
      arco: orb([0, -8, 0], 15, 62, 210, 190, 40, 8),
    },
  },
  // ===== o mapa do caso =====
  mapa: {
    ceu: ['#0d2a44', '#1e4a6e'],
    luz: 'mapa',
    render: ({t, p}) => <Mapa t={t} p={p} />,
    cams: {
      oceano: orb(W(93.8, -35, 0), -20, 50, 52, 40, 42, 10),
      asia: orb(W(108, 21, 0), 0, 64, 210, 190, 42, 4),
      volta: orb(W(100.8, 5.6, 0), -8, 60, 66, 56, 42, 8),
      andamao: orb(W(98.6, 6.4, 0), -25, 52, 40, 33, 42, 8),
      arcos: orb(W(88, -12, 0), 0, 70, 280, 255, 42, 4),
      sul: orb(W(95, -16, 0), 12, 58, 175, 150, 42, 6),
      busca: orb(W(92.5, -34, 0), 5, 58, 70, 58, 42, 6),
      reuniao: orb(W(70, -26, 0), 0, 72, 380, 350, 42, 4),
      fim: orb(W(88, -8, 0), 0, 72, 420, 390, 42, 4),
    },
  },
  // ===== a busca no mar: navio com o drone =====
  busca: {
    ceu: ['#7f9bb3', '#dfe7ee'],
    luz: 'nublado',
    nevoa: [300, 1300],
    render: ({t}) => (
      <>
        <Mar t={t} />
        <Navio pos={[0, 0, 0]} t={t} />
        {[0, 1, 2, 3].map((i) => (<Caixa key={i} pos={[-40 - i * 18, 0.6, (i % 2 ? 1 : -1) * (2 + i * 2.5)]} rot={(i % 2 ? 1 : -1) * 0.25} tam={[16, 0.12, 1.2]} cor="#eaf6ff" sombra={false} />))}
      </>
    ),
    cams: {
      navio: orb([4, 4, 0], 52, 13, 165, 140, 42, 8),
    },
  },
  // ===== fundo do mar: o sonar não acha nada =====
  fundo: {
    ceu: ['#03111f', '#0b2c42'],
    luz: 'fundo',
    nevoa: [14, 75],
    render: ({t}) => <FundoMar t={t} />,
    cams: {
      sonar: orb([0, 1.5, 0], 38, 14, 24, 19, 44, 10),
    },
  },
  // ===== março de 2026: o navio volta, busca encerrada =====
  retorno: {
    ceu: CEU_TARDE,
    luz: 'tarde',
    nevoa: [300, 1400],
    render: ({t}) => (
      <>
        <Mar t={t} cor="#3a6f8f" />
        <Navio pos={[t * 9, 0, 0]} rotY={0} t={t} />
        <mesh position={[900, 60, -300]}><sphereGeometry args={[45, 20, 14]} /><meshBasicMaterial color="#ffdf9a" /></mesh>
      </>
    ),
    cams: {
      volta: orb([20, 6, 0], -125, 10, 115, 130, 42, 6),
    },
  },
  // ===== a praia da Ilha da Reunião e o flaperon =====
  praia: {
    ceu: CEU_DIA,
    luz: 'dia',
    render: ({t}) => <Praia t={t} />,
    cams: {
      geral: orb([0, 0.8, 0], 25, 15, 12, 10, 44, 8),
      flaperon: orb([0, 0.2, 0], -25, 38, 4.6, 3.8, 40, 8),
      lupa: orb([0.7, 0.9, 0.6], -135, 14, 3.6, 3.0, 40, 8),
    },
  },
  // ===== quadro de investigação do Zé =====
  quadro: {
    ceu: ['#141826', '#232a3d'],
    luz: 'interior',
    render: ({t, p}) => <Quadro t={t} p={p} />,
    cams: {
      geral: orb([0.3, 1.45, 0], 12, 6, 5.4, 4.6, 44, 8),
      t2: orb([0, 1.05, 0], -8, 2, 2.6, 2.3, 40, 8),
      t3: orb([0.85, 1.05, 0], 14, 2, 2.6, 2.3, 40, 8),
      ze: orb([1.8, 1.3, 0.75], -40, 6, 2.8, 2.4, 40, 8),
      pergunta: orb([1.35, 1.35, 0.6], 15, 6, 4.8, 4.3, 44, 6),
    },
  },
  // ===== vigília das famílias (de costas, sem rosto) =====
  vigilia: {
    ceu: CEU_NOITE,
    luz: 'noite',
    render: ({t}) => <Vigilia t={t} />,
    cams: {
      velas: orb([0, 1.2, -1.6], 8, 22, 6.4, 5.6, 44, 8),
    },
  },

  // ===== D.B. COOPER (24/11/1971): cenários em src/caso/cooper.tsx =====
  ...SETS_COOPER,

  // ===== IDENTIDADES (caso genérico — sala de investigação, escritório, concessionária, LA, tribunal) =====
  ...SETS_IDENTIDADES,
};
