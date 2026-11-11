# VPS Hostinger (179.198.102.160)

Desde 11/11/2026 o Convertajá roda só no Mac (backup da pasta antiga em `~/Backups/convertaja-vps-2026-11-11.tgz`).
Na VPS ficam o Precinho de Ouro (`/opt/precinho`) e o Caddy de entrada em `/opt/edge` (esta pasta), que dá HTTPS para:
- `painel.precinhodeouro.com.br` → contêiner `precinho-painel` (rede `edge`)
- `zeexplica.com.br` → página de links estática em `/opt/edge/sites/zeexplica`

Atualizar o Caddy: copie `Caddyfile`/`docker-compose.yml` para `/opt/edge` e rode `docker compose -p edge up -d` (ou `docker exec edge-caddy-1 caddy reload --config /etc/caddy/Caddyfile`).
Publicar a página de links: `bash infra/vps/publicar-site.sh` (ou `npm run site:publicar`).
DNS na Hostinger: registros A de `@` e `www` apontando para 179.198.102.160.
