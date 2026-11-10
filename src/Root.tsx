import React from 'react';
import {Composition} from 'remotion';
import {Video, FPS, Roteiro, Timings} from './Video';
import {Serie, RoteiroSerie} from './v2/Serie';
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
    </>
  );
};
