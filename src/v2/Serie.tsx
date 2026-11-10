import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FPS, Legenda, Palavra, Timings} from '../Video';
import {VISUAIS, FONTE} from './Cenas';
import {LINHA} from './Personagem';

export type RoteiroSerie = {id: string; serie: string; titulo: string; cenas: {id: string; texto: string; tomadas: {visual: string; aPartirDaPalavra: number}[]}[]};
export type SerieProps = {roteiro: RoteiroSerie; timings: Timings; comAudio: boolean};

const Tomada: React.FC<{visual: string; palavras: Palavra[]; offset: number; dur: number}> = ({visual, palavras, offset, dur}) => {
  const f = useCurrentFrame();
  const t = f / FPS + offset;
  const falando = palavras.some((p) => t >= p.inicio && t <= p.fim);
  const entra = spring({frame: f, fps: FPS, config: {damping: 18, stiffness: 160}});
  const zoom = 1.1 - entra * 0.1 + (f / (dur * FPS)) * 0.06;
  const C = VISUAIS[visual];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 55%'}}>{C ? <C falando={false} prog={f / Math.max(1, dur * FPS)} /> : null}</AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [0, 3], [0.4, 0], {extrapolateRight: 'clamp'})}} />
    </AbsoluteFill>
  );
};

const TituloGancho: React.FC<{serie: string; titulo: string}> = ({serie, titulo}) => {
  const f = useCurrentFrame();
  const a = spring({frame: f, fps: FPS, config: {damping: 10}});
  const b = spring({frame: f - 8, fps: FPS, config: {damping: 9}});
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 230}}>
      <div style={{transform: `scale(${a}) rotate(-3deg)`, background: '#fff', border: `10px solid ${LINHA}`, borderRadius: 30, padding: '6px 36px', fontFamily: FONTE, fontWeight: 800, fontSize: 70, color: LINHA}}>{serie.toUpperCase()}</div>
      <div style={{marginTop: 24, transform: `scale(${b}) rotate(2deg)`, background: '#ffd23f', border: `12px solid ${LINHA}`, borderRadius: 36, padding: '4px 40px', maxWidth: 900, textAlign: 'center', lineHeight: 1.05, fontFamily: FONTE, fontWeight: 800, fontSize: 96, color: LINHA, boxShadow: '0 16px 0 rgba(0,0,0,0.3)'}}>{titulo.toUpperCase()}</div>
    </AbsoluteFill>
  );
};

export const Serie: React.FC<SerieProps> = ({roteiro, timings, comAudio}) => {
  const {durationInFrames} = useVideoConfig();
  const f = useCurrentFrame();
  let inicio = 0;
  const cortes: number[] = [];
  const blocos = roteiro.cenas.map((c, idx) => {
    const tm = timings.cenas.find((x) => x.id === c.id)!;
    const de = Math.round(inicio * FPS);
    const dur = Math.round(tm.duracao * FPS);
    inicio += tm.duracao;
    const inis = c.tomadas.map((t, i) => (i === 0 ? 0 : Math.max(0, (tm.palavras[t.aPartirDaPalavra]?.inicio ?? tm.duracao / 2) - 0.08)));
    inis.forEach((x) => cortes.push(de + Math.round(x * FPS)));
    return (
      <Sequence key={c.id} from={de} durationInFrames={dur}>
        {c.tomadas.map((t, i) => {
          const fim = i === c.tomadas.length - 1 ? tm.duracao : inis[i + 1];
          const a = Math.round(inis[i] * FPS);
          return (
            <Sequence key={i} from={a} durationInFrames={Math.max(1, Math.round(fim * FPS) - a)} layout="none">
              <Tomada visual={t.visual} palavras={tm.palavras} offset={inis[i]} dur={fim - inis[i]} />
            </Sequence>
          );
        })}
        {idx === 0 && <TituloGancho serie={roteiro.serie} titulo={roteiro.titulo} />}
        {idx > 0 && <Legenda palavras={tm.palavras} />}
        {comAudio && <Audio src={staticFile(`audio/${roteiro.id}/${c.id}.mp3`)} />}
      </Sequence>
    );
  });
  return (
    <AbsoluteFill style={{background: '#222'}}>
      {blocos}
      {cortes.slice(1).map((c, i) => (
        <Sequence key={i} from={Math.max(0, c - 4)} durationInFrames={15}>
          <Audio src={staticFile('sfx/whoosh.mp3')} volume={0.35} />
        </Sequence>
      ))}
      <div style={{position: 'absolute', top: 120, left: 40, background: 'rgba(43,34,51,0.85)', color: '#ffd23f', fontFamily: FONTE, fontWeight: 800, fontSize: 40, padding: '4px 24px', borderRadius: 18}}>@ze.explica</div>
      <div style={{position: 'absolute', bottom: 0, left: 0, height: 14, width: `${(f / durationInFrames) * 100}%`, background: '#ffd23f'}} />
    </AbsoluteFill>
  );
};
