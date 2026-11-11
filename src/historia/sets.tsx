// CENÁRIOS do "Você na História: um dia como gladiador" (80 d.C., Roma). Cada set é um LUGAR diferente do dia do gladiador.
// Escala real (1 unidade = 1 m). O diretor escolhe no roteiro: {"set": "ludus", "cam": "poste", "p": [0, 0.6]}.
import React from 'react';
import {V3} from '../v4/planta';
import {Barra, Boneco, Caixa, Cil, Rotulo, texPilula} from '../v4/kit';
import {orb, Cam, Ctx} from '../v4/sets';
import {
  Anfora, Banco, Braseiro, CIDADAO, CONDENADO, COR, Casa, Cidade, Coliseu, Coluna, Corrente, IMPERADOR, LANISTA, MEDICO, MERCADOR,
  Mao, Mesa, Moedas, PRISIONEIRO, PULVINAR, Palus, Pao, Petalas, Placa, Publico, RETIARIO, Rede, Saco, TREINO, Templo, Tigela, TochaParede,
  ZE_ESCRAVO, ZE_GLAD, ZE_SEM_ESCUDO, clamp01, lerp, suave,
} from './pecas';

export type LuzHistoria = 'dia' | 'tarde' | 'noite' | 'interior' | 'tunel';
export type SetHistoria = {
  ceu?: [string, string];
  luz?: LuzHistoria;
  nevoa?: [number, number];
  render: (c: Ctx) => React.ReactNode;
  cams: Record<string, Cam>;
};

const CEU_DIA: [string, string] = ['#6fbcf2', '#fdf0d8'];
const CEU_TARDE: [string, string] = ['#f08a4b', '#ffd9a0'];
const CEU_NOITE: [string, string] = ['#1a1626', '#2b2233'];

// plaquinha flutuante sem linha guia (boa para close)
const Pilula: React.FC<{texto: string; pos: V3; fundo: string; vis: number; tam?: number}> = ({texto, pos, fundo, vis, tam = 1}) =>
  vis > 0.01 ? (
    <sprite position={pos} scale={[0.22 * suave(vis) * tam, 0.052 * suave(vis) * tam, 1]} renderOrder={10}>
      <spriteMaterial map={texPilula(texto, fundo, '#ffffff')} depthTest={false} sizeAttenuation={false} />
    </sprite>
  ) : null;

// sala de pedra (ludus por dentro): chão, 3 paredes, vigas
const Sala: React.FC<{larg?: number; prof?: number; alt?: number; cor?: string; chao?: string}> = ({larg = 9, prof = 7, alt = 3.6, cor = '#b9a58a', chao = '#8f7f6a'}) => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[larg, 0.1, prof]} cor={chao} />
    <Caixa pos={[0, alt / 2, -prof / 2]} tam={[larg, alt, 0.3]} cor={cor} />
    <Caixa pos={[-larg / 2, alt / 2, 0]} tam={[0.3, alt, prof]} cor={cor} />
    <Caixa pos={[larg / 2, alt / 2, 0]} tam={[0.3, alt, prof]} cor={cor} />
    {[-2.5, 0, 2.5].map((x) => (<Caixa key={x} pos={[x, alt - 0.1, 0]} tam={[0.22, 0.22, prof]} cor="#6b4429" />))}
    {/* faixa de pedras mais escuras no rodapé */}
    <Caixa pos={[0, 0.3, -prof / 2 + 0.16]} tam={[larg, 0.6, 0.04]} cor="#9a8670" sombra={false} />
  </group>
);

