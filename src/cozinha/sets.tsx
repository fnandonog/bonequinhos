// CENÁRIOS da receita. Cada set é um momento DIFERENTE do preparo, com câmeras nomeadas.
// Coordenadas: ilha no centro (tampo em y = TOPO), Zé atrás dela olhando para +z, fogão no fundo (x 0,68; z -2).
import React from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, CHEF, CRIANCA, Caixa, Cil, MORADOR, AcaoBoneco, texPilula} from '../v4/kit';
import {orb, Cam, Ctx} from '../v4/sets';
import {
  Bolo, Boleira, COR, Faca, Planta, Celular, CaixaOvos, Cenoura, Chuvisco, Colher, Cozinha, DIAL_ANG, Espatula, Fatia, Fio, Forma, Fue, GarrafaOleo,
  Grade, Ilha, Lata, Liquidificador, Manteiga, Ovo, Pacote, Palito, Panela, Peneira, Prato, Rodelas, TOPO, Tabua, Tigela, Vapor, Xicara,
  clamp01, lerp, suave, texDial,
} from './pecas';

export type Luz = 'cozinha' | 'forno' | 'frio';
export type SetCozinha = {fundo?: [string, string]; luz?: Luz; render: (c: Ctx) => React.ReactNode; cams: Record<string, Cam>};

const T = TOPO;
const Ze: React.FC<{t: number; acao?: AcaoBoneco; pos?: V3; rotY?: number; ferramenta?: 'colher' | null}> = ({t, acao = 'parado', pos = [0, 0, -0.85], rotY = 0, ferramenta = null}) => (
  <Boneco pos={pos} rotY={rotY} acao={acao} t={t} v={CHEF} esc={0.95} ferramenta={ferramenta} />
);
const Base: React.FC<{t: number; ze?: AcaoBoneco | null; chama?: number[]; dial?: number; aceso?: number}> = ({t, ze = 'parado', chama, dial, aceso}) => (
  <>
    <Cozinha t={t} chama={chama} dial={dial} aceso={aceso} />
    <Ilha />
    {ze && <Ze t={t} acao={ze} />}
  </>
);
// ponto do queimador da frente-esquerda do fogão (onde a panela fica)
const BOCA: V3 = [0.5, 0.96, -1.86];
const CREME = '#f1dfb8';
const mixCor = (a: string, b: string, k: number) => new THREE.Color(a).lerp(new THREE.Color(b), clamp01(k)).getStyle();

// plaquinha flutuante (sem linha guia, boa para close)
const Pilula: React.FC<{texto: string; pos: V3; fundo: string; vis: number}> = ({texto, pos, fundo, vis}) =>
  vis > 0.01 ? (
    <sprite position={pos} scale={[0.2 * suave(vis), 0.047 * suave(vis), 1]} renderOrder={10}>
      <spriteMaterial map={texPilula(texto, fundo, '#ffffff')} depthTest={false} sizeAttenuation={false} />
    </sprite>
  ) : null;

// X vermelho de "proibido"
const XVermelho: React.FC<{pos: V3; esc?: number; vis: number}> = ({pos, esc = 0.25, vis}) =>
  vis > 0.01 ? (
    <group position={pos} scale={esc * suave(vis)}>
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[0, 0, (s * Math.PI) / 4]} renderOrder={5}>
          <boxGeometry args={[1, 0.16, 0.05]} />
          <meshStandardMaterial color="#ff3b30" emissive="#c41d14" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  ) : null;

// interior do forno (resistências acesas, grade) — cenário próprio
const InteriorForno: React.FC<{t: number; frio?: number}> = ({t, frio = 0}) => {
  const brilho = 1 - frio * 0.7;
  return (
    <group>
      <Caixa pos={[0, 0.2, -0.32]} tam={[0.9, 0.6, 0.02]} cor="#3a2a24" />
      <Caixa pos={[-0.44, 0.2, 0]} tam={[0.02, 0.6, 0.66]} cor="#33241f" />
      <Caixa pos={[0.44, 0.2, 0]} tam={[0.02, 0.6, 0.66]} cor="#33241f" />
      <Caixa pos={[0, -0.1, 0]} tam={[0.9, 0.02, 0.66]} cor="#2b1e1a" />
      <Caixa pos={[0, 0.5, 0]} tam={[0.9, 0.02, 0.66]} cor="#2b1e1a" />
      {[-0.2, 0, 0.2].map((z, i) => (
        <group key={i}>
          <mesh position={[0, 0.47, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.8, 6]} />
            <meshStandardMaterial color="#ff5a1a" emissive="#ff4a10" emissiveIntensity={(1.6 + Math.sin(t * 3 + i) * 0.2) * brilho} />
          </mesh>
          <mesh position={[0, -0.07, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.8, 6]} />
            <meshStandardMaterial color="#ff5a1a" emissive="#ff4a10" emissiveIntensity={1.4 * brilho} />
          </mesh>
        </group>
      ))}
      {Array.from({length: 9}).map((_, i) => (<Barra key={i} a={[-0.42, 0, -0.3 + i * 0.075]} b={[0.42, 0, -0.3 + i * 0.075]} r={0.003} cor="#9aa0aa" sombra={false} />))}
      <pointLight position={[0, 0.3, 0.1]} color={frio > 0.5 ? '#9fc4ff' : '#ff9a4a'} intensity={1.5} distance={2} decay={1} />
    </group>
  );
};

