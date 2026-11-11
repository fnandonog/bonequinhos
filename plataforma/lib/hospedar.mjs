// Hospeda o mp4 por alguns minutos na VPS (https://zeexplica.com.br/v/<nome-aleatório>.mp4) para a Meta baixar.
// O upload direto (rupload) da API do Instagram responde "ProcessingFailedError"; com video_url funciona.
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {env} from './dados.mjs';

const run = promisify(execFile);
const cfg = () => {
  const e = env();
  return {ip: e.VPS_IP || '179.198.102.160', chave: e.VPS_SSH_KEY || path.join(os.homedir(), '.ssh/convertaja_vps'), base: e.SITE_URL || 'https://zeexplica.com.br'};
};
const ssh = (c) => ['-i', c.chave, '-o', 'IdentitiesOnly=yes', '-o', 'BatchMode=yes'];

export async function hospedar(arquivo) {
  const c = cfg();
  const nome = `${crypto.randomBytes(12).toString('hex')}.mp4`;
  await run('ssh', [...ssh(c), `root@${c.ip}`, 'mkdir -p /opt/edge/sites/zeexplica/v'], {timeout: 60000});
  await run('rsync', ['-a', '-e', `ssh ${ssh(c).join(' ')}`, arquivo, `root@${c.ip}:/opt/edge/sites/zeexplica/v/${nome}`], {timeout: 15 * 60000});
  return {url: `${c.base}/v/${nome}`, nome};
}

export async function remover(nome) {
  if (!/^[a-f0-9]{24}\.mp4$/.test(nome)) return;
  const c = cfg();
  await run('ssh', [...ssh(c), `root@${c.ip}`, `rm -f /opt/edge/sites/zeexplica/v/${nome}`], {timeout: 60000}).catch(() => {});
}
