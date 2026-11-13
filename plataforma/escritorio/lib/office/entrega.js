// Páginas limpas, em tela cheia, de uma entrega de agente (/admin/escritorio/entrega/:id) e de um anexo
// (/admin/escritorio/arquivo/:fid). A entrega em texto é Markdown dos agentes, mostrado pelo renderizador seguro
// (lib/office/markdown.js: tudo escapado, links só http(s)/mailto). Aprovar / Pedir ajuste chamam a rota de sempre
// (POST /admin/api/office/tasks/:id/action). Montado por lib/office/index.js.
const fs = require('fs');
const path = require('path');
const brand = require('../brand');
const md = require('./markdown');

const esc = md.esc;
const ver = (f) => { try { return Math.round(fs.statSync(path.join(__dirname, '../../public', f)).mtimeMs).toString(36); } catch { return '1'; } };
const when = (ms) => new Date(ms).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const KIND = { post: 'Post na Central', anuncio: 'Proposta de anúncio', arquivo: 'Arquivo', texto: 'Entrega em texto', link: 'Link' };
const STATUS = { backlog: 'A fazer', doing: 'Fazendo', review: 'Esperando sua revisão', done: 'Feito' };
const APPROVAL = { aprovado: 'Aprovado', rejeitado: 'Ajuste pedido', pendente: 'Pendente' };
const PREVIEW = ['application/pdf', 'image/jpeg', 'image/png'];
const API = '/admin/api/office';
const fsize = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const ink = (hex) => { const m = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return '#15121f'; const n = parseInt(m[1], 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 110 ? '#ffffff' : '#15121f'; };
const initials = (n) => String(n || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') || /^\/(?!\/)/.test(u || '') ? esc(u) : null);

function shell({ title, back, body, script = '' }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${esc(title)} | Escritório · Agência do Zé</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="theme-color" content="${brand.COLORS.violet}" />
  <link rel="icon" href="${esc(brand.faviconDataUri)}" />
  <link rel="stylesheet" href="/fonts/fonts.css" />
  <link rel="stylesheet" href="/styles.css" />
  <link rel="stylesheet" href="/escritorio.css?v=${ver('escritorio.css')}" />
  <script>try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body class="of en">
  <header class="en-top"><div class="en-top-in">
    <a class="en-back" href="${back}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>Voltar ao escritório</a>
    <a class="en-brand" href="/admin/escritorio" aria-label="Escritório da agência"><svg viewBox="0 0 64 64" aria-hidden="true">${brand.markPaths()}</svg></a>
  </div></header>
  <main class="en-main">${body}</main>
  <div class="of-toasts" id="toasts" aria-live="polite"></div>
  <script src="/admin-2fa.js?v=${ver('admin-2fa.js')}" defer></script>
  ${script}
</body>
</html>`;
}

function who(agent, id) {
  if (!agent) return `<span class="en-who"><span class="of-ag-av admin">${id === 'admin' ? 'VC' : '?'}</span><span><b>${id === 'admin' ? 'Você' : esc(id || 'Sistema')}</b></span></span>`;
  return `<span class="en-who"><span class="of-ag-av" style="background:${esc(agent.color)};color:${ink(agent.color)}">${esc(initials(agent.name))}</span>
    <span><b>${esc(agent.name)}</b><small>${esc(agent.role || '')}</small></span></span>`;
}
function filesList(files) {
  if (!files || !files.length) return '';
  return `<section class="en-sec"><h2>Anexos da tarefa</h2><ul class="of-files">${files.map((f) => `<li>
    <span class="of-file-ic">${esc((/\.([^.]+)$/.exec(f.name) || ['', 'arq'])[1].toUpperCase().slice(0, 4))}</span>
    <span class="of-file-t"><b title="${esc(f.name)}">${esc(f.name)}</b><small>${fsize(f.size)}</small></span>
    ${PREVIEW.includes(f.mime) ? `<a class="of-btn of-btn-sm" href="/admin/escritorio/arquivo/${f.id}">Ver</a>` : ''}
    <a class="of-btn of-btn-sm" href="${API}/files/${f.id}/download" download>Baixar</a></li>`).join('')}</ul></section>`;
}
// Aprovar / Pedir ajuste (só quando a tarefa está em Revisão)
function decision(task) {
  if (task.status !== 'review') {
    const label = task.approval ? APPROVAL[task.approval] || task.approval : STATUS[task.status];
    return `<section class="en-decide en-done"><span class="of-chip ${task.approval === 'aprovado' ? 'ok' : task.approval === 'rejeitado' ? 'rej' : ''}">${esc(label)}</span>
      <span>Esta tarefa não está esperando revisão${task.status ? ` (${esc(STATUS[task.status])})` : ''}.</span></section>`;
  }
  return `<section class="en-decide" id="decide" data-task="${task.id}">
    <h2>Sua decisão</h2>
    ${task.sensitive ? `<p class="en-note"><b>Sensível: só você aprova.</b>${task.sensitive_reason ? ` <span class="en-hint">Motivo: ${esc(task.sensitive_reason)}</span>` : ''}</p>` : ''}
    ${task.review_note && task.reviewed_by === 'gerente' ? `<p class="en-note"><b>Parecer do Gerente Geral:</b> ${md.renderInline(task.review_note)}</p>` : ''}
    <label class="of-field">Comentário para o agente (opcional)<textarea id="feedback" placeholder="Ex.: inclua o telefone das empresas, tire as duplicadas…"></textarea></label>
    <div class="of-row"><button type="button" class="of-btn of-btn-ok" data-act="approve">Aprovar</button>
      <button type="button" class="of-btn of-btn-warn" data-act="reject">Pedir ajuste</button></div>
    <p class="en-hint">Aprovar aqui só fecha a tarefa. Postagens, anúncios e e-mails continuam precisando da aprovação na própria tela (Central, Anúncios).</p>
  </section>`;
}
const actionScript = (task) => `<script>
(function(){
  var box=document.getElementById('decide'); if(!box) return;
  function toast(m,e){var t=document.createElement('div');t.className='of-toast'+(e?' err':'');t.textContent=m;document.getElementById('toasts').append(t);setTimeout(function(){t.remove()},4000);}
  box.addEventListener('click',async function(ev){
    var b=ev.target.closest('[data-act]'); if(!b) return;
    var act=b.dataset.act, fb=document.getElementById('feedback').value.trim();
    if(act==='reject'&&!fb&&!confirm('Pedir ajuste sem comentário? O agente não vai saber o que mudar.')) return;
    box.querySelectorAll('button').forEach(function(x){x.disabled=true});
    try{
      var r=await fetch(${JSON.stringify(`${API}/tasks/${task.id}/action`)},{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({action:act,feedback:fb||undefined})});
      var j=await r.json().catch(function(){return {}});
      if(!r.ok){ if(j.code==='2fa'&&!window.Admin2FA&&j.url&&confirm((j.error||'Confirme a 2FA.')+'\\n\\nAbrir a confirmação agora?')) location.href='/entrar/2fa?motivo=renovar&next='+encodeURIComponent(location.pathname); throw new Error(j.code==='2fa'?'Ação não feita: confirme o código para continuar.':(j.error||('Erro '+r.status))); }
      toast(act==='approve'?'Aprovado. A tarefa foi para Feito.':'Ajuste pedido: a tarefa voltou para Fazendo.');
      setTimeout(function(){location.reload()},900);
    }catch(e){toast(e.message,true);box.querySelectorAll('button').forEach(function(x){x.disabled=false});}
  });
})();
</script>`;
const copyScript = `<script>
(function(){var b=document.getElementById('copy'),src=document.getElementById('raw');if(!b||!src)return;
b.addEventListener('click',async function(){try{await navigator.clipboard.writeText(JSON.parse(src.textContent));b.textContent='Copiado';setTimeout(function(){b.textContent='Copiar texto'},1600)}catch(e){alert('Não deu para copiar: '+e.message)}});})();
</script>`;

// Conversa da tarefa (dono ↔ agentes) na tela cheia, ao vivo pelo SSE do escritório (evento "comment")
function threadSection(task, comments, agents) {
  const bubble = (c) => {
    const a = agents[c.author];
    const mine = c.author === 'admin';
    return `<li class="of-msg${mine ? ' me' : ''}">${mine ? '' : `<span class="of-ev-av" style="background:${esc(a ? a.color : '#888')};color:${ink(a ? a.color : '#888')}">${esc(initials(a ? a.name : c.author))}</span>`}<div class="of-msg-b"><small>${mine ? 'Você' : esc(a ? a.name : c.author)} · ${esc(when(c.created_at))}</small><div class="md">${md.render(c.body)}</div></div></li>`;
  };
  return `<section class="en-sec" id="conversa"><h2>Conversa</h2>
    <ol class="of-thread" id="thread" data-thread="${task.id}">${comments.length ? comments.map(bubble).join('') : '<li class="of-empty">Nenhuma mensagem ainda. Escreva para o agente: ele lê na próxima rodada e responde aqui.</li>'}</ol>
    <form class="of-say" id="say"><textarea name="body" rows="2" maxlength="4000" placeholder="Escreva para o agente (Enter envia, Shift+Enter quebra linha)"></textarea><button class="of-btn of-btn-primary of-btn-sm" type="submit">Enviar</button></form></section>`;
}
const threadScript = (task, agents) => `<script src="/escritorio-md.js"></script><script>
(function(){
  var T=${task.id}, A=${JSON.stringify(agents).replace(/</g, '\\u003c')}, list=document.getElementById('thread'), form=document.getElementById('say'); if(!list||!form) return;
  var seen={}; [].forEach.call(list.querySelectorAll('[data-id]'),function(li){seen[li.dataset.id]=1});
  function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function md(t){return window.OfficeMd?window.OfficeMd.render(t):'<p style="white-space:pre-wrap">'+e(t)+'</p>'}
  function add(c){ if(c.task_id!==T||seen[c.id]) return; seen[c.id]=1; var em=list.querySelector('.of-empty'); if(em) em.remove();
    var a=A[c.author], me=c.author==='admin', li=document.createElement('li'); li.className='of-msg'+(me?' me':'');
    li.innerHTML=(me?'':'<span class="of-ev-av" style="background:'+e(a?a.color:'#888')+'">'+e((a?a.name:c.author).split(/\\s+/).map(function(w){return w[0]}).join('').slice(0,2).toUpperCase())+'</span>')+'<div class="of-msg-b"><small>'+(me?'Você':e(a?a.name:c.author))+' · agora</small><div class="md">'+md(c.body)+'</div></div>';
    list.append(li); list.scrollTop=list.scrollHeight; }
  list.scrollTop=list.scrollHeight;
  form.addEventListener('keydown',function(ev){ if(ev.key==='Enter'&&!ev.shiftKey&&!ev.isComposing){ev.preventDefault();form.requestSubmit();} });
  form.addEventListener('submit',async function(ev){ ev.preventDefault(); var ta=form.querySelector('textarea'), b=form.querySelector('button'), v=ta.value.trim(); if(!v) return; b.disabled=true;
    try{ var r=await fetch(${JSON.stringify(`${API}/tasks/${task.id}/comments`)},{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({body:v})}); var j=await r.json().catch(function(){return{}}); if(!r.ok) throw new Error(j.error||('Erro '+r.status)); add(j.comment); ta.value=''; }
    catch(err){ var t=document.createElement('div'); t.className='of-toast err'; t.textContent=err.message; document.getElementById('toasts').append(t); setTimeout(function(){t.remove()},4000); }
    finally{ b.disabled=false; ta.focus(); } });
  if(window.EventSource){ var es=new EventSource(${JSON.stringify(`${API}/stream`)}); es.addEventListener('comment',function(m){ try{ add(JSON.parse(m.data)); }catch(x){} }); }
})();
</script>`;

function renderArtifact({ artifact: x, task, agent, files, comments = [], agents = {} }) {
  const back = `/admin/escritorio#tarefa-${task.id}`;
  const u = safeUrl(x.url);
  const raw = x.content ? JSON.stringify(String(x.content)).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, (c) => (c === '\u2028' ? '\\u2028' : '\\u2029')) : '';
  const body = `<article class="en-doc">
    <div class="en-meta-top"><span class="of-chip">${esc(KIND[x.kind] || x.kind)}</span><span>Tarefa #${task.id} · ${esc(STATUS[task.status] || task.status)}</span></div>
    <h1>${esc(task.title)}</h1>
    ${x.label && x.label !== task.title ? `<p class="en-sub">${esc(x.label)}</p>` : ''}
    <div class="en-meta">${who(agent, x.agent_id)}<span class="en-date">Entregue em ${esc(when(x.created_at))}</span>
      ${x.content ? '<button type="button" class="of-btn of-btn-sm" id="copy">Copiar texto</button>' : ''}</div>
    ${u ? `<p class="en-linkbox"><a class="of-btn" href="${u}"${/^https?:/i.test(x.url) ? ' target="_blank" rel="noopener noreferrer"' : ''}>Abrir${x.kind === 'post' ? ' na Central' : x.kind === 'anuncio' ? ' nos anúncios' : ' o link'}</a> <code>${esc(x.url)}</code></p>` : ''}
    ${x.path ? `<p class="en-linkbox">No Mac: <code>${esc(x.path)}</code></p>` : ''}
    ${x.content ? `<div class="md md-page">${md.render(x.content)}</div>` : ''}
    ${filesList(files)}
    ${decision(task)}
    ${threadSection(task, comments, agents)}
  </article>${raw ? `<script type="application/json" id="raw">${raw}</script>` : ''}`;
  return shell({ title: task.title, back, body, script: actionScript(task) + copyScript + threadScript(task, agents) });
}

function renderFile({ file: f, task, agent }) {
  const back = `/admin/escritorio#tarefa-${task.id}`;
  const src = `${API}/files/${f.id}/download?inline=1`;
  const viewer = f.mime === 'application/pdf' ? `<iframe class="en-pdf" src="${src}" title="${esc(f.name)}"></iframe>
      <p class="en-alt">O PDF não apareceu? <a href="${src}" target="_blank" rel="noopener">Abrir numa aba</a> ou use Baixar.</p>`
    : /^image\//.test(f.mime) ? `<div class="en-img"><img src="${src}" alt="${esc(f.name)}"/></div>`
      : '<p class="en-note">Este tipo de arquivo não abre no navegador. Use Baixar.</p>';
  const body = `<article class="en-doc en-wide">
    <div class="en-meta-top"><span class="of-chip">Anexo</span><span>Tarefa #${task.id} · ${esc(task.title)}</span></div>
    <h1 class="en-fname">${esc(f.name)}</h1>
    <div class="en-meta">${who(agent, f.uploaded_by)}<span class="en-date">${fsize(f.size)} · enviado em ${esc(when(f.created_at))}</span>
      <a class="of-btn of-btn-sm" href="${API}/files/${f.id}/download" download>Baixar</a></div>
    ${viewer}
  </article>`;
  return shell({ title: f.name, back, body });
}

module.exports = { renderArtifact, renderFile };
