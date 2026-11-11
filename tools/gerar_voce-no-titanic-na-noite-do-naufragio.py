"""Gera roteiros/voce-no-titanic-na-noite-do-naufragio.json (formato Você na História, motor src/historia).
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
(O "|" sai do texto antes de ir para a narração.)
Card de topo: ano + lugar de cada cena (campos "quando" e "onde"). Cenários em src/historia/titanic.tsx."""
import json

def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c

ID = "voce-no-titanic-na-noite-do-naufragio"
ANO = "1912"
VERM = "#ff5d5d"
OURO = "#ffd23f"
VERDE = "#5ad17a"
GELO = "#8fd3ff"
# (id, quando, onde, texto com |, planos[(set, cam, p, card)])
CENAS = [
    ("c1", ANO, "ATLÂNTICO NORTE", "Duas mil e duzentas pessoas num navio. | Bote salva-vidas pra metade. | E você está a bordo do Titanic.", [
        ("ti_navio", "drone", None, card("Pessoas a bordo", num=2224, sub="passageiros e tripulação")),
        ("ti_botes", "metade", [0, 0.1], card("Lugares nos botes", num=1178, sub="pra 2.224 pessoas", cor=VERM)),
        ("ti_navio", "ze", None, None),
    ]),
    ("c2", "ABRIL 1912", "SOUTHAMPTON, INGLATERRA", "Como veio parar aqui? Você é imigrante, vendeu tudo pra recomeçar nos Estados Unidos. | Comprou a passagem mais barata, de terceira classe: sete libras, o dinheiro inglês. | E embarca no maior navio do mundo.", [
        ("ti_cais", "geral", [0, 0.35], None),
        ("ti_cais", "passagem", [0.35, 0.7], card("Passagem de terceira classe", valor="£7", sub="a mais barata do navio")),
        ("ti_cais", "casco", [0.7, 1], card("Titanic", valor="269 METROS", sub="o maior navio do mundo")),
    ]),
    ("c3", ANO, "TERCEIRA CLASSE", "Sua cabine é lá embaixo, perto das máquinas. | Pra uns setecentos passageiros, só duas banheiras. | Na primeira classe, uma suíte custou oitocentas e setenta libras.", [
        ("ti_cabine", "geral", None, None),
        ("ti_banheira", "fila", None, card("Banheiras na terceira classe", valor="2", sub="pra uns 700 passageiros", cor=OURO)),
        ("ti_primeira", "escada", None, card("Suíte da primeira classe", valor="£870", sub="mais de 100 vezes a sua passagem")),
    ]),
    ("c4", "14 ABR 1912", "ATLÂNTICO NORTE", "Quatro dias depois, onze e quarenta da noite. | O vigia, no alto do mastro, grita: iceberg! | Iceberg é uma montanha de gelo solta no mar. | O navio raspa nele, e entra água.", [
        ("ti_gavea", "vigia", [0, 0.5], card("14 de abril, de noite", valor="23h40")),
        ("ti_gavea", "frente", [0.5, 1], None),
        ("ti_iceberg", "geral", [0, 0.45], card("Iceberg", valor="MONTANHA DE GELO", sub="solta no mar", cor=GELO)),
        ("ti_iceberg", "raspa", [0.45, 1], None),
    ]),
    ("c5", "15 ABR 1912", "CONVÉS DOS BOTES", "A surpresa: são só vinte botes, com lugar pra mil cento e setenta e oito. | Tudo dentro da lei! | A lei pedia só dezesseis. | O primeiro bote desce nem metade cheio.", [
        ("ti_botes", "geral", [0, 0.4], card("Botes salva-vidas", num=20, sub="1.178 lugares")),
        ("ti_botes", "lei", [0.4, 0.6], card("E estava tudo", valor="DENTRO DA LEI", cor=OURO)),
        ("ti_botes", "dezesseis", [0.6, 1], card("A lei pedia", valor="16 BOTES", sub="o Titanic levava 20")),
        ("ti_bote", "desce", [0, 1], card("Primeiro bote", valor="NEM METADE CHEIO", sub="cabiam 65 pessoas", cor=VERM)),
    ]),
    ("c6", "15 ABR 1912", "TERCEIRA CLASSE", "A regra: mulheres e crianças primeiro. | Mas você está lá no fundo, num labirinto de corredores. | Da primeira classe, sessenta e dois por cento se salvam. | Da terceira, só vinte e cinco.", [
        ("ti_bote", "mulheres", [0, 0.02], None),
        ("ti_corredor", "ze", [0, 1], None),
        ("ti_placar", "primeira", [0, 0.5], card("Salvos da primeira classe", valor="62%", cor=VERDE)),
        ("ti_placar", "terceira", [0.5, 1], card("Salvos da terceira classe", valor="25%", cor=VERM)),
    ]),
    ("c7", "15 ABR 1912", "ATLÂNTICO NORTE", "Duas e vinte da manhã, o Titanic afunda. | A água: dois graus abaixo de zero. | Mais de mil e quinhentas pessoas morrem.", [
        ("ti_naufragio", "geral", [0, 0.6], card("15 de abril", valor="2h20", sub="2 h 40 depois da batida")),
        ("ti_agua", "bote", None, card("Água do mar", valor="-2 °C", cor=GELO)),
        ("ti_naufragio", "popa", [0.6, 1], card("Mortos", valor="MAIS DE 1.500", cor=VERM)),
    ]),
    ("c8", ANO, "ATLÂNTICO NORTE", "Passagem de sete libras. | Bote pra só metade. | Você aguentaria?", [
        ("ti_fim", "aereo", None, card("Sua passagem", valor="£7")),
        ("ti_fim", "botes", None, card("Bote pra", valor="SÓ METADE", cor=VERM)),
        ("ti_fim", "ze", None, None),
    ]),
]

DESTAQUES = ["duas", "mil", "metade", "titanic", "imigrante", "sete", "libras", "terceira", "banheiras", "oitocentas", "primeira",
             "onze", "quarenta", "iceberg", "gelo", "água", "surpresa", "vinte", "dezesseis", "lei", "sessenta", "cinco", "mulheres",
             "crianças", "zero", "quinhentas", "aguentaria", "setecentos"]

rot = {
    "id": ID,
    "serie": "Você na História",
    "perfil": "historia",
    "titulo": "VOCÊ NO TITANIC",
    "linha2": "você aguentaria?",
    "quando": ANO,
    "onde": "ATLÂNTICO NORTE",
    # narração de TESTE (grátis, edge-tts)
    "voz": "pt-BR-AntonioNeural",
    "velocidade": "+10%",
    # voz da produção (Arthur no ElevenLabs), ajustes do casa-50m2
    "elevenlabs": {"voz_id": "5lrBPYY4YvMbKHTo8kvZ", "modelo": "eleven_flash_v2_5",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.15}},
    "fontes": f"roteiros/{ID}.pesquisa.md",
    "monetizacao": {"afiliados": [
        "livro: Titanic, uma noite para recordar (Walter Lord)", "livro: Titanic (história do naufrágio)",
        "maquete/LEGO do Titanic", "quebra-cabeça 3D do Titanic", "filme Titanic (1997) em Blu-ray",
    ]},
    "cenas": [],
}
for cid, quando, onde, texto, planos in CENAS:
    partes = [p.strip() for p in texto.split("|")]
    idx, n = [], 0
    for parte in partes:
        idx.append(n)
        n += len(parte.split())
    assert len(idx) == len(planos), (cid, len(idx), len(planos))
    c = {"id": cid, "texto": " ".join(partes), "quando": quando, "onde": onde, "destaques": DESTAQUES, "planos": []}
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
