import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import '../Video'; // carrega a fonte Baloo 2

// Identidade visual dos 6 perfis: avatar (1080x1080) e banner do YouTube (2560x1440).
// Mesmo Zé low-poly do formato "Você construiu", com chapéu/roupa/objeto de cada nicho.

const FONTE = "'Baloo 2', sans-serif";
const LINHA = '#2b2233';
type V3 = [number, number, number];

const M: React.FC<{cor: string; e?: number}> = ({cor, e = 0}) => (
  <meshStandardMaterial color={cor} flatShading roughness={0.8} emissive={cor} emissiveIntensity={e} />
);

export type Nicho = 'receitas' | 'historia' | 'construiu' | 'crimes' | 'ricos' | 'espaco' | 'valeapena';

type Estilo = {
  nome: string;
  slogan: string;
  fundo: [string, string];
  chao: string;
  roupa: string;
  calca: string;
  chapeu: React.ReactNode;
  extraTronco?: React.ReactNode;
  objeto: React.ReactNode;
  cena: React.ReactNode; // objetos de fundo do banner
  corTitulo: string;
};

// ---------- chapéus ----------
const Capacete = () => (
  <group position={[0, 0.12, 0]}>
    <mesh><sphereGeometry args={[0.39, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><M cor="#ffd23f" /></mesh>
    <mesh position={[0, 0, 0.08]}><cylinderGeometry args={[0.46, 0.46, 0.04, 16]} /><M cor="#ffd23f" /></mesh>
    <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.08, 0.1, 0.6]} /><M cor="#f2c230" /></mesh>
  </group>
);
const Toque = () => (
  <group position={[0, 0.28, 0]}>
    <mesh><cylinderGeometry args={[0.33, 0.3, 0.3, 14]} /><M cor="#ffffff" /></mesh>
    {[[-0.15, 0.25, 0], [0.15, 0.25, 0], [0, 0.3, 0.12], [0, 0.3, -0.12], [0, 0.36, 0]].map((p, i) => (
      <mesh key={i} position={p as V3}><sphereGeometry args={[0.2, 10, 8]} /><M cor="#ffffff" /></mesh>
    ))}
  </group>
);
const Elmo = () => (
  <group position={[0, 0.1, 0]}>
    <mesh><sphereGeometry args={[0.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9]} /><M cor="#c9a24a" /></mesh>
    <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.1, 0.3, 0.75]} /><M cor="#d63a2f" /></mesh>
    <mesh position={[0.36, -0.12, 0.05]}><boxGeometry args={[0.06, 0.3, 0.22]} /><M cor="#c9a24a" /></mesh>
    <mesh position={[-0.36, -0.12, 0.05]}><boxGeometry args={[0.06, 0.3, 0.22]} /><M cor="#c9a24a" /></mesh>
  </group>
);
const Fedora = () => (
  <group position={[0, 0.24, 0]} rotation={[0, 0, -0.08]}>
    <mesh><cylinderGeometry args={[0.52, 0.52, 0.04, 18]} /><M cor="#6b4a32" /></mesh>
    <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.28, 0.33, 0.32, 14]} /><M cor="#6b4a32" /></mesh>
    <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.335, 0.335, 0.07, 14]} /><M cor="#2b2233" /></mesh>
  </group>
);
const Cartola = () => (
  <group position={[0, 0.26, 0]} rotation={[0, 0, 0.08]}>
    <mesh><cylinderGeometry args={[0.48, 0.48, 0.04, 18]} /><M cor="#1d1b22" /></mesh>
    <mesh position={[0, 0.27, 0]}><cylinderGeometry args={[0.28, 0.28, 0.52, 16]} /><M cor="#1d1b22" /></mesh>
    <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.285, 0.285, 0.08, 16]} /><M cor="#ffd23f" /></mesh>
  </group>
);
const Bolha = () => (
  <group>
    <mesh><sphereGeometry args={[0.52, 20, 16]} /><meshStandardMaterial color="#bfe9ff" transparent opacity={0.28} roughness={0.1} /></mesh>
    <mesh position={[0, -0.47, 0]}><cylinderGeometry args={[0.38, 0.42, 0.12, 16]} /><M cor="#e9eef5" /></mesh>
    <mesh position={[0.43, 0.2, 0]}><boxGeometry args={[0.06, 0.18, 0.06]} /><M cor="#ff5d5d" e={0.5} /></mesh>
  </group>
);

