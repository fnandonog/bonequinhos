// Vozes do ElevenLabs de cada canal (perfis.json → voz_elevenlabs: id, nome, dono e ajustes).
// Guardamos o "dono" (public_owner_id da biblioteca) para que, se a chave da API ou a conta mudar,
// a plataforma adicione a mesma voz na conta nova sozinha, sem desconfigurar nada.
const API = 'https://api.elevenlabs.io';

async function pedir(chave, caminho, opcoes = {}) {
  const r = await fetch(API + caminho, {...opcoes, headers: {'xi-api-key': chave, ...(opcoes.headers || {})}});
  const corpo = await r.json().catch(() => ({}));
  return {ok: r.ok, status: r.status, corpo};
}

// Confirma que a voz existe na conta da chave atual; se não existir, adiciona da biblioteca pública.
export async function garantirVoz(chave, voz) {
  if (!voz?.id) return {ok: false, motivo: 'perfil sem voz'};
  const tem = await pedir(chave, `/v1/voices/${voz.id}`);
  if (tem.ok) return {ok: true, ja: true};
  if (!voz.dono) return {ok: false, motivo: `a voz ${voz.nome || voz.id} não está nesta conta e não tem o dono salvo`};
  const add = await pedir(chave, `/v1/voices/add/${voz.dono}/${voz.id}`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({new_name: voz.nome || voz.id}),
  });
  if (!add.ok) return {ok: false, motivo: `não consegui adicionar ${voz.nome}: ${JSON.stringify(add.corpo).slice(0, 200)}`};
  return {ok: true, adicionada: true};
}

// Para todos os perfis (o painel chama quando a chave do ElevenLabs é trocada em Configurações)
export async function garantirTodas(chave, perfis) {
  const out = {};
  for (const p of perfis) out[p.id] = await garantirVoz(chave, p.voz_elevenlabs);
  return out;
}
