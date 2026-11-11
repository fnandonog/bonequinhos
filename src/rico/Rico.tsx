// MONTAGEM do perfil Como Ficou Rico: narração, planos, câmera, legenda de 1 palavra, cards e o CONTADOR DE PATRIMÔNIO no topo.
// Mesma linguagem do src/v4/Obra.tsx / src/historia/Historia.tsx: "etapa + gasto" vira "ano + patrimônio".
// O patrimônio é texto ("O BAÚ", "+30 EMPRESAS": o que ele já tem) ou número em reais quando há fonte; o número conta animado.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FPS, Timings} from '../Video';
import {Cam} from '../v4/sets';
import {V3} from '../v4/planta';
import {LuzRico, SETS} from './sets';

const FONTE = "'Baloo 2', sans-serif";
const TINTA = '#16151c';

export type Card = {rotulo: string; valor?: string; num?: number; prefixo?: string; sufixo?: string; sub?: string; cor?: string};
export type Plano = {set: string; cam: string | Cam; apartir?: number; p?: [number, number]; card?: Card};
export type CenaRico = {id: string; texto: string; ano?: string; tem?: string; patrimonio?: number; destaques?: string[]; planos: Plano[]};
export type RoteiroRico = {id: string; titulo: string; linha2?: string; cenas: CenaRico[]};
export type RicoProps = {roteiro: RoteiroRico; timings: Timings; comAudio: boolean};

type PlanoT = Plano & {de: number; ate: number; cena: number; cam: Cam};
const ease = Easing.inOut(Easing.cubic);

export function montar(roteiro: RoteiroRico, timings: Timings) {
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
      const set = SETS[pl.set];
      if (!set) throw new Error(`set "${pl.set}" não existe em src/rico/sets.tsx`);
      const cam = typeof pl.cam === 'string' ? set.cams[pl.cam] : pl.cam;
      if (!cam) throw new Error(`câmera "${pl.cam}" não existe no set "${pl.set}"`);
      planos.push({...pl, de, ate: 0, cena: i, cam});
    });
  });
  planos.forEach((p, i) => (p.ate = i + 1 < planos.length ? planos[i + 1].de : Math.round(t * FPS)));
  return {cenas, planos, total: Math.round(t * FPS)};
}

const posCam = (pl: PlanoT, f: number) => {
  const dur = Math.max(1, pl.ate - pl.de);
  const k = ease(Math.min(1, Math.max(0, (f - pl.de) / dur)));
  const c = pl.cam;
  const mix = (a: V3, b: V3): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  return {pos: mix(c.de, c.para), alvo: c.alvoPara ? mix(c.alvo, c.alvoPara) : c.alvo};
};

const Camera: React.FC<{pl: PlanoT; f: number}> = ({pl, f}) => {
  const {camera, gl} = useThree();
  const {pos, alvo} = posCam(pl, f);
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = pl.cam.fov ?? 42;
  cam.near = 0.05;
  cam.far = 2500;
  cam.position.set(...pos);
  cam.lookAt(...alvo);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  gl.clippingPlanes = [];
  return null;
};

const LUZ: Record<LuzRico, {hemi: [string, string, number]; sol: [string, number]; dir: V3}> = {
  dia: {hemi: ['#ffffff', '#b9a57a', 1.05], sol: ['#fff2dc', 2.1], dir: [0.45, 0.8, 0.4]},
  tarde: {hemi: ['#ffd9b0', '#8f6a5a', 0.85], sol: ['#ffb070', 2.3], dir: [-0.7, 0.42, 0.55]},
  interior: {hemi: ['#fff0d8', '#7a5a40', 1.0], sol: ['#ffe0b0', 1.3], dir: [0.4, 0.85, 0.5]},
  nublado: {hemi: ['#c9ccd6', '#5a5560', 0.9], sol: ['#e0e4ee', 1.1], dir: [0.3, 0.85, 0.45]},
};

// sol com sombra centrada no que a câmera olha (vale para o Coliseu inteiro e para um close de 3 m)
const Sol: React.FC<{pl: PlanoT; luz: LuzRico}> = ({pl, luz}) => {
  const L = LUZ[luz];
  const alvo = pl.cam.alvo;
  const dist = Math.hypot(pl.cam.de[0] - alvo[0], pl.cam.de[1] - alvo[1], pl.cam.de[2] - alvo[2]);
  const R = Math.min(160, Math.max(7, dist * 0.9));
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(alvo[0], alvo[1], alvo[2]);
  tgt.updateMatrixWorld();
  const n = Math.hypot(...L.dir);
  const pos: V3 = [alvo[0] + (L.dir[0] / n) * R * 2, alvo[1] + (L.dir[1] / n) * R * 2, alvo[2] + (L.dir[2] / n) * R * 2];
  return (
    <>
      <primitive object={tgt} />
      <directionalLight target={tgt} position={pos} color={L.sol[0]} intensity={L.sol[1]} castShadow shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-R} shadow-camera-right={R} shadow-camera-top={R} shadow-camera-bottom={-R} shadow-camera-near={0.5} shadow-camera-far={R * 5} shadow-bias={-0.0005} />
    </>
  );
};

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

