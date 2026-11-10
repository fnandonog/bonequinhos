"""Gera uma amostra curta (mesma frase) com cada voz padrão do ElevenLabs que funciona no plano grátis.
Uso: bash tools/amostras.sh   (salva em amostras/ e envia pro GitHub)"""
import base64, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from tts_elevenlabs import chamar

FRASE = "Você tem um terreno vazio e sessenta mil reais. Dá pra construir uma kitnet e viver de aluguel? Bora montar, mas cada real conta!"
os.makedirs("amostras", exist_ok=True)
vozes = [v for v in chamar("/voices")["voices"] if v.get("category") == "premade"]
for v in vozes[:12]:
    corpo = {"text": FRASE, "model_id": "eleven_multilingual_v2",
             "voice_settings": {"stability": 0.4, "similarity_boost": 0.8, "style": 0.45, "use_speaker_boost": True, "speed": 1.15}}
    try:
        r = chamar(f"/text-to-speech/{v['voice_id']}/with-timestamps", corpo)
    except RuntimeError as e:
        print("pulei", v["name"], e); continue
    nome = v["name"].split()[0].lower()
    open(f"amostras/{nome}__{v['voice_id']}.mp3", "wb").write(base64.b64decode(r["audio_base64"]))
    print("ok", v["name"])
