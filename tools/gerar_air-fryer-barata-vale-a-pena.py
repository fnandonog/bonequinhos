"""Gera roteiros/air-fryer-barata-vale-a-pena.json (perfil Vale a Pena?) a partir do storyboard abaixo.
Cada "|" no texto marca um CORTE: o próximo plano começa na palavra seguinte.
Números e fontes: roteiros/air-fryer-barata-vale-a-pena.pesquisa.md"""
import json

ID = "air-fryer-barata-vale-a-pena"


def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c


VERM = "#ff5d5d"
VERDE = "#2fbf71"
AMAR = "#ffd23f"
# (id, etapa, chip, texto, planos[(set, cam, p, card)])
CENAS = [
    ("c1", None, None, "Uma air fryer de duzentos e cinquenta reais vale a pena? | O Zé abriu uma pra ver por dentro. | E fez a conta até o último centavo.", [
        ("vpBancada", "giro", [0, 1], card("Air fryer 4 litros", num=250, prefixo="R$ ", sub="menor preço · nov/2026", cor=AMAR)),
        ("vpAbrindo", "frente", [0, 1], None),
        ("vpBancada", "ze", [0, 1], None),
    ]),
    ("c2", "A PROMESSA", "sem óleo", "Ela promete fritar sem óleo. | Quatro litros, mil e quinhentos watts | e até duzentos graus.", [
        ("vpCaixa", "frente", [0, 1], card("A promessa", valor="FRITAR SEM ÓLEO")),
        ("vpCaixa", "lado", [0, 1], card("Cesto + potência", valor="4 L · 1.500 W", sub="ficha do fabricante")),
        ("vpPainel", "close", [0, 1], card("Temperatura máxima", num=200, sufixo=" °C")),
    ]),
    ("c3", "POR DENTRO", "convecção", "Só que ela não frita nada. | Por dentro, é um forninho com ventilador. | No teto, uma resistência esquenta o ar. | Uma ventoinha empurra esse ar pra baixo. | Ele bate no fundo e sobe passando pela comida.", [
        ("vpNaoFrita", "frente", [0, 1], card("Fritar de verdade?", valor="NÃO FRITA", cor=VERM)),
        ("vpAberta", "fluxo", [0, 0.4], card("Na real é um", valor="FORNO + VENTILADOR", cor=AMAR)),
        ("vpAberta", "resist", [0, 1], card("Resistência", valor="esquenta o ar", sub="até 200 °C")),
        ("vpAberta", "venti", [0, 1], card("Ventoinha", valor="sopra pra baixo")),
        ("vpAberta", "lado", [0.3, 1], card("Ar quente", valor="desce e sobe", sub="passa pela comida")),
    ]),
    ("c4", "O ERRO", "cesto cheio", "E aqui quase todo mundo erra: | lota o cesto. | O ar não passa, e a batata sai mole. | Faz camada fina e chacoalha no meio.", [
        ("vpErro", "geral", None, None),
        ("vpLotado", "cima", [0, 1], card("Cesto lotado", valor="AR NÃO PASSA", cor=VERM)),
        ("vpLotado", "lado", [0, 1], card("Resultado", valor="BATATA MOLE", cor=VERM)),
        ("vpFina", "cima", [0, 1], card("Camada fina", valor="+ chacoalhar", sub="no meio do tempo", cor=VERDE)),
    ]),
    ("c5", "A CONTA", "luz", "Agora a conta. | Num teste de vinte minutos a duzentos graus, | ela gastou só zero vírgula três quilowatt-hora. | Uns trinta centavos de luz. | É que a resistência liga e desliga sozinha.", [
        ("vpMedidor", "geral", [0, 0.2], None),
        ("vpMedidor", "timer", [0.2, 0.6], card("Teste", valor="20 min a 200 °C")),
        ("vpMedidor", "display", [0.6, 1], card("Consumo medido", valor="0,3 kWh", sub="teste Canaltech", cor=AMAR)),
        ("vpMoedas", "luz", [0, 1], card("Custo de luz por uso", valor="≈ R$ 0,30", sub="tarifa ≈ R$ 1/kWh", cor=VERDE)),
        ("vpTermostato", "close", [0, 1], card("Termostato", valor="liga e desliga")),
    ]),
    ("c6", "A CONTA", "óleo", "Na panela, a batata pede uma garrafa de óleo de sete reais. | Na air fryer, basta uma colher. | Usando duas vezes por semana, | ela se paga em cerca de um ano.", [
        ("vpPanela", "panela", [0, 1], card("Óleo de soja 900 ml", valor="R$ 7,32", sub="média 2026 · Deral-PR")),
        ("vpColher", "close", [0, 1], card("Na air fryer", valor="1 colher", sub="≈ 15 ml", cor=VERDE)),
        ("vpMoedas", "semana", [0, 0.5], card("Uso", valor="2× por semana")),
        ("vpMoedas", "paga", [0.5, 1], card("Se paga em", valor="≈ 1 ano", sub="R$ 250 ÷ ≈ R$ 2 por fritura", cor=VERDE)),
    ]),
    ("c7", "VEREDITO", None, "Veredito: vale. | Mas pra até três pessoas. | Família grande? Pega uma de cinco litros pra cima, | senão a janta sai em três rodadas.", [
        ("vpVeredito", "carimbo", [0, 1], None),
        ("vpFamilia", "tres", [0, 1], card("4 litros servem", valor="até 3 pessoas", cor=VERDE)),
        ("vpFamilia", "cinco", [0, 0.1], card("Família grande", valor="5 L ou mais", sub="senão: 3 rodadas", cor=AMAR)),
        ("vpFamilia", "rodadas", [0, 1], None),
    ]),
    ("c8", None, None, "Link com desconto na bio. | E aí: você usaria pra batata ou pra pão de queijo?", [
        ("vpFinal", "final", [0, 1], None),
        ("vpFinal", "close", [0, 1], None),
    ]),
]

