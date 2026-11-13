"""Gera roteiros/pao-de-queijo-de-liquidificador.json (série Zé na Cozinha) a partir do storyboard abaixo.
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
Números e fontes: roteiros/pao-de-queijo-de-liquidificador.pesquisa.md"""
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
    ("c1", None, None, "O pão de queijo mais fácil do mundo | entra tudo no liquidificador, | fica pronto em vinte minutos | e a família pede toda semana.", [
        ("paoQPronto", "giro", None, None),
        ("liqBate", "frente", [0, 1], None),
        ("paoQPronto", "close", None, None),
        ("paoQPronto", "mesa", [0, 1], None),
    ]),
    ("c2", "FORNO", "180 °C", "Primeiro, | liga o forno em cento e oitenta graus.", [
        ("cozinha", "geral", None, None),
        ("botao", "macro", [0, 1], card("Pré-aquecer o forno", num=180, sufixo=" °C")),
    ]),
    ("c3", "OVOS E LÍQUIDOS", "2 ovos", "No liquidificador: dois ovos, | meio copo de óleo | e um copo de leite.", [
        ("liqOvos", "close", [0, 1], card("Ovos", num=2, sufixo=" inteiros")),
        ("liqOleo", "close", [0, 1], card("Óleo", valor="½ copo", sub="120 ml")),
        ("liqLeite", "close", [0, 1], card("Leite inteiro", valor="1 copo", sub="240 ml")),
    ]),
    ("c4", "POLVILHO AZEDO", "200 g", "Dois copos de polvilho azedo | e uma colher de sal. | Nunca polvilho doce: | o pão fica emborrachado.", [
        ("liqPolvilho", "alto", [0, 1], card("Polvilho azedo", valor="2 copos", sub="200 g")),
        ("liqPolvilho", "close", [0, 1], None),
        ("liqPolvilho", "frente", [0, 1], card("Polvilho doce", valor="EMBORRACHA", cor=VERM)),
        ("liqBate", "frente", [0, 1], None),
    ]),
    ("c5", "QUEIJO", "100 g", "Agora o segredo: | cem gramas de queijo curado ralado. | Parmesão ou minas. | Quanto mais queijo, mais sabor.", [
        ("liqQueijo", "cima", [0, 1], None),
        ("liqQueijo", "close", [0, 1], card("Queijo curado ralado", num=100, sufixo=" g")),
        ("liqQueijo", "frente", [0, 1], None),
        ("liqBate", "alto", [0, 1], None),
    ]),
    ("c6", "BATER", "1 min", "Tampa | e bate por um minuto | até a massa ficar lisa.", [
        ("liqBate", "frente", None, None),
        ("liqBate", "alto", [0, 1], card("Bater até ficar liso", num=1, sufixo=" min")),
        ("liqBate", "miolo", [0, 1], None),
    ]),
    ("c7", "FORMA", "½ cheio", "Coloca nas forminhas de silicone | até a metade de cada uma. | Não precisa untar.", [
        ("formasPao", "cima", [0, 1], card("Forminhas de silicone", valor="não untar")),
        ("formasPao", "close", [0, 1], None),
        ("formasPao", "frente", [0, 1], card("Encher até a metade", valor="½ cheio", cor=VERDE)),
    ]),
    ("c8", "ASSAR", "30 min", "Forno a cento e oitenta graus | por trinta minutos. | Ficou dourado e crescido? | Tá pronto.", [
        ("paoQForno", "vidro", None, None),
        ("paoQForno", "alto", [0, 1], card("Forno a 180 °C", num=30, sufixo=" min")),
        ("paoQForno", "vidro", [0, 1], None),
        ("paoQPronto", "giro", [0, 1], card("Dourado e crescido", valor="PRONTO", cor=VERDE)),
    ]),
    ("c9", None, None, "Espera dois minutinhos | e as bolinhas soltam sozinhas. | Rende uns trinta pães de queijo.", [
        ("paoQPronto", "mesa", None, None),
        ("paoQPronto", "close", [0, 1], None),
        ("paoQPronto", "giro", [0, 1], card("Rende", num=30, sufixo=" bolinhas")),
    ]),
    ("c10", None, None, "Parabéns: você fez o pão de queijo | que acaba antes de esfriar.", [
        ("paoQPronto", "mesa", None, None),
        ("paoQPronto", "close", None, None),
    ]),
    ("c11", None, None, "Tem mais de cento e quarenta receitas assim no Precinho de Ouro. | E cinco por dia, de graça, no Telegram.", [
        ("site", "tela", [0, 1], None),
        ("telegram", "ze", None, None),
    ]),
]

rot = {
    "id": "pao-de-queijo-de-liquidificador",
    "serie": "Zé na Cozinha",
    "titulo": "PÃO DE QUEIJO DE LIQUIDIFICADOR",
    "linha2": "o segredo que ninguém conta",
    "site": "precinhodeouro.com.br/receitas",
    "elevenlabs": {"voz_id": "fhtZMBwha5du5OxuvexO", "modelo": "eleven_multilingual_v2",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.15}},
    "fontes": "roteiros/pao-de-queijo-de-liquidificador.pesquisa.md",
    "monetizacao": {
        "afiliados": ["forminhas de silicone para pão de queijo", "liquidificador", "polvilho azedo Yoki"]
    },
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
    if cid == "c11":
        c["cta"] = True
    c["destaques"] = ["queijo", "polvilho", "azedo", "doce", "emborracha", "nunca", "graus", "minuto", "minutos",
                      "pronto", "parabéns", "telegram", "precinho", "ouro", "grátis", "trinta", "dois", "duas",
                      "meia", "cento", "cima", "leite", "ovos", "óleo", "forminhas", "silicone", "dourado"]
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

json.dump(rot, open("roteiros/pao-de-queijo-de-liquidificador.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
chars = sum(len(c["texto"]) for c in rot["cenas"])
print("cenas", len(rot["cenas"]), "planos", sum(len(c["planos"]) for c in rot["cenas"]), "caracteres", chars)
