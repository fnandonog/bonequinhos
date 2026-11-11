// Markdown pequeno e seguro para as entregas dos agentes (relatórios, rascunhos, descrições de tarefa).
// Roda igual no servidor (página de entrega em tela cheia) e no navegador (gaveta do escritório: servido em /escritorio-md.js).
// Segurança: TODO o texto é escapado antes (nenhuma tag HTML do agente passa); só geramos as nossas tags; link só
// http(s):// ou mailto: (com target=_blank rel=noopener noreferrer); javascript:, data: etc. viram texto puro.
// Suporta: títulos (#), negrito/itálico, `código`, blocos ```, citação (>), listas (-, *, 1.) com níveis e [ ]/[x],
// tabelas (| a | b |) com alinhamento, linha (---), links [texto](url), <url> e URLs soltas.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OfficeMd = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const unesc = (s) => s.replace(/&(amp|lt|gt|quot|#39);/g, (m, k) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }[k]));
  // url chega escapada; devolve o href (escapado) ou null se o esquema não for permitido
  function safeHref(u) {
    const raw = unesc(String(u || '')).trim();
    if (/[\s\u0000-\u001f]/.test(raw)) return null;
    if (!/^(https?:\/\/[^/?#]|mailto:[^\s@]+@)/i.test(raw)) return null;
    return esc(raw);
  }
  const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

  // ---------- trechos dentro da linha ----------
  function inline(src) {
    const keep = [];
    const hold = (html) => `\u0000${keep.push(html) - 1}\u0000`;
    let s = esc(src);
    s = s.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (m, t, code) => hold(`<code>${code.trim()}</code>`));
    s = s.replace(/\\([\\`*_[\]()#+\-.!|~>])/g, (m, c) => hold(c)); // escape de markdown: \*
    // [texto](url "título")
    s = s.replace(/\[([^\]\n]+)\]\(\s*([^\s)]+)(?:\s+&quot;[^\n]*?&quot;)?\s*\)/g, (m, text, url) => {
      const h = safeHref(url);
      return h ? hold(link(h, emph(text))) : hold(m); // esquema não permitido: fica o texto como veio (já escapado)
    });
    // <https://...>
    s = s.replace(/&lt;((?:https?:\/\/|mailto:)[^\s&]+(?:&amp;[^\s&]+)*)&gt;/gi, (m, url) => { const h = safeHref(url); return h ? hold(link(h, url)) : m; });
    // URL solta
    s = s.replace(/\bhttps?:\/\/[^\s<\u0000]+/gi, (url) => {
      let tail = '';
      const mm = /(?:[.,;:!?)\]'"]|&quot;|&#39;|&gt;)+$/.exec(url);
      if (mm && !(mm[0] === ')' && url.includes('('))) { tail = mm[0]; url = url.slice(0, -tail.length); }
      const h = safeHref(url);
      return h ? hold(link(h, url)) + tail : url + tail;
    });
    s = emph(s);
    s = s.replace(/ {2,}\n|\\\n/g, '<br>');
    return s.replace(/\u0000(\d+)\u0000/g, (m, i) => keep[Number(i)]).replace(/\u0000(\d+)\u0000/g, (m, i) => keep[Number(i)]);
  }
  function emph(s) {
    return s
      .replace(/\*\*\*(?=\S)([\s\S]*?\S)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, '$1<strong>$2</strong>')
      .replace(/\*(?=[^\s*])([^*\n]*?[^\s*])\*/g, '<em>$1</em>')
      .replace(/\*(?=[^\s*])([^*\n])\*/g, '<em>$1</em>')
      .replace(/(^|[^\w])_(?=[^\s_])([^_\n]*?[^\s_])_(?!\w)/g, '$1<em>$2</em>')
      .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');
  }

  // ---------- blocos ----------
  const reHr = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
  const reH = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
  const reFence = /^ {0,3}(```+|~~~+)\s*([\w+-]*)\s*$/;
  const reLi = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
  const reQuote = /^ {0,3}>\s?(.*)$/;
  const isRow = (l) => /^\s*\|.*\|\s*$/.test(l) || (/\|/.test(l) && !/^\s*$/.test(l));
  const reSep = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
  function cells(line) {
    let l = line.trim();
    if (l.startsWith('|')) l = l.slice(1);
    if (l.endsWith('|') && !l.endsWith('\\|')) l = l.slice(0, -1);
    const out = []; let cur = '';
    for (let i = 0; i < l.length; i++) {
      if (l[i] === '\\' && l[i + 1] === '|') { cur += '|'; i++; continue; }
      if (l[i] === '|') { out.push(cur.trim()); cur = ''; continue; }
      cur += l[i];
    }
    out.push(cur.trim());
    return out;
  }
  function table(lines) {
    const head = cells(lines[0]);
    const align = cells(lines[1]).map((c) => (/^:-*:$/.test(c) ? 'center' : /^-+:$/.test(c) ? 'right' : /^:-+$/.test(c) ? 'left' : ''));
    const body = lines.slice(2).map(cells);
    const n = Math.max(head.length, ...body.map((r) => r.length));
    const td = (tag, c, i) => `<${tag}${align[i] ? ` style="text-align:${align[i]}"` : ''}>${inline(c || '')}</${tag}>`;
    const row = (r, tag) => `<tr>${Array.from({ length: n }, (_, i) => td(tag, r[i], i)).join('')}</tr>`;
    return `<div class="md-table-wrap"><div class="md-table"><table><thead>${row(head, 'th')}</thead><tbody>${body.map((r) => row(r, 'td')).join('')}</tbody></table></div></div>`;
  }
  function list(lines) {
    // lines: [{ ind, ord, text }] → HTML com níveis pela indentação
    let html = '';
    const stack = [];
    for (const it of lines) {
      while (stack.length && it.ind < stack[stack.length - 1].ind) { html += `</li></${stack.pop().tag}>`; }
      const want = it.ord ? 'ol' : 'ul';
      if (stack.length && it.ind === stack[stack.length - 1].ind && stack[stack.length - 1].tag !== want) html += `</li></${stack.pop().tag}>`;
      const top = stack[stack.length - 1];
      if (!top || it.ind > top.ind) {
        const tag = it.ord ? 'ol' : 'ul';
        const start = it.ord && it.num !== 1 ? ` start="${it.num}"` : '';
        stack.push({ ind: it.ind, tag });
        html += `<${tag}${start}>`;
      } else html += '</li>';
      const m = /^\[( |x|X)\]\s+(.*)$/.exec(it.text);
      html += m ? `<li class="md-task"><span class="md-check${m[1] === ' ' ? '' : ' on'}" aria-hidden="true"></span>${inline(m[2])}` : `<li>${inline(it.text)}`;
    }
    while (stack.length) html += `</li></${stack.pop().tag}>`;
    return html;
  }
  function render(src, opts = {}) {
    const lines = String(src ?? '').replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
    const out = [];
    let i = 0;
    let para = [];
    const flush = () => { if (para.length) { out.push(`<p>${inline(para.join('\n'))}</p>`); para = []; } };
    while (i < lines.length) {
      const l = lines[i];
      if (/^\s*$/.test(l)) { flush(); i++; continue; }
      let m;
      if ((m = reFence.exec(l))) {
        flush();
        const fence = m[1][0]; const body = [];
        i++;
        while (i < lines.length && !new RegExp(`^ {0,3}\\${fence}{3,}\\s*$`).test(lines[i])) body.push(lines[i++]);
        i++;
        out.push(`<pre class="md-code"><code>${esc(body.join('\n'))}</code></pre>`);
        continue;
      }
      if ((m = reH.exec(l))) { flush(); const n = Math.min(6, m[1].length + (opts.shift || 0)); out.push(`<h${n}>${inline(m[2])}</h${n}>`); i++; continue; }
      if (reHr.test(l) && !para.length) { out.push('<hr>'); i++; continue; }
      if (isRow(l) && i + 1 < lines.length && reSep.test(lines[i + 1]) && lines[i + 1].includes('-')) {
        flush();
        const t = [l, lines[i + 1]];
        i += 2;
        while (i < lines.length && /\|/.test(lines[i]) && !/^\s*$/.test(lines[i])) t.push(lines[i++]);
        out.push(table(t));
        continue;
      }
      if (reQuote.test(l)) {
        flush();
        const q = [];
        while (i < lines.length && (m = reQuote.exec(lines[i]))) { q.push(m[1]); i++; }
        out.push(`<blockquote>${render(q.join('\n'), opts)}</blockquote>`);
        continue;
      }
      if ((m = reLi.exec(l)) && (!para.length || m[1].length === 0)) {
        flush();
        const items = [];
        while (i < lines.length) {
          const x = reLi.exec(lines[i]);
          if (x) { const ord = /\d/.test(x[2]); items.push({ ind: x[1].length, ord, num: ord ? parseInt(x[2], 10) : 0, text: x[3] }); i++; continue; }
          if (!/^\s*$/.test(lines[i]) && /^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1].text += `\n${lines[i].trim()}`; i++; continue; }
          break;
        }
        out.push(list(items));
        continue;
      }
      para.push(l.replace(/^ {1,3}/, ''));
      i++;
    }
    flush();
    return out.join('\n');
  }
  // Uma linha só (comentários curtos): sem blocos
  const renderInline = (src) => inline(String(src ?? ''));
  return { render, renderInline, esc };
});
