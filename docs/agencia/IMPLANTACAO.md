# Implantação da agência (skill agencia-marketing-completa)

- [x] Fase 0. Descoberta: `docs/agencia/PERFIL.md`
- [x] Fase 1. Estrutura: serviço `plataforma/` (Express + SQLite no Mac) e `CLAUDE.md`
- [ ] ⏳ esperando o dono: Fase 2. Skills de terceiros e os 282 agentes do agency-agents. O `tools/skills/instalar-tudo.sh` da skill baixa e roda código de vários repositórios de terceiros, então fica para o Fernando rodar no Terminal quando quiser. As skills pessoais do Mac (`~/.claude/skills`) já funcionam, porque a agência roda o `claude` com o usuário dele.
- [x] Fase 3. Agentes do vídeo: pauteiro, pesquisador, roteirista, diretor-cena, cenografo, editor, qa, legendista e o diretor da rede. Elenco do escritório em `plataforma/escritorio/lib/office/roster.js`.
- [x] Fase 4. Escritório `/admin/escritorio` (pixel art, quadro, caixa Aprovar, conversa, organograma) com a marca do Zé. Sem 2FA: o painel só escuta em 127.0.0.1.
- [x] Fase 5. Produção: `plataforma/agencia.mjs` (pauta → agentes → ElevenLabs 1,3x → render → legenda → escritório e fila).
- [ ] ⏳ esperando o dono: Fase 6. Conexões: token do app fnexus CRM em Configurações e "Conectar contas automaticamente". YouTube e TikTok depois.
- [ ] ⏳ esperando o dono: Fase 7. `claude setup-token` e o token em Configurações; depois 1 vídeo de teste. Produção automática e launchd (`npm run agendar`) só com o OK dele.
- [ ] Fase 8. PR e resumo.
