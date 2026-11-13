"""Gera roteiros/ela-usou-7-identidades-falsas-e-viveu-as.json
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
(O "|" sai do texto antes de ir para a narração.)

PERFIL: Caso Explicado — Zé com chapéu fedora marrom e sobretudo bege (ZeDetetive).
ESTRUTURA: gancho → entrada → golpe → virada → teorias → captura → desfecho + pergunta.
LUZ NARRATIVA: azul-noite (explicação/interior), dourado (drama/virada), dia (cena neutra).
RITMO: corte a cada 1,5–2,5 s; close a cada 3–4 planos; sting na virada (US$ 1,2 M).
PLACAR: id_quadro serve como painel de pistas fixo — 7 fichas de identidade com
         barbante vermelho formando uma teia; aparece no C1 (gancho) e retorna sempre
         que a narração menciona identidades ou teorias.

==============================================================================
SETS NOVOS — cenógrafo precisa criar em src/caso/sets.tsx (prefixo id_)
==============================================================================

id_quadro — QUADRO DE INVESTIGAÇÃO DAS IDENTIDADES (escritório à noite)
  O que aparece:
    • Parede de cortiça grande (3 m × 2 m) com 7 fichas de identidade penduradas
      (cada ficha: retângulo bege com foto-silhueta, nome em caixa, data).
    • Barbante vermelho partindo de cada ficha e convergindo para um mapa
      estilizado EUA + Malásia no centro (pino vermelho em Kuala Lumpur,
      pinos amarelos em Virgínia, Califórnia e Los Angeles).
    • 3 slots de teoria na parte inferior do quadro (amarelo · vermelho · cinza)
      com barra de evidência que se preenche conforme p avança — igual ao
      "Quadro" do MH370, mas as teorias são: "LUXO", "FUGA", "IDENTIDADE".
    • Mesa baixa à esquerda: abajur verde aceso, xícara, pasta de documentos.
    • Paredes: azul-escuro (#141826), teto com vigas, janela à esquerda
      deixando vazar luz fria de rua (lua + poste).
  Câmera e movimento:
    • "geral": orb ligeiramente acima e à frente do quadro — vê o quadro todo
       e o canto da mesa. Camera move suavemente para a esquerda.
    • "close": orb mais perto das fichas, nível das fichas — revela o barbante.
    • "detalhe": orb extremamente próximo de uma ficha específica — vê nome e foto.
    • "espelho": Zé de frente para câmera, quadro ao fundo desfocado — CTA final.
  Zé Detetive: aparece em geral (à direita do quadro, aponta) e espelho (centro).
  Luz: interior azul-noite. Abajur quente (#ffd9a0) é a única fonte quente — cria
       contraste entre o fundo frio e o detalhe quente da mesa.

id_escritorio — SALA DE ESTAR / ESCRITÓRIO (casa high-end na Virgínia, dia)
  O que aparece:
    • Sofá de couro bege, mesa de café com laptop aberto (tela verde/dados),
      dois copos de água, porta-retratos na estante ao fundo.
    • Janela larga à direita: subúrbio americano com árvores e uma calçada.
    • Mesa lateral com documentos de financiamento de carro em destaque
      (papéis brancos, caneta, número "$XX.XXX" visível).
    • Boneco-vítima sentado no sofá (terno claro); ela de pé, animada.
    • Zé Detetive observando do canto esquerdo, braços cruzados.
  Câmera e movimento:
    • "geral": plano americano mostrando sofá + mesa + janela — câmera recua
       levemente revelando o ambiente.
    • "mesa": over-the-shoulder sobre a mesa de café, close nos documentos —
       câmera desce lentamente até os papéis.
  Luz: dia natural (luz pela janela como fonte principal), warm fill lateral.
       Nenhuma sombra dura — aparência de "negócio legítimo".

id_concessio — CONCESSIONÁRIA PORSCHE (McLean, VA — showroom de luxo)
  O que aparece:
    • Piso espelhado cinza-claro. Dois Porsches esportivos low-poly (um vermelho,
      um preto) e uma Ferrari laranja à esquerda, iluminados por spots de teto.
    • Balcão de vendedor ao fundo com banner da Porsche (escudo dourado).
    • Janelão frontal transparente com rua de subúrbio ao fundo (árvores, céu).
    • Plaquinhas de preço em cada carro (números visíveis mas não legíveis).
    • Zé Detetive ao lado do Porsche vermelho, chapéu, apontando para o carro.
  Câmera e movimento:
    • "geral": plano aberto mostrando 3+ carros e o balcão ao fundo — câmera
       desloca lateralmente da esquerda para a direita revelando a fileira.
    • "close": câmera baixa, perto do capô do Porsche — Zé visível ao lado,
       câmera sobe lentamente pelo capô até o teto do carro.
  Luz: luz de showroom (branca fria, spots overhead). Carros brilhando.
       Fundo quente (rua lá fora) cria profundidade.

id_apartamento — APARTAMENTO EM LOS ANGELES (busca do FBI, 2017)
  O que aparece:
    • Sala moderna: sofá cinza, estante com objetos, janela com palm trees de LA.
    • Porta da entrada: boneco FBI (terno escuro, crachá amarelo, braço
      estendido segurando "MANDADO") na soleira.
    • Mesa ao centro: 4–5 carteiras espalhadas, destaque para uma carteira de
      motorista iluminada por uma lanterna (carteira de "Cindy Lin" — nome em
      destaque, foto-silhueta).
    • Gavetas abertas com documentos saindo. Mala aberta no chão com pastas.
    • Zé Detetive ao fundo direito, observando com lupa erguida.
  Câmera e movimento:
    • "geral": plano aberto desde a porta — agente FBI em primeiro plano,
       sala ao fundo — câmera recua lentamente para revelar a bagunça.
    • "close": sobre a mesa, lanterna iluminando a carteira de Cindy Lin —
       câmera desce até ficar nível da carteira, foco total no nome.
  Luz: dia (Los Angeles, janela lateral, luz suave). Spot de lanterna do FBI
       cria um círculo de luz quente sobre a carteira na mesa.

id_delegacia — TRIBUNAL FEDERAL (Alexandria, VA — out/2019)
  O que aparece:
    • Bancada do juiz em madeira escura (alta, imponente), martelo posicionado,
      microfone, copo de água. Placa "UNITED STATES DISTRICT COURT" na frente.
    • Bandeira dos EUA à esquerda da bancada.
    • Tribuna do réu (pulpito baixo com microfone): boneco feminino de pé,
      roupas escuras, de frente para o juiz (costas para câmera — único plano
      de costas permitido neste vídeo).
    • Bancos de público/júri à esquerda com 3–4 bonecos sentados.
    • Zé Detetive sentado na primeira fileira de público, olhando para a câmera.
  Câmera e movimento:
    • "geral": plano americano mostrando bancada + réu + bandeira — câmera
       desloca lentamente para a esquerda, terminando com Zé em primeiro plano.
    • "espelho": Zé de frente para câmera no banco do público, tribunak ao
       fundo — câmera empurra suavemente em direção ao Zé (efeito de CTA).
  Luz: azul-noite interior (spots frios na bancada + fill azul nas paredes).
       Bancada tem spotlight quente isolando o juiz. Tom de conclusão/julgamento.
==============================================================================
"""
import json


