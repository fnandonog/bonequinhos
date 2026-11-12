# Formato "Seu Tostão: a história do dinheiro que ninguém te contou" (perfil id `rico`)

Substitui o antigo "Como Ficou Rico" (decisão do Fernando em 12/11/2026). O id interno continua `rico`
para não quebrar tokens, agenda e painel; nome, bio e @ mudam nas redes.

## A ideia
Histórias reais e pouco conhecidas do dinheiro: fortunas, falências, golpes famosos, planos econômicos,
quanto as coisas custavam e por que custam o que custam. Quem conta é um **personagem fixo**. O
diferencial do canal é a personalidade dele e as piadas que se repetem, nunca só o visual. Isso também
protege contra a regra do YouTube que tira a monetização de canais de IA "feitos em série".

## O personagem (bíblia)
- **Seu Tostão**, 78 anos, caixa de banco aposentado. Trabalhou 40 anos no balcão e viu o cruzeiro,
  o cruzado, a URV e o real nascerem. Ranzinza, desconfiado de banco digital, guarda nota velha no colchão.
- Fala em 1ª pessoa, como quem conta causo na varanda: "Eu tava no balcão quando...", "No meu tempo...".
- Missão declarada: "Eu conto a história do dinheiro do jeito que ela foi, não do jeito que te venderam."
- **Juros**, o papagaio dele. Interrompe com o número mais chocante do vídeo ("Juros!", "Mil por cento!").
  É a piada recorrente e o gancho visual.
- Bordões (usar 1 ou 2 por vídeo, nunca todos):
  - Abertura: "Senta aí, que essa ninguém te contou."
  - Quando aparece um preço antigo: "E o povo achava caro!"
  - Fecho: "Guarda esse tostão. Amanhã eu conto outra."
- Nunca dá dica de investimento nem promete enriquecimento. Ele conta história e tira a lição em uma frase.

## Estrutura de um vídeo (Short de 50 a 80 s)
1. **Gancho (0 a 3 s):** o número ou o fato absurdo. Exemplo: "Em 1990 o governo pegou o dinheiro da sua poupança. Todo."
2. **Abertura do Seu Tostão** com o bordão e o contexto em uma frase.
3. **Os degraus da história**, com data, valor e mecanismo, como no "Você Construiu". Juros interrompe no pior número.
4. **Virada:** o detalhe que quase ninguém sabe.
5. **Lição em uma frase + pergunta para comentário** ("Você ou seus pais perderam dinheiro nessa?").
6. Fecho com o bordão.

## Regras
- Todo número tem fonte (Banco Central, IBGE, jornais da época, livros, Wikipedia só como ponto de partida).
  O pesquisador salva as fontes em `roteiros/<slug>.pesquisa.md`.
- Revisor de roteiro duro, nota mínima 8, como nos outros perfis.
- Valores antigos sempre convertidos para reais de hoje (corrigidos pelo IPCA) e ditos em voz alta.
- Visual: cenários 3D cheios e fiéis à época (agência bancária dos anos 80, fila do Plano Collor, pregão
  da bolsa), contador de dinheiro no topo, Seu Tostão e Juros como guias. Legenda amarela grande.
- Voz: senhor mais velho, grave, calorosa e um pouco rabugenta, em ritmo normal (1.1x). Trocar a voz
  "Elvis" por uma assim no `perfis.json` assim que for escolhida.

## Vídeos longos (onde o AdSense paga de verdade)
Uma vez por semana a plataforma junta 5 a 6 histórias do mesmo tema num vídeo de 8 a 12 min
("5 golpes que enganaram o Brasil inteiro"), com o Seu Tostão costurando os blocos.

## Monetização extra
Comentário "LIVRO" → DM com o livro da história (já configurado em `plataforma/direct.json`), e os links
do Ofertas do Zé · Livros.
