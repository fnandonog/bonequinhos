// Roda NA VPS (postador de lá). Recebe do Mac, pela entrada padrão, os vídeos aprovados e o status de cada item,
// junta na fila daqui e devolve a fila da VPS para o Mac copiar o que já foi publicado.
// O que a VPS já começou a publicar (publicando/publicado) não é sobrescrito pelo Mac.
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ, fila, salvarItem} from '../lib/dados.mjs';

const entrada = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
// "publicando" parado há mais de 40 min é postagem que caiu no meio (contêiner reiniciou): volta para a fila
for (const x of fila()) if (x.status === 'publicando' && Date.now() - new Date(x.atualizado) > 40 * 60000) salvarItem({id: x.id, status: 'aprovado'});
const daqui = Object.fromEntries(fila().map((x) => [x.id, x]));
const travado = (x) => x && ['publicando', 'publicado'].includes(x.status);

for (const it of entrada.itens ?? []) {
  if (travado(daqui[it.id])) continue;
  // as redes já publicadas somam (o Mac pode ter postado alguma pelo botão do painel)
  salvarItem({...it, publicacoes: {...(daqui[it.id]?.publicacoes ?? {}), ...(it.publicacoes ?? {})}});
}
// item que saiu da agenda no Mac (rejeitado, voltou para aprovação, publicado pelo Mac) deixa de ser postado aqui
for (const [id, status] of Object.entries(entrada.estados ?? {})) {
  const x = daqui[id];
  if (x && x.status === 'aprovado' && status !== 'aprovado') salvarItem({id, status});
}
// vídeo publicado há mais de 2 dias sai do disco da VPS
const limite = Date.now() - 2 * 86400000;
for (const x of fila()) {
  if (x.status !== 'publicado' || !x.video || new Date(x.publicado_em || x.atualizado) > limite) continue;
  fs.rmSync(path.join(RAIZ, x.video), {force: true});
}
process.stdout.write(JSON.stringify(fila()));
