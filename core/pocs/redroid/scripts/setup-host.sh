#!/usr/bin/env bash
# Carrega módulos de kernel necessários para o redroid (Ubuntu/Debian).
set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "Erro: redroid precisa de um host Linux (kernel com binder)."
  echo "No macOS, rode isto numa VM Linux ou num servidor remoto."
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute com sudo: sudo $0"
  exit 1
fi

KERNEL="$(uname -r)"
echo "Instalando linux-modules-extra-${KERNEL} (se disponível)..."
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y "linux-modules-extra-${KERNEL}" || true
fi

echo "Carregando binder_linux..."
modprobe binder_linux devices="binder,hwbinder,vndbinder"

if modprobe ashmem_linux 2>/dev/null; then
  echo "ashmem_linux carregado."
else
  echo "ashmem_linux indisponível (ok se androidboot.use_memfd=true estiver ativo)."
fi

echo
echo "Módulos carregados:"
lsmod | grep -E 'binder|ashmem' || true
echo
echo "Pronto. Suba o container com: ./scripts/start.sh"
