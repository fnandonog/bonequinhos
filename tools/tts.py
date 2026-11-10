"""Gera a narração de um roteiro com vozes neurais grátis (edge-tts).

Uso: python3 tools/tts.py roteiros/air-fryer.json
Saída: public/audio/<id>/<cena>.mp3 e public/audio/<id>/timings.json
(com a duração de cada cena e o tempo de cada palavra, usado nas legendas).
Requer: pip install edge-tts
"""
import asyncio, json, os, subprocess, sys
import edge_tts

TICKS = 10_000_000  # edge-tts usa unidades de 100 ns


def duracao(mp3):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", mp3], capture_output=True, text=True).stdout
    return float(out.strip())


async def cena(texto, voz, velocidade, destino):
    com = edge_tts.Communicate(texto, voz, rate=velocidade, boundary="WordBoundary")
    palavras = []
    with open(destino, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                palavras.append({"palavra": chunk["text"],
                                 "inicio": chunk["offset"] / TICKS,
                                 "fim": (chunk["offset"] + chunk["duration"]) / TICKS})
    return palavras


async def main(caminho):
    rot = json.load(open(caminho, encoding="utf-8"))
    pasta = os.path.join("public", "audio", rot["id"])
    os.makedirs(pasta, exist_ok=True)
    saida = {"id": rot["id"], "cenas": []}
    for c in rot["cenas"]:
        mp3 = os.path.join(pasta, c["id"] + ".mp3")
        palavras = await cena(c["texto"], rot.get("voz", "pt-BR-AntonioNeural"),
                              rot.get("velocidade", "+0%"), mp3)
        try:
            d = duracao(mp3)
        except Exception:
            d = palavras[-1]["fim"] + 0.2 if palavras else 3
        saida["cenas"].append({"id": c["id"], "duracao": d, "palavras": palavras})
        print(f"{c['id']}: {d:.2f}s, {len(palavras)} palavras")
    json.dump(saida, open(os.path.join(pasta, "timings.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