// ---------- objetos ----------
const Frigideira = () => (
  <group>
    <mesh><cylinderGeometry args={[0.38, 0.32, 0.1, 14]} /><M cor="#3b3d45" /></mesh>
    <mesh position={[0.62, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, 0.5, 6]} /><M cor="#8b5a3c" /></mesh>
    <mesh position={[0, 0.06, 0]} scale={[1, 0.15, 1]}><sphereGeometry args={[0.24, 12, 8]} /><M cor="#ffffff" /></mesh>
    <mesh position={[0.03, 0.1, 0.02]} scale={[1, 0.6, 1]}><sphereGeometry args={[0.09, 10, 8]} /><M cor="#ffb21f" /></mesh>
  </group>
);
const Piramide = ({esc = 1}: {esc?: number}) => (
  <mesh scale={esc} position={[0, 0.5 * esc, 0]} rotation={[0, Math.PI / 4, 0]}>
    <coneGeometry args={[0.85, 1, 4]} /><M cor="#e0b45c" />
  </mesh>
);
const Coluna = ({h = 1.6}: {h?: number}) => (
  <group>
    <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.5, 0.1, 0.5]} /><M cor="#f1ebdd" /></mesh>
    <mesh position={[0, h / 2, 0]}><cylinderGeometry args={[0.16, 0.18, h, 10]} /><M cor="#f1ebdd" /></mesh>
    <mesh position={[0, h + 0.05, 0]}><boxGeometry args={[0.5, 0.1, 0.5]} /><M cor="#f1ebdd" /></mesh>
  </group>
);
const Casinha = ({esc = 1}: {esc?: number}) => (
  <group scale={esc}>
    <mesh position={[0, 0.45, 0]}><boxGeometry args={[1.1, 0.9, 0.9]} /><M cor="#f6efe2" /></mesh>
    <mesh position={[0, 1.15, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.92, 0.55, 4]} /><M cor="#c8462f" /></mesh>
    <mesh position={[0, 0.27, 0.451]}><boxGeometry args={[0.26, 0.5, 0.02]} /><M cor="#8b5a3c" /></mesh>
    <mesh position={[0.32, 0.55, 0.451]}><boxGeometry args={[0.24, 0.22, 0.02]} /><M cor="#8fd3ff" /></mesh>
  </group>
);
const Moedas = ({n = 4}: {n?: number}) => (
  <group>
    {Array.from({length: n}).map((_, i) => (
      <mesh key={i} position={[0, 0.05 + i * 0.09, 0]} rotation={[0, i * 0.4, 0]}><cylinderGeometry args={[0.22, 0.22, 0.08, 14]} /><M cor="#ffc928" /></mesh>
    ))}
  </group>
);
const Lupa = () => (
  <group rotation={[0, 0, 0.6]}>
    <mesh position={[0, 0.3, 0]}><torusGeometry args={[0.22, 0.05, 8, 18]} /><M cor="#c9a24a" /></mesh>
    <mesh position={[0, 0.3, 0]}><circleGeometry args={[0.2, 18]} /><meshStandardMaterial color="#bfe9ff" transparent opacity={0.45} /></mesh>
    <mesh position={[0, -0.12, 0]}><cylinderGeometry args={[0.04, 0.05, 0.4, 6]} /><M cor="#4a3426" /></mesh>
  </group>
);
const Saco = () => (
  <group>
    <mesh position={[0, 0.3, 0]} scale={[1, 0.9, 1]}><sphereGeometry args={[0.32, 12, 10]} /><M cor="#c9a46a" /></mesh>
    <mesh position={[0, 0.62, 0]}><cylinderGeometry args={[0.08, 0.14, 0.14, 8]} /><M cor="#b48e55" /></mesh>
    <mesh position={[0, 0.3, 0.3]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.1, 0.1, 0.03, 12]} /><M cor="#2fbf71" /></mesh>
  </group>
);
const Barra = () => (
  <mesh scale={[1, 0.5, 0.55]} rotation={[0, Math.PI / 4, 0]}><cylinderGeometry args={[0.18, 0.3, 0.3, 4]} /><M cor="#ffc928" /></mesh>
);
const Planeta = ({cor = '#ff8a3d', r = 0.5, anel = true}: {cor?: string; r?: number; anel?: boolean}) => (
  <group rotation={[0.35, 0, 0.3]}>
    <mesh><icosahedronGeometry args={[r, 1]} /><M cor={cor} e={0.15} /></mesh>
    {anel && <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r * 1.55, r * 0.09, 4, 24]} /><M cor="#ffe08a" e={0.2} /></mesh>}
  </group>
);
const Estrelas = ({n = 40, area = [16, 6] as [number, number], z = -4}) => (
  <group>
    {Array.from({length: n}).map((_, i) => {
      const x = (((i * 73) % 100) / 100 - 0.5) * area[0];
      const y = (((i * 37 + 11) % 100) / 100) * area[1] - 0.5;
      const s = 0.03 + ((i * 17) % 5) * 0.012;
      return <mesh key={i} position={[x, y, z - (i % 3)]}><octahedronGeometry args={[s, 0]} /><meshBasicMaterial color="#fff6c8" /></mesh>;
    })}
  </group>
);
const Fita = () => (
  <group position={[0, 0.9, -1.2]} rotation={[0, 0, -0.12]}>
    <mesh><boxGeometry args={[14, 0.34, 0.02]} /><M cor="#ffd23f" /></mesh>
    {Array.from({length: 22}).map((_, i) => (
      <mesh key={i} position={[-6.7 + i * 0.64, 0, 0.015]} rotation={[0, 0, 0.6]}><boxGeometry args={[0.12, 0.5, 0.01]} /><M cor="#1d1b22" /></mesh>
    ))}
  </group>
);
const Tomate = () => (
  <group>
    <mesh position={[0, 0.2, 0]}><icosahedronGeometry args={[0.2, 1]} /><M cor="#e8322b" /></mesh>
    <mesh position={[0, 0.4, 0]}><coneGeometry args={[0.08, 0.06, 5]} /><M cor="#3f9b5a" /></mesh>
  </group>
);
const Cenoura = () => (
  <group rotation={[0, 0, 1.2]}>
    <mesh><coneGeometry args={[0.1, 0.55, 6]} /><M cor="#ff8a1f" /></mesh>
    <mesh position={[0, 0.33, 0]}><coneGeometry args={[0.07, 0.18, 5]} /><M cor="#3f9b5a" /></mesh>
  </group>
);


