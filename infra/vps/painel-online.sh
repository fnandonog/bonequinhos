#!/bin/bash
# Coloca o painel do Mac na internet em https://painel.zeexplica.com.br (login com senha + 2FA no próprio painel).
# Antes: abra http://localhost:4380/seguranca no Mac, crie a senha e ligue o 2FA; e crie na Hostinger o DNS A "painel" → 179.198.102.160.
# Uso (no Mac, dentro da pasta do projeto): bash infra/vps/painel-online.sh      ·   Desligar: bash infra/vps/painel-online.sh --desligar
set -e
cd "$(dirname "$0")/../.."
IP="${VPS_IP:-179.198.102.160}"; KEY="${SSH_KEY:-$HOME/.ssh/convertaja_vps}"
SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes -o BatchMode=yes "root@$IP")
PLIST="$HOME/Library/LaunchAgents/com.bonequinhos.tunel.plist"

if [ "$1" = "--desligar" ]; then
  launchctl bootout "gui/$(id -u)/com.bonequinhos.tunel" 2>/dev/null || true; rm -f "$PLIST"
  "${SSH[@]}" 'docker rm -f painel-tunel >/dev/null 2>&1 || true'
  echo "Painel fora da internet (continua no Mac em http://localhost:4380)."; exit 0
fi

grep -q '^PAINEL_SENHA_HASH=' .env && grep -q '^PAINEL_TOTP=' .env || { echo "✖ Configure a senha e o 2FA antes: http://localhost:4380/seguranca"; exit 1; }

# 1. VPS: Caddy com o site painel.zeexplica.com.br e um repasse da rede do Caddy (172.19.0.1:4380) para o túnel (127.0.0.1:4380)
rsync -az -e "ssh -i $KEY -o IdentitiesOnly=yes" infra/vps/Caddyfile "root@$IP:/opt/edge/Caddyfile"
"${SSH[@]}" 'docker rm -f painel-tunel >/dev/null 2>&1 || true
  docker run -d --name painel-tunel --restart unless-stopped --network host alpine/socat:1.8.0.0 \
    TCP-LISTEN:4380,bind=172.19.0.1,fork,reuseaddr TCP:127.0.0.1:4380 >/dev/null
  docker exec edge-caddy-1 caddy reload --config /etc/caddy/Caddyfile'

# 2. Mac: túnel SSH sempre ligado (volta sozinho se cair ou se o Mac reiniciar)
launchctl bootout "gui/$(id -u)/com.bonequinhos.tunel" 2>/dev/null || true
cat > "$PLIST" <<P
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.bonequinhos.tunel</string>
  <key>ProgramArguments</key><array>
    <string>/usr/bin/ssh</string><string>-N</string><string>-i</string><string>$KEY</string>
    <string>-o</string><string>IdentitiesOnly=yes</string><string>-o</string><string>ServerAliveInterval=30</string>
    <string>-o</string><string>ExitOnForwardFailure=yes</string><string>-o</string><string>BatchMode=yes</string>
    <string>-R</string><string>127.0.0.1:4380:127.0.0.1:4380</string><string>root@$IP</string>
  </array>
  <key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
</dict></plist>
P
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "✔ Pronto: https://painel.zeexplica.com.br (o certificado HTTPS sai em até 1 minuto)"
