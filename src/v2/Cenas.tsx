import React from 'react';
import {interpolate, spring, useCurrentFrame} from 'remotion';
import {LINHA, Personagem} from './Personagem';

// Cenários completos em cartoon vetorial (1080 x 1920) para a série "O que acontece se..."
const W = 1080;
const H = 1920;
const FPS = 30;
export const FONTE = "'Baloo 2', sans-serif";

const Tela: React.FC<{children: React.ReactNode; fundo: string}> = ({children, fundo}) => (
  <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0}}>
    <rect width={W} height={H} fill={fundo} />
    {children}
  </svg>
);

const Contorno = {stroke: LINHA, strokeWidth: 8, strokeLinejoin: 'round' as const};

type P = {falando: boolean; prog: number};

// ---------- peças reaproveitáveis ----------
const Janela: React.FC<{x: number; y: number; w?: number; h?: number; ceu?: string; lua?: boolean; sol?: boolean}> = ({x, y, w = 300, h = 340, ceu = '#9fd8ff', lua, sol}) => (
  <g>
    <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} rx={18} fill="#f4efe6" {...Contorno} />
    <rect x={x} y={y} width={w} height={h} rx={8} fill={ceu} {...Contorno} />
    {lua && <path d={`M ${x + w * 0.65} ${y + 60} a 50 50 0 1 0 40 80 a 40 40 0 1 1 -40 -80 Z`} fill="#fff6c9" />}
    {lua && [0, 1, 2].map((i) => <circle key={i} cx={x + 50 + i * 70} cy={y + 80 + (i % 2) * 120} r={5} fill="#fff" />)}
    {sol && <circle cx={x + w / 2} cy={y + h * 0.7} r={70} fill="#ffcf4a" />}
    <path d={`M ${x + w / 2} ${y} L ${x + w / 2} ${y + h} M ${x} ${y + h / 2} L ${x + w} ${y + h / 2}`} stroke={LINHA} strokeWidth={8} />
  </g>
);

const Cama: React.FC<{x: number; y: number; cor?: string}> = ({x, y, cor = '#7c6cf0'}) => (
  <g>
    <rect x={x} y={y - 140} width={40} height={240} rx={14} fill="#a9744f" {...Contorno} />
    <rect x={x + 20} y={y} width={720} height={90} rx={20} fill="#a9744f" {...Contorno} />
    <rect x={x + 30} y={y - 40} width={700} height={60} rx={24} fill="#fff" {...Contorno} />
    <rect x={x + 50} y={y - 95} width={190} height={70} rx={30} fill="#fff" {...Contorno} />
    <path d={`M ${x + 230} ${y - 60} Q ${x + 480} ${y - 110} ${x + 735} ${y - 50} L ${x + 735} ${y + 20} L ${x + 230} ${y + 20} Z`} fill={cor} {...Contorno} />
  </g>
);

const RelogioDigital: React.FC<{x: number; y: number; hora: string}> = ({x, y, hora}) => (
  <g>
    <rect x={x} y={y} width={230} height={110} rx={20} fill="#2b2b3a" {...Contorno} />
    <text x={x + 115} y={y + 80} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={66} fill="#ff5a5a">{hora}</text>
  </g>
);

const Piso: React.FC<{y: number; cor: string; tabua?: boolean}> = ({y, cor, tabua}) => (
  <g>
    <rect x={0} y={y} width={W} height={H - y} fill={cor} />
    {tabua && Array.from({length: 6}).map((_, i) => <path key={i} d={`M 0 ${y + 60 + i * 90} L ${W} ${y + 60 + i * 90}`} stroke="rgba(0,0,0,0.08)" strokeWidth={6} />)}
  </g>
);

