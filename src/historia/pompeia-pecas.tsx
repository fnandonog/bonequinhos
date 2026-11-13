// PEÇAS do "Você na História: Pompeia, 79 d.C." (só deste vídeo; não mexe no kit nem nas peças do gladiador/titanic).
// Escala real (1 unidade = 1 m), exceto a maquete regional (Regiao), onde 1 unidade = 100 m.
// Regra da barra de qualidade: nada de superfície grande de uma cor só -> chão, paredes, telhados e mar usam textura pintada em canvas.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, Caixa, Cil, Rotulo, Visual, AcaoBoneco, Expressao, Ferramenta, caixaUV} from '../v4/kit';
import {InstCor, Anfora, clamp01, lerp, rnd, suave} from './pecas';

export {clamp01, lerp, rnd, suave};

// ================= TEXTURAS =================
const TX = new Map<string, THREE.CanvasTexture>();
function tx(id: string, w: number, h: number, pinta: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c0 = TX.get(id);
  if (c0) return c0;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  pinta(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  TX.set(id, t);
  return t;
}
const manchas = (g: CanvasRenderingContext2D, w: number, h: number, n: number, cores: string[], r0: number, r1: number, seed: number, a0 = 0.15, a1 = 0.4) => {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    g.globalAlpha = a0 + r() * (a1 - a0);
    g.fillStyle = cores[Math.floor(r() * cores.length)];
    g.beginPath();
    g.ellipse(r() * w, r() * h, r0 + r() * (r1 - r0), (r0 + r() * (r1 - r0)) * (0.5 + r() * 0.6), r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
};
const poligono = (g: CanvasRenderingContext2D, cx: number, cy: number, rad: number, lados: number, r: () => number) => {
  g.beginPath();
  for (let k = 0; k < lados; k++) {
    const a = (k / lados) * Math.PI * 2 + r() * 0.5;
    const rr = rad * (0.75 + r() * 0.3);
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (k === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
};

export const T = {
  // calçamento de basalto (blocos poligonais), módulo 2 m
  basalto: () => tx('basalto', 512, 512, (g, w, h) => {
    g.fillStyle = '#2e2b29';
    g.fillRect(0, 0, w, h);
    const r = rnd(5);
    const n = 5, c = w / n;
    for (let i = -1; i <= n; i++) for (let j = -1; j <= n; j++) {
      const cx = (i + 0.5) * c + (r() - 0.5) * c * 0.2, cy = (j + 0.5) * c + (r() - 0.5) * c * 0.2;
      const s = 92 + Math.floor(r() * 42);
      g.fillStyle = `rgb(${s},${s - 5},${s - 12})`;
      poligono(g, cx, cy, c * 0.56, 6, r);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.10)';
      g.lineWidth = 3;
      g.stroke();
    }
    manchas(g, w, h, 60, ['#000000', '#ffffff'], 4, 14, 9, 0.03, 0.08);
  }),
  // calçada (terra batida com caco de telha), módulo 1 m
  calcada: () => tx('calcada', 256, 256, (g, w, h) => {
    g.fillStyle = '#b39873';
    g.fillRect(0, 0, w, h);
    manchas(g, w, h, 40, ['#9c8260', '#c9b08a'], 10, 30, 3);
    const r = rnd(4);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = ['#a0503a', '#e6dcc6', '#6d6056', '#c0703f'][Math.floor(r() * 4)];
      g.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 4);
    }
  }),
  // reboco com reboco caído (opus incertum aparecendo), rachaduras. módulo 3 m. Branco: a cor vem do material.
  muro: () => tx('muro', 512, 512, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    manchas(g, w, h, 70, ['#d8d0c0', '#f4efe6', '#c9bda8'], 12, 50, 21, 0.2, 0.5);
    const r = rnd(22);
    for (let k = 0; k < 5; k++) {
      const cx = r() * w, cy = r() * h, rx = 30 + r() * 60, ry = 20 + r() * 40;
      g.save();
      g.beginPath();
      g.ellipse(cx, cy, rx, ry, r(), 0, Math.PI * 2);
      g.clip();
      g.fillStyle = '#8f8172';
      g.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
      for (let i = 0; i < 40; i++) {
        const s = 110 + Math.floor(r() * 60);
        g.fillStyle = `rgb(${s},${s - 12},${s - 25})`;
        poligono(g, cx + (r() - 0.5) * rx * 2, cy + (r() - 0.5) * ry * 2, 9 + r() * 8, 5, r);
        g.fill();
      }
      g.restore();
    }
    g.strokeStyle = 'rgba(60,45,35,0.55)';
    g.lineWidth = 2;
    for (let k = 0; k < 4; k++) {
      let x = r() * w, y = r() * h;
      g.beginPath();
      g.moveTo(x, y);
      for (let i = 0; i < 8; i++) {
        x += (r() - 0.5) * 30;
        y += 10 + r() * 16;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  }),
  // telhas romanas (tegula + imbrex), módulo 1 m
  telha: () => tx('telha', 256, 256, (g, w, h) => {
    g.fillStyle = '#b4532f';
    g.fillRect(0, 0, w, h);
    const passo = w / 2.5;
    for (let j = 0; j < 3; j++) {
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fillRect(0, j * (h / 3) + h / 3 - 8, w, 8);
    }
    for (let i = 0; i < 3; i++) {
      const x = i * passo + passo / 2;
      g.fillStyle = '#d27548';
      g.fillRect(x - 14, 0, 28, h);
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.fillRect(x - 10, 0, 6, h);
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(x + 12, 0, 5, h);
    }
    manchas(g, w, h, 30, ['#6b3a22', '#e09060'], 6, 18, 31, 0.1, 0.25);
  }),
  // afresco pompeiano (vermelho pompeia, faixa preta, vinhetas), largura = 4 m, altura = parede inteira
  fresco: () => tx('fresco', 1024, 512, (g, w, h) => {
    g.fillStyle = '#efe4c8';
    g.fillRect(0, 0, w, h * 0.12);
    for (let x = 8; x < w; x += 22) {
      g.fillStyle = '#b8932f';
      g.beginPath();
      g.ellipse(x, h * 0.07, 6, 9, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#1d1a18';
    g.fillRect(0, h * 0.12, w, h * 0.1);
    g.strokeStyle = '#3f8a3a';
    g.lineWidth = 6;
    g.beginPath();
    for (let x = 0; x <= w; x += 8) g.lineTo(x, h * 0.17 + Math.sin(x / 40) * 10);
    g.stroke();
    for (let x = 20; x < w; x += 80) {
      g.fillStyle = '#d6282b';
      g.beginPath();
      g.arc(x, h * 0.17 + Math.sin(x / 40) * 10, 7, 0, Math.PI * 2);
      g.fill();
    }
    const y0 = h * 0.22, y1 = h * 0.8;
    g.fillStyle = '#9b2a1f';
    g.fillRect(0, y0, w, y1 - y0);
    manchas(g, w, h, 40, ['#7d1f17', '#b4392a'], 20, 60, 41, 0.12, 0.25);
    for (let k = 0; k < 2; k++) {
      const xb = k * (w / 2);
      g.fillStyle = '#1d1a18';
      g.fillRect(xb, y0, 70, y1 - y0);
      g.strokeStyle = '#e0b64a';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(xb + 35, y0 + 10);
      g.lineTo(xb + 35, y1 - 10);
      g.stroke();
      for (let y = y0 + 40; y < y1 - 20; y += 60) {
        g.beginPath();
        g.ellipse(xb + 35, y, 16, 6, 0, 0, Math.PI * 2);
        g.stroke();
      }
      g.strokeStyle = '#e0b64a';
      g.lineWidth = 4;
      g.strokeRect(xb + 100, y0 + 24, w / 2 - 130, y1 - y0 - 48);
      // vinheta central: paisagem
      const cx = xb + 70 + (w / 2 - 70) / 2, cy = (y0 + y1) / 2;
      g.save();
      g.beginPath();
      g.ellipse(cx, cy, 70, 52, 0, 0, Math.PI * 2);
      g.clip();
      g.fillStyle = '#9fc3d6';
      g.fillRect(cx - 70, cy - 52, 140, 104);
      g.fillStyle = '#6d8f55';
      g.fillRect(cx - 70, cy + 10, 140, 50);
      g.fillStyle = '#e8dcc0';
      g.fillRect(cx - 20, cy - 14, 30, 26);
      g.fillStyle = '#b4532f';
      g.beginPath();
      g.moveTo(cx - 26, cy - 14);
      g.lineTo(cx - 5, cy - 30);
      g.lineTo(cx + 16, cy - 14);
      g.fill();
      g.restore();
      g.strokeStyle = '#1d1a18';
      g.lineWidth = 5;
      g.beginPath();
      g.ellipse(cx, cy, 70, 52, 0, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = '#1d1a18';
    g.fillRect(0, y1, w, h - y1);
    const r = rnd(43);
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      g.strokeStyle = ['#4f8a4a', '#6aa35a', '#e0b64a'][i % 3];
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x, h - 6);
      g.quadraticCurveTo(x + (r() - 0.5) * 40, h - 50, x + (r() - 0.5) * 30, y1 + 14);
      g.stroke();
    }
  }),
  // travertino em lajes (fórum), módulo 4 m
  travertino: () => tx('travertino', 512, 512, (g, w, h) => {
    g.fillStyle = '#9e927c';
    g.fillRect(0, 0, w, h);
    const r = rnd(51);
    const lin = 4;
    for (let j = 0; j < lin; j++) {
      const ofs = (j % 2) * 0.5;
      for (let i = -1; i < 3; i++) {
        const s = 205 + Math.floor(r() * 30);
        g.fillStyle = `rgb(${s},${s - 10},${s - 30})`;
        g.fillRect((i + ofs) * (w / 2.5) + 3, j * (h / lin) + 3, w / 2.5 - 6, h / lin - 6);
      }
    }
    manchas(g, w, h, 90, ['#b8a888', '#f2e8d2', '#8f8470'], 2, 8, 52, 0.25, 0.5);
  }),
  // mármore picado colorido (balcão do termopólio), módulo 0,8 m
  mosaico: () => tx('mosaico', 256, 256, (g, w, h) => {
    g.fillStyle = '#ece6da';
    g.fillRect(0, 0, w, h);
    const r = rnd(61);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = ['#2f6b4f', '#8f2a24', '#d9b13a', '#6f6a66', '#c96a3a', '#3b4f7a', '#ffffff'][Math.floor(r() * 7)];
      poligono(g, r() * w, r() * h, 6 + r() * 12, 3 + Math.floor(r() * 3), r);
      g.fill();
    }
  }),
  // caneluras verticais da coluna
  canelura: () => tx('canelura', 512, 64, (g, w, h) => {
    const n = 16;
    for (let i = 0; i < n; i++) {
      const gr = g.createLinearGradient(i * (w / n), 0, (i + 1) * (w / n), 0);
      gr.addColorStop(0, '#f6efe0');
      gr.addColorStop(0.5, '#cdbf9f');
      gr.addColorStop(1, '#f6efe0');
      g.fillStyle = gr;
      g.fillRect(i * (w / n), 0, w / n, h);
    }
  }),
  // mar com marolas, módulo 20 m
  mar: () => tx('mar', 512, 512, (g, w, h) => {
    g.fillStyle = '#2b6a8c';
    g.fillRect(0, 0, w, h);
    manchas(g, w, h, 50, ['#24597a', '#3a82a6', '#1f4e6b'], 30, 90, 71, 0.2, 0.4);
    const r = rnd(72);
    g.strokeStyle = 'rgba(220,240,255,0.55)';
    g.lineWidth = 3;
    for (let i = 0; i < 70; i++) {
      const x = r() * w, y = r() * h, l = 14 + r() * 26;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + l / 2, y - 6, x + l, y);
      g.stroke();
    }
  }),
  // cinza vulcânica com pedra-pomes, módulo 2 m
  cinza: () => tx('cinza', 256, 256, (g, w, h) => {
    g.fillStyle = '#8b857c';
    g.fillRect(0, 0, w, h);
    manchas(g, w, h, 40, ['#6f6a62', '#a39d92'], 10, 30, 81, 0.2, 0.4);
    const r = rnd(82);
    for (let i = 0; i < 400; i++) {
      g.fillStyle = ['#d9d2c2', '#5a554f', '#bdb4a2'][Math.floor(r() * 3)];
      const s = 1 + r() * 5;
      g.beginPath();
      g.arc(r() * w, r() * h, s, 0, Math.PI * 2);
      g.fill();
    }
  }),
  // campos, vinhedos e oliveiras (maquete regional e encostas), módulo grande
  campo: () => tx('campo', 512, 512, (g, w, h) => {
    g.fillStyle = '#7f9a52';
    g.fillRect(0, 0, w, h);
    const r = rnd(91);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = ['#6d8a45', '#9aae62', '#b5a46a', '#5f7a3c', '#8c9a5a'][Math.floor(r() * 5)];
      const x = r() * w, y = r() * h, ww = 40 + r() * 90, hh = 30 + r() * 80;
      g.save();
      g.translate(x, y);
      g.rotate((r() - 0.5) * 0.6);
      g.fillRect(-ww / 2, -hh / 2, ww, hh);
      g.strokeStyle = 'rgba(40,60,20,0.45)';
      g.lineWidth = 2;
      for (let k = -hh / 2 + 4; k < hh / 2; k += 7) {
        g.beginPath();
        g.moveTo(-ww / 2, k);
        g.lineTo(ww / 2, k);
        g.stroke();
      }
      g.restore();
    }
    manchas(g, w, h, 120, ['#3f5a2a', '#2f4a22'], 3, 7, 92, 0.5, 0.8);
  }),
  // areia de praia, módulo 3 m
  areia: () => tx('areia', 256, 256, (g, w, h) => {
    g.fillStyle = '#b9a17a';
    g.fillRect(0, 0, w, h);
    manchas(g, w, h, 50, ['#a08860', '#d0bb92', '#8a8074'], 8, 26, 101, 0.2, 0.4);
    const r = rnd(102);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = r() > 0.5 ? '#6f6a62' : '#e2d4b4';
      g.fillRect(r() * w, r() * h, 2, 2);
    }
  }),
  // corte estratigráfico (terra / pomes branca / cinza escura em camadas / terra com grama), u 1 m, v = altura toda
  estratos: () => tx('estratos', 256, 512, (g, w, h) => {
    const faixas: [number, string][] = [[0.0, '#4d6b33'], [0.04, '#6b5136'], [0.2, '#4a4540'], [0.27, '#6c6660'], [0.33, '#3e3a36'], [0.4, '#77716a'], [0.48, '#d9d2c2'], [0.92, '#7a5b3c']];
    faixas.forEach(([y, c], i) => {
      g.fillStyle = c;
      const y1 = i + 1 < faixas.length ? faixas[i + 1][0] : 1;
      g.fillRect(0, y * h, w, (y1 - y) * h + 1);
    });
    const r = rnd(111);
    for (let i = 0; i < 500; i++) {
      const y = 0.48 + r() * 0.44;
      g.fillStyle = r() > 0.4 ? '#f2ede2' : '#a8a092';
      g.beginPath();
      g.arc(r() * w, y * h, 1.5 + r() * 3.5, 0, Math.PI * 2);
      g.fill();
    }
    manchas(g, w, h * 0.45, 30, ['#2e2b28', '#8a847c'], 4, 12, 112, 0.2, 0.4);
  }),
  // madeira, módulo 1 m
  madeira: () => tx('madeira', 256, 256, (g, w, h) => {
    g.fillStyle = '#7a5032';
    g.fillRect(0, 0, w, h);
    const r = rnd(121);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(0, i * (h / 6), w, 3);
    }
    g.strokeStyle = 'rgba(40,20,10,0.35)';
    for (let i = 0; i < 40; i++) {
      const y = r() * h;
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 10, w * 0.7, y + (r() - 0.5) * 10, w, y);
      g.stroke();
    }
  }),
  // pano listrado (vela, toldo), módulo 2 m
  listras: (a: string, b: string) => tx('listras' + a + b, 256, 256, (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? a : b;
      g.fillRect(i * (w / 8), 0, w / 8, h);
    }
    manchas(g, w, h, 20, ['#000000'], 10, 30, 131, 0.04, 0.1);
  }),
  // ladrilho de mosaico preto e branco (piso das casas), módulo 2 m
  piso: () => tx('piso', 256, 256, (g, w, h) => {
    g.fillStyle = '#e6dfd0';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#26221f';
    const n = 8;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if ((i + j) % 2 === 0) continue;
      g.beginPath();
      g.moveTo((i + 0.5) * (w / n), j * (h / n) + 3);
      g.lineTo((i + 1) * (w / n) - 3, (j + 0.5) * (h / n));
      g.lineTo((i + 0.5) * (w / n), (j + 1) * (h / n) - 3);
      g.lineTo(i * (w / n) + 3, (j + 0.5) * (h / n));
      g.fill();
    }
    g.strokeStyle = '#8f2a24';
    g.lineWidth = 6;
    g.strokeRect(6, 6, w - 12, h - 12);
  }),
  // mosaico "CAVE CANEM" (cuidado com o cão), da Casa do Poeta Trágico
  caveCanem: () => tx('cavecanem', 512, 512, (g, w, h) => {
    g.fillStyle = '#ece6d6';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#26221f';
    g.lineWidth = 18;
    g.strokeRect(20, 20, w - 40, h - 40);
    g.fillStyle = '#26221f';
    g.beginPath();
    g.ellipse(250, 250, 140, 60, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(390, 190, 55, 45, -0.3, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(420, 150);
    g.lineTo(445, 95);
    g.lineTo(455, 160);
    g.fill();
    [[150, 300], [190, 300], [300, 300], [340, 300]].forEach(([x, y]) => g.fillRect(x, y, 18, 90));
    g.lineWidth = 12;
    g.beginPath();
    g.moveTo(115, 240);
    g.quadraticCurveTo(70, 190, 90, 140);
    g.stroke();
    g.strokeStyle = '#b4392a';
    g.lineWidth = 10;
    g.beginPath();
    g.arc(370, 225, 40, 0.3, 2.4);
    g.stroke();
    g.fillStyle = '#26221f';
    g.font = 'bold 64px serif';
    g.textAlign = 'center';
    g.fillText('CAVE CANEM', w / 2, 460);
    g.strokeStyle = 'rgba(0,0,0,0.08)';
    g.lineWidth = 1;
    for (let i = 0; i < w; i += 8) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, h);
      g.stroke();
      g.beginPath();
      g.moveTo(0, i);
      g.lineTo(w, i);
      g.stroke();
    }
  }),
  // pintura eleitoral vermelha nas fachadas (programmata), fundo transparente
  letreiro: (texto: string) => tx('let' + texto, 512, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#a3271c';
    g.font = 'bold 66px serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(texto, w / 2, h / 2 + 4);
  }),
  // tabuinha de cera escrita / papiro
  escrita: (fundo: string, tinta: string, id: string) => tx('esc' + id, 256, 256, (g, w, h) => {
    g.fillStyle = fundo;
    g.fillRect(0, 0, w, h);
    manchas(g, w, h, 20, ['#000000', '#ffffff'], 10, 30, 141, 0.04, 0.08);
    const r = rnd(142);
    g.strokeStyle = tinta;
    g.lineWidth = 3;
    for (let y = 30; y < h - 20; y += 22) {
      let x = 20;
      g.beginPath();
      g.moveTo(x, y);
      while (x < w - 30) {
        const l = 8 + r() * 22;
        for (let k = 0; k < l; k += 4) g.lineTo(x + k, y + (r() - 0.5) * 8);
        x += l + 8;
        g.moveTo(x, y);
      }
      g.stroke();
    }
  }),
};

