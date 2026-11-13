"""Gera roteiros/pizza-de-frigideira.json (série Zé na Cozinha) a partir do storyboard abaixo.
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
Números e fontes: roteiros/pizza-de-frigideira.pesquisa.md
Cenários: src/cozinha/pizza.tsx (prefixo pz)."""
import json

def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c

VERM = "#ff5d5d"
VERDE = "#2fbf71"
AMAR = "#ffd23f"
# (id, etapa, chip, texto, planos[(set, cam, p, card)])
CENAS = [
    ("c1", None, None, "Sua pizza de frigideira fica crua no meio? | O erro é colocar o recheio cedo demais. | O segredo é dourar a massa antes.", [
        ("pzPronta", "giro", [0, 1], None),
        ("pzCrua", "alto", [0, 1], card("Recheio na massa crua", valor="CRUA", cor=VERM)),
        ("pzVira", "frente", [0, 1], card("O segredo", valor="DOURAR ANTES", cor=AMAR)),
    ]),
    ("c2", None, None, "É pizza sem forno | e sem esperar a massa crescer. | Fica pronta em uns quinze minutos.", [
        ("pzCozinha", "geral", [0, 1], card("Forno", valor="NÃO PRECISA", cor=VERDE)),
        ("pzBolinhas", "cima", [0, 1], card("Massa", valor="sem descanso")),
        ("pzFogo", "alto", [0, 1], card("Pronta em", num=15, sufixo=" min", sub="as duas pizzas")),
    ]),
    ("c3", "MASSA", "sem descanso", "Numa tigela, uma xícara de farinha de trigo, | uma colher de chá de fermento químico, o de bolo, | e uma pitada de sal.", [
        ("pzFarinha", "close", [0, 1], card("Farinha de trigo", valor="1 xícara", sub="120 g")),
        ("pzFermento", "colher", [0, 1], card("Fermento químico", valor="1 colher de chá", sub="o fermento de bolo")),
        ("pzSal", "close", [0, 1], card("Sal", valor="1 pitada")),
    ]),
    ("c4", "MASSA", "½ copo", "Junta meio copo de iogurte natural | e uma colher de sopa de azeite. | Mistura até desgrudar da mão.", [
        ("pzIogurte", "close", [0, 1], card("Iogurte natural", valor="½ copo", sub="sem açúcar · 100 g")),
        ("pzAzeite", "close", [0, 1], card("Azeite", valor="1 colher de sopa")),
        ("pzMassa", "cima", [0, 1], card("Ponto", valor="desgruda da mão", cor=VERDE)),
    ]),
    ("c5", "ABRIR", "2 discos", "Divide em duas bolinhas | e abre cada uma bem fininha, | do tamanho da frigideira.", [
        ("pzBolinhas", "lado", [0, 1], card("Divida em", num=2, sufixo=" bolinhas")),
        ("pzAbre", "lado", [0, 0.6], card("Abra com o rolo", valor="bem fininha")),
        ("pzAbre", "cima", [0.6, 1], card("Frigideira de", num=24, sufixo=" cm", sub="disco do tamanho dela")),
    ]),
    ("c6", "DOURAR", "fogo médio", "Frigideira antiaderente em fogo médio, sem óleo. | Dois minutos de um lado, | vira e mais dois do outro.", [
        ("pzFogo", "lado", [0, 1], card("Fogo médio", valor="sem óleo")),
        ("pzDisco", "close", [0, 1], card("Primeiro lado", num=2, sufixo=" min")),
        ("pzVira", "lado", [0, 1], card("Vira e mais", num=2, sufixo=" min", cor=VERDE)),
    ]),
    ("c7", None, None, "E aqui quase todo mundo erra: | recheia a massa ainda crua. | O molho pesa, o vapor fica preso | e o meio fica mole.", [
        ("pzErra", "frente", None, None),
        ("pzCrua", "lado", [0, 1], card("Massa crua + recheio", valor="NÃO", cor=VERM)),
        ("pzVapor", "close", [0, 1], card("Vapor preso", valor="encharca", cor=VERM)),
        ("pzMole", "close", [0, 1], card("O meio", valor="MOLE", cor=VERM)),
    ]),
    ("c8", "RECHEAR", "lado dourado", "Agora sim, no lado dourado: | duas colheres de sopa de molho de tomate, | cinquenta gramas de muçarela | e uma pitada de orégano.", [
        ("pzDourado", "cima", [0, 1], card("Lado de cima", valor="já dourado", cor=VERDE)),
        ("pzMolho", "close", [0, 1], card("Molho de tomate", valor="2 colheres", sub="de sopa · pouco molho")),
        ("pzQueijo", "close", [0, 1], card("Muçarela ralada", num=50, sufixo=" g", sub="por pizza")),
        ("pzOregano", "close", [0, 1], card("Orégano", valor="1 pitada")),
    ]),
    ("c9", "TAMPAR", "fogo baixo", "O segundo segredo é a tampa. | Fogo baixo e uns três minutos tampada: | o vapor derrete o queijo | e o fundo não queima.", [
        ("pzTampa", "frente", [0, 1], card("Segredo 2", valor="TAMPAR", cor=AMAR)),
        ("pzTampa", "cima", [1, 1], card("Fogo baixo, tampada", num=3, sufixo=" min")),
        ("pzDerrete", "vidro", [0, 1], None),
        ("pzFundo", "baixo", [0, 1], card("Fundo", valor="crocante", sub="sem queimar", cor=VERDE)),
    ]),
    ("c10", None, None, "Pronto: duas pizzas por uns dez reais. | E na sua, vai o quê: | muçarela ou calabresa?", [
        ("pzMesa", "geral", None, card("Duas pizzas por", num=10, prefixo="≈ R$ ")),
        ("pzFatia", "close", [0, 1], None),
        ("pzDuas", "cima", [0, 1], None),
    ]),
    ("c11", None, None, "Receita completa e utensílios em oferta: link na bio.", [
        ("pzPronta", "final", [1, 1], None),
    ]),
]

