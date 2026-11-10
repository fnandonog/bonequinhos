import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FPS, Legenda, Timings} from '../Video';
import {Ze3D, Acao} from './Ze3D';
import {KITNET} from './layouts/kitnet';
import {KITNET2, Peca2} from './layouts/kitnet2';

const LAYOUTS: Record<string, Peca2[]> = {kitnet: KITNET, kitnet2: KITNET2};

const FONTE = "'Baloo 2', sans-serif";
const LINHA = '#2b2233';
type V3 = [number, number, number];

export type CenaConstrucao = {
  id: string;
  texto: string;
  zona?: string;
  item?: {nome: string; preco: number};
  camera: {pos: V3; alvo: V3};
  takes?: {pos: V3; alvo: V3; palavra: number; corte?: boolean}[];
  mostrar?: string[];
  ze?: {de: [number, number]; para?: [number, number]; acao?: Acao};
  // corte das paredes (casa de bonecas) para ver o interior
  cutaway?: boolean;
  // ficha técnica: [descrição, preço] que entram uma a uma
  ficha?: [string, number | string][];
};
export type RoteiroConstrucao = {id: string; serie?: string; titulo: string; orcamento: number; cenas: CenaConstrucao[]};
export type ConstrucaoProps = {roteiro: RoteiroConstrucao; timings: Timings; comAudio: boolean; layout: string};

const brl = (v: number) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
const ease = Easing.inOut(Easing.cubic);

type Linha = {de: number; dur: number; c: CenaConstrucao};

type Take = {de: number; pos: V3; alvo: V3; corte: boolean};

const Camera: React.FC<{takes: Take[]}> = ({takes}) => {
  const f = useCurrentFrame();
  const {camera} = useThree();
  let i = 0;
  for (let k = 0; k < takes.length; k++) if (f >= takes[k].de) i = k;
  const atual = takes[i];
  const prox = takes[i + 1];
  const ant = takes[Math.max(0, i - 1)];
  const dt = f - atual.de;
  const k = i === 0 || atual.corte ? 1 : ease(Math.min(1, dt / 12));
  const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  let p = mix(ant.pos, atual.pos, k);
  const alvo = mix(ant.alvo, atual.alvo, k);
  // empurrão contínuo de câmera (dolly-in) dentro de cada take
  const durTake = prox ? prox.de - atual.de : 90;
  const push = Math.min(1, dt / Math.max(1, durTake)) * 0.05;
  p = mix(p, alvo, push);
  // pequena órbita
  const ang = Math.sin(f / 60) * 0.06 + dt * 0.0015;
  const dx = p[0] - alvo[0];
  const dz = p[2] - alvo[2];
  camera.position.set(alvo[0] + dx * Math.cos(ang) - dz * Math.sin(ang), p[1], alvo[2] + dx * Math.sin(ang) + dz * Math.cos(ang));
  camera.lookAt(alvo[0], alvo[1], alvo[2]);
  // sobe o assunto na tela para sobrar espaço para a ficha técnica e a legenda
  (camera as unknown as {setViewOffset: (...a: number[]) => void}).setViewOffset(1080, 1920, 0, 70, 1080, 1920);
  camera.updateProjectionMatrix();
  return null;
};

const Surge: React.FC<{de: number; children: React.ReactNode}> = ({de, children}) => {
  const f = useCurrentFrame();
  if (f < de) return null;
  const s = spring({frame: f - de, fps: FPS, config: {damping: 11, stiffness: 140}});
  return (
    <group position={[0, (1 - s) * 2.5, 0]} scale={[Math.max(0.001, s), Math.max(0.001, s), Math.max(0.001, s)]}>
      {children}
    </group>
  );
};

