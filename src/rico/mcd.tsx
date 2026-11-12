// CENÁRIOS do "Como o McDonald's ganha dinheiro de verdade" (versão 2, refeita após reprovação do "paredão amarelo").
// Regras: NENHUMA marca real no 3D (nada de arcos; letreiro genérico "LANCHES"), nenhuma superfície grande de uma cor só
// (tijolo, azulejo, madeira, vidro, toldo listrado, asfalto com faixa), profundidade e 3+ elementos reconhecíveis por quadro.
// Escala real: 1 unidade = 1 m. Sets registrados em src/rico/sets.tsx com prefixo "mc".
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Cam} from '../v4/sets';
import {Arvore, Instancias, Mat, Tufo, Visual} from '../v4/kit';
import {
  Barra, Boneco, Caixa, Cil, CarroPremio, EXECUTIVO, Letreiro, Maco, Moeda, Palmeira, PilhaMoedas, Poste, Sentado, Ze, clamp01, lerp, linha, rnd, suave, tex,
} from './pecas';
import type {SetRico} from './sets';

const cam = (de: V3, para: V3, alvo: V3, fov = 40, alvoPara?: V3): Cam => ({de, para, alvo, fov, alvoPara});
const orbita = (alvo: V3, az: number, el: number, d0: number, d1: number, fov = 42, giro = 8): Cam => {
  const pt = (a: number, d: number): V3 => {
    const r = (Math.PI / 180) * a, e = (Math.PI / 180) * el;
    return [alvo[0] + Math.sin(r) * Math.cos(e) * d, alvo[1] + Math.sin(e) * d, alvo[2] + Math.cos(r) * Math.cos(e) * d];
  };
  return {de: pt(az, d0), para: pt(az + giro, d1), alvo, fov};
};

// ======================= texturas =======================
const varia = (hex: string, k: number) => {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, k);
  return '#' + c.getHexString();
};
const texTijolo = (base: string, rep: [number, number]) =>
  tex('mc-tijolo:' + base, 256, 256, (g) => {
    g.fillStyle = '#d9d0c2';
    g.fillRect(0, 0, 256, 256);
    const r = rnd(7);
    for (let y = 0; y < 8; y++)
      for (let x = -1; x < 5; x++) {
        g.fillStyle = varia(base, (r() - 0.5) * 0.12);
        g.fillRect(x * 64 + (y % 2) * 32 + 3, y * 32 + 3, 58, 26);
      }
  }, rep);
const texXadrez = (a: string, b: string, rep: [number, number]) =>
  tex('mc-xadrez:' + a + b, 128, 128, (g) => {
    g.fillStyle = a;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = b;
    g.fillRect(0, 0, 64, 64);
    g.fillRect(64, 64, 64, 64);
    g.strokeStyle = 'rgba(0,0,0,0.15)';
    g.lineWidth = 2;
    g.strokeRect(0, 0, 128, 128);
  }, rep);
const texAsfalto = (rep: [number, number]) =>
  tex('mc-asfalto', 256, 256, (g) => {
    g.fillStyle = '#4a4b50';
    g.fillRect(0, 0, 256, 256);
    const r = rnd(3);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.12)';
      g.fillRect(r() * 256, r() * 256, 2, 2);
    }
  }, rep);
const texListras = (a: string, b: string, rep: [number, number]) =>
  tex('mc-listras:' + a + b, 128, 64, (g) => {
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i % 2 ? b : a;
      g.fillRect(i * 32, 0, 32, 64);
    }
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(0, 54, 128, 10);
  }, rep);
const texMadeira = (cor: string, rep: [number, number]) =>
  tex('mc-madeira:' + cor, 256, 256, (g) => {
    const r = rnd(11);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = varia(cor, (r() - 0.5) * 0.1);
      g.fillRect(0, i * 32, 256, 32);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(0, i * 32, 256, 2);
      g.fillRect(((i * 97) % 200) + 20, i * 32, 2, 32);
      g.strokeStyle = 'rgba(0,0,0,0.08)';
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        g.moveTo(0, i * 32 + 8 + k * 8);
        g.bezierCurveTo(80, i * 32 + 4 + k * 8, 160, i * 32 + 14 + k * 8, 256, i * 32 + 8 + k * 8);
        g.stroke();
      }
    }
  }, rep);
const texPapel = (a: string, b: string, rep: [number, number]) =>
  tex('mc-papel:' + a + b, 128, 128, (g) => {
    g.fillStyle = a;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = b;
    for (let i = 0; i < 4; i++) g.fillRect(i * 32 + 12, 0, 8, 128);
    g.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.fillRect(i * 32 + 2, j * 32 + 14, 4, 4);
  }, rep);
const texTerra = (rep: [number, number]) =>
  tex('mc-terra', 256, 256, (g) => {
    g.fillStyle = '#9a7048';
    g.fillRect(0, 0, 256, 256);
    const r = rnd(5);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = ['#7d5836', '#b08660', '#8a6a4a', '#c2a07a'][i % 4];
      const s = 2 + r() * 5;
      g.fillRect(r() * 256, r() * 256, s, s);
    }
  }, rep);
const texGrama = (rep: [number, number]) =>
  tex('mc-grama', 256, 256, (g) => {
    g.fillStyle = '#7fae5a';
    g.fillRect(0, 0, 256, 256);
    const r = rnd(9);
    for (let i = 0; i < 1500; i++) {
      g.fillStyle = ['#6c9a4a', '#8fbf68', '#76a352', '#9ac46e'][i % 4];
      g.fillRect(r() * 256, r() * 256, 3, 3);
    }
  }, rep);
const texConcreto = (rep: [number, number]) =>
  tex('mc-concreto', 256, 256, (g) => {
    g.fillStyle = '#c9c5bb';
    g.fillRect(0, 0, 256, 256);
    const r = rnd(13);
    for (let i = 0; i < 600; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)';
      g.fillRect(r() * 256, r() * 256, 3, 3);
    }
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.fillRect(0, 0, 256, 3);
    g.fillRect(0, 0, 3, 256);
  }, rep);
const texAzulejo = (rep: [number, number]) =>
  tex('mc-azulejo', 128, 128, (g) => {
    g.fillStyle = '#b9b4ab';
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.fillStyle = (i + j) % 3 ? '#f6f3ec' : '#ebe6dc';
      g.fillRect(i * 32 + 2, j * 32 + 2, 28, 28);
    }
  }, rep);
const texJanelas = (cor: string, rep: [number, number]) =>
  tex('mc-janelas:' + cor, 128, 128, (g) => {
    g.fillStyle = cor;
    g.fillRect(0, 0, 128, 128);
    const gr = g.createLinearGradient(0, 0, 128, 128);
    gr.addColorStop(0, '#9fc3dc');
    gr.addColorStop(1, '#40607a');
    g.fillStyle = gr;
    g.fillRect(12, 16, 46, 80);
    g.fillRect(70, 16, 46, 80);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(16, 20, 8, 70);
    g.fillRect(74, 20, 8, 70);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(0, 108, 128, 6);
  }, rep);
const BURGER = (g: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  g.fillStyle = '#e0a050';
  g.beginPath();
  g.ellipse(x, y - s * 0.25, s, s * 0.55, 0, Math.PI, 0);
  g.fill();
  g.fillStyle = '#6fbf4a';
  g.fillRect(x - s * 1.05, y - s * 0.25, s * 2.1, s * 0.18);
  g.fillStyle = '#6b3a1e';
  g.fillRect(x - s, y - s * 0.07, s * 2, s * 0.3);
  g.fillStyle = '#e0a050';
  g.fillRect(x - s, y + s * 0.23, s * 2, s * 0.25);
};
const CARDAPIOS: Record<string, [string, string, [string, string][]]> = {
  lanches: ['LANCHES', '#e8452c', [['X-BÚRGUER', '18,90'], ['X-SALADA', '21,90'], ['DUPLO', '27,90']]],
  combos: ['COMBOS', '#f2a516', [['COMBO 1', '29,90'], ['COMBO 2', '34,90'], ['KIDS', '22,90']]],
  bebidas: ['BEBIDAS', '#2f9fd6', [['REFRI', '8,90'], ['SUCO', '10,90'], ['SHAKE', '14,90']]],
  anos48: ['CARDÁPIO', '#c8322b', [['HAMBÚRGUER', '15¢'], ['FRITAS', '10¢'], ['MILK-SHAKE', '20¢']]],
};
const texCardapio = (tipo: string) =>
  tex('mc-cardapio:' + tipo, 512, 256, (g) => {
    const [tit, cor, itens] = CARDAPIOS[tipo];
    g.fillStyle = '#1d1b26';
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = cor;
    g.fillRect(0, 0, 512, 56);
    linha(g, tit, 256, 30, 480, 44, '#ffffff');
    itens.forEach(([n, pr], i) => {
      const y = 92 + i * 56;
      BURGER(g, 46, y + 4, 18);
      g.font = "800 34px 'Baloo 2', sans-serif";
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = '#f4ead2';
      g.fillText(n, 82, y);
      g.textAlign = 'right';
      g.fillStyle = '#ffd23f';
      g.fillText(pr, 492, y);
    });
  });
const texPapelText = (id: string, titulo: string, linhas: string[], assinatura = false) =>
  tex('mc-doc:' + id, 256, 340, (g) => {
    g.fillStyle = '#fbf7ec';
    g.fillRect(0, 0, 256, 340);
    linha(g, titulo, 128, 34, 220, 26, '#1d1b26');
    g.fillStyle = 'rgba(29,27,38,0.35)';
    for (let i = 0; i < 9; i++) g.fillRect(24, 70 + i * 18, 160 + ((i * 37) % 48), 5);
    linhas.forEach((l, i) => linha(g, l, 128, 250 + i * 26, 220, 22, '#c8322b'));
    if (assinatura) {
      g.fillStyle = '#1d1b26';
      g.fillRect(40, 320, 176, 3);
    }
  });
// tapete persa (escritórios antigos): borda, losangos e franjas, para o piso não ficar liso
const texTapete = () =>
  tex('mc-tapete', 512, 352, (g) => {
    g.fillStyle = '#b8863a';
    g.fillRect(0, 0, 512, 352);
    g.fillStyle = '#7a1f1f';
    g.fillRect(14, 14, 484, 324);
    g.fillStyle = '#c99a4a';
    g.fillRect(34, 34, 444, 284);
    g.fillStyle = '#8b2a2a';
    g.fillRect(46, 46, 420, 260);
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 4; j++) {
        const x = 80 + i * 59, y = 86 + j * 60;
        g.fillStyle = (i + j) % 2 ? '#d9b23f' : '#2f4a6a';
        g.beginPath();
        g.moveTo(x, y - 22);
        g.lineTo(x + 22, y);
        g.lineTo(x, y + 22);
        g.lineTo(x - 22, y);
        g.closePath();
        g.fill();
        g.fillStyle = '#f2e6c8';
        g.fillRect(x - 4, y - 4, 8, 8);
      }
    g.strokeStyle = '#d9b23f';
    g.lineWidth = 4;
    g.strokeRect(24, 24, 464, 304);
  }, [1, 1]);
const texNotas = (cor: string) =>
  tex('mc-notas:' + cor, 128, 128, (g) => {
    for (let i = 0; i < 16; i++) {
      g.fillStyle = varia(cor, i % 2 ? 0.06 : -0.04);
      g.fillRect(0, i * 8, 128, 8);
    }
    g.fillStyle = '#f2e6c8';
    g.fillRect(52, 0, 24, 128);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(0, 62, 128, 4);
  }, [1, 6]);

// ======================= peças =======================
const FUNC: Visual = {camisa: '#c8322b', calca: '#2b2b3a', colete: null, capacete: null, bone: '#c8322b', cabelo: '#3b2a20'};
const FUNC2: Visual = {camisa: '#c8322b', calca: '#2b2b3a', colete: null, capacete: null, bone: '#c8322b', cabelo: '#1d1b26', pele: '#8d5a3b'};
const FUNC48: Visual = {camisa: '#ffffff', calca: '#3a3a48', colete: null, capacete: null, chef: true};
const IRMAO: Visual = {camisa: '#ffffff', calca: '#4a3e32', colete: null, capacete: null, cabelo: '#3a2820', pele: '#e0b080', gravata: '#2f5d8a'};
const KROC: Visual = {camisa: '#33405a', calca: '#33405a', colete: null, capacete: null, cabelo: '#c8c8c8', pele: '#e8b892', gravata: '#8b2222'};
const SONNEBORN: Visual = {camisa: '#5a4a66', calca: '#3a3050', colete: null, capacete: null, cabelo: '#2a2530', pele: '#e8b892', gravata: '#d9b23f'};
const FRANQUEADA: Visual = {camisa: '#2f9a8a', calca: '#2b2b3a', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#c98e62'};
const CLIENTES: Visual[] = [
  {camisa: '#4f7fb0', calca: '#2b2b3a', colete: null, capacete: null, cabelo: '#3b2a20'},
  {camisa: '#e7c25a', calca: '#3a3f55', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#8d5a3b'},
  {camisa: '#6b8f5a', calca: '#4a3e2a', colete: null, capacete: null, cabelo: '#6b4030', pele: '#f2c9a4'},
  {camisa: '#e26d9a', calca: '#2f5d8a', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#c98e62'},
  {camisa: '#f2efe6', calca: '#5a4a3a', colete: null, capacete: null, cabelo: '#c8c8c8'},
  {camisa: '#8a5aa0', calca: '#2b2b3a', colete: null, capacete: null, cabelo: '#3b2a20', pele: '#e7b48c'},
];
const CLIENTES48: Visual[] = [
  {camisa: '#f2ecdf', calca: '#4a4a55', colete: null, capacete: null, cabelo: '#3b2a20', bone: '#6b5a48'},
  {camisa: '#c0a0d0', calca: '#3a3f55', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#c98e62'},
  {camisa: '#d9cdb0', calca: '#3a3028', colete: null, capacete: null, cabelo: '#5a4030'},
  {camisa: '#8bbde8', calca: '#2b2b3a', colete: null, capacete: null, cabelo: '#c8c8c8', pele: '#e8b892'},
  {camisa: '#e8c08a', calca: '#4a3e2a', colete: null, capacete: null, cabelo: '#1d1b26', bone: '#2f4a6a'},
  {camisa: '#6a9a5a', calca: '#3a4028', colete: null, capacete: null, cabelo: '#3b2a20', pele: '#8d5a3b'},
];
const INOX = '#c3c8cf';

// vidro (transparente: dá pra ver a cozinha por dentro)
const Vidro: React.FC<{pos: V3; tam: [number, number]; rotY?: number}> = ({pos, tam, rotY = 0}) => (
  <mesh position={pos} rotation={[0, rotY, 0]}>
    <planeGeometry args={tam} />
    <meshStandardMaterial color="#bfe3f2" transparent opacity={0.22} roughness={0.1} metalness={0.2} side={2} depthWrite={false} />
  </mesh>
);

// hambúrguer de verdade (r = 5 cm; esc amplia)
export const Hamburguer: React.FC<{pos: V3; esc?: number; rotY?: number}> = ({pos, esc = 1, rotY = 0}) => (
  <group position={pos} scale={esc} rotation={[0, rotY, 0]}>
    <Cil pos={[0, 0.008, 0]} r={0.05} h={0.016} cor="#d99a4e" seg={16} />
    <Cil pos={[0, 0.024, 0]} r={0.052} h={0.016} cor="#6b3a1e" seg={16} />
    <Caixa pos={[0, 0.034, 0]} rot={[0, 0.78, 0]} tam={[0.08, 0.004, 0.08]} cor="#f2b632" sombra={false} />
    <Cil pos={[0, 0.039, 0]} r={0.056} h={0.006} cor="#6fbf4a" seg={10} />
    <mesh position={[0, 0.042, 0]} castShadow>
      <sphereGeometry args={[0.05, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <Mat cor="#e0a050" />
    </mesh>
    {[0, 1, 2, 3, 4].map((i) => (
      <mesh key={i} position={[Math.cos(i * 1.3) * 0.025, 0.088 - (i % 2) * 0.006, Math.sin(i * 1.3) * 0.025]}>
        <sphereGeometry args={[0.004, 20, 14]} />
        <Mat cor="#fff6dc" />
      </mesh>
    ))}
  </group>
);
const Fritas: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <group position={pos} scale={esc}>
    <Caixa pos={[0, 0.05, 0]} tam={[0.07, 0.1, 0.04]} cor="#c8322b" />
    {[-0.025, -0.01, 0.005, 0.02].map((x, i) => (<Caixa key={i} pos={[x, 0.11 + (i % 2) * 0.01, 0]} rot={[0, 0, (i - 1.5) * 0.12]} tam={[0.008, 0.06, 0.008]} cor="#f5c842" sombra={false} />))}
  </group>
);
const Copo: React.FC<{pos: V3; cor?: string}> = ({pos, cor = '#2f9fd6'}) => (
  <group position={pos}>
    <Cil pos={[0, 0.07, 0]} r={0.04} r2={0.032} h={0.14} cor={cor} seg={10} />
    <Cil pos={[0, 0.145, 0]} r={0.042} h={0.01} cor="#f2efe6" seg={10} />
    <Barra a={[0.01, 0.15, 0]} b={[0.02, 0.21, 0]} r={0.004} cor="#e8452c" sombra={false} />
  </group>
);

// carro moderno (4,3 m; frente em +X)
export const Carro: React.FC<{pos: V3; rotY?: number; cor: string}> = ({pos, rotY = 0, cor}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.55, 0]} tam={[4.2, 0.55, 1.78]} cor={cor} />
    <Caixa pos={[-0.25, 1.06, 0]} tam={[2.3, 0.5, 1.6]} cor="#2b3a4a" />
    <Caixa pos={[-0.25, 1.33, 0]} tam={[2.0, 0.06, 1.62]} cor={cor} />
    <Caixa pos={[1.65, 0.84, 0]} tam={[0.9, 0.05, 1.7]} cor={varia(cor, -0.06)} sombra={false} />
    {[[-1.3, 0.86], [1.3, 0.86], [-1.3, -0.86], [1.3, -0.86]].map(([x, z], i) => (
      <group key={i}>
        <Cil pos={[x, 0.33, z]} rot={[Math.PI / 2, 0, 0]} r={0.33} h={0.24} cor="#1d1b26" seg={14} />
        <Cil pos={[x, 0.33, z * 1.08]} rot={[Math.PI / 2, 0, 0]} r={0.17} h={0.04} cor="#c3c8cf" seg={10} />
      </group>
    ))}
    {[-0.6, 0.6].map((z) => (
      <group key={z}>
        <Caixa pos={[2.11, 0.68, z]} tam={[0.04, 0.14, 0.38]} cor="#fffbe0" sombra={false} />
        <Caixa pos={[-2.11, 0.7, z]} tam={[0.04, 0.12, 0.34]} cor="#d9302a" sombra={false} />
      </group>
    ))}
    <Caixa pos={[2.12, 0.45, 0]} tam={[0.05, 0.12, 1.2]} cor="#2b2b30" sombra={false} />
  </group>
);

// prédio moderno com janelas
const Predio: React.FC<{pos: V3; tam: V3; cor: string; rotY?: number; topo?: string}> = ({pos, tam, cor, rotY = 0, topo}) => {
  const [w, h, d] = tam;
  const mf = useMemo(() => {
    const t = texJanelas(cor, [1, 1]).clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 3.2)));
    return t;
  }, [cor, w, h]);
  const ml = useMemo(() => {
    const t = texJanelas(cor, [1, 1]).clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, Math.round(d / 3)), Math.max(1, Math.round(h / 3.2)));
    return t;
  }, [cor, d, h]);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial attach="material-0" map={ml} roughness={0.8} />
        <meshStandardMaterial attach="material-1" map={ml} roughness={0.8} />
        <meshStandardMaterial attach="material-2" color={varia(cor, -0.1)} roughness={0.9} />
        <meshStandardMaterial attach="material-3" color={cor} />
        <meshStandardMaterial attach="material-4" map={mf} roughness={0.8} />
        <meshStandardMaterial attach="material-5" map={mf} roughness={0.8} />
      </mesh>
      <Caixa pos={[0, h + 0.3, 0]} tam={[w + 0.2, 0.6, d + 0.2]} cor={topo ?? varia(cor, -0.15)} />
      <Caixa pos={[w * 0.2, h + 1.0, -d * 0.1]} tam={[1.6, 0.9, 1.2]} cor="#8a8f96" />
    </group>
  );
};

