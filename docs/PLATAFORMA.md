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

## Ligar
```bash
npm run agendar          # instala painel + produção diária 02:00 + postador (launchd)
open http://localhost:4321
```
Outros comandos: `npm run painel`, `npm run agencia` (produz agora), `npm run agencia:seco` (só mostra o que faria),
`node plataforma/agencia.mjs --perfil construiu --tema "Sobrado de 100 m²"`, `npm run desagendar`.

## Conectar a Meta (app fnexus CRM)
1. No Graph API Explorer, escolha o app fnexus CRM e gere um token de usuário com `instagram_basic`, `instagram_content_publish`,
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`. Troque por um token de longa duração (60 dias).
2. Painel → Configurações → cole o token → **Conectar contas automaticamente**. Cada Instagram precisa ser conta profissional
   ligada a uma Página do Facebook; a plataforma casa o @ da página com o @ de cada perfil e guarda os IDs/tokens no `.env`.

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
- TikTok e YouTube: por enquanto baixe o mp4 pelo painel e poste à mão (YouTube precisa de OAuth próprio; TikTok vai pela extensão).
