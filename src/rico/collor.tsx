// CENÁRIOS do PILOTO do "Seu Tostão": "O dia em que o Plano Collor confiscou a poupança" (março de 1990).
// Regras: fiel a 1990 (agência com guichê de vidro e autenticadora, caixa eletrônico bege de tela verde, TV de tubo, telefone de disco,
// calendário de março de 1990, Fusca na rua, orelhão), cédulas GENÉRICAS (nenhuma cédula real reproduzida), nenhuma marca real,
// nenhuma superfície grande de uma cor só, 3+ elementos reconhecíveis por quadro. 1 unidade = 1 m. Sets com prefixo "co",
// registrados em src/rico/sets.tsx. O narrador é o personagem fixo (src/rico/tostao.tsx: SeuTostao + Juros).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Cam} from '../v4/sets';
import {Arvore, Betoneira, Carrinho as CarrinhoMao, Instancias, MonteTerra, PilhaBlocos, SacosCimento, Visual} from '../v4/kit';
import {
  Barra, Boneco, Cadeado, Caixa, Cil, CarroPremio, Letreiro, Maco, Moeda, Nota, PilhaMoedas, Poste, Relogio, Sentado, Sofa, TVTubo, clamp01, lerp, linha, rnd, suave, tex,
} from './pecas';
import {Juros, Poleiro, SeuTostao} from './tostao';
import type {Expressao} from '../estilo/ze';
import type {SetRico} from './sets';

const cam = (de: V3, para: V3, alvo: V3, fov = 40, alvoPara?: V3): Cam => ({de, para, alvo, fov, alvoPara});
const orbita = (alvo: V3, az: number, el: number, d0: number, d1: number, fov = 40, giro = 8): Cam => {
  const pt = (a: number, d: number): V3 => {
    const r = (Math.PI / 180) * a, e = (Math.PI / 180) * el;
    return [alvo[0] + Math.sin(r) * Math.cos(e) * d, alvo[1] + Math.sin(e) * d, alvo[2] + Math.cos(r) * Math.cos(e) * d];
  };
  return {de: pt(az, d0), para: pt(az + giro, d1), alvo, fov};
};

// ======================= paleta e figurantes de 1990 =======================
const NCZ = '#c9b98a'; // cédula genérica de cruzado novo (bege-esverdeada)
const NCZ2 = '#a9c0d0'; // outra cédula genérica (azulada)
const CR = '#d8a7a0'; // cédula genérica de cruzeiro (rosada)
const REAL = '#9fd0a8'; // "real de hoje" no comparativo
const ROUPAS_90 = ['#e05a5a', '#3f7fc4', '#f0c64a', '#5aa06a', '#f4f0e6', '#9a5ab0', '#ef8a3a', '#3fb0b0', '#e86d9a', '#6a6f80', '#2f4f8a', '#c9a27a'];
const CALCAS_90 = ['#2f4f7a', '#3a3a44', '#6b5a48', '#30406b', '#4a4f66', '#7a6a58'];
const PELES = ['#ffd2ad', '#e7b48c', '#c98e62', '#8d5a3b', '#f2c9a4'];
const CABELOS = ['#2b1d14', '#5a4030', '#1d1b26', '#8a6a40', '#c8c8c8', '#3b2a20'];
const povo = (i: number): Visual => {
  const r = rnd(i * 13 + 5);
  const v: Visual = {
    camisa: ROUPAS_90[Math.floor(r() * ROUPAS_90.length)], calca: CALCAS_90[Math.floor(r() * CALCAS_90.length)], colete: null, capacete: null,
    pele: PELES[Math.floor(r() * PELES.length)], cabelo: CABELOS[Math.floor(r() * CABELOS.length)],
  };
  const k = r();
  if (k < 0.3) v.cabeloTipo = 'longo';
  else if (k < 0.4) v.cabeloTipo = 'coque';
  if (r() < 0.18) v.oculos = 'grau';
  if (r() < 0.12) v.vovo = true;
  return v;
};
const BANCARIA: Visual = {camisa: '#f2efe8', calca: '#2f3a55', colete: null, capacete: null, pele: '#e7b48c', cabelo: '#3b2a20', cabeloTipo: 'coque', gravata: '#2f5d8a'};
const PAI: Visual = {camisa: '#6f9fd0', calca: '#4a3e32', colete: null, capacete: null, pele: '#c98e62', cabelo: '#2b1d14'};
const FILHO: Visual = {camisa: '#f0c64a', calca: '#30406b', colete: null, capacete: null, pele: '#c98e62', cabelo: '#2b1d14'};
const REMARCADOR: Visual = {camisa: '#d94a3a', calca: '#2f3a55', colete: null, capacete: null, pele: '#f2c9a4', cabelo: '#5a4030', bone: '#d94a3a'};
const PADEIRO: Visual = {camisa: '#ffffff', calca: '#ffffff', colete: null, capacete: null, pele: '#e7b48c', cabelo: '#1d1b26', chef: true};

// ======================= texturas =======================
const varia = (hex: string, k: number) => {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, k);
  return '#' + c.getHexString();
};
// ladrilho hidráulico (varanda): flor de 4 pétalas em quadrado bege e vinho
const texLadrilho = (rep: [number, number]) =>
  tex('co-ladrilho', 128, 128, (g) => {
    g.fillStyle = '#e9dcc0';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#9a3a2f';
    for (const [x, y] of [[0, 0], [128, 0], [0, 128], [128, 128]]) {
      g.beginPath();
      g.arc(x, y, 34, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#2f6a5a';
    for (let a = 0; a < 4; a++) {
      g.beginPath();
      g.ellipse(64 + Math.cos((a * Math.PI) / 2) * 20, 64 + Math.sin((a * Math.PI) / 2) * 20, 14, 8, (a * Math.PI) / 2, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#c9a24a';
    g.beginPath();
    g.arc(64, 64, 8, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.18)';
    g.lineWidth = 2;
    g.strokeRect(0, 0, 128, 128);
  }, rep);
// azulejo 15x15 (barra da parede)
const texAzulejo = (cor: string, rep: [number, number]) =>
  tex('co-azulejo:' + cor, 128, 128, (g) => {
    g.fillStyle = '#f4f1ea';
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++) {
        g.fillStyle = varia(cor, ((i + j) % 2) * 0.05);
        g.fillRect(i * 64 + 3, j * 64 + 3, 58, 58);
        g.fillStyle = 'rgba(255,255,255,0.55)';
        g.beginPath();
        g.arc(i * 64 + 32, j * 64 + 32, 12, 0, Math.PI * 2);
        g.fill();
      }
  }, rep);
// parede pintada com textura de reboco
const texReboco = (cor: string, rep: [number, number]) =>
  tex('co-reboco:' + cor, 128, 128, (g) => {
    g.fillStyle = cor;
    g.fillRect(0, 0, 128, 128);
    const r = rnd(11);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      g.fillRect(r() * 128, r() * 128, 2, 2);
    }
  }, rep);
// granito (piso da agência)
const texGranito = (rep: [number, number]) =>
  tex('co-granito', 256, 256, (g) => {
    g.fillStyle = '#b9b2a6';
    g.fillRect(0, 0, 256, 256);
    const r = rnd(5);
    for (let i = 0; i < 2600; i++) {
      const k = r();
      g.fillStyle = k < 0.33 ? 'rgba(40,36,34,0.5)' : k < 0.66 ? 'rgba(255,255,255,0.45)' : 'rgba(150,110,90,0.4)';
      g.fillRect(r() * 256, r() * 256, 2 + r() * 2, 2 + r() * 2);
    }
    g.strokeStyle = 'rgba(0,0,0,0.2)';
    g.lineWidth = 2;
    g.strokeRect(0, 0, 256, 256);
  }, rep);
// taco de madeira (sala)
const texTaco = (rep: [number, number]) =>
  tex('co-taco', 128, 128, (g) => {
    const r = rnd(9);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        g.fillStyle = varia('#a0703f', (r() - 0.5) * 0.1);
        if ((i + j) % 2) g.fillRect(i * 32, j * 32, 32, 32);
        else g.fillRect(i * 32, j * 32, 32, 32);
        g.strokeStyle = 'rgba(0,0,0,0.25)';
        g.lineWidth = 1;
        for (let k = 0; k < 4; k++) {
          if ((i + j) % 2) g.strokeRect(i * 32 + k * 8, j * 32, 8, 32);
          else g.strokeRect(i * 32, j * 32 + k * 8, 32, 8);
        }
      }
  }, rep);
// papel de parede listrado com florzinha (sala dos anos 80)
const texPapel = (rep: [number, number]) =>
  tex('co-papel', 128, 128, (g) => {
    g.fillStyle = '#efe0b8';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#e2cc98';
    g.fillRect(0, 0, 32, 128);
    g.fillRect(64, 0, 32, 128);
    g.fillStyle = '#c0704a';
    for (const [x, y] of [[48, 30], [112, 94], [16, 70], [80, 6]]) {
      g.beginPath();
      g.arc(x, y, 5, 0, Math.PI * 2);
      g.fill();
    }
  }, rep);
// madeira (balcão, móveis)
const texMadeira = (cor: string, rep: [number, number]) =>
  tex('co-madeira:' + cor, 128, 128, (g) => {
    g.fillStyle = cor;
    g.fillRect(0, 0, 128, 128);
    const r = rnd(3);
    for (let i = 0; i < 30; i++) {
      g.strokeStyle = r() > 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)';
      g.lineWidth = 1 + r() * 2;
      const y = r() * 128;
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(40, y + 6 * (r() - 0.5), 90, y + 6 * (r() - 0.5), 128, y);
      g.stroke();
    }
  }, rep);
// chapa de aço com rebites (sala-forte), mais clara para não virar parede preta
const texAco = (rep: [number, number]) =>
  tex('co-aco2', 128, 128, (g) => {
    g.fillStyle = '#7d8894';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(0,0,0,0.3)';
    g.lineWidth = 2;
    g.strokeRect(1, 1, 126, 126);
    g.fillStyle = '#b0bac4';
    for (const [x, y] of [[8, 8], [120, 8], [8, 120], [120, 120], [64, 8], [64, 120]]) {
      g.beginPath();
      g.arc(x, y, 3, 0, Math.PI * 2);
      g.fill();
    }
  }, rep);
// asfalto e calçada
const texAsfalto = (rep: [number, number]) =>
  tex('co-asfalto', 256, 256, (g) => {
    g.fillStyle = '#4a4b50';
    g.fillRect(0, 0, 256, 256);
    const r = rnd(3);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.12)';
      g.fillRect(r() * 256, r() * 256, 2, 2);
    }
  }, rep);
const texPortuguesa = (rep: [number, number]) =>
  tex('co-portuguesa', 256, 256, (g) => {
    g.fillStyle = '#ece6da';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#2b2b30';
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.moveTo(0, 32 + i * 64);
      for (let x = 0; x <= 256; x += 8) g.lineTo(x, 32 + i * 64 + Math.sin((x / 256) * Math.PI * 2) * 20);
      g.lineTo(256, 44 + i * 64);
      for (let x = 256; x >= 0; x -= 8) g.lineTo(x, 44 + i * 64 + Math.sin((x / 256) * Math.PI * 2) * 20);
      g.fill();
    }
    const r = rnd(4);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = 'rgba(0,0,0,0.08)';
      g.fillRect(r() * 256, r() * 256, 3, 3);
    }
  }, rep);

// calendário de folhinha: MARÇO 1990 (1º de março de 1990 = quinta-feira). Dias riscados (feriado bancário) e um dia circulado.
const texCalendario = (mes: string, ano: string, inicio: number, dias: number, riscados: number[], circulo?: number) =>
  tex(`co-cal:${mes}${ano}${riscados.join(',')}:${circulo}`, 256, 320, (g) => {
    g.fillStyle = '#fbf7ec';
    g.fillRect(0, 0, 256, 320);
    g.fillStyle = '#c62f2f';
    g.fillRect(0, 0, 256, 70);
    linha(g, mes, 128, 28, 230, 34, '#ffffff');
    linha(g, ano, 128, 56, 230, 22, '#ffe7a0');
    const sem = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    sem.forEach((s, i) => linha(g, s, 22 + i * 35, 88, 30, 18, i === 0 ? '#c62f2f' : '#4a4f5a'));
    for (let d = 1; d <= dias; d++) {
      const k = inicio + d - 1;
      const x = 22 + (k % 7) * 35, y = 118 + Math.floor(k / 7) * 38;
      linha(g, String(d), x, y, 30, 22, k % 7 === 0 ? '#c62f2f' : '#1d1b26');
      if (riscados.includes(d)) {
        g.strokeStyle = '#c62f2f';
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(x - 13, y - 13);
        g.lineTo(x + 13, y + 13);
        g.moveTo(x + 13, y - 13);
        g.lineTo(x - 13, y + 13);
        g.stroke();
      }
      if (circulo === d) {
        g.strokeStyle = '#1f5fbf';
        g.lineWidth = 4;
        g.beginPath();
        g.arc(x, y, 17, 0, Math.PI * 2);
        g.stroke();
      }
    }
  });
const Calendario: React.FC<{pos: V3; rotY?: number; esc?: number; mapa: THREE.Texture}> = ({pos, rotY = 0, esc = 1, mapa}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={esc}>
    <Caixa pos={[0, 0, -0.006]} tam={[0.42, 0.56, 0.01]} cor="#7a4a2a" />
    <mesh position={[0, -0.02, 0.001]}>
      <planeGeometry args={[0.38, 0.475]} />
      <meshStandardMaterial map={mapa} roughness={0.9} />
    </mesh>
    <Cil pos={[0, 0.27, 0.01]} rot={[Math.PI / 2, 0, 0]} r={0.012} h={0.02} cor="#9aa0aa" />
  </group>
);

