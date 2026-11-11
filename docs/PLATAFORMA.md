# Plataforma e agência do Zé

Tudo roda no Mac, com o Claude Code daqui (que tem as skills e os agentes instalados).

```
pautas/<perfil>.json ──► agencia.mjs (02:00) ──► claude -p "/video" ou "/produzir"  (pesquisador → roteirista → diretor → cenógrafo → editor → QA)
                                  │                 ──► ElevenLabs + acelerar 1,3x ──► remotion render ──► legendista
                                  ▼
                       fila (painel: aprovar / editar legenda / rejeitar)
                                  ▼
                       postar.mjs (a cada 10 min) ──► Instagram Reels (+ Reels da Página, opcional)
```

## O que tem no painel (http://localhost:4380)
- **Visão geral:** seguidores, views, interações, produção e o funil até a monetização (views → visitas → cliques no link → grupo → receita).
- **Fila de vídeos / Agenda:** o que está produzindo, esperando aprovação, agendado e publicado, dia a dia.
- **Redes:** conexão e últimos posts de cada perfil (Instagram, Página do Facebook, YouTube; TikTok depois).
- **Comentários:** chegam de hora em hora; a agente Comunidade deixa o rascunho, você responde com 1 clique.
- **Perfis, Pautas, Página de links** (gera `site/` com uma página geral e uma por perfil) e **Configurações** (tokens no `.env`).
- **Escritório** (/admin/escritorio): os agentes em pixel art, quadro de tarefas, caixa Aprovar, conversa com o time, organograma.

## Os agentes que trabalham sozinhos (escritório)
`plataforma/escritorio/tools/agencia.json` (começa com `"enabled": false`): Gerente Geral, Diretor, Chefe do Estúdio, Ger. Redes,
Ger. Crescimento, Comunidade, Analista, Afiliados, Postador e Pauteiro, cada um no seu horário. Regras em `docs/agencia/REGRAS.md`.
Testar: `node plataforma/escritorio/tools/tick.mjs --dry-run` e `node plataforma/escritorio/tools/run.mjs <agente> --dry-run`.
Ligar (só com o OK do Fernando): `"enabled": true` e `node plataforma/escritorio/tools/launchd.mjs install`.

## Ligar
```bash
npm run agendar          # instala painel + produção diária 02:00 + postador (launchd)
open http://localhost:4380
```
Outros comandos: `npm run painel`, `npm run agencia` (produz agora), `npm run agencia:seco` (só mostra o que faria),
`node plataforma/agencia.mjs --perfil construiu --tema "Sobrado de 100 m²"`, `npm run desagendar`.

## Conectar a Meta (app fnexus CRM)
1. No Graph API Explorer, escolha o app fnexus CRM e gere um token de usuário com `instagram_basic`, `instagram_content_publish`,
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`. Troque por um token de longa duração (60 dias).
2. Painel → Configurações → cole o token → **Conectar contas automaticamente**. Cada Instagram precisa ser conta profissional
   ligada a uma Página do Facebook; a plataforma casa o @ da página com o @ de cada perfil e guarda os IDs/tokens no `.env`.
3. Para o **robô comentário → direct**, o token também precisa de `instagram_manage_comments`, `instagram_manage_messages`,
   `pages_manage_metadata` e `pages_messaging`, o app precisa do caso de uso Mensagens do Instagram (fora do modo
   desenvolvimento, com análise do app) e cada Instagram precisa de Configurações → Mensagens → Ferramentas conectadas →
   Permitir acesso às mensagens.

## Robô comentário → direct
Quem comenta a palavra do perfil (RECEITA, PLANILHA, LINK...) recebe o direct com o botão "Liberar"; o conteúdo só sai
para quem segue o perfil (o robô confere a cada toque e pede de novo até seguir). Liga no painel → Comentários (geral e por
perfil; começa desligado). O postador deixa o primeiro comentário chamando a palavra (fixar é no app). O que é entregue:
o "Conteúdo do direct" do vídeo na fila ou o padrão do perfil (`plataforma/direct.json`). Teste sem enviar:
`node plataforma/direct.mjs --seco`. Detalhes e armadilhas: skill `.claude/skills/comentario-direct/SKILL.md`.

## Onde ficam as coisas
| O quê | Onde | Vai pro GitHub? |
|---|---|---|
| Perfis (nome, @, horário, CTA, ligado/desligado) | `plataforma/perfis.json` | sim |
| Pautas | `plataforma/pautas/<perfil>.json` | sim |
| Guia de cada formato | `docs/formatos/<formato>.md` | sim |
| Fila, logs | `plataforma/dados/` | não |
| Tokens e chaves | `.env` | **nunca** |
| Vídeos prontos | `out/<id>.mp4` | não |

## Regras
- Por padrão nada é publicado sem aprovação no painel (`AUTO_PUBLICAR=0`). Com `1`, o vídeo vai para o horário do perfil.
- A agência produz só perfis com o botão ligado. Os formatos novos (história, caso, rico, vale a pena) ficam desligados até o piloto ser aprovado.
- O Claude roda com uma lista fechada de ferramentas (sem git push, sem rm, sem curl). A plataforma faz commit local de cada vídeo, sem push.
- YouTube: Configurações → cliente OAuth do Google (redirecionamento http://localhost:4380/youtube/callback) e Redes → Conectar YouTube em cada perfil. O postador manda o Short junto com o Reels. Sem a auditoria da API do Google, os vídeos ficam privados.
- TikTok: por enquanto baixe o mp4 pelo painel ou use a extensão de postagem.