const Zs: React.FC<{x: number; y: number}> = ({x, y}) => {
  const f = useCurrentFrame();
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const t = ((f + i * 20) % 60) / 60;
        return (
          <text key={i} x={x + t * 80 + i * 10} y={y - t * 160} fontFamily={FONTE} fontWeight={800} fontSize={60 + i * 14} fill="#7c6cf0" stroke={LINHA} strokeWidth={4} opacity={interpolate(t, [0, 0.2, 1], [0, 1, 0])}>
            Z
          </text>
        );
      })}
    </g>
  );
};

const Mesa: React.FC<{y: number}> = ({y}) => (
  <g>
    <rect x={60} y={y} width={960} height={44} rx={10} fill="#c98a5a" {...Contorno} />
    <rect x={90} y={y + 44} width={900} height={330} fill="#b97d4f" {...Contorno} />
    <rect x={110} y={y + 44} width={30} height={400} fill="#a9744f" {...Contorno} />
    <rect x={940} y={y + 44} width={30} height={400} fill="#a9744f" {...Contorno} />
  </g>
);

const Monitor: React.FC<{x: number; y: number; erro?: boolean}> = ({x, y, erro}) => (
  <g>
    <rect x={x} y={y} width={330} height={220} rx={16} fill="#2b2b3a" {...Contorno} />
    <rect x={x + 18} y={y + 18} width={294} height={170} rx={8} fill={erro ? '#ffb3b3' : '#bfe6ff'} />
    {!erro && [0, 1, 2, 3].map((i) => <rect key={i} x={x + 40} y={y + 40 + i * 34} width={180 - (i % 2) * 60} height={14} rx={7} fill="#4f8cff" />)}
    {erro && <text x={x + 165} y={y + 125} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={60} fill="#d62828">ERRO</text>}
    <rect x={x + 145} y={y + 220} width={40} height={50} fill="#5a5a6a" {...Contorno} />
  </g>
);

const Caneca: React.FC<{x: number; y: number}> = ({x, y}) => {
  const f = useCurrentFrame();
  return (
    <g>
      <rect x={x} y={y} width={80} height={90} rx={14} fill="#ff7a59" {...Contorno} />
      <path d={`M ${x + 80} ${y + 20} q 34 0 34 26 q 0 26 -34 26`} fill="none" stroke={LINHA} strokeWidth={10} />
      {[0, 1].map((i) => <path key={i} d={`M ${x + 25 + i * 30} ${y - 15} q 12 -20 0 -40 q -12 -20 0 -40`} stroke="#c9c9d6" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.5 + Math.sin(f / 6 + i) * 0.4} />)}
    </g>
  );
};

const Planta: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    {[-40, -10, 25, 50].map((a, i) => <ellipse key={i} cx={x + a * 0.8} cy={y - 70 - (i % 2) * 30} rx={26} ry={60} transform={`rotate(${a} ${x} ${y})`} fill="#4cb87a" {...Contorno} />)}
    <path d={`M ${x - 50} ${y - 10} L ${x + 50} ${y - 10} L ${x + 38} ${y + 80} L ${x - 38} ${y + 80} Z`} fill="#e07a4f" {...Contorno} />
  </g>
);

// ---------- tomadas ----------
export const TITULO: React.FC<P> = ({falando}) => {
  const f = useCurrentFrame();
  return (
    <Tela fundo="#2e2a5a">
      <Janela x={620} y={430} lua ceu="#1d1b40" />
      <Piso y={1350} cor="#3b3670" tabua />
      <Cama x={120} y={1230} cor="#5b4fd1" />
      <RelogioDigital x={90} y={980} hora={f % 30 < 18 ? '03:47' : '03 47'} />
      <Personagem x={520} y={1110} s={0.95} pose="idle" expr="assustado" falando={falando} semPernas rot={0} sono={0.3} />
      <rect x={180} y={1170} width={720} height={160} rx={40} fill="#5b4fd1" {...Contorno} />
    </Tela>
  );
};

