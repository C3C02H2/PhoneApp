#!/bin/bash
set -e

# ============================================================
#  DoYouTry - Deployment за doyoutry.duckdns.org
# ============================================================

DOMAIN="doyoutry.duckdns.org"
EMAIL="tzvetomir4@gmail.com"
DB_NAME="doyoutry"
DB_USER="doyoutry_user"
DB_PASS="$(openssl rand -hex 16)"
SECRET_KEY="$(openssl rand -hex 64)"
APP_DIR="$(pwd)"

echo "============================================"
echo "  DoYouTry Deployment"
echo "  Domain: $DOMAIN"
echo "============================================"

# --- 1. Stop Apache (frees port 80) ---
echo "[1/7] Stopping Apache..."
sudo systemctl stop apache2
sudo systemctl disable apache2
echo "Apache stopped and disabled."

# --- 2. Firewall check ---
echo "[2/7] Firewall..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "Ports 80, 443 allowed."

# --- 3. Create .env.production ---
echo "[3/7] Creating .env.production..."
cat > .env.production << ENVEOF
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASS
SECRET_KEY=$SECRET_KEY
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@db:5432/$DB_NAME
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tzvetomir4@gmail.com
SMTP_PASSWORD=nkjn bxwm mcik memg
SMTP_FROM=tzvetomir4@gmail.com
DOMAIN=$DOMAIN
ENVEOF
chmod 600 .env.production
echo ".env.production created."

# --- 4. Setup nginx dirs + HTTP config ---
echo "[4/7] Preparing nginx..."
mkdir -p nginx/certbot/conf nginx/certbot/www

cat > nginx/api.conf << 'NGINXCONF'
upstream backend {
    server backend:8000;
}
server {
    listen 80;
    server_name doyoutry.duckdns.org;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    client_max_body_size 10M;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXCONF

# --- 5. Start services ---
echo "[5/7] Starting Docker services..."
docker compose --env-file .env.production up -d --build

echo "Waiting 15 seconds for services..."
sleep 15

echo "Health check..."
curl -sf http://localhost/health && echo " -> OK!" || echo " -> Not ready, checking logs..."
docker compose logs --tail 20 backend

# --- 6. Get SSL certificate ---
echo "[6/7] Getting SSL certificate..."
docker compose run --rm certbot certonly \
    --webroot --webroot-path=/var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos --no-eff-email

# Switch to HTTPS config
cat > nginx/api.conf << 'NGINXCONF'
upstream backend {
    server backend:8000;
}

limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    listen 80;
    server_name doyoutry.duckdns.org;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name doyoutry.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/doyoutry.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/doyoutry.duckdns.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    client_max_body_size 10M;

    location / {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }
}
NGINXCONF

docker compose restart nginx
sleep 3

echo "HTTPS check..."
curl -sf "https://$DOMAIN/health" && echo " -> HTTPS OK!" || echo " -> Check: docker compose logs nginx"

# --- 7. SSL auto-renew ---
echo "[7/7] Setting up SSL auto-renew..."
(crontab -l 2>/dev/null; echo "0 3 * * * cd $APP_DIR && docker compose run --rm certbot renew --quiet && docker compose restart nginx") | sort -u | crontab -

echo ""
echo "============================================"
echo "  DONE!"
echo "============================================"
echo "  API:    https://$DOMAIN"
echo "  Health: https://$DOMAIN/health"
echo "  Docs:   https://$DOMAIN/docs"
echo ""
echo "  Logs:   docker compose logs -f"
echo "  DB pass: $DB_PASS"
echo "  SAVE THIS PASSWORD SOMEWHERE SAFE!"
echo "============================================"
