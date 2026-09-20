#!/usr/bin/env bash
# shellcheck shell=bash
# Configura Docker para Colima no macOS (socket padrão do Desktop não vê o redroid).

_redroid_ensure_docker() {
  if [[ -n "${DOCKER_HOST:-}" ]]; then
    return 0
  fi
  local colima_sock="${HOME}/.colima/default/docker.sock"
  if [[ "$(uname -s)" == "Darwin" && -S "$colima_sock" ]]; then
    export DOCKER_HOST="unix://${colima_sock}"
  fi
  if ! docker info >/dev/null 2>&1; then
    if [[ "$(uname -s)" == "Darwin" ]] && command -v colima >/dev/null 2>&1; then
      echo "Docker indisponível. Tentando iniciar Colima..."
      colima start
      export DOCKER_HOST="unix://${colima_sock}"
      # binderfs necessário para redroid dentro da VM
      colima ssh -- sh -c 'mountpoint -q /dev/binderfs || sudo mount -t binder binder /dev/binderfs' 2>/dev/null || true
    fi
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "Erro: não consegue falar com o Docker."
    echo "  macOS: colima start   (ou exporte DOCKER_HOST=unix://\$HOME/.colima/default/docker.sock)"
    return 1
  fi
}

_redroid_ensure_docker
