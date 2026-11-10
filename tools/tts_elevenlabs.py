"""Gera a narração de um roteiro com o ElevenLabs, com o tempo exato de cada palavra.

Uso: python3 tools/tts_elevenlabs.py roteiros/air-fryer.json
Configuração no roteiro: "elevenlabs": {"voz_id": "...", "modelo": "eleven_multilingual_v2"}
A chave vem de ELEVENLABS_API_KEY (ou é injetada pelo proxy como cabeçalho xi-api-key).
Saída: public/audio/<id>/<cena>.mp3 e public/audio/<id>/timings.json
"""
import base64, json, os, subprocess, sys, urllib.error, urllib.request

API = "https://api.elevenlabs.io/v1"


def chamar(caminho, corpo=None):
    req = urllib.request.Request(API + caminho, method="POST" if corpo else "GET")
    req.add_header("Content-Type", "application/json")
    chave = os.environ.get("ELEVENLABS_API_KEY")
    if chave:
        req.add_header("xi-api-key", chave)
    dados = json.dumps(corpo).encode() if corpo else None
    try:
        with urllib.request.urlopen(req, dados, timeout=180) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        corpo_erro = e.read().decode("utf-8", "replace")[:600]
        raise RuntimeError(f"ElevenLabs respondeu {e.code}: {corpo_erro}") from None


def vozes():
    return chamar("/voices")["voices"]


def gerar(voz, corpo):
    try:
        return chamar(f"/text-to-speech/{voz}/with-timestamps?output_format=mp3_44100_128", corpo)
    except RuntimeError as e:
        print("Aviso:", e)
        simples = {"text": corpo["text"], "model_id": corpo["model_id"]}
        print("Tentando de novo com parâmetros básicos...")
        return chamar(f"/text-to-speech/{voz}/with-timestamps", simples)


def palavras_do_alinhamento(al):
    chars, ini, fim = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    palavras, atual, t0, t1 = [], "", None, None
    for c, a, b in zip(chars, ini, fim):
        if c.isspace():
            if atual:
                palavras.append((atual, t0, t1))
            atual, t0 = "", None
            continue
        if t0 is None:
            t0 = a
        atual += c
        t1 = b
    if atual:
        palavras.append((atual, t0, t1))
    limpa = lambda w: w.strip(".,:;!?\"'()…—-")
    return [{"palavra": limpa(w), "inicio": a, "fim": b} for w, a, b in palavras if limpa(w)]


def duracao(mp3):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3],
                         capture_output=True, text=True).stdout
    return float(out.strip())


def main(caminho):
    rot = json.load(open(caminho, encoding="utf-8"))
    cfg = rot.get("elevenlabs", {})
    voz = cfg.get("voz_id")
    disponiveis = vozes()
    ids = {v["voice_id"]: v["name"] for v in disponiveis}
    if not voz:
        voz = disponiveis[0]["voice_id"]
    elif voz not in ids:
        print(f"Aviso: a voz {voz} não está em 'My voices'; tentando usar direto da biblioteca.")
    print("Voz:", ids.get(voz, voz))
    modelo = cfg.get("modelo", "eleven_multilingual_v2")
    ajustes = cfg.get("ajustes", {"stability": 0.4, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True, "speed": 1.08})
    pasta = os.path.join("public", "audio", rot["id"])
    os.makedirs(pasta, exist_ok=True)
    saida = {"id": rot["id"], "voz": f"elevenlabs:{voz}:{modelo}", "cenas": []}
    textos = [c["texto"] for c in rot["cenas"]]
    for i, c in enumerate(rot["cenas"]):
        corpo = {"text": c["texto"], "model_id": modelo, "voice_settings": ajustes}
        if "flash" in modelo or "turbo" in modelo:
            corpo["language_code"] = "pt"
        # contexto das frases vizinhas deixa a entonação contínua entre as cenas
        if i > 0:
            corpo["previous_text"] = textos[i - 1]
        if i < len(textos) - 1:
            corpo["next_text"] = textos[i + 1]
        r = gerar(voz, corpo)
        mp3 = os.path.join(pasta, c["id"] + ".mp3")
        open(mp3, "wb").write(base64.b64decode(r["audio_base64"]))
        palavras = palavras_do_alinhamento(r["alignment"])
        d = duracao(mp3) + 0.25  # respiro entre cenas
        saida["cenas"].append({"id": c["id"], "duracao": d, "palavras": palavras})
        print(f"{c['id']}: {d:.2f}s, {len(palavras)} palavras")
    json.dump(saida, open(os.path.join(pasta, "timings.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main(sys.argv[1])
