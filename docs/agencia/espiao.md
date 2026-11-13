# Espião de qualidade: rodada 1 (12/11/2026, W46)

Pedido do Fernando: "o nosso tá abaixo… quero algo que prenda as pessoas, algo que elas não veem na internet".
Foco desta rodada: visual 3D (personagem, luz, cor, densidade, câmera, interior das coisas) e roteiro falado (gancho, contexto, ritmo).

Comparados: McDonald's, Robô aspirador, Pompeia, D.B. Cooper, Pão de queijo (quadros a cada 3 s de out/*.mp4 + qa/<id>/folha.jpg),
o laboratório `lab/antes-depois.png` (Zé 2.0) e `node plataforma/cli.mjs analytics`.

---

## O que os números dizem (Instagram, 30 dias)

| Vídeo | Views | Tempo médio assistido | Leitura |
|---|---|---|---|
| Casa 50 m² | 1.591 | **27,7 s** | cenário cheio e reconhecível segura |
| Gladiador | 318 | 23,3 s | idem |
| Rico (Silvio) | 159 | 22,1 s | |
| Air fryer (por dentro) | 1.382 | 21,4 s | o "abrimos pra ver" puxa clique |
| Pão de queijo / liquidificador | 3.171 | 13,1 s | o que mais compartilha (28) e salva (48) |
| Pizza de frigideira | 125 | **8,2 s** | perde a pessoa antes do 1º passo |

Ninguém passa da metade do vídeo. O problema está nos primeiros 3 s (gancho) e na falta de motivo para ficar até o fim (laço aberto).

---

## Ranking das referências

