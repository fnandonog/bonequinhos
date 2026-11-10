import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Ze, Pose} from './Ze';
import {AirFryerCorte, AirFryerFora} from './AirFryer';
import {Banheiro, Cozinha, Deserto, Elevador, Escuro, Neutro, Padaria, Tornado, TunelVento} from './Cenarios';
import {continueRender, delayRender} from 'remotion';

if (typeof document !== 'undefined' && !document.getElementById('fonte-baloo')) {
  const st = document.createElement('style');
  st.id = 'fonte-baloo';
  st.textContent = `@font-face{font-family:'Baloo 2';font-weight:800;src:url('${staticFile('fonts/baloo-2-latin-800-normal.woff2')}') format('woff2');}
@font-face{font-family:'Baloo 2';font-weight:800;src:url('${staticFile('fonts/baloo-2-latin-ext-800-normal.woff2')}') format('woff2');unicode-range:U+0100-024F,U+1E00-1EFF;}`;
  document.head.appendChild(st);
  const h = delayRender('fonte');
  document.fonts.load("800 40px 'Baloo 2'", 'ÁÃÇÉÊÍÓÕÚáãçéêíóõú').then(() => continueRender(h)).catch(() => continueRender(h));
}

export const FPS = 30;
const INK = '#1b1b1f';
const FONTE = "'Baloo 2', sans-serif";

export type Palavra = {palavra: string; inicio: number; fim: number};
export type CenaTiming = {id: string; duracao: number; palavras: Palavra[]};
export type Timings = {id: string; estimado?: boolean; cenas: CenaTiming[]};
export type Tomada = {visual: string; aPartirDaPalavra: number};
export type Roteiro = {id: string; titulo: string; cenas: {id: string; texto: string; tomadas: Tomada[]}[]};

export type VideoProps = {roteiro: Roteiro; timings: Timings; comAudio: boolean};

export const Legenda: React.FC<{palavras: Palavra[]}> = ({palavras}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  // agrupa em blocos de até 3 palavras
  const blocos: Palavra[][] = [];
  palavras.forEach((p, i) => {
    if (i % 3 === 0) blocos.push([]);
    blocos[blocos.length - 1].push(p);
  });
  const atual = blocos.find((b, i) => t >= b[0].inicio - 0.05 && (i === blocos.length - 1 || t < blocos[i + 1][0].inicio - 0.05));
  if (!atual) return null;
  const inicioBloco = Math.round(atual[0].inicio * FPS);
  const pop = spring({frame: f - inicioBloco, fps: FPS, config: {damping: 12, stiffness: 220}});
  return (
    <div style={{position: 'absolute', top: 1600, width: '100%', textAlign: 'center', transform: `scale(${0.85 + pop * 0.15})`}}>
      {atual.map((p, i) => {
        const ativa = t >= p.inicio && t < (atual[i + 1]?.inicio ?? p.fim + 0.3);
        return (
          <span
            key={i}
            style={{
              fontFamily: FONTE,
              fontWeight: 800,
              fontSize: 104,
              lineHeight: 1.05,
              margin: '0 14px',
              textTransform: 'uppercase',
              color: ativa ? '#ffd23f' : '#ffffff',
              WebkitTextStroke: '14px #1b1b1f',
              paintOrder: 'stroke fill',
              textShadow: '0 10px 0 rgba(0,0,0,0.35)',
              display: 'inline-block',
            }}
          >
            {p.palavra}
          </span>
        );
      })}
    </div>
  );
};