// card grande (1 por plano)
const CardNumero: React.FC<{card: Card; df: number; dur: number}> = ({card, df, dur}) => {
  const a = spring({frame: df - 4, fps: FPS, config: {damping: 13, stiffness: 170}});
  const sai = interpolate(df, [dur - 5, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (df < 4) return null;
  const k = Math.min(1, (df - 4) / 18);
  const valor = card.num !== undefined ? `${card.prefixo ?? ''}${Math.round(card.num * Easing.out(Easing.cubic)(k)).toLocaleString('pt-BR')}${card.sufixo ?? ''}` : card.valor ?? '';
  return (
    <div style={{position: 'absolute', left: 60, right: 140, top: 1160, display: 'flex', justifyContent: 'center', opacity: sai}}>
      <div style={{transform: `translateY(${(1 - a) * 60}px) scale(${0.9 + 0.1 * a})`, opacity: Math.min(1, a * 1.4), background: 'rgba(22,21,28,0.9)', borderRadius: 36, padding: '18px 40px 22px', boxShadow: '0 16px 40px rgba(0,0,0,0.35)', border: '4px solid rgba(255,255,255,0.12)', textAlign: 'center', maxWidth: 860}}>
        <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 42, color: '#d9d6e6', letterSpacing: 3, lineHeight: 1.1}}>{card.rotulo.toUpperCase()}</div>
        {valor && <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: valor.length > 16 ? 70 : valor.length > 11 ? 88 : 124, color: card.cor ?? '#ff9f1c', lineHeight: 1.0, marginTop: 6}}>{valor}</div>}
        {card.sub && <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 34, color: '#a9a5bb', marginTop: 4}}>{card.sub}</div>}
      </div>
    </div>
  );
};

// R$ em formato curto: 739 MI, 2,67 BI
const curto = (v: number) => {
  const a = Math.abs(v);
  const sinal = v < 0 ? '−' : '';
  if (a >= 1e9) return `${sinal}R$ ${(a / 1e9).toLocaleString('pt-BR', {minimumFractionDigits: a % 1e8 ? 2 : 1, maximumFractionDigits: 2})} BI`;
  if (a >= 1e6) return `${sinal}R$ ${Math.round(a / 1e6).toLocaleString('pt-BR')} MI`;
  return `${sinal}R$ ${Math.round(a).toLocaleString('pt-BR')}`;
};

// contador de topo: ANO + PATRIMÔNIO (o que ele já tem, ou o valor com fonte, contando animado)
const Topo: React.FC<{m: ReturnType<typeof montar>; f: number; i: number}> = ({m, f, i}) => {
  const cn = m.cenas[i];
  const ano = cn.c.ano;
  if (!ano) return null;
  const ant = m.cenas.slice(0, i).reverse().find((c) => c.c.patrimonio !== undefined)?.c.patrimonio ?? 0;
  const k = Easing.out(Easing.cubic)(Math.min(1, Math.max(0, (f - cn.de - 10) / 26)));
  const num = cn.c.patrimonio;
  // número: conta do valor anterior até o novo (com 2 casas no fim para não "pular")
  const cur = num !== undefined ? (k >= 1 ? num : ant + (num - ant) * k) : 0;
  const valor = num !== undefined ? curto(cur) : (cn.c.tem ?? '');
  const anterior = i > 0 ? m.cenas[i - 1].c : null;
  const mudou = !anterior || anterior.tem !== cn.c.tem || anterior.patrimonio !== num;
  const pop = mudou ? spring({frame: f - cn.de - (num !== undefined ? 36 : 0), fps: FPS, config: {damping: 9}}) : 1;
  const anoMudou = !anterior || anterior.ano !== ano;
  const popAno = anoMudou ? spring({frame: f - cn.de, fps: FPS, config: {damping: 12}}) : 1;
  const neg = num !== undefined && cur < 0;
  return (
    <div style={{position: 'absolute', top: 150, left: 60, right: 140, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'nowrap'}}>
      <div style={{background: TINTA, color: '#ffd23f', fontFamily: FONTE, fontWeight: 800, fontSize: 46, padding: '6px 24px', borderRadius: 40, whiteSpace: 'nowrap', transform: `scale(${0.85 + 0.15 * popAno})`}}>
        {ano}
      </div>
      <div style={{background: neg ? '#ff5d5d' : '#fff', color: TINTA, fontFamily: FONTE, fontWeight: 800, fontSize: valor.length > 13 ? 38 : 46, padding: '6px 24px', borderRadius: 40, border: `5px solid ${TINTA}`, transform: `scale(${0.9 + 0.1 * pop})`, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 10}}>
        <span style={{fontSize: 26, color: neg ? TINTA : '#6b6880', letterSpacing: 1}}>{neg ? 'DÍVIDA' : num !== undefined ? 'FORTUNA' : 'TEM'}</span>
        {valor}
      </div>
    </div>
  );
};

