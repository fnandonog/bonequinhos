# Bonequinhos: rede de perfis do Zé

Shorts/Reels pt-BR com o Zé (bonequinho 3D low-poly) explicando como as coisas funcionam. Responda sempre em português do Brasil.

- Vídeos: Remotion (`src/`), linha de produção com agentes em `docs/PIPELINE.md` (`/video`, `/produzir`), guias por perfil em `docs/formatos/`.
- Plataforma: `docs/PLATAFORMA.md` (painel http://localhost:4380, escritório em /admin/escritorio, agência, postagem na Meta).
- Agência: `docs/agencia/PERFIL.md` e `docs/agencia/IMPLANTACAO.md`.
- Nunca troque a voz por conta própria (voz do Fernando no ElevenLabs). Nunca publique, ligue a produção automática ou instale o launchd sem o Fernando pedir.
- Segredos só no `.env` (nunca no git). A porta 4321 é do projeto Afiliado: não use.
- Agentes reportam ao escritório com `node plataforma/escritorio/tools/office.mjs` (OFFICE_AGENT_TOKEN do .env, OFFICE_AGENT_ID=<agente>).