// tela da TV: plantão do jornal com a ministra (figura genérica, sem rosto real) e a tarja do anúncio
const texTelaTV = () =>
  tex('co-tv-plano', 256, 200, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 200);
    gr.addColorStop(0, '#1f3f8a');
    gr.addColorStop(1, '#0f2350');
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 200);
    // mesa e figura (silhueta lisa)
    g.fillStyle = '#5a3a2a';
    g.fillRect(40, 130, 176, 30);
    g.fillStyle = '#3a3a4a';
    g.beginPath();
    g.ellipse(128, 128, 38, 30, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = '#e7b48c';
    g.beginPath();
    g.arc(128, 78, 20, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2b1d14';
    g.beginPath();
    g.arc(128, 72, 22, Math.PI, 0);
    g.fill();
    g.fillRect(106, 70, 8, 22);
    g.fillRect(142, 70, 8, 22);
    // microfones
    g.fillStyle = '#1d1b26';
    for (const x of [110, 128, 146]) g.fillRect(x - 2, 112, 4, 18);
    // tarja
    g.fillStyle = '#ffd23f';
    g.fillRect(0, 158, 256, 24);
    linha(g, 'PLANO ECONÔMICO', 128, 170, 240, 20, '#1d1b26');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 182, 256, 18);
    linha(g, 'SAQUE LIMITADO A NCz$ 50 MIL', 128, 191, 240, 14, '#c62f2f');
    // linhas de varredura do tubo
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < 200; y += 3) g.fillRect(0, y, 256, 1);
  });
// tela verde do caixa eletrônico antigo
const texTelaATM = () =>
  tex('co-atm', 128, 96, (g) => {
    g.fillStyle = '#0d2a14';
    g.fillRect(0, 0, 128, 96);
    linha(g, 'FORA DE', 64, 30, 120, 18, '#5dff8a', 700);
    linha(g, 'OPERAÇÃO', 64, 54, 120, 18, '#5dff8a', 700);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    for (let y = 0; y < 96; y += 3) g.fillRect(0, y, 128, 1);
  });
// etiqueta de preço da remarcação: "NCz$" e barras (sem preço inventado)
const texEtiqueta = (cor: string) =>
  tex('co-etq:' + cor, 96, 48, (g) => {
    g.fillStyle = cor;
    g.fillRect(0, 0, 96, 48);
    g.strokeStyle = 'rgba(0,0,0,0.3)';
    g.lineWidth = 2;
    g.strokeRect(1, 1, 94, 46);
    linha(g, 'NCz$', 26, 24, 40, 18, '#1d1b26');
    g.fillStyle = '#1d1b26';
    for (let i = 0; i < 3; i++) g.fillRect(52 + i * 13, 14, 9, 20);
  });
// caderneta de poupança aberta (páginas com carimbos e linhas)
const texCaderneta = () =>
  tex('co-caderneta', 256, 160, (g) => {
    g.fillStyle = '#f7f2e2';
    g.fillRect(0, 0, 256, 160);
    g.fillStyle = '#d9cfb0';
    g.fillRect(126, 0, 4, 160);
    g.strokeStyle = 'rgba(40,60,120,0.35)';
    g.lineWidth = 1;
    for (let y = 22; y < 160; y += 14) {
      g.beginPath();
      g.moveTo(8, y);
      g.lineTo(120, y);
      g.moveTo(136, y);
      g.lineTo(248, y);
      g.stroke();
    }
    g.fillStyle = '#2f4f8a';
    for (let y = 26; y < 140; y += 14) {
      g.fillRect(12, y - 8, 30 + ((y * 7) % 30), 3);
      g.fillRect(140, y - 8, 20 + ((y * 5) % 40), 3);
    }
    g.save();
    g.translate(190, 110);
    g.rotate(-0.25);
    g.strokeStyle = '#c62f2f';
    g.lineWidth = 3;
    g.strokeRect(-46, -16, 92, 32);
    linha(g, 'BLOQUEADO', 0, 0, 84, 18, '#c62f2f');
    g.restore();
    linha(g, 'POUPANÇA', 64, 10, 110, 12, '#2f4f8a');
  });
// placa de preço da padaria (número grande)
const texPlaca = (txt: string, fundo: string, cor: string) =>
  tex('co-placa:' + txt + fundo, 128, 80, (g) => {
    g.fillStyle = fundo;
    g.fillRect(0, 0, 128, 80);
    g.strokeStyle = 'rgba(0,0,0,0.35)';
    g.lineWidth = 4;
    g.strokeRect(2, 2, 124, 76);
    linha(g, txt, 64, 42, 116, 52, cor);
  });
const Placa: React.FC<{pos: V3; rotY?: number; larg: number; alt: number; txt: string; fundo?: string; cor?: string}> = ({pos, rotY = 0, larg, alt, txt, fundo = '#fbf7ec', cor = '#1d1b26'}) => (
  <mesh position={pos} rotation={[0, rotY, 0]}>
    <planeGeometry args={[larg, alt]} />
    <meshStandardMaterial map={texPlaca(txt, fundo, cor)} roughness={0.8} side={2} />
  </mesh>
);

// ======================= peças de 1990 =======================
// cadeira de balanço de palhinha
const CadeiraBalanco: React.FC<{pos: V3; rotY?: number; t?: number}> = ({pos, rotY = 0, t = 0}) => {
  const bal = Math.sin(t * 1.6) * 0.06;
  return (
    <group position={pos} rotation={[bal, rotY, 0]}>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.25, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.6, 0.02, 6, 24, 0.9]} />
            <meshStandardMaterial color="#6b3e26" roughness={0.6} />
          </mesh>
          <Barra a={[s * 0.25, 0.1, 0.25]} b={[s * 0.25, 0.45, 0.22]} r={0.02} cor="#7a4a2a" />
          <Barra a={[s * 0.25, 0.1, -0.2]} b={[s * 0.25, 1.05, -0.32]} r={0.022} cor="#7a4a2a" />
          <Barra a={[s * 0.25, 0.45, 0.22]} b={[s * 0.25, 0.62, -0.05]} r={0.018} cor="#7a4a2a" />
        </group>
      ))}
      <Caixa pos={[0, 0.45, 0.0]} tam={[0.5, 0.04, 0.46]} cor="#d9b878" />
      <Caixa pos={[0, 0.78, -0.27]} rot={[-0.15, 0, 0]} tam={[0.48, 0.5, 0.03]} cor="#d9b878" />
      {[0.55, 0.7, 0.85, 1.0].map((y) => (<Barra key={y} a={[-0.24, y, -0.25 - (y - 0.55) * 0.12]} b={[0.24, y, -0.25 - (y - 0.55) * 0.12]} r={0.006} cor="#b8955a" sombra={false} />))}
    </group>
  );
};
// rádio de válvula de madeira
const Radio: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.12, 0]} tam={[0.36, 0.24, 0.18]} cor="#7a4a2a" />
    <Caixa pos={[-0.06, 0.13, 0.091]} tam={[0.18, 0.15, 0.005]} cor="#d9c8a0" />
    {[-0.12, -0.08, -0.04, 0, 0.0].map((x, i) => (<Caixa key={i} pos={[x - 0.02, 0.13, 0.095]} tam={[0.004, 0.13, 0.004]} cor="#7a4a2a" sombra={false} />))}
    {[0.1, 0.15].map((x) => (<Cil key={x} pos={[x, 0.09, 0.095]} rot={[Math.PI / 2, 0, 0]} r={0.018} h={0.02} cor="#e9e0c8" />))}
  </group>
);
// samambaia no xaxim (pendurada ou no chão)
const Samambaia: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <group position={pos} scale={esc}>
    <Cil pos={[0, 0.12, 0]} r={0.16} r2={0.12} h={0.24} cor="#6b3e26" />
    {Array.from({length: 11}).map((_, i) => {
      const a = (i / 11) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.16, 0.26, Math.sin(a) * 0.16]} rotation={[Math.sin(a) * 0.9, -a, Math.cos(a) * 0.9]} castShadow>
          <coneGeometry args={[0.06, 0.5, 4]} />
          <meshStandardMaterial color={i % 2 ? '#3f8f4a' : '#4fa85a'} roughness={0.8} />
        </mesh>
      );
    })}
    <mesh position={[0, 0.3, 0]}><sphereGeometry args={[0.15, 10, 8]} /><meshStandardMaterial color="#3f8f4a" /></mesh>
  </group>
);
// Fusca genérico de 1990 (carroceria arredondada)
const Fusca: React.FC<{pos: V3; rotY?: number; cor?: string}> = ({pos, rotY = 0, cor = '#e9d8a6'}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.62, 0]} scale={[1.95, 0.75, 0.8]} castShadow>
      <sphereGeometry args={[1, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={cor} roughness={0.45} />
    </mesh>
    <Caixa pos={[0, 0.48, 0]} tam={[3.9, 0.3, 1.55]} cor={cor} />
    <mesh position={[-0.1, 1.0, 0]} scale={[0.95, 0.42, 0.68]}>
      <sphereGeometry args={[1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#9fc7e0" roughness={0.15} metalness={0.2} />
    </mesh>
    {[[-1.25, 1], [1.25, 1], [-1.25, -1], [1.25, -1]].map(([x, s], i) => (
      <group key={i}>
        <Cil pos={[x, 0.32, s * 0.72]} rot={[Math.PI / 2, 0, 0]} r={0.32} h={0.2} cor="#1d1b26" />
        <Cil pos={[x, 0.32, s * 0.83]} rot={[Math.PI / 2, 0, 0]} r={0.16} h={0.02} cor="#d9d9d9" />
      </group>
    ))}
    {[-1, 1].map((s) => (<Cil key={s} pos={[1.85, 0.62, s * 0.5]} rot={[0, 0, Math.PI / 2]} r={0.1} h={0.08} cor="#fff7d0" />))}
    <Caixa pos={[1.98, 0.4, 0]} tam={[0.06, 0.08, 1.5]} cor="#c9c9c9" />
    <Caixa pos={[-1.98, 0.4, 0]} tam={[0.06, 0.08, 1.5]} cor="#c9c9c9" />
  </group>
);
// orelhão (telefone público de concha)
const Orelhao: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Cil pos={[0, 1.1, -0.3]} r={0.05} h={2.2} cor="#8a8f9a" />
    <mesh position={[0, 1.75, 0]} scale={[0.55, 0.7, 0.55]} castShadow>
      <sphereGeometry args={[1, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
      <meshStandardMaterial color="#f08a2a" roughness={0.5} side={2} />
    </mesh>
    <Caixa pos={[0, 1.45, -0.25]} tam={[0.22, 0.32, 0.12]} cor="#3a3f4a" />
    <Caixa pos={[0, 1.55, -0.18]} tam={[0.06, 0.18, 0.04]} cor="#1d1b26" />
  </group>
);
// prédio baixo dos anos 70/80 (pastilha, janelas com basculante, loja embaixo)
const Predio80: React.FC<{pos: V3; tam: V3; cor: string; rotY?: number; loja?: string; toldo?: string; seed?: number}> = ({pos, tam, cor, rotY = 0, loja, toldo = '#2f6a5a', seed = 1}) => {
  const [w, h, d] = tam;
  const andares = Math.max(1, Math.floor((h - 3.4) / 2.9));
  const cols = Math.max(1, Math.floor(w / 2.2));
  const r = rnd(seed);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Caixa pos={[0, h / 2, 0]} tam={[w, h, d]} cor={cor} map={texAzulejo(cor, [w / 1.2, h / 1.2])} />
      <Caixa pos={[0, 1.6, d / 2 + 0.02]} tam={[w - 0.4, 2.6, 0.05]} cor="#2b3a48" />
      {loja && <Letreiro pos={[0, 3.25, d / 2 + 0.06]} larg={Math.min(w - 0.6, 6)} alt={0.6} linhas={[loja]} fundo="#fbf7ec" cor="#1d1b26" />}
      <Caixa pos={[0, 2.95, d / 2 + 0.5]} rot={[0.35, 0, 0]} tam={[w - 0.2, 0.06, 1.0]} cor={toldo} />
      {Array.from({length: andares}).map((_, a) =>
        Array.from({length: cols}).map((__, c) => (
          <group key={a + ':' + c} position={[-w / 2 + (c + 0.5) * (w / cols), 4.6 + a * 2.9, d / 2 + 0.02]}>
            <Caixa pos={[0, 0, 0]} tam={[1.3, 1.2, 0.05]} cor={r() > 0.3 ? '#9fb8c8' : '#e9d8a6'} />
            <Caixa pos={[0, -0.66, 0.06]} tam={[1.5, 0.08, 0.14]} cor="#e9e4d8" />
            <Caixa pos={[0, 0, 0.03]} tam={[0.04, 1.2, 0.02]} cor="#e9e4d8" />
          </group>
        )),
      )}
      <Caixa pos={[0, h + 0.1, 0]} tam={[w + 0.1, 0.2, d + 0.1]} cor="#d9d0c2" />
    </group>
  );
};

// fila de pessoas ao longo de um caminho (lista de pontos), uma a cada "passo" metros
const Fila: React.FC<{pts: V3[]; passo?: number; t: number; seed?: number; simples?: boolean; max?: number}> = ({pts, passo = 0.62, t, seed = 1, simples, max = 200}) => {
  const lista = useMemo(() => {
    const out: {p: V3; ry: number}[] = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1];
      const L = Math.hypot(b[0] - a[0], b[2] - a[2]);
      const ry = Math.atan2(a[0] - b[0], a[2] - b[2]);
      for (let s = i === 0 ? 0 : passo * 0.5; s < L; s += passo) {
        const k = s / L;
        out.push({p: [a[0] + (b[0] - a[0]) * k, a[1], a[2] + (b[2] - a[2]) * k], ry: ry + Math.PI});
      }
    }
    return out.slice(0, max);
  }, [pts, passo, max]);
  return (
    <group>
      {lista.map((q, i) => (
        <Boneco key={i} pos={[q.p[0] + Math.sin(i * 2.3) * 0.08, q.p[1], q.p[2] + Math.cos(i * 1.7) * 0.06]} rotY={q.ry + Math.sin(i) * 0.25} t={t + i * 0.37} v={povo(i + seed * 100)}
          esc={0.86 + ((i * 7) % 5) * 0.02} acao={i % 9 === 4 ? 'fala' : 'parado'} expressao={i % 4 === 0 ? 'bravo' : i % 4 === 1 ? 'triste' : i % 4 === 2 ? 'medo' : 'serio'} simples={simples} />
      ))}
    </group>
  );
};

// pedestal com fita (organizador de fila)
const Pedestal: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Cil pos={[0, 0.02, 0]} r={0.16} h={0.04} cor="#c9a24a" />
    <Cil pos={[0, 0.5, 0]} r={0.025} h={0.96} cor="#c9a24a" />
    <Cil pos={[0, 0.99, 0]} r={0.04} h={0.04} cor="#c9a24a" />
  </group>
);

