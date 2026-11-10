import React, {useMemo} from 'react';
import * as THREE from 'three';

// Biblioteca de peças low-poly (cores lisas, sombras). Unidades ~ metros.
type V3 = [number, number, number];
type Base = {pos?: V3; rot?: number; esc?: number; cor?: string};

const Mat: React.FC<{cor: string}> = ({cor}) => <meshStandardMaterial color={cor} flatShading roughness={0.9} />;

export const Caixa: React.FC<Base & {tam: V3}> = ({pos = [0, 0, 0], rot = 0, tam, cor = '#ccc'}) => (
  <mesh position={pos} rotation={[0, rot, 0]} castShadow receiveShadow>
    <boxGeometry args={tam} />
    <Mat cor={cor} />
  </mesh>
);

export const Cilindro: React.FC<Base & {r: number; h: number; seg?: number}> = ({pos = [0, 0, 0], rot = 0, r, h, seg = 8, cor = '#ccc'}) => (
  <mesh position={pos} rotation={[0, rot, 0]} castShadow receiveShadow>
    <cylinderGeometry args={[r, r, h, seg]} />
    <Mat cor={cor} />
  </mesh>
);

export const Arvore: React.FC<Base> = ({pos = [0, 0, 0], esc = 1, cor = '#3f9b5a'}) => (
  <group position={pos} scale={esc}>
    <Cilindro pos={[0, 0.5, 0]} r={0.18} h={1} seg={6} cor="#8b5a3c" />
    <mesh position={[0, 1.7, 0]} castShadow>
      <coneGeometry args={[0.9, 1.8, 7]} />
      <Mat cor={cor} />
    </mesh>
    <mesh position={[0, 2.5, 0]} castShadow>
      <coneGeometry args={[0.65, 1.3, 7]} />
      <Mat cor={cor} />
    </mesh>
  </group>
);

export const Arbusto: React.FC<Base> = ({pos = [0, 0, 0], esc = 1, cor = '#4cb87a'}) => (
  <mesh position={[pos[0], pos[1] + 0.35 * esc, pos[2]]} scale={esc} castShadow>
    <icosahedronGeometry args={[0.5, 0]} />
    <Mat cor={cor} />
  </mesh>
);

export const Pedra: React.FC<Base> = ({pos = [0, 0, 0], esc = 1}) => (
  <mesh position={[pos[0], pos[1] + 0.1 * esc, pos[2]]} scale={[esc, esc * 0.5, esc]} castShadow receiveShadow>
    <dodecahedronGeometry args={[0.3, 0]} />
    <Mat cor="#b9b4aa" />
  </mesh>
);

// telhado de duas águas (prisma triangular) ao longo do eixo X
export const Telhado: React.FC<Base & {larg: number; prof: number; alt: number}> = ({pos = [0, 0, 0], larg, prof, alt, cor = '#c8462f'}) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-prof / 2, 0);
    s.lineTo(prof / 2, 0);
    s.lineTo(0, alt);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth: larg, bevelEnabled: false});
    g.translate(0, 0, -larg / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }, [larg, prof, alt]);
  return (
    <mesh geometry={geo} position={pos} castShadow receiveShadow>
      <Mat cor={cor} />
    </mesh>
  );
};

export const Cerca: React.FC<Base & {comp: number}> = ({pos = [0, 0, 0], rot = 0, comp, cor = '#d9b38c'}) => {
  const n = Math.max(2, Math.round(comp / 0.8));
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {Array.from({length: n}).map((_, i) => (
        <Caixa key={i} pos={[-comp / 2 + (i * comp) / (n - 1), 0.4, 0]} tam={[0.1, 0.8, 0.1]} cor={cor} />
      ))}
      <Caixa pos={[0, 0.6, 0]} tam={[comp, 0.08, 0.06]} cor={cor} />
      <Caixa pos={[0, 0.3, 0]} tam={[comp, 0.08, 0.06]} cor={cor} />
    </group>
  );
};

// ---- interior ----
export const Cama: React.FC<Base> = ({pos = [0, 0, 0], rot = 0, cor = '#7c6cf0'}) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <Caixa pos={[0, 0.2, 0]} tam={[1.4, 0.4, 2]} cor="#a9744f" />
    <Caixa pos={[0, 0.45, 0.1]} tam={[1.35, 0.15, 1.8]} cor="#fff" />
    <Caixa pos={[0, 0.55, 0.35]} tam={[1.36, 0.08, 1.3]} cor={cor} />
    <Caixa pos={[0, 0.58, -0.75]} tam={[1, 0.15, 0.35]} cor="#fff" />
  </group>
);

export const Armario: React.FC<Base> = ({pos = [0, 0, 0], rot = 0, cor = '#e9d8b6'}) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <Caixa pos={[0, 1, 0]} tam={[1.2, 2, 0.55]} cor={cor} />
    <Caixa pos={[0, 1, 0.28]} tam={[0.02, 1.9, 0.02]} cor="#8b5a3c" />
  </group>
);

