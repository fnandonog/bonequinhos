// CENÁRIOS do vídeo "Robô aspirador de R$ 300 vale a pena?" (perfil Vale a Pena?).
// Lugares: sala de apartamento real (piso de madeira, sofá, tapete, mesa de centro, rack+TV, janela, mesa de jantar, base do robô),
// bancada do Lab do Zé (robô explodido/em corte/virado), plantas vistas de cima (sem mapa × LiDAR).
// Coordenadas da sala: parede do fundo em z = -2,2, parede da esquerda em x = -2,6, base do robô encostada na esquerda.
import React from 'react';
import {V3} from '../v4/planta';
import {orb} from '../v4/sets';
import type {SetVP} from './sets';
import {BANCADA, Carimbo, CaixaRobo, Laboratorio, ZeTestador, clamp01, lerp, suave} from './pecas';
import {
  AspiradorPo, Balde, Boneco, Bx, Cabo, Cy, Cachorro, Calculadora, Casa, ColunaEnergia, DIARISTA, Deposito, Ferramentas, Lixeira, Medidor, Meia, Migalhas,
  Moeda, Ondas, Pelos, Pill, Planta, RB, Rastro, Recibo, Requeijao, Robo, SALA, TESTADOR, Tapetinho, Tomada, Tufos, Lupa, passeio, pontosAte, trilha, zigue,
} from './robo';

const B = BANCADA;
const {R, H} = RB;
const SALA_FUNDO: [string, string] = ['#d9cbb4', '#efe4d2'];
const VERM = '#ff3b30';

// caminhos fixos do robô em cada cena da sala (t = segundos desde o início do plano)
const T_GANCHO = trilha([[-0.55, 0.3], [0.15, 1.15]], 0.22);
const T_SOFA = trilha([[-1.0, 0.42], [0.9, 0.42], [1.15, 0.1], [1.1, -0.3]], 0.3);
const T_SIL = trilha([[-0.05, 0.62], [0.9, 0.62]], 0.13);
const T_LISO = trilha([[-0.75, 0.55], [0.9, 0.55]], 0.2);
const T_PELO = trilha([[-0.4, 0.5], [0.9, 0.5]], 0.3);
const T_FINAL = trilha([[-0.85, -1.08], [0.95, -1.08]], 0.3);
const T_ESC = trilha([[-1.9, -1.65], [-1.9, -0.9]], 0.12);

// plantas vistas de cima: sem mapa (bate-gira-segue) × LiDAR (fileiras)
const QA_ = {x0: -0.62, x1: 0.62, za0: -1.32, za1: -0.18, zb0: 0.18, zb1: 1.32};
// folga de 7 cm entre a borda do robô e a face interna da parede (parede de 5 cm centrada em x0/x1)
const FOLGA = R + 0.07;
const P_ALEA = passeio(7, QA_.x0 + FOLGA, QA_.za0 + 0.22 + R, QA_.x1 - FOLGA, QA_.za1 - FOLGA, 40);
const P_LIDAR = zigue(QA_.x0 + FOLGA, QA_.zb0 + 0.22 + R, QA_.x1 - FOLGA, QA_.zb1 - FOLGA, 0.2);
const T_ALEA = trilha(P_ALEA, 0.9);
const T_LIDAR = trilha(P_LIDAR, 0.9);

const Robo2: React.FC<{c: {x: number; z: number; ang: number}; t: number; extra?: Partial<React.ComponentProps<typeof Robo>>}> = ({c, t, extra}) => (
  <Robo pos={[c.x, 0, c.z]} rotY={c.ang} t={t} escova={14} rolo={22} rodas={9} {...extra} />
);
const Sala: React.FC<{t: number} & React.ComponentProps<typeof Casa>> = (p) => <Casa {...p} />;
const ZeSentado: React.FC<{t: number}> = ({t}) => <Boneco pos={[0.05, 0.31, -1.55]} rotY={Math.sin(t * 0.8) * 0.15} acao="senta" t={t} v={TESTADOR} esc={0.92} />;
// sala de cima (planta): piso, paredes baixas, tapete, sofá, planta
const Planta2D: React.FC<{z0: number; z1: number; cor: string}> = ({z0, z1, cor}) => (
  <group>
    <Bx p={[0, 0.002, (z0 + z1) / 2]} s={[QA_.x1 - QA_.x0, 0.004, z1 - z0]} c={cor} rug={0.6} sombra={false} />
    {[[0, z0, QA_.x1 - QA_.x0 + 0.1, 0.05], [0, z1, QA_.x1 - QA_.x0 + 0.1, 0.05]].map(([x, z, w, d], i) => (<Bx key={'h' + i} p={[x, 0.09, z]} s={[w, 0.18, d]} c="#f3efe6" />))}
    {[QA_.x0, QA_.x1].map((x) => (<Bx key={'v' + x} p={[x, 0.09, (z0 + z1) / 2]} s={[0.05, 0.18, z1 - z0]} c="#f3efe6" />))}
    <Bx p={[0, 0.12, z0 + 0.12]} s={[0.9, 0.24, 0.2]} c="#7088b8" />
    <Bx p={[0, 0.2, z0 + 0.05]} s={[0.9, 0.12, 0.08]} c="#5b70a0" />
    {/* vaso com planta no canto (fora da faixa que o robô percorre) */}
    <Bx p={[QA_.x1 - 0.075, 0.05, z1 - 0.075]} s={[0.08, 0.1, 0.08]} c="#b8653a" />
    <Bx p={[QA_.x1 - 0.075, 0.16, z1 - 0.075]} s={[0.1, 0.14, 0.1]} c="#2e7d46" />
  </group>
);

