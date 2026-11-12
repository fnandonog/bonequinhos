"""Gera os planos de roteiros/voce-vive-em-pompeia-no-dia-da-erupcao.json (formato Você na História, motor src/historia).
O TEXTO da narração mora aqui (campo `texto` de cada cena). Cada "|" marca um CORTE: o próximo plano começa
na palavra seguinte (`apartir` = índice da palavra, divisão por espaços). Mudou o texto? Apague o áudio narrado
e regrave (ou estime com tools/estimar.py) depois de rodar este script.
Cenários em src/historia/pompeia.tsx (peças em src/historia/pompeia-pecas.tsx)."""
import json

ID = "voce-vive-em-pompeia-no-dia-da-erupcao"
VERM = "#ff5d5d"
OURO = "#ffd23f"


def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c


DESTAQUES = ["sumir", "onze", "mil", "oitenta", "dezessete", "vulcão", "séculos", "trinta", "quilômetros",
             "madrugada", "trezentos", "setenta", "segundos", "plínio", "único", "cem", "cadê", "maioria", "fugiu"]

# (id, quando, onde, texto com |, planos[(set, cam, p, card)])
CENAS = [
    ("c1", "24 AGO 79 d.C.", "POMPEIA",
     "Em menos de um dia, essa cidade vai sumir do mapa. | E você mora nela. | É Pompeia, cidade romana de onze mil pessoas, quase dois mil anos atrás. | E ninguém tem medo da montanha.", [
         ("pom_cidade", "drone", None, None),
         ("pom_rua", "ze", None, None),
         ("pom_cidade", "telhados", None, card("Pompeia", num=11000, sub="moradores em 79 d.C.")),
         ("pom_forum", "vesuvio", None, None),
     ]),
    ("c2", "79 d.C.", "POMPEIA",
     "Fica no sul da Itália, a oito quilômetros da montanha. | Tem praça, banho público | e mais de oitenta lanchonetes de rua. | Muita casa nem tem cozinha, então o povo come fora. | E o pão sai quente da padaria.", [
         ("pom_baia", "baia", None, None),
         ("pom_forum_termas", "geral", None, None),
         ("pom_thermo", "rua", [0, 0.6], card("Lanchonetes de rua", valor="MAIS DE 80", sub="os thermopolia de Pompeia")),
         ("pom_thermo", "potes", [0.6, 1], None),
         ("pom_padaria", "geral", None, None),
     ]),
    ("c3", "79 d.C.", "POMPEIA",
     "O chão anda tremendo. | Dezessete anos antes, um terremoto | derrubou parte da cidade. | Mas ali tremor é normal, e a montanha não solta fogo há séculos.", [
         ("pom_tremor", "chao", None, None),
         ("pom_terremoto", "geral", [0, 0.45], card("Terremoto anterior", valor="62 d.C.", sub="17 anos antes da erupção")),
         ("pom_terremoto", "queda", [0.45, 1], None),
         ("pom_rua_vesuvio", "fundo", None, None),
     ]),
    ("c4", "79 d.C.", "VESÚVIO",
     "Depois do meio-dia, a montanha explode. | É um vulcão, o Vesúvio. | Uma coluna de cinza sobe trinta quilômetros, três vezes a altura de um avião. | Chove pedra-pomes, uma pedra leve e furada. | E a chuva dura a noite inteira.", [
         ("pom_erupcao", "explode", [0, 0.45], None),
         ("pom_erupcao", "coluna", [0.45, 1], None),
         ("pom_pluma", "alto", None, card("Coluna de cinza", valor="30 KM", sub="3 vezes a altura de um avião")),
         ("pom_pomes", "telhados", None, None),
         ("pom_pomes_rua", "ze", None, card("Chuva de pedra-pomes", valor="18 HORAS", sub="a tarde e a noite inteira")),
     ]),
    ("c5", "79 d.C.", "POMPEIA",
     "Muita gente foge durante a chuva. | Quem fica se tranca em casa. | Mas de madrugada, a coluna de cinza desaba. | Desce uma nuvem de gás e cinza, a trezentos graus. | Vem a setenta quilômetros por hora. Ninguém corre tanto. E mata em segundos.", [
         ("pom_porto", "fuga", None, None),
         ("pom_casa", "atrio", None, None),
         ("pom_colapso", "geral", None, card("O dia seguinte", valor="MADRUGADA", sub="a coluna desaba", cor=OURO)),
         ("pom_fluxo", "descida", None, card("Nuvem de gás e cinza", valor="~300 °C", sub="fluxo piroclástico", cor=VERM)),
         ("pom_fluxo_rua", "rua", None, card("Velocidade", valor="~70 KM/H", sub="ninguém corre tanto", cor=VERM)),
     ]),
    ("c6", "79 d.C.", "BAÍA DE NÁPOLES",
     "O chefe da frota romana, Plínio, o Velho, | sai de barco pra salvar gente. | E morre na praia. | O sobrinho dele viu tudo de longe | e foi o único a contar.", [
         ("pom_barca", "geral", None, None),
         ("pom_barca", "plinio", None, None),
         ("pom_praia", "plinio", None, card("Plínio, o Velho", valor="MORRE", sub="tentando resgatar gente", cor=VERM)),
         ("pom_carta", "geral", None, card("Plínio, o Jovem", valor="ÚNICO RELATO", sub="cartas ao historiador Tácito")),
         ("pom_carta", "tabua", None, None),
     ]),
    ("c7", "HOJE", "POMPEIA",
     "Até hoje, acharam uns mil e cem corpos. | Mas a cidade tinha onze mil. Cadê o resto? | A maioria fugiu enquanto chovia pedra. | E você, fugia na hora ou ficava pra salvar sua casa?", [
         ("pom_moldes", "geral", None, card("Corpos achados", num=1150, sub="muitos viraram moldes de gesso")),
         ("pom_ruinas", "aereo", None, card("Pompeia tinha", num=11000, sub="moradores")),
         ("pom_moldes", "close", None, card("A maioria", valor="FUGIU A TEMPO", cor=OURO)),
         ("pom_ruinas_ze", "ze", None, None),
     ]),
]

