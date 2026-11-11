// MONTAGEM da série Zé na Cozinha: narração, planos, câmera, legenda de 1 palavra, cards de quantidade, passo + chip e CTA.
import React from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FPS, Timings} from '../Video';
import {Cam} from '../v4/sets';
import {SETS} from './sets';
import {V3} from '../v4/planta';

const FONTE = "'Baloo 2', sans-serif";
const TINTA = '#16151c';

export type Card = {rotulo: string; valor?: string; num?: number; prefixo?: string; sufixo?: string; sub?: string; cor?: string};
export type Plano = {set: string; cam: string | Cam; apartir?: number; p?: [number, number]; card?: Card};
export type CenaReceita = {id: string; texto: string; etapa?: string; chip?: string; cta?: boolean; destaques?: string[]; planos: Plano[]};
export type RoteiroReceita = {id: string; titulo: string; linha2?: string; site?: string; cenas: CenaReceita[]};
export type ReceitaProps = {roteiro: RoteiroReceita; timings: Timings; comAudio: boolean};

type PlanoT = Plano & {de: number; ate: number; cena: number; cam: Cam};
const ease = Easing.inOut(Easing.cubic);

export function montar(roteiro: RoteiroReceita, timings: Timings) {
  let t = 0;
  const cenas = roteiro.cenas.map((c) => {
    const tm = timings.cenas.find((x) => x.id === c.id)!;
    const de = Math.round(t * FPS);
    t += tm.duracao;
    return {c, tm, de, ate: Math.round(t * FPS)};
  });
  const planos: PlanoT[] = [];
  cenas.forEach((cn, i) => {
    cn.c.planos.forEach((pl) => {
      const w = pl.apartir ? cn.tm.palavras[pl.apartir] : undefined;
      const de = w ? cn.de + Math.round((w.inicio - 0.04) * FPS) : cn.de;
      const cam = typeof pl.cam === 'string' ? SETS[pl.set].cams[pl.cam] : pl.cam;
      if (!cam) throw new Error(`câmera "${pl.cam}" não existe no set "${pl.set}"`);
      planos.push({...pl, de, ate: 0, cena: i, cam});
    });
  });
  planos.forEach((p, i) => (p.ate = i + 1 < planos.length ? planos[i + 1].de : Math.round(t * FPS)));
  return {cenas, planos, total: Math.round(t * FPS)};
}

const Camera: React.FC<{pl: PlanoT; f: number}> = ({pl, f}) => {
  const {camera, gl} = useThree();
  const dur = Math.max(1, pl.ate - pl.de);
  const k = ease(Math.min(1, (f - pl.de) / dur));
  const c = pl.cam;
  const mix = (a: V3, b: V3): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const pos = mix(c.de, c.para);
  const alvo = c.alvoPara ? mix(c.alvo, c.alvoPara) : c.alvo;
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = c.fov ?? 42;
  cam.position.set(...pos);
  cam.lookAt(...alvo);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  gl.clippingPlanes = [];
  return null;
};

const LUZ = {
  cozinha: {hemi: ['#fff6e8', '#b98a5b', 1.15], sol: ['#fff0d6', 1.9], pos: [2.5, 4.5, 2.5]},
  forno: {hemi: ['#ffb070', '#3a1a0a', 0.7], sol: ['#ffa050', 1.4], pos: [0.5, 2, 1.5]},
  frio: {hemi: ['#b8d0ff', '#202838', 0.8], sol: ['#cfe0ff', 1.0], pos: [0.5, 2, 1.5]},
} as const;

// legenda: UMA palavra por vez, no alto e no centro
const Palavra: React.FC<{cn: ReturnType<typeof montar>['cenas'][number]; f: number}> = ({cn, f}) => {
  const t = (f - cn.de) / FPS;
  const ps = cn.tm.palavras;
  let i = -1;
  for (let k = 0; k < ps.length; k++) if (t >= ps[k].inicio - 0.02) i = k;
  if (i < 0) return null;
  const w = ps[i];
  const df = f - (cn.de + Math.round(w.inicio * FPS));
  const s = spring({frame: df, fps: FPS, config: {damping: 12, stiffness: 260}});
  const txt = w.palavra.toUpperCase();
  const destaque = /\d/.test(txt) || (cn.c.destaques ?? []).some((d) => txt.startsWith(d.toUpperCase()));
  const tam = txt.length > 10 ? 96 : 118;
  return (
    <div style={{position: 'absolute', top: 300, width: '100%', textAlign: 'center', transform: `scale(${0.75 + 0.25 * s})`}}>
      <span style={{fontFamily: FONTE, fontWeight: 800, fontSize: tam, color: destaque ? '#ffd23f' : '#ffffff', WebkitTextStroke: `16px ${TINTA}`, paintOrder: 'stroke fill', textShadow: '0 8px 0 rgba(0,0,0,0.3)', letterSpacing: 1}}>{txt}</span>
    </div>
  );
};