def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo,
                     sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c


DESTAQUES = [
    "sete", "vinte", "nomes", "nove", "seis", "nfl", "cingapura", "manicure",
    "carteira", "luxo", "porsches", "ferraris", "tribunal", "lee", "obama",
    "prisão", "malásia", "fbi", "funeral", "governador",
]

# ==============================================================================
# CENAS
# Formato: (id, quando, onde, texto_com_pipes, [(set, cam, p, card), ...])
#   "|" = corte; a palavra seguinte ao "|" dá o apartir do próximo plano.
#   p = [inicio, fim] do progresso da ação NESTE plano (continua entre cortes).
#   Regra: nunca dois planos seguidos com mesmo set + mesma câmera.
# ==============================================================================
CENAS = [

    # =========================================================================
    # C1 — GANCHO (1 plano)
    # 1º FRAME REGRA: câmera já está no quadro de investigação, barbantes
    # vermelhos em destaque, número "7" visível numa ficha antes da 1ª palavra.
    # Zé Detetive aparece à direita, chapéu, olhando para o quadro.
    # Câmera: geral recuando lentamente — revela o ambiente inteiro.
    # Mood: azul-noite (explicação); abajur quente no canto cria contraste.
    # Placar das identidades (vazio) entra no 2º segundo como laço aberto.
    # LUZ: azul-noite. SEM intro com logo — câmera JÁ está no quadro.
    # =========================================================================
    ("c1", "2001–2019", "EUA",
        "Mais de três milhões de dólares. Era o golpe de uma mulher com sete nomes "
        "e ninguém sabia qual era o real.",
        [
            # PLANO 1 — id_quadro / geral
            # Zé Detetive de frente à direita do quadro, aponta para as 7 fichas.
            # Câmera: geral lento recuando → quadro + mesa + abajur no quadro.
            # Card: "7 identidades / 20 ANOS NOS EUA" entra no 2º segundo.
            # Mood: azul-noite íntimo, inquietante. Barbante vermelho visível.
            ("id_quadro", "geral", [0, 1],
             card("7 identidades", valor="20 ANOS NOS EUA", sub="2001–2019")),
        ]
    ),

    # =========================================================================
    # C2 — ENTRADA NOS EUA (2 planos)
    # Plano 1 (close): câmera se aproxima das fichas — foco na ficha "Lee Sau
    #   Hoong" (foto-silhueta, nome, "Kuala Lumpur"). Barbante vermelho saindo
    #   dela. Zé Detetive ao lado, dedo apontando para o nome.
    #   Corte: flash branco de 6 frames na palavra "Ficou" — salto temporal
    #   (Malásia 2001 → Virgínia anos depois).
    # Plano 2 (geral): câmera recua revelando o mapa no centro do quadro;
    #   seta animada da Malásia para os EUA. Zé agora aponta para o mapa.
    #   Card: "Entrada nos EUA / 2001" — o prazo do visto é a tensão aberta.
    # =========================================================================
    ("c2", "2001", "MALÁSIA / EUA",
        "Em 2001, ela veio da Malásia para os EUA com um visto de turista que vencia "
        "em meses. | Ficou vinte anos.",
        [
            # PLANO 1 — id_quadro / close
            # Close nas fichas: câmera desce até nível das fichas e se aproxima
            # da ficha "Lee Sau Hoong". Barbante vermelho saindo em destaque.
            # Zé visível no canto direito, apontando com indicador.
            # Mood: azul-noite, íntimo. Reação visual entra 1–2 frames antes
            # de "Malásia" ser dita (câmera já enquadra o mapa Malásia–EUA).
            ("id_quadro", "close", [0, 0.5],
             card("1ª identidade roubada", valor="LEE SAU HOONG",
                  sub="dona de casa em Kuala Lumpur")),

            # PLANO 2 — id_quadro / geral (câmera DIFERENTE; set é o mesmo → ok)
            # Flash branco de 6 frames na entrada deste plano (salto no tempo).
            # Câmera recua para o geral: mapa EUA + Malásia visível, seta animada.
            # Zé agora aponta para o pino nos EUA — virada de posição.
            # Mood: ainda azul-noite; leve névoa azulada nas bordas do quadro.
            ("id_quadro", "geral", [0.5, 1],
             card("Entrada nos EUA", valor="2001", sub="visto de turista com prazo")),
        ]
    ),

    # =========================================================================
    # C3 — O MÉTODO: ROUBO EM CADEIA + CARROS (2 planos)
    # Plano 1 (escritorio / geral): sala de estar americana, dia. Dois bonecos
    #   no sofá — ela cultivando amizade. Zé observa do canto, braços cruzados.
    #   Câmera recua revelando a janela com subúrbio ao fundo.
    #   Mood: dia normal, aparência de normalidade que esconde a trapiçaria.
    # SET TROCA → CONCESSIONÁRIA (momento "uau" de metade de vídeo):
    # Plano 2 (concessio / geral): showroom Porsche, 9 Porsches + 6 Ferraris
    #   em fila. Zé ao lado de um Porsche vermelho apontando para a fileira.
    #   STING: música para, batida grave, câmera empurra com leve giro.
    #   Card: "9 PORSCHES + 6 FERRARIS" — virada principal do vídeo.
    # =========================================================================
    ("c3", "2012–2016", "VIRGÍNIA / CALIFORNIA",
        "Com cada novo nome, cultivava amizade e roubava os documentos. "
        "Cada vítima abria a porta da seguinte. | "
        "Convencia as vítimas a financiar carros no próprio nome delas, "
        "prometendo pagar as parcelas. As parcelas nunca vieram. A conta ficou "
        "com as vítimas e ela ficou com quinze carros de luxo.",
        [
            # PLANO 1 — id_escritorio / geral
            # Sala high-end, dia. Ela de pé animada, vítima no sofá.
            # Câmera: plano aberto, recua lentamente revelando janela + subúrbio.
            # Zé Detetive observa do canto esquerdo, postura desconfiada.
            # Mood: dia (luz natural pela janela), aparente normalidade.
            ("id_escritorio", "geral", [0, 0.5], None),

            # PLANO 2 — id_concessio / geral   ← SET MUDA (virada de metade)
            # STING aqui: música para + batida grave + câmera empurra com giro.
            # Showroom Porsche: câmera varre lateralmente revelando 9+ carros.
            # Zé ao lado do Porsche vermelho, dedão para cima, cara de espanto.
            # Reação visual do Zé entra 1–2 frames ANTES da palavra "parcelas".
            # Mood: luz de showroom (branca fria), carros brilhantes, impacto.
            ("id_concessio", "geral", [0.4, 1],
             card("Veículos financiados", valor="9 PORSCHES + 6 FERRARIS",
                  sub="as parcelas nunca vieram")),
        ]
    ),

    # =========================================================================
    # C4 — O GRANDE GOLPE: NETA DE LEE KUAN YEW (4 planos)
    # Plano 1 (escritorio / mesa): close sobre mesa de café, documentos de
    #   "investimento" sendo assinados — mão da vítima com caneta.
    # Plano 2 (escritorio / geral): câmera recua para sala inteira; card com
    #   US$ 1,2 M (sting secundário: dado bombástico).
    # Plano 3 (quadro / detalhe): close numa ficha do quadro com foto de Lee
    #   Kuan Yew + tachinha vermelha + "2015" — câmera extremamente próxima.
    #   Luz dourada (drama/queda) vaza pelo abajur no detalhe.
    # Plano 4 (quadro / geral): recua para o quadro todo; Zé aponta para o
    #   barbante que liga o funeral à ficha da mentirosa. Primeira rachadura.
    # =========================================================================
    ("c4", "2014–2015", "VIRGÍNIA",
        "Disse ser neta de Lee Kuan Yew, premier de | "
        "Cingapura. Um jogador de futebol americano entregou um milhão e duzentos "
        "mil dólares para comprar participação num negócio que nunca existiu. | "
        "Em 2015, Lee Kuan Yew morreu. | "
        "O treinador de boxe que a conhecia foi ao funeral ao vivo e não a viu "
        "entre os familiares.",
        [
            # PLANO 1 — id_escritorio / mesa
            # Close sobre mesa de café: documentos de "participação no Wizards",
            # mão assinando. Câmera desce lentamente até nível dos papéis.
            # Mood: dia, foco no detalhe incriminador. Zé fora de quadro.
            # Reação entra 1 frame antes de "Lee Kuan Yew" — câmera ja está
            # estabilizada nos documentos quando o nome é dito.
            ("id_escritorio", "mesa", [0, 0.3], None),

            # PLANO 2 — id_escritorio / geral   ← câmera muda (set igual → ok)
            # Câmera recua para sala inteira: vítima assina, ela sorri confiante.
            # Card: US$ 1,2 M entra exatamente em "entregou" — sting secundário.
            # Mood: ainda dia, mas luz levemente amarelada (drama começando).
            ("id_escritorio", "geral", [0.2, 0.55],
             card("Maior golpe", num=1200000, prefixo="US$ ",
                  sub="participação no Washington Wizards — negócio que nunca existiu")),

            # PLANO 3 — id_quadro / detalhe   ← SET MUDA (volta ao quadro)
            # Câmera mergulha em close extremo numa ficha: nome "Lee Kuan Yew",
            # data "2015", barbante saindo. Luz dourada do abajur vaza na ficha.
            # Mood: dourado (drama/queda) — a lenda começa a rachar.
            # Card: "PREMIER MORREU / março 2015" entra em "morreu".
            ("id_quadro", "detalhe", [0.5, 0.75],
             card("Março 2015", valor="PREMIER MORREU", sub="funeral ao vivo — ela não foi")),

            # PLANO 4 — id_quadro / geral   ← câmera muda (set igual → ok)
            # Câmera recua para o quadro todo: Zé aponta para a ficha + barbante
            # ligando ao "funeral". Primeira suspeita do amigo visível no quadro.
            # Mood: azul-noite, Zé com expressão de "achou".
            # Card: "PRIMEIRA SUSPEITA / UM AMIGO PERCEBEU" em amarelo.
            ("id_quadro", "geral", [0.72, 1],
             card("Primeira suspeita", valor="UM AMIGO PERCEBEU", cor="#ffd23f")),
        ]
    ),

    # =========================================================================
    # C5 — AS TRÊS TEORIAS (3 planos)
    # Plano 1 (concessio / close): close num Porsche, Zé ao lado olhando
    #   para câmera, expressão irônica. Card: "3 TEORIAS".
    # Plano 2 (quadro / detalhe): câmera no quadro, varrendo lateralmente
    #   as 3 barras de evidência (LUXO · FUGA · IDENTIDADE). Mood: análise.
    # Plano 3 (quadro / geral): recua para quadro todo, barra "LUXO" mais
    #   longa que as outras. Card amarelo: "Teoria com mais evidência = LUXO".
    # =========================================================================
    ("c5", "2014–2016", "VIRGÍNIA",
        "Uns dizem que era só luxo, e os Porsches falam por si. | "
        "Outros acham que ela escondia uma condenação por roubo de identidade "
        "que já tinha cumprido na Califórnia. Tem quem diga que ela fugia da "
        "deportação e mentiu sob juramento para ficar no país. | "
        "A evidência aponta para o luxo.",
        [
            # PLANO 1 — id_concessio / close
            # Close num Porsche vermelho, câmera na altura do capô.
            # Zé ao lado, olha para câmera com sobrancelha levantada.
            # Card: "3 teorias / LUXO · FUGA · IDENTIDADE" entra em "Uns dizem".
            # Mood: luz de showroom fria. Tom questionador.
            ("id_concessio", "close", [0, 0.4],
             card("3 teorias", valor="LUXO · FUGA · IDENTIDADE", cor="#ffd23f")),

            # PLANO 2 — id_quadro / detalhe   ← SET MUDA
            # Close nas 3 barras de evidência do quadro. Câmera varre da
            # esquerda (IDENTIDADE) para a direita (LUXO), parando em LUXO.
            # Mood: azul-noite, analítico. Barra de LUXO já levemente maior.
            ("id_quadro", "detalhe", [0.35, 0.7], None),

            # PLANO 3 — id_quadro / geral   ← câmera muda (set igual → ok)
            # Recua para quadro todo: barra LUXO notavelmente mais longa.
            # Zé aponta para a barra LUXO com indicador.
            # Card: "Teoria com mais evidência / LUXO" em amarelo.
            # Mood: azul-noite, revelação suave. Tom didático do Zé.
            ("id_quadro", "geral", [0.65, 1],
             card("Teoria com mais evidência", valor="LUXO",
                  sub="nove Porsches não são acidente", cor="#ffd23f")),
        ]
    ),

    # =========================================================================
    # C6 — A CAPTURA (3 planos)
    # Plano 1 (apartamento / geral): apartamento LA, agente FBI na porta.
    #   Luz de dia californiana (dramática, quente). Zé ao fundo com lupa.
    # Plano 2 (apartamento / close): close na mesa — carteira de Cindy Lin
    #   iluminada pelo spotlight da lanterna do FBI. Zoom no nome.
    # Plano 3 (delegacia / geral): tribunal federal, bancada do juiz, réu
    #   de pé. Card: 51 MESES em vermelho. Tom azul-noite conclusivo.
    # =========================================================================
    ("c6", "2017–2019", "LOS ANGELES / VIRGINIA",
        "Em 2017, a Malásia avisou a polícia federal americana. | "
        "No apartamento dela em Los Angeles acharam a carteira de Cindy Lin, "
        "a manicure de quem ela roubou o nome. | "
        "Em 2019, recebeu cinquenta e um meses de prisão federal.",
        [
            # PLANO 1 — id_apartamento / geral
            # Porta aberta: agente FBI em primeiro plano com crachá visível.
            # Sala ao fundo: gavetas abertas, mala no chão.
            # Câmera recua lentamente revelando a bagunça do apartamento.
            # Mood: luz de dia LA (quente, dramático). Zé ao fundo com lupa.
            # Card: "2017 / FBI BATE NA PORTA" entra em "avisou".
            ("id_apartamento", "geral", [0, 0.4],
             card("2017", valor="FBI BATE NA PORTA", sub="apartamento em Los Angeles")),

            # PLANO 2 — id_apartamento / close   ← câmera muda (set igual → ok)
            # Close sobre mesa: 5 carteiras espalhadas. Lanterna do FBI cria
            # spotlight sobre a carteira de Cindy Lin — câmera desce até
            # nível da carteira. Nome "Cindy Lin" em destaque.
            # Mood: spot quente no frio do apartamento. Foco máximo.
            # Card: "Prova física / CARTEIRA DE OUTRA PESSOA" em vermelho.
            ("id_apartamento", "close", [0.3, 0.6],
             card("Prova física", valor="CARTEIRA DE OUTRA PESSOA", cor="#ff5d5d")),

            # PLANO 3 — id_delegacia / geral   ← SET MUDA
            # Tribunal federal: bancada do juiz em madeira escura + bandeira EUA.
            # Réu de pé na tribuna (único plano de costas do vídeo).
            # Câmera desloca levemente para a esquerda, terminando com
            # Zé na primeira fileira como observador silencioso.
            # Card: "Sentença · out/2019 / 51 meses de prisão federal" em vermelho.
            # Mood: azul-noite (conclusão), spotlight quente na bancada do juiz.
            ("id_delegacia", "geral", [0.55, 1],
             card("Sentença · out/2019", num=51,
                  sub="meses de prisão federal", cor="#ff5d5d")),
        ]
    ),

    # =========================================================================
    # C7 — DESFECHO + LAÇO DE REPLAY (1 plano)
    # Plano final (delegacia / espelho): Zé de frente para câmera, tribunal
    #   ao fundo desfocado. Câmera empurra suavemente em direção ao Zé
    #   (efeito CTA). Ele ergue os ombros — "eu não sei, você decide".
    # LAÇO: última imagem (Zé + tribunal) deve conversar com a 1ª (quadro
    #   de investigação) — o "caso aberto" fecha com a pergunta ao espectador.
    # Card: "Qual teoria? / LUXO · FUGA · IDENTIDADE / comenta aqui" amarelo.
    # Mood: azul-noite (mesma do C1), Zé de frente, pergunta sem resposta.
    # =========================================================================
    ("c7", "HOJE", "CASO ENCERRADO",
        "Foram vinte anos e sete nomes. No tribunal ela tentou o oitavo. "
        "Qual teoria você acha que é real?",
        [
            # PLANO FINAL — id_delegacia / espelho
            # Zé de frente para câmera, primeira fileira do tribunal.
            # Câmera empurra suavemente 10 % em direção ao Zé — sting final.
            # Ele ergue os ombros e abre os braços ("qual teoria você acha?").
            # Card: amarelo, engajamento, 3 opções visíveis.
            # Mood: azul-noite conclusivo. Tom de conversa com o espectador.
            # p=[1,1]: freeze no último frame — laço de replay.
            ("id_delegacia", "espelho", [1, 1],
             card("Qual teoria?", valor="LUXO · FUGA · IDENTIDADE",
                  sub="comenta aqui", cor="#ffd23f")),
        ]
    ),
]