// ======================= 1. VARANDA DO SEU TOSTÃO (hoje) =======================
type ModoVaranda = 'abre' | 'bravo' | 'juros' | 'aponta' | 'licao' | 'pergunta' | 'fecho';
const Varanda: React.FC<{t: number; p: number; modo: ModoVaranda}> = ({t, p, modo}) => {
  const expr: Record<ModoVaranda, Expressao> = {abre: 'normal', bravo: 'bravo', juros: 'espanto', aponta: 'bravo', licao: 'normal', pergunta: 'normal', fecho: 'ri'};
  const acao = modo === 'abre' ? 'acena' : modo === 'aponta' || modo === 'pergunta' ? 'aponta' : modo === 'fecho' ? 'acena' : 'fala';
  const grita = modo === 'juros' ? 0.5 + 0.5 * Math.abs(Math.sin(t * 9)) : modo === 'abre' ? 0.15 : 0;
  const moeda = modo === 'fecho' || modo === 'licao';
  return (
    <group>
      {/* piso de ladrilho hidráulico e degrau */}
      <Caixa pos={[0, -0.06, 0]} tam={[7, 0.12, 4.4]} cor="#e9dcc0" map={texLadrilho([14, 9])} />
      <Caixa pos={[0, -0.2, 2.6]} tam={[7.4, 0.12, 0.8]} cor="#b9b2a6" map={texGranito([4, 1])} />
      {/* parede da casa: barra de azulejo e reboco amarelo, porta de madeira e janela com grade */}
      <Caixa pos={[0, 0.65, -2.2]} tam={[7, 1.3, 0.2]} cor="#3f8f9a" map={texAzulejo('#3f8f9a', [28, 5])} />
      <Caixa pos={[0, 2.15, -2.2]} tam={[7, 1.7, 0.2]} cor="#f0d58a" map={texReboco('#f0d58a', [6, 2])} />
      <Caixa pos={[-1.6, 1.05, -2.08]} tam={[0.95, 2.1, 0.06]} cor="#7a4a2a" map={texMadeira('#7a4a2a', [1, 2])} />
      {[0.5, 1.5].map((y) => (<Caixa key={y} pos={[-1.6, y, -2.04]} tam={[0.75, 0.6, 0.02]} cor="#6b3e26" />))}
      <Cil pos={[-1.25, 1.05, -2.02]} r={0.03} h={0.02} rot={[Math.PI / 2, 0, 0]} cor="#c9a24a" />
      <Caixa pos={[1.4, 1.55, -2.08]} tam={[1.6, 1.1, 0.04]} cor="#9fc7e0" />
      {Array.from({length: 7}).map((_, i) => (<Barra key={i} a={[0.65 + i * 0.25, 1.0, -2.02]} b={[0.65 + i * 0.25, 2.1, -2.02]} r={0.012} cor="#2b2b30" />))}
      <Caixa pos={[1.4, 0.98, -2.0]} tam={[1.8, 0.06, 0.18]} cor="#e9e4d8" />
      <Samambaia pos={[1.4, 1.02, -1.92]} esc={0.6} />
      {/* número da casa e lampião */}
      <Placa pos={[-0.6, 2.2, -2.09]} larg={0.3} alt={0.2} txt="78" fundo="#2f6a5a" cor="#ffffff" />
      <Cil pos={[0.2, 2.5, -2.0]} r={0.08} h={0.22} cor="#fff2c0" />
      {/* colunas e mureta de frente */}
      {[-3.3, 3.3].map((x) => (<Caixa key={x} pos={[x, 1.5, 1.95]} tam={[0.3, 3.0, 0.3]} cor="#f4efe2" map={texReboco('#f4efe2', [1, 3])} />))}
      <Caixa pos={[0, 3.05, 0]} tam={[7.2, 0.15, 4.6]} cor="#c9a27a" map={texMadeira('#b07a4a', [6, 4])} />
      {[-1, 1].map((s) => (<Caixa key={s} pos={[s * 2.45, 0.4, 2.0]} tam={[1.4, 0.8, 0.22]} cor="#f4efe2" map={texReboco('#f4efe2', [2, 1])} />))}
      {[-1, 1].map((s) => (<Samambaia key={s} pos={[s * 2.6, 0.8, 2.0]} esc={0.7} />))}
      {/* cadeira de balanço, mesinha com café e rádio */}
      <CadeiraBalanco pos={[-1.15, 0, -0.5]} rotY={0.5} t={t} />
      <Caixa pos={[1.55, 0.55, -0.9]} tam={[0.6, 0.04, 0.6]} cor="#7a4a2a" map={texMadeira('#7a4a2a', [1, 1])} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (<Caixa key={i} pos={[1.55 + a * 0.25, 0.27, -0.9 + b * 0.25]} tam={[0.04, 0.54, 0.04]} cor="#6b3e26" />))}
      <Radio pos={[1.5, 0.57, -1.0]} rotY={-0.3} />
      <Cil pos={[1.75, 0.62, -0.75]} r={0.04} h={0.09} cor="#ffffff" />
      <Cil pos={[1.75, 0.57, -0.75]} r={0.07} h={0.01} cor="#ffffff" />
      {/* Seu Tostão e o Juros no poleiro */}
      <SeuTostao pos={[-0.25, 0, 0.15]} rotY={0.12} t={t} acao={acao} expressao={expr[modo]} esc={0.95}
        bengala={acao === 'fala'} />
      <Poleiro pos={[0.62, 0, 0.0]} h={1.25} />
      <Juros pos={[0.62, 1.27, 0.0]} rotY={-0.5} t={t} esc={1.25} acao={grita > 0.3 ? 'grita' : 'parado'} grita={grita} />
      {moeda && <Moeda pos={[0.15, 1.15 + Math.sin(t * 3) * 0.03, 0.45]} rot={[0, t * 2.4, 0]} valor="1" r={0.07} />}
      {/* rua ao fundo: calçada, árvores, casas e um Fusca */}
      <Caixa pos={[0, -0.25, 6]} tam={[40, 0.1, 6]} cor="#ece6da" map={texPortuguesa([10, 2])} />
      <Caixa pos={[0, -0.3, 12]} tam={[60, 0.1, 7]} cor="#4a4b50" map={texAsfalto([10, 2])} />
      <Fusca pos={[-4.5, -0.25, 11.5]} rotY={0.05 + p * 0} cor="#5f8fb0" />
      {[-7, 6].map((x) => (<Arvore key={x} pos={[x, -0.25, 5.2]} esc={1.4} />))}
      <Poste pos={[3.8, -0.25, 8.4]} />
      {[[-10, '#e9d8a6'], [-3, '#d9a7a0'], [4, '#a9c0d0'], [11, '#cfe0b8']].map(([x, c], i) => (
        <group key={i} position={[x as number, -0.25, 19]}>
          <Caixa pos={[0, 1.6, 0]} tam={[6, 3.2, 5]} cor={c as string} map={texReboco(c as string, [4, 2])} />
          <mesh position={[0, 3.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[4.6, 1.6, 4]} /><meshStandardMaterial color="#b8543a" roughness={0.8} /></mesh>
          <Caixa pos={[1.2, 1.2, 2.52]} tam={[0.9, 2.0, 0.04]} cor="#7a4a2a" />
          <Caixa pos={[-1.3, 1.7, 2.52]} tam={[1.4, 1.0, 0.04]} cor="#9fc7e0" />
        </group>
      ))}
    </group>
  );
};

