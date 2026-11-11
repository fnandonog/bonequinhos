// Escritório da agência (/admin/escritorio): cena em pixel art (canvas, sprites desenhados aqui mesmo, sem arquivos de terceiros),
// quadro de tarefas, feed ao vivo (SSE em /admin/api/office/stream) e gaveta com detalhes e aprovações.
// Ideia inspirada no Pixel Agents (github.com/pablodelucca/pixel-agents, MIT); nenhum código ou arte de lá foi copiado. Ver tools/agencia/NOTICE.
const API = '/admin/api/office';
const S = window.__OFFICE__;
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const href = (u) => (/^https?:\/\//i.test(u || '') || /^\/(?!\/)/.test(u || '') ? esc(u) : null);
// Markdown seguro das entregas (lib/office/markdown.js, servido em /escritorio-md.js); sem ele, texto puro
const MD = window.OfficeMd || { render: (t) => `<p style="white-space:pre-wrap">${esc(t)}</p>`, renderInline: esc };
const COL = { backlog: 'A fazer', doing: 'Fazendo', review: 'Revisão (você)', done: 'Feito' };
const ST_LABEL = { working: 'Trabalhando', waiting: 'Esperando você', idle: 'Livre', blocked: 'Travado', error: 'Erro', off: 'Fora' };
// Letra branca em avatar de cor escura (o terno do Gerente), escura nos demais
const ink = (hex) => { const m = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return '#15121f'; const n = parseInt(m[1], 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 110 ? '#ffffff' : '#15121f'; };
const initials = (n) => String(n || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const agentOf = (id) => S.agents.find((a) => a.id === id);
const fmt = (ms) => new Date(ms).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const ago = (ms) => {
  if (!ms) return 'nunca';
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return fmt(ms);
};
// Status visível: "fora" quando desligado ou sem batimento há muito tempo (exceto quem espera aprovação)
function vis(a) {
  if (!a.enabled) return 'off';
  if (a.status === 'waiting' || a.status === 'error') return a.status;
  if (!a.last_heartbeat || Date.now() - a.last_heartbeat > S.staleMs) return a.status === 'working' ? 'off' : (a.last_heartbeat ? 'idle' : 'off');
  return a.status;
}

async function api(path, opts = {}) {
  const r = await fetch(API + path, { ...opts, headers: { 'content-type': 'application/json', ...(opts.headers || {}) }, credentials: 'same-origin' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || `Erro ${r.status}`), { code: j.code, url: j.url, status: r.status });
  return j;
}
// Ação de risco alto pediu a 2FA: a janela de /admin-2fa.js já perguntou aqui mesmo e repetiu o pedido. Se ainda veio "2fa",
// a pessoa cancelou (sem a janela, cai no link da tela do código).
function stepUp(err) {
  if (err && err.code === '2fa') {
    if (window.Admin2FA) toast('Ação não feita: confirme o código para continuar.', true);
    else if (err.url && confirm(`${err.message}\n\nAbrir a confirmação agora? Depois você volta para o escritório e repete a ação.`)) location.href = `/entrar/2fa?motivo=renovar&next=${encodeURIComponent(location.pathname)}`;
    return true;
  }
  return false;
}
function toast(msg, err = false) {
  const t = document.createElement('div');
  t.className = `of-toast${err ? ' err' : ''}`;
  t.textContent = msg;
  $('#toasts').append(t);
  setTimeout(() => t.remove(), 3800);
}

// =====================================================================
// Cena em pixel art
// Mundo lógico em "pixels de arte", pintado 1:1 num canvas fora da tela e ampliado para o canvas visível sem suavização
// (vizinho mais próximo: fica nítido com escala quebrada e em qualquer DPR). No computador a cena cabe inteira na tela:
// a escala é a maior que cabe na largura E na altura que sobra abaixo do topo, e a largura lógica preenche o resto.
// Organizada como um organograma: uma coluna (sala) por área, com o gerente no alto e a equipe embaixo; no celular as salas
// ficam uma embaixo da outra.
// =====================================================================
const canvas = $('#scene');
const mctx = canvas.getContext('2d'); // canvas visível: cena ampliada + etiquetas em pixels do aparelho
const art = document.createElement('canvas'); // cena em pixels de arte (1:1)
const actx = art.getContext('2d');
let ctx = actx; // R() e companhia pintam no canvas de arte; drawLabels troca para o visível
const SW = 60, SH = 60, WALL = 44, PLATE = 16, PART = 4, PAD = 4, BOT = 4; // estação (mesa + pessoa), parede, placa da coluna, divisória, margem
let layout = { W: 320, H: 200, s: 1, dpr: 1, cells: [], cols: [], props: [] };
let hover = null;
let bg = null; // fundo estático (chão, paredes, divisórias) desenhado uma vez por layout/tema
const teamColor = (a) => (a && a.team_color) || '#9a96ab';

// Uma coluna por área, na ordem de S.teams. Direção: Diretor e Gerente Geral; nas outras, o gerente de área em cima e a equipe embaixo.
function teamColumns() {
  const order = Object.keys(S.teams || {});
  const cols = [];
  for (const team of order) {
    const list = S.agents.filter((a) => a.team === team);
    if (!list.length) continue;
    const heads = team === 'direcao' ? list.slice().sort((a, b) => (a.id === 'diretor' ? -1 : b.id === 'diretor' ? 1 : 0)) : list.filter((a) => a.area_manager);
    const staff = list.filter((a) => !heads.includes(a));
    const t = S.teams[team];
    cols.push({ team, name: t.short || t.name, color: t.color, heads, staff });
  }
  const rest = S.agents.filter((a) => !order.includes(a.team));
  if (rest.length) cols.push({ team: 'outros', name: 'Outros', color: '#9a96ab', heads: [], staff: rest });
  return cols;
}
// Formato de uma coluna com k mesas por linha. compact (celular): equipe pequena fica numa linha só, gerente ao lado.
function colShape(c, k, compact) {
  const n = c.heads.length + c.staff.length;
  if (compact && n <= k) return { k, rows: 1, one: true };
  return { k, rows: (c.heads.length ? Math.ceil(c.heads.length / k) : 0) + Math.ceil(c.staff.length / k), one: false };
}
// Opções de arrumação: faixas (bands) de colunas lado a lado; r = linhas da equipe (define a largura das colunas)
function candidates(cols) {
  const out = [];
  const split = (b) => { const per = Math.ceil(cols.length / b), g = []; for (let i = 0; i < cols.length; i += per) g.push(cols.slice(i, i + per)); return g; };
  for (const b of [1, 2, 3]) for (const r of [1, 2, 3]) {
    const bands = split(b).map((g) => g.map((c) => ({ c, ...colShape(c, Math.min(5, Math.max(1, Math.ceil(c.staff.length / r))), false) })));
    out.push({ bands, stacked: false });
  }
  for (const k of [2, 3]) out.push({ bands: cols.map((c) => [{ c, ...colShape(c, k, true) }]), stacked: true }); // celular: uma área embaixo da outra
  for (const o of out) {
    o.minW = Math.max(...o.bands.map((g) => g.reduce((s, x) => s + x.k * SW, 0) + 2 * PAD + (g.length - 1) * PART));
    o.H = WALL + o.bands.reduce((s, g) => s + PLATE + Math.max(...g.map((x) => x.rows)) * SH + BOT, 0) + (o.bands.length - 1) * PART;
  }
  return out;
}
function computeLayout() {
  const wrap = canvas.parentElement;
  const cssW = Math.max(260, (wrap.clientWidth || 640));
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const desk = window.innerWidth >= 760 && window.innerHeight >= 480; // celular: rola na vertical, a cena só acompanha a largura
  let boxH = Infinity;
  if (desk) {
    const top = wrap.getBoundingClientRect().top + window.scrollY;
    const legend = $('.of-legend', wrap);
    const below = (legend ? legend.offsetHeight : 0) + 2 + (parseFloat(getComputedStyle($('#main')).paddingBottom) || 0);
    boxH = Math.max(240, window.innerHeight - top - below);
  }
  const cap = desk ? 4 : 2.75; // pixels de tela (CSS) por pixel de arte, no máximo
  const FLOOR = 2.2; // no computador, abaixo disso a página rola um pouco em vez de encolher os bonecos
  const cols = teamColumns();
  let best = null;
  for (const o of candidates(cols)) {
    const wFit = cssW / o.minW, hFit = boxH / o.H;
    const sc = Math.min(cap, wFit, Math.max(hFit, FLOOR));
    const over = Number.isFinite(boxH) ? Math.max(0, o.H * sc - boxH) / boxH : 0; // quanto passa da tela
    const score = sc * (1 - 0.5 * over);
    if (!best || score > best.score + 1e-6) best = { ...o, sc, score };
  }
  let sc = best.sc;
  if (sc - Math.floor(sc) < 0.06 && sc >= 1) sc = Math.floor(sc); // perto de inteiro: usa o inteiro (pixels todos iguais)
  const s = sc * dpr; // pixels do aparelho por pixel de arte
  const W = Math.max(best.minW, Math.floor((cssW * dpr) / s));
  const cells = [], colsOut = [], props = [];
  const KINDS = ['board', 'coffee', 'water', 'printer', 'coffee', 'water'];
  let kindI = 0;
  let y = WALL;
  best.bands.forEach((g, bi) => {
    if (bi) y += PART;
    const rows = Math.max(...g.map((x) => x.rows));
    const sumK = g.reduce((t, x) => t + x.k, 0);
    const extra = W - 2 * PAD - (g.length - 1) * PART - sumK * SW;
    let x = PAD, used = 0;
    g.forEach((sh, ci) => {
      const add = ci === g.length - 1 ? extra - used : Math.floor((extra * sh.k) / sumK);
      used += add;
      const colW = sh.k * SW + add, slotW = colW / sh.k;
      const col = { team: sh.c.team, name: sh.c.name, color: sh.c.color, x, y, w: colW, h: PLATE + rows * SH + BOT, cells: [], props: [] };
      const top = y + PLATE;
      const place = (list, row, center) => {
        const off = center ? ((sh.k - list.length) * slotW) / 2 : 0;
        list.forEach((a, j) => {
          const cx = x + off + j * slotW;
          const cell = { id: a.id, x: Math.round(cx + (slotW - SW) / 2), y: top + row * SH, w: SW, h: SH, gap: Math.floor(slotW - SW), col };
          cells.push(cell); col.cells.push(cell);
        });
        const free = sh.k - list.length;
        if (!free) return;
        if (center) { // sobra dos lados do gerente: plantas, estante ou sofá
          const side = (free * slotW) / 2;
          if (side >= SW) [[x, 'shelf'], [x + colW - side, 'sofa']].forEach(([px, kind]) => { const p = { x: Math.round(px), y: top + row * SH, w: Math.round(side), kind, col }; props.push(p); col.props.push(p); });
          else if (side >= 18) [[x, 'plantS'], [x + colW - side, 'plantS']].forEach(([px, kind]) => { const p = { x: Math.round(px), y: top + row * SH, w: Math.round(side), kind, col }; props.push(p); col.props.push(p); });
        } else for (let j = list.length; j < sh.k; j++) { const p = { x: Math.round(x + j * slotW), y: top + row * SH, w: Math.round(slotW), kind: KINDS[kindI++ % KINDS.length], col }; props.push(p); col.props.push(p); }
      };
      let row = 0;
      if (sh.one) { place([...sh.c.heads, ...sh.c.staff], 0, true); row = 1; }
      else {
        for (let i = 0; i < sh.c.heads.length; i += sh.k) place(sh.c.heads.slice(i, i + sh.k), row++, true);
        for (let i = 0; i < sh.c.staff.length; i += sh.k) place(sh.c.staff.slice(i, i + sh.k), row++, false);
      }
      for (; row < rows; row++) place([], row, false); // linhas vazias embaixo: café, bebedouro, flip chart…
      colsOut.push(col);
      x += colW + PART;
    });
    y += PLATE + rows * SH + BOT;
  });
  const H = y;
  art.width = W; art.height = H;
  canvas.width = Math.round(W * s);
  canvas.height = Math.round(H * s);
  canvas.style.width = `${canvas.width / dpr}px`;
  canvas.style.height = `${canvas.height / dpr}px`;
  layout = { W, H, s: canvas.width / W, dpr, cells, cols: colsOut, props, stacked: best.stacked };
  pal = darkTheme() ? PAL.dark : PAL.light;
  bg = null;
  for (const id of walkers.keys()) walkers.delete(id); // o caminho mudou: todo mundo senta
  if (!$('.of-office').hidden) draw(reduce ? 0 : performance.now()); // pinta já (sem esperar o próximo quadro)
}

function darkTheme() {
  const t = document.documentElement.dataset.theme;
  if (t === 'dark') return true;
  if (t === 'light') return false;
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}
const PAL = {
  light: { part: '#5d5480', partHi: '#665d8a', wall: '#4a4170', wallHi: '#5a5085', wallDark: '#2e2847', base: '#2a2440', floorA: '#d8c3a0', floorB: '#cdb690', floorLine: '#b39a74' },
  dark: { part: '#26203f', partHi: '#2c2647', wall: '#2c2648', wallHi: '#363057', wallDark: '#1d1932', base: '#17142a', floorA: '#6b5a48', floorB: '#625242', floorLine: '#4d4034' },
};
const P = {
  desk: '#8a5a3c', deskTop: '#b07a52', deskHi: '#c99468', deskDark: '#5e3c27', deskShadow: 'rgba(0,0,0,.22)',
  chair: '#2a2533', chairHi: '#463e57', metal: '#9aa0ae', metalDark: '#5d6372', screenOff: '#14121c',
  outline: '#15121f', white: '#ffffff', lime: '#ffd23f', violet: '#ff7a1a', plant: '#3f9e4d', plantHi: '#5cbf62', plantDark: '#2a7036', pot: '#b5562f', potHi: '#d06e45',
  pants: '#2f2b3d', shoe: '#1b1824',
};
let pal = PAL.light;

const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
const hash = (s) => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
function mix(a, b, k) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('')}`;
}
const shade = (c, k) => (k >= 0 ? mix(c, '#ffffff', k) : mix(c, '#000000', -k));

// Recalcula quando muda o que está em volta (janela, topo, avisos, barra do Gerente), sem entrar em laço com o próprio canvas
let relayoutKey = '';
function relayout() {
  const wrap = canvas.parentElement;
  const key = `${wrap.clientWidth}x${Math.round(wrap.getBoundingClientRect().top + window.scrollY)}x${window.innerWidth}x${window.innerHeight}x${window.devicePixelRatio}`;
  if (key === relayoutKey) return;
  relayoutKey = key;
  computeLayout();
}

function brtHour() { return Number(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false })) % 24; }
function brtMin() { return Number(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', minute: 'numeric' })); }

// ---------- Fundo estático (vai para um canvas fora da tela) ----------
function buildBg() {
  const { W, H, cols } = layout;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const Rg = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
  // divisórias baixas entre as salas (o que sobra entre as colunas)
  Rg(0, WALL, W, H - WALL, pal.part);
  for (let y = WALL; y < H; y += 6) Rg(0, y, W, 1, pal.partHi);
  // chão de tacos de cada sala, puxado para a cor da equipe
  const dark = darkTheme();
  for (const col of cols) {
    const k = dark ? 0.2 : 0.17;
    const fa = mix(pal.floorA, col.color, k), fb = mix(pal.floorB, col.color, k), fl = mix(pal.floorLine, col.color, k * 0.8);
    g.save(); g.beginPath(); g.rect(col.x, col.y, col.w, col.h); g.clip();
    for (let y = col.y; y < col.y + col.h; y += 6) for (let x = col.x - 12; x < col.x + col.w + 12; x += 12) {
      const off = (((y - col.y) / 6) % 2) * 6;
      Rg(x + off, y, 12, 6, ((x + off - col.x) / 12 + (y - col.y) / 6) % 2 ? fa : fb);
      Rg(x + off, y + 5, 12, 1, fl);
      Rg(x + off, y, 1, 5, fl);
    }
    g.restore();
    // faixa da placa no alto da sala e rodapé na cor da equipe
    Rg(col.x, col.y, col.w, PLATE - 3, mix(dark ? '#1d1932' : '#3b335c', col.color, 0.22));
    Rg(col.x, col.y + PLATE - 3, col.w, 2, col.color);
    Rg(col.x, col.y + PLATE - 1, col.w, 1, 'rgba(0,0,0,.18)');
    // sombra das divisórias no chão
    Rg(col.x, col.y + PLATE, 2, col.h - PLATE, 'rgba(0,0,0,.10)');
  }
  // parede com rodapé e friso
  Rg(0, 0, W, WALL, pal.wall);
  for (let x = 0; x < W; x += 8) Rg(x, 0, 1, WALL - 8, pal.wallHi);
  Rg(0, WALL - 8, W, 8, pal.base);
  Rg(0, WALL - 9, W, 1, pal.wallDark);
  bg = c;
}

// ---------- Elementos vivos da sala ----------
function drawWall(t) {
  const { W } = layout;
  const h = brtHour();
  const night = h >= 19 || h < 5;
  const sky = h >= 7 && h < 17 ? ['#7ec8ff', '#b7e3ff'] : h >= 17 && h < 19 ? ['#ff9f6b', '#ffd28a'] : h >= 5 && h < 7 ? ['#8a7cd6', '#ffb8a0'] : ['#14123a', '#252262'];
  // quadro branco (esquerda): um post-it lima por tarefa em revisão, lilás por tarefa em andamento
  const bx = PAD, by = 6;
  R(bx - 1, by - 1, 46, 30, '#8d93a3'); R(bx, by, 44, 28, '#f4f2fb'); R(bx, by + 26, 44, 2, '#d9d5e6');
  const rev = S.tasks.filter((x) => x.status === 'review').length, doing = S.tasks.filter((x) => x.status === 'doing').length;
  let k = 0;
  for (let i = 0; i < Math.min(rev, 8); i++, k++) R(bx + 3 + (k % 4) * 10, by + 3 + Math.floor(k / 4) * 9, 8, 7, P.lime);
  for (let i = 0; i < Math.min(doing, 8 - Math.min(rev, 8)); i++, k++) R(bx + 3 + (k % 4) * 10, by + 3 + Math.floor(k / 4) * 9, 8, 7, '#b5a2ff');
  R(bx + 3, by + 22, 26, 1, '#c8c4d8'); R(bx + 33, by + 21, 8, 2, '#e5484d');
  // janelas entre o quadro e o pôster/relógio
  const x0 = PAD + 50, x1 = W - PAD - 50, winN = x1 - x0 >= 58 ? Math.max(1, Math.floor((x1 - x0) / 70)) : 0; // tela estreita: sem janela
  for (let i = 0; i < winN; i++) {
    const ww = 52, wx = Math.round(x0 + ((x1 - x0) / winN) * i + ((x1 - x0) / winN) / 2 - ww / 2), wy = 5;
    R(wx - 2, wy - 2, ww + 4, 32, P.outline);
    R(wx, wy, ww, 28, sky[0]); R(wx, wy + 17, ww, 11, sky[1]);
    if (night) { for (let s = 0; s < 8; s++) { const sx = hash(`s${i}${s}`) % (ww - 2), sy = hash(`y${i}${s}`) % 14; if ((t / 600 + s) % 7 > 1) R(wx + 1 + sx, wy + 1 + sy, 1, 1, '#fff'); } R(wx + ww - 12, wy + 4, 5, 5, '#f4f2c8'); R(wx + ww - 11, wy + 4, 4, 4, sky[0]); }
    else { const cx = (Math.floor(t / 160) + i * 37) % (ww + 30) - 16; R(wx + cx, wy + 7, 12, 3, '#ffffffcc'); R(wx + cx + 3, wy + 5, 6, 2, '#ffffffcc'); if (h >= 7 && h < 17) R(wx + 6, wy + 4, 5, 5, '#fff3a8'); }
    for (let b = 0; b < 6; b++) { const bh = 6 + (hash(`b${i}${b}`) % 10); R(wx + b * 9, wy + 28 - bh, 8, bh, night ? '#2c2a55' : '#7a8db0'); if (h >= 18 || h < 6) { R(wx + b * 9 + 2, wy + 28 - bh + 2, 1, 1, '#ffd166'); R(wx + b * 9 + 5, wy + 28 - bh + 5, 1, 1, '#ffd166'); } }
    R(wx + ww / 2 - 1, wy, 2, 28, P.outline); R(wx, wy + 13, ww, 1, P.outline);
    R(wx - 3, wy + 29, ww + 6, 2, '#d9d5e6'); // peitoril
  }
  // pôster da marca e relógio (hora de Brasília)
  const px = W - PAD - 46, py = 6;
  R(px - 1, py - 1, 20, 26, P.outline); R(px, py, 18, 24, P.violet);
  // capacete do Zé (a marca da rede) e o rosto embaixo
  R(px + 5, py + 5, 8, 2, P.lime); R(px + 4, py + 7, 10, 3, P.lime); R(px + 2, py + 10, 14, 2, P.lime);
  R(px + 5, py + 12, 8, 7, '#f1c9a5'); R(px + 7, py + 14, 1, 1, '#1d1b18'); R(px + 10, py + 14, 1, 1, '#1d1b18'); R(px + 7, py + 17, 4, 1, '#c0392b');
  const cx = W - PAD - 12, cy = 16;
  R(cx - 8, cy - 8, 17, 17, P.outline); R(cx - 7, cy - 7, 15, 15, '#f4f2fb');
  for (let q = 0; q < 4; q++) { const ang = (q / 4) * Math.PI * 2; R(cx + Math.round(Math.sin(ang) * 6), cy - Math.round(Math.cos(ang) * 6), 1, 1, '#8d93a3'); }
  const hh = ((brtHour() % 12) + brtMin() / 60) / 12 * Math.PI * 2, mm = brtMin() / 60 * Math.PI * 2;
  for (let q = 0; q < 4; q++) R(cx + Math.round(Math.sin(hh) * q), cy - Math.round(Math.cos(hh) * q), 1, 1, P.outline);
  for (let q = 0; q < 6; q++) R(cx + Math.round(Math.sin(mm) * q), cy - Math.round(Math.cos(mm) * q), 1, 1, P.violet);
}
function plant(x, y, t, big = false) {
  const sway = Math.round(Math.sin(t / 900 + x) * 0.6);
  const ph = big ? 26 : 18;
  R(x + 1, y - 9, 12, 9, P.pot); R(x, y - 10, 14, 2, P.potHi); R(x + 2, y - 2, 10, 2, '#8f4322');
  R(x + 6 + sway, y - ph, 2, ph - 9, P.plantDark);
  const leaves = big ? [[0, -14], [8, -17], [1, -21], [9, -24], [3, -26], [7, -12], [-1, -18]] : [[0, -13], [8, -15], [2, -18], [7, -11]];
  for (const [lx, ly] of leaves) { R(x + 2 + lx + sway, y + ly, 5, 3, P.plant); R(x + 3 + lx + sway, y + ly, 3, 1, P.plantHi); }
  R(x + 4 + sway, y - 12, 6, 2, P.plantDark);
}
// Cantos livres das salas: café, bebedouro, flip chart, impressora, estante, sofá e plantas
function drawProps(t) {
  for (const p of layout.props) {
    const cx = Math.round(p.x + p.w / 2), base = p.y + 46; // base = chão na frente da linha de mesas
    switch (p.kind) {
      case 'coffee': { // balcão com máquina de café
        R(cx - 16, base - 16, 32, 16, P.outline); R(cx - 15, base - 15, 30, 14, P.desk); R(cx - 15, base - 15, 30, 3, P.deskTop); R(cx - 15, base - 15, 30, 1, P.deskHi);
        R(cx - 1, base - 10, 1, 8, P.deskDark);
        const mx = cx - 12, my = base - 37;
        R(mx - 1, my - 1, 16, 23, P.outline); R(mx, my, 14, 21, '#4a4458'); R(mx, my, 14, 2, '#6b6480');
        R(mx + 2, my + 3, 10, 5, '#20c997'); R(mx + 3, my + 4, 3, 1, '#c6fff0');
        R(mx + 4, my + 11, 6, 6, '#2a2533'); R(mx + 5, my + 14, 4, 3, '#f4f2fb');
        if (Math.floor(t / 400) % 2) { R(mx + 6, my + 9, 1, 2, '#ffffff99'); R(mx + 8, my + 8, 1, 2, '#ffffff66'); }
        R(cx + 5, base - 20, 5, 4, '#f4f2fb'); R(cx + 10, base - 19, 1, 2, '#f4f2fb'); R(cx + 6, base - 20, 3, 1, '#6b3a1e'); // caneca
        break;
      }
      case 'water': { // bebedouro
        const wx = cx - 5, wy = base - 30;
        R(wx - 1, wy + 7, 12, 23, P.outline); R(wx, wy + 8, 10, 21, '#e8e6f0'); R(wx + 2, wy + 12, 3, 2, '#5aa9ff'); R(wx + 6, wy + 12, 2, 2, '#ff6b6b');
        R(wx + 1, wy - 2, 8, 10, P.outline); R(wx + 2, wy - 1, 6, 8, '#8fd3ff'); R(wx + 3, wy, 4, 6, '#b9e6ff'); R(wx + 4, wy + 1 + (Math.floor(t / 900) % 4), 1, 1, '#ffffff');
        R(wx - 1, wy + 30, 12, 2, 'rgba(0,0,0,.2)');
        plant(cx + 10, base, t);
        break;
      }
      case 'board': { // cavalete com flip chart: o gráfico sobe com as tarefas feitas
        const fx = cx - 12, fy = base - 32;
        R(fx + 2, fy + 21, 1, 9, P.metalDark); R(fx + 19, fy + 21, 1, 9, P.metalDark); R(fx + 10, fy + 21, 1, 7, P.metalDark);
        R(fx - 1, fy - 1, 24, 23, P.outline); R(fx, fy, 22, 21, '#fbfaff'); R(fx, fy, 22, 2, '#d9d5e6');
        const done = Math.min(6, S.tasks.filter((x) => x.status === 'done').length);
        for (let i = 0; i < 6; i++) { const bh = 3 + ((hash(`fc${i}`) % 4) + (i < done ? 6 : 0)); R(fx + 3 + i * 3, fy + 18 - bh, 2, bh, i < done ? '#18b26b' : '#c8c4d8'); }
        R(fx + 2, fy + 18, 18, 1, P.outline);
        plant(cx + 13, base, t);
        break;
      }
      case 'printer': { // impressora num gaveteiro; de vez em quando sai uma folha
        R(cx - 11, base - 14, 22, 14, P.outline); R(cx - 10, base - 13, 20, 12, '#cfd3dd'); R(cx - 10, base - 9, 20, 1, '#9aa0ae'); R(cx - 10, base - 5, 20, 1, '#9aa0ae');
        R(cx - 12, base - 24, 24, 11, P.outline); R(cx - 11, base - 23, 22, 9, '#e8e6f0'); R(cx - 11, base - 23, 22, 2, '#ffffff'); R(cx - 8, base - 18, 16, 2, '#2a2533');
        R(cx + 6, base - 21, 2, 1, Math.floor(t / 500) % 2 ? P.lime : '#5d5873');
        const k = Math.floor(t / 250) % 12; if (k < 5) R(cx - 6, base - 18 + k, 12, 2, '#ffffff');
        R(cx - 7, base - 27, 14, 3, '#f4f2fb');
        break;
      }
      case 'shelf': { // estante com livros e pastas
        const w = Math.min(34, p.w - 10), x0 = cx - Math.round(w / 2), y0 = base - 40;
        R(x0 - 1, y0 - 1, w + 2, 41, P.outline); R(x0, y0, w, 39, P.desk);
        for (let r = 0; r < 3; r++) {
          R(x0 + 1, y0 + 12 + r * 13, w - 2, 2, P.deskDark);
          let bx = x0 + 2;
          for (let i = 0; bx < x0 + w - 4; i++) { const bw = 2 + (hash(`bk${p.x}${r}${i}`) % 3), bh = 7 + (hash(`bh${r}${i}`) % 4); R(bx, y0 + 12 + r * 13 - bh, bw, bh, ['#ff4f9a', '#5b2eff', '#c6f432', '#25b8d9', '#f0a43a', '#f4f2fb'][(hash(`bc${p.x}${r}${i}`)) % 6]); bx += bw + 1; }
        }
        break;
      }
      case 'sofa': { // sofá de espera na cor da equipe
        const col = p.col.color, w = Math.min(36, p.w - 10), x0 = cx - Math.round(w / 2);
        R(x0 - 1, base - 20, w + 2, 18, P.outline); R(x0, base - 19, w, 8, shade(col, -0.15)); R(x0, base - 11, w, 8, col); R(x0 + 1, base - 11, w - 2, 1, shade(col, 0.25));
        R(x0 - 3, base - 15, 4, 12, P.outline); R(x0 + w - 1, base - 15, 4, 12, P.outline); R(x0 - 2, base - 14, 2, 10, shade(col, -0.25)); R(x0 + w, base - 14, 2, 10, shade(col, -0.25));
        R(x0 + 2, base - 3, 2, 2, P.outline); R(x0 + w - 4, base - 3, 2, 2, P.outline);
        R(x0 + 4, base - 17, 7, 6, '#f4f2fb'); R(x0 + 5, base - 16, 5, 4, P.lime); // almofada
        break;
      }
      case 'plantS': plant(cx - 7, base - 4, t); break;
      default: plant(cx - 7, base, t, true);
    }
  }
}

// ---------- Pessoas ----------
// Cabeça 12×12 (com contorno) centrada em cx; hy = topo do cabelo. dir: -1 esquerda, 0 frente, 1 direita.
function drawHead(a, cx, hy, st, ph, dir = 0) {
  const skin = st === 'working' ? mix(a.skin, '#bfe3ff', 0.15) : a.skin;
  const hair = a.hair, hairHi = shade(a.hair, 0.22), skinSh = shade(a.skin, -0.12);
  const style = a.style || 'short';
  const x = cx - 6, y = hy + 1;
  if (style === 'long' || style === 'pony') { R(x - 1, y + 3, 14, 11, P.outline); R(x, y + 4, 12, 10, hair); } // cabelo atrás
  if (style === 'bun') { R(cx - 3, hy - 3, 6, 5, P.outline); R(cx - 2, hy - 2, 4, 3, hair); }
  if (style === 'pony') { R(x + (dir < 0 ? 12 : -2), y + 4, 3, 8, P.outline); R(x + (dir < 0 ? 12 : -1), y + 5, 2, 6, hair); }
  R(x, y, 12, 12, P.outline); // contorno
  R(x + 1, y + 1, 10, 10, skin);
  R(x + 1, y + 9, 10, 2, skinSh); // sombra do queixo
  R(x - 1 + (dir > 0 ? 12 : 0), y + 5, 2, 3, P.outline); R(x + (dir > 0 ? 12 : 0), y + 6, 1, 1, skin); // orelha
  // cabelo (frente)
  switch (style) {
    case 'bald': R(x + 1, y + 1, 10, 1, skinSh); R(x + 1, y + 4, 1, 3, hair); R(x + 10, y + 4, 1, 3, hair); R(x + 3, y + 2, 2, 1, '#ffffff55'); break;
    case 'curly': R(x, y - 1, 12, 4, P.outline); for (let i = 0; i < 6; i++) R(x + i * 2, y - 1 + (i % 2), 2, 3, i % 2 ? hairHi : hair); R(x + 1, y + 3, 1, 3, hair); R(x + 10, y + 3, 1, 3, hair); break;
    case 'spiky': for (let i = 0; i < 5; i++) { R(x + 1 + i * 2, y - 2 + (i % 2), 2, 2, P.outline); R(x + 1 + i * 2, y - 1 + (i % 2), 2, 2, hair); } R(x + 1, y + 1, 10, 2, hair); R(x + 3, y + 1, 3, 1, hairHi); break;
    case 'side': R(x + 1, y + 1, 10, 3, hair); R(x + 1, y + 4, 2, 2, hair); R(x + 6, y + 1, 4, 1, hairHi); R(x + 1, y + 1, 1, 5, hair); break;
    case 'cap': R(x, y - 1, 12, 4, P.outline); R(x + 1, y, 10, 3, a.team_color || a.color); R(x + 2, y, 4, 1, '#ffffff55'); R(x + (dir < 0 ? -2 : 7), y + 2, 6, 2, P.outline); R(x + (dir < 0 ? -1 : 8), y + 2, 4, 1, shade(a.team_color || a.color, -0.2)); R(x + 1, y + 3, 1, 2, hair); R(x + 10, y + 3, 1, 2, hair); break;
    case 'long': case 'pony': R(x + 1, y + 1, 10, 3, hair); R(x + 1, y + 4, 1, 5, hair); R(x + 10, y + 4, 1, 5, hair); R(x + 3, y + 1, 4, 1, hairHi); break;
    case 'bun': R(x + 1, y + 1, 10, 3, hair); R(x + 1, y + 4, 1, 2, hair); R(x + 10, y + 4, 1, 2, hair); R(x + 4, y + 1, 3, 1, hairHi); break;
    default: R(x + 1, y + 1, 10, 3, hair); R(x + 1, y + 4, 1, 2, hair); R(x + 10, y + 4, 1, 2, hair); R(x + 3, y + 1, 5, 1, hairHi);
  }
  // rosto
  const look = dir || (st === 'idle' && Math.floor(ph * 0.4) % 5 === 0 ? (Math.floor(ph * 0.4) % 2 ? 1 : -1) : 0);
  const ex = x + 3 + look, ey = y + 6;
  const blink = Math.floor(ph * 10) % 41 === 0;
  if (st === 'working' && !dir) { R(ex, ey + 1, 2, 1, P.outline); R(ex + 4, ey + 1, 2, 1, P.outline); }
  else if (blink || st === 'off') { R(ex, ey + 1, 2, 1, P.outline); R(ex + 4, ey + 1, 2, 1, P.outline); }
  else { R(ex, ey, 2, 2, P.outline); R(ex + 4, ey, 2, 2, P.outline); R(ex, ey, 1, 1, '#ffffffaa'); R(ex + 4, ey, 1, 1, '#ffffffaa'); }
  if ((hash(a.id) % 4 === 0) && st !== 'off') { R(ex - 1, ey - 1, 4, 1, '#2b2233aa'); R(ex + 3, ey - 1, 4, 1, '#2b2233aa'); R(ex + 2, ey, 2, 1, '#2b2233aa'); } // óculos
  R(x + 2, y + 8, 2, 1, '#ff8a8a55'); R(x + 8, y + 8, 2, 1, '#ff8a8a55'); // bochechas
  if (st === 'error') R(cx - 2 + look, y + 9, 4, 1, P.outline);
  else if (st === 'waiting') { R(cx - 1 + look, y + 9, 2, 1, '#7a2a2a'); }
  else if (st === 'idle') { R(cx - 2 + look, y + 9, 1, 1, '#00000066'); R(cx - 1 + look, y + 10, 2, 1, '#00000066'); R(cx + 1 + look, y + 9, 1, 1, '#00000066'); }
  else R(cx - 1 + look, y + 9, 2, 1, '#00000055');
  // fone de ouvido (suporte, comunidade): headset
  if (a.id === 'suporte' || a.id === 'comunidade') { R(x - 1, y + 3, 1, 5, '#2a2533'); R(x + 12, y + 3, 1, 5, '#2a2533'); R(x + 1, y, 10, 1, '#2a2533'); R(x + 12, y + 7, 1, 1, '#2a2533'); R(x + 10, y + 9, 3, 1, '#2a2533'); }
}
// Tronco 14 de largura (com contorno) a partir de ty (logo abaixo do queixo)
function shirtOf(a) {
  if (a.id === 'gerente') return '#24203a';
  const base = a.team_color || a.color;
  const k = ((hash(a.id) % 5) - 2) * 0.07; // variação de tom dentro da equipe
  return shade(base, k);
}
function drawTorso(a, cx, ty, h = 11) {
  const sh = shirtOf(a), shD = shade(sh, -0.22), shL = shade(sh, 0.18);
  const x = cx - 7;
  R(x, ty, 14, h, P.outline);
  R(x + 1, ty, 12, h, sh);
  R(x + 10, ty + 1, 3, h - 1, shD); // sombra lateral
  R(x + 1, ty, 12, 1, shL);
  R(cx - 2, ty, 4, 1, shade(a.skin, -0.1)); // pescoço
  if (a.id === 'gerente') { R(cx - 2, ty, 4, 3, '#f4f2fb'); R(cx - 1, ty + 1, 2, h - 2, P.lime); R(cx - 1, ty + 1, 2, 1, shade(P.lime, -0.3)); }
  else if (a.id === 'diretor') { R(cx - 2, ty, 4, 4, '#f4f2fb'); R(x + 1, ty + 1, 3, h - 1, shade(sh, -0.3)); R(x + 10, ty + 1, 3, h - 1, shade(sh, -0.36)); }
  else if (a.area_manager) { R(cx - 3, ty, 2, 2, '#f4f2fb'); R(cx + 1, ty, 2, 2, '#f4f2fb'); } // gola
  else R(cx - 2, ty, 4, 1, shD); // gola careca
  // crachá na cor do agente (cordão branco)
  if (a.id !== 'gerente') { R(cx - 3, ty + 1, 1, 4, '#ffffffcc'); R(cx + 2, ty + 1, 1, 4, '#ffffffcc'); R(cx - 3, ty + 5, 6, 4, '#f4f2fb'); R(cx - 2, ty + 6, 4, 2, a.color); }
}
// Pessoa sentada atrás da mesa (só cabeça, tronco e braços aparecem). deskY = topo do tampo.
function drawSeated(a, cell, st, t, ph) {
  const cx = cell.x + 36;
  const breath = st === 'idle' ? Math.floor(ph * 0.8) % 2 : 0;
  const shake = st === 'error' ? (Math.floor(t / 120) % 2 ? 1 : -1) : 0;
  const hy = cell.y + 5 + breath + (st === 'working' && Math.floor(ph * 3) % 5 === 0 ? 1 : 0);
  const ty = cell.y + 18 + breath;
  const deskY = cell.y + 29;
  const sh = shirtOf(a), skin = a.skin;
  drawTorso(a, cx, ty, deskY - ty + 1);
  // braços
  const sleeve = (x, y, h) => { R(x - 1, y, 5, h, P.outline); R(x, y, 3, h, sh); };
  const hand = (x, y) => { R(x - 1, y - 1, 5, 4, P.outline); R(x, y, 3, 2, skin); };
  if (st === 'working') {
    const f = Math.floor(ph * 9) % 3; // 3 quadros de digitação
    sleeve(cx - 10, ty + 2, 8); sleeve(cx + 7, ty + 2, 8);
    hand(cx - 7, deskY - 1 - (f === 0 ? 1 : 0)); hand(cx + 4, deskY - 1 - (f === 2 ? 1 : 0));
  } else if (st === 'waiting') {
    const w = Math.floor(ph * 5) % 2; // acena
    sleeve(cx - 10, ty + 2, 8); hand(cx - 8, deskY - 1);
    R(cx + 7, ty - 7 + w, 5, 10, P.outline); R(cx + 8, ty - 6 + w, 3, 9, sh); hand(cx + 8, ty - 10 + w);
  } else if (st === 'error') {
    R(cx - 11, ty - 6, 5, 9, P.outline); R(cx - 10, ty - 5, 3, 8, sh); hand(cx - 10, ty - 9 + shake);
    R(cx + 6, ty - 6, 5, 9, P.outline); R(cx + 7, ty - 5, 3, 8, sh); hand(cx + 7, ty - 9 - shake);
  } else if (st === 'blocked') {
    sleeve(cx - 9, ty + 2, 6); sleeve(cx + 6, ty + 2, 6); R(cx - 7, ty + 6, 14, 3, P.outline); R(cx - 6, ty + 6, 12, 2, shade(sh, -0.1)); // braços cruzados
  } else {
    sleeve(cx - 10, ty + 2, 8); sleeve(cx + 7, ty + 2, 8);
    const sip = Math.floor(ph * 0.5) % 6 === 0; // toma um gole de café de vez em quando
    hand(cx - 8, deskY - 1);
    if (sip) { R(cx + 5, ty - 1, 5, 4, '#f4f2fb'); R(cx + 6, ty, 3, 1, '#6b3a1e'); hand(cx + 4, ty + 2); } else hand(cx + 5, deskY - 1);
  }
  drawHead(a, cx + shake, hy, st, ph);
}
// Pessoa em pé / andando. (fx, fy) = pés. dir -1/1. carrying = caneca na mão.
function drawStanding(a, fx, fy, t, dir, moving, carrying) {
  const ph = t / 1000;
  const step = moving ? Math.floor(t / 140) % 2 : 0;
  const hy = fy - 31 - (moving && step ? 1 : 0);
  const ty = hy + 13;
  R(fx - 6, fy - 1, 12, 2, 'rgba(0,0,0,.22)'); // sombra
  // pernas
  const leg = (x, lift) => { R(x - 1, ty + 10, 5, 9 - lift, P.outline); R(x, ty + 10, 3, 8 - lift, P.pants); R(x - (dir < 0 ? 1 : 0), fy - 3 - lift, 4, 2, P.shoe); };
  leg(fx - 4, moving && step ? 1 : 0); leg(fx + 1, moving && !step ? 1 : 0);
  drawTorso(a, fx, ty, 11);
  const sh = shirtOf(a);
  const swing = moving ? (step ? 1 : -1) : 0;
  R(fx - 10, ty + 1 + swing, 5, 9, P.outline); R(fx - 9, ty + 1 + swing, 3, 8, sh); R(fx - 9, ty + 9 + swing, 3, 2, a.skin);
  R(fx + 5, ty + 1 - swing, 5, 9, P.outline); R(fx + 6, ty + 1 - swing, 3, 8, sh); R(fx + 6, ty + 9 - swing, 3, 2, a.skin);
  if (carrying) { R(fx + (dir < 0 ? -12 : 7), ty + 6 - swing, 4, 4, '#f4f2fb'); R(fx + (dir < 0 ? -11 : 8), ty + 6 - swing, 2, 1, '#6b3a1e'); if (Math.floor(ph * 3) % 2) R(fx + (dir < 0 ? -11 : 9), ty + 3, 1, 2, '#ffffff99'); }
  drawHead(a, fx, hy, 'idle', ph, dir);
}

// ---------- Mesa, cadeira, monitor ----------
const CHART_ROLES = ['financeiro', 'gerente-financeiro', 'gestor-trafego', 'gerente-crescimento', 'diretor', 'operacoes'];
function drawScreen(a, sx, sy, st, t, away) {
  const w = 16, h = 11;
  if (st === 'off') { R(sx, sy, w, h, P.screenOff); R(sx + 1, sy + 1, 3, 1, '#ffffff14'); return; }
  if (st === 'error') { const on = Math.floor(t / 260) % 2; R(sx, sy, w, h, on ? '#b3202a' : '#7a1f26'); for (let i = 0; i < 5; i++) { R(sx + 5 + i, sy + 3 + i * 1, 1, 1, '#fff'); R(sx + 9 - i, sy + 3 + i * 1, 1, 1, '#fff'); } return; }
  if (st === 'waiting') { R(sx, sy, w, h, '#3a2a12'); R(sx + 7, sy + 2, 2, 5, '#ffd166'); R(sx + 7, sy + 8, 2, 1, '#ffd166'); return; }
  if (st === 'blocked') { R(sx, sy, w, h, '#2e2412'); for (let i = 0; i < 3; i++) R(sx + 4 + i * 3, sy + 5, 2, 2, '#f0a43a'); return; }
  if (st === 'idle' || away) { // proteção de tela: logo da marca subindo e descendo na cor da equipe
    R(sx, sy, w, h, '#1c1830');
    const yy = sy + 2 + (Math.floor(t / 700 + hash(a.id)) % 5), xx = sx + 2 + (Math.floor(t / 500 + hash(a.id)) % 10);
    R(xx, yy, 3, 3, teamColor(a)); R(xx + 1, yy + 1, 1, 1, '#fff');
    return;
  }
  R(sx, sy, w, h, '#101826');
  if (CHART_ROLES.includes(a.id)) { // gráfico subindo
    const f = Math.floor(t / 300);
    for (let i = 0; i < 6; i++) { const bh = 2 + ((hash(`${a.id}${i}`) + f + i) % 7); R(sx + 1 + i * 2 + i % 2, sy + h - 1 - bh, 2, bh, i % 2 ? P.lime : '#5ec8ff'); }
    R(sx + 1, sy + h - 1, w - 2, 1, '#4a5a70');
  } else { // código rolando
    const f = Math.floor(t / 220);
    const cols = ['#c6f432', '#8ea0ff', '#ff79c6', '#5ec8ff', '#ffd166', '#f4f2fb'];
    for (let r = 0; r < 5; r++) { const line = (f + r + hash(a.id)) % 23; const ind = (line % 4) * 2, len = 3 + (line * 7) % 9; R(sx + 1 + ind, sy + 1 + r * 2, Math.min(len, w - 2 - ind), 1, cols[(line + r) % cols.length]); }
    if (Math.floor(t / 400) % 2) R(sx + 2 + (f % 10), sy + 9, 2, 1, '#fff'); // cursor
  }
}
function screenColor(st) { return st === 'error' ? '#ff4d5a' : st === 'waiting' ? '#ffd166' : st === 'working' ? '#7fd0ff' : st === 'blocked' ? '#f0a43a' : null; }

function drawStation(cell, a, t, walking) {
  const st = vis(a);
  const x = cell.x, y = cell.y;
  const seed = hash(a.id);
  const ph = (t + (seed % 1000)) / 1000;
  const mgrDesk = a.team === 'direcao';
  // tapete da equipe sob a estação
  R(x + 3, y + 22, SW - 6, 30, mix(darkTheme() ? '#2a2438' : '#efe6d6', teamColor(a), 0.28));
  R(x + 3, y + 22, SW - 6, 1, mix('#ffffff', teamColor(a), 0.5));
  // destaque (passar o mouse / selecionado)
  if (hover === a.id || selectedAgent === a.id) {
    const c = selectedAgent === a.id ? P.lime : '#ffffff';
    R(x + 1, y + 1, SW - 2, 1, c); R(x + 1, y + SH - 2, SW - 2, 1, c); R(x + 1, y + 1, 1, SH - 2, c); R(x + SW - 2, y + 1, 1, SH - 2, c);
    ctx.globalAlpha = 0.14; R(x + 2, y + 2, SW - 4, SH - 4, c); ctx.globalAlpha = 1;
  }
  // cadeira (encosto)
  const cx = x + 36;
  const chair = mgrDesk ? '#3a1f2a' : P.chair, chairHi = mgrDesk ? '#5a3040' : P.chairHi;
  const here = st !== 'off' && !walking;
  if (here) { R(cx - 9, y + 9, 18, 21, P.outline); R(cx - 8, y + 10, 16, 19, chair); R(cx - 7, y + 11, 14, 2, chairHi); }
  else { // cadeira vazia: encosto arredondado com almofada na cor da equipe e braços (não confundir com monitor)
    const cush = mix(chair, teamColor(a), 0.45);
    R(cx - 7, y + 11, 14, 19, P.outline); R(cx - 8, y + 12, 16, 17, P.outline);
    R(cx - 6, y + 12, 12, 17, cush); R(cx - 7, y + 13, 14, 15, cush);
    R(cx - 5, y + 13, 10, 1, shade(cush, 0.3)); R(cx - 4, y + 17, 8, 1, shade(cush, -0.2)); R(cx - 4, y + 21, 8, 1, shade(cush, -0.2));
    R(cx - 11, y + 21, 4, 8, P.outline); R(cx + 7, y + 21, 4, 8, P.outline); R(cx - 10, y + 22, 2, 6, chairHi); R(cx + 8, y + 22, 2, 6, chairHi);
  }
  if (here) drawSeated(a, cell, st, t, ph);
  // mesa
  const top = mgrDesk ? '#6e4a7a' : P.deskTop, hi = mgrDesk ? '#8a62a0' : P.deskHi, front = mgrDesk ? '#4c3157' : P.desk, dark = mgrDesk ? '#33203b' : P.deskDark;
  R(x + 2, y + 28, SW - 4, 6, P.outline);
  R(x + 3, y + 29, SW - 6, 4, top); R(x + 3, y + 29, SW - 6, 1, hi);
  R(x + 2, y + 33, SW - 4, 13, P.outline); R(x + 3, y + 33, SW - 6, 12, front);
  R(x + 3, y + 33, SW - 6, 1, dark); R(x + 30, y + 36, SW - 36, 1, dark); R(x + 30, y + 40, SW - 36, 1, dark);
  R(x + 41, y + 37, 3, 1, hi); R(x + 41, y + 41, 3, 1, hi); // puxadores das gavetas
  R(x + 2, y + 46, SW - 4, 2, P.deskShadow);
  // monitor (virado para nós, no canto esquerdo da mesa) com a luz da tela
  const mx = x + 6, my = y + 13;
  const glow = here ? screenColor(st) : null;
  if (glow) { ctx.globalAlpha = 0.18 + 0.06 * Math.sin(t / 300); R(mx - 2, my - 2, 22, 17, glow); R(mx - 1, y + 29, 22, 3, glow); ctx.globalAlpha = 1; }
  R(mx + 7, my + 13, 4, 3, P.metalDark); R(mx + 4, my + 15, 10, 2, P.metal);
  R(mx - 1, my - 1, 20, 15, P.outline); R(mx, my, 18, 13, '#2d2a38');
  drawScreen(a, mx + 1, my + 1, here ? st : (st === 'off' ? 'off' : 'idle'), t, walking);
  R(mx + 8, my + 12, 2, 1, here && st === 'working' ? P.lime : '#5d5873'); // LED
  // teclado e mouse
  R(cx - 8, y + 30, 16, 3, '#2a2533'); R(cx - 7, y + 30, 14, 2, '#cfd3dd'); for (let i = 0; i < 6; i++) R(cx - 6 + i * 2, y + 30, 1, 1, '#9aa0ae');
  R(cx + 10, y + 30, 3, 2, '#cfd3dd');
  // caneca, planta ou papéis
  if (seed % 3 === 0) { R(x + 50, y + 26, 5, 4, '#f4f2fb'); R(x + 55, y + 27, 1, 2, '#f4f2fb'); R(x + 51, y + 26, 3, 1, '#6b3a1e'); if (here && st === 'idle' && Math.floor(ph * 2) % 3) R(x + 52 + (Math.floor(ph * 4) % 2), y + 22, 1, 3, '#ffffff99'); }
  else if (seed % 3 === 1) { R(x + 50, y + 25, 5, 5, P.pot); R(x + 49, y + 21, 3, 4, P.plant); R(x + 52, y + 19, 3, 6, P.plantHi); R(x + 54, y + 22, 2, 3, P.plant); }
  else { R(x + 48, y + 27, 9, 3, '#f4f2fb'); R(x + 49, y + 26, 8, 1, '#e2dff0'); R(x + 50, y + 25, 6, 1, '#f4f2fb'); }
  if (a.id === 'gerente') {
    // bandeja de aprovação: uma folha por item esperando o Gerente Geral, carimbo vermelho
    const pend = Math.min(5, S.tasks.filter((z) => z.status === 'review' && !z.reviewed_by).length);
    R(x + 46, y + 28, 11, 2, '#2a1a12'); for (let i = 0; i < pend; i++) R(x + 47, y + 27 - i, 9, 1, i % 2 ? '#e2dff0' : '#f4f2fb');
    R(x + 44, y + 21 - pend, 2, 5, P.outline); R(x + 42, y + 25 - pend, 6, 2, '#e5484d');
  }
  if (here) {
    if (st === 'waiting') bubble(cx, y + 2 + Math.round(Math.sin(ph * 4) * 1.5), '#ffd166', '!');
    else if (st === 'error') bubble(cx, y + 2, Math.floor(t / 300) % 2 ? '#ff4d5a' : '#ff8088', 'x');
    else if (st === 'blocked') bubble(cx, y + 2, '#f0a43a', '…');
    else if (st === 'working' && Math.floor(ph * 0.5) % 4 === 0) { const k = Math.floor(ph * 6) % 4; for (let i = 0; i < k; i++) R(cx + 10 + i * 3, y + 6 - i, 2, 2, P.lime); }
  }
}
function bubble(cx, cy, color, glyph) {
  R(cx - 7, cy - 6, 14, 11, P.outline); R(cx - 6, cy - 5, 12, 9, color); R(cx - 1, cy + 5, 3, 2, P.outline); R(cx, cy + 4, 1, 2, color);
  if (glyph === '!') { R(cx - 1, cy - 3, 2, 4, P.outline); R(cx - 1, cy + 2, 2, 1, P.outline); }
  else if (glyph === 'x') { for (let i = 0; i < 5; i++) { R(cx - 2 + i, cy - 3 + i, 1, 1, '#fff'); R(cx + 2 - i, cy - 3 + i, 1, 1, '#fff'); } }
  else { R(cx - 4, cy, 2, 1, P.outline); R(cx - 1, cy, 2, 1, P.outline); R(cx + 2, cy, 2, 1, P.outline); }
}
// ---------- Passeio: quem está livre levanta de vez em quando para o café, o bebedouro, o flip chart ou a impressora da própria sala ----------
const walkers = new Map(); // id → { go, back, leg, i, x, y, wait, carrying }
const WALK_TO = ['coffee', 'water', 'board', 'printer'];
let lastWalkCheck = 0;
function planWalk(a, cell, now) {
  const spots = cell.col.props.filter((p) => WALK_TO.includes(p.kind));
  if (!spots.length) return null;
  const p = spots[hash(a.id + Math.floor(now / 60000)) % spots.length];
  // sai pelo lado direito da mesa (a cadeira fica vazia), anda pela frente das mesas até a linha do destino e para ao lado dele
  const col = cell.col;
  const ox = Math.min(col.x + col.w - 5, cell.x + SW - 3 + Math.floor((cell.gap || 0) / 2));
  const out = { x: ox, y: cell.y + 34 };
  const lane = p.y + 52; // chão logo abaixo da linha de mesas do destino
  const dx = Math.max(col.x + 8, Math.min(col.x + col.w - 8, Math.round(p.x + p.w / 2) + (p.kind === 'coffee' ? -20 : -16)));
  const go = [out, { x: ox, y: Math.max(out.y, lane) }, { x: dx, y: lane }];
  return { go, back: go.slice().reverse(), leg: 'go', i: 1, x: out.x, y: out.y, wait: 0, carrying: false, coffee: p.kind === 'coffee' };
}
function updateWalkers(ts, dt) {
  if (reduce) { walkers.clear(); return; }
  for (const [id, w] of walkers) {
    const a = agentOf(id);
    if (!a || vis(a) !== 'idle') { walkers.delete(id); continue; } // voltou a trabalhar: senta na hora
    if (w.wait > 0) { w.wait -= dt; if (w.wait <= 0) { w.leg = 'back'; w.i = 1; w.carrying = w.coffee; } continue; }
    const path = w.leg === 'go' ? w.go : w.back;
    const tgt = path[w.i];
    const dx = tgt.x - w.x, dy = tgt.y - w.y, d = Math.hypot(dx, dy), v = 22 * dt / 1000;
    w.dir = dx < -0.5 ? -1 : dx > 0.5 ? 1 : (w.dir || 1);
    if (d <= v) { w.x = tgt.x; w.y = tgt.y; w.i++; if (w.i >= path.length) { if (w.leg === 'go') w.wait = 3500 + (hash(id) % 3000); else walkers.delete(id); } }
    else { w.x += (dx / d) * v; w.y += (dy / d) * v; }
  }
  if (ts - lastWalkCheck < 4000) return;
  lastWalkCheck = ts;
  const idle = layout.cells.filter((c) => { const a = agentOf(c.id); return a && vis(a) === 'idle' && !walkers.has(c.id) && c.col.props.some((p) => WALK_TO.includes(p.kind)); });
  if (walkers.size >= 3 || !idle.length || Math.random() > 0.45) return;
  const c = idle[Math.floor(Math.random() * idle.length)];
  const w = planWalk(agentOf(c.id), c, Date.now());
  if (w) walkers.set(c.id, w);
}

// ---------- Etiquetas (no espaço da tela: texto nítido, ≥ 12 px) ----------
const ST_DOT = { working: '#c6f432', waiting: '#ffd166', idle: '#8ea0ff', blocked: '#f0a43a', error: '#ff4d5a', off: '#6b6680' };
function drawLabels() {
  const { s, dpr } = layout;
  ctx = mctx;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const fs = Math.round(12.5 * dpr);
  ctx.font = `700 ${fs}px Inter, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  for (const c of layout.cells) {
    const a = agentOf(c.id);
    if (!a) continue;
    const st = vis(a);
    const cx = (c.x + SW / 2) * s, cy = (c.y + 53.5) * s;
    const room = (SW + Math.max(0, (c.gap || 0) - 2)) * s; // pode avançar no vão entre as mesas
    let f = fs;
    ctx.font = `700 ${f}px Inter, system-ui, sans-serif`;
    if (ctx.measureText(a.name).width + f * 1.6 > room) { f = Math.round(12 * dpr); ctx.font = `700 ${f}px Inter, system-ui, sans-serif`; } // aperta até 12 px antes de cortar
    const tw = Math.min(ctx.measureText(a.name).width, room - f * 1.6);
    const w = tw + f * 1.6, h = fs * 1.55;
    const x0 = Math.round(cx - w / 2), y0 = Math.round(cy - h / 2);
    ctx.fillStyle = st === 'off' ? 'rgba(21,18,31,.62)' : 'rgba(21,18,31,.88)';
    roundRect(x0, y0, w, h, h / 2.6); ctx.fill();
    ctx.save(); roundRect(x0, y0, w, h, h / 2.6); ctx.clip(); // etiqueta da equipe: faixa na ponta esquerda
    ctx.fillStyle = teamColor(a); ctx.fillRect(x0, y0, Math.round(fs * 0.4), h); ctx.restore();
    ctx.fillStyle = ST_DOT[st];
    ctx.beginPath(); ctx.arc(x0 + f * 0.92, cy, f * 0.24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = st === 'off' ? '#a9a4bd' : '#ffffff';
    ctx.textAlign = 'left';
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w - f * 0.25, h); ctx.clip();
    ctx.fillText(a.name, x0 + f * 1.3, cy + dpr * 0.5);
    ctx.restore();
    ctx.font = `700 ${fs}px Inter, system-ui, sans-serif`;
  }
  // placa de cada sala (nome da área), centrada no alto da coluna
  const f2 = Math.round(11.5 * dpr);
  ctx.font = `800 ${f2}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  for (const col of layout.cols) {
    const label = col.name.toUpperCase();
    const tw = ctx.measureText(label).width;
    const w = tw + f2 * 2.1, h = f2 * 1.7;
    const x0 = Math.round((col.x + col.w / 2) * s - w / 2), y0 = Math.round((col.y + (PLATE - 3) / 2) * s - h / 2);
    ctx.fillStyle = 'rgba(15,13,28,.82)'; roundRect(x0, y0, w, h, h / 2); ctx.fill();
    ctx.fillStyle = col.color; ctx.beginPath(); ctx.arc(x0 + f2 * 0.85, y0 + h / 2, f2 * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4f2fb'; ctx.fillText(label, x0 + f2 * 1.4, y0 + h / 2 + dpr * 0.5);
  }
  // dica ao passar o mouse: status e tarefa atual
  const hv = hover && agentOf(hover);
  const hc = hover && layout.cells.find((c) => c.id === hover);
  if (hv && hc) {
    const st = vis(hv);
    const f3 = Math.round(12 * dpr);
    const l1 = `${hv.name} · ${ST_LABEL[st]}`, l2 = (hv.current_task || hv.role || '').slice(0, 60);
    ctx.font = `700 ${f3}px Inter, system-ui, sans-serif`;
    const w1 = ctx.measureText(l1).width;
    ctx.font = `500 ${f3}px Inter, system-ui, sans-serif`;
    const w = Math.max(w1, ctx.measureText(l2).width) + f3 * 1.4, h = f3 * 3.3;
    let x0 = (hc.x + SW / 2) * s - w / 2; x0 = Math.max(4 * dpr, Math.min(canvas.width - w - 4 * dpr, x0));
    let y0 = hc.y * s - h + 4 * dpr; if (y0 < 4 * dpr) y0 = (hc.y + SH) * s;
    ctx.fillStyle = 'rgba(255,255,255,.97)'; roundRect(x0, y0, w, h, f3 * 0.5); ctx.fill();
    ctx.fillStyle = teamColor(hv); ctx.fillRect(x0 + f3 * 0.5, y0 + h - 3 * dpr, w - f3, 2 * dpr);
    ctx.fillStyle = '#15121f'; ctx.textAlign = 'left';
    ctx.font = `700 ${f3}px Inter, system-ui, sans-serif`; ctx.fillText(l1, x0 + f3 * 0.7, y0 + f3 * 1.05);
    ctx.fillStyle = '#4b4660'; ctx.font = `500 ${f3}px Inter, system-ui, sans-serif`; ctx.fillText(l2, x0 + f3 * 0.7, y0 + f3 * 2.25);
  }
  if (S.settings.kill) {
    ctx.fillStyle = 'rgba(10,8,20,.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const f2 = Math.round(Math.min(28 * dpr, 9 * s));
    ctx.font = `800 ${f2}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = '#ff4d5a'; ctx.textAlign = 'center';
    ctx.fillText('AGÊNCIA PARADA', canvas.width / 2, canvas.height / 2);
  }
  ctx.restore();
  ctx = actx;
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

let lastFrame = 0;
const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(ts) {
  requestAnimationFrame(frame);
  if (document.hidden || $('.of-office').hidden) return;
  if (ts - lastFrame < (reduce ? 1000 : 1000 / 12)) return; // 12 quadros por segundo: cara de pixel art e pouca bateria
  const dt = Math.min(500, ts - (lastFrame || ts));
  lastFrame = ts;
  const t = reduce ? 0 : ts;
  draw(t, ts, dt);
}
function draw(t, ts = 0, dt = 0) {
  if (!bg) buildBg();
  updateWalkers(ts, dt);
  ctx = actx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(bg, 0, 0);
  drawWall(t);
  drawProps(t);
  for (const c of layout.cells) { const a = agentOf(c.id); if (a) drawStation(c, a, t, walkers.has(c.id)); }
  for (const [id, w] of [...walkers].sort((p, q) => p[1].y - q[1].y)) { const a = agentOf(id); if (a) drawStanding(a, Math.round(w.x), Math.round(w.y), t, w.dir || 1, w.wait <= 0, w.carrying); }
  mctx.setTransform(1, 0, 0, 1, 0, 0);
  mctx.imageSmoothingEnabled = false;
  mctx.drawImage(art, 0, 0, canvas.width, canvas.height);
  drawLabels();
}
function cellAt(ev) {
  const r = canvas.getBoundingClientRect();
  const lx = ((ev.clientX - r.left) / r.width) * layout.W, ly = ((ev.clientY - r.top) / r.height) * layout.H;
  for (const [id, w] of walkers) if (lx >= w.x - 8 && lx <= w.x + 8 && ly >= w.y - 34 && ly <= w.y + 1) return id;
  const c = layout.cells.find((c) => lx >= c.x && lx < c.x + SW && ly >= c.y && ly < c.y + SH);
  return c ? c.id : null;
}
canvas.addEventListener('mousemove', (e) => { const h = cellAt(e); if (h !== hover) { hover = h; canvas.classList.toggle('hover', !!hover); if (reduce) draw(0); } });
canvas.addEventListener('mouseleave', () => { hover = null; canvas.classList.remove('hover'); });
canvas.addEventListener('click', (e) => { const id = cellAt(e); if (id) openAgent(id); });
// Tema claro/escuro muda as cores da sala
if (window.matchMedia) { const mq = window.matchMedia('(prefers-color-scheme: dark)'); (mq.addEventListener ? mq.addEventListener('change', computeLayout) : mq.addListener(computeLayout)); }
new MutationObserver(() => computeLayout()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// =====================================================================
// Elenco, quadro, feed
// =====================================================================
function renderRoster() {
  $('#roster').innerHTML = S.agents.map((a) => {
    const st = vis(a);
    const sub = st === 'off' ? (a.enabled ? `Sem sinal ${ago(a.last_heartbeat)}` : 'Desligado') : a.current_task || ST_LABEL[st];
    return `<li><button type="button" class="of-ag st-${st}${st === 'off' ? ' off' : ''}" data-agent="${esc(a.id)}" style="--tc:${esc(teamColor(a))}">
      <span class="of-ag-av" style="background:${esc(a.color)};color:${ink(a.color)}">${esc(initials(a.name))}</span>
      <span class="of-ag-t"><b>${esc(a.name)}</b><span>${esc(sub)}</span></span>${a.team_name ? `<span class="of-team">${esc(a.team_name)}</span>` : ''}</button></li>`;
  }).join('');
}
// Quem escreveu o comentário: "Gerente: …" (Gerente Geral), "Ger. Marketing: …" (gerente de área) ou o dono
function fbWho(f) {
  const m = /^((?:Gerente|Ger\.)[^:]{0,40}): /.exec(f || '');
  if (!m) return { who: 'Seu comentário', text: f };
  return { who: `Comentário ${m[1] === 'Gerente' ? 'do Gerente Geral' : `de ${m[1]}`}`, text: f.slice(m[0].length) };
}
const areaName = (id) => { const a = agentOf(id); return a ? a.team_name || a.name : id; };
const areaColor = (id) => teamColor(agentOf(id));
// Precisa do dono: sensível ou deixada pelo Gerente (escalada), e ainda não fechada
// (só em Revisão: é o que aparece na caixa Aprovar; sensível ainda em andamento não pede nada ao dono)
const needsYou = (t) => t.status === 'review' && (t.sensitive || t.escalated || t.approval === 'pendente');
function taskChips(t) {
  const byG = t.reviewed_by === 'gerente';
  const out = [];
  if (t.approval === 'pendente' && t.status === 'review') out.push(t.escalated ? '<span class="of-chip wait" title="O Gerente Geral olhou e deixou para você">Gerente Geral: precisa de você</span>' : '<span class="of-chip wait">aguardando você</span>');
  else if (t.approval === 'rejeitado') out.push(`<span class="of-chip rej">${byG ? 'Gerente Geral: ajustar' : 'ajustar'}</span>`);
  else if (t.approval === 'aprovado') out.push(byG ? '<span class="of-chip ger" title="Aprovado pelo Gerente Geral (dá para conferir e reabrir)">aprovado pelo Gerente Geral</span>' : '<span class="of-chip ok">aprovado</span>');
  if (t.sensitive) out.push(`<span class="of-chip sens" title="${esc(t.sensitive_reason || 'Sensível')}: só você aprova">sensível</span>`);
  if (t.pre_approved && t.area_review_by) out.push(`<span class="of-chip pre" style="--tc:${esc(areaColor(t.area_review_by))}" title="${esc(t.area_review_note || '')}">pré-aprovado por ${esc(areaName(t.area_review_by))}</span>`);
  else if (t.area_review === 'ajustes' && t.approval === 'rejeitado' && !byG) out.push(`<span class="of-chip pre" style="--tc:${esc(areaColor(t.area_review_by))}">${esc(areaName(t.area_review_by))} pediu ajustes</span>`);
  return out.join('');
}
// Parada: em A fazer/Fazendo sem atividade (mudança na tarefa ou mensagem na conversa) há mais de 24 h
const STALE_MS = 24 * 3600000;
const lastActivity = (t) => Math.max(t.updated_at || 0, (t.last_comment && t.last_comment.created_at) || 0);
const isStale = (t) => (t.status === 'backlog' || t.status === 'doing') && Date.now() - lastActivity(t) > STALE_MS;
const staleFor = (t) => { const h = Math.floor((Date.now() - lastActivity(t)) / 3600000); return h >= 48 ? `${Math.floor(h / 24)}d` : `${h}h`; };
function taskCard(t) {
  const a = agentOf(t.assignee);
  const chip = (isStale(t) ? `<span class="of-chip stale" title="Sem atividade desde ${esc(fmt(lastActivity(t)))}">parada há ${staleFor(t)}</span>` : '') + taskChips(t);
  return `<button type="button" class="of-task p${t.priority}" draggable="true" data-task="${t.id}">
    <span class="of-task-t">${esc(t.title)}</span>
    <span class="of-task-m">${a ? `<span class="of-chip"><i style="background:${esc(a.color)};color:${ink(a.color)}"></i>${esc(a.name)}</span>` : '<span class="of-chip">sem responsável</span>'}${chip}
    ${t.artifacts && t.artifacts.length ? `<span>${t.artifacts.length} entrega${t.artifacts.length > 1 ? 's' : ''}</span>` : ''}${t.files && t.files.length ? `<span>${t.files.length} arquivo${t.files.length > 1 ? "s" : ""}</span>` : ''}<span>#${t.id} · ${ago(t.updated_at)}</span></span></button>`;
}
let needYouOnly = false, staleOnly = false, showOldDone = false;
const DONE_DAYS = 7, DONE_MAX = 12; // coluna Feito: só a última semana (e no máximo 12 cartões); o resto fica atrás de "Ver mais antigos"
function renderBoard() {
  const f = $('#boardFilter').value;
  const tasks = S.tasks.filter((t) => (!f || t.assignee === f) && (!needYouOnly || needsYou(t)) && (!staleOnly || isStale(t)));
  const since = Date.now() - DONE_DAYS * 86400000;
  $('#board').innerHTML = Object.entries(COL).map(([k, label]) => {
    let list = tasks.filter((t) => t.status === k).sort((a, b) => (k === 'done' ? b.updated_at - a.updated_at : a.priority - b.priority || b.updated_at - a.updated_at));
    const total = list.length;
    let more = '';
    if (k === 'done') {
      const recent = list.filter((t) => t.updated_at >= since).slice(0, DONE_MAX);
      const old = list.length - recent.length;
      if (!showOldDone) list = recent;
      if (old) more = `<button type="button" class="of-more" data-old-done aria-expanded="${showOldDone}">${showOldDone ? 'Mostrar só os mais recentes' : `Ver mais antigos (${old})`}</button>`;
    }
    return `<section class="of-col ${k}" data-col="${k}"><div class="of-col-h">${label}<span>${total}</span></div>
      ${list.length ? list.slice(0, 200).map(taskCard).join('') : `<div class="of-empty">${k === 'done' && total ? 'Nada nos últimos 7 dias.' : 'Nada aqui.'}</div>`}${more}</section>`;
  }).join('');
  const rev = S.tasks.filter((t) => t.status === 'review').length;
  const b = $('#reviewCount');
  b.hidden = !rev; b.textContent = rev;
  const ny = S.tasks.filter(needsYou).length;
  const nb = $('#needYouCount');
  nb.hidden = !ny; nb.textContent = ny;
  $('#needYou').setAttribute('aria-pressed', String(needYouOnly));
  const st = S.tasks.filter(isStale).length;
  const sb = $('#staleCount');
  sb.hidden = !st; sb.textContent = st;
  $('#staleOnly').setAttribute('aria-pressed', String(staleOnly));
}
function evRow(e, isNew = false) {
  const a = agentOf(e.agent_id);
  const who = e.agent_id === 'admin' ? '<span class="of-ev-av admin">EU</span>' : a ? `<span class="of-ev-av" style="background:${esc(a.color)};color:${ink(a.color)}">${esc(initials(a.name))}</span>` : '<span class="of-ev-av">·</span>';
  const link = href(e.link);
  const gerChip = e.agent_id === 'gerente' && e.level === 'success' && /aprovou/.test(e.message) ? '<span class="of-chip ger">aprovado pelo Gerente Geral</span> '
    : a && a.area_manager && /pré-aprovou/.test(e.message) ? `<span class="of-chip pre" style="--tc:${esc(teamColor(a))}">pré-aprovado por ${esc(a.team_name)}</span> ` : '';
  return `<li class="of-ev ${esc(e.level)}${isNew ? ' new' : ''}">${who}<div class="of-ev-m">${gerChip}${esc(e.message)}${link ? ` <a href="${link}"${/^https?:/.test(e.link) ? ' target="_blank" rel="noopener"' : ''}>abrir</a>` : ''}<small>${a ? esc(a.name) + ' · ' : ''}${ago(e.ts)}</small></div></li>`;
}
function renderFeed() {
  $('#feed').innerHTML = S.events.map((e) => evRow(e)).join('') || '<li class="of-empty">Nenhuma atividade ainda. Quando um agente rodar, aparece aqui.</li>';
  $('#feedMini').innerHTML = S.events.slice(0, 40).map((e) => evRow(e)).join('') || '<li class="of-empty">Sem atividade.</li>';
}
function renderTop() {
  const u = S.usage.total;
  const cap = S.settings.daily_usd;
  $('#usage').innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18M7 15l4-4 3 3 5-6"/></svg><span>Hoje: <b>${u.runs}</b> rodada${u.runs === 1 ? '' : 's'} · <b>US$ ${u.usd.toFixed(2)}</b>${cap ? ` de ${cap.toFixed(2)}` : ''}</span>`;
  const k = $('#kill');
  k.setAttribute('aria-pressed', S.settings.kill ? 'true' : 'false');
  $('.of-kill-t', k).textContent = S.settings.kill ? 'Agência parada · religar' : 'Parar todos';
  const ban = [];
  if (S.settings.kill) ban.push('<div class="of-banner"><div>Botão de emergência ligado: nenhum agente começa rodada nova, e as rodadas em andamento são encerradas pelo executor do Mac em até 2 minutos.</div></div>');
  if (!S.config.agentToken) ban.push('<div class="of-banner warn"><div>Token dos agentes não configurado no servidor (OFFICE_AGENT_TOKEN ou SOCIAL_AGENT_TOKEN): os agentes não conseguem mandar notícias. Veja tools/agencia/LEIA-ME.md.</div></div>');
  $('#banner').innerHTML = ban.join('');
}
// ---------- Gerente: modo (Publicar direto | depois de 2 h | Desligado) e posts aprovados por ele que ainda vão sair ----------
const G_MODES = [['direto', 'Publicar direto'], ['2h', 'Depois de 2 horas'], ['off', 'Desligado']];
const G_HINT = { direto: 'Post aprovado pelo Gerente Geral entra na agenda no horário normal.', '2h': 'Post aprovado pelo Gerente Geral só sai 2 h depois: dá tempo de barrar.', off: 'O Gerente Geral só comenta. Nada é aprovado sem você.' };
function left(ms) {
  const m = Math.max(0, Math.round((ms - Date.now()) / 60000));
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m} min`;
}
let gerOpen = (() => { try { return localStorage.getItem('of-ger-open') === '1'; } catch { return false; } })();
function renderGerente() {
  const mode = S.settings.gerente_mode || (S.gerente && S.gerente.mode) || '2h';
  const posts = ((S.gerente && S.gerente.posts) || []).filter((p) => p.scheduled_at > Date.now());
  $('#gerente').innerHTML = `<span class="of-ger-l" title="${esc(G_HINT[mode])}">Modo do Gerente</span>
    <div class="ck-seg" role="radiogroup" aria-label="Modo do Gerente Geral">${G_MODES.map(([k, l]) => `<button type="button" role="radio" data-gmode="${k}" aria-checked="${k === mode}" title="${esc(G_HINT[k])}">${l}</button>`).join('')}</div>`;
  const row = (p) => `<li><span class="of-chip ger">aprovado pelo Gerente</span>
      <span class="of-ger-cap" title="${esc(p.caption)}">#${p.id} ${esc(p.caption || 'sem legenda')}</span>
      <span class="of-ger-left">sai em <b>${left(p.scheduled_at)}</b></span>
      <button type="button" class="ck-btn ck-btn-sm of-btn-warn" data-veto="${p.id}">Barrar</button></li>`;
  // Um post: a linha dele. Vários: uma linha de resumo (não empurra a tela para baixo) que abre a lista com rolagem própria.
  if (!posts.length) { $('#gerPosts').innerHTML = ''; return; }
  if (posts.length === 1) { $('#gerPosts').innerHTML = `<ul class="of-ger-posts" aria-label="Aprovado pelo Gerente, ainda não publicado">${row(posts[0])}</ul>`; return; }
  const next = posts.slice().sort((a, b) => a.scheduled_at - b.scheduled_at)[0];
  $('#gerPosts').innerHTML = `<div class="of-ger-sum"><span class="of-chip ger">aprovado pelo Gerente</span>
      <span class="of-ger-cap"><b>${posts.length} posts</b> vão sair · próximo: #${next.id} em <b>${left(next.scheduled_at)}</b></span>
      <button type="button" class="ck-btn ck-btn-sm ck-btn-ghost" data-gtoggle aria-expanded="${gerOpen}">${gerOpen ? 'Ocultar' : 'Ver e barrar'}</button></div>
    ${gerOpen ? `<ul class="of-ger-posts of-ger-list" aria-label="Aprovados pelo Gerente, ainda não publicados">${posts.map(row).join('')}</ul>` : ''}`;
}
async function onGerenteClick(e) {
  const m = e.target.closest('[data-gmode]');
  const v = e.target.closest('[data-veto]');
  if (e.target.closest('[data-gtoggle]')) {
    gerOpen = !gerOpen;
    try { localStorage.setItem('of-ger-open', gerOpen ? '1' : '0'); } catch {}
    renderGerente(); return;
  }
  if (m) {
    const mode = m.dataset.gmode;
    if (mode === (S.settings.gerente_mode || '2h')) return;
    if (mode === 'direto' && !confirm('Publicar direto?\n\nPost aprovado pelo Gerente entra na agenda e sai no horário normal, sem a janela de 2 horas para você barrar.')) return;
    try { const r = await api('/gerente/mode', { method: 'POST', body: JSON.stringify({ mode }) }); S.settings = r.settings; renderGerente(); toast(`Modo do Gerente: ${G_MODES.find((x) => x[0] === mode)[1]}. ${G_HINT[mode]}`); } catch (err) { if (!stepUp(err)) toast(err.message, true); }
  } else if (v) {
    const reason = prompt('Barrar este post: ele volta para "Aguardando aprovação" na Central. Quer deixar um motivo? (opcional)');
    if (reason === null) return;
    v.disabled = true;
    try {
      const r = await fetch(`/admin/api/social/posts/${v.dataset.veto}/action`, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'veto', reason }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw Object.assign(new Error(j.error || `Erro ${r.status}`), { code: j.code, url: j.url });
      S.gerente.posts = S.gerente.posts.filter((p) => p.id !== Number(v.dataset.veto));
      renderGerente(); toast('Post barrado: voltou para Aguardando aprovação.');
    } catch (err) { if (!stepUp(err)) toast(err.message, true); v.disabled = false; }
  }
}
$('#gerente').addEventListener('click', onGerenteClick);
$('#gerPosts').addEventListener('click', onGerenteClick);
// Tema claro/escuro (mesmo botão das outras telas do dono)
$('#themeToggle').addEventListener('click', () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch {}
});

// ---------- Organograma: Dono → Diretor e Gerente Geral → gerentes de área → agentes ----------
function orgNode(a, extra = '') {
  if (!a) return '';
  const st = vis(a);
  return `<button type="button" class="org-node st-${st}${st === 'off' ? ' off' : ''}" data-agent="${esc(a.id)}" style="--tc:${esc(teamColor(a))}">
    <span class="of-ag-av" style="background:${esc(a.color)};color:${ink(a.color)}">${esc(initials(a.name))}</span>
    <span class="org-t"><b>${esc(a.name)}</b><small>${esc(a.role)}</small>${extra}</span></button>`;
}
function renderOrg() {
  const el = $('#org');
  if (!el) return;
  const managers = S.agents.filter((a) => a.area_manager);
  const open = (ids) => S.tasks.filter((t) => ids.includes(t.assignee) && (t.status === 'backlog' || t.status === 'doing')).length;
  const inReview = (ids) => S.tasks.filter((t) => ids.includes(t.assignee) && t.status === 'review');
  el.innerHTML = `<div class="org">
    <div class="org-top"><div class="org-owner"><span class="of-ag-av admin">EU</span><span class="org-t"><b>Dono</b><small>Você: decide o que é sensível e aprova o que só você aprova</small></span></div></div>
    <div class="org-v"></div>
    <div class="org-l1">
      ${orgNode(agentOf('diretor'), '<span class="org-tag">Estratégia e resumo do dia</span>')}
      ${orgNode(agentOf('gerente'), '<span class="org-tag">Aprovação final</span>')}
    </div>
    <div class="org-v"></div>
    <div class="org-areas">${managers.map((m) => {
      const team = (m.leads || []).map(agentOf).filter(Boolean);
      const rv = inReview(m.leads || []);
      const pre = rv.filter((t) => t.pre_approved).length;
      const stats = `<span class="org-stats">${open(m.leads || [])} aberta${open(m.leads || []) === 1 ? '' : 's'} · ${rv.length} em revisão${pre ? ` · ${pre} pré-aprovada${pre > 1 ? 's' : ''}` : ''}</span>`;
      return `<section class="org-branch" style="--tc:${esc(teamColor(m))}" aria-label="${esc(m.team_name)}">
        <h3>${esc(m.team_name)}</h3>
        ${orgNode(m, stats)}
        <ul class="org-team">${team.map((a) => `<li>${orgNode(a)}</li>`).join('')}</ul>
      </section>`;
    }).join('')}</div>
    <p class="org-note"><b>Diretor</b> cuida da estratégia e do resumo do dia. <b>Gerente Geral</b> dá a aprovação final (dentro dos limites; o sensível é seu). <b>Gerentes de área</b> coordenam a equipe, pedem ajustes e marcam "pré-aprovado"; não aprovam em definitivo.</p>
  </div>`;
}

function renderAll() {
  renderTop(); renderGerente(); renderRoster(); renderBoard(); renderFeed(); renderOrg();
  if (drawerFor) refreshDrawer();
}

// =====================================================================
// Gaveta (agente, tarefa, nova tarefa)
// =====================================================================
const drawer = $('#drawer'), scrim = $('#scrim');
let drawerFor = null; // { type: 'agent'|'task'|'new', id }
let selectedAgent = null;
function openDrawer(html) {
  drawer.innerHTML = html;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  scrim.hidden = false;
  document.body.classList.add('of-lock');
  drawer.focus({ preventScroll: true });
}
function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  scrim.hidden = true;
  document.body.classList.remove('of-lock');
  drawerFor = null; selectedAgent = null;
  if (location.hash) history.replaceState(null, '', location.pathname);
}
scrim.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawerFor) closeDrawer(); });
const xBtn = '<button type="button" class="of-dr-x" data-close aria-label="Fechar"><svg class="ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';

function artifactHtml(x) {
  const u = href(x.url);
  const kindLabel = { post: 'Post na Central', anuncio: 'Proposta de anúncio', arquivo: 'Arquivo', texto: 'Rascunho', link: 'Link' }[x.kind] || x.kind;
  return `<div class="of-art"><div class="of-row"><span class="of-chip">${esc(kindLabel)}</span><b>${esc(x.label || '')}</b></div>
    ${u ? `<a class="of-btn of-btn-sm" href="${u}"${/^https?:/.test(x.url) ? ' target="_blank" rel="noopener"' : ''}>Abrir${x.kind === 'post' ? ' na Central' : x.kind === 'anuncio' ? ' nos anúncios' : ''}</a>` : ''}
    ${x.path ? `<div>No Mac: <code>${esc(x.path)}</code></div>` : ''}
    ${x.content ? `<div class="md md-box">${MD.render(x.content)}</div>` : ''}
    <div class="of-row">${x.content ? `<button type="button" class="of-btn of-btn-sm" data-copy="${x.id}">Copiar texto</button>` : ''}
      <a class="of-btn of-btn-sm" href="/admin/escritorio/entrega/${x.id}" target="_blank" rel="noopener"><svg class="ic" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>Abrir em tela cheia</a></div></div>`;
}
function approvalHtml(t) {
  if (t.status !== 'review') return '';
  return `<div class="of-card" style="background:var(--warn-soft);border-color:transparent"><h3 style="color:var(--warn)">Precisa da sua aprovação</h3>
    ${t.sensitive ? `<p style="margin:0 0 6px;font-size:13px"><b>Sensível</b> (${esc(t.sensitive_reason || 'marcada')}): o Gerente Geral não aprova, só você.</p>` : ''}
    ${t.area_review && t.area_review_note ? `<p style="margin:0 0 6px;font-size:13px"><b>${t.pre_approved ? 'Pré-aprovado' : 'Comentário'} por ${esc(areaName(t.area_review_by))}:</b> ${MD.renderInline(t.area_review_note)} <small style="color:var(--muted)">(o gerente de área não dá a aprovação final)</small></p>` : ''}
    ${t.review_note && t.reviewed_by === 'gerente' ? `<p style="margin:0 0 6px;font-size:13px"><b>Parecer do Gerente Geral:</b> ${MD.renderInline(t.review_note)}</p>` : ''}
    <label class="of-field">Comentário para o agente (opcional)<textarea data-feedback="${t.id}" placeholder="Ex.: troque o gancho, use menos emoji…"></textarea></label>
    <div class="of-row" style="margin-top:8px"><button type="button" class="of-btn of-btn-ok" data-act="approve" data-id="${t.id}">Aprovar</button>
    <button type="button" class="of-btn of-btn-warn" data-act="reject" data-id="${t.id}">Pedir ajustes</button></div>
    <p style="margin:8px 0 0;font-size:12.5px;color:var(--ink-2)">Aprovar aqui só fecha a tarefa. Postagens, anúncios e e-mails continuam precisando do botão de aprovação na própria tela (Central, Anúncios).</p></div>`;
}
// Onde o agente fica no organograma (área, a quem responde, equipe)
function orgLine(a) {
  const boss = a.reports_to ? agentOf(a.reports_to) : null;
  const team = (a.leads || []).map(agentOf).filter(Boolean);
  const bits = [];
  if (a.team_name) bits.push(`<span class="of-team" style="--tc:${esc(teamColor(a))}">${esc(a.team_name)}</span>`);
  if (a.id === 'gerente') bits.push('<span>Aprovação final pelo dono · responde a você</span>');
  else if (a.id === 'diretor') bits.push('<span>Estratégia e resumo do dia · responde a você</span>');
  else if (boss) bits.push(`<span>Responde a <a href="#" data-agent-link="${esc(boss.id)}">${esc(boss.name)}</a></span>`);
  if (team.length) bits.push(`<span>Equipe: ${team.map((x) => `<a href="#" data-agent-link="${esc(x.id)}">${esc(x.name)}</a>`).join(', ')}</span>`);
  if (a.area_manager) bits.push('<span style="color:var(--muted)">Coordena e pré-aprova; não dá a aprovação final.</span>');
  return `<div class="of-orgline">${bits.join('')}</div>`;
}
// ---------- Anexos (arquivos) ----------
const FCFG = (S.config && S.config.files) || { accept: ['.pdf', '.jpg', '.jpeg', '.png', '.heic', '.xlsx', '.csv', '.xml', '.ofx', '.txt', '.docx', '.zip'], max_mb: 25, max_per_task: 10 };
const ACCEPT_ATTR = [...FCFG.accept, 'image/*', 'application/pdf'].join(',');
const fsize = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const ftype = (m) => ({ 'application/pdf': 'PDF', 'image/jpeg': 'JPG', 'image/png': 'PNG', 'text/csv': 'CSV', 'application/xml': 'XML', 'application/x-ofx': 'OFX', 'text/plain': 'TXT', 'application/zip': 'ZIP' }[m] || (/sheet/.test(m) ? 'XLSX' : /word/.test(m) ? 'DOCX' : 'arquivo'));
const dropZone = (attr) => `<label class="of-drop" ${attr}><input type="file" multiple accept="${esc(ACCEPT_ATTR)}" ${attr}/>
  <svg class="ic" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
  <span><b>Anexar arquivo</b> · arraste aqui, escolha ou tire uma foto<small>PDF, JPG, PNG, HEIC, XLSX, CSV, XML, OFX, TXT, DOCX, ZIP · até ${FCFG.max_mb} MB cada, ${FCFG.max_per_task} por tarefa</small></span>
  <span class="of-drop-list"></span></label>`;
function checkFiles(list, already = 0) {
  const arr = [...list];
  if (arr.length + already > FCFG.max_per_task) throw new Error(`No máximo ${FCFG.max_per_task} arquivos por tarefa.`);
  for (const f of arr) {
    if (f.size > FCFG.max_mb * 1048576) throw new Error(`"${f.name}" passa de ${FCFG.max_mb} MB.`);
    const ext = (/\.[^.]+$/.exec(f.name.toLowerCase()) || [''])[0];
    if (!FCFG.accept.includes(ext) && !/^image\/(jpeg|png|heic|heif)$/.test(f.type)) throw new Error(`Tipo não aceito: "${f.name}".`);
  }
  return arr;
}
async function uploadFiles(taskId, list) {
  const t = S.tasks.find((x) => x.id === taskId);
  const arr = checkFiles(list, (t && t.files ? t.files.length : 0));
  if (!arr.length) return null;
  const fd = new FormData();
  for (const f of arr) fd.append('files', f, f.name);
  const r = await fetch(`${API}/tasks/${taskId}/files`, { method: 'POST', body: fd, credentials: 'same-origin' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Erro ${r.status}`);
  return j.files;
}
const PREVIEW = /^(application\/pdf|image\/jpeg|image\/png)$/; // abre no navegador; o resto só baixa
function filesHtml(t) {
  const fl = t.files || [];
  return `<div><h3>Anexos${fl.length ? ` (${fl.length})` : ''}</h3>
    ${fl.length ? `<ul class="of-files">${fl.map((f) => `<li>${/^image\/(jpeg|png)$/.test(f.mime) ? `<a class="of-file-thumb" href="/admin/escritorio/arquivo/${f.id}" target="_blank" rel="noopener"><img src="${API}/files/${f.id}/download?inline=1" alt="" loading="lazy"/></a>` : `<span class="of-file-ic">${esc(ftype(f.mime))}</span>`}
      <span class="of-file-t"><b title="${esc(f.name)}">${esc(f.name)}</b><small>${fsize(f.size)} · ${esc(f.uploaded_by === 'admin' ? 'você' : (agentOf(f.uploaded_by)?.name || f.uploaded_by))} · ${fmt(f.created_at)}</small></span>
      ${PREVIEW.test(f.mime) ? `<a class="of-btn of-btn-sm" href="/admin/escritorio/arquivo/${f.id}" target="_blank" rel="noopener">Ver</a>` : ''}
      <a class="of-btn of-btn-sm" href="${API}/files/${f.id}/download" download>Baixar</a>
      <button type="button" class="of-btn of-btn-sm" data-file-del="${f.id}" aria-label="Remover ${esc(f.name)}" style="color:var(--err)">Remover</button></li>`).join('')}</ul>` : ''}
    ${dropZone(`data-upload="${t.id}"`)}
    <p class="of-hint">Quem vê: o responsável, o gerente da área dele, o Gerente Geral e o Diretor (cada download fica no feed). Guardados cifrados por ${S.settings.files_days || 180} dias.</p></div>`;
}
async function openAgent(id) {
  drawerFor = { type: 'agent', id };
  selectedAgent = id;
  renderAgentDrawer([]);
  try { const r = await api(`/events?agent=${encodeURIComponent(id)}&limit=40`); if (drawerFor && drawerFor.id === id) renderAgentDrawer(r.events); } catch {}
}
let agentEvents = [];
function renderAgentDrawer(events) {
  if (events) agentEvents = events;
  const a = agentOf(drawerFor.id);
  if (!a) return closeDrawer();
  const st = vis(a);
  const mine = S.tasks.filter((t) => t.assignee === a.id);
  const review = mine.filter((t) => t.status === 'review');
  const open = mine.filter((t) => t.status === 'doing' || t.status === 'backlog');
  const outputs = mine.flatMap((t) => (t.artifacts || []).map((x) => ({ ...x, task: t }))).sort((x, y) => y.created_at - x.created_at).slice(0, 8);
  const cur = a.task_id ? S.tasks.find((t) => t.id === a.task_id) : null;
  const html = `<div class="of-dr-h"><span class="of-ag-av st-${st}" style="background:${esc(a.color)};color:${ink(a.color)}">${esc(initials(a.name))}</span>
    <div><h2>${esc(a.name)}</h2><p>${esc(a.role)}</p></div>${xBtn}</div>
    <div class="of-dr-b">
      <div class="of-row"><span class="of-status st-${st}">${ST_LABEL[st]}</span><span style="font-size:12.5px;color:var(--muted)">Último sinal ${ago(a.last_heartbeat)}</span></div>
      ${orgLine(a)}
      <div class="of-now">${a.current_task ? `<b>Agora:</b> ${esc(a.current_task)}${cur ? ` · <a href="#tarefa-${cur.id}" data-task-link="${cur.id}">tarefa #${cur.id}</a>` : ''}` : 'Sem tarefa no momento.'}</div>
      <div class="of-row">
        <label class="of-toggle"><input type="checkbox" data-enable ${a.enabled ? 'checked' : ''}/> Ligado</label>
        <button type="button" class="of-btn of-btn-sm" data-run>Pedir rodada agora</button>
        ${a.status !== 'idle' ? '<button type="button" class="of-btn of-btn-sm" data-reset>Marcar como livre</button>' : ''}
        <button type="button" class="of-btn of-btn-sm" data-new-for="${esc(a.id)}">Nova tarefa</button>
      </div>
      ${review.length ? `<div><h3>Esperando você (${review.length})</h3><div class="of-mini-list">${review.map((t) => `<div class="of-card"><a href="#tarefa-${t.id}" data-task-link="${t.id}"><b>#${t.id} ${esc(t.title)}</b></a>${(t.artifacts || []).map(artifactHtml).join('')}${approvalHtml(t)}</div>`).join('')}</div></div>` : ''}
      ${open.length ? `<div><h3>Tarefas abertas</h3><ul class="of-mini-list">${open.map((t) => `<li>${taskCard(t)}</li>`).join('')}</ul></div>` : ''}
      ${outputs.length ? `<div><h3>Entregas recentes</h3><div class="of-mini-list">${outputs.map(artifactHtml).join('')}</div></div>` : ''}
      <div><h3>Atalhos</h3><div class="of-row">
        <a class="of-btn of-btn-sm" href="/admin/social">Central de Redes Sociais</a>
        <a class="of-btn of-btn-sm" href="/admin/anuncios">Anúncios</a>
        <a class="of-btn of-btn-sm" href="/admin/financeiro">Financeiro</a></div></div>
      <div><h3>Registro</h3><ol class="of-feed">${agentEvents.map((e) => evRow(e)).join('') || '<li class="of-empty">Sem registro ainda.</li>'}</ol></div>
    </div>`;
  if (!drawer.classList.contains('open')) openDrawer(html); else drawer.innerHTML = html;
}
async function openTask(id) {
  drawerFor = { type: 'task', id };
  selectedAgent = null;
  let t = S.tasks.find((x) => x.id === id);
  let events = [];
  if (t) renderTaskDrawer(t, []); // abre já com o que tem; completa quando a API responder
  try {
    const r = await api(`/tasks/${id}`); t = r.task; events = r.events;
    threads.set(id, r.comments || []); kids.set(id, r.children || []);
    const i = S.tasks.findIndex((x) => x.id === id); if (i >= 0) S.tasks[i] = t; else S.tasks.push(t);
  } catch (e) { if (!t) { toast(e.message, true); return closeDrawer(); } }
  if (drawerFor && drawerFor.type === 'task' && drawerFor.id === id) { renderTaskDrawer(t, events); scrollThread(); }
}
// ---------- Conversa da tarefa (dono ↔ agentes), ao vivo pelo SSE (evento "comment") ----------
const threads = new Map(); // id da tarefa → mensagens
const kids = new Map(); // id da tarefa → sub-tarefas (pedido do dono quebrado pelo Diretor)
function bubble1(c) {
  const mine = c.author === 'admin';
  const a = mine ? null : agentOf(c.author);
  return `<li class="of-msg${mine ? ' me' : ''}">${mine ? '' : `<span class="of-ev-av" style="background:${esc(a ? a.color : '#888')};color:${ink(a ? a.color : '#888')}">${esc(initials(a ? a.name : c.author))}</span>`}
    <div class="of-msg-b"><small>${mine ? 'Você' : esc(a ? a.name : c.author)} · ${ago(c.created_at)}</small><div class="md">${MD.render(c.body)}</div></div></li>`;
}
function threadList(id) {
  const list = threads.get(id) || [];
  return list.length ? list.map(bubble1).join('') : '<li class="of-empty">Nenhuma mensagem ainda. Escreva para o responsável: ele lê na próxima rodada e responde aqui.</li>';
}
function threadHtml(id) {
  return `<div class="of-thread-w"><h3>Conversa</h3><ol class="of-thread" data-thread="${id}">${threadList(id)}</ol>
    <form class="of-say" data-say="${id}"><textarea name="body" rows="2" maxlength="4000" placeholder="Escreva para o agente (Enter envia, Shift+Enter quebra linha)"></textarea>
    <button class="of-btn of-btn-primary of-btn-sm" type="submit">Enviar</button></form></div>`;
}
function scrollThread() { document.querySelectorAll('.of-thread').forEach((el) => { el.scrollTop = el.scrollHeight; }); }
function refreshThreads(id) {
  document.querySelectorAll(`.of-thread[data-thread="${id}"]`).forEach((el) => { el.innerHTML = threadList(id); el.scrollTop = el.scrollHeight; });
}
function onComment(c) {
  const list = threads.get(c.task_id);
  if (list && !list.some((x) => x.id === c.id)) list.push(c);
  else if (!list) threads.set(c.task_id, [c]);
  refreshThreads(c.task_id);
  window.dispatchEvent(new CustomEvent('office:comment', { detail: c }));
}
async function sendComment(id, body) {
  const r = await api(`/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
  onComment(r.comment);
  return r.comment;
}
const ST_PT = { backlog: 'a fazer', doing: 'fazendo', review: 'esperando você', done: 'feito' };
function childrenHtml(t) {
  const list = kids.get(t.id) || S.tasks.filter((x) => x.parent_id === t.id);
  if (!list.length) return (t.tags || []).includes(S.pedido_tag) ? '<div class="of-now">Pedido seu: o Diretor lê, quebra em tarefas para as áreas e responde na conversa abaixo.</div>' : '';
  const done = list.filter((c) => c.status === 'done').length;
  return `<div><h3>Partes do pedido (${done}/${list.length} feitas)</h3><div class="of-prog"><i style="width:${Math.round((done / list.length) * 100)}%"></i></div>
    <ul class="of-kids">${list.map((c) => `<li><a href="#tarefa-${c.id}" data-task-link="${c.id}">#${c.id} ${esc(c.title)}</a><span class="of-chip ${c.status === 'review' ? 'wait' : c.status === 'done' ? 'ok' : ''}">${ST_PT[c.status] || c.status}</span>${agentOf(c.assignee) ? `<small>${esc(agentOf(c.assignee).name)}</small>` : ''}</li>`).join('')}</ul></div>`;
}
function renderTaskDrawer(t, events = []) {
  const a = agentOf(t.assignee);
  const html = `<div class="of-dr-h"><div><p>Tarefa #${t.id} · ${COL[t.status]}</p><h2>${esc(t.title)}</h2></div>${xBtn}</div>
    <div class="of-dr-b">
      <div class="of-row"><span class="of-chip">${a ? `<i style="background:${esc(a.color)};color:${ink(a.color)}"></i>${esc(a.name)}` : 'sem responsável'}</span>
        <span class="of-chip">criada por ${esc(agentOf(t.created_by)?.name || (t.created_by === 'admin' ? 'você' : t.created_by))}</span>
        <span class="of-chip">prioridade ${t.priority === 1 ? 'alta' : t.priority === 3 ? 'baixa' : 'normal'}</span>
        ${t.approval ? `<span class="of-chip ${t.approval === 'pendente' ? 'wait' : t.approval === 'rejeitado' ? 'rej' : 'ok'}">${esc(t.approval)}</span>` : ''}</div>
      ${approvalHtml(t)}
      ${t.feedback ? `<div class="of-now"><b>${esc(fbWho(t.feedback).who)}:</b> ${MD.renderInline(fbWho(t.feedback).text)}</div>` : ''}
      ${t.status !== 'review' && t.review_note && t.reviewed_by === 'gerente' ? `<div class="of-now"><b>${t.approval === 'aprovado' ? 'Aprovado pelo Gerente Geral' : 'Parecer do Gerente Geral'}:</b> ${MD.renderInline(t.review_note)}</div>` : ''}
      ${t.status !== 'review' && t.pre_approved ? `<div class="of-now"><b>Pré-aprovado por ${esc(areaName(t.area_review_by))}:</b> ${MD.renderInline(t.area_review_note || '')}</div>` : ''}
      <label class="of-toggle" title="Sensível: só você aprova; o Gerente Geral e os gerentes de área nunca"><input type="checkbox" data-sensitive="${t.id}" ${t.sensitive ? 'checked' : ''}/> Sensível (só você aprova)${t.sensitive && t.sensitive_by === 'auto' ? ` <small style="font-weight:500;color:var(--muted)">automático: ${esc(t.sensitive_reason || '')}</small>` : ''}</label>
      ${t.description ? `<div class="md of-desc-md">${MD.render(t.description)}</div>` : ''}
      ${t.links.length ? `<div><h3>Links</h3><div class="of-row">${t.links.map((l) => (href(l.url) ? `<a class="of-btn of-btn-sm" href="${href(l.url)}"${/^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label || l.url)}</a>` : '')).join('')}</div></div>` : ''}
      ${(t.artifacts || []).length ? `<div><h3>Entregas</h3><div class="of-mini-list">${t.artifacts.map(artifactHtml).join('')}</div></div>` : ''}
      ${childrenHtml(t)}
      ${threadHtml(t.id)}
      ${filesHtml(t)}
      <div class="of-row">
        <label class="of-field">Mover para <select data-move="${t.id}">${Object.entries(COL).map(([k, l]) => `<option value="${k}"${k === t.status ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="of-field">Responsável <select data-assign="${t.id}"><option value="">—</option>${S.agents.map((x) => `<option value="${esc(x.id)}"${x.id === t.assignee ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      </div>
      <div class="of-row"><button type="button" class="of-btn of-btn-sm" data-del="${t.id}" style="color:var(--err)">Excluir tarefa</button></div>
      ${events.length ? `<div><h3>Histórico</h3><ol class="of-feed">${events.map((e) => evRow(e)).join('')}</ol></div>` : ''}
    </div>`;
  if (!drawer.classList.contains('open')) openDrawer(html); else drawer.innerHTML = html;
  if (location.hash !== `#tarefa-${t.id}`) history.replaceState(null, '', `#tarefa-${t.id}`);
}
let pendingNew = []; // arquivos escolhidos no formulário de nova tarefa (enviados depois que a tarefa existe)
function showPicked(zone, list) {
  const out = zone && zone.querySelector('.of-drop-list');
  if (out) out.textContent = list.length ? list.map((f) => `${f.name} (${fsize(f.size)})`).join(' · ') : '';
}
async function handleFiles(zone, list) {
  if (!list || !list.length) return;
  if (zone.hasAttribute('data-newfiles')) {
    try { pendingNew = checkFiles([...pendingNew, ...list]); showPicked(zone, pendingNew); } catch (err) { toast(err.message, true); }
    return;
  }
  const id = Number(zone.getAttribute('data-upload'));
  zone.classList.add('busy');
  try { const added = await uploadFiles(id, list); toast(added && added.length > 1 ? `${added.length} arquivos anexados.` : 'Arquivo anexado.'); openTask(id); }
  catch (err) { toast(err.message, true); } finally { zone.classList.remove('busy'); }
}
function openNewTask(assignee = '') {
  pendingNew = [];
  drawerFor = { type: 'new' };
  openDrawer(`<div class="of-dr-h"><div><h2>Nova tarefa</h2><p>O agente pega na próxima rodada.</p></div>${xBtn}</div>
    <form class="of-dr-b" id="newTaskForm">
      <label class="of-field">Título<input name="title" required maxlength="200" placeholder="Ex.: Carrossel sobre etiqueta 10×15"/></label>
      <label class="of-field">Detalhes<textarea name="description" maxlength="8000" placeholder="O que precisa, prazo, referências…"></textarea></label>
      <div class="of-row">
        <label class="of-field">Responsável<select name="assignee"><option value="">—</option>${S.agents.map((x) => `<option value="${esc(x.id)}"${x.id === assignee ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
        <label class="of-field">Prioridade<select name="priority"><option value="1">Alta</option><option value="2" selected>Normal</option><option value="3">Baixa</option></select></label>
      </div>
      ${dropZone('data-newfiles')}
      <div class="of-row"><button class="of-btn of-btn-primary" type="submit">Criar tarefa</button></div>
    </form>`);
  $('#newTaskForm input[name=title]').focus();
}
function refreshDrawer() {
  if (!drawerFor) return;
  if (typing()) return; // não apaga o comentário que o dono está escrevendo
  if (drawerFor.type === 'agent') renderAgentDrawer();
  else if (drawerFor.type === 'task') { const t = S.tasks.find((x) => x.id === drawerFor.id); if (t) renderTaskDrawer(t); }
}
function typing() { const el = document.activeElement; return !!(el && drawer.contains(el) && /^(TEXTAREA|INPUT|SELECT)$/.test(el.tagName)); }

drawer.addEventListener('click', async (e) => {
  const el = e.target.closest('button, a');
  if (!el) return;
  if (el.hasAttribute('data-close')) return closeDrawer();
  if (el.dataset.taskLink) { e.preventDefault(); return openTask(Number(el.dataset.taskLink)); }
  if (el.dataset.agentLink) { e.preventDefault(); return openAgent(el.dataset.agentLink); }
  if (el.dataset.task) return openTask(Number(el.dataset.task));
  if (el.dataset.newFor !== undefined) return openNewTask(el.dataset.newFor);
  if (el.dataset.fileDel) {
    if (!confirm('Remover este anexo? O arquivo é apagado de vez.')) return;
    try { await api(`/files/${el.dataset.fileDel}`, { method: 'DELETE' }); toast('Anexo removido.'); if (drawerFor && drawerFor.type === 'task') openTask(drawerFor.id); } catch (err) { toast(err.message, true); }
    return;
  }
  if (el.tagName === 'A' && el.hasAttribute('download')) return; // baixar: deixa o navegador seguir o link
  if (el.dataset.copy) {
    const art = S.tasks.flatMap((t) => t.artifacts || []).find((x) => String(x.id) === el.dataset.copy);
    try { await navigator.clipboard.writeText(art ? art.content : ''); toast('Texto copiado.'); } catch { toast('Não deu para copiar.', true); }
    return;
  }
  try {
    el.disabled = true;
    if (el.dataset.act) {
      const fb = drawer.querySelector(`[data-feedback="${el.dataset.id}"]`);
      const r = await api(`/tasks/${el.dataset.id}/action`, { method: 'POST', body: JSON.stringify({ action: el.dataset.act, feedback: fb ? fb.value : '' }) });
      upsertTask(r.task);
      toast(el.dataset.act === 'approve' ? 'Aprovado.' : 'Pedido de ajuste enviado ao agente.');
    } else if (el.hasAttribute('data-run')) {
      await api(`/agents/${drawerFor.id}/run`, { method: 'POST', body: '{}' });
      toast('Pedido feito. O agendador do Mac começa em até 5 minutos.');
    } else if (el.hasAttribute('data-reset')) {
      const r = await api(`/agents/${drawerFor.id}`, { method: 'POST', body: JSON.stringify({ status: 'idle' }) });
      upsertAgent(r.agent);
    } else if (el.dataset.del) {
      if (!confirm('Excluir esta tarefa?')) return;
      await api(`/tasks/${el.dataset.del}`, { method: 'DELETE' });
      S.tasks = S.tasks.filter((t) => t.id !== Number(el.dataset.del));
      closeDrawer(); renderAll();
    }
  } catch (err) { toast(err.message, true); } finally { el.disabled = false; }
});
drawer.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.type === 'file') { const zone = el.closest('.of-drop'); await handleFiles(zone, [...el.files]); el.value = ''; return; }
  try {
    if (el.matches('[data-enable]')) { const r = await api(`/agents/${drawerFor.id}`, { method: 'POST', body: JSON.stringify({ enabled: el.checked }) }); upsertAgent(r.agent); toast(el.checked ? 'Agente ligado.' : 'Agente desligado: não roda mais até você ligar.'); }
    else if (el.dataset.move) { const r = await api(`/tasks/${el.dataset.move}/action`, { method: 'POST', body: JSON.stringify({ action: 'move', status: el.value }) }); upsertTask(r.task); openTask(r.task.id); }
    else if (el.dataset.sensitive) { const r = await api(`/tasks/${el.dataset.sensitive}/action`, { method: 'POST', body: JSON.stringify({ action: 'flag', sensitive: el.checked }) }); upsertTask(r.task); toast(el.checked ? 'Marcada como sensível: só você aprova.' : 'Desmarcada: o Gerente Geral pode aprovar.'); }
    else if (el.dataset.assign) { const r = await api(`/tasks/${el.dataset.assign}`, { method: 'PATCH', body: JSON.stringify({ assignee: el.value || null }) }); upsertTask(r.task); }
  } catch (err) { toast(err.message, true); }
});
// Arrastar e soltar arquivos nas áreas de anexo
drawer.addEventListener('dragover', (e) => { const z = e.target.closest('.of-drop'); if (z && e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { e.preventDefault(); z.classList.add('over'); } });
drawer.addEventListener('dragleave', (e) => { const z = e.target.closest('.of-drop'); if (z && !z.contains(e.relatedTarget)) z.classList.remove('over'); });
drawer.addEventListener('drop', (e) => { const z = e.target.closest('.of-drop'); if (!z) return; e.preventDefault(); z.classList.remove('over'); handleFiles(z, [...e.dataTransfer.files]); });
// Conversa: Enter envia (Shift+Enter quebra linha), em qualquer lugar da página (gaveta e Caixa de aprovação)
document.addEventListener('keydown', (e) => {
  const ta = e.target;
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing || !ta.closest || !ta.closest('form[data-say]')) return;
  e.preventDefault();
  ta.closest('form').requestSubmit();
});
document.addEventListener('submit', async (e) => {
  const f = e.target.closest && e.target.closest('form[data-say]');
  if (!f) return;
  e.preventDefault();
  const ta = f.querySelector('textarea');
  const body = ta.value.trim();
  if (!body) return;
  const btn = f.querySelector('[type=submit]');
  btn.disabled = true;
  try { await sendComment(Number(f.dataset.say), body); ta.value = ''; } catch (err) { toast(err.message, true); } finally { btn.disabled = false; ta.focus(); }
});
drawer.addEventListener('submit', async (e) => {
  if (e.target.id !== 'newTaskForm') return;
  e.preventDefault();
  const fd = new FormData(e.target);
  const picked = pendingNew.length ? pendingNew : [];
  const f = { title: fd.get('title'), description: fd.get('description'), assignee: fd.get('assignee'), priority: Number(fd.get('priority')) };
  const btn = e.target.querySelector('[type=submit]');
  try {
    checkFiles(picked);
    btn.disabled = true;
    const r = await api('/tasks', { method: 'POST', body: JSON.stringify(f) });
    upsertTask(r.task);
    if (picked.length) {
      try { await uploadFiles(r.task.id, picked); toast(`Tarefa criada com ${picked.length} anexo${picked.length > 1 ? 's' : ''}.`); } catch (err) { toast(`Tarefa criada, mas o anexo falhou: ${err.message}`, true); }
    } else toast('Tarefa criada.');
    pendingNew = [];
    openTask(r.task.id);
  } catch (err) { toast(err.message, true); } finally { btn.disabled = false; }
});

// =====================================================================
// Abas, quadro (arrastar), botões do topo
// =====================================================================
const VIEWS = ['office', 'inbox', 'pedidos', 'board', 'org', 'feed'];
const OFFICE_GROUP = ['office', 'board', 'org']; // no celular: aba "Escritório" da barra de baixo, com Cena | Quadro | Organograma
let lastOfficeView = 'office';
function setView(v) {
  if (!VIEWS.includes(v)) v = 'office';
  view = v;
  document.querySelectorAll('.of-tabs [role=tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === v)));
  document.querySelectorAll('.of-view').forEach((s) => { s.hidden = s.dataset.view !== v; });
  $('#main').classList.toggle('feed-only', ['feed', 'org', 'inbox', 'pedidos'].includes(v));
  $('#main').classList.toggle('wide', v === 'office');
  $('#main').classList.toggle('in-group', OFFICE_GROUP.includes(v));
  document.body.dataset.view = v;
  if (OFFICE_GROUP.includes(v)) lastOfficeView = v;
  const tab = OFFICE_GROUP.includes(v) ? 'office' : v;
  document.querySelectorAll('#tabbar [data-tab]').forEach((b) => { if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  document.querySelectorAll('#subnav [data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  try { localStorage.setItem('of-view', v); } catch {}
  if (v === 'office') { computeLayout(); }
  window.dispatchEvent(new CustomEvent('office:view', { detail: v }));
}
document.querySelector('.of-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); });
$('#subnav').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); });
$('#tabbar').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  if (drawerFor) closeDrawer();
  setView(b.dataset.tab === 'office' ? lastOfficeView : b.dataset.tab);
  window.scrollTo({ top: 0 });
});
$('#roster').addEventListener('click', (e) => { const b = e.target.closest('[data-agent]'); if (b) openAgent(b.dataset.agent); });
$('#org').addEventListener('click', (e) => { const b = e.target.closest('[data-agent]'); if (b) openAgent(b.dataset.agent); });
$('#board').addEventListener('click', (e) => {
  if (e.target.closest('[data-old-done]')) { showOldDone = !showOldDone; return renderBoard(); }
  const b = e.target.closest('[data-task]'); if (b) openTask(Number(b.dataset.task));
});
$('#newTask').addEventListener('click', () => openNewTask($('#boardFilter').value));
$('#boardFilter').innerHTML += S.agents.map((a) => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('');
$('#boardFilter').addEventListener('change', renderBoard);
$('#needYou').addEventListener('click', () => { needYouOnly = !needYouOnly; renderBoard(); });
$('#staleOnly').addEventListener('click', () => { staleOnly = !staleOnly; renderBoard(); });
let dragId = null;
$('#board').addEventListener('dragstart', (e) => { const c = e.target.closest('[data-task]'); if (c) { dragId = Number(c.dataset.task); e.dataTransfer.effectAllowed = 'move'; } });
$('#board').addEventListener('dragover', (e) => { const col = e.target.closest('[data-col]'); if (col && dragId) { e.preventDefault(); document.querySelectorAll('.of-col.drop').forEach((x) => x !== col && x.classList.remove('drop')); col.classList.add('drop'); } });
$('#board').addEventListener('drop', async (e) => {
  const col = e.target.closest('[data-col]');
  document.querySelectorAll('.of-col.drop').forEach((x) => x.classList.remove('drop'));
  if (!col || !dragId) return;
  e.preventDefault();
  const id = dragId; dragId = null;
  const t = S.tasks.find((x) => x.id === id);
  if (!t || t.status === col.dataset.col) return;
  try {
    const action = col.dataset.col === 'done' && t.status === 'review' ? { action: 'approve' } : { action: 'move', status: col.dataset.col };
    const r = await api(`/tasks/${id}/action`, { method: 'POST', body: JSON.stringify(action) });
    upsertTask(r.task);
  } catch (err) { toast(err.message, true); }
});
$('#usage').addEventListener('click', async () => {
  const v = prompt('Teto diário de gasto da agência em US$ (0 = sem teto no escritório; o limite do agencia.json continua valendo):', String(S.settings.daily_usd || 0));
  if (v === null) return;
  try { const r = await api('/settings', { method: 'POST', body: JSON.stringify({ daily_usd: Number(String(v).replace(',', '.')) || 0 }) }); S.settings = r.settings; renderTop(); toast('Teto diário atualizado.'); } catch (e) { toast(e.message, true); }
});
$('#kill').addEventListener('click', async () => {
  const on = !S.settings.kill;
  if (on && !confirm('Parar todos os agentes? Nenhuma rodada nova começa até você religar, e as que estão rodando são encerradas em até 2 minutos.')) return;
  try { const r = await api('/settings', { method: 'POST', body: JSON.stringify({ kill: on }) }); S.settings = r.settings; renderTop(); toast(on ? 'Agência parada.' : 'Agência liberada.'); } catch (e) { toast(e.message, true); }
});

// =====================================================================
// Ao vivo
// =====================================================================
function upsertAgent(a) { const i = S.agents.findIndex((x) => x.id === a.id); if (i >= 0) S.agents[i] = a; renderRoster(); renderOrg(); if (drawerFor && drawerFor.type === 'agent' && drawerFor.id === a.id) refreshDrawer(); }
function upsertTask(t) {
  if (t.deleted) S.tasks = S.tasks.filter((x) => x.id !== t.id);
  else { const i = S.tasks.findIndex((x) => x.id === t.id); if (i >= 0) S.tasks[i] = t; else S.tasks.unshift(t); }
  renderBoard(); renderOrg();
  if (drawerFor && (drawerFor.type === 'agent' || (drawerFor.type === 'task' && drawerFor.id === t.id && !t.deleted))) refreshDrawer();
}
function pushEvent(e) {
  if (S.events.some((x) => x.id === e.id)) return;
  S.events.unshift(e);
  S.events = S.events.slice(0, 200);
  $('#feed').insertAdjacentHTML('afterbegin', evRow(e, true));
  $('#feedMini').insertAdjacentHTML('afterbegin', evRow(e, true));
  const empty = document.querySelectorAll('#feed > .of-empty, #feedMini > .of-empty'); empty.forEach((x) => x.remove());
  if (drawerFor && drawerFor.type === 'agent' && e.agent_id === drawerFor.id) { agentEvents.unshift(e); refreshDrawer(); }
  window.dispatchEvent(new CustomEvent('office:log', { detail: e }));
}
function setLive(on, label) {
  $('#liveDot').classList.toggle('on', on); $('#liveDot2').classList.toggle('on', on);
  $('#feedMode').textContent = label;
}
let es = null, fails = 0, poll = null;
async function refresh() {
  try { const r = await fetch(`${API}/state`, { credentials: 'same-origin' }); if (r.ok) { Object.assign(S, await r.json()); renderAll(); } } catch {}
}
function connect() {
  if (!window.EventSource) { poll = setInterval(refresh, 20000); return setLive(false, 'atualiza a cada 20 s'); }
  es = new EventSource(`${API}/stream`);
  es.addEventListener('hello', () => { fails = 0; setLive(true, 'ao vivo'); if (poll) { clearInterval(poll); poll = null; } });
  es.addEventListener('agent', (e) => { const a = JSON.parse(e.data); upsertAgent(a); window.dispatchEvent(new CustomEvent('office:agent', { detail: a })); });
  es.addEventListener('task', (e) => { const t = JSON.parse(e.data); upsertTask(t); window.dispatchEvent(new CustomEvent('office:task', { detail: t })); });
  es.addEventListener('comment', (e) => onComment(JSON.parse(e.data)));
  es.addEventListener('log', (e) => pushEvent(JSON.parse(e.data)));
  es.addEventListener('settings', (e) => { S.settings = JSON.parse(e.data); renderTop(); renderGerente(); });
  es.addEventListener('gerente', (e) => { S.gerente = { ...(S.gerente || {}), ...JSON.parse(e.data) }; renderGerente(); });
  es.addEventListener('run', () => refresh());
  es.onerror = () => {
    fails++;
    setLive(false, 'reconectando…');
    if (fails >= 3) { es.close(); es = null; poll ||= setInterval(refresh, 20000); setTimeout(connect, 60000); }
  };
}

// =====================================================================
// Início
// =====================================================================
var view = 'office';
try { view = localStorage.getItem('of-view') || 'office'; } catch {}
// Links diretos: /admin/escritorio#aprovar (Caixa de aprovação), #conversa (ou os antigos #pedidos/#pedir) e #conversa-<id>
// (abre aquele pedido na aba Conversa: o hash fica para public/escritorio-conversa.js)
const HASH_VIEW = { '#aprovar': 'inbox', '#conversa': 'pedidos', '#pedidos': 'pedidos', '#pedir': 'pedidos', '#quadro': 'board', '#atividade': 'feed' };
if (HASH_VIEW[location.hash]) { view = HASH_VIEW[location.hash]; history.replaceState(null, '', location.pathname); }
else if (/^#conversa-\d+$/.test(location.hash)) view = 'pedidos';
setView(VIEWS.includes(view) ? view : 'office');
computeLayout();
renderAll();
window.addEventListener('resize', relayout);
if (window.ResizeObserver) { const ro = new ResizeObserver(() => relayout()); for (const el of [canvas.parentElement, $('.of-top'), $('.of-head')]) if (el) ro.observe(el); }
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { relayoutKey = ''; relayout(); });
requestAnimationFrame(frame);
setInterval(() => { renderRoster(); renderOrg(); if (!$('#gerente').contains(document.activeElement) && !$('#gerPosts').contains(document.activeElement)) renderGerente(); }, 30000); // "há N min", quem ficou sem sinal e "sai em…"
connect();
// Ponte para a Caixa de aprovação (public/escritorio-caixa.js) e a Conversa (public/escritorio-conversa.js)
window.OfficeApp = { S, API, api, toast, esc, href, MD, agentOf, ink, initials, ago, fmt, openTask, openAgent, setView, upsertTask, uploadFiles, checkFiles, fsize, ftype,
  threadHtml, sendComment, refreshThreads, threads, stepUp, vis, get view() { return view; }, get drawerOpen() { return !!drawerFor; } };
window.dispatchEvent(new CustomEvent('office:ready'));
const m = /^#tarefa-(\d+)$/.exec(location.hash);
if (m) openTask(Number(m[1]));
