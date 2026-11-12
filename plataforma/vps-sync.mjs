// SINCRONIA MAC → VPS: a postagem roda na VPS (infra/vps/postador.sh), então o Mac pode estar fechado no horário.
// A cada 5 min (launchd com.bonequinhos.postar): manda para a VPS os vídeos aprovados, as chaves de postagem
// atualizadas e o status da fila; traz de volta o que a VPS já publicou; depois atualiza as métricas aqui.
// Uso: node plataforma/vps-sync.mjs
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {RAIZ, fila, salvarItem, log, env} from './lib/dados.mjs';
import {sincronizar} from './sincronizar.mjs';

const E = env();
const IP = E.VPS_IP || '179.198.102.160';
const CHAVE = E.VPS_SSH_KEY || path.join(os.homedir(), '.ssh/convertaja_vps');
const DIR = '/opt/zeposter';
const SSH = ['-i', CHAVE, '-o', 'IdentitiesOnly=yes', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=20'];
const ssh = (cmd, input) => execFileSync('ssh', [...SSH, `root@${IP}`, cmd], {input, maxBuffer: 64 << 20, timeout: 5 * 60000}).toString();
const rsync = (de, para) => execFileSync('rsync', ['-a', '-e', `ssh ${SSH.join(' ')}`, de, `root@${IP}:${para}`], {timeout: 20 * 60000});

// só o que a postagem usa vai para a VPS (sem ElevenLabs, Claude, senha do painel etc.)
const CHAVES_POSTAGEM = /^(META_(?!APP_SECRET)[A-Z_]+|YT_[A-Z]+_(REFRESH|CANAL)|YOUTUBE_(CLIENT_ID|CLIENT_SECRET|PRIVACIDADE)|OFFICE_AGENT_TOKEN|SITE_URL)$/;

try {
  const envVps = Object.entries(E).filter(([k]) => CHAVES_POSTAGEM.test(k)).map(([k, v]) => `${k}=${v}`);
  envVps.push('HOSPEDAR_DIR=/opt/edge/sites/zeexplica/v', 'POSTAR_SEM_SINCRONIZAR=1');
  ssh(`umask 077 && cat > ${DIR}/.env.novo && mv ${DIR}/.env.novo ${DIR}/.env`, envVps.join('\n') + '\n');

  const f = fila();
  const prontos = f.filter((x) => x.status === 'aprovado' && x.video && fs.existsSync(path.join(RAIZ, x.video)));
  for (const x of prontos) rsync(path.join(RAIZ, x.video), `${DIR}/${x.video}`);
  const campos = ['id', 'perfil', 'tema', 'titulo', 'legenda', 'titulo_youtube', 'video', 'capa', 'status', 'agendado_para', 'publicacoes', 'tentativas', 'entrega', 'tarefa'];
  const itens = prontos.map((x) => Object.fromEntries(campos.filter((k) => k in x).map((k) => [k, x[k]])));
  const estados = Object.fromEntries(f.map((x) => [x.id, x.status]));
  const daVps = JSON.parse(ssh(`cd ${DIR} && docker exec -i zeposter node plataforma/vps/receber.mjs`, JSON.stringify({itens, estados})));

  // o que a VPS publicou (ou tentou) volta para a fila do Mac, que é a que o painel mostra
  const aqui = Object.fromEntries(fila().map((x) => [x.id, x]));
  for (const v of daVps) {
    const m = aqui[v.id];
    if (!m || !['publicando', 'publicado', 'aprovado'].includes(v.status)) continue;
    const novas = Object.keys(v.publicacoes ?? {}).filter((r) => !m.publicacoes?.[r]);
    const mudou = novas.length || (v.status !== m.status && m.status === 'aprovado') || (v.erro ?? null) !== (m.erro ?? null);
    if (!mudou) continue;
    salvarItem({id: v.id, status: v.status === 'publicando' ? 'aprovado' : v.status, publicacoes: {...m.publicacoes, ...v.publicacoes},
      publicado_em: v.publicado_em ?? m.publicado_em, erro: v.erro ?? null, tentativas: v.tentativas});
    if (novas.length) log('postar', `${v.id} publicado pela VPS: ${novas.map((r) => `${r}: ${v.publicacoes[r].link ?? v.publicacoes[r].id}`).join(' · ')}`);
  }
} catch (e) {
  log('postar', `sincronia com a VPS falhou: ${e.message.split('\n')[0]}`);
}
await sincronizar().catch((e) => log('postar', `sincronizar: ${e.message}`));
