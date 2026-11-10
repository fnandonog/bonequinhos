"""Lista as vozes da sua conta ElevenLabs (nome, id, sotaque).
Uso: python3 tools/vozes_elevenlabs.py"""
import json, os, urllib.request
req = urllib.request.Request("https://api.elevenlabs.io/v2/voices?page_size=100")
if os.environ.get("ELEVENLABS_API_KEY"):
    req.add_header("xi-api-key", os.environ["ELEVENLABS_API_KEY"])
for v in json.load(urllib.request.urlopen(req, timeout=60))["voices"]:
    l = v.get("labels") or {}
    print(f'{v["voice_id"]}  {v["name"]:<30} {l.get("accent","")} {l.get("gender","")} {l.get("use_case", l.get("descriptive",""))}')
