"""Gera roteiros/como-o-silvio-santos-ficou-rico.json (formato Como Ficou Rico, motor src/rico). VERSÃO 2 (refeita do zero).
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
Cada degrau explica o MECANISMO do dinheiro com número de fonte (ver roteiros/como-o-silvio-santos-ficou-rico.pesquisa.md).
Topo: ano + o que ele já tem; vira número em reais só onde há fonte."""
import json

def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c

ID = "como-o-silvio-santos-ficou-rico"
VERM = "#ff5d5d"
OURO = "#ffd23f"
VERDE = "#4ade80"

# (id, ano, patrimonio (texto = o que tem; número = R$ com fonte), texto com |, planos[(set, cam, p, card)])
CENAS = [
    ("c1", "1945", "UM TABULEIRO",
     "Aos catorze, Silvio Santos vendia capa de documento na rua. | Morreu com um bilhão e seiscentos milhões. Sabe como?", [
        ("rua", "aberto", None, card("Idade", num=14, sufixo=" anos", sub="camelô no centro do Rio")),
        ("escadatopo", "topo", None, card("Fortuna ao morrer", valor="R$ 1,6 BI", sub="Forbes, 2024", cor=OURO)),
    ]),
    ("c2", "1945", "UM TABULEIRO",
     "Rio, 1945: | primeira eleição pra presidente em quinze anos. | Ele compra a capa por dois cruzeiros. | Vende por quatro, jurando que é a última.", [
        ("ruaeleicao", "faixa", None, None),
        ("ruaeleicao", "fila", None, card("Sem votar pra presidente", num=15, sufixo=" anos", sub="6 milhões com título de papel")),
        ("ruacapa", "close", [0, 1], card("Compra", valor="Cr$ 2", sub="a capa de plástico")),
        ("ruavenda", "lado", [0, 1], card("Vende", valor="Cr$ 4", sub="\"é a última\": lucro de 100%", cor=VERDE)),
    ]),
    ("c3", "1948", "UM TABULEIRO",
     "Passa num concurso de rádio: mil e trezentos por mês. | Só que na rua, ele contava, fazia novecentos por dia. Largou.", [
        ("radio", "micro", None, card("Locutor de rádio", valor="Cr$ 1.300", sub="por mês")),
        ("ruacaixa", "roda", [0, 1], card("Camelô", valor="Cr$ 900", sub="por dia, ele contava", cor=OURO)),
    ]),
    ("c4", "ANOS 50", "SOM + BAR NA BARCA",
     "Nas barcas de Niterói, | troca um ano de anúncio por um som. | E um bar: cada refrigerante, uma cartela de bingo.", [
        ("barca", "drone", None, None),
        ("barcasom", "corneta", None, card("Som de graça", valor="1 ANO DE ANÚNCIO", sub="pago à loja que deu o som")),
        ("barcabar", "bar", [0, 1], card("No bar da barca", valor="1 REFRI = 1 CARTELA", sub="de bingo, com prêmio", cor=OURO)),
    ]),
    ("c5", "1958", "O BAÚ",
     "Em São Paulo, salva o Baú da Felicidade, quase falido. | Você paga doze parcelas | e só leva os brinquedos no Natal. | Repara: o dinheiro chega antes.", [
        ("porao", "geral", None, card("Baú da Felicidade", valor="QUASE FALIDO", sub="começou num porão", cor=VERM)),
        ("carne", "topo", [0, 1], card("Carnê", num=12, sufixo=" parcelas", sub="uma por mês")),
        ("natal", "sala", [0, 1], card("Entrega do baú", valor="SÓ NO NATAL")),
        ("fluxo", "trilho", [0, 1], card("O cliente paga", valor="ANTES", sub="e o caixa fica com o dinheiro", cor=VERDE)),
    ]),
    ("c6", "ANOS 60", "O BAÚ + TV",
     "E a surpresa? | Pra vender carnê, ele pagava pra ficar na TV. | O programa era o anúncio, | com oitenta e nove pontos de audiência.", [
        ("auditorio", "aberto", None, None),
        ("horario", "mesa", [0, 1], card("Horário na TV", valor="ELE PAGAVA", sub="pra anunciar o Baú", cor=OURO)),
        ("sala", "ombro", None, card("O programa", valor="= ANÚNCIO", sub="carnê em dia concorria a prêmio")),
        ("plateia", "plateia", None, card("Audiência", num=89, sufixo=" pontos", sub="em 1969", cor=VERDE)),
    ]),
    ("c7", "1981", "UMA EMISSORA",
     "Em 1981, ganha a própria emissora, | o SBT, em quatro cidades.", [
        ("emissora", "drone", None, card("No ar desde", valor="19/08/1981")),
        ("mapa", "cima", [0, 1], card("Decreto de 1981", num=4, sufixo=" cidades", sub="SP · Rio · Porto Alegre · Belém")),
    ]),
    ("c8", "1991", "TV + TELE SENA",
     "Depois, a Tele Sena: | metade volta em um ano, | o resto vira prêmio e lucro.", [
        ("telesena", "cartela", None, card("Tele Sena", valor="1991", sub="título de capitalização")),
        ("telesena", "divide", [0, 0.5], card("Volta pra você", valor="50%", sub="corrigido, depois de 12 meses", cor=VERDE)),
        ("telesena", "divide", [0.5, 1], card("O resto", valor="PRÊMIO + LUCRO", cor=OURO)),
    ]),
    ("c9", "2010", -2.5e9,
     "Em 2010, diretores do banco dele fraudam o balanço. | Rombo de quatro bilhões e trezentos milhões. | Ele não foi acusado, | mas dá as quarenta e quatro empresas em garantia.", [
        ("banco", "diretores", [0, 1], card("Fraude dos diretores", valor="BALANÇO INFLADO", sub="Banco PanAmericano", cor=VERM)),
        ("cofre", "buraco", [0, 1], card("Rombo", valor="R$ 4,3 BI", sub="descoberto em 2010", cor=VERM)),
        ("garantia", "ze", None, card("Silvio Santos", valor="NÃO FOI ACUSADO", sub="7 ex-diretores condenados em 2018")),
        ("garantia", "mesa", None, card("Garantia do empréstimo", valor="44 EMPRESAS", sub="de R$ 2,5 bi, até o SBT", cor=VERM)),
    ]),
    ("c10", "2011", "O SBT",
     "Vende o banco, quita a dívida, salva a TV.", [
        ("garantiasolta", "solta", [0, 1], card("Banco vendido", valor="R$ 450 MI", sub="ao BTG, que assumiu a dívida")),
    ]),
    ("c11", "2024", 1.6e9,
     "Morre em 2024 com um bilhão e seiscentos milhões.", [
        ("escada", "sobe", [0, 1], card("Fortuna (Forbes)", valor="R$ 1,6 BI", sub="agosto de 2024", cor=OURO)),
    ]),
    ("c12", "2024", 1.6e9,
     "O segredo? Receber antes e entregar depois. | Você pagaria um ano adiantado? Sim ou não?", [
        ("carnefinal", "baixo", None, card("O segredo", valor="RECEBER ANTES", sub="e entregar depois", cor=OURO)),
        ("auditorio", "ze", None, card("Pagaria um ano adiantado?", valor="SIM OU NÃO?")),
    ]),
]

