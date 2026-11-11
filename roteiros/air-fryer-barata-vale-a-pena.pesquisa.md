# Pesquisa — Air fryer barata vale a pena? (preços nov/2026, Brasil)

Legenda: [S] número da fonte · [C] calculado com números da fonte · [E] estimativa sem fonte direta (falar "cerca de").
Produto de referência: air fryer de 4 litros e 1.500 W, a faixa mais barata e mais vendida (ex.: Mondial Family AFN-40).

## Manchete
- **Preço:** cerca de **R$ 250** (menor preço R$ 244 à vista; média dos últimos 40 dias ≈ R$ 249,90; Buscapé, nov/2026) [S]. Faixa nas lojas grandes: R$ 219 a R$ 500 conforme versão e voltagem (Buscapé, Extra, Casas Bahia) [S].
- **Veredito no vídeo: VALE, para até 3 pessoas.** Família maior: a de 4 litros fica apertada, melhor ir de 5 litros ou mais [S/E].

## O que promete
- "Fritar sem óleo": 4 litros, 1.500 W, até 200 °C, timer de 60 min com desligamento automático [S, ficha AFN-40-F no Buscapé].
- Medidas: 29,5 × 28,5 × 36,5 cm, 4,5 kg [S].

## Como funciona por dentro (mecanismo para o 3D)
- Não frita: é um forno de convecção pequeno. Resistência em espiral no teto aquece o ar; uma ventoinha logo acima sopra esse ar para baixo, ele bate no fundo da cuba e sobe pelas laterais, passando pelo alimento no cesto furado [S, descrição técnica geral; esquema já usado em src/AirFryer.tsx].
- Termostato: quando chega na temperatura, a resistência desliga e religa; por isso não gasta a potência cheia o tempo todo [C: 1.500 W × 20 min seria 0,5 kWh; medido 0,3 kWh].
- Ponto de atenção: o ar quente não é uniforme e a parte de baixo assa menos; precisa remexer/virar no meio [S, Canaltech].

## A conta
| Item | No vídeo | Base |
|---|---|---|
| Preço da air fryer 4 L | R$ 250 (nov/2026) | Buscapé nov/2026, menor R$ 244, média 40 dias R$ 249,90 [S] |
| Potência | 1.500 W | ficha técnica [S] |
| Consumo medido em 20 min a 200 °C | 0,3 kWh | teste do Canaltech (AFN-40-BF) [S] |
| Tarifa de luz | ≈ R$ 1 por kWh | B1 residencial ≈ R$ 0,85/kWh sem tributos (Aneel, jun/2026) [S] + ICMS/PIS/Cofins ≈ 20–25% [E] → ≈ R$ 1,05 [C] |
| Custo de luz por uso (20 min) | ≈ R$ 0,30 | 0,3 kWh × R$ 1 [C] |
| Óleo de soja 900 ml | R$ 7,32 | média 1º semestre 2026, Deral/Seab-PR [S] |
| Óleo na air fryer | 1 colher de sopa (≈ 15 ml) | uso típico [E] |
| Economia de óleo por fritura | ≈ R$ 2,40 | garrafa de R$ 7,32 reaproveitada 3 vezes [C/E] |
| Volta do dinheiro | ≈ 1 ano | R$ 250 ÷ (R$ 2,40 − R$ 0,30) ≈ 120 usos; 2 por semana ≈ 60 semanas [C/E] |

## Fatos-surpresa (ganchos)
1. Air fryer não frita nada: é um forno pequeno com ventilador [S/C].
2. Num teste de 20 min a 200 °C ela gastou só 0,3 kWh, uns 30 centavos [S/C], porque a resistência liga e desliga.
3. Quase todo mundo erra: lotar o cesto. O ar quente precisa passar entre os pedaços; cesto lotado = batata mole, e tem que remexer no meio [S Canaltech: fundo assa menos, remexer; E: cesto cheio bloqueia o ar].
4. 4 litros servem bem até 3 pessoas (Buscapé); para família grande fica apertada [S].

## Ressalvas (honestidade)
- Fontes divergem sobre "quantas pessoas" (Casas Bahia diz até 4; Buscapé diz no máximo 3). Usamos 3 [S].
- Tarifa varia por estado e bandeira; "cerca de" no texto falado [E].
- A economia depende de quanto óleo a pessoa reaproveitaria; por isso o card fala "≈ 1 ano" [C/E].
- Certificação Inmetro: eletrodomésticos com resistência têm selo de segurança compulsório (Portaria Inmetro 148/2022) [E, conferir]; não entra no vídeo.

## Fontes
- Buscapé, Mondial AFN-40-F (preço nov/2026, histórico 40 dias, ficha técnica): https://www.buscape.com.br/fritadeira/fritadeira-eletrica-sem-oleo-mondial-afn-40-fb-capacidade-4l
- Extra, AFN40BI Family (R$ 259 / R$ 246,05 no Pix): https://www.extra.com.br/fritadeira-eletrica-sem-oleo-air-fryer-mondial-afn40bi-family-inox-4l-preta-inox/p/55032022
- Casas Bahia, AFN-40-BI: https://www.casasbahia.com.br/fritadeira-sem-oleo-mondial-air-fryer-afn-40-bi-4-litros-1500w-preto-inox-220v/p/1521375824
- Canaltech, review Mondial Family AFN-40-BF (0,3 kWh em 20 min a 200 °C; fundo assa menos): https://canaltech.com.br/fritadeiras/analise/review-mondial-family-afn-40-bf-airfryer-de-4l-com-cesto-quadrado/
- Buscapé, melhor air fryer pequena (até 4 L serve até 3 pessoas): https://www.buscape.com.br/fritadeira/conteudo/melhor-air-fryer-pequena
- Aneel, tarifa residencial B1 projetada (R$ 851/MWh sem tributos): https://cenarioenergia.com.br/2026/06/12/aneel-eleva-projecao-de-reajuste-tarifario-medio-para-86-em-2026/
- Deral/Seab-PR via Agrolink, óleo de soja 900 ml R$ 7,32 (1º sem 2026): https://www.agrolink.com.br/noticias/consumidor-paga-menos-pelo-oleo-de-soja-no-parana_516319.html
- Comparativos air fryer × forno elétrico (consumo menor em porções pequenas): https://www.buscape.com.br/fritadeira/conteudo/air-fryer-consome-muita-energia
