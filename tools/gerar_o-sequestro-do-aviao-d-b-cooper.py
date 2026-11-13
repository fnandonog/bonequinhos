#!/usr/bin/env python3
"""Roteiro do Caso Explicado: o sequestro do avião D.B. Cooper (24/11/1971).
O TEXTO da narração mora aqui (TEXTOS). Cada "|" marca um CORTE: o próximo plano começa na palavra seguinte
(`apartir` = índice da palavra, divisão por espaços, igual ao timings.json). Cenários em src/caso/cooper.tsx (sets db_*).
Mudou o texto? Apague o áudio narrado e regrave (ou estime com tools/estimar.py) depois de rodar este script.
Uso: python3 tools/gerar_o-sequestro-do-aviao-d-b-cooper.py
"""
import json
import pathlib

ID = 'o-sequestro-do-aviao-d-b-cooper'
RAIZ = pathlib.Path(__file__).resolve().parent.parent
ARQ = RAIZ / 'roteiros' / f'{ID}.json'

DESTAQUES = ['bomba', 'duzentos', 'mil', 'ninguém', 'quatro', 'paraquedas', 'trinta', 'seis', 'pula',
             'nove', 'oito', 'cinco', 'oitocentos', 'fbi', 'resgate', 'cento', 'noventa', 'três', 'teorias',
             'morreu', 'sobreviveu', 'provado', 'quarenta', 'único', 'aposta']

TEXTOS = {
    'c1': 'Um homem ameaçou explodir um avião, | levou duzentos mil dólares | e pulou de paraquedas, no escuro. | Até hoje, ninguém sabe quem ele era.',
    'c2': 'Estados Unidos, mil novecentos e setenta e um. | Um homem com nome falso, Dan Cooper, pega um voo pra Seattle. | No ar, avisa a comissária que tem uma bomba | e abre a pasta, cheia de fios. | Quer duzentos mil dólares | e quatro paraquedas.',
    'c3': 'Em Seattle, ele recebe o dinheiro e os paraquedas | e solta os trinta e seis passageiros. | Fica só com quatro tripulantes. | Decola de novo, à noite, | e manda voar baixo e devagar, com as rodas pra fora.',
    'c4': 'Lá pelas oito da noite, | ele amarra o dinheiro no corpo, | abre a escada que desce da cauda e pula. | Na chuva, no escuro, a nove graus abaixo de zero. Os pilotos só sentem a cauda subir. E ele nunca mais é visto.',
    'c5': 'Oito anos depois, um menino acha | cinco mil e oitocentos dólares apodrecidos na beira de um rio. | O FBI tinha fotografado cada nota, e os números batem. | O resto nunca apareceu.',
    'c6': 'Tem três teorias. | A mais provável é que morreu na queda, sem treino e com um paraquedas que nem dava pra guiar. | Outra diz que sobreviveu e largou o dinheiro, porque as notas eram rastreáveis. | A terceira, que fugiu e gastou o resto. | Nada foi provado.',
    'c7': 'Em dois mil e dezesseis, | o FBI parou de investigar. | É o único sequestro de avião de passageiros do país nunca resolvido.',
    'c8': 'E você, em qual teoria aposta?',
}


def pl(set_, cam, p=(0, 1), card=None):
    d = {'set': set_, 'cam': cam, 'p': list(p)}
    if card:
        d['card'] = card
    return d


