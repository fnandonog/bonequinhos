// LAB: a MESMA sala montada no padrão ATUAL (kit v4 + peças v3, flatShading, caixas retas,
// luz "dia" do Obra: hemisférica + 1 sol). Serve só de "antes" para comparação.
import React from 'react';
import {Caixa, Cil, Mat} from '../v4/kit';
import {BonecoAntigo as Boneco} from './BonecoAntigo';
import {Sofa} from '../v3/Pecas';
import {SALA, ZE_POS} from './SalaNova';
import type {V3} from './visual';

export const SalaAntiga: React.FC<{t: number}> = ({t}) => {
  const {x0, x1, zF, zFrente, pe, jan} = SALA;
  const prof = zFrente - zF;
  const zc = zF - 0.06;
  const parede = '#f4efe6';
  const pedaco = (xa: number, xb: number, ya: number, yb: number, k: string) => (
    <Caixa key={k} pos={[(xa + xb) / 2, (ya + yb) / 2, zc]} tam={[xb - xa, yb - ya, 0.12]} cor={parede} />
  );
  return (
    <group>
      {/* mesma luz do Obra (LUZ.dia) */}
      <hemisphereLight args={['#ffffff', '#8fae7a', 1.0]} />
      <directionalLight position={[8, 16, 10]} color="#fff4e0" intensity={2.0} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={60} shadow-bias={-0.0004} />
      {/* casca */}
      <Caixa pos={[0, -0.05, (zF + zFrente) / 2]} tam={[x1 - x0, 0.1, prof]} cor="#c99a6a" />
      {pedaco(x0, jan.x0, 0, pe, 'a')}
      {pedaco(jan.x1, x1, 0, pe, 'b')}
      {pedaco(jan.x0, jan.x1, 0, jan.y0, 'c')}
      {pedaco(jan.x0, jan.x1, jan.y1, pe, 'd')}
      {[x0 - 0.06, x1 + 0.06].map((x) => (
        <Caixa key={x} pos={[x, pe / 2, (zF + zFrente) / 2]} tam={[0.12, pe, prof]} cor={parede} />
      ))}
      <Caixa pos={[0, pe + 0.05, (zF + zFrente) / 2]} tam={[x1 - x0 + 0.3, 0.1, prof]} cor="#ffffff" sombra={false} />
      {/* janela: vidro azul chapado */}
      <Caixa pos={[(jan.x0 + jan.x1) / 2, (jan.y0 + jan.y1) / 2, zc]} tam={[jan.x1 - jan.x0, jan.y1 - jan.y0, 0.04]} cor="#9fd4ff" />
      {/* sofá do v3, mesa reta, tapete chapado */}
      <Sofa pos={[0.75, 0, -1.7]} cor="#4f8cff" />
      <Caixa pos={[0.35, 0.005, -0.45]} tam={[2.8, 0.01, 1.95]} cor="#ffb347" sombra={false} />
      <group position={[0.62, 0, -0.42]}>
        <Caixa pos={[0, 0.42, 0]} tam={[0.9, 0.05, 0.6]} cor="#c99a6a" />
        {[[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]].map(([x, z], i) => (
          <Caixa key={i} pos={[x, 0.2, z]} tam={[0.05, 0.4, 0.05]} cor="#9c6b42" />
        ))}
      </group>
      {/* estante simples */}
      <group position={[x0 + 0.17, 0, -0.55]} rotation={[0, Math.PI / 2, 0]}>
        <Caixa pos={[0, 0.975, 0]} tam={[1.25, 1.95, 0.32]} cor="#e9d8b6" />
        {[0.5, 0.92, 1.34].map((y, i) => (
          <Caixa key={y} pos={[0, y + 0.13, 0.12]} tam={[0.9, 0.24, 0.12]} cor={['#e8402f', '#2fbf71', '#4f8cff'][i]} />
        ))}
      </group>
      {/* quadro e planta */}
      <Caixa pos={[0.75, 1.72, zF + 0.03]} tam={[0.72, 0.88, 0.04]} cor="#7c6cf0" />
      <group position={[-2.1, 0, -1.78]}>
        <Cil pos={[0, 0.2, 0]} r={0.2} h={0.4} cor="#c8462f" />
        <mesh position={[0, 0.85, 0]} castShadow>
          <icosahedronGeometry args={[0.45, 0]} />
          <Mat cor="#3f9b5a" />
        </mesh>
      </group>
      <Boneco pos={ZE_POS as V3} rotY={0.12} acao="aponta" t={t} v={{camisa: '#4f8cff', calca: '#30406b', colete: null, capacete: null, cabelo: '#3b2a20'}} />
    </group>
  );
};