const Bone = () => (
  <group position={[0, 0.16, 0]}>
    <mesh><sphereGeometry args={[0.38, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><M cor="#e8322b" /></mesh>
    <mesh position={[0, 0.01, 0.36]} rotation={[0.15, 0, 0]} scale={[1, 1, 0.75]}><cylinderGeometry args={[0.3, 0.3, 0.03, 16, 1, false, -Math.PI / 2, Math.PI]} /><M cor="#c4221c" /></mesh>
    <mesh position={[0, 0.37, 0]}><sphereGeometry args={[0.05, 8, 6]} /><M cor="#c4221c" /></mesh>
    {[-0.13, 0.13].map((x) => <mesh key={x} position={[x, -0.14, 0.34]}><torusGeometry args={[0.085, 0.018, 6, 14]} /><M cor="#2b2233" /></mesh>)}
    <mesh position={[0, -0.14, 0.36]}><boxGeometry args={[0.08, 0.02, 0.02]} /><M cor="#2b2233" /></mesh>
  </group>
);
const Check = ({cor = '#ffffff'}: {cor?: string}) => (
  <group>
    <mesh position={[-0.05, -0.02, 0]} rotation={[0, 0, 0.8]}><boxGeometry args={[0.05, 0.14, 0.03]} /><M cor={cor} /></mesh>
    <mesh position={[0.06, 0.03, 0]} rotation={[0, 0, -0.6]}><boxGeometry args={[0.05, 0.26, 0.03]} /><M cor={cor} /></mesh>
  </group>
);
const Prancheta = () => (
  <group rotation={[-0.2, 0.3, 0]}>
    <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.5, 0.66, 0.04]} /><M cor="#b07a45" /></mesh>
    <mesh position={[0, 0.27, 0.025]}><boxGeometry args={[0.42, 0.54, 0.01]} /><M cor="#ffffff" /></mesh>
    <mesh position={[0, 0.6, 0.03]}><boxGeometry args={[0.2, 0.07, 0.04]} /><M cor="#9aa0aa" /></mesh>
    {[0.42, 0.28, 0.14].map((y) => <group key={y}><mesh position={[0.05, y, 0.035]}><boxGeometry args={[0.22, 0.03, 0.01]} /><M cor="#c9ced9" /></mesh><group position={[-0.13, y, 0.04]} scale={0.45}><Check cor="#2fbf71" /></group></group>)}
  </group>
);
const Selo = ({esc = 1}: {esc?: number}) => (
  <group scale={esc} rotation={[0, -0.3, 0]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.32, 0.32, 0.06, 12]} /><M cor="#2fbf71" /></mesh>
    <group position={[0, 0, 0.04]}><Check /></group>
  </group>
);
const CaixaProduto = ({esc = 1, cor = '#d9a86c'}: {esc?: number; cor?: string}) => (
  <group scale={esc}>
    <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.7, 0.6, 0.6]} /><M cor={cor} /></mesh>
    <mesh position={[0, 0.6, 0]}><boxGeometry args={[0.72, 0.03, 0.12]} /><M cor="#c9a46a" /></mesh>
  </group>
);
const AirFryer = ({esc = 1}: {esc?: number}) => (
  <group scale={esc}>
    <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.6, 0.8, 0.6]} /><M cor="#2b2d33" /></mesh>
    <mesh position={[0, 0.3, 0.31]}><boxGeometry args={[0.46, 0.36, 0.04]} /><M cor="#3b3d45" /></mesh>
    <mesh position={[0, 0.3, 0.36]}><boxGeometry args={[0.2, 0.06, 0.08]} /><M cor="#9aa0aa" /></mesh>
    <mesh position={[0, 0.66, 0.31]}><cylinderGeometry args={[0.06, 0.06, 0.04, 10]} /><M cor="#ff8a1f" e={0.4} /></mesh>
  </group>
);