# ==============================================================================
# GERADOR
# ==============================================================================
rot = {
    "id": "ela-usou-7-identidades-falsas-e-viveu-as",
    "serie": "Caso Explicado",
    "perfil": "caso",
    "titulo": "ELA TINHA 7 NOMES",
    "linha2": "20 anos sem ninguém saber quem era",
    "quando": "2001–2019",
    "onde": "EUA",
    "voz": "pt-BR-FranciscaNeural",
    "velocidade": "+10%",
    "elevenlabs": {
        "voz_id": "YNOujSUmHtgN6anjqXPf",
        "modelo": "eleven_multilingual_v2",
        "ajustes": {
            "stability": 0.5,
            "similarity_boost": 0.8,
            "style": 0.25,
            "use_speaker_boost": True,
            "speed": 1.0,
        },
    },
    "fontes": "roteiros/ela-usou-7-identidades-falsas-e-viveu-as.pesquisa.md",
    "monetizacao": {
        "afiliados": [
            "VPN (proteção de identidade digital)",
            "livro de true crime",
            "serviço de monitoramento de CPF/identidade",
        ]
    },
    "cenas": [],
}

for cid, quando, onde, texto, planos in CENAS:
    partes = [p.strip() for p in texto.split("|")]
    idx, n = [], 0
    for parte in partes:
        idx.append(n)
        n += len(parte.split())
    assert len(idx) == len(planos), (cid, len(idx), len(planos))
    c = {
        "id": cid,
        "texto": " ".join(partes),
        "quando": quando,
        "onde": onde,
        "destaques": DESTAQUES,
        "planos": [],
    }
    for (s, cam, p, cd), a in zip(planos, idx):
        pl = {"set": s, "cam": cam}
        if a:
            pl["apartir"] = a
        if p:
            pl["p"] = p
        if cd:
            pl["card"] = cd
        c["planos"].append(pl)
    rot["cenas"].append(c)

json.dump(
    rot,
    open("roteiros/ela-usou-7-identidades-falsas-e-viveu-as.json", "w", encoding="utf-8"),
    ensure_ascii=False,
    indent=1,
)
chars = sum(len(c["texto"]) for c in rot["cenas"])
planos_total = sum(len(c["planos"]) for c in rot["cenas"])
print(
    "cenas", len(rot["cenas"]),
    "planos", planos_total,
    "caracteres", chars,
)
