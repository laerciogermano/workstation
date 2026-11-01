#!/usr/bin/env bash
# Emite HTTPS (Let's Encrypt / Certbot) para notinhas.shop quando o DNS público resolver.
# Uso na Contabo: bash /opt/e-notas/deploy/issue-ssl-notinhas.sh
# Rollback: certbot delete --cert-name notinhas.shop ; restaurar sites-available/notinhas sem blocos Certbot.

set -euo pipefail
DOMAIN=notinhas.shop
WWW=www.notinhas.shop
EXPECT_IP="${EXPECT_IP:-144.126.154.90}"
EMAIL="${CERTBOT_EMAIL:-laerciogermanoo@gmail.com}"
MAX_TRIES="${MAX_TRIES:-60}"
SLEEP_SECS="${SLEEP_SECS:-60}"

resolve_a() {
  dig +time=3 +tries=1 +short A "$1" @1.1.1.1 | head -1 || true
}

echo "Aguardando DNS público de $DOMAIN → $EXPECT_IP …"
for i in $(seq 1 "$MAX_TRIES"); do
  ip="$(resolve_a "$DOMAIN")"
  www_ip="$(resolve_a "$WWW")"
  echo "[$i/$MAX_TRIES] $DOMAIN=$ip  $WWW=$www_ip"
  if [[ "$ip" == "$EXPECT_IP" ]]; then
    echo "DNS ok. Emitindo certificado…"
    certbot --nginx -d "$DOMAIN" -d "$WWW" \
      --non-interactive --agree-tos -m "$EMAIL" --redirect
    echo "OK: https://$DOMAIN/"
    nginx -t && systemctl reload nginx
    exit 0
  fi
  sleep "$SLEEP_SECS"
done

echo "Timeout: DNS ainda não aponta para $EXPECT_IP" >&2
exit 1
