# Linha de produção com agentes (formato "Você construiu" 3D)

Cada vídeo passa por 6 papéis. Cada papel é um agente do Claude Code em `.claude/agents/`.
No Mac, dentro do projeto: `claude` e depois `/video <tema>` (comando em `.claude/commands/video.md`).

| # | Agente | Entrega | Não pode passar adiante se... |
|---|---|---|---|
| 1 | `pesquisador` | `roteiros/<id>.pesquisa.md` com cada número marcado [S]/[C]/[E] e as fontes | algum número do vídeo não tiver origem |
| 2 | `roteirista` | texto da narração (você, 2ª pessoa), gancho em 3 s, 1 número por frase, final "Parabéns: você construiu..." | passar de ~1.300 caracteres (~65 s) |
| 3 | `diretor-cena` | storyboard em `tools/gerar_<id>.py`: cada `|` é um corte, cada plano = cenário + câmera + card | dois planos seguidos iguais, plano > 3 s, card sem número |
| 4 | `cenografo` | cenários novos em `src/v4/sets.tsx` usando `planta.ts` e `kit.tsx` (1 unidade = 1 metro) | peça fora de escala, personagem atravessando parede |
| 5 | `editor` | montagem em `src/v4/Obra.tsx`: legenda de 1 palavra no alto, card de número embaixo, etapa + gasto no topo, sons | texto fora da área segura (topo 150 px, base 420 px, direita 140 px) |
| 6 | `qa` | `node tools/qa.mjs <id>` → `qa/<id>/folha.jpg` (1 still por plano) e lista de reprovações | qualquer item da lista de reprovação |

## Fluxo de comandos
```
python3 tools/gerar_<id>.py                      # roteiro + storyboard -> roteiros/<id>.json
python3 tools/estimar.py roteiros/<id>.json 0.8  # tempos estimados (prévia sem voz)
node tools/qa.mjs <id>                           # stills de QA
npx remotion render src/index.ts <id> out/<id>.mp4 --gl=swangle
bash tools/narrar.sh roteiros/<id>.json          # NO MAC: voz ElevenLabs (substitui os tempos estimados)
```

## Regras que corrigem os problemas do piloto da kitnet
- **Cena diferente de verdade**: cada etapa é um cenário próprio (escavação em corte, ferragem, betoneira, laje por dentro...). Trocar só o ângulo não conta como cena nova.
- **Escala real**: a planta (`src/v4/planta.ts`) é uma casa de verdade de 7 × 7,2 m; bloco 14×19×29, porta 0,8×2,1, pessoa ~1,7 m. Todas as cenas usam a mesma planta, então nada "muda de tamanho" entre cortes.
- **Enquadramento**: câmera por órbita `orb(alvo, azimute, elevação, distância inicial, final)`; plano aberto 17–23 m, médio 7–10 m, close 4–6 m. Todo plano tem movimento (dolly + giro leve).
- **Legenda**: 1 palavra por vez, centro-alto; números e palavras-chave em amarelo.
- **Informação**: 1 card de número grande por plano, e o número tem fonte na pesquisa.
