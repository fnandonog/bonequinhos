import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Boneco, Caixa, Cil, Mat, Visual} from '../v4/kit';
import {MBrilho, MN} from '../estilo/visual';
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

// Juros, o papagaio (arara no padrão do Zé 2.0: formas lisas, olhos com brilho). acao 'grita' abre o bico,
// bate as asas e arrepia o topete: use no número mais absurdo do vídeo. `grita` (0..1) permite dosar a intensidade.
const VERDE = '#2fb34a';
const AMARELO = '#ffd23f';
const VERMELHO = '#e8322b';
const AZUL = '#1f7fd6';
const Ov: React.FC<{pos?: V3; rot?: V3; esc: V3; cor: string; r?: number; sombra?: boolean; brilho?: boolean}> = ({pos, rot, esc, cor, r = 0.7, sombra = true, brilho}) => (
  <mesh position={pos} rotation={rot} scale={esc} castShadow={sombra}>
    <sphereGeometry args={[1, 32, 22]} />
    {brilho ? <MBrilho cor={cor} r={r} /> : <MN cor={cor} r={r} />}
  </mesh>
);
export const Juros: React.FC<{pos?: V3; rotY?: number; t?: number; esc?: number; acao?: 'parado' | 'grita'; grita?: number}> = ({pos = [0, 0, 0], rotY = 0, t = 0, esc = 1, acao = 'parado', grita: g}) => {
  const grita = g ?? (acao === 'grita' ? 1 : 0);
  const bate = grita > 0 ? Math.sin(t * 22) * 0.6 * grita : Math.sin(t * 2) * 0.05;
  const pulo = grita > 0 ? Math.abs(Math.sin(t * 11)) * 0.06 * grita : 0;
  const piscar = (t + 1.3) % 4.1 < 0.12 ? 0.15 : 1;
  const inclina = Math.sin(t * 1.4) * 0.12 * (1 - grita);
  return (
    <group position={[pos[0], pos[1] + pulo, pos[2]]} rotation={[0, rotY, 0]} scale={esc}>
      {/* corpo + peito amarelo */}
      <Ov pos={[0, 0.22, 0]} rot={[-0.22, 0, 0]} esc={[0.13, 0.175, 0.13]} cor={VERDE} />
      <Ov pos={[0, 0.2, 0.062]} rot={[-0.3, 0, 0]} esc={[0.085, 0.13, 0.07]} cor={AMARELO} sombra={false} />
      {/* cauda: três penas longas */}
      {[-0.22, 0, 0.22].map((z, i) => (
        <group key={z} position={[0, 0.1, -0.09]} rotation={[Math.PI + 0.5, 0, z]}>
          <Ov pos={[0, 0.15 + (i === 1 ? 0.02 : 0), 0]} esc={[0.03, 0.16 + (i === 1 ? 0.03 : 0), 0.012]} cor={i === 1 ? VERMELHO : AZUL} r={0.6} />
        </group>
      ))}
      {/* asas (pivô no ombro) */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 0.1, 0.3, -0.005]} rotation={[-0.28, 0, sx * (0.12 + bate)]}>
          <Ov pos={[sx * 0.022, -0.1, 0]} esc={[0.042, 0.13, 0.085]} cor={AZUL} r={0.6} />
          <Ov pos={[sx * 0.024, -0.02, 0.02]} esc={[0.04, 0.06, 0.07]} cor={VERDE} r={0.7} sombra={false} />
          <Ov pos={[sx * 0.02, -0.2, -0.03]} rot={[0.35, 0, 0]} esc={[0.03, 0.08, 0.05]} cor="#1a5fae" r={0.6} sombra={false} />
        </group>
      ))}
      {/* cabeça */}
      <group position={[0, 0.43, 0.035]} rotation={[0, 0, inclina]}>
        <Ov esc={[0.108, 0.104, 0.11]} cor={VERMELHO} r={0.65} />
        {[-1, 1].map((sx) => (
          <group key={sx}>
            {/* máscara branca de arara em volta do olho */}
            <Ov pos={[sx * 0.062, 0.0, 0.07]} rot={[0, sx * 0.7, 0]} esc={[0.05, 0.045, 0.02]} cor="#f6f1e8" r={0.8} sombra={false} />
            <group position={[sx * 0.068, 0.018, 0.079]} rotation={[0, sx * 0.62, 0]} scale={[1, piscar, 1]}>
              <Ov esc={[0.03, 0.036, 0.016]} cor="#ffffff" r={0.15} brilho sombra={false} />
              <Ov pos={[-sx * 0.002, -0.003, 0.011]} esc={[0.019, 0.023, 0.01]} cor="#1d1410" r={0.1} brilho sombra={false} />
              <mesh position={[sx * 0.006, 0.01, 0.022]}>
                <sphereGeometry args={[0.0065, 12, 8]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
              </mesh>
            </group>
          </group>
        ))}
        {/* bico: de cima curvo (gancho), de baixo abre quando grita */}
        <Ov pos={[0, -0.01, 0.1]} rot={[0.35, 0, 0]} esc={[0.038, 0.042, 0.045]} cor="#f2e6c9" r={0.35} />
        <mesh position={[0, -0.05, 0.128]} rotation={[Math.PI + 0.35, 0, 0]} castShadow>
          <coneGeometry args={[0.02, 0.05, 20]} />
          <MN cor="#e6d6b0" r={0.35} />
        </mesh>
        <group position={[0, -0.04, 0.075]} rotation={[0.55 * grita, 0, 0]}>
          <Ov pos={[0, -0.012, 0.022]} esc={[0.028, 0.02, 0.032]} cor="#3b3340" r={0.4} />
          {grita > 0.2 && <Ov pos={[0, -0.002, 0.022]} esc={[0.018, 0.008, 0.022]} cor="#ff7d86" r={0.5} sombra={false} />}
        </group>
        {/* topete */}
        {[-0.03, 0, 0.03].map((x, i) => (
          <mesh key={x} position={[x, 0.1 + 0.025 * grita, -0.025]} rotation={[-0.55 - 0.35 * grita, 0, x * 7]} castShadow>
            <capsuleGeometry args={[0.014, 0.06 + i * 0.012 * (i === 1 ? 2 : 1), 6, 14]} />
            <MN cor={i === 1 ? '#ff5a3c' : VERMELHO} r={0.65} />
          </mesh>
        ))}
      </group>
      {/* patas agarradas ao poleiro */}
      {[-0.05, 0.05].map((x) => (
        <group key={x} position={[x, 0, 0.01]}>
          <mesh position={[0, 0.05, 0]}>
            <capsuleGeometry args={[0.012, 0.04, 4, 10]} />
            <MN cor="#8a8a8a" r={0.6} />
          </mesh>
          {[-0.5, 0.5].map((ry) => (
            <mesh key={ry} position={[Math.sin(ry) * 0.012, 0.018, 0.012]} rotation={[Math.PI / 2, 0, ry]}>
              <capsuleGeometry args={[0.009, 0.03, 4, 8]} />
              <MN cor="#8a8a8a" r={0.6} />
            </mesh>
          ))}
        </group>
      ))}
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
