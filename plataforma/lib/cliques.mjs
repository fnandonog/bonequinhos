// Contador de cliques e visitas da página de links (zeexplica.com.br) e das páginas de cada vídeo.
// As páginas são estáticas na VPS; cada visita e cada clique num botão manda um aviso pequeno (sendBeacon) para
// painel.zeexplica.com.br/c, que chega aqui pelo túnel. Guarda só contagens por dia, página e botão: nada da pessoa
// (nem IP). Se o Mac estiver desligado, o aviso se perde e o link funciona igual.
import fs from 'node:fs';
import path from 'node:path';
import {DADOS} from './dados.mjs';

const F = path.join(DADOS, 'cliques.json');
const DIAS = 90;
const ler = () => {
  try { return JSON.parse(fs.readFileSync(F, 'utf8')); } catch { return {}; }
};
// página: /cozinha/bolo-cenoura/ ; botão: tg-receitas, ofertas, produto-2, ver (visita)...
const limpa = (s, max) => String(s ?? '').toLowerCase().replace(/[^a-z0-9/_.-]/g, '').slice(0, max);

export function registrar({p, k}, agora = new Date()) {
  const pagina = limpa(p, 120) || '/';
  const botao = limpa(k, 40);
  if (!botao) return false;
  const d = ler();
  const dia = agora.toISOString().slice(0, 10);
  const chave = `${pagina}|${botao}`;
  d[dia] ??= {};
  if (!(chave in d[dia]) && Object.keys(d[dia]).length >= 2000) return false; // teto contra lixo
  d[dia][chave] = (d[dia][chave] || 0) + 1;
  for (const k of Object.keys(d).sort().slice(0, -DIAS)) delete d[k];
  fs.writeFileSync(F + '.tmp', JSON.stringify(d));
  fs.renameSync(F + '.tmp', F);
  return true;
}

// Resumo dos últimos `dias`: por página (visitas e cliques) e por botão.
export function resumo(dias = 7, agora = new Date()) {
  const d = ler();
  const desde = new Date(agora.getTime() - (dias - 1) * 864e5).toISOString().slice(0, 10);
  const paginas = {};
  const botoes = {};
  for (const [dia, contas] of Object.entries(d)) {
    if (dia < desde) continue;
    for (const [chave, n] of Object.entries(contas)) {
      const [pagina, botao] = chave.split('|');
      const pg = (paginas[pagina] ??= {pagina, visitas: 0, cliques: 0, botoes: {}});
      if (botao === 'ver') pg.visitas += n;
      else (pg.cliques += n), (pg.botoes[botao] = (pg.botoes[botao] || 0) + n), (botoes[botao] = (botoes[botao] || 0) + n);
    }
  }
  return {dias, paginas: Object.values(paginas).sort((a, b) => b.cliques - a.cliques || b.visitas - a.visitas), botoes};
}
