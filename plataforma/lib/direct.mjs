// ROBÔ COMENTÁRIO → DIRECT, portado do Robô de Comentários do Precinho de Ouro (em-busca-do-afiliado-automatico/server/dm.js).
//   1. Quem comenta a palavra do perfil (RECEITA, PLANILHA, LINK...) num post nosso dos últimos 7 dias recebe uma resposta
//      pública ("te mandei no direct") e uma resposta privada no direct com o botão "Liberar". A Meta só deixa a empresa
//      mandar UMA mensagem para quem só comentou; o botão faz a pessoa responder e abre a conversa.
//   2. Quando a pessoa toca no botão (ou escreve qualquer coisa), o robô confere se ela segue o perfil
//      (is_user_follow_business). Seguiu: manda o conteúdo. Não seguiu: "segue e toca de novo", com o botão outra vez,
//      quantas vezes precisar dentro dos 7 dias. Se a Meta não responder a checagem, o conteúdo vai (erro da Meta não
//      segura ninguém).
//   O botão é uma resposta rápida (quick reply), não um botão de template: o toque num postback só chega por webhook e
//   nunca aparece na conversa que o robô consulta (foi o bug do Precinho em 24/10). A API não tem botão "Seguir": a
//   mensagem leva o link do perfil e o robô confere o seguir a cada toque.
// Roda por consulta (sem webhook, o painel só existe no Mac): a cada `intervalo_min` pelo painel, ou `node plataforma/direct.mjs`.
// Lê os comentários de um post só quando a contagem dele mudou (limite de chamadas do app da Meta).
// Permissões do token (Configurações → Meta): instagram_manage_comments, instagram_manage_messages, pages_messaging,
// pages_manage_metadata, além das de publicação. No app do Instagram de cada perfil: Configurações → Mensagens e respostas
// aos stories → Ferramentas conectadas → Permitir acesso às mensagens.
import fs from 'node:fs';
import path from 'node:path';
import {PLAT, DADOS, perfis as todosPerfis, fila as filaAtual, env, log} from './dados.mjs';
import {credenciais} from './meta.mjs';

const DIA = 86400000;
const F_CONFIG = path.join(PLAT, 'direct.json');
const F_ESTADO = path.join(DADOS, 'direct.json');
const F_LINKS = path.join(PLAT, 'links.json');
const LIBERAR = 'Liberar';
const RESPOSTAS = ['Te mandei no direct! 📩', 'Enviado no seu direct 😉', 'Corre no direct que tá lá! 👀', 'Mandei no seu direct, confere lá 💛'];

const ler = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
const gravar = (f, d) => {
  fs.writeFileSync(f + '.tmp', JSON.stringify(d, null, 2));
  fs.renameSync(f + '.tmp', f);
};

export const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

// O comentário pede o conteúdo? O comentário inteiro é uma das palavras ("Receita!", "eu quero 😍", "RECEITA RECEITA"):
// uma pergunta ou reclamação que só contém "quero" não é respondida por robô.
export function pedeConteudo(texto, palavras) {
  const t = norm(texto);
  if (!t) return false;
  const ws = palavras.map(norm).filter(Boolean);
  return ws.includes(t) || t.split(' ').every((p) => ws.includes(p));
}

// ---------- configuração (plataforma/direct.json, vai pro git) ----------
export const config = () => ler(F_CONFIG, {ligado: false, perfis: {}});
export function regras(perfilId, cfg = config()) {
  const p = cfg.perfis?.[perfilId] || {};
  const palavra = p.palavra || 'QUERO';
  return {
    ligado: !!(cfg.ligado && p.ligado),
    exigirSeguir: p.exigir_seguir ?? cfg.exigir_seguir ?? true,
    palavra,
    palavras: [...new Set([palavra, ...(p.palavras || cfg.palavras || [])].map((x) => String(x).toLowerCase()))],
    comentario: p.comentario || `💬 Comenta ${palavra} que eu te mando no direct 👇`,
    isca: p.isca || 'o link',
    conteudoPadrao: p.conteudo_padrao || '',
    entrega: p.entrega || '{conteudo}',
  };
}
// Sem `perfil`: o interruptor geral, o intervalo e o exigir seguir padrão. Com `perfil`: os campos daquele perfil.
export function salvarConfig(b) {
  const cfg = config();
  cfg.perfis ??= {};
  if (!b.perfil) {
    if ('ligado' in b) cfg.ligado = !!b.ligado;
    if (b.intervalo_min) cfg.intervalo_min = Math.max(1, Math.min(30, Number(b.intervalo_min) || 2));
    if ('exigir_seguir' in b) cfg.exigir_seguir = !!b.exigir_seguir;
  } else {
    if (!todosPerfis().some((x) => x.id === b.perfil)) throw new Error('perfil não existe: ' + b.perfil);
    const p = (cfg.perfis[b.perfil] ??= {});
    for (const k of ['ligado', 'exigir_seguir']) if (k in b) p[k] = !!b[k];
    for (const k of ['palavra', 'comentario', 'isca', 'conteudo_padrao', 'entrega']) if (typeof b[k] === 'string') p[k] = b[k].slice(0, 1500);
    if (b.palavras != null) p.palavras = (Array.isArray(b.palavras) ? b.palavras : String(b.palavras).split(',')).map((x) => String(x).trim().toLowerCase()).filter(Boolean).slice(0, 20);
    if (!String(p.palavra || '').trim()) throw new Error('Informe a palavra do comentário.');
    p.palavra = p.palavra.trim().toUpperCase();
  }
  gravar(F_CONFIG, cfg);
  return cfg;
}

