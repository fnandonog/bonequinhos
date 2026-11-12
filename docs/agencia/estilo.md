# Estilo dos vídeos que estão viralizando (o "como", não o tema)

Mantido pelo Caçador de tendências. Diretor de cena, cenógrafo e editor aplicam isto em todo vídeo novo.
Última atualização: 2026-W46 (12/11/2026).

---

## Padrão consolidado (aplica a todos os perfis)

- **Duração:** 45–65 s para explicação; acima de 90 s só se for tutorial passo a passo com gancho visual forte.
- **Corte:** a cada 1,5–2,5 s; nunca dois planos com ângulo/distância parecidos seguidos.
- **Gancho no primeiro frame:** o resultado final ou o número grande já visível antes da primeira palavra falada.
- **Legenda:** palavra a palavra, fonte grande (mínimo 60 pt equivalente), centro-alto da tela, números em amarelo ou laranja, resto em branco com sombra escura.
- **Câmera:** sempre em movimento — aproxima ou gira; close no detalhe a cada 3–4 planos.
- **Momento uau no meio** (virada, número surpreendente, comparação): muda de cenário junto.
- **Final em loop:** última imagem conversa com a primeira; frase que empurra de volta ao começo.
- **Sem intro com logo** — começa direto na ação ou na pergunta.

---

## Barra de qualidade do espião (regra desde 12/11/2026, ver `docs/agencia/espiao.md`)

Referências: Zack D. Films, Vila dos Bloquinhos, Renderizado, Animagraffs, "Quanto Custa, Zé?".

**Visual 3D (cenógrafo e diretor de cena)**
- Padrão do laboratório (`src/lab/visual.tsx`, `lab/antes-depois.png`): Zé 2.0 com olhos com íris e brilho, formas arredondadas, `Ambiente` (luz de estúdio + ACES), `SombraContato`, paleta `PAL`. Nada de `flatShading` em personagem ou objeto principal.
- Contraluz fria atrás do Zé em todo plano, para separar do fundo.
- Noite nunca é preto: azul-marinho + lua azulada + uma fonte quente no quadro. Nenhum plano com brilho médio abaixo de ~15%.
- Densidade: pelo menos 5 objetos reconhecíveis por quadro, com primeiro plano, meio e fundo. Nenhum plano com mais de 40% da tela numa cor só.
- Zé sempre com o rosto visível. De costas só em 1 plano de ponto de vista por vídeo. Câmera nunca atravessa cabeça nem objeto.

**Por dentro das coisas (a marca do perfil)**
- Carcaça some, fica transparente (~0,15) ou é cortada ao meio; luz pontual dentro do objeto.
- No mínimo 3 peças com cor própria e etiqueta presa à peça.
- Seta ou partículas animadas mostrando o fluxo (ar, sujeira, calor, dinheiro).
- A câmera mergulha de fora para o corte num movimento contínuo e depois abre de volta.

**Gancho e laço**
- 1º quadro: o objeto ou o resultado em close, já em movimento, com seta ou círculo no detalhe estranho. Card de título só a partir do 2º segundo.
- 1ª frase: afirmação que contraria o senso comum ou ação em curso. Nunca data, nunca "vale a pena?".
- Placar fixo na tela que se preenche e só fecha no fim: recibo (Construiu), patrimônio (Rico), balança prós/contras (Vale a Pena), quadro de pistas (Caso), relógio regressivo (História), "passo X de Y" + cronômetro (Cozinha).

**Texto e roteiro**
- No máximo 2 camadas de texto: legenda de frase curta embaixo com a palavra-chave em amarelo + card de número só quando o número é o assunto. Sem palavra solta gigante.
- Uma ideia por frase, no máximo 1 número por frase, e só número que vira imagem.

---

## Achados da semana W46 — o que copiar no nosso 3D

### Zé na Cozinha

