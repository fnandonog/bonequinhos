"""Gera roteiros/kitnet-de-25-m-para-alugar.json a partir do storyboard abaixo.
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

# Storyboard plano a plano
# Formato: (id_cena, etapa, custo, "texto com | cortes", [
#     ("set", "cam", [p_inicio, p_fim] ou None, card(...) ou None),
# ])
# Regras de direção aplicadas:
#   - Nunca dois planos consecutivos com o mesmo set+cam (verificado abaixo)
#   - Alternância aberto (geral/drone/cima) → médio/close a cada etapa
#   - p = progresso da ação no plano (obra avança entre cortes)
#   - Um card por plano com número; todos os números estão na pesquisa
#   - Ritmo: corte a cada ~2 s (26 planos para ~52 s = 2 s/plano)
#   - Gancho visual: fachada/drone no primeiro frame (resultado já na tela)
#   - Momento "uau": INSTALAÇÕES ("quase todo mundo erra aqui") na cena 8
#   - Final em loop: fachada/drone reaparece em c12 conversando com c1

CENAS = [
    # --- GANCHO -------------------------------------------------------
    # Primeiro frame = casa pronta (drone), antes da primeira palavra.
    # Termina no terreno vazio para suspense de preço.
    ("c1", None, 0,
     "Quanto custa, de verdade, uma kitnet | de vinte e cinco metros quadrados? | Esquece o que te falaram.", [
        ("fachada",    "drone", None,    None),
        ("casaAberta", "cima",  [0, 1],  card("Kitnet 25 m²", valor="1 cômodo · banheiro · cozinha americana")),
        ("terreno",    "geral", None,    card("Quanto custa?", valor="BORA CONTAR", cor="#ffd23f")),
    ]),

    # --- PROJETO ------------------------------------------------------
    # Abertura sobre a prancheta → close na engenheira assinando a ART.
    ("c2", "PROJETO", 3000,
     "Projeto, ART — a assinatura do engenheiro — | e alvará: três mil reais.", [
        ("projeto", "cima", [0, 0.85], None),
        ("projeto", "lado", [0.85, 1], card("Projeto + ART + alvará", num=3000, prefixo=R)),
    ]),

    # --- RADIER -------------------------------------------------------
    # Malha de aço no chão (armadura) → concreto saindo da betoneira → card surpresa.
    # Fato-surpresa: o radier já nivela o piso e economiza até R$ 10 mil vs. sapatas.
    ("c3", "RADIER", 5000,
     "Você lança o radier — | laje no chão que já nivela o piso. | Cinco mil reais. Economiza até dez mil.", [
        ("armadura",    "cima",     [0, 0.4], None),
        ("armadura",    "macro",    [0.4, 0.8], None),
        ("concretagem", "betoneira",[0.8, 1], card("Radier 25 m²", num=5000, prefixo=R, sub="economiza até R$ 10 mil vs. sapatas")),
    ]),

    # --- PAREDES ------------------------------------------------------
    # Vista geral dos blocos subindo → close no assentamento → lateral com card.
    ("c4", "PAREDES", 6200,
     "Você levanta mil e seiscentos blocos cerâmicos. | São sessenta metros quadrados de parede. | Seis mil e duzentos reais.", [
        ("alvenaria", "geral",   [0, 0.4],   None),
        ("alvenaria", "close",   [0.4, 0.8], None),
        ("alvenaria", "lateral", [0.8, 1],   card("1.600 blocos cerâmicos", num=6200, prefixo=R, sub="60 m² de parede")),
    ]),

    # --- ESTRUTURA ----------------------------------------------------
    # Pilar na quina (aberto) → close na verga sobre a janela.
    ("c5", "ESTRUTURA", 2500,
     "Pilares e cintas de amarração travam tudo junto. | Dois mil e quinhentos reais.", [
        ("estrutura", "quina",  [0, 0.5], None),
        ("estrutura", "janela", [0.5, 1], card("Pilares + cintas de amarração", num=2500, prefixo=R)),
    ]),

    # --- LAJE ---------------------------------------------------------
    # Vista de cima da laje sendo montada → por dentro com as escoras e card.
    ("c6", "LAJE", 4800,
     "Laje treliçada fecha o teto. | Com nervuras de ferro. Quatro mil e oitocentos.", [
        ("laje",        "cima",   [0, 1], None),
        ("lajeEscoras", "dentro", None,   card("Laje treliçada 25 m²", num=4800, prefixo=R)),
    ]),

    # --- TELHADO ------------------------------------------------------
    # Madeiramento de cima → close nas telhas com card.
    ("c7", "TELHADO", 4200,
     "Madeiramento e quinhentas e cinquenta telhas. | Quatro mil e duzentos reais.", [
        ("telhado", "madeira", [0, 0.5], None),
        ("telhado", "telhas",  [0.5, 1], card("≈ 550 telhas cerâmicas", num=4200, prefixo=R, sub="madeiramento + telha")),
    ]),

    # --- INSTALAÇÕES --------------------------------------------------
    # MOMENTO UAU: "quase todo mundo erra aqui".
    # Vista aérea dos conduítes → close no banheiro com canos aparentes.
    ("c8", "INSTALAÇÕES", 8000,
     "Quase todo mundo erra aqui: | elétrica mais hidráulica somam oito mil reais.", [
        ("instalacoes", "cima",     [0, 0.6], None),
        ("instalacoes", "banheiro", [0.6, 1], card("Elétrica + hidráulica", num=8000, prefixo=R, sub="quase todo mundo erra aqui")),
    ]),

    # --- REBOCO -------------------------------------------------------
    # Fachada com camadas avançando → rente à parede → vista aberta com card.
    ("c9", "REBOCO", 7000,
     "Você aplica chapisco e reboco — | as camadas que alisam as paredes. | Cem metros quadrados. Sete mil reais.", [
        ("reboco",     "fachada", [0, 0.4],   None),
        ("reboco",     "rente",   [0.4, 0.8], None),
        ("casaAberta", "cima",    [0.8, 1],   card("Chapisco + reboco", num=7000, prefixo=R, sub="100 m² (interno + externo)")),
    ]),

    # --- PISO E ESQUADRIAS --------------------------------------------
    # Vista de cima do porcelanato sendo assentado → close na porta.
    ("c10", "PISO E ESQUADRIAS", 8300,
     "Contrapiso, porcelanato e esquadrias — | porta e duas janelas. Oito mil e trezentos reais.", [
        ("piso", "cima",  [0, 0.6], None),
        ("piso", "porta", [0.6, 1], card("Contrapiso + porcelanato + esquadrias", num=8300, prefixo=R, sub="porta + 2 janelas")),
    ]),

    # --- PINTURA, BANHEIRO E COZINHA ----------------------------------
    # Fachada sendo pintada (aberto) → close no pintor.
    ("c11", "PINTURA, BANHEIRO E COZINHA", 5700,
     "Pintura, banheiro completo | e cozinha americana. Cinco mil e setecentos reais.", [
        ("pintura", "fachada", [0, 0.6], None),
        ("pintura", "pintor",  [0.6, 1], card("Pintura + banheiro + cozinha americana", num=5700, prefixo=R)),
    ]),

    # --- TOTAL --------------------------------------------------------
    # 7 planos curtos: revelação → total → aluguel → retorno → comparação → payback → CTA.
    # Loop visual: fachada/drone em c12 ecoa c1.
    ("c12", None, 0,
     "Parabéns: você construiu. | Uma kitnet de vinte e cinco metros. | "
     "O custo total: sessenta e cinco mil reais. | "
     "Aluga por oitocentos reais por mês. | "
     "O retorno é quatorze vírgula oito ao ano. | "
     "Dobro do mercado, em sete anos se paga. | "
     "Você faria isso no fundo de casa?", [
        ("casaCorte",  "frente", None,   None),
        ("casaAberta", "cima",   [0, 1], None),
        ("casaCorte",  "sala",   None,   card("Total sem terreno", num=65000, prefixo=R, sub="interior Sudeste/Sul, out/2026")),
        ("fachada",    "baixa",  None,   card("Aluguel típico", num=800, prefixo=R, sufixo="/mês")),
        ("fachada",    "drone",  None,   card("Yield bruto", valor="14,8% ao ano", sub="dobro do mercado (FipeZAP 6,74%)", cor="#2fbf71")),
        ("terreno",    "geral",  None,   card("Payback", valor="7 anos")),
        ("terreno",    "ze",     None,   None),
    ]),
]

rot = {
    "id": "kitnet-de-25-m-para-alugar",
    "serie": "Você construiu",
    "titulo": "KITNET DE 25 m² DO ZERO",
    "linha2": "quanto custa e quanto RENDE?",
    "elevenlabs": {
        "voz_id": "5Ny27k6jpd2wJTdmbFsb",
        "modelo": "eleven_multilingual_v2",
        "ajustes": {
            "stability": 0.45,
            "similarity_boost": 0.8,
            "style": 0.4,
            "use_speaker_boost": True,
            "speed": 1.15,
        },
    },
    "fontes": "roteiros/kitnet-de-25-m-para-alugar.pesquisa.md",
    "monetizacao": {
        "afiliados": [
            {"produto": "blocos cerâmicos"},
            {"produto": "cimento e areia"},
            {"produto": "kit banheiro (vaso+pia+chuveiro)"},
            {"produto": "porcelanato"},
            {"produto": "tinta"},
            {"produto": "porta e janelas de alumínio"},
        ]
    },
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
    c["destaques"] = ["mil", "reais", "metros", "total", "parabéns", "radier", "dobro", "anos", "surpresa"]
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

json.dump(rot, open("roteiros/kitnet-de-25-m-para-alugar.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
chars = sum(len(c["texto"]) for c in rot["cenas"])
print("cenas", len(rot["cenas"]), "planos", sum(len(c["planos"]) for c in rot["cenas"]),
      "caracteres", chars, "total", sum(c.get("custo", 0) for c in rot["cenas"]))
