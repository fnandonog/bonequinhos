// SINCRONIZADOR: lê seguidores, posts, métricas e comentários de cada rede e grava em plataforma/dados/
// (analytics.json, comentarios.json). Roda de hora em hora pelo postador, ou pelo botão "Atualizar" do painel.
// Uso: node plataforma/sincronizar.mjs [--forcar]
import fs from 'node:fs';
import path from 'node:path';
import {DADOS, perfis, fila, log} from './lib/dados.mjs';
import {credenciais, contaIG, midiasIG, insightsMidia, insightsConta, comentariosMidia} from './lib/meta.mjs';
import {canalYouTube, membrosTelegram} from './lib/redes.mjs';
import {tarefaComentarios} from './lib/escritorio.mjs';

const F_ANA = path.join(DADOS, 'analytics.json');
const F_COM = path.join(DADOS, 'comentarios.json');
const ler = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
const gravar = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));
const DIA = 86400000;

export const analytics = () => ler(F_ANA, {atualizado: null, perfis: {}, telegram: null, historico: []});
export const comentarios = () => ler(F_COM, []);
export function salvarComentario(id, mudancas) {
  const l = comentarios();
  const c = l.find((x) => x.id === id);
  if (!c) throw new Error('comentário não encontrado');
  Object.assign(c, mudancas);
  gravar(F_COM, l);
  return c;
}

export async function sincronizar({forcar = false} = {}) {
  const ant = analytics();
  if (!forcar && ant.atualizado && Date.now() - new Date(ant.atualizado) < 55 * 60000) return ant;
  const out = {atualizado: new Date().toISOString(), perfis: {}, telegram: null, erros: [], historico: ant.historico ?? []};
  const coms = comentarios();
  const nossos = new Set(fila().flatMap((x) => [x.publicacoes?.instagram?.id].filter(Boolean)));

  for (const p of perfis()) {
    const r = {instagram: null, youtube: null};
    if (credenciais(p.id).ig) {
      try {
        const conta = await contaIG(p.id);
        const midias = await midiasIG(p.id, 25);
        const recentes = midias.filter((m) => Date.now() - new Date(m.timestamp) < 30 * DIA);
        for (const m of recentes.slice(0, 12)) m.insights = await insightsMidia(p.id, m.id);
        const soma = (k) => recentes.reduce((s, m) => s + (Number(m.insights?.[k]) || 0), 0);
        r.instagram = {
          ...conta, conta_insights: await insightsConta(p.id),
          views_30d: soma('views'), alcance_30d: soma('reach'), interacoes_30d: soma('total_interactions'),
          posts_30d: recentes.length,
          midias: midias.map((m) => ({...m, da_agencia: nossos.has(m.id)})),
        };
        // comentários dos posts dos últimos 14 dias
        for (const m of midias.filter((m) => m.comments_count > 0 && Date.now() - new Date(m.timestamp) < 14 * DIA)) {
          for (const c of await comentariosMidia(p.id, m.id)) {
            if (coms.some((x) => x.id === c.id)) continue;
            const respondido = (c.replies?.data ?? []).some((x) => x.username === conta.username);
            coms.push({id: c.id, perfil: p.id, rede: 'instagram', midia: m.id, link: m.permalink, post: (m.caption ?? '').split('\n')[0].slice(0, 80),
              autor: c.username, texto: c.text, quando: c.timestamp, status: respondido ? 'respondido' : 'novo', rascunho: '', resposta: ''});
          }
        }
        out.historico.push({data: out.atualizado.slice(0, 10), perfil: p.id, rede: 'instagram', seguidores: conta.followers_count});
      } catch (e) {
        out.erros.push(`${p.nome} (Instagram): ${e.message}`);
      }
    }
    if (p.youtube) {
      try { r.youtube = await canalYouTube(p.youtube); } catch (e) { out.erros.push(`${p.nome} (YouTube): ${e.message}`); }
      if (r.youtube?.inscritos != null) out.historico.push({data: out.atualizado.slice(0, 10), perfil: p.id, rede: 'youtube', seguidores: r.youtube.inscritos});
    }
    out.perfis[p.id] = r;
  }
  try { out.telegram = await membrosTelegram(); } catch (e) { out.erros.push(e.message); }
  if (out.telegram != null) out.historico.push({data: out.atualizado.slice(0, 10), perfil: 'grupo', rede: 'telegram', seguidores: out.telegram});
  // um ponto por dia/perfil/rede no histórico (o último do dia vale)
  const visto = new Map();
  for (const h of out.historico) visto.set(`${h.data}|${h.perfil}|${h.rede}`, h);
  out.historico = [...visto.values()].slice(-2000);
  gravar(F_ANA, out);
  gravar(F_COM, coms.slice(-3000));
  const novos = coms.filter((c) => c.status === 'novo').length;
  if (novos) await tarefaComentarios(novos);
  log('sincronizar', `ok${out.erros.length ? ` (${out.erros.length} aviso(s): ${out.erros.join(' | ')})` : ''}`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) await sincronizar({forcar: process.argv.includes('--forcar')});