// letreiro de poste ("totem") de lanchonete
const Totem: React.FC<{pos: V3; h?: number}> = ({pos, h = 9}) => (
  <group position={pos}>
    <Cil pos={[0, h / 2, 0]} r={0.18} h={h} cor="#5a5f66" seg={10} />
    <Caixa pos={[0, h + 0.9, 0]} tam={[3.4, 1.9, 0.5]} cor="#1d1b26" />
    {[1, -1].map((s) => (
      <Letreiro key={s} pos={[0, h + 0.9, s * 0.26]} rotY={s > 0 ? 0 : Math.PI} larg={3.2} alt={1.7} linhas={['LANCHES', 'DRIVE 24H']} fundo="#c8322b" cor="#fff6dc" emissivo />
    ))}
    <Hamburguer pos={[0, h + 1.85, 0]} esc={14} />
  </group>
);

// ======================= RESTAURANTE GENÉRICO (14 x 10 m, frente em +Z) =======================
const RW = 14, RD = 10, RH = 4.2;
export const Restaurante: React.FC<{t: number; corte?: boolean; sobe?: number; letreiros?: boolean}> = ({t, corte = false, sobe = 1, letreiros = true}) => {
  const tij = texTijolo('#a4553a', [3.5, 1.2]);
  const tijL = texTijolo('#a4553a', [2.5, 1.2]);
  const piso = texXadrez('#efe6d4', '#3a3a44', [7, 5]);
  const toldo = texListras('#c8322b', '#fff6dc', [7, 1]);
  const azul = texAzulejo([6, 2]);
  const s = Math.max(0.02, sobe);
  return (
    <group>
      {/* piso xadrez */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[RW, 0.12, RD]} />
        <meshStandardMaterial map={piso} roughness={0.6} />
      </mesh>
      <group scale={[1, s, 1]}>
        {/* paredes de tijolo (fundo e laterais) */}
        <Caixa pos={[0, RH / 2, -RD / 2]} tam={[RW, RH, 0.25]} cor="#ffffff" map={tij} />
        <Caixa pos={[-RW / 2, RH / 2, 0]} tam={[0.25, RH, RD]} cor="#ffffff" map={tijL} />
        <Caixa pos={[RW / 2, RH / 2, -2.6]} tam={[0.25, RH, 4.8]} cor="#ffffff" map={tijL} />
        <Caixa pos={[RW / 2, 0.55, 2.4]} tam={[0.25, 1.1, 5.2]} cor="#ffffff" map={tijL} />
        <Caixa pos={[RW / 2, 3.55, 2.4]} tam={[0.25, 1.3, 5.2]} cor="#ffffff" map={tijL} />
        <Vidro pos={[RW / 2 + 0.01, 1.95, 2.4]} tam={[5.2, 1.7]} rotY={Math.PI / 2} />
        {/* janela do drive-thru (lado direito) com toldo */}
        <Caixa pos={[RW / 2 + 0.05, 1.35, -1.6]} tam={[0.1, 1.2, 1.4]} cor="#2b3a4a" />
        <Caixa pos={[RW / 2 + 0.55, 2.35, -1.6]} rot={[0, 0, -0.35]} tam={[1.1, 0.06, 1.8]} cor="#f2a516" />
        <Letreiro pos={[RW / 2 + 0.14, 2.75, -1.6]} rotY={Math.PI / 2} larg={1.6} alt={0.4} linhas={['RETIRADA']} fundo="#1d1b26" cor="#ffd23f" emissivo />
        {/* azulejo branco atrás da cozinha */}
        <Caixa pos={[0, 1.2, -RD / 2 + 0.14]} tam={[RW - 0.6, 2.2, 0.03]} cor="#ffffff" map={azul} sombra={false} />
        {!corte && (
          <group>
            {/* fachada: base de tijolo + vidraça com montantes + porta */}
            <Caixa pos={[0, 0.35, RD / 2]} tam={[RW, 0.7, 0.25]} cor="#ffffff" map={tij} />
            <Vidro pos={[0, 1.85, RD / 2]} tam={[RW, 2.3]} />
            {Array.from({length: 11}).map((_, i) => (<Caixa key={i} pos={[-RW / 2 + 0.05 + i * 1.39, 1.85, RD / 2]} tam={[0.09, 2.3, 0.12]} cor="#2b2b30" />))}
            <Caixa pos={[0, 3.04, RD / 2]} tam={[RW, 0.1, 0.14]} cor="#2b2b30" />
            <Caixa pos={[-3.5, 1.15, RD / 2 + 0.05]} tam={[0.05, 2.1, 0.06]} cor="#c3c8cf" sombra={false} />
            {/* toldo listrado inclinado + platibanda com letreiro */}
            <mesh position={[0, 3.25, RD / 2 + 0.55]} rotation={[0.55, 0, 0]} castShadow>
              <boxGeometry args={[RW + 0.3, 0.05, 1.3]} />
              <meshStandardMaterial map={toldo} roughness={0.8} />
            </mesh>
            <Caixa pos={[0, 3.95, RD / 2 + 0.05]} tam={[RW + 0.4, 0.9, 0.3]} cor="#2b2b30" />
            {letreiros && <Letreiro pos={[-2.2, 3.95, RD / 2 + 0.22]} larg={5.6} alt={0.75} linhas={['LANCHES']} fundo="#c8322b" cor="#fff6dc" emissivo />}
            {letreiros && <Letreiro pos={[3.6, 3.95, RD / 2 + 0.22]} larg={3.6} alt={0.6} linhas={['DESDE HOJE CEDO']} fundo="#2b2b30" cor="#f2a516" emissivo />}
            {/* teto + equipamentos */}
            <Caixa pos={[0, RH + 0.08, 0]} tam={[RW + 0.4, 0.16, RD + 0.4]} cor="#77797f" />
            <Caixa pos={[0, RH + 0.4, -RD / 2 - 0.05]} tam={[RW + 0.4, 0.5, 0.2]} cor="#2b2b30" />
            <Caixa pos={[-RW / 2 - 0.1, RH + 0.4, 0]} tam={[0.2, 0.5, RD + 0.3]} cor="#2b2b30" />
            <Caixa pos={[RW / 2 + 0.1, RH + 0.4, 0]} tam={[0.2, 0.5, RD + 0.3]} cor="#2b2b30" />
            <Caixa pos={[-3, RH + 0.65, -2.5]} tam={[1.6, 0.9, 1.2]} cor="#a9adb3" />
            <Caixa pos={[2.5, RH + 0.55, -3]} tam={[1.2, 0.7, 1.0]} cor="#a9adb3" />
            <Cil pos={[-1, RH + 0.9, -3.4]} r={0.25} h={1.4} cor="#8a8f96" />
          </group>
        )}
        {corte && <Caixa pos={[0, 0.35, RD / 2]} tam={[RW, 0.7, 0.25]} cor="#ffffff" map={tij} />}
      </group>
      {sobe > 0.95 && <Interior t={t} />}
    </group>
  );
};

// interior: balcão com caixas, cardápio luminoso, cozinha com chapa, fritadeira, estufa, geladeira; salão com mesas
const Interior: React.FC<{t: number}> = ({t}) => {
  const mad = texMadeira('#8a5a36', [3, 1]);
  return (
    <group>
      {/* balcão */}
      <Caixa pos={[-0.5, 0.55, -1.0]} tam={[8.5, 1.0, 0.7]} cor="#ffffff" map={mad} />
      <Caixa pos={[-0.5, 1.07, -1.0]} tam={[8.7, 0.06, 0.8]} cor={INOX} />
      {[-3.4, -1.2].map((x) => (
        <group key={x} position={[x, 1.1, -0.95]}>
          <Caixa pos={[0, 0.06, 0]} tam={[0.4, 0.12, 0.35]} cor="#2b2b30" />
          <Caixa pos={[0, 0.28, -0.05]} rot={[-0.3, 0, 0]} tam={[0.36, 0.26, 0.03]} cor="#1d1b26" />
          <Caixa pos={[0, 0.28, -0.03]} rot={[-0.3, 0, 0]} tam={[0.3, 0.2, 0.01]} cor="#5ad0f0" sombra={false} />
        </group>
      ))}
      {/* bandejas prontas no balcão */}
      <group position={[1.2, 1.1, -1.0]}>
        <Caixa pos={[0, 0.01, 0]} tam={[0.45, 0.02, 0.35]} cor="#e8452c" />
        <Hamburguer pos={[-0.1, 0.02, 0]} esc={1.4} />
        <Fritas pos={[0.08, 0.02, 0.05]} esc={1.3} />
        <Copo pos={[0.15, 0.02, -0.08]} />
      </group>
      {/* máquina de refrigerante */}
      <group position={[3.2, 1.1, -1.05]}>
        <Caixa pos={[0, 0.35, 0]} tam={[0.9, 0.7, 0.55]} cor={INOX} />
        <Caixa pos={[0, 0.5, 0.28]} tam={[0.8, 0.25, 0.02]} cor="#2f9fd6" sombra={false} />
        {[-0.25, 0, 0.25].map((x) => (<Copo key={x} pos={[x, 0, 0.18]} cor={['#e8452c', '#2f9fd6', '#f2a516'][Math.round(x * 4 + 1)]} />))}
      </group>
      {/* cardápios luminosos sobre o balcão */}
      <Caixa pos={[-0.5, 3.0, -1.35]} tam={[8.4, 1.3, 0.2]} cor="#2b2b30" />
      {(['lanches', 'combos', 'bebidas'] as const).map((k, i) => (
        <mesh key={k} position={[-3.3 + i * 2.8, 3.0, -1.24]}>
          <planeGeometry args={[2.6, 1.15]} />
          <meshBasicMaterial map={texCardapio(k)} toneMapped={false} />
        </mesh>
      ))}
      {/* cozinha: chapa com hambúrgueres, coifa */}
      <group position={[-2.6, 0, -3.8]}>
        <Caixa pos={[0, 0.42, 0]} tam={[2.2, 0.84, 0.9]} cor={INOX} />
        <Caixa pos={[0, 0.88, 0]} tam={[2.1, 0.06, 0.8]} cor="#2b2b30" />
        {Array.from({length: 12}).map((_, i) => (
          <Cil key={i} pos={[-0.8 + (i % 6) * 0.32, 0.93, -0.18 + Math.floor(i / 6) * 0.36]} r={0.065} h={0.03} cor={i % 5 === 2 ? '#8a4a24' : '#6b3a1e'} seg={12} />
        ))}
        <Caixa pos={[0, 2.6, -0.1]} tam={[2.5, 0.6, 1.1]} cor="#a9adb3" />
        <Barra a={[0.4, 1.0, 0.2]} b={[0.6, 0.95, 0.5]} r={0.012} cor="#2b2b30" />
      </group>
      {/* fritadeira com 2 cestos de batata */}
      <group position={[0.3, 0, -3.8]}>
        <Caixa pos={[0, 0.45, 0]} tam={[1.2, 0.9, 0.85]} cor={INOX} />
        {[-0.28, 0.28].map((x) => (
          <group key={x}>
            <Caixa pos={[x, 0.91, 0]} tam={[0.45, 0.02, 0.55]} cor="#d99a2e" sombra={false} />
            <Caixa pos={[x, 0.95 + Math.max(0, Math.sin(t * 2 + x * 9)) * 0.08, 0.05]} tam={[0.36, 0.14, 0.4]} cor="#7a7f86" />
            <Caixa pos={[x, 1.03 + Math.max(0, Math.sin(t * 2 + x * 9)) * 0.08, 0.05]} tam={[0.32, 0.03, 0.36]} cor="#f5c842" sombra={false} />
            <Barra a={[x, 1.0, 0.25]} b={[x, 1.1, 0.55]} r={0.015} cor="#1d1b26" />
          </group>
        ))}
        <Caixa pos={[0, 2.6, -0.1]} tam={[1.4, 0.6, 1.0]} cor="#a9adb3" />
      </group>
      {/* estufa com lanches embrulhados */}
      <group position={[2.6, 0, -2.1]}>
        <Caixa pos={[0, 0.5, 0]} tam={[1.4, 1.0, 0.6]} cor={INOX} />
        {[1.2, 1.5].map((y) => (<Caixa key={y} pos={[0, y, 0]} tam={[1.4, 0.03, 0.55]} cor={INOX} sombra={false} />))}
        {Array.from({length: 8}).map((_, i) => (
          <Caixa key={i} pos={[-0.5 + (i % 4) * 0.33, 1.27 + Math.floor(i / 4) * 0.3, 0]} tam={[0.22, 0.1, 0.2]} cor={['#f2a516', '#2f9fd6', '#e8452c', '#6fbf4a'][i % 4]} />
        ))}
        <pointLight position={[0, 1.8, 0.2]} intensity={1.5} distance={2.5} color="#ffb060" />
      </group>
      {/* geladeira e prateleira */}
      <Caixa pos={[5.4, 1.0, -4.3]} tam={[1.4, 2.0, 0.8]} cor={INOX} />
      <Barra a={[4.8, 0.6, -3.88]} b={[4.8, 1.6, -3.88]} r={0.02} cor="#2b2b30" />
      <group position={[-5.6, 0, -3.9]}>
        {[0.6, 1.2, 1.8].map((y) => (<Caixa key={y} pos={[0, y, 0]} tam={[1.2, 0.04, 0.5]} cor={INOX} />))}
        {Array.from({length: 9}).map((_, i) => (<Caixa key={i} pos={[-0.4 + (i % 3) * 0.4, 0.75 + Math.floor(i / 3) * 0.6, 0]} tam={[0.3, 0.25, 0.35]} cor={['#c9a26a', '#e9e1cf', '#c8322b'][i % 3]} />))}
      </group>
      {/* funcionários */}
      {/* chapeiro ATRÁS da chapa, de frente para o salão (rosto inteiro no close da chapa) */}
      <Boneco pos={[-2.6, 0.12, -4.6]} rotY={0} t={t} v={FUNC} esc={0.92} acao="martela" expressao="feliz" />
      <Boneco pos={[0.3, 0.12, -3.0]} rotY={Math.PI} t={t + 1} v={FUNC2} esc={0.9} />
      <Boneco pos={[-3.4, 0.12, -1.75]} rotY={0} t={t + 2} v={FUNC2} esc={0.92} acao="acena" />
      <Boneco pos={[1.2, 0.12, -1.75]} rotY={0} t={t + 3} v={FUNC} esc={0.9} acao="carrega" />
      <Boneco pos={[6.3, 0.12, -1.6]} rotY={Math.PI / 2} t={t} v={FUNC} esc={0.9} acao="carrega" />
      {/* clientes no balcão */}
      <Boneco pos={[-3.4, 0.12, -0.1]} rotY={Math.PI} t={t} v={CLIENTES[0]} esc={0.92} acao="aponta" />
      <Boneco pos={[-1.2, 0.12, -0.05]} rotY={Math.PI} t={t + 1} v={CLIENTES[3]} esc={0.9} />
      <Boneco pos={[-1.0, 0.12, 0.9]} rotY={Math.PI + 0.2} t={t + 2} v={CLIENTES[5]} esc={0.88} />
      {/* salão: mesas, cadeiras, gente comendo, vasos */}
      {[[-5, 2.2], [-2.4, 3.6], [1.0, 2.4], [3.6, 3.7], [5.6, 1.4]].map(([x, z], i) => (
        <group key={i} position={[x, 0.12, z]}>
          <Cil pos={[0, 0.37, 0]} r={0.05} h={0.74} cor="#2b2b30" />
          <Cil pos={[0, 0.76, 0]} r={0.45} h={0.04} cor={['#f2a516', '#e9e1cf', '#2f9fd6', '#e9e1cf', '#e8452c'][i]} seg={18} />
          {[-1, 1].map((s2) => (<Caixa key={s2} pos={[s2 * 0.7, 0.24, 0]} tam={[0.4, 0.48, 0.4]} cor={i % 2 ? '#c8322b' : '#3a3a44'} />))}
          {i % 2 === 0 && <Sentado pos={[-0.7, 0.25, 0]} rotY={Math.PI / 2} roupa={['#4f7fb0', '#e7c25a', '#6b8f5a'][i % 3]} pele={['#ffd2ad', '#8d5a3b', '#e7b48c'][i % 3]} esc={0.9} bracos={0.3} />}
          <Hamburguer pos={[0.1, 0.78, 0.1]} esc={1.5} />
          <Copo pos={[-0.15, 0.78, -0.1]} cor={i % 2 ? '#e8452c' : '#2f9fd6'} />
        </group>
      ))}
      {[[-6.4, 4.4], [6.4, 4.4]].map(([x, z], i) => (
        <group key={i} position={[x, 0.12, z]}>
          <Cil pos={[0, 0.25, 0]} r={0.25} r2={0.2} h={0.5} cor="#6b4a2f" />
          <mesh position={[0, 0.9, 0]} castShadow><icosahedronGeometry args={[0.45, 0]} /><Mat cor="#4f8f4a" /></mesh>
        </group>
      ))}
      <pointLight position={[0, 3.6, 0]} intensity={6} distance={14} color="#fff0d0" />
    </group>
  );
};