export const ESCRITORIO: React.FC<P & {bebado?: boolean}> = ({falando, bebado, prog}) => {
  const f = useCurrentFrame();
  const balanco = bebado ? Math.sin(f / 7) * 9 : 0;
  return (
    <Tela fundo="#dff1ea">
      <rect x={0} y={0} width={W} height={160} fill="#cfe7de" />
      <Janela x={90} y={430} w={360} h={300} ceu="#bfe6ff" />
      <rect x={560} y={470} width={380} height={240} rx={14} fill="#fff" {...Contorno} />
      <text x={750} y={560} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={48} fill="#4f8cff">METAS</text>
      <path d="M 600 680 L 680 640 L 760 660 L 900 580" stroke="#4cb87a" strokeWidth={12} fill="none" strokeLinecap="round" />
      <Piso y={1420} cor="#b9d7cc" />
      <Planta x={960} y={1330} />
      <Personagem x={300} y={1150} s={0.85} pose={bebado ? 'treme' : 'segura'} expr={bebado ? 'tonto' : 'feliz'} falando={falando} sono={bebado ? 0.5 : 0.2} rot={balanco} />
      {!bebado && <Caneca x={268} y={958} />}
      <Mesa y={1100} />
      <Monitor x={560} y={830} erro={bebado && prog > 0.4} />
      {bebado && (
        <g>
          <Personagem x={880} y={1060} s={0.6} pose="idle" expr="boquiaberto" falando={false} camisa="#ff9f43" cabelo="#d9a441" cabeloTipo="longo" pele="#c98d6a" calca="#555" />
        </g>
      )}
    </Tela>
  );
};

export const BAFOMETRO: React.FC<P> = ({prog}) => {
  const f = useCurrentFrame();
  const nivel = interpolate(prog, [0, 0.7], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <Tela fundo="#ffe3d3">
      <g transform={`translate(540 980) rotate(${Math.sin(f / 4) * 3})`}>
        <rect x={-180} y={-380} width={360} height={680} rx={60} fill="#ffd23f" {...Contorno} />
        <rect x={-130} y={-320} width={260} height={150} rx={20} fill="#2b2b3a" {...Contorno} />
        <text x={0} y={-218} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={80} fill={nivel > 0.6 ? '#ff5a5a' : '#7CFC9A'}>{(nivel * 0.1).toFixed(2)}%</text>
        <rect x={-120} y={-120} width={240} height={360} rx={24} fill="#fff" {...Contorno} />
        <rect x={-120} y={240 - 360 * nivel} width={240} height={360 * nivel} rx={24} fill={nivel > 0.6 ? '#ff5a5a' : '#4cb87a'} />
        <rect x={-30} y={300} width={60} height={160} rx={20} fill="#9aa0aa" {...Contorno} />
      </g>
      <text x={540} y={1650} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={0}>.</text>
    </Tela>
  );
};

export const CHAVE: React.FC<P> = ({falando}) => {
  const f = useCurrentFrame();
  return (
    <Tela fundo="#fff0d9">
      <Piso y={1400} cor="#e8c9a0" tabua />
      <rect x={640} y={520} width={300} height={880} rx={10} fill="#a9744f" {...Contorno} />
      <circle cx={680} cy={980} r={16} fill="#ffd23f" {...Contorno} />
      <rect x={80} y={1030} width={420} height={60} rx={12} fill="#c98a5a" {...Contorno} />
      {/* almofadas reviradas */}
      <ellipse cx={180} cy={1010} rx={70} ry={40} fill="#ff7a59" {...Contorno} transform={`rotate(${Math.sin(f / 3) * 20} 180 1010)`} />
      <Personagem x={420} y={1160} s={0.9} pose="cabeca" expr="bravo" falando={falando} sono={0.4} />
      <g transform={`translate(240 620) rotate(${Math.sin(f / 5) * 10})`}>
        <circle r={70} fill="#fff" {...Contorno} />
        <text y={30} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={90} fill="#ff5a5a">?</text>
      </g>
    </Tela>
  );
};

