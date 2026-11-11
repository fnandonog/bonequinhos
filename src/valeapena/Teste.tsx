// MONTAGEM do perfil VALE A PENA?: narração, planos, câmera, legenda de 1 palavra, card de número por plano,
// etapa do teste + chip, selo grande do veredito e CTA "link com desconto na bio".
import React from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FPS, Timings} from '../Video';
import {Cam} from '../v4/sets';
import {V3} from '../v4/planta';
import {SETS} from './sets';

const FONTE = "'Baloo 2', sans-serif";
const TINTA = '#16151c';

export type CardVP = {rotulo: string; valor?: string; num?: number; prefixo?: string; sufixo?: string; sub?: string; cor?: string};
export type PlanoVP = {set: string; cam: string | Cam; apartir?: number; p?: [number, number]; card?: CardVP};
export type CenaVP = {id: string; texto: string; etapa?: string; chip?: string; cta?: boolean; destaques?: string[]; planos: PlanoVP[]};
export type VereditoVP = {cena: string; texto: string; sub?: string; cor?: string};
export type RoteiroValeAPena = {
  id: string; titulo: string; linha2?: string; site?: string;
  cta?: {titulo?: string; texto?: string; botao?: string | null};
  veredito?: VereditoVP; cenas: CenaVP[];
};
export type TesteProps = {roteiro: RoteiroValeAPena; timings: Timings; comAudio: boolean};

type PlanoT = PlanoVP & {de: number; ate: number; cena: number; cam: Cam};
const ease = Easing.inOut(Easing.cubic);

export function montar(roteiro: RoteiroValeAPena, timings: Timings) {
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
      if (!set) throw new Error(`set "${pl.set}" não existe em src/valeapena/sets.tsx`);
      const cam = typeof pl.cam === 'string' ? set.cams[pl.cam] : pl.cam;
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
  lab: {hemi: ['#fffaf0', '#a89a88', 1.2], sol: ['#fff3dd', 1.8], pos: [2.0, 4.0, 3.0]},
  escuro: {hemi: ['#a9c4ff', '#0b1328', 0.95], sol: ['#e6eeff', 1.5], pos: [1.0, 2.5, 2.5]},
  alerta: {hemi: ['#ffc2b0', '#2a0d12', 0.95], sol: ['#ffe6dc', 1.5], pos: [1.0, 2.5, 2.5]},
  cozinha: {hemi: ['#fff6e8', '#b98a5b', 1.15], sol: ['#fff0d6', 1.9], pos: [2.5, 4.5, 2.5]},
  sala: {hemi: ['#fff3e0', '#b08560', 1.15], sol: ['#fff0d6', 1.8], pos: [1.5, 4.5, 3.5]},
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
  const tam = txt.length > 12 ? 84 : txt.length > 9 ? 98 : 118;
  return (
    <div style={{position: 'absolute', top: 300, left: 40, right: 140, textAlign: 'center', transform: `scale(${0.75 + 0.25 * s})`}}>
      <span style={{fontFamily: FONTE, fontWeight: 800, fontSize: tam, color: destaque ? '#ffd23f' : '#ffffff', WebkitTextStroke: `16px ${TINTA}`, paintOrder: 'stroke fill', textShadow: '0 8px 0 rgba(0,0,0,0.3)', letterSpacing: 1}}>{txt}</span>
    </div>
  );
};

// card de número grande (1 por plano)
const CardNumero: React.FC<{card: CardVP; df: number; dur: number}> = ({card, df, dur}) => {
  const a = spring({frame: df - 4, fps: FPS, config: {damping: 13, stiffness: 170}});
  const sai = interpolate(df, [dur - 5, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (df < 4) return null;
  const k = Math.min(1, (df - 4) / 18);
  const valor = card.num !== undefined ? `${card.prefixo ?? ''}${Math.round(card.num * Easing.out(Easing.cubic)(k)).toLocaleString('pt-BR')}${card.sufixo ?? ''}` : card.valor ?? '';
  return (
    <div style={{position: 'absolute', left: 60, right: 140, top: 1160, display: 'flex', justifyContent: 'center', opacity: sai}}>
      <div style={{transform: `translateY(${(1 - a) * 60}px) scale(${0.9 + 0.1 * a})`, opacity: Math.min(1, a * 1.4), background: 'rgba(22,21,28,0.9)', borderRadius: 36, padding: '18px 40px 22px', boxShadow: '0 16px 40px rgba(0,0,0,0.35)', border: '4px solid rgba(255,255,255,0.12)', textAlign: 'center', maxWidth: 860}}>
        <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 42, color: '#d9d6e6', letterSpacing: 3, lineHeight: 1.1}}>{card.rotulo.toUpperCase()}</div>
        {valor && <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: valor.length > 14 ? 76 : valor.length > 10 ? 92 : 124, color: card.cor ?? '#ff9f1c', lineHeight: 1.0, marginTop: 6}}>{valor}</div>}
        {card.sub && <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 36, color: '#a9a5bb', marginTop: 4}}>{card.sub}</div>}
      </div>
    </div>
  );
};

