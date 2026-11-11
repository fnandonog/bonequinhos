// POSTADOR: publica os vídeos aprovados quando chega o horário. Roda a cada 10 min pelo launchd.
// Uso: node plataforma/postar.mjs [--agora <id>]
import path from 'node:path';
import {RAIZ, fila, salvarItem, log, env} from './lib/dados.mjs';
import {publicarInstagram, publicarFacebook, credenciais} from './lib/meta.mjs';
import * as YT from './lib/youtube.mjs';
import {batida} from './lib/escritorio.mjs';
import {sincronizar} from './sincronizar.mjs';

const args = process.argv.slice(2);
const so = args.includes('--agora') ? args[args.indexOf('--agora') + 1] : null;

export async function publicar(it) {
  const arquivo = path.join(RAIZ, it.video);
  const res = {...(it.publicacoes ?? {})};
  salvarItem({id: it.id, status: 'publicando'});
  try {
    // cada rede conectada recebe o vídeo; uma que já foi não é repetida numa nova tentativa
    const ig = credenciais(it.perfil).ig, yt = YT.conectado(it.perfil);
    if (!ig && !yt) throw new Error('nenhuma rede conectada para este perfil (Configurações → Meta / Redes → Conectar YouTube)');
    if (ig && !res.instagram) res.instagram = await publicarInstagram(it.perfil, arquivo, it.legenda ?? it.tema);
    if (ig && env().META_POSTAR_FACEBOOK === '1' && !res.facebook) res.facebook = await publicarFacebook(it.perfil, arquivo, it.legenda ?? it.tema);
    if (yt && !res.youtube) {
      const tags = (it.legenda ?? '').match(/#[\p{L}\d_]+/gu)?.map((t) => t.slice(1)) ?? [];
      res.youtube = await YT.enviarShort(it.perfil, arquivo, {titulo: it.titulo_youtube || `${it.tema} #shorts`, descricao: it.legenda ?? it.tema, tags});
    }
    const links = Object.entries(res).map(([r, x]) => `${r}: ${x.link ?? x.id}`).join(' · ');
    log('postar', `${it.id} publicado: ${links}`);
    batida('social-media', 'idle', undefined, it.tarefa, `Publicado: ${it.tema} (${links})`, 'success');
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
  // métricas e comentários de hora em hora (o sincronizador pula se a última leitura tem menos de 55 min)
  if (!so) await sincronizar().catch((e) => log('postar', `sincronizar: ${e.message}`));
}
