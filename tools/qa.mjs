// AGENTE QA: renderiza 1 still no MEIO de cada plano (+ opcional início) e monta uma folha de contato.
// Uso: node tools/qa.mjs casa-50m2 [pasta=qa] [só-planos ex: 3,4,5]
// Saída: qa/<id>/p<NN>.jpg e qa/<id>/folha.jpg — o revisor olha a folha e reprova bugs de escala/enquadramento.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const id = process.argv[2] ?? 'casa-50m2';
const pasta = path.join(process.argv[3] ?? 'qa', id);
const so = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
fs.mkdirSync(pasta, {recursive: true});
const FPS = 30;
const rot = JSON.parse(fs.readFileSync(`roteiros/${id}.json`, 'utf8'));
const tim = JSON.parse(fs.readFileSync(`public/audio/${id}/timings.json`, 'utf8'));
let t = 0;
const planos = [];
for (const c of rot.cenas) {
  const tm = tim.cenas.find((x) => x.id === c.id);
  const de = Math.round(t * FPS);
  c.planos.forEach((p) => {
    const w = p.apartir ? tm.palavras[p.apartir] : null;
    planos.push({de: w ? de + Math.round((w.inicio - 0.04) * FPS) : de, nome: `${c.id} ${p.set}/${p.cam}`});
  });
  t += tm.duracao;
}
planos.forEach((p, i) => (p.ate = i + 1 < planos.length ? planos[i + 1].de : Math.round(t * FPS)));

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_CHROME ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const composition = await selectComposition({serveUrl, id, inputProps: {}, chromiumOptions: {gl: process.env.GL ?? 'swangle'}, browserExecutable});
const lista = [];
for (let i = 0; i < planos.length; i++) {
  if (so && !so.includes(i)) continue;
  const p = planos[i];
  const frame = Math.min(p.ate - 1, Math.round(p.de + (p.ate - p.de) * 0.7));
  const out = path.join(pasta, `p${String(i).padStart(2, '0')}.jpg`);
  await renderStill({serveUrl, composition, frame, output: out, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.5, chromiumOptions: {gl: process.env.GL ?? 'swangle'}, browserExecutable});
  console.log(i, p.nome, 'frame', frame);
  lista.push(out);
}
// apaga o bundle temporário que este script criou (antes ficava no TMP e enchia o disco: ~90 MB por rodada)
try {
  fs.rmSync(serveUrl, {recursive: true, force: true});
} catch {}
if (!so) {
  execSync(`ffmpeg -y -loglevel error -pattern_type glob -i '${pasta}/p*.jpg' -vf "scale=270:-1,tile=8x5" -frames:v 1 ${pasta}/folha.jpg`);
  console.log('folha:', `${pasta}/folha.jpg`);
}
