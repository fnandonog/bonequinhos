#!/bin/bash
set -e
cd "$(dirname "$0")/.."
git pull -q origin main
if [ ! -f .env ] || ! grep -q "ELEVENLABS_API_KEY=sk_" .env; then
  read -s -p "Cole sua chave do ElevenLabs e aperte Enter: " K; echo
  echo "ELEVENLABS_API_KEY=$K" > .env; unset K
fi
set -a; source .env; set +a
python3 tools/amostras_vozes.py
git add amostras && git commit -qm "Amostras de vozes ElevenLabs" && git push -q origin main
echo "Pronto! Amostras enviadas."
