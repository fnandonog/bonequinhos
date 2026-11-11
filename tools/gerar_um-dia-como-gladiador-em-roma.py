"""Gera roteiros/um-dia-como-gladiador-em-roma.json (formato Você na História, motor src/historia).
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
(O "|" sai do texto antes de ir para a narração.)
Card de topo: ano + lugar de cada cena (campos "quando" e "onde")."""
import json

def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c

ID = "um-dia-como-gladiador-em-roma"
ANO = "80 d.C."
VERM = "#ff5d5d"
OURO = "#ffd23f"
# (id, onde, texto com |, planos[(set, cam, p, card)])
CENAS = [
    ("c1", "ROMA", "Ano oitenta. Roma inaugura o Coliseu. | Cinquenta mil pessoas vieram ver gente lutar. | E quem vai lutar é você.", [
        ("coliseu", "drone", None, None),
        ("arena", "geral", None, card("Público do Coliseu", num=50000, sub="inaugurado em 80 d.C.")),
        ("arena", "ze", None, None),
    ]),
    ("c2", "MERCADO DE ESCRAVOS", "Como você veio parar aqui? Roma venceu a guerra na sua terra e te fez escravo. | Gladiador quase sempre era isso: escravo, | prisioneiro de guerra | ou condenado.", [
        ("mercado", "geral", [0, 0.1], None),
        ("mercado", "escravo", [0.1, 0.4], None),
        ("mercado", "prisioneiro", [0.4, 0.7], None),
        ("mercado", "condenado", [0.7, 1], card("Quem virava gladiador", valor="QUASE NINGUÉM ESCOLHIA", cor=VERM)),
    ]),
    ("c3", "ESCOLA DE GLADIADORES", "Quem te compra é um lanista: o empresário que treina gladiadores e aluga pros shows. | Pra entrar na escola, você jura: | aceita ser queimado, acorrentado, açoitado | e morto pela espada.", [
        ("juramento", "lanista", [0, 0.15], None),
        ("juramento", "geral", [0.15, 0.3], None),
        ("juramento", "brasa", [0.3, 0.75], card("O juramento", valor="QUEIMADO · ACORRENTADO", sub="açoitado e morto pela espada")),
        ("juramento", "ze", [0.75, 1], None),
    ]),
    ("c4", "LUDUS", "Na escola, o treino dura o dia inteiro, | golpeando um poste com espada de madeira, | e o lanista de chicote na mão.", [
        ("ludus", "geral", [0, 0.4], None),
        ("ludus", "poste", [0.4, 0.75], card("Treino no poste", valor="ESPADA DE PAU", sub="o poste se chamava palus")),
        ("ludus", "chicote", [0.75, 1], None),
    ]),
    ("c5", "REFEITÓRIO", "Pra ficar forte, a comida é cevada e feijão. | Gladiador tinha até apelido: comedor de cevada. | E depois, uma bebida de cinza de planta pros ossos.", [
        ("refeitorio", "mesa", [0, 0.4], None),
        ("refeitorio", "tigela", [0.4, 0.6], card("O apelido", valor="HORDEARII", sub="comedores de cevada", cor=OURO)),
        ("refeitorio", "cinza", [0.6, 1], card("Bebida de cinza", valor="MAIS CÁLCIO", sub="achado em ossos de Éfeso (2014)")),
    ]),
    ("c6", "COLISEU", "Chega o dia da luta. Você atravessa o túnel até a arena. | E aqui vem a surpresa: | naquela época, só uma luta em cada cinco terminava em morte.", [
        ("tunel", "costas", [0, 1], None),
        ("luta", "geral", [0, 0.5], None),
        ("luta", "close", [0.5, 1], card("Lutas que acabavam em morte", valor="1 EM 5", sub="século I d.C.", cor=OURO)),
    ]),
    ("c7", "ENFERMARIA DO LUDUS", "Por quê? Gladiador era caro. | O lanista pagou sua compra, comida, treino e até médico. | Morto, você vira prejuízo.", [
        ("enfermaria", "geral", [0, 0.4], None),
        ("enfermaria", "medico", [0.4, 0.8], card("Gladiador", valor="INVESTIMENTO CARO", sub="tinha o melhor médico da época")),
        ("enfermaria", "moedas", [0.8, 1], card("Gladiador morto", valor="PREJUÍZO", cor=VERM)),
    ]),
    ("c8", "CAMAROTE DO IMPERADOR", "E o polegar pra baixo dos filmes? | Dizem que era o sinal de morte. | Mas ninguém sabe qual gesto era de verdade.", [
        ("camarote", "geral", [0, 0.35], None),
        ("polegar", "baixo", [0, 0.5], card("Polegar pra baixo", valor="DIZEM QUE...", cor=VERM)),
        ("polegar", "duvida", [0.5, 1], card("O gesto de verdade", valor="NINGUÉM SABE", sub="a cena famosa é de um quadro de 1872", cor=OURO)),
    ]),
    ("c9", "ARENA", "Sobreviveu anos e agradou o público? Você ganha a rudis: | uma espada de madeira que significa liberdade. | Você deixa de ser escravo.", [
        ("liberdade", "geral", [0, 0.5], None),
        ("liberdade", "rudis", [0.5, 0.8], card("A rudis", valor="LIBERDADE", cor=OURO)),
        ("liberdade", "aplauso", [0.8, 1], None),
    ]),
    ("c10", "ROMA", "Cinquenta mil olhando. | Uma chance em cinco de não voltar, a cada luta. | Você aguentaria?", [
        ("fim", "aereo", None, card("Coliseu lotado", num=50000)),
        ("fim", "ze", None, card("Chance de morrer na luta", valor="1 EM 5", cor=VERM)),
        ("fim", "pergunta", None, None),
    ]),
]

DESTAQUES = ["cinquenta", "mil", "gladiador", "escravo", "prisioneiro", "condenado", "juramento", "morto", "madeira", "cevada", "cinza",
             "surpresa", "uma", "cinco", "morte", "caro", "prejuízo", "polegar", "ninguém", "rudis", "liberdade", "aguentaria", "oitenta"]

rot = {
    "id": ID,
    "serie": "Você na História",
    "perfil": "historia",
    "titulo": "UM DIA COMO GLADIADOR",
    "linha2": "você aguentaria?",
    "quando": ANO,
    "onde": "ROMA",
    # narração de TESTE (grátis, edge-tts) para o piloto
    "voz": "pt-BR-AntonioNeural",
    "velocidade": "+10%",
    # voz da produção quando o formato for aprovado (Fernando no ElevenLabs)
    "elevenlabs": {"voz_id": "5Ny27k6jpd2wJTdmbFsb", "modelo": "eleven_multilingual_v2",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.15}},
    "fontes": f"roteiros/{ID}.pesquisa.md",
    "monetizacao": {"afiliados": [
        "livro: SPQR (Mary Beard)", "livro: Gladiadores (história de Roma)", "livro: O Coliseu (Keith Hopkins & Mary Beard)",
        "kit de miniaturas/LEGO do Coliseu", "quebra-cabeça 3D do Coliseu", "jogo de tabuleiro de gladiadores",
    ]},
    "cenas": [],
}
for cid, onde, texto, planos in CENAS:
    partes = [p.strip() for p in texto.split("|")]
    idx, n = [], 0
    for parte in partes:
        idx.append(n)
        n += len(parte.split())
    assert len(idx) == len(planos), (cid, len(idx), len(planos))
    c = {"id": cid, "texto": " ".join(partes), "quando": ANO, "onde": onde, "destaques": DESTAQUES, "planos": []}
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