// ================= PRIMITIVAS COM TEXTURA =================
export const TBox: React.FC<{pos?: V3; rot?: V3; tam: V3; map: THREE.Texture; mod?: [number, number]; cor?: string; sombra?: boolean; emissivo?: string}> = ({pos = [0, 0, 0], rot = [0, 0, 0], tam, map, mod = [2, 2], cor = '#ffffff', sombra = true, emissivo}) => {
  const geo = useMemo(() => caixaUV(tam[0], tam[1], tam[2], mod[0], mod[1]), [tam[0], tam[1], tam[2], mod[0], mod[1]]);
  return (
    <mesh geometry={geo} position={pos} rotation={rot} castShadow={sombra} receiveShadow>
      <meshStandardMaterial map={map} color={cor} roughness={0.92} emissive={emissivo ?? '#000000'} />
    </mesh>
  );
};

export const Chao: React.FC<{tam: [number, number]; pos?: V3; map: THREE.Texture; mod: number; cor?: string; rot?: number}> = ({tam, pos = [0, 0, 0], map, mod, cor = '#ffffff', rot = 0}) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(tam[0], tam[1]);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * tam[0]) / mod, (uv.getY(i) * tam[1]) / mod);
    return g;
  }, [tam[0], tam[1], mod]);
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, rot]} position={pos} receiveShadow>
      <meshStandardMaterial map={map} color={cor} roughness={0.95} />
    </mesh>
  );
};

