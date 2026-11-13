// Anexos das tarefas do escritório (ex.: o dono manda uma fatura para o financeiro; o agente devolve um relatório).
// Arquivos ficam CIFRADOS em disco (AES-256-GCM, chave derivada por HKDF) numa pasta privada fora de public/
// (OFFICE_FILES_DIR, padrão data/office-files; entra no backup do servidor). O tipo é conferido pelos bytes do arquivo
// (não pelo nome nem pelo que o navegador diz); HEIC vira JPG. Limites: 25 MB por arquivo, 10 por tarefa.
// Quem lê: o dono, o responsável pela tarefa, o gerente da área dele, o Gerente Geral e o Diretor (ver canRead).
// Retenção: arquivos com mais de N dias (configuração files_days, padrão 180) são apagados. Guia: tools/agencia/LEIA-ME.md, "Anexos".
const crypto = require('crypto');
const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const config = require('../config');
const { one, all, run, now } = require('../db');
const roster = require('./roster');

const DIR = process.env.OFFICE_FILES_DIR || path.join(config.ROOT, 'data', 'office-files');
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_PER_TASK = 10;
const DEFAULT_DAYS = 180;
// Extensões aceitas (o campo de arquivo do painel usa a mesma lista)
const ACCEPT = ['.pdf', '.jpg', '.jpeg', '.png', '.heic', '.heif', '.xlsx', '.csv', '.xml', '.ofx', '.txt', '.docx', '.zip'];
const MIME = {
  pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', zip: 'application/zip',
  csv: 'text/csv', xml: 'application/xml', ofx: 'application/x-ofx', txt: 'text/plain',
};

// ---------- chave e cifra ----------
let KEY = null;
function key() {
  if (KEY) return KEY;
  const src = process.env.OFFICE_FILES_SECRET || process.env.SOCIAL_SECRET || process.env.ESIGN_SECRET || '';
  let master;
  if (src) {
    if (src.length < 32) throw new Error('OFFICE_FILES_SECRET (ou SOCIAL_SECRET/ESIGN_SECRET) precisa de pelo menos 32 caracteres.');
    master = Buffer.from(src, 'utf8');
  } else { // desenvolvimento: chave aleatória gravada uma vez na própria pasta
    fs.mkdirSync(DIR, { recursive: true, mode: 0o700 });
    const kf = path.join(DIR, '.key');
    try { master = fs.readFileSync(kf); } catch {
      master = crypto.randomBytes(32);
      try { fs.writeFileSync(kf, master, { mode: 0o600, flag: 'wx' }); } catch (e) { if (e.code === 'EEXIST') master = fs.readFileSync(kf); else throw e; }
    }
  }
  KEY = Buffer.from(crypto.hkdfSync('sha256', master, 'bonequinhos-office-files-v1', 'files', 32));
  return KEY;
}
const MAGIC = Buffer.from('OF1');
// aad = nome do arquivo em disco: não dá para trocar o conteúdo de um anexo pelo de outro
function sealBuf(buf, aad) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  c.setAAD(Buffer.from(aad));
  const ct = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([MAGIC, iv, c.getAuthTag(), ct]);
}
function openBuf(blob, aad) {
  if (!blob.subarray(0, 3).equals(MAGIC)) throw new Error('arquivo cifrado inválido');
  const d = crypto.createDecipheriv('aes-256-gcm', key(), blob.subarray(3, 15));
  d.setAAD(Buffer.from(aad));
  d.setAuthTag(blob.subarray(15, 31));
  return Buffer.concat([d.update(blob.subarray(31)), d.final()]);
}