// ======================= 2. AGÊNCIA BANCÁRIA, MARÇO DE 1990 =======================
// Salão 14 x 10 m. Balcão dos caixas em z = -2,5 com 4 guichês de vidro (x = -3,75 / -1,25 / 1,25 / 3,75).
// O Seu Tostão é o caixa do guichê 2. Porta de vidro em z = +5; caixa eletrônico na parede esquerda.
const GX = [-3.75, -1.25, 1.25, 3.75];
const TOSTAO_CAIXA: V3 = [-1.25, 0.22, -3.6];
const Guiche: React.FC<{x: number; n: number; fechado?: boolean}> = ({x, n, fechado}) => (
  <group position={[x, 0, -2.5]}>
    {/* corpo do balcão em madeira com frisos, tampo de granito */}
    <Caixa pos={[0, 0.55, 0]} tam={[2.5, 1.1, 0.7]} cor="#8b5a3c" map={texMadeira('#8b5a3c', [2, 1])} />
    {[-0.8, 0, 0.8].map((dx) => (<Caixa key={dx} pos={[dx, 0.55, 0.355]} tam={[0.66, 0.85, 0.02]} cor="#7a4a2a" />))}
    <Caixa pos={[0, 1.13, 0.05]} tam={[2.55, 0.06, 0.85]} cor="#6a6560" map={texGranito([2, 1])} />
    {/* vidro com abertura embaixo e o furo de falar */}
    <mesh position={[0, 1.75, -0.05]}>
      <boxGeometry args={[2.3, 1.1, 0.02]} />
      <meshStandardMaterial color="#cfeeff" transparent opacity={0.22} roughness={0.05} />
    </mesh>
    {[-1.2, 1.2].map((dx) => (<Caixa key={dx} pos={[dx, 1.75, -0.05]} tam={[0.1, 1.15, 0.1]} cor="#c9a24a" />))}
    <Caixa pos={[0, 2.33, -0.05]} tam={[2.5, 0.08, 0.1]} cor="#c9a24a" />
    {/* tablado do caixa (o caixa fica mais alto que o cliente) */}
    <Caixa pos={[0, 0.11, -1.25]} tam={[2.5, 0.22, 1.3]} cor="#6b3e26" map={texMadeira('#6b3e26', [3, 1])} />
    {/* placa CAIXA n e a placa de fechado */}
    <Letreiro pos={[0, 2.62, -0.05]} larg={1.2} alt={0.36} linhas={[`CAIXA ${n}`]} fundo="#1f3f8a" cor="#ffffff" />
    {fechado && <Letreiro pos={[0.55, 1.4, -0.03]} larg={0.5} alt={0.22} linhas={['FECHADO']} fundo="#c62f2f" cor="#ffffff" />}
    {/* lado de dentro: máquina autenticadora, gaveta, carimbos e papéis */}
    <Caixa pos={[-0.55, 1.0, -0.65]} tam={[2.4, 0.06, 0.6]} cor="#7a4a2a" />
    <group position={[0.55, 1.03, -0.62]}>
      <Caixa pos={[0, 0.1, 0]} tam={[0.42, 0.2, 0.32]} cor="#d9d2bf" />
      <Caixa pos={[0, 0.17, 0.12]} rot={[-0.4, 0, 0]} tam={[0.36, 0.02, 0.12]} cor="#3a3f4a" />
      <Caixa pos={[0, 0.22, -0.05]} tam={[0.3, 0.06, 0.12]} cor="#bfb7a2" />
    </group>
    <Caixa pos={[-0.6, 1.05, -0.6]} tam={[0.25, 0.04, 0.32]} cor="#f2ecdf" />
    <Cil pos={[-0.25, 1.09, -0.55]} r={0.03} h={0.12} cor="#2b2b30" />
    {/* cadeira giratória do caixa */}
    <Cil pos={[0.85, 0.47, -1.35]} r={0.04} h={0.5} cor="#3a3f4a" />
    <Caixa pos={[0.85, 0.74, -1.35]} tam={[0.45, 0.08, 0.45]} cor="#2f4f8a" />
  </group>
);
const CaixaEletronico: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 1.0, 0]} tam={[0.9, 2.0, 0.6]} cor="#d9cfb8" />
    <Caixa pos={[0, 1.95, 0.05]} tam={[0.95, 0.3, 0.62]} cor="#1f3f8a" />
    <Letreiro pos={[0, 1.95, 0.37]} larg={0.85} alt={0.22} linhas={['AUTOATENDIMENTO']} fundo="#1f3f8a" cor="#ffffff" />
    <Caixa pos={[0, 1.42, 0.25]} rot={[-0.25, 0, 0]} tam={[0.6, 0.42, 0.14]} cor="#5a5650" />
    <mesh position={[0, 1.44, 0.33]} rotation={[-0.25, 0, 0]}>
      <planeGeometry args={[0.4, 0.3]} />
      <meshBasicMaterial map={texTelaATM()} toneMapped={false} />
    </mesh>
    <Caixa pos={[0, 1.08, 0.35]} rot={[-0.6, 0, 0]} tam={[0.42, 0.04, 0.24]} cor="#bfb7a2" />
    {Array.from({length: 12}).map((_, i) => (<Caixa key={i} pos={[-0.12 + (i % 3) * 0.12, 1.1 + Math.floor(i / 3) * 0.035, 0.38 - Math.floor(i / 3) * 0.03]} rot={[-0.6, 0, 0]} tam={[0.08, 0.015, 0.04]} cor="#e9e4d8" sombra={false} />))}
    <Caixa pos={[0, 0.85, 0.31]} tam={[0.4, 0.05, 0.02]} cor="#1d1b26" />
    <Caixa pos={[0.3, 1.25, 0.31]} tam={[0.12, 0.03, 0.02]} cor="#1d1b26" />
  </group>
);
type ModoAgencia = 'fechada' | 'cheia';
const Agencia: React.FC<{t: number; p: number; modo: ModoAgencia; expressao?: Expressao; acaoTostao?: 'fala' | 'parado' | 'aponta'}> = ({t, p, modo, expressao = 'normal', acaoTostao = 'parado'}) => {
  const cheia = modo === 'cheia';
  const cal = texCalendario('MARÇO', '1990', 4, 31, cheia ? [14, 15, 16] : [14, 15], cheia ? 19 : 16);
  return (
    <group>
      {/* piso, paredes (azulejo embaixo, reboco em cima), forro com luminárias */}
      <Caixa pos={[0, -0.05, 0]} tam={[14, 0.1, 10]} cor="#b9b2a6" map={texGranito([7, 5])} />
      <Caixa pos={[0, 0.7, -5]} tam={[14, 1.4, 0.2]} cor="#7a8f8a" map={texAzulejo('#7a8f8a', [56, 6])} />
      <Caixa pos={[0, 2.5, -5]} tam={[14, 2.2, 0.2]} cor="#e9e0c8" map={texReboco('#e9e0c8', [8, 2])} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Caixa pos={[s * 7, 0.7, 0]} tam={[0.2, 1.4, 10]} cor="#7a8f8a" map={texAzulejo('#7a8f8a', [40, 6])} />
          <Caixa pos={[s * 7, 2.5, 0]} tam={[0.2, 2.2, 10]} cor="#e9e0c8" map={texReboco('#e9e0c8', [6, 2])} />
        </group>
      ))}
      {/* frente: vidraça com porta dupla */}
      <Caixa pos={[-4.2, 1.8, 5]} tam={[5.6, 3.6, 0.2]} cor="#e9e0c8" map={texReboco('#e9e0c8', [4, 2])} />
      <Caixa pos={[4.8, 1.8, 5]} tam={[4.4, 3.6, 0.2]} cor="#e9e0c8" map={texReboco('#e9e0c8', [4, 2])} />
      <mesh position={[1.2, 1.25, 5]}>
        <boxGeometry args={[2.8, 2.5, 0.03]} />
        <meshStandardMaterial color="#cfeeff" transparent opacity={0.25} roughness={0.05} />
      </mesh>
      {[-0.2, 1.2, 2.6].map((x) => (<Caixa key={x} pos={[x, 1.25, 5]} tam={[0.08, 2.5, 0.1]} cor="#9aa0aa" />))}
      <Caixa pos={[1.2, 2.55, 5]} tam={[2.9, 0.1, 0.1]} cor="#9aa0aa" />
      <Caixa pos={[1.2, 3.05, 5]} tam={[2.9, 0.9, 0.2]} cor="#e9e0c8" />
      {/* cartaz do feriado bancário colado no vidro, voltado para dentro e para fora */}
      {!cheia && (
        <group>
          <Letreiro pos={[0.5, 1.5, 4.97]} rotY={Math.PI} larg={1.0} alt={0.7} linhas={['FERIADO', 'BANCÁRIO', '14 · 15 · 16/03']} fundo="#fffbe8" cor="#c62f2f" borda="#c62f2f" />
          <Letreiro pos={[0.5, 1.5, 5.03]} larg={1.0} alt={0.7} linhas={['FERIADO', 'BANCÁRIO', '14 · 15 · 16/03']} fundo="#fffbe8" cor="#c62f2f" borda="#c62f2f" />
          <Barra a={[1.2, 1.0, 4.94]} b={[1.2, 1.4, 4.94]} r={0.02} cor="#c9a24a" />
          {/* corrente nas maçanetas */}
          {Array.from({length: 7}).map((_, i) => (
            <mesh key={i} position={[0.95 + i * 0.08, 1.15 + Math.sin((i / 6) * Math.PI) * -0.08, 4.93]} rotation={[0, 0, i % 2 ? 0 : Math.PI / 2]}>
              <torusGeometry args={[0.035, 0.009, 6, 12]} />
              <meshStandardMaterial color="#9aa0aa" metalness={0.6} roughness={0.35} />
            </mesh>
          ))}
          <Cadeado pos={[1.2, 1.03, 4.9]} esc={0.25} rotY={Math.PI} />
        </group>
      )}
      {/* calendário de março de 1990 e relógio na parede da frente (lado de dentro) */}
      <Calendario pos={[-0.95, 1.65, 4.88]} rotY={Math.PI} esc={1.35} mapa={cal} />
      <Relogio pos={[-2.6, 2.6, 4.88]} rotY={Math.PI} r={0.3} />
      {/* rua lá fora (vista pela vidraça) */}
      <Caixa pos={[0, -0.05, 9]} tam={[30, 0.1, 8]} cor="#ece6da" map={texPortuguesa([8, 2])} />
      <Predio80 pos={[-3, 0, 17]} tam={[9, 12, 6]} cor="#c9a27a" rotY={Math.PI} seed={3} />
      <Predio80 pos={[7, 0, 17]} tam={[8, 15, 6]} cor="#a9c0d0" rotY={Math.PI} seed={4} />
      <Fusca pos={[-4, 0, 12.5]} rotY={0.02} cor="#e9473f" />
      {!cheia && [0, 1, 2].map((i) => (<Boneco key={i} pos={[0.2 + i * 0.9, 0, 6.0 + i * 0.3]} rotY={Math.PI + 0.2 * (i - 1)} t={t + i} v={povo(40 + i)} esc={0.9} expressao={i === 1 ? 'bravo' : 'triste'} />))}
      {/* fundo: cofre, mesa do gerente, cartazes genéricos */}
      <Caixa pos={[4.6, 1.3, -4.85]} tam={[2.2, 2.4, 0.1]} cor="#5a6470" />
      <Cil pos={[4.6, 1.3, -4.75]} rot={[Math.PI / 2, 0, 0]} r={0.9} h={0.12} cor="#7a8590" seg={24} />
      <Cil pos={[4.6, 1.3, -4.66]} rot={[Math.PI / 2, 0, 0]} r={0.2} h={0.08} cor="#c9a24a" />
      <Letreiro pos={[-4.4, 2.6, -4.88]} larg={1.8} alt={0.9} linhas={['POUPANÇA', 'RENDE TODO MÊS']} fundo="#2f6a5a" cor="#ffffff" />
      <Letreiro pos={[-1.2, 2.9, -4.88]} larg={2.2} alt={0.5} linhas={['TESOURARIA']} fundo="#1f3f8a" cor="#ffffff" />
      <Relogio pos={[1.6, 2.9, -4.88]} r={0.32} />
      {/* balcão com os 4 guichês */}
      {GX.map((x, i) => (<Guiche key={x} x={x} n={i + 1} fechado={!cheia ? i !== 1 : i === 3} />))}
      {/* caixa eletrônico antigo e mesa de formulários */}
      <CaixaEletronico pos={[-6.55, 0, 1.6]} rotY={Math.PI / 2} />
      <group position={[-5.2, 0, 3.4]}>
        <Caixa pos={[0, 1.0, 0]} tam={[1.4, 0.06, 0.6]} cor="#6a6560" map={texGranito([1, 1])} />
        <Cil pos={[0, 0.5, 0]} r={0.06} h={1.0} cor="#9aa0aa" />
        {[-0.4, 0, 0.4].map((x) => (<Caixa key={x} pos={[x, 1.04, 0]} tam={[0.22, 0.01, 0.3]} cor="#f2ecdf" sombra={false} />))}
        <Barra a={[0.55, 1.04, 0.1]} b={[0.62, 1.04, 0.2]} r={0.006} cor="#1f3f8a" />
      </group>
      {/* luminárias fluorescentes */}
      {[-4, 0, 4].map((x) => [-1, 2.5].map((z) => (<group key={x + ':' + z}><Caixa pos={[x, 3.55, z]} tam={[1.3, 0.06, 0.3]} cor="#f4f4f0" /><Caixa pos={[x, 3.51, z]} tam={[1.2, 0.02, 0.2]} cor="#fffbe8" sombra={false} /></group>)))}
      {/* o caixa: Seu Tostão (atrás do vidro do guichê 2) e a colega do guichê 3 */}
      <SeuTostao pos={TOSTAO_CAIXA} rotY={0} t={t} acao={acaoTostao} expressao={expressao} esc={0.95} bengala={false} />
      {cheia && <Boneco pos={[1.25, 0.22, -3.6]} rotY={0} t={t + 1} v={BANCARIA} esc={0.9} acao="fala" expressao="medo" />}
      {/* clientes: fila serpenteando entre os pedestais */}
      {cheia && (
        <group>
          {[-3, -1.6, -0.2, 1.2, 2.6].map((x) => [0.6, 2.0].map((z) => (<Pedestal key={x + ':' + z} pos={[x, 0, z]} />)))}
          {[0.6, 2.0].map((z) => (<Barra key={z} a={[-3, 0.98, z]} b={[2.6, 0.98, z]} r={0.012} cor="#9a2f2f" sombra={false} />))}
          <Boneco pos={[-1.65, 0, -1.55]} rotY={Math.PI + 0.3} t={t} v={povo(7)} esc={0.92} acao="aponta" expressao="bravo" />
          <Boneco pos={[1.25, 0, -1.75]} rotY={Math.PI} t={t + 2} v={povo(8)} esc={0.9} acao="fala" expressao="triste" />
          <Fila pts={[[-1.2, 0, -0.9], [-3.6, 0, -0.1], [-3.6, 0, 1.3], [3.2, 0, 1.3], [3.2, 0, 2.8], [-5.8, 0, 2.8], [-5.8, 0, 4.4], [6.2, 0, 4.4]]} t={t} seed={2} passo={0.66} />
          <Boneco pos={[3.75, 0, -1.75]} rotY={Math.PI} t={t + 3} v={povo(9)} esc={0.88} acao="parado" expressao="triste" />
        </group>
      )}
      {/* caderneta de poupança e maço no balcão do guichê 2 */}
      <group position={[-1.25, 1.165, -2.25]}>
        <mesh rotation={[-Math.PI / 2, 0, 0.08]}>
          <planeGeometry args={[0.32, 0.2]} />
          <meshStandardMaterial map={texCaderneta()} roughness={0.9} />
        </mesh>
        <Caixa pos={[0, -0.004, 0]} rot={[0, 0.08, 0]} tam={[0.33, 0.006, 0.21]} cor="#1f3f8a" />
        <Maco pos={[0.32, 0.0, 0.02]} rotY={-0.3} n={cheia ? Math.round(lerp(4, 10, p)) : 14} cor={NCZ} valor="NCz$" />
        <Cil pos={[-0.3, 0.05, 0.02]} r={0.035} h={0.1} cor="#7a4a2a" />
        <Caixa pos={[-0.3, 0.0, 0.02]} tam={[0.08, 0.005, 0.05]} cor="#c62f2f" />
      </group>
    </group>
  );
};

// ======================= 3. SALA DE ESTAR, 16/03/1990 (o anúncio na TV) =======================
const Sala: React.FC<{t: number}> = ({t}) => {
  const tela = texTelaTV();
  const cal = texCalendario('MARÇO', '1990', 4, 31, [], 16);
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[5.4, 0.1, 5]} cor="#a0703f" map={texTaco([8, 8])} />
      <Caixa pos={[0, 1.4, -2.5]} tam={[5.4, 2.8, 0.15]} cor="#efe0b8" map={texPapel([6, 3])} />
      <Caixa pos={[-2.7, 1.4, 0]} tam={[0.15, 2.8, 5]} cor="#efe0b8" map={texPapel([6, 3])} />
      <Caixa pos={[0, 0.06, -2.4]} tam={[5.4, 0.12, 0.04]} cor="#6b4a2f" />
      {/* tapete */}
      <Caixa pos={[0, 0.005, 0]} tam={[2.8, 0.01, 2.0]} cor="#b8543a" map={texAzulejo('#b8543a', [6, 4])} />
      {/* rack de madeira com a TV de tubo, vaso e bibelôs */}
      <Caixa pos={[0, 0.3, -2.05]} tam={[1.8, 0.6, 0.5]} cor="#7a4a2a" map={texMadeira('#7a4a2a', [2, 1])} />
      {[-0.45, 0.45].map((x) => (<Caixa key={x} pos={[x, 0.3, -1.795]} tam={[0.8, 0.5, 0.01]} cor="#6b3e26" />))}
      <group position={[0, 0.6, -2.05]} scale={1.15}>
        <TVTubo pos={[0, -0.4, 0]} tela={tela} />
      </group>
      <Samambaia pos={[0.75, 0.6, -2.1]} esc={0.55} />
      <Cil pos={[-0.72, 0.68, -2.0]} r={0.05} r2={0.07} h={0.16} cor="#e9e0c8" />
      {/* calendário de março de 1990 com o 16 circulado, quadro e relógio */}
      <Calendario pos={[1.6, 1.6, -2.42]} esc={1.2} mapa={cal} />
      <Caixa pos={[-1.4, 1.75, -2.42]} tam={[0.9, 0.6, 0.03]} cor="#c9a24a" />
      <Caixa pos={[-1.4, 1.75, -2.4]} tam={[0.8, 0.5, 0.01]} cor="#6fa0c0" />
      <Relogio pos={[0, 2.35, -2.42]} r={0.18} />
      {/* janela com cortina na lateral */}
      <Caixa pos={[-2.62, 1.6, 0.4]} tam={[0.02, 1.1, 1.3]} cor="#9fc7e0" />
      {[-1, 1].map((s) => (<Caixa key={s} pos={[-2.58, 1.5, 0.4 + s * 0.75]} tam={[0.04, 1.6, 0.35]} cor="#e9c46a" />))}
      {/* mesinha com telefone de disco e abajur */}
      <Caixa pos={[-2.1, 0.3, -1.6]} tam={[0.5, 0.6, 0.5]} cor="#7a4a2a" map={texMadeira('#7a4a2a', [1, 1])} />
      <group position={[-2.1, 0.6, -1.6]}>
        <Caixa pos={[0, 0.05, 0]} tam={[0.22, 0.1, 0.24]} cor="#c62f2f" />
        <Cil pos={[0, 0.105, 0.03]} r={0.06} h={0.01} cor="#f2ecdf" />
        <Caixa pos={[0, 0.14, -0.03]} rot={[0, 0, 0]} tam={[0.24, 0.04, 0.06]} cor="#c62f2f" />
      </group>
      <Cil pos={[-2.25, 0.85, -1.75]} r={0.02} h={0.5} cor="#c9a24a" />
      <Cil pos={[-2.25, 1.15, -1.75]} r={0.08} r2={0.16} h={0.22} cor="#f4e2b0" />
      {/* família no sofá, de costas para a câmera, olhando a TV */}
      <Sofa pos={[0, 0, 1.15]} rotY={Math.PI} cor="#5f8f8a" />
      <Sentado pos={[-0.5, 0.42, 1.1]} rotY={Math.PI} roupa="#3f7fc4" pele="#e7b48c" cabelo="#2b1d14" bracos={0.2} esc={0.95} />
      <Sentado pos={[0.45, 0.42, 1.1]} rotY={Math.PI + 0.15} roupa="#e86d9a" pele="#e7b48c" cabelo="#5a4030" bracos={0.6 + 0.2 * Math.sin(t * 2)} esc={0.92} />
      <Sentado pos={[0.95, 0.0, 0.2]} rotY={Math.PI - 0.2} roupa="#f0c64a" pele="#e7b48c" cabelo="#2b1d14" esc={0.7} />
      <pointLight position={[0, 1.0, -1.4]} intensity={2.5} distance={3} color="#9fc0ff" />
    </group>
  );
};

