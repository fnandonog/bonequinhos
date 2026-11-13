# Regras de todos os agentes da agência do Zé

## Como reportar ao escritório
O Fernando acompanha você ao vivo em http://localhost:4380/admin/escritorio (você é um bonequinho numa mesa).
O executor já define OFFICE_AGENT_ID, BASE_URL e o token. Comando: `node plataforma/escritorio/tools/office.mjs`.

1. **Início:** `office.mjs me` (suas tarefas, mensagens do dono, se pode rodar). Se aparecer "NÃO RODAR", pare.
   Mensagem do dono sem resposta = prioridade máxima: leia com `office.mjs comments N` e responda com `office.mjs comment N "texto"`.
2. **Batimento** a cada etapa: `office.mjs heartbeat --status working --task "o que está fazendo" [--task-id N]`.
3. **Tarefas:** `task create --title … [--assignee agente] [--ref chave-unica]`, `task update N --status doing`.
4. **Entregas:** `attach N --kind texto --label … --file docs/agencia/<você>/arquivo.md` ou `--kind link --url …`.
5. **Pedir aprovação:** `office.mjs review N "o que o dono precisa decidir"`.
6. **Problema:** `heartbeat --status blocked` (falta algo do dono) ou `--status error` + `log "o que falhou" --level error`.
7. **Fim:** `heartbeat --status idle "resumo em uma linha"` e responda com o resumo final.

Dados da plataforma (sem rede, sem segredos): `node plataforma/cli.mjs resumo | analytics | fila | pautas | comentarios`.

## Regras que valem sempre
- **Nada sai sem aprovação.** Ninguém posta, responde comentário, manda mensagem, gasta dinheiro, liga a produção automática
  ou publica site por conta própria. Você prepara; quem aprova é o Fernando (ou o Gerente Geral, dentro dos limites do escritório).
- Não use `curl`, `ssh`, `git push`, `rm`, `launchctl` nem nada fora das ferramentas liberadas. Precisa de algo? Crie tarefa para o dono.
- Nunca leia, copie ou imprima o `.env`. Nunca troque a voz do ElevenLabs.
- Texto para o público: português do Brasil, tom de conversa, sem travessão e sem cara de IA; passe pelo skill **ig-human**.
- Crimes e mistérios: só casos reais e documentados, respeito às vítimas. Afiliado: honestidade antes da venda.
- Seja econômico: cada rodada custa uso do Claude. Faça o que a rodada pede e pare.
- Arquivos de trabalho em `docs/agencia/<seu-id>/`.
- **Roteiro detalhado e 3D bem feito vendem** (Fernando, 11/11/2026, ao rejeitar o Silvio Santos). Cada passo do roteiro explica o mecanismo com números, nada de pular etapas; cada plano tem cenário específico e reconhecível em escala real (padrão casa-50m2/gladiador), nunca o Zé num cenário genérico.

## Os 6 perfis
Zé na Cozinha (receitas), Você na História, Você Construiu (quanto custa construir), Caso Explicado (crimes e mistérios),
Seu Tostão (histórias do dinheiro), Vale a Pena? (produtos, afiliado). Config em `plataforma/perfis.json`; guia de cada formato em `docs/formatos/`.
Funil: vídeo viral → perfil → link na bio (página de links, `plataforma/links.json`) → grupo de ofertas → venda como afiliado.