const Selo: React.FC<{texto: string; cor?: string; atraso?: number; y?: number}> = ({texto, cor = '#ff6b3d', atraso = 10, y = 0}) => {
  const f = useCurrentFrame();
  const s = spring({frame: f - atraso, fps: FPS, config: {damping: 9}});
  return (
    <div style={{position: 'absolute', top: 360 + y, width: '100%', display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${s}) rotate(-4deg)`, background: cor, border: `10px solid ${INK}`, borderRadius: 30, padding: '10px 40px', fontFamily: FONTE, fontWeight: 800, fontSize: 76, color: '#fff', WebkitTextStroke: '3px #1b1b1f', boxShadow: '0 14px 0 rgba(0,0,0,0.3)'}}>
        {texto}
      </div>
    </div>
  );
};

const Palco: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', top: 470, left: 0, width: 1080, height: 1150, transform: 'scale(0.9)', transformOrigin: 'top center'}}>{children}</div>
);

const ZeSvg: React.FC<{x: number; y: number; scale?: number; pose?: Pose; falando: boolean; rot?: number; olhar?: number; tela?: boolean}> = ({tela, ...p}) => (
  <svg viewBox={tela ? '0 0 1080 1920' : '0 0 1080 1150'} width={1080} height={tela ? 1920 : 1150} style={{position: 'absolute', top: 0, left: 0}}>
    <Ze {...p} />
  </svg>
);

const Termometro: React.FC = () => {
  const f = useCurrentFrame();
  const v = interpolate(f, [10, 70], [25, 200], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 40, right: 40, background: '#fff', border: `8px solid ${INK}`, borderRadius: 28, padding: '6px 26px', fontFamily: FONTE, fontWeight: 800, fontSize: 80, color: v > 150 ? '#e8222b' : INK}}>
      {Math.round(v)}°C
    </div>
  );
};

const BatataGrande: React.FC<{douradura: number; cortada?: boolean; vapor?: boolean}> = ({douradura, cortada, vapor}) => {
  const f = useCurrentFrame();
  const cor = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * douradura)).join(',')})`;
  return (
    <svg viewBox="0 0 1080 1150" width="100%" height="100%">
      {cortada ? (
        <g transform="translate(540 560)">
          <rect x={-380} y={-170} width={760} height={340} rx={70} fill={cor([250, 232, 160], [200, 120, 25])} stroke={INK} strokeWidth={14} />
          <rect x={-330} y={-120} width={660} height={240} rx={45} fill="#fff6d2" />
        </g>
      ) : (
        <g transform={`translate(540 560) rotate(${Math.sin(f / 15) * 4})`}>
          <rect x={-110} y={-380} width={220} height={760} rx={50} fill={cor([250, 232, 160], [212, 135, 30])} stroke={INK} strokeWidth={14} />
          {[...Array(7)].map((_, i) => (
            <circle key={i} cx={-60 + (i % 3) * 55} cy={-300 + i * 95} r={8} fill={cor([230, 205, 120], [170, 95, 20])} />
          ))}
        </g>
      )}
      {vapor &&
        [...Array(8)].map((_, i) => {
          const t = ((f + i * 9) % 60) / 60;
          const x = 400 + (i % 4) * 90 + Math.sin(t * 6 + i) * 20;
          return <path key={i} d={`M ${x} ${200 - t * 160} q 20 -30 0 -60 q -20 -30 0 -60`} stroke="#ffffff" strokeWidth={14} strokeLinecap="round" fill="none" opacity={interpolate(t, [0, 0.3, 1], [0, 0.9, 0])} />;
        })}
    </svg>
  );
};


const Texto: React.FC<{children: React.ReactNode; top: number; cor?: string; tam?: number; rot?: number}> = ({children, top, cor = INK, tam = 80, rot = 0}) => (
  <div style={{position: 'absolute', top, width: '100%', textAlign: 'center', fontFamily: FONTE, fontWeight: 800, fontSize: tam, color: cor, transform: `rotate(${rot}deg)`, WebkitTextStroke: cor === INK ? undefined : '5px #1b1b1f', paintOrder: 'stroke fill'}}>
    {children}
  </div>
);

const Riscado: React.FC<{x: number; y: number; r?: number}> = ({x, y, r = 170}) => {
  const f = useCurrentFrame();
  const s = spring({frame: f - 12, fps: FPS, config: {damping: 10}});
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke="#e8222b" strokeWidth={30} strokeLinecap="round" fill="none">
      <circle r={r} />
      <path d={`M ${-r * 0.7} ${-r * 0.7} L ${r * 0.7} ${r * 0.7}`} />
    </g>
  );
};

// Cada tomada é uma cena curta num lugar diferente. f = frame dentro da tomada.
const TomadaVisual: React.FC<{visual: string; falando: boolean; dur: number}> = ({visual, falando, dur}) => {
  const f = useCurrentFrame();
  const prog = f / Math.max(1, dur * FPS);
  const tela = true;
  switch (visual) {
    case 'cozinha-queda': {
      const queda = interpolate(f, [0, 22], [-200, 900], {extrapolateRight: 'clamp'});
      return (
        <>
          <Cozinha />
          <div style={{position: 'absolute', top: 720, left: 140, width: 800, height: 850}}>
            <AirFryerFora abre={interpolate(f, [0, 16, 26, 36], [0, 1, 1, 0], {extrapolateRight: 'clamp'})} />
          </div>
          {f < 26 && <ZeSvg tela x={540} y={queda} scale={0.9} pose="scared" falando rot={f * 14} />}
          {f >= 26 && <Selo texto="SOCORRO!" cor="#e8222b" atraso={26} />}
        </>
      );
    }
    case 'dentro-assustado':
      return (
        <>
          <Escuro />
          <Palco>
            <AirFryerCorte calor={0.4} ventilador={0.3} fluxo={0.3} />
          </Palco>
          <ZeSvg tela x={540} y={900} scale={1.6} pose="scared" falando={falando} />
        </>
      );
    case 'frigideira':
      return (
        <>
          <Cozinha />
          <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <ellipse cx={540} cy={1000} rx={300} ry={90} fill="#2d2f36" stroke={INK} strokeWidth={14} />
            <ellipse cx={540} cy={990} rx={250} ry={60} fill="#f2c94c" />
            <rect x={830} y={975} width={240} height={40} rx={20} fill={INK} />
            <Riscado x={540} y={980} r={260} />
          </svg>
          <ZeSvg tela x={220} y={1150} scale={1} pose="point" falando={falando} />
          <Selo texto="NÃO É FRITURA" cor="#e8222b" atraso={8} />
        </>
      );
    case 'forninho-turbo': {
      const chama = 1 + Math.sin(f / 2) * 0.15;
      return (
        <>
          <Neutro />
          <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <path d={`M 160 1000 Q 60 1000 ${60 - 40 * chama} 950 Q 90 1040 ${20 - 30 * chama} 1060 Q 100 1080 160 1060 Z`} fill="#ff6b3d" />
            <rect x={160} y={760} width={760} height={460} rx={40} fill="#d9dde3" stroke={INK} strokeWidth={14} />
            <rect x={210} y={820} width={500} height={340} rx={24} fill="#ffb347" stroke={INK} strokeWidth={10} />
            {[0, 1, 2].map((i) => <circle key={i} cx={810} cy={860 + i * 100} r={34} fill="#5b6370" stroke={INK} strokeWidth={8} />)}
          </svg>
          <ZeSvg tela x={540} y={1440} scale={0.9} pose="wave" falando={falando} />
          <Selo texto="FORNINHO TURBINADO" atraso={6} />
        </>
      );
    }
    case 'chuveiro':
      return (
        <>
          <Banheiro />
          <ZeSvg tela x={600} y={1000} scale={1.4} pose="sweat" falando={falando} olhar={1} />
          <Selo texto="IGUAL CHUVEIRO" cor="#3d8bff" atraso={8} />
        </>
      );
    case 'resistencia':
      return (
        <>
          <Escuro />
          <Palco>
            <AirFryerCorte calor={interpolate(f, [0, 40], [0.2, 1], {extrapolateRight: 'clamp'})} />
            <Termometro />
          </Palco>
          <ZeSvg tela x={540} y={1000} scale={1.2} pose="sweat" falando={falando} />
          <Selo texto="200°C" cor="#e8222b" atraso={4} />
        </>
      );
    case 'tunel-vento':
      return (
        <>
          <TunelVento />
          <ZeSvg tela x={540 + Math.sin(f / 2) * 14} y={1330} scale={1.1} pose="hold" falando={falando} rot={-12 + Math.sin(f / 3) * 4} />
          <Selo texto="VENTILADOR" cor="#3d8bff" atraso={6} />
        </>
      );
    case 'fluxo-desce':
      return (
        <>
          <Escuro />
          <Palco>
            <AirFryerCorte calor={1} ventilador={1} fluxo={0.8} />
          </Palco>
          <ZeSvg tela x={540} y={1010} scale={1.1} pose="hold" falando={falando} />
        </>
      );
    case 'furacao-dentro': {
      const a = f / 12;
      return (
        <>
          <Escuro />
          <Palco>
            <AirFryerCorte calor={1} ventilador={1} fluxo={1} />
            <ZeSvg x={540 + Math.cos(a) * 300} y={520 + Math.sin(a) * 280} scale={0.6} pose="scared" falando={falando} rot={f * 10} />
          </Palco>
        </>
      );
    }
    case 'tornado': {
      const a = f / 8;
      return (
        <>
          <Tornado />
          <ZeSvg tela x={540 + Math.cos(a) * 280} y={900 + Math.sin(a) * 120 - f * 3} scale={0.8} pose="scared" falando={falando} rot={f * 12} />
          <Selo texto="FURACÃO DE CALOR" atraso={6} />
        </>
      );
    }
    case 'deserto': {
      const agua = interpolate(prog, [0, 0.9], [1, 0], {extrapolateRight: 'clamp'});
      return (
        <>
          <Deserto />
          <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <rect x={560} y={760} width={170} height={560} rx={40} fill="#f7e09a" stroke={INK} strokeWidth={12} transform="rotate(8 645 1040)" />
            {[0, 1, 2, 3].map((i) => (
              <path key={i} transform={`translate(${590 + (i % 2) * 70} ${860 + i * 110}) scale(${agua})`} d="M 0 -26 Q 18 4 0 18 Q -18 4 0 -26 Z" fill="#4aa8ff" stroke={INK} strokeWidth={4} />
            ))}
          </svg>
          <ZeSvg tela x={300} y={1150} scale={1} pose="sweat" falando={falando} olhar={1} />
          <Selo texto="SECA A SUPERFÍCIE" cor="#ff9d00" atraso={6} />
        </>
      );
    }
    case 'padaria': {
      const d = interpolate(prog, [0, 0.8], [0, 1], {extrapolateRight: 'clamp'});
      const cor = `rgb(${Math.round(245 - 60 * d)},${Math.round(215 - 95 * d)},${Math.round(150 - 110 * d)})`;
      return (
        <>
          <Padaria />
          <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <ellipse cx={330} cy={1230} rx={200} ry={110} fill={cor} stroke={INK} strokeWidth={12} />
            <path d="M 220 1200 Q 260 1170 300 1200 M 320 1190 Q 360 1160 400 1190" stroke={INK} strokeWidth={8} fill="none" />
            <path d="M 600 1180 Q 720 1100 860 1170 Q 940 1260 820 1310 Q 680 1340 610 1280 Q 560 1230 600 1180 Z" fill={`rgb(${Math.round(220 - 100 * d)},${Math.round(110 - 50 * d)},${Math.round(100 - 70 * d)})`} stroke={INK} strokeWidth={12} />
          </svg>
          <ZeSvg tela x={540} y={1530} scale={0.75} pose="point" falando={falando} />
          <Selo texto="REAÇÃO DE MAILLARD" cor="#d4871e" atraso={6} />
        </>
      );
    }
    case 'mordida': {
      const crunch = spring({frame: f - 14, fps: FPS, config: {damping: 7}});
      return (
        <>
          <Neutro />
          <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <rect x={600} y={700} width={190} height={720} rx={44} fill="#d4871e" stroke={INK} strokeWidth={14} transform="rotate(-20 695 1060)" />
          </svg>
          <ZeSvg tela x={360} y={1150} scale={1.3} pose="hold" falando={falando} olhar={1} />
          <div style={{position: 'absolute', top: 640, right: 60, transform: `scale(${crunch}) rotate(10deg)`, fontFamily: FONTE, fontWeight: 800, fontSize: 150, color: '#ffd23f', WebkitTextStroke: '8px #1b1b1f', paintOrder: 'stroke fill'}}>CROC!</div>
        </>
      );
    }
    case 'corte-batata':
      return (
        <>
          <Neutro />
          <Palco>
            <BatataGrande douradura={1} cortada />
          </Palco>
          <Texto top={640} cor="#d4871e">CASCA CROCANTE</Texto>
          <Texto top={950}>macia por dentro</Texto>
          <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <g transform="translate(860 1320)">
              <path d="M 0 -70 Q 52 0 0 40 Q -52 0 0 -70 Z" fill="#f2c94c" stroke={INK} strokeWidth={8} />
            </g>
            <Riscado x={860} y={1310} r={95} />
          </svg>
          <Texto top={1400} tam={60} rot={-4}>quase sem óleo</Texto>
        </>
      );
    case 'elevador': {
      const aperta = Math.sin(f / 3) * 6;
      return (
        <>
          <Elevador />
          <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            {Array.from({length: 9}).map((_, i) => (
              <g key={i} transform={`translate(${170 + (i % 5) * 185 + (i > 4 ? 90 : 0)} ${i > 4 ? 900 : 1150}) rotate(${((i * 37) % 30) - 15 + aperta})`}>
                <rect x={-55} y={-230} width={110} height={460} rx={30} fill="#f7e09a" stroke={INK} strokeWidth={10} />
                <circle cx={-18} cy={-140} r={10} fill={INK} />
                <circle cx={18} cy={-140} r={10} fill={INK} />
                <path d="M -20 -100 Q 0 -110 20 -100" stroke={INK} strokeWidth={7} fill="none" />
              </g>
            ))}
          </svg>
          <ZeSvg tela x={540 + aperta} y={1180} scale={1} pose="squeezed" falando={falando} />
          <Selo texto="NÃO LOTE O CESTO" cor="#e8222b" atraso={6} />
        </>
      );
    }
    case 'cesto-cheio':
      return (
        <>
          <Escuro />
          <Palco>
            <AirFryerCorte calor={1} ventilador={1} fluxo={1} cheio bloqueado={prog > 0.15} />
          </Palco>
          <Selo texto="O AR NÃO PASSA" cor="#e8222b" atraso={6} />
        </>
      );
    case 'sacudir': {
      const s = Math.sin(f / 2) * 30;
      return (
        <>
          <Cozinha />
          <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <g transform={`translate(${620 + s} ${1050}) rotate(${s / 3})`}>
              <path d="M -200 -40 L 200 -40 L 170 220 L -170 220 Z" fill="#2d2f36" stroke={INK} strokeWidth={12} />
              <rect x={200} y={-30} width={200} height={50} rx={25} fill={INK} />
              {Array.from({length: 7}).map((_, i) => (
                <rect key={i} x={-150 + i * 45} y={-90 - Math.abs(Math.sin(f / 2 + i)) * 60} width={34} height={120} rx={8} fill="#d4871e" stroke={INK} strokeWidth={6} transform={`rotate(${i * 13 - 30} ${-133 + i * 45} -30)`} />
              ))}
            </g>
          </svg>
          <ZeSvg tela x={240} y={1100} scale={1} pose="point" falando={falando} olhar={1} />
          <Selo texto="SACODE NA METADE!" cor="#22b573" atraso={6} />
        </>
      );
    }
    case 'tchau':
      return (
        <>
          <Neutro />
          <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <rect x={640} y={720} width={300} height={300} rx={30} fill="#3d8bff" stroke={INK} strokeWidth={12} transform={`rotate(${Math.sin(f / 5) * 6} 790 870)`} />
            <text x={790} y={930} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={200} fill="#fff" stroke={INK} strokeWidth={6}>?</text>
          </svg>
          <ZeSvg tela x={330} y={1080} scale={1.3} pose="wave" falando={falando} />
          {prog > 0.3 && <Selo texto="SEGUE PRA PARTE 2 👉" cor="#22b573" atraso={Math.round(dur * FPS * 0.3)} />}
        </>
      );
  }
  return <Neutro />;
};

const TomadaComCamera: React.FC<{visual: string; palavras: Palavra[]; offset: number; dur: number}> = ({visual, palavras, offset, dur}) => {
  const f = useCurrentFrame();
  const t = f / FPS + offset;
  const falando = palavras.some((p) => t >= p.inicio && t <= p.fim);
  const entra = spring({frame: f, fps: FPS, config: {damping: 16, stiffness: 180}});
  const zoom = 1.12 - entra * 0.12 + (f / (dur * FPS)) * 0.05; // corte com "punch-in" e leve aproximação
  const flash = interpolate(f, [0, 3], [0.55, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        <TomadaVisual visual={visual} falando={falando} dur={dur} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

const Cena: React.FC<{tomadas: Tomada[]; palavras: Palavra[]; dur: number}> = ({tomadas, palavras, dur}) => {
  const inicios = tomadas.map((tm, i) => (i === 0 ? 0 : (palavras[tm.aPartirDaPalavra]?.inicio ?? dur / 2) - 0.08));
  return (
    <>
      {tomadas.map((tm, i) => {
        const ini = inicios[i];
        const fim = i === tomadas.length - 1 ? dur : inicios[i + 1];
        const de = Math.round(ini * FPS);
        const d = Math.max(1, Math.round(fim * FPS) - de);
        return (
          <Sequence key={i} from={de} durationInFrames={d} layout="none">
            <TomadaComCamera visual={tm.visual} palavras={palavras} offset={ini} dur={fim - ini} />
          </Sequence>
        );
      })}
    </>
  );
};

export const Video: React.FC<VideoProps> = ({roteiro, timings, comAudio}) => {
  const {durationInFrames} = useVideoConfig();
  const f = useCurrentFrame();
  let inicio = 0;
  return (
    <AbsoluteFill style={{background: '#ffc46b'}}>
      {roteiro.cenas.map((c) => {
        const tm = timings.cenas.find((x) => x.id === c.id)!;
        const de = Math.round(inicio * FPS);
        const dur = Math.round(tm.duracao * FPS);
        inicio += tm.duracao;
        return (
          <Sequence key={c.id} from={de} durationInFrames={dur}>
            <Cena tomadas={c.tomadas} palavras={tm.palavras} dur={tm.duracao} />
            <Legenda palavras={tm.palavras} />
            {comAudio && <Audio src={staticFile(`audio/${roteiro.id}/${c.id}.mp3`)} />}
          </Sequence>
        );
      })}
      {/* marca do perfil fixa no topo */}
      <div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{background: INK, color: '#ffd23f', fontFamily: FONTE, fontWeight: 800, fontSize: 60, padding: '6px 36px', borderRadius: 24, boxShadow: '0 8px 0 rgba(0,0,0,0.25)'}}>COMO FUNCIONA?</div>
      </div>
      <div style={{position: 'absolute', bottom: 0, left: 0, height: 16, width: `${(f / durationInFrames) * 100}%`, background: '#e8222b'}} />
    </AbsoluteFill>
  );
};
