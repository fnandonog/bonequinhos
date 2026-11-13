"""Gera roteiros/quanto-custa-construir-um-viaduto.json a partir do storyboard abaixo.
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
Cenários em src/v4/viaduto.tsx (prefixo "vd"), peças em src/v4/viaduto-pecas.tsx.
Números: roteiros/quanto-custa-construir-um-viaduto.pesquisa.md (referência: viaduto de Hortolândia-SP, 385 m, R$ 57 mi)."""
import json

def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c

R = "R$ "
C = "≈ R$ "
ID = "quanto-custa-construir-um-viaduto"
CENAS = [
    ("c1", None, 0, "Um metro desse viaduto custa mais que uma casa. | São trezentos e oitenta e cinco metros, em Hortolândia, | por cima do trem.", [
        ("vdCidade", "drone", None, None),
        ("vdCidade", "lateral", None, card("Viaduto em Hortolândia-SP", valor="385 m", sub="4 faixas · 21 m de largura")),
        ("vdTerreno", "geral", [0, 1], card("Antes da obra", valor="LINHA DO TREM", cor="#ffd23f", sub="o viaduto passa por cima dela")),
    ]),
    ("c2", "SONDAGEM E PROJETO", 1550000, "Primeiro, você testa o chão. | Um martelo de sessenta e cinco quilos | bate num tubo, | e quanto menos o tubo afunda, mais firme o chão. | Com o projeto, cerca de um milhão e meio.", [
        ("vdSondagem", "geral", [0, 0.25], None),
        ("vdSondagem", "martelo", [0.25, 0.5], card("Martelo da sondagem", num=65, sufixo=" kg", sub="cai de 75 cm a cada pancada")),
        ("vdSondagem", "tripe", [0.5, 0.6], None),
        ("vdSolo", "corte", [0.6, 0.9], card("Tubo afundou pouco?", valor="CHÃO FIRME", sub="teste a cada metro de furo")),
        ("vdSondagem", "projeto", [0.9, 1], card("Sondagem + projeto", num=1550000, prefixo=C)),
    ]),
    ("c3", "DESVIO DO TRÂNSITO", 3000000, "Aí você fecha a rua de madrugada. | Desvio e pátio da obra custam uns três milhões.", [
        ("vdDesvio", "geral", [0, 0.6], card("Obra de viaduto em BH", valor="23h às 4h30", sub="faixas fechadas de madrugada")),
        ("vdDesvio", "cones", [0.6, 1], card("Canteiro + desvio", num=3000000, prefixo=C)),
    ]),
    ("c4", "ESTACAS E BLOCOS", 5000000, "Agora as estacas, os pés do viaduto. | Uma rosca gigante fura a terra e enche de concreto. | Umas cento e vinte, | presas no topo por blocos, custam uns cinco milhões.", [
        ("vdEstaca", "rosca", [0, 0.45], None),
        ("vdEstacaCorte", "corte", [0.45, 1], card("Cada estaca", valor="Ø 80 cm", sub="≈ R$ 560 por metro furado")),
        ("vdEstaca", "campo", [0.4, 1], card("Estacas", num=120, prefixo="≈ ")),
        ("vdBloco", "geral", [0, 1], card("Estacas + blocos", num=5000000, prefixo=C)),
    ]),
    ("c5", "PILARES", 3000000, "Os pilares têm sete metros. | A surpresa? A estaca embaixo tem vinte e dois. | Uns três milhões.", [
        ("vdPilar", "forma", [0, 1], card("Pilar", num=7, prefixo="≈ ", sufixo=" m")),
        ("vdRaiz", "desce", [0, 1], card("Estaca", num=22, sufixo=" m", sub="3 vezes o pilar, debaixo da terra", cor="#ffd23f")),
        ("vdPilar", "fileira", [1, 1], card("20 pilares", num=3000000, prefixo=C)),
    ]),
    ("c6", "VIGAS", 17000000, "O mais caro são as vigas, de pilar a pilar. | Quase noventa, sessenta toneladas cada. | Dois guindastes erguem cada uma. | Uns dezessete milhões.", [
        ("vdCarreta", "geral", [0.3, 0.5], None),
        ("vdCarreta", "viga", [0.5, 1], card("Vigas de concreto", num=88, prefixo="≈ ", sub="35 m e ≈ 60 t cada")),
        ("vdIcamento", "gancho", [0.2, 0.75], card("Guindastes", num=2, sub="içamento costuma ser de madrugada")),
        ("vdIcamento", "encaixe", [0.75, 1], card("Vigas + guindastes", num=17000000, prefixo=C)),
    ]),
    ("c7", "TABULEIRO", 8000000, "O tabuleiro, o chão do viaduto, | é feito de placas prontas e quase duzentos caminhões de concreto. | Uns oito milhões.", [
        ("vdTabuleiro", "bomba", [0, 0.35], None),
        ("vdTabuleiro", "fila", [0.35, 0.75], card("Concreto da laje", num=1550, prefixo="≈ ", sufixo=" m³", sub="quase 200 caminhões-betoneira")),
        ("vdTabuleiro", "cima", [0.75, 1], card("Tabuleiro", num=8000000, prefixo=C, sub="8.085 m² de laje")),
    ]),
    ("c8", "JUNTAS E APOIOS", 700000, "O viaduto respira, sabia? | No calor, estica uns onze centímetros. Daí as juntas, frestas na pista, | e apoios de borracha. | Uns setecentos mil.", [
        ("vdJunta", "geral", [0, 0.3], None),
        ("vdJunta", "abre", [0.3, 1], card("Dilatação no calor", num=11, prefixo="≈ ", sufixo=" cm")),
        ("vdApoio", "explodido", [0, 0.8], card("Apoios de borracha", num=176, sub="neoprene com chapas de aço")),
        ("vdApoio", "close", [0.8, 1], card("Juntas + apoios", num=700000, prefixo=C)),
    ]),
    ("c9", "ACABAMENTO", 2750000, "Vem o asfalto, | a mureta contra carro desgovernado, | postes e ralos. Quase três milhões.", [
        ("vdAcabamento", "asfalto", [0, 0.45], card("Asfalto", num=400, sufixo=" m³")),
        ("vdAcabamento", "mureta", [0.45, 0.8], card("Mureta New Jersey", num=770, sufixo=" m")),
        ("vdAcabamento", "postes", [0.8, 1], card("Acabamento", num=2750000, prefixo=C)),
    ]),
    ("c10", "RAMPAS E REDES", 16000000, "Rampas nas pontas e canos mudando de lugar, uns dez milhões. | Mais seis de gerência e imprevistos.", [
        ("vdAcessos", "redes", [0, 0.6], card("Rampas + redes", num=10000000, prefixo=C)),
        ("vdAcessos", "aereo", [0.6, 1], card("Com gerência e imprevistos", num=16000000, prefixo=C, sub="10 mi + 6 mi")),
    ]),
    ("c11", None, 0, "Parabéns, você construiu um viaduto. | Cinquenta e sete milhões. | Cento e quarenta e oito mil | por metro.", [
        ("vdCidade", "drone2", None, None),
        ("vdCidadeNoite", "geral", None, card("Total do viaduto", num=57000000, prefixo=R, sub="385 m · Hortolândia-SP, 2026")),
        ("vdMetro", "geral", None, card("Cada metro", num=148000, prefixo=C)),
        ("vdMetroCasa", "geral", None, card("Casa de 50 m²", num=135000, prefixo=C, sub="1 metro de viaduto custa mais")),
    ]),
    ("c12", None, 0, "Em dois mil e treze, a prefeitura falava em trinta. Saiu quase o dobro. Vale o que custou? Comenta aí.", [
        ("vdCidade", "drone3", None, card("Estimativa de 2013", num=30000000, prefixo=R, sub="saiu por R$ 57 mi em 2026")),
    ]),
]