// ================= GENTE =================
const PELES = ['#ffd2ad', '#e8b892', '#c98e62', '#f2c9a4', '#8d5a3b'];
const CABELOS = ['#3b2a20', '#1d1b26', '#6b4a2a', '#2a2020', '#8a8078'];
const TUNICAS = ['#d9c9a3', '#7a8fa8', '#9a6b4a', '#c9a64a', '#6f8a5a', '#b85c4a', '#e3dccb', '#5f6f8f'];
// o Zé: túnica vermelho-tijolo com cinto, pernas de fora, sandálias
export const ZE: Visual = {camisa: '#c4502c', calca: '#ffd2ad', colete: null, capacete: null, cabelo: '#3b2a20'};
export const povo = (i: number): Visual => {
  const pele = PELES[i % PELES.length];
  return {camisa: TUNICAS[i % TUNICAS.length], calca: pele, pele, colete: null, capacete: null, cabelo: CABELOS[(i * 3) % CABELOS.length]};
};
export const PLINIO_VELHO: Visual = {camisa: '#efe8d8', calca: '#e8c8a0', colete: null, capacete: null, toga: '#7a3a8a', cabelo: '#c8c8c8', pele: '#e8c8a0'};
export const PLINIO_JOVEM: Visual = {camisa: '#efe8d8', calca: '#ffd2ad', colete: null, capacete: null, toga: '#f2ecdf', cabelo: '#4a3020'};
export const ARQUEOLOGA: Visual = {camisa: '#c9b48a', calca: '#5a5a4a', colete: '#ff8a1f', capacete: '#ffffff', pele: '#c98e62', cabelo: '#1d1b26'};
export const turista = (i: number): Visual => ({camisa: ['#ff5d73', '#4f8cff', '#ffd23f', '#2fbf71', '#ffffff', '#ff8a1f'][i % 6], calca: ['#30406b', '#e9e1cf', '#2b2233'][i % 3], colete: null, capacete: null, pele: PELES[i % PELES.length], cabelo: CABELOS[i % CABELOS.length], bone: i % 2 ? ['#ffffff', '#ff5d73', '#4f8cff'][i % 3] : undefined});
export const BRONZE: Visual = {camisa: '#6d5a3a', calca: '#6d5a3a', pele: '#7a6440', cabelo: '#5a4a30', colete: null, capacete: null, toga: '#6d5a3a'};

// pessoa de túnica (Zé 2.0 com saia da túnica e cinto; travesseiro amarrado na cabeça na chuva de pedra-pomes)
export const Pessoa: React.FC<{pos: V3; rotY?: number; acao?: AcaoBoneco; t: number; v?: Visual; esc?: number; ferramenta?: Ferramenta; tunica?: boolean; travesseiro?: boolean; expressao?: Expressao; simples?: boolean}> = ({pos, rotY = 0, acao = 'parado', t, v = ZE, esc = 0.92, ferramenta = null, tunica = true, travesseiro = false, expressao, simples}) => (
  <Boneco pos={pos} rotY={rotY} acao={acao} t={t} v={{...v, tunica: tunica && !v.toga, travesseiro}} esc={esc} ferramenta={ferramenta} expressao={expressao} simples={simples} />
);

// molde de gesso de uma vítima (deitado de lado, encolhido, braços no rosto), sem rosto
export const Molde: React.FC<{pos: V3; rotY?: number; esc?: number}> = ({pos, rotY = 0, esc = 1}) => {
  const C = '#ddd7cb';
  const m = <meshStandardMaterial color={C} roughness={1} />;
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={esc}>
      <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2 - 0.2]} castShadow>
        <capsuleGeometry args={[0.2, 0.55, 5, 16]} />
        {m}
      </mesh>
      <mesh position={[0.62, 0.26, 0.05]} castShadow>
        <sphereGeometry args={[0.2, 20, 14]} />
        {m}
      </mesh>
      <mesh position={[0.45, 0.33, 0.2]} rotation={[0.4, 0.3, 1.2]} castShadow>
        <capsuleGeometry args={[0.07, 0.36, 5, 16]} />
        {m}
      </mesh>
      <mesh position={[0.5, 0.25, -0.18]} rotation={[-0.3, 0, 1.4]} castShadow>
        <capsuleGeometry args={[0.07, 0.32, 5, 16]} />
        {m}
      </mesh>
      <mesh position={[-0.45, 0.18, 0.25]} rotation={[1.1, 0.6, 0.2]} castShadow>
        <capsuleGeometry args={[0.09, 0.42, 5, 16]} />
        {m}
      </mesh>
      <mesh position={[-0.3, 0.14, 0.45]} rotation={[0.2, 0, 1.5]} castShadow>
        <capsuleGeometry args={[0.08, 0.38, 5, 16]} />
        {m}
      </mesh>
      <mesh position={[-0.5, 0.12, -0.1]} rotation={[0.9, -0.5, 0.3]} castShadow>
        <capsuleGeometry args={[0.09, 0.42, 5, 16]} />
        {m}
      </mesh>
    </group>
  );
};

// burro de moinho
export const Burro: React.FC<{pos: V3; rotY?: number; t: number}> = ({pos, rotY = 0, t}) => {
  const c = '#8a7d70';
  const sw = Math.sin(t * 6) * 0.4;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Caixa pos={[0, 0.85, 0]} tam={[0.46, 0.5, 1.1]} cor={c} />
      <Caixa pos={[0, 0.88, 0]} tam={[0.48, 0.3, 0.6]} cor="#6b4a2e" />
      {([[-0.16, 0.42], [0.16, 0.42], [-0.16, -0.42], [0.16, -0.42]] as [number, number][]).map(([x, z], i) => (
        <group key={i} position={[x, 0.65, z]} rotation={[(i % 2 ? sw : -sw) * (i < 2 ? 1 : -1), 0, 0]}>
          <Cil pos={[0, -0.3, 0]} r={0.06} h={0.62} cor={c} seg={6} />
          <Cil pos={[0, -0.6, 0]} r={0.07} h={0.08} cor="#2a2020" seg={6} />
        </group>
      ))}
      <group position={[0, 1.0, 0.55]} rotation={[0.7, 0, 0]}>
        <Caixa pos={[0, 0.2, 0]} tam={[0.22, 0.45, 0.22]} cor={c} />
        <Caixa pos={[0, 0.42, 0.18]} rot={[-1.0, 0, 0]} tam={[0.22, 0.24, 0.5]} cor={c} />
        <Caixa pos={[0, 0.25, 0.42]} rot={[-1.0, 0, 0]} tam={[0.2, 0.14, 0.14]} cor="#d8cfc2" />
        {[-1, 1].map((s) => (<Caixa key={s} pos={[s * 0.08, 0.68, 0.08]} rot={[0.2, 0, s * 0.3]} tam={[0.06, 0.24, 0.04]} cor={c} />))}
      </group>
      <Barra a={[0, 0.95, -0.55]} b={[0, 0.5, -0.7 + Math.sin(t * 3) * 0.05]} r={0.025} cor="#4a3a30" />
    </group>
  );
};

