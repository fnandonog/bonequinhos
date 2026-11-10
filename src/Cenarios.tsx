import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

// Fundos de tela cheia (1080 x 1920). Cada trecho do roteiro acontece num lugar diferente.
const INK = '#1b1b1f';
const W = 1080;
const H = 1920;

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0}}>
    {children}
  </svg>
);

export const Cozinha: React.FC = () => (
  <Svg>
    <rect width={W} height={H} fill="#fff1d6" />
    {/* azulejos */}
    {Array.from({length: 9}).map((_, r) =>
      Array.from({length: 7}).map((_, c) => (
        <rect key={`${r}-${c}`} x={c * 160 - 20} y={420 + r * 110} width={150} height={100} rx={8} fill="#e9f4f1" stroke="#cfe3de" strokeWidth={4} />
      )),
    )}
    {/* janela */}
    <rect x={640} y={470} width={330} height={300} rx={20} fill="#9fd8ff" stroke={INK} strokeWidth={12} />
    <path d="M 805 470 L 805 770 M 640 620 L 970 620" stroke={INK} strokeWidth={10} />
    <circle cx={720} cy={540} r={40} fill="#ffe066" />
    {/* bancada */}
    <rect x={0} y={1380} width={W} height={60} fill="#b7794a" stroke={INK} strokeWidth={10} />
    <rect x={0} y={1440} width={W} height={480} fill="#8d5a34" />
    {[0, 1, 2].map((i) => (
      <rect key={i} x={40 + i * 350} y={1480} width={300} height={360} rx={16} fill="#a56b40" stroke={INK} strokeWidth={8} />
    ))}
  </Svg>
);

export const Banheiro: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Svg>
      <rect width={W} height={H} fill="#dff3ff" />
      {Array.from({length: 14}).map((_, r) =>
        Array.from({length: 8}).map((_, c) => (
          <rect key={`${r}-${c}`} x={c * 140} y={300 + r * 120} width={136} height={116} fill="#f6fbff" stroke="#bfe0f2" strokeWidth={4} />
        )),
      )}
      {/* chuveiro */}
      <path d="M 540 330 L 540 450 L 700 450" stroke="#9aa3ad" strokeWidth={26} fill="none" strokeLinecap="round" />
      <path d="M 610 450 L 790 450 L 760 520 L 640 520 Z" fill="#c7ccd6" stroke={INK} strokeWidth={10} />
      {/* água */}
      {Array.from({length: 14}).map((_, i) => {
        const t = ((f * 2 + i * 23) % 60) / 60;
        return <line key={i} x1={650 + (i % 7) * 18} y1={540 + t * 700} x2={640 + (i % 7) * 18} y2={590 + t * 700} stroke="#4aa8ff" strokeWidth={8} strokeLinecap="round" opacity={0.8} />;
      })}
      {/* vapor */}
      {Array.from({length: 6}).map((_, i) => {
        const t = ((f + i * 14) % 80) / 80;
        return <circle key={i} cx={300 + i * 110 + Math.sin(t * 6) * 30} cy={1200 - t * 700} r={60 + t * 50} fill="#fff" opacity={interpolate(t, [0, 0.3, 1], [0, 0.6, 0])} />;
      })}
      <rect x={0} y={1400} width={W} height={520} fill="#9fc9e0" />
    </Svg>
  );
};

export const TunelVento: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Svg>
      <rect width={W} height={H} fill="#cfe6ff" />
      {/* ventilador gigante */}
      <circle cx={540} cy={700} r={380} fill="#9aa3ad" stroke={INK} strokeWidth={16} />
      <circle cx={540} cy={700} r={330} fill="#5b6370" />
      <g transform={`translate(540 700) rotate(${f * 30})`}>
        {[0, 90, 180, 270].map((a) => (
          <path key={a} transform={`rotate(${a})`} d="M 0 0 Q 140 -70 300 0 Q 140 70 0 0 Z" fill="#dfe4ea" stroke={INK} strokeWidth={8} />
        ))}
        <circle r={50} fill="#3b414b" stroke={INK} strokeWidth={8} />
      </g>
      {[0, 120, 240].map((a) => (
        <path key={a} transform={`translate(540 700) rotate(${a})`} d="M -330 0 L 330 0" stroke="#3b414b" strokeWidth={10} />
      ))}
      {/* linhas de vento */}
      {Array.from({length: 10}).map((_, i) => {
        const t = ((f * 3 + i * 17) % 50) / 50;
        const y = 1100 + t * 500;
        return <path key={i} d={`M ${120 + i * 90} ${y} q 20 40 0 80`} stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" opacity={1 - t} />;
      })}
      <rect x={0} y={1650} width={W} height={270} fill="#8fa6bd" />
    </Svg>
  );
};