const Titulo: React.FC<{titulo: string; linha2?: string; f: number}> = ({titulo, linha2, f}) => {
  const a = spring({frame: f, fps: FPS, config: {damping: 11}}) * interpolate(f, [52, 60], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (a <= 0.01) return null;
  return (
    <div style={{position: 'absolute', top: 470, left: 0, right: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${a})`}}>
      <div style={{background: '#ffd23f', border: `9px solid ${TINTA}`, borderRadius: 34, padding: '4px 40px', fontFamily: FONTE, fontWeight: 800, fontSize: 84, color: TINTA, boxShadow: '0 14px 0 rgba(0,0,0,0.25)', textAlign: 'center', maxWidth: 900, lineHeight: 1.05}}>{titulo}</div>
      {linha2 && <div style={{marginTop: 14, background: TINTA, color: '#fff', fontFamily: FONTE, fontWeight: 800, fontSize: 50, padding: '2px 30px', borderRadius: 24}}>{linha2}</div>}
    </div>
  );
};

export const Rico: React.FC<RicoProps> = ({roteiro, timings, comAudio}) => {
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
  const luz = set.luz ?? 'dia';
  const L = LUZ[luz];
  const ceu = set.ceu ?? ['#6fbcf2', '#fdf0d8'];
  const icn = pl.cena;
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${ceu[0]} 0%, ${ceu[1]} 70%)`}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 42, near: 0.05, far: 2500, position: [10, 8, 12]}}>
        <Camera pl={pl} f={f} />
        {set.nevoa && <fog attach="fog" args={[ceu[1], set.nevoa[0], set.nevoa[1]]} />}
        <hemisphereLight args={[L.hemi[0], L.hemi[1], L.hemi[2]]} />
        <Sol key={'sol' + ip} pl={pl} luz={luz} />
        <group key={ip}>{set.render({t, p})}</group>
      </ThreeCanvas>
      {/* vinheta leve para dar profundidade e destacar o texto */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, rgba(0,0,0,0.18) 100%)'}} />
      <Topo m={m} f={f} i={icn} />
      {icn === 0 && <Titulo titulo={roteiro.titulo} linha2={roteiro.linha2} f={f} />}
      <Palavra cn={m.cenas[icn]} f={f} />
      {pl.card && <CardNumero card={pl.card} df={f - pl.de} dur={dur} />}
      {m.cenas.map((cn) => (
        <Sequence key={cn.c.id} from={cn.de} durationInFrames={Math.max(1, cn.ate - cn.de)}>
          {comAudio && <Audio src={staticFile(`audio/${roteiro.id}/${cn.c.id}.mp3`)} />}
        </Sequence>
      ))}
      {m.cenas.map((cn, i) =>
        i > 0 && (cn.c.patrimonio !== undefined || cn.c.tem !== m.cenas[i - 1].c.tem) ? (
          <Sequence key={'m' + cn.c.id} from={cn.de + 10} durationInFrames={20}>
            <Audio src={staticFile('sfx/moeda.mp3')} volume={0.3} />
          </Sequence>
        ) : null,
      )}
      {m.planos.map((q, i) => (
        <React.Fragment key={'s' + i}>
          {i > 0 && (
            <Sequence from={Math.max(0, q.de - 4)} durationInFrames={12}>
              <Audio src={staticFile('sfx/whoosh.mp3')} volume={0.1} />
            </Sequence>
          )}
          {q.card && (
            <Sequence from={q.de + 4} durationInFrames={10}>
              <Audio src={staticFile('sfx/pop.mp3')} volume={0.2} />
            </Sequence>
          )}
        </React.Fragment>
      ))}
      <div style={{position: 'absolute', bottom: 0, left: 0, height: 12, width: `${(f / durationInFrames) * 100}%`, background: '#ffd23f'}} />
    </AbsoluteFill>
  );
};