// meio bolo em corte (para comparar fofo × solado)
const MeioBolo: React.FC<{pos: V3; h: number; cor: string; furos?: boolean}> = ({pos, h, cor, furos}) => (
  <group position={pos}>
    <mesh position={[0, h / 2, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, h, 24, 1, false, Math.PI / 2, Math.PI]} /><meshStandardMaterial color={COR.massaAssada} flatShading /></mesh>
    <mesh position={[0, h / 2, 0.0005]}><planeGeometry args={[0.2, h]} /><meshStandardMaterial color={cor} /></mesh>
    {furos && Array.from({length: 22}).map((_, i) => (
      <mesh key={i} position={[((i * 37) % 17) / 17 * 0.17 - 0.085, ((i * 23) % 11) / 11 * h * 0.8 + h * 0.1, 0.002]}>
        <circleGeometry args={[0.003 + (i % 3) * 0.002, 6]} />
        <meshBasicMaterial color="#d99a3a" />
      </mesh>
    ))}
  </group>
);

export const SETS: Record<string, SetCozinha> = {
  // ===== gancho: bolo pronto com calda brilhando =====
  boloPronto: {
    render: ({t}) => (
      <>
        <Base t={t} ze="comemora" />
        <Boleira pos={[0, T, 0.05]} />
        <Bolo pos={[0, T + 0.096, 0.05]} />
        <Prato pos={[0.38, T, 0.18]} />
        <Fatia pos={[0.38, T + 0.013, 0.16]} rot={[0, 2.2, 0]} />
        <Vapor t={t} pos={[0, T + 0.2, 0.05]} forca={0.6} />
        <Cenoura pos={[-0.45, T + 0.025, 0.1]} rot={[0, 0.4, Math.PI / 2]} />
      </>
    ),
    cams: {giro: orb([0, T + 0.12, 0.05], -25, 16, 1.25, 0.8, 40, 35), macro: orb([0.02, T + 0.14, 0.05], 30, 12, 0.55, 0.42, 40, 12)},
  },
  boloCortado: {
    render: ({t}) => (
      <>
        <Base t={t} ze="acena" />
        <Boleira pos={[0, T, 0.05]} />
        <Bolo pos={[0, T + 0.096, 0.05]} semFatia={1} />
        <Prato pos={[0.3, T, 0.25]} />
        <Fatia pos={[0.3, T + 0.013, 0.22]} rot={[0, 2.6, 0]} />
      </>
    ),
    cams: {miolo: orb([0.02, T + 0.13, 0.05], 22, 10, 0.5, 0.38, 40, 10)},
  },
  fatia: {
    render: ({t, p}) => {
      const k = suave(p * 1.3);
      const dir: V3 = [Math.sin(0.36), 0, Math.cos(0.36)];
      return (
        <>
          <Base t={t} ze={null} />
          <Prato pos={[0, T, 0]} r={0.16} />
          <Bolo pos={[0, T + 0.012, 0]} semFatia={1} />
          <group position={[dir[0] * k * 0.12, k * 0.08, dir[2] * k * 0.12]}>
            <Fatia pos={[0, T + 0.012, 0]} />
            <Caixa pos={[Math.sin(0.36) * 0.06, T + 0.01, Math.cos(0.36) * 0.06]} rot={0.36} tam={[0.07, 0.003, 0.1]} cor={COR.inox} />
            <Barra a={[Math.sin(0.36) * 0.11, T + 0.012, Math.cos(0.36) * 0.11]} b={[Math.sin(0.36) * 0.3, T + 0.06, Math.cos(0.36) * 0.3]} r={0.006} cor="#2b2233" />
          </group>
        </>
      );
    },
    cams: {close: orb([0.03, T + 0.06, 0.05], 50, 18, 0.55, 0.42, 40, 12)},
  },
  proibido: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Liquidificador pos={[-0.05, T, 0]} t={t} nivel={0.45} cor={COR.massaCrua} />
        <Pacote pos={[0.18, T, 0.05]} texto={'FARINHA\nDE TRIGO'} fundo="#2f6fd6" linha2="1 kg" rotY={-0.3} />
        <XVermelho pos={[0.05, T + 0.2, 0.2]} esc={0.24} vis={clamp01(p * 3 - 0.2)} />
      </>
    ),
    cams: {frente: orb([0.05, T + 0.17, 0], 10, 8, 1.45, 1.2, 40, 8)},
  },

  // ===== forno pré-aquecendo =====
  cozinha: {
    render: ({t, p}) => {
      const k = suave(p);
      return (
        <>
          <Cozinha t={t} aceso={0} />
          <Ilha />
          <Ze t={t} acao="anda" pos={[lerp(-0.2, 0.68, k), 0, lerp(-0.85, -1.3, k)]} rotY={lerp(0.6, Math.PI, k)} />
          <Pacote pos={[0.5, T, -0.1]} texto={'FARINHA\nDE TRIGO'} fundo="#2f6fd6" linha2="1 kg" />
          <CaixaOvos pos={[-0.2, T, 0.1]} />
          <Cenoura pos={[-0.55, T + 0.025, 0.1]} />
        </>
      );
    },
    cams: {geral: orb([0.3, 1.0, -0.9], 28, 20, 5.0, 4.0, 46, 10)},
  },
  botao: {
    render: ({t, p}) => {
      const ang = lerp(DIAL_ANG(0), DIAL_ANG(180), suave(p * 1.4));
      return (
        <>
          <Cozinha t={t} aceso={clamp01(p * 2 - 0.6)} />
          <mesh position={[0.68, 0.83, -1.6625]}>
            <planeGeometry args={[0.13, 0.13]} />
            <meshStandardMaterial map={texDial()} roughness={0.6} />
          </mesh>
          <group position={[0.68, 0.83, -1.655]} rotation={[0, 0, -ang]}>
            <Cil rot={[Math.PI / 2, 0, 0]} r={0.03} h={0.03} cor="#2b2b33" seg={16} />
            <Caixa pos={[0, 0.018, 0.016]} tam={[0.006, 0.032, 0.004]} cor="#ff3b30" sombra={false} />
          </group>
          <mesh position={[0.75, 0.875, -1.66]}>
            <sphereGeometry args={[0.006, 8, 6]} />
            <meshStandardMaterial color="#ff8a1f" emissive="#ff6a00" emissiveIntensity={p > 0.5 ? 2 : 0} />
          </mesh>
        </>
      );
    },
    cams: {macro: orb([0.68, 0.83, -1.66], 12, 6, 0.36, 0.27, 40, 6)},
  },

  // ===== ingredientes e cenoura =====
  ingredientes: {
    render: ({t}) => (
      <>
        <Base t={t} ze="aponta" />
        {[0, 1, 2].map((i) => (<Cenoura key={i} pos={[-0.72 + i * 0.03, T + 0.023, 0.12 + i * 0.05]} rot={[0, 0.3, Math.PI / 2]} />))}
        <CaixaOvos pos={[-0.42, T, 0.12]} />
        <GarrafaOleo pos={[-0.2, T, -0.05]} />
        <Pacote pos={[0.02, T, -0.08]} texto={'FARINHA\nDE TRIGO'} fundo="#2f6fd6" linha2="1 kg" />
        <Pacote pos={[0.2, T, -0.04]} texto={'AÇÚCAR'} fundo="#e8322b" linha2="1 kg" />
        <Lata pos={[0.36, T, 0.12]} texto={'FERMENTO'} fundo="#ffd23f" cor="#c41d14" r={0.03} h={0.06} />
        <Manteiga pos={[0.05, T, 0.2]} />
        <Lata pos={[0.52, T, -0.02]} texto={'LEITE\nCONDENSADO'} fundo="#2f6fd6" r={0.038} h={0.075} />
        <Lata pos={[0.68, T, 0.1]} texto={'CHOCOLATE\nEM PÓ'} fundo="#5a2e1a" r={0.04} h={0.11} />
        <Pacote pos={[0.82, T, -0.08]} texto={'CREME\nDE LEITE'} fundo="#ffffff" cor="#2f6fd6" tam={[0.08, 0.1, 0.05]} />
      </>
    ),
    cams: {mesa: orb([0, T + 0.05, 0.05], 0, 30, 2.6, 2.1, 42, 10)},
  },
  tabua: {
    render: ({t, p}) => {
      const k = clamp01(p);
      const corte = Math.sin(t * 14) * 0.5 + 0.5;
      return (
        <>
          <Base t={t} ze={null} />
          <Tabua pos={[0, T, 0.1]} />
          <group position={[-0.02 - k * 0.07, T + 0.042, 0.08]}>
            <group scale={[1 - k * 0.75, 1, 1]}>
              <Cenoura pos={[0, 0, 0]} rot={[0, 0, -Math.PI / 2]} folha={false} />
            </group>
          </group>
          <Rodelas n={Math.floor(6 + k * 40)} centro={[0.09, T + 0.02, 0.12]} raio={0.05} />
          <Faca pos={[0.02, T + 0.05 + corte * 0.04, 0.08]} rot={[0, 0, 0]} />
          <Cenoura pos={[-0.13, T + 0.042, 0.18]} rot={[0, 0.2, Math.PI / 2]} />
        </>
      );
    },
    cams: {cima: orb([0, T + 0.02, 0.11], 0, 62, 0.62, 0.46, 40, 14), lado: orb([0.03, T + 0.03, 0.11], 45, 14, 0.5, 0.38, 40, 10)},
  },

  // ===== liquidificador =====
  liqCenoura: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze="parado" />
        <Liquidificador pos={[0, T, 0]} t={t} conteudo={<Rodelas n={46} centro={[0, 0.032, 0]} raio={0.045} altura={0.05} cai={1 - suave(p * 1.4)} />} />
        <Tabua pos={[0.3, T, 0.05]} />
      </>
    ),
    cams: {cima: orb([0, T + 0.25, 0], 15, 52, 0.8, 0.58, 40, 14)},
  },
  liqOvos: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Liquidificador pos={[0, T, 0]} t={t} nivel={0.06 + p * 0.12} cor={COR.gema} conteudo={<Rodelas n={46} centro={[0, 0.032, 0]} raio={0.045} altura={0.05} />} />
        <Ovo pos={[0, T + 0.44, 0]} aberto={clamp01(p * 1.15)} />
        <CaixaOvos pos={[0.28, T, 0.05]} n={2} />
      </>
    ),
    cams: {close: orb([0, T + 0.36, 0], 20, 12, 0.6, 0.46, 40, 10)},
  },
  liqOleo: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Liquidificador pos={[0, T, 0]} t={t} nivel={0.2 + p * 0.22} cor={mixCor(COR.gema, COR.oleo, 0.5)} conteudo={<Rodelas n={30} centro={[0, 0.032, 0]} raio={0.045} altura={0.04} />} />
        <GarrafaOleo pos={[-0.245, T + 0.56, 0]} rot={[0, 0, -2.0]} />
        <Fio a={[0, T + 0.445, 0]} b={[0, T + 0.2, 0]} r={0.006} cor={COR.oleo} vis={clamp01(p * 4)} />
      </>
    ),
    cams: {close: orb([-0.06, T + 0.34, 0], -18, 8, 0.78, 0.6, 40, 8)},
  },
  liqAcucar: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Liquidificador pos={[0, T, 0]} t={t} nivel={0.42 + p * 0.2} cor={mixCor(COR.oleo, COR.massaCrua, 0.4)} />
        <Xicara pos={[-0.075, T + 0.47, 0]} rot={[0, 0, -2.1]} cheia={p < 0.8 ? COR.acucar : null} />
        <Chuvisco t={t} de={[0, T + 0.42, 0]} y1={T + 0.25} raio={0.018} n={90} cor={COR.acucar} tam={0.005} vel={1.4} on={p < 0.85 ? 1 : 0} />
      </>
    ),
    cams: {close: orb([0, T + 0.33, 0], 28, 14, 0.6, 0.46, 40, 10)},
  },
  liqBate: {
    render: ({t}) => (
      <>
        <Base t={t} ze="comemora" />
        <Liquidificador pos={[0, T, 0.05]} t={t} nivel={0.66} cor={COR.massaCrua} batendo={1} tampa />
        <Tabua pos={[-0.32, T, 0.05]} />
      </>
    ),
    cams: {frente: orb([0, T + 0.2, 0.05], -12, 6, 0.9, 0.62, 40, 14)},
  },

  // ===== secos à parte =====
  peneira: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze="parado" />
        <Tigela pos={[0, T, 0.05]} monte={0.15 + p * 0.6} />
        <Peneira pos={[0, T + 0.2, 0.05]} balanca={Math.sin(t * 16)} />
        <Chuvisco t={t} de={[0, T + 0.16, 0.05]} y1={T + 0.04} raio={0.05} n={120} cor={COR.farinha} tam={0.004} vel={0.5} />
        <Pacote pos={[0.3, T, -0.05]} texto={'FARINHA\nDE TRIGO'} fundo="#2f6fd6" linha2="1 kg" rotY={-0.4} />
      </>
    ),
    cams: {alto: orb([0, T + 0.12, 0.05], 22, 34, 0.95, 0.7, 40, 12), close: orb([0, T + 0.13, 0.05], -28, 10, 0.5, 0.4, 40, 8)},
  },
  fermento: {
    render: ({t, p}) => {
      const inc = lerp(0, -1.6, suave(p * 1.6));
      return (
        <>
          <Base t={t} ze={null} />
          <Tigela pos={[0, T, 0.05]} monte={0.8} />
          <Colher pos={[0.01, T + 0.2, 0.05]} rot={[0, -Math.PI / 2, inc]} cheia={p < 0.55 ? '#ffffff' : null} esc={1.2} />
          <Chuvisco t={t} de={[0, T + 0.19, 0.05]} y1={T + 0.07} raio={0.01} n={50} cor="#ffffff" tam={0.004} vel={0.9} on={p > 0.35 && p < 0.9 ? 1 : 0} />
          <Lata pos={[0.25, T, 0.05]} texto={'FERMENTO'} fundo="#ffd23f" cor="#c41d14" r={0.03} h={0.06} />
        </>
      );
    },
    cams: {colher: orb([0.02, T + 0.15, 0.05], 15, 16, 0.5, 0.38, 40, 10)},
  },
  despeja: {
    render: ({t, p}) => {
      const k = suave(p * 1.5);
      return (
        <>
          <Base t={t} ze={null} />
          <Tigela pos={[0.08, T, 0.05]} nivel={0.1 + p * 0.55} cor={COR.massaCrua} cor2={COR.farinha} mistura={0} t={t} monte={0.8 - p * 0.6} />
          <group position={[-0.05, T + 0.33, 0.05]} rotation={[0, 0, lerp(-0.6, -1.95, k)]}>
            <Liquidificador pos={[0, -0.14, 0]} t={t} nivel={0.55 * (1 - p * 0.8)} cor={COR.massaCrua} semBase />
          </group>
          <Fio a={[0.075, T + 0.27, 0.05]} b={[0.075, T + 0.06, 0.05]} r={0.006} cor={COR.massaCrua} vis={clamp01(p * 3 - 0.5)} />
        </>
      );
    },
    cams: {lado: orb([-0.02, T + 0.18, 0.05], 8, 10, 1.05, 0.9, 40, 10)},
  },
  fue: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Tigela pos={[0, T, 0.05]} nivel={0.66} cor={COR.massaCrua} cor2={COR.farinha} mistura={suave(p * 1.2)} t={t} />
        <Fue pos={[Math.cos(t * 4) * 0.035, T + 0.05, 0.05 + Math.sin(t * 4) * 0.035]} rot={[Math.sin(t * 4) * 0.25, 0, -Math.cos(t * 4) * 0.25]} />
      </>
    ),
    cams: {cima: orb([0, T + 0.08, 0.05], 10, 58, 0.55, 0.42, 40, 25)},
  },
  solado: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <group scale={0.85}><MeioBolo pos={[-0.12, T / 0.85, 0.05]} h={0.08} cor={COR.miolo} furos /></group>
        <group scale={0.85}><MeioBolo pos={[0.12, T / 0.85, 0.05]} h={0.038} cor="#c98a34" /></group>
        <Pilula texto="FOFO" pos={[-0.1, T + 0.12, 0.05]} fundo="#2fbf71" vis={clamp01(p * 3)} />
        <Pilula texto="SOLADO" pos={[0.1, T + 0.12, 0.05]} fundo="#ff3b30" vis={clamp01(p * 3 - 0.6)} />
      </>
    ),
    cams: {corte: orb([0, T + 0.05, 0.04], 0, 12, 1.0, 0.85, 40, 8)},
  },

  // ===== forma =====
  forma: {
    render: ({t}) => (
      <>
        <Base t={t} ze={null} />
        <Forma pos={[0, T, 0.05]} />
        <Manteiga pos={[0.22, T, 0.05]} frac={0.8} />
        <Pacote pos={[-0.25, T, -0.02]} texto={'FARINHA\nDE TRIGO'} fundo="#2f6fd6" linha2="1 kg" rotY={0.3} />
        <Barra a={[-0.11, T + 0.002, 0.2]} b={[0.11, T + 0.002, 0.2]} r={0.002} cor="#ff3b30" sombra={false} />
      </>
    ),
    cams: {cima: orb([0, T + 0.02, 0.06], 12, 58, 0.62, 0.48, 40, 12)},
  },
  untar: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Forma pos={[0, T, 0.05]} untada={p * 2} enfarinhada={p > 0.6 ? 1 : 0} />
        {p < 0.55 && <Caixa pos={[Math.cos(t * 6) * 0.05, T + 0.012, 0.05 + Math.sin(t * 6) * 0.05]} rot={t * 6} tam={[0.06, 0.006, 0.05]} cor="#fff6c8" />}
        <Chuvisco t={t} de={[0, T + 0.18, 0.05]} y1={T + 0.01} raio={0.06} n={80} cor={COR.farinha} tam={0.004} vel={0.6} on={p > 0.5 ? 1 : 0} />
      </>
    ),
    cams: {close: orb([0, T + 0.03, 0.05], 35, 36, 0.48, 0.38, 40, 12)},
  },
  despejaForma: {
    render: ({t, p}) => {
      const k = suave(p * 1.6);
      return (
        <>
          <Base t={t} ze={null} />
          <Forma pos={[0.06, T, 0.05]} enfarinhada={1} massa={clamp01(p * 1.2)} />
          <Tigela pos={[-0.08, T + 0.17, 0.05]} rot={[0, 0, lerp(-0.4, -1.7, k)]} nivel={0.6 * (1 - p * 0.7)} cor={COR.massaCrua} />
          <Fio a={[0.05, T + 0.17, 0.05]} b={[0.05, T + 0.01, 0.05]} r={0.008} cor={COR.massaCrua} vis={clamp01(p * 3 - 0.4)} />
        </>
      );
    },
    cams: {lado: orb([0, T + 0.12, 0.05], 20, 12, 1.0, 0.85, 40, 10)},
  },

  // ===== forno =====
  fornoDentro: {
    fundo: ['#1a0f0a', '#2b1a12'],
    luz: 'forno',
    render: ({t, p}) => (
      <>
        <InteriorForno t={t} />
        <Forma pos={[0, 0.003, 0]} enfarinhada={1} massa={1} cresce={suave(p)} assado={suave(p) * 0.8} />
      </>
    ),
    cams: {vidro: orb([0, 0.08, 0], 0, 12, 0.6, 0.46, 42, 8)},
  },
  murcha: {
    fundo: ['#101520', '#1c2433'],
    luz: 'frio',
    render: ({t, p}) => (
      <>
        <InteriorForno t={t} frio={1} />
        <Forma pos={[0, 0.003, 0]} enfarinhada={1} massa={1} cresce={1} assado={0.5} murcha={suave(p * 1.3)} />
      </>
    ),
    cams: {lado: orb([0, 0.06, 0], 32, 22, 0.52, 0.42, 42, 8)},
  },
  porta: {
    render: ({t, p}) => (
      <>
        <Cozinha t={t} aceso={1} />
        <Ze t={t} acao="aponta" pos={[1.35, 0, -1.25]} rotY={-0.9} />
        <XVermelho pos={[0.68, 0.48, -1.55]} esc={0.4} vis={clamp01(p * 3 - 0.3)} />
      </>
    ),
    cams: {frente: orb([0.85, 0.55, -1.68], -8, 8, 1.6, 1.25, 42, 8)},
  },
  palito: {
    render: ({t, p}) => {
      const y = p < 0.5 ? lerp(0.16, 0.03, suave(p * 2)) : lerp(0.03, 0.18, suave(p * 2 - 1));
      return (
        <>
          <Base t={t} ze={null} />
          <Grade pos={[0, T, 0.05]} />
          <Forma pos={[0, T + 0.025, 0.05]} enfarinhada={1} massa={1} cresce={1} assado={1} />
          <Palito pos={[0.03, T + 0.025 + y, 0.06]} />
          <Vapor t={t} pos={[0, T + 0.12, 0.05]} forca={0.8} />
        </>
      );
    },
    cams: {macro: orb([0.02, T + 0.12, 0.05], 22, 12, 0.42, 0.33, 40, 8)},
  },
  desenforma: {
    render: ({t}) => (
      <>
        <Base t={t} ze="comemora" />
        <Grade pos={[0, T, 0.05]} />
        <Bolo pos={[0, T + 0.025, 0.05]} calda={0} granulado={0} />
        <Forma pos={[0.33, T, 0.0]} enfarinhada={1} />
        <Vapor t={t} pos={[0, T + 0.12, 0.05]} forca={1} />
      </>
    ),
    cams: {giro: orb([0, T + 0.1, 0.05], -28, 18, 1.3, 0.95, 40, 25)},
  },

  // ===== calda no fogão =====
  panela: {
    render: ({t}) => (
      <>
        <Base t={t} ze={null} chama={[0, 0, 1, 0]} />
        <Panela pos={BOCA} t={t} />
        <Lata pos={[0.95, 0.92, -1.95]} texto={'LEITE\nCONDENSADO'} fundo="#2f6fd6" />
        <Lata pos={[1.12, 0.92, -1.9]} texto={'CHOCOLATE\nEM PÓ'} fundo="#5a2e1a" r={0.04} h={0.11} />
      </>
    ),
    cams: {cima: orb([0.55, 0.95, -1.86], 12, 52, 0.85, 0.62, 40, 12)},
  },
  lata: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} chama={[0, 0, 1, 0]} />
        <Panela pos={BOCA} t={t} nivel={0.1 + p * 0.45} cor={CREME} />
        <Lata pos={[BOCA[0] - 0.13, BOCA[1] + 0.25, BOCA[2]]} rot={[0, 0, -2.1]} texto={'LEITE\nCONDENSADO'} fundo="#2f6fd6" />
        <Fio a={[BOCA[0] - 0.04, BOCA[1] + 0.2, BOCA[2]]} b={[BOCA[0] - 0.04, BOCA[1] + 0.03, BOCA[2]]} r={0.01} cor={CREME} vis={clamp01(p * 4)} />
      </>
    ),
    cams: {close: orb([BOCA[0], BOCA[1] + 0.1, BOCA[2]], 18, 20, 0.55, 0.44, 40, 10)},
  },
  manteigaPanela: {
    render: ({t, p}) => {
      const cai = suave(p * 2);
      return (
        <>
          <Base t={t} ze={null} chama={[0, 0, 1, 0]} />
          <Panela pos={BOCA} t={t} nivel={0.55} cor={CREME} />
          <Caixa pos={[BOCA[0], BOCA[1] + lerp(0.22, 0.04, cai), BOCA[2]]} rot={t} tam={[0.03, 0.025 * (1 - clamp01(p * 2 - 1) * 0.8), 0.03]} cor="#ffe27a" />
          <Manteiga pos={[BOCA[0] + 0.22, 0.92, BOCA[2] + 0.04]} frac={0.6} />
        </>
      );
    },
    cams: {close: orb([BOCA[0], BOCA[1] + 0.1, BOCA[2]], -30, 22, 0.5, 0.4, 40, 10)},
  },
  chocolate: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} chama={[0, 0, 1, 0]} />
        <Panela pos={BOCA} t={t} nivel={0.55} cor={mixCor(CREME, COR.calda, suave(p * 1.3))} />
        <Colher pos={[BOCA[0] + 0.01, BOCA[1] + 0.2, BOCA[2]]} rot={[0, -Math.PI / 2, lerp(0, -1.6, suave(p * 2))]} cheia={p < 0.5 ? '#5a2e1a' : null} esc={1.2} />
        <Chuvisco t={t} de={[BOCA[0], BOCA[1] + 0.19, BOCA[2]]} y1={BOCA[1] + 0.04} raio={0.012} n={50} cor="#5a2e1a" tam={0.004} vel={0.8} on={p > 0.3 && p < 0.85 ? 1 : 0} />
        <Lata pos={[BOCA[0] + 0.2, 0.92, BOCA[2] - 0.05]} texto={'CHOCOLATE\nEM PÓ'} fundo="#5a2e1a" r={0.04} h={0.11} />
      </>
    ),
    cams: {close: orb([BOCA[0], BOCA[1] + 0.1, BOCA[2]], 5, 24, 0.5, 0.4, 40, 10)},
  },
  mexe: {
    render: ({t, p}) => {
      const a = t * 5;
      return (
        <>
          <Base t={t} ze={null} chama={[0, 0, 1, 0]} />
          <Panela pos={BOCA} t={t} nivel={0.55} cor={COR.calda} bolhas={1} desgruda={suave(p)} />
          <Espatula pos={[BOCA[0] + Math.cos(a) * 0.05, BOCA[1] + 0.01, BOCA[2] + Math.sin(a) * 0.05]} rot={[Math.sin(a) * 0.4, -a, -Math.cos(a) * 0.4]} />
        </>
      );
    },
    cams: {panela: orb([BOCA[0], BOCA[1] + 0.05, BOCA[2]], 0, 42, 0.5, 0.38, 40, 18)},
  },
  desliga: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} chama={[0, 0, Math.max(0, 1 - suave(p * 1.8)), 0]} />
        <Panela pos={BOCA} t={t} nivel={0.55} cor={COR.calda} desgruda={1} bolhas={1 - p} />
      </>
    ),
    cams: {rente: orb([BOCA[0], BOCA[1] + 0.06, BOCA[2]], 35, 22, 0.72, 0.58, 40, 8)},
  },
  creme: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Panela pos={BOCA} t={t} nivel={0.6} cor={mixCor(COR.calda, '#6b3a22', p)} desgruda={1 - p * 0.6} />
        <group position={[BOCA[0] - 0.12, BOCA[1] + 0.24, BOCA[2]]} rotation={[0, 0, -2.0]}>
          <Pacote pos={[0, 0, 0]} texto={'CREME\nDE LEITE'} fundo="#ffffff" cor="#2f6fd6" tam={[0.08, 0.1, 0.05]} />
        </group>
        <Fio a={[BOCA[0] - 0.02, BOCA[1] + 0.19, BOCA[2]]} b={[BOCA[0] - 0.02, BOCA[1] + 0.04, BOCA[2]]} r={0.009} cor="#fbf6ea" vis={clamp01(p * 4)} />
      </>
    ),
    cams: {close: orb([BOCA[0], BOCA[1] + 0.1, BOCA[2]], 25, 18, 0.55, 0.44, 40, 10)},
  },

  // ===== cobertura =====
  amornar: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Grade pos={[2.3, 0.94, -2.0]} />
        <Bolo pos={[2.3, 0.965, -2.0]} calda={0} granulado={0} />
        <Vapor t={t} pos={[2.3, 1.06, -2.0]} forca={1 - p * 0.8} />
        <Planta pos={[2.7, 0.94, -2.1]} />
      </>
    ),
    cams: {janela: orb([2.3, 1.08, -2.0], -10, 12, 0.95, 0.72, 40, 10)},
  },
  cobre: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Boleira pos={[0, T, 0.05]} />
        <Bolo pos={[0, T + 0.096, 0.05]} calda={suave(p * 1.1)} granulado={0} escorre={1} />
        <Panela pos={[-0.17, T + 0.36, 0.05]} t={t} nivel={0.4 * (1 - p)} cor={COR.calda} rot={[0, 0, -1.2]} />
        <Fio a={[-0.03, T + 0.32, 0.05]} b={[-0.03, T + 0.19, 0.05]} r={0.01} cor={COR.calda} vis={p < 0.85 ? clamp01(p * 5) : 0} />
      </>
    ),
    cams: {cima: orb([0, T + 0.14, 0.05], 15, 44, 0.75, 0.55, 40, 16)},
  },
  granulado: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Boleira pos={[0, T, 0.05]} />
        <Bolo pos={[0, T + 0.096, 0.05]} granulado={suave(p * 1.2)} />
        <group position={[0.02, T + 0.38 + Math.sin(t * 18) * 0.01, 0.05]} rotation={[0, 0, Math.PI * 0.85]}>
          <Lata pos={[0, 0, 0]} texto={'GRANULADO'} fundo="#3a1c0e" r={0.03} h={0.08} />
        </group>
        <Chuvisco t={t} de={[0.0, T + 0.33, 0.05]} y1={T + 0.19} raio={0.07} n={90} cor="#3a1c0e" tam={0.004} vel={0.7} on={p < 0.9 ? 1 : 0} />
      </>
    ),
    cams: {close: orb([0, T + 0.18, 0.05], 28, 24, 0.55, 0.42, 40, 10)},
  },

  // ===== final e CTA =====
  mesa: {
    render: ({t}) => (
      <>
        <Base t={t} ze={null} />
        <group position={[0, 0, 1.55]}>
          <Caixa pos={[0, 0.74, 0]} tam={[1.3, 0.04, 0.8]} cor="#c8955c" />
          {[[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]].map(([x, z], i) => (<Caixa key={i} pos={[x, 0.36, z]} tam={[0.05, 0.72, 0.05]} cor="#a8763f" />))}
          <Boleira pos={[0, 0.76, 0]} />
          <Bolo pos={[0, 0.856, 0]} semFatia={1} />
          <Prato pos={[-0.42, 0.76, 0.12]} />
          <Fatia pos={[-0.42, 0.773, 0.1]} rot={[0, 1.2, 0]} />
          <Prato pos={[0.42, 0.76, 0.12]} />
          <Fatia pos={[0.42, 0.773, 0.1]} rot={[0, -0.6, 0]} />
          <Caixa pos={[-0.85, 0.45, 0]} tam={[0.42, 0.05, 0.42]} cor="#2f8f83" />
          <Caixa pos={[0.85, 0.45, 0]} tam={[0.42, 0.05, 0.42]} cor="#2f8f83" />
        </group>
        <Boneco pos={[-0.85, 0.2, 1.55]} rotY={Math.PI / 2} acao="comemora" t={t} v={MORADOR} />
        <Boneco pos={[0.85, 0.2, 1.55]} rotY={-Math.PI / 2} acao="comemora" t={t + 0.3} v={CRIANCA} esc={0.62} />
        <Ze t={t} acao="acena" pos={[0, 0, 0.75]} />
      </>
    ),
    cams: {geral: orb([0, 0.85, 1.5], 15, 20, 2.3, 1.85, 44, 10)},
  },
  site: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze="acena" />
        <Celular pos={[0, 1.22, 0.62]} rot={[-0.08, 0, 0]} tela="site" brilho={0.85 + 0.15 * clamp01(p * 3)} />
      </>
    ),
    cams: {tela: orb([0, 1.17, 0.62], 0, 2, 0.44, 0.34, 40, 6)},
  },
  telegram: {
    render: ({t}) => (
      <>
        <Base t={t} ze="acena" />
        <Celular pos={[0.18, 1.2, 0.35]} rot={[-0.05, -0.3, 0]} tela="telegram" esc={1.6} />
      </>
    ),
    cams: {ze: orb([0.12, 1.12, 0.35], -15, 4, 0.78, 0.62, 40, 8)},
  },
};

