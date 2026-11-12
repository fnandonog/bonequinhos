import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Boneco, Caixa, Cil, Mat, Visual} from '../v4/kit';
import '../Video'; // carrega a fonte Baloo 2

// Personagem fixo do perfil "Seu Tostão" (id rico): caixa de banco aposentado + o papagaio Juros.
// Guia do formato: docs/formatos/rico.md. Use <SeuTostao/> e <Juros/> dentro de qualquer cena 3D.

type V3 = [number, number, number];
const FONTE = "'Baloo 2', sans-serif";

// Cardigã cor de caramelo, camisa social por baixo (gravata vinho), calça cinza, cabelo branco.
export const TOSTAO: Visual = {camisa: '#c08a4e', colete: null, capacete: null, calca: '#5d5f6b', pele: '#f0c7a0', gravata: '#7a2333', vovo: true};

export type Expressao = NonNullable<Visual['expressao']>;
export const SeuTostao: React.FC<{pos?: V3; rotY?: number; t?: number; acao?: React.ComponentProps<typeof Boneco>['acao']; expressao?: Expressao; esc?: number; bengala?: boolean}> = ({pos = [0, 0, 0], rotY = 0, t = 0, acao = 'parado', expressao = 'normal', esc = 0.92, bengala = true}) => (
  <Boneco pos={pos} rotY={rotY} t={t} acao={acao} v={{...TOSTAO, expressao}} esc={esc} ferramenta={bengala && acao !== 'aponta' && acao !== 'acena' && acao !== 'comemora' ? 'bengala' : null} />
);

// Juros, o papagaio. acao 'grita' abre o bico, bate as asas e arrepia o topete: use no número mais absurdo
// do vídeo. `grita` (0..1) permite dosar a intensidade (ex.: rampa de entrada).
export const Juros: React.FC<{pos?: V3; rotY?: number; t?: number; esc?: number; acao?: 'parado' | 'grita'; grita?: number}> = ({pos = [0, 0, 0], rotY = 0, t = 0, esc = 1, acao = 'parado', grita: g}) => {
  const grita = g ?? (acao === 'grita' ? 1 : 0);
  const bate = grita > 0 ? Math.sin(t * 22) * 0.6 * grita : Math.sin(t * 2) * 0.05;
  const pulo = grita > 0 ? Math.abs(Math.sin(t * 11)) * 0.06 * grita : 0;
  return (
    <group position={[pos[0], pos[1] + pulo, pos[2]]} rotation={[0, rotY, 0]} scale={esc}>
      {/* corpo */}
      <mesh position={[0, 0.22, 0]} rotation={[-0.25, 0, 0]} castShadow scale={[0.85, 1.15, 0.85]}><sphereGeometry args={[0.15, 12, 10]} /><Mat cor="#2fb34a" /></mesh>
      <mesh position={[0, 0.2, 0.08]} scale={[0.6, 0.9, 0.5]}><sphereGeometry args={[0.13, 10, 8]} /><Mat cor="#ffd23f" /></mesh>
      {/* cabeça */}
      <group position={[0, 0.43, 0.03]}>
        <mesh castShadow><sphereGeometry args={[0.11, 12, 10]} /><Mat cor="#e8322b" /></mesh>
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <mesh position={[sx * 0.075, 0.02, 0.06]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#ffffff" /></mesh>
            <mesh position={[sx * 0.085, 0.022, 0.09]}><sphereGeometry args={[0.018, 6, 6]} /><meshStandardMaterial color="#1d1b26" /></mesh>
          </group>
        ))}
        {/* bico: de cima fixo, de baixo abre quando grita */}
        <mesh position={[0, -0.01, 0.12]} rotation={[0.5, 0, 0]}><coneGeometry args={[0.045, 0.1, 6]} /><Mat cor="#f2e6c9" /></mesh>
        <mesh position={[0, -0.05 - 0.03 * grita, 0.1]} rotation={[1.9 + 0.5 * grita, 0, 0]}><coneGeometry args={[0.03, 0.06, 6]} /><Mat cor="#3b3340" /></mesh>
        {/* topete */}
        {[-0.03, 0, 0.03].map((x, i) => (<mesh key={x} position={[x, 0.11 + 0.03 * grita, -0.02]} rotation={[-0.5 - 0.3 * grita, 0, x * 6]}><coneGeometry args={[0.02, 0.09 + i * 0.01, 5]} /><Mat cor="#e8322b" /></mesh>))}
      </group>
      {/* asas */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 0.12, 0.24, -0.02]} rotation={[-0.3, 0, sx * (0.25 + bate)]} scale={[0.35, 1, 0.7]} castShadow><sphereGeometry args={[0.14, 8, 8]} /><Mat cor="#1f7fd6" /></mesh>
      ))}
      {/* cauda */}
      <mesh position={[0, 0.04, -0.14]} rotation={[-1.1, 0, 0]}><boxGeometry args={[0.08, 0.3, 0.02]} /><Mat cor="#1f7fd6" /></mesh>
      {/* patas */}
      {[-0.05, 0.05].map((x) => (<Cil key={x} pos={[x, 0.04, 0.02]} r={0.012} h={0.08} cor="#8a8a8a" />))}
    </group>
  );
};