const ZeNaCena: React.FC<{linhas: Linha[]}> = ({linhas}) => {
  const f = useCurrentFrame();
  let i = linhas.findIndex((l) => f >= l.de && f < l.de + l.dur);
  if (i < 0) i = linhas.length - 1;
  // usa a última cena que define o Zé
  let j = i;
  while (j > 0 && !linhas[j].c.ze) j--;
  const z = linhas[j].c.ze ?? {de: [3.5, 4.5] as [number, number]};
  const para = z.para ?? z.de;
  const l = linhas[j];
  const k = j === i ? Math.min(1, (f - l.de) / Math.max(1, l.dur * 0.6)) : 1;
  const x = z.de[0] + (para[0] - z.de[0]) * ease(k);
  const zz = z.de[1] + (para[1] - z.de[1]) * ease(k);
  const andando = j === i && k < 1 && (para[0] !== z.de[0] || para[1] !== z.de[1]);
  const cam = linhas[i].c.camera.pos;
  const olhaCam = Math.atan2(cam[0] - x, cam[2] - zz);
  const dir = Math.atan2(para[0] - z.de[0], para[1] - z.de[1]);
  const dentro = Math.abs(x) < 2.4 && Math.abs(zz) < 2.9;
  return <Ze3D pos={[x, dentro ? 0.29 : 0, zz]} rotY={andando ? dir : olhaCam} acao={andando ? 'anda' : z.acao ?? 'parado'} />;
};

const Hud: React.FC<{linhas: Linha[]; orcamento: number}> = ({linhas, orcamento}) => {
  const f = useCurrentFrame();
  let saldo = orcamento;
  let ultimo: Linha | null = null;
  for (const l of linhas) {
    if (!l.c.item) continue;
    const dt = f - (l.de + 10);
    if (dt < 0) continue;
    const k = Math.min(1, dt / 20);
    saldo -= l.c.item.preco * ease(k);
    ultimo = l;
  }
  const i = Math.max(0, linhas.findIndex((l) => f >= l.de && f < l.de + l.dur));
  const cena = linhas[i];
  const itemAtivo = cena.c.item ? cena : null;
  const popItem = itemAtivo ? spring({frame: f - itemAtivo.de - 4, fps: FPS, config: {damping: 10}}) : 0;
  const popZona = spring({frame: f - cena.de, fps: FPS, config: {damping: 12}});
  const desconto = ultimo && ultimo.c.item ? f - (ultimo.de + 10) : 999;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 120, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{background: saldo < orcamento * 0.1 ? '#ff9f1c' : '#22b573', border: `8px solid ${LINHA}`, borderRadius: 60, padding: '4px 50px', fontFamily: FONTE, fontWeight: 800, fontSize: 92, color: '#fff', WebkitTextStroke: '3px #2b2233', paintOrder: 'stroke fill', boxShadow: '0 12px 0 rgba(0,0,0,0.25)', transform: `scale(${desconto < 20 ? 1 + Math.sin((desconto / 20) * Math.PI) * 0.08 : 1})`}}>
          {brl(saldo)}
        </div>
      </div>
      {ultimo && ultimo.c.item && desconto < 40 && (
        <div style={{position: 'absolute', top: 150 - desconto * 2, left: 790, fontFamily: FONTE, fontWeight: 800, fontSize: 58, color: '#ff4d4d', WebkitTextStroke: '6px #fff', paintOrder: 'stroke fill', opacity: interpolate(desconto, [0, 30, 40], [1, 1, 0])}}>
          − {brl(ultimo.c.item.preco)}
        </div>
      )}
      {itemAtivo && itemAtivo.c.item && (
        <div style={{position: 'absolute', top: 290, width: '100%', display: 'flex', justifyContent: 'center'}}>
          <div style={{transform: `scale(${popItem})`, background: '#fff', border: `7px solid ${LINHA}`, borderRadius: 40, padding: '2px 36px', fontFamily: FONTE, fontWeight: 800, fontSize: 56, color: LINHA}}>
            {itemAtivo.c.item.nome.toUpperCase()} · <span style={{color: '#e8222b'}}>{brl(itemAtivo.c.item.preco)}</span>
          </div>
        </div>
      )}
      {cena.c.zona && (
        <div style={{position: 'absolute', top: 410, width: '100%', textAlign: 'center', transform: `scale(${popZona})`, opacity: interpolate(f - cena.de, [40, 52], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), fontFamily: FONTE, fontWeight: 800, fontSize: 76, color: '#fff', WebkitTextStroke: `10px ${LINHA}`, paintOrder: 'stroke fill', textShadow: '0 10px 0 rgba(0,0,0,0.25)'}}>
          {cena.c.zona}
        </div>
      )}
    </AbsoluteFill>
  );
};

