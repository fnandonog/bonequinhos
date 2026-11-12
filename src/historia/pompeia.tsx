// CENÁRIOS do "Você na História: Pompeia, 24 de agosto de 79 d.C."
// Sets com prefixo "pom_" (não colidem com outros episódios).
// Escala real (1 unidade = 1 m). Pompeia ficava no sopé do Vesúvio, sul da Itália.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, Caixa, Cil, Rotulo} from '../v4/kit';
import {orb} from '../v4/sets';
import type {SetHistoria} from './sets';
import {
  CIDADAO, COR, Casa, Coluna, Templo,
  clamp01, lerp, rnd, suave,
} from './pecas';

// ---------- figurinos de Pompeia ----------
const ZE_POMPEIANO = {camisa: '#cba870', calca: '#cba870', colete: null, capacete: null, toga: '#d9b480', cabelo: '#3b2a20'};
const POMPEIANO_1 = {...CIDADAO, pele: '#f2c9a4'};
const POMPEIANO_2 = {...CIDADAO, toga: '#d4b48c', pele: '#d4a070'};
const POMPEIANO_3 = {camisa: '#8f7060', calca: '#6f5040', colete: null, capacete: null, pele: '#e8b892', cabelo: '#1d1b26'};
const PLINIO = {...CIDADAO, toga: '#8a6a9a', cabelo: '#9a9090', pele: '#e8c8a0'};

const CEU_DIA: [string, string] = ['#6fbcf2', '#fdf0d8'];
const CEU_FUMO: [string, string] = ['#5a4030', '#8a6040'];
const CEU_NOITE: [string, string] = ['#1a1626', '#2b2233'];

// ---------- O Vesúvio ----------
const Vesuvio: React.FC<{eruptindo?: number}> = ({eruptindo = 0}) => {
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(24, 22, 10);
    const pos = g.attributes.position;
    const r = rnd(7);
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i, pos.getX(i) * (1 + (r() - 0.5) * 0.08), pos.getY(i), pos.getZ(i) * (1 + (r() - 0.5) * 0.08));
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const geoBase = useMemo(() => new THREE.ConeGeometry(32, 5, 10), []);
  return (
    <group position={[0, 0, -85]}>
      <mesh geometry={geoBase} position={[0, 2.5, 0]} castShadow>
        <meshStandardMaterial color="#7a8a6a" flatShading />
      </mesh>
      <mesh geometry={geo} position={[0, 13, 0]} castShadow>
        <meshStandardMaterial color="#6a7a5a" flatShading />
      </mesh>
      <mesh position={[0, 23, 0]}>
        <coneGeometry args={[5, 4, 8]} />
        <meshStandardMaterial color="#4a5a40" flatShading />
      </mesh>
      {eruptindo > 0.05 && (
        <group position={[0, 24, 0]}>
          {Array.from({length: 10}).map((_, i) => (
            <mesh key={i} position={[Math.sin(i * 0.9) * i * 0.6, i * 5, Math.cos(i * 0.9) * i * 0.6]}>
              <sphereGeometry args={[3 + i * 1.4, 7, 6]} />
              <meshStandardMaterial color={i < 3 ? '#c06028' : '#4a4040'} flatShading transparent opacity={Math.min(0.9, eruptindo) * (1 - i * 0.06)} />
            </mesh>
          ))}
          <pointLight color="#ff6020" intensity={eruptindo * 80} distance={40} decay={1.5} />
        </group>
      )}
    </group>
  );
};

// ---------- Cidade de Pompeia (fórum e ruas) ----------
const CidadePompeia: React.FC<{eruptindo?: number}> = ({eruptindo = 0}) => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[400, 0.1, 400]} cor="#c0a87a" />
    <Caixa pos={[0, 0.02, -6]} tam={[28, 0.04, 20]} cor="#d4c8a8" sombra={false} />
    <Templo pos={[0, 0, -18]} larg={10} n={4} />
    {[-12, -9, -6, -3, 3, 6, 9, 12].map((x) => (
      <Coluna key={x} pos={[x, 0, -4]} h={4.0} r={0.22} cor="#e0d4b8" />
    ))}
    {[[-20, -16], [18, -13], [-22, 8], [20, 6], [-18, 26], [22, 22], [-10, 24], [10, 28]].map(([x, z], i) => (
      <Casa key={i} pos={[x, 0, z] as V3} tam={[8 + (i % 3) * 2, 4 + i * 0.4, 7] as V3} cor={['#d4b888', '#c8a870', '#dcc090', '#c0a060', '#d8b880', '#cca06a', '#e0c090', '#c8b070'][i]} rotY={(i * 0.3) - 0.4} />
    ))}
    {eruptindo > 0.3 && (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#9a9088" transparent opacity={Math.min(0.5, (eruptindo - 0.3) * 1.4)} roughness={1} />
      </mesh>
    )}
    <Vesuvio eruptindo={eruptindo} />
  </group>
);

