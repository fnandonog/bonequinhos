import React from 'react';
import {Composition, Still} from 'remotion';
import {Avatar, Banner, Nicho} from './marca/Marca';

const NICHOS: Nicho[] = ['receitas', 'historia', 'construiu', 'crimes', 'ricos', 'valeapena'];
import {Video, FPS, Roteiro, Timings} from './Video';
import {Serie, RoteiroSerie} from './v2/Serie';
import {Construcao, RoteiroConstrucao} from './v3/Construcao';
import roteiroKit from '../roteiros/kitnet.json';
import timingsKit from '../public/audio/kitnet/timings.json';
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
      {NICHOS.map((n) => (
        <React.Fragment key={n}>
          <Still id={`avatar-${n}`} component={Avatar} width={1080} height={1080} defaultProps={{nicho: n}} />
          <Still id={`banner-${n}`} component={Banner} width={2560} height={1440} defaultProps={{nicho: n}} />
        </React.Fragment>
      ))}
    </>
  );
};