| Vídeo | Views/dia | Duração | O que copiar |
|---|---|---|---|
| Pizza rápida (Chefrogerioholanda) | 155 k | 90 s | **1º frame = pizza pronta fumegando** antes de qualquer palavra. Zoom dramático nos ingredientes. Corte a cada 2 s sincronizado com batida da música. Nenhuma legenda de fala — só título em cima. Som: música pop acelerada (BPM ~120). Termina com pizza sendo cortada em câmera lenta. |
| Batata-doce na Airfryer (Tamiris Figueira) | 50 k | 163 s | Único caso em que 163 s funciona: cada corte é um passo do tutorial com número de etapa na tela ("Passo 1", "Passo 2"). Legenda em caixa colorida por passo. Zoom no visor da airfryer revelando o ponto. Música chill lo-fi baixinha embaixo. Finaliza com comparação visual antes/depois em split-screen. |
| Receitas Simples (Claudiana Kaele) | 44 k | 62 s | Canal menor — crescimento puramente orgânico. Sem voz: **só legenda + imagem**. Texto na tela em fonte bold centralizada, branco, 2–3 palavras por vez. Corte sincronizado com clap da música. Fundo cozinha real (não estúdio). |

**Para o nosso 3D (Zé na Cozinha):**
- Resultado no primeiro frame (Zé servindo o prato, não preparando).
- Legenda por etapa em caixinha colorida, não só fala.
- Música percussiva + BPM ~110-120 sincronizado com cortes.
- 60–65 s. Se for tutorial > 3 passos, 90 s com contador de passos.

---

### Você na História

| Vídeo | Views/dia | Duração | O que copiar |
|---|---|---|---|
| TODO MUNDO é FLAMENGO (Vila dos Bloquinhos) | 164 k | 160 s | **Estilo bonequinho 3D = exatamente o nosso.** Cenário reconhecível (cidade real em escala, não genérico). Narração clara PT-BR, ritmo de podcast. Corte de cena a cada 3–4 s. Música épica baixinha que cresce no clímax. Texto na tela só em momentos de número ou dado importante. Final com pergunta implícita que gera comentário. |
| Corrida que revelou Senna (artefato) | 123 k | 28 s | **28 s = retenção quase 100%.** Texto enorme no centro da tela no 1º frame ("1984"). Corte único a cada 3 s. Música tensa em crescendo. Sem legenda de fala — 1 frase-chave por frame. Termina abruptamente, forçando replay. |
| Linn do Futuro (Afton Robotics) | 68 k | 33 s | Cultura pop jovem + animação 2D/3D misturada. Título como pergunta + emoji de caveira = engajamento emocional. Corte rápido de 1–2 s. Termina com "reveal" que gera comentário. |

**Para o nosso 3D (Você na História):**
- Para histórias < 40 s: 1 frase-chave por frame, texto enorme, sem legenda de fala.
- Para histórias > 90 s: narração natural, cenário específico e reconhecível, música épica baixinha.
- Nunca Zé em cenário genérico — sempre local identificável (mapa, bandeira, prédio icônico).
- Final com pergunta implícita ou dado bombástico, não conclusão redonda.

---

### Você Construiu

| Vídeo | Views/dia | Duração | O que copiar |
|---|---|---|---|
| Resultado inesperado (ChaelXT) | 44 k | 23 s | **Título sem revelar o que é** ("Eu não esperava esse resultado 😳"). 23 s = impossível abandonar. Primeiro frame = after. Último frame = before + zoom out. Sem narração, só música de impacto com drop no momento da revelação. Zero texto além do título sobreposto. |
| Cozinha Alvenaria em L (Casa economica) | 44 k | 11 s | **11 s = tiro certeiro.** Transição antes/depois em 1 corte com efeito de "swipe". Zoom dramático no resultado. Emoji + texto curto ("😍 Olha Essa Transformação!") no primeiro frame. Música de "ta-dã". Zero narração. |
| Praia no quintal (Você Conseguiu) | 24 k | 75 s | Ideia impossível que funciona = gancho de surpresa. Plano inicial mostra quintal comum → corte direto para areia. Tutorial com materiais listados na tela em legenda verde. Narração animada com ênfase em cada material. |

**Para o nosso 3D (Você Construiu):**
- Para revelações: título misterioso + resultado no 1º frame + antes no último. 20–30 s.
- Para tutoriais "quanto custa": lista de custos aparece na tela em tempo real conforme Zé fala.
- Para transformações: swipe/transição rápida; drop de música no momento uau.
- Cenário: planta 50m² real com referência de escala (Zé ao lado → escala humana).

---

### Caso Explicado