// pão romano (panis quadratus: redondo com 8 gomos)
export const PaoRomano: React.FC<{pos: V3; esc?: number; queimado?: boolean}> = ({pos, esc = 1, queimado = false}) => (
  <group position={pos} scale={esc}>
    <mesh scale={[1, 0.42, 1]} castShadow>
      <sphereGeometry args={[0.11, 20, 14]} />
      <meshStandardMaterial color={queimado ? '#2a2420' : '#c98a4a'} />
    </mesh>
    {[0, 1, 2, 3].map((k) => (
      <mesh key={k} position={[0, 0.042, 0]} rotation={[0, (k * Math.PI) / 4, 0]}>
        <boxGeometry args={[0.2, 0.012, 0.012]} />
        <meshStandardMaterial color={queimado ? '#111' : '#7a4a22'} />
      </mesh>
    ))}
  </group>
);

// fumaça/vapor subindo (loop)
export const Vapor: React.FC<{pos: V3; t: number; n?: number; esc?: number; cor?: string; alt?: number}> = ({pos, t, n = 5, esc = 1, cor = '#ffffff', alt = 0.8}) => (
  <group position={pos}>
    {Array.from({length: n}).map((_, i) => {
      const k = ((t * 0.6 + i / n) % 1);
      return (
        <mesh key={i} position={[Math.sin(i * 2.1 + t) * 0.06 * esc, k * alt * esc, Math.cos(i * 1.7) * 0.05 * esc]} scale={[(0.03 + k * 0.06) * esc, (0.06 + k * 0.12) * esc, (0.03 + k * 0.06) * esc]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color={cor} transparent opacity={0.2 * (1 - k)} depthWrite={false} roughness={1} />
        </mesh>
      );
    })}
  </group>
);

// ================= ARQUITETURA =================
export const ColunaCanelada: React.FC<{pos: V3; h?: number; r?: number; cor?: string; quebrada?: number}> = ({pos, h = 6, r = 0.4, cor = '#ffffff', quebrada = 0}) => {
  const hh = quebrada ? h * quebrada : h;
  const tex = T.canelura();
  return (
    <group position={pos}>
      <Caixa pos={[0, 0.12, 0]} tam={[r * 2.7, 0.24, r * 2.7]} cor="#e6dcc4" />
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[r * 1.02, r * 0.18, 10, 28]} />
        <meshStandardMaterial color="#e6dcc4" />
      </mesh>
      <mesh position={[0, 0.24 + (hh - (quebrada ? 0.24 : 0.9)) / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r * 0.88, r, hh - (quebrada ? 0.24 : 0.9), 24]} />
        <meshStandardMaterial map={tex} color={cor} roughness={0.85} />
      </mesh>
      {!quebrada && (
        <>
          <Cil pos={[0, h - 0.48, 0]} r={r * 1.25} r2={r * 0.9} h={0.42} cor="#e6dcc4" seg={12} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
            <mesh key={k} position={[Math.cos((k * Math.PI) / 4) * r * 1.0, h - 0.5, Math.sin((k * Math.PI) / 4) * r * 1.0]} rotation={[0, -(k * Math.PI) / 4, 0.4]}>
              <boxGeometry args={[0.04, 0.3, r * 0.5]} />
              <meshStandardMaterial color="#d9cba8" />
            </mesh>
          ))}
          <Caixa pos={[0, h - 0.13, 0]} tam={[r * 2.9, 0.26, r * 2.9]} cor="#efe6d2" />
        </>
      )}
    </group>
  );
};

// casa romana com átrio: telhado compluviado (cai para dentro, com abertura no meio), fachada com loja, porta, letreiro
export type DomusP = {pos: V3; tam: V3; rotY?: number; cor?: string; seed?: number; lojas?: number; ruina?: boolean; simples?: boolean; sacada?: boolean; letreiro?: string; faixa?: string; telhado?: boolean; teto?: number};
export const Domus: React.FC<DomusP> = ({pos, tam, rotY = 0, cor = '#e2cfa6', seed = 1, lojas = 1, ruina = false, simples = false, sacada = false, letreiro, faixa = '#8a3b2b', telhado = true, teto = 1}) => {
  const [w, h, d] = tam;
  const muro = T.muro();
  const telha = T.telha();
  const r = rnd(seed * 17 + 3);
  const e = 0.35;
  const paredes: React.ReactNode[] = [];
  const parede = (key: string, cx: number, cz: number, comp: number, alongX: boolean) => {
    if (!ruina) {
      paredes.push(<TBox key={key} pos={[cx, h / 2, cz]} tam={alongX ? [comp, h, e] : [e, h, comp]} map={muro} mod={[3, 3]} cor={cor} />);
      return;
    }
    const n = Math.max(1, Math.round(comp / 1.6));
    for (let i = 0; i < n; i++) {
      const hh = h * (0.3 + r() * 0.65);
      const o = -comp / 2 + (comp / n) * (i + 0.5);
      paredes.push(<TBox key={key + i} pos={[cx + (alongX ? o : 0), hh / 2, cz + (alongX ? 0 : o)]} tam={alongX ? [comp / n + 0.01, hh, e] : [e, hh, comp / n + 0.01]} map={muro} mod={[3, 3]} cor={cor} />);
    }
  };
  parede('f', 0, d / 2 - e / 2, w, true);
  parede('b', 0, -d / 2 + e / 2, w, true);
  parede('l', -w / 2 + e / 2, 0, d - 2 * e, false);
  parede('r', w / 2 - e / 2, 0, d - 2 * e, false);
  if (ruina) {
    parede('i1', 0, -d * 0.12, w - 2 * e, true);
    parede('i2', -w * 0.18, d * 0.2, d * 0.5, false);
  }
  // abertura da fachada
  const fz = d / 2 + 0.03;
  const slots: number[] = [];
  const nl = Math.min(lojas, Math.floor((w - 2) / 3));
  for (let k = 0; k < nl; k++) slots.push(-w / 2 + 1.6 + k * 3.0);
  const xPorta = nl > 0 ? Math.min(w / 2 - 1.2, slots[slots.length - 1] + 2.8) : 0;
  const ow = w * 0.32, od = d * 0.32, ex = 0.45, inc = 0.28;
  const Df = d / 2 + ex - od / 2, Ds = w / 2 + ex - ow / 2;
  const yS = (L: number) => h * teto + 0.05 - (L / 2) * Math.sin(inc);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {paredes}
      {!simples && (
        <>
          <Caixa pos={[0, 0.45, fz]} tam={[w, 0.9, 0.04]} cor={faixa} sombra={false} />
          <Caixa pos={[0, h - 0.18, fz + 0.04]} tam={[w + 0.1, 0.22, 0.12]} cor="#e9dfc8" sombra={false} />
          {slots.map((x, k) => (
            <group key={k} position={[x, 0, fz]}>
              <Caixa pos={[0, 1.35, 0.01]} tam={[2.3, 2.7, 0.04]} cor="#21170f" sombra={false} />
              <Caixa pos={[0, 2.75, 0.03]} tam={[2.6, 0.18, 0.12]} cor="#6b4a2e" />
              {[0, 1, 2].map((i) => (<Caixa key={i} pos={[-0.95 + i * 0.27, 1.3, 0.06]} tam={[0.25, 2.6, 0.05]} cor={i % 2 ? '#7a5534' : '#6b4a2e'} />))}
              {k % 2 === 0 && <Anfora pos={[0.6, 0, 0.35]} esc={0.9} />}
            </group>
          ))}
          <group position={[xPorta, 0, fz]}>
            <Caixa pos={[0, 1.3, 0.01]} tam={[1.3, 2.6, 0.04]} cor="#1a120c" sombra={false} />
            {[-0.72, 0.72].map((x) => (<Caixa key={x} pos={[x, 1.35, 0.05]} tam={[0.16, 2.7, 0.12]} cor="#d8ccb0" />))}
            <Caixa pos={[0, 2.75, 0.05]} tam={[1.6, 0.2, 0.14]} cor="#d8ccb0" />
            <Caixa pos={[0, 0.05, 0.15]} tam={[1.6, 0.1, 0.3]} cor="#cdbd98" />
          </group>
          {h > 4.5 && [-w / 4, w / 4].map((x) => (
            <group key={x} position={[x, h * 0.78, fz]}>
              <Caixa pos={[0, 0, 0.01]} tam={[0.6, 0.55, 0.04]} cor="#1a120c" sombra={false} />
              {[-0.15, 0, 0.15].map((dx) => (<Caixa key={dx} pos={[dx, 0, 0.04]} tam={[0.04, 0.55, 0.04]} cor="#6b4a2e" sombra={false} />))}
            </group>
          ))}
          {letreiro && (
            <mesh position={[nl > 0 ? slots[0] + 1.5 : -w / 4, 2.25, fz + 0.03]}>
              <planeGeometry args={[2.4, 0.6]} />
              <meshBasicMaterial map={T.letreiro(letreiro)} transparent depthWrite={false} />
            </mesh>
          )}
          {sacada && !ruina && (
            <group position={[0, 3.4, d / 2 + 0.5]}>
              <TBox pos={[0, 0, 0]} tam={[w * 0.6, 0.14, 1.0]} map={T.madeira()} mod={[1, 1]} />
              {[-1, 1].map((s) => (<Cil key={s} pos={[s * w * 0.28, -1.65, 0.4]} r={0.07} h={3.3} cor="#6b4a2e" />))}
              <Caixa pos={[0, 0.5, 0.48]} tam={[w * 0.6, 0.06, 0.06]} cor="#6b4a2e" />
              {Array.from({length: Math.floor(w * 0.6 / 0.3)}).map((_, i) => (<Caixa key={i} pos={[-w * 0.3 + 0.15 + i * 0.3, 0.25, 0.48]} tam={[0.04, 0.5, 0.04]} cor="#7a5534" />))}
              <Caixa pos={[0, 1.6, -0.1]} tam={[w * 0.62, 0.1, 1.2]} cor="#b4532f" />
            </group>
          )}
        </>
      )}
      {ruina && <Chao tam={[w - 0.6, d - 0.6]} pos={[0, 0.03, 0]} map={T.piso()} mod={2} cor="#d8d0bd" />}
      {telhado && !ruina && (
        <>
          <TBox pos={[0, yS(Df), od / 2 + Df / 2]} rot={[-inc, 0, 0]} tam={[w + 2 * ex, 0.14, Df]} map={telha} mod={[1, 1]} />
          <TBox pos={[0, yS(Df), -od / 2 - Df / 2]} rot={[inc, 0, 0]} tam={[w + 2 * ex, 0.14, Df]} map={telha} mod={[1, 1]} />
          <TBox pos={[ow / 2 + Ds / 2, yS(Ds), 0]} rot={[0, 0, inc]} tam={[Ds, 0.14, od + 0.1]} map={telha} mod={[1, 1]} />
          <TBox pos={[-ow / 2 - Ds / 2, yS(Ds), 0]} rot={[0, 0, -inc]} tam={[Ds, 0.14, od + 0.1]} map={telha} mod={[1, 1]} />
          <Caixa pos={[0, 0.06, 0]} tam={[ow * 0.9, 0.12, od * 0.9]} cor="#4f8fb0" sombra={false} />
          <Caixa pos={[0, 0.03, 0]} tam={[w - 2 * e, 0.06, d - 2 * e]} cor="#cfc4ad" sombra={false} />
        </>
      )}
    </group>
  );
};

