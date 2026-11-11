#!/bin/bash
# Instala 3 tarefas no launchd do seu usuário (rodam sozinhas, mesmo depois de reiniciar o Mac):
#   com.bonequinhos.painel   painel em http://localhost:4321 (sempre ligado)
#   com.bonequinhos.agencia  produção automática todo dia às 02:00 (mude HORA/MINUTO abaixo)
#   com.bonequinhos.postar   publica os vídeos aprovados a cada 10 min
# Desinstalar: bash plataforma/launchd/instalar.sh --remover
set -e
HORA=${HORA:-2}; MINUTO=${MINUTO:-0}
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
NODE="$(command -v node)"
DEST="$HOME/Library/LaunchAgents"
LOGS="$RAIZ/plataforma/dados/logs"
PATH_TAREFA="$(dirname "$NODE"):$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
mkdir -p "$DEST" "$LOGS"

for n in painel agencia postar; do
  launchctl bootout "gui/$(id -u)/com.bonequinhos.$n" 2>/dev/null || true
  rm -f "$DEST/com.bonequinhos.$n.plist"
done
[ "$1" = "--remover" ] && { echo "Tarefas removidas."; exit 0; }

plist() { # nome script extra
cat > "$DEST/com.bonequinhos.$1.plist" <<P
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.bonequinhos.$1</string>
  <key>ProgramArguments</key><array><string>$NODE</string><string>$RAIZ/plataforma/$2</string></array>
  <key>WorkingDirectory</key><string>$RAIZ</string>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>$PATH_TAREFA</string><key>HOME</key><string>$HOME</string></dict>
  <key>StandardOutPath</key><string>$LOGS/launchd-$1.log</string>
  <key>StandardErrorPath</key><string>$LOGS/launchd-$1.log</string>
  $3
</dict></plist>
P
launchctl bootstrap "gui/$(id -u)" "$DEST/com.bonequinhos.$1.plist"
}
plist painel servidor.mjs "<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>"
plist agencia agencia.mjs "<key>StartCalendarInterval</key><dict><key>Hour</key><integer>$HORA</integer><key>Minute</key><integer>$MINUTO</integer></dict>"
plist postar postar.mjs "<key>StartInterval</key><integer>600</integer>"
echo "Pronto. Painel: http://localhost:4321 · produção todo dia às $(printf %02d:%02d $HORA $MINUTO)."
