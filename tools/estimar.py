"""Cria um timings.json estimado (sem voz) para pré-visualizar o vídeo.
Uso: python3 tools/estimar.py roteiros/x.json [ritmo]   (ritmo < 1 = narração mais rápida; 0.72 ≈ ElevenLabs acelerado)"""
import json, os, sys
R = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
rot = json.load(open(sys.argv[1], encoding="utf-8"))
pasta = os.path.join("public", "audio", rot["id"]); os.makedirs(pasta, exist_ok=True)
saida = {"id": rot["id"], "estimado": True, "cenas": []}
for c in rot["cenas"]:
    t, palavras = 0.1, []
    for p in c["texto"].split():
        d = (0.08 + 0.055 * len(p)) * R
        palavras.append({"palavra": p.strip(".,:!?;"), "inicio": t, "fim": t + d}); t += d + 0.04 * R
    saida["cenas"].append({"id": c["id"], "duracao": t + 0.3, "palavras": palavras})
json.dump(saida, open(os.path.join(pasta, "timings.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