PAGINA = """🌋 Você vive em Pompeia no dia da erupção (79 d.C.)

O CENÁRIO
Pompeia era uma cidade romana de cerca de 11.000 habitantes no sul da Itália, na Baía de Nápoles, a uns 8 km do Vesúvio.

O QUE A HISTÓRIA CONTA
• A data: tradicionalmente 24 de agosto de 79 d.C. (uma inscrição achada em 2018 sugere outubro).
• A cidade: tinha fórum, termas e mais de 80 thermopolia, lanchonetes de rua com balcão de pedra. Muita casa não tinha cozinha.
• O sinal ignorado: um terremoto em 62 d.C. já tinha danificado a cidade. Os tremores voltaram nos dias antes da erupção.
• A erupção: no começo da tarde o Vesúvio explodiu. A coluna de cinza subiu uns 30 km e choveu pedra-pomes por cerca de 18 horas.
• A surpresa: de madrugada a coluna desabou. Nuvens de gás e cinza (fluxos piroclásticos) a cerca de 300 °C e uns 70 km/h chegaram a Pompeia e mataram em segundos.
• Plínio, o Velho: comandante da frota romana, foi de barco resgatar gente na costa e morreu na praia. O sobrinho, Plínio, o Jovem, viu de longe e escreveu as cartas que são o único relato de testemunha.
• Os que fugiram: cerca de 1.150 corpos foram achados em Pompeia. A maioria dos moradores escapou durante a chuva de pedra.

Fontes: Plínio, o Jovem (Cartas a Tácito, VI.16 e VI.20), Parco Archeologico di Pompei, Mastrolorenzo et al. (PLoS ONE, 2010), The Guardian (2020)."""

caminho = f"roteiros/{ID}.json"
rot = json.load(open(caminho, encoding="utf-8"))
novas = []
for cid, quando, onde, texto, planos in CENAS:
    partes = [p.strip() for p in texto.split("|")]
    limpo = " ".join(partes)
    idx, n = [], 0
    for parte in partes:
        idx.append(n)
        n += len(parte.split())
    assert len(idx) == len(planos), (cid, len(idx), len(planos))
    c = {"id": cid, "texto": limpo, "quando": quando, "onde": onde, "destaques": DESTAQUES, "planos": []}
    for (s, cam, p, cd), a in zip(planos, idx):
        pl = {"set": s, "cam": cam}
        if a:
            pl["apartir"] = a
        if p:
            pl["p"] = p
        if cd:
            pl["card"] = cd
        c["planos"].append(pl)
    novas.append(c)
rot["cenas"] = novas
rot["pagina"]["texto"] = PAGINA
json.dump(rot, open(caminho, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("caracteres", sum(len(c["texto"]) for c in novas))

# relatório: duração de cada plano com os tempos do timings.json (estimado ou narrado), se bater com o texto
try:
    tim = json.load(open(f"public/audio/{ID}/timings.json", encoding="utf-8"))
except FileNotFoundError:
    tim = None
if tim and all(len(c["texto"].split()) == len(next(x for x in tim["cenas"] if x["id"] == c["id"])["palavras"]) for c in novas):
    t0 = 0.0
    for c in novas:
        tm = next(x for x in tim["cenas"] if x["id"] == c["id"])
        ini = [tm["palavras"][p["apartir"]]["inicio"] if p.get("apartir") else 0.0 for p in c["planos"]]
        fim = ini[1:] + [tm["duracao"]]
        for p, a, b in zip(c["planos"], ini, fim):
            print(f'{c["id"]} {t0 + a:5.2f}s {b - a:4.2f}s  {p["set"]}/{p["cam"]}  {(p.get("card") or {}).get("rotulo", "")}')
        t0 += tm["duracao"]
    print("planos", sum(len(c["planos"]) for c in novas), "duração", round(t0, 2))
else:
    print("timings.json não bate com o texto: rode python3 tools/estimar.py roteiros/%s.json 0.8 e gere de novo" % ID)
