// Peças de montagem compartilhadas pelos 6 motores (referências do Fernando, 12/11/2026).
import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {MIX} from './visual';

// salto no tempo = flash branco de 6 frames no começo do plano (roteiro: "salto": true no plano)
export const FlashSalto: React.FC<{df: number}> = ({df}) => {
  if (df < 0 || df >= 6) return null;
  const a = 1 - df / 6;
  return <AbsoluteFill style={{background: '#ffffff', opacity: a * a * 0.95, pointerEvents: 'none'}} />;
};

// trilha de fundo opcional (roteiro: "trilha": "musica/arquivo.mp3" em public/), ~6 dB abaixo da voz
export const Trilha: React.FC<{src?: string; ativo: boolean}> = ({src, ativo}) => (ativo && src ? <Audio src={staticFile(src)} volume={MIX.trilha} loop /> : null);
