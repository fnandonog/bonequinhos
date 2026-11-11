// Teste do robô comentário → direct com uma Meta de mentira. Uso: node --test plataforma/test/direct.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {rodar, pedeConteudo, textoEntrega, regras} from '../lib/direct.mjs';

const T0 = Date.parse('2026-11-11T12:00:00Z');
const cfg = {ligado: true, exigir_seguir: true, perfis: {cozinha: {ligado: true, palavra: 'RECEITA', palavras: ['receita', 'quero'], isca: 'a receita completa',
  conteudo_padrao: 'Receitas: {link}', entrega: '{conteudo}\nCanal: {grupo}'}}};
const creds = () => ({ig: 'IG1', page: 'PG1', pageToken: 'tok'});

function metaFalsa() {
  const m = {seguidores: new Set(), msgs: [], enviados: [], respostas: [], comentarios: [
    {id: 'c1', text: 'Receita!', username: 'ana', timestamp: '2026-11-11T11:00:00Z'},
    {id: 'c2', text: 'quero saber se dá pra trocar o óleo', username: 'bia', timestamp: '2026-11-11T11:00:00Z'},
    {id: 'c3', text: 'RECEITA', username: 'ze.nacozinha', timestamp: '2026-11-11T11:00:00Z'},
  ]};
  m.http = async (url, op = {}) => {
    const u = new URL(url), p = u.pathname.replace(/^\/v[\d.]+\//, '');
    if (op.json) {
      if (p.endsWith('/replies')) { m.respostas.push(p); return {id: 'r'}; }
      if (p === 'PG1/messages') { m.enviados.push(op.json); return {recipient_id: op.json.recipient.comment_id ? 'U_' + op.json.recipient.comment_id : op.json.recipient.id}; }
    }
    if (p === 'IG1/media') return {data: [{id: 'M1', caption: 'Bolo de cenoura fofinho', timestamp: '2026-11-11T10:00:00Z', comments_count: m.comentarios.length}]};
    if (p === 'M1/comments') return {data: m.comentarios};
    if (p === 'PG1/conversations') return {data: [{participants: {data: [{id: 'U_c1', username: 'ana'}, {id: 'IG1'}]}, messages: {data: m.msgs}}]};
    if (p === 'U_c1') return {is_user_follow_business: m.seguidores.has('U_c1')};
    throw new Error('rota não simulada: ' + p);
  };
  return m;
}

test('a palavra tem que ser o comentário inteiro', () => {
  const ws = regras('cozinha', cfg).palavras;
  assert.ok(pedeConteudo('Receita!!', ws));
  assert.ok(pedeConteudo('RECEITA receita 😍', ws));
  assert.ok(pedeConteudo('quero', ws));
  assert.ok(!pedeConteudo('quero saber se dá pra trocar', ws));
});

test('comentário → botão → segue → conteúdo, repetindo até seguir', async () => {
  const arquivo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'direct-')), 'estado.json');
  const m = metaFalsa();
  let agora = T0;
  const roda = () => rodar({perfil: 'cozinha', http: m.http, agora: () => agora, credenciaisDe: creds, cfg, arquivo, registrar: () => {}});

  // 1ª rodada: só "Receita!" da ana é respondido (a pergunta e o nosso próprio comentário não)
  let r = await roda();
  assert.equal(r.respondidos, 1);
  assert.equal(m.respostas.length, 1);
  assert.equal(m.enviados[0].recipient.comment_id, 'c1');
  assert.match(m.enviados[0].message.text, /Segue o @ze\.nacozinha/);
  assert.equal(m.enviados[0].message.quick_replies[0].title, 'Liberar');

  // nada novo: não responde de novo nem relê o post
  agora += 60000;
  r = await roda();
  assert.equal(r.respondidos, 0);
  assert.equal(m.enviados.length, 1);

  // tocou em Liberar sem seguir: pede para seguir de novo, com o botão
  agora += 60000;
  m.msgs.push({message: 'Liberar', from: {id: 'U_c1', username: 'ana'}, created_time: new Date(agora - 1000).toISOString()});
  r = await roda();
  assert.equal(r.lembretes, 1);
  assert.match(m.enviados.at(-1).message.text, /Quase lá/);
  assert.equal(m.enviados.at(-1).message.quick_replies[0].title, 'Liberar');

  // a mesma mensagem antiga não conta como toque novo
  agora += 60000;
  r = await roda();
  assert.equal(r.lembretes + r.entregues, 0);

  // seguiu e tocou de novo: recebe o conteúdo
  agora += 60000;
  m.seguidores.add('U_c1');
  m.msgs.push({message: 'Liberar', from: {id: 'U_c1', username: 'ana'}, created_time: new Date(agora - 1000).toISOString()});
  r = await roda();
  assert.equal(r.entregues, 1);
  assert.match(m.enviados.at(-1).message.text, /Prontinho/);
  assert.match(m.enviados.at(-1).message.text, /t\.me\/receitasprecinho/);
  const st = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  assert.equal(st.pedidos.c1.estado, 'enviado');
  assert.equal(st.pedidos.c1.lembretes, 1);
});

test('rodada seca não manda nada nem grava, mesmo desligado', async () => {
  const arquivo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'direct-')), 'estado.json');
  const m = metaFalsa();
  const r = await rodar({perfil: 'cozinha', seco: true, http: m.http, agora: () => T0, credenciaisDe: creds, cfg: {...cfg, ligado: false}, arquivo});
  assert.equal(r.respondidos, 1);
  assert.equal(m.enviados.length + m.respostas.length, 0);
  assert.ok(!fs.existsSync(arquivo));
});

test('a entrega usa o texto do vídeo e o canal do perfil', () => {
  const p = {nome: 'Zé na Cozinha', link_bio: 'https://precinhodeouro.com.br/receitas', grupo: {url: 'https://t.me/receitasprecinho'}};
  const t = textoEntrega(p, regras('cozinha', cfg), {entrega: '🥕 Bolo: 3 cenouras, 4 ovos...'});
  assert.equal(t, '🥕 Bolo: 3 cenouras, 4 ovos...\nCanal: https://t.me/receitasprecinho');
  assert.match(textoEntrega(p, regras('cozinha', cfg), null), /^Receitas: https:\/\/precinhodeouro/);
});