PLANOS = {
    'c1': [
        pl('db_cabine', 'bilhete', (0.2, 0.9)),
        pl('db_balcao', 'dinheiro', (0, 1), {'rotulo': 'Resgate', 'num': 200000, 'prefixo': 'US$ ', 'sub': 'Portland → Seattle, 1971'}),
        pl('db_voo_escada', 'tras', (0.25, 1)),
        pl('db_quadro', 'retrato', (0, 0.5), {'rotulo': 'Até hoje', 'valor': 'NUNCA IDENTIFICADO', 'cor': '#ff5d5d'}),
    ],
    'c2': [
        pl('db_aeroporto', 'geral', (0, 1), {'rotulo': 'Voo 305', 'valor': 'PORTLAND → SEATTLE', 'sub': '24 nov 1971'}),
        pl('db_balcao', 'geral', (0, 1), {'rotulo': 'Nome na passagem', 'valor': '"DAN COOPER"', 'sub': 'nome falso'}),
        pl('db_cabine', 'geral', (0, 1), {'rotulo': 'O bilhete', 'valor': '"TENHO UMA BOMBA"', 'cor': '#ff5d5d'}),
        pl('db_cabine', 'pasta', (0.5, 1)),
        pl('db_dinheiro', 'geral', (0, 1), {'rotulo': 'Resgate', 'num': 200000, 'prefixo': 'US$ ', 'sub': 'em notas de US$ 20'}),
        pl('db_pista', 'paraquedas', (0, 0.2), {'rotulo': 'Paraquedas', 'num': 4, 'sub': '2 principais + 2 reservas'}),
    ],
    'c3': [
        pl('db_pista', 'geral', (0, 0.5), {'rotulo': 'Resgate entregue', 'valor': '10 MIL NOTAS', 'sub': 'de US$ 20, fotografadas pelo FBI'}),
        pl('db_pista', 'geral', (0.5, 1), {'rotulo': 'Passageiros liberados', 'num': 36, 'sub': 'em Seattle'}),
        pl('db_cabine_vazia', 'comissarios', (0, 1), {'rotulo': 'Ficaram a bordo', 'num': 4, 'sub': 'piloto, copiloto, engenheiro e 1 comissária'}),
        pl('db_decola', 'decola', (0, 1)),
        pl('db_mapa', 'rota', (0.05, 0.6), {'rotulo': 'Altitude', 'valor': '~3.000 m', 'sub': 'baixo, devagar e com as rodas pra fora'}),
    ],
    'c4': [
        pl('db_voo_escada', 'lado', (0, 0.05)),
        pl('db_cabine_salto', 'amarra', (0, 1)),
        pl('db_voo_escada', 'baixo', (0.1, 0.6)),
        pl('db_queda', 'desce', (0, 1), {'rotulo': 'Temperatura no salto', 'valor': '−9 °C', 'sub': 'chuva e escuro total', 'cor': '#6fd3ff'}),
    ],
    'c5': [
        pl('db_mapa', 'tena', (0.85, 1.6), {'rotulo': 'Fevereiro de 1980', 'valor': 'RIO COLUMBIA', 'sub': 'Brian Ingram, 8 anos'}),
        pl('db_rio', 'geral', (0, 1), {'rotulo': 'Notas achadas no rio', 'num': 5800, 'prefixo': 'US$ ', 'sub': '3 maços apodrecidos', 'cor': '#ffd23f'}),
        pl('db_rio', 'notas', (0.4, 1), {'rotulo': 'Números das notas', 'valor': 'BATEM', 'sub': 'são do resgate'}),
        pl('db_dinheiro_falta', 'falta', (0, 1), {'rotulo': 'Nunca apareceram', 'num': 194200, 'prefixo': 'US$ ', 'cor': '#ff5d5d'}),
    ],
    'c6': [
        pl('db_quadro', 'geral', (0, 0.3)),
        pl('db_t1', 'arvore', (0, 1), {'rotulo': 'Teoria 1 · mais provável', 'valor': 'MORREU NA QUEDA', 'sub': 'paraquedas que não dava pra guiar', 'cor': '#ffd23f'}),
        pl('db_t2', 'margem', (0, 1), {'rotulo': 'Teoria 2', 'valor': 'SOBREVIVEU', 'sub': 'largou o dinheiro', 'cor': '#ff9f1c'}),
        pl('db_t3', 'praia', (0, 1), {'rotulo': 'Teoria 3 · menos prova', 'valor': 'GASTOU O RESTO', 'cor': '#ff5d5d'}),
        pl('db_quadro', 'ze', (0.86, 0.98), {'rotulo': 'Até hoje', 'valor': 'NADA PROVADO', 'cor': '#ff5d5d'}),
    ],
    'c7': [
        pl('db_arquivo', 'geral', (0, 0.4), {'rotulo': 'O FBI para de investigar', 'valor': 'JULHO 2016'}),
        pl('db_arquivo', 'carimbo', (0.4, 1), {'rotulo': 'Investigação', 'valor': '45 ANOS', 'sub': '1971 → 2016', 'cor': '#ff5d5d'}),
        pl('db_voo', 'some', (0, 1), {'rotulo': 'Nos EUA', 'valor': 'ÚNICO SEM SOLUÇÃO', 'sub': 'sequestro de avião comercial'}),
    ],
    'c8': [
        pl('db_quadro', 'pergunta', (1, 1), {'rotulo': 'E você?', 'valor': 'QUAL TEORIA?', 'sub': '1, 2 ou 3? comenta', 'cor': '#ffd23f'}),
    ],
}

PAGINA = '''🕵️ D.B. Cooper: o sequestro que ninguém resolveu

O QUE ACONTECEU
• 24/11/1971: um homem usando o nome "Dan Cooper" embarca no voo 305 da Northwest, de Portland a Seattle.
• No ar, passa um bilhete para a comissária dizendo ter uma bomba, mostra fios e cilindros vermelhos na pasta e exige US$ 200.000 (em notas de US$ 20) e 4 paraquedas.
• Em Seattle recebe o dinheiro (10 mil notas, todas fotografadas pelo FBI) e os paraquedas, e libera os 36 passageiros. Ficam a bordo o piloto, o copiloto, o engenheiro de voo e uma comissária.
• Lá pelas 20h, sobre a floresta, ele amarra o dinheiro ao corpo, abre a escada traseira do Boeing 727 e pula na chuva e no escuro, a cerca de −9 °C.
• Em fevereiro de 1980, o menino Brian Ingram, de 8 anos, acha US$ 5.800 em notas do resgate na margem do Rio Columbia. Os outros US$ 194.200 nunca apareceram.
• Em julho de 2016, depois de 45 anos, o FBI suspendeu a investigação.

AS TEORIAS
1. Morreu na queda: a mais provável. Sem treino conhecido, com um paraquedas militar que não dava para guiar, à noite e na chuva.
2. Sobreviveu e largou o dinheiro: sabia que as notas podiam ser rastreadas.
3. Fugiu e gastou o resto: explica o sumiço, mas não tem prova nenhuma.

Nenhuma teoria foi provada. Fontes: FBI (caso NORJAK), Wikipedia "D. B. Cooper", Geoffrey Gray, Skyjack (2011).'''

rot = json.loads(ARQ.read_text())
total = 0
for c in rot['cenas']:
    partes = [x.strip() for x in TEXTOS[c['id']].split('|')]
    planos = PLANOS[c['id']]
    assert len(partes) == len(planos), (c['id'], len(partes), len(planos))
    c['texto'] = ' '.join(partes)
    c['destaques'] = DESTAQUES
    n = 0
    for parte, p in zip(partes, planos):
        p.pop('apartir', None)
        if n:
            p['apartir'] = n
        n += len(parte.split())
    c['planos'] = [{k: p[k] for k in ('set', 'cam', 'apartir', 'p', 'card') if k in p} for p in planos]
    total += len(c['texto'])
rot['pagina']['texto'] = PAGINA
ARQ.write_text(json.dumps(rot, ensure_ascii=False, indent=2) + '\n')
print('ok', ARQ, sum(len(v) for v in PLANOS.values()), 'planos', total, 'caracteres')