// ======================= 4. SUPERMERCADO: A REMARCAÇÃO DE PREÇOS =======================
const Produto: React.FC<{pos: V3; tipo: number; cor: string}> = ({pos, tipo, cor}) =>
  tipo === 0 ? (
    <group position={pos}><Cil pos={[0, 0.09, 0]} r={0.05} h={0.18} cor={cor} /><Cil pos={[0, 0.06, 0]} r={0.052} h={0.06} cor="#f4f0e6" /></group>
  ) : tipo === 1 ? (
    <group position={pos}><Caixa pos={[0, 0.12, 0]} tam={[0.14, 0.24, 0.06]} cor={cor} /><Caixa pos={[0, 0.14, 0.031]} tam={[0.1, 0.06, 0.002]} cor="#f4f0e6" sombra={false} /></group>
  ) : (
    <group position={pos}><Cil pos={[0, 0.13, 0]} r={0.045} h={0.26} cor={cor} /><Cil pos={[0, 0.29, 0]} r={0.018} h={0.06} cor="#c62f2f" /></group>
  );
const Gondola: React.FC<{pos: V3; rotY?: number; seed: number; etiquetas?: number}> = ({pos, rotY = 0, seed, etiquetas = 1}) => {
  const r = rnd(seed);
  const cores = ['#e05a5a', '#f0c64a', '#3f7fc4', '#5aa06a', '#ef8a3a', '#9a5ab0', '#f4f0e6', '#c9a27a'];
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Caixa pos={[0, 0.9, -0.2]} tam={[3.0, 1.8, 0.05]} cor="#e9e4d8" />
      {[0.15, 0.6, 1.05, 1.5].map((y, k) => (
        <group key={y}>
          <Caixa pos={[0, y, 0]} tam={[3.0, 0.03, 0.42]} cor="#d9d2bf" />
          <Caixa pos={[0, y - 0.02, 0.22]} tam={[3.0, 0.06, 0.02]} cor="#f2c94a" />
          {Array.from({length: 14}).map((_, i) => (<Produto key={i} pos={[-1.38 + i * 0.21, y + 0.015, -0.02 + ((i + k) % 2) * 0.08]} tipo={Math.floor(r() * 3)} cor={cores[Math.floor(r() * cores.length)]} />))}
          {Array.from({length: 4}).map((_, i) => (
            <group key={'e' + i}>
              {Array.from({length: etiquetas}).map((__, j) => (
                <mesh key={j} position={[-1.1 + i * 0.75 + j * 0.012, y - 0.02, 0.232 + j * 0.0015]} rotation={[0, 0, (j % 2 ? 1 : -1) * 0.04 * j]}>
                  <planeGeometry args={[0.1, 0.05]} />
                  <meshStandardMaterial map={texEtiqueta(j === etiquetas - 1 ? '#fff27a' : j % 2 ? '#ffd0a0' : '#f4f0e6')} roughness={0.9} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}
      <Caixa pos={[0, 1.95, -0.2]} tam={[3.0, 0.3, 0.06]} cor="#c62f2f" />
    </group>
  );
};
const Mercado: React.FC<{t: number; p: number; close?: boolean}> = ({t, p, close}) => {
  const n = 1 + Math.floor(clamp01(p) * 5.99);
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[14, 0.1, 14]} cor="#e9e4d8" map={tex('co-piso-merc', 128, 128, (g) => {
        g.fillStyle = '#ece6d8';
        g.fillRect(0, 0, 128, 128);
        g.fillStyle = '#d6cfbf';
        g.fillRect(0, 0, 64, 64);
        g.fillRect(64, 64, 64, 64);
      }, [14, 14])} />
      <Caixa pos={[0, 2.0, -6.5]} tam={[14, 4, 0.2]} cor="#f4efe2" map={texReboco('#f4efe2', [8, 2])} />
      <Letreiro pos={[0, 3.2, -6.35]} larg={4.4} alt={0.7} linhas={['MERCEARIA · BAZAR']} fundo="#c62f2f" cor="#ffffff" />
      {/* corredor: duas gôndolas frente a frente */}
      <Gondola pos={[0, 0, -1.6]} seed={3} etiquetas={close ? n : 3} />
      <Gondola pos={[0, 0, 1.6]} rotY={Math.PI} seed={4} etiquetas={3} />
      <Gondola pos={[3.4, 0, -1.6]} seed={5} etiquetas={3} />
      <Gondola pos={[-3.4, 0, -1.6]} seed={6} etiquetas={4} />
      <Gondola pos={[3.4, 0, 1.6]} rotY={Math.PI} seed={7} etiquetas={3} />
      {/* remarcador com a maquininha de etiqueta e a dona de casa com o carrinho */}
      <Boneco pos={[0.55, 0, -0.95]} rotY={Math.PI - 0.2} t={t} v={REMARCADOR} esc={0.92} acao="martela" expressao="serio"
        maoD={<group><Caixa pos={[0, 0, 0]} tam={[0.06, 0.12, 0.16]} cor="#f2c94a" /><Caixa pos={[0, -0.08, 0.03]} tam={[0.03, 0.08, 0.03]} cor="#3a3f4a" /></group>} />
      <Boneco pos={[-0.6, 0, 0.55]} rotY={-2.4} t={t + 1} v={povo(21)} esc={0.9} acao="aponta" expressao="espanto" />
      <group position={[-1.9, 0, 0.6]} rotation={[0, 0.9, 0]}>
        <Caixa pos={[0, 0.65, 0]} tam={[0.5, 0.35, 0.8]} cor="#c9ccd6" />
        {[[-0.2, -0.35], [0.2, -0.35], [-0.2, 0.35], [0.2, 0.35]].map(([x, z], i) => (<Cil key={i} pos={[x, 0.06, z]} r={0.05} h={0.04} rot={[0, 0, Math.PI / 2]} cor="#1d1b26" />))}
        {[[-0.2, -0.35], [0.2, -0.35], [-0.2, 0.35], [0.2, 0.35]].map(([x, z], i) => (<Barra key={'b' + i} a={[x, 0.08, z]} b={[x, 0.48, z]} r={0.012} cor="#9aa0aa" />))}
        <Barra a={[-0.25, 0.95, 0.45]} b={[0.25, 0.95, 0.45]} r={0.015} cor="#c62f2f" />
        <Produto pos={[0.05, 0.82, -0.1]} tipo={1} cor="#f0c64a" />
        <Produto pos={[-0.1, 0.82, 0.15]} tipo={2} cor="#5aa06a" />
      </group>
      <Letreiro pos={[2.6, 2.3, -1.75]} larg={0.9} alt={0.5} linhas={['NOVOS', 'PREÇOS']} fundo="#fff27a" cor="#c62f2f" />
      <Letreiro pos={[-2.4, 2.3, 1.75]} rotY={Math.PI} larg={0.9} alt={0.5} linhas={['REMARCADO']} fundo="#fff27a" cor="#c62f2f" />
    </group>
  );
};

// ======================= 5. COFRE DO BANCO CENTRAL: o dinheiro preso =======================
// Grade de ferro em z = 1,2 (com corrente e cadeado no meio), montanha de maços atrás, porta redonda do cofre em z = 4,5.
const MontanhaMacos: React.FC<{k: number; seed?: number}> = ({k, seed = 3}) => {
  const {mats, n} = useMemo(() => {
    const r = rnd(seed);
    const out: THREE.Matrix4[] = [];
    const N = 2600;
    for (let i = 0; i < N; i++) {
      const ang = r() * Math.PI * 2, rad = Math.sqrt(r()) * 2.6;
      const x = Math.cos(ang) * rad * 1.15, z = -1.6 + Math.sin(ang) * rad * 0.7;
      const hmax = Math.max(0, 2.4 * (1 - rad / 2.7));
      const y = r() * hmax;
      out.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y + 0.03, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.5, r() * Math.PI, (r() - 0.5) * 0.5)), new THREE.Vector3(1, 1, 1)));
    }
    // ordena por altura: o monte "cresce" de baixo para cima
    out.sort((a, b) => a.elements[13] - b.elements[13]);
    return {mats: out, n: N};
  }, [seed]);
  const geo = useMemo(() => new THREE.BoxGeometry(0.156, 0.03, 0.07), []);
  const vis = Math.round(n * clamp01(k));
  const a = mats.filter((_, i) => i % 2 === 0).slice(0, Math.ceil(vis / 2));
  const b = mats.filter((_, i) => i % 2 === 1).slice(0, Math.floor(vis / 2));
  return (
    <group>
      <Instancias matrizes={a} n={a.length} geo={geo} cor={NCZ} />
      <Instancias matrizes={b} n={b.length} geo={geo} cor={NCZ2} />
    </group>
  );
};
type ModoCofre = 'preso' | 'volta';
const Cofre: React.FC<{t: number; p: number; modo: ModoCofre}> = ({t, p, modo}) => {
  const volta = modo === 'volta';
  const abre = volta ? suave(clamp01(p * 1.6)) : 0;
  const mes = Math.min(18, Math.floor(clamp01(p) * 18.99));
  const meses = ['MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO', 'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO'];
  const inicios = [4, 0, 2, 5, 0, 3, 6, 1, 4, 6, 2, 5, 5, 1, 3, 6, 1, 4, 0];
  const anoM = (i: number) => (i < 10 ? '1990' : '1991');
  const cal = texCalendario(meses[mes], anoM(mes), inicios[mes], 30, [], undefined);
  const k = volta ? 1 - 0.55 * clamp01(p) : lerp(0.35, 1, clamp01(p));
  return (
    <group>
      {/* sala-forte: piso de concreto polido, paredes de aço com rebites */}
      <Caixa pos={[0, -0.05, 0]} tam={[10, 0.1, 12]} cor="#8a8f96" map={texGranito([5, 6])} />
      <Caixa pos={[0, 2.2, -4.5]} tam={[10, 4.4, 0.3]} cor="#7d8894" map={texAco([8, 4])} />
      {[-1, 1].map((s) => (<Caixa key={s} pos={[s * 5, 2.2, 0]} tam={[0.3, 4.4, 12]} cor="#7d8894" map={texAco([10, 4])} />))}
      <Letreiro pos={[0, 3.7, -4.3]} larg={3.6} alt={0.6} linhas={['BANCO CENTRAL · DEPÓSITOS BLOQUEADOS']} fundo="#1d2a3a" cor="#ffd23f" />
      {/* estantes com malotes e a montanha de dinheiro preso */}
      {[-3.8, 3.8].map((x) => (
        <group key={x} position={[x, 0, -3.2]}>
          {[0.4, 1.2, 2.0, 2.8].map((y) => (<Caixa key={y} pos={[0, y, 0]} tam={[1.6, 0.05, 1.2]} cor="#7a8590" />))}
          {[-0.75, 0.75].map((dx) => (<Caixa key={dx} pos={[dx, 1.6, 0]} tam={[0.06, 3.2, 1.2]} cor="#6a7480" />))}
          {[0.4, 1.2, 2.0, 2.8].map((y) => [-0.45, 0, 0.45].map((dx) => (<Caixa key={y + ':' + dx} pos={[dx, y + 0.22, 0]} tam={[0.38, 0.38, 0.8]} cor={(y * 10 + dx) % 2 > 1 ? '#c9b98a' : '#b8a878'} />)))}
        </group>
      ))}
      <group position={[0, 0, 0]}><MontanhaMacos k={k} /></group>
      {/* placas de papel presas no monte: "NCz$" */}
      <Letreiro pos={[-1.2, 1.2 * k, -0.6]} rotY={0.3} larg={0.5} alt={0.3} linhas={['NCz$']} fundo="#fffbe8" cor="#1f3f8a" />
      {/* grade de ferro com portão que abre no meio */}
      {Array.from({length: 25}).map((_, i) => {
        const x = -4.8 + i * 0.4;
        const portao = Math.abs(x) < 1.0;
        const dx = portao ? Math.sign(x || 0.01) * abre * 1.8 : 0;
        return <Barra key={i} a={[x + dx, 0, 1.2]} b={[x + dx, 3.4, 1.2]} r={0.03} cor="#2b2f36" />;
      })}
      {[0.15, 1.7, 3.35].map((y) => (<group key={y}>
        <Barra a={[-4.85, y, 1.2]} b={[-1.0, y, 1.2]} r={0.035} cor="#2b2f36" />
        <Barra a={[1.0, y, 1.2]} b={[4.85, y, 1.2]} r={0.035} cor="#2b2f36" />
        <Barra a={[-1.0 - abre * 1.8, y, 1.2]} b={[-0.05 - abre * 1.8, y, 1.2]} r={0.035} cor="#2b2f36" />
        <Barra a={[0.05 + abre * 1.8, y, 1.2]} b={[1.0 + abre * 1.8, y, 1.2]} r={0.035} cor="#2b2f36" />
      </group>))}
      {/* corrente grossa e o cadeado gigante */}
      {abre < 0.05 && Array.from({length: 11}).map((_, i) => (
        <mesh key={i} position={[-0.4 + i * 0.08, 1.35 + Math.cos(((i - 5) / 5) * 1.2) * 0.12 - 0.12, 1.28]} rotation={[0, i % 2 ? Math.PI / 2 : 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.05, 0.014, 8, 16]} />
          <meshStandardMaterial color="#9aa0aa" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <Cadeado pos={[0, 1.12 - abre * 1.0, 1.36]} esc={0.9} abre={abre} />
      {/* calendário de parede (folhinha virando os 18 meses), do lado de fora da grade */}
      <Calendario pos={[-4.82, 1.6, 2.6]} rotY={Math.PI / 2} esc={2.0} mapa={cal} />
      <Placa pos={[-4.82, 0.82, 2.6]} rotY={Math.PI / 2} larg={0.9} alt={0.36} txt={`MÊS ${Math.min(18, mes)} DE 18`} fundo="#1d2a3a" cor="#ffd23f" />
      {/* porta redonda do cofre, aberta, na entrada */}
      <group position={[3.4, 1.8, 4.6]} rotation={[0, -1.25, 0]}>
        <Cil rot={[Math.PI / 2, 0, 0]} r={1.6} h={0.5} cor="#8a95a0" seg={32} />
        {Array.from({length: 12}).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <Cil key={i} pos={[Math.cos(a) * 1.35, Math.sin(a) * 1.35, 0.3]} rot={[Math.PI / 2, 0, 0]} r={0.08} h={0.12} cor="#c9a24a" />;
        })}
        <Cil pos={[0, 0, 0.32]} rot={[Math.PI / 2, 0, 0]} r={0.45} h={0.1} cor="#6a7480" seg={24} />
        {[0, 1, 2].map((i) => (<Barra key={i} a={[0, 0, 0.4]} b={[Math.cos((i * 2 * Math.PI) / 3) * 0.6, Math.sin((i * 2 * Math.PI) / 3) * 0.6, 0.4]} r={0.04} cor="#c9a24a" />))}
      </group>
      {/* devolução: maços saindo em parcelas numa esteira, com etiqueta da parcela */}
      {volta && (
        <group>
          <Caixa pos={[0.2, 0.35, 3.2]} tam={[1.0, 0.1, 4.0]} cor="#2b2f36" />
          {[-0.2, 0.6].map((x) => (<Caixa key={x} pos={[x, 0.17, 3.2]} tam={[0.08, 0.34, 3.8]} cor="#4a4f5a" />))}
          {Array.from({length: 6}).map((_, i) => {
            const z = 1.4 + ((t * 0.9 + i * 0.7) % 4.0);
            return (
              <group key={i} position={[0.2, 0.42, z]}>
                {Array.from({length: 4}).map((__, j) => (<Maco key={j} pos={[(j % 2) * 0.17 - 0.085, Math.floor(j / 2) * 0.02, 0]} n={14} cor={i % 2 ? NCZ : NCZ2} valor="NCz$" />))}
                <Placa pos={[0, 0.2, 0]} larg={0.3} alt={0.16} txt={`${((i + Math.floor(t * 0.9)) % 13) + 1}ª`} fundo="#fffbe8" cor="#2f6a5a" />
              </group>
            );
          })}
          <Boneco pos={[1.9, 0, 2.6]} rotY={-1.9} t={t} v={povo(31)} esc={0.92} acao="parado" expressao="triste" />
          <Boneco pos={[2.0, 0, 3.4]} rotY={-1.6} t={t + 1} v={{...povo(32), vovo: true}} esc={0.88} acao="fala" expressao="bravo" />
        </group>
      )}
      <pointLight position={[0, 3.6, -1]} intensity={6} distance={9} color="#ffe0a0" />
      <pointLight position={[-3.5, 3.2, 3.0]} intensity={5} distance={7} color="#fff0d0" />
      <pointLight position={[2.5, 3.2, -3.5]} intensity={4} distance={7} color="#fff0d0" />
      {/* malotes empilhados embaixo do calendário */}
      {[0, 1, 2, 3, 4].map((i) => (<Caixa key={i} pos={[-4.4, 0.2 + Math.floor(i / 3) * 0.4, 1.9 + (i % 3) * 0.55]} tam={[0.6, 0.4, 0.5]} cor={i % 2 ? '#c9b98a' : '#b8a878'} />))}
    </group>
  );
};

// ======================= 6. MESA DO CAIXA: cruzado novo -> reais de hoje =======================
const MesaCaixa: React.FC<{t: number; p: number; modo: 'notas' | 'real'}> = ({t, p, modo}) => {
  const k = modo === 'real' ? suave(clamp01(p * 1.3)) : 0;
  return (
    <group>
      <Caixa pos={[0, 0.45, 0]} tam={[2.4, 0.9, 1.2]} cor="#8b5a3c" map={texMadeira('#8b5a3c', [2, 1])} />
      <Caixa pos={[0, 0.92, 0]} tam={[2.5, 0.05, 1.3]} cor="#6a6560" map={texGranito([2, 1])} />
      <Caixa pos={[0, 1.6, -1.2]} tam={[4, 3.2, 0.1]} cor="#7a8f8a" map={texAzulejo('#7a8f8a', [16, 12])} />
      <Caixa pos={[0, -0.05, 0]} tam={[6, 0.1, 6]} cor="#b9b2a6" map={texGranito([3, 3])} />
      {/* leque de cédulas genéricas de cruzado novo (some aos poucos no modo "real") */}
      {Array.from({length: 9}).map((_, i) => (
        <Nota key={i} pos={[-0.35 + i * 0.01, 0.95 + i * 0.002 + k * 0.02 * i, 0.1 - k * 0.3]} rot={[-Math.PI / 2, 0, -0.6 + i * 0.15]} valor="NCz$" cor={i % 2 ? NCZ : NCZ2} esc={1.8 * (1 - k * 0.6)} />
      ))}
      {[0, 1, 2, 3].map((i) => (<Maco key={i} pos={[-0.75 + (i % 2) * 0.2, 0.945 + Math.floor(i / 2) * 0.02, -0.25]} rotY={0.2} n={20} cor={i % 2 ? NCZ : NCZ2} valor="NCz$" />))}
      <PilhaMoedas pos={[0.1, 0.945, -0.2]} n={8} r={0.016} />
      <PilhaMoedas pos={[0.16, 0.945, -0.12]} n={5} r={0.016} />
      {/* calculadora de bobina e carimbo */}
      <group position={[0.65, 0.945, -0.15]} rotation={[0, -0.3, 0]}>
        <Caixa pos={[0, 0.04, 0]} tam={[0.26, 0.08, 0.32]} cor="#d9d2bf" />
        {Array.from({length: 16}).map((_, i) => (<Caixa key={i} pos={[-0.08 + (i % 4) * 0.05, 0.085, 0.1 - Math.floor(i / 4) * 0.05]} tam={[0.035, 0.012, 0.035]} cor={i % 4 === 3 ? '#e05a5a' : '#3a3f4a'} sombra={false} />))}
        <Cil pos={[0, 0.11, -0.13]} rot={[0, 0, Math.PI / 2]} r={0.04} h={0.18} cor="#fffbe8" />
        <Caixa pos={[0, 0.2, -0.17]} rot={[0.3, 0, 0]} tam={[0.08, 0.2, 0.002]} cor="#fffbe8" />
      </group>
      <group position={[0.0, Math.abs(Math.sin(t * 5)) * 0.08, 0]}>
        <Cil pos={[-0.12, 1.0, 0.12]} r={0.03} h={0.12} cor="#7a4a2a" />
        <Caixa pos={[-0.12, 0.95, 0.12]} tam={[0.09, 0.02, 0.06]} cor="#c62f2f" />
      </group>
      {/* "hoje": maço de reais genéricos crescendo ao lado, com a placa do valor corrigido */}
      {modo === 'real' && (
        <group position={[0.25, 0.945, 0.2]}>
          {Array.from({length: Math.max(1, Math.round(8 * k))}).map((_, i) => (<Maco key={i} pos={[0, i * 0.02, 0]} rotY={0.1 * i} n={14} cor={REAL} valor="R$" />))}
          <Placa pos={[0, 0.32, -0.05]} larg={0.36} alt={0.2} txt="HOJE" fundo="#2f6a5a" cor="#ffffff" />
          <Barra a={[-0.35, 0.08, 0]} b={[-0.12, 0.08, 0]} r={0.012} cor="#ffd23f" sombra={false} />
          <mesh position={[-0.1, 0.08, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.035, 0.07, 10]} /><meshStandardMaterial color="#ffd23f" /></mesh>
        </group>
      )}
      <Letreiro pos={[0, 2.2, -1.13]} larg={1.4} alt={0.4} linhas={['CAIXA 2']} fundo="#1f3f8a" cor="#ffffff" />
      <Calendario pos={[1.25, 1.75, -1.13]} esc={1.1} mapa={texCalendario('MARÇO', '1990', 4, 31, [14, 15, 16], 19)} />
      <Relogio pos={[-1.2, 2.2, -1.13]} r={0.22} />
    </group>
  );
};

// ======================= 7. FILA NA RUA, SEGUNDA 19/03/1990 =======================
const RuaFila: React.FC<{t: number}> = ({t}) => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[80, 0.1, 80]} cor="#4a4b50" map={texAsfalto([20, 20])} />
    {/* calçadas em L na esquina */}
    <Caixa pos={[-4, 0.06, -4]} tam={[40, 0.12, 4]} cor="#ece6da" map={texPortuguesa([10, 1])} />
    <Caixa pos={[14, 0.06, 8]} tam={[4, 0.12, 28]} cor="#ece6da" map={texPortuguesa([1, 7])} />
    {/* faixa de pedestre */}
    {Array.from({length: 7}).map((_, i) => (<Caixa key={i} pos={[9.5, 0.006, -0.5 - i * 0.6]} tam={[3.0, 0.01, 0.35]} cor="#f4f0e6" sombra={false} />))}
    {/* agência na esquina e prédios da quadra */}
    <group position={[0, 0, -6]}>
      <Caixa pos={[0, 2.4, -3]} tam={[12, 4.8, 6]} cor="#d9cfb8" map={texReboco('#d9cfb8', [6, 3])} />
      <Caixa pos={[0, 1.4, 0.02]} tam={[10, 2.6, 0.05]} cor="#2b3a48" />
      <Caixa pos={[0, 3.6, 0.08]} tam={[12, 1.0, 0.2]} cor="#1f3f8a" />
      <Letreiro pos={[0, 3.6, 0.2]} larg={6} alt={0.75} linhas={['BANCO · AGÊNCIA CENTRO']} fundo="#1f3f8a" cor="#ffffff" />
      <Relogio pos={[5.4, 3.6, 0.22]} r={0.4} />
    </group>
    <Predio80 pos={[-14, 0, -9]} tam={[10, 18, 6]} cor="#c9a27a" loja="FARMÁCIA" seed={2} />
    <Predio80 pos={[-25, 0, -9]} tam={[10, 12, 6]} cor="#a9c0d0" loja="SAPATARIA" toldo="#b8322b" seed={5} />
    <Predio80 pos={[13, 0, -9]} tam={[10, 21, 6]} cor="#cfe0b8" loja="LANCHONETE" toldo="#c9a24a" seed={6} />
    <Predio80 pos={[20, 0, 6]} tam={[8, 15, 6]} cor="#e9c4a0" rotY={-Math.PI / 2} loja="ÓTICA" seed={7} />
    <Predio80 pos={[20, 0, 16]} tam={[10, 11, 6]} cor="#d9a7a0" rotY={-Math.PI / 2} loja="PAPELARIA" seed={8} />
    {/* a fila: da porta do banco, pela calçada, dobrando a esquina */}
    <Fila pts={[[-1, 0.12, -4.6], [-12, 0.12, -4.6], [-12, 0.12, -3.2], [12.6, 0.12, -3.2], [13.4, 0.12, -2], [13.4, 0.12, 20]]} t={t} seed={4} passo={0.68} simples max={120} />
    {/* carros, orelhão, banca, postes, árvores */}
    <Fusca pos={[-6, 0, 2.2]} rotY={0} cor="#e9d8a6" />
    <Fusca pos={[1.5, 0, -0.4]} rotY={Math.PI} cor="#c94f4f" />
    <CarroPremio pos={[10.5, 0, 9]} rotY={Math.PI / 2} cor="#5f8fb0" laco={false} />
    <Orelhao pos={[-15, 0.12, -2.4]} rotY={Math.PI} />
    <group position={[6.5, 0.12, -2.4]}>
      <Caixa pos={[0, 1.0, 0]} tam={[1.6, 2.0, 1.0]} cor="#2f6a5a" />
      <Caixa pos={[0, 2.1, 0.1]} tam={[1.8, 0.1, 1.3]} cor="#c9a24a" />
      <Letreiro pos={[0, 1.6, 0.52]} larg={1.3} alt={0.5} linhas={['JORNAIS', 'E REVISTAS']} fundo="#fbf7ec" cor="#c62f2f" />
      {Array.from({length: 6}).map((_, i) => (<Caixa key={i} pos={[-0.55 + (i % 3) * 0.55, 0.6 + Math.floor(i / 3) * 0.35, 0.52]} tam={[0.4, 0.28, 0.01]} cor={['#f4f0e6', '#ffd23f', '#e05a5a'][i % 3]} sombra={false} />))}
    </group>
    {[-20, 8].map((x) => (<Poste key={x} pos={[x, 0.12, -2.3]} />))}
    {Array.from({length: 14}).map((_, i) => (<Caixa key={'fx' + i} pos={[-26 + i * 3.4, 0.006, 1.2]} tam={[1.8, 0.01, 0.14]} cor="#f2d34a" sombra={false} />))}
    {[-22, -16].map((x) => (<Arvore key={x} pos={[x, 0.12, -2.5]} esc={1.3} />))}
    {[4, 12, 20].map((z) => (<Arvore key={z} pos={[12.3, 0.12, z]} esc={1.3} />))}
  </group>
);