// ---------- validação ----------
const bad = (msg, status = 400) => Object.assign(new Error(msg), { status });
// Nome seguro: só o nome (sem pasta), sem caracteres de controle nem reservados, até 120 caracteres
function safeName(name, ext) {
  let n = path.basename(String(name || 'arquivo').replace(/\\/g, '/')).normalize('NFC')
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*\u202a-\u202e\u2066-\u2069]/g, '_').replace(/\s+/g, ' ').replace(/^[.\s]+/, '').trim();
  if (!n) n = 'arquivo';
  let base = n.replace(/\.[^.]*$/, '') || 'arquivo';
  base = base.slice(0, 110);
  return `${base}.${ext}`;
}
function isText(buf) {
  const head = buf.subarray(0, 64 * 1024);
  if (head.includes(0)) return false;
  const s = head.toString('utf8');
  const bad = (s.match(/\uFFFD/g) || []).length;
  return bad <= Math.max(2, s.length / 200); // tolera um pouco de latin1 (extratos OFX/CSV de banco)
}
// Tipo pelos bytes. Devolve a extensão final (heic → 'heic', convertida depois) ou lança erro com o motivo.
function detect(buf, name) {
  const ext = String(path.extname(name || '')).toLowerCase().replace('.', '');
  const b = buf;
  if (b.length < 4) throw bad('Arquivo vazio ou pequeno demais.');
  if (b.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.subarray(4, 8).toString('latin1') === 'ftyp' && /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(b.subarray(8, 12).toString('latin1'))) return 'heic';
  if (b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05) && (b[3] === 0x04 || b[3] === 0x06)) {
    const latin = b.toString('latin1');
    if (ext === 'xlsx' && latin.includes('xl/')) return 'xlsx';
    if (ext === 'docx' && latin.includes('word/')) return 'docx';
    if (ext === 'xlsx' || ext === 'docx') throw bad(`"${name}" não parece um .${ext} de verdade.`);
    return 'zip';
  }
  if (['csv', 'txt', 'xml', 'ofx'].includes(ext) && isText(b)) {
    const s = b.subarray(0, 4096).toString('utf8').replace(/^\uFEFF/, '').trimStart().toLowerCase();
    // nada de página ou imagem vetorial disfarçada (HTML/SVG executariam no navegador)
    if (/<(!doctype\s+html|html|svg|script|body)\b/.test(s) || /<svg[\s>]/.test(b.toString('utf8').toLowerCase())) throw bad(`"${name}" contém HTML/SVG: não aceito.`);
    if (ext === 'xml' && !s.startsWith('<')) throw bad(`"${name}" não parece XML.`);
    return ext;
  }
  throw bad(`Tipo de arquivo não aceito ("${name}"). Envie PDF, JPG, PNG, HEIC, XLSX, CSV, XML, OFX, TXT, DOCX ou ZIP.`);
}
// HEIC → JPG: sharp quando tem suporte; senão o ffmpeg (o mesmo que o site usa); sem nenhum, recusa com motivo
async function heicToJpg(buf) {
  try { return await require('sharp')(buf).rotate().jpeg({ quality: 88 }).toBuffer(); } catch {}
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'of-heic-'));
  try {
    const src = path.join(tmp, 'in.heic'), out = path.join(tmp, 'out.jpg');
    await fsp.writeFile(src, buf);
    await new Promise((resolve, reject) => {
      const p = spawn(process.env.FFMPEG || 'ffmpeg', ['-hide_banner', '-v', 'error', '-y', '-nostdin', '-i', src, '-frames:v', '1', '-q:v', '3', out], { stdio: 'ignore' });
      p.on('error', reject); p.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg ${c}`))));
    });
    return await fsp.readFile(out);
  } catch { throw bad('Não foi possível converter a foto HEIC. Envie em JPG ou PNG.'); } finally { fsp.rm(tmp, { recursive: true, force: true }).catch(() => {}); }
}

// ---------- quem pode ler ----------
// Dono; responsável; gerente da área do responsável; Gerente Geral; Diretor
function canRead(actor, task) {
  if (!task) return false;
  if (actor === 'admin' || actor === 'gerente' || actor === 'diretor') return true;
  if (task.assignee && actor === task.assignee) return true;
  return !!(task.assignee && roster.managerOf(task.assignee) === actor);
}

// ---------- operações ----------
const serialize = (f) => (f ? { id: f.id, task_id: f.task_id, name: f.name, mime: f.mime, size: f.size, sha256: f.sha256, uploaded_by: f.uploaded_by, created_at: f.created_at } : null);
const list = (taskId) => all('SELECT * FROM office_files WHERE task_id = ? ORDER BY id', taskId).map(serialize);
const get = (id) => one('SELECT * FROM office_files WHERE id = ?', id);
const count = (taskId) => one('SELECT COUNT(*) AS n FROM office_files WHERE task_id = ?', taskId).n;

// files: [{ originalname, buffer }]. Valida tudo antes de gravar qualquer coisa.
async function add(taskId, files, uploadedBy) {
  if (!files || !files.length) throw bad('Escolha pelo menos um arquivo.');
  if (count(taskId) + files.length > MAX_PER_TASK) throw bad(`No máximo ${MAX_PER_TASK} arquivos por tarefa (esta já tem ${count(taskId)}).`);
  const ready = [];
  for (const f of files) {
    if (f.buffer.length > MAX_BYTES) throw bad(`"${f.originalname}" passa de 25 MB.`, 413);
    let ext = detect(f.buffer, f.originalname);
    let buf = f.buffer;
    if (ext === 'heic') { buf = await heicToJpg(buf); ext = 'jpg'; }
    ready.push({ name: safeName(f.originalname, ext === 'jpg' && /\.jpeg$/i.test(f.originalname) ? 'jpeg' : ext), mime: MIME[ext], buf });
  }
  await fsp.mkdir(DIR, { recursive: true, mode: 0o700 });
  const out = [];
  for (const r of ready) {
    const stored = `${crypto.randomBytes(16).toString('hex')}.bin`;
    await fsp.writeFile(path.join(DIR, stored), sealBuf(r.buf, stored), { mode: 0o600 });
    const sha = crypto.createHash('sha256').update(r.buf).digest('hex');
    const res = run('INSERT INTO office_files (task_id, name, mime, size, sha256, path, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', taskId, r.name, r.mime, r.buf.length, sha, stored, uploadedBy, now());
    out.push(serialize(get(Number(res.lastInsertRowid))));
  }
  return out;
}
async function read(f) {
  const blob = await fsp.readFile(path.join(DIR, path.basename(f.path)));
  return openBuf(blob, path.basename(f.path));
}
async function remove(f) {
  run('DELETE FROM office_files WHERE id = ?', f.id);
  await fsp.rm(path.join(DIR, path.basename(f.path)), { force: true });
}
async function removeForTask(taskId) { for (const f of all('SELECT * FROM office_files WHERE task_id = ?', taskId)) await remove(f); }
// Apaga anexos com mais de `days` dias. Devolve quantos apagou.
async function purge(days) {
  const d = Number(days) > 0 ? Number(days) : DEFAULT_DAYS;
  const old = all('SELECT * FROM office_files WHERE created_at < ?', now() - d * 86400000);
  for (const f of old) await remove(f);
  return old.length;
}
// Só PDF, JPG e PNG (tipo conferido pelos bytes no envio) podem abrir no navegador; todo o resto é sempre baixado
const INLINE = ['application/pdf', 'image/jpeg', 'image/png'];
const canInline = (f) => INLINE.includes(f && f.mime);
// Download: cabeçalhos que nunca deixam o navegador rodar o arquivo na página. inline=true (só para canInline) mostra
// o PDF no leitor do próprio navegador ou a imagem; sem script em nenhum caso (CSP sem script-src; imagem em sandbox).
function sendHeaders(res, f, { inline = false } = {}) {
  const ascii = f.name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const show = inline && canInline(f);
  res.set({
    'Content-Type': f.mime || 'application/octet-stream',
    'Content-Disposition': `${show ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(f.name)}`,
    'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store',
    // o leitor de PDF do Chrome não abre com "sandbox"; o PDF fica sem script por default-src 'none'
    'Content-Security-Policy': show && f.mime === 'application/pdf' ? "default-src 'none'; object-src 'self'; frame-ancestors 'self'" : `default-src 'none'; sandbox${show ? "; frame-ancestors 'self'" : ''}`,
  });
}

module.exports = { DIR, MAX_BYTES, MAX_PER_TASK, DEFAULT_DAYS, ACCEPT, INLINE, canInline, canRead, list, get, add, read, remove, removeForTask, purge, sendHeaders, detect, safeName };
