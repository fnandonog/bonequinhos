"""Refaz o texto e os PLANOS de roteiros/robo-aspirador-de-300-reais-vale-a-pena.json (perfil Vale a Pena?).
Também grava o TEXTO e os destaques de cada cena: mudou o texto, refaça o áudio (ou rode tools/estimar.py).
Cada "|" marca um CORTE: o próximo plano começa na palavra seguinte. Cenários em src/valeapena/roboSets.tsx.
Números e fontes: roteiros/robo-aspirador-de-300-reais-vale-a-pena.pesquisa.md"""
import json

ID = "robo-aspirador-de-300-reais-vale-a-pena"
ARQ = f"roteiros/{ID}.json"


def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c


VERM = "#ff5d5d"
VERDE = "#2fbf71"
AMAR = "#ffd23f"
# (id, texto com cortes, planos[(set, cam, p, card)])
CENAS = [
    ("c1", "Esse robô de trezentos reais gasta uns três centavos de luz por limpeza. | Mas tem um problema que a caixa não conta. | O Zé abriu um e fez as contas.", [
        ("vpR2Gancho", "baixo", [0, 1], card("Robô aspirador", num=299, prefixo="R$ ", sub="menor preço · nov/2026", cor=AMAR)),
        ("vpR2Oficina", "abre", [0, 0.55], None),
        ("vpR2Conta", "calc", [0, 1], None),
    ], ["robô", "trezentos", "reais", "três", "centavos", "problema", "caixa", "contas"]),
    ("c2", "Na caixa, ele promete limpar a casa sozinho. | A bateria dura uma hora e meia. | E faz bem menos barulho que um aspirador comum.", [
        ("vpR2Base", "sai", [0, 1], card("A promessa", valor="LIMPAR SOZINHO")),
        ("vpR2Bateria", "close", [0, 1], card("Bateria", valor="90 min", sub="bateria 2.000 mAh")),
        ("vpR2Silencio", "cao", [0, 1], card("Ruído", num=55, sufixo=" dB", sub="vs. 75 dB do aspirador comum")),
    ], ["promete", "sozinho", "bateria", "hora", "meia", "barulho"]),
    ("c3", "Por dentro, são três peças. | Uma escovinha lateral joga a sujeira pra baixo dele. | Lá, um motor pequeno suga tudo. | Na frente, um para-choque com sensor sente a batida na parede. Aí ele gira e muda de direção.", [
        ("vpR2Oficina", "geral", [0.45, 1], card("Por dentro", valor="3 PEÇAS")),
        ("vpR2Escova", "escova", [0, 1], card("1. Escovinha lateral", valor="JOGA PRA BAIXO")),
        ("vpR2Corte", "motor", [0, 1], card("2. Motor de sucção", num=20, sufixo=" W", sub="pequeno · modo padrão")),
        ("vpR2Bate", "bate", [0, 1], card("3. Para-choque com sensor", valor="BATE · GIRA · MUDA")),
    ], ["três", "peças", "escovinha", "motor", "suga", "para-choque", "sensor", "batida", "gira"]),
    ("c4", "Sem mapa da casa, ele anda no chute. Mapa, só nos de uns seiscentos reais. | Pode passar três vezes no mesmo lugar e pular um canto. | Cabo ou meia no chão | enroscam e travam ele. | E aqui quase todo mundo se engana. | Ele não substitui a faxina. Não limpa sofá nem escada.", [
        ("vpR2Mapa", "cima", [0, 1], None),
        ("vpR2Canto", "canto", [0, 1], card("No chute", valor="3× NO MESMO LUGAR", sub="e o canto fica sujo", cor=VERM)),
        ("vpR2Obstaculo", "cabo", [0, 1], card("Cabo no chão", valor="ENROSCA", cor=VERM)),
        ("vpR2Obstaculo", "parou", [0, 1], card("Resultado", valor="TRAVA", sub="recolha antes de ligar", cor=VERM)),
        ("vpR2Sofa", "geral", [0, 1], None),
        ("vpR2Sofa", "pes", [0, 1], card("O erro mais comum", valor="NÃO SUBSTITUI", sub="não limpa sofá nem escada", cor=VERM)),
    ], ["mapa", "chute", "seiscentos", "três", "canto", "cabo", "trava", "meia", "brinquedo", "engana", "substitui", "faxina", "sofá", "escada"]),
    ("c5", "E a luz? | Uma hora e meia de robô gasta uns três centavos. | O aspirador comum, | em meia hora, gasta uns sessenta centavos. O robô gasta vinte vezes menos.", [
        ("vpR2Luz", "geral", [0, 0.45], None),
        ("vpR2Luz", "display", [0.45, 1], card("1h30 de robô", valor="≈ R$ 0,03", sub="0,03 kWh × R$1/kWh", cor=VERDE)),
        ("vpR2Convencional", "aspirador", [0, 0], card("Aspirador comum", valor="1.200 W")),
        ("vpR2Convencional", "colunas", [0, 1], card("Em meia hora", valor="≈ R$ 0,60", sub="20× o robô · 0,6 kWh", cor=AMAR)),
    ], ["luz", "três", "centavos", "comum", "sessenta", "vinte", "menos"]),
    ("c6", "O problema é outro. | No pote de sujeira cabe só um copo de requeijão. | Com cachorro em casa, enche em uns dez minutos. | Mas a bateria dura noventa minutos. | O pote cheio entope o filtro, e ele só passeia.", [
        ("vpR2Pelo", "geral", [0, 1], card("Com bicho em casa", valor="O PROBLEMA É OUTRO", cor=VERM)),
        ("vpR2Reserv", "close", [0, 1], card("Pote de sujeira", valor="0,3 L", sub="≈ 1 copo de requeijão")),
        ("vpR2Enche", "corte", [0, 1], card("Com cachorro", valor="CHEIO EM 10 MIN", cor=VERM)),
        ("vpR2Esvazia", "ze", [0, 1], card("Pote cheio em 10 min", valor="BATERIA 90 MIN", sub="esvazie no meio da faxina", cor=VERM)),
        ("vpR2Enche", "filtro", [1, 1], card("Pote cheio", valor="FILTRO ENTOPE", sub="a sucção cai", cor=VERM)),
    ], ["problema", "pote", "requeijão", "cachorro", "enche", "dez", "bateria", "noventa", "cheio", "filtro", "entope", "passeia"]),
    ("c7", "Então, depende. | Vale em apartamento de piso liso. | Sem tapete grosso e sem bicho que solta pelo. | Custa menos que três diárias de faxineira. E varre todo dia, entre uma faxina e outra.", [
        ("vpR2Veredito", "carimbo", [0, 1], None),
        ("vpR2Liso", "piso", [0, 1], card("Piso liso", valor="VALE", cor=VERDE)),
        ("vpR2Tapete", "tapete", [0, 1], card("Tapete grosso ou pelo", valor="NÃO VALE", cor=VERM)),
        ("vpR2Diaristas", "tres", [0, 1], card("Custa menos que", num=3, sufixo=" diárias", sub="R$299 < 3 × R$120", cor=VERDE)),
    ], ["depende", "piso", "liso", "tapete", "grosso", "bicho", "pelo", "três", "diárias", "faxineira", "varre"]),
    ("c8", "Link na bio. | E aí, com bicho em casa, | você compraria mesmo assim?", [
        ("vpR2Base", "volta", [1, 0], None),
        ("vpR2Final", "alto", [0, 1], None),
        ("vpR2Sofa", "final", [0, 1], None),
    ], ["link", "bio", "bicho", "compraria"]),
]

rot = json.load(open(ARQ, encoding="utf-8"))
por_id = {c["id"]: c for c in rot["cenas"]}
for cid, texto, planos, dest in CENAS:
    c = por_id[cid]
    partes = [p.strip() for p in texto.split("|")]
    # sem trava: o texto do gerador é a fonte; se mudar, o áudio precisa ser refeito (ou estimado com tools/estimar.py)
    c["texto"] = " ".join(partes)
    c["destaques"] = dest
    idx, n = [], 0
    for parte in partes:
        idx.append(n)
        n += len(parte.split())
    assert len(idx) == len(planos), (cid, len(idx), len(planos))
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

seq = [(pl["set"], pl["cam"]) for c in rot["cenas"] for pl in c["planos"]]
assert all(a != b for a, b in zip(seq, seq[1:])), "dois planos seguidos iguais"

rot["cta"]["texto"] = "Robô aspirador básico"
rot["pagina"]["texto"] = rot["pagina"]["texto"].replace("Precisa esvaziar todo uso.", "A bateria dura ~90 min: com pote cheio o filtro entope e a sucção cai, então esvazie no meio da faxina.")
json.dump(rot, open(ARQ, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("cenas", len(rot["cenas"]), "planos", len(seq))
