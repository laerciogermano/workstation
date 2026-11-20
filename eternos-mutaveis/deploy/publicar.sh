#!/usr/bin/env bash
# Publica o site com todas as versões (index = 5.0) em eternosmutaveis.com / eternos-mutaveis.laerciogermano.com.
# Uso: SSHPASS='senha do Contabo 185' bash deploy/publicar.sh
set -euo pipefail
: "${SSHPASS:?defina SSHPASS com a senha do Contabo 185}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST=/tmp/eternos-mutaveis-deploy
python3 "$ROOT/deploy/_montar_site.py" "$DEST"
export SSHPASS
sshpass -e rsync -az --delete -e 'sshpass -e ssh -o StrictHostKeyChecking=no' "$DEST/" root@185.250.37.82:/opt/eternos-mutaveis/
curl -s -o /dev/null -w "apex %{http_code}\n" https://eternosmutaveis.com/
curl -s -o /dev/null -w "sub %{http_code}\n" https://eternos-mutaveis.laerciogermano.com/
curl -s -o /dev/null -w "v1 %{http_code}\n" https://eternosmutaveis.com/v1.html