export const GELADEIRA: React.FC<P> = ({falando}) => (
  <Tela fundo="#2c2e4a">
    <Piso y={1420} cor="#3c3f63" />
    <polygon points="560,500 1000,420 1000,1500 560,1420" fill="#fff6c9" opacity={0.25} />
    <rect x={560} y={420} width={420} height={1000} rx={30} fill="#eef3f8" {...Contorno} />
    <rect x={590} y={460} width={360} height={920} rx={16} fill="#fff9e0" />
    {[700, 940, 1180].map((y) => <rect key={y} x={590} y={y} width={360} height={14} fill="#cfd6df" />)}
    <ellipse cx={680} cy={660} rx={60} ry={40} fill="#ff7a59" {...Contorno} />
    <rect x={780} y={590} width={90} height={110} rx={10} fill="#ffd23f" {...Contorno} />
    <circle cx={680} cy={880} r={45} fill="#4cb87a" {...Contorno} />
    <path d="M 760 920 L 900 920 L 860 850 Z" fill="#ffcf4a" {...Contorno} />
    <rect x={640} y={1080} width={120} height={100} rx={16} fill="#ff9fb2" {...Contorno} />
    <Personagem x={340} y={1180} s={0.95} pose="come" expr="cansado" falando={falando} sono={0.55} olhar={1} />
    <text x={190} y={760} fontFamily={FONTE} fontWeight={800} fontSize={70} fill="#ffd23f" stroke={LINHA} strokeWidth={4}>3:12</text>
  </Tela>
);

export const CALENDARIO: React.FC<P & {dia: number}> = ({dia, prog}) => {
  const f = useCurrentFrame();
  const vira = spring({frame: f - 4, fps: FPS, config: {damping: 12}});
  return (
    <Tela fundo={dia === 2 ? '#ffd6a5' : '#cdb4ff'}>
      <g transform={`translate(540 980) scale(${0.8 + vira * 0.2}) rotate(${(1 - vira) * -10})`}>
        <rect x={-300} y={-360} width={600} height={680} rx={50} fill="#fff" {...Contorno} />
        <rect x={-300} y={-360} width={600} height={180} rx={50} fill="#ff5a5a" {...Contorno} />
        <circle cx={-170} cy={-360} r={22} fill={LINHA} />
        <circle cx={170} cy={-360} r={22} fill={LINHA} />
        <text x={0} y={-235} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={90} fill="#fff">DIA</text>
        <text x={0} y={210} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={380} fill={LINHA}>{dia}</text>
      </g>
      <text x={540} y={1530} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={72} fill={LINHA} opacity={prog > 0.1 ? 1 : 0}>{dia === 2 ? '48 HORAS ACORDADO' : '72 HORAS ACORDADO'}</text>
    </Tela>
  );
};

export const MICROCOCHILO: React.FC<P> = ({falando, prog}) => {
  const f = useCurrentFrame();
  const apaga = Math.sin(prog * Math.PI * 3) > 0.6;
  return (
    <Tela fundo="#e3ecff">
      {/* ônibus por dentro */}
      <rect x={0} y={380} width={W} height={520} fill="#ffd23f" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={60 + i * 340} y={460} width={300} height={360} rx={30} fill="#bfe6ff" {...Contorno} />
          <rect x={60 + i * 340 - ((f * 12) % 340)} y={700} width={140} height={120} fill="#7fc8a9" opacity={0.6} />
        </g>
      ))}
      <rect x={0} y={900} width={W} height={60} fill="#9aa0aa" {...Contorno} />
      <rect x={100} y={1000} width={500} height={420} rx={40} fill="#4f8cff" {...Contorno} />
      <Piso y={1420} cor="#6c6f80" />
      <Personagem x={360} y={1180} s={0.9} pose="idle" expr={apaga ? 'dormindo' : 'cansado'} falando={!apaga && falando} sono={0.75} rot={apaga ? 18 : 0} semPernas />
      <Personagem x={820} y={1180} s={0.8} pose="celular" expr="neutro" falando={false} camisa="#4cb87a" cabeloTipo="curto" cabelo="#1d1d1d" pele="#8d5a3b" />
      {apaga && <Zs x={470} y={760} />}
      <rect x={0} y={0} width={W} height={H} fill="#000" opacity={apaga ? 0.55 : 0} />
    </Tela>
  );
};

