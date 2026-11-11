"""Gera roteiros/brownie-facil.json (série Zé na Cozinha) a partir do storyboard abaixo.
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
Números e fontes: roteiros/brownie-facil.pesquisa.md"""
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
    ("c1", None, None, "Sabe a casquinha brilhante do brownie de padaria? | O segredo não tá no chocolate. | Tá no jeito de bater o ovo.", [
        ("bwPronto", "giro", None, None),
        ("bwCasquinha", "macro", [0, 1], None),
        ("bwBate", "frente", [0.3, 1], card("Ovo + açúcar", valor="BATIDOS", cor="#ffd23f")),
    ]),
    ("c2", "FORNO", "180 °C", "Liga o forno em cento e oitenta graus | e forra uma forma quadrada de vinte centímetros | com papel-manteiga.", [
        ("botao", "macro", [0, 1], card("Pré-aquecer o forno", num=180, sufixo=" °C")),
        ("bwForma", "cima", None, card("Forma quadrada", num=20, sufixo=" cm", sub="20 × 20 cm")),
        ("bwForma", "papel", [0, 1], card("Papel-manteiga", valor="forrar", sub="o brownie sai inteiro")),
    ]),
    ("c3", "DERRETER", "banho-maria", "Derrete duzentos gramas de chocolate meio amargo | com cento e cinquenta de manteiga, | em banho-maria.", [
        ("bwChocolate", "close", [0, 1], card("Chocolate meio amargo", num=200, sufixo=" g")),
        ("bwManteiga", "close", [0, 1], card("Manteiga", num=150, sufixo=" g")),
        ("bwBanho", "alto", [0, 1], card("Derreter", valor="banho-maria", sub="ou no micro-ondas")),
    ]),
    ("c4", "O SEGREDO", "3 min", "Agora o segredo: três ovos | e uma xícara e meia de açúcar. | Bate uns três minutos, | até virar um creme claro e grosso.", [
        ("bwOvos", "close", [0, 1], card("Ovos", num=3, sufixo=" inteiros")),
        ("bwAcucar", "close", [0, 1], card("Açúcar", valor="1 ½ xícara", sub="300 g")),
        ("bwBate", "cima", [0, 0.7], card("Bater com o fuê", num=3, sufixo=" min")),
        ("bwFita", "close", None, card("Ponto", valor="creme claro", sub="grosso, cai em fita", cor=VERDE)),
    ]),
    ("c5", None, None, "É esse creme que sobe no forno | e vira a casquinha brilhante.", [
        ("bwForno", "vidro", [0.2, 1], None),
        ("bwCasquinha", "rente", [0, 1], card("Açúcar + ovo no forno", valor="casquinha", sub="fina e brilhante", cor="#ffd23f")),
    ]),
    ("c6", "MISTURAR", "devagar", "Junta o chocolate derretido, mexendo devagar. | Depois, três quartos de xícara de farinha, | duas colheres de cacau | e uma pitada de sal.", [
        ("bwJunta", "lado", [0, 1], None),
        ("bwFarinha", "close", [0, 1], card("Farinha de trigo", valor="¾ xícara", sub="90 g · peneirada")),
        ("bwCacau", "colher", [0, 1], card("Cacau em pó 100%", valor="2 colheres", sub="de sopa")),
        ("bwSal", "close", [0, 1], card("Sal", valor="1 pitada")),
    ]),
    ("c7", "MISTURAR", "sem bater", "Mistura só até sumir a farinha. | Bater demais deixa o brownie com cara de bolo.", [
        ("bwMistura", "cima", [0, 1], card("Misture só até", valor="sumir a farinha", cor=VERDE)),
        ("bwBolo", "corte", [0, 1], card("Bateu demais?", valor="VIRA BOLO", cor=VERM)),
    ]),
    ("c8", "ASSAR", "180 °C", "Massa na forma | e vinte a vinte e cinco minutos no forno.", [
        ("bwDespeja", "lado", [0, 1], None),
        ("bwForno", "alto", [0, 1], card("Forno a 180 °C", valor="20 a 25 min")),
    ]),
    ("c9", "PONTO", None, "E aqui quase todo mundo erra: | o palito não pode sair limpo. | Tem que sair com migalhas úmidas. | Saiu limpo? Passou do ponto e fica seco.", [
        ("bwErra", "frente", None, None),
        ("bwLimpo", "macro", [0, 1], card("Palito limpo", valor="NÃO", cor=VERM)),
        ("bwPalito", "macro", [0, 1], card("Ponto certo", valor="migalhas úmidas", cor=VERDE)),
        ("bwSeco", "corte", [0, 1], card("Passou do ponto", valor="SECO", cor=VERM)),
    ]),
    ("c10", "CORTAR", "30 min", "Espera meia hora antes de cortar | e corta em dezesseis quadradinhos.", [
        ("bwEsfria", "janela", [0, 1], card("Esperar firmar", num=30, sufixo=" min", cor="#4fb3ff")),
        ("bwCorta", "cima", [0, 1], card("Cortar em", num=16, sufixo=" quadradinhos")),
    ]),
    ("c11", None, None, "Pronto: brownie de padaria. | Você é time casquinha | ou time miolo molhadinho?", [
        ("bwMesa", "geral", None, None),
        ("bwCasquinha", "macro", [0.6, 1], None),
        ("bwQuadradinhos", "close", [0, 1], None),
    ]),
    ("c12", None, None, "Receita completa e utensílios em oferta: link na bio.", [
        ("bwPronto", "final", None, None),
    ]),
]

rot = {
    "id": "brownie-facil",
    "serie": "Zé na Cozinha",
    "titulo": "BROWNIE DE PADARIA",
    "linha2": "o segredo da casquinha",
    "site": "link na bio",
    "cta": {"titulo": "LINK NA BIO", "texto": "Receita completa", "botao": "Utensílios em oferta"},
    "elevenlabs": {"voz_id": "fhtZMBwha5du5OxuvexO", "modelo": "eleven_multilingual_v2",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.15}},
    "fontes": "roteiros/brownie-facil.pesquisa.md",
    "monetizacao": {"afiliados": ["forma quadrada 20x20 antiaderente", "fuê de inox", "espátula de silicone", "tigela de vidro", "papel-manteiga"]},
    "cenas": [],
}
DESTAQUES = ["segredo", "casquinha", "brilhante", "ovo", "graus", "gramas", "minutos", "centímetros", "xícara", "colheres", "pitada",
             "banho-maria", "claro", "devagar", "bolo", "erra", "limpo", "migalhas", "seco", "meia", "hora", "pronto", "link", "bio", "oferta",
             "três", "duas", "uma", "vinte", "cento", "duzentos", "dezesseis", "quartos"]
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
    if cid == "c12":
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

json.dump(rot, open("roteiros/brownie-facil.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
chars = sum(len(c["texto"]) for c in rot["cenas"])
print("cenas", len(rot["cenas"]), "planos", sum(len(c["planos"]) for c in rot["cenas"]), "caracteres", chars)