// ======================= 8. A CASA QUE PAROU (o pai que juntava para a casa própria) =======================
const CasaParada: React.FC<{t: number; p: number; parada?: boolean}> = ({t, p, parada}) => {
  const blocos = texReboco('#b9b2a6', [1, 1]);
  void blocos;
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[30, 0.1, 30]} cor="#a9652f" map={tex('co-terra', 128, 128, (g) => {
        g.fillStyle = '#a9703f';
        g.fillRect(0, 0, 128, 128);
        const r = rnd(8);
        for (let i = 0; i < 700; i++) {
          g.fillStyle = r() > 0.5 ? 'rgba(255,230,180,0.12)' : 'rgba(60,30,10,0.15)';
          g.fillRect(r() * 128, r() * 128, 3, 3);
        }
      }, [10, 10])} />
      {/* casa inacabada: paredes de bloco até meia altura, ferros espetados, sem telhado */}
      <group position={[0, 0, -2.5]}>
        <Caixa pos={[0, 0.1, 0]} tam={[6.4, 0.2, 5.2]} cor="#9a9a9a" />
        {[[0, -2.5, 6.4, 0.14], [0, 2.5, 6.4, 0.14], [-3.13, 0, 0.14, 5.0], [3.13, 0, 0.14, 5.0]].map(([x, z, w, d], i) => (
          <Caixa key={i} pos={[x, 0.2 + (i === 1 ? 0.6 : 0.9), z]} tam={[w, i === 1 ? 1.2 : 1.8, d]} cor="#b9b2a6" map={tex('co-bloco', 128, 128, (g) => {
            g.fillStyle = '#9e9890';
            g.fillRect(0, 0, 128, 128);
            for (let y = 0; y < 4; y++) for (let x = -1; x < 3; x++) {
              g.fillStyle = (x + y) % 2 ? '#bdb6aa' : '#b5aea2';
              g.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28);
            }
          }, [w > 1 ? w / 0.8 : d / 0.8, 2.2])} />
        ))}
        {[[-3.13, -2.5], [3.13, -2.5], [-3.13, 2.5], [3.13, 2.5], [0, -2.5]].map(([x, z], i) => (
          <group key={i}>{[-0.04, 0.04].map((d) => (<Barra key={d} a={[x + d, 1.9, z]} b={[x + d, 2.9, z]} r={0.008} cor="#7a4a2a" />))}</group>
        ))}
        <Caixa pos={[1.2, 1.1, 2.5]} tam={[0.9, 0.01, 0.16]} cor="#9a9a9a" />
      </group>
      <PilhaBlocos pos={[4.4, 0, 0.2]} nx={4} ny={4} nz={3} />
      <SacosCimento pos={[2.2, 0, 0.9]} n={8} rotY={0.4} />
      <MonteTerra pos={[-4.6, 0, 0.8]} esc={1.1} cor="#d9b878" />
      <CarrinhoMao pos={[-3.2, 0, 1.6]} rotY={0.6} carga="#d9b878" />
      <Betoneira pos={[4.6, 0, -4.8]} rotY={-0.6} t={parada ? 0 : t} />
      {/* placa da obra e cerca de madeira com o portão (amarrado com corrente quando a obra para) */}
      <Letreiro pos={parada ? [-0.4, 1.55, 2.3] : [-2.2, 1.6, 3.2]} rotY={0.1} larg={1.6} alt={0.8} linhas={parada ? ['OBRA', 'PARADA'] : ['AQUI VAI SER', 'NOSSA CASA']} fundo={parada ? '#fffbe8' : '#fbf7ec'} cor={parada ? '#c62f2f' : '#2f6a5a'} />
      <Barra a={parada ? [-0.4, 0, 2.25] : [-2.2, 0, 3.15]} b={parada ? [-0.4, 1.2, 2.25] : [-2.2, 1.2, 3.15]} r={0.04} cor="#7a4a2a" />
      {Array.from({length: 22}).map((_, i) => (<Caixa key={i} pos={[-8 + i * 0.75, 0.6, 4.2]} tam={[0.12, 1.2, 0.04]} cor={varia('#b07a4a', ((i * 7) % 5) * 0.02 - 0.04)} />))}
      {[0.35, 0.95].map((y) => (<Caixa key={y} pos={[0, y, 4.18]} tam={[16.5, 0.08, 0.03]} cor="#8b5a3c" />))}
      {/* pai com a caderneta de poupança na mão e o filho */}
      <Boneco pos={[0.5, 0, 1.4]} rotY={parada ? 0.6 : 0.25} t={t} v={PAI} esc={0.93} acao={parada ? 'parado' : 'aponta'} expressao={parada ? 'triste' : 'feliz'}
        maoE={<group><Caixa pos={[0, 0, 0]} tam={[0.1, 0.14, 0.02]} cor="#1f3f8a" /></group>} />
      <Boneco pos={[1.25, 0, 1.75]} rotY={-0.2} t={t + 1} v={FILHO} esc={0.6} acao={parada ? 'parado' : 'acena'} expressao={parada ? 'triste' : 'feliz'} />
      {/* vizinhança ao fundo */}
      {[[-10, '#e9d8a6'], [-3, '#cfe0b8'], [5, '#d9a7a0'], [12, '#a9c0d0']].map(([x, c], i) => (
        <group key={i} position={[x as number, 0, -11]}>
          <Caixa pos={[0, 1.5, 0]} tam={[6, 3, 5]} cor={c as string} map={texReboco(c as string, [4, 2])} />
          <mesh position={[0, 3.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[4.6, 1.5, 4]} /><meshStandardMaterial color="#b8543a" roughness={0.8} /></mesh>
          <Caixa pos={[-1.3, 1.6, 2.52]} tam={[1.4, 1.0, 0.04]} cor="#9fc7e0" />
        </group>
      ))}
      {[-8, 9].map((x) => (<Arvore key={x} pos={[x, 0, -6]} esc={1.5} />))}
      <Poste pos={[7, 0, 5.5]} />
      {void p}
    </group>
  );
};

