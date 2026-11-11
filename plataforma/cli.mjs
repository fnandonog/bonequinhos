#!/usr/bin/env node
// Linha de comando dos agentes para os dados da plataforma (sem rede, sem segredos, nada sai para fora).
//
//   node plataforma/cli.mjs resumo                         # perfis, fila, números e funil numa tela só
//   node plataforma/cli.mjs analytics [perfil]             # seguidores, views e os posts com métricas (JSON)
//   node plataforma/cli.mjs fila                           # vídeos: produzindo, esperando aprovação, agendados, publicados
//   node plataforma/cli.mjs pautas [perfil]                # pautas novas e usadas
//   node plataforma/cli.mjs pauta <perfil> "tema" ["motivo"]   # adiciona pauta nova (pauteiro, analista, diretor)
//   node plataforma/cli.mjs tendencias [perfil]             # Shorts que mais cresceram no nicho (views/dia) e buscas em alta no Brasil
//   node plataforma/cli.mjs retencao [perfil]               # nossos posts com tempo médio assistido, views e salvamentos
//   node plataforma/cli.mjs comentarios [--todos]          # comentários novos das redes
//   node plataforma/cli.mjs rascunho <id> "resposta"       # Comunidade: deixa a resposta pronta; o dono aprova e envia no painel
//   node plataforma/cli.mjs afiliados <video-id> "Produto | https://link" [...]   # Afiliados: links de produto do vídeo
import fs from 'node:fs';
import path from 'node:path';
import {perfis, fila, pautas, salvarPautas, item, salvarItem, RAIZ, env} from './lib/dados.mjs';
import {analytics, comentarios, salvarComentario} from './sincronizar.mjs';
import {tendencias} from './tendencias.mjs';

const [cmd, ...a] = process.argv.slice(2);
const out = (x) => console.log(typeof x === 'string' ? x : JSON.stringify(x, null, 2));