// pátio do ludus: areia, colunata em volta, celas ao fundo
const PatioLudus: React.FC = () => {
  const cols: V3[] = [];
  for (let x = -9; x <= 9; x += 3) {
    cols.push([x, 0, -6.5]);
    cols.push([x, 0, 6.5]);
  }
  for (let z = -3.5; z <= 3.5; z += 3.5) {
    cols.push([-9, 0, z]);
    cols.push([9, 0, z]);
  }
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[26, 0.1, 22]} cor="#9c8f7e" />
      <Caixa pos={[0, 0.0, 0]} tam={[17.4, 0.04, 12.4]} cor={COR.areia} />
      {cols.map((c, i) => (<Coluna key={i} pos={c} h={3.4} r={0.2} cor="#d9cbb0" />))}
      {/* telhado da colunata */}
      {[-7.9, 7.9].map((z) => (<mesh key={z} position={[0, 3.75, z]} rotation={[z > 0 ? -0.35 : 0.35, 0, 0]} castShadow><boxGeometry args={[19.5, 0.12, 3.2]} /><meshStandardMaterial color={COR.telha} flatShading /></mesh>))}
      {[-10.4, 10.4].map((x) => (<mesh key={x} position={[x, 3.75, 0]} rotation={[0, 0, x > 0 ? 0.35 : -0.35]} castShadow><boxGeometry args={[3.2, 0.12, 13]} /><meshStandardMaterial color={COR.telha} flatShading /></mesh>))}
      {/* parede do fundo com as portas das celas */}
      <Caixa pos={[0, 2, -9.2]} tam={[24, 4, 0.4]} cor="#c9b591" />
      {[-8, -5.3, -2.6, 0, 2.6, 5.3, 8].map((x) => (
        <group key={x}>
          <Caixa pos={[x, 0.95, -8.98]} tam={[0.9, 1.9, 0.06]} cor="#3a2f28" sombra={false} />
          {[-0.3, -0.1, 0.1, 0.3].map((dx) => (<Cil key={dx} pos={[x + dx, 0.95, -8.93]} r={0.015} h={1.9} cor="#5c5f66" seg={5} />))}
        </group>
      ))}
      <Caixa pos={[-12.2, 2, 0]} tam={[0.4, 4, 18]} cor="#c9b591" />
      <Caixa pos={[12.2, 2, 0]} tam={[0.4, 4, 18]} cor="#c9b591" />
      {/* rack de espadas de treino */}
      <group position={[-7.5, 0, -8.6]}>
        <Caixa pos={[0, 0.9, 0]} tam={[1.6, 0.08, 0.2]} cor="#6b4429" />
        {[-0.6, -0.3, 0, 0.3, 0.6].map((x) => (<Caixa key={x} pos={[x, 0.75, 0.08]} rot={[0, 0, 0.05]} tam={[0.06, 0.7, 0.02]} cor="#a8743f" />))}
      </group>
    </group>
  );
};

// fórum: chão de pedra, templos e casas atrás
const Forum: React.FC = () => (
  <group>
    <Caixa pos={[0, -0.05, -4]} tam={[60, 0.1, 50]} cor="#cdbd98" />
    {Array.from({length: 12}).map((_, i) => (<Caixa key={i} pos={[-27 + i * 5, 0.005, -4]} tam={[0.05, 0.02, 50]} cor="#b8a884" sombra={false} />))}
    <Templo pos={[-3, 0, -18]} larg={13} n={6} />
    <Casa pos={[12, 0, -14]} tam={[8, 7, 6]} cor="#e2c9a0" rotY={-0.3} />
    <Casa pos={[-16, 0, -12]} tam={[7, 8, 6]} cor="#d9b48a" rotY={0.35} />
    <Casa pos={[20, 0, -24]} tam={[10, 10, 7]} cor="#efe4cc" />
    <Casa pos={[-24, 0, -26]} tam={[10, 9, 7]} cor="#e8d9b8" />
  </group>
);

// público no pátio do mercado (compradores de toga)
const Compradores: React.FC<{t: number}> = ({t}) => (
  <>
    {([[-1.8, 3.0, 0.2], [0.4, 3.4, -0.1], [2.2, 2.9, -0.4], [-3.4, 2.4, 0.5], [3.6, 2.2, -0.6]] as V3[]).map(([x, z, r], i) => (
      <Boneco key={i} pos={[x, 0, z]} rotY={Math.PI + r} acao={i === 1 ? 'aponta' : 'parado'} t={t + i} v={{...CIDADAO, toga: ['#f2ecdf', '#d9c68f', '#e9e1cf', '#c9d3e0', '#f2ecdf'][i], cabelo: ['#5a4030', '#1d1b26', '#8a6a43', '#3b2a20', '#c8c8c8'][i]}} />
    ))}
  </>
);

