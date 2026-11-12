# Pedido de análise do app FNexus CRM (Meta App Review)

**Objetivo:** liberar o **acesso avançado** de `instagram_manage_messages`, para o robô comentário → direct atender qualquer
pessoa. Hoje a permissão está em acesso padrão e só funciona para quem tem papel no app.

## Onde fazer e acompanhar
- Enviar: developers.facebook.com → FNexus CRM → **Revisão do app → Solicitações de permissões e recursos**
  (ou Casos de uso → Gerenciar mensagens e conteúdo no Instagram → Permissões e recursos → `instagram_manage_messages` →
  **Solicitar acesso avançado**).
- Acompanhar: o mesmo menu **Revisão do app → Solicitações** mostra o status (Em análise / Aprovado / Precisa de alterações).
  A Meta também avisa na **Caixa de Entrada de alertas** do app e por e-mail. Costuma levar de 2 a 7 dias úteis.
- Antes de enviar, a Meta pede: **verificação da empresa** (Configurações do app → Básico, portfólio da Fnexus), ícone do
  app, URL da política de privacidade e da exclusão de dados (pode ser zeexplica.com.br/privacidade, se existir) e categoria.

## Texto para "Como o app usa esta permissão" (colar em inglês)
> Our app manages the Instagram professional accounts of our own content brand (six profiles that publish educational
> short videos). When a person comments a keyword on one of our posts (for example "RECEITA"), the app sends that person
> one private reply through the Instagram Messaging API with the content they asked for (a full recipe, a cost spreadsheet,
> a book link). The person can tap a quick reply button ("Liberar") to receive the content; we only answer messages that
> the person started by commenting or replying, inside the 24-hour messaging window. instagram_manage_messages is needed
> to send the private reply, read the conversation to see the quick reply tap, and answer it. We never send unsolicited
> messages, never message people who did not comment, and do not store message content beyond the comment id and
> delivery status.

## Roteiro do screencast (1 a 2 minutos, gravar a tela do Mac + espelhamento do iPhone)
1. Mostrar o painel (localhost:4380 → Comentários) com o robô ligado no perfil, a palavra e a mensagem de entrega.
2. Com uma conta de teste no celular, comentar a palavra num Reels do perfil.
3. Mostrar o direct chegando com o botão "Liberar" e a resposta pública "Te mandei no direct!".
4. Tocar em "Liberar" sem seguir → mensagem "Quase lá, segue e toca de novo".
5. Seguir o perfil, tocar de novo → chega o conteúdo.
6. Mostrar no painel o pedido como "entregue".

Os mesmos passos valem para `instagram_manage_comments` (já usada para ler e responder comentários), se a Meta pedir
as duas juntas.