// estacionamento + drive-thru + totem + canteiros (em volta do restaurante)
const Entorno: React.FC<{t: number; drive?: number; semCarros?: boolean; limpo?: boolean}> = ({t, drive = 0, semCarros = false, limpo = false}) => {
  const asf = texAsfalto([8, 8]);
  const calc = texConcreto([12, 1]);
  const vagas: [number, string][] = [[-5.5, '#2f6fd6'], [-3.0, '#e9e6df'], [0.8, '#c94f4f'], [3.3, '#3a3a44'], [-0.6, '#f2a516']];
  const carDrive = lerp(5.5, -1.6, suave(clamp01(drive)));
  return (
    <group>
      <mesh position={[0, 0.005, 6]} receiveShadow>
        <boxGeometry args={[34, 0.02, 30]} />
        <meshStandardMaterial map={asf} roughness={0.95} />
      </mesh>
      {/* vagas pintadas */}
      {Array.from({length: 7}).map((_, i) => (<Caixa key={i} pos={[-7 + i * 2.5, 0.02, 9.8]} tam={[0.1, 0.01, 4.6]} cor="#f4f1e6" sombra={false} />))}
      {!semCarros && vagas.map(([x, c], i) => (i === 4 ? null : <Carro key={i} pos={[x - 0.5, 0, 9.8]} rotY={Math.PI / 2 + (i % 2 ? 0 : Math.PI)} cor={c} />))}
      {/* faixa do drive-thru e setas */}
      <Caixa pos={[RW / 2 + 1.2, 0.02, 1]} tam={[0.12, 0.01, 12]} cor="#f2a516" sombra={false} />
      <Caixa pos={[RW / 2 + 4.0, 0.02, 1]} tam={[0.12, 0.01, 12]} cor="#f2a516" sombra={false} />
      {[4, 0, -4].map((z) => (
        <mesh key={z} position={[RW / 2 + 2.6, 0.025, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.45, 1.0, 3]} />
          <meshBasicMaterial color="#f4f1e6" />
        </mesh>
      ))}
      {/* carro no drive-thru indo até a janela */}
      {!limpo && <Carro pos={[RW / 2 + 2.6, 0, carDrive]} rotY={Math.PI / 2} cor="#2f9a8a" />}
      {/* saquinho saindo da janela quando o carro chega */}
      {drive > 0.7 && <Caixa pos={[lerp(RW / 2 + 0.3, RW / 2 + 1.4, suave(clamp01((drive - 0.7) / 0.3))), 1.25, -1.6]} tam={[0.25, 0.32, 0.18]} cor="#c9a26a" />}
      {/* totem do cardápio do drive */}
      <group position={[RW / 2 + 4.6, 0, 4.0]}>
        <Caixa pos={[0, 1.1, 0]} tam={[0.25, 2.2, 1.6]} cor="#2b2b30" />
        <mesh position={[-0.14, 1.3, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.45, 0.75]} />
          <meshBasicMaterial map={texCardapio('combos')} toneMapped={false} />
        </mesh>
        <Caixa pos={[-0.1, 2.35, 0]} tam={[0.45, 0.25, 1.8]} cor="#c8322b" />
      </group>
      {/* meio-fio, calçada e canteiros */}
      <mesh position={[0, 0.08, 15.5]} receiveShadow>
        <boxGeometry args={[34, 0.16, 3]} />
        <meshStandardMaterial map={calc} roughness={0.9} />
      </mesh>
      {[-8.5, 8.5].map((x) => (
        <group key={x} position={[x, 0, 6.5]}>
          <Caixa pos={[0, 0.12, 0]} tam={[1.4, 0.24, 1.4]} cor="#b9b4ab" />
          <Caixa pos={[0, 0.25, 0]} tam={[1.2, 0.04, 1.2]} cor="#5a8f3a" sombra={false} />
          {!limpo && <Arvore pos={[0, 0.2, 0]} esc={1.1} cor="#4f9a4a" />}
        </group>
      ))}
      <Totem pos={[-11, 0, 12]} />
      {!limpo && [-15, 15].map((x) => (<Poste key={x} pos={[x, 0, 14.8]} />))}
      {/* clientes chegando a pé */}
      {[0, 1, 2].map((i) => {
        const z = 14 - ((t * 1.1 + i * 2.2) % (limpo ? 4 : 8)); // no final ficam perto da estátua (fora do plano do terreno)
        return <Boneco key={i} pos={[-4.2 + i * 0.7, 0.02, z]} rotY={Math.PI} acao="anda" t={t + i} v={CLIENTES[(i + 1) % 6]} esc={0.9} />;
      })}
    </group>
  );
};

// cidade em volta: avenida, rua lateral, prédios variados, árvores, carros passando
const Cidade: React.FC<{t: number}> = ({t}) => {
  const gr = texGrama([40, 40]);
  const asf = texAsfalto([4, 40]);
  const PRE: [number, number, number, number, number, string][] = [
    [-30, 32, 12, 22, 10, '#d9c6a0'], [-14, 32, 10, 14, 10, '#e2b9a0'], [2, 34, 14, 30, 12, '#b9c4d0'], [18, 32, 10, 18, 10, '#e9dcc0'], [32, 33, 12, 26, 12, '#c9b49a'],
    [-36, 0, 10, 16, 14, '#cfd6c2'], [-38, -22, 12, 24, 12, '#e0cfb0'], [36, -2, 12, 20, 14, '#d8cbb5'], [38, -24, 14, 34, 12, '#aebccc'],
    [-16, -28, 14, 18, 10, '#e9d0b8'], [4, -30, 16, 26, 10, '#c4cdd8'], [22, -28, 12, 14, 10, '#e2c9a0'],
  ];
  return (
    <group>
      <mesh position={[0, -0.03, 0]} receiveShadow>
        <boxGeometry args={[220, 0.04, 220]} />
        <meshStandardMaterial map={gr} roughness={1} />
      </mesh>
      {/* avenida na frente (eixo X) */}
      <mesh position={[0, 0.0, 21]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[9, 0.03, 220]} />
        <meshStandardMaterial map={asf} roughness={0.95} />
      </mesh>
      {Array.from({length: 30}).map((_, i) => (<Caixa key={i} pos={[-110 + i * 7.6, 0.02, 21]} tam={[3.6, 0.01, 0.16]} cor="#f4f1e6" sombra={false} />))}
      {/* rua lateral (eixo Z) */}
      <mesh position={[-22, 0.0, 0]} receiveShadow>
        <boxGeometry args={[8, 0.03, 220]} />
        <meshStandardMaterial map={asf} roughness={0.95} />
      </mesh>
      {/* faixa de pedestre */}
      {Array.from({length: 6}).map((_, i) => (<Caixa key={i} pos={[-25 + i * 1.2, 0.025, 15.6]} tam={[0.6, 0.01, 2.4]} cor="#f4f1e6" sombra={false} />))}
      {PRE.map(([x, z, w, h, d, c], i) => (<Predio key={i} pos={[x, 0, z]} tam={[w, h, d]} cor={c} topo={i % 3 === 0 ? '#5a5f66' : undefined} />))}
      {/* árvores na calçada da avenida */}
      {Array.from({length: 12}).map((_, i) => (<Arvore key={i} pos={[-50 + i * 9, 0, 26.5]} esc={1.2} cor={i % 2 ? '#4f9a4a' : '#5aa85a'} />))}
      {Array.from({length: 8}).map((_, i) => (<Arvore key={'l' + i} pos={[-27, 0, -40 + i * 9]} esc={1.1} cor="#4a8f48" />))}
      {/* carros passando na avenida */}
      {[0, 1, 2, 3].map((i) => {
        const vai = i % 2 ? 1 : -1;
        const x = vai * (((t * 9 + i * 23) % 120) - 60);
        return <Carro key={i} pos={[x, 0, 21 + vai * 2]} rotY={vai > 0 ? 0 : Math.PI} cor={['#e9e6df', '#c94f4f', '#2f6fd6', '#f2a516'][i]} />;
      })}
      <Carro pos={[-21, 0, 40 - ((t * 7) % 80)]} rotY={Math.PI / 2} cor="#6b8f5a" />
    </group>
  );
};

// ======================= LANCHONETE DE 1948 (8 x 5 m, frente em +Z) =======================
const Lanchonete48: React.FC<{t: number; corte?: boolean; dono?: boolean; fila?: boolean; equipe?: boolean}> = ({t, corte = false, dono = true, fila = true, equipe = true}) => {
  const az = texAzulejo([4, 2]);
  const faixa = texListras('#c8322b', '#fff6dc', [10, 1]);
  return (
    <group>
      <mesh position={[0, 0.08, 1]} receiveShadow>
        <boxGeometry args={[11, 0.16, 9]} />
        <meshStandardMaterial map={texConcreto([4, 3])} roughness={0.9} />
      </mesh>
      {/* paredes de azulejo branco, base vermelha */}
      <Caixa pos={[0, 1.7, -2.5]} tam={[8, 3.2, 0.2]} cor="#ffffff" map={az} />
      {[-4, 4].filter((x) => !corte || x < 0).map((x) => (<Caixa key={x} pos={[x, 1.7, 0]} tam={[0.2, 3.2, 5]} cor="#ffffff" map={az} />))}
      {corte && <Linha48 t={t} />}
      <Caixa pos={[0, 0.6, 2.5]} tam={[8.2, 1.0, 0.22]} cor="#ffffff" map={faixa} />
      {/* balcão externo de pedidos (inox) */}
      <Caixa pos={[0, 1.12, 2.75]} tam={[8.2, 0.06, 0.55]} cor={INOX} />
      {!corte && <Vidro pos={[0, 2.05, 2.5]} tam={[8, 1.8]} />}
      {/* cardápio de preços na parede do fundo (quebra o azulejo liso) */}
      {!corte && (
        <group position={[-1.95, 2.75, -2.38]}>
          <Caixa pos={[0, 0, 0]} tam={[2.5, 1.3, 0.05]} cor="#5a3a22" />
          <mesh position={[0, 0, 0.03]}><planeGeometry args={[2.36, 1.16]} /><meshBasicMaterial map={texCardapio('anos48')} toneMapped={false} /></mesh>
        </group>
      )}
      {!corte && [-2, 0, 2].map((x) => (<Caixa key={x} pos={[x, 2.05, 2.5]} tam={[0.08, 1.8, 0.1]} cor={INOX} />))}
      {[-3.4, 3.4].map((x) => (<Letreiro key={x} pos={[x, 2.7, 2.58]} larg={1.1} alt={0.3} linhas={['PEDIDOS']} fundo="#c8322b" cor="#fff6dc" emissivo />))}
      {/* telhado inclinado com marquise listrada (some no corte) */}
      {!corte && (
        <group>
          <mesh position={[0, 3.6, 0.6]} rotation={[-0.12, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[9, 0.18, 7]} />
            <meshStandardMaterial color="#e9e1cf" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.98, 4.08]} rotation={[-0.12, 0, 0]}>
            <boxGeometry args={[9.05, 0.5, 0.06]} />
            <meshStandardMaterial map={faixa} roughness={0.8} />
          </mesh>
        </group>
      )}
      {/* placa alta com lâmpadas */}
      <group position={[5.6, 0, 2.6]}>
        <Cil pos={[0, 3, 0]} r={0.12} h={6} cor="#5a5f66" />
        <Caixa pos={[0, 6.4, 0]} tam={[2.6, 1.6, 0.25]} cor="#1d1b26" />
        <Letreiro pos={[0, 6.4, 0.14]} larg={2.4} alt={1.4} linhas={['HAMBÚRGUER', '15¢']} fundo="#fff6dc" cor="#c8322b" emissivo />
        {Array.from({length: 14}).map((_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.35, 6.4 + Math.sin(a) * 0.85, 0.16]}>
              <sphereGeometry args={[0.06, 20, 14]} />
              <meshBasicMaterial color={(i + Math.floor(t * 6)) % 2 ? '#ffe9a8' : '#f2a516'} toneMapped={false} />
            </mesh>
          );
        })}
      </group>
      {/* cozinha em linha: chapa, fritas, milk-shake (1 tarefa por pessoa); no corte a linha é outra (Linha48) */}
      {!corte && (<>
      <group position={[-2.4, 0.16, -1.6]}>
        <Caixa pos={[0, 0.42, 0]} tam={[1.6, 0.84, 0.8]} cor={INOX} />
        <Caixa pos={[0, 0.87, 0]} tam={[1.5, 0.05, 0.7]} cor="#2b2b30" />
        {Array.from({length: 8}).map((_, i) => (<Cil key={i} pos={[-0.55 + (i % 4) * 0.36, 0.91, -0.15 + Math.floor(i / 4) * 0.3]} r={0.06} h={0.025} cor="#6b3a1e" seg={10} />))}
        {equipe && <Boneco pos={[0, 0, 0.75]} rotY={Math.PI} t={t} v={FUNC48} esc={0.9} acao="martela" />}
      </group>
      <group position={[0, 0.16, -1.6]}>
        <Caixa pos={[0, 0.45, 0]} tam={[1.2, 0.9, 0.8]} cor={INOX} />
        <Caixa pos={[0, 0.91, 0]} tam={[0.9, 0.02, 0.55]} cor="#d99a2e" sombra={false} />
        <Caixa pos={[0, 1.0, 0.05]} tam={[0.5, 0.12, 0.4]} cor="#f5c842" />
        {equipe && <Boneco pos={[0, 0, 0.75]} rotY={Math.PI} t={t + 1} v={FUNC48} esc={0.88} />}
      </group>
      <group position={[2.3, 0.16, -1.6]}>
        <Caixa pos={[0, 0.45, 0]} tam={[1.4, 0.9, 0.7]} cor="#9fd3c7" />
        <MultiMixer pos={[0, 0.9, 0]} t={t} />
        {equipe && <Boneco pos={[0, 0, 0.75]} rotY={Math.PI} t={t + 2} v={FUNC48} esc={0.88} acao="carrega" />}
      </group>
      </>)}
      {/* bancada da frente: lanches embrulhados prontos */}
      {Array.from({length: 10}).map((_, i) => (
        <Caixa key={i} pos={[-1.8 + i * 0.4, 1.19, 2.7]} tam={[0.16, 0.08, 0.14]} cor={i % 3 ? '#f2ecdf' : '#e8c08a'} />
      ))}
      <Hamburguer pos={[-0.45, 1.15, 2.78]} esc={2.4} rotY={0.3} />
      <Fritas pos={[-0.1, 1.15, 2.8]} esc={1.6} />
      <group position={[-0.7, 1.15, 2.85]}>
        <Barra a={[0, 0, 0]} b={[0, 0.14, 0]} r={0.004} cor="#2b2b30" />
        <Letreiro pos={[0, 0.17, 0.003]} larg={0.14} alt={0.08} linhas={['15¢']} fundo="#fff6dc" cor="#c8322b" borda="#c8322b" />
      </group>
      {/* os irmãos atrás do balcão de pedidos */}
      {dono && (
        <group>
          {/* um de cada lado do montante do vidro (x = -2) */}
          <Boneco pos={[-2.55, 0.16, 1.7]} rotY={0.15} t={t} v={IRMAO} esc={0.93} acao="acena" />
          <Boneco pos={[-1.45, 0.16, 1.7]} rotY={-0.15} t={t + 1} v={{...IRMAO, cabelo: '#5a4030', gravata: '#8b2222'}} esc={0.93} acao="aponta" />
        </group>
      )}
      {/* fila nas duas janelas */}
      {fila && Array.from({length: 10}).map((_, i) => (
        <Boneco key={i} pos={[(i % 2 ? 3 : -3.4) + Math.sin(i) * 0.15, 0.16, 3.6 + Math.floor(i / 2) * 0.95]} rotY={Math.PI} t={t + i} v={CLIENTES48[i % 6]} esc={0.88 + (i % 3) * 0.03} acao={i < 2 ? 'aponta' : 'parado'} />
      ))}
      <pointLight position={[0, 3.0, 0]} intensity={4} distance={9} color="#fff0d0" />
    </group>
  );
};