// corredor (túnel) de pedra que leva à arena
const Tunel: React.FC<{t: number}> = ({t}) => {
  const L = 24;
  return (
    <group>
      <Caixa pos={[0, -0.05, -L / 2]} tam={[3.4, 0.1, L]} cor="#6f645a" />
      {[-1.7, 1.7].map((x) => (<Caixa key={x} pos={[x, 1.4, -L / 2]} tam={[0.3, 2.8, L]} cor="#857869" />))}
      {/* abóbada */}
      <mesh position={[0, 2.8, -L / 2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.85, 1.85, L, 14, 1, true, -Math.PI / 2, Math.PI]} /><meshStandardMaterial color="#776a5c" flatShading side={2} /></mesh>
      {Array.from({length: 7}).map((_, i) => (<mesh key={i} position={[0, 2.8, -2 - i * 3.4]} rotation={[0, 0, 0]}><torusGeometry args={[1.8, 0.12, 4, 14, Math.PI]} /><meshStandardMaterial color="#5f554b" flatShading /></mesh>))}
      {[-4, -10, -16].map((z) => (<TochaParede key={z} pos={[-1.5, 1.9, z]} t={t + z} />))}
      {[-7, -13].map((z) => (<group key={z} rotation={[0, Math.PI, 0]}><TochaParede pos={[-1.5, 1.9, -z]} t={t + z} luz={false} /></group>))}
      {/* boca do túnel: a arena clara lá fora */}
      <mesh position={[0, 2.2, -L + 0.05]}><planeGeometry args={[3.4, 4.6]} /><meshBasicMaterial color="#fff3d6" /></mesh>
      <mesh position={[0, 0.02, -L - 4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[12, 8]} /><meshBasicMaterial color="#f2dba8" /></mesh>
      <pointLight position={[0, 2.5, -L + 2]} color="#fff0d0" intensity={30} distance={22} decay={1.4} />
      {/* grade levantada */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((x) => (<Cil key={x} pos={[x, 4.0, -L + 1.2]} r={0.03} h={1.6} cor="#3a3a40" seg={5} />))}
    </group>
  );
};

// enfermaria do ludus
const Enfermaria: React.FC = () => (
  <group>
    <Sala larg={8} prof={6} alt={3.4} cor="#cbb898" chao="#9a8670" />
    {/* estante com potes de remédio */}
    <group position={[-2.6, 0, -2.75]}>
      {[0.6, 1.2, 1.8].map((y) => (<Caixa key={y} pos={[0, y, 0]} tam={[2.0, 0.05, 0.4]} cor="#7a5034" />))}
      {[-0.7, -0.35, 0, 0.35, 0.7].flatMap((x, i) => [0.6, 1.2, 1.8].map((y, j) => (
        <Cil key={x + ':' + y} pos={[x, y + 0.11, 0]} r={0.07} r2={0.09} h={0.18 + ((i + j) % 2) * 0.06} cor={['#c0703f', '#d9c9a6', '#7a8f6a', '#b5653a'][(i + j) % 4]} seg={8} />
      )))}
    </group>
    {/* mesa com instrumentos */}
    <Mesa pos={[2.1, 0, 0.6]} larg={1.4} prof={0.7} />
    {[-0.4, -0.2, 0.0].map((x) => (<Caixa key={x} pos={[2.1 + x, 0.765, 0.45]} rot={0.3} tam={[0.02, 0.01, 0.18]} cor="#c9ced6" sombra={false} />))}
    <Cil pos={[1.75, 0.8, 0.75]} r={0.08} h={0.1} cor="#d9c9a6" seg={10} />
  </group>
);

// imperador sentado no camarote
const Imperador: React.FC<{t: number; acao?: 'parado' | 'aponta' | 'acena'}> = ({t, acao = 'parado'}) => (
  <Boneco pos={[PULVINAR[0], PULVINAR[1] + 0.5, PULVINAR[2] + 0.2]} rotY={0} acao={acao} t={t} v={IMPERADOR} />
);

const ArenaBase: React.FC<{t: number; agito?: number; cidade?: boolean}> = ({t, agito = 1, cidade = false}) => (
  <>
    {cidade && <Cidade />}
    <Coliseu />
    <Publico t={t} agito={agito} />
  </>
);

export const SETS: Record<string, SetHistoria> = {
  // ===== gancho: o Coliseu novinho, visto do alto, com a cidade =====
  coliseu: {
    ceu: CEU_DIA,
    nevoa: [380, 1500],
    render: ({t}) => (
      <>
        <ArenaBase t={t} cidade />
        <Imperador t={t} />
      </>
    ),
    cams: {
      drone: orb([0, 8, 0], 62, 30, 540, 430, 40, 10),
    },
  },
  // ===== dentro do Coliseu: 50 mil pessoas =====
  arena: {
    ceu: CEU_DIA,
    nevoa: [300, 1400],
    render: ({t}) => (
      <>
        <ArenaBase t={t} cidade />
        <Imperador t={t} acao="acena" />
        <Boneco pos={[0, 0.02, 0]} rotY={0} acao="aponta" t={t} v={ZE_GLAD} ferramenta="gladio" />
      </>
    ),
    cams: {
      geral: orb([0, 6, -8], 160, 32, 150, 120, 46, 14),
      ze: orb([0, 1.15, 0], 18, 4, 4.8, 3.8, 40, 10),
    },
  },
  // ===== mercado de escravos no fórum =====
  mercado: {
    ceu: CEU_DIA,
    render: ({t, p}) => {
      const h = 0.9;
      const xs = [-1.3, 0, 1.3];
      const vis = (a: number, b: number) => clamp01((p - a) * 10) * (1 - clamp01((p - b) * 10));
      return (
        <>
          <Forum />
          {/* estrado de madeira (catasta) */}
          <Caixa pos={[0, h / 2, 0]} tam={[5, h, 2.2]} cor={COR.madeira} />
          {[0, 1, 2].map((i) => (<Caixa key={i} pos={[2.9 + i * 0.3, h * (2 - i) / 3 / 2 + 0.01, 0.4]} tam={[0.3, h * (3 - i) / 3, 1.2]} cor="#7a5034" />))}
          <Boneco pos={[xs[0], h, 0]} rotY={0.15} t={t} v={ZE_ESCRAVO} />
          <Boneco pos={[xs[1], h, -0.1]} rotY={0} t={t + 1} v={PRISIONEIRO} />
          <Boneco pos={[xs[2], h, 0]} rotY={-0.15} t={t + 2} v={CONDENADO} />
          {xs.map((x, i) => (<Placa key={i} pos={[x, h + 1.06, 0.3 - (i === 1 ? 0.1 : 0)]} />))}
          <Corrente a={[xs[0] + 0.2, h + 0.55, 0.12]} b={[xs[1] - 0.2, h + 0.55, 0.02]} />
          <Corrente a={[xs[1] + 0.2, h + 0.55, 0.02]} b={[xs[2] - 0.2, h + 0.55, 0.12]} />
          <Boneco pos={[-3.1, 0, 0.6]} rotY={0.9} acao="aponta" t={t} v={MERCADOR} />
          <Compradores t={t} />
          <Rotulo texto="escravo" ancora={[xs[0], h + 1.75, 0]} sobe={0.8} vis={vis(0.1, 0.4)} fundo="#ffffff" />
          <Rotulo texto="prisioneiro" ancora={[xs[1], h + 1.75, -0.1]} sobe={0.8} vis={vis(0.4, 0.7)} fundo="#ffd23f" />
          <Rotulo texto="condenado" ancora={[xs[2], h + 1.75, 0]} sobe={0.8} vis={vis(0.7, 2)} fundo="#ff8a8a" />
        </>
      );
    },
    cams: {
      geral: orb([0, 1.7, 0], 18, 10, 12, 10, 44, 8),
      escravo: orb([-1.3, 1.9, 0.1], 14, 5, 4.4, 3.7, 40, 8),
      prisioneiro: orb([0, 2.0, 0.0], -14, 6, 4.4, 3.7, 40, 8),
      condenado: orb([1.3, 1.9, 0.1], 22, 5, 4.6, 3.9, 40, 8),
    },
  },
  // ===== o juramento, à noite, com ferro em brasa =====
  juramento: {
    ceu: CEU_NOITE,
    luz: 'noite',
    render: ({t, p}) => (
      <>
        <Sala larg={9} prof={7} alt={3.6} cor="#8f7f6a" chao="#6f645a" />
        <TochaParede pos={[-4.3, 2.0, -1.5]} t={t} />
        <TochaParede pos={[0, 2.0, -3.3]} t={t + 1} />
        {/* correntes e chicote pendurados */}
        <Corrente a={[2.6, 2.6, -3.3]} b={[3.6, 2.4, -3.3]} elo={0.08} />
        <Corrente a={[-2.8, 2.5, -3.3]} b={[-1.6, 2.6, -3.3]} elo={0.08} />
        <Barra a={[1.2, 2.5, -3.3]} b={[1.25, 1.4, -3.28]} r={0.015} cor="#3b2a20" />
        <Braseiro pos={[0.55, 0, 0.2]} t={t} />
        <Boneco pos={[1.6, 0, -0.4]} rotY={-1.2} acao="aponta" t={t} v={LANISTA} />
        <Boneco pos={[-0.55, 0, 0.6]} rotY={1.25} acao="parado" t={t} v={ZE_SEM_ESCUDO} />
        <Rotulo texto="lanista" ancora={[1.6, 1.85, -0.4]} sobe={0.7} vis={clamp01(1 - (p - 0.12) * 10)} fundo="#ffd23f" />
      </>
    ),
    cams: {
      lanista: orb([1.6, 1.3, -0.4], -40, 6, 4.4, 3.7, 40, 8),
      geral: orb([0.5, 1.1, 0.1], 10, 16, 8.8, 7.8, 44, 6),
      brasa: orb([0.55, 1.0, 0.2], 30, 32, 2.8, 2.4, 40, 10),
      ze: orb([-0.55, 1.45, 0.6], 62, 4, 3.4, 2.9, 40, 8),
    },
  },
  // ===== treino no pátio do ludus =====
  ludus: {
    ceu: CEU_DIA,
    render: ({t}) => (
      <>
        <PatioLudus />
        <Palus pos={[0.95, 0, 0]} abalo={Math.sin(t * 8) * 0.02} />
        <Boneco pos={[0.25, 0, 0]} rotY={Math.PI / 2} acao="martela" t={t} v={ZE_GLAD} ferramenta="rudis" />
        {[[-4.5, -3.2], [-1.5, -3.2], [3.5, -3.2], [6.0, -3.2]].map(([x, z], i) => (
          <group key={i}>
            <Palus pos={[x + 0.7, 0, z]} abalo={Math.sin(t * 8 + i) * 0.02} />
            <Boneco pos={[x, 0, z]} rotY={Math.PI / 2} acao="martela" t={t + i * 0.37} v={TREINO[i % 3]} ferramenta="rudis" />
          </group>
        ))}
        <Boneco pos={[-2.6, 0, 1.6]} rotY={0.9} acao="martela" t={t * 0.7} v={LANISTA} ferramenta="chicote" />
      </>
    ),
    cams: {
      geral: orb([0, 1.0, -1.4], 22, 24, 16, 13, 44, 10),
      poste: orb([0.6, 1.2, 0], 35, 8, 3.8, 3.2, 40, 10),
      chicote: orb([-2.4, 1.2, 1.4], 25, 6, 4.2, 3.6, 40, 8),
    },
  },
  // ===== refeitório: cevada, feijão e a bebida de cinza =====
  refeitorio: {
    ceu: ['#3a2a20', '#5a4030'],
    luz: 'interior',
    render: ({t, p}) => {
      const despeja = clamp01((p - 0.6) * 3);
      return (
        <>
          <Sala larg={9} prof={7} alt={3.4} cor="#c9b591" chao="#8f7f6a" />
          <Mesa pos={[0, 0, 0]} larg={3.2} prof={0.9} />
          <Banco pos={[0, 0, -0.75]} larg={3.2} />
          <Banco pos={[0, 0, 0.75]} larg={3.2} />
          <Boneco pos={[0, 0.35, -0.72]} rotY={0} acao="senta" t={t} v={ZE_SEM_ESCUDO} />
          <Boneco pos={[-1.1, 0.35, -0.72]} rotY={0} acao="senta" t={t + 1} v={TREINO[0]} />
          <Boneco pos={[1.1, 0.35, 0.72]} rotY={Math.PI} acao="senta" t={t + 2} v={TREINO[1]} />
          <Tigela pos={[-0.12, 0.75, -0.15]} grao="#e3cf8f" seed={2} />
          <Tigela pos={[0.16, 0.75, -0.08]} grao="#7a4a2f" seed={4} />
          <Tigela pos={[-1.1, 0.75, -0.15]} grao="#e3cf8f" seed={6} />
          <Tigela pos={[1.1, 0.75, 0.15]} grao="#7a4a2f" seed={8} />
          <Pao pos={[-0.45, 0.79, 0.1]} />
          <Anfora pos={[1.9, 0, -2.9]} esc={1.3} />
          <Anfora pos={[2.4, 0, -2.9]} esc={1.2} />
          <Anfora pos={[1.2, 0.75, 0.25]} esc={0.35} />
          {/* a caneca de cinza */}
          <group position={[0.42, 0.75, 0.02]}>
            <Cil pos={[0, 0.06, 0]} r={0.05} r2={0.042} h={0.12} cor="#9a8f80" seg={12} />
            <Cil pos={[0, 0.06 + 0.04 * despeja, 0]} r={0.045} h={0.01} cor="#7d7a76" seg={12} />
            {despeja > 0 && despeja < 1 && Array.from({length: 14}).map((_, i) => {
              const y = 0.42 - (((t * 1.6 + i * 0.07) % 1) * 0.32);
              return (<mesh key={i} position={[Math.sin(i * 2.1) * 0.012, y, Math.cos(i * 1.7) * 0.012]}><icosahedronGeometry args={[0.009, 0]} /><meshStandardMaterial color="#4f4a46" /></mesh>);
            })}
            {/* concha com a cinza */}
            <group position={[0.02, 0.44, 0]} rotation={[0, 0, 0.9 * despeja]}>
              <Cil pos={[0, 0, 0]} r={0.04} r2={0.025} h={0.04} cor="#8b5a3c" seg={10} />
              <Barra a={[0.03, 0.01, 0]} b={[0.25, 0.08, 0]} r={0.008} cor="#6b4429" />
            </group>
          </group>
          <Pilula texto="cevada" pos={[-0.12, 0.95, -0.15]} fundo="#c9a24a" vis={clamp01((p - 0.42) * 10) * (1 - clamp01((p - 0.62) * 10))} />
          <Pilula texto="feijão" pos={[0.2, 0.92, -0.04]} fundo="#7a4a2f" vis={clamp01((p - 0.48) * 10) * (1 - clamp01((p - 0.62) * 10))} />
          <Pilula texto="cinza" pos={[0.52, 0.86, 0.02]} fundo="#6f6a66" vis={clamp01((p - 0.66) * 8)} />
        </>
      );
    },
    cams: {
      mesa: orb([0, 1.0, -0.3], 16, 22, 5.4, 4.6, 42, 8),
      tigela: orb([0.02, 0.8, -0.12], 12, 48, 1.25, 1.0, 40, 10),
      cinza: orb([0.42, 0.78, 0.02], -24, 26, 0.8, 0.65, 40, 10),
    },
  },
  // ===== o túnel até a arena =====
  tunel: {
    ceu: ['#14110f', '#14110f'],
    luz: 'tunel',
    render: ({t, p}) => (
      <>
        <Tunel t={t} />
        <Boneco pos={[0, 0, lerp(-4.5, -8.5, p)]} rotY={Math.PI} acao="anda" t={t} v={ZE_GLAD} ferramenta="gladio" />
      </>
    ),
    cams: {
      costas: {de: [0.9, 2.3, 0.6], para: [0.7, 2.1, -3.0], alvo: [0, 1.1, -12], alvoPara: [0, 1.2, -16], fov: 44},
    },
  },
  // ===== a luta: murmilão (você) contra retiário =====
  luta: {
    ceu: CEU_DIA,
    render: ({t, p}) => {
      const avanco = Math.sin(t * 2.2) * 0.25;
      return (
        <>
          <ArenaBase t={t} />
          <Imperador t={t} />
          <Boneco pos={[-1.15 + avanco, 0.02, 0]} rotY={Math.PI / 2} acao="martela" t={t} v={ZE_GLAD} ferramenta="gladio" />
          <group>
            <Boneco pos={[1.25 + avanco, 0.02, 0.1]} rotY={-Math.PI / 2} acao="parado" t={t} v={RETIARIO} ferramenta="tridente" />
            <Rede pos={[1.15 + avanco, 0.55, -0.35]} t={t} />
          </group>
          {/* árbitro (summa rudis) com o bastão */}
          <Boneco pos={[0.2, 0.02, -2.6]} rotY={0.2} acao="aponta" t={t} v={{...CIDADAO, toga: undefined, camisa: '#f4f4f4', calca: '#f4f4f4'}} />
          {p > 0.5 && <Pilula texto="1 em 5" pos={[0, 2.6, 0]} fundo="#d6282b" vis={clamp01((p - 0.5) * 6)} />}
        </>
      );
    },
    cams: {
      geral: orb([0, 1.2, -0.6], 8, 12, 8.6, 7.2, 44, 10),
      close: orb([-0.5, 1.35, 0.1], 38, 6, 4.4, 3.6, 40, 10),
    },
  },
  // ===== enfermaria: você é um investimento caro =====
  enfermaria: {
    ceu: ['#3a2a20', '#5a4030'],
    luz: 'interior',
    render: ({t, p}) => (
      <>
        <Enfermaria />
        <Banco pos={[-0.3, 0, -0.2]} larg={1.8} alt={0.5} />
        <Boneco pos={[-0.3, 0.4, -0.2]} rotY={0} acao="senta" t={t} v={ZE_SEM_ESCUDO} />
        {/* atadura no braço */}
        <Cil pos={[0.02, 1.15, -0.2]} r={0.1} h={0.18} cor="#ffffff" />
        <Boneco pos={[0.6, 0, -0.05]} rotY={-1.45} acao="aponta" t={t} v={MEDICO} />
        <Boneco pos={[2.7, 0, -0.5]} rotY={-0.6} acao="parado" t={t} v={LANISTA} />
        <Saco pos={[2.35, 0.75, 0.75]} />
        <Moedas pos={[2.05, 0.75, 0.78]} n={9} />
        <Moedas pos={[2.12, 0.75, 0.62]} n={6} />
        <Moedas pos={[1.98, 0.75, 0.6]} n={4} cor="#c9ced6" />
        <Rotulo texto="médico" ancora={[0.6, 1.85, -0.05]} sobe={0.6} vis={clamp01((p - 0.4) * 10) * (1 - clamp01((p - 0.8) * 20))} fundo="#ffffff" />
      </>
    ),
    cams: {
      geral: orb([0.5, 1.0, 0], 14, 20, 7.2, 6.2, 44, 8),
      medico: orb([0.15, 1.1, -0.1], 8, 8, 4.4, 3.8, 40, 8),
      moedas: orb([2.12, 0.86, 0.68], 28, 32, 1.1, 0.85, 40, 10),
    },
  },
  // ===== o camarote do imperador =====
  camarote: {
    ceu: CEU_DIA,
    render: ({t}) => (
      <>
        <ArenaBase t={t} agito={0.5} />
        <Imperador t={t} acao="aponta" />
        <Boneco pos={[PULVINAR[0] - 1.7, PULVINAR[1] + 0.5, PULVINAR[2] + 0.6]} rotY={0.3} acao="parado" t={t} v={CIDADAO} />
        <Boneco pos={[PULVINAR[0] + 1.7, PULVINAR[1] + 0.5, PULVINAR[2] + 0.6]} rotY={-0.3} acao="parado" t={t} v={{...CIDADAO, toga: '#d9c68f'}} />
        <Boneco pos={[0, 0.02, -18]} rotY={Math.PI} acao="parado" t={t} v={ZE_GLAD} ferramenta="gladio" />
      </>
    ),
    cams: {
      geral: orb([0, 5.9, -29], 6, 8, 6, 5, 42, 8),
    },
  },
  // ===== o polegar: mão gigante sobre a arena =====
  polegar: {
    ceu: CEU_DIA,
    render: ({t, p}) => {
      const ang = p < 0.5 ? 0 : Math.PI * suave((p - 0.5) * 4);
      return (
        <>
          <ArenaBase t={t} agito={0.4} />
          <Mao pos={[-0.3, 6.0, 0]} ang={ang} esc={1.25} />
          {p >= 0.5 && <Pilula texto="?" pos={[2.2, 9.6, 0]} fundo="#d6282b" vis={clamp01((p - 0.7) * 8)} tam={0.7} />}
        </>
      );
    },
    cams: {
      baixo: orb([0.6, 4.6, 0], 10, 6, 13, 11.5, 44, 6),
      duvida: orb([0.4, 6.6, 0], -30, 12, 14, 12.5, 44, 10),
    },
  },
  // ===== a liberdade: a rudis, ao entardecer =====
  liberdade: {
    ceu: CEU_TARDE,
    luz: 'tarde',
    render: ({t}) => (
      <>
        <ArenaBase t={t} agito={1.6} />
        <Imperador t={t} acao="acena" />
        <Boneco pos={[0, 0.02, 0]} rotY={0} acao="aponta" t={t} v={ZE_SEM_ESCUDO} ferramenta="rudis" />
        <Petalas t={t} centro={[0, 0, 0]} raio={4} />
      </>
    ),
    cams: {
      geral: orb([0, 1.1, 0], 16, 14, 6.2, 5.2, 44, 10),
      rudis: orb([0.3, 1.35, 0.35], 70, 6, 3.0, 2.6, 40, 8),
      aplauso: {de: [-0.4, 1.0, -4.4], para: [-0.3, 1.0, -3.5], alvo: [0.3, 3.0, 10], alvoPara: [0.3, 3.4, 10], fov: 46},
    },
  },
  // ===== fecho: o Coliseu ao pôr do sol e a pergunta =====
  fim: {
    ceu: CEU_TARDE,
    luz: 'tarde',
    nevoa: [300, 1400],
    render: ({t}) => (
      <>
        <ArenaBase t={t} cidade />
        <Imperador t={t} />
        <Boneco pos={[0, 0.02, 0]} rotY={0} acao="aponta" t={t} v={ZE_GLAD} ferramenta="gladio" />
      </>
    ),
    cams: {
      aereo: orb([0, 8, 0], -40, 38, 470, 400, 40, 10),
      ze: orb([0, 1.2, 0], -20, 6, 5.2, 4.2, 40, 8),
      pergunta: orb([0.1, 1.45, 0], 6, 2, 3.0, 2.5, 40, 6),
    },
  },
};