export const Tornado: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Svg>
      <defs>
        <linearGradient id="ceu" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ff8a3d" />
          <stop offset="1" stopColor="#ffd27a" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#ceu)" />
      {/* funil de ar quente */}
      {Array.from({length: 12}).map((_, i) => {
        const y = 380 + i * 95;
        const larg = 460 - i * 32;
        const dx = Math.sin(f / 6 + i * 0.6) * 30;
        return <ellipse key={i} cx={540 + dx} cy={y} rx={larg} ry={36} fill="none" stroke={i % 2 ? '#ff4d1a' : '#ffb347'} strokeWidth={22} opacity={0.9} />;
      })}
      <rect x={0} y={1560} width={W} height={360} fill="#d9a35b" />
    </Svg>
  );
};

export const Deserto: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Svg>
      <rect width={W} height={H} fill="#ffe2a1" />
      <g transform={`translate(820 520) rotate(${f * 1.5})`}>
        {Array.from({length: 12}).map((_, i) => (
          <rect key={i} transform={`rotate(${i * 30})`} x={-10} y={-200} width={20} height={60} rx={10} fill="#ff9d00" />
        ))}
      </g>
      <circle cx={820} cy={520} r={120} fill="#ffcc00" stroke={INK} strokeWidth={10} />
      <path d="M 0 1300 Q 270 1180 540 1300 T 1080 1280 L 1080 1920 L 0 1920 Z" fill="#f2b85c" stroke={INK} strokeWidth={10} />
      <path d="M 0 1480 Q 300 1400 620 1500 T 1080 1460 L 1080 1920 L 0 1920 Z" fill="#e39c3c" />
      {/* cacto */}
      <path d="M 170 1330 L 170 1050 M 170 1150 Q 100 1150 100 1080 M 170 1200 Q 240 1200 240 1120" stroke="#3aa25a" strokeWidth={46} strokeLinecap="round" fill="none" />
    </Svg>
  );
};

export const Padaria: React.FC = () => (
  <Svg>
    <rect width={W} height={H} fill="#fbe3c8" />
    {/* placa */}
    <rect x={240} y={420} width={600} height={130} rx={30} fill="#7a3e1d" stroke={INK} strokeWidth={10} />
    <text x={540} y={510} textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontWeight={800} fontSize={80} fill="#ffe2a1">PADARIA</text>
    {/* prateleiras com pães */}
    {[700, 900].map((y) => (
      <g key={y}>
        <rect x={60} y={y + 110} width={960} height={26} fill="#a0612f" stroke={INK} strokeWidth={8} />
        {[0, 1, 2, 3, 4].map((i) => (
          <ellipse key={i} cx={160 + i * 190} cy={y + 70} rx={80} ry={45} fill="#d58a35" stroke={INK} strokeWidth={8} />
        ))}
      </g>
    ))}
    <rect x={0} y={1380} width={W} height={540} fill="#c88a55" />
  </Svg>
);

export const Elevador: React.FC = () => (
  <Svg>
    <rect width={W} height={H} fill="#c9cdd4" />
    <rect x={90} y={380} width={900} height={1280} rx={20} fill="#e6e8ec" stroke={INK} strokeWidth={14} />
    <path d="M 540 380 L 540 1660" stroke="#9aa0aa" strokeWidth={8} />
    <rect x={430} y={300} width={220} height={70} rx={14} fill={INK} />
    <text x={540} y={352} textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontWeight={800} fontSize={54} fill="#ff4d4d">LOTADO</text>
    <rect x={0} y={1660} width={W} height={260} fill="#8a8f99" />
  </Svg>
);

export const Escuro: React.FC = () => (
  <Svg>
    <rect width={W} height={H} fill="#22242a" />
    <circle cx={540} cy={900} r={700} fill="#ff6b3d" opacity={0.12} />
  </Svg>
);

export const Neutro: React.FC = () => (
  <Svg>
    <defs>
      <linearGradient id="neutro" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ffe7a8" />
        <stop offset="1" stopColor="#ffc46b" />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#neutro)" />
  </Svg>
);