export const CARRO: React.FC<P> = ({falando, prog}) => {
  const f = useCurrentFrame();
  const fecha = prog > 0.45;
  return (
    <Tela fundo="#8fd3ff">
      <path d="M 0 800 L 1080 800 L 1080 1100 L 0 1100 Z" fill="#7cc576" />
      <path d="M 380 800 L 700 800 L 1080 1300 L 0 1300 Z" fill="#5b5f6e" />
      {Array.from({length: 6}).map((_, i) => {
        const t = ((f * 3 + i * 30) % 180) / 180;
        const y = 820 + t * 480;
        return <rect key={i} x={540 - 6 - t * 20} y={y} width={12 + t * 40} height={20 + t * 80} fill="#fff" />;
      })}
      {/* caminhão que se aproxima */}
      {fecha && <rect x={480 - (prog - 0.45) * 500} y={760 - (prog - 0.45) * 300} width={120 + (prog - 0.45) * 1000} height={90 + (prog - 0.45) * 800} rx={12} fill="#ff5a5a" {...Contorno} />}
      {/* painel */}
      <path d="M 0 1180 Q 540 1060 1080 1180 L 1080 1920 L 0 1920 Z" fill="#3b3d4a" {...Contorno} />
      <rect x={0} y={300} width={W} height={60} fill="#3b3d4a" />
      <rect x={60} y={300} width={50} height={900} fill="#3b3d4a" transform="rotate(-8 85 750)" />
      <rect x={970} y={300} width={50} height={900} fill="#3b3d4a" transform="rotate(8 995 750)" />
      <Personagem x={540} y={1300} s={1.05} pose="volante" expr={fecha ? 'dormindo' : 'cansado'} falando={!fecha && falando} sono={0.8} semPernas />
      <circle cx={540} cy={1500} r={170} fill="none" stroke={LINHA} strokeWidth={46} />
      <circle cx={540} cy={1500} r={170} fill="none" stroke="#2b2b3a" strokeWidth={30} />
      {fecha && <rect x={0} y={0} width={W} height={H} fill="#ff2a2a" opacity={0.18 + Math.abs(Math.sin(f / 3)) * 0.15} />}
    </Tela>
  );
};

export const ESPELHO: React.FC<P> = ({falando}) => {
  const f = useCurrentFrame();
  const lento = Math.sin(f / 25) * 6;
  return (
    <Tela fundo="#d7f0f7">
      {Array.from({length: 12}).map((_, r) => Array.from({length: 8}).map((_, c) => <rect key={`${r}${c}`} x={c * 140} y={r * 140} width={136} height={136} fill="#eaf8fc" stroke="#c4e3ec" strokeWidth={4} />))}
      <rect x={190} y={420} width={700} height={860} rx={60} fill="#b8e1f0" stroke="#c9b18a" strokeWidth={24} />
      <path d="M 280 520 L 380 470 M 300 600 L 470 500" stroke="#fff" strokeWidth={16} strokeLinecap="round" opacity={0.6} />
      <Personagem x={540 + lento} y={1290} s={1.25} pose="treme" expr="cansado" falando={falando} sono={1} bagunca={1} />
      <rect x={120} y={1380} width={840} height={540} rx={20} fill="#fff" {...Contorno} />
      <ellipse cx={540} cy={1450} rx={200} ry={50} fill="#d7f0f7" {...Contorno} />
    </Tela>
  );
};