// ---------- Thermopolium ----------
const Thermopolium: React.FC = () => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[8, 0.1, 6]} cor="#c0a87a" />
    <Caixa pos={[-1.0, 0.5, -1.8]} tam={[4.4, 1.0, 0.5]} cor={COR.travertinoEsc} />
    <Caixa pos={[1.5, 0.5, -0.65]} tam={[0.5, 1.0, 1.9]} cor={COR.travertinoEsc} />
    {[-1.8, -0.5, 0.8].map((x, i) => (
      <group key={i}>
        <Cil pos={[x, 1.0, -1.8]} r={0.21} h={0.07} cor="#8f7060" seg={12} />
        <Cil pos={[x, 0.78, -1.8]} r={0.17} r2={0.21} h={0.52} cor={['#c0703f', '#8a7a60', '#6a9060'][i]} seg={10} />
      </group>
    ))}
    <Caixa pos={[0, 1.5, -2.2]} tam={[8, 3.0, 0.3]} cor="#e0c8a0" />
    {[-2.2, 0, 2.2].map((x, i) => (
      <Caixa key={i} pos={[x, 1.5, -2.05]} tam={[1.8, 1.4, 0.04]} cor={['#c05030', '#407050', '#2050a0'][i]} sombra={false} />
    ))}
    <Caixa pos={[-3.9, 1.5, -0.5]} tam={[0.3, 3.0, 5]} cor="#d4b888" />
    <Caixa pos={[3.9, 1.5, -0.5]} tam={[0.3, 3.0, 5]} cor="#c8a870" />
    <Caixa pos={[0, 3.1, -0.5]} tam={[8.4, 0.15, 5.4]} cor={COR.telha} sombra={false} />
  </group>
);

// ---------- Rua romana (basalto cinza com calçadas elevadas) ----------
const RuaRomana: React.FC = () => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[14, 0.1, 32]} cor="#686260" />
    {Array.from({length: 10}).map((_, i) => (
      <Caixa key={i} pos={[0, 0.004, -14 + i * 3.1]} tam={[14, 0.01, 0.06]} cor="#5a5450" sombra={false} />
    ))}
    {[-4, 0, 4].map((x, i) => (
      <Caixa key={i} pos={[x, 0.1, 0]} tam={[0.9, 0.2, 0.9]} cor="#7a7260" />
    ))}
    <Caixa pos={[-7.5, 0.15, 0]} tam={[1.0, 0.3, 32]} cor="#c0a878" />
    <Caixa pos={[7.5, 0.15, 0]} tam={[1.0, 0.3, 32]} cor="#c0a878" />
    {([-9.2, 9.2] as number[]).map((x) => (
      <Caixa key={x} pos={[x, 2.5, 0]} tam={[0.4, 5.0, 32]} cor={x < 0 ? '#d4b888' : '#c8a870'} />
    ))}
    {([-9.2, 9.2] as number[]).map((x) => ([-12, -6, 0, 6, 12] as number[]).map((z, j) => (
      <Caixa key={x + ':' + z} pos={[x, 2.6, z + (j % 2) * 0.5]} tam={[0.07, 0.75, 0.55]} cor="#2a1808" sombra={false} />
    )))}
  </group>
);

// ---------- Nuvem de cinza (fluxo piroclástico) ----------
const FluxoPiroclastico: React.FC<{p: number}> = ({p}) => {
  const z = lerp(-70, -2, suave(p));
  return (
    <group position={[0, 0, z]}>
      {Array.from({length: 7}).map((_, i) => (
        <mesh key={i} position={[(i % 3 - 1) * 5, i * 2.5, 0]}>
          <sphereGeometry args={[7 + i * 1.8, 7, 6]} />
          <meshStandardMaterial color={i < 2 ? '#3a2010' : '#241808'} flatShading transparent opacity={0.92} />
        </mesh>
      ))}
      <pointLight color="#ff4000" intensity={120} distance={30} decay={1.4} />
    </group>
  );
};