// card de número grande (1 por plano)
const CardNumero: React.FC<{card: Card; df: number; dur: number}> = ({card, df, dur}) => {
  const a = spring({frame: df - 4, fps: FPS, config: {damping: 13, stiffness: 170}});
  const sai = interpolate(df, [dur - 5, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (df < 4) return null;
  const k = Math.min(1, (df - 4) / 18);
  const valor = card.num !== undefined ? `${card.prefixo ?? ''}${Math.round(card.num * Easing.out(Easing.cubic)(k)).toLocaleString('pt-BR')}${card.sufixo ?? ''}` : card.valor ?? '';
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1160, display: 'flex', justifyContent: 'center', opacity: sai}}>
      <div style={{transform: `translateY(${(1 - a) * 60}px) scale(${0.9 + 0.1 * a})`, opacity: Math.min(1, a * 1.4), background: 'rgba(22,21,28,0.9)', borderRadius: 36, padding: '18px 44px 22px', boxShadow: '0 16px 40px rgba(0,0,0,0.35)', border: '4px solid rgba(255,255,255,0.12)', textAlign: 'center', maxWidth: 900}}>
        <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 44, color: '#d9d6e6', letterSpacing: 3, lineHeight: 1.1}}>{card.rotulo.toUpperCase()}</div>
        {valor && <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: valor.length > 12 ? 92 : 124, color: card.cor ?? '#ff9f1c', lineHeight: 1.0, marginTop: 6}}>{valor}</div>}
        {card.sub && <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 36, color: '#a9a5bb', marginTop: 4}}>{card.sub}</div>}
      </div>
    </div>
  );
};

// passo da receita + chip com o dado-chave (temperatura, tempo...)
const Topo: React.FC<{m: ReturnType<typeof montar>; f: number; i: number}> = ({m, f, i}) => {
  const cn = m.cenas[i];
  if (!cn.c.etapa) return null;
  const n = m.cenas.slice(0, i + 1).filter((c) => c.c.etapa).length;
  const pop = spring({frame: f - cn.de, fps: FPS, config: {damping: 14}});
  return (
    <div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center', gap: 14}}>
      <div style={{background: TINTA, color: '#fff', fontFamily: FONTE, fontWeight: 800, fontSize: 46, padding: '6px 28px', borderRadius: 40, transform: `scale(${0.9 + 0.1 * pop})`}}>
        <span style={{color: '#ffd23f'}}>PASSO {n}</span> {cn.c.etapa}
      </div>
      {cn.c.chip && (
        <div style={{background: '#fff', color: TINTA, fontFamily: FONTE, fontWeight: 800, fontSize: 46, padding: '6px 28px', borderRadius: 40, border: `5px solid ${TINTA}`, transform: `scale(${pop})`}}>
          {cn.c.chip}
        </div>
      )}
    </div>
  );
};

// chamada final: site + botão do Telegram
const CTA: React.FC<{site: string; df: number}> = ({site, df}) => {
  const a = spring({frame: df - 4, fps: FPS, config: {damping: 12, stiffness: 150}});
  const b = spring({frame: df - 22, fps: FPS, config: {damping: 10, stiffness: 160}});
  const pulsa = 1 + Math.sin(df / 5) * 0.03 * b;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1130, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
      <div style={{transform: `scale(${a})`, background: '#14213D', borderRadius: 34, padding: '14px 36px 18px', border: '6px solid #ffd23f', textAlign: 'center', boxShadow: '0 16px 40px rgba(0,0,0,0.35)'}}>
        <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 40, color: '#ffd23f', letterSpacing: 2}}>LINK NA BIO</div>
        <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 58, color: '#ffffff', lineHeight: 1.05}}>{site}</div>
      </div>
      <div style={{transform: `scale(${b * pulsa})`, background: '#229ED9', borderRadius: 60, padding: '14px 48px', fontFamily: FONTE, fontWeight: 800, fontSize: 54, color: '#fff', boxShadow: '0 12px 0 #1a7fb0'}}>
        ✈ 5 receitas por dia no Telegram
      </div>
    </div>
  );
};

