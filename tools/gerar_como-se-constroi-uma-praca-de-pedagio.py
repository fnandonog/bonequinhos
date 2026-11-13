"""Gera roteiros/como-se-constroi-uma-praca-de-pedagio.json a partir do storyboard abaixo.
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
Cenários em src/v4/praca.tsx (prefixo "pp"), entram em SETS por PP_SETS (src/v4/sets.tsx).
Números: roteiros/como-se-constroi-uma-praca-de-pedagio.pesquisa.md
Referência: praça de pedágio nova com 12 cabines, R$ 11 milhões."""
import json

def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c

R = "R$ "
C = "≈ R$ "
ID = "como-se-constroi-uma-praca-de-pedagio"

# Storyboard: (id_cena, etapa, custo, texto_com_cortes, lista_de_planos)
# Plano: (set, cam, faixa_p_ou_None, card_ou_None)
# Faixa p: progresso da ação dentro do plano [0..1]; None = automático pelo gerador
# Cortes ("|") devem coincidir com o número de planos - 1

CENAS = [
    # --- c1: GANCHO ---
    # 1º quadro: close do sensor sendo encravado no asfalto com seta apontando para ele
    # Paradoxo na 1ª frase: sensores enterrados custam mais que a cobertura de 60 t
    ("c1", None, 0,
     "Você vai gastar mais com sensores enterrados no asfalto | do que com aquela cobertura de sessenta toneladas de aço | que todo mundo vê.",
     [
         ("ppSensor", "close",    None,       card("Sensor no asfalto", valor="mais caro que a marquise", cor="#ff5d5d")),
         ("ppIcamento", "viga",   None,       None),
         ("ppFinal",  "drone",    None,       card("Marquise de aço", num=60, sufixo=" t")),
     ]),

    # --- c2: PROJETO E LICENÇAS ---
    ("c2", "PROJETO E LICENÇAS", 500000,
     "Antes de virar um centímetro de terra, | você já gastou quinhentos mil reais | em projetos de engenharia e licenças ambientais.",
     [
         ("ppTerreno", "geral",   [0, 0.4],   None),
         ("ppTerreno", "projeto", [0.4, 0.75], None),
         ("ppTerreno", "aerea",   [0.75, 1],  card("Projeto + licenças", num=500000, prefixo=C)),
     ]),

    # --- c3: TERRAPLANAGEM ---
    ("c3", "TERRAPLANAGEM", 1500000,
     "A pista tem quatorze metros. | Você alarga até oitenta | pra encaixar todas as cabines. Um milhão e meio.",
     [
         ("ppTerreno",       "lateral",        [0, 0.4],   card("Pista existente", num=14, sufixo=" m")),
         ("ppTerraplanagem", "motoniveladora", [0.4, 0.75], None),
         ("ppTerraplanagem", "cima",           [0.75, 1],  card("Terraplanagem", num=1500000, prefixo=C, sub="pista vai a 80 m de largura")),
     ]),

    # --- c4: DRENAGEM ---
    ("c4", "DRENAGEM", 700000,
     "Você enterra galerias de concreto por baixo da pista | pra escoar a chuva da praça. Setecentos mil que ninguém vai ver nunca.",
     [
         ("ppDrenagem", "galeria", [0, 0.55],   None),
         ("ppDrenagem", "corte",   [0.55, 1],   card("Galerias de drenagem", num=700000, prefixo=C)),
     ]),

    # --- c5: PAVIMENTO ---
    # Corte explodido mostrando 3 camadas; depois a vibroacabadora espalhando CBUQ
    ("c5", "PAVIMENTO", 2000000,
     "O asfalto da sua praça tem cinquenta centímetros de espessura | porque caminhão pesado vai frear em cima dele toda hora. Dois milhões.",
     [
         ("ppPavimento", "camadas", [0, 0.5],  card("Espessura total", num=50, sufixo=" cm", sub="sub-base · base · CBUQ")),
         ("ppPavimento", "maquina", [0.5, 1],  card("Pavimento", num=2000000, prefixo=C)),
     ]),

    # --- c6: MARQUISE ---
    # Câmera mergulha do guindaste até o encaixe final da viga — "por dentro" da estrutura
    ("c6", "MARQUISE", 1200000,
     "Você levanta cada viga com guindaste. | São oitenta metros de aço no ar | pra proteger as cabines da chuva. Um milhão e duzentos.",
     [
         ("ppIcamento", "guindaste", [0, 0.4],   None),
         ("ppIcamento", "viga",      [0.4, 0.75], card("Marquise metálica", num=80, sufixo=" m de aço")),
         ("ppMarquise", "final",     [0.75, 1],   card("Marquise + estrutura", num=1200000, prefixo=C)),
     ]),

    # --- c7: CABINES ---
    ("c7", "CABINES", 900000,
     "Você recebe doze cabines já prontas de fábrica. | Cada uma chega num caminhão | e é parafusada no lugar em horas. Novecentos mil.",
     [
         ("ppCabine", "caminhao", [0, 0.35],   card("Cabines pré-fabricadas", num=12, sub="chegam prontas de fábrica")),
         ("ppCabine", "descida",  [0.35, 0.7],  None),
         ("ppCabine", "fileira",  [0.7, 1],     card("Cabines", num=900000, prefixo=C)),
     ]),

    # --- c8: SISTEMA ELETRÔNICO (o mais caro) ---
    # Corte do asfalto → sensor embaixo → antena em cima → total com comparação do posto de gasolina
    ("c8", "SISTEMA ELETRÔNICO", 2500000,
     "Você encrava sensores no asfalto | que contam os eixos do veículo e definem a tarifa. | Uma antena lê o Sem Parar sem o carro parar. | Dois milhões e meio, mais caro do que um posto de gasolina.",
     [
         ("ppSensor", "encravar",  [0, 0.3],    None),
         ("ppSensor", "corte",     [0.3, 0.6],  card("Sensor piezoelétrico", valor="conta os eixos", sub="embutido no asfalto")),
         ("ppAntena", "marquise",  [0.6, 0.85], card("Antena na marquise", valor="lê o Sem Parar")),
         ("ppAntena", "geral",     [0.85, 1],   card("Sistema eletrônico", num=2500000, prefixo=C, sub="+ caro que um posto de gasolina")),
     ]),

    # --- c9: ACABAMENTO ---
    ("c9", "ACABAMENTO", 1700000,
     "Você cobre com luminárias de LED, | sinaliza o chão e constrói a guarita do operador. Um milhão e setecentos mil.",
     [
         ("ppAcabamento", "postes",  [0, 0.45],  None),
         ("ppAcabamento", "guarita", [0.45, 1],  card("Ilum. + sinaliz. + guarita", num=1700000, prefixo=C)),
     ]),

    # --- c10: PARABÉNS ---
    ("c10", None, 0,
     "Parabéns, você construiu uma praça de pedágio por onze milhões. | Quantos carros têm que pagar pedágio | pra você recuperar tudo isso? Comenta aí.",
     [
         ("ppFinal", "drone",   None, None),
         ("ppFinal", "lateral", None, card("Total da praça", num=11000000, prefixo=R)),
         ("ppNoite", "geral",   None, card("Quantos carros pagando pedágio?", valor="COMENTA AÍ", cor="#ffd23f")),
     ]),
]

