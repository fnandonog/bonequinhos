#!/bin/bash
# Postador na VPS: publica os vídeos aprovados no horário mesmo com o Mac fechado.
# O Mac manda vídeos, chaves e fila a cada 5 min (plataforma/vps-sync.mjs, launchd com.bonequinhos.postar).
# Uso (no Mac, dentro da pasta do projeto): bash infra/vps/postador.sh      ·   Desligar: bash infra/vps/postador.sh --desligar
set -e
cd "$(dirname "$0")/../.."
IP="${VPS_IP:-179.198.102.160}"; KEY="${SSH_KEY:-$HOME/.ssh/convertaja_vps}"
SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes -o BatchMode=yes "root@$IP")
RS=(rsync -a --delete -e "ssh -i $KEY -o IdentitiesOnly=yes -o BatchMode=yes")
PLIST="$HOME/Library/LaunchAgents/com.bonequinhos.postar.plist"
NODE="$(command -v node)"

if [ "$1" = "--desligar" ]; then
  "${SSH[@]}" 'docker rm -f zeposter >/dev/null 2>&1 || true'
  sed -i '' 's#plataforma/vps-sync.mjs#plataforma/postar.mjs#' "$PLIST"
  launchctl bootout "gui/$(id -u)/com.bonequinhos.postar" 2>/dev/null || true; launchctl bootstrap "gui/$(id -u)" "$PLIST"
  echo "Postagem de volta no Mac."; exit 0
fi

# 1. Código (só o que a postagem usa) e pastas na VPS
"${SSH[@]}" 'mkdir -p /opt/zeposter/plataforma/dados/logs /opt/zeposter/out /opt/edge/sites/zeexplica/v && touch /opt/zeposter/.env && chmod 600 /opt/zeposter/.env'
"${RS[@]}" plataforma/lib plataforma/vps "root@$IP:/opt/zeposter/plataforma/"
rsync -a -e "ssh -i $KEY -o IdentitiesOnly=yes -o BatchMode=yes" plataforma/postar.mjs plataforma/sincronizar.mjs plataforma/perfis.json "root@$IP:/opt/zeposter/plataforma/"

# 2. Contêiner: roda o postador a cada 5 min (rede do host: alcança o escritório do Mac pelo túnel em 127.0.0.1:4380)
"${SSH[@]}" 'docker rm -f zeposter >/dev/null 2>&1 || true
  docker run -d --name zeposter --restart unless-stopped --network host -e TZ=America/Sao_Paulo \
    -v /opt/zeposter:/app -v /opt/edge/sites/zeexplica/v:/opt/edge/sites/zeexplica/v -w /app node:24-alpine \
    sh -c "while true; do node plataforma/postar.mjs >> plataforma/dados/logs/postador.log 2>&1; sleep 300; done" >/dev/null'

# 3. Mac: o launchd da postagem passa a só sincronizar com a VPS (e atualizar as métricas), a cada 5 min
cat > "$PLIST" <<P
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.bonequinhos.postar</string>
  <key>ProgramArguments</key><array><string>$NODE</string><string>$PWD/plataforma/vps-sync.mjs</string></array>
  <key>WorkingDirectory</key><string>$PWD</string>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>$(dirname "$NODE"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string><key>HOME</key><string>$HOME</string></dict>
  <key>StandardOutPath</key><string>$PWD/plataforma/dados/logs/launchd-postar.log</string>
  <key>StandardErrorPath</key><string>$PWD/plataforma/dados/logs/launchd-postar.log</string>
  <key>StartInterval</key><integer>300</integer>
</dict></plist>
P
launchctl bootout "gui/$(id -u)/com.bonequinhos.postar" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "✔ Postagem rodando na VPS. Log: ssh root@$IP tail -f /opt/zeposter/plataforma/dados/logs/postador.log"
