// Gera a imagem de capa (1200x900, JPG) de cada receita em receitas/img/<slug>.jpg, só das que ainda não têm.
// Uso: node tools/receitas-imagens.mjs [--todas]   (precisa do Playwright com Chromium)
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {carregar, CATEGORIAS} from '../plataforma/lib/receitas.mjs';

const require = createRequire(import.meta.url);
const {chromium} = require('playwright');
const DIR = path.resolve('receitas');
const IMG = path.join(DIR, 'img');
const ze = `data:image/png;base64,${fs.readFileSync(path.join(DIR, 'ze.png')).toString('base64')}`;
const CORES = {cafe: ['#fde68a', '#f59e0b'], almoco: ['#fed7aa', '#ea580c'], lanche: ['#fecaca', '#dc2626'], doce: ['#fbcfe8', '#db2777'], bebida: ['#bbf7d0', '#16a34a'], fit: ['#d9f99d', '#65a30d']};
const DIFS = {1: 'Muito fácil', 2: 'Fácil', 3: 'Médio'};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const tempo = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`);

const html = (r) => {
  const [c1, c2] = CORES[r.c];
  const tam = r.t.length > 34 ? 66 : r.t.length > 22 ? 78 : 92;
  return `<html><body style="margin:0;width:1200px;height:900px;font-family:'Noto Sans','DejaVu Sans',sans-serif;background:radial-gradient(circle at 75% 40%,${c1} 0%,#fff7ed 70%);position:relative;overflow:hidden">
<div style="position:absolute;right:-60px;top:110px;width:600px;height:600px;border-radius:50%;background:#fff;box-shadow:0 30px 60px rgba(0,0,0,.18),inset 0 0 0 26px ${c1}"></div>
<div style="position:absolute;right:30px;top:180px;width:420px;height:460px;font-size:330px;line-height:460px;text-align:center;font-family:'Noto Color Emoji'">${r.e || CATEGORIAS[r.c].e}</div>
<div style="position:absolute;left:64px;top:60px;display:flex;align-items:center;gap:16px;font-size:34px;color:#1f1a17"><img src="${ze}" style="width:84px;height:84px;border-radius:50%;border:5px solid ${c2}"><span>Receitas do <b style="color:${c2}">Zé</b></span></div>
<div style="position:absolute;left:64px;top:230px;width:600px;font-size:${tam}px;line-height:1.05;font-weight:800;color:#1f1a17;letter-spacing:-1px">${esc(r.t)}</div>
<div style="position:absolute;left:64px;bottom:70px;display:flex;gap:14px;font-size:30px;font-weight:700">
<span style="background:${c2};color:#fff;padding:12px 22px;border-radius:40px">⏱ ${tempo(r.total)}${r.tg ? '+' : ''}</span>
<span style="background:#fff;color:#1f1a17;padding:12px 22px;border-radius:40px;border:3px solid ${c2}">${DIFS[r.d]}</span></div>
</body></html>`;
};

const {lista} = carregar();
const todas = process.argv.includes('--todas');
const falta = lista.filter((r) => todas || !fs.existsSync(path.join(IMG, `${r.s}.jpg`)));
const browser = await chromium.launch(process.env.CHROME ? {executablePath: process.env.CHROME} : {});
const page = await browser.newPage({viewport: {width: 1200, height: 900}});
for (const r of falta) {
  await page.setContent(html(r));
  await page.screenshot({path: path.join(IMG, `${r.s}.jpg`), type: 'jpeg', quality: 78});
}
// capa do site
if (todas || !fs.existsSync(path.join(IMG, '_capa.jpg'))) {
  await page.setContent(html({t: `${lista.length} receitas fáceis e baratas`, c: 'almoco', e: '🍲', total: 30, d: 1}).replace(/⏱ 30 min/, 'Passo a passo').replace('Muito fácil', 'zeexplica.com.br'));
  await page.screenshot({path: path.join(IMG, '_capa.jpg'), type: 'jpeg', quality: 80});
}
await browser.close();
console.log(`imagens geradas: ${falta.length}`);