// máquina de milk-shake de 5 hastes (a que o Kroc vendia), ~0,6 m
export const MultiMixer: React.FC<{pos: V3; t: number; esc?: number}> = ({pos, t, esc = 1}) => (
  <group position={pos} scale={esc}>
    <Caixa pos={[0, 0.04, 0]} tam={[0.9, 0.08, 0.3]} cor="#7ab8a8" />
    <Caixa pos={[0, 0.3, -0.11]} tam={[0.12, 0.5, 0.08]} cor="#9fd3c7" />
    <Caixa pos={[0, 0.58, -0.02]} tam={[0.95, 0.12, 0.22]} cor="#9fd3c7" />
    <Letreiro pos={[0, 0.58, 0.091]} larg={0.6} alt={0.09} linhas={['MULTI-MIXER']} fundo="#7ab8a8" cor="#1d3a3a" />
    {[-0.36, -0.18, 0, 0.18, 0.36].map((x, i) => (
      <group key={i} position={[x, 0, 0.02]}>
        <group rotation={[0, t * 12 + i, 0]}>
          <Cil pos={[0, 0.4, 0]} r={0.006} h={0.25} cor={INOX} seg={6} />
          <Caixa pos={[0, 0.3, 0]} tam={[0.04, 0.01, 0.01]} cor={INOX} sombra={false} />
        </group>
        <Cil pos={[0, 0.5, 0]} r={0.03} h={0.06} cor="#c3c8cf" seg={8} />
        <Cil pos={[0, 0.17, 0]} r={0.045} r2={0.04} h={0.18} cor={INOX} seg={12} />
        <Cil pos={[0, 0.25, 0]} r={0.042} h={0.01} cor={['#f2d0d8', '#fff6dc', '#7a4a2a', '#f2d0d8', '#fff6dc'][i]} seg={12} />
      </group>
    ))}
  </group>
);

// linha de montagem de 1948 vista do balcão: 3 estações (chapa, fritas, montagem), cada cozinheiro numa tarefa,
// de frente para a câmera; o lanche passa de estação em estação pela prateleira de inox da frente
const Linha48: React.FC<{t: number}> = ({t}) => {
  const Z = -0.85, ZC = -1.75, Y0 = 0.16;
  const EST: [number, string, Visual, 'martela' | 'parado' | 'carrega'][] = [[-1, 'CHAPA', FUNC48, 'martela'], [0, 'FRITAS', FUNC48, 'parado'], [1, 'MONTAGEM', FUNC48, 'carrega']];
  return (
    <group>
      {EST.map(([x, nome, v, acao], i) => (
        <group key={nome} position={[x, Y0, Z]}>
          <Caixa pos={[0, 0.42, 0]} tam={[0.9, 0.84, 0.8]} cor={INOX} />
          <Caixa pos={[0, 0.2, 0.401]} tam={[0.8, 0.02, 0.01]} cor="#8a8f96" sombra={false} />
          <Letreiro pos={[0, 0.6, 0.405]} larg={0.6} alt={0.16} linhas={[nome]} fundo="#c8322b" cor="#fff6dc" />
          <Boneco pos={[0, 0, ZC - Z]} rotY={0} t={t + i} v={v} esc={0.88} acao={acao} />
        </group>
      ))}
      {/* chapa com carnes */}
      <group position={[-1, Y0, Z]}>
        <Caixa pos={[0, 0.87, 0]} tam={[0.84, 0.05, 0.7]} cor="#2b2b30" />
        {Array.from({length: 6}).map((_, i) => (<Cil key={i} pos={[-0.25 + (i % 3) * 0.25, 0.91, -0.14 + Math.floor(i / 3) * 0.28]} r={0.07} h={0.025} cor={i === 4 ? '#8a4a24' : '#6b3a1e'} seg={10} />))}
        <Barra a={[0.2, 0.92, 0.1]} b={[0.3, 0.98, 0.3]} r={0.01} cor="#2b2b30" />
      </group>
      {/* fritadeira com cesto subindo e descendo */}
      <group position={[0, Y0, Z]}>
        <Caixa pos={[0, 0.855, 0]} tam={[0.7, 0.03, 0.55]} cor="#d99a2e" sombra={false} />
        <Caixa pos={[0, 0.92 + Math.max(0, Math.sin(t * 2)) * 0.1, 0.02]} tam={[0.4, 0.14, 0.4]} cor="#7a7f86" />
        <Caixa pos={[0, 1.0 + Math.max(0, Math.sin(t * 2)) * 0.1, 0.02]} tam={[0.36, 0.03, 0.36]} cor="#f5c842" sombra={false} />
        {[-0.2, 0.2].map((x) => (<Fritas key={x} pos={[x + 0.05, 0.84, 0.3]} esc={1.6} />))}
      </group>
      {/* montagem: pães abertos, saquinhos prontos */}
      <group position={[1, Y0, Z]}>
        {[-0.22, 0.02].map((x) => (<Cil key={x} pos={[x, 0.86, -0.1]} r={0.08} h={0.04} cor="#e0a050" seg={12} />))}
        <Hamburguer pos={[0.25, 0.84, -0.12]} esc={1.8} />
        {Array.from({length: 4}).map((_, i) => (<Caixa key={i} pos={[-0.25 + i * 0.17, 0.89, 0.2]} tam={[0.13, 0.08, 0.12]} cor={i % 2 ? '#f2ecdf' : '#e8c08a'} />))}
      </group>
      {/* prateleira de passagem (inox) na frente das 3 estações: o lanche anda da chapa até a montagem */}
      <Caixa pos={[0, Y0 + 1.12, -0.32]} tam={[3.0, 0.04, 0.26]} cor={INOX} />
      {[-1.45, 1.45].map((x) => (<Barra key={x} a={[x, Y0 + 0.84, -0.32]} b={[x, Y0 + 1.12, -0.32]} r={0.02} cor={INOX} />))}
      {[0, 1, 2, 3].map((i) => {
        const k = (t * 0.32 + i / 4) % 1;
        return <Hamburguer key={i} pos={[lerp(-1.3, 1.3, k), Y0 + 1.14 + Math.abs(Math.sin(k * Math.PI * 2)) * 0.06, -0.32]} esc={2.0} rotY={k * 3} />;
      })}
      {/* parede do fundo: prateleiras com pães */}
      {[-1.6, 1.6].map((x) => (
        <group key={x} position={[x, 0, -2.25]}>
          <Caixa pos={[0, 1.9, 0]} tam={[0.9, 0.04, 0.3]} cor={INOX} />
          {[0, 1, 2].map((j) => (<Cil key={j} pos={[-0.28 + j * 0.28, 1.97, 0]} r={0.09} h={0.1} cor="#e0a050" seg={10} />))}
        </group>
      ))}
    </group>
  );
};

const Serra: React.FC<{pos: V3; r: number; h: number; cor: string}> = ({pos, r, h, cor}) => (
  <mesh position={[pos[0], h / 2, pos[2]]} castShadow={false} receiveShadow>
    <coneGeometry args={[r, h, 24]} />
    <Mat cor={cor} />
  </mesh>
);
const Calif50: React.FC = () => (
  <group>
    <mesh position={[0, -0.03, 0]} receiveShadow>
      <boxGeometry args={[240, 0.04, 240]} />
      <meshStandardMaterial map={texTerra([30, 30])} color="#e8d8b8" roughness={1} />
    </mesh>
    {[[-90, -170, 40, 14, '#b9a07a'], [-30, -190, 50, 18, '#a89070'], [40, -180, 45, 15, '#bfa684'], [100, -170, 40, 12, '#b09878']].map(([x, z, r, h, c], i) => (
      <Serra key={i} pos={[x as number, 0, z as number]} r={r as number} h={h as number} cor={c as string} />
    ))}
    {[-14, -10, 12, 16, -30, 30].map((x, i) => (<Palmeira key={i} pos={[x, 0, -6 - (i % 3) * 7]} h={8 + (i % 3) * 1.5} />))}
  </group>
);

// ======================= ESTRADA, 1954: Kroc vendendo Multi-Mixer =======================
const Estrada54: React.FC<{t: number}> = ({t}) => {
  const asf = texAsfalto([2, 60]);
  const campo = tex('mc-campo', 256, 256, (g) => {
    for (let i = 0; i < 16; i++) {
      g.fillStyle = i % 2 ? '#c9b25a' : '#a8a048';
      g.fillRect(0, i * 16, 256, 16);
    }
  }, [20, 20]);
  return (
    <group>
      <mesh position={[0, -0.03, 0]} receiveShadow>
        <boxGeometry args={[300, 0.04, 300]} />
        <meshStandardMaterial map={campo} roughness={1} />
      </mesh>
      <mesh position={[0, 0.0, 0]} receiveShadow>
        <boxGeometry args={[8, 0.03, 300]} />
        <meshStandardMaterial map={asf} roughness={0.95} />
      </mesh>
      {Array.from({length: 40}).map((_, i) => (<Caixa key={i} pos={[0, 0.02, -150 + i * 7.5]} tam={[0.14, 0.01, 3.5]} cor="#f5e640" sombra={false} />))}
      {/* acostamento de terra */}
      <mesh position={[6.5, 0.0, 0]} receiveShadow>
        <boxGeometry args={[5, 0.02, 300]} />
        <meshStandardMaterial map={texTerra([2, 60])} roughness={1} />
      </mesh>
      {/* carro do Kroc parado no acostamento, porta-malas aberto com caixas */}
      <group position={[6.2, 0, -2]}>
        <CarroPremio pos={[0, 0, 0]} rotY={Math.PI / 2} cor="#7a2a2a" laco={false} />
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0.6 * (i - 1), 0.25 + (i === 1 ? 0.5 : 0), 2.6]}>
            <Caixa pos={[0, 0, 0]} tam={[0.55, 0.5, 0.45]} cor="#a87a4a" />
            <Letreiro pos={[0, 0, 0.23]} larg={0.45} alt={0.16} linhas={['MULTI-MIXER']} fundo="#c82f2f" cor="#fff" />
          </group>
        ))}
        {/* mesinha de demonstração com a máquina */}
        <group position={[-2.0, 0, 2.4]}>
          <Caixa pos={[0, 0.72, 0]} tam={[1.1, 0.05, 0.6]} cor="#8a5a36" />
          {[[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].map(([x, z], i) => (<Barra key={i} a={[x, 0, z]} b={[x, 0.72, z]} r={0.02} cor="#3a3a40" />))}
          <MultiMixer pos={[0, 0.745, 0]} t={t} />
        </group>
        <Ze pos={[-0.85, 0, 1.9]} rotY={0.3} t={t} terno mic={false} acao="aponta" />
      </group>
      {/* postes de telefone com fios, placa e celeiro */}
      {Array.from({length: 8}).map((_, i) => (
        <group key={i} position={[10.5, 0, -60 + i * 18]}>
          <Cil pos={[0, 4, 0]} r={0.12} h={8} cor="#6b4a2f" seg={6} />
          <Caixa pos={[0, 7.4, 0]} tam={[0.1, 0.1, 1.6]} cor="#6b4a2f" />
        </group>
      ))}
      {[-0.7, 0.7].map((z) => (<Barra key={z} a={[10.5, 7.5, -60 + z]} b={[10.5, 7.5, 66 + z]} r={0.01} cor="#2b2b30" sombra={false} />))}
      <group position={[-8, 0, -16]}>
        <Barra a={[-1.8, 0, 0]} b={[-1.8, 4, 0]} r={0.08} cor="#5a5f66" />
        <Barra a={[1.8, 0, 0]} b={[1.8, 4, 0]} r={0.08} cor="#5a5f66" />
        <Letreiro pos={[0, 3.4, 0.05]} larg={5} alt={2} linhas={['SAN BERNARDINO', '60 MILHAS']} fundo="#2f6a4a" cor="#fff" borda="#fff" />
      </group>
      <group position={[-30, 0, -45]}>
        <Caixa pos={[0, 3, 0]} tam={[10, 6, 8]} cor="#a8322b" />
        <mesh position={[0, 7.4, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[6.2, 6.2, 8.2]} />
          <Mat cor="#5a4a40" />
        </mesh>
        <Caixa pos={[0, 2, 4.05]} tam={[3.2, 4, 0.1]} cor="#f2ecdf" />
        <Cil pos={[8, 6, 0]} r={2} h={12} cor="#c3c8cf" seg={14} />
      </group>
      {[[-80, -190, 50, 16, '#8a9a6a'], [0, -210, 60, 20, '#7a8a5a'], [90, -190, 50, 14, '#94a070']].map(([x, z, r, h, c], i) => (
        <Serra key={i} pos={[x as number, 0, z as number]} r={r as number} h={h as number} cor={c as string} />
      ))}
      {[[-14, 6], [-18, -24], [27, -30], [22, 10]].map(([x, z], i) => (<Arvore key={i} pos={[x, 0, z]} esc={1.6} />))}
    </group>
  );
};