// ======================= 9. PADARIA: o pão de 10 vai a 18; seus 10 viram 14 =======================
const PaoFrances: React.FC<{pos: V3; rotY?: number; esc?: number}> = ({pos, rotY = 0, esc = 1}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={esc}>
    <mesh scale={[0.1, 0.045, 0.05]} castShadow>
      <sphereGeometry args={[1, 16, 10]} />
      <meshStandardMaterial color="#d99a4a" roughness={0.7} />
    </mesh>
    <mesh position={[0, 0.03, 0]} rotation={[0, 0, 0.1]} scale={[0.07, 0.012, 0.012]}>
      <sphereGeometry args={[1, 10, 6]} />
      <meshStandardMaterial color="#f2d39a" roughness={0.8} />
    </mesh>
  </group>
);
type ModoPao = 'pao' | 'notas' | 'dois';
const Padaria: React.FC<{t: number; p: number; modo: ModoPao}> = ({t, p, modo}) => {
  const kp = modo === 'pao' ? suave(clamp01(p * 1.3)) : 1;
  const kn = modo === 'notas' ? suave(clamp01(p * 1.3)) : modo === 'pao' ? 0 : 1;
  const preco = Math.round(lerp(10, 18, kp));
  const dinheiro = Math.round(lerp(10, 14, kn));
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[10, 0.1, 8]} cor="#ece6d8" map={tex('co-piso-pad', 128, 128, (g) => {
        g.fillStyle = '#f4efe2';
        g.fillRect(0, 0, 128, 128);
        g.fillStyle = '#b8543a';
        g.fillRect(0, 0, 64, 64);
        g.fillRect(64, 64, 64, 64);
      }, [10, 8])} />
      <Caixa pos={[0, 1.6, -2.6]} tam={[10, 3.2, 0.2]} cor="#f4f1ea" map={texAzulejo('#3f8f9a', [40, 13])} />
      <Letreiro pos={[0, 2.75, -2.48]} larg={3.2} alt={0.6} linhas={['PÃO QUENTINHO']} fundo="#b8543a" cor="#fff2c0" />
      {/* prateleira de pães atrás e o padeiro */}
      <group position={[0, 0, -2.2]}>
        {[1.1, 1.6, 2.1].map((y) => (<Caixa key={y} pos={[0, y, 0]} tam={[3.6, 0.04, 0.5]} cor="#8b5a3c" />))}
        {[1.1, 1.6, 2.1].map((y) => Array.from({length: 12}).map((_, i) => (<PaoFrances key={y + ':' + i} pos={[-1.6 + i * 0.29, y + 0.06, (i % 2) * 0.12 - 0.06]} rotY={i * 0.4} esc={1.2} />)))}
      </group>
      <Boneco pos={[1.9, 0, -1.6]} rotY={-0.2} t={t} v={PADEIRO} esc={0.92} acao="fala" expressao="serio" />
      {/* balcão com vitrine, registradora e balança */}
      <Caixa pos={[0, 0.5, -0.4]} tam={[4.4, 1.0, 0.8]} cor="#f4f0e6" map={texAzulejo('#b8543a', [18, 4])} />
      <Caixa pos={[0, 1.02, -0.4]} tam={[4.5, 0.05, 0.85]} cor="#6a6560" map={texGranito([2, 1])} />
      <mesh position={[-1.75, 1.25, -0.15]}><boxGeometry args={[0.8, 0.4, 0.02]} /><meshStandardMaterial color="#cfeeff" transparent opacity={0.25} /></mesh>
      <group position={[1.7, 1.05, -0.5]}>
        <Caixa pos={[0, 0.14, 0]} tam={[0.42, 0.28, 0.4]} cor="#c9c4b8" />
        <Caixa pos={[0, 0.32, -0.1]} tam={[0.3, 0.12, 0.12]} cor="#2b2f36" />
        {Array.from({length: 12}).map((_, i) => (<Cil key={i} pos={[-0.12 + (i % 4) * 0.08, 0.3, 0.1 - Math.floor(i / 4) * 0.06]} r={0.018} h={0.04} cor="#f4f0e6" />))}
      </group>
      {/* à esquerda: o pão no prato com a placa do preço (10 -> 18) */}
      <group position={[-0.7, 1.045, -0.35]}>
        <Cil pos={[0, 0.01, 0]} r={0.2} h={0.02} cor="#ffffff" />
        <PaoFrances pos={[0, 0.06, 0]} esc={1.6 + 0.6 * kp} rotY={0.3} />
        <Placa pos={[0, 0.34, -0.12]} larg={0.36} alt={0.22} txt={String(preco)} fundo={preco > 10 ? '#fff27a' : '#fbf7ec'} cor={preco > 10 ? '#c62f2f' : '#1d1b26'} />
        <Placa pos={[0, 0.5, -0.12]} larg={0.36} alt={0.1} txt="O PÃO" fundo="#b8543a" cor="#ffffff" />
      </group>
      {/* à direita: a pilha de cédulas presas (10 -> 14) */}
      <group position={[0.55, 1.045, -0.35]}>
        {Array.from({length: dinheiro}).map((_, i) => (<Maco key={i} pos={[0, i * 0.018, 0]} rotY={0.05 * (i % 3)} n={12} cor={NCZ} valor="NCz$" />))}
        <Placa pos={[0, 0.42, -0.12]} larg={0.36} alt={0.22} txt={String(dinheiro)} fundo={dinheiro > 10 ? '#cfe8ff' : '#fbf7ec'} cor="#1f3f8a" />
        <Placa pos={[0, 0.58, -0.12]} larg={0.36} alt={0.1} txt="SEU DINHEIRO" fundo="#1f3f8a" cor="#ffffff" />
      </group>
      {/* clientes no balcão */}
      <Boneco pos={[-2.1, 0, 0.3]} rotY={Math.PI * 0.75} t={t + 2} v={povo(51)} esc={0.9} acao="aponta" expressao="espanto" />
      <Boneco pos={[2.4, 0, 0.3]} rotY={Math.PI * 1.25} t={t + 3} v={povo(52)} esc={0.88} acao="parado" expressao="bravo" />
      <Letreiro pos={[-3.2, 2.0, -2.48]} larg={1.2} alt={0.6} linhas={['LEITE', 'PÃO · CAFÉ']} fundo="#fbf7ec" cor="#2f6a5a" />
      <Relogio pos={[3.3, 2.4, -2.48]} r={0.25} />
    </group>
  );
};

// ======================= 10. O TRIBUNAL, 36 ANOS DEPOIS =======================
const Processos: React.FC<{pos: V3; n: number; rotY?: number}> = ({pos, n, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {Array.from({length: n}).map((_, i) => (
      <Caixa key={i} pos={[Math.sin(i * 1.3) * 0.02, 0.03 + i * 0.06, Math.cos(i * 0.7) * 0.02]} rot={[0, Math.sin(i) * 0.12, 0]} tam={[0.34, 0.055, 0.25]} cor={['#e9d8a6', '#d9c6a0', '#c9d6e0', '#f2ecdf'][i % 4]} />
    ))}
    {Array.from({length: Math.floor(n / 3)}).map((_, i) => (<Caixa key={'f' + i} pos={[0.172, 0.06 + i * 0.18, 0]} tam={[0.006, 0.02, 0.2]} cor="#c62f2f" sombra={false} />))}
  </group>
);
const Tribunal: React.FC<{t: number; p: number}> = ({t, p}) => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[16, 0.1, 14]} cor="#c9c0b0" map={texGranito([8, 7])} />
    <Caixa pos={[0, 0.0, 0]} tam={[6, 0.012, 9]} cor="#8a2a2a" />
    <Caixa pos={[0, 3.0, -6]} tam={[16, 6, 0.3]} cor="#efe9dc" map={texReboco('#efe9dc', [8, 3])} />
    {/* colunas */}
    {[-6.5, -3.5, 3.5, 6.5].map((x) => [-5.2, -1, 3].map((z) => (<group key={x + ':' + z}><Cil pos={[x, 2.8, z]} r={0.32} h={5.6} cor="#f4f0e6" seg={16} /><Caixa pos={[x, 5.65, z]} tam={[0.9, 0.2, 0.9]} cor="#e9e4d8" /><Caixa pos={[x, 0.1, z]} tam={[0.9, 0.2, 0.9]} cor="#e9e4d8" /></group>)))}
    {/* bancada dos juízes em arco, com cadeiras de espaldar alto */}
    <group position={[0, 0, -4.2]}>
      <Caixa pos={[0, 0.2, 0]} tam={[8, 0.4, 2.4]} cor="#6b3e26" map={texMadeira('#6b3e26', [4, 1])} />
      {Array.from({length: 9}).map((_, i) => {
        const a = ((i - 4) / 4) * 0.55;
        const x = Math.sin(a) * 4.2, z = 1.2 - Math.cos(a) * 1.6;
        return (
          <group key={i} position={[x, 0.4, z]} rotation={[0, -a, 0]}>
            <Caixa pos={[0, 0.5, 0.45]} tam={[0.85, 1.0, 0.1]} cor="#5a3420" map={texMadeira('#5a3420', [1, 1])} />
            <Caixa pos={[0, 0.98, 0.5]} tam={[0.9, 0.05, 0.4]} cor="#6a4430" />
            <Caixa pos={[0, 0.9, -0.15]} tam={[0.55, 1.6, 0.12]} cor="#2b2b30" />
            <Processos pos={[0.25, 1.0, 0.55]} n={2 + (i % 3)} />
          </group>
        );
      })}
      <mesh position={[0, 3.9, -1.65]}>
        <circleGeometry args={[0.7, 32]} />
        <meshStandardMaterial color="#c9a24a" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* balança da justiça (símbolo genérico) */}
      <group position={[0, 3.9, -1.6]}>
        <Barra a={[0, -0.45, 0.02]} b={[0, 0.45, 0.02]} r={0.025} cor="#6b4a1f" />
        <Barra a={[-0.45, 0.35, 0.02]} b={[0.45, 0.35, 0.02]} r={0.02} cor="#6b4a1f" />
        {[-1, 1].map((s) => (<Cil key={s} pos={[s * 0.42, 0.05, 0.05]} r={0.13} r2={0.06} h={0.06} cor="#6b4a1f" />))}
      </group>
    </group>
    {/* mesas dos advogados com pilhas de processos (crescem com o tempo) */}
    {[-1.8, 1.8].map((x, j) => (
      <group key={x} position={[x, 0, -0.6]}>
        <Caixa pos={[0, 0.76, 0]} tam={[2.2, 0.06, 0.9]} cor="#7a4a2a" map={texMadeira('#7a4a2a', [2, 1])} />
        {[-1, 1].map((s) => (<Caixa key={s} pos={[s * 1.0, 0.38, 0]} tam={[0.08, 0.76, 0.8]} cor="#6b3e26" />))}
        {[-0.7, -0.2, 0.35, 0.8].map((dx, i) => (<Processos key={dx} pos={[dx, 0.79, (i % 2) * 0.1]} n={Math.round(lerp(4, 12 + ((i + j) % 3) * 3, clamp01(p + 0.3)))} rotY={i * 0.3} />))}
      </group>
    ))}
    {/* bancos de espera com poupadores idosos */}
    {[1.6, 3.2].map((z, j) => (
      <group key={z}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 3.0, 0, z]}>
            <Caixa pos={[0, 0.45, 0]} tam={[3.4, 0.06, 0.5]} cor="#6b3e26" />
            <Caixa pos={[0, 0.8, 0.24]} tam={[3.4, 0.6, 0.05]} cor="#6b3e26" />
            {[-1.2, 0, 1.2].map((dx, i) => (<Sentado key={dx} pos={[dx, 0.45, -0.02]} rotY={Math.PI} roupa={ROUPAS_90[(i + j * 3 + (s > 0 ? 5 : 0)) % ROUPAS_90.length]} pele={PELES[(i + j) % PELES.length]} cabelo="#d9d9d9" bracos={0.3} esc={0.9} />))}
          </group>
        ))}
      </group>
    ))}
    <Boneco pos={[0.3, 0, 2.4]} rotY={Math.PI} t={t} v={{...povo(61), vovo: true, cabelo: '#e0e0e0'}} esc={0.88} ferramenta="bengala" acao="parado" expressao="bravo" />
    <Letreiro pos={[-1.6, 3.3, -5.82]} larg={2.2} alt={0.7} linhas={['PLANOS', 'ECONÔMICOS']} fundo="#1d2a3a" cor="#ffd23f" />
    <Calendario pos={[5.2, 2.6, -5.82]} esc={1.8} mapa={texCalendario('MAIO', '2025', 4, 31, [], 23)} />
  </group>
);