export const ROBO_SETS: Record<string, SetVP> = {
  // GANCHO: o robô vindo na direção da câmera, aspirando as migalhas na frente do sofá
  vpR2Gancho: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t}) => (
      <>
        <Sala t={t} />
        <Migalhas area={[-0.7, 0.25, 0.35, 1.25]} n={110} seed={3} t={t} robo={T_GANCHO} />
        <Migalhas area={[-0.7, 0.25, 0.35, 1.25]} n={50} seed={9} t={t} robo={T_GANCHO} cor="#7a4f2a" />
        <Robo2 c={T_GANCHO(t)} t={t} />
      </>
    ),
    cams: {baixo: orb([-0.25, 0.05, 0.62], 18, 9, 1.35, 1.05, 40, 14)},
  },
  // o Zé abre o robô na bancada (camadas se separando)
  vpR2Oficina: {
    luz: 'lab',
    render: ({t, p}) => (
      <>
        <Laboratorio />
        <Ferramentas y={B} />
        <CaixaRobo pos={[-0.72, 0, 0.62]} rotY={0.5} aberta={0.8} />
        <Robo pos={[0, B, 0.02]} t={t} explode={suave(clamp01(p * 1.25))} rotulos={clamp01((p - 0.5) * 3.2)} destaque={['escova', 'motor', 'sensor']} escova={4} />
        <ZeTestador t={t} pos={[0.95, 0, -0.35]} rotY={-0.8} acao="aponta" />
      </>
    ),
    cams: {
      abre: orb([0.06, B + 0.14, 0.0], -10, 18, 1.35, 1.1, 40, 12),
      geral: orb([0, B + 0.03, 0.02], 16, 26, 1.75, 1.5, 40, -12),
    },
  },
  // bateria em destaque (carregando)
  vpR2Bateria: {
    luz: 'lab',
    render: ({t}) => (
      <>
        <Laboratorio />
        <Ferramentas y={B} />
        <Robo pos={[0, B, 0.02]} t={t} explode={1} rotulos={1} so={['bateria', 'placa']} destaque={['bateria']} carga={(t * 0.45) % 1} />
      </>
    ),
    cams: {close: orb([0, B + 0.12, 0.09], 18, 30, 0.6, 0.48, 40, 12)},
  },
  // "e fez a conta": calculadora, nota e moedas na bancada
  vpR2Conta: {
    luz: 'lab',
    render: ({t}) => (
      <>
        <Laboratorio />
        <Ferramentas y={B} />
        <Robo pos={[0.1, B, -0.24]} rotY={-0.4} t={t} />
        <Calculadora pos={[-0.12, B, 0.12]} rotY={0.25} texto="299,00" />
        <Recibo pos={[0.04, B, 0.16]} rotY={-0.35} />
        {[0, 1, 2, 3].map((i) => (<Moeda key={i} pos={[-0.26 + i * 0.03, B + 0.002, 0.2 + (i % 2) * 0.02]} r={0.0135} cor="#d9b44a" />))}
      </>
    ),
    cams: {calc: orb([-0.06, B + 0.02, 0.04], 4, 36, 0.95, 0.8, 40, 12)},
  },
  // robô virado: rolo, rodas e escovinha girando, sujeira sendo puxada pela boca
  vpR2Baixo: {
    luz: 'lab',
    render: ({t}) => (
      <>
        <Laboratorio />
        <Ferramentas y={B} />
        <Robo pos={[0, B, 0.02]} t={t} virado escova={10} rolo={25} rodas={6} fluxo={1} />
        <Pill texto="ROLO" pos={[0.0, B + H + 0.07, -0.015]} fundo="#ffd23f" tam={0.8} />
        <Pill texto="RODA" pos={[0.17, B + H + 0.09, 0.02]} tam={0.8} />
      </>
    ),
    cams: {cima: orb([0, B + 0.07, 0.02], 15, 58, 0.85, 0.68, 40, 22)},
  },
  // base de carregamento: o robô sai sozinho (p 0→1) ou volta (p 1→0)
  vpR2Base: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t, p}) => {
      const s1 = suave(clamp01(p / 0.3)), s2 = suave(clamp01((p - 0.3) / 0.25)), s3 = clamp01((p - 0.55) / 0.45);
      const ang = -Math.PI / 2 + (Math.PI - 0.35) * s2;
      const x0 = lerp(-2.29, -1.98, s1);
      const x = x0 + Math.sin(ang) * 0.75 * s3, z = 0.9 + Math.cos(ang) * 0.75 * s3;
      return (
        <>
          <Sala t={t} />
          <Migalhas area={[-1.9, 0.6, -1.0, 1.3]} n={60} seed={12} t={t} />
          <Robo pos={[x, 0, z]} rotY={ang} t={t} escova={p > 0.3 ? 14 : 0} rolo={p > 0.3 ? 22 : 0} rodas={8} led="#2fbf71" />
        </>
      );
    },
    cams: {
      sai: orb([-1.95, 0.08, 1.0], 68, 20, 1.45, 1.15, 40, 14),
      volta: orb([-1.82, 0.06, 1.02], 112, 36, 2.1, 1.95, 40, -10),
    },
  },
  // silencioso: o cachorro dorme no tapete e o robô passa do lado
  vpR2Silencio: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t}) => {
      const c = T_SIL(t);
      return (
        <>
          <Sala t={t} />
          {/* cachorro dormindo logo atrás da passagem do robô (o robô passa a ~30 cm do focinho) */}
          <Cachorro pos={[0.56, 0.004, 0.27]} rotY={-1.45} t={t} pose="deita" />
          <Migalhas area={[-0.05, 0.5, 0.8, 0.76]} n={70} seed={4} t={t} robo={T_SIL} />
          <Migalhas area={[-0.05, 0.5, 0.8, 0.76]} n={25} seed={14} t={t} robo={T_SIL} cor="#7a4f2a" />
          <Meia pos={[0.0, 0, 0.28]} rotY={0.6} />
          {/* primeiro plano: pelo do cachorro no chão e o pote de ração */}
          <Pelos centro={[0.3, 0.006, 1.05]} lado={[0.9, 0.4]} n={55} seed={27} />
          <Cy p={[0.5, 0.025, 1.0]} r={0.085} r2={0.07} h={0.05} c="#e8322b" rug={0.4} />
          <Cy p={[0.5, 0.046, 1.0]} r={0.07} h={0.008} c="#8a5a3b" rug={1} sombra={false} />
          <Robo2 c={c} t={t} />
          <Ondas pos={[c.x, 0, c.z]} t={t} r0={0.19} alcance={0.1} />
          <Pill texto="55 dB" pos={[c.x, 0.2, c.z]} fundo="#7fd6ff" tam={0.8} />
          <Pill texto="Zzz" pos={[0.62, 0.17, 0.3]} tam={0.7} />
        </>
      );
    },
    cams: {cao: orb([0.3, 0.02, 0.72], -8, 22, 1.65, 1.48, 40, 10)},
  },
  // escovinha lateral rente ao rodapé: a sujeira da borda vai para o centro
  vpR2Escova: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t}) => (
      <>
        <Sala t={t} />
        <Migalhas area={[-1.95, -1.48, -1.62, -1.0]} n={90} seed={6} t={t} robo={T_ESC} raio={0.2} />
        <Migalhas area={[-1.95, -1.48, -1.62, -1.0]} n={40} seed={16} t={t} robo={T_ESC} raio={0.2} cor="#7a4f2a" />
        <Robo2 c={T_ESC(t)} t={t} extra={{varre: 1, escova: 10, rodas: 4}} />
        <Pill texto="ESCOVINHA" pos={[-1.74, 0.066, T_ESC(t).z + 0.17]} fundo="#ffd23f" tam={0.8} />
      </>
    ),
    cams: {escova: orb([-1.8, -0.06, -1.33], 35, 24, 0.72, 0.6, 40, 8)},
  },
  // corte (raio-x) na bancada: sujeira entra, cai no depósito, o ar passa no filtro e sai pelo motor
  vpR2Corte: {
    luz: 'lab',
    render: ({t, p}) => (
      <>
        <Laboratorio />
        <Ferramentas y={B} />
        <Robo pos={[0, B, 0.02]} t={t} corte fluxo={1} escova={10} rolo={22} binFill={0.25} rotulos={clamp01(p * 3)} so={['motor']} destaque={['motor']} />
      </>
    ),
    cams: {motor: orb([-0.04, B + 0.03, -0.03], 38, 40, 0.72, 0.6, 40, 10)},
  },
  // sensor: bate na parede, recua, gira e segue
  vpR2Bate: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t: tReal, p}) => {
      // a animação segue o progresso do plano (o plano dura o que a narração durar)
      const t = clamp01(p) * 2.0;
      const zc = -2.184 + R + 0.006;
      let z = -1.62, ang = Math.PI, bate = 0, x = 2.45;
      if (t < 0.55) z = lerp(-1.62, zc, t / 0.55);
      else if (t < 0.78) { z = zc; bate = 1; }
      else if (t < 1.05) z = lerp(zc, zc + 0.09, (t - 0.78) / 0.27);
      else if (t < 1.5) { z = zc + 0.09; ang = Math.PI + 2.1 * suave((t - 1.05) / 0.45); }
      else { ang = Math.PI + 2.1; const d = Math.min(0.16, (t - 1.5) * 0.3); z = zc + 0.09 + Math.cos(ang) * d; x = 2.45 + Math.sin(ang) * d; }
      const fase = t < 0.55 ? '' : t < 1.05 ? 'BATE' : t < 1.5 ? 'GIRA' : 'SEGUE';
      return (
        <>
          <Sala t={tReal} />
          <Robo pos={[x, 0, z]} rotY={ang} t={tReal} corte bate={bate} rotulos={1} so={['sensor']} destaque={['sensor']} escova={14} rolo={22} rodas={t < 1.05 && t > 0.55 ? 0 : 9} led={bate ? VERM : '#2fbf71'} />
          {fase === 'GIRA' || fase === 'SEGUE' ? <Rastro pts={Array.from({length: 20}).map((_, i) => [2.45 + Math.sin(-0.4 + i * 0.12) * 0.3, zc + 0.09 + Math.cos(-0.4 + i * 0.12) * 0.3] as [number, number])} cor="#ffd23f" larg={0.035} y={0.008} /> : null}
        </>
      );
    },
    cams: {bate: orb([2.4, -0.04, -1.92], -30, 28, 1.4, 1.2, 40, 8)},
  },
  // vista de cima: sem mapa (aleatório) × com LiDAR (fileiras)
  vpR2Mapa: {
    luz: 'sala',
    fundo: ['#d9cbb4', '#efe4d2'],
    render: ({t}) => {
      const te = 4 + t * 1.6;
      return (
        <>
          <Bx p={[0, -0.01, 0]} s={[4, 0.02, 4]} c="#cbbba3" sombra={false} />
          <Planta2D z0={QA_.za0} z1={QA_.za1} cor="#d6a676" />
          <Planta2D z0={QA_.zb0} z1={QA_.zb1} cor="#d6a676" />
          <Rastro pts={pontosAte(P_ALEA, 0.9, te)} cor="#ff8a1f" larg={0.065} />
          <Rastro pts={pontosAte(P_LIDAR, 0.9, te)} cor="#2fbf71" larg={0.26} op={0.45} />
          <Robo2 c={T_ALEA(te)} t={t} />
          <Robo2 c={T_LIDAR(te)} t={t} extra={{lidar: true, cor: 'preto'}} />
          <Pill texto="R$ 299 · SEM MAPA" pos={[0, 0.3, QA_.za0 + 0.02]} fundo="#ff8a1f" />
          <Pill texto="R$ 600+ · LIDAR" pos={[0, 0.3, QA_.zb0 + 0.02]} fundo="#2fbf71" />
        </>
      );
    },
    cams: {cima: orb([0, 0, -0.45], 0, 76, 5.9, 5.6, 40, 4)},
  },
  // sala com o Zé no sofá (acha que o robô substitui a faxina); também o final
  vpR2Sofa: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t}) => (
      <>
        <Sala t={t} poeira />
        <ZeSentado t={t} />
        <Balde pos={[-1.95, 0, -1.7]} />
        <Migalhas area={[-1.1, 0.25, 0.9, 0.6]} n={90} seed={8} t={t} robo={T_SOFA} />
        <Robo2 c={T_SOFA(t)} t={t} />
      </>
    ),
    cams: {
      geral: orb([-0.1, 0.6, -0.4], 12, 14, 5.4, 4.9, 40, 10),
      final: orb([-0.4, 0.85, -0.4], -14, 14, 5.4, 4.9, 40, -10),
      // câmera rente ao chão e lente mais aberta: sofá inteiro + Zé sentado (rosto livre da legenda) + robô parado no pé do sofá
      pes: orb([-0.3, 0.2, -0.3], -16, 1, 2.95, 2.75, 66, 8),
      alto: orb([-0.55, 0.0, 0.42], -28, 44, 3.6, 3.1, 40, 14),
      ze: orb([-0.5, 0.1, 0.15], -10, 14, 3.2, 2.8, 40, -10),
    },
  },
  // final: o robô limpando entre o sofá e a mesa de centro, aos pés do Zé
  vpR2Final: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t}) => (
      <>
        <Sala t={t} />
        <ZeSentado t={t} />
        <Migalhas area={[-0.9, -1.2, 1.0, -0.96]} n={70} seed={41} t={t} robo={T_FINAL} />
        <Robo2 c={T_FINAL(t)} t={t} />
      </>
    ),
    cams: {
      alto: orb([-0.4, -0.06, -1.08], -78, 34, 1.75, 1.5, 40, 10),
      ze: orb([-0.3, 0.45, -1.15], 25, 30, 2.9, 2.55, 40, -10),
    },
  },
  // obstáculos: cabo de carregador enroscado na escovinha, meia e brinquedo; o robô para
  vpR2Obstaculo: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t}) => (
      <>
        <Sala t={t} />
        <Cabo pts={[[-2.58, 0.27, 1.24], [-2.55, 0.006, 1.12], [-2.0, 0.006, 0.95], [-1.62, 0.006, 0.66], [-1.51, 0.007, 0.62], [-1.44, 0.006, 0.76], [-1.22, 0.006, 0.96]]} cor="#f2f2f0" />
        {/* (sem o carregador na ponta do cabo: virava um bloco no rodapé do quadro) */}
        <Meia pos={[-1.32, 0, 0.32]} rotY={0.8} />
        <group position={[-1.95, 0, 0.32]} rotation={[0, 0.5, 0]}>
          <Bx p={[0, 0.02, 0]} s={[0.064, 0.038, 0.032]} c="#e8322b" />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (<Bx key={i} p={[a * 0.016, 0.043, b * 0.008]} s={[0.012, 0.008, 0.012]} c="#e8322b" />))}
        </group>
        <group position={[-1.98, 0, 0.62]} rotation={[0, -0.6, 0]}>
          <Bx p={[0, 0.03, 0]} s={[0.07, 0.03, 0.13]} c="#4f8cff" />
          <Bx p={[0, 0.055, -0.01]} s={[0.06, 0.025, 0.06]} c="#cde9ff" />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (<Bx key={i} p={[a * 0.037, 0.014, b * 0.04]} s={[0.012, 0.028, 0.028]} c="#16151c" />))}
        </group>
        <Robo pos={[-1.65, 0, 0.55]} rotY={0.3} t={t} tremor={1} escova={1.5} enrosco led={VERM} ledPisca />
        <Pill texto="PAROU!" pos={[-1.65, 0.11, 0.55]} fundo={VERM} cor="#ffffff" vis={Math.sin(t * 9) > -0.3 ? 1 : 0.6} />
      </>
    ),
    cams: {
      cabo: orb([-1.55, -0.02, 0.62], 40, 24, 1.15, 0.95, 40, 10),
      parou: orb([-1.6, 0.05, 0.52], -38, 30, 1.05, 0.88, 40, -10),
    },
  },
  // canto e bordas: o robô redondo não chega; a sujeira fica no canto e rente ao rodapé
  vpR2Canto: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t}) => {
      const cx = -2.584 + R + 0.012, cz = -2.184 + R + 0.012;
      return (
        <>
          <Sala t={t} />
          <Migalhas area={[-2.584, -2.184, -2.48, -2.08]} n={70} seed={21} t={t} cor="#8e877d" />
          <Migalhas area={[-2.584, -2.184, -2.5, -2.1]} n={40} seed={22} t={t} cor="#c9a36b" />
          <Migalhas area={[-2.4, -2.184, -1.5, -2.165]} n={70} seed={23} t={t} cor="#8e877d" />
          <Migalhas area={[-2.584, -2.0, -2.566, -1.2]} n={60} seed={24} t={t} cor="#8e877d" />
          <Rastro pts={[[-2.575, -1.95], [-2.575, -2.175], [-2.35, -2.175]]} cor="#ff8a1f" larg={0.014} y={0.009} op={0.6 + 0.4 * Math.sin(t * 6)} />
          <Robo pos={[cx, 0, cz]} rotY={0.78 + Math.sin(t * 3) * 0.35} t={t} escova={14} rolo={22} bate={Math.max(0, Math.sin(t * 6))} />
          <Pill texto="SUJEIRA FICA" pos={[-2.5, 0.12, -2.12]} fundo="#ff8a1f" />
        </>
      );
    },
    cams: {canto: orb([-2.4, 0.04, -2.0], 38, 52, 1.5, 1.25, 40, 10)},
  },
  // conta de luz: robô carregando na base, medidor na tomada contando o kWh
  vpR2Luz: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t, p}) => (
      <>
        <Sala t={t} />
        {/* mesmo valor em p16 e p17: 0,03 kWh = 1h30 de robô (o que o card diz) */}
        <Medidor pos={[SALA.tomada[0], SALA.tomada[1], SALA.tomada[2]]} rot={[0, Math.PI / 2, 0]} kwh={0.03} watts={20} />
        <Robo pos={[-2.29, 0, 0.9]} rotY={-Math.PI / 2} t={t} led="#4fc3ff" ledPisca={false} />
        {[0, 1, 2].map((i) => (<Moeda key={i} pos={[-2.12 + i * 0.025, 0.002, 1.18 + (i % 2) * 0.01]} r={0.0085} cor="#c87533" />))}
        {/* meia esquecida perto da base; rack e TV ficam no fundo do quadro */}
        <Meia pos={[-1.95, 0, 1.55]} rotY={-0.4} />
        {/* lupa flutuando perto da câmera do p17 (fora do quadro do p16): o visor ampliado do medidor, que real tem só 7,5 × 13 cm */}
        <Lupa pos={[-1.37, 0.24, 1.215]} rotY={1.2} r={0.06} kwh={0.03} watts={20} cima />
        {/* parede: tomada extra e quadrinho */}
        <Tomada pos={[-2.592, 0.3, 1.62]} />
        <group position={[-2.588, 0.98, 1.3]} rotation={[0, Math.PI / 2, 0]}>
          <Bx s={[0.34, 0.26, 0.025]} c="#3b2a20" />
          <Bx p={[0, 0, 0.014]} s={[0.3, 0.22, 0.004]} c="#7fb6d9" sombra={false} />
          <Bx p={[-0.05, -0.04, 0.017]} s={[0.16, 0.08, 0.004]} c="#3f9b5a" sombra={false} />
          <Bx p={[0.08, 0.05, 0.017]} s={[0.05, 0.05, 0.004]} c="#ffd23f" sombra={false} />
        </group>
      </>
    ),
    cams: {
      // de lado, ao longo da parede: medidor + cabo + robô na base, rack e TV no fundo (parede em diagonal, sem paredão)
      geral: orb([-2.36, 0.2, 1.0], 22, 22, 1.75, 1.55, 40, 8),
      // de frente para a parede: lupa com o visor no centro, medidor real + cabo + base + robô inteiros embaixo
      display: orb([-2.4, 0.03, 1.04], 72, 5, 1.95, 1.85, 40, 4),
    },
  },
  // aspirador convencional (o Zé usando) × robô; colunas de energia crescem (1 bloco = 0,03 kWh)
  vpR2Convencional: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t, p}) => {
      const k = clamp01(p * 1.25);
      return (
        <>
          <Sala t={t} />
          <ZeTestador t={t} pos={[1.25, 0, 0.0]} rotY={0} acao="carrega" prancheta={false} />
          <AspiradorPo pos={[0.8, 0, 0.45]} rotY={0.6} mao={[1.25, 0.77, 0.4]} bocal={[1.3 + Math.sin(t * 5) * 0.06, 0.02, 0.98]} />
          <Robo pos={[1.75, 0, 0.85]} rotY={-0.5} t={t} led="#2fbf71" />
          {p > 0.02 && (
            <>
              <ColunaEnergia pos={[1.0, 0, 1.35]} n={20 * k} />
              <ColunaEnergia pos={[1.55, 0, 1.4]} n={1} />
              <Pill texto="0,6 kWh" pos={[1.0, 0.12 + 20 * k * 0.038, 1.35]} fundo="#ffd23f" />
              <Pill texto="0,03 kWh" pos={[1.55, 0.62, 1.4]} fundo="#2fbf71" />
            </>
          )}
        </>
      );
    },
    cams: {
      aspirador: orb([1.1, 0.8, 0.5], -22, 10, 3.9, 3.5, 40, 10),
      colunas: orb([1.2, 0.65, 1.1], 4, 8, 3.9, 3.6, 40, -10),
    },
  },
  // cachorro soltando pelo pela sala
  vpR2Pelo: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t}) => (
      <>
        <Sala t={t} />
        <Cachorro pos={[0.85, 0.004, -0.05]} rotY={-0.7} t={t} pose="senta" />
        <Pelos centro={[0.35, 0.006, 0.15]} lado={[1.8, 1.2]} n={320} seed={3} />
        <Tufos centro={[0.4, 0, 0.2]} lado={[1.6, 1.0]} n={16} seed={5} />
        <Robo2 c={T_PELO(t)} t={t} />
      </>
    ),
    cams: {geral: orb([0.55, 0.12, 0.1], 24, 20, 2.5, 2.2, 40, 10)},
  },
  // reservatório saindo por trás do robô, com um copo de requeijão do lado (mesmo tamanho)
  vpR2Reserv: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t, p}) => (
      <>
        <Sala t={t} />
        <Pelos centro={[-0.6, 0.006, 0.9]} lado={[0.9, 0.6]} n={90} seed={9} />
        <Robo pos={[-0.6, 0, 0.7]} rotY={Math.PI} t={t} binOut={suave(clamp01(p * 1.6))} binFill={0.35} />
        <Requeijao pos={[-0.44, 0, 1.08]} />
        <Pill texto="0,3 L" pos={[-0.55, 0.14, 1.0]} fundo="#ffd23f" vis={clamp01(p * 3 - 0.8)} />
      </>
    ),
    cams: {close: orb([-0.56, 0.05, 0.95], 22, 30, 0.8, 0.64, 40, 12)},
  },
  // com cachorro: o depósito enche (corte), o tempo correndo
  vpR2Enche: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t, p}) => (
      <>
        <Sala t={t} />
        <Cachorro pos={[-0.32, 0.004, 0.4]} rotY={1.0} t={t} pose="senta" />
        <Pelos centro={[0.25, 0.006, 0.75]} lado={[0.9, 0.6]} n={140} seed={13} />
        <Robo pos={[0.3, 0, 0.6]} t={t} corte fluxo={1} escova={14} rolo={22} binFill={0.12 + 0.88 * p} />
        <Pill texto={`${Math.min(10, Math.round(p * 10))} MIN`} pos={[0.3, 0.17, 0.62]} fundo={p > 0.9 ? VERM : '#ffffff'} cor={p > 0.9 ? '#ffffff' : '#1d1b26'} />
      </>
    ),
    cams: {corte: orb([0.3, 0.05, 0.55], 40, 40, 1.15, 0.95, 40, 10), filtro: orb([0.3, 0.02, 0.58], -40, 55, 0.62, 0.52, 40, 8)},
  },
  // o Zé esvaziando o depósito na lixeira
  vpR2Esvazia: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t}) => {
      // o pote fica NA MÃO do Zé (encaixe maoD do Zé 2.0), braço esticado e pote virado sobre a lixeira.
      // Zé em 3/4 para a câmera; a lixeira fica ao lado dele (mesma profundidade), logo abaixo da mão.
      const zx = -1.25, zz = 0.6, rz = 1.0;
      const lx = zx + 0.5, lz = zz + 0.06; // boca da lixeira embaixo do pote
      const px = zx + 0.455, pz = zz + 0.03; // ponto de onde a sujeira cai
      return (
        <>
          <Sala t={t} />
          <Boneco pos={[zx, 0, zz]} rotY={rz} acao="aponta" t={t} v={TESTADOR} esc={0.92} expressao="serio"
            maoD={<Deposito pos={[0, -0.05, 0.03]} rot={[Math.PI / 2 + 1.1 + Math.sin(t * 6) * 0.08, 0, 0]} binFill={0.5} />} />
          <Lixeira pos={[lx, 0, lz]} rotY={0.42} />
          {Array.from({length: 14}).map((_, i) => {
            const k = (t * 1.3 + i / 14) % 1;
            return <Bx key={i} p={[px + Math.sin(i * 3) * 0.03, lerp(0.74, 0.36, k), pz + Math.cos(i * 2) * 0.03]} rot={[i, i * 2, 0]} s={[0.012, 0.004, 0.02]} c={i % 2 ? '#b9773f' : '#8a6a4a'} sombra={false} />;
          })}
          <Robo pos={[-0.3, 0, 0.3]} rotY={-0.9} t={t} semBin />
        </>
      );
    },
    cams: {ze: orb([-0.95, 0.22, 0.62], 24, 46, 5.6, 5.3, 40, 10)},
  },
  // VEREDITO: carimbo DEPENDE na bancada. O selo grande da tela (motor) ocupa ~27–47% da altura,
  // então robô e carimbo ficam lado a lado na faixa de baixo (~48–68%), separados, e a câmera fecha no tampo.
  // O Zé fica fora do quadro (antes aparecia só a mão cortada no canto).
  vpR2Veredito: {
    luz: 'lab',
    render: ({t, p}) => (
      <>
        <Laboratorio />
        <Ferramentas y={B} />
        <Robo pos={[0.21, B, 0.1]} rotY={-0.5} t={t} />
        <Carimbo pos={[-0.22, B, 0.12]} desce={clamp01(p * 2.2)} texto="DEPENDE" cor="#ff8a1f" />
        <Calculadora pos={[-0.02, B, -0.16]} rotY={0.2} texto="299,00" />
        <Recibo pos={[0.42, B, -0.12]} rotY={-0.3} />
        {[0, 1, 2].map((i) => (<Moeda key={i} pos={[0.02 + i * 0.03, B + 0.002, 0.26 + (i % 2) * 0.02]} r={0.0135} cor="#d9b44a" />))}
      </>
    ),
    cams: {carimbo: orb([0.0, B + 0.02, -0.1], 4, 48, 2.15, 1.95, 40, 10)},
  },
  // piso liso (porcelanato): o robô desliza e limpa tudo
  vpR2Liso: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t}) => (
      <>
        <Sala t={t} piso="porcelanato" tapete={null} />
        <Migalhas area={[-0.75, 0.42, 0.2, 0.68]} n={110} seed={31} t={t} robo={T_LISO} />
        <Migalhas area={[-0.75, 0.42, 0.2, 0.68]} n={40} seed={32} t={t} robo={T_LISO} cor="#7a4f2a" />
        {/* passadeira na borda de baixo, chinelo, vaso: o porcelanato não vira paredão de uma cor */}
        <Tapetinho pos={[-0.55, 0, 1.3]} larg={1.0} prof={0.5} rotY={0.1} />
        <Meia pos={[0.0, 0, 0.92]} rotY={-0.7} />
        <Meia pos={[-0.85, 0, 0.9]} rotY={0.9} />
        <Planta pos={[0.25, 0, 0.05]} esc={0.7} />
        <Robo2 c={T_LISO(t)} t={t} />
      </>
    ),
    cams: {piso: orb([-0.42, 0.0, 0.72], -12, 18, 1.85, 1.65, 40, 10)},
  },
  // tapete felpudo + pelo de bicho: o robô enrosca
  vpR2Tapete: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t}) => (
      <>
        <Sala t={t} tapete="felpudo" />
        <Cachorro pos={[0.9, 0.045, -0.2]} rotY={-1.3} t={t} pose="deita" />
        <Pelos centro={[0.4, 0.05, -0.2]} lado={[1.4, 0.8]} n={180} seed={19} />
        <Robo pos={[0.2, 0, 0.3]} rotY={Math.PI + 0.2} t={t} tremor={1} escova={2} led={VERM} ledPisca />
        <Pill texto="TAPETE" pos={[0.2, 0.14, 0.3]} fundo={VERM} cor="#ffffff" />
        <Pill texto="PELO" pos={[0.9, 0.45, -0.2]} fundo={VERM} cor="#ffffff" />
      </>
    ),
    cams: {tapete: orb([0.3, -0.05, 0.3], 14, 22, 1.8, 1.5, 40, 10)},
  },
  // custa menos que 3 diaristas
  vpR2Diaristas: {
    luz: 'sala',
    fundo: SALA_FUNDO,
    render: ({t, p}) => (
      <>
        <Sala t={t} />
        {[[-0.42, '#5fc4b8', '#ffd2ad', '#3b2a20'], [0.2, '#e87fa5', '#8d5a3b', '#1d1b26'], [0.82, '#ffd23f', '#c98e62', '#6b3e26']].map(([x, cam, pele, cab], i) => (
          <group key={i}>
            <Boneco pos={[x as number, 0, 0.05]} rotY={0} acao={i === 1 ? 'acena' : 'parado'} t={t + i} v={DIARISTA(cam as string, pele as string, cab as string)} esc={0.9} />
            <Balde pos={[(x as number) + 0.3, 0, 0.3]} />
            <Pill texto="R$ 120" pos={[x as number, 0.95, 0.35]} fundo="#ffffff" vis={clamp01(p * 4 - i * 0.6)} />
          </group>
        ))}
        {/* robô e pílula R$ 299 mais altos no quadro (antes ficavam atrás do card) */}
        <Robo pos={[0.2, 0, 0.55]} rotY={0.3} t={t} />
        <Pill texto="R$ 299" pos={[0.2, 0.25, 0.55]} fundo="#2fbf71" cor="#ffffff" />
      </>
    ),
    cams: {tres: orb([0.2, 0.3, 0.4], 0, 10, 5.4, 4.9, 40, 8)},
  },
};