// ---------- estado (plataforma/dados/direct.json, só no Mac) ----------
export const estado = (f = F_ESTADO) => ler(f, {pedidos: {}, contagens: {}, sem_inbox: {}, ultimo_erro: 0});

export function resumo(agora = Date.now()) {
  const d = new Date(agora);
  d.setHours(0, 0, 0, 0);
  const l = Object.values(estado().pedidos);
  const hoje = l.filter((x) => x.ts >= d.getTime());
  const conta = (lista) => ({
    pedidos: lista.length,
    entregues: lista.filter((x) => x.estado === 'enviado').length,
    aguardando: lista.filter((x) => x.estado === 'aguardando').length,
    lembretes: lista.reduce((s, x) => s + (x.lembretes || 0), 0),
    erros: lista.filter((x) => x.estado === 'erro').length,
  });
  const porPerfil = {};
  for (const p of todosPerfis()) porPerfil[p.id] = conta(l.filter((x) => x.perfil === p.id));
  return {hoje: conta(hoje), total: conta(l), perfis: porPerfil, ultimos: l.sort((a, b) => b.atualizado - a.atualizado).slice(0, 20)};
}

// O que vai no direct: o modelo de entrega do perfil com {conteudo} (o texto do vídeo, ou o padrão do perfil), {grupo}, {ofertas} e {link}.
// {ofertas}: o canal "Ofertas do Zé" do nicho (perfis.json → ofertas); sem ele, o grupo.
export function textoEntrega(p, r, item) {
  const links = ler(F_LINKS, {});
  const grupo = p.grupo?.url || links.grupo?.url || '';
  const ofertas = p.ofertas?.url || grupo;
  const link = p.link_bio || grupo;
  const troca = (s) => String(s || '').replace(/\{grupo\}/g, grupo).replace(/\{ofertas\}/g, ofertas).replace(/\{link\}/g, link).replace(/\{perfil\}/g, p.nome);
  const conteudo = troca(item?.entrega || r.conteudoPadrao);
  return troca(r.entrega.replace(/\{conteudo\}/g, conteudo)).replace(/\n{3,}/g, '\n\n').trim().slice(0, 990);
}

// O vídeo da fila que virou este post (o id que a Meta devolveu, ou o começo da legenda).
export function itemDoPost(mediaId, legenda, fila = filaAtual()) {
  const porId = fila.find((x) => x.publicacoes?.instagram?.id === mediaId);
  if (porId) return porId;
  const ini = String(legenda || '').slice(0, 80);
  return ini.length >= 20 ? fila.find((x) => String(x.legenda || '').slice(0, 80) === ini) || null : null;
}

const pick = (lista, id) => lista[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % lista.length];

async function httpPadrao(url, opcoes = {}) {
  const r = await fetch(url, opcoes.json ? {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(opcoes.json)} : {});
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error?.message ?? `HTTP ${r.status}`);
  return j;
}

