"""Monta roteiros/kitnet-v2.json: mesmo texto (e áudio) da kitnet, com cortes a cada ~1,2 s,
obra em etapas sincronizadas com as palavras e ficha técnica por etapa.

Uso: python3 tools/gerar_kitnet_v2.py
"""
import json, math

base = json.load(open("roteiros/kitnet.json", encoding="utf-8"))
tim = json.load(open("public/audio/kitnet-v2/timings.json", encoding="utf-8"))


def S(alvo, az, dist, h):
    """Câmera olhando para `alvo`, vinda do ângulo `az` (graus, 0 = frente +z), a `dist` m e `h` m acima."""
    a = math.radians(az)
    pos = [round(alvo[0] + dist * math.sin(a), 2), round(alvo[1] + h, 2), round(alvo[2] + dist * math.cos(a), 2)]
    return {"pos": pos, "alvo": [round(v, 2) for v in alvo]}


C = [0, 0.4, 0]


def aberto(t, perto=9.0):
    """Abre o enquadramento: a obra inteira sempre visível (nada de close extremo).
    O foco só puxa o alvo metade do caminho; distância mínima `perto`, elevação entre 22 e 55 graus."""
    alvo, pos = t["alvo"], t["pos"]
    foco = [alvo[0] * 0.5, 0.8, alvo[2] * 0.5]
    dx, dy, dz = pos[0] - alvo[0], pos[1] - alvo[1], pos[2] - alvo[2]
    plano = math.hypot(dx, dz)
    az = math.atan2(dx, dz)
    if dy > 3 * max(plano, 0.1):  # vista de cima
        R, el = max(19.0, math.hypot(plano, dy)), math.radians(78)
    else:
        el = min(max(math.atan2(dy, plano), math.radians(28)), math.radians(58))
        R = min(max(math.hypot(plano, dy), perto), 22.0)
    d, h = R * math.cos(el), R * math.sin(el)
    return {"pos": [round(foco[0] + d * math.sin(az), 2), round(foco[1] + h, 2), round(foco[2] + d * math.cos(az), 2)],
            "alvo": [round(v, 2) for v in foco]}
ZE_FORA = [3.4, 1.1, 4.6]