export const ALUCINACAO: React.FC<P> = ({falando, prog}) => {
  const f = useCurrentFrame();
  return (
    <Tela fundo="#3a2f6b">
      <Janela x={640} y={440} lua ceu="#1d1b40" />
      <Piso y={1400} cor="#4a3f80" tabua />
      {/* sombras que se mexem */}
      {[0, 1, 2].map((i) => (
        <g key={i} opacity={interpolate(prog, [0.1 + i * 0.15, 0.3 + i * 0.15], [0, 0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} transform={`translate(${150 + i * 300 + Math.sin(f / 10 + i) * 30} ${700 + i * 60})`}>
          <ellipse rx={90} ry={160} fill="#120d2a" />
          <circle cx={-28} cy={-80} r={14} fill="#ff4d6d" />
          <circle cx={28} cy={-80} r={14} fill="#ff4d6d" />
        </g>
      ))}
      <Personagem x={540} y={1180} s={0.9} pose="cabeca" expr="assustado" falando={falando} sono={1} bagunca={1} />
    </Tela>
  );
};

export const SURREAL: React.FC<P> = ({falando}) => {
  const f = useCurrentFrame();
  return (
    <Tela fundo="#ffb3d9">
      {Array.from({length: 9}).map((_, i) => (
        <path key={i} d={`M 0 ${200 + i * 200} Q 270 ${120 + i * 200 + Math.sin(f / 12 + i) * 70} 540 ${200 + i * 200} T 1080 ${200 + i * 200}`} stroke={i % 2 ? '#b388ff' : '#7cd3ff'} strokeWidth={60} fill="none" opacity={0.6} />
      ))}
      {/* relógio derretendo */}
      <g transform={`translate(250 620) rotate(${Math.sin(f / 15) * 10})`}>
        <path d="M -120 -100 Q 0 -150 120 -100 Q 150 40 60 60 Q 40 200 0 230 Q -20 120 -60 60 Q -150 40 -120 -100 Z" fill="#ffd23f" {...Contorno} />
        <path d="M 0 -40 L 0 0 L 40 20" stroke={LINHA} strokeWidth={10} fill="none" strokeLinecap="round" />
      </g>
      <g transform={`translate(810 700) rotate(${f * 2})`}>
        <path d="M 0 -110 L 30 -30 L 110 -30 L 45 20 L 70 100 L 0 50 L -70 100 L -45 20 L -110 -30 L -30 -30 Z" fill="#fff" {...Contorno} />
      </g>
      <Personagem x={540} y={1250} s={1} pose="bracos-abertos" expr="tonto" falando={falando} sono={1} bagunca={1} rot={Math.sin(f / 10) * 8} />
    </Tela>
  );
};

export const DORMINDO: React.FC<P> = ({prog}) => {
  const amanhece = interpolate(prog, [0, 0.8], [0, 1], {extrapolateRight: 'clamp'});
  const ceu = amanhece > 0.5 ? '#ffd7a3' : '#5a5aa8';
  return (
    <Tela fundo={amanhece > 0.5 ? '#fff4e0' : '#3b3670'}>
      <Janela x={640} y={430} ceu={ceu} sol={amanhece > 0.5} lua={amanhece <= 0.5} />
      <Piso y={1350} cor={amanhece > 0.5 ? '#f2d6b3' : '#4a4590'} tabua />
      <Cama x={120} y={1230} cor="#7c6cf0" />
      <g transform="translate(520 1140) rotate(-90)">
        <Personagem x={0} y={0} s={0.7} pose="idle" expr="dormindo" falando={false} semPernas />
      </g>
      <rect x={340} y={1150} width={540} height={110} rx={40} fill="#7c6cf0" {...Contorno} />
      <Zs x={330} y={920} />
      <g opacity={amanhece}>
        <rect x={110} y={1000} width={40} height={0} />
      </g>
    </Tela>
  );
};

export const CELULAR_MADRUGADA: React.FC<P> = ({falando}) => {
  const f = useCurrentFrame();
  return (
    <Tela fundo="#1f1d3d">
      <Janela x={650} y={430} lua ceu="#151330" />
      <Piso y={1350} cor="#2c2a55" />
      <Cama x={120} y={1230} cor="#433c99" />
      <ellipse cx={520} cy={900} rx={300} ry={260} fill="#9fd8ff" opacity={0.18 + Math.sin(f / 8) * 0.04} />
      <Personagem x={520} y={1110} s={0.95} pose="celular" expr="cansado" falando={falando} sono={0.6} semPernas />
      <rect x={180} y={1170} width={720} height={160} rx={40} fill="#433c99" {...Contorno} />
      <RelogioDigital x={90} y={980} hora="01:58" />
    </Tela>
  );
};

export const DUAS_SEMANAS: React.FC<P> = ({prog}) => {
  const n = Math.floor(interpolate(prog, [0, 0.8], [1, 14], {extrapolateRight: 'clamp'}));
  return (
    <Tela fundo="#ffe9a8">
      <rect x={140} y={500} width={800} height={820} rx={50} fill="#fff" {...Contorno} />
      <rect x={140} y={500} width={800} height={140} rx={50} fill="#4f8cff" {...Contorno} />
      <text x={540} y={600} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={72} fill="#fff">2 SEMANAS</text>
      {Array.from({length: 14}).map((_, i) => {
        const x = 200 + (i % 7) * 100;
        const y = 720 + Math.floor(i / 7) * 260;
        return (
          <g key={i}>
            <rect x={x} y={y} width={80} height={200} rx={16} fill={i < n ? '#ffd6d6' : '#f2f2f7'} {...Contorno} />
            {i < n && <text x={x + 40} y={y + 125} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={58} fill="#d62828">6h</text>}
          </g>
        );
      })}
    </Tela>
  );
};

export const VIRADA: React.FC<P> = ({falando, prog}) => {
  const f = useCurrentFrame();
  return (
    <Tela fundo="#ff5a5a">
      {Array.from({length: 16}).map((_, i) => (
        <path key={i} d={`M 540 1000 L ${540 + Math.cos((i / 16) * Math.PI * 2 + f / 40) * 1600} ${1000 + Math.sin((i / 16) * Math.PI * 2 + f / 40) * 1600} L ${540 + Math.cos(((i + 0.5) / 16) * Math.PI * 2 + f / 40) * 1600} ${1000 + Math.sin(((i + 0.5) / 16) * Math.PI * 2 + f / 40) * 1600} Z`} fill="#ff7a7a" />
      ))}
      <Personagem x={540} y={1250} s={1.3} pose="cabeca" expr="assustado" falando={falando} sono={0.7} />
      {prog > 0.2 && (
        <text x={540} y={640} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={84} fill="#fff" stroke={LINHA} strokeWidth={8} paintOrder="stroke">
          = 2 NOITES EM CLARO
        </text>
      )}
    </Tela>
  );
};

export const ACHADINHOS: React.FC<P> = ({falando, prog}) => {
  const f = useCurrentFrame();
  const itens = [
    {nome: 'Máscara 3D', cor: '#7c6cf0', d: (x: number, y: number) => <path d={`M ${x - 80} ${y} Q ${x - 80} ${y - 50} ${x - 20} ${y - 40} Q ${x} ${y - 20} ${x + 20} ${y - 40} Q ${x + 80} ${y - 50} ${x + 80} ${y} Q ${x + 60} ${y + 40} ${x + 10} ${y + 20} Q ${x} ${y + 10} ${x - 10} ${y + 20} Q ${x - 60} ${y + 40} ${x - 80} ${y} Z`} fill="#2b2b3a" {...Contorno} />},
    {nome: 'Travesseiro', cor: '#4cb87a', d: (x: number, y: number) => <rect x={x - 90} y={y - 45} width={180} height={90} rx={40} fill="#fff" {...Contorno} />},
    {nome: 'Tampão de ouvido', cor: '#ff9f43', d: (x: number, y: number) => <g><ellipse cx={x - 30} cy={y} rx={24} ry={38} fill="#ffcf4a" {...Contorno} /><ellipse cx={x + 30} cy={y} rx={24} ry={38} fill="#ffcf4a" {...Contorno} /></g>},
  ];
  return (
    <Tela fundo="#fff4e0">
      <Personagem x={250} y={1420} s={0.8} pose="aponta" expr="feliz" falando={falando} />
      {itens.map((it, i) => {
        const s = spring({frame: f - 6 - i * 8, fps: FPS, config: {damping: 11}});
        const y = 560 + i * 260;
        return (
          <g key={i} transform={`translate(${620} ${y}) scale(${s})`}>
            <rect x={-260} y={-110} width={520} height={220} rx={36} fill="#fff" {...Contorno} />
            <rect x={-260} y={-110} width={200} height={220} rx={36} fill={it.cor} {...Contorno} />
            {it.d(-160, 0)}
            <text x={60} y={-10} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={40} fill={LINHA}>{it.nome}</text>
            <rect x={-30} y={20} width={180} height={56} rx={28} fill="#ff5a5a" />
            <text x={60} y={60} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={34} fill="#fff">LINK NA BIO</text>
          </g>
        );
      })}
      <g opacity={prog > 0.15 ? 1 : 0}>
        <rect x={140} y={340} width={800} height={110} rx={55} fill="#25d366" {...Contorno} />
        <text x={540} y={414} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={50} fill="#fff">ACHADINHOS DO SONO</text>
      </g>
    </Tela>
  );
};

export const PROXIMO: React.FC<P> = ({falando}) => {
  const f = useCurrentFrame();
  return (
    <Tela fundo="#ffd23f">
      <g transform={`translate(780 820) rotate(${Math.sin(f / 6) * 6})`}>
        {Array.from({length: 10}).map((_, i) => (
          <g key={i} transform={`translate(${(i % 4) * 70 - 110} ${Math.floor(i / 4) * -80 + 80})`}>
            <rect x={-30} y={-35} width={60} height={70} rx={10} fill="#8b4a2b" {...Contorno} />
          </g>
        ))}
      </g>
      <Personagem x={340} y={1250} s={1.1} pose="tchau" expr="feliz" falando={falando} />
      <rect x={560} y={1050} width={440} height={130} rx={65} fill="#ff2d55" {...Contorno} />
      <text x={780} y={1135} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={56} fill="#fff">SEGUIR +</text>
      <text x={780} y={580} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={58} fill={LINHA}>PRÓXIMO: 10 CAFÉS</text>
    </Tela>
  );
};

export const VISUAIS: Record<string, React.FC<P>> = {
  titulo: TITULO,
  'escritorio-bem': (p) => <ESCRITORIO {...p} />,
  'escritorio-bebado': (p) => <ESCRITORIO {...p} bebado />,
  bafometro: BAFOMETRO,
  chave: CHAVE,
  geladeira: GELADEIRA,
  'calendario-2': (p) => <CALENDARIO {...p} dia={2} />,
  microcochilo: MICROCOCHILO,
  carro: CARRO,
  espelho: ESPELHO,
  'calendario-3': (p) => <CALENDARIO {...p} dia={3} />,
  alucinacao: ALUCINACAO,
  surreal: SURREAL,
  dormindo: DORMINDO,
  'celular-madrugada': CELULAR_MADRUGADA,
  'duas-semanas': DUAS_SEMANAS,
  virada: VIRADA,
  achadinhos: ACHADINHOS,
  proximo: PROXIMO,
};