// chafariz público de esquina (basalto, com cabeça esculpida e bica)
export const Chafariz: React.FC<{pos: V3; rotY?: number; t: number}> = ({pos, rotY = 0, t}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <TBox pos={[0, 0.35, 0.6]} tam={[1.8, 0.7, 0.18]} map={T.basalto()} mod={[1, 1]} cor="#c8c0b8" />
    <TBox pos={[0, 0.35, -0.6]} tam={[1.8, 0.7, 0.18]} map={T.basalto()} mod={[1, 1]} cor="#c8c0b8" />
    <TBox pos={[-0.81, 0.35, 0]} tam={[0.18, 0.7, 1.2]} map={T.basalto()} mod={[1, 1]} cor="#c8c0b8" />
    <TBox pos={[0.81, 0.35, 0]} tam={[0.18, 0.7, 1.2]} map={T.basalto()} mod={[1, 1]} cor="#c8c0b8" />
    <Caixa pos={[0, 0.55, 0]} tam={[1.44, 0.04, 1.04]} cor="#4f8fb0" sombra={false} />
    <TBox pos={[0, 0.85, -0.78]} tam={[0.5, 1.7, 0.3]} map={T.basalto()} mod={[1, 1]} cor="#c8c0b8" />
    <mesh position={[0, 1.15, -0.6]}>
      <sphereGeometry args={[0.16, 20, 14]} />
      <meshStandardMaterial color="#7d766e" />
    </mesh>
    <mesh position={[0, 0.82, -0.45]} scale={[1, 1 + Math.sin(t * 20) * 0.05, 1]}>
      <cylinderGeometry args={[0.03, 0.05, 0.55, 24]} />
      <meshStandardMaterial color="#9fd3f0" transparent opacity={0.8} emissive="#3a7aa0" emissiveIntensity={0.3} />
    </mesh>
  </group>
);

// carroça de duas rodas com ânforas
export const Carroca: React.FC<{pos: V3; rotY?: number; giro?: number}> = ({pos, rotY = 0, giro = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <TBox pos={[0, 0.85, 0]} tam={[1.3, 0.25, 2.2]} map={T.madeira()} mod={[1, 1]} />
    {[-1, 1].map((s) => (<Caixa key={s} pos={[s * 0.62, 1.1, 0]} tam={[0.06, 0.35, 2.2]} cor="#6b4a2e" />))}
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 0.72, 0.55, 0]} rotation={[giro, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.5, 0.06, 10, 28]} />
          <meshStandardMaterial color="#5a3a22" />
        </mesh>
        {[0, 1, 2, 3].map((k) => (<Caixa key={k} rot={[(k * Math.PI) / 4, 0, 0]} tam={[0.05, 0.95, 0.05]} cor="#6b4a2e" />))}
      </group>
    ))}
    {[-1, 1].map((s) => (<Barra key={s} a={[s * 0.45, 0.9, 1.0]} b={[s * 0.4, 0.75, 2.8]} r={0.04} cor="#6b4a2e" />))}
    {[-0.3, 0.3].map((x, i) => (<Anfora key={i} pos={[x, 1.05, 0.5 - i * 0.8]} esc={0.9} rot={Math.PI / 2} />))}
  </group>
);

// toldo de feira
export const Barraca: React.FC<{pos: V3; rotY?: number; a?: string; seed?: number}> = ({pos, rotY = 0, a = '#b4392a', seed = 1}) => {
  const r = rnd(seed);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {([[-1, -0.7], [1, -0.7], [-1, 0.7], [1, 0.7]] as [number, number][]).map(([x, z], i) => (<Cil key={i} pos={[x, 1.1, z]} r={0.04} h={2.2} cor="#6b4a2e" />))}
      <TBox pos={[0, 2.25, 0]} rot={[0.12, 0, 0]} tam={[2.3, 0.04, 1.7]} map={T.listras(a, '#efe4c8')} mod={[2, 2]} />
      <TBox pos={[0, 0.8, 0.1]} tam={[2.0, 0.08, 1.0]} map={T.madeira()} mod={[1, 1]} />
      {Array.from({length: 9}).map((_, i) => (
        <mesh key={i} position={[-0.8 + (i % 5) * 0.4, 0.92, -0.2 + Math.floor(i / 5) * 0.5]}>
          <sphereGeometry args={[0.13, 20, 14]} />
          <meshStandardMaterial color={['#d9a43a', '#7a9a3a', '#b4392a', '#6b3a6a'][Math.floor(r() * 4)]} />
        </mesh>
      ))}
    </group>
  );
};