| # | Vídeo | Canal | Números | Por que prende |
|---|---|---|---|---|
| 1 | [How Stitches Work](https://www.youtube.com/shorts/ttuKeS5k4Uo) | Zack D. Films | ~250 mi views, 31 s | 1º quadro já é o resultado em macro (pontos na pele, textura realista). A fala começa na ação ("quando você leva pontos…"). A câmera entra na pele e mostra em corte o que acontece por dentro. Ninguém viu isso antes. |
| 2 | [Nessa cidade TODO MUNDO é Flamengo](https://www.youtube.com/shorts/fWSGuAE5Tro) | Vila dos Bloquinhos | 161 mil/dia, 160 s | Bonequinho (2D, não 3D) com olhos enormes e expressivos, **sempre de frente para a câmera**. Multidão de bonecos iguais vira imagem forte. Legenda embaixo: frase curta com a palavra-chave destacada. Narração de conversa, história com emoção. |
| 3 | [Se você vir ISSO na cachoeira…](https://www.youtube.com/shorts/_lddQpIDV2M) | Renderizado | 103 mil/dia, 16 s | 3D quase fotorrealista: textura de rocha e água, close extremo, **seta vermelha apontando o "ISSO" no 1º quadro**. Uma mão entra em cena e mostra a escala. Promessa visual paga em 15 s. |
| 4 | [Quanto custa construir uma piscina?](https://www.youtube.com/shorts/4nRX7ZJanKo) | Quanto Custa, Zé? | 3 mil/dia, 117 s | **Concorrente direto no nosso estilo low-poly (e usa o nome Zé).** Mantém um recibo fixo na tela que vai se preenchendo: "Escavação 6.000 / Fundo 7.500 / TOTAL R$ ??.???". O total escondido é o motivo para ver até o fim. |
| 5 | [How a Car Engine Works](https://animagraffs.com/how-a-car-engine-works) | Animagraffs | referência de técnica (vídeo longo) | O padrão-ouro de "por dentro": começa numa peça (um pistão), a carcaça fica transparente ou cortada, cada peça tem cor própria e o fluxo (ar, combustível, faísca) é animado. Abre para fora até a máquina inteira. |

Fora do top 5: [Saltou do avião com US$ 200 mil e sumiu](https://www.youtube.com/shorts/W6-4MxL011o) (Aí Aconteceu, 40 s) tem visual no nível do nosso, mas mostra que o mesmo caso cabe em 40 s.

---

## Notas 0–10: nosso × melhor referência

| Quesito | Nosso | Ref. | Onde estamos perdendo |
|---|---|---|---|
| Gancho visual 1–3 s | 5 | 9 (Zack, Renderizado) | 1º quadro é card de título + chip + número em cima de um cenário genérico. O Pão de queijo é o melhor (liquidificador cheio). |
| Gancho falado | 6 | 9 | McDonald's é bom ("fatura 25 bi mas quase não frita hambúrguer"). Robô ("vale a pena?"), Pompeia e D.B. Cooper ("24 de novembro de 1971…") abrem com pergunta morna ou data. |
| Personagem | 4 | 9 (Vila) | Zé facetado, olho de bolinha preta sem brilho, muitas vezes **de costas** ou com a cabeça cortada (Pompeia, McDonald's, D.B. Cooper: a câmera entra na cabeça). O Zé 2.0 do lab daria 8. |
| Luz e cor | 4 | 9 | Só 1 luz hemisférica + 1 direcional, `flatShading`, sem contraluz nem oclusão. Noite vira preto (Pompeia, floresta do Cooper). Paredão de uma cor só (McDonald's 1961: tela inteira bege). |
| Densidade do cenário | 4 | 8 | Fundos vazios, poucos objetos no quadro. Exceção: cozinha do pão de queijo (7). |
| Câmera | 5 | 8 | Move, mas enquadra nuca, chão ou parede; câmera atravessa a cabeça; poucos closes de detalhe. |
| Por dentro das coisas | 3 | 10 (Zack, Animagraffs) | "Por dentro" do robô = 3 planos quase pretos com uma peça cinza. Não dá para ver nada. |
| Texto na tela | 5 | 8 | 3 camadas brigando (chip de capítulo + palavra solta gigante + card de número). A palavra solta ("POR", "UM", "NA") não diz nada sozinha. |
| Ritmo de cortes | 7 | 8 | Corte a cada ~3 s está ok. |
| Laço aberto até o fim | 4 | 8 (Quanto Custa, Zé?) | Não há nada na tela pedindo para ficar até o final. |
| Contexto/ritmo do roteiro | 6 | 8 | Frases carregadas de número (robô: "dois mil pascais… noventa minutos… cinquenta e cinco decibéis" numa respiração). Número que não vira imagem cansa. |

---

## As 5 mudanças de maior impacto

### 1. Colocar o Zé 2.0 e a luz de estúdio do laboratório em produção (cenógrafo)
O `src/lab/visual.tsx` já tem o padrão (veja `lab/antes-depois.png`): `Ambiente` com RoomEnvironment + ACES, `CaixaR` arredondada, `SombraContato`, paleta `PAL`, Zé com olhos com íris e brilho.
- Trocar o rig de `src/cozinha/Receita.tsx`, `src/valeapena/Teste.tsx`, `src/caso/Caso.tsx` (e história/rico) pelo `Ambiente` do lab; tirar `flatShading` dos personagens e objetos principais.
- Somar **contraluz** (luz fria atrás do Zé, intensidade ~0,6 da principal) para separar o personagem do fundo.
- Noite nunca é preto: fundo azul-marinho com luz de lua azulada + uma fonte quente no quadro (tocha, janela, painel). Nenhum plano com média de brilho abaixo de ~15%.
- Fazer primeiro no Zé na Cozinha (o que mais compartilha) e comparar o tempo médio assistido.

### 2. "Por dentro" de verdade: corte e vista explodida (diretor de cena + cenógrafo)
É isso que "as pessoas não veem na internet". Regra para todo plano de mecanismo:
- A carcaça some, fica transparente (opacidade 0,15) ou é fatiada ao meio. **Iluminar por dentro** (luz pontual dentro do objeto).
- No mínimo 3 peças, cada uma com cor própria e saturada, e etiqueta curta presa à peça.
- 1 seta ou partículas de fluxo animadas (ar, sujeira, calor, dinheiro, sangue) mostrando o caminho.
- A câmera **mergulha** do exterior para o corte em um movimento contínuo (como o Zack entrando na pele), depois abre de volta.
- Vale para tudo: robô (sujeira subindo da escova ao reservatório), McDonald's (corte do terreno com o dinheiro do aluguel subindo para a sede), Pompeia (corte do Vesúvio com a câmara de magma, depois corte de uma casa soterrada), D.B. Cooper (corte da fuselagem do 727 com a escada traseira).

### 3. Gancho em 1 segundo: imagem estranha + frase em ação (roteirista + diretor de cena)
- 1º quadro: o objeto ou o resultado em close, já em movimento, com **seta ou círculo** no detalhe estranho. O card de título sai do 1º segundo (entra no 2º, menor).
- 1ª frase: uma afirmação que contraria o senso comum ou uma ação já acontecendo. Nunca data, nunca "vale a pena?".
  - Robô: "Esse robô de trezentos reais aspira sua casa batendo na parede de propósito."
  - D.B. Cooper: "Esse homem saltou de um avião com duzentos mil dólares amarrados no peito. E nunca mais apareceu."
  - Pompeia: "Você tem dezoito horas para sair dessa cidade. E ninguém aqui sabe disso."
- Primeira imagem e última conversam (laço de replay).

### 4. Laço aberto visível o vídeo todo (diretor de cena + editor)
Um placar fixo na tela que se preenche e só fecha no final, como o recibo "TOTAL R$ ??.???":
- Você Construiu: recibo que soma item a item, total escondido.
- Como Ficou Rico: placar de patrimônio que sobe a cada virada, valor final escondido.
- Vale a Pena?: balança de prós e contras que pende; veredito escondido.
- Caso Explicado: quadro de pistas com 3 slots, o último com "?".
- Você na História: relógio regressivo até a tragédia.
- Zé na Cozinha: contador "passo 3 de 7" + cronômetro do tempo total.

### 5. Zé de frente, cenário cheio, texto enxuto (diretor de cena + editor + roteirista)
- Zé com o rosto visível em todo plano em que aparece. De costas só em 1 plano de ponto de vista por vídeo. Câmera nunca atravessa cabeça (o QA reprova).
- Densidade: pelo menos 5 objetos reconhecíveis no quadro, fundo com profundidade (primeiro plano, meio, fundo), nenhum plano com mais de 40% da tela numa cor só.
- Texto: no máximo 2 camadas. Tirar a palavra solta gigante; usar legenda de frase curta embaixo com a palavra-chave destacada (amarelo) + o card de número só quando o número é o assunto.
- Roteiro: uma ideia por frase, no máximo 1 número por frase, e só o número que vira imagem na tela.

---

## Alerta para o Fernando
O canal **"Quanto Custa, Zé?"** (YouTube, @QuantoCustaZé) faz "quanto custa construir" em low-poly 3D, com o nome Zé, e já aparece entre os mais vistos do nicho (piscina 3 mil/dia, kitnet 2 mil/dia), os mesmos temas do Você Construiu. Vale decidir se isso é um risco de confusão de marca.

## Fontes de apoio
- Zack D. Films, números do "How Stitches Work": [UNILAD Tech](https://www.uniladtech.com/social-media/youtube/mind-blowing-way-stitches-work-to-repair-body-852280-20250812), [análise no Substack](https://danielrusnok.substack.com/p/how-a-faceless-channel-engineered)
- Animagraffs: [Hooniverse](https://www.hooniverse.com/heres-a-great-look-at-how-an-engine-works/)
- Shorts do nicho: `plataforma/dados/tendencias.json` (7 dias, gerado em 12/11/2026)
