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

_redroid_colima_listed_running() {
  colima list 2>/dev/null | awk 'NR>1 && $1=="default" {print $2}' | grep -qi running
}

# Colima “Running” + Docker morto: `colima start` ignora; `status` pode falhar (“empty value”).
# `colima restart/stop` também pode travar no hostagent — matar limactl e start limpo.
_redroid_revive_colima() {
  echo "Docker indisponível com Colima up. Reiniciando Colima..."
  if ! perl -e 'alarm shift; exec @ARGV' 90 colima restart; then
    echo "colima restart falhou/travou — forçando stop/start..."
    perl -e 'alarm shift; exec @ARGV' 30 colima stop -f 2>/dev/null || true
    pkill -9 -f 'limactl hostagent.*colima' 2>/dev/null || true
    pkill -9 -f 'limactl usernet' 2>/dev/null || true
    sleep 1
    colima start || return 1
  fi
  return 0
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

  if _redroid_colima_listed_running || colima status 2>/dev/null | grep -qi 'is running'; then
    _redroid_revive_colima || true
  else
    echo "Docker indisponível. Tentando iniciar Colima..."
    colima start || _redroid_revive_colima || true
  fi

  colima_sock="$(_redroid_docker_sock || true)"
  if [[ -n "$colima_sock" ]]; then
    export DOCKER_HOST="unix://${colima_sock}"
  fi

  # binderfs necessário para redroid dentro da VM (não bloquear se ssh travar)
  _redroid_colima_ssh sh -c 'sudo mkdir -p /dev/binderfs; mountpoint -q /dev/binderfs || sudo mount -t binder binder /dev/binderfs' 2>/dev/null || true

  local i
  for i in $(seq 1 45); do
    if _redroid_docker_ok; then
      return 0
    fi
    sleep 1
  done

  echo "Erro: não consegue falar com o Docker."
  echo "  macOS: colima stop -f && colima start"
  echo "  (ou exporte DOCKER_HOST=unix://\$HOME/.colima/default/docker.sock)"
  return 1
}

_redroid_ensure_docker