rot = {
    "id": "pizza-de-frigideira",
    "serie": "Zé na Cozinha",
    "titulo": "PIZZA DE FRIGIDEIRA",
    "linha2": "sem forno e sem massa crua",
    "site": "link na bio",
    "cta": {"titulo": "LINK NA BIO", "texto": "Receita completa", "botao": "Utensílios em oferta"},
    "elevenlabs": {"voz_id": "fhtZMBwha5du5OxuvexO", "modelo": "eleven_flash_v2_5",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.15}},
    "fontes": "roteiros/pizza-de-frigideira.pesquisa.md",
    "monetizacao": {"afiliados": ["frigideira antiaderente 24 cm com tampa de vidro", "rolo de massa", "espátula de silicone", "tigela de vidro", "ralador de queijo"]},
    "cenas": [],
}
DESTAQUES = ["segredo", "crua", "erro", "erra", "dourar", "dourado", "forno", "minutos", "xícara", "colher", "colheres", "pitada", "copo",
             "gramas", "bolinhas", "fininha", "médio", "baixo", "tampa", "tampada", "mole", "vapor", "queima", "pronto", "reais", "link", "bio", "oferta",
             "uma", "duas", "dois", "três", "quinze", "meio", "cinquenta", "dez"]
for cid, etapa, chip, texto, planos in CENAS:
    partes = [p.strip() for p in texto.split("|")]
    idx, n = [], 0
    for parte in partes:
        idx.append(n)
        n += len(parte.split())
    assert len(idx) == len(planos), (cid, len(idx), len(planos))
    c = {"id": cid, "texto": " ".join(partes)}
    if etapa:
        c["etapa"] = etapa
    if chip:
        c["chip"] = chip
    if cid == "c11":
        c["cta"] = True
    c["destaques"] = DESTAQUES
    c["planos"] = []
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

json.dump(rot, open("roteiros/pizza-de-frigideira.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
chars = sum(len(c["texto"]) for c in rot["cenas"])
print("cenas", len(rot["cenas"]), "planos", sum(len(c["planos"]) for c in rot["cenas"]), "caracteres", chars)