// Uma rodada para todos os perfis ligados (ou só `perfil`). `seco`: lê e conta, sem mandar nada nem gravar, mesmo com o
// robô desligado (para testar a conexão antes de ligar).
// http, credenciaisDe, cfg, arquivo e registrar existem para o teste (plataforma/test/direct.test.mjs) trocar a Meta e os arquivos.
export async function rodar({perfil = null, seco = false, http = httpPadrao, agora = () => Date.now(), credenciaisDe = credenciais, cfg = config(), arquivo = F_ESTADO, registrar = log} = {}) {
  if (!cfg.ligado && !seco) return {pulado: 'Robô do direct desligado (painel → Comentários).'};
  const st = estado(arquivo);
  const out = {respondidos: 0, entregues: 0, lembretes: 0, erros: [], perfis: []};
  const V = env().META_GRAPH_VERSION || 'v22.0';
  for (const p of todosPerfis()) {
    if (perfil && p.id !== perfil) continue;
    const r = regras(p.id, cfg);
    if (!r.ligado && !seco) continue;
    const c = credenciaisDe(p.id);
    if (!c.ig || !c.page || !c.pageToken) { out.erros.push(`${p.nome}: Instagram/Página não conectados (Configurações → Meta).`); continue; }
    out.perfis.push(p.id);
    try {
      await rodarPerfil({p, r, c, st, out, seco, http, agora, G: (x) => `https://graph.facebook.com/${V}/${x}`});
    } catch (e) {
      out.erros.push(`${p.nome}: ${e.message.slice(0, 160)}`);
    }
  }
  if (seco) return out;
  gravar(arquivo, st);
  if (out.respondidos || out.entregues || out.lembretes) registrar('direct', `${out.respondidos} comentário(s) respondido(s), ${out.entregues} entrega(s), ${out.lembretes} pedido(s) para seguir`);
  // o mesmo erro a cada rodada lotaria o log: uma vez por hora
  if (out.erros.length && agora() - (st.ultimo_erro || 0) > 3600000) {
    st.ultimo_erro = agora();
    gravar(arquivo, st);
    registrar('direct', `erro: ${[...new Set(out.erros)].slice(0, 3).join(' | ')}`);
  }
  return out;
}