// altura das paredes: 1 normal, ~0.3 no modo casa de bonecas
const alturaParede = (linhas: Linha[], f: number) => {
  let i = linhas.findIndex((l) => f >= l.de && f < l.de + l.dur);
  if (i < 0) i = linhas.length - 1;
  const alvo = (j: number) => (j >= 0 && linhas[j].c.cutaway ? 0.3 : 1);
  const k = ease(Math.min(1, (f - linhas[i].de) / 8));
  return alvo(i - 1) + (alvo(i) - alvo(i - 1)) * k;
};

const Ficha: React.FC<{itens: [string, number | string][]; dur: number; item?: {nome: string; preco: number}}> = ({itens, dur, item}) => {
  const f = useCurrentFrame();
  const fs = itens.length > 6 ? 23 : 29;
  const passo = Math.max(5, Math.floor((dur * 0.8) / Math.max(1, itens.length)));
  const entra = spring({frame: f, fps: FPS, config: {damping: 13}});
  const sai = interpolate(f, [dur - 6, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 40, right: 40, bottom: 345, display: 'flex', justifyContent: 'center', opacity: sai}}>
      <div style={{opacity: Math.min(1, entra), transform: `scale(${0.94 + Math.min(1, entra) * 0.06})`, background: 'rgba(255,255,255,0.96)', border: `6px solid ${LINHA}`, borderRadius: 24, padding: '8px 24px 6px', width: 820, boxShadow: '0 12px 0 rgba(0,0,0,0.22)', fontFamily: FONTE, fontWeight: 800, color: LINHA}}>
        {itens.map(([t, v], i) => {
          const d = f - i * passo;
          if (d < 0) return null;
          const a = spring({frame: d, fps: FPS, config: {damping: 12, stiffness: 180}});
          return (
            <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: fs, lineHeight: 1.3, borderBottom: '3px dashed #d6d0c4', transform: `translateX(${(1 - a) * -60}px)`, opacity: a}}>
              <span>{t}</span>
              <span style={{color: '#e8222b', marginLeft: 20, whiteSpace: 'nowrap'}}>{typeof v === 'number' ? brl(v) : v}</span>
            </div>
          );
        })}
        {item && f >= itens.length * passo && (
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: fs + 4, marginTop: 2}}>
            <span>TOTAL</span>
            <span style={{color: '#e8222b'}}>{brl(item.preco)}</span>
          </div>
        )}
        <div style={{fontSize: 17, color: '#8a8394', textAlign: 'right'}}>valores aproximados de 2026</div>
      </div>
    </div>
  );
};

const Paredes: React.FC<{linhas: Linha[]; children: React.ReactNode}> = ({linhas, children}) => {
  const f = useCurrentFrame();
  const s = alturaParede(linhas, f);
  return (
    <group position={[0, 0.25 * (1 - s), 0]} scale={[1, s, 1]}>
      {children}
    </group>
  );
};

