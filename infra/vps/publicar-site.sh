#!/bin/bash
# Gera a página de links (plataforma/links.json + perfis) e envia para a VPS (zeexplica.com.br).
# Uso: bash infra/vps/publicar-site.sh        (VPS_IP e SSH_KEY podem ser trocados por variável)
set -e
cd "$(dirname "$0")/../.."
IP="${VPS_IP:-179.198.102.160}"; KEY="${SSH_KEY:-$HOME/.ssh/convertaja_vps}"
node -e "import('./plataforma/lib/links.mjs').then((m) => console.log('páginas:', m.gerar().paginas))"
node plataforma/lib/receitas.mjs   # Receitas do Zé: site/receitas, site/receita, sitemap e robots
rsync -az --delete -e "ssh -i $KEY -o IdentitiesOnly=yes" site/ "root@$IP:/opt/edge/sites/zeexplica/"
echo "Publicado: https://zeexplica.com.br  e  https://zeexplica.com.br/receitas/"
