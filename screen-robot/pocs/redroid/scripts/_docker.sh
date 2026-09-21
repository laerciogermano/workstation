#!/usr/bin/env bash
# shellcheck shell=bash
# Configura Docker para Colima no macOS (socket padrão do Desktop não vê o redroid).

_redroid_docker_sock() {
  local s
  for s in \
    "${HOME}/.colima/default/docker.sock" \
    "${HOME}/.colima/docker.sock"; do
    if [[ -S "$s" ]]; then
      echo "$s"
      return 0
    fi
  done
  return 1
}

_redroid_docker_ok() {
  docker info >/dev/null 2>&1
}

# colima ssh pode travar se a VM estiver zumbi — limita espera (perl alarm)
_redroid_colima_ssh() {
  perl -e 'alarm shift; exec @ARGV' 25 colima ssh -- "$@"
}

_redroid_ensure_docker() {
  local colima_sock
  colima_sock="$(_redroid_docker_sock || true)"

  if [[ "$(uname -s)" == "Darwin" && -n "$colima_sock" ]]; then
    export DOCKER_HOST="unix://${colima_sock}"
  fi

  if _redroid_docker_ok; then
    return 0
  fi

  if [[ "$(uname -s)" != "Darwin" ]] || ! command -v colima >/dev/null 2>&1; then
    echo "Erro: não consegue falar com o Docker."
    return 1
  fi

  # Colima “running” com socket morto: start ignora — precisa restart
  if colima status 2>/dev/null | grep -qi 'is running'; then
    echo "Docker indisponível com Colima up. Reiniciando Colima..."
    colima restart
  else
    echo "Docker indisponível. Tentando iniciar Colima..."
    colima start
  fi

  colima_sock="$(_redroid_docker_sock || true)"
  if [[ -n "$colima_sock" ]]; then
    export DOCKER_HOST="unix://${colima_sock}"
  fi

  # binderfs necessário para redroid dentro da VM (não bloquear se ssh travar)
  _redroid_colima_ssh sh -c 'mountpoint -q /dev/binderfs || sudo mount -t binder binder /dev/binderfs' 2>/dev/null || true

  local i
  for i in $(seq 1 30); do
    if _redroid_docker_ok; then
      return 0
    fi
    sleep 1
  done

  echo "Erro: não consegue falar com o Docker."
  echo "  macOS: colima restart   (ou exporte DOCKER_HOST=unix://\$HOME/.colima/default/docker.sock)"
  return 1
}

_redroid_ensure_docker
