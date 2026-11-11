import React from 'react';
import {Composition} from 'remotion';
import {Video, FPS, Roteiro, Timings} from './Video';
import {Serie, RoteiroSerie} from './v2/Serie';
import {Construcao, RoteiroConstrucao} from './v3/Construcao';
import {Obra, RoteiroObra} from './v4/Obra';
import {Receita, RoteiroReceita} from './cozinha/Receita';
import {Historia, RoteiroHistoria} from './historia/Historia';
import roteiroGladiador from '../roteiros/um-dia-como-gladiador-em-roma.json';
import timingsGladiador from '../public/audio/um-dia-como-gladiador-em-roma/timings.json';
import roteiroBolo from '../roteiros/bolo-cenoura.json';
import timingsBolo from '../public/audio/bolo-cenoura/timings.json';
import roteiroBrownie from '../roteiros/brownie-facil.json';
import timingsBrownie from '../public/audio/brownie-facil/timings.json';
import roteiroCasa from '../roteiros/casa-50m2.json';
import timingsCasa from '../public/audio/casa-50m2/timings.json';
import roteiroEdicula from '../roteiros/edicula-com-churrasqueira.json';
import timingsEdicula from '../public/audio/edicula-com-churrasqueira/timings.json';
import roteiroKit from '../roteiros/kitnet.json';
import timingsKit from '../public/audio/kitnet/timings.json';
import roteiroKit2 from '../roteiros/kitnet-v2.json';
import timingsKit2 from '../public/audio/kitnet-v2/timings.json';
import roteiroAir from '../roteiros/air-fryer.json';
import timingsAir from '../public/audio/air-fryer/timings.json';
import roteiroSono from '../roteiros/sem-dormir.json';
import timingsSono from '../public/audio/sem-dormir/timings.json';

const total = (t: Timings) => t.cenas.reduce((s, c) => s + Math.round(c.duracao * FPS), 0);

export const Root: React.FC = () => {
  const ta = timingsAir as Timings;
  const ts = timingsSono as Timings;
  return (
    <>
      <Composition id="air-fryer" component={Video} durationInFrames={total(ta)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroAir as unknown as Roteiro, timings: ta, comAudio: !ta.estimado}} />
      <Composition id="sem-dormir" component={Serie} durationInFrames={total(ts)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroSono as unknown as RoteiroSerie, timings: ts, comAudio: !ts.estimado}} />
      <Composition id="kitnet" component={Construcao} durationInFrames={total(timingsKit as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroKit as unknown as RoteiroConstrucao, timings: timingsKit as Timings, comAudio: !(timingsKit as Timings).estimado, layout: 'kitnet'}} />
      <Composition id="kitnet-v2" component={Construcao} durationInFrames={total(timingsKit2 as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroKit2 as unknown as RoteiroConstrucao, timings: timingsKit2 as Timings, comAudio: true, layout: 'kitnet2'}} />
      <Composition id="casa-50m2" component={Obra} durationInFrames={total(timingsCasa as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroCasa as unknown as RoteiroObra, timings: timingsCasa as Timings, comAudio: !(timingsCasa as Timings).estimado}} />
      <Composition id="edicula-com-churrasqueira" component={Obra} durationInFrames={total(timingsEdicula as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroEdicula as unknown as RoteiroObra, timings: timingsEdicula as Timings, comAudio: !(timingsEdicula as Timings).estimado}} />
      <Composition id="bolo-cenoura" component={Receita} durationInFrames={total(timingsBolo as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroBolo as unknown as RoteiroReceita, timings: timingsBolo as Timings, comAudio: !(timingsBolo as Timings).estimado}} />
      <Composition id="brownie-facil" component={Receita} durationInFrames={total(timingsBrownie as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroBrownie as unknown as RoteiroReceita, timings: timingsBrownie as Timings, comAudio: !(timingsBrownie as Timings).estimado}} />
      <Composition id="um-dia-como-gladiador-em-roma" component={Historia} durationInFrames={total(timingsGladiador as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroGladiador as unknown as RoteiroHistoria, timings: timingsGladiador as Timings, comAudio: !(timingsGladiador as Timings).estimado}} />
    </>
  );
};
