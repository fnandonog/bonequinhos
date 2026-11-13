"""Acelera a narração de um roteiro sem mudar o tom (ffmpeg atempo), normaliza o volume (-16 LUFS) e reajusta os tempos das palavras.
Uso: python3 tools/acelerar.py kitnet kitnet-v2 1.25
Lê public/audio/<origem>/ e grava public/audio/<destino>/ (mp3 + timings.json)."""
import json, os, subprocess, sys

ori, dst, fator = sys.argv[1], sys.argv[2], float(sys.argv[3])
pa, pb = f"public/audio/{ori}", f"public/audio/{dst}"
os.makedirs(pb, exist_ok=True)
t = json.load(open(f"{pa}/timings.json", encoding="utf-8"))
out = {"id": dst, "voz": t.get("voz"), "acelerado": fator, "cenas": []}
for c in t["cenas"]:
    pal = c["palavras"]
    # corta o silêncio do começo e do fim
    ini = max(0.0, pal[0]["inicio"] - 0.06) if pal else 0.0
    fim = (pal[-1]["fim"] + 0.12) if pal else c["duracao"]
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{pa}/{c['id']}.mp3", "-ss", f"{ini:.3f}", "-to", f"{fim:.3f}",
                    "-af", f"atempo={fator},loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-b:a", "160k", f"{pb}/{c['id']}.mp3"], check=True)
    novas = [{"palavra": p["palavra"], "inicio": (p["inicio"] - ini) / fator, "fim": (p["fim"] - ini) / fator} for p in pal]
    out["cenas"].append({"id": c["id"], "duracao": (fim - ini) / fator + 0.08, "palavras": novas})
json.dump(out, open(f"{pb}/timings.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("total", round(sum(c["duracao"] for c in out["cenas"]), 1), "s")