rot = {
    "id": ID,
    "serie": "Vale a Pena?",
    "titulo": "VALE A PENA?",
    "linha2": "air fryer de R$ 250",
    "site": "link na bio",
    "cta": {"titulo": "LINK NA BIO", "texto": "Air fryer com desconto", "botao": None},
    "veredito": {"cena": "c7", "texto": "VALE", "sub": "até 3 pessoas", "cor": "#2fbf71"},
    "elevenlabs": {"voz_id": "S4M4JhZIzYGUlDsYIOow", "modelo": "eleven_flash_v2_5",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.15}},
    "fontes": "roteiros/air-fryer-barata-vale-a-pena.pesquisa.md",
    "monetizacao": {"afiliados": ["air fryer Mondial Family AFN-40 4 L 1500 W", "air fryer 5 L ou mais (família grande)",
                                  "forma de silicone para air fryer", "borrifador de óleo"]},
    "cenas": [],
}
DESTAQUES = ["vale", "pena", "reais", "centavo", "litros", "watts", "graus", "óleo", "nada", "forninho", "ventilador", "resistência",
             "ventoinha", "erra", "lota", "mole", "fina", "chacoalha", "conta", "minutos", "quilowatt", "centavos", "liga", "desliga",
             "sete", "colher", "semana", "ano", "veredito", "três", "cinco", "rodadas", "link", "desconto", "bio",
             "duzentos", "mil", "zero", "trinta", "vinte", "duas", "um", "batata", "pão"]
for cid, etapa, chip, texto, planos in CENAS:
    partes = [p.strip() for p in texto.split("|")]
    idx, n = [], 0
    for parte in partes:
        idx.append(n)
        n += len(parte.split())
    assert len(idx) == len(planos), (cid, len(idx), len(planos))
    c = {"id": cid, "texto": " ".join(partes)}
    if etapa:
        c["etapa"] = etapa
    if chip:
        c["chip"] = chip
    if cid == "c8":
        c["cta"] = True
    c["destaques"] = DESTAQUES
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

# nunca dois planos seguidos iguais
seq = [(pl["set"], pl["cam"]) for c in rot["cenas"] for pl in c["planos"]]
assert all(a != b for a, b in zip(seq, seq[1:])), "dois planos seguidos iguais"

json.dump(rot, open(f"roteiros/{ID}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
chars = sum(len(c["texto"]) for c in rot["cenas"])
print("cenas", len(rot["cenas"]), "planos", len(seq), "caracteres", chars)
