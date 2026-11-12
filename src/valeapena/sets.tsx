// CENÁRIOS do perfil VALE A PENA? — piloto: air fryer barata.
import type {Expressao} from '../estilo/ze';
// Cada etapa é um lugar diferente: laboratório do Zé (bancada de teste), palco escuro com a air fryer em corte,
// cozinha (óleo × colher), mesa de jantar (família) e o laboratório de novo no veredito/final.
// Coordenadas: bancada de teste no centro (tampo em y = BANCADA), frente = +z. 1 unidade = 1 metro.
import React from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Boneco, CRIANCA, Caixa, MORADOR, Visual, texPilula} from '../v4/kit';
import {orb, Cam, Ctx} from '../v4/sets';
import {Cozinha, Fio, GarrafaOleo, Ilha, Panela, Colher, TOPO, texCanvas} from '../cozinha/pecas';
import {
  AF, AF_IN, AirFryer, BANCADA, BATATA, Bancada, Batatas, Cabo, CaixaProduto, Calendario, Carimbo, EtiquetaPreco, Laboratorio, Medidor, Mesa,
  Moeda, PaoDeQueijo, PilhaMoedas, PratoBatata, Raio, ZeTestador, clamp01, lerp, suave,
} from './pecas';
import {ROBO_SETS} from './roboSets';

export type LuzVP = 'lab' | 'escuro' | 'cozinha' | 'sala' | 'alerta';
export type SetVP = {fundo?: [string, string]; luz?: LuzVP; clima?: Expressao; render: (c: Ctx) => React.ReactNode; cams: Record<string, Cam>};

const B = BANCADA;
const M_TOPO = 0.75; // tampo da mesa de jantar
const FRY: V3 = [0, B, 0.0]; // air fryer no meio da bancada
const ZE: V3 = [0.78, 0, 0.12]; // Zé do lado direito da bancada, virado para a air fryer e para a câmera

// plaquinha flutuante (sem linha guia)
const Pilula: React.FC<{texto: string; pos: V3; fundo: string; vis: number; tam?: number}> = ({texto, pos, fundo, vis, tam = 1}) =>
  vis > 0.01 ? (
    <sprite position={pos} scale={[0.2 * suave(vis) * tam, 0.047 * suave(vis) * tam, 1]} renderOrder={10}>
      <spriteMaterial map={texPilula(texto, fundo, '#ffffff')} depthTest={false} sizeAttenuation={false} />
    </sprite>
  ) : null;

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

// palco escuro "de raio-x": piso com grade azul (para a air fryer em corte)
const texGrade = () =>
  texCanvas('vp-grade', 128, 128, (g) => {
    g.fillStyle = '#132447';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#2d4f8f';
    g.lineWidth = 3;
    g.strokeRect(0, 0, 128, 128);
  }, true);
const Palco: React.FC<{cor?: string}> = ({cor}) => {
  const k = texGrade().clone();
  k.needsUpdate = true;
  k.repeat.set(40, 40);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial map={k} color={cor ?? '#ffffff'} roughness={0.9} />
      </mesh>
      {/* pedestal redondo */}
      <mesh position={[0, -0.0, 0]} receiveShadow>
        <cylinderGeometry args={[0.32, 0.34, 0.004, 32]} />
        <meshStandardMaterial color="#20335e" />
      </mesh>
    </group>
  );
};

// ------------- sala de jantar (família) -------------
const Sala: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[14, 14]} />
      <meshStandardMaterial color="#c99a6b" roughness={0.9} />
    </mesh>
    <Caixa pos={[0, 1.6, -1.6]} tam={[10, 3.2, 0.1]} cor="#f3d9b8" />
    <Caixa pos={[0, 0.06, -1.54]} tam={[10, 0.12, 0.02]} cor="#ffffff" />
    {/* quadros */}
    <Caixa pos={[-1.6, 1.9, -1.54]} tam={[0.7, 0.5, 0.03]} cor="#4f8cff" />
    <Caixa pos={[1.6, 1.9, -1.54]} tam={[0.9, 0.55, 0.03]} cor="#ff8a1f" />
  </group>
);
const PESSOA = (camisa: string, cabelo = '#3b2a20', calca = '#2f5d8a'): Visual => ({...MORADOR, camisa, cabelo, calca});

