#!/bin/bash
# Gera a narração com o ElevenLabs no seu Mac e manda para o GitHub.
# Uso: bash tools/narrar.sh roteiros/air-fryer.json
set -e
cd "$(dirname "$0")/.."
git pull -q origin main
if [ ! -f .env ] || ! grep -q "ELEVENLABS_API_KEY=sk_" .env; then
  echo "A chave precisa começar com sk_ (é a chave mostrada quando você cria uma nova, não o ID)."
  read -s -p "Cole sua chave do ElevenLabs e aperte Enter (ela não aparece na tela): " K; echo
  echo "ELEVENLABS_API_KEY=$K" > .env; unset K
fi
set -a; source .env; set +a
python3 tools/tts_elevenlabs.py "$1"
id=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['id'])" "$1")
git add "public/audio/$id"
git commit -qm "Narração ElevenLabs: $id"
git push -q origin main
echo "Pronto! Narração enviada."