// ---------- Barco romano (liburna) ----------
const BarcoPompeii: React.FC<{t: number}> = ({t}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
      <planeGeometry args={[1200, 1200]} />
      <meshStandardMaterial color="#2a567a" roughness={0.3} metalness={0.1} />
    </mesh>
    <group position={[0, 0.1, 0]}>
      <Caixa pos={[0, 0.3, 0]} tam={[8, 0.6, 2.4]} cor="#8b5a3c" />
      <Caixa pos={[2.5, 0.65, 0]} tam={[3.5, 0.3, 2.2]} cor="#7a4a2a" />
      <mesh position={[-3.6, 0.3, 0]}>
        <coneGeometry args={[0.6, 1.5, 6]} />
        <meshStandardMaterial color="#6b3a1a" flatShading />
      </mesh>
      <Cil pos={[0.5, 0.65, 0]} r={0.09} h={5.0} cor="#6b4030" />
      <Caixa pos={[0.5, 2.8, 0]} tam={[2.4, 0.04, 2.6]} cor="#f0e8d0" sombra={false} />
      {([-2, -0.8, 0.4, 1.6] as number[]).map((x) => ([1, -1] as number[]).map((sg) => (
        <Barra key={x + ':' + sg} a={[x, 0.5, sg * 1.1] as V3} b={[x, 0.0, sg * 3.4] as V3} r={0.04} cor="#8b5a3c" />
      )))}
      <Boneco pos={[0.5, 0.65, 0.3]} rotY={Math.PI} acao="aponta" t={t} v={PLINIO} />
      <Boneco pos={[-0.9, 0.65, 0.3]} rotY={Math.PI + 0.3} acao="parado" t={t + 1} v={POMPEIANO_3} />
    </group>
    <Vesuvio eruptindo={1} />
  </group>
);

