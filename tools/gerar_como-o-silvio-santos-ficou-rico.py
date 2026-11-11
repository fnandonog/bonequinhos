"""Gera roteiros/como-o-silvio-santos-ficou-rico.json (formato Como Ficou Rico, motor src/rico).
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
Topo: ano + o que ele já tem (o "patrimônio" que vai sendo construído). Vira número só quando há fonte
(ver roteiros/como-o-silvio-santos-ficou-rico.pesquisa.md)."""
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

# topo: (ano, patrimônio) -> patrimônio é texto (o que ele tem) ou número em reais (com fonte)
# (id, ano, patrimonio, texto com |, planos[(set, cam, p, card)])
CENAS = [
    ("c1", "1945", "UMA BANCA", "Aos catorze anos, ele vendia capinha na rua. | Morreu com um bilhão e seiscentos milhões de reais. Como?", [
        ("rua", "banca", None, card("Idade", num=14, sufixo=" anos", sub="camelô no Rio")),
        ("fim", "pilha", None, card("Patrimônio na morte", valor="R$ 1,6 BI", sub="Forbes, 2024", cor=OURO)),
    ]),
    ("c2", "1945", "UMA BANCA", "No Rio, o menino Senor Abravanel | vê um homem vendendo capa pra título de eleitor. | E copia a ideia. Você conhece como Silvio Santos.", [
        ("rua", "avenida", [0, 0.3], None),
        ("rua", "capinha", [0.3, 0.7], card("Primeiro produto", valor="CAPA DE TÍTULO", sub="de eleitor")),
        ("ruanome", "nome", [0.7, 1], None),
    ]),
    ("c3", "1948", "UMA BANCA", "Aos dezessete, passa num concurso de locutor de rádio. | Mas larga o emprego: na rua ganhava mais.", [
        ("radio", "geral", [0, 0.5], card("Concurso de locutor", valor="APROVADO", sub="Rádio Guanabara")),
        ("radio", "porta", [0.5, 1], card("Camelô", valor="GANHAVA MAIS", cor=OURO)),
    ]),
    ("c4", "ANOS 50", "ALTO-FALANTES", "Depois, põe alto-falantes nas barcas de Niterói. | Toca música e vende anúncio.", [
        ("barca", "aberto", [0, 0.5], None),
        ("barca", "corneta", [0.5, 1], card("Nas barcas", valor="MÚSICA + ANÚNCIO")),
    ]),
    ("c5", "1958", "O BAÚ", "Um amigo lhe passa um negócio quase falido: | o Baú da Felicidade, carnê de presente pago por mês. | Ele toca tudo de um quarto de pensão e vira o dono.", [
        ("bau", "pensao", [0, 0.35], card("Baú da Felicidade", valor="QUASE FALIDO", cor=VERM)),
        ("bau", "carne", [0.35, 0.65], None),
        ("bau", "dono", [0.65, 1], card("O escritório", valor="QUARTO DE PENSÃO", sub="com um caixote de mesa")),
    ]),
    ("c6", "ANOS 60", "HORÁRIO NA TV", "E aqui vem a surpresa: | pra vender carnê, ele compra horário na TV. | Ninguém pagava ele: ele pagava pra aparecer.", [
        ("tv", "estudio", [0, 0.3], None),
        ("tv", "camera", [0.3, 0.6], None),
        ("tvpaga", "dinheiro", [0.6, 1], card("Horário na TV", valor="ELE PAGAVA", sub="pra anunciar o Baú", cor=OURO)),
    ]),
    ("c7", "1981", "UMA TV", "Vira líder de audiência no domingo. | E inaugura a própria emissora: o SBT.", [
        ("tvplateia", "plateia", [0, 1], card("Domingo", valor="LÍDER", sub="de audiência")),
        ("emissora", "drone", [0, 1], card("Inauguração", valor="19/08/1981", sub="SBT", cor=OURO)),
    ]),
    ("c8", "ANOS 2000", "+30 EMPRESAS", "Vieram mais de trinta empresas, | da Tele Sena até um banco.", [
        ("imperio", "cidade", [0, 0.6], card("Grupo Silvio Santos", num=30, prefixo="+", sufixo=" empresas")),
        ("imperio", "banco", [0.6, 1], None),
    ]),
    ("c9", "2010", -2.5e9, "Até que descobrem que diretores do banco fraudaram as contas: | um rombo de quatro bilhões e trezentos milhões. | Pra não quebrar, pega dois bilhões e meio emprestados | e dá tudo como garantia, até o SBT.", [
        ("rombo", "banco", [0, 0.35], None),
        ("cratera", "buraco", [0.35, 0.65], card("Rombo no banco", valor="R$ 4,3 BI", sub="fraude descoberta em 2010", cor=VERM)),
        ("divida", "geral", [0.65, 0.85], card("Empréstimo", valor="R$ 2,5 BI", sub="Fundo Garantidor de Créditos", cor=VERM)),
        ("garantia", "cadeado", [0.85, 1], card("Garantia", valor="ATÉ O SBT", cor=VERM)),
    ]),
    ("c10", "2013", 2.67e9, "Ele vende o banco e salva a TV. | E estreia na lista de bilionários da Forbes.", [
        ("volta", "vendido", [0, 0.5], card("Banco vendido", valor="R$ 450 MI", sub="ao BTG Pactual, 2011")),
        ("forbes", "grafico", [0.5, 1], card("Forbes 2013", valor="R$ 2,67 BI", sub="59º do Brasil", cor=OURO)),
    ]),
    ("c11", "2024", 1.6e9, "A lição: onde passava gente, ele via um balcão. | Você largaria o emprego fixo pra apostar no seu? Sim ou não?", [
        ("fim", "banca", None, card("A lição", valor="GENTE = BALCÃO", cor=OURO)),
        ("fim", "pergunta", None, card("Largaria o emprego?", valor="SIM OU NÃO?")),
    ]),
]

DESTAQUES = ["catorze", "bilhão", "bilhões", "milhões", "seiscentos", "camelô", "capa", "capinha", "silvio", "santos", "dezessete", "ganhava",
             "alto-falantes", "barcas", "baú", "falido", "caixote", "dono", "surpresa", "pagava", "sbt", "líder", "trinta", "banco",
             "fraude", "rombo", "garantia", "forbes", "lição", "balcão", "sim", "não", "mil", "setecentos", "quatro", "dois"]

rot = {
    "id": ID,
    "serie": "Como Ficou Rico",
    "perfil": "rico",
    "titulo": "DE CAMELÔ A BILIONÁRIO",
    "linha2": "Silvio Santos · R$ 1,6 bilhão",
    # prévia sem voz: python3 tools/estimar.py (narração real só no Mac, com aprovação)
    "voz": "pt-BR-AntonioNeural",
    "velocidade": "+10%",
    "elevenlabs": {"voz_id": "zNEsdgTUa3ndwKry8Xcq", "modelo": "eleven_flash_v2_5",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.15}},
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