// ================= RUA ROMANA =================
// Rua ao longo de Z: leito de basalto com sulcos de roda, calçadas altas com meio-fio, pedras de travessia, fachadas dos dois lados.
export type RuaP = {comp?: number; larg?: number; t: number; pedras?: number[]; ladoA?: boolean; ladoB?: boolean; ruina?: boolean; pomes?: number; seed?: number; semTelhado?: boolean};
const LETREIROS = ['AED·O·V·F', 'C·IVLIVM·POLYBIVM', 'CN·HELVIVM', 'VATIA·AED', 'M·HOLCONIVM'];
const CORES_FACHADA = ['#e2cfa6', '#d9b98a', '#efe1c0', '#c99a6a', '#e6d2b0', '#d4b08a'];
export const Rua: React.FC<RuaP> = ({comp = 60, larg = 4.4, t, pedras = [0], ladoA = true, ladoB = true, ruina = false, pomes = 0, seed = 1}) => {
  const bas = T.basalto();
  const r = rnd(seed * 5 + 1);
  const fachadas = (lado: number) => {
    const out: React.ReactNode[] = [];
    let z = -comp / 2;
    let i = 0;
    while (z < comp / 2 - 4) {
      const w = 7 + Math.floor(r() * 4);
      const h = 4.2 + r() * 3;
      const d = 10;
      const x = lado * (larg / 2 + 1.5 + d / 2);
      out.push(
        <Domus key={lado + ':' + i} pos={[x, 0.4, z + w / 2]} tam={[w, h, d]} rotY={lado < 0 ? Math.PI / 2 : -Math.PI / 2} cor={CORES_FACHADA[(i + (lado > 0 ? 3 : 0)) % CORES_FACHADA.length]}
          seed={seed * 31 + i * 7 + (lado > 0 ? 100 : 0)} lojas={1 + (i % 2)} ruina={ruina} sacada={!ruina && i % 3 === 1} letreiro={i % 2 === 0 ? LETREIROS[(i + (lado > 0 ? 2 : 0)) % LETREIROS.length] : undefined}
          faixa={['#8a3b2b', '#c9a64a', '#2f4f3f'][i % 3]} />,
      );
      z += w + 0.05;
      i++;
    }
    return out;
  };
  return (
    <group>
      <TBox pos={[0, -0.05, 0]} tam={[larg, 0.1, comp]} map={bas} mod={[2, 2]} />
      {[-0.62, 0.62].map((x) => (<Caixa key={x} pos={[x, 0.004, 0]} tam={[0.13, 0.012, comp]} cor="#24211f" sombra={false} />))}
      {[-1, 1].map((s) => (
        <group key={s}>
          <TBox pos={[s * (larg / 2 + 0.75), 0.2, 0]} tam={[1.5, 0.4, comp]} map={T.calcada()} mod={[1, 1]} />
          <TBox pos={[s * (larg / 2 + 0.11), 0.21, 0]} tam={[0.22, 0.42, comp]} map={bas} mod={[1, 1]} cor="#b9b2aa" />
        </group>
      ))}
      {pedras.map((z) => [-1.25, 0, 1.25].map((x) => (
        <mesh key={z + ':' + x} position={[x, 0.2, z]} scale={[1, 1, 1.35]} castShadow receiveShadow>
          <cylinderGeometry args={[0.36, 0.4, 0.4, 24]} />
          <meshStandardMaterial color="#7a736b" roughness={0.95} />
        </mesh>
      )))}
      {ladoA && fachadas(-1)}
      {ladoB && fachadas(1)}
      {pomes > 0 && (
        <>
          <Chao tam={[larg + 3, comp]} pos={[0, pomes * 0.6, 0]} map={T.cinza()} mod={2} />
          <PomesMonte centro={[0, pomes * 0.6, 0]} area={[larg + 2.6, Math.min(comp, 24)]} n={260} alt={0.08} seed={seed + 9} />
        </>
      )}
    </group>
  );
};

// ================= VESÚVIO =================
const GEO_VES = new Map<string, THREE.BufferGeometry>();
const geoVesuvio = (moderno: boolean) => {
  const k = moderno ? 'm' : 'a';
  const c = GEO_VES.get(k);
  if (c) return c;
  const pts = (moderno
    ? [[1, 0], [0.8, 0.08], [0.6, 0.2], [0.45, 0.42], [0.36, 0.66], [0.3, 0.7], [0.22, 0.86], [0.13, 1.0], [0.08, 0.94], [0, 0.92]]
    : [[1, 0], [0.78, 0.1], [0.56, 0.26], [0.38, 0.52], [0.24, 0.8], [0.17, 0.97], [0.12, 1.0], [0.07, 0.93], [0, 0.9]]
  ).map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts, 40).toNonIndexed();
  const pos = g.attributes.position as THREE.BufferAttribute;
  const cores: number[] = [];
  const cv = new THREE.Color();
  const ruido = (x: number, y: number, z: number) => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const f = 1 + 0.07 * Math.sin(a * 9 + y * 6) * (1 - y) + (ruido(Math.round(x * 50), Math.round(y * 50), Math.round(z * 50)) - 0.5) * 0.06;
    pos.setXYZ(i, x * f, y, z * f);
  }
  for (let i = 0; i < pos.count; i += 3) {
    const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const n = ruido(pos.getX(i) * 7, y * 9, pos.getZ(i) * 5);
    if (y < 0.3) cv.set(n > 0.5 ? '#5f7a3c' : '#6f8a45');
    else if (y < 0.55) cv.set(n > 0.5 ? '#6b7040' : '#7a7a4a');
    else if (y < 0.85) cv.set(n > 0.5 ? '#6e625a' : '#7a6e64');
    else cv.set(n > 0.5 ? '#4f4842' : '#5d554e');
    for (let k = 0; k < 3; k++) cores.push(cv.r, cv.g, cv.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
  g.computeVertexNormals();
  GEO_VES.set(k, g);
  return g;
};
export const Vesuvio: React.FC<{pos: V3; R: number; H: number; moderno?: boolean; brilho?: number}> = ({pos, R, H, moderno = false, brilho = 0}) => (
  <group position={pos}>
    <mesh geometry={geoVesuvio(moderno)} scale={[R, H, R]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
    {moderno && (
      <mesh position={[-R * 0.12, H * 0.62, -R * 0.05]} scale={[R * 0.32, H * 0.28, R * 0.28]}>
        <torusGeometry args={[1, 0.35, 10, 28, Math.PI * 1.2]} />
        <meshStandardMaterial color="#6e6a5a" />
      </mesh>
    )}
    {brilho > 0 && (
      <>
        {Array.from({length: 7}).map((_, i) => {
          const a = (i / 7) * Math.PI * 2 + 0.4;
          return (
            <mesh key={i} position={[Math.cos(a) * R * 0.32, H * 0.55, Math.sin(a) * R * 0.32]} rotation={[0, -a, Math.atan2(H * 0.9, R * 0.7) - Math.PI / 2]}>
              <boxGeometry args={[R * 0.7, H * 0.03, H * 0.04]} />
              <meshStandardMaterial color="#ff5a1a" emissive="#ff4a10" emissiveIntensity={1.5 * brilho} />
            </mesh>
          );
        })}
        <pointLight position={[0, H * 1.1, 0]} color="#ff5a1a" intensity={brilho * 1.5} distance={R * 1.3} decay={1} />
      </>
    )}
  </group>
);

// coluna pliniana: tronco + copa em "pinheiro". g = quanto já subiu (0..1). colapso = quanto já desabou (0..1).
const GEO_PUFF = new THREE.IcosahedronGeometry(1, 1);
export const Pluma: React.FC<{pos: V3; H: number; R: number; g: number; t: number; colapso?: number; vento?: [number, number]; brilho?: number}> = ({pos, H, R, g, t, colapso = 0, vento = [0.4, 0.5], brilho = 1}) => {
  if (g <= 0.005) return null;
  const c = suave(colapso);
  const sobe = suave(Math.min(1, g / 0.75));
  const copa = suave(clamp01((g - 0.6) / 0.4));
  const N = 28;
  const tronco = Array.from({length: N}).map((_, i) => {
    const k = i / (N - 1);
    const y = H * 0.84 * k * sobe * (1 - c * 0.75);
    const rr = R * (0.55 + 0.9 * k) * (0.8 + 0.2 * sobe) * (1 + 0.06 * Math.sin(t * 1.3 + i));
    const cor = k < 0.1 ? '#3a2a22' : k < 0.35 ? '#5a4c42' : k < 0.65 ? (i % 2 ? '#7a6e64' : '#6a5e54') : (i % 2 ? '#958a7e' : '#a39a8e');
    const lado = (i % 3) - 1;
    return {p: [Math.sin(i * 1.7 + t * 0.4) * R * 0.18 + lado * R * 0.35 + vento[0] * R * k * 1.5, y, Math.cos(i * 1.3) * R * 0.2 + vento[1] * R * k * 1.5] as V3, s: [rr, rr * 0.9, rr] as V3, cor};
  });
  const M = 30;
  const topo = Array.from({length: M}).map((_, i) => {
    const a = (i / M) * Math.PI * 2 + i * 0.37;
    const anel = i % 3;
    const rad = H * (0.07 + anel * 0.12) * (0.3 + 0.7 * copa) * (1 + c * 0.5);
    const y = H * (0.84 + (2 - anel) * 0.05 + (i % 2) * 0.03) * (1 - c * 0.6) * sobe;
    const rr = H * (0.09 + (i % 4) * 0.015) * copa;
    const dv = H * 0.12 * copa * (anel / 2);
    return {p: [Math.cos(a) * rad + vento[0] * dv, y, Math.sin(a) * rad * 0.85 + vento[1] * dv] as V3, s: [rr * 1.3, rr * 0.6, rr * 1.3] as V3, cor: ['#a39a8e', '#8a8076', '#b8afa2', '#7d736a', '#968c80'][i % 5]};
  });
  const base = c > 0.02 ? Array.from({length: 20}).map((_, i) => {
    const a = (i / 20) * Math.PI * 2;
    const rad = R * (0.8 + c * 4) * (0.85 + (i % 3) * 0.12);
    const rr = R * (0.45 + c * 0.6) * (0.8 + (i % 4) * 0.12);
    return {p: [Math.cos(a) * rad, -H * 0.08 + rr * 0.3, Math.sin(a) * rad] as V3, s: [rr, rr * 0.7, rr] as V3, cor: ['#7a6c60', '#8e8074', '#6a5e54'][i % 3]};
  }) : [];
  return (
    <group position={pos}>
      {[...tronco, ...topo, ...base].map((q, i) => (
        <mesh key={i} geometry={GEO_PUFF} position={q.p} scale={q.s} rotation={[i, i * 2, 0]}>
          <meshStandardMaterial color={q.cor} roughness={1} emissive={i < 3 ? '#ff4a10' : '#000000'} emissiveIntensity={i < 3 ? 0.5 * brilho * (1 - c) : 0} />
        </mesh>
      ))}
      <pointLight position={[0, R * 0.6, 0]} color="#ff6a20" intensity={1.5 * brilho} distance={R * 4} decay={1} />
    </group>
  );
};

// fluxo piroclástico: nuvem de rocha e gás colada no chão, avançando para +Z; frente em z = frente
export const Fluxo: React.FC<{frente: number; larg: number; alt: number; t: number; linhas?: number; y0?: number}> = ({frente, larg, alt, t, linhas = 6, y0 = 0}) => {
  const itens: {p: V3; s: number; cor: string; brasa: boolean}[] = [];
  for (let j = 0; j < linhas; j++) {
    const nc = Math.max(3, Math.round(larg / (alt * 0.7)));
    for (let i = 0; i < nc; i++) {
      const s = alt * (0.42 + j * 0.07) * (0.85 + ((i * 7 + j * 3) % 5) * 0.06) * (1 + 0.05 * Math.sin(t * 2 + i + j));
      const x = -larg / 2 + (larg / (nc - 1)) * i + Math.sin(i * 3 + j) * alt * 0.2;
      const z = frente - j * alt * 0.55 - (i % 2) * alt * 0.2 + Math.sin(t * 3 + i) * alt * 0.04;
      itens.push({p: [x, y0 + s * 0.55 + j * alt * 0.12, z], s, cor: j === 0 ? '#8a7a6a' : ['#7a6c60', '#9a8c7c', '#6a5c50', '#a89a8a'][(i + j) % 4], brasa: j === 0 && i % 3 === 0});
    }
  }
  // "couve-flor": cada bolha ganha bolhinhas por cima (a nuvem ferve), facetadas, em tons de cinza/marrom
  const sub: {p: V3; s: number; cor: string}[] = [];
  itens.forEach((q, i) => {
    for (let k = 0; k < 3; k++) {
      const a = i * 2.4 + k * 2.1 + t * 0.6;
      const r = q.s * (0.32 + 0.08 * Math.sin(t * 2.2 + i + k));
      sub.push({p: [q.p[0] + Math.cos(a) * q.s * 0.62, q.p[1] + q.s * (0.45 + 0.12 * k), q.p[2] + Math.sin(a) * q.s * 0.55 + q.s * 0.15], s: r, cor: ['#a2958a', '#6e6158', '#8c7f73', '#b3a699'][(i + k) % 4]});
    }
  });
  // saia escura rente ao chão (a parte mais densa: rocha, cinza e gás quente), com brasas na frente
  const nb = Math.max(4, Math.round(larg / (alt * 0.45)));
  const saia = Array.from({length: nb}).map((_, i) => ({p: [-larg / 2 + (larg / (nb - 1)) * i, y0 + alt * 0.12, frente + alt * 0.12 + Math.sin(i * 1.9 + t * 4) * alt * 0.05] as V3, s: alt * (0.26 + (i % 3) * 0.04)}));
  return (
    <group>
      {itens.map((q, i) => (
        <mesh key={i} geometry={GEO_PUFF} position={q.p} scale={[q.s, q.s * 0.8, q.s]} rotation={[i, i * 0.7, 0]}>
          <meshStandardMaterial color={q.cor} roughness={1} flatShading emissive={q.brasa ? '#ff4a10' : '#000000'} emissiveIntensity={q.brasa ? 0.12 : 0} />
        </mesh>
      ))}
      {sub.map((q, i) => (
        <mesh key={'s' + i} geometry={GEO_PUFF} position={q.p} scale={[q.s, q.s * 0.85, q.s]} rotation={[i * 0.5, i, 0]}>
          <meshStandardMaterial color={q.cor} roughness={1} flatShading />
        </mesh>
      ))}
      {saia.map((q, i) => (
        <mesh key={'b' + i} geometry={GEO_PUFF} position={q.p} scale={[q.s * 1.3, q.s * 0.55, q.s]} rotation={[0, i, 0]}>
          <meshStandardMaterial color={i % 2 ? '#3a2e28' : '#4a3a30'} roughness={1} flatShading emissive="#ff4a10" emissiveIntensity={0.05 + 0.03 * Math.sin(t * 5 + i)} />
        </mesh>
      ))}
      <pointLight position={[0, y0 + alt * 0.4, frente + alt * 0.6]} color="#ff5a1a" intensity={2.5} distance={alt * 5} decay={1} />
    </group>
  );
};

// ================= PEDRA-POMES =================
const GEO_POMES = new THREE.IcosahedronGeometry(1, 0);
const CORES_POMES = ['#d8d0bf', '#bfb6a3', '#a59c8c', '#e6dfcf', '#8f877a'];
export const PomesChuva: React.FC<{t: number; centro: V3; raio: number; raioZ?: number; alt: number; n?: number; tam?: number; vel?: number; seed?: number}> = ({t, centro, raio, raioZ, alt, n = 160, tam = 0.05, vel = 6, seed = 1}) => {
  const base = useMemo(() => {
    const r = rnd(seed * 7 + 3);
    return Array.from({length: n}).map(() => [r() * 2 - 1, r(), r() * 2 - 1, 0.7 + r() * 0.6, r() * 6]);
  }, [n, seed]);
  const rz = raioZ ?? raio;
  const mats = base.map(([x, y0, z, v, a]) => {
    const y = (((y0 * alt - t * vel * v) % alt) + alt) % alt;
    const m = new THREE.Matrix4();
    const s = tam * v;
    m.compose(new THREE.Vector3(centro[0] + x * raio, centro[1] + y, centro[2] + z * rz), new THREE.Quaternion().setFromEuler(new THREE.Euler(a + t * 3, a * 2 + t * 2, 0)), new THREE.Vector3(s, s * 0.8, s));
    return m;
  });
  return <InstCor geo={GEO_POMES} mats={mats} cores={CORES_POMES} />;
};
export const PomesMonte: React.FC<{centro: V3; area: [number, number]; n: number; alt: number; seed?: number; tam?: number}> = ({centro, area, n, alt, seed = 1, tam = 0.06}) => {
  const mats = useMemo(() => {
    const r = rnd(seed * 11 + 5);
    return Array.from({length: n}).map(() => {
      const m = new THREE.Matrix4();
      const s = tam * (0.5 + r());
      m.compose(new THREE.Vector3(centro[0] + (r() - 0.5) * area[0], centro[1] + r() * alt, centro[2] + (r() - 0.5) * area[1]), new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6, r() * 6, 0)), new THREE.Vector3(s, s * 0.8, s));
      return m;
    });
  }, [n, seed, centro[0], centro[1], centro[2], area[0], area[1], alt, tam]);
  return <InstCor geo={GEO_POMES} mats={mats} cores={CORES_POMES} />;
};