// ======================================================================
export const SETS: Record<string, SetVP> = {
  // GANCHO: a air fryer na bancada com a etiqueta de preço; o Zé de prancheta do lado
  vpBancada: {
    luz: 'lab',
    render: ({t}) => (
      <>
        <Laboratorio />
        <AirFryer pos={FRY} rotY={-0.25} t={t} />
        <EtiquetaPreco pos={[0.0, B + 0.335, 0.06]} rot={[-0.75, -0.25, 0]} texto="R$ 250" sub="nov/2026" esc={1.1} />
        <ZeTestador t={t} pos={ZE} rotY={-0.55} />
      </>
    ),
    cams: {
      giro: orb([-0.04, B + 0.12, 0.08], -12, 16, 1.65, 1.35, 40, 18),
      ze: orb([0.5, 0.92, 0.1], 6, 10, 3.7, 3.25, 40, 8),
    },
  },
  // a air fryer abrindo (metade da frente some) — palco escuro
  vpAbrindo: {
    luz: 'escuro',
    fundo: ['#0b1328', '#1b2c55'],
    render: ({t, p}) => (
      <>
        <Palco />
        <AirFryer pos={[0, 0.002, 0]} t={t} corte={clamp01(p * 1.6)} calor={suave(clamp01(p * 2 - 0.6))} giro={t * 25 * clamp01(p * 2 - 0.5)} carga="fina" corBatata={BATATA.crua} />
      </>
    ),
    cams: {frente: orb([0, 0.14, 0], -10, 12, 1.3, 1.05, 40, 12)},
  },
  // POR DENTRO: corte com resistência acesa, ventoinha girando e o ar quente circulando
  vpAberta: {
    luz: 'escuro',
    fundo: ['#0b1328', '#1b2c55'],
    render: ({t, p}) => (
      <>
        <Palco />
        <AirFryer pos={[0, 0.002, 0]} t={t} corte={1} calor={1} giro={t * 30} fluxo={clamp01(0.35 + p * 2)} carga="fina" corBatata={new THREE.Color(BATATA.crua).lerp(new THREE.Color(BATATA.dourada), 0.3 + 0.5 * p).getStyle()} />
      </>
    ),
    cams: {
      corte: orb([0, 0.14, 0], 0, 12, 1.25, 1.02, 40, 10),
      fluxo: orb([0, 0.13, 0], 28, 18, 1.25, 1.0, 40, 10),
      resist: orb([0, AF_IN.resY, 0.02], 12, -10, 0.4, 0.31, 42, 12),
      venti: orb([0, AF_IN.ventY - 0.005, 0.02], -18, -16, 0.36, 0.28, 42, 14),
      lado: orb([0, 0.13, 0], 48, 20, 1.25, 1.05, 40, -10),
    },
  },
  // termostato: a resistência liga e desliga sozinha
  vpTermostato: {
    luz: 'escuro',
    fundo: ['#0b1328', '#1b2c55'],
    render: ({t}) => {
      const lig = (t % 1.3) < 0.75;
      const calor = lig ? suave(clamp01(((t % 1.3) / 0.2))) : 1 - suave(clamp01(((t % 1.3) - 0.75) / 0.25));
      return (
        <>
          <Palco />
          <AirFryer pos={[0, 0.002, 0]} t={t} corte={1} calor={calor} giro={t * 30} fluxo={0.6} carga="fina" corBatata={BATATA.dourada} />
          <Pilula texto={lig ? 'LIGA' : 'DESLIGA'} pos={[0.09, 0.25, 0.12]} fundo={lig ? '#ff5a1a' : '#4f8cff'} vis={1} tam={0.9} />
        </>
      );
    },
    cams: {close: orb([0, 0.2, 0.02], -24, 8, 0.55, 0.44, 40, 10)},
  },
  // "não frita": panela de óleo riscada ao lado da air fryer
  vpNaoFrita: {
    luz: 'lab',
    render: ({t, p}) => (
      <>
        <Laboratorio />
        <AirFryer pos={[0.18, B, 0.0]} rotY={-0.2} t={t} luzOn />
        <Panela pos={[-0.22, B, 0.08]} t={t} nivel={0.8} cor="#f0c040" bolhas={1} />
        <XVermelho pos={[-0.22, B + 0.13, 0.12]} esc={0.22} vis={clamp01(p * 3)} />
        <ZeTestador t={t} pos={ZE} rotY={-0.6} acao="aponta" />
      </>
    ),
    cams: {frente: orb([-0.05, B + 0.1, 0.05], 8, 16, 1.7, 1.4, 40, -10)},
  },
  // A PROMESSA: a caixa do produto e a air fryer na bancada
  vpCaixa: {
    luz: 'lab',
    render: ({t, p}) => (
      <>
        <Laboratorio />
        <CaixaProduto pos={[-0.3, B, -0.02]} rotY={0.15} aberta={0.6} />
        <AirFryer pos={[0.22, B, 0.04]} rotY={-0.35} t={t} />
      </>
    ),
    cams: {
      frente: orb([-0.28, B + 0.16, 0.0], 8, 10, 1.6, 1.35, 40, -8),
      lado: orb([0.22, B + 0.14, 0.04], 30, 16, 1.4, 1.15, 40, 12),
    },
  },
  // close no botão de temperatura girando até 200 °C
  vpPainel: {
    luz: 'lab',
    render: ({t, p}) => (
      <>
        <Laboratorio />
        <AirFryer pos={FRY} t={t} dialTemp={lerp(80, 200, suave(p))} dialTimer={15} luzOn={p > 0.2} />
      </>
    ),
    cams: {close: orb([-0.04, B + 0.235, 0.18], 8, 10, 0.4, 0.3, 40, 8)},
  },
  // O ERRO: gaveta puxada com o cesto LOTADO, o Zé apontando
  vpErro: {
    luz: 'lab',
    render: ({t}) => (
      <>
        <Laboratorio />
        <AirFryer pos={[0.0, B, -0.1]} t={t} gaveta={1} carga="lotado" corBatata={BATATA.crua} />
      </>
    ),
    cams: {geral: orb([0.0, B + 0.1, 0.05], 22, 32, 1.45, 1.2, 40, 10)},
  },
  // cesto lotado em corte: o ar quente bate no monte e não passa; batata pálida (mole)
  vpLotado: {
    luz: 'alerta',
    fundo: ['#2a0d12', '#5a1a1f'],
    render: ({t, p}) => (
      <>
        <Palco cor="#ffb0a0" />
        <AirFryer pos={[0, 0.002, 0]} t={t} corte={1} calor={1} giro={t * 30} fluxo={1} bloqueio={1} carga="lotado" corBatata={BATATA.mole} />
        <XVermelho pos={[0, 0.12, 0.16]} esc={0.12} vis={clamp01(p * 2 - 0.4)} />
      </>
    ),
    cams: {
      cima: orb([0, 0.15, 0], -8, 36, 0.85, 0.7, 40, 10),
      lado: orb([0, 0.12, 0], 35, 14, 0.8, 0.66, 40, -10),
    },
  },
  // camada fina + chacoalhar: o ar passa e a batata doura
  vpFina: {
    luz: 'escuro',
    fundo: ['#0d2a1c', '#1d5a3a'],
    render: ({t, p}) => (
      <>
        <Palco cor="#b0ffcc" />
        <AirFryer pos={[0, 0.002, 0]} t={t} corte={1} calor={1} giro={t * 30} fluxo={1} carga="fina" chacoalha={p > 0.35 && p < 0.75 ? 1 : 0} corBatata={new THREE.Color(BATATA.crua).lerp(new THREE.Color(BATATA.dourada), suave(p)).getStyle()} />
      </>
    ),
    cams: {cima: orb([0, 0.13, 0], 10, 34, 0.82, 0.66, 40, -10)},
  },
  // A CONTA (luz): medidor de energia na tomada contando o kWh do teste
  vpMedidor: {
    luz: 'lab',
    render: ({t, p}) => {
      const kwh = 0.3 * clamp01(p / 0.85);
      return (
        <>
          <Laboratorio />
          <AirFryer pos={[0.12, B, 0.02]} t={t} dialTemp={200} dialTimer={20 * (1 - p)} luzOn />
          {/* régua de tomadas em pé na bancada, com o medidor espetado */}
          <Caixa pos={[-0.32, B + 0.09, -0.22]} tam={[0.1, 0.18, 0.06]} cor="#f2f2f0" />
          <Medidor pos={[-0.32, B + 0.1, -0.19]} kwh={kwh} watts={Math.round(t * 7) % 3 === 0 ? 1500 : 0} />
          <Cabo pts={[[0.12, B + 0.05, -0.17], [0.0, B + 0.01, -0.25], [-0.2, B + 0.01, -0.12], [-0.32, B + 0.06, -0.11]]} />
          <ZeTestador t={t} pos={ZE} rotY={-0.5} />
        </>
      );
    },
    cams: {
      geral: orb([-0.1, B + 0.12, 0.0], 12, 22, 1.9, 1.6, 40, 10),
      timer: orb([0.12 + 0.065, B + 0.24, 0.2], -6, 8, 0.36, 0.27, 40, 8),
      display: orb([-0.32, B + 0.12, -0.12], 4, 6, 0.3, 0.22, 40, 8),
    },
  },
  // A CONTA (dinheiro): três cantos da mesma bancada, um por câmera
  vpMoedas: {
    luz: 'lab',
    render: ({t, p}) => {
      const paga = clamp01((p - 0.5) * 2);
      return (
        <>
          <Laboratorio />
          {/* luz: um raio e 3 moedas de 10 centavos */}
          <Raio pos={[-0.535, B + 0.056, 0.045]} esc={0.55} rotY={0.1} />
          {[0, 1, 2].map((i) => (p * 4 + 1 > i ? <Moeda key={i} pos={[-0.5 + i * 0.02, B + 0.0115, 0.04 + i * 0.006]} r={0.0105} cor="#c9a24a" rot={[Math.PI / 2, 0, 0]} /> : null))}
          {/* semana: calendário marcando 2 usos por semana */}
          <Calendario pos={[0.0, B, -0.02]} marcas={Math.min(6, p * 12)} />
          {/* se paga: pilhas de moedas crescendo na frente da air fryer */}
          <AirFryer pos={[0.62, B, -0.18]} rotY={-0.3} t={t} />
          {[0, 1, 2, 3, 4].map((i) => (<PilhaMoedas key={i} pos={[0.52 + i * 0.055, B, 0.14 - (i % 2) * 0.03]} n={paga * (22 + i * 6)} r={0.02} />))}
        </>
      );
    },
    cams: {
      luz: orb([-0.5, B + 0.01, 0.11], 0, 24, 0.42, 0.36, 40, 8),
      semana: orb([0.0, B + 0.05, 0.02], -6, 16, 1.0, 0.85, 40, 10),
      paga: orb([0.66, B - 0.04, 0.04], -6, 22, 1.4, 1.15, 40, 10),
    },
  },
  // A CONTA (óleo): panela de imersão engolindo a garrafa de óleo, na cozinha
  vpPanela: {
    luz: 'cozinha',
    fundo: ['#f6d6ae', '#fbe3c2'],
    render: ({t, p}) => {
      const BOCA: V3 = [0.5, 0.96, -1.86];
      const k = clamp01(p * 1.2);
      return (
        <>
          <Cozinha t={t} chama={[0, 0, 1, 0]} dial={0} />
          <Ilha />
          <Panela pos={[BOCA[0], 0.915, BOCA[2]]} t={t} nivel={0.3 + 0.6 * k} cor="#f0c040" bolhas={1} />
          <Batatas pos={[BOCA[0], 0.915 + 0.04 + 0.03 * k, BOCA[2]]} carga="fina" cor={BATATA.crua} lado={0.12} seed={3} />
          <group position={[BOCA[0] + 0.13, 1.16, BOCA[2]]} rotation={[0, 0, 1.9]}>
            <GarrafaOleo pos={[0, -0.13, 0]} />
          </group>
          <Fio a={[BOCA[0] + 0.03, 1.1, BOCA[2]]} b={[BOCA[0] + 0.03, 0.96, BOCA[2]]} r={0.006} cor="#f4c430" vis={p < 0.92 ? 1 : 0} />
        </>
      );
    },
    cams: {panela: orb([0.58, 1.0, -1.86], 14, 26, 0.85, 0.68, 40, 12)},
  },
  // na air fryer: uma colher de óleo por cima das batatas
  vpColher: {
    luz: 'cozinha',
    fundo: ['#f6d6ae', '#fbe3c2'],
    render: ({t, p}) => {
      const zc = 0.22; // gaveta puxada
      return (
        <>
          <Cozinha t={t} />
          <Ilha />
          <AirFryer pos={[0, TOPO, -0.1]} t={t} gaveta={1} carga="fina" corBatata={BATATA.crua} />
          <Colher pos={[0.02, TOPO + 0.24, zc - 0.1]} rot={[0, 0, -0.9 * suave(clamp01(p * 2))]} cheia={p < 0.5 ? '#f4c430' : null} esc={1.2} />
          <Fio a={[0.0, TOPO + 0.23, zc - 0.1]} b={[0.0, TOPO + AF_IN.cestoY + 0.02, zc - 0.1]} r={0.002} cor="#f4c430" vis={p > 0.3 && p < 0.85 ? 1 : 0} />
        </>
      );
    },
    cams: {close: orb([0, TOPO + 0.06, 0.12], 15, 50, 0.8, 0.64, 40, 10)},
  },
  // VEREDITO: carimbo desce na ficha de teste
  vpVeredito: {
    luz: 'lab',
    render: ({t, p}) => (
      <>
        <Laboratorio />
        <AirFryer pos={[0.28, B, -0.12]} rotY={-0.3} t={t} />
        <Carimbo pos={[-0.12, B, 0.08]} desce={clamp01(p * 2.2)} texto="VALE" cor="#2fbf71" />
        <ZeTestador t={t} pos={ZE} rotY={-0.6} acao={p > 0.55 ? 'comemora' : 'carrega'} />
      </>
    ),
    cams: {carimbo: orb([0.0, B + 0.06, 0.05], 6, 32, 1.6, 1.3, 40, 10)},
  },
  // família: mesa de 3 (esquerda) e mesa de 5 (direita)
  vpFamilia: {
    luz: 'sala',
    fundo: ['#f3d9b8', '#fbe8d0'],
    render: ({t, p}) => {
      const M = 0.75;
      return (
        <>
          <Sala />
          {/* mesa de 3 */}
          <Mesa pos={[-1.7, 0, 0]} larg={1.2} prof={0.8} />
          <AirFryer pos={[-1.7, M, -0.05]} t={t} />
          <PratoBatata pos={[-1.7, M, 0.28]} />
          <ZeTestador t={t} pos={[-2.25, 0, -0.55]} rotY={0.3} acao="comemora" />
          <Boneco pos={[-1.7, 0, -0.75]} acao="acena" t={t + 0.3} v={PESSOA('#ff5d73', '#6b3e26')} esc={0.9} />
          <Boneco pos={[-1.15, 0, -0.55]} rotY={-0.3} acao="parado" t={t} v={PESSOA('#4f8cff', '#1d1b26', '#3a3a44')} esc={0.88} />
          {/* mesa de 5 */}
          <Mesa pos={[1.7, 0, 0]} larg={1.4} prof={0.8} />
          <AirFryer pos={[1.52, M, -0.08]} t={t} />
          {/* a de 5 L ou mais (25% maior em cada medida) */}
          <group position={[1.95, M, -0.12]} scale={1.2}>
            <AirFryer pos={[0, 0, 0]} t={t} rotY={-0.3} />
          </group>
          <Pilula texto="5 L+" pos={[1.95, M + 0.45, -0.12]} fundo="#2fbf71" vis={1} tam={0.5} />
          {[0, 1, 2].map((i) => (p > 0.15 + i * 0.25 ? <PratoBatata key={i} pos={[1.38 + i * 0.25, M, 0.26]} /> : null))}
          {[0, 1, 2].map((i) => (
            <Pilula key={'r' + i} texto={`${i + 1}ª RODADA`} pos={[1.38 + i * 0.25, M + 0.16, 0.26]} fundo={i === 2 ? '#ff5a1a' : '#16151c'} vis={clamp01((p - 0.15 - i * 0.25) * 5)} tam={0.55} />
          ))}
          {[[-0.6, -0.55, '#ffd23f'], [-0.3, -0.78, '#2fbf71'], [0, -0.6, '#ff8a1f'], [0.3, -0.78, '#7fb6d9'], [0.6, -0.55, '#e85a4f']].map(([dx, z, c], i) => (
            <Boneco key={i} pos={[1.7 + (dx as number), 0, z as number]} rotY={-(dx as number) * 0.5} acao={i === 2 ? 'aponta' : 'parado'} t={t + i} v={i === 1 || i === 3 ? {...CRIANCA, camisa: c as string} : PESSOA(c as string)} esc={i === 1 || i === 3 ? 0.68 : 0.9} />
          ))}
        </>
      );
    },
    cams: {
      tres: orb([-1.7, 0.85, 0], 4, 16, 4.8, 4.3, 40, 8),
      cinco: orb([1.7, 0.85, 0], -4, 16, 5.4, 4.9, 40, -8),
      rodadas: orb([1.62, M_TOPO + 0.02, 0.22], 0, 40, 1.9, 1.6, 40, 6),
    },
  },
  // robô aspirador: cenários em ./roboSets.tsx
  ...ROBO_SETS,

  // FINAL: o Zé acenando, batata e pão de queijo prontos
  vpFinal: {
    luz: 'lab',
    render: ({t}) => (
      <>
        <Laboratorio />
        <AirFryer pos={[0.05, B, -0.14]} rotY={-0.2} t={t} luzOn />
        <PratoBatata pos={[-0.12, B, 0.2]} />
        <PaoDeQueijo pos={[0.12, B, 0.2]} />
        <EtiquetaPreco pos={[-0.45, B + 0.06, -0.05]} rot={[-0.5, 0.4, 0]} texto="R$ 250" sub="nov/2026" esc={0.8} />
        <ZeTestador t={t} pos={ZE} rotY={-0.5} acao="acena" />
      </>
    ),
    cams: {
      final: orb([0.22, 0.95, 0.1], -10, 12, 3.6, 3.2, 40, -10),
      close: orb([0.0, B - 0.1, 0.2], 0, 50, 1.3, 1.12, 40, 10),
    },
  },
};