| Vídeo | Views/dia | Duração | O que copiar |
|---|---|---|---|
| Ela usou 8 nomes falsos (Dark Atlas) | 1 k | 70 s | **Número específico no título** ("8 nomes") = credibilidade imediata. Abertura com silhueta feminina de costas. Narração suspenso/thriller. Corte a cada 2–3 s com detalhe de documento, foto, mapa. Música de suspense com pulso constante. Termina sem resolver ("ninguém sabe quem ela era" = gancho de comentário). |
| Horror Real: Chamada Sobrenatural (KAINAN) | 497 | 99 s | "Real" no título = gancho de credibilidade. Abertura com screenshot de chamada telefônica. Narração em voz baixa, cadência lenta. Corte sincronizado com cada revelação. Música de terror atmosférica. |
| Epidemia da Dança (Sr Patinhas) | 490 | 77 s | Caso histórico bizarro + "mais bizarro da história" = superlativo que força o clique. Abertura com pergunta retórica. Narração didática com um tom de curiosidade, não de susto. Mapa histórico na tela. |

**Para o nosso 3D (Caso Explicado):**
- Número específico no título sempre que possível ("7 vítimas", "3 identidades", "42 dias").
- Abertura: Zé ao lado de um objeto/documento relacionado ao caso, sem revelar o crime.
- Música: pulso constante + crescendo gradual, nunca silêncio.
- Terminar com pergunta sem resposta = engajamento de comentário alto.
- Casos com identidade perdida, fuga ou código = máxima curiosidade.

---

### Como Ficou Rico

| Vídeo | Views/dia | Duração | O que copiar |
|---|---|---|---|
| ISSO na Cachoeira (Renderizado) | 104 k | 16 s | Canal 3D renderizado = **estilo igual ao nosso.** "ISSO" = mistério visual máximo, forçando assistir. 16 s = retenção 100%. Primeiro frame = seta apontando para algo na água. Música de suspense + whoosh no reveal. Zero narração — só texto na tela. |
| Cirilo ficou milionário (Cairo Sillva) | 68 k | 68 s | Nostalgia (Carrossel) + surpresa. Abertura com cena da novela. Narração entusiasmada. Corte de timeline mostrando trajetória. Texto na tela em cada marco (ano + patrimônio). Música motivacional crescente. |
| Feitiço pra pobre ficar rico (Flávia Bilachi) | 11 k | 8 s | **8 s = humor absurdo.** Ironia total. Legenda enorme + reação visual cômica. Sem narração. Corte único. Música de comédia. Gera compartilhamento por identificação. |

**Para o nosso 3D (Como Ficou Rico):**
- Para vídeos de curiosidade: "ISSO" ou "ISSO aqui" com seta/destaque no 1º frame. 15–20 s.
- Para histórias de trajetória: timeline visual com marcos de patrimônio na tela. 60–90 s.
- Para humor: Zé com expressão exagerada + legenda enorme. 8–15 s, sem narração.
- Canal Renderizado é referência direta de estilo 3D viral — monitorar semanalmente.

---

### Vale a Pena?

| Vídeo | Views/dia | Duração | O que copiar |
|---|---|---|---|
| Toro usada? (MatheusMV) | 6 k | 31 s | **Pergunta real de decisão de compra** = público engajado e específico. Abertura com preço na tela. Prós e contras em lista visual. Veredicto final em texto grande. Sem rodeio — 31 s direto ao ponto. |
| Cachorro peludo (Sob Outra Luz) | 4 k | 13 s | Nicho ultra-específico + "PRECISA CONHECER" = urgência. Produto demonstrado em uso real (pet na tela). 13 s. Texto de CTA ao final. Sem narração verbal — só visual + legenda. |
| O que inventaram (Sob Outra Luz) | 4 k | 15 s | Curiosidade de gadget. Abertura com produto em uso surpreendente. Zoom no detalhe. 15 s. Música de "descoberta". |

**Para o nosso 3D (Vale a Pena?):**
- Pergunta de decisão real com preço visível no 1º frame.
- Prós/contras em lista animada aparecendo na tela enquanto Zé fala.
- Veredicto final em texto grande + âncora do produto de afiliado.
- 30–40 s. Mais curto = mais compartilhado.
- Nichos específicos (pet, carro, produto de casa) performam melhor que genérico.
