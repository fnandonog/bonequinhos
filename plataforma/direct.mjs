// ROBÔ COMENTÁRIO → DIRECT: uma rodada agora (o painel roda sozinho a cada intervalo_min quando ligado).
// Uso: node plataforma/direct.mjs [--perfil cozinha] [--seco]
//   --seco  lê os comentários e mostra o que faria, sem mandar nada (funciona com o robô desligado)
import {rodar, resumo} from './lib/direct.mjs';

const a = process.argv.slice(2);
const perfil = a.includes('--perfil') ? a[a.indexOf('--perfil') + 1] : null;
const r = await rodar({perfil, seco: a.includes('--seco')});
console.log(JSON.stringify(r, null, 2));
if (!a.includes('--seco')) console.log('Hoje:', JSON.stringify(resumo().hoje));
