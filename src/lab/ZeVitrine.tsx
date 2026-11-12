// LAB: vitrine do Zé 2.0 de produção (expressões, roupas de cada perfil, ações, sentado). id "lab-ze-vitrine".
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Boneco, Sentado2} from '../estilo/ze';
import type {AcaoBoneco, Expressao, Ferramenta, Visual} from '../estilo/ze';
import {CamFixa, LuzEstudio, V3} from '../estilo/visual';

export type VitrineProps = {cena: 'expressoes' | 'roupas' | 'roupas2' | 'acoes' | 'sentado'; i?: number};
const Z: Visual = {camisa: '#4f8cff', calca: '#30406b', colete: null, capacete: null};
const ROUPAS: Visual[] = [
  {camisa: '#b8322b', calca: '#ffd2ad', colete: null, capacete: null, elmo: {cor: '#c9a24a', penacho: '#d6282b'}, escudo: '#8f1f1a'},
  {camisa: '#f2efe6', calca: '#f2efe6', colete: null, capacete: null, toga: '#6b2a7a', coroa: '#3f8a3a'},
  {camisa: '#c4502c', calca: '#ffd2ad', colete: null, capacete: null, tunica: true, travesseiro: true},
  {camisa: '#2a2d36', calca: '#2a2d36', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#e2b48e', gravata: '#0b0b0e', oculos: 'escuro'},
  {camisa: '#1d1b26', calca: '#1d1b26', colete: null, capacete: null, cartola: '#1d1b26', gravata: '#f4f4f4', cabelo: '#6b6b6b'},
  {camisa: '#ffffff', calca: '#2b2233', colete: null, capacete: null, chef: true},
];
const ROUPAS2: Visual[] = [
  {camisa: '#4f8cff', colete: '#ff8a1f', capacete: '#ffd23f', calca: '#30406b'},
  {camisa: '#c9a46a', calca: '#5a4636', colete: null, capacete: null, chapeu: {tipo: 'fedora', cor: '#4a3426'}, gola: '#b08a52'},
  {camisa: '#3d5f9e', calca: '#3d5f9e', colete: null, capacete: null, cabelo: '#c99a5a', pele: '#f0c8a8', saia: '#3d5f9e', chapeu: {tipo: 'comissaria', cor: '#3d5f9e'}, cabeloTipo: 'longo'},
  {camisa: '#26324f', calca: '#26324f', colete: null, capacete: null, cabelo: '#2b1d14', gravata: '#c62f2f', mic: true},
  {camisa: '#f2ecdf', calca: '#4a4f66', colete: null, capacete: null, cabelo: '#2b1d14', bone: '#6b5a48', suspensorio: '#6b3e26'},
  {camisa: '#ffffff', colete: '#2fbf71', capacete: null, calca: '#2b3550', cabelo: '#3b2a20'},
];
const EXPS: Expressao[] = ['feliz', 'serio', 'medo', 'triste', 'surpreso'];
const ACOES: [AcaoBoneco, Ferramenta][] = [['parado', null], ['aponta', null], ['martela', 'martelo'], ['cava', 'pa'], ['carrega', null], ['pinta', 'rolo']];

export const LabZeVitrine: React.FC<VitrineProps> = ({cena, i: sel = 0}) => {
  const f = useCurrentFrame();
  const t = f / 30 + 0.4;
  let cam = {pos: [0, 1.3, 7] as V3, alvo: [0, 0.85, 0] as V3, fov: 40};
  let corpo: React.ReactNode = null;
  if (cena === 'expressoes') {
    cam = {pos: [0.3, 1.45, 2.0], alvo: [0, 1.25, 0], fov: 36};
    corpo = <Boneco pos={[0, 0, 0]} rotY={0.1} t={t} v={Z} expressao={EXPS[sel]} acao={sel === 2 ? 'fala' : 'parado'} />;
  } else if (cena === 'roupas' || cena === 'roupas2') {
    cam = {pos: [0.4, 1.2, 3.4], alvo: [0, 0.85, 0], fov: 40};
    corpo = (cena === 'roupas' ? ROUPAS : ROUPAS2).filter((_, i) => i === sel || i === sel + 1).map((v, i) => <Boneco key={i} pos={[(i - 0.5) * 0.85, 0, 0]} rotY={0.25} t={t} v={v} ferramenta={sel === 0 && i === 0 && cena === 'roupas' ? 'gladio' : null} />);
  } else if (cena === 'acoes') {
    cam = {pos: [0.4, 1.2, 3.6], alvo: [0, 0.85, 0], fov: 40};
    corpo = ACOES.filter((_, i) => i === sel || i === sel + 1).map(([a, fe], i) => (
      <Boneco key={i} pos={[(i - 0.5) * 1.0, 0, 0]} rotY={0.5} t={t + i} v={Z} acao={a} ferramenta={fe} frente={a === 'carrega' ? <mesh><boxGeometry args={[0.36, 0.25, 0.3]} /><meshStandardMaterial color="#c98a4a" /></mesh> : undefined} />
    ));
  } else {
    cam = {pos: [2.2, 1.2, 3.6], alvo: [0, 0.6, 0], fov: 40};
    corpo = (
      <>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow><boxGeometry args={[1.6, 0.44, 0.6]} /><meshStandardMaterial color="#5f7fb0" /></mesh>
        <mesh position={[0, 0.7, -0.25]} castShadow><boxGeometry args={[1.6, 0.6, 0.15]} /><meshStandardMaterial color="#5f7fb0" /></mesh>
        <Boneco pos={[-0.35, 0.31, 0.0]} t={t} v={Z} acao="senta" />
        <Boneco pos={[0.35, 0.31, 0.0]} t={t} v={ROUPAS2[1]} acao="senta" expressao="serio" maoD={<mesh><cylinderGeometry args={[0.07, 0.06, 0.16, 20]} /><meshStandardMaterial color="#e94a3a" /></mesh>} />
        <Sentado2 pos={[1.4, 0.44, 0]} roupa="#ff5d73" pele="#c98e62" />
      </>
    );
  }
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#bfe0f7,#f4ead8)'}}>
      <ThreeCanvas width={1080} height={1920} shadows camera={{fov: 40, near: 0.05, far: 100, position: cam.pos}}>
        <CamFixa {...cam} />
        <LuzEstudio L={{hemi: ['#f3f6ff', '#e2c6a4', 1.2], sol: ['#fff0dc', 1.9], dir: [0.5, 0.8, 0.6]}} alvo={cam.alvo} R={5} corNevoa="#f4ead8" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#e9dcc6" roughness={0.8} /></mesh>
        {corpo}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
