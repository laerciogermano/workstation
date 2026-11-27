#!/bin/sh
# Instala o plans-client para a pessoa atual (macOS e Linux), sem administrador.
#   ./install.sh               instala em ~/.local/bin
#   ./install.sh --uninstall   remove o programa e o início no login (--purge apaga também a configuração)
set -eu
if [ "$(id -u)" = "0" ]; then echo "Não rode como root." >&2; exit 1; fi
dest="${PLANS_BIN_DIR:-$HOME/.local/bin}"
if [ "${1:-}" = "--uninstall" ]; then
  if [ -x "$dest/plans-client" ]; then
    if [ "${2:-}" = "--purge" ]; then "$dest/plans-client" unpair; else "$dest/plans-client" stop; fi
    rm -f "$dest/plans-client"
  fi
  echo "plans-client removido."
  exit 0
fi
mkdir -p "$dest"
install -m 755 "$(dirname "$0")/plans-client" "$dest/plans-client"
echo "Instalado em $dest/plans-client ($("$dest/plans-client" version))"
case ":$PATH:" in
  *":$dest:"*) ;;
  *) echo "Adicione ao seu PATH:  export PATH=\"$dest:\$PATH\"" ;;
esac
