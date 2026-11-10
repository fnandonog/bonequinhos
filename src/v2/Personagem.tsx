import React from 'react';
import {useCurrentFrame} from 'remotion';

// Personagem em cartoon vetorial: cabeça redonda, bochecha rosada, contorno grosso, roupa.
export const LINHA = '#2b2233';
const L = 8;

export type Expressao = 'feliz' | 'neutro' | 'cansado' | 'assustado' | 'bravo' | 'dormindo' | 'tonto' | 'boquiaberto';
export type PoseV2 = 'idle' | 'tchau' | 'aponta' | 'segura' | 'cabeca' | 'volante' | 'come' | 'celular' | 'bracos-abertos' | 'treme';

export type Visual = {pele?: string; camisa?: string; calca?: string; cabelo?: string; sapato?: string; cabeloTipo?: 'topete' | 'curto' | 'longo' | 'careca'};

export const ZE: Visual = {pele: '#ffd2ad', camisa: '#4f8cff', calca: '#30406b', cabelo: '#3b2a20', sapato: '#2b2233', cabeloTipo: 'topete'};

type Props = Visual & {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  pose?: PoseV2;
  expr?: Expressao;
  falando?: boolean;
  sono?: number; // 0..1 olheiras e pálpebras caídas
  olhar?: number; // -1..1
  semPernas?: boolean;
  bagunca?: number; // cabelo desarrumado 0..1
};

const Braco: React.FC<{de: [number, number]; cot: [number, number]; mao: [number, number]; pele: string; camisa: string}> = ({de, cot, mao, pele, camisa}) => {
  const d = `M ${de[0]} ${de[1]} Q ${cot[0]} ${cot[1]} ${mao[0]} ${mao[1]}`;
  const mx = de[0] + (cot[0] - de[0]) * 0.55;
  const my = de[1] + (cot[1] - de[1]) * 0.55;
  return (
    <g strokeLinecap="round" fill="none">
      <path d={d} stroke={LINHA} strokeWidth={30 + L * 2} />
      <path d={d} stroke={pele} strokeWidth={30} />
      <path d={`M ${de[0]} ${de[1]} L ${mx} ${my}`} stroke={LINHA} strokeWidth={40 + L * 2} />
      <path d={`M ${de[0]} ${de[1]} L ${mx} ${my}`} stroke={camisa} strokeWidth={40} />
      <circle cx={mao[0]} cy={mao[1]} r={21} fill={pele} stroke={LINHA} strokeWidth={L} />
    </g>
  );
};

