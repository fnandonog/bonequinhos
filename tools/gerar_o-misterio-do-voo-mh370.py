"""Gera roteiros/o-misterio-do-voo-mh370.json (formato Caso Explicado, motor src/caso).
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
(O "|" sai do texto antes de ir para a narração.)
Card de topo: data + lugar de cada cena (campos "quando" e "onde")."""
import json

def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c

ID = "o-misterio-do-voo-mh370"
DIA = "08/03/2014"
VERM = "#ff5d5d"
OURO = "#ffd23f"
AZUL = "#6fd3ff"
# (id, quando, onde, texto com |, planos[(set, cam, p, card)])
CENAS = [
    ("c1", DIA, "MAR DO SUL DA CHINA",
     "Um avião com duzentas e trinta e nove pessoas | some do radar, mas dá sinal | por quase sete horas. | E nunca é achado.", [
        ("voo", "lado", [0, 0.3], card("Pessoas a bordo", num=239, sub="voo MH370")),
        ("radar", "tela", [0.3, 1], None),
        ("satelite", "geral", None, card("Sinal pro satélite", valor="QUASE 7 HORAS", cor=AZUL)),
        ("mapa", "oceano", [1, 1], None),
    ]),
    ("c2", DIA, "KUALA LUMPUR",
     "Março de dois mil e catorze. | O voo MH370 sai da Malásia rumo a Pequim, | à meia-noite e quarenta e dois.", [
        ("aeroporto", "pista", [0, 0.35], None),
        ("mapa", "asia", [0, 0.03], card("Voo MH370", valor="KUALA LUMPUR", sub="Malásia → Pequim (China)")),
        ("aeroporto", "decola", [0.35, 0.75], card("Decolagem", valor="00:42", sub="Boeing 777, à noite", cor=OURO)),
    ]),
    ("c3", DIA, "MAR DO SUL DA CHINA",
     "À uma e dezenove, | a cabine diz: boa noite. | Minutos depois, o transponder, | que mostra o avião no radar, desliga.", [
        ("cockpit", "painel", None, card("Última fala", valor="01:19", cor=OURO)),
        ("cockpit", "janela", None, card("A frase", valor="\u201cBOA NOITE\u201d", sub="good night, Malaysian 370")),
        ("manche", "transponder", [0.2, 0.75], None),
        ("radar", "sala", [0.3, 1], card("Transponder", valor="DESLIGADO", cor=VERM)),
    ]),
    ("c4", DIA, "MALÁSIA",
     "Mas o radar militar viu: | o avião deu meia-volta, | cruzou a Malásia e sumiu no mar. | E a curva foi feita à mão.", [
        ("radarmil", "antena", None, None),
        ("mapa", "volta", [0.1, 0.3], None),
        ("mapa", "andamao", [0.3, 0.55], card("Último ponto no radar", valor="02:22", sub="mar de Andamão", cor=OURO)),
        ("manche", "yoke", None, card("A curva", valor="FEITA À MÃO", sub="relatório oficial, 2018", cor=VERM)),
    ]),
    ("c5", DIA, "OCEANO ÍNDICO",
     "Depois, só um satélite ouviu o avião. | Ele mede distância, não lugar: | um arco, não um ponto. | Último sinal: oito e dezenove.", [
        ("satelite", "sat", None, None),
        ("satelite", "arco", None, card("O satélite mede", valor="SÓ DISTÂNCIA", cor=AZUL)),
        ("mapa", "arcos", [0.55, 0.62], card("Sinais automáticos", num=7, sub="cada um vira um arco")),
        ("mapa", "sul", [0.62, 1], card("Último sinal", valor="08:19", sub="combustível no fim", cor=OURO)),
    ]),
    ("c6", "2014 · 2018 · 2026", "SUL DO OCEANO ÍNDICO",
     "Três buscas varreram | quase duzentos e quarenta mil quilômetros quadrados | de mar. Nada.", [
        ("mapa", "busca", [1, 1.45], None),
        ("busca", "navio", None, card("Fundo do mar varrido", valor="≈ 240 MIL KM²", sub="em 3 buscas")),
        ("fundo", "sonar", None, card("Avião encontrado", valor="NADA", cor=VERM)),
    ]),
    ("c7", "29/07/2015", "ILHA DA REUNIÃO",
     "A surpresa: dezesseis meses depois, | um pedaço da asa aparece na Ilha da Reunião, | a quatro mil quilômetros dali. | Era do MH370.", [
        ("praia", "geral", None, card("Achado na praia", valor="16 MESES DEPOIS", cor=OURO)),
        ("praia", "flaperon", None, card("Pedaço da asa", valor="FLAPERON", sub="o \"flape\" da asa direita")),
        ("mapa", "reuniao", [1.5, 2], card("Longe da busca", num=4000, prefixo="≈ ", sufixo=" km")),
        ("praia", "lupa", None, card("Número de série", valor="ERA DO MH370", sub="confirmado pela França")),
    ]),
    ("c8", "2014 → HOJE", "AS TEORIAS",
     "As teorias: pane, | tripulação desmaiada, o avião fantasma; | sequestro por alguém de fora, a com menos prova; | ou alguém na cabine desviou de propósito: | a com mais indícios, nada provado.", [
        ("quadro", "geral", [0, 0.1], None),
        ("fantasma", "geral", None, card("Teoria 1", valor="AVIÃO FANTASMA", sub="pane e tripulação desmaiada")),
        ("quadro", "t2", [0.3, 0.55], card("Teoria 2 · sequestro", valor="MENOS PROVA", cor=VERM)),
        ("quadro", "t3", [0.55, 0.8], card("Teoria 3 · desvio de propósito", valor="MAIS INDÍCIOS", cor=OURO)),
        ("quadro", "ze", [0.8, 0.99], card("Até hoje", valor="NADA PROVADO", cor=VERM)),
    ]),
    ("c9", "MARÇO DE 2026", "OCEANO ÍNDICO",
     "Em março de dois mil e vinte e seis, | a última busca acabou sem nada. | As famílias pedem pra não desistir.", [
        ("retorno", "volta", None, None),
        ("mapa", "fim", [2, 2], card("Última busca", valor="ENCERRADA", sub="sem achar o avião", cor=VERM)),
        ("vigilia", "velas", None, None),
    ]),
    ("c10", "HOJE", "CASO ABERTO",
     "Duzentas e trinta e nove pessoas, | sete horas de sinal, nenhum avião. | Qual teoria você acha?", [
        ("voo", "lado", [0, 0.3], card("Pessoas a bordo", num=239)),
        ("voo", "some", [0.45, 1], card("Avião", valor="NUNCA ACHADO", cor=VERM)),
        ("quadro", "pergunta", [1, 1], card("E você?", valor="QUAL TEORIA?", sub="1, 2 ou 3? comenta", cor=OURO)),
    ]),
]

