"""Gera roteiros/piscina-de-fibra-6x3-no-quintal.json a partir do storyboard abaixo.
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
(O "|" sai do texto antes de ir para a narração.) Cenários em src/v4/piscina.tsx (prefixo "pi")."""
import json

def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c

R = "R$ "
ID = "piscina-de-fibra-6x3-no-quintal"
CENAS = [
    ("c1", None, 0, "Quanto custa, de verdade, | uma piscina de fibra de seis por três no quintal? | A loja só te mostra o casco. | Bora fazer a conta toda.", [
        ("piFinal", "drone", None, None),
        ("piFinal", "cima", None, card("Piscina de fibra", valor="6 × 3 m", sub="1,40 m de fundo · 22 mil litros")),
        ("piLoja", "geral", None, card("Só o casco?", valor="FALTA MUITO", cor="#ff5d5d")),
        ("piQuintal", "geral", [0, 1], None),
    ]),
    ("c2", "ESCAVAÇÃO", 4000, "Primeiro, o buraco: | uma escavadeira tira a terra. | Dá umas cinco caçambas. | Tudo isso: quatro mil.", [
        ("piEscavacao", "geral", [0, 0.3], None),
        ("piEscavacao", "braco", [0.3, 0.6], None),
        ("piEscavacao", "cacamba", [0.6, 0.85], card("Caçambas de terra", num=5, prefixo="≈ ", sub="R$ 280 a R$ 400 cada")),
        ("piEscavacao", "cima", [0.85, 1], card("Escavação + caçambas", num=4000, prefixo=R)),
    ]),
    ("c3", "BASE", 2000, "No fundo, concreto | e pó de pedra, tudo no nível. Dois mil.", [
        ("piBase", "corte", [0, 0.55], None),
        ("piBase", "close", [0.55, 1], card("Concreto + pó de pedra", num=2000, prefixo=R)),
    ]),
    ("c4", "CASCO", 17000, "Aí chega o casco de fibra, | inteiro, num caminhão. | Um guindaste desce ele no buraco. | Casco e guindaste: dezessete mil.", [
        ("piGuindaste", "geral", [0, 0.3], None),
        ("piGuindaste", "caminhao", [0.3, 0.5], None),
        ("piGuindaste", "desce", [0.5, 0.88], None),
        ("piGuindaste", "encaixe", [0.88, 1], card("Casco 6 × 3 + guindaste", num=17000, prefixo=R)),
    ]),
    ("c5", "ATERRO E ÁGUA", 1500, "E quase todo mundo erra aqui: | fecha as laterais com a terra do buraco. | O barro segura água e empurra a fibra. | O certo é areia com cimento, | enchendo a piscina junto. | Vinte e dois mil litros: | uns quatrocentos reais de água.", [
        ("piErro", "geral", [0, 0.35], None),
        ("piErro", "corte", [0.35, 0.65], None),
        ("piErro", "close", [0.65, 1], card("Aterro com barro", valor="EMPURRA A FIBRA", cor="#ff5d5d")),
        ("piAterro", "corte", [0, 0.45], card("Aterro certo", valor="AREIA + CIMENTO", cor="#2fbf71")),
        ("piAterro", "close", [0.45, 0.75], None),
        ("piAterro", "cima", [0.75, 0.9], card("Água para encher", num=22000, sufixo=" litros")),
        ("piAterro", "mangueira", [0.9, 1], card("Conta de água", num=400, prefixo=R)),
    ]),
    ("c6", "FILTRO", 3500, "Pra água não virar sopa verde, | filtro de areia e motobomba: | três mil e quinhentos.", [
        ("piFiltro", "verde", [0, 0.4], None),
        ("piFiltro", "filtro", [0.4, 0.75], None),
        ("piFiltro", "limpa", [0.75, 1], card("Filtro + motobomba", num=3500, prefixo=R)),
    ]),
    ("c7", "CASA DE MÁQUINAS", 6000, "Os canos vão por baixo até a casa de máquinas, | com quadro de luz e aterramento. Seis mil.", [
        ("piMaquinas", "corte", [0, 0.6], None),
        ("piMaquinas", "quadro", [0.6, 1], card("Hidráulica + elétrica", num=6000, prefixo=R)),
    ]),
    ("c8", "BORDA", 3500, "Dezoito metros de borda | que não esquenta o pé. Três mil e quinhentos.", [
        ("piBorda", "geral", [0, 0.6], None),
        ("piBorda", "close", [0.6, 1], card("Borda atérmica", num=18, sufixo=" m", sub="com colocação: R$ 3.500")),
    ]),
    ("c9", "CALÇADA", 5500, "E calçada que não escorrega, | um metro em volta. Cinco mil e quinhentos.", [
        ("piCalcada", "cima", [0, 0.6], None),
        ("piCalcada", "rente", [0.6, 1], card("Calçada antiderrapante", num=5500, prefixo=R)),
    ]),
    ("c10", None, 0, "Parabéns: você construiu sua piscina. | Uns quarenta e três mil reais. | E a surpresa: o casco foi só quarenta por cento. | Depois, uns quinhentos por mês de manutenção.", [
        ("piFinal", "baixa", None, None),
        ("piFinal", "cima2", None, card("Total sem aquecimento", num=43000, prefixo=R, sub="preços de São Paulo, 2026")),
        ("piLoja", "geral2", None, card("Casco na conta", valor="só 40%", cor="#ffd23f")),
        ("piFinal", "agua", None, card("Manutenção", num=500, prefixo="≈ R$ ", sufixo=" /mês")),
    ]),
    ("c11", None, 0, "Você faria de fibra ou de alvenaria? Comenta aí.", [
        ("piFinal", "drone2", None, None),
    ]),
]

rot = {
    "id": ID,
    "serie": "Você construiu",
    "titulo": "PISCINA DE FIBRA 6 × 3",
    "linha2": "quanto custa DE VERDADE?",
    "elevenlabs": {"voz_id": "ZqE9vIHPcrC35dZv0Svu", "modelo": "eleven_flash_v2_5",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.15}},
    "fontes": f"roteiros/{ID}.pesquisa.md",
    "monetizacao": {"afiliados": [
        "filtro de areia + motobomba para piscina", "borda atérmica para piscina", "kit limpeza (peneira, aspirador, escova)",
        "cloro, algicida e kit teste de pH", "clorador salino", "capa de proteção para piscina",
        "piso antiderrapante para área de piscina", "cimento e areia (aterro)", "pá, enxada e nível de bolha",
        "mangueira de jardim",
    ]},
    "cenas": [],
}
for cid, etapa, custo, texto, planos in CENAS:
    partes = [p.strip() for p in texto.split("|")]
    idx, n = [], 0
    for parte in partes:
        idx.append(n)
        n += len(parte.split())
    assert len(idx) == len(planos), (cid, len(idx), len(planos))
    c = {"id": cid, "texto": " ".join(partes)}
    if etapa:
        c["etapa"] = etapa
    if custo:
        c["custo"] = custo
    c["destaques"] = ["mil", "metros", "metro", "reais", "litros", "caçambas", "casco", "barro", "areia", "total", "parabéns", "surpresa"]
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

json.dump(rot, open(f"roteiros/{ID}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
chars = sum(len(c["texto"]) for c in rot["cenas"])
print("cenas", len(rot["cenas"]), "planos", sum(len(c["planos"]) for c in rot["cenas"]), "caracteres", chars,
      "total", sum(c.get("custo", 0) for c in rot["cenas"]))
