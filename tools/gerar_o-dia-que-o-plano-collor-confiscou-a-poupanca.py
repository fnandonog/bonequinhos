"""Gera roteiros/o-dia-que-o-plano-collor-confiscou-a-poupanca.json: PILOTO do formato "Seu Tostão" (perfil rico, motor src/rico).
Narrador: Seu Tostão (1ª pessoa, caixa de banco aposentado) + o papagaio Juros, que interrompe no número mais chocante.
Cenários novos em src/rico/collor.tsx (sets "co*"): varanda, agência de 1990, sala com TV de tubo, supermercado com remarcação,
cofre do Banco Central, mesa do caixa (carimbo da moeda), fila na rua, casa parada, padaria (pão x dinheiro) e tribunal.
Cédulas genéricas (nenhuma cédula real reproduzida). Nada de política partidária: só fatos com fonte.
Cada "|" no texto marca um CORTE. Números: roteiros/o-dia-que-o-plano-collor-confiscou-a-poupanca.pesquisa.md ("Números para o roteiro")."""
import json

def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c

ID = "o-dia-que-o-plano-collor-confiscou-a-poupanca"
VERM = "#ff5d5d"
OURO = "#ffd23f"
VERDE = "#4ade80"
AZUL = "#7cc4ff"

# (id, ano, rótulo do contador, valor do contador (texto ou número em R$), texto com |, planos[(set, cam, p, card, extra)])
# extra: {"batida": "drama"|"noite", "salto": True}
CENAS = [
    ("c1", "1990", "POUPANÇA", "BLOQUEADA",
     "Em mil novecentos e noventa, o governo travou a poupança do Brasil. | De todo mundo, num dia só.", [
        ("cocofre", "cadeado", [0.2, 0.6], card("Março de 1990", valor="POUPANÇA PRESA", cor=VERM), None),
        ("cofila", "drone", None, card("Num dia só", valor="DE TODO MUNDO", sub="saque limitado por pessoa, em cada banco"), None),
    ]),
    ("c2", "16/03/1990", "BANCOS", "FECHADOS",
     "Senta aí, que essa ninguém te contou. | Eu era caixa de banco. | "
     "Sexta, dezesseis de março, terceiro dia de banco fechado. | A ministra da Economia, Zélia Cardoso de Mello, anunciou um plano.", [
        ("covaranda", "abre", None, None, {"salto": True}),
        ("coagencia", "balcao", None, card("Seu Tostão", valor="CAIXA DE BANCO", sub="40 anos de balcão")),
        ("coagencia", "porta", None, card("Feriado bancário", valor="14, 15 E 16/03", sub="sexta-feira, 16/03/1990: o anúncio", cor=OURO)),
        ("cosala", "tv", None, card("Ministra da Economia", valor="ZÉLIA CARDOSO DE MELLO", sub="anuncia o plano · 16/03/1990")),
    ]),
    ("c3", "MAR 1990", "INFLAÇÃO", "82% NO MÊS",
     "O motivo era a inflação, o preço quase dobrando todo mês. | Num mês só, oitenta e dois por cento. | Aí veio a regra.", [
        ("copreco", "gondola", None, card("Inflação", valor="PREÇO QUASE DOBRA", sub="a cada mês, no começo de 1990")),
        ("copreco", "etiqueta", None, card("Inflação em março de 1990", num=82, sufixo="%", sub="em um mês só · IPCA (IBGE)", cor=VERM)),
        ("covaranda", "bravo", None, None),
    ]),
    ("c4", "16/03/1990", "SAQUE MÁXIMO HOJE", 8079,
     "Poupança é a conta onde o povo guarda dinheiro. | Dela, cada um só tirava cinquenta mil cruzados novos por banco. | "
     "Era a moeda da época. | Isso dá uns oito mil reais de hoje.", [
        ("coagencia", "caderneta", None, card("Poupança", valor="CADERNETA", sub="onde o povo guardava o dinheiro")),
        ("coagencia", "guiche", None, card("Saque máximo", valor="NCz$ 50 MIL", sub="por pessoa, em cada banco · Lei 8.024", cor=OURO)),
        ("cocarimbo", "notas", None, card("Cruzado novo", valor="NCz$", sub="a moeda de 1990")),
        ("cocarimbo", "real", None, card("Corrigido pelo IPCA", valor="≈ R$ 8 MIL", sub="em reais de hoje · Calculadora do Cidadão (BC)", cor=VERDE)),
    ]),
    ("c5", "1990", "PRESO NO BANCO CENTRAL", "≈ US$ 100 BI",
     "O resto ficou preso no Banco Central, o banco do governo. | Por dezoito meses. | Cerca de cem bilhões de dólares. | Juros! Cem bilhões!", [
        ("cocofre", "porta", [0.3, 0.6], card("Banco Central", valor="O RESTO FICA PRESO", sub="corrigido + 6% ao ano")),
        ("cocofre", "calendario", None, card("Bloqueio", num=18, sufixo=" MESES", cor=OURO)),
        ("cocofre", "monte", [0.6, 1], card("Dinheiro bloqueado", valor="≈ US$ 100 BI", sub="estimativa da época · cerca de 30% do PIB", cor=VERM), {"batida": "drama"}),
        ("covaranda", "juros", None, card("Juros!", valor="CEM BILHÕES!", cor=OURO)),
    ]),
    ("c6", "1990", "MOEDA NOVA", "Cr$ + NCz$",
     "A moeda virou cruzeiro, mas o dinheiro preso continuou em cruzado novo. | Duas moedas ao mesmo tempo.", [
        ("cocarimbo", "carimbo", None, card("Moeda nova", valor="CRUZEIRO (Cr$)", sub="1 cruzado novo = 1 cruzeiro")),
        ("cocarimbo", "duas", None, card("Ao mesmo tempo", valor="Cr$ LIVRE · NCz$ PRESO", cor=AZUL)),
    ]),
    ("c7", "19/03/1990", "NA FILA", "≈ 10 MILHÕES",
     "Segunda, eu tava no balcão. | Cerca de dez milhões de pessoas fizeram fila. | Teve pai que juntava para a casa própria. | Ficou tudo preso.", [
        ("coagencia", "fila", None, card("Segunda-feira", valor="19/03/1990", sub="os bancos reabrem"), {"salto": True}),
        ("cofila", "rua", None, card("Na fila dos bancos", valor="≈ 10 MILHÕES", sub="estimativa da Febraban")),
        ("cocasa", "pai", None, card("O sonho", valor="CASA PRÓPRIA", sub="o dinheiro guardado anos a fio")),
        ("cocasa", "parada", None, card("A obra", valor="FICOU PRESA", cor=VERM), {"batida": "drama"}),
    ]),
    ("c8", "AGO 1991", "DEVOLUÇÃO", "EM PARCELAS",
     "Só que a surpresa veio na volta. | Voltou aos poucos, a partir de agosto de noventa e um. | "
     "Na conta oficial, março deu oitenta e quatro por cento. | O dinheiro preso subiu só quarenta e um. | "
     "É como o pão quase dobrar e seu dinheiro subir metade.", [
        ("covaranda", "aponta", None, None, {"batida": "drama"}),
        ("cocofre", "volta", None, card("Devolução", valor="EM PARCELAS", sub="a partir de 15/08/1991, até agosto de 1992", cor=VERDE), {"salto": True}),
        ("copao", "pao", None, card("Inflação de março (IPC)", num=84, sufixo="%", sub="o índice oficial da época", cor=VERM)),
        ("copao", "notas", None, card("Correção do dinheiro preso", num=41, sufixo="%", sub="BTN Fiscal · Idec", cor=AZUL)),
        ("copao", "dois", None, card("Na prática", valor="PÃO 84% · DINHEIRO 41%", sub="o dinheiro voltou valendo menos")),
    ]),
    ("c9", "2026", "AINDA", "NA JUSTIÇA",
     "Trinta e cinco anos depois, ainda tem gente na Justiça. | A lição é que nem dinheiro parado fica parado. | "
     "Você ou seus pais perderam dinheiro nessa? | Guarda esse tostão. Amanhã eu conto outra.", [
        ("cojustica", "salao", None, card("35 anos depois", valor="326 MIL", sub="poupadores no acordo · STF, 2025", cor=OURO), {"salto": True}),
        ("covaranda", "licao", None, card("A lição", valor="DINHEIRO PARADO NÃO FICA PARADO")),
        ("covaranda", "pergunta", None, card("E na sua casa?", valor="PERDERAM NESSA?", cor=OURO)),
        ("covaranda", "fecho", None, None, {"batida": "drama"}),
    ]),
]