export const SETS_POMPEIA: Record<string, SetHistoria> = {
  // ===== gancho: Pompeia vista do alto com o Vesúvio =====
  pom_cidade: {
    ceu: CEU_DIA,
    nevoa: [120, 650],
    render: ({t, p}) => (
      <>
        <CidadePompeia eruptindo={0} />
        <Boneco pos={[2, 0, 4]} rotY={Math.PI - 0.3} acao="parado" t={t} v={ZE_POMPEIANO} />
        <Boneco pos={[0, 0, 5]} rotY={Math.PI - 0.1} acao="parado" t={t + 1} v={POMPEIANO_1} />
        <Rotulo texto="POMPEIA" ancora={[0, 3.5, -8]} sobe={1.4} vis={clamp01(p * 10)} fundo="#d9a040" />
      </>
    ),
    cams: {
      drone: orb([0, 10, 12], 12, 32, 94, 76, 44, 10),
      ze: orb([2, 1.2, 4], -18, 10, 5.0, 4.2, 42, 8),
    },
  },
  // ===== thermopolium: o bar de comida quente =====
  pom_thermopolium: {
    ceu: ['#2a2010', '#3a3020'],
    luz: 'interior',
    render: ({t, p}) => (
      <>
        <Thermopolium />
        <Boneco pos={[-0.5, 0, -0.8]} rotY={Math.PI} acao="parado" t={t} v={ZE_POMPEIANO} />
        <Boneco pos={[-0.5, 0, -1.9]} rotY={0} acao="aponta" t={t + 1} v={POMPEIANO_2} />
        <Boneco pos={[0.9, 0, -0.7]} rotY={-0.4} acao="parado" t={t + 2} v={POMPEIANO_1} />
        <Rotulo texto="thermopolium" ancora={[-1.0, 1.9, -1.6]} sobe={0.6} vis={clamp01((p - 0.3) * 8)} fundo="#c09040" />
      </>
    ),
    cams: {
      geral: orb([-0.2, 1.0, 0.2], 16, 18, 7.8, 6.6, 46, 8),
      balcao: orb([-0.3, 1.0, -1.1], 10, 24, 2.8, 2.2, 40, 8),
      comida: orb([0, 1.05, -1.7], 12, 52, 1.5, 1.2, 38, 10),
    },
  },
  // ===== rua: o chão tremendo =====
  pom_rua: {
    ceu: CEU_DIA,
    render: ({t, p}) => {
      const tremor = Math.sin(t * 24) * 0.016 * clamp01((p - 0.4) * 8) * clamp01((0.9 - p) * 10);
      return (
        <group rotation={[tremor * 0.4, 0, tremor]}>
          <RuaRomana />
          <Boneco pos={[0.3, 0, 1.2]} rotY={0.2} acao="parado" t={t} v={ZE_POMPEIANO} />
          <Boneco pos={[-1.6, 0, 2.5]} rotY={-0.4} acao="parado" t={t + 1} v={POMPEIANO_1} />
          <Boneco pos={[1.9, 0, 0.6]} rotY={0.6} acao="carrega" t={t + 2} v={POMPEIANO_3} />
        </group>
      );
    },
    cams: {
      geral: orb([0.3, 1.2, 2.2], 10, 16, 10.4, 8.8, 44, 8),
      tremor: orb([0.3, 1.3, 1.2], -14, 12, 5.0, 4.2, 42, 10),
    },
  },
  // ===== erupção: a coluna de cinza sobe trinta km =====
  pom_erupcao: {
    ceu: CEU_FUMO,
    nevoa: [60, 320],
    render: ({t, p}) => (
      <>
        <CidadePompeia eruptindo={suave(p)} />
        {Array.from({length: 20}).map((_, i) => {
          const r = rnd(i * 7);
          const y = ((t * 2.2 + i * 0.5) % 1) * 14;
          return (
            <mesh key={i} position={[(r() - 0.5) * 24, 14 - y, (r() - 0.5) * 24 - 20]}>
              <icosahedronGeometry args={[0.14 + (i % 3) * 0.07, 0]} />
              <meshStandardMaterial color="#c8c0b0" flatShading />
            </mesh>
          );
        })}
        <Boneco pos={[4, 0, 6]} rotY={Math.PI - 0.5} acao="aponta" t={t} v={ZE_POMPEIANO} />
        <Boneco pos={[2.4, 0, 5.2]} rotY={Math.PI - 0.2} acao="parado" t={t + 1} v={POMPEIANO_1} />
        <Boneco pos={[5.4, 0, 4.4]} rotY={Math.PI - 0.8} acao="parado" t={t + 2} v={POMPEIANO_2} />
      </>
    ),
    cams: {
      longe: orb([0, 2.2, 10], 4, 20, 46, 38, 48, 10),
      coluna: orb([-12, 12, 6], 22, -4, 70, 58, 44, 12),
    },
  },
  // ===== fuga e fluxo piroclástico =====
  pom_fluxo: {
    ceu: CEU_NOITE,
    luz: 'noite',
    nevoa: [25, 130],
    render: ({t, p}) => (
      <>
        <RuaRomana />
        {Array.from({length: 18}).map((_, i) => {
          const r = rnd(i * 11);
          const y = ((t * 1.8 + i * 0.4) % 1) * 10;
          return (
            <mesh key={i} position={[(r() - 0.5) * 14, 10 - y, (r() - 0.5) * 20]}>
              <sphereGeometry args={[0.08 + (i % 4) * 0.04, 4, 3]} />
              <meshStandardMaterial color="#8a8078" flatShading />
            </mesh>
          );
        })}
        <Boneco pos={[0, 0, lerp(0, 4, (t * 0.5) % 1)]} rotY={Math.PI} acao="anda" t={t} v={ZE_POMPEIANO} />
        <Boneco pos={[-1.5, 0, lerp(-1, 5, (t * 0.45) % 1)]} rotY={Math.PI + 0.3} acao="anda" t={t + 1} v={POMPEIANO_1} />
        <Boneco pos={[1.6, 0, lerp(-2, 4, (t * 0.55) % 1)]} rotY={Math.PI - 0.2} acao="anda" t={t + 2} v={POMPEIANO_3} />
        {p > 0.5 && <FluxoPiroclastico p={(p - 0.5) * 2} />}
      </>
    ),
    cams: {
      fuga: orb([0, 1.3, 2.5], 10, 12, 8.2, 6.8, 44, 8),
      descida: orb([0, 3.0, 10], -4, 2, 28, 22, 50, 10),
    },
  },
  // ===== Plínio, o Velho: a liburna de resgate =====
  pom_barca: {
    ceu: CEU_FUMO,
    nevoa: [200, 1400],
    render: ({t}) => <BarcoPompeii t={t} />,
    cams: {
      geral: orb([0, 2.6, 7], 22, 20, 24, 20, 44, 8),
      ze: orb([0.5, 1.4, 0.3], 28, 10, 4.6, 3.8, 40, 8),
    },
  },
  // ===== fecho: ruínas cobertas de cinza e a pergunta =====
  pom_fim: {
    ceu: ['#2a1a0a', '#3a2010'],
    nevoa: [30, 160],
    render: ({t, p}) => (
      <>
        <Caixa pos={[0, -0.05, 0]} tam={[60, 0.1, 60]} cor="#8a7a60" />
        {([[-4, -6], [2, -4], [-6, 2], [4, 4], [-2, 8], [6, -8], [-8, 10]] as [number, number][]).map(([x, z], i) => (
          <group key={i}>
            <Caixa pos={[x, 1.0, z]} tam={[2.4, 2.0, 2.0]} cor={['#c0a870', '#b89860', '#caa878', '#b08860', '#c09870', '#a88850', '#c0a060'][i]} />
            <Caixa pos={[x + 1.2, 0.2, z + 1.0]} rot={0.4} tam={[0.5, 0.4, 0.5]} cor="#a89060" />
          </group>
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#8a8070" transparent opacity={0.65} roughness={1} />
        </mesh>
        <Boneco pos={[0, 0, 0]} rotY={Math.PI} acao="parado" t={t} v={ZE_POMPEIANO} />
        <Vesuvio eruptindo={clamp01(p * 3) * 0.3} />
      </>
    ),
    cams: {
      aereo: orb([0, 7, 0], -22, 44, 58, 46, 42, 10),
      ze: orb([0, 1.2, 0], 18, 8, 4.2, 3.4, 40, 8),
    },
  },
};