export const ESTILOS: Record<Nicho, Estilo> = {
  receitas: {
    nome: 'Zé na Cozinha', slogan: 'Receitas fáceis explicadas por bonequinhos', fundo: ['#ffb347', '#ffe1a8'], chao: '#f6e6c8',
    roupa: '#ffffff', calca: '#2b2233', chapeu: <Toque />, objeto: <Frigideira />, corTitulo: '#ffffff',
    extraTronco: (<>{[0.68, 0.86].map((y) => <mesh key={y} position={[0.08, y, 0.27]}><sphereGeometry args={[0.035, 6, 6]} /><M cor="#2b2233" /></mesh>)}<mesh position={[0, 1.07, 0.18]} rotation={[0.3, 0, 0]}><torusGeometry args={[0.16, 0.05, 6, 12]} /><M cor="#e8322b" /></mesh></>),
    cena: (<><group position={[-1.2, 0, -0.6]}><Tomate /></group><group position={[2.0, 0.1, -0.4]}><Cenoura /></group><group position={[1.5, 0, 0.5]}><Tomate /></group></>),
  },
  historia: {
    nome: 'Você na História', slogan: 'A história do mundo como se você estivesse lá', fundo: ['#e9b872', '#f8e7c4'], chao: '#e8cf9a',
    roupa: '#d63a2f', calca: '#8b5a3c', chapeu: <Elmo />, objeto: <Coluna h={1.0} />, corTitulo: '#ffffff',
    extraTronco: <mesh position={[0, 0.66, 0]}><cylinderGeometry args={[0.3, 0.3, 0.1, 10]} /><M cor="#c9a24a" /></mesh>,
    cena: (<><group position={[-3.2, 0, -3]}><Piramide esc={2.4} /></group><group position={[-1.2, 0, -2.4]}><Piramide esc={1.4} /></group><group position={[2.6, 0, -1.6]}><Coluna h={2} /></group><group position={[3.4, 0, -1.2]}><Coluna h={1.4} /></group></>),
  },
  construiu: {
    nome: 'Você Construiu', slogan: 'Quanto custa construir de verdade, peça por peça', fundo: ['#8fd3ff', '#d9f1ff'], chao: '#7cc576',
    roupa: '#4f8cff', calca: '#30406b', chapeu: <Capacete />, objeto: <Moedas n={5} />, corTitulo: '#ffffff',
    extraTronco: (<><mesh position={[0, 0.78, 0.02]}><cylinderGeometry args={[0.3, 0.3, 0.48, 10, 1, true]} /><meshStandardMaterial color="#ff8a1f" flatShading side={2} /></mesh>{[0.68, 0.86].map((y) => <mesh key={y} position={[0, y, 0.02]}><cylinderGeometry args={[0.305, 0.305, 0.05, 10, 1, true]} /><meshStandardMaterial color="#f4f4f4" side={2} /></mesh>)}</>),
    cena: (<><group position={[-2.6, 0, -1.6]}><Casinha esc={1.5} /></group><group position={[2.4, 0, -1.2]}><Casinha esc={1} /></group><group position={[1.2, 0, 0.6]}><Moedas n={3} /></group></>),
  },
  crimes: {
    nome: 'Caso Explicado', slogan: 'Crimes e mistérios reais, explicados passo a passo', fundo: ['#1d2340', '#3a4170'], chao: '#2a3054',
    roupa: '#c7a36b', calca: '#3b3d45', chapeu: <Fedora />, objeto: <Lupa />, corTitulo: '#ffd23f',
    extraTronco: <mesh position={[0, 1.03, 0.12]}><boxGeometry args={[0.36, 0.1, 0.3]} /><M cor="#b08f5a" /></mesh>,
    cena: (<><Fita /><mesh position={[2.2, 0.02, 0.3]} rotation={[-Math.PI / 2, 0, 0.4]}><ringGeometry args={[0.35, 0.42, 5]} /><meshBasicMaterial color="#ffffff" /></mesh><group position={[-2.4, 0, -0.4]}><mesh position={[0, 0.3, 0]}><boxGeometry args={[0.7, 0.6, 0.5]} /><M cor="#8b5a3c" /></mesh><mesh position={[0, 0.65, 0]}><boxGeometry args={[0.5, 0.08, 0.36]} /><M cor="#f4f4f4" /></mesh></group></>),
  },
  ricos: {
    nome: 'Como Ficou Rico', slogan: 'Como os bilionários e as marcas chegaram lá', fundo: ['#1f8f5a', '#47c98a'], chao: '#1a7a4c',
    roupa: '#1d1b22', calca: '#1d1b22', chapeu: <Cartola />, objeto: <Saco />, corTitulo: '#ffd23f',
    extraTronco: (<><mesh position={[0, 0.9, 0.26]}><coneGeometry args={[0.12, 0.3, 3]} /><M cor="#ffffff" /></mesh><mesh position={[0, 0.88, 0.3]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.05, 0.22, 4]} /><M cor="#e8322b" /></mesh></>),
    cena: (<><group position={[-2.2, 0, -0.6]}>{[[0, 0.08, 0], [0.4, 0.08, 0.05], [0.2, 0.24, 0]].map((p, i) => <group key={i} position={p as V3}><Barra /></group>)}</group><group position={[2.3, 0, -0.3]}><Moedas n={6} /></group><group position={[1.6, 0, 0.6]}><Moedas n={3} /></group></>),
  },
  valeapena: {
    nome: 'Vale a Pena?', slogan: 'Testamos e explicamos produtos antes de você comprar', fundo: ['#ffc928', '#fff1a8'], chao: '#ffffff',
    roupa: '#2f6bff', calca: '#2b2233', chapeu: <Bone />, objeto: <Prancheta />, corTitulo: '#ffffff',
    extraTronco: <mesh position={[0, 1.02, 0.14]} rotation={[0.3, 0, 0]}><boxGeometry args={[0.3, 0.06, 0.22]} /><M cor="#ffffff" /></mesh>,
    cena: (<><group position={[-2.3, 0, -0.8]}><AirFryer esc={1.3} /></group><group position={[2.2, 0, -0.6]}><CaixaProduto esc={1.2} /></group><group position={[2.9, 0, 0.2]}><CaixaProduto esc={0.8} cor="#c99257" /></group><group position={[1.3, 1.9, -0.4]}><Selo esc={1.3} /></group></>),
  },
  espaco: {
    nome: 'Zé no Espaço', slogan: 'O universo explicado em bonequinhos', fundo: ['#120e3a', '#3b2a7a'], chao: '#8a86a8',
    roupa: '#eef1f6', calca: '#d7dce6', chapeu: <Bolha />, objeto: <Planeta r={0.32} />, corTitulo: '#ffffff',
    extraTronco: <mesh position={[0, 0.85, -0.3]}><boxGeometry args={[0.45, 0.55, 0.22]} /><M cor="#c9ced9" /></mesh>,
    cena: (<><Estrelas n={60} area={[18, 7]} /><group position={[-3.0, 2.6, -2.5]}><Planeta cor="#ff8a3d" r={0.9} /></group><group position={[3.2, 2.9, -2]}><Planeta cor="#5ec8ff" r={0.45} anel={false} /></group><group position={[2.4, 1.6, -1]}><Planeta cor="#c86bff" r={0.25} anel={false} /></group></>),
  },
};

