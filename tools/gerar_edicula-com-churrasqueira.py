"""Gera roteiros/edicula-com-churrasqueira.json a partir do storyboard abaixo.
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
(O "|" sai do texto antes de ir para a narração.)"""
import json

def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c

R = "R$ "
ID = "edicula-com-churrasqueira"
CENAS = [
    ("c1", None, 0, "Quanto custa, de verdade, | uma edícula com churrasqueira no fundo do quintal? | Tem gente que acha que sai por dez mil. Bora fazer a conta.", [
        ("edFachada", "drone", None, None),
        ("edAberta", "cima", [0, 1], card("Edícula de 24 m²", valor="6 × 4 m", sub="churrasqueira · bancada · lavabo")),
        ("edTerreno", "geral", None, card("R$ 10 mil?", valor="NÃO DÁ", cor="#ff5d5d")),
    ]),
    ("c2", "PROJETO", 3000, "Antes de cavar, o papel: | projeto, ART e alvará. Uns três mil.", [
        ("edTerreno", "ze", None, None),
        ("edProjeto", "cima", [0, 1], card("Projeto + ART + alvará", num=3000, prefixo=R)),
    ]),
    ("c3", "FUNDAÇÃO", 6000, "Aí você fura o chão | e enche de concreto: são as brocas. | Por cima, a viga baldrame | e o contrapiso. Seis mil.", [
        ("edBrocas", "cima", [0, 0.5], None),
        ("edBrocas", "corte", [0.5, 1], card("Concreto usinado", num=425, prefixo=R, sufixo=" /m³")),
        ("edBaldrame", "perimetro", [0, 0.7], None),
        ("edBaldrame", "rente", [0.7, 1], card("Fundação + contrapiso", num=6000, prefixo=R)),
    ]),
    ("c4", "PAREDES", 7500, "Parede só em três lados: | uns oitocentos blocos. | Na frente, uma viga vence seis metros sem parede nenhuma.", [
        ("edParedes", "geral", [0, 0.5], None),
        ("edParedes", "close", [0.5, 0.85], card("Blocos 14 × 19 × 29", num=800, prefixo="≈ ")),
        ("edParedes", "viga", [0.85, 1], card("Paredes + viga de 6 m", num=7500, prefixo=R)),
    ]),
    ("c5", "TELHADO", 7000, "No telhado, madeira | e quase seiscentas telhas. Sete mil.", [
        ("edTelhado", "madeira", [0, 0.5], None),
        ("edTelhado", "telhas", [0.5, 1], card("Telhas cerâmicas", num=600, prefixo="≈ ", sub="telhado completo: R$ 7 mil")),
    ]),
    ("c6", "CHURRASQUEIRA", 5000, "Agora a estrela: a churrasqueira. | Tijolo refratário onde bate o fogo. | E quase todo mundo erra aqui: | chaminé mal feita, a fumaça volta na sua cara. | Duto de inox: quatrocentos reais o metro.", [
        ("edChurrasqueira", "frente", [0, 0.45], None),
        ("edChurrasqueira", "close", [0.45, 0.7], card("Churrasqueira de alvenaria", num=4000, prefixo=R)),
        ("edFumaca", "ruim", None, card("Chaminé errada", valor="FUMAÇA VOLTA", cor="#ff5d5d")),
        ("edChurrasqueira", "chamine", [0.7, 1], None),
        ("edFumacaBoa", "boa", None, card("Duto de inox 200 mm", num=400, prefixo=R, sufixo=" /m")),
    ]),
    ("c7", "INSTALAÇÕES", 6000, "Levar água, esgoto e luz | até o fundo do quintal: seis mil.", [
        ("edInstalacoes", "vala", [0, 0.6], None),
        ("edInstalacoes", "cima", [0.6, 1], card("Elétrica + hidráulica", num=6000, prefixo=R)),
    ]),
    ("c8", "REBOCO", 6000, "Chapisco e reboco, | dentro e fora: mais seis mil.", [
        ("edReboco", "lateral", [0, 0.55], None),
        ("edReboco", "rente", [0.55, 1], card("Chapisco + reboco", num=6000, prefixo=R)),
    ]),
    ("c9", "PISO E BANCADA", 7500, "Piso novo no chão | e bancada de granito com pia: | mil e oitocentos reais o metro.", [
        ("edAcabamento", "cima", [0, 0.6], None),
        ("edAcabamento", "bancada", [0.6, 0.9], None),
        ("edAcabamento", "granito", [0.9, 1], card("Granito, o metro", num=1800, prefixo=R, sub="piso + bancada: R$ 7.500")),
    ]),
    ("c10", "PINTURA E LAVABO", 5000, "Tinta nas paredes, | e o lavabo, pra visita não entrar na sua casa.", [
        ("edPintura", "pintor", [0, 0.5], None),
        ("edLavabo", "cima", None, card("Pintura + lavabo", num=5000, prefixo=R)),
    ]),
    ("c11", None, 0, "Parabéns: você construiu sua edícula. | Uns cinquenta e três mil reais, sem o terreno. | E a surpresa: a churrasqueira foi só nove por cento da conta.", [
        ("edFachada", "baixa", None, None),
        ("edAberta", "cima2", [0, 1], card("Total sem terreno", num=53000, prefixo=R, sub="preços de São Paulo, nov/2026")),
        ("edFachada", "churras", None, card("Churrasqueira na conta", valor="só 9%", cor="#ffd23f")),
    ]),
    ("c12", None, 0, "Você faria com lavabo ou sem? Comenta aí.", [
        ("edFachada", "drone2", None, None),
    ]),
]

rot = {
    "id": ID,
    "serie": "Você construiu",
    "titulo": "EDÍCULA COM CHURRASQUEIRA",
    "linha2": "quanto custa DE VERDADE?",
    "elevenlabs": {"voz_id": "5Ny27k6jpd2wJTdmbFsb", "modelo": "eleven_multilingual_v2",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.15}},
    "fontes": f"roteiros/{ID}.pesquisa.md",
    "monetizacao": {"afiliados": [
        "churrasqueira pré-moldada / kit tijolo refratário", "grelha e espetos inox", "duto de inox 200 mm + chapéu",
        "cuba inox e torneira gourmet", "bloco cerâmico 14×19×29", "cimento e argamassa", "telha cerâmica",
        "trado manual para broca", "colher de pedreiro, nível e trena", "rolo e tinta acrílica",
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
    c["destaques"] = ["mil", "metros", "metro", "reais", "brocas", "fumaça", "refratário", "total", "parabéns", "surpresa"]
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
