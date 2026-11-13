// LAB: composição de comparação do padrão visual (id "lab-antes-depois").
// modo "split": grade 2x2 (sala inteira e close do rosto, antes | depois); "antes"/"depois": sala em tela cheia.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {SalaAntiga} from './SalaAntiga';
import {SalaNova, ZE_POS} from './SalaNova';
import type {AcaoZe} from './ZeNovo';
import {CamFixa, QUAL, V3, aplicarDesl} from './visual';

export type ModoLab = 'split' | 'antes' | 'depois';
// desl: lista de recursos a desligar (só para medir custo): vsm,sol,mapa1k,env,luzes,fisico,aa
export type LabProps = {modo: ModoLab; desl?: string; acao?: AcaoZe};

const CAM_SALA = {pos: [1.15, 1.8, 3.9] as V3, alvo: [-0.55, 0.8, -0.7] as V3, fov: 54};
const CAM_ROSTO = {pos: [ZE_POS[0] + 0.3, 1.4, ZE_POS[2] + 2.3] as V3, alvo: [ZE_POS[0], 1.1, ZE_POS[2]] as V3, fov: 38};

const CEU_ANTIGO = 'linear-gradient(180deg, #7cc8ff 0%, #d9f1ff 70%)';

const Quadro: React.FC<{novo: boolean; w: number; h: number; cam: typeof CAM_SALA; t: number; acao?: AcaoZe}> = ({novo, w, h, cam, t, acao}) => (
  <div style={{width: w, height: h, position: 'relative', overflow: 'hidden', background: novo ? '#efe2cf' : CEU_ANTIGO}}>
    {novo ? (
      <ThreeCanvas width={w} height={h} shadows={QUAL.vsm ? 'variance' : true} camera={{fov: cam.fov, near: 0.05, far: 80, position: cam.pos}} gl={{antialias: QUAL.aa}}>
        <CamFixa {...cam} />
        <SalaNova t={t} acao={acao} />
      </ThreeCanvas>
    ) : (
      <ThreeCanvas width={w} height={h} shadows camera={{fov: cam.fov, near: 0.1, far: 300, position: cam.pos}}>
        <CamFixa {...cam} />
        <SalaAntiga t={t} />
      </ThreeCanvas>
    )}
  </div>
);

const Etiqueta: React.FC<{texto: string; sub: string; cor: string}> = ({texto, sub, cor}) => (
  <div style={{position: 'absolute', top: 24, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none'}}>
    <div style={{background: cor, color: '#fff', fontFamily: "'Baloo 2', system-ui, sans-serif", fontWeight: 800, fontSize: 44, padding: '6px 26px', borderRadius: 40, boxShadow: '0 4px 14px rgba(0,0,0,0.25)'}}>{texto}</div>
    <div style={{marginTop: 8, color: '#fff', fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 22, textShadow: '0 2px 6px rgba(0,0,0,0.6)'}}>{sub}</div>
  </div>
);

export const LabAntesDepois: React.FC<LabProps> = ({modo, desl, acao}) => {
  aplicarDesl(desl);
  const f = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = f / fps;
  if (modo !== 'split') {
    return (
      <AbsoluteFill>
        <Quadro novo={modo === 'depois'} w={width} h={height} cam={CAM_SALA} t={t} acao={acao} />
      </AbsoluteFill>
    );
  }
  const topo = 120;
  const h1 = 960;
  const h2 = height - topo - h1;
  const w = width / 2;
  return (
    <AbsoluteFill style={{background: '#1d1b26'}}>
      <div style={{height: topo, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Baloo 2', system-ui, sans-serif", fontWeight: 800, fontSize: 52}}>
        Padrão visual: antes x depois
      </div>
      <div style={{display: 'flex', height: h1}}>
        <div style={{position: 'relative'}}>
          <Quadro novo={false} w={w} h={h1} cam={CAM_SALA} t={t} />
          <Etiqueta texto="ANTES" sub="padrão atual" cor="#6b6b78" />
        </div>
        <div style={{position: 'relative'}}>
          <Quadro novo w={w} h={h1} cam={CAM_SALA} t={t} />
          <Etiqueta texto="DEPOIS" sub="Zé 2.0 + luz nova" cor="#d9774b" />
        </div>
      </div>
      <div style={{display: 'flex', height: h2}}>
        <Quadro novo={false} w={w} h={h2} cam={CAM_ROSTO} t={t} />
        <Quadro novo w={w} h={h2} cam={CAM_ROSTO} t={t} />
      </div>
      <div style={{position: 'absolute', left: w - 3, top: topo, width: 6, bottom: 0, background: '#ffffff'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: topo + h1 - 3, height: 6, background: '#ffffff'}} />
    </AbsoluteFill>
  );
};