# por cena: lista de (palavra, tomada, corte?)
TOMADAS = {
    "c1": [(0, S(C, 40, 22, 15), True), (4, S([0, 0.1, 0.6], 0, 2, 17), True), (6, S([4.2, 1.1, 5.6], -90, 5, 2.0), True),
           (9, S(C, -45, 12, 6), True), (13, S(C, 200, 15, 9), False), (18, S(ZE_FORA, -25, 4.5, 1.6), True), (21, S(C, 50, 7.5, 3.5), True)],
    "c2": [(0, S(C, 30, 11, 8), True), (2, S([1.5, 0, 1.5], -40, 5, 2.5), True), (4, S(C, 5, 2, 12), True),
           (6, S([1.8, 0.1, 2.2], 55, 3.2, 1.6), True), (11, S(C, -60, 9, 5), True), (14, S(ZE_FORA, 25, 5, 2.0), True)],
    "c3": [(0, S(C, -55, 13, 7), True), (4, S([2.5, 0.9, 3.0], -20, 4.2, 1.4), True), (8, S([1.2, 0.6, -1.8], 10, 2.5, 7), True),
           (11, S(C, 20, 9, 0.6), True), (14, S([4.2, 1.1, 1.5], -30, 4.5, 1.8), True)],
    "c4": [(0, S([3.6, 1.4, 3.8], 35, 3.8, 1.2), True), (3, S([-0.6, 1.5, 2.8], 180, 3, 2.6), True), (6, S([0, 1.8, 0], 25, 4, 6.5), True),
           (9, S([0.4, 0.5, -2.6], 0, 3, 3), True), (10, S([-3.4, 2.0, -1.8], -70, 4.5, 1.2), True), (12, S([2.6, 0.1, -3.9], 140, 3.5, 2.4), True)],
    "c5": [(0, S([-2.5, 1.4, 0.5], 90, 3.6, 1.6), True), (1, S([-0.3, 0.3, 0.2], 15, 4.5, 8), True),
           (5, S(C, -40, 11, 5), True), (8, S(C, 30, 13, 7), False)],
    "c6": [(0, S([1.6, 0.6, -2.2], 20, 3.5, 4.5), True), (2, S([2.2, 0.6, -2.2], 40, 2.6, 1.3), True), (5, S([1.25, 1.0, -2.3], 10, 2.6, 1.3), True)],
    "c7": [(0, S([-0.6, 0.6, -2.4], -15, 4.5, 4.5), True), (2, S([-1.3, 0.9, -2.6], 25, 2.4, 1.0), True), (5, S([-0.85, 1.0, -2.6], 0, 1.2, 1.6), True),
           (7, S([0.15, 1.0, -2.6], -35, 2.6, 0.8), True)],
    "c8": [(0, S([-1.6, 0.5, 0.5], 60, 3.2, 2.6), True), (1, S([-1.9, 0.8, -0.6], 60, 4.2, 2.2), True), (4, S([1.5, 0.6, 1.9], -20, 2.8, 1.4), True),
           (7, S([0, 0.5, 0], 25, 6, 6), True), (9, S([0, 0.5, 0], -35, 7, 4), False)],
    "c9": [(0, S([-1.2, 1.2, 3.1], 15, 3.4, 0.6), True), (2, S([2.6, 1.6, 0.9], 80, 3.6, 0.6), True)],
    "c10": [(0, S([0, 3.6, 1.2], -30, 4.5, 2.0), True), (4, S(C, 35, 13, 6), True), (7, S([0, 3.0, 0], 40, 9.5, 2.5), True)],
    "c11": [(0, S([1.6, 1.2, 4.8], 20, 6, 1.8), True), (2, S(C, -40, 14, 7), True), (5, S([2.9, 0.8, 4.6], 35, 3.2, 0.9), True),
            (9, S(C, 160, 13, 6), True), (13, S([1.2, 1.1, 5.2], -20, 4.5, 1.3), True)],
    "c12": [(0, S(C, 60, 16, 9), True), (3, S([-1.2, 1.0, 3.1], 0, 4, 1.0), True), (6, S(C, -120, 13, 6), True),
            (10, S([1.2, 1.1, 5.2], 30, 4.2, 1.4), True), (15, S(C, 0, 3, 21), True), (18, S(C, -30, 18, 5), False)],
    "c13": [(0, S([1.2, 1.1, 5.2], -15, 4.0, 1.2), True), (3, S(C, 45, 12, 6), True), (5, S([1.2, 1.1, 5.2], 20, 3.4, 1.0), True)],
}

MOSTRAR = {
    "c1": ["terreno"],
    "c2": ["gabarito@0", "escavacao@2", "brita@3", "lona@4", "malha@5", "concreto@11"],
    "c3": ["paredes@2"],
    "c4": ["padrao@0", "quadro@3", "fios@6", "canos@9", "caixadagua@10", "fossa@12"],
    "c5": ["reboco@0", "contrapiso@1", "porcelanato@3", "pintura@5"],
    "c6": ["banheiro@0", "vaso@2", "pia@3", "chuveiro@5"],
    "c7": ["bancada@2", "geladeira@7"],
    "c8": ["cama@0", "armario@1", "sofa@4"],
    "c9": ["esquadrias@0"],
    "c10": ["madeiramento@0", "telhado@4"],
    "c11": ["placa@0"],
}

