---
name: comentario-direct
description: Robô "comenta a palavra e recebe no direct" do Instagram, com o conteúdo liberado só para quem segue o perfil. Nasceu no Precinho de Ouro e roda na Agência do Zé. Use para ligar, configurar, depurar ou levar o robô para outro projeto/perfil ("comentário vira DM", "comenta QUERO", "liberar link só pra quem segue", "private reply", "ManyChat caseiro").
---

# Robô comentário → direct (Instagram)

Fluxo que já funciona em produção no Precinho de Ouro e foi portado para a Agência do Zé:

1. O post publicado ganha um **primeiro comentário nosso** chamando a palavra ("💬 Comenta RECEITA que o Zé te manda no direct 👇").
   A API **não fixa** comentário: fixar é à mão, no app do Instagram.
2. Quem comenta **só** a palavra (o comentário inteiro, ex.: "Receita!", "eu quero 😍") recebe:
   - resposta pública no comentário ("Te mandei no direct! 📩");
   - **uma** resposta privada no direct (`recipient: {comment_id}`) com o botão **Liberar** e o pedido para seguir.
   A Meta só deixa a empresa mandar 1 mensagem para quem só comentou; o botão faz a pessoa responder e abre a janela de 24 h.
3. Quando a pessoa toca em **Liberar** (ou escreve qualquer coisa), o robô confere `is_user_follow_business`:
   - segue → manda o conteúdo (receita, link, planilha...);
   - não segue → "Quase lá! segue e toca de novo", com o botão outra vez, quantas vezes precisar nos 7 dias do comentário;
   - a Meta não respondeu a checagem → manda o conteúdo (erro da Meta não segura ninguém).

## Onde está o código
| Projeto | Arquivo | Observação |
|---|---|---|
| Agência do Zé (este repo) | `plataforma/lib/direct.mjs` (motor), `plataforma/direct.json` (config por perfil), `plataforma/direct.mjs` (CLI), teste `plataforma/test/direct.test.mjs` | JSON em vez de SQLite, vários perfis, conteúdo por vídeo (`entrega` na fila) |
| Precinho de Ouro | `~/Projetos/em-busca-do-afiliado-automatico/server/dm.js` (+ `test/dm.test.js`) | original: oferta do post, página de captura `/r/<código>`, Facebook e respostas de story |

Rodar: `node plataforma/direct.mjs --seco` (lê e mostra o que faria, sem mandar; funciona desligado) · `node --test plataforma/test/direct.test.mjs`.
Painel: aba **Comentários** → cartão "Robô comentário → direct" (ligar geral, ligar por perfil, palavra, mensagens, Testar).
No vídeo da fila: campo "Conteúdo do direct" (vira `{conteudo}` na mensagem de entrega).

## Regras que custaram bug (não mude sem motivo)
- **Botão = quick reply, nunca postback/template.** O toque num postback só chega por webhook e não aparece na conversa
  que o robô lê por consulta: o link nunca saía (Precinho, 24/10/2026). Quick reply vira mensagem "Liberar" na conversa.
  Se a Meta recusar o quick reply, cai para texto ("responde RECEITA aqui").
- **Não existe botão "Seguir" na API de mensagens.** A mensagem leva o @ e o link `instagram.com/<perfil>`; o seguir é
  conferido a cada toque com `GET /{IGSID}?fields=is_user_follow_business` (token da Página).
- **Uma resposta privada por comentário**, só para comentários de até 7 dias. Guardar o `comment_id` respondido.
- **Toque novo só depois da última mensagem respondida** (`atualizado` empurrado para depois da última mensagem da pessoa
  + 5 s), senão o mesmo "Liberar" antigo gera lembrete a cada rodada.
- **Ler comentários só dos posts cuja `comments_count` mudou**: ler 15 posts por minuto estourou o limite do app
  ("Application request limit reached", 27/10/2026).
- **"Please reduce the amount of data"**: repetir a chamada com metade do `limit` (até 3).
- **Conversas vazias** = o perfil não ligou "Permitir acesso às mensagens" no app do Instagram. Avisar o dono; com
  "exigir seguir" desligado, mandar o conteúdo já na resposta privada.
- Erro repetido: registrar no máximo 1 vez por hora.
- Sem webhook: tudo por consulta (o painel do Zé só existe no Mac). Com servidor público, dá para trocar por webhook
  (`comments` + `messages`), mas a lógica de seguir/botão continua igual.

## Chamadas da Graph API (token da Página ligada ao Instagram)
```
GET  /{ig-id}/media?fields=id,caption,timestamp,comments_count&limit=15
GET  /{media-id}/comments?fields=id,text,username,timestamp&limit=50
POST /{comment-id}/replies            {message}                                   # resposta pública
POST /{page-id}/messages              {recipient:{comment_id}, message:{text, quick_replies:[{content_type:'text',title:'Liberar',payload:'LIBERAR'}]}}
GET  /{page-id}/conversations?platform=instagram&fields=participants,messages.limit(10){message,from,created_time}
GET  /{igsid}?fields=is_user_follow_business
POST /{page-id}/messages              {recipient:{id: igsid}, messaging_type:'RESPONSE', message:{text}}
POST /{media-id}/comments             {message}                                   # primeiro comentário nosso
```

## Permissões e ligações (checklist do dono)
- Token com `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`, `pages_show_list`,
  `pages_read_engagement`, `pages_manage_metadata`, `pages_messaging` (+ as de publicação).
- App da Meta com o caso de uso **Mensagens do Instagram**. Em modo desenvolvimento só responde contas com papel no app;
  para o público, **análise do app** (App Review) de `instagram_manage_messages` e `instagram_manage_comments`
  (o Precinho fez com um screencast do fluxo comentário → direct).
- Em cada Instagram: Configurações → Mensagens e respostas aos stories → Ferramentas conectadas → **Permitir acesso às mensagens**.

## Levar para outro projeto
1. Copie `plataforma/lib/direct.mjs` e troque três coisas: de onde vêm os perfis/credenciais (`todosPerfis`, `credenciais`),
   onde guarda o estado (`F_ESTADO`) e o que é entregue (`textoEntrega` / `itemDoPost`).
2. Rode a CLI `--seco` antes de ligar e mantenha o teste com a Meta de mentira.
3. Para virar skill pessoal (todos os projetos): `cp -R .claude/skills/comentario-direct ~/.claude/skills/`.

Regras da casa: robô começa **desligado**; só o dono liga (painel ou `plataforma/direct.json`). Nunca mande direct de teste
para contas reais sem o dono pedir.
