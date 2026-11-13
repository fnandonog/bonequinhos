"""Gera roteiros/como-o-mcdonald-s-ganha-dinheiro-de-verd.json (formato Como Ficou Rico, motor src/rico). VERSÃO 2 (refeita).
Fernando reprovou a v1: faltava contexto e o 3D era um "paredão amarelo". Agora: contexto antes do detalhe, o mecanismo do
dinheiro com números (taxa, royalties e principalmente o ALUGUEL do ponto) e cenários novos em src/rico/mcd.tsx (sets "mc*").
Sem logo nem marca real no 3D: a lanchonete é genérica ("LANCHES"). O nome McDonald's só aparece na narração e nos cards.
Cada "|" no texto marca um CORTE. Números: roteiros/como-o-mcdonald-s-ganha-dinheiro-de-verd.pesquisa.md (seção "Complemento")."""
import json

def card(rotulo, num=None, valor=None, prefixo=None, sufixo=None, sub=None, cor=None):
    c = {"rotulo": rotulo}
    for k, v in dict(num=num, valor=valor, prefixo=prefixo, sufixo=sufixo, sub=sub, cor=cor).items():
        if v is not None:
            c[k] = v
    return c

ID = "como-o-mcdonald-s-ganha-dinheiro-de-verd"
VERM = "#ff5d5d"
OURO = "#ffd23f"
VERDE = "#4ade80"
AZUL = "#7cc4ff"

# (id, ano, tem, texto com |, planos[(set, cam, p, card)])
# Cada "|" abre o plano seguinte: o gerador calcula "apartir" (índice da palavra, texto.split()) sozinho, então o texto pode mudar
# à vontade; basta ter um "|" a menos que o número de planos da cena. v3 (12/11/2026): trocas do revisor-roteiro.
CENAS = [
    ("c1", "2023", "US$ 25,5 BI POR ANO",
     "O McDonald's fatura vinte e cinco bilhões de dólares por ano. | Mas quase não frita hambúrguer. | De onde vem isso?", [
        ("mccidade", "drone", None, card("Receita em 2023", valor="US$ 25,5 BI", sub="balanço anual (10-K)", cor=OURO)),
        ("mccozinha", "chapa", None, card("Lojas de franqueados", num=95, sufixo="%", sub="quem frita é o dono da loja")),
        ("mccidade", "drive", None, None),
    ]),
    ("c2", "1948", "1 LANCHONETE",
     "Em mil novecentos e quarenta e oito, | os irmãos McDonald têm uma lanchonete. | "
     "Cada funcionário faz uma tarefa só, como numa fábrica. | O hambúrguer custa quinze centavos e sai em trinta segundos.", [
        ("mc48", "aberto", None, card("San Bernardino · Califórnia", valor="1948")),
        ("mc48", "irmaos", None, card("Os donos", valor="DICK E MAC", sub="os irmãos McDonald")),
        ("mc48linha", "linha", None, card("Cozinha em linha", valor="1 TAREFA", sub="por funcionário, como numa fábrica")),
        ("mc48balcao", "balcao", None, card("Hambúrguer", valor="US$ 0,15", sub="pronto em ~30 segundos", cor=OURO)),
    ]),
    ("c3", "1954", "1 VENDEDOR",
     "Seis anos depois, eles compram oito máquinas de milkshake de uma vez. | "
     "O vendedor, Ray Kroc, vai ver por quê. | E fecha com os irmãos um contrato de franquia. | "
     "Gente de fora abre uma loja igual e paga pelo nome.", [
        ("mcestrada", "mixer", None, card("Multi-Mixer", valor="8 MÁQUINAS", sub="o maior pedido da empresa do Kroc")),
        ("mcestrada", "carro", None, card("Ray Kroc", num=52, sufixo=" anos", sub="vendedor de máquinas de milkshake")),
        ("mcesc54", "contrato", [0, 1], card("Contrato com os irmãos", valor="FRANQUIA", sub="1954")),
        ("mcfranquias", "rua", None, card("Franquia", valor="LOJA IGUAL", sub="o dono paga pra usar o nome e o jeito", cor=VERDE)),
    ]),
    ("c4", "1955", "FRANQUIAS",
     "O franqueado, dono da loja, pagava uma taxa pra entrar | e um pedaço de cada venda, os royalties. | "
     "De cada cem dólares, sobravam um e quarenta pro Kroc. | A empresa dele mal pagava as contas.", [
        ("mcfranquias", "caixa", None, card("Taxa de entrada", valor="US$ 950", sub="em 1955")),
        ("mccontas", "mesa", [0, 0.5], card("Royalties", valor="1,9%", sub="de cada venda", cor=VERDE)),
        ("mccontas", "livro", [0.5, 1], card("Sobrava pro Kroc", valor="1,4%", sub="0,5% ia para os irmãos", cor=VERM)),
        ("mccofre", "cofre", [1, 1], card("A empresa do Kroc", valor="MAL PAGAVA AS CONTAS", cor=VERM)),
    ]),
    ("c5", "1956", "TERRENOS",
     "Aí o chefe das finanças, Harry Sonneborn, inverte o jogo. | A rede compra o terreno, ergue a loja | "
     "e aluga pro franqueado com lucro. Ele dizia que o negócio era imóvel, não comida.", [
        ("mcsonneborn", "mesa", [0, 1], card("Harry Sonneborn", valor="A VIRADA", sub="chefe das finanças · 1956", cor=OURO)),
        ("mclote", "placa", [0, 1], card("A rede", valor="COMPRA O TERRENO", sub="e ergue a loja", cor=VERDE)),
        ("mcobra", "sobe", [0, 1], card("Depois", valor="ALUGA COM LUCRO", sub="o franqueado vira inquilino", cor=OURO)),
    ]),
    ("c6", "HOJE", "TERRENOS",
     "Hoje, nos Estados Unidos, o franqueado | paga quarenta e cinco mil dólares pra entrar. | "
     "Mais quatro a cinco por cento das vendas. | E o aluguel, que sobe com elas.", [
        ("mcfranqueado", "assina", [0, 1], card("Contas do franqueado", num=3, sub="contrato de 20 anos")),
        ("mcfluxo", "taxa", [0, 0.34], card("Taxa de entrada", valor="US$ 45 MIL", sub="uma vez só · EUA")),
        ("mcfluxo", "royalties", [0.34, 0.67], card("Royalties", valor="4 a 5%", sub="de cada venda, todo mês · EUA", cor=VERDE)),
        ("mcfluxo", "aluguel", [0.67, 1], card("Aluguel", valor="SOBE COM AS VENDAS", sub="% das vendas, com mínimo fixo", cor=OURO)),
    ]),
    ("c7", "2023", "57% DOS TERRENOS",
     "Em dois mil e vinte e três, | só de aluguel, a rede recebeu nove bilhões e oitocentos milhões de dólares. | "
     "Quase o dobro dos royalties. | Porque ela é dona do chão, | de cinquenta e sete por cento dos terrenos.", [
        ("mcpilares", "geral", [0.05, 0.3], None),
        ("mcpilares", "aluguel", [0.3, 1], card("Aluguel em 2023", valor="US$ 9,8 BI", sub="pago pelos franqueados", cor=OURO)),
        ("mcpilares", "royalties", [1, 1], card("Royalties em 2023", valor="US$ 5,5 BI", sub="aluguel ≈ 1,8 vez isso", cor=VERDE)),
        ("mcdono", "placa", [0, 0.4], card("Dono do chão", valor="A REDE", sub="não o franqueado", cor=AZUL)),
        ("mcdono", "geral", [0.4, 1], card("Terrenos da rede", num=57, sufixo="%", sub="e 80% dos prédios", cor=AZUL)),
    ]),
    ("c8", "2023", "41.822 LOJAS",
     "São mais de quarenta e um mil lojas, | em mais de cem países.", [
        ("mcmapa", "cima", [0, 0.7], card("Restaurantes", num=41822, sub="fim de 2023 · 95% franquias")),
        ("mcmapa", "globo", [0.7, 1], card("Países", valor="100+", cor=VERDE)),
    ]),
    ("c9", "2023", "41.822 LOJAS",
     "No fim, o hambúrguer traz o cliente. | O terreno paga a conta. | E você, ficava com a lanchonete ou com o chão embaixo dela?", [
        ("mcfinal", "lanche", [0, 0.3], card("O hambúrguer", valor="TRAZ O CLIENTE")),
        ("mcfinal", "chao", [0.3, 1], card("O terreno", valor="PAGA A CONTA", cor=OURO)),
        ("mcze", "pergunta", None, card("E você?", valor="LANCHONETE OU CHÃO?")),
    ]),
]