const Mascote: React.FC<{e: Estilo; pos?: V3; rotY?: number}> = ({e, pos = [0, 0, 0], rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {[-0.13, 0.13].map((x) => (
      <group key={x}>
        <mesh position={[x, 0.28, 0]}><capsuleGeometry args={[0.1, 0.32, 3, 8]} /><M cor={e.calca} /></mesh>
        <mesh position={[x, 0.05, 0.06]}><boxGeometry args={[0.2, 0.1, 0.3]} /><M cor="#4a3426" /></mesh>
      </group>
    ))}
    <mesh position={[0, 0.78, 0]}><capsuleGeometry args={[0.27, 0.38, 4, 10]} /><M cor={e.roupa} /></mesh>
    {e.extraTronco}
    {/* braço direito acenando */}
    <group position={[0.34, 1.0, 0]} rotation={[0.35, 0, -2.4]}>
      <mesh position={[0, -0.22, 0]}><capsuleGeometry args={[0.08, 0.3, 3, 8]} /><M cor={e.roupa} /></mesh>
      <mesh position={[0, -0.45, 0]}><sphereGeometry args={[0.09, 8, 8]} /><M cor="#ffd2ad" /></mesh>
    </group>
    {/* braço esquerdo segurando o objeto */}
    <group position={[-0.34, 1.0, 0]} rotation={[-0.9, 0, 0.35]}>
      <mesh position={[0, -0.22, 0]}><capsuleGeometry args={[0.08, 0.3, 3, 8]} /><M cor={e.roupa} /></mesh>
      <mesh position={[0, -0.45, 0]}><sphereGeometry args={[0.09, 8, 8]} /><M cor="#ffd2ad" /></mesh>
    </group>
    <group position={[-0.62, 0.72, 0.42]} scale={0.75}>{e.objeto}</group>
    <group position={[0, 1.5, 0]}>
      <mesh><sphereGeometry args={[0.36, 16, 12]} /><M cor="#ffd2ad" /></mesh>
      {[-0.12, 0.12].map((x) => <mesh key={x} position={[x, 0.02, 0.32]}><sphereGeometry args={[0.055, 8, 8]} /><meshStandardMaterial color="#2b2233" /></mesh>)}
      {[-0.2, 0.2].map((x) => <mesh key={x} position={[x, -0.1, 0.28]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#ff9b8a" /></mesh>)}
      <mesh position={[0, -0.14, 0.31]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.07, 0.02, 6, 10, Math.PI]} /><meshStandardMaterial color="#5a1f2b" /></mesh>
      {e.chapeu}
    </group>
  </group>
);

const Luzes: React.FC<{escuro: boolean}> = ({escuro}) => (
  <>
    <hemisphereLight args={['#ffffff', escuro ? '#3a3a6a' : '#c8b89a', escuro ? 0.7 : 0.95]} />
    <directionalLight position={[4, 8, 6]} intensity={escuro ? 1.6 : 1.9} />
    <directionalLight position={[-5, 3, 2]} intensity={0.45} color={escuro ? '#9ab0ff' : '#ffe8c8'} />
  </>
);

export const Avatar: React.FC<{nicho: Nicho}> = ({nicho}) => {
  const e = ESTILOS[nicho];
  const {width, height} = useVideoConfig();
  const escuro = nicho === 'crimes' || nicho === 'espaco';
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${e.fundo[1]} 0%, ${e.fundo[0]} 70%)`}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 30, near: 0.1, far: 100, position: [0.9, 1.7, 5.4]}} onCreated={({camera}) => camera.lookAt(-0.15, 1.2, 0)}>
        <Luzes escuro={escuro} />
        {nicho === 'espaco' && <Estrelas n={30} area={[6, 4]} z={-3} />}
        <Mascote e={e} rotY={0.12} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const Banner: React.FC<{nicho: Nicho}> = ({nicho}) => {
  const e = ESTILOS[nicho];
  const {width, height} = useVideoConfig();
  const escuro = nicho === 'crimes' || nicho === 'espaco';
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${e.fundo[0]} 0%, ${e.fundo[1]} 100%)`}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 26, near: 0.1, far: 200, position: [0, 2.3, 15.5]}} onCreated={({camera}) => camera.lookAt(0, 1.15, 0)}>
        <Luzes escuro={escuro} />
        <mesh position={[-2.9, -0.08, 0]}>
          <cylinderGeometry args={[2.3, 2.5, 0.16, 28]} />
          <meshStandardMaterial color={e.chao} flatShading />
        </mesh>
        <mesh position={[7.6, -0.08, 0]}>
          <cylinderGeometry args={[2.3, 2.5, 0.16, 28]} />
          <meshStandardMaterial color={e.chao} flatShading />
        </mesh>
        <group position={[-2.9, 0, -0.2]} scale={0.5}>{e.cena}</group>
        <group position={[7.6, 0, -0.2]} scale={0.5}>{e.cena}</group>
        <Mascote e={e} pos={[-2.9, 0, 0.6]} rotY={0.35} />
      </ThreeCanvas>
      {/* área segura do YouTube: 1546x423 centralizada */}
      <div style={{position: 'absolute', left: (width - 1546) / 2 + 560, top: (height - 423) / 2 + 20, width: 1546 - 560, height: 423, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 122, lineHeight: 1, whiteSpace: 'nowrap', color: e.corTitulo, WebkitTextStroke: `16px ${LINHA}`, paintOrder: 'stroke fill', textShadow: '0 12px 0 rgba(0,0,0,0.25)'}}>{e.nome}</div>
        <div style={{marginTop: 22, alignSelf: 'flex-start', background: LINHA, color: '#ffffff', fontFamily: FONTE, fontWeight: 800, fontSize: 38, whiteSpace: 'nowrap', padding: '4px 28px', borderRadius: 24}}>{e.slogan}</div>
      </div>
    </AbsoluteFill>
  );
};