switch (cmd) {
  case 'resumo': {
    const A = analytics();
    const f = fila();
    const conta = (s) => f.filter((x) => x.status === s).length;
    out(`Números de ${A.atualizado ?? 'nunca (Meta ainda não conectada?)'}`);
    for (const p of perfis()) {
      const i = A.perfis?.[p.id]?.instagram;
      const novas = pautas(p.id).pautas.filter((x) => x.status === 'nova').length;
      out(`- ${p.nome} (@${p.instagram}) ${p.ativo ? 'ATIVO' : 'pausado'} · seguidores ${i?.followers_count ?? '—'} · views 30d ${i?.views_30d ?? '—'} · posts 30d ${i?.posts_30d ?? '—'} · pautas novas ${novas}`);
    }
    out(`Fila: ${conta('produzindo')} produzindo, ${conta('aguardando_aprovacao')} esperando o dono, ${conta('aprovado')} agendados, ${conta('publicado')} publicados, ${conta('erro')} com erro`);
    out(`Grupo de ofertas: ${A.telegram ?? '—'} membros · receita de afiliado no mês: R$ ${env().RECEITA_AFILIADO_MES || '—'}`);
    out(`Comentários novos: ${comentarios().filter((c) => c.status === 'novo').length}`);
    break;
  }
  case 'analytics': {
    const A = analytics();
    out(a[0] ? A.perfis?.[a[0]] ?? {} : {atualizado: A.atualizado, telegram: A.telegram, erros: A.erros, perfis: Object.fromEntries(Object.entries(A.perfis ?? {}).map(([k, v]) => [k, {...v, instagram: v.instagram && {...v.instagram, midias: (v.instagram.midias ?? []).slice(0, 10).map((m) => ({legenda: (m.caption ?? '').slice(0, 80), quando: m.timestamp, likes: m.like_count, comentarios: m.comments_count, ...m.insights, link: m.permalink}))}}]))});
    break;
  }
  case 'fila':
    out(fila().map((x) => ({id: x.id, perfil: x.perfil, tema: x.tema, status: x.status, etapa: x.etapa, agendado_para: x.agendado_para, erro: x.erro})));
    break;
  case 'pautas':
    for (const p of perfis().filter((p) => !a[0] || p.id === a[0])) out({perfil: p.id, nome: p.nome, pautas: pautas(p.id).pautas});
    break;
  case 'pauta': {
    const [perfil, tema, motivo] = a;
    if (!perfis().some((p) => p.id === perfil) || !tema) throw new Error('uso: pauta <perfil> "tema" ["motivo"]');
    const d = pautas(perfil);
    if (d.pautas.some((x) => x.tema.toLowerCase() === tema.toLowerCase())) { out('já existe'); break; }
    d.pautas.push({tema, status: 'nova', ...(motivo ? {motivo} : {}), sugerida_em: new Date().toISOString()});
    salvarPautas(perfil, d);
    out(`✔ pauta adicionada em ${perfil}: ${tema}`);
    break;
  }
  case 'tendencias': {
    const t = tendencias();
    out(`Tendências de ${t.atualizado ?? 'nunca (rode node plataforma/tendencias.mjs)'} · janela ${t.dias ?? '?'} dias${(t.erros ?? []).length ? `\nAvisos: ${t.erros.join(' | ')}` : ''}`);
    for (const p of perfis().filter((p) => !a[0] || p.id === a[0])) {
      out(`\n## ${p.nome}`);
      for (const v of (t.perfis?.[p.id] ?? []).slice(0, 10)) out(`- ${v.views_por_dia.toLocaleString('pt-BR')} views/dia · ${v.duracao_s}s · "${v.titulo}" (${v.canal}) ${v.link}`);
    }
    out(`\n## Buscas em alta no Brasil hoje (Google Trends)\n${(t.google_trends ?? []).map((g) => `- ${g.termo} (${g.buscas})`).join('\n')}`);
    break;
  }
  case 'retencao': {
    const A = analytics();
    for (const p of perfis().filter((p) => !a[0] || p.id === a[0])) {
      const ms = A.perfis?.[p.id]?.instagram?.midias ?? [];
      if (!ms.length) continue;
      out(`\n## ${p.nome}`);
      for (const m of ms.filter((m) => m.insights).slice(0, 15))
        out(`- ${(m.caption ?? '').split('\n')[0].slice(0, 70)} · views ${m.insights.views ?? '—'} · assistido em média ${m.insights.ig_reels_avg_watch_time != null ? (m.insights.ig_reels_avg_watch_time / 1000).toFixed(1) + 's' : '—'} · salvos ${m.insights.saved ?? '—'} · compart. ${m.insights.shares ?? '—'}`);
    }
    break;
  }
  case 'comentarios':
    out(comentarios().filter((c) => a.includes('--todos') || c.status === 'novo').map(({id, perfil, autor, texto, post, quando, rascunho, status}) => ({id, perfil, autor, texto, post, quando, rascunho, status})));
    break;
  case 'rascunho': {
    const [id, texto] = a;
    if (!id || !texto) throw new Error('uso: rascunho <id> "resposta"');
    salvarComentario(id, {rascunho: texto.slice(0, 2000), rascunho_por: process.env.OFFICE_AGENT_ID || 'comunidade'});
    out(`✔ rascunho salvo em ${id} (o dono aprova e envia no painel)`);
    break;
  }
  case 'afiliados': {
    const [id, ...links] = a;
    if (!item(id)) throw new Error('vídeo não está na fila: ' + id);
    const lista = links.map((l) => l.split('|').map((x) => x.trim())).filter((x) => /^https?:\/\//.test(x[1] ?? '')).map(([produto, url]) => ({produto, url}));
    salvarItem({id, afiliados: lista});
    fs.mkdirSync(path.join(RAIZ, 'out'), {recursive: true});
    out(`✔ ${lista.length} link(s) de afiliado no vídeo ${id}`);
    break;
  }
  default:
    out(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n'));
}
