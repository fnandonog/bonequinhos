---
description: Produz um vídeo da série "Você construiu" do zero com os 6 agentes (pesquisa → roteiro → direção → cenografia → edição → QA)
argument-hint: <tema, ex.: "sobrado de 100 m²">
---
Produza o vídeo sobre: $ARGUMENTS

Siga `docs/PIPELINE.md`. Chame os agentes em ordem e passe a saída de um para o próximo:
1. `pesquisador` → `roteiros/<id>.pesquisa.md`
2. `roteirista` → narração dividida em cenas com `|`
3. `diretor-cena` → `tools/gerar_<id>.py` → `roteiros/<id>.json` + tempos estimados
4. `cenografo` → só se o diretor pedir cenários/câmeras novas
5. Registre a composição em `src/Root.tsx` (igual à `casa-50m2`)
6. `qa` → repita 3–5 até APROVADO (no máximo 4 rodadas)
7. Render: `npx remotion render src/index.ts <id> out/<id>.mp4`
No fim, diga o comando de narração: `bash tools/narrar.sh roteiros/<id>.json`.