// ======================= RUA COM LANCHONETES IGUAIS (franquias) =======================
const CHQ_POS: V3 = [0, 0.02, 0.1], CHQ_ROT: V3 = [0, -0.3, -0.75];
const Franquias: React.FC<{t: number}> = ({t}) => {
  const asf = texAsfalto([30, 2]);
  const DONOS: Visual[] = [CLIENTES[0], CLIENTES[2], CLIENTES[1]];
  const k = suave(clamp01((t - 0.3) / 1.4));
  // cheque preso na mão: primeiro na do franqueado, depois na do Kroc (passa de mão)
  const cheque = (
    <group position={CHQ_POS} rotation={CHQ_ROT}>
      <Letreiro pos={[0, 0, 0]} larg={0.5} alt={0.24} linhas={['CHEQUE', 'US$ 950']} fundo="#d8ecd0" cor="#1d3a2a" borda="#2f6a4a" dupla />
    </group>
  );
  return (
    <group>
      <Calif50 />
      <mesh position={[0, 0.0, 8]} receiveShadow>
        <boxGeometry args={[200, 0.03, 8]} />
        <meshStandardMaterial map={asf} roughness={0.95} />
      </mesh>
      {Array.from({length: 26}).map((_, i) => (<Caixa key={i} pos={[-100 + i * 8, 0.02, 8]} tam={[3.5, 0.01, 0.14]} cor="#f4f1e6" sombra={false} />))}
      {[-13, 0, 13].map((x, i) => (
        <group key={x} position={[x, 0, -2]}>
          <Lanchonete48 t={t + i} dono={false} fila={false} />
          <Boneco pos={[-1.2, 0.16, 4.2]} rotY={0.2} t={t + i} v={DONOS[i]} esc={0.92} acao={i === 0 ? 'parado' : 'acena'} expressao="feliz"
            maoD={i === 0 && k < 0.5 ? cheque : undefined} />
          {[0, 1, 2].map((j) => (<Boneco key={j} pos={[2.6 + (j % 2) * 0.4, 0.16, 3.8 + j * 0.9]} rotY={Math.PI} t={t + j} v={CLIENTES48[(i + j) % 6]} esc={0.88} />))}
        </group>
      ))}
      {[-6.5, 6.5, 19.5, -19.5].map((x) => (<Arvore key={x} pos={[x, 0, 1]} esc={1.4} cor="#4f9a4a" />))}
      {/* Kroc recebe a taxa de entrada do primeiro franqueado (cheque passa de mão) */}
      <Ze pos={[-14.6, 0.16, 3.0]} rotY={Math.PI / 2 - 0.2} t={t} terno mic={false} acao="parado" expressao="feliz" maoD={k >= 0.5 ? cheque : undefined} />
      <CarroPremio pos={[8, 0, 7]} rotY={0} cor="#e9e6df" laco={false} />
      <CarroPremio pos={[-22, 0, 9.5]} rotY={Math.PI} cor="#5f8fb0" laco={false} />
    </group>
  );
};

// ======================= ESCRITÓRIO (antigo: Kroc/Sonneborn; moderno: franqueado) =======================
type ModoEsc = 'kroc54' | 'contas' | 'cofre' | 'sonneborn' | 'franqueado';
const Escritorio: React.FC<{t: number; p: number; modo: ModoEsc}> = ({t, p, modo}) => {
  const moderno = modo === 'franqueado';
  const L = 7, P = 5.5, A = 3;
  const piso = texMadeira(moderno ? '#b08a62' : '#7a4a2a', [4, 3]);
  const lambri = texMadeira('#5a3a20', [4, 0.6]);
  const papel = moderno ? texPapel('#e4e6ea', '#d6d9de', [8, 3]) : texPapel('#c9d4b8', '#b4c2a0', [8, 3]);
  const k = suave(clamp01(p));
  const cidade = tex('mc-janela-cidade', 256, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#8fc8f0');
    gr.addColorStop(1, '#f4e6c8');
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 256);
    const r = rnd(4);
    for (let i = 0; i < 9; i++) {
      const h = 80 + r() * 140;
      g.fillStyle = ['#8a96a8', '#a8a090', '#7a8698'][i % 3];
      g.fillRect(i * 30 - 6, 256 - h, 28, h);
      g.fillStyle = 'rgba(255,240,180,0.5)';
      for (let y = 256 - h + 8; y < 250; y += 14) g.fillRect(i * 30, y, 16, 5);
    }
  });
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[L, 0.1, P]} />
        <meshStandardMaterial map={piso} roughness={0.7} />
      </mesh>
      {/* tapete */}
      <Caixa pos={[0, 0.005, 0.2]} tam={[3.6, 0.01, 2.6]} cor={moderno ? '#8a96a8' : '#8b2a2a'} sombra={false} />
      <Caixa pos={[0, 0.008, 0.2]} tam={[3.2, 0.01, 2.2]} cor={moderno ? '#a8b2c0' : '#ffffff'} map={moderno ? undefined : texTapete()} sombra={false} />
      {/* parede do fundo com janela para a cidade */}
      <Caixa pos={[-2.25, A / 2, -P / 2]} tam={[2.5, A, 0.15]} cor="#ffffff" map={papel} />
      <Caixa pos={[2.75, A / 2, -P / 2]} tam={[1.5, A, 0.15]} cor="#ffffff" map={papel} />
      <Caixa pos={[0.5, 0.45, -P / 2]} tam={[2.0, 0.9, 0.15]} cor="#ffffff" map={papel} />
      <Caixa pos={[0.5, 2.8, -P / 2]} tam={[2.0, 0.4, 0.15]} cor="#ffffff" map={papel} />
      <mesh position={[0.5, 1.75, -P / 2 - 0.4]}>
        <planeGeometry args={[2.4, 1.9]} />
        <meshBasicMaterial map={cidade} toneMapped={false} />
      </mesh>
      <Caixa pos={[0.5, 1.75, -P / 2 + 0.05]} tam={[0.06, 1.7, 0.06]} cor="#f2ecdf" />
      <Caixa pos={[0.5, 1.75, -P / 2 + 0.05]} tam={[2.0, 0.06, 0.06]} cor="#f2ecdf" />
      {/* paredes laterais */}
      {[-1, 1].map((s) => (<Caixa key={s} pos={[(s * L) / 2, A / 2, 0]} tam={[0.15, A, P]} cor="#ffffff" map={papel} />))}
      {!moderno && (
        <group>
          <Caixa pos={[0, 0.5, -P / 2 + 0.1]} tam={[L, 1.0, 0.04]} cor="#ffffff" map={lambri} sombra={false} />
          {[-1, 1].map((s) => (<Caixa key={s} pos={[(s * L) / 2 - s * 0.1, 0.5, 0]} tam={[0.04, 1.0, P]} cor="#ffffff" map={lambri} sombra={false} />))}
        </group>
      )}
      {/* estante com livros (esquerda) */}
      <group position={[-L / 2 + 0.35, 0, -1.0]}>
        <Caixa pos={[0, 1.1, 0]} tam={[0.4, 2.2, 1.8]} cor="#5a3a20" />
        {[0.45, 0.95, 1.45, 1.95].map((y, j) => Array.from({length: 9}).map((_, i) => (
          <Caixa key={j + ':' + i} pos={[0.12, y, -0.75 + i * 0.18]} tam={[0.22, 0.34 + ((i + j) % 3) * 0.04, 0.14]} cor={['#8b2a2a', '#2f5d8a', '#d9b23f', '#3a6a3a', '#e9e1cf'][(i + j) % 5]} sombra={false} />
        )))}
      </group>
      {/* arquivo de aço e vaso (direita) */}
      <Caixa pos={[L / 2 - 0.4, 0.65, -1.8]} tam={[0.6, 1.3, 0.6]} cor={moderno ? '#d9dce0' : '#6a7a6a'} />
      {[0.35, 0.75, 1.15].map((y) => (<Caixa key={y} pos={[L / 2 - 0.69, y, -1.8]} tam={[0.02, 0.06, 0.3]} cor="#c3c8cf" sombra={false} />))}
      <group position={[L / 2 - 0.5, 0, 1.6]}>
        <Cil pos={[0, 0.25, 0]} r={0.22} r2={0.18} h={0.5} cor={moderno ? '#f2efe6' : '#a8653a'} />
        <mesh position={[0, 0.95, 0]} castShadow><icosahedronGeometry args={[0.45, 0]} /><Mat cor="#4f8f4a" /></mesh>
      </group>
      {/* quadro na parede direita */}
      {modo === 'sonneborn' ? (
        <Letreiro pos={[L / 2 - 0.09, 1.9, 0.0]} rotY={-Math.PI / 2} larg={2.4} alt={1.3} linhas={['1. COMPRA O TERRENO', '2. CONSTRÓI A LOJA', '3. ALUGA COM LUCRO']} fundo="#2f4a3a" cor="#fff6dc" borda="#8a6a43" />
      ) : moderno ? (
        <Letreiro pos={[L / 2 - 0.09, 1.9, 0.0]} rotY={-Math.PI / 2} larg={2.4} alt={1.3} linhas={['TAXA DE ENTRADA', 'ROYALTIES', 'ALUGUEL DO PONTO']} fundo="#ffffff" cor="#1d3a5a" borda="#2f9fd6" />
      ) : (
        <Letreiro pos={[L / 2 - 0.09, 1.9, 0.0]} rotY={-Math.PI / 2} larg={1.6} alt={1.1} linhas={['HAMBÚRGUER', '15¢']} fundo="#fff6dc" cor="#c8322b" borda="#c8322b" />
      )}
      {/* mesa */}
      <group position={[0, 0, 0]}>
        <Caixa pos={[0, 0.74, 0]} tam={[1.9, 0.06, 0.95]} cor={moderno ? '#f2efe6' : '#ffffff'} map={moderno ? undefined : texMadeira('#6a4426', [3, 1.5])} />
        {moderno ? (
          [[-0.85, -0.4], [0.85, -0.4], [-0.85, 0.4], [0.85, 0.4]].map(([x, z], i) => (<Barra key={i} a={[x, 0, z]} b={[x, 0.72, z]} r={0.025} cor="#2b2b30" />))
        ) : (
          <>
            <Caixa pos={[-0.65, 0.36, 0]} tam={[0.55, 0.72, 0.85]} cor="#4a2e18" />
            <Caixa pos={[0.65, 0.36, 0]} tam={[0.55, 0.72, 0.85]} cor="#4a2e18" />
            {[0.2, 0.45].map((y) => (<Caixa key={y} pos={[-0.65, y, 0.43]} tam={[0.3, 0.03, 0.02]} cor="#d9b23f" sombra={false} />))}
          </>
        )}
        {/* abajur, telefone */}
        {moderno ? (
          <group position={[-0.6, 0.77, -0.2]}>
            <Caixa pos={[0, 0.01, 0]} tam={[0.34, 0.02, 0.24]} cor="#2b2b30" />
            <Caixa pos={[0, 0.13, -0.11]} rot={[-0.25, 0, 0]} tam={[0.34, 0.22, 0.01]} cor="#2b2b30" />
            <Caixa pos={[0, 0.13, -0.1]} rot={[-0.25, 0, 0]} tam={[0.3, 0.18, 0.005]} cor="#5ad0f0" sombra={false} />
          </group>
        ) : modo === 'contas' || modo === 'cofre' ? null : (
          <group position={[-0.65, 0.77, -0.25]}>
            <Cil pos={[0, 0.02, 0]} r={0.08} h={0.04} cor="#d9b23f" />
            <Cil pos={[0, 0.18, 0]} r={0.01} h={0.3} cor="#d9b23f" />
            <mesh position={[0, 0.34, 0.05]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.06, 0.06, 0.3, 24, 1, false, 0, Math.PI]} /><meshStandardMaterial color="#2f6a4a" side={2} /></mesh>
            <pointLight position={[0, 0.25, 0.1]} intensity={1.2} distance={1.6} color="#ffe0a0" />
          </group>
        )}
        {modo !== 'contas' && modo !== 'cofre' && (
        <group position={[0.7, 0.77, -0.25]}>
          <Caixa pos={[0, 0.04, 0]} tam={[0.2, 0.08, 0.18]} cor="#1d1b26" />
          <Caixa pos={[0, 0.1, 0]} rot={[0, 0, 0.1]} tam={[0.22, 0.04, 0.05]} cor="#1d1b26" />
        </group>
        )}
      </group>
      {/* cenas por modo */}
      {(modo === 'kroc54' || modo === 'franqueado') && (
        <group position={[0.05, 0.775, 0.1]}>
          <mesh rotation={[-Math.PI / 2, 0, 0.08]}>
            <planeGeometry args={[0.32, 0.42]} />
            <meshStandardMaterial map={modo === 'kroc54' ? texPapelText('c54', 'CONTRATO DE FRANQUIA', ['1954'], true) : texPapelText('c23', 'FRANQUIA · 20 ANOS', ['TAXA · ROYALTIES', 'ALUGUEL'], true)} roughness={0.9} />
          </mesh>
          {/* assinatura sendo feita + caneta */}
          <Caixa pos={[-0.06 + 0.06 * k, 0.003, 0.17]} tam={[0.13 * k + 0.001, 0.002, 0.008]} cor="#1d3a8a" sombra={false} />
          <Barra a={[-0.12 + 0.13 * k, 0.005, 0.17]} b={[-0.06 + 0.13 * k, 0.13, 0.24]} r={0.007} cor="#1d1b26" />
        </group>
      )}
      {modo === 'kroc54' && (
        <group>
          <Ze pos={[-0.55, 0, -0.85]} rotY={0.2} t={t} terno mic={false} acao={k > 0.7 ? 'acena' : 'aponta'} />
          <Boneco pos={[0.45, 0, -0.9]} rotY={-0.15} t={t} v={IRMAO} esc={0.93} acao="parado" />
          <Boneco pos={[1.15, 0, -0.55]} rotY={-0.5} t={t + 1} v={{...IRMAO, cabelo: '#5a4030', gravata: '#8b2222'}} esc={0.93} acao={k > 0.8 ? 'acena' : 'parado'} />
        </group>
      )}
      {modo === 'franqueado' && (
        <group>
          <Boneco pos={[-0.5, 0, -0.85]} rotY={0.25} t={t} v={FRANQUEADA} esc={0.9} acao="aponta" />
          <Boneco pos={[0.6, 0, -0.9]} rotY={-0.25} t={t + 1} v={EXECUTIVO} esc={0.93} acao={k > 0.8 ? 'acena' : 'parado'} />
        </group>
      )}
      {(modo === 'contas' || modo === 'cofre') && <Contas t={t} p={p} cofre={modo === 'cofre'} />}
      {modo === 'sonneborn' && (
        <group>
          <Boneco pos={[0.55, 0, -0.85]} rotY={-0.3} t={t} v={SONNEBORN} esc={0.93} acao="aponta" />
          <Ze pos={[-0.6, 0, -0.8]} rotY={0.3} t={t} terno mic={false} acao={k > 0.6 ? 'acena' : 'parado'} />
          {/* maquete: lote, loja que sobe, placa de aluguel */}
          <group position={[0, 0.77, 0.05]}>
            <Caixa pos={[0, 0.015, 0]} tam={[0.7, 0.03, 0.5]} cor="#6fa05a" />
            <Caixa pos={[0, 0.032, 0]} tam={[0.5, 0.005, 0.36]} cor="#9a7048" sombra={false} />
            <group scale={[1, Math.max(0.02, suave(clamp01(p * 1.4))), 1]}>
              <Caixa pos={[0, 0.08, -0.05]} tam={[0.3, 0.1, 0.2]} cor="#a4553a" />
              <Caixa pos={[0, 0.135, -0.05]} tam={[0.32, 0.015, 0.22]} cor="#c8322b" />
            </group>
            {p > 0.6 && (
              <group position={[0.2, 0.03, 0.14]}>
                <Barra a={[0, 0, 0]} b={[0, 0.12, 0]} r={0.003} cor="#2b2b30" />
                <Letreiro pos={[0, 0.12, 0.002]} larg={0.11} alt={0.05} linhas={['ALUGA-SE']} fundo="#f2a516" cor="#1d1b26" />
              </group>
            )}
          </group>
        </group>
      )}
      <pointLight position={[0, 2.8, 0.8]} intensity={3} distance={8} color="#fff0d8" />
    </group>
  );
};