DESTAQUES = ["catorze", "silvio", "santos", "bilhão", "bilhões", "milhões", "seiscentos", "1945", "quinze", "seis", "papel", "capa", "dois", "quatro",
             "última", "rádio", "mil", "trezentos", "novecentos", "largou", "barcas", "anúncio", "som", "bar", "refrigerante", "bingo", "baú", "falido",
             "doze", "natal", "antes", "surpresa", "pagava", "anúncio", "oitenta", "nove", "1981", "sbt", "cidades", "tele", "sena", "metade", "prêmio",
             "lucro", "fraudam", "rombo", "acusado", "quarenta", "garantia", "banco", "dívida", "tv", "2024", "segredo", "receber", "sim", "não"]

rot = {
    "id": ID,
    "serie": "Como Ficou Rico",
    "perfil": "rico",
    "titulo": "DE CAMELÔ A BILIONÁRIO",
    "linha2": "Silvio Santos · R$ 1,6 bilhão",
    # prévia sem voz: python3 tools/estimar.py (narração real só no Mac, com aprovação)
    "voz": "pt-BR-AntonioNeural",
    "velocidade": "+10%",
    # voz do canal (plataforma/perfis.json); modelo multilingual v2 (o Flash soou ruim na v1)
    "elevenlabs": {"voz_id": "zNEsdgTUa3ndwKry8Xcq", "modelo": "eleven_multilingual_v2",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True, "speed": 1.1}},
    "fontes": f"roteiros/{ID}.pesquisa.md",
    "monetizacao": {"afiliados": [
        "livro: A Fantástica História de Silvio Santos (Arlindo Silva)", "livro: Silvio Santos: a biografia (Marcia Batista e Anna Medeiros)",
        "livro: Pai Rico, Pai Pobre", "livro: Do mil ao milhão (Thiago Nigro)", "jogo: Banco Imobiliário",
    ]},
    "cenas": [],
}
for cid, ano, pat, texto, planos in CENAS:
    partes = [p.strip() for p in texto.split("|")]
    idx, n = [], 0
    for parte in partes:
        idx.append(n)
        n += len(parte.split())
    assert len(idx) == len(planos), (cid, len(idx), len(planos))
    c = {"id": cid, "texto": " ".join(partes), "ano": ano, "destaques": DESTAQUES, "planos": []}
    if isinstance(pat, str):
        c["tem"] = pat
    else:
        c["patrimonio"] = pat
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
print("cenas", len(rot["cenas"]), "planos", sum(len(c["planos"]) for c in rot["cenas"]), "caracteres", chars)
