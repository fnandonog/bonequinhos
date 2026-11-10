import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {textoTextura} from './Pecas';

// Zé em 3D: chibi de capacete amarelo e colete listrado, com etiqueta "VOCÊ" flutuando.
export type Acao = 'parado' | 'anda' | 'aponta' | 'acena' | 'comemora';

const M: React.FC<{cor: string}> = ({cor}) => <meshStandardMaterial color={cor} flatShading roughness={0.8} />;

export const Ze3D: React.FC<{pos: [number, number, number]; rotY?: number; acao?: Acao; etiqueta?: string; esc?: number}> = ({pos, rotY = 0, acao = 'parado', etiqueta = 'VOCÊ', esc = 1}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const passo = acao === 'anda' ? Math.sin(t * 9) * 0.6 : 0;
  const pulo = acao === 'comemora' ? Math.abs(Math.sin(t * 6)) * 0.35 : acao === 'anda' ? Math.abs(Math.sin(t * 9)) * 0.05 : 0;
  let bracoD = passo * -0.8;
  let bracoE = passo * 0.8;
  let bracoDz = -0.2;
  let bracoEz = 0.2;
  if (acao === 'aponta') { bracoD = -1.4; bracoDz = -0.1; }
  if (acao === 'acena') { bracoDz = -2.6 + Math.sin(t * 10) * 0.35; bracoD = 0; }
  if (acao === 'comemora') { bracoDz = -2.7; bracoEz = 2.7; }
  const tex = useMemo(() => textoTextura(etiqueta, '#ffffff', '#2b2233', 384, 140), [etiqueta]);
  const flutua = Math.sin(t * 3) * 0.06;
  return (
    <group position={[pos[0], pos[1] + pulo, pos[2]]} rotation={[0, rotY, 0]} scale={esc}>
      {/* pernas */}
      <mesh position={[-0.13, 0.28 , 0]} rotation={[passo, 0, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.32, 3, 8]} />
        <M cor="#30406b" />
      </mesh>
      <mesh position={[0.13, 0.28, 0]} rotation={[-passo, 0, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.32, 3, 8]} />
        <M cor="#30406b" />
      </mesh>
      <mesh position={[-0.13, 0.05, 0.06]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.3]} />
        <M cor="#4a3426" />
      </mesh>
      <mesh position={[0.13, 0.05, 0.06]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.3]} />
        <M cor="#4a3426" />
      </mesh>
      {/* tronco com colete */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <capsuleGeometry args={[0.27, 0.38, 4, 10]} />
        <M cor="#4f8cff" />
      </mesh>
      <mesh position={[0, 0.78, 0.02]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.48, 10, 1, true]} />
        <meshStandardMaterial color="#ff8a1f" flatShading side={2} />
      </mesh>
      {[0.68, 0.86].map((y) => (
        <mesh key={y} position={[0, y, 0.02]}>
          <cylinderGeometry args={[0.305, 0.305, 0.05, 10, 1, true]} />
          <meshStandardMaterial color="#f4f4f4" side={2} />
        </mesh>
      ))}
      {/* braços */}
      <group position={[0.34, 1.0, 0]} rotation={[bracoD, 0, bracoDz]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.3, 3, 8]} />
          <M cor="#4f8cff" />
        </mesh>
        <mesh position={[0, -0.45, 0]} castShadow>
          <sphereGeometry args={[0.09, 8, 8]} />
          <M cor="#ffd2ad" />
        </mesh>
      </group>
      <group position={[-0.34, 1.0, 0]} rotation={[bracoE, 0, bracoEz]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.3, 3, 8]} />
          <M cor="#4f8cff" />
        </mesh>
        <mesh position={[0, -0.45, 0]} castShadow>
          <sphereGeometry args={[0.09, 8, 8]} />
          <M cor="#ffd2ad" />
        </mesh>
      </group>
      {/* cabeça */}
      <group position={[0, 1.5, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.36, 16, 12]} />
          <M cor="#ffd2ad" />
        </mesh>
        <mesh position={[-0.12, 0.02, 0.32]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#2b2233" />
        </mesh>
        <mesh position={[0.12, 0.02, 0.32]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#2b2233" />
        </mesh>
        <mesh position={[-0.2, -0.1, 0.28]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#ff9b8a" />
        </mesh>
        <mesh position={[0.2, -0.1, 0.28]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#ff9b8a" />
        </mesh>
        <mesh position={[0, -0.14, 0.31]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.07, 0.02, 6, 10, Math.PI]} />
          <meshStandardMaterial color="#5a1f2b" />
        </mesh>
        {/* capacete */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <sphereGeometry args={[0.39, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <M cor="#ffd23f" />
        </mesh>
        <mesh position={[0, 0.12, 0.08]}>
          <cylinderGeometry args={[0.46, 0.46, 0.04, 16]} />
          <M cor="#ffd23f" />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.08, 0.1, 0.6]} />
          <M cor="#f2c230" />
        </mesh>
      </group>
      {/* etiqueta "VOCÊ" */}
      <sprite position={[0, 2.35 + flutua, 0]} scale={[0.95, 0.35, 1]}>
        <spriteMaterial map={tex} depthTest={false} />
      </sprite>
    </group>
  );
};