// etapa do teste numerada + chip com o dado-chave
const Topo: React.FC<{m: ReturnType<typeof montar>; f: number; i: number}> = ({m, f, i}) => {
  const cn = m.cenas[i];
  if (!cn.c.etapa) return null;
  const etapas = [...new Set(m.cenas.slice(0, i + 1).filter((c) => c.c.etapa).map((c) => c.c.etapa))];
  const n = etapas.length;
  const pop = spring({frame: f - cn.de, fps: FPS, config: {damping: 14}});
  return (
    <div style={{position: 'absolute', top: 150, left: 40, right: 140, display: 'flex', justifyContent: 'center', gap: 14}}>
      <div style={{background: TINTA, color: '#fff', fontFamily: FONTE, fontWeight: 800, fontSize: 46, padding: '6px 28px', borderRadius: 40, transform: `scale(${0.9 + 0.1 * pop})`}}>
        <span style={{color: '#ffd23f'}}>{n}.</span> {cn.c.etapa}
      </div>
      {cn.c.chip && (
        <div style={{background: '#fff', color: TINTA, fontFamily: FONTE, fontWeight: 800, fontSize: 46, padding: '6px 28px', borderRadius: 40, border: `5px solid ${TINTA}`, transform: `scale(${pop})`}}>
          {cn.c.chip}
        </div>
      )}
    </div>
  );
};

// SELO do veredito: carimbo grande que bate na tela
const Selo: React.FC<{v: VereditoVP; df: number; top: number; esc?: number; lado?: 'centro' | 'esquerda'}> = ({v, df, top, esc = 1, lado = 'centro'}) => {
  const a = spring({frame: df, fps: FPS, config: {damping: 9, stiffness: 190}});
  const s = interpolate(a, [0, 1], [2.2, 1]) * esc;
  const cor = v.cor ?? '#2fbf71';
  return (
    <div style={{position: 'absolute', top, left: lado === 'esquerda' ? 10 : 40, right: 140, display: 'flex', justifyContent: lado === 'esquerda' ? 'flex-start' : 'center', opacity: Math.min(1, a * 2)}}>
      <div style={{transform: `scale(${s}) rotate(-8deg)`, transformOrigin: lado === 'esquerda' ? 'left center' : 'center', border: `14px solid ${cor}`, borderRadius: 40, padding: '6px 54px 14px', background: 'rgba(255,255,255,0.92)', boxShadow: '0 18px 40px rgba(0,0,0,0.35)', textAlign: 'center'}}>
        <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 52, color: TINTA, letterSpacing: 6, lineHeight: 1.1}}>VEREDITO</div>
        <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 190, color: cor, lineHeight: 0.95, letterSpacing: 4}}>{v.texto}</div>
        {v.sub && <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 50, color: TINTA, lineHeight: 1.1}}>{v.sub}</div>}
      </div>
    </div>
  );
};

// chamada final: link com desconto na bio
const CTA: React.FC<{df: number; cta?: RoteiroValeAPena['cta']}> = ({df, cta}) => {
  const a = spring({frame: df - 4, fps: FPS, config: {damping: 12, stiffness: 150}});
  const b = spring({frame: df - 22, fps: FPS, config: {damping: 10, stiffness: 160}});
  const pulsa = 1 + Math.sin(df / 5) * 0.03 * b;
  return (
    <div style={{position: 'absolute', left: 60, right: 140, top: 1150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
      <div style={{transform: `scale(${a * pulsa})`, background: '#14213D', borderRadius: 34, padding: '14px 36px 18px', border: '6px solid #ffd23f', textAlign: 'center', boxShadow: '0 16px 40px rgba(0,0,0,0.35)'}}>
        <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 44, color: '#ffd23f', letterSpacing: 2}}>{cta?.titulo ?? 'LINK NA BIO'}</div>
        <div style={{fontFamily: FONTE, fontWeight: 800, fontSize: 62, color: '#ffffff', lineHeight: 1.05}}>{cta?.texto ?? 'com desconto'}</div>
      </div>
      {cta?.botao && (
        <div style={{transform: `scale(${b})`, background: '#2fbf71', borderRadius: 60, padding: '14px 48px', fontFamily: FONTE, fontWeight: 800, fontSize: 50, color: '#fff', boxShadow: '0 12px 0 #1f8a50'}}>{cta.botao}</div>
      )}
    </div>
  );
};