// cinza fina caindo (partículas) — para noite e madrugada
export const CinzaCaindo: React.FC<{t: number; centro: V3; raio: number; alt: number; n?: number}> = ({t, centro, raio, alt, n = 220}) => (
  <PomesChuva t={t} centro={centro} raio={raio} alt={alt} n={n} tam={0.025} vel={2.5} seed={77} />
);

// ================= EMBARCAÇÕES =================
const geoCasco = (L: number, Hh: number, B: number, esporao: boolean) => {
  const s = new THREE.Shape();
  const l = L / 2;
  s.moveTo(-l - 0.6, Hh * 1.9);
  s.quadraticCurveTo(-l - 0.2, Hh * 0.4, -l + 1.0, -0.3);
  s.lineTo(l - 1.2, -0.3);
  if (esporao) {
    s.lineTo(l + 0.2, 0.0);
    s.lineTo(l + 1.2, 0.12);
    s.lineTo(l + 0.1, 0.5);
  }
  s.quadraticCurveTo(l + 0.3, Hh * 0.8, l + 0.5, Hh * 1.35);
  s.lineTo(l - 0.6, Hh);
  s.lineTo(-l + 0.6, Hh);
  s.lineTo(-l - 0.6, Hh * 1.9);
  const g = new THREE.ExtrudeGeometry(s, {depth: B, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.35, bevelSegments: 2, curveSegments: 6});
  g.translate(0, 0, -B / 2);
  return g;
};
export const Liburna: React.FC<{pos: V3; rotY?: number; t: number; remando?: boolean; tripulacao?: React.ReactNode}> = ({pos, rotY = 0, t, remando = true, tripulacao}) => {
  const geo = useMemo(() => geoCasco(20, 1.8, 2.8, true), []);
  const bob = Math.sin(t * 1.4) * 0.08;
  return (
    <group position={[pos[0], pos[1] + bob, pos[2]]} rotation={[Math.sin(t * 1.1) * 0.02, rotY, Math.sin(t * 0.9) * 0.015]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial map={T.madeira()} color="#9a6a48" roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Caixa pos={[0, 1.15, s * 1.78]} tam={[19, 0.22, 0.04]} cor="#8f2a24" sombra={false} />
          <Caixa pos={[0, 0.75, s * 1.78]} tam={[19, 0.08, 0.04]} cor="#d9b13a" sombra={false} />
          <mesh position={[9.4, 1.2, s * 1.62]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
            <circleGeometry args={[0.32, 40]} />
            <meshStandardMaterial color="#f2ecdf" side={2} />
          </mesh>
          <mesh position={[9.42, 1.2, s * 1.66]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
            <circleGeometry args={[0.14, 40]} />
            <meshStandardMaterial color="#1d1b26" side={2} />
          </mesh>
          {Array.from({length: 14}).map((_, i) => {
            const x = -7.5 + i * 1.15;
            const ph = remando ? t * 2.6 : 0;
            const a = Math.sin(ph) * 0.5, b = Math.cos(ph) * 0.35;
            return <Barra key={i} a={[x, 1.0, s * 1.7]} b={[x + a * 1.2, -0.15 + b, s * 5.2]} r={0.05} cor="#c9a070" />;
          })}
          {Array.from({length: 9}).map((_, i) => (<Cil key={'e' + i} pos={[-6 + i * 1.5, 2.2, s * 1.5]} rot={[Math.PI / 2, 0, 0]} r={0.36} h={0.08} cor={i % 2 ? '#8f2a24' : '#d9b13a'} seg={12} />))}
        </group>
      ))}
      <TBox pos={[0, 1.95, 0]} tam={[19, 0.12, 3.0]} map={T.madeira()} mod={[1, 1]} cor="#c9a070" />
      <Caixa pos={[10.6, 0.06, 0]} tam={[1.4, 0.36, 0.5]} cor="#b08a3a" />
      <mesh position={[-10.4, 3.5, 0]} rotation={[0, 0, -0.3]}>
        <torusGeometry args={[0.9, 0.18, 10, 28, Math.PI * 1.1]} />
        <meshStandardMaterial color="#9a6a48" />
      </mesh>
      <Cil pos={[0.5, 5.5, 0]} r={0.15} h={7.2} cor="#6b4a2e" />
      <Cil pos={[0.6, 8.6, 0]} rot={[Math.PI / 2, 0, 0]} r={0.08} h={7.4} cor="#6b4a2e" />
      <TBox pos={[0.7, 6.4, 0]} rot={[0, Math.PI / 2, 0]} tam={[7.0, 4.2, 0.05]} map={T.listras('#8f2a24', '#efe4c8')} mod={[2, 2]} />
      <Caixa pos={[-7.5, 2.6, 0]} tam={[2.6, 1.2, 2.4]} cor="#7a4a2e" />
      {tripulacao}
      {/* espuma da proa e esteira */}
      {[0, 1, 2, 3].map((i) => (<Caixa key={i} pos={[10.6 - i * 0.3, -0.12, (i - 1.5) * 0.9]} tam={[1.2, 0.05, 0.6]} cor="#e6f2f6" sombra={false} />))}
    </group>
  );
};
export const Barco: React.FC<{pos: V3; rotY?: number; t: number; vela?: string}> = ({pos, rotY = 0, t, vela = '#efe4c8'}) => {
  const geo = useMemo(() => geoCasco(9, 1.4, 2.6, false), []);
  return (
    <group position={[pos[0], pos[1] + Math.sin(t * 1.6 + pos[0]) * 0.06, pos[2]]} rotation={[0, rotY, Math.sin(t * 1.2 + pos[2]) * 0.03]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial map={T.madeira()} color="#a07050" roughness={0.9} />
      </mesh>
      <TBox pos={[0, 1.5, 0]} tam={[8.5, 0.1, 2.7]} map={T.madeira()} mod={[1, 1]} cor="#c9a070" />
      <mesh position={[-5.0, 2.8, 0]} rotation={[0, 0, 0.2]}>
        <torusGeometry args={[0.7, 0.14, 10, 28, Math.PI]} />
        <meshStandardMaterial color="#a07050" />
      </mesh>
      <Cil pos={[0.5, 4.0, 0]} r={0.12} h={5.2} cor="#6b4a2e" />
      <TBox pos={[0.6, 4.4, 0]} rot={[0, Math.PI / 2, 0]} tam={[4.0, 3.0, 0.05]} map={T.listras(vela, '#efe4c8')} mod={[2, 2]} />
      {[-2.5, -1.4, 2.4].map((x, i) => (<Anfora key={i} pos={[x, 1.55, (i - 1) * 0.5]} esc={0.9} />))}
    </group>
  );
};

// ================= MAQUETE REGIONAL (1 unidade = 100 m) =================
// Golfo de Nápoles: Vesúvio na origem, Pompeia 9 km a sudeste, mar a oeste/sul.
export const Regiao: React.FC<{t: number; g?: number; fumaca?: number; rotulos?: number; regua?: number}> = ({t, g = 0, fumaca = 0, rotulos = 0, regua = 0}) => {
  const terra = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-600, -700);
    s.lineTo(900, -700);
    s.lineTo(900, 400);
    s.lineTo(260, 330);
    s.quadraticCurveTo(160, 160, 95, 110);
    s.quadraticCurveTo(40, 90, -10, 60);
    s.quadraticCurveTo(-80, 40, -130, 60);
    s.quadraticCurveTo(-240, 70, -330, 10);
    s.lineTo(-600, 0);
    s.lineTo(-600, -700);
    const geo = new THREE.ShapeGeometry(s, 24);
    geo.rotateX(Math.PI / 2);
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 160, uv.getY(i) / 160);
    return geo;
  }, []);
  const POM: V3 = [70, 0, 62];
  return (
    <group>
      <Chao tam={[4000, 4000]} pos={[0, -0.4, 0]} map={T.mar()} mod={60} />
      <mesh geometry={terra} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial map={T.campo()} side={2} roughness={1} />
      </mesh>
      <Vesuvio pos={[0, 0, 0]} R={55} H={30} />
      {fumaca > 0 && g < 0.01 && <Pluma pos={[0, 29, 0]} H={14} R={2.2} g={0.35 * fumaca} t={t} vento={[0.4, 0.3]} brilho={0} />}
      <Pluma pos={[0, 29, 0]} H={300} R={16} g={g} t={t} vento={[0.6, 0.55]} />
      {/* rio Sarno e a cidade murada */}
      <Barra a={[180, 0.05, -60]} b={[95, 0.05, 105]} r={1.2} cor="#4f8fb0" sombra={false} />
      <group position={POM}>
        <mesh rotation={[-Math.PI / 2, 0, 0.4]} position={[0, 0.06, 0]}>
          <circleGeometry args={[6.5, 40]} />
          <meshStandardMaterial color="#c9b08a" />
        </mesh>
        {Array.from({length: 26}).map((_, i) => {
          const r = rnd(i + 3);
          return <Caixa key={i} pos={[(r() - 0.5) * 10, 0.35, (r() - 0.5) * 8]} tam={[0.8 + r() * 0.8, 0.7, 0.6 + r() * 0.6]} cor={r() > 0.5 ? '#c0603a' : '#e2cfa6'} />;
        })}
      </group>
      {[[-120, 52], [-210, 48], [40, 98]].map(([x, z], i) => (<Barco key={i} pos={[x, 0, z + 25]} rotY={0.3 + i} t={t} />))}
      {regua > 0.01 && (
        <group position={[-70, 0, 20]}>
          <Cil pos={[0, 150 * regua, 0]} r={1.4} h={300 * regua} cor="#ffd23f" seg={6} />
          {Array.from({length: 7}).map((_, i) => (i * 50 <= 300 * regua ? <Caixa key={i} pos={[0, i * 50, 0]} tam={[10, 1.6, 1.6]} cor="#1d1b26" /> : null))}
          {regua > 0.9 && <Rotulo texto="30 km" ancora={[0, 300, 0]} sobe={0} lado={0} fundo="#ffd23f" tam={1.25} />}
        </group>
      )}
      {rotulos > 0.01 && (
        <>
          <Rotulo texto="VESÚVIO" ancora={[0, 30, 0]} sobe={14} vis={clamp01(rotulos * 3)} fundo="#6f8a45" cor="#ffffff" />
          <Rotulo texto="POMPEIA" ancora={[POM[0], 1, POM[2]]} sobe={22} vis={clamp01(rotulos * 3 - 0.6)} fundo="#d9a040" />
          <Rotulo texto="MAR TIRRENO" ancora={[-120, 0, 160]} sobe={6} vis={clamp01(rotulos * 3 - 1.2)} fundo="#2b6a8c" cor="#ffffff" />
        </>
      )}
    </group>
  );
};

export const Lucerna: React.FC<{pos: V3; t: number; luz?: number}> = ({pos, t, luz = 3}) => (
  <group position={pos}>
    <mesh scale={[1, 0.5, 1.4]}>
      <sphereGeometry args={[0.09, 20, 14]} />
      <meshStandardMaterial color="#b0703a" />
    </mesh>
    <mesh position={[0, 0.08, 0.11]} scale={[1, 1 + Math.sin(t * 13) * 0.15, 1]}>
      <coneGeometry args={[0.03, 0.12, 24]} />
      <meshStandardMaterial color="#ffb040" emissive="#ff8a1f" emissiveIntensity={2} />
    </mesh>
    {luz > 0 && <pointLight position={[0, 0.25, 0.1]} color="#ffb060" intensity={luz} distance={8} decay={1.4} />}
  </group>
);