// Poleiro de pé (madeira), para o Juros ficar ao lado do Seu Tostão.
export const Poleiro: React.FC<{pos?: V3; h?: number}> = ({pos = [0, 0, 0], h = 1.05}) => (
  <group position={pos}>
    <Cil pos={[0, 0.03, 0]} r={0.2} h={0.06} cor="#6b3e26" />
    <Cil pos={[0, h / 2, 0]} r={0.025} h={h} cor="#8b5a3c" />
    <Cil pos={[0, h, 0]} rot={[0, 0, Math.PI / 2]} r={0.022} h={0.42} cor="#8b5a3c" />
  </group>
);

// ---------- identidade visual: avatar 1080x1080 e banner do YouTube 2560x1440 ----------
const Luzes = () => (
  <>
    <ambientLight intensity={0.75} />
    <directionalLight position={[3, 6, 5]} intensity={1.6} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
    <directionalLight position={[-4, 3, 2]} intensity={0.45} color="#ffe2b0" />
  </>
);

const Moedas: React.FC<{pos: V3; n: number}> = ({pos, n}) => (
  <group position={pos}>
    {Array.from({length: n}).map((_, i) => (<Cil key={i} pos={[0, 0.03 + i * 0.055, 0]} rot={[0, i * 0.5, 0]} r={0.13} h={0.05} cor={i % 2 ? '#e8b923' : '#ffcf3a'} seg={14} />))}
  </group>
);

const Cofre: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.45, 0]} tam={[0.9, 0.9, 0.7]} cor="#4a5560" />
    <Caixa pos={[0, 0.45, 0.36]} tam={[0.72, 0.72, 0.03]} cor="#5d6a76" />
    <mesh position={[0.05, 0.45, 0.39]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.13, 0.13, 0.04, 16]} /><Mat cor="#c9a24a" /></mesh>
    <Caixa pos={[-0.22, 0.45, 0.39]} tam={[0.05, 0.22, 0.04]} cor="#c9a24a" />
  </group>
);

// Balcão de caixa de banco antigo (madeira + vidro + placa CAIXA).
const Balcao: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Caixa pos={[0, 0.5, 0]} tam={[3.2, 1, 0.7]} cor="#7a4a2a" />
    <Caixa pos={[0, 1.02, 0]} tam={[3.3, 0.06, 0.8]} cor="#5a3420" />
    {[-1.2, 0, 1.2].map((x) => (<Caixa key={x} pos={[x, 0.5, 0.36]} tam={[0.9, 0.7, 0.02]} cor="#8b5a3c" />))}
    <mesh position={[0, 1.45, -0.1]}><boxGeometry args={[3.2, 0.8, 0.02]} /><meshStandardMaterial color="#bfe9ff" transparent opacity={0.25} /></mesh>
    {[-1.6, 1.6].map((x) => (<Caixa key={x} pos={[x, 1.45, -0.1]} tam={[0.06, 0.82, 0.06]} cor="#c9a24a" />))}
  </group>
);

const Cena: React.FC<{banner?: boolean}> = ({banner}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <>
      <Luzes />
      {banner && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}><planeGeometry args={[40, 40]} /><shadowMaterial opacity={0.18} /></mesh>
          <Balcao pos={[0, 0, -1.4]} />
          <Cofre pos={[2.0, 0, -0.7]} rotY={-0.5} />
          <Moedas pos={[-1.35, 0, 0.5]} n={6} />
          <Moedas pos={[-1.05, 0, 0.25]} n={4} />
          <Moedas pos={[-1.6, 0, 0.1]} n={9} />
        </>
      )}
      {!banner && <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[20, 20]} /><shadowMaterial opacity={0.2} /></mesh>}
      <SeuTostao pos={banner ? [-0.55, 0, 0.2] : [-0.22, 0, 0]} rotY={banner ? 0.25 : 0.12} t={t} acao="parado" expressao="ri" esc={banner ? 1 : 1.05} />
      <Poleiro pos={banner ? [0.65, 0, 0.2] : [0.62, 0, 0.05]} h={banner ? 1.05 : 0.95} />
      <Juros pos={banner ? [0.65, 1.07, 0.2] : [0.62, 0.97, 0.05]} rotY={-0.45} t={t} esc={banner ? 1.25 : 1.35} grita={0.4} />
    </>
  );
};

export const AvatarTostao: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 42%, #ffd76a 0%, #f2a93b 60%, #d9822b 100%)'}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 30, position: [0.25, 1.15, 4.1]}}>
        <group position={[0, -0.95, 0]}><Cena /></group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const BannerTostao: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #ffe3a3 0%, #f6b94f 55%, #e08b2e 100%)'}}>
      {/* área segura do YouTube: 1546x423 no centro (x 507 a 2053, y 508 a 931); tudo o que importa fica dentro */}
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 22, position: [0, 1.0, 15]}}>
        <group position={[1.9, -1.0, 0]}><Cena banner /></group>
      </ThreeCanvas>
      <div style={{position: 'absolute', left: 560, top: 560, width: 760, fontFamily: FONTE, color: '#3a2412', lineHeight: 1}}>
        <div style={{fontSize: 140, fontWeight: 800, letterSpacing: -2}}>Seu Tostão</div>
        <div style={{fontSize: 50, fontWeight: 700, marginTop: 14, color: '#5a3418'}}>a história do dinheiro que ninguém te contou</div>
      </div>
    </AbsoluteFill>
  );
};
