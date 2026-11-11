---
description: Produz um vídeo de qualquer perfil da rede do Zé seguindo o guia do formato (docs/formatos/<formato>.md) e a linha de produção com agentes
argument-hint: <tema>
---
Produza o vídeo sobre: $ARGUMENTS

1. Leia `docs/PIPELINE.md` (a linha de produção e as regras de qualidade valem para todos os formatos) e o guia do formato indicado no pedido em `docs/formatos/`.
2. Use os mesmos agentes do `/video`, adaptando ao formato: `pesquisador` (fatos com fonte) → `roteirista` (com as regras de narração do guia do formato) → `diretor` → `cenografo` (cenários novos em `src/v4/sets.tsx` ou no arquivo de cenários do formato) → `editor` → `qa` (até APROVADO, no máximo 4 rodadas).
3. Reaproveite o motor 3D low-poly (`src/v4`: kit, personagens, Obra.tsx) e o Zé do perfil (chapéu/objeto do nicho em `perfis/kit-perfis.md`). Só crie componente novo se o guia pedir.
4. Registre a composição em `src/Root.tsx` com o id pedido e gere os tempos estimados (`python3 tools/estimar.py roteiros/<id>.json 0.8`).
5. Voz: use a do guia do formato no campo `elevenlabs` do roteiro. Nunca troque a voz por conta própria.