// livro-caixa: 1,9% de cada venda; 0,5% sai para os irmãos; sobra 1,4%; cofre quase vazio e contas a pagar
const Contas: React.FC<{t: number; p: number; cofre?: boolean}> = ({t, p, cofre = false}) => {
  const k = suave(clamp01((p - 0.5) / 0.4));
  const livro = tex('mc-livro', 512, 340, (g) => {
    g.fillStyle = '#f6efd8';
    g.fillRect(0, 0, 512, 340);
    g.fillStyle = '#d0c4a0';
    g.fillRect(254, 0, 4, 340);
    g.strokeStyle = 'rgba(47,93,138,0.35)';
    for (let y = 40; y < 340; y += 24) {
      g.beginPath();
      g.moveTo(10, y);
      g.lineTo(502, y);
      g.stroke();
    }
    linha(g, 'VENDAS DAS LOJAS', 128, 24, 220, 24, '#1d1b26');
    linha(g, 'NOSSA PARTE', 384, 24, 220, 24, '#1d1b26');
    for (let i = 0; i < 9; i++) linha(g, '$ ' + (1200 + ((i * 377) % 900)) + ',00', 128, 54 + i * 24, 200, 18, '#3a3a48');
    linha(g, '1,9%', 384, 70, 200, 34, '#2f6a4a');
    linha(g, '− 0,5% IRMÃOS', 384, 130, 220, 28, '#8b2222');
    linha(g, '= 1,4%', 384, 200, 200, 40, '#c8322b');
    linha(g, 'NÃO PAGA AS CONTAS', 384, 270, 230, 22, '#c8322b');
  });
  return (
    <group>
      {/* Kroc em pé ao lado da mesa (à esquerda); na mesa: caixa atrás, livro no meio, contas e moedas na frente */}
      <Ze pos={[-1.35, 0, -0.85]} rotY={0.6} t={t} terno mic={false} acao="parado" />
      {cofre && [[-0.24, 0.3], [-0.3, 0.06], [0.17, -0.02], [0.13, 0.12]].map(([x, z], i) => (
        <Moeda key={i} pos={[x, 0.782, z]} rot={[-Math.PI / 2, 0, i]} valor="$" r={0.03} />
      ))}
      {!cofre && (<>
      <group position={[-0.15, 0.775, 0.08]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.6, 0.4]} />
          <meshStandardMaterial map={livro} roughness={0.9} />
        </mesh>
      </group>
      {/* 19 moedas = 1,9%; 5 vão para o envelope dos irmãos */}
      <group position={[-0.06, 0.775, 0.38]}>
        <PilhaMoedas pos={[0, 0, 0]} n={14} r={0.035} />
        {Array.from({length: 5}).map((_, i) => {
          const kk = suave(clamp01(k * 1.3 - i * 0.06));
          const y0 = 14 * 0.035 * 0.16 + i * 0.035 * 0.16;
          return <Moeda key={i} pos={[lerp(0, 0.32, kk), lerp(y0, 0.01 + i * 0.006, kk) + Math.sin(kk * Math.PI) * 0.12, lerp(0, -0.26, kk)]} rot={[-Math.PI / 2, 0, 0]} valor="$" r={0.035} />;
        })}
        <Caixa pos={[0.32, 0.008, -0.3]} tam={[0.22, 0.01, 0.14]} cor="#e8d8b0" />
        <Letreiro pos={[0.32, 0.015, -0.345]} rot={[-Math.PI / 2, 0, 0]} larg={0.2} alt={0.045} linhas={['IRMÃOS']} fundo="#e8d8b0" cor="#8b2222" />
      </group>
      </>)}
      {/* cofre de caixa quase vazio + pilha de contas vencidas */}
      <group position={[-0.12, 0.775, -0.3]}>
        {/* caixa-forte de aço verde, tampa aberta, vazia: só 1 moeda */}
        <Caixa pos={[0, 0.005, 0]} tam={[0.42, 0.01, 0.3]} cor="#2f4a3a" />
        <Caixa pos={[0, 0.09, 0.145]} tam={[0.42, 0.18, 0.01]} cor="#2f5a3a" />
        <Caixa pos={[0, 0.09, -0.145]} tam={[0.42, 0.18, 0.01]} cor="#2f5a3a" />
        {[-1, 1].map((s2) => (<Caixa key={s2} pos={[s2 * 0.205, 0.09, 0]} tam={[0.01, 0.18, 0.3]} cor="#2f5a3a" />))}
        <Caixa pos={[0, 0.012, 0]} tam={[0.4, 0.004, 0.28]} cor="#c9b48a" sombra={false} />
        <Moeda pos={[0.05, 0.02, 0.03]} rot={[-Math.PI / 2, 0, 0]} valor="$" r={0.025} />
        <Caixa pos={[0, 0.214, -0.291]} rot={[-1.35, 0, 0]} tam={[0.42, 0.3, 0.012]} cor="#3a6a4a" />
        <Cil pos={[0, 0.18, -0.148]} rot={[0, 0, Math.PI / 2]} r={0.012} h={0.4} cor="#c3c8cf" />
        <Caixa pos={[0.0, 0.09, 0.152]} tam={[0.06, 0.05, 0.01]} cor="#d9b23f" sombra={false} />
        <Letreiro pos={[0, 0.13, 0.152]} larg={0.2} alt={0.05} linhas={['CAIXA']} fundo="#2f5a3a" cor="#f2e6c8" />
      </group>
      <group position={cofre ? [0.02, 0.775, 0.22] : [-0.33, 0.775, 0.36]}>
        {Array.from({length: 7}).map((_, i) => (
          <mesh key={i} position={[(i % 2) * 0.02, 0.006 + i * 0.008, 0]} rotation={[-Math.PI / 2, 0, (i - 3) * 0.08]}>
            <planeGeometry args={[0.2, 0.26]} />
            <meshStandardMaterial map={texPapelText('conta', 'CONTA A PAGAR', ['VENCIDA'])} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ======================= TERRENO DE ESQUINA (lote 26 x 22 m) =======================
type ModoTer = 'lote' | 'obra' | 'dono' | 'final' | 'ze';
const Terreno: React.FC<{t: number; p: number; modo: ModoTer}> = ({t, p, modo}) => {
  const terra = texTerra([6, 5]);
  const calc = texConcreto([20, 1]);
  const vendido = modo === 'lote' && p > 0.45;
  const sobe = modo === 'obra' ? clamp01(p * 1.15) : modo === 'lote' ? 0 : 1;
  // final: a loja sobe NO LUGAR (em cima do próprio lote) e mostra o chão de ouro embaixo dela
  const voa = modo === 'final' ? 2.4 * suave(clamp01((p - 0.33) / 0.45)) : 0;
  return (
    <group>
      <Cidade t={t} />
      {/* lote */}
      <mesh position={[0, 0.02, 2]} receiveShadow>
        <boxGeometry args={[30, 0.04, 26]} />
        <meshStandardMaterial map={terra} roughness={1} />
      </mesh>
      <mesh position={[0, 0.08, 15.5]} receiveShadow>
        <boxGeometry args={[34, 0.16, 3]} />
        <meshStandardMaterial map={calc} roughness={0.9} />
      </mesh>
      {modo === 'lote' && (
        <group>
          {Array.from({length: 40}).map((_, i) => {
            const r = rnd(i + 30);
            return <Tufo key={i} pos={[r() * 26 - 13, 0.04, r() * 22 - 9]} esc={2.2} />;
          })}
          {/* cerca de arame */}
          {Array.from({length: 14}).map((_, i) => (<Barra key={i} a={[-14 + i * 2.15, 0, -9]} b={[-14 + i * 2.15, 1.3, -9]} r={0.05} cor="#6b4a2f" />))}
          {[0.5, 1.0].map((y) => (<Barra key={y} a={[-14, y, -9]} b={[14, y, -9]} r={0.01} cor="#8a8f96" sombra={false} />))}
          {/* estacas de topografia */}
          {[[-13, 13], [13, 13], [-13, -8.5], [13, -8.5]].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <Barra a={[0, 0, 0]} b={[0, 1.2, 0]} r={0.03} cor="#e9e1cf" />
              <Caixa pos={[0.15, 1.1, 0]} tam={[0.3, 0.2, 0.01]} cor="#f2a516" sombra={false} />
            </group>
          ))}
          {/* Kroc e o vendedor à direita da placa, inteiros e de frente para a câmera */}
          <Ze pos={[-3.7, 0.04, 8.7]} rotY={0.55} t={t} terno mic={false} acao={vendido ? 'acena' : 'parado'} />
          <Boneco pos={[-2.9, 0.04, 8.7]} rotY={-0.55} t={t} v={{camisa: '#d9cdb0', calca: '#4a3e32', colete: null, capacete: null, cabelo: '#8a8a8a', bone: '#6b5a48'}} esc={0.92} acao={vendido ? 'acena' : 'aponta'} />
        </group>
      )}
      {/* placa do terreno (vende-se -> vendido -> aluga-se) */}
      {(modo === 'lote' || modo === 'obra') && (
        <group position={modo === 'lote' ? [-5.3, 0, 9.0] : [7.5, 0, 12.5]}>
          {modo === 'lote' ? (
            <>
              {/* placa de imobiliária (1,8 m), à esquerda dos bonecos */}
              <Barra a={[-0.75, 0, 0]} b={[-0.75, 2.4, 0]} r={0.05} cor="#6b4a2f" />
              <Barra a={[0.75, 0, 0]} b={[0.75, 2.4, 0]} r={0.05} cor="#6b4a2f" />
              <Letreiro pos={[0, 1.9, 0.06]} larg={1.8} alt={0.95} linhas={['VENDE-SE', 'TERRENO 600 m²']} fundo="#fff6dc" cor="#1d3a5a" borda="#1d3a5a" />
              {vendido && <Caixa pos={[0, 1.9, 0.09]} rot={[0, 0, 0.35]} tam={[1.9, 0.3, 0.02]} cor="#c8322b" sombra={false} />}
              {vendido && <Letreiro pos={[0, 1.9, 0.105]} rot={[0, 0, 0.35]} larg={1.7} alt={0.27} linhas={['VENDIDO']} fundo="#c8322b" cor="#ffffff" />}
            </>
          ) : (
            <>
              <Barra a={[-1.1, 0, 0]} b={[-1.1, 2.6, 0]} r={0.06} cor="#6b4a2f" />
              <Barra a={[1.1, 0, 0]} b={[1.1, 2.6, 0]} r={0.06} cor="#6b4a2f" />
              <Letreiro pos={[0, 2.1, 0.07]} larg={2.8} alt={1.3} linhas={['ALUGA-SE', 'PARA FRANQUEADO']} fundo="#f2a516" cor="#1d1b26" borda="#1d1b26" />
            </>
          )}
        </group>
      )}
      {modo === 'obra' && (
        <group>
          {/* andaime nas laterais enquanto sobe */}
          {sobe < 0.97 && [-RW / 2 - 0.8, RW / 2 + 0.8].map((x) => (
            <group key={x}>
              {[-4, 0, 4].map((z) => (<Barra key={z} a={[x, 0, z]} b={[x, RH * Math.max(0.2, sobe) + 0.8, z]} r={0.04} cor="#f2a516" />))}
              {[1, 2.2, 3.4].filter((y) => y < RH * sobe + 0.6).map((y) => (<Caixa key={y} pos={[x, y, 0]} tam={[0.7, 0.05, 8.4]} cor="#8a5a36" />))}
            </group>
          ))}
          <Boneco pos={[RW / 2 + 1.6, 0.04, 6]} rotY={-0.6} t={t} v={{camisa: '#4f8cff', colete: '#ff8a1f', capacete: '#ffd23f', calca: '#30406b'}} esc={0.92} acao="martela" />
        </group>
      )}
      {sobe > 0 && (
        <group position={[0, voa, 0]}>
          <Restaurante t={t} sobe={sobe} letreiros={modo !== 'final' && modo !== 'ze'} />
        </group>
      )}
      {sobe > 0.95 && modo !== 'obra' && <Entorno t={t} semCarros={modo === 'final'} limpo={modo === 'final'} />}
      {/* dono: contorno do lote brilhando + placa grande */}
      {(modo === 'dono' || modo === 'final') && (
        <group>
          {([[0, 2, 30, 0.12], [0, 2, 0.12, 26]] as const).map(([, , w, d], i) => (
            <group key={i}>
              {[-1, 1].map((s) => (
                <mesh key={s} position={i === 0 ? [0, 0.06, 2 + s * 13] : [s * 15, 0.06, 2]}>
                  <boxGeometry args={[w, 0.06, d]} />
                  <meshBasicMaterial color="#7cc4ff" toneMapped={false} />
                </mesh>
              ))}
            </group>
          ))}
          {modo === 'dono' && [[-15, -11], [15, -11], [-15, 15], [15, 15]].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <Cil pos={[0, 0.6, 0]} r={0.12} h={1.2} cor="#2f6fd6" />
              <mesh position={[0, 1.3, 0]}><sphereGeometry args={[0.2, 20, 14]} /><meshBasicMaterial color="#7cc4ff" toneMapped={false} /></mesh>
            </group>
          ))}
        </group>
      )}
      {modo === 'dono' && (
        <group position={[12.5, 0, 9.0]}>
          <Barra a={[-1.15, 0, 0]} b={[-1.15, 3.0, 0]} r={0.07} cor="#2b2b30" />
          <Barra a={[1.15, 0, 0]} b={[1.15, 3.0, 0]} r={0.07} cor="#2b2b30" />
          <Letreiro pos={[0, 2.4, 0.08]} larg={2.6} alt={1.2} linhas={['TERRENO DA REDE', 'LOJA ALUGADA']} fundo="#1d3a5a" cor="#ffffff" borda="#7cc4ff" />
          {/* o inquilino (franqueado) embaixo da placa, perto da câmera; crachá numa estaca ao lado */}
          <Boneco pos={[-0.2, 0.04, 0.3]} rotY={0.1} t={t} v={FRANQUEADA} esc={0.9} acao="parado" />
          <Barra a={[0.6, 0, 0.3]} b={[0.6, 1.05, 0.3]} r={0.025} cor="#6b4a2f" />
          <Letreiro pos={[0.6, 1.1, 0.33]} larg={0.8} alt={0.22} linhas={['INQUILINO']} fundo="#f2a516" cor="#1d1b26" />
        </group>
      )}
      {/* final: o chão embaixo da loja é ouro */}
      {modo === 'final' && voa > 0.2 && (
        <group>
          <mesh position={[0, 0.07, 0]} receiveShadow>
            <boxGeometry args={[RW, 0.04, RD]} />
            <meshStandardMaterial color="#e9b830" emissive="#8a6410" emissiveIntensity={0.9} metalness={0.3} roughness={0.4} />
          </mesh>
          {/* faixa pendurada embaixo da frente da loja, seta para o chão de ouro logo abaixo */}
          <group position={[0, voa - 0.55, RD / 2 + 0.25]}>
            {[-2.6, 2.6].map((x) => (<Barra key={x} a={[x, 0.2, 0]} b={[x, 0.55, 0]} r={0.03} cor="#2b2b30" />))}
            <Letreiro pos={[0, 0, 0]} larg={6.4} alt={0.85} linhas={['O TERRENO ↓']} fundo="#1d1b26" cor="#ffd23f" borda="#e9b830" emissivo />
          </group>
          {[[-5.6, 1.5], [5.6, 1.5], [-3.6, 3.8], [3.6, 3.8]].map(([x, z], i) => (
            <group key={i} position={[x, 0.1, z]} scale={5}>
              <PilhaMoedas pos={[0, 0, 0]} n={Math.round(8 + 10 * suave(clamp01((p - 0.5) * 2)))} r={0.035} />
            </group>
          ))}
        </group>
      )}
      {modo === 'final' && (
        <group position={[-5.5, 0.16, 12.5]}>
          {/* hambúrguer gigante na entrada (estátua) */}
          <Caixa pos={[0, 0.4, 0]} tam={[1.4, 0.8, 1.4]} cor="#2b2b30" />
          <Hamburguer pos={[0, 0.8, 0]} esc={18} rotY={0.4} />
        </group>
      )}
      {modo === 'ze' && (
        <group>
          <Ze pos={[0, 0.16, 12.6]} rotY={0} t={t} terno acao="acena" />
          <group position={[-0.88, 0.16, 11.7]}>
            <Barra a={[0, 0, 0]} b={[0, 1.85, 0]} r={0.04} cor="#6b4a2f" />
            <Letreiro pos={[0, 1.72, 0.05]} larg={0.7} alt={0.29} linhas={['LANCHONETE ↑']} fundo="#c8322b" cor="#fff6dc" />
          </group>
          <group position={[0.88, 0.16, 11.7]}>
            <Barra a={[0, 0, 0]} b={[0, 1.85, 0]} r={0.04} cor="#6b4a2f" />
            <Letreiro pos={[0, 1.72, 0.05]} larg={0.7} alt={0.29} linhas={['CHÃO ↓']} fundo="#e9b830" cor="#1d1b26" />
          </group>
        </group>
      )}
    </group>
  );
};