// título do gancho: já na tela no primeiro frame
const Titulo: React.FC<{titulo: string; linha2?: string; f: number}> = ({titulo, linha2, f}) => {
  const a = interpolate(spring({frame: f, fps: FPS, config: {damping: 11}}), [0, 1], [0.85, 1]) * interpolate(f, [56, 64], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (a <= 0.01) return null;
  return (
    <div style={{position: 'absolute', top: 480, left: 40, right: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${a})`}}>
      <div style={{background: '#ffd23f', border: `9px solid ${TINTA}`, borderRadius: 34, padding: '4px 40px', fontFamily: FONTE, fontWeight: 800, fontSize: 92, color: TINTA, boxShadow: '0 14px 0 rgba(0,0,0,0.25)', textAlign: 'center', lineHeight: 1.05}}>{titulo}</div>
      {linha2 && <div style={{marginTop: 14, background: TINTA, color: '#fff', fontFamily: FONTE, fontWeight: 800, fontSize: 54, padding: '2px 30px', borderRadius: 24}}>{linha2}</div>}
    </div>
  );
};

export const Teste: React.FC<TesteProps> = ({roteiro, timings, comAudio}) => {
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
  const luz = LUZ[set.luz ?? 'lab'];
  const ceu = set.fundo ?? ['#e9e3d6', '#f6f1e7'];
  const icn = pl.cena;
  const cn = m.cenas[icn];
  // selo do veredito: grande no 1º plano da cena do veredito e de novo no final (CTA)
  const v = roteiro.veredito;
  const iv = v ? m.cenas.findIndex((c) => c.c.id === v.cena) : -1;
  const primeiroPlanoV = iv >= 0 ? m.planos.find((q) => q.cena === iv) : undefined;
  const seloGrande = !!(v && primeiroPlanoV && ip === m.planos.indexOf(primeiroPlanoV));
  const seloFinal = !!(v && cn.c.cta && m.planos[ip - 1]?.cena !== icn);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${ceu[0]} 0%, ${ceu[1]} 70%)`}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 42, near: 0.02, far: 60, position: [2, 2, 2]}}>
        <Camera pl={pl} f={f} />
        <hemisphereLight args={[luz.hemi[0], luz.hemi[1], luz.hemi[2]]} />
        <directionalLight position={luz.pos as unknown as V3} color={luz.sol[0]} intensity={luz.sol[1]} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-3.5} shadow-camera-right={3.5} shadow-camera-top={3.5} shadow-camera-bottom={-3.5} shadow-camera-far={20} shadow-bias={-0.0004} />
        <group key={ip}>{set.render({t, p})}</group>
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, rgba(0,0,0,0.18) 100%)'}} />
      <Topo m={m} f={f} i={icn} />
      {icn === 0 && <Titulo titulo={roteiro.titulo} linha2={roteiro.linha2} f={f} />}
      <Palavra cn={cn} f={f} />
      {seloGrande && v && <Selo v={v} df={f - pl.de - 8} top={520} />}
      {seloFinal && v && <Selo v={v} df={f - cn.de} top={560} esc={0.62} lado="esquerda" />}
      {pl.card && <CardNumero card={pl.card} df={f - pl.de} dur={dur} />}
      {cn.c.cta && <CTA df={f - cn.de} cta={roteiro.cta} />}
      {m.cenas.map((c) => (
        <Sequence key={c.c.id} from={c.de} durationInFrames={Math.max(1, c.ate - c.de)}>
          {comAudio && <Audio src={staticFile(`audio/${roteiro.id}/${c.c.id}.mp3`)} />}
        </Sequence>
      ))}
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
      {primeiroPlanoV && (
        <Sequence from={primeiroPlanoV.de + 8} durationInFrames={20}>
          <Audio src={staticFile('sfx/pop.mp3')} volume={0.45} />
        </Sequence>
      )}
      <div style={{position: 'absolute', bottom: 0, left: 0, height: 12, width: `${(f / durationInFrames) * 100}%`, background: '#ffd23f'}} />
    </AbsoluteFill>
  );
};