rot = {
    "id": ID,
    "serie": "Você construiu",
    "titulo": "VIADUTO DE 385 m",
    "linha2": "quanto custa DE VERDADE?",
    "elevenlabs": {"voz_id": "ZqE9vIHPcrC35dZv0Svu", "modelo": "eleven_multilingual_v2",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.15}},
    "fontes": f"roteiros/{ID}.pesquisa.md",
    # legendista (legenda do post e título do Shorts)
    "post": {"legenda": "Um metro desse viaduto custa mais que uma casa inteira 🏗️\n\nSão 385 metros em Hortolândia-SP, passando por cima da linha do trem. Somando sondagem, 120 estacas, 88 vigas de 60 toneladas cada e o resto, deu R$ 57 milhões. Isso dá uns R$ 148 mil por metro, mais que uma casa de 50 m².\n\nQual é o viaduto da sua cidade? Você acha que vale o que custou? Comenta aí 👇\n\nMateriais e ferramentas em oferta no Telegram do Zé: link na bio\n\n#construcao #obra #quantocusta #casapropria #viaduto #engenhariacivil #hortolandia", "titulo_youtube": "Viaduto de R$ 57 milhões: 1 metro custa mais que uma casa #shorts"},
    "monetizacao": {"afiliados": [
        "capacete de segurança com jugular", "colete refletivo", "trena a laser", "nível a laser",
        "cone de sinalização", "fita zebrada", "luva de vaqueta", "bota de segurança com bico de aço",
        "lanterna de cabeça (obra à noite)", "livro de pontes e viadutos para engenharia",
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
    DESTAQUES = ["mil", "milhões", "milhão", "metros", "metro", "quilos", "toneladas", "centímetros", "viaduto", "estacas", "estaca",
                 "vigas", "viga", "surpresa", "parabéns", "reais", "sondagem", "pilares", "tabuleiro", "respira", "chão", "dobro", "casa", "trem",
                 "martelo", "madrugada", "guindastes", "juntas", "caminhões", "imprevistos", "comenta"]
    palavras = {w.strip(".,:!?;").lower() for w in c["texto"].split()}
    c["destaques"] = [d for d in DESTAQUES if d in palavras]
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
