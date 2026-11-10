import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

export type Pose = 'idle' | 'scared' | 'point' | 'wave' | 'sweat' | 'hold' | 'squeezed';

type Props = {
  x: number;
  y: number;
  scale?: number;
  pose?: Pose;
  falando?: boolean;
  rot?: number;
  olhar?: number; // -1 esquerda, 1 direita
};

const INK = '#1b1b1f';

// Zé: o bonequinho do perfil. Traço grosso, cabeça grande, olhos expressivos.
export const Ze: React.FC<Props> = ({x, y, scale = 1, pose = 'idle', falando = false, rot = 0, olhar = 0}) => {
  const f = useCurrentFrame();
  const respira = Math.sin(f / 8) * 3;
  const piscar = f % 90 > 84 ? 0.15 : 1;
  const boca = falando ? 6 + Math.abs(Math.sin(f / 2.2)) * 14 : 4;
  const tremor = pose === 'scared' || pose === 'squeezed' ? Math.sin(f * 2.3) * 4 : 0;

  const braco = (lado: 1 | -1): string => {
    const ombroX = 0;
    const ombroY = 40;
    let mx = lado * 45, my = 85, hx = lado * 60, hy = 140;
    if (pose === 'scared') { mx = lado * 60; my = 10; hx = lado * 75; hy = -40 + Math.sin(f / 3 + lado) * 10; }
    if (pose === 'point' && lado === 1) { mx = 60; my = 30; hx = 125; hy = 10; }
    if (pose === 'wave' && lado === 1) { const a = Math.sin(f / 4) * 25; mx = 55; my = 0; hx = 80 + a; hy = -60; }
    if (pose === 'sweat') { mx = lado * 50; my = 80; hx = lado * 30; hy = 120; }
    if (pose === 'hold') { mx = lado * 55; my = 10; hx = lado * 20; hy = -60; }
    if (pose === 'squeezed') { mx = lado * 30; my = 60; hx = lado * 10; hy = 90; }
    return `M ${ombroX} ${ombroY} Q ${mx} ${my} ${hx} ${hy}`;
  };

  const perna = (lado: 1 | -1): string => {
    const passo = pose === 'idle' ? Math.sin(f / 10) * 4 * lado : 0;
    return `M 0 150 Q ${lado * 25} 210 ${lado * 40 + passo} 270`;
  };

  return (
    <g transform={`translate(${x + tremor} ${y + respira}) rotate(${rot}) scale(${scale})`}>
      <ellipse cx={0} cy={285} rx={70} ry={12} fill="rgba(0,0,0,0.18)" />
      <g stroke={INK} strokeWidth={14} strokeLinecap="round" fill="none">
        <path d="M 0 30 L 0 150" />
        <path d={braco(1)} />
        <path d={braco(-1)} />
        <path d={perna(1)} />
        <path d={perna(-1)} />
      </g>
      {/* cabeça */}
      <circle cx={0} cy={-45} r={80} fill="#fffdf6" stroke={INK} strokeWidth={12} />
      {/* olhos */}
      {[-28, 28].map((ex) => (
        <g key={ex}>
          <ellipse cx={ex} cy={-55} rx={pose === 'scared' ? 20 : 16} ry={(pose === 'scared' ? 24 : 20) * piscar} fill="#fff" stroke={INK} strokeWidth={6} />
          <circle cx={ex + olhar * 6} cy={-53} r={pose === 'scared' ? 6 : 8} fill={INK} opacity={piscar > 0.5 ? 1 : 0} />
        </g>
      ))}
      {/* sobrancelhas */}
      <g stroke={INK} strokeWidth={7} strokeLinecap="round">
        <path d={pose === 'scared' || pose === 'squeezed' ? 'M -44 -92 L -14 -86' : 'M -44 -84 L -14 -88'} />
        <path d={pose === 'scared' || pose === 'squeezed' ? 'M 44 -92 L 14 -86' : 'M 44 -84 L 14 -88'} />
      </g>
      {/* boca */}
      {pose === 'scared' ? (
        <ellipse cx={0} cy={-5} rx={16} ry={10 + boca * 0.6} fill={INK} />
      ) : (
        <path d={`M -22 -12 Q 0 ${-12 + boca * 1.6} 22 -12 Z`} fill={INK} />
      )}
      {/* bochechas */}
      <circle cx={-52} cy={-22} r={10} fill="#ff9b8a" opacity={0.6} />
      <circle cx={52} cy={-22} r={10} fill="#ff9b8a" opacity={0.6} />
      {pose === 'sweat' && (
        <g fill="#5ab4ff" stroke={INK} strokeWidth={3}>
          {[0, 1].map((i) => {
            const t = ((f + i * 20) % 40) / 40;
            return <path key={i} transform={`translate(${i ? -95 : 92} ${-70 + t * 60}) scale(${1 - t * 0.4})`} d="M 0 -16 Q 12 4 0 12 Q -12 4 0 -16 Z" opacity={interpolate(t, [0, 0.8, 1], [1, 1, 0])} />;
          })}
        </g>
      )}
    </g>
  );
};