rot = {
    "id": ID,
    "serie": "Você construiu",
    "titulo": "PRAÇA DE PEDÁGIO",
    "linha2": "quanto custa DE VERDADE?",
    "elevenlabs": {
        "voz_id": "ZqE9vIHPcrC35dZv0Svu",
        "modelo": "eleven_multilingual_v2",
        "ajustes": {
            "stability": 0.45,
            "similarity_boost": 0.8,
            "style": 0.4,
            "use_speaker_boost": True,
            "speed": 1.15,
        },
    },
    "fontes": f"roteiros/{ID}.pesquisa.md",
    "post": {
        "legenda": (
            "O sistema eletrônico custou mais que toda a obra civil 🤯\n\n"
            "São 12 cabines, 80 metros de marquise de aço e sensores enterrados no asfalto que contam os eixos "
            "do seu carro em milissegundos. No total: R$ 11 milhões.\n\n"
            "Quantos carros têm que pagar pedágio pra amortizar tudo isso? Comenta aí 👇\n\n"
            "Materiais e ferramentas em oferta no Telegram do Zé: link na bio\n\n"
            "#construcao #obra #pedagio #quantocusta #engenhariacivil #infraestrutura"
        ),
        "titulo_youtube": "Praça de pedágio por R$ 11 milhões: o mais caro você não vê #shorts",
    },
    "monetizacao": {
        "afiliados": [
            "capacete de segurança com jugular",
            "colete refletivo",
            "cone de sinalização",
            "fita zebrada",
            "luva de vaqueta",
            "bota de segurança com bico de aço",
            "motoniveladora em miniatura (maquete/presente)",
            "livro de pavimentação e obras rodoviárias",
            "sensor de distância a laser",
            "transponder / tag Sem Parar",
        ],
    },
    "cenas": [],
}

DESTAQUES = [
    "sensores", "asfalto", "cobertura", "toneladas", "terra", "quinhentos",
    "mil", "milhões", "milhão", "metros", "metro", "pista", "oitenta",
    "cabines", "cabine", "viga", "guindaste", "galerias", "centímetros",
    "espessura", "LED", "guarita", "operador", "parabéns", "comenta",
    "gasolina", "posto", "Sem Parar", "eixos",
]

for cid, etapa, custo, texto, planos in CENAS:
    partes = [p.strip() for p in texto.split("|")]
    assert len(partes) == len(planos), f"{cid}: {len(partes)} partes vs {len(planos)} planos"
    idx, n = [], 0
    for parte in partes:
        idx.append(n)
        n += len(parte.split())
    c = {"id": cid, "texto": " ".join(partes)}
    if etapa:
        c["etapa"] = etapa
    if custo:
        c["custo"] = custo
    palavras = {w.strip(".,:!?;").lower() for w in c["texto"].split()}
    c["destaques"] = [d for d in DESTAQUES if d.lower() in palavras]
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
total_custo = sum(c.get("custo", 0) for c in rot["cenas"])
print(f"cenas {len(rot['cenas'])}  planos {sum(len(c['planos']) for c in rot['cenas'])}  chars {chars}  total R$ {total_custo:,.0f}")
