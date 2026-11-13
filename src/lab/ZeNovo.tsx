// LAB: o Zé 2.0 foi para produção em src/estilo/ze.tsx (é o Boneco de todos os vídeos). Aqui só o atalho do lab.
import React from 'react';
import {Boneco, K_ZE} from '../estilo/ze';
import type {AcaoBoneco, Visual} from '../estilo/ze';
import type {V3} from '../estilo/visual';

export type AcaoZe = AcaoBoneco;
export const ZeNovo: React.FC<{pos: V3; rotY?: number; acao?: AcaoZe; t: number; v?: Visual; esc?: number}> = ({esc = 1.08, v = {}, ...p}) => (
  <Boneco {...p} v={{colete: null, capacete: null, ...v}} esc={esc / K_ZE} />
);