# Destaque = palavra que começa com o termo (Rico.tsx usa startsWith): evitar termos curtos que pegam palavras demais.
DESTAQUES = ["mcdonald's", "vinte", "bilhões", "frita", "hambúrguer", "dinheiro", "novecentos", "califórnia", "irmãos", "funcionário", "lanchonete", "cozinha", "fábrica",
             "tarefa", "quinze", "trinta", "oito", "milkshake", "ray", "kroc", "cinquenta", "franquia", "igual", "nome", "taxa", "royalties",
             "dólares", "contas", "sonneborn", "finanças", "inverte", "lucro", "terreno", "aluga", "imóvel", "negócio", "três", "quarenta", "aluguel", "sobe",
             "recebeu", "nove", "oitocentos", "dobro", "chão", "sete", "lojas", "cem", "países", "cliente", "lanchonete"]

rot = {
    "id": ID,
    "serie": "Como Ficou Rico",
    "perfil": "rico",
    "titulo": "O McDONALD'S NÃO VIVE DE LANCHE",
    "linha2": "de onde vem os US$ 25,5 BI",
    # prévia sem voz: python3 tools/estimar.py (narração real só no Mac, com aprovação do Fernando)
    "voz": "pt-BR-AntonioNeural",
    "velocidade": "+10%",
    # voz do canal (plataforma/perfis.json: Elvis)
    "elevenlabs": {"voz_id": "zNEsdgTUa3ndwKry8Xcq", "modelo": "eleven_multilingual_v2",
                   "ajustes": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True, "speed": 1.1}},
    "fontes": f"roteiros/{ID}.pesquisa.md",
    "monetizacao": {"afiliados": [
        "livro: Grinding It Out — Ray Kroc (autobiografia)",
        "livro: Behind the Arches — John F. Love",
        "livro: Pai Rico, Pai Pobre",
        "livro: Do mil ao milhão — Thiago Nigro",
    ]},
    "cenas": [],
}
for cid, ano, tem, texto, planos in CENAS:
    partes = [p.strip() for p in texto.split("|")]
    idx, n = [], 0
    for parte in partes:
        idx.append(n)
        n += len(parte.split())
    assert len(idx) == len(planos), (cid, len(idx), len(planos))
    c = {"id": cid, "texto": " ".join(partes), "ano": ano, "tem": tem, "destaques": DESTAQUES, "planos": []}
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