export const Personagem: React.FC<Props> = (p) => {
  const f = useCurrentFrame();
  const {pele = ZE.pele!, camisa = ZE.camisa!, calca = ZE.calca!, cabelo = ZE.cabelo!, sapato = ZE.sapato!, cabeloTipo = 'topete'} = p;
  const pose = p.pose ?? 'idle';
  const expr = p.expr ?? 'neutro';
  const sono = p.sono ?? 0;
  const s = p.s ?? 1;
  const bob = Math.sin(f / 9) * 4;
  const piscaBase = f % 75 > 71;
  const pisca = piscaBase || expr === 'dormindo';
  const treme = pose === 'treme' || expr === 'assustado' ? Math.sin(f * 2.1) * 3 : 0;
  const tronco = -175;
  const ombroE: [number, number] = [-68, tronco + 22];
  const ombroD: [number, number] = [68, tronco + 22];
  const t = f / 5;

  // posição de cotovelos e mãos por pose
  let bE: {c: [number, number]; m: [number, number]} = {c: [-95, -60], m: [-85, 20]};
  let bD: {c: [number, number]; m: [number, number]} = {c: [95, -60], m: [85, 20]};
  if (pose === 'tchau') bD = {c: [150, -170], m: [150 + Math.sin(t) * 25, -290]};
  if (pose === 'aponta') bD = {c: [150, -150], m: [230, -170]};
  if (pose === 'segura') { bE = {c: [-110, -80], m: [-40, -60]}; bD = {c: [110, -80], m: [40, -60]}; }
  if (pose === 'cabeca') { bE = {c: [-160, -200], m: [-80, -330]}; bD = {c: [160, -200], m: [80, -330]}; }
  if (pose === 'volante') { bE = {c: [-110, -70], m: [-70, -110]}; bD = {c: [110, -70], m: [70, -110]}; }
  if (pose === 'come') bD = {c: [120, -90], m: [35, -205 + Math.abs(Math.sin(t * 1.5)) * 18]};
  if (pose === 'celular') { bE = {c: [-100, -60], m: [-25, -95]}; bD = {c: [100, -60], m: [25, -95]}; }
  if (pose === 'bracos-abertos') { bE = {c: [-150, -150], m: [-220, -230]}; bD = {c: [150, -150], m: [220, -230]}; }
  if (pose === 'treme') { bE = {c: [-100, -60], m: [-80 + treme, 15]}; bD = {c: [100, -60], m: [80 - treme, 15]}; }

  const cab = -330 + bob * 0.5;
  // boca
  const abre = p.falando ? 6 + Math.abs(Math.sin(f / 2.3)) * 16 : 0;
  let boca: React.ReactNode;
  if (expr === 'assustado' || expr === 'boquiaberto') boca = <ellipse cx={0} cy={cab + 48} rx={18} ry={16 + abre * 0.5} fill="#5a1f2b" stroke={LINHA} strokeWidth={6} />;
  else if (expr === 'feliz') boca = <path d={`M -30 ${cab + 36} Q 0 ${cab + 72 + abre} 30 ${cab + 36} Z`} fill="#5a1f2b" stroke={LINHA} strokeWidth={6} strokeLinejoin="round" />;
  else if (expr === 'bravo' || expr === 'cansado') boca = abre > 4 ? <ellipse cx={0} cy={cab + 50} rx={16} ry={4 + abre * 0.6} fill="#5a1f2b" stroke={LINHA} strokeWidth={6} /> : <path d={`M -22 ${cab + 54} Q 0 ${cab + 42} 22 ${cab + 54}`} stroke={LINHA} strokeWidth={7} fill="none" strokeLinecap="round" />;
  else if (expr === 'dormindo') boca = <ellipse cx={4} cy={cab + 50} rx={8} ry={6 + Math.sin(f / 10) * 3} fill="#5a1f2b" />;
  else boca = abre > 4 ? <ellipse cx={0} cy={cab + 46} rx={18} ry={abre * 0.7} fill="#5a1f2b" stroke={LINHA} strokeWidth={6} /> : <path d={`M -20 ${cab + 44} Q 0 ${cab + 56} 20 ${cab + 44}`} stroke={LINHA} strokeWidth={7} fill="none" strokeLinecap="round" />;

  const olho = (ox: number) => {
    const cy = cab - 8;
    if (expr === 'tonto') {
      return <path key={ox} transform={`translate(${ox} ${cy}) rotate(${f * 12})`} d="M 0 0 m -4 0 a 4 4 0 1 1 8 0 a 9 9 0 1 1 -18 0 a 14 14 0 1 1 28 0" stroke={LINHA} strokeWidth={5} fill="none" />;
    }
    if (pisca) return <path key={ox} d={`M ${ox - 20} ${cy + 4} Q ${ox} ${cy + 14} ${ox + 20} ${cy + 4}`} stroke={LINHA} strokeWidth={7} fill="none" strokeLinecap="round" />;
    const rx = expr === 'assustado' ? 24 : 20;
    const ry = expr === 'assustado' ? 29 : 24;
    const palp = Math.min(0.75, sono * 0.65 + (expr === 'cansado' ? 0.25 : 0));
    const ol = p.olhar ?? 0;
    return (
      <g key={ox}>
        <ellipse cx={ox} cy={cy} rx={rx} ry={ry} fill="#fff" stroke={LINHA} strokeWidth={6} />
        {sono > 0.2 && <path d={`M ${ox - 14} ${cy + 18} L ${ox + 14} ${cy + 22}`} stroke="#ff6b6b" strokeWidth={2.5} opacity={sono} />}
        <circle cx={ox + ol * 7 + (sono > 0.6 ? Math.sin(f / 3 + ox) * 2 : 0)} cy={cy + 3} r={expr === 'assustado' ? 8 : 11} fill={LINHA} />
        <circle cx={ox + ol * 7 + 4} cy={cy - 3} r={4} fill="#fff" />
        {palp > 0 && <path d={`M ${ox - rx - 4} ${cy - ry - 4} L ${ox + rx + 4} ${cy - ry - 4} L ${ox + rx + 4} ${cy - ry + ry * 2 * palp} Q ${ox} ${cy - ry + ry * 2 * palp + 6} ${ox - rx - 4} ${cy - ry + ry * 2 * palp} Z`} fill={pele} stroke={LINHA} strokeWidth={6} />}
        {sono > 0 && <path d={`M ${ox - 20} ${cy + ry + 6} Q ${ox} ${cy + ry + 20} ${ox + 20} ${cy + ry + 6}`} stroke="#8a5a9e" strokeWidth={6} fill="none" opacity={sono} strokeLinecap="round" />}
      </g>
    );
  };

  const sobr = (ox: number, lado: number) => {
    const cy = cab - 52;
    let inc = 0;
    if (expr === 'bravo') inc = 10 * lado;
    if (expr === 'assustado' || expr === 'cansado') inc = -8 * lado;
    return <path key={ox} d={`M ${ox - 18} ${cy - inc} L ${ox + 18} ${cy + inc}`} stroke={cabelo} strokeWidth={9} strokeLinecap="round" />;
  };

  const bag = p.bagunca ?? sono * 0.8;
  let cabeloNode: React.ReactNode = null;
  if (cabeloTipo === 'topete') {
    cabeloNode = (
      <g>
        <path d={`M -92 ${cab - 20} Q -100 ${cab - 110} -10 ${cab - 112} Q 80 ${cab - 120} 95 ${cab - 30} Q 60 ${cab - 70} 0 ${cab - 72} Q -50 ${cab - 72} -92 ${cab - 20} Z`} fill={cabelo} stroke={LINHA} strokeWidth={L} strokeLinejoin="round" />
        <path d={`M -10 ${cab - 108} Q 20 ${cab - 150 - bag * 25} ${50 + bag * 30} ${cab - 125 - bag * 10} Q 30 ${cab - 120} 25 ${cab - 108}`} fill={cabelo} stroke={LINHA} strokeWidth={L} strokeLinejoin="round" />
        {bag > 0.3 && <path d={`M -60 ${cab - 95} q -20 -40 -45 -30 M 70 ${cab - 85} q 30 -30 50 -10`} stroke={cabelo} strokeWidth={14} strokeLinecap="round" fill="none" />}
      </g>
    );
  } else if (cabeloTipo === 'curto') {
    cabeloNode = <path d={`M -95 ${cab - 10} Q -95 ${cab - 115} 0 ${cab - 112} Q 95 ${cab - 115} 95 ${cab - 10} Q 70 ${cab - 70} 0 ${cab - 70} Q -70 ${cab - 70} -95 ${cab - 10} Z`} fill={cabelo} stroke={LINHA} strokeWidth={L} />;
  } else if (cabeloTipo === 'longo') {
    cabeloNode = <path d={`M -100 ${cab + 90} Q -125 ${cab - 120} 0 ${cab - 112} Q 125 ${cab - 120} 100 ${cab + 90} L 70 ${cab + 90} Q 85 ${cab - 40} 0 ${cab - 70} Q -85 ${cab - 40} -70 ${cab + 90} Z`} fill={cabelo} stroke={LINHA} strokeWidth={L} />;
  }

  return (
    <g transform={`translate(${p.x + treme} ${p.y + bob}) rotate(${p.rot ?? 0}) scale(${s})`}>
      {!p.semPernas && <ellipse cx={0} cy={232} rx={110} ry={18} fill="rgba(0,0,0,0.15)" />}
      {cabeloTipo === 'longo' && <path d={`M -100 ${cab + 90} Q -125 ${cab - 120} 0 ${cab - 112} Q 125 ${cab - 120} 100 ${cab + 90} Z`} fill={cabelo} />}
      {!p.semPernas && (
        <g strokeLinecap="round" fill="none">
          {[-1, 1].map((ld) => (
            <g key={ld}>
              <path d={`M ${ld * 30} 0 L ${ld * 36} 200`} stroke={LINHA} strokeWidth={46 + L * 2} />
              <path d={`M ${ld * 30} 0 L ${ld * 36} 200`} stroke={calca} strokeWidth={46} />
              <ellipse cx={ld * 46} cy={214} rx={42} ry={22} fill={sapato} stroke={LINHA} strokeWidth={L} />
            </g>
          ))}
        </g>
      )}
      {/* tronco */}
      <path d={`M -72 ${tronco} Q -92 -60 -70 18 L 70 18 Q 92 -60 72 ${tronco} Q 0 ${tronco - 22} -72 ${tronco} Z`} fill={camisa} stroke={LINHA} strokeWidth={L} strokeLinejoin="round" />
      <path d={`M -26 ${tronco - 8} Q 0 ${tronco + 22} 26 ${tronco - 8}`} fill={pele} stroke={LINHA} strokeWidth={6} />
      <Braco de={ombroE} cot={bE.c} mao={bE.m} pele={pele} camisa={camisa} />
      {pose !== 'celular' && <Braco de={ombroD} cot={bD.c} mao={bD.m} pele={pele} camisa={camisa} />}
      {/* cabeça */}
      <g transform={`rotate(${expr === 'tonto' ? Math.sin(f / 6) * 8 : 0} 0 ${cab + 60})`}>
        <circle cx={-96} cy={cab + 4} r={20} fill={pele} stroke={LINHA} strokeWidth={L} />
        <circle cx={96} cy={cab + 4} r={20} fill={pele} stroke={LINHA} strokeWidth={L} />
        <circle cx={0} cy={cab} r={98} fill={pele} stroke={LINHA} strokeWidth={L} />
        {cabeloNode}
        {olho(-36)}
        {olho(36)}
        {sobr(-36, -1)}
        {sobr(36, 1)}
        <ellipse cx={-62} cy={cab + 30} rx={16} ry={10} fill="#ff8f8f" opacity={0.55} />
        <ellipse cx={62} cy={cab + 30} rx={16} ry={10} fill="#ff8f8f" opacity={0.55} />
        {boca}
      </g>
      {pose === 'celular' && (
        <g>
          <rect x={-42} y={-175} width={84} height={140} rx={14} fill="#1c1d24" stroke={LINHA} strokeWidth={L} />
          <rect x={-32} y={-163} width={64} height={114} rx={8} fill="#9fd8ff" />
          <Braco de={ombroD} cot={bD.c} mao={bD.m} pele={pele} camisa={camisa} />
        </g>
      )}
    </g>
  );
};
