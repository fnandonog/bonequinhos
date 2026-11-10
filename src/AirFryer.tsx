import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

const INK = '#1b1b1f';

type Props = {
  calor?: number; // 0..1 brilho da resistência
  ventilador?: number; // velocidade 0..1
  fluxo?: number; // 0..1 intensidade das partículas de ar
  cheio?: boolean;
  bloqueado?: boolean;
  douradas?: number; // 0..1 cor das batatas
};

// Corte da air fryer por dentro, viewBox 1080 x 1150
export const AirFryerCorte: React.FC<Props> = ({calor = 0, ventilador = 0, fluxo = 0, cheio = false, bloqueado = false, douradas = 0}) => {
  const f = useCurrentFrame();
  const angulo = f * 28 * ventilador;
  const corBatata = interpolate(douradas, [0, 1], [0, 1]);
  const mix = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * corBatata)).join(',')})`;
  const batata = mix([250, 232, 160], [222, 150, 40]);

  // caminho do ar: desce pelo centro, abre no fundo e sobe pelas laterais
  const pontos = (t: number, lado: 1 | -1) => {
    const p = t % 1;
    if (p < 0.4) return {x: 540 + lado * 40, y: 300 + (p / 0.4) * 620};
    if (p < 0.55) { const q = (p - 0.4) / 0.15; return {x: 540 + lado * (40 + q * 330), y: 920 + Math.sin(q * Math.PI) * 50}; }
    if (p < 0.9) { const q = (p - 0.55) / 0.35; return {x: 540 + lado * 370, y: 920 - q * 640}; }
    const q = (p - 0.9) / 0.1; return {x: 540 + lado * (370 - q * 330), y: 280};
  };

  const particulas = [] as React.ReactNode[];
  if (fluxo > 0) {
    const n = cheio && bloqueado ? 6 : 18;
    for (let i = 0; i < n; i++) {
      for (const lado of [1, -1] as const) {
        let t = (f / 70 + i / n) % 1;
        if (bloqueado) t = Math.min(t, 0.38);
        const {x, y} = pontos(t, lado);
        particulas.push(
          <circle key={`${i}${lado}`} cx={x} cy={y} r={11} fill={interpolate(t, [0, 0.5, 1], [1, 0.4, 0.8]) > 0.6 ? '#ff6b3d' : '#ffb347'} opacity={0.85 * fluxo} />,
        );
      }
    }
  }

  const fritas: React.ReactNode[] = [];
  const linhas = cheio ? 7 : 3;
  for (let r = 0; r < linhas; r++) {
    for (let c = 0; c < 6; c++) {
      const x = 330 + c * 75 + (r % 2) * 30;
      const y = 900 - r * 42;
      fritas.push(<rect key={`${r}-${c}`} x={x} y={y} width={36} height={110} rx={8} transform={`rotate(${((r * 7 + c * 13) % 40) - 20} ${x + 18} ${y + 55})`} fill={batata} stroke={INK} strokeWidth={6} />);
    }
  }

  return (
    <svg viewBox="0 0 1080 1150" width="100%" height="100%">
      {/* corpo */}
      <rect x={110} y={60} width={860} height={1040} rx={110} fill="#2d2f36" stroke={INK} strokeWidth={14} />
      <rect x={150} y={110} width={780} height={940} rx={80} fill="#43464f" />
      {/* ventilador */}
      <g transform={`translate(540 170) rotate(${angulo})`}>
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} transform={`rotate(${a})`} d="M 0 0 Q 50 -20 95 0 Q 50 22 0 0 Z" fill="#c7ccd6" stroke={INK} strokeWidth={5} />
        ))}
        <circle r={20} fill="#8a909c" stroke={INK} strokeWidth={5} />
      </g>
      {/* resistência */}
      <path
        d="M 250 275 Q 290 245 330 275 Q 370 305 410 275 Q 450 245 490 275 Q 530 305 570 275 Q 610 245 650 275 Q 690 305 730 275 Q 770 245 810 275 Q 850 305 830 275"
        fill="none"
        stroke={`rgb(${Math.round(110 + 145 * calor)},${Math.round(110 - 40 * calor)},${Math.round(110 - 80 * calor)})`}
        strokeWidth={18}
        strokeLinecap="round"
        style={{filter: calor > 0.2 ? `drop-shadow(0 0 ${20 * calor}px #ff4d1a)` : undefined}}
      />
      {/* cesto */}
      <path d="M 280 620 L 800 620 L 770 1010 L 310 1010 Z" fill="#1f2126" stroke={INK} strokeWidth={10} />
      {Array.from({length: 6}).map((_, i) => (
        <circle key={i} cx={360 + i * 72} cy={990} r={9} fill="#0e0f12" />
      ))}
      {fritas}
      {particulas}
      {bloqueado && (
        <g transform="translate(540 560)" stroke="#e8222b" strokeWidth={26} strokeLinecap="round">
          <path d="M -70 -70 L 70 70" />
          <path d="M 70 -70 L -70 70" />
        </g>
      )}
    </svg>
  );
};

// Air fryer vista de fora (gancho)
export const AirFryerFora: React.FC<{abre: number}> = ({abre}) => (
  <svg viewBox="0 0 1080 1150" width="100%" height="100%">
    <ellipse cx={540} cy={1090} rx={380} ry={36} fill="rgba(0,0,0,0.2)" />
    <rect x={200} y={180} width={680} height={900} rx={150} fill="#2d2f36" stroke={INK} strokeWidth={14} />
    <rect x={330} y={260} width={420} height={170} rx={40} fill="#14161a" stroke={INK} strokeWidth={8} />
    <text x={540} y={370} textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontWeight={800} fontSize={90} fill="#ff6b3d">200°</text>
    <g transform={`translate(0 ${abre * 120})`}>
      <rect x={240} y={560} width={600} height={460} rx={90} fill="#3a3d45" stroke={INK} strokeWidth={12} />
      <rect x={470} y={600} width={140} height={60} rx={30} fill="#1b1b1f" />
    </g>
  </svg>
);
