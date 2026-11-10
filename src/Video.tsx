import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Ze, Pose} from './Ze';
import {AirFryerCorte, AirFryerFora} from './AirFryer';
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
export type Roteiro = {id: string; titulo: string; cenas: {id: string; visual: string; texto: string}[]};

export type VideoProps = {roteiro: Roteiro; timings: Timings; comAudio: boolean};

const Legenda: React.FC<{palavras: Palavra[]}> = ({palavras}) => {
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
    <div style={{position: 'absolute', top: 1520, width: '100%', textAlign: 'center', transform: `scale(${0.85 + pop * 0.15})`}}>
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

const ZeSvg: React.FC<{x: number; y: number; scale?: number; pose?: Pose; falando: boolean; rot?: number}> = (p) => (
  <svg viewBox="0 0 1080 1150" width={1080} height={1150} style={{position: 'absolute', top: 0, left: 0}}>
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

const Cena: React.FC<{visual: string; palavras: Palavra[]; dur: number}> = ({visual, palavras, dur}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const falando = palavras.some((p) => t >= p.inicio && t <= p.fim);
  const entra = spring({frame: f, fps: FPS, config: {damping: 14}});
  const prog = f / (dur * FPS);

  let conteudo: React.ReactNode = null;
  switch (visual) {
    case 'gancho': {
      const queda = interpolate(f, [0, 25], [-500, 330], {extrapolateRight: 'clamp'});
      const dentro = f > 28;
      conteudo = (
        <>
          <Palco>
            <AirFryerFora abre={interpolate(f, [0, 20, 30, 40], [0, 1, 1, 0], {extrapolateRight: 'clamp'})} />
            {!dentro && <ZeSvg x={540} y={queda} scale={0.8} pose="scared" falando rot={f * 12} />}
          </Palco>
          {dentro && <Selo texto="SOCORRO!" cor="#e8222b" atraso={30} />}
        </>
      );
      if (f > 60) {
        conteudo = (
          <>
            <Palco>
              <AirFryerCorte calor={0.4} ventilador={0.3} fluxo={0.3} />
              <ZeSvg x={540} y={380} scale={0.95} pose="scared" falando={falando} />
            </Palco>
          </>
        );
      }
      break;
    }
    case 'forninho':
      conteudo = (
        <>
          <Palco>
            <AirFryerCorte calor={0.3} ventilador={0.2} />
            <ZeSvg x={540} y={380} scale={0.95} pose="point" falando={falando} />
          </Palco>
          <Selo texto="FORNINHO TURBINADO" atraso={25} />
        </>
      );
      break;
    case 'resistencia':
      conteudo = (
        <>
          <Palco>
            <AirFryerCorte calor={interpolate(f, [5, 60], [0, 1], {extrapolateRight: 'clamp'})} />
            <ZeSvg x={540} y={380} scale={0.95} pose="sweat" falando={falando} />
            <Termometro />
          </Palco>
          <Selo texto="RESISTÊNCIA" cor="#e8222b" atraso={8} y={-10} />
        </>
      );
      break;
    case 'ventilador':
      conteudo = (
        <>
          <Palco>
            <AirFryerCorte calor={1} ventilador={interpolate(f, [0, 40], [0.1, 1], {extrapolateRight: 'clamp'})} fluxo={interpolate(f, [20, 60], [0, 0.6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
            <ZeSvg x={540 + Math.sin(f / 3) * 8} y={390} scale={0.95} pose="hold" falando={falando} />
          </Palco>
          <Selo texto="VENTILADOR" cor="#3d8bff" atraso={8} />
        </>
      );
      break;
    case 'furacao': {
      const a = f / 14;
      conteudo = (
        <>
          <Palco>
            <AirFryerCorte calor={1} ventilador={1} fluxo={1} />
            <ZeSvg x={540 + Math.cos(a) * 300} y={520 + Math.sin(a) * 280} scale={0.55} pose="scared" falando={falando} rot={f * 9} />
          </Palco>
          <Selo texto="FURACÃO DE CALOR" atraso={15} />
        </>
      );
      break;
    }
    case 'maillard':
      conteudo = (
        <>
          <Palco>
            <BatataGrande douradura={interpolate(prog, [0.35, 0.9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} vapor={prog < 0.5} />
            <ZeSvg x={250} y={700} scale={0.6} pose="point" falando={falando} />
          </Palco>
          {prog > 0.4 && <Selo texto="REAÇÃO DE MAILLARD" cor="#d4871e" atraso={Math.round(dur * FPS * 0.4)} />}
        </>
      );
      break;
    case 'crocante':
      conteudo = (
        <>
          <Palco>
            <BatataGrande douradura={1} cortada />
            <ZeSvg x={860} y={760} scale={0.75} pose="point" falando={falando} rot={-8} />
            <div style={{position: 'absolute', top: 250, width: '100%', textAlign: 'center', fontFamily: FONTE, fontWeight: 800, fontSize: 80, color: '#d4871e', WebkitTextStroke: '4px #1b1b1f', paintOrder: 'stroke fill'}}>CASCA CROCANTE ⬇</div>
            <div style={{position: 'absolute', top: 505, width: '100%', textAlign: 'center', fontFamily: FONTE, fontWeight: 800, fontSize: 80, color: INK}}>macia por dentro</div>
          </Palco>
        </>
      );
      break;
    case 'cheio':
      conteudo = (
        <>
          <Palco>
            <AirFryerCorte calor={1} ventilador={1} fluxo={1} cheio bloqueado={prog > 0.3} />
            <ZeSvg x={540} y={470} scale={0.8} pose="squeezed" falando={falando} />
          </Palco>
          <Selo texto="NÃO LOTE O CESTO" cor="#e8222b" atraso={12} />
        </>
      );
      break;
    case 'final': {
      const sacode = Math.sin(f / 2.5) * interpolate(prog, [0, 0.4, 0.5], [18, 18, 0], {extrapolateRight: 'clamp'});
      conteudo = (
        <>
          <Palco>
            <div style={{position: 'absolute', inset: 0, transform: `translateX(${sacode}px) rotate(${sacode / 6}deg)`}}>
              <AirFryerCorte calor={1} ventilador={1} fluxo={1} douradas={1} />
            </div>
            <ZeSvg x={540} y={390} scale={0.95} pose="wave" falando={falando} />
          </Palco>
          {prog > 0.5 && <Selo texto="SEGUE PRA PARTE 2 👉" cor="#22b573" atraso={Math.round(dur * FPS * 0.5)} />}
        </>
      );
      break;
    }
  }

  return <AbsoluteFill style={{transform: `scale(${0.92 + entra * 0.08})`}}>{conteudo}</AbsoluteFill>;
};

export const Video: React.FC<VideoProps> = ({roteiro, timings, comAudio}) => {
  const {durationInFrames} = useVideoConfig();
  const f = useCurrentFrame();
  let inicio = 0;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #ffe7a8 0%, #ffc46b 100%)'}}>
      {/* topo fixo: marca do perfil */}
      <div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{background: INK, color: '#ffd23f', fontFamily: FONTE, fontWeight: 800, fontSize: 64, padding: '8px 40px', borderRadius: 24}}>COMO FUNCIONA?</div>
      </div>
      <div style={{position: 'absolute', top: 250, width: '100%', textAlign: 'center', fontFamily: FONTE, fontWeight: 800, fontSize: 56, color: INK}}>{roteiro.titulo}</div>
      {roteiro.cenas.map((c) => {
        const tm = timings.cenas.find((x) => x.id === c.id)!;
        const de = Math.round(inicio * FPS);
        const dur = Math.round(tm.duracao * FPS);
        inicio += tm.duracao;
        return (
          <Sequence key={c.id} from={de} durationInFrames={dur}>
            <Cena visual={c.visual} palavras={tm.palavras} dur={tm.duracao} />
            <Legenda palavras={tm.palavras} />
            {comAudio && <Audio src={staticFile(`audio/${roteiro.id}/${c.id}.mp3`)} />}
          </Sequence>
        );
      })}
      {/* barra de progresso */}
      <div style={{position: 'absolute', bottom: 0, left: 0, height: 16, width: `${(f / durationInFrames) * 100}%`, background: '#e8222b'}} />
    </AbsoluteFill>
  );
};
