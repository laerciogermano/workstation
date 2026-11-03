#!/bin/zsh
# Mantém um start-worker-*.sh vivo: se o processo sair, sobe de novo.
# Uso: ./scripts/keep-worker.sh ./scripts/start-worker-daniela-cdp.sh
# Escape: KEEP_WORKER=0 no script filho (não usado aqui) ou mate o keep (não o filho).
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "uso: $0 ./scripts/start-worker-NOME.sh" >&2
  exit 2
fi
# resolve relativo à pasta worker/
if [[ "$TARGET" != /* ]]; then
  TARGET="$ROOT/$TARGET"
fi
if [[ ! -x "$TARGET" && ! -f "$TARGET" ]]; then
  echo "script não encontrado: $TARGET" >&2
  exit 2
fi
chmod +x "$TARGET" 2>/dev/null || true
BACKOFF_MS="${KEEP_WORKER_BACKOFF_MS:-5000}"
NAME="$(basename "$TARGET" .sh)"
echo "[keep-worker] watch $NAME → $TARGET (backoff ${BACKOFF_MS}ms)"
while true; do
  set +e
  "$TARGET"
  code=$?
  set -e
  echo "[keep-worker] $NAME saiu exit=$code — reinicia em ${BACKOFF_MS}ms"
  sleep "$(python3 -c "print(${BACKOFF_MS}/1000)")"
done