// ======================= FLUXO DO DINHEIRO: loja -> sede em 3 esteiras =======================
const Esteira: React.FC<{z: number; cor: string; nome: string; t: number; ativo: boolean; tipo: 'saco' | 'moeda' | 'maco'; kSaco?: number}> = ({z, cor, nome, t, ativo, tipo, kSaco = 0}) => {
  const X0 = -6.5, X1 = 7.5, Y = 1.0;
  const n = tipo === 'maco' ? 12 : 42;
  const passo = (X1 - X0) / n;
  return (
    <group position={[0, 0, z]}>
      <Caixa pos={[(X0 + X1) / 2, Y - 0.12, 0]} tam={[X1 - X0, 0.18, 1.3]} cor="#3a3d44" />
      <Caixa pos={[(X0 + X1) / 2, Y - 0.01, 0]} tam={[X1 - X0, 0.04, 1.1]} cor="#1d1b26" />
      {[-0.68, 0.68].map((s) => (<Caixa key={s} pos={[(X0 + X1) / 2, Y + 0.08, s]} tam={[X1 - X0, 0.12, 0.06]} cor={cor} />))}
      {/* frisos da correia andando */}
      {Array.from({length: 28}).map((_, i) => {
        const x = X0 + (((i * 0.5 + t * (ativo ? 1.6 : 0)) % (X1 - X0)) + (X1 - X0)) % (X1 - X0);
        return <Caixa key={i} pos={[x, Y + 0.012, 0]} tam={[0.05, 0.01, 1.05]} cor="#3a3a44" sombra={false} />;
      })}
      {[X0 + 1, (X0 + X1) / 2, X1 - 1].map((x) => (
        <group key={x}>
          <Barra a={[x, 0, -0.5]} b={[x, Y - 0.2, -0.5]} r={0.05} cor="#5a5f66" />
          <Barra a={[x, 0, 0.5]} b={[x, Y - 0.2, 0.5]} r={0.05} cor="#5a5f66" />
        </group>
      ))}
      <group position={[X0 - 0.6, 0, 0.9]}>
        <Barra a={[0, 0, 0]} b={[0, 2.2, 0]} r={0.05} cor="#2b2b30" />
        <Letreiro pos={[0.9, 2.0, 0.04]} larg={1.9} alt={0.5} linhas={[nome]} fundo={cor} cor="#1d1b26" />
      </group>
      {tipo === 'saco' && (
        <group position={[lerp(X0 + 0.5, X1 - 0.4, kSaco), Y + 0.02, 0]}>
          <mesh position={[0, 0.38, 0]} scale={[1, 1.15, 1]} castShadow><sphereGeometry args={[0.38, 20, 14]} /><Mat cor="#c9a26a" /></mesh>
          <Cil pos={[0, 0.85, 0]} r={0.08} r2={0.14} h={0.2} cor="#a8814a" />
          <Letreiro pos={[0, 0.4, 0.39]} larg={0.5} alt={0.25} linhas={['US$']} fundo="#c9a26a" cor="#2f6a4a" />
          {[[-0.4, 0, -Math.PI / 2], [0, -0.4, Math.PI]].map(([x, z, r], i) => (
            <Letreiro key={i} pos={[x, 0.42, z]} rotY={r} larg={0.36} alt={0.22} linhas={['US$']} fundo="#2f6a4a" cor="#ffd23f" borda="#ffd23f" />
          ))}
          <Barra a={[-0.12, 0.82, -0.05]} b={[-0.3, 0.68, -0.2]} r={0.006} cor="#5a3a20" sombra={false} />
          <Letreiro pos={[-0.32, 0.62, -0.24]} rotY={-Math.PI * 0.75} larg={0.24} alt={0.1} linhas={['TAXA']} fundo="#fff6dc" cor="#c8322b" borda="#c8322b" />
        </group>
      )}
      {tipo !== 'saco' && ativo && Array.from({length: n}).map((_, i) => {
        const x = X0 + 0.3 + (((i * passo + t * 1.6) % (X1 - X0 - 0.6)) + (X1 - X0 - 0.6)) % (X1 - X0 - 0.6);
        return tipo === 'moeda' ? (
          <Moeda key={i} pos={[x, Y + 0.05, (i % 3 - 1) * 0.3]} rot={[-Math.PI / 2, 0, i]} valor="$" r={0.12} />
        ) : (
          <group key={i} position={[x, Y + 0.02, 0]}>
            <Caixa pos={[0, 0.16, 0]} tam={[0.7, 0.32, 0.5]} cor="#ffffff" map={texNotas('#d9b23f')} />
            <Caixa pos={[0, 0.16, 0]} tam={[0.12, 0.34, 0.52]} cor="#c8322b" sombra={false} />
          </group>
        );
      })}
    </group>
  );
};
const Sede: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Predio pos={[0, 0, 0]} tam={[10, 26, 10]} cor="#6a7f96" topo="#2b2b30" />
    <Caixa pos={[0, 1.6, 5.1]} tam={[5, 3.2, 0.2]} cor="#2b3a4a" />
    <Caixa pos={[0, 3.6, 5.6]} tam={[6.5, 0.2, 1.4]} cor="#c3c8cf" />
    <Letreiro pos={[0, 4.4, 5.12]} larg={6} alt={0.9} linhas={['SEDE DA REDE']} fundo="#1d1b26" cor="#ffd23f" emissivo />
    {/* face das esteiras: portão de recebimento com letreiro */}
    <Caixa pos={[-5.1, 1.1, 2.5]} tam={[0.2, 2.2, 3.4]} cor="#7a828c" />
    {Array.from({length: 7}).map((_, i) => (<Caixa key={i} pos={[-5.21, 0.2 + i * 0.3, 2.5]} tam={[0.03, 0.05, 3.3]} cor="#5a6068" sombra={false} />))}
    <Letreiro pos={[-5.12, 2.55, 2.5]} rotY={-Math.PI / 2} larg={2.2} alt={0.45} linhas={['SEDE DA REDE']} fundo="#1d1b26" cor="#ffd23f" emissivo />
    <Caixa pos={[-5.55, 2.95, 2.5]} tam={[0.9, 0.12, 3.8]} cor="#c3c8cf" />
    {[0.6, 4.4].map((z) => (<Caixa key={z} pos={[-5.12, 1.4, z]} tam={[0.05, 1.0, 1.2]} cor="#ffe6a8" sombra={false} />))}
  </group>
);
const Fluxo: React.FC<{t: number; p: number}> = ({t, p}) => {
  const piso = texConcreto([16, 10]);
  const pilha = (k: number) => Math.round(k * 10);
  return (
    <group>
      <Cidade t={t} />
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[60, 0.04, 30]} />
        <meshStandardMaterial map={piso} roughness={0.9} />
      </mesh>
      <group position={[-15, 0, -1]} scale={0.8}>
        <Restaurante t={t} />
      </group>
      <Sede pos={[14.5, 0, -2]} />
      <Esteira z={-3} cor="#9fc3dc" nome="TAXA" t={t} ativo={p < 0.36} tipo="saco" kSaco={clamp01(p / 0.34)} />
      <Esteira z={0.5} cor="#4ade80" nome="ROYALTIES" t={t} ativo={p >= 0.3} tipo="moeda" />
      <Esteira z={4} cor="#ffd23f" nome="ALUGUEL" t={t} ativo={p >= 0.62} tipo="maco" />
      {/* o que chegou na sede */}
      <group position={[9, 0.04, -3]}>{p > 0.3 && <Caixa pos={[0, 0.3, 0]} tam={[0.8, 0.6, 0.8]} cor="#c9a26a" />}</group>
      <group position={[9.2, 0.04, 4]}>
        {Array.from({length: pilha(clamp01((p - 0.67) / 0.33))}).map((_, i) => (
          <Caixa key={i} pos={[(i % 2) * 0.75 - 0.35, 0.16 + Math.floor(i / 2) * 0.33, 0]} tam={[0.7, 0.32, 0.5]} cor="#ffffff" map={texNotas('#d9b23f')} />
        ))}
      </group>
      <Boneco pos={[-6.8, 0.04, 7.6]} rotY={0.6} t={t} v={FRANQUEADA} esc={0.92} acao="aponta" />
      {/* fim da esteira dos royalties: caixa coletora de moedas e um funcionário da sede */}
      <group position={[8.5, 0.04, 0.5]}>
        <Caixa pos={[0, 0.35, 0]} tam={[0.9, 0.7, 1.2]} cor="#5a6068" />
        <Caixa pos={[0, 0.71, 0]} tam={[0.8, 0.02, 1.1]} cor="#d9b23f" sombra={false} />
        {Array.from({length: 6}).map((_, i) => (<Moeda key={i} pos={[-0.25 + (i % 3) * 0.25, 0.74, -0.25 + Math.floor(i / 3) * 0.45]} rot={[-Math.PI / 2, 0, i]} valor="$" r={0.12} />))}
      </group>
      <Boneco pos={[8.6, 0.04, -2.4]} rotY={-Math.PI / 2 + 0.5} t={t + 1} v={EXECUTIVO} esc={0.92} acao="aponta" />
      <Ze pos={[8.5, 0.04, 7.0]} rotY={-0.5} t={t} terno mic={false} acao={p > 0.67 ? 'comemora' : 'acena'} />
    </group>
  );
};

// ======================= PILARES DE DINHEIRO (1 m = US$ 1 bilhão) =======================
const texMedalhao = () =>
  tex('mc-medalhao', 512, 512, (g) => {
    g.fillStyle = '#b9b0a0';
    g.fillRect(0, 0, 512, 512);
    g.fillStyle = '#d9b23f';
    g.beginPath();
    g.arc(256, 256, 252, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#a8322b';
    g.beginPath();
    g.arc(256, 256, 222, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#d9b23f';
    g.lineWidth = 6;
    g.beginPath();
    g.arc(256, 256, 196, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      g.fillStyle = '#d9b23f';
      g.fillRect(256 + Math.cos(a) * 208 - 4, 256 + Math.sin(a) * 208 - 4, 8, 8);
    }
    linha(g, 'US$', 256, 236, 300, 150, '#ffd23f');
    linha(g, 'RECEITA 2023', 256, 340, 280, 40, '#f4ead2');
  });
const ALUGUEL_M = 9.84, ROYAL_M = 5.53, TAXA_M = 0.066, PX = 1.45;
const Pilares: React.FC<{t: number; p: number}> = ({t, p}) => {
  const piso = texXadrez('#d9d2c4', '#b9b0a0', [12, 12]);
  const granito = texConcreto([1, 1]);
  // as duas pilhas sobem JUNTAS (mesma fração), então em qualquer quadro o aluguel é ~1,8x os royalties
  const kP = suave(clamp01(p / 0.9));
  const hA = Math.max(0.09, ALUGUEL_M * kP);
  const hR = Math.max(0.05, ROYAL_M * kP);
  const pilar = (x: number, h: number, cor: string, nome: string, cel: string) => (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.8, 1.6]} />
        <meshStandardMaterial map={granito} color="#8a8f96" roughness={0.5} />
      </mesh>
      <Letreiro pos={[0, 0.42, 0.81]} larg={1.85} alt={0.46} linhas={[nome]} fundo={cel} cor="#1d1b26" />
      <mesh position={[0, 0.8 + h / 2, 0]} castShadow>
        <boxGeometry args={[1.6, h, 1.1]} />
        <meshStandardMaterial map={texNotas(cor)} roughness={0.8} />
      </mesh>
      {/* cintas de papel a cada "bilhão" */}
      {Array.from({length: Math.floor(h)}).map((_, i) => (
        <Caixa key={i} pos={[0, 0.8 + i + 0.5, 0]} tam={[1.64, 0.06, 1.14]} cor="#f2e6c8" sombra={false} />
      ))}
      <Maco pos={[0, 0.8 + h, 0]} n={8} cor={cor} valor="US$" />
    </group>
  );
  return (
    <group>
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[80, 0.04, 80]} />
        <meshStandardMaterial map={piso} roughness={0.7} />
      </mesh>
      {[[-20, -26, 10, 30, 10, '#6a7f96'], [-6, -30, 12, 22, 10, '#b9a48a'], [8, -28, 10, 34, 10, '#8a96a8'], [22, -26, 12, 26, 10, '#c9b49a'], [-30, -12, 10, 18, 10, '#d8cbb5'], [30, -10, 10, 20, 10, '#aebccc']].map(([x, z, w, h, d, c], i) => (
        <Predio key={i} pos={[x as number, 0, z as number]} tam={[w as number, h as number, d as number]} cor={c as string} />
      ))}
      {pilar(-PX, hA, '#d9b23f', 'ALUGUEL', '#ffd23f')}
      {pilar(PX, hR, '#6fbf6a', 'ROYALTIES', '#4ade80')}
      {/* taxas iniciais: só 66 milhões (6,6 cm!), na frente, entre os dois */}
      <group position={[0, 0, 1.9]}>
        <Caixa pos={[0, 0.25, 0]} tam={[0.9, 0.5, 0.8]} cor="#8a8f96" />
        <Letreiro pos={[0, 0.26, 0.41]} larg={0.82} alt={0.24} linhas={['TAXAS']} fundo="#9fc3dc" cor="#1d1b26" />
        <Caixa pos={[0, 0.5 + TAXA_M / 2, 0]} tam={[0.6, TAXA_M, 0.5]} cor="#ffffff" map={texNotas('#9fc3dc')} />
      </group>
      {/* exposição: tapete com friso dourado, cordões laterais (fora das etiquetas) e um medalhão de US$ no piso */}
      <Caixa pos={[0, 0.005, 2.4]} tam={[7.4, 0.01, 5.0]} cor="#d9b23f" sombra={false} />
      <Caixa pos={[0, 0.008, 2.4]} tam={[7.1, 0.01, 4.7]} cor="#a8322b" sombra={false} />
      {[-3.2, 3.2].map((x) => (
        <group key={x}>
          {[2.4, 4.5].map((z) => (
            <group key={z} position={[x, 0, z]}>
              <Cil pos={[0, 0.03, 0]} r={0.16} h={0.06} cor="#d9b23f" />
              <Cil pos={[0, 0.5, 0]} r={0.035} h={1.0} cor="#d9b23f" />
              <mesh position={[0, 1.02, 0]}><sphereGeometry args={[0.06, 20, 14]} /><Mat cor="#d9b23f" /></mesh>
            </group>
          ))}
          <Barra a={[x, 0.95, 2.4]} b={[x, 0.95, 4.5]} r={0.025} cor="#8b2222" />
        </group>
      ))}
      {/* medalhão no piso, na frente do tapete */}
      <mesh position={[0, 0.012, 6.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.8, 40]} />
        <meshStandardMaterial map={texMedalhao()} roughness={0.5} metalness={0.2} />
      </mesh>
      {[-9, 9].map((x) => (<Poste key={x} pos={[x, 0, 3]} />))}
      {[[-12, -6], [12, -6], [-14, 6], [14, 6]].map(([x, z], i) => (<Arvore key={i} pos={[x, 0, z]} esc={1.5} cor="#4f9a4a" />))}
    </group>
  );
};

