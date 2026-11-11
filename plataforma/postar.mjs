// POSTADOR: publica os vídeos aprovados quando chega o horário. Roda a cada 10 min pelo launchd.
// Uso: node plataforma/postar.mjs [--agora <id>]
import path from 'node:path';
import {RAIZ, fila, salvarItem, log, env} from './lib/dados.mjs';
import {publicarInstagram, publicarFacebook, credenciais, comentarIG} from './lib/meta.mjs';
import * as DIRECT from './lib/direct.mjs';
import * as YT from './lib/youtube.mjs';
import {batida} from './lib/escritorio.mjs';
import {sincronizar} from './sincronizar.mjs';

const args = process.argv.slice(2);
const so = args.includes('--agora') ? args[args.indexOf('--agora') + 1] : null;

export async function publicar(it) {
  const arquivo = path.join(RAIZ, it.video);
  const res = {...(it.publicacoes ?? {})};
  salvarItem({id: it.id, status: 'publicando'});
  // cada rede conectada recebe o vídeo; uma que já foi não é repetida numa nova tentativa.
  // Uma rede com problema não segura as outras: o que falhar fica para a próxima tentativa.
  const ig = credenciais(it.perfil).ig, yt = YT.conectado(it.perfil);
  const erros = [];
  const rede = async (nome, fn) => { try { res[nome] = await fn(); } catch (e) { erros.push(`${nome}: ${e.message}`); } };
  if (!ig && !yt) erros.push('nenhuma rede conectada para este perfil (Configurações → Meta / Redes → Conectar YouTube)');
  if (ig && !res.instagram) {
    await rede('instagram', () => publicarInstagram(it.perfil, arquivo, it.legenda ?? it.tema));
    // robô do direct ligado no perfil: o primeiro comentário chama a palavra-chave (fixar é no app do Instagram)
    const rd = DIRECT.regras(it.perfil);
    if (res.instagram && rd.ligado) await comentarIG(it.perfil, res.instagram.id, rd.comentario).then(() => (res.instagram.comentario = rd.comentario))
      .catch((e) => log('postar', `${it.id}: primeiro comentário falhou: ${e.message}`));
  }
  if (ig && env().META_POSTAR_FACEBOOK === '1' && !res.facebook) await rede('facebook', () => publicarFacebook(it.perfil, arquivo, it.legenda ?? it.tema));
  if (yt && !res.youtube) {
    const tags = (it.legenda ?? '').match(/#[\p{L}\d_]+/gu)?.map((t) => t.slice(1)) ?? [];
    await rede('youtube', () => YT.enviarShort(it.perfil, arquivo, {titulo: it.titulo_youtube || `${it.tema} #shorts`, descricao: it.legenda ?? it.tema, tags}));
  }
  const links = Object.entries(res).map(([r, x]) => `${r}: ${x.link ?? x.id}`).join(' · ');
  if (!erros.length) {
    log('postar', `${it.id} publicado: ${links}`);
    batida('social-media', 'idle', undefined, it.tarefa, `Publicado: ${it.tema} (${links})`, 'success');
    return salvarItem({id: it.id, status: 'publicado', publicado_em: new Date().toISOString(), publicacoes: res, erro: null});
  }
  const tentativas = (it.tentativas ?? 0) + 1;
  const msg = erros.join(' | ');
  log('postar', `${it.id} falhou (${tentativas}ª): ${msg}${links ? ` (já saiu em ${links})` : ''}`);
  batida('social-media', tentativas >= 3 ? 'error' : 'idle', undefined, it.tarefa, `Falha ao publicar "${it.tema}" (${tentativas}ª tentativa): ${msg}`, 'error');
  // o que já saiu fica salvo; com alguma rede publicada o vídeo conta como publicado, e o erro mostra o que faltou
  const parcial = Object.keys(res).length > 0;
  return salvarItem({id: it.id, status: tentativas >= 3 ? (parcial ? 'publicado' : 'erro') : 'aprovado', tentativas, publicacoes: res, erro: msg,
    ...(parcial && !it.publicado_em ? {publicado_em: new Date().toISOString()} : {})});
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
