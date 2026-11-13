// LAB: o Boneco low-poly ANTIGO (só para a comparação antes x depois). Os vídeos usam o Zé 2.0 (src/estilo/ze.tsx).
import React from 'react';
import {Barra, Caixa, Cil, OBREIRO} from '../v4/kit';
import type {AcaoBoneco, Visual} from '../v4/kit';
import type {V3} from '../v4/planta';

const Mat: React.FC<{cor: string; rugoso?: number}> = ({cor, rugoso = 0.9}) => <meshStandardMaterial color={cor} flatShading roughness={rugoso} />;

type Ferramenta = 'pa' | 'rolo' | 'colher' | 'planta' | 'bloco' | 'martelo' | 'gladio' | 'rudis' | 'tridente' | 'chicote' | 'tocha' | 'taca' | null;
export const BonecoAntigo: React.FC<{pos: V3; rotY?: number; acao?: AcaoBoneco; t: number; v?: Visual; esc?: number; ferramenta?: Ferramenta}> = ({pos, rotY = 0, acao = 'parado', t, v = OBREIRO, esc = 0.92, ferramenta = null}) => {
  const {camisa = '#4f8cff', colete = '#ff8a1f', capacete = '#ffd23f', calca = '#30406b', pele = '#ffd2ad', cabelo = '#3b2a20', chef = false, elmo, escudo, toga, coroa, cartola, gravata, bone} = v;
  const passo = acao === 'anda' ? Math.sin(t * 9) * 0.6 : 0;
  const pulo = acao === 'comemora' ? Math.abs(Math.sin(t * 6)) * 0.3 : acao === 'anda' ? Math.abs(Math.sin(t * 9)) * 0.04 : 0;
  let bD = passo * -0.8, bE = passo * 0.8, bDz = -0.15, bEz = 0.15, tronco = 0;
  if (acao === 'aponta') { bD = -1.5; bDz = -0.1; }
  if (acao === 'acena') { bDz = -2.6 + Math.sin(t * 10) * 0.35; bD = 0; }
  if (acao === 'comemora') { bDz = -2.7; bEz = 2.7; }
  if (acao === 'cava') { const k = (Math.sin(t * 5) + 1) / 2; bD = -0.4 - k * 1.1; bE = -0.4 - k * 1.1; tronco = 0.15 + k * 0.35; }
  if (acao === 'martela') { bD = -1.2 - Math.abs(Math.sin(t * 8)) * 1.2; tronco = 0.1; }
  if (acao === 'pinta') { bD = -2.2 + Math.sin(t * 4) * 0.6; bE = -0.3; }
  if (acao === 'carrega') { bD = -1.1; bE = -1.1; bDz = 0.1; bEz = -0.1; }
  const pernaY = acao === 'senta' ? 0.25 : 0.28;
  const prop = (() => {
    if (ferramenta === 'pa') return (<group position={[0, -0.45, 0.05]} rotation={[0.3, 0, 0]}><Cil pos={[0, 0.1, 0]} r={0.02} h={1.0} cor="#8b5a3c" /><Caixa pos={[0, -0.45, 0]} tam={[0.22, 0.28, 0.03]} cor="#7f8790" /></group>);
    if (ferramenta === 'rolo') return (<group position={[0, -0.45, 0.05]}><Cil pos={[0, 0.25, 0]} r={0.015} h={0.5} cor="#ddd" /><Cil pos={[0, 0.55, 0]} rot={[0, 0, Math.PI / 2]} r={0.05} h={0.24} cor="#f2f2f2" /></group>);
    if (ferramenta === 'colher') return (<group position={[0, -0.48, 0.08]}><Cil r={0.02} h={0.1} cor="#8b5a3c" /><Caixa pos={[0, -0.03, 0.09]} tam={[0.12, 0.01, 0.16]} cor="#9aa0aa" /></group>);
    if (ferramenta === 'martelo') return (<group position={[0, -0.48, 0.05]}><Cil pos={[0, 0, 0.1]} rot={[Math.PI / 2, 0, 0]} r={0.015} h={0.3} cor="#8b5a3c" /><Caixa pos={[0, 0, 0.25]} tam={[0.12, 0.05, 0.05]} cor="#555" /></group>);
    if (ferramenta === 'bloco') return (<Caixa pos={[0, -0.5, 0.2]} tam={[0.29, 0.19, 0.14]} cor="#d9773e" />);
    if (ferramenta === 'gladio' || ferramenta === 'rudis') {
      const lam = ferramenta === 'gladio' ? '#d7dde6' : '#a8743f';
      return (<group position={[0, -0.48, 0.05]}><Cil pos={[0, 0, 0.02]} rot={[Math.PI / 2, 0, 0]} r={0.025} h={0.14} cor="#6b3e26" /><Caixa pos={[0, 0, 0.1]} tam={[0.14, 0.03, 0.03]} cor="#c9a24a" /><Caixa pos={[0, 0, 0.4]} tam={[0.06, 0.02, 0.56]} cor={lam} /></group>);
    }
    if (ferramenta === 'tridente') return (<group position={[0, -0.48, 0.05]}><Cil pos={[0, 0.3, 0]} r={0.018} h={1.9} cor="#8b5a3c" />{[-0.08, 0, 0.08].map((x) => (<Caixa key={x} pos={[x, 1.32, 0]} tam={[0.02, 0.22, 0.02]} cor="#c9ced6" />))}<Caixa pos={[0, 1.22, 0]} tam={[0.2, 0.02, 0.02]} cor="#c9ced6" /></group>);
    if (ferramenta === 'chicote') return (<group position={[0, -0.48, 0.05]}><Cil pos={[0, 0, 0.08]} rot={[Math.PI / 2, 0, 0]} r={0.02} h={0.22} cor="#4a3426" />{[0, 1, 2, 3].map((i) => (<Barra key={i} a={[0, -i * 0.12 + Math.sin(t * 6 + i) * 0.03, 0.19 + i * 0.12]} b={[0, -(i + 1) * 0.12 + Math.sin(t * 6 + i + 1) * 0.03, 0.19 + (i + 1) * 0.12]} r={0.012} cor="#3b2a20" sombra={false} />))}</group>);
    if (ferramenta === 'tocha') return (<group position={[0, -0.48, 0.05]}><Cil pos={[0, 0.2, 0]} r={0.025} h={0.5} cor="#6b3e26" /><mesh position={[0, 0.52, 0]} scale={[1, 1 + Math.sin(t * 14) * 0.12, 1]}><coneGeometry args={[0.07, 0.22, 6]} /><meshStandardMaterial color="#ff9a2a" emissive="#ff6a00" emissiveIntensity={1.4} /></mesh></group>);
    if (ferramenta === 'taca') return (<group position={[0, -0.5, 0.1]}><Cil pos={[0, 0.06, 0]} r={0.06} r2={0.04} h={0.12} cor="#9a8f80" /><Cil pos={[0, 0.115, 0]} r={0.05} h={0.01} cor="#6f6a66" /></group>);
    if (ferramenta === 'planta') return (<Caixa pos={[0, -0.5, 0.15]} rot={[-0.6, 0, 0]} tam={[0.5, 0.35, 0.01]} cor="#2f6fd6" />);
    return null;
  })();
  return (
    <group position={[pos[0], pos[1] + pulo, pos[2]]} rotation={[0, rotY, 0]} scale={esc}>
      <mesh position={[-0.13, pernaY, 0]} rotation={[acao === 'senta' ? -1.5 : passo, 0, 0]} castShadow><capsuleGeometry args={[0.1, 0.32, 3, 8]} /><Mat cor={calca} /></mesh>
      <mesh position={[0.13, pernaY, 0]} rotation={[acao === 'senta' ? -1.5 : -passo, 0, 0]} castShadow><capsuleGeometry args={[0.1, 0.32, 3, 8]} /><Mat cor={calca} /></mesh>
      {acao !== 'senta' && <Caixa pos={[-0.13, 0.05, 0.06]} tam={[0.2, 0.1, 0.3]} cor="#4a3426" />}
      {acao !== 'senta' && <Caixa pos={[0.13, 0.05, 0.06]} tam={[0.2, 0.1, 0.3]} cor="#4a3426" />}
      <group position={[0, 0.55, 0]} rotation={[tronco, 0, 0]}>
        <group position={[0, -0.55, 0]}>
          <mesh position={[0, 0.78, 0]} castShadow><capsuleGeometry args={[0.27, 0.38, 4, 10]} /><Mat cor={camisa} /></mesh>
          {chef && (
            <>
              {[0.68, 0.86].map((y) => (<mesh key={'b' + y} position={[0.08, y, 0.27]}><sphereGeometry args={[0.035, 6, 6]} /><Mat cor="#2b2233" /></mesh>))}
              <mesh position={[0, 1.07, 0.18]} rotation={[0.3, 0, 0]}><torusGeometry args={[0.16, 0.05, 6, 12]} /><Mat cor="#e8322b" /></mesh>
            </>
          )}
          {gravata && (
            <>
              <mesh position={[0, 0.98, 0.27]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.1, 0.08, 0.04]} /><Mat cor={gravata} /></mesh>
              <mesh position={[0, 0.8, 0.29]} rotation={[0.12, 0, Math.PI / 4]}><boxGeometry args={[0.13, 0.13, 0.03]} /><Mat cor={gravata} /></mesh>
              <mesh position={[0, 0.88, 0.285]} rotation={[0.18, 0, 0]}><boxGeometry args={[0.08, 0.16, 0.03]} /><Mat cor={gravata} /></mesh>
            </>
          )}
          {toga && (
            <>
              <mesh position={[0, 0.74, 0.0]}><cylinderGeometry args={[0.3, 0.33, 0.56, 10, 1, true]} /><meshStandardMaterial color={toga} flatShading side={2} /></mesh>
              <mesh position={[0.02, 0.84, 0.25]} rotation={[0.25, 0, 0.75]}><boxGeometry args={[0.16, 0.62, 0.06]} /><Mat cor={toga} /></mesh>
            </>
          )}
          {colete && (
            <>
              <mesh position={[0, 0.78, 0.0]}><cylinderGeometry args={[0.3, 0.3, 0.48, 10, 1, true]} /><meshStandardMaterial color={colete} flatShading side={2} /></mesh>
              {[0.68, 0.86].map((y) => (<mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.305, 0.305, 0.05, 10, 1, true]} /><meshStandardMaterial color="#f4f4f4" side={2} /></mesh>))}
            </>
          )}
          <group position={[0.34, 1.0, 0]} rotation={[bD, 0, bDz]}>
            <mesh position={[0, -0.22, 0]} castShadow><capsuleGeometry args={[0.08, 0.3, 3, 8]} /><Mat cor={camisa} /></mesh>
            <mesh position={[0, -0.45, 0]}><sphereGeometry args={[0.09, 8, 8]} /><Mat cor={pele} /></mesh>
            {prop}
          </group>
          <group position={[-0.34, 1.0, 0]} rotation={[bE, 0, bEz]}>
            <mesh position={[0, -0.22, 0]} castShadow><capsuleGeometry args={[0.08, 0.3, 3, 8]} /><Mat cor={camisa} /></mesh>
            <mesh position={[0, -0.45, 0]}><sphereGeometry args={[0.09, 8, 8]} /><Mat cor={pele} /></mesh>
            {escudo && (
              <group position={[0.02, -0.36, 0.2]} rotation={[-bE, 0, -bEz]}>
                <mesh castShadow><boxGeometry args={[0.55, 0.85, 0.05]} /><Mat cor={escudo} /></mesh>
                <Caixa pos={[0, 0, 0.03]} tam={[0.47, 0.77, 0.02]} cor={escudo} sombra={false} />
                {[-0.3, 0.3].map((y) => (<Caixa key={y} pos={[0, y, 0.045]} tam={[0.4, 0.04, 0.01]} cor="#e0b64a" sombra={false} />))}
                <mesh position={[0, 0, 0.06]}><sphereGeometry args={[0.09, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat cor="#e0b64a" /></mesh>
              </group>
            )}
          </group>
          <group position={[0, 1.5, 0]}>
            <mesh castShadow><sphereGeometry args={[0.36, 16, 12]} /><Mat cor={pele} /></mesh>
            {[-0.12, 0.12].map((x) => (<mesh key={x} position={[x, 0.02, 0.32]}><sphereGeometry args={[0.055, 8, 8]} /><meshStandardMaterial color="#1d1b26" /></mesh>))}
            {[-0.2, 0.2].map((x) => (<mesh key={x} position={[x, -0.1, 0.28]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#ff9b8a" /></mesh>))}
            <mesh position={[0, -0.14, 0.31]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.07, 0.02, 6, 10, Math.PI]} /><meshStandardMaterial color="#5a1f2b" /></mesh>
            {cartola && (
              <group position={[0, 0.3, -0.02]} rotation={[-0.08, 0, 0.06]}>
                <mesh castShadow><cylinderGeometry args={[0.52, 0.52, 0.04, 18]} /><Mat cor={cartola} rugoso={0.5} /></mesh>
                <mesh position={[0, 0.26, 0]} castShadow><cylinderGeometry args={[0.3, 0.29, 0.5, 18]} /><Mat cor={cartola} rugoso={0.5} /></mesh>
                <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.305, 0.305, 0.09, 18]} /><Mat cor="#c9302c" /></mesh>
              </group>
            )}
            {bone && (
              <group position={[0, 0.1, 0]} rotation={[-0.12, 0, 0]}>
                <mesh castShadow scale={[1, 0.55, 1.05]}><sphereGeometry args={[0.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat cor={bone} /></mesh>
                <mesh position={[0, 0.0, 0.36]} rotation={[0.12, 0, 0]} scale={[1, 1, 0.55]}><cylinderGeometry args={[0.3, 0.3, 0.035, 14, 1, false, -Math.PI / 2, Math.PI]} /><Mat cor={bone} /></mesh>
              </group>
            )}
            {coroa && (<mesh position={[0, 0.14, -0.02]} rotation={[Math.PI / 2 - 0.15, 0, 0]}><torusGeometry args={[0.37, 0.05, 5, 14]} /><Mat cor={coroa} /></mesh>)}
            {elmo ? (
              <>
                <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat cor={elmo.cor} rugoso={0.45} /></mesh>
                <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.42, 0.44, 0.07, 16]} /><Mat cor={elmo.cor} rugoso={0.45} /></mesh>
                <mesh position={[0, 0.03, -0.3]} rotation={[0.5, 0, 0]}><boxGeometry args={[0.6, 0.06, 0.2]} /><Mat cor={elmo.cor} rugoso={0.45} /></mesh>
                {[-1, 1].map((sx) => (<mesh key={sx} position={[sx * 0.33, -0.1, 0.12]} rotation={[0, sx * 0.35, 0]}><boxGeometry args={[0.06, 0.3, 0.2]} /><Mat cor={elmo.cor} rugoso={0.45} /></mesh>))}
                {elmo.penacho && (<mesh position={[0, 0.2, -0.02]} rotation={[0, Math.PI / 2, 0]} scale={[1, 1, 0.55]} castShadow><torusGeometry args={[0.36, 0.09, 6, 14, Math.PI]} /><Mat cor={elmo.penacho} /></mesh>)}
              </>
            ) : chef ? (
              <group position={[0, 0.3, 0]}>
                <mesh castShadow><cylinderGeometry args={[0.33, 0.3, 0.3, 14]} /><Mat cor="#ffffff" /></mesh>
                {[[-0.15, 0.25, 0], [0.15, 0.25, 0], [0, 0.3, 0.12], [0, 0.3, -0.12], [0, 0.36, 0]].map((q, i) => (<mesh key={i} position={q as V3}><sphereGeometry args={[0.2, 10, 8]} /><Mat cor="#ffffff" /></mesh>))}
              </group>
            ) : capacete ? (
              <>
                <mesh position={[0, 0.12, 0]} castShadow><sphereGeometry args={[0.39, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat cor={capacete} /></mesh>
                <mesh position={[0, 0.12, 0.08]}><cylinderGeometry args={[0.46, 0.46, 0.04, 16]} /><Mat cor={capacete} /></mesh>
              </>
            ) : (
              <mesh position={[0, 0.08, -0.03]} castShadow><sphereGeometry args={[0.375, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.1]} /><Mat cor={cabelo} /></mesh>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};

