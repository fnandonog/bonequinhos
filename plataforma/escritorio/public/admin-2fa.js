// Confirmação da verificação em duas etapas sem sair da página (escritório, redes sociais, anúncios, cockpit, segurança).
// Quando uma rota do painel responde 401 { code: '2fa' } (ação de risco alto, ou a confirmação do painel venceu), abre uma
// janela pedindo o código de 6 dígitos (ou a chave de acesso), confirma em /api/security/2fa/verify e REPETE o pedido original
// sozinho. Cancelou: a página recebe a resposta 401 de sempre e mostra o erro dela. Também cuida dos links de download do
// painel (<a download href="/admin/api/…">), que são baixados por aqui para poder pedir o código no meio.
// Carregado pela barra comum do painel (lib/admin/nav.js) e pelas páginas de entrega e de segurança. Sem dependências.
(function () {
  'use strict';
  if (window.Admin2FA) return;
  const orig = window.fetch.bind(window);
  const WATCH = /^\/(admin\/api|api\/security)\//; // rotas que podem pedir a confirmação
  const SKIP = /^\/api\/security\/(2fa\/(verify|status)|passkey\/auth\/)/; // as da própria confirmação
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toBuf = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0)).buffer;
  const toB64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const urlOf = (input) => { try { return new URL(typeof input === 'string' ? input : input.url, location.href); } catch { return null; } };
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

  async function post(url, body) {
    const r = await orig(url, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || `Erro ${r.status}`), { code: j.code });
    return j;
  }

  // ---------- Janela ----------
  const CSS = `
.a2fa-scrim{position:fixed;inset:0;z-index:2147483000;background:rgba(15,12,30,.55);display:grid;place-items:center;padding:16px;animation:a2faIn .15s ease-out}
.a2fa{width:min(420px,100%);box-sizing:border-box;background:var(--surface,#fff);color:var(--ink,#15121f);border:1px solid var(--line,#e6e3ef);border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.3);padding:20px;font:500 15px/1.45 var(--font,system-ui,sans-serif);display:grid;gap:12px}
.a2fa h2{margin:0;font:700 19px/1.2 var(--display,inherit);letter-spacing:-.01em}
.a2fa p{margin:0;color:var(--ink-2,#4a4660);font-size:14px}
.a2fa .a2fa-tier{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:700;background:var(--warn-soft,#fff2d9);color:var(--warn,#b86e00)}
.a2fa input[type=text]{width:100%;box-sizing:border-box;height:52px;border-radius:12px;border:1.5px solid var(--line-2,#d6d2e3);background:var(--bg,#fff);color:inherit;font:700 24px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.3em;text-align:center}
.a2fa input[type=text]:focus{outline:2.5px solid var(--accent,#5b2eff);outline-offset:1px}
.a2fa input.a2fa-rec{font-size:17px;letter-spacing:.08em}
.a2fa button{height:44px;border-radius:12px;border:1px solid var(--line-2,#d6d2e3);background:var(--surface,#fff);color:inherit;font:700 14.5px var(--font,system-ui,sans-serif);cursor:pointer;padding:0 14px}
.a2fa button:disabled{opacity:.55;cursor:progress}
.a2fa .a2fa-ok{background:var(--accent,#5b2eff);border-color:var(--accent,#5b2eff);color:var(--accent-ink,#fff)}
.a2fa .a2fa-row{display:flex;gap:8px}.a2fa .a2fa-row>*{flex:1}
.a2fa .a2fa-link{border:0;background:none;height:auto;padding:0;color:var(--accent,#5b2eff);font-weight:600;font-size:13.5px;text-align:left;text-decoration:underline;text-underline-offset:2px}
.a2fa label.a2fa-trust{display:flex;gap:9px;align-items:flex-start;font-size:13.5px;color:var(--ink-2,#4a4660);cursor:pointer}
.a2fa label.a2fa-trust input{width:18px;height:18px;margin:1px 0 0;flex:none;accent-color:var(--accent,#5b2eff)}
.a2fa .a2fa-msg{min-height:1.2em;font-size:13.5px;font-weight:600;color:var(--err,#e5484d)}
.a2fa .a2fa-msg:empty{display:none}
@media (max-width:640px){.a2fa-scrim{place-items:end center;padding:0}.a2fa{border-radius:20px 20px 0 0;padding:20px 16px calc(16px + env(safe-area-inset-bottom))}}
@keyframes a2faIn{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.a2fa-scrim{animation:none}}`;
  function injectCss() {
    if (document.getElementById('a2fa-css')) return;
    const st = document.createElement('style');
    st.id = 'a2fa-css';
    st.textContent = CSS;
    document.head.append(st);
  }

  async function openDialog(info) {
    injectCss();
    let status = { totp: true, passkeys: 0, recovery: 0, trusted: !!(info && info.trusted), trust_days: 30 };
    try { const r = await orig('/api/security/2fa/status', { credentials: 'same-origin' }); if (r.ok) status = await r.json(); } catch {}
    const high = info && info.tier === 'alto';
    const pk = status.passkeys > 0 && !!(window.PublicKeyCredential && navigator.credentials);
    return new Promise((resolve) => {
      const scrim = document.createElement('div');
      scrim.className = 'a2fa-scrim';
      scrim.innerHTML = `<form class="a2fa" role="dialog" aria-modal="true" aria-labelledby="a2faT" novalidate>
        <div>${high ? '<span class="a2fa-tier">Risco alto: dinheiro, contas ou segurança</span>' : ''}</div>
        <h2 id="a2faT">Confirme que é você</h2>
        <p>${esc(high ? 'Esta ação pede o código da verificação em duas etapas. Depois de confirmar, ela continua sozinha, sem sair desta tela.' : 'A confirmação do painel venceu. Digite o código e a ação continua sozinha, sem sair desta tela.')}</p>
        ${status.totp ? '<input type="text" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="000000" aria-label="Código de 6 dígitos do aplicativo autenticador" />' : ''}
        <input type="text" name="rec" class="a2fa-rec" autocomplete="off" spellcheck="false" maxlength="20" placeholder="abcde-fghjk" aria-label="Código de recuperação" hidden />
        ${pk ? '<button type="button" data-a2fa="pk">Usar chave de acesso (Touch ID, Face ID)</button>' : ''}
        ${status.trusted ? '' : `<label class="a2fa-trust"><input type="checkbox" name="trust" ${store.get('a2fa-trust') === '1' ? 'checked' : ''}/><span>Confiar neste dispositivo por ${Number(status.trust_days) || 30} dias (pede o código bem menos vezes; não marque em computador compartilhado)</span></label>`}
        <p class="a2fa-msg" role="alert"></p>
        <div class="a2fa-row"><button type="button" data-a2fa="cancel">Cancelar</button><button type="submit" class="a2fa-ok">Confirmar</button></div>
        ${status.recovery ? '<button type="button" class="a2fa-link" data-a2fa="rec">Perdi o celular: usar um código de recuperação</button>' : ''}
      </form>`;
      document.body.append(scrim);
      const form = scrim.firstElementChild;
      const msg = form.querySelector('.a2fa-msg');
      const code = form.querySelector('[name=code]');
      const rec = form.querySelector('[name=rec]');
      const trustBox = form.querySelector('[name=trust]');
      let useRec = false;
      const prevFocus = document.activeElement;
      const trust = () => !!(trustBox && trustBox.checked);
      const busy = (on) => form.querySelectorAll('button,input').forEach((x) => { x.disabled = on; });
      const close = (ok) => {
        document.removeEventListener('keydown', onKey, true);
        scrim.remove();
        if (trustBox) store.set('a2fa-trust', trustBox.checked ? '1' : '0');
        try { prevFocus && prevFocus.focus && prevFocus.focus({ preventScroll: true }); } catch {}
        resolve(ok);
      };
      const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(false); }
        else if (e.key === 'Tab') { // foco preso na janela
          const els = [...form.querySelectorAll('button:not([hidden]),input:not([hidden])')].filter((x) => !x.disabled);
          if (!els.length) return;
          const first = els[0], last = els[els.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
        e.stopPropagation(); // não dispara os atalhos da página (j/k/a/r…) enquanto a janela está aberta
      };
      document.addEventListener('keydown', onKey, true);
      async function submit() {
        const value = useRec ? rec.value : (code ? code.value : '');
        if (!value.trim()) { msg.textContent = useRec ? 'Digite o código de recuperação.' : 'Digite o código de 6 dígitos.'; return; }
        busy(true); msg.textContent = '';
        try { await post('/api/security/2fa/verify', { method: useRec ? 'recovery' : 'totp', code: value, trust: !useRec && trust() }); close(true); }
        catch (err) { msg.textContent = err.message; busy(false); (useRec ? rec : code)?.select(); }
      }
      form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
      code && code.addEventListener('input', () => { const v = code.value.replace(/\D/g, ''); if (v.length === 6 && !useRec) submit(); });
      form.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-a2fa]');
        if (!b) return;
        if (b.dataset.a2fa === 'cancel') return close(false);
        if (b.dataset.a2fa === 'rec') { useRec = true; rec.hidden = false; if (code) code.hidden = true; b.hidden = true; rec.focus(); return; }
        if (b.dataset.a2fa === 'pk') {
          busy(true); msg.textContent = '';
          try {
            const o = await post('/api/security/passkey/auth/options');
            const pub = { ...o.publicKey, challenge: toBuf(o.publicKey.challenge), allowCredentials: o.publicKey.allowCredentials.map((c) => ({ ...c, id: toBuf(c.id) })) };
            const cred = await navigator.credentials.get({ publicKey: pub });
            const r = cred.response;
            await post('/api/security/passkey/auth/verify', { challengeId: o.challengeId, trust: trust(),
              credential: { id: toB64u(cred.rawId), response: { clientDataJSON: toB64u(r.clientDataJSON), authenticatorData: toB64u(r.authenticatorData), signature: toB64u(r.signature), userHandle: r.userHandle ? toB64u(r.userHandle) : null } } });
            close(true);
          } catch (err) {
            msg.textContent = err && err.name === 'NotAllowedError' ? 'Operação cancelada ou o tempo acabou.' : (err && err.message) || 'Não foi possível usar a chave de acesso.';
            busy(false);
          }
        }
      });
      setTimeout(() => (code || form.querySelector('[data-a2fa=pk]') || form.querySelector('.a2fa-ok')).focus(), 30);
    });
  }

  // Um pedido de confirmação de cada vez: pedidos simultâneos esperam a mesma janela
  let pending = null;
  function confirmNow(info) {
    const ask = (window.Admin2FA && typeof window.Admin2FA.prompt === 'function') ? window.Admin2FA.prompt : openDialog; // prompt: troca a janela (testes)
    if (!pending) pending = Promise.resolve(ask(info || {})).finally(() => { pending = null; });
    return pending;
  }

  // ---------- fetch com confirmação e nova tentativa ----------
  window.fetch = async function (input, init) {
    const u = urlOf(input);
    if (!u || u.origin !== location.origin || !WATCH.test(u.pathname) || SKIP.test(u.pathname)) return orig(input, init);
    const again = typeof Request !== 'undefined' && input instanceof Request ? input.clone() : input;
    const res = await orig(input, init);
    if (res.status !== 401) return res;
    let j = null;
    try { j = await res.clone().json(); } catch {}
    if (!j || j.code !== '2fa') return res;
    if (!(await confirmNow(j))) return res;
    return orig(again, init);
  };

  // ---------- Downloads do painel (ex.: CSV do financeiro, risco alto) ----------
  document.addEventListener('click', async (e) => {
    const a = e.target.closest && e.target.closest('a[download][href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const u = urlOf(a.getAttribute('href'));
    if (!u || u.origin !== location.origin || !/^\/admin\/api\//.test(u.pathname)) return;
    e.preventDefault();
    try {
      const r = await window.fetch(u.href, { credentials: 'same-origin' });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || `Erro ${r.status}`); }
      const cd = r.headers.get('content-disposition') || '';
      const name = (/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd) || [])[1] || a.getAttribute('download') || u.pathname.split('/').pop();
      const href = URL.createObjectURL(await r.blob());
      const tmp = Object.assign(document.createElement('a'), { href, download: decodeURIComponent(name) });
      document.body.append(tmp); tmp.click(); tmp.remove();
      setTimeout(() => URL.revokeObjectURL(href), 30000);
    } catch (err) { alert(`Não deu para baixar: ${err.message}`); }
  });

  window.Admin2FA = { confirm: confirmNow, fetch: window.fetch };
})();
