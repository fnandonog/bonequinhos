import React from 'react';
import {Composition} from 'remotion';
import {Video, FPS, Roteiro, Timings} from './Video';
import roteiro from '../roteiros/air-fryer.json';
import timings from '../public/audio/air-fryer/timings.json';

export const Root: React.FC = () => {
  const t = timings as Timings;
  const total = t.cenas.reduce((s, c) => s + Math.round(c.duracao * FPS), 0);
  return (
    <Composition
      id="air-fryer"
      component={Video}
      durationInFrames={total}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{roteiro: roteiro as Roteiro, timings: t, comAudio: !t.estimado}}
    />
  );
};
