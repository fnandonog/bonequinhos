"""Gera roteiros/bolo-cenoura.json (série Zé na Cozinha) a partir do storyboard abaixo.
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
Números e fontes: roteiros/bolo-cenoura.pesquisa.md"""
import json

def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c

VERM = "#ff5d5d"
VERDE = "#2fbf71"
# (id, etapa, chip, texto, planos[(set, cam, p, card)])
CENAS = [
    ("c1", None, None, "O bolo de cenoura mais fofinho que existe | tem um segredo: | a farinha nunca entra no liquidificador.", [
        ("boloPronto", "giro", None, None),
        ("fatia", "close", [0, 1], None),
        ("proibido", "frente", [0, 1], card("Farinha no liquidificador", valor="NUNCA", cor=VERM)),
    ]),
    ("c2", "FORNO", "180 °C", "Primeiro, | liga o forno em cento e oitenta graus.", [
        ("cozinha", "geral", [0, 1], None),
        ("botao", "macro", [0, 1], card("Pré-aquecer o forno", num=180, sufixo=" °C")),
    ]),
    ("c3", "CENOURA", "3 médias", "Três cenouras médias, | em rodelas: | uns trezentos e sessenta gramas.", [
        ("ingredientes", "mesa", None, card("Cenoura média", num=3, sufixo=" unidades")),
        ("tabua", "cima", [0, 0.6], None),
        ("tabua", "lado", [0.6, 1], card("Cenoura em rodelas", num=360, sufixo=" g")),
    ]),
    ("c4", "LIQUIDIFICADOR", "5 min", "No liquidificador: a cenoura, | quatro ovos, | uma xícara de óleo | e uma e meia de açúcar. | Bate por cinco minutos.", [
        ("liqCenoura", "cima", [0, 1], None),
        ("liqOvos", "close", [0, 1], card("Ovos", num=4, sufixo=" inteiros")),
        ("liqOleo", "close", [0, 1], card("Óleo", valor="1 xícara", sub="240 ml")),
        ("liqAcucar", "close", [0, 1], card("Açúcar", valor="1 ½ xícara", sub="300 g")),
        ("liqBate", "frente", None, card("Bater até ficar liso", num=5, sufixo=" min")),
    ]),
    ("c5", "SECOS À PARTE", None, "Agora o segredo: | numa tigela, peneira duas xícaras de farinha | e uma colher de sopa de fermento.", [
        ("peneira", "alto", [0, 0.4], None),
        ("peneira", "close", [0.4, 1], card("Farinha de trigo", valor="2 xícaras", sub="280 g · peneirada")),
        ("fermento", "colher", [0, 1], card("Fermento em pó", valor="1 colher de sopa", sub="14 g")),
    ]),
    ("c6", "MISTURAR", "devagar", "Despeja o creme laranja | e mistura no fuê, devagar. | Bater com força deixa o bolo solado.", [
        ("despeja", "lado", [0, 1], None),
        ("fue", "cima", [0, 1], None),
        ("solado", "corte", [0, 1], card("Bateu com força?", valor="SOLADO", cor=VERM)),
    ]),
    ("c7", "FORMA", "22 cm", "Forma redonda de vinte e dois centímetros, | untada e enfarinhada.", [
        ("forma", "cima", None, card("Forma redonda", num=22, sufixo=" cm")),
        ("untar", "close", [0, 1], card("Manteiga + farinha", valor="untar", sub="o bolo desenforma inteiro")),
    ]),
    ("c8", "ASSAR", "45 min", "Massa na forma | e quarenta e cinco minutos no forno. | Não abre a porta nos primeiros trinta, | senão ele murcha.", [
        ("despejaForma", "lado", [0, 1], None),
        ("fornoDentro", "vidro", [0, 1], card("Forno a 180 °C", num=45, sufixo=" min", sub="de 45 a 50 minutos")),
        ("porta", "frente", [0, 1], card("Não abra antes de", num=30, sufixo=" min", cor=VERM)),
        ("murcha", "lado", [0, 1], None),
    ]),
    ("c9", "PONTO", None, "Espetou o palito e saiu limpo? | Tá pronto.", [
        ("palito", "macro", [0, 1], card("Teste do palito", valor="saiu limpo", cor=VERDE)),
        ("desenforma", "giro", None, None),
    ]),
    ("c10", "CALDA", "fogo médio", "A calda: | uma lata de leite condensado, | uma colher de manteiga | e quatro de chocolate em pó. | Mexe até desgrudar da panela.", [
        ("panela", "cima", None, None),
        ("lata", "close", [0, 1], card("Leite condensado", num=395, sufixo=" g", sub="1 lata")),
        ("manteigaPanela", "close", [0, 1], card("Manteiga", valor="1 colher de sopa")),
        ("chocolate", "close", [0, 1], card("Chocolate em pó", valor="4 colheres de sopa")),
        ("mexe", "panela", [0, 1], card("Mexendo sem parar", valor="desgrudou", sub="do fundo da panela", cor=VERDE)),
    ]),
    ("c11", "CALDA", "fogo desligado", "Desliga o fogo | e junta meia caixinha de creme de leite.", [
        ("desliga", "rente", [0, 1], None),
        ("creme", "close", [0, 1], card("Creme de leite", num=100, sufixo=" g", sub="½ caixinha")),
    ]),
    ("c12", "COBRIR", None, "Espera o bolo amornar, | cobre tudo | e joga granulado.", [
        ("amornar", "janela", [0, 1], card("Espere o bolo", valor="AMORNAR", sub="calda em bolo quente afunda a massa", cor="#4fb3ff")),
        ("cobre", "cima", [0, 1], None),
        ("granulado", "close", [0, 1], None),
    ]),
    ("c13", None, None, "Parabéns: você fez o bolo de cenoura | que acaba antes de esfriar.", [
        ("mesa", "geral", None, card("Rende", num=10, sufixo=" fatias")),
        ("boloCortado", "miolo", None, None),
    ]),
    ("c14", None, None, "Tem mais de cento e quarenta receitas assim no Precinho de Ouro. | E cinco por dia, de graça, no Telegram.", [
        ("site", "tela", [0, 1], None),
        ("telegram", "ze", None, None),
    ]),
]

rot = {
    "id": "bolo-cenoura",
    "serie": "Zé na Cozinha",
    "titulo": "BOLO DE CENOURA FOFINHO",
    "linha2": "o segredo que ninguém conta",
    "site": "precinhodeouro.com.br/receitas",
    "elevenlabs": {"voz_id": "fhtZMBwha5du5OxuvexO", "modelo": "eleven_multilingual_v2",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.15}},
    "fontes": "roteiros/bolo-cenoura.pesquisa.md",
    "cenas": [],
}
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
    if cid == "c14":
        c["cta"] = True
    c["destaques"] = ["segredo", "nunca", "graus", "gramas", "minutos", "xícara", "colher", "solado", "murcha", "pronto", "parabéns", "telegram", "precinho", "ouro", "grátis", "trinta", "quarenta", "cinco", "quatro", "três", "duas", "uma", "meia", "vinte", "cento"]
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

json.dump(rot, open("roteiros/bolo-cenoura.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
chars = sum(len(c["texto"]) for c in rot["cenas"])
print("cenas", len(rot["cenas"]), "planos", sum(len(c["planos"]) for c in rot["cenas"]), "caracteres", chars)
