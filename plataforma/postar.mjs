// POSTADOR: publica os vídeos aprovados quando chega o horário. Roda a cada 10 min pelo launchd.
// Uso: node plataforma/postar.mjs [--agora <id>]
import path from 'node:path';
import {RAIZ, fila, salvarItem, log, env} from './lib/dados.mjs';
import {publicarInstagram, publicarFacebook} from './lib/meta.mjs';
import {batida} from './lib/escritorio.mjs';

const args = process.argv.slice(2);
const so = args.includes('--agora') ? args[args.indexOf('--agora') + 1] : null;

export async function publicar(it) {
  const arquivo = path.join(RAIZ, it.video);
  const res = {...(it.publicacoes ?? {})};
  salvarItem({id: it.id, status: 'publicando'});
  try {
    if (!res.instagram) res.instagram = await publicarInstagram(it.perfil, arquivo, it.legenda ?? it.tema);
    if (env().META_POSTAR_FACEBOOK === '1' && !res.facebook) res.facebook = await publicarFacebook(it.perfil, arquivo, it.legenda ?? it.tema);
    log('postar', `${it.id} publicado: ${res.instagram?.link ?? res.instagram?.id}`);
    batida('social-media', 'idle', undefined, it.tarefa, `Publicado no Instagram: ${it.tema}${res.instagram?.link ? ` (${res.instagram.link})` : ''}`, 'success');
    return salvarItem({id: it.id, status: 'publicado', publicado_em: new Date().toISOString(), publicacoes: res, erro: null});
  } catch (e) {
    const tentativas = (it.tentativas ?? 0) + 1;
    log('postar', `${it.id} falhou (${tentativas}ª): ${e.message}`);
    batida('social-media', tentativas >= 3 ? 'error' : 'idle', undefined, it.tarefa, `Falha ao publicar "${it.tema}" (${tentativas}ª tentativa): ${e.message}`, 'error');
    return salvarItem({id: it.id, status: tentativas >= 3 ? 'erro' : 'aprovado', tentativas, publicacoes: res, erro: e.message});
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const agora = new Date();
  const prontos = fila().filter((x) =>
    so ? x.id === so : x.status === 'aprovado' && (!x.agendado_para || new Date(x.agendado_para) <= agora),
  );
  for (const it of prontos) await publicar(it);
}