DESTAQUES = ["duzentas", "trinta", "nove", "radar", "sete", "horas", "nunca", "mh370", "meia-noite", "boa", "noite", "transponder", "desliga",
             "militar", "meia-volta", "mão", "satélite", "distância", "arco", "ponto", "oito", "dezenove", "três", "quarenta", "nada",
             "surpresa", "dezesseis", "asa", "reunião", "quatro", "fantasma", "sequestro", "propósito", "indícios", "provado",
             "março", "famílias", "nenhum", "teoria"]

rot = {
    "id": ID,
    "serie": "Caso Explicado",
    "perfil": "caso",
    "titulo": "O SUMIÇO DO MH370",
    "linha2": "239 pessoas, nenhum avião",
    "quando": DIA,
    "onde": "MALÁSIA",
    # narração de TESTE (grátis, edge-tts)
    "voz": "pt-BR-FranciscaNeural",
    "velocidade": "+10%",
    # voz da produção (Scheila no ElevenLabs), ajustes iguais aos do casa-50m2
    "elevenlabs": {"voz_id": "cyD08lEy76q03ER1jZ7y", "modelo": "eleven_flash_v2_5",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.15}},
    "fontes": f"roteiros/{ID}.pesquisa.md",
    "monetizacao": {"afiliados": [
        "livro: The Hidden Truth / O Sumiço do MH370 (livros sobre o caso)", "documentário: MH370: O Avião Que Desapareceu (Netflix)",
        "lupa de leitura com luz", "quadro de cortiça + alfinetes (mural de investigação)", "jogo de tabuleiro de investigação",
    ]},
    "cenas": [],
}
for cid, quando, onde, texto, planos in CENAS:
    partes = [p.strip() for p in texto.split("|")]
    idx, n = [], 0
    for parte in partes:
        idx.append(n)
        n += len(parte.split())
    assert len(idx) == len(planos), (cid, len(idx), len(planos))
    c = {"id": cid, "texto": " ".join(partes), "quando": quando, "onde": onde, "destaques": DESTAQUES, "planos": []}
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

json.dump(rot, open(f"roteiros/{ID}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
chars = sum(len(c["texto"]) for c in rot["cenas"])
print("cenas", len(rot["cenas"]), "planos", sum(len(c["planos"]) for c in rot["cenas"]), "caracteres", chars)