export const Sofa: React.FC<Base> = ({pos = [0, 0, 0], rot = 0, cor = '#4f8cff'}) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <Caixa pos={[0, 0.25, 0]} tam={[1.8, 0.5, 0.8]} cor={cor} />
    <Caixa pos={[0, 0.65, -0.32]} tam={[1.8, 0.5, 0.18]} cor={cor} />
    <Caixa pos={[-0.85, 0.5, 0]} tam={[0.16, 0.4, 0.8]} cor={cor} />
    <Caixa pos={[0.85, 0.5, 0]} tam={[0.16, 0.4, 0.8]} cor={cor} />
  </group>
);

export const Bancada: React.FC<Base> = ({pos = [0, 0, 0], rot = 0}) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <Caixa pos={[0, 0.45, 0]} tam={[1.8, 0.9, 0.6]} cor="#f4efe6" />
    <Caixa pos={[0, 0.92, 0]} tam={[1.85, 0.05, 0.65]} cor="#5a5a6a" />
    <Caixa pos={[-0.4, 0.93, 0]} tam={[0.5, 0.04, 0.4]} cor="#c9ced6" />
    <Cilindro pos={[0.45, 0.96, -0.1]} r={0.1} h={0.02} cor="#2b2b3a" />
    <Cilindro pos={[0.45, 0.96, 0.12]} r={0.1} h={0.02} cor="#2b2b3a" />
  </group>
);

export const Geladeira: React.FC<Base> = ({pos = [0, 0, 0], rot = 0}) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <Caixa pos={[0, 0.8, 0]} tam={[0.6, 1.6, 0.6]} cor="#eef3f8" />
    <Caixa pos={[0.22, 1.05, 0.31]} tam={[0.04, 0.35, 0.03]} cor="#9aa0aa" />
  </group>
);

export const Vaso: React.FC<Base> = ({pos = [0, 0, 0], rot = 0}) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <Cilindro pos={[0, 0.2, 0]} r={0.2} h={0.4} cor="#fff" />
    <Caixa pos={[0, 0.55, -0.18]} tam={[0.4, 0.4, 0.15]} cor="#fff" />
  </group>
);

export const Chuveiro: React.FC<Base> = ({pos = [0, 0, 0], rot = 0}) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <Caixa pos={[0, 0.03, 0]} tam={[0.9, 0.06, 0.9]} cor="#bfe6ff" />
    <Cilindro pos={[0, 1.1, -0.4]} r={0.03} h={2.2} cor="#9aa0aa" />
    <Cilindro pos={[0, 2.1, -0.25]} r={0.14} h={0.05} cor="#c9ced6" />
  </group>
);

export const Porta: React.FC<Base> = ({pos = [0, 0, 0], rot = 0, cor = '#8b5a3c'}) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <Caixa pos={[0, 1.05, 0]} tam={[0.95, 2.1, 0.12]} cor={cor} />
    <mesh position={[0.32, 1.05, 0.08]}>
      <sphereGeometry args={[0.05, 6, 6]} />
      <Mat cor="#ffd23f" />
    </mesh>
  </group>
);

export const Janela: React.FC<Base> = ({pos = [0, 0, 0], rot = 0}) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <Caixa pos={[0, 0, 0]} tam={[1.2, 1, 0.14]} cor="#f4efe6" />
    <Caixa pos={[0, 0, 0.02]} tam={[1.02, 0.84, 0.14]} cor="#9fd8ff" />
    <Caixa pos={[0, 0, 0.04]} tam={[0.05, 0.84, 0.14]} cor="#f4efe6" />
  </group>
);

export const Placa: React.FC<Base & {texto: string; fundo?: string}> = ({pos = [0, 0, 0], rot = 0, texto, fundo = '#ffd23f'}) => {
  const tex = useMemo(() => textoTextura(texto, fundo, '#2b2233', 512, 256), [texto, fundo]);
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Cilindro pos={[0, 0.6, 0]} r={0.05} h={1.2} cor="#8b5a3c" />
      <mesh position={[0, 1.35, 0.04]} castShadow>
        <boxGeometry args={[1.4, 0.7, 0.06]} />
        <meshStandardMaterial attach="material-0" color={fundo} />
        <meshStandardMaterial attach="material-1" color={fundo} />
        <meshStandardMaterial attach="material-2" color={fundo} />
        <meshStandardMaterial attach="material-3" color={fundo} />
        <meshStandardMaterial attach="material-4" map={tex} />
        <meshStandardMaterial attach="material-5" color={fundo} />
      </mesh>
    </group>
  );
};

export function textoTextura(texto: string, fundo: string, cor: string, w = 512, h = 160): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = fundo;
  const r = h / 2.2;
  g.beginPath();
  g.roundRect(6, 6, w - 12, h - 12, r);
  g.fill();
  g.lineWidth = 10;
  g.strokeStyle = '#2b2233';
  g.stroke();
  g.fillStyle = cor;
  g.font = `800 ${Math.round(h * 0.5)}px 'Baloo 2', sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(texto, w / 2, h / 2 + h * 0.04);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