const Titulo: React.FC<{titulo: string; linha2?: string; f: number}> = ({titulo, linha2, f}) => {
  const a = spring({frame: f, fps: FPS, config: {damping: 11}}) * interpolate(f, [52, 60], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (a <= 0.01) return null;
  return (
    <div style={{position: 'absolute', top: 470, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${a})`}}>
      <div style={{background: '#ffd23f', border: `9px solid ${TINTA}`, borderRadius: 34, padding: '4px 40px', fontFamily: FONTE, fontWeight: 800, fontSize: 84, color: TINTA, boxShadow: '0 14px 0 rgba(0,0,0,0.25)', textAlign: 'center', maxWidth: 940, lineHeight: 1.05}}>{titulo}</div>
      {linha2 && <div style={{marginTop: 14, background: TINTA, color: '#fff', fontFamily: FONTE, fontWeight: 800, fontSize: 50, padding: '2px 30px', borderRadius: 24}}>{linha2}</div>}
    </div>
  );
};

export const Receita: React.FC<ReceitaProps> = ({roteiro, timings, comAudio}) => {
  const f = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();
  const m = montar(roteiro, timings);
  let ip = m.planos.findIndex((p) => f >= p.de && f < p.ate);
  if (ip < 0) ip = f < m.planos[0].de ? 0 : m.planos.length - 1;
  const pl = m.planos[ip];
  const set = SETS[pl.set];
  const dur = Math.max(1, pl.ate - pl.de);
  const [p0, p1] = pl.p ?? [0, 1];
  const p = p0 + (p1 - p0) * Math.min(1, Math.max(0, (f - pl.de) / dur));
  const t = (f - pl.de) / FPS;
  const luz = LUZ[set.luz ?? 'cozinha'];
  const ceu = set.fundo ?? ['#f6d6ae', '#fbe3c2'];
  const icn = pl.cena;
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${ceu[0]} 0%, ${ceu[1]} 70%)`}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 42, near: 0.02, far: 60, position: [2, 2, 2]}}>
        <Camera pl={pl} f={f} />
        <hemisphereLight args={[luz.hemi[0], luz.hemi[1], luz.hemi[2]]} />
        <directionalLight position={luz.pos as unknown as V3} color={luz.sol[0]} intensity={luz.sol[1]} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-3.5} shadow-camera-right={3.5} shadow-camera-top={3.5} shadow-camera-bottom={-3.5} shadow-camera-far={20} shadow-bias={-0.0004} />
        <group key={ip}>{set.render({t, p})}</group>
      </ThreeCanvas>
      {/* vinheta leve para dar profundidade e destacar o texto */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, rgba(0,0,0,0.18) 100%)'}} />
      <Topo m={m} f={f} i={icn} />
      {icn === 0 && <Titulo titulo={roteiro.titulo} linha2={roteiro.linha2} f={f} />}
      <Palavra cn={m.cenas[icn]} f={f} />
      {pl.card && <CardNumero card={pl.card} df={f - pl.de} dur={dur} />}
      {m.cenas[icn].c.cta && <CTA site={roteiro.site ?? 'precinhodeouro.com.br/receitas'} df={f - m.cenas[icn].de} />}
      {m.cenas.map((cn) => (
        <Sequence key={cn.c.id} from={cn.de} durationInFrames={Math.max(1, cn.ate - cn.de)}>
          {comAudio && <Audio src={staticFile(`audio/${roteiro.id}/${cn.c.id}.mp3`)} />}
        </Sequence>
      ))}
      {m.planos.map((p, i) => (
        <React.Fragment key={'s' + i}>
          {i > 0 && (
            <Sequence from={Math.max(0, p.de - 4)} durationInFrames={12}>
              <Audio src={staticFile('sfx/whoosh.mp3')} volume={0.1} />
            </Sequence>
          )}
          {p.card && (
            <Sequence from={p.de + 4} durationInFrames={10}>
              <Audio src={staticFile('sfx/pop.mp3')} volume={0.2} />
            </Sequence>
          )}
        </React.Fragment>
      ))}
      <div style={{position: 'absolute', bottom: 0, left: 0, height: 12, width: `${(f / durationInFrames) * 100}%`, background: '#ffd23f'}} />
    </AbsoluteFill>
  );
};