// ======================= registro dos sets e câmeras =======================
const CEU_TARDE: [string, string] = ['#f2a65a', '#ffe2b0'];
const CEU_DIA: [string, string] = ['#6fbcf2', '#fdf0d8'];
const CEU_DENTRO: [string, string] = ['#3a3440', '#6a5e58'];
const CEU_COFRE: [string, string] = ['#3a4656', '#8a95a0'];

// varanda: Seu Tostão em (-0,25; 0; 0,15), Juros no poleiro em (0,62; 1,27; 0)
const varanda = (modo: ModoVaranda, cams: Record<string, Cam>): SetRico => ({
  ceu: CEU_TARDE, luz: 'tarde', horizonte: {raio: 160}, nevoa: [40, 200],
  render: ({t, p}) => <Varanda t={t} p={p} modo={modo} />,
  cams,
});

export const SETS_COLLOR: Record<string, SetRico> = {
  covaranda: {
    ...varanda('abre', {
      // abertura: plano a dois, empurrando devagar (Seu Tostão acena, Juros no poleiro)
      abre: cam([0.8, 1.5, 4.5], [0.5, 1.42, 3.8], [0.05, 1.0, 0.05], 40),
    }),
  },
  covarandabravo: varanda('bravo', {
    // "Aí veio a regra": close no rosto franzido
    bravo: orbita([-0.25, 1.25, 0.2], -18, 4, 2.6, 2.2, 38, 10),
  }),
  covarandajuros: varanda('juros', {
    // "Juros! Cem bilhões!": close no papagaio de bico aberto, Seu Tostão espantado desfocado ao lado
    juros: cam([1.55, 1.75, 2.7], [1.42, 1.72, 2.35], [0.78, 1.6, 0.0], 40),
  }),
  covarandaaponta: varanda('aponta', {
    // "Só que a surpresa veio na volta": baixo, em 3/4, com leve giro
    aponta: orbita([-0.1, 1.1, 0.1], 26, 3, 4.3, 3.7, 40, -10),
  }),
  covarandalicao: varanda('licao', {
    // a lição: médio frontal, moeda girando na frente dele
    licao: orbita([-0.05, 1.1, 0.2], -6, 6, 3.4, 2.9, 40, 8),
  }),
  covarandapergunta: varanda('pergunta', {
    // a pergunta: ele aponta para a câmera
    pergunta: orbita([-0.1, 1.15, 0.2], 4, 3, 2.9, 2.5, 40, -6),
  }),
  covarandafecho: varanda('fecho', {
    // fecho: a câmera sobe e se afasta mostrando a varanda, a rua e o pôr do sol
    fecho: cam([0.4, 1.4, 2.6], [0.9, 3.0, 7.2], [0.1, 1.1, 0.0], 42, [0.1, 1.3, -0.5]),
  }),
  coagencia: {
    ceu: CEU_DENTRO, luz: 'interior', nevoa: [30, 90],
    render: ({t, p}) => <Agencia t={t} p={p} modo="fechada" expressao="serio" acaoTostao="parado" />,
    cams: {
      // banco vazio, de porta fechada: o Seu Tostão (mais novo) atrás do vidro do caixa 2
      balcao: cam([-0.4, 1.7, 0.6], [-0.75, 1.66, 0.1], [-1.25, 1.5, -3.3], 40, [-1.25, 1.5, -3.4]),
      // a porta de vidro com o cartaz do feriado bancário, a corrente e o calendário de março de 1990
      porta: cam([0.0, 1.7, 1.0], [0.2, 1.65, 1.6], [0.1, 1.45, 5.0], 48, [0.3, 1.45, 5.0]),
    },
  },
  cobalcao: {
    ceu: CEU_DENTRO, luz: 'interior', nevoa: [30, 90],
    render: ({t, p}) => <Agencia t={t} p={p} modo="cheia" expressao="espanto" acaoTostao="fala" />,
    cams: {
      // a caderneta de poupança aberta no balcão, carimbada "BLOQUEADO"
      caderneta: cam([-0.45, 1.8, -1.45], [-0.6, 1.7, -1.6], [-1.2, 1.16, -2.27], 42),
      // por cima do ombro do cliente: o Seu Tostão do outro lado do vidro, com o maço curto
      guiche: cam([0.15, 1.6, -0.2], [-0.05, 1.57, -0.5], [-1.2, 1.3, -3.3], 40),
      // segunda-feira: a agência lotada, fila serpenteando até a porta
      fila: cam([6.2, 3.4, 4.4], [5.4, 3.1, 3.9], [-1.0, 0.9, -0.8], 50, [-1.4, 0.9, -1.2]),
    },
  },
  cosala: {
    ceu: CEU_DENTRO, luz: 'interior', nevoa: [20, 60],
    render: ({t}) => <Sala t={t} />,
    cams: {
      // por cima da família no sofá: a TV de tubo com o anúncio, o calendário com o 16 circulado
      tv: cam([-0.05, 2.2, 2.7], [-0.05, 2.1, 2.2], [0.1, 0.9, -2.0], 42, [0.1, 0.85, -2.0]),
    },
  },
  copreco: {
    ceu: CEU_DENTRO, luz: 'interior', nevoa: [20, 70],
    render: ({t, p}) => <Mercado t={t} p={p} />,
    cams: {
      // o corredor com o remarcador e a cliente espantada
      gondola: cam([-3.4, 1.8, 0.4], [-2.9, 1.7, 0.3], [0.3, 1.0, -1.2], 44, [0.5, 1.0, -1.25]),
    },
  },
  copreco2: {
    ceu: CEU_DENTRO, luz: 'interior', nevoa: [20, 70],
    render: ({t, p}) => <Mercado t={t} p={p} close />,
    cams: {
      // close na beira da prateleira: etiqueta em cima de etiqueta
      etiqueta: cam([-0.9, 1.3, -0.45], [-0.8, 1.2, -0.7], [-0.35, 0.95, -1.37], 38),
    },
  },
  cocofre: {
    ceu: CEU_COFRE, luz: 'interior', nevoa: [30, 90],
    render: ({t, p}) => <Cofre t={t} p={p} modo="preso" />,
    cams: {
      // gancho: o cadeado gigante na grade, o dinheiro preso atrás
      cadeado: cam([1.2, 1.9, 4.6], [0.8, 1.75, 3.8], [0, 1.1, 0.6], 42, [0, 1.05, 0.4]),
      // entrando no cofre pela porta redonda
      porta: cam([-1.6, 3.3, 7.4], [-1.0, 3.1, 6.4], [0.2, 2.1, -3.0], 44),
      // a folhinha virando os 18 meses
      calendario: cam([-2.1, 1.75, 4.6], [-2.4, 1.7, 4.2], [-4.82, 1.55, 2.6], 42),
      // de cima: a montanha de dinheiro crescendo atrás da grade
      monte: orbita([0, 0.9, -1.2], 20, 30, 7.4, 6.0, 46, 10),
    },
  },
  cocofrevolta: {
    ceu: CEU_COFRE, luz: 'interior', nevoa: [30, 90],
    render: ({t, p}) => <Cofre t={t} p={p} modo="volta" />,
    cams: {
      // o portão abre e o dinheiro sai em parcelas pela esteira
      volta: cam([-2.4, 2.4, 6.6], [-1.8, 2.2, 5.9], [0.1, 0.9, 2.2], 46),
    },
  },
  cocarimbo: {
    ceu: CEU_DENTRO, luz: 'interior', nevoa: [15, 50],
    render: ({t, p}) => <MesaCaixa t={t} p={p} modo="notas" />,
    cams: {
      // close nas cédulas genéricas de cruzado novo na mesa do caixa
      notas: cam([-0.15, 1.3, 0.95], [-0.25, 1.26, 0.75], [-0.3, 0.8, -0.1], 40),
    },
  },
  cocarimboreal: {
    ceu: CEU_DENTRO, luz: 'interior', nevoa: [15, 50],
    render: ({t, p}) => <MesaCaixa t={t} p={p} modo="real" />,
    cams: {
      // as cédulas encolhem e o maço de "reais de hoje" cresce ao lado
      real: cam([0.95, 1.75, 1.45], [0.8, 1.65, 1.2], [0.2, 1.15, 0.1], 40),
    },
  },
  cofila: {
    ceu: CEU_DIA, luz: 'dia', horizonte: {raio: 200}, nevoa: [60, 240],
    render: ({t}) => <RuaFila t={t} />,
    cams: {
      // drone: a fila sai da agência e dobra a esquina
      drone: cam([-5, 8.5, 8.5], [0, 8, 8], [-0.5, 0.6, -4], 46, [1.5, 0.6, -3.5]),
      // pela calçada, ao longo da fila
      rua: cam([-1.0, 2.0, -0.4], [0.6, 1.95, -0.7], [-9, 1.2, -4.0], 44, [-7, 1.2, -4.0]),
    },
  },
  cocasa: {
    ceu: CEU_DIA, luz: 'dia', horizonte: {raio: 160}, nevoa: [50, 220],
    render: ({t, p}) => <CasaParada t={t} p={p} />,
    cams: {
      // o pai com a caderneta na mão, a casa subindo atrás
      pai: cam([2.0, 1.9, 5.6], [1.6, 1.85, 5.0], [0.3, 0.55, 0.4], 44),
    },
  },
  cocasaparada: {
    ceu: CEU_DIA, luz: 'dia', horizonte: {raio: 160}, nevoa: [50, 220],
    render: ({t, p}) => <CasaParada t={t} p={p} parada />,
    cams: {
      // a obra parada: casa sem telhado, betoneira parada, pai e filho tristes
      parada: orbita([-0.05, 1.0, 1.4], 2, 15, 6.4, 5.6, 44, -6),
    },
  },
  copao: {
    ceu: CEU_DENTRO, luz: 'interior', nevoa: [15, 60],
    render: ({t, p}) => <Padaria t={t} p={p} modo="pao" />,
    cams: {
      pao: cam([-0.4, 1.55, 1.25], [-0.5, 1.48, 1.0], [-0.7, 1.3, -0.35], 40),
    },
  },
  copaonotas: {
    ceu: CEU_DENTRO, luz: 'interior', nevoa: [15, 60],
    render: ({t, p}) => <Padaria t={t} p={p} modo="notas" />,
    cams: {
      notas: cam([1.55, 1.95, 0.55], [1.4, 1.9, 0.35], [0.5, 1.25, -0.35], 40),
    },
  },
  copaodois: {
    ceu: CEU_DENTRO, luz: 'interior', nevoa: [15, 60],
    render: ({t, p}) => <Padaria t={t} p={p} modo="dois" />,
    cams: {
      // os dois lado a lado, com o padeiro e os clientes
      dois: cam([0.0, 2.05, 3.4], [-0.05, 1.95, 2.9], [-0.07, 1.05, -0.4], 46),
    },
  },
  cojustica: {
    ceu: ['#d9d6cc', '#efe9dc'], luz: 'interior', nevoa: [25, 80],
    render: ({t, p}) => <Tribunal t={t} p={p} />,
    cams: {
      // o salão do tribunal: bancada, processos empilhados e os poupadores idosos esperando
      salao: cam([4.6, 3.0, 7.4], [2.6, 2.6, 6.6], [0, 1.2, -1.8], 46, [-0.4, 1.3, -2.2]),
    },
  },
};
void [Cil, CarroPremio];
