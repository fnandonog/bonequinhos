"""Gera roteiros/casa-50m2.json a partir do storyboard abaixo.
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
CENAS = [
    ("c1", None, 0, "Quanto custa, de verdade, | uma casa de cinquenta metros do zero? | Esquece os sessenta mil. Bora fazer a conta.", [
        ("fachada", "drone", None, None),
        ("casaAberta", "cima", [0, 1], card("Casa de 50 m²", valor="2 quartos", sub="sala + cozinha · banheiro · laje · telha")),
        ("terreno", "geral", None, card("R$ 60 mil?", valor="NÃO DÁ", cor="#ff5d5d")),
    ]),
    ("c2", "PROJETO", 8000, "Antes da primeira pá: | projeto, ART e alvará. | Uns oito mil só de papel.", [
        ("terreno", "ze", None, None),
        ("projeto", "cima", [0, 0.85], None),
        ("projeto", "lado", [0.85, 1], card("Projeto + ART + alvará", num=8000, prefixo=R)),
    ]),
    ("c3", "GABARITO", 1000, "O gabarito marca a casa no chão. | Errou aqui, a casa sai torta.", [
        ("gabarito", "alto", [0, 0.75], None),
        ("gabarito", "linha", [0.75, 1], card("Diária do pedreiro", num=330, prefixo=R)),
    ]),
    ("c4", "FUNDAÇÃO", 15000, "Aí você cava: | um metro pra cada sapata. | Ferragem dentro, | concreto por cima. | Com a viga baldrame, uns quinze mil.", [
        ("escavacao", "cima", [0, 0.5], None),
        ("escavacao", "corte", [0.5, 1], card("Sapata", valor="1 m de fundo", sub="80 × 80 cm")),
        ("armadura", "macro", None, card("Barra de ferro 10 mm", num=50, prefixo=R, sub="cada barra de 12 m")),
        ("concretagem", "corte", None, card("Concreto", num=425, prefixo=R, sufixo=" /m³")),
        ("baldrame", "perimetro", None, card("Fundação completa", num=15000, prefixo=R)),
    ]),
    ("c5", "IMPERMEABILIZAÇÃO", 500, "E quase todo mundo erra aqui: | a viga leva piche, | senão a umidade sobe e vira mofo.", [
        ("baldrame", "rente", [1, 1], None),
        ("impermeabiliza", "rolo", [0, 0.6], card("Emulsão asfáltica", valor="20 litros")),
        ("impermeabiliza", "chuva", [0.6, 1], card("Sem isso, a umidade", valor="SOBE ↑", sub="mofo e salitre na parede", cor="#4fb3ff")),
    ]),
    ("c6", "PAREDES", 12000, "Paredes: | uns dois mil blocos, um por um. | Um pedreiro sobe sete metros quadrados por dia.", [
        ("alvenaria", "geral", [0, 0.4], None),
        ("alvenaria", "close", [0.4, 0.7], card("Blocos 14 × 19 × 29", num=2000, prefixo="≈ ")),
        ("alvenaria", "lateral", [0.7, 1], card("1 pedreiro por dia", valor="7 m²", sub="paredes: ~R$ 12 mil")),
    ]),
    ("c7", "ESTRUTURA", 7000, "Pilar nos cantos. | Verga em cima da janela, pra parede não rachar.", [
        ("estrutura", "quina", [0, 0.5], None),
        ("estrutura", "janela", [0.5, 1], card("Pilares, cintas e vergas", num=7000, prefixo=R)),
    ]),
    ("c8", "LAJE", 10000, "Laje treliçada: vigota, isopor e concreto. | Fica escorada vinte e um dias.", [
        ("laje", "cima", [0, 1], card("Laje treliçada 50 m²", num=10000, prefixo=R)),
        ("lajeEscoras", "dentro", None, card("Escorada por", valor="21 dias")),
    ]),
    ("c9", "TELHADO", 12000, "No telhado, madeira | e umas mil e duzentas telhas.", [
        ("telhado", "madeira", [0, 0.5], None),
        ("telhado", "telhas", [0.5, 1], card("Telhas cerâmicas", num=1200, prefixo="≈ ", sub="telhado completo: ~R$ 12 mil")),
    ]),
    ("c10", "INSTALAÇÕES", 16000, "Rasga a parede pra passar fio e cano: | uns dezesseis mil.", [
        ("instalacoes", "cima", [0, 0.7], None),
        ("instalacoes", "banheiro", [0.7, 1], card("Elétrica + hidráulica", num=16000, prefixo=R)),
    ]),
    ("c11", "REBOCO", 23000, "Chapisco e reboco. | E a surpresa: de cada setenta e um reais por metro, cinquenta e nove são mão de obra.", [
        ("reboco", "fachada", [0, 0.5], None),
        ("reboco", "rente", [0.5, 1], card("Reboco: R$ 71 o m²", valor="R$ 59", sub="é só mão de obra (~R$ 23 mil)")),
    ]),
    ("c12", "PISO E ESQUADRIAS", 16000, "Piso, portas e janelas: | mais dezesseis mil.", [
        ("piso", "cima", [0, 1], None),
        ("piso", "porta", [1, 1.0001], card("Piso + portas + janelas", num=16000, prefixo=R)),
    ]),
    ("c13", "PINTURA", 14500, "Tinta, louças, metais | e as ligações de água e luz.", [
        ("pintura", "fachada", [0, 0.6], None),
        ("pintura", "pintor", [0.6, 1], card("Pintura + louças + ligações", num=14500, prefixo=R)),
    ]),
    ("c14", None, 0, "Parabéns: você construiu uma casa de verdade. | Uns cento e trinta e cinco mil reais, sem o terreno. | E o acabamento custou mais que a estrutura inteira.", [
        ("casaCorte", "frente", None, None),
        ("casaAberta", "cima", [0, 1], card("Total sem terreno", num=135000, prefixo=R, sub="preços de São Paulo, out/2026")),
        ("casaCorte", "sala", None, card("Acabamento × estrutura", valor="53 mil × 45 mil", cor="#ffd23f")),
    ]),
    ("c15", None, 0, "Quer ver um sobrado? Comenta aí.", [
        ("fachada", "baixa", None, None),
    ]),
]

rot = {
    "id": "casa-50m2",
    "serie": "Você construiu",
    "titulo": "CASA DE 50 m² DO ZERO",
    "linha2": "quanto custa DE VERDADE?",
    "elevenlabs": {"voz_id": "ZqE9vIHPcrC35dZv0Svu", "modelo": "eleven_multilingual_v2",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.15}},
    "fontes": "roteiros/casa-50m2.pesquisa.md",
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
    c["destaques"] = ["mil", "metros", "dias", "reais", "piche", "mofo", "total", "parabéns"]
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

json.dump(rot, open("roteiros/casa-50m2.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
chars = sum(len(c["texto"]) for c in rot["cenas"])
print("cenas", len(rot["cenas"]), "planos", sum(len(c["planos"]) for c in rot["cenas"]), "caracteres", chars,
      "total", sum(c.get("custo", 0) for c in rot["cenas"]))