# Destaque = palavra que começa com o termo (Rico.tsx usa startsWith)
DESTAQUES = ["novecentos", "noventa", "governo", "travou", "poupança", "todo", "caixa", "dezesseis", "março", "terceiro", "fechado", "zélia",
             "inflação", "dobrando", "oitenta", "regra", "cinquenta", "cruzados", "cruzado", "oito", "reais", "preso", "presa", "central", "dezoito",
             "cem", "bilhões", "juros", "cruzeiro", "duas", "segunda", "balcão", "dez", "milhões", "fila", "casa", "surpresa", "agosto", "quatro",
             "quarenta", "pão", "metade", "trinta", "justiça", "parado", "perderam", "tostão"]

rot = {
    "id": ID,
    "serie": "Seu Tostão",
    "perfil": "rico",
    "titulo": "O DIA QUE PRENDERAM A POUPANÇA",
    "linha2": "16 de março de 1990",
    # prévia sem voz: python3 tools/estimar.py (narração real só no Mac, com aprovação do Fernando)
    "voz": "pt-BR-AntonioNeural",
    "velocidade": "+0%",
    # voz do Seu Tostão (plataforma/perfis.json, perfil rico: Sergio)
    "elevenlabs": {"voz_id": "RGbeQtiShYRDVCrd9b9w", "modelo": "eleven_multilingual_v2",
                   "ajustes": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": True, "speed": 1.0}},
    "fontes": f"roteiros/{ID}.pesquisa.md",
    "monetizacao": {"afiliados": [
        "livro: Zélia, uma paixão — Fernando Sabino (1991)",
        "livro: Saga Brasileira — Miriam Leitão",
        "livro: 3.000 Dias no Bunker — Guilherme Fiuza",
    ]},
    "cenas": [],
}
for cid, ano, rotulo, valor, texto, planos in CENAS:
    partes = [p.strip() for p in texto.split("|")]
    idx, n = [], 0
    for parte in partes:
        idx.append(n)
        n += len(parte.split())
    assert len(idx) == len(planos), (cid, len(idx), len(planos))
    c = {"id": cid, "texto": " ".join(partes), "ano": ano, "rotulo": rotulo, "destaques": DESTAQUES, "planos": []}
    if isinstance(valor, (int, float)):
        c["patrimonio"] = valor
    else:
        c["tem"] = valor
    for plano, a in zip(planos, idx):
        s, cam, p, cd = plano[:4]
        extra = plano[4] if len(plano) > 4 else None
        pl = {"set": s, "cam": cam}
        if a:
            pl["apartir"] = a
        if p:
            pl["p"] = p
        if cd:
            pl["card"] = cd
        if extra:
            pl.update(extra)
        c["planos"].append(pl)
    rot["cenas"].append(c)

json.dump(rot, open(f"roteiros/{ID}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
chars = sum(len(c["texto"]) for c in rot["cenas"])
print("cenas", len(rot["cenas"]), "planos", sum(len(c["planos"]) for c in rot["cenas"]), "caracteres", chars)