FICHA = {
    "c2": [["Escavação e compactação", 900], ["Brita e lona plástica", 700], ["Malha de aço", 1100], ["Concreto usinado 4 m³", 2600], ["Mão de obra", 2700]],
    "c3": [["1.300 blocos cerâmicos", 2600], ["Cimento, areia e cal", 1900], ["Vergas e cintas", 1000], ["Pedreiro + ajudante (15 dias)", 6500]],
    "c4": [["Padrão de energia", 1500], ["Fios, eletrodutos e tomadas", 1400], ["Quadro + disjuntores", 400], ["Canos, conexões e registros", 900], ["Caixa d'água 500 L", 450], ["Fossa séptica", 1350]],
    "c5": [["Reboco", 2800], ["Contrapiso", 1200], ["Porcelanato 30 m²", 1800], ["Argamassa e rejunte", 400], ["Massa e tinta", 1100], ["Mão de obra pintura", 1700]],
    "c6": [["Vaso com caixa acoplada", 550], ["Pia e torneira", 350], ["Chuveiro elétrico", 150], ["Box de vidro", 650], ["Revestimento", 800]],
    "c7": [["Bancada de granito + pia", 1300], ["Cooktop 2 bocas", 350], ["Geladeira compacta", 1900], ["Torneira e sifão", 150], ["Armário aéreo", 300]],
    "c8": [["Cama casal + colchão", 1400], ["Guarda-roupa", 900], ["Sofá 2 lugares", 1000], ["Cortina e luminárias", 200]],
    "c9": [["Porta de entrada", 900], ["Porta do banheiro", 450], ["3 janelas de alumínio", 2400], ["Instalação", 750]],
    "c10": [["Madeiramento", 3200], ["1.000 telhas cerâmicas", 2300], ["Cumeeira e rufos", 500], ["Forro de PVC", 1200], ["Mão de obra", 1800]],
    "c11": [["Fundação (radier)", 8000], ["Paredes", 12000], ["Elétrica + hidráulica", 6000], ["Reboco, piso e pintura", 9000], ["Banheiro", 2500],
            ["Cozinha", 4000], ["Móveis", 3500], ["Portas e janelas", 4500], ["Telhado", 9000], ["TOTAL", 58500]],
    "c12": [["Aluguel", "R$ 900/mês"], ["Em 1 ano", "R$ 10.800"], ["Volta o investimento", "~65 meses"], ["Depois disso", "lucro todo mês"]],
}

ZE = {
    "c1": {"de": [5.8, 7.2], "para": [3.4, 4.6], "acao": "acena"},
    "c2": {"de": [3.4, 4.6], "acao": "aponta"},
    "c3": {"de": [3.4, 4.6], "para": [4.2, 1.5], "acao": "aponta"},
    "c4": {"de": [4.2, 1.5], "acao": "parado"},
    "c5": {"de": [4.2, 1.5], "acao": "aponta"},
    "c6": {"de": [0.0, 0.6], "para": [0.5, -0.5], "acao": "aponta"},
    "c7": {"de": [1.6, 0.2], "acao": "aponta"},
    "c8": {"de": [1.2, -0.6], "acao": "comemora"},
    "c9": {"de": [3.6, 4.4], "para": [2.4, 5.5], "acao": "aponta"},
    "c10": {"de": [2.4, 5.5], "acao": "parado"},
    "c11": {"de": [2.4, 5.5], "para": [1.2, 5.2], "acao": "comemora"},
    "c12": {"de": [1.2, 5.2], "acao": "acena"},
    "c13": {"de": [1.2, 5.2], "acao": "acena"},
}

CUTAWAY = {"c6", "c7", "c8"}

rot = {k: v for k, v in base.items() if k != "cenas"}
rot["id"] = "kitnet-v2"
rot["cenas"] = []
for c, tm in zip(base["cenas"], tim["cenas"]):
    assert c["id"] == tm["id"]
    perto = 13.0 if c["id"] in CUTAWAY else 15.5
    lst = [(p, aberto(t, perto), cut) for p, t, cut in TOMADAS[c["id"]]]
    nova = {"id": c["id"], "texto": c["texto"]}
    for k in ("zona", "item"):
        if k in c:
            nova[k] = c[k]
    nova["camera"] = lst[0][1]
    nova["takes"] = [dict(t, palavra=p, corte=cut) for p, t, cut in lst[1:]]
    if c["id"] in MOSTRAR:
        nova["mostrar"] = MOSTRAR[c["id"]]
    nova["ze"] = ZE[c["id"]]
    if c["id"] in CUTAWAY:
        nova["cutaway"] = True
    if c["id"] in FICHA:
        nova["ficha"] = FICHA[c["id"]]
        if "item" in c and c["id"] != "c11":
            assert sum(v for _, v in FICHA[c["id"]]) == c["item"]["preco"], c["id"]
    # checa ritmo dos cortes
    tempos = [0] + [tm["palavras"][p]["inicio"] for p, _, _ in lst[1:]] + [tm["duracao"]]
    gaps = [round(b - a, 2) for a, b in zip(tempos, tempos[1:])]
    print(c["id"], "cortes:", gaps)
    rot["cenas"].append(nova)

json.dump(rot, open("roteiros/kitnet-v2.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok: roteiros/kitnet-v2.json")