// ======================= MAPA-MÚNDI COM AS LOJAS =======================
type Poly = [number, number][];
const CONT: [Poly, string][] = [
  [[[-168, 65], [-140, 70], [-95, 72], [-80, 63], [-60, 55], [-52, 47], [-66, 44], [-75, 35], [-81, 25], [-97, 26], [-105, 20], [-87, 15], [-78, 8], [-92, 15], [-106, 23], [-117, 32], [-124, 40], [-125, 49], [-135, 57], [-150, 60], [-165, 60]], '#8fc06a'],
  [[[-55, 82], [-20, 82], [-20, 70], [-45, 60], [-55, 70]], '#e9eef2'],
  [[[-78, 8], [-60, 10], [-50, 0], [-35, -5], [-40, -22], [-48, -28], [-58, -38], [-65, -55], [-72, -50], [-72, -30], [-70, -18], [-81, -5], [-80, 2]], '#6fb05a'],
  [[[-10, 36], [-9, 43], [-2, 44], [-5, 48], [3, 51], [8, 54], [10, 58], [5, 62], [15, 69], [28, 71], [40, 68], [40, 55], [30, 46], [28, 41], [20, 40], [15, 38], [12, 44], [5, 43], [-2, 37]], '#c9d68a'],
  [[[-5, 50], [1, 51], [-1, 55], [-3, 58], [-6, 57], [-5, 54]], '#c9d68a'],
  [[[-17, 15], [-17, 21], [-10, 30], [-5, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [40, -2], [40, -15], [35, -25], [20, -35], [17, -29], [12, -17], [13, -5], [9, 4], [-8, 4], [-15, 10]], '#d9c27a'],
  [[[28, 41], [30, 46], [40, 55], [40, 68], [60, 70], [80, 73], [100, 77], [140, 72], [180, 68], [170, 60], [160, 55], [142, 50], [135, 43], [128, 38], [122, 30], [120, 22], [108, 20], [105, 10], [100, 2], [98, 10], [92, 20], [80, 8], [73, 18], [66, 25], [57, 25], [50, 30], [44, 28], [36, 34], [35, 37]], '#a8c870'],
  [[[35, 30], [44, 12], [52, 15], [58, 22], [56, 26], [48, 29]], '#e2c98a'],
  [[[114, -22], [122, -18], [131, -12], [137, -12], [142, -11], [146, -18], [153, -26], [150, -37], [140, -38], [132, -32], [115, -34]], '#e0b070'],
  [[[130, 31], [135, 34], [141, 36], [142, 41], [140, 45], [138, 38], [131, 34]], '#a8c870'],
  [[[95, 5], [105, -6], [115, -8], [120, -9], [125, -3], [118, 1], [110, 2], [100, 2]], '#8fc06a'],
  [[[172, -35], [178, -38], [172, -46], [167, -46]], '#8fc06a'],
];
const MW = 48, MH = 24; // metros
const lonX = (lon: number) => (lon / 180) * (MW / 2);
const latZ = (lat: number) => -((lat - 8) / 66) * (MH / 2);
const dentro = (lon: number, lat: number, poly: Poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const texMapa = () =>
  tex('mc-mapa', 2048, 1024, (g) => {
    g.fillStyle = '#3f8fc0';
    g.fillRect(0, 0, 2048, 1024);
    g.strokeStyle = 'rgba(255,255,255,0.12)';
    g.lineWidth = 2;
    for (let i = 0; i <= 24; i++) {
      g.beginPath();
      g.moveTo((i / 24) * 2048, 0);
      g.lineTo((i / 24) * 2048, 1024);
      g.stroke();
    }
    for (let i = 0; i <= 12; i++) {
      g.beginPath();
      g.moveTo(0, (i / 12) * 1024);
      g.lineTo(2048, (i / 12) * 1024);
      g.stroke();
    }
    const px = (lon: number) => ((lonX(lon) + MW / 2) / MW) * 2048;
    const py = (lat: number) => ((latZ(lat) + MH / 2) / MH) * 1024;
    CONT.forEach(([poly, cor]) => {
      g.fillStyle = cor;
      g.strokeStyle = 'rgba(29,27,38,0.45)';
      g.lineWidth = 4;
      g.beginPath();
      poly.forEach(([lo, la], i) => (i ? g.lineTo(px(lo), py(la)) : g.moveTo(px(lo), py(la))));
      g.closePath();
      g.fill();
      g.stroke();
    });
    // bordas de "países" (linhas finas) para não ficar um bloco liso
    g.strokeStyle = 'rgba(29,27,38,0.18)';
    g.lineWidth = 2;
    const r = rnd(21);
    for (let i = 0; i < 140; i++) {
      const lo = r() * 360 - 180, la = r() * 130 - 58;
      if (!CONT.some(([pl]) => dentro(lo, la, pl))) continue;
      g.beginPath();
      g.moveTo(px(lo), py(la));
      g.lineTo(px(lo + (r() - 0.5) * 16), py(la + (r() - 0.5) * 12));
      g.stroke();
    }
  });
// onde ficam as lojas (pesos aproximados por região: EUA, Europa, Ásia, América Latina, Oceania...)
const REGIOES: [number, number, number, number, number][] = [
  [-124, -70, 26, 48, 0.36], [-10, 30, 36, 58, 0.2], [100, 142, 20, 42, 0.18], [-100, -35, -35, 20, 0.08], [114, 154, -38, -15, 0.04], [-125, -60, 43, 55, 0.04], [35, 80, 10, 40, 0.07], [-10, 40, -35, 35, 0.03],
];
const N_LOJAS = 1600;
const LOJAS = (() => {
  const r = rnd(77);
  const out: [number, number][] = [];
  let tent = 0;
  while (out.length < N_LOJAS && tent < 200000) {
    tent++;
    let a = r();
    let reg = REGIOES[0];
    for (const rg of REGIOES) {
      if (a < rg[4]) { reg = rg; break; }
      a -= rg[4];
    }
    const lo = reg[0] + r() * (reg[1] - reg[0]);
    const la = reg[2] + r() * (reg[3] - reg[2]);
    if (CONT.some(([pl]) => dentro(lo, la, pl))) out.push([lonX(lo), latZ(la)]);
  }
  // embaralha para os pinos surgirem espalhados pelo mundo
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
})();
const Mapa: React.FC<{t: number; p: number}> = ({t, p}) => {
  const mapa = texMapa();
  const geoHaste = useMemo(() => new THREE.CylinderGeometry(0.025, 0.025, 0.5, 5).translate(0, 0.25, 0), []);
  const geoCabeca = useMemo(() => new THREE.SphereGeometry(0.11, 8, 6).translate(0, 0.55, 0), []);
  const n = Math.round(N_LOJAS * suave(clamp01(p)));
  const mats = useMemo(() => LOJAS.map(([x, z]) => new THREE.Matrix4().makeTranslation(x, 0.05, z)), []);
  const madeira = texMadeira('#5a3a20', [10, 1]);
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[90, 0.1, 70]} />
        <meshStandardMaterial map={texMadeira('#6b4a2f', [20, 16])} roughness={0.8} />
      </mesh>
      <Caixa pos={[0, 0.02, 0]} tam={[MW + 1.6, 0.06, MH + 1.6]} cor="#ffffff" map={madeira} />
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[MW, MH]} />
        <meshStandardMaterial map={mapa} roughness={0.8} />
      </mesh>
      <Instancias matrizes={mats} n={n} geo={geoHaste} cor="#2b2b30" sombra={false} />
      <Instancias matrizes={mats} n={n} geo={geoCabeca} cor="#e8452c" sombra={false} />
      {/* miniaturas de lojas em cidades grandes */}
      {[[-74, 40.7], [-118, 34], [-0.1, 51.5], [139.7, 35.7], [-46.6, -23.5], [116.4, 39.9], [2.3, 48.8], [151, -33.9]].map(([lo, la], i) => (
        <group key={i} position={[lonX(lo), 0.06, latZ(la)]} scale={0.1 * suave(clamp01(p * 3 - i * 0.2))}>
          <Caixa pos={[0, 1, 0]} tam={[4, 2, 3]} cor="#a4553a" />
          <Caixa pos={[0, 2.2, 0]} tam={[4.4, 0.4, 3.4]} cor="#c8322b" />
          <Caixa pos={[0, 1, 1.52]} tam={[3, 1.2, 0.05]} cor="#9fd0ea" />
        </group>
      ))}
      {/* salão: paredes de tijolo com painéis, para o fundo não ficar vazio */}
      <Caixa pos={[45, 8, 0]} tam={[0.6, 16, 70]} cor="#ffffff" map={texTijolo('#8a4a36', [14, 4])} />
      <Caixa pos={[0, 8, -35]} tam={[90, 16, 0.6]} cor="#ffffff" map={texTijolo('#8a4a36', [18, 4])} />
      {[-30, -10, 10, 30].map((z) => (<Caixa key={z} pos={[44.5, 14.5, z]} tam={[0.6, 0.4, 6]} cor="#f2a516" />))}
      <Ze pos={[lonX(-43), 0.06, latZ(-12)]} rotY={0.6} t={t} terno mic={false} acao="aponta" />
      {[[-30, -18], [30, -18], [-30, 18], [30, 18]].map(([x, z], i) => (
        <pointLight key={i} position={[x, 10, z]} intensity={40} distance={40} color="#fff0d0" />
      ))}
    </group>
  );
};

// ======================= registro =======================
const CEU_DIA: [string, string] = ['#6fbcf2', '#fdf0d8'];
const CEU_TARDE: [string, string] = ['#f08a4b', '#ffd9a0'];
const CEU_50: [string, string] = ['#7fc6f0', '#fbe8c4'];
const CEU_ESC: [string, string] = ['#3a2f2a', '#5a4a3e'];
const CEU_SALAO: [string, string] = ['#1d1a24', '#2b2433'];

export const SETS_MCD: Record<string, SetRico> = {
  mccidade: {
    ceu: CEU_DIA, luz: 'dia', nevoa: [70, 260],
    render: ({t, p}) => (<group><Cidade t={t} /><Restaurante t={t} /><Entorno t={t} drive={p} /></group>),
    cams: {
      drone: cam([-7, 8, 25], [5, 7, 25], [0, 0.6, 3], 44, [1, 0.6, 3]),
      // lateral do drive-thru: janela RETIRADA e a loja no centro, carro chegando na janela (sem tapar o salão)
      drive: cam([20.0, 2.3, 4.8], [19.1, 2.2, 3.9], [6.5, 2.9, -1.2], 46, [6.7, 2.9, -1.6]),
    },
  },
  mccozinha: {
    ceu: CEU_DIA, luz: 'dia', nevoa: [70, 260],
    render: ({t}) => (<group><Cidade t={t} /><Restaurante t={t} corte /><Entorno t={t} /></group>),
    cams: {
      // de frente para a chapa, por cima do balcão: hambúrgueres na chapa e o chapeiro atrás, de rosto inteiro
      chapa: cam([-1.8, 2.35, -1.65], [-2.05, 2.3, -1.8], [-2.6, 0.78, -4.0], 50, [-2.6, 0.8, -4.05]),
    },
  },
  mc48: {
    ceu: CEU_50, luz: 'dia', nevoa: [60, 240],
    render: ({t}) => (<group><Calif50 /><Lanchonete48 t={t} />
      <CarroPremio pos={[-8.5, 0, 4.5]} rotY={Math.PI / 2} cor="#5f8fb0" laco={false} />
      <CarroPremio pos={[9.5, 0, 6.5]} rotY={-Math.PI / 2} cor="#e9e6df" laco={false} />
      <CarroPremio pos={[-11, 0, 9]} rotY={Math.PI / 2} cor="#c94f4f" laco={false} /></group>),
    cams: {
      aberto: cam([-13, 6.5, 19], [-8, 5.0, 16], [0, 2.2, 1], 42, [0.5, 2.4, 0]),
      // de frente, montante do vidro entre os dois irmãos
      irmaos: cam([-1.95, 1.75, 8.2], [-1.75, 1.7, 7.6], [-1.95, 1.08, 2.0], 37),
    },
  },
  // close do lanche no balcão, de cima (sem os irmãos atrás, que cortavam no topo)
  mc48balcao: {
    ceu: CEU_50, luz: 'dia', nevoa: [60, 240],
    render: ({t}) => (<group><Calif50 /><Lanchonete48 t={t} dono={false} fila={false} equipe={false} />
      <Boneco pos={[-2.3, 0.16, 3.35]} rotY={Math.PI - 0.5} t={t} v={CLIENTES48[1]} esc={0.88} acao="aponta" /></group>),
    // de lado e baixo: lanche no balcão em primeiro plano, letreiro PEDIDOS, cardápio e a chapa ao fundo, um cliente pedindo
    cams: {balcao: cam([-0.555, 1.62, 4.35], [-0.555, 1.6, 4.25], [-0.555, 1.15, 2.78], 36)},
  },
  mc48linha: {
    ceu: CEU_50, luz: 'dia', nevoa: [60, 240],
    render: ({t}) => (<group><Calif50 /><Lanchonete48 t={t} corte fila={false} /></group>),
    // do lado do balcão, de frente para os cozinheiros
    cams: {linha: cam([0.6, 2.7, 6.2], [0.3, 2.6, 5.7], [0, 1.05, -1.0], 48)},
  },
  mcestrada: {
    ceu: CEU_50, luz: 'tarde', nevoa: [80, 320],
    render: ({t}) => <Estrada54 t={t} />,
    cams: {
      carro: cam([2.6, 1.7, 7.0], [3.3, 1.6, 6.0], [4.8, 0.65, 0.2], 42),
      // close frontal e baixo do Multi-Mixer (sem o carro; o Kroc só entra com a mão)
      mixer: cam([4.68, 0.9, 2.85], [4.62, 0.9, 2.7], [4.25, 0.93, 0.4], 48),
    },
  },
  mcesc54: {
    ceu: CEU_ESC, luz: 'interior',
    render: ({t, p}) => <Escritorio t={t} p={p} modo="kroc54" />,
    cams: {contrato: cam([1.0, 3.2, 7.4], [0.4, 2.8, 6.4], [0.2, 0.6, 0], 42, [0.25, 0.55, 0.1])},
  },
  mccontas: {
    ceu: CEU_ESC, luz: 'interior',
    render: ({t, p}) => <Escritorio t={t} p={p} modo="contas" />,
    cams: {
      mesa: orbita([-0.5, 0.95, -0.4], -6, 12, 6.0, 5.4, 44, 8),
      livro: cam([-0.08, 2.35, 1.12], [-0.09, 2.28, 1.05], [-0.06, 0.78, 0.08], 56),
    },
  },
  // a caixa vazia de perto (sem o livro e as moedas; contas vencidas ao lado)
  mccofre: {
    ceu: CEU_ESC, luz: 'interior',
    render: ({t, p}) => <Escritorio t={t} p={p} modo="cofre" />,
    cams: {cofre: cam([0.02, 1.62, 1.05], [-0.02, 1.58, 0.96], [-0.07, 0.78, -0.22], 48)},
  },
  mcsonneborn: {
    ceu: CEU_ESC, luz: 'interior',
    render: ({t, p}) => <Escritorio t={t} p={p} modo="sonneborn" />,
    cams: {mesa: cam([-0.6, 2.2, 6.8], [0.2, 2.0, 5.9], [0.1, 1.0, 0], 42, [0.05, 0.95, 0.05])},
  },
  mcfranqueado: {
    ceu: CEU_DIA, luz: 'interior',
    render: ({t, p}) => <Escritorio t={t} p={p} modo="franqueado" />,
    cams: {assina: cam([2.2, 2.2, 5.8], [1.0, 2.0, 4.9], [0, 1.05, 0], 42, [0.05, 1.0, 0.1])},
  },
  mcfranquias: {
    ceu: CEU_50, luz: 'dia', nevoa: [60, 240],
    render: ({t}) => <Franquias t={t} />,
    cams: {
      rua: cam([-26, 7, 22], [-18, 6, 22], [-2, 2, 0], 44, [4, 2, 0]),
      caixa: orbita([-14.3, 0.6, 2.7], 38, 6, 8.2, 7.6, 40, 10),
    },
  },
  mclote: {
    ceu: CEU_DIA, luz: 'dia', nevoa: [70, 260],
    render: ({t, p}) => <Terreno t={t} p={p} modo="lote" />,
    cams: {placa: cam([-4.6, 2.4, 17.4], [-4.5, 2.3, 17.0], [-4.45, 0.8, 9.0], 54)},
  },
  mcobra: {
    ceu: CEU_DIA, luz: 'dia', nevoa: [70, 260],
    render: ({t, p}) => <Terreno t={t} p={p} modo="obra" />,
    cams: {sobe: cam([20, 9, 28], [14, 7.5, 26], [1, -1.0, 4], 42, [0, -0.6, 4])},
  },
  mcdono: {
    ceu: CEU_DIA, luz: 'dia', nevoa: [80, 300],
    render: ({t}) => <Terreno t={t} p={1} modo="dono" />,
    cams: {
      placa: cam([12.0, 1.6, 17.6], [12.2, 1.55, 17.0], [12.4, 0.95, 9.0], 54),
      geral: cam([-28, 30, 40], [-20, 34, 34], [0, 0, 2], 42, [0, 0, 2]),
    },
  },
  mcfluxo: {
    ceu: CEU_DIA, luz: 'dia', nevoa: [80, 300],
    render: ({t, p}) => <Fluxo t={t} p={p} />,
    cams: {
      taxa: cam([-4.4, 1.6, -4.4], [-0.2, 1.55, -4.3], [0.5, 1.2, -3.2], 46, [6.0, 1.2, -2.2]),
      royalties: cam([-4.2, 2.1, 1.85], [-3.4, 2.05, 1.7], [6, 0.85, 0.35], 48),
      aluguel: cam([6.6, 2.3, 5.6], [5.6, 2.2, 5.3], [-8, 0.4, 3.6], 46),
    },
  },
  mcpilares: {
    ceu: CEU_TARDE, luz: 'tarde', nevoa: [60, 200],
    render: ({t, p}) => <Pilares t={t} p={p} />,
    cams: {
      geral: cam([-0.5, 2.2, 13.4], [0, 2.25, 12.7], [0, 0.95, 0], 43),
      aluguel: cam([-6.95, 1.4, 12], [-6.45, 2.0, 11], [-1.45, 2.0, 0], 46, [-0.95, 6.5, 0]),
      royalties: cam([3.3, 2.4, 22.5], [2.0, 2.8, 21.5], [0.1, 6.3, 0], 42, [0.1, 6.4, 0]),
    },
  },
  mcmapa: {
    ceu: CEU_SALAO, luz: 'interior',
    render: ({t, p}) => <Mapa t={t} p={p} />,
    cams: {
      cima: cam([-38, 20, 4], [-34, 17, 1], [2, 0, 0], 46, [6, 0, 0]),
      globo: cam([-6, 3.2, 6], [10, 3.2, 4], [4, 0.3, -6], 46, [18, 0.3, -6]),
    },
  },
  mcfinal: {
    ceu: CEU_TARDE, luz: 'tarde', nevoa: [70, 260],
    render: ({t, p}) => <Terreno t={t} p={p} modo="final" />,
    cams: {
      lanche: cam([-3.3, 4.9, 18.4], [-3.6, 4.7, 17.8], [-5.4, 0.0, 10.3], 52, [-5.5, 0.05, 10.1]),
      // a loja suspensa em cima do próprio lote: chão de ouro e moedas embaixo, faixa com a seta
      chao: cam([1.2, 6.0, 27.5], [0.4, 5.6, 26.0], [0, 0.6, -1.0], 44),
    },
  },
  mcze: {
    ceu: CEU_TARDE, luz: 'tarde', nevoa: [70, 260],
    render: ({t}) => <Terreno t={t} p={1} modo="ze" />,
    cams: {pergunta: cam([0.2, 1.05, 17.9], [0.1, 1.0, 17.6], [0, 0.5, 12.5], 50)},
  },
};
void CEU_ESC;