async function rodarPerfil({p, r, c, st, out, seco, http, agora, G}) {
  const token = c.pageToken;
  // a Meta às vezes responde "Please reduce the amount of data": a mesma chamada com metade do limite, até 3
  const get = async (caminho, q = {}) => {
    for (;;) {
      try { return await http(`${G(caminho)}?${new URLSearchParams({...q, access_token: token})}`); } catch (e) {
        const lim = Number(q.limit);
        if (!/reduce the amount of data/i.test(e.message || '') || !(lim > 3)) throw e;
        q = {...q, limit: String(Math.max(3, Math.floor(lim / 2)))};
      }
    }
  };
  const post = (caminho, json) => (seco ? Promise.resolve({seco: true}) : http(`${G(caminho)}?access_token=${encodeURIComponent(token)}`, {json}));
  const desde = agora() - 7 * DIA;
  const arroba = p.instagram;
  const perfilUrl = `instagram.com/${arroba}`;
  const pedidos = st.pedidos;
  const salvar = (id, dados) => { pedidos[id] = {...pedidos[id], ...dados, perfil: p.id, atualizado: agora(), ts: pedidos[id]?.ts ?? agora()}; };

  // mensagem com o botão "Liberar" (quick reply); se a Meta recusar, texto puro e a pessoa responde a palavra
  async function comBotao(recipient, text, extra = {}) {
    const tentativas = [
      {text, quick_replies: [{content_type: 'text', title: LIBERAR, payload: 'LIBERAR'}]},
      {text: `${text}\n\n(Se o botão não aparecer, responde ${r.palavra} aqui.)`},
    ];
    let erro;
    for (const message of tentativas) {
      try { return await post(`${c.page}/messages`, {recipient, ...extra, message}); } catch (e) { erro = e; }
    }
    throw erro;
  }
  const pedirSeguir = `1️⃣ Segue o @${arroba} (${perfilUrl})\n2️⃣ Depois toca em "${LIBERAR}" aqui embaixo 👇`;

  // 1. comentários novos nos posts dos últimos 7 dias (só os posts cuja contagem mudou)
  const cont = (st.contagens[p.id] ??= {});
  const midias = (await get(`${c.ig}/media`, {fields: 'id,caption,timestamp,comments_count', limit: '15'})).data || [];
  const vistos = {};
  for (const m of midias.filter((x) => Date.parse(x.timestamp) >= desde)) {
    vistos[m.id] = m.comments_count;
    if (m.comments_count != null && cont[m.id] === m.comments_count) continue;
    const comentarios = (await get(`${m.id}/comments`, {fields: 'id,text,username,timestamp', limit: '50'})).data || [];
    const item = itemDoPost(m.id, m.caption);
    for (const cm of comentarios) {
      if (pedidos[cm.id] || cm.username === arroba || Date.parse(cm.timestamp) < desde || !pedeConteudo(cm.text, r.palavras)) continue;
      try {
        await post(`${cm.id}/replies`, {message: pick(RESPOSTAS, cm.id)}).catch(() => null);
        // a caixa de entrada do Instagram não aparece para o painel (falta o "Permitir acesso às mensagens"): o toque no
        // botão nunca seria visto. Sem exigir seguir, o conteúdo vai na própria resposta privada.
        const semInbox = agora() - (st.sem_inbox[p.id] || 0) < DIA;
        if (semInbox && !r.exigirSeguir) {
          const enviado = await post(`${c.page}/messages`, {recipient: {comment_id: cm.id}, message: {text: `Oi, @${cm.username}! Aqui é o Zé 👋\n\n${textoEntrega(p, r, item)}`.slice(0, 1000)}});
          salvar(cm.id, {usuario: enviado?.recipient_id ?? null, nome: cm.username, item: item?.id ?? null, estado: 'enviado', lembretes: 0});
          out.respondidos++; out.entregues++;
          continue;
        }
        const texto = `Oi, @${cm.username}! Aqui é o Zé 👋\n\nSeparei ${r.isca} pra você.${r.exigirSeguir ? `\n\nPra liberar:\n${pedirSeguir}\n\nÉ liberado só pra quem segue.` : `\n\nToca em "${LIBERAR}" aqui embaixo que eu te mando 👇`}`;
        const enviado = await comBotao({comment_id: cm.id}, texto);
        salvar(cm.id, {usuario: enviado?.recipient_id ?? null, nome: cm.username, item: item?.id ?? null, estado: 'aguardando', lembretes: 0});
        out.respondidos++;
      } catch (e) {
        salvar(cm.id, {nome: cm.username, item: item?.id ?? null, estado: 'erro', erro: e.message.slice(0, 300)});
        out.erros.push(`${p.nome}: ${e.message.slice(0, 160)}`);
      }
    }
    if (m.comments_count != null) cont[m.id] = m.comments_count;
  }
  // só os posts ainda na janela ficam guardados
  st.contagens[p.id] = Object.fromEntries(Object.entries(cont).filter(([id]) => id in vistos));

  // 2. quem tocou em "Liberar" (ou escreveu algo): confere o seguir e entrega
  const esperando = Object.entries(pedidos).filter(([, w]) => w.perfil === p.id && w.estado === 'aguardando' && w.ts >= desde && (w.usuario || w.nome));
  if (!esperando.length) return;
  const convs = (await get(`${c.page}/conversations`, {platform: 'instagram', fields: 'participants,messages.limit(10){message,from,created_time}', limit: '50'})).data || [];
  st.sem_inbox[p.id] = convs.length ? 0 : agora();
  if (!convs.length) {
    out.erros.push(`${p.nome}: ${esperando.length} pessoa(s) esperando, mas o Instagram não mostra as conversas. No app do Instagram (@${arroba}): Configurações → Mensagens e respostas aos stories → Ferramentas conectadas → Permitir acesso às mensagens.`);
    return;
  }
  for (const [id, w] of esperando) {
    const quem = (pp) => (w.usuario && pp?.id === w.usuario) || (w.nome && pp?.username === w.nome);
    const conv = convs.find((cv) => (cv.participants?.data || []).some(quem));
    const usuario = w.usuario || (conv?.participants?.data || []).find(quem)?.id;
    const msgsDela = (conv?.messages?.data || []).filter((mm) => quem(mm.from));
    const respondeu = msgsDela.some((mm) => Date.parse(mm.created_time) > w.atualizado - 5000);
    if (!respondeu || !usuario) continue;
    try {
      if (r.exigirSeguir) {
        const segue = (await get(usuario, {fields: 'is_user_follow_business'}).catch(() => ({}))).is_user_follow_business;
        if (segue === false) {
          await comBotao({id: usuario}, `Quase lá! 💛 Ainda não te vi entre os seguidores, e é liberado só pra quem segue.\n\n${pedirSeguir.replace('aqui embaixo', 'de novo')}`, {messaging_type: 'RESPONSE'});
          // depois do toque que acabou de ser respondido (a checagem olha 5 s para trás): só um toque novo conta
          const ultima = Math.max(agora(), ...msgsDela.map((mm) => Date.parse(mm.created_time) || 0)) + 5000;
          salvar(id, {usuario, lembretes: (w.lembretes || 0) + 1});
          pedidos[id].atualizado = ultima;
          out.lembretes++;
          continue;
        }
      }
      const item = w.item ? filaAtual().find((x) => x.id === w.item) : null;
      await post(`${c.page}/messages`, {recipient: {id: usuario}, messaging_type: 'RESPONSE', message: {text: `Prontinho, aqui está! 💛\n\n${textoEntrega(p, r, item)}`.slice(0, 1000)}});
      salvar(id, {usuario, estado: 'enviado'});
      out.entregues++;
    } catch (e) {
      out.erros.push(`${p.nome} (direct): ${e.message.slice(0, 160)}`);
    }
  }
}