const Titulo: React.FC<{titulo: string; serie?: string}> = ({titulo, serie}) => {
  const f = useCurrentFrame();
  const a = spring({frame: f, fps: FPS, config: {damping: 10}}) * interpolate(f, [62, 72], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (a <= 0.01) return null;
  return (
    <div style={{position: 'absolute', top: 300, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${a * 0.8})`}}>
      {serie && <div style={{background: LINHA, color: '#ffd23f', fontFamily: FONTE, fontWeight: 800, fontSize: 50, padding: '2px 30px', borderRadius: 20, marginBottom: 14}}>{serie}</div>}
      <div style={{maxWidth: 940, textAlign: 'center', background: '#ffd23f', border: `10px solid ${LINHA}`, borderRadius: 36, padding: '6px 36px', fontFamily: FONTE, fontWeight: 800, fontSize: 84, lineHeight: 1.05, color: LINHA, boxShadow: '0 14px 0 rgba(0,0,0,0.25)'}}>{titulo}</div>
    </div>
  );
};

export const Construcao: React.FC<ConstrucaoProps> = ({roteiro, timings, comAudio, layout}) => {
  const pecas = LAYOUTS[layout] ?? [];
  const {width, height, durationInFrames} = useVideoConfig();
  const f = useCurrentFrame();
  let t = 0;
  const linhas: Linha[] = roteiro.cenas.map((c) => {
    const tm = timings.cenas.find((x) => x.id === c.id)!;
    const de = Math.round(t * FPS);
    t += tm.duracao;
    return {de, dur: Math.round(tm.duracao * FPS), c};
  });
  const takes: Take[] = [];
  linhas.forEach((l) => {
    const tm = timings.cenas.find((x) => x.id === l.c.id)!;
    takes.push({de: l.de, pos: l.c.camera.pos, alvo: l.c.camera.alvo, corte: true});
    (l.c.takes ?? []).forEach((t) => {
      const w = tm.palavras[t.palavra];
      takes.push({de: l.de + Math.round((w ? w.inicio - 0.05 : 0) * FPS), pos: t.pos, alvo: t.alvo, corte: t.corte ?? true});
    });
  });
  takes.sort((a, b) => a.de - b.de);
  // quando cada peça aparece
  const aparece = new Map<string, number>();
  linhas.forEach((l) => {
    const tm = timings.cenas.find((x) => x.id === l.c.id)!;
    (l.c.mostrar ?? []).forEach((m) => {
      const [id, pal] = m.split('@');
      const w = pal !== undefined ? tm.palavras[Number(pal)] : undefined;
      const de = w ? l.de + Math.round(w.inicio * FPS) : l.de + 8;
      if (!aparece.has(id)) aparece.set(id, de);
    });
  });
  const contador = new Map<string, number>();
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #8fd3ff 0%, #d9f1ff 60%)'}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 42, near: 0.1, far: 200, position: [12, 10, 14]}}>
        <Camera takes={takes} />
        <hemisphereLight args={['#ffffff', '#7cc576', 0.9]} />
        <directionalLight position={[9, 16, 7]} intensity={1.8} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0005} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[40, 48]} />
          <meshStandardMaterial color="#7cc576" flatShading />
        </mesh>
        {pecas.map((p, i) => {
          if (p.grupo === 'cenario' && p.id !== 'terreno') return <React.Fragment key={i}>{p.node}</React.Fragment>;
          const base = aparece.get(p.id);
          if (base === undefined && p.id !== 'terreno') return null;
          const n = contador.get(p.id) ?? 0;
          contador.set(p.id, n + 1);
          const fim = p.some !== undefined ? aparece.get(p.some) : undefined;
          if (fim !== undefined && f > fim + 30) return null;
          const el = (
            <Surge key={i} de={(base ?? 0) + (p.atraso ?? n * 3)}>
              {p.node}
            </Surge>
          );
          return p.parede ? <Paredes key={i} linhas={linhas}>{el}</Paredes> : el;
        })}
        <ZeNaCena linhas={linhas} />
      </ThreeCanvas>
      <Hud linhas={linhas} orcamento={roteiro.orcamento} />
      {linhas.map((l, i) => {
        const tm = timings.cenas.find((x) => x.id === l.c.id)!;
        return (
          <Sequence key={l.c.id} from={l.de} durationInFrames={l.dur}>
            {i === 0 && <Titulo titulo={roteiro.titulo} serie={roteiro.serie} />}
            <Legenda palavras={tm.palavras} />
            {l.c.ficha && <Ficha itens={l.c.ficha} dur={l.dur} item={l.c.item} />}
            {comAudio && <Audio src={staticFile(`audio/${roteiro.id}/${l.c.id}.mp3`)} />}
            {l.c.item && (
              <Sequence from={10} durationInFrames={20}>
                <Audio src={staticFile('sfx/moeda.mp3')} volume={0.5} />
              </Sequence>
            )}
          </Sequence>
        );
      })}
      {[...new Set(aparece.values())].filter((d) => d > 0).map((d) => (
        <Sequence key={`pop${d}`} from={d} durationInFrames={12}>
          <Audio src={staticFile('sfx/pop.mp3')} volume={0.22} />
        </Sequence>
      ))}
      {takes.filter((t, i) => i > 0 && t.corte && t.de > 0).map((t, i) => (
        <Sequence key={`wh${i}`} from={Math.max(0, t.de - 3)} durationInFrames={12}>
          <Audio src={staticFile('sfx/whoosh.mp3')} volume={0.08} />
        </Sequence>
      ))}
      <div style={{position: 'absolute', bottom: 0, left: 0, height: 14, width: `${(f / durationInFrames) * 100}%`, background: '#ffd23f'}} />
    </AbsoluteFill>
  );
};
