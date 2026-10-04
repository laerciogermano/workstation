# shellcheck shell=bash
# Docker no Linux com KVM. macOS não é suportado para este POC.

_docker_avd_ok() {
  docker info >/dev/null 2>&1
}

_docker_avd_ensure() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    echo "Erro: docker-avd exige Linux + /dev/kvm."
    echo "  Neste Mac use provision.kind=avd (pocs/android-studio)."
    echo "  Rollback: device.config.json → kind \"avd\", name ConnectMax_Cam."
    return 1
  fi

  if [[ ! -e /dev/kvm ]]; then
    echo "Erro: /dev/kvm ausente. Ative KVM (ou nested virt na VM)."
    echo "  Ubuntu: sudo apt install qemu-kvm && sudo usermod -aG kvm \$USER"
    return 1
  fi

  if ! _docker_avd_ok; then
    echo "Erro: Docker inacessível. Instale/inicie o Docker Engine."
    return 1
  fi

  return 0
}

_docker_avd_ensure_adbkey() {
  local key="${HOME}/.android/adbkey"
  mkdir -p "${HOME}/.android"
  if [[ ! -f "$key" ]]; then
    if command -v adb >/dev/null 2>&1; then
      adb keygen "$key" >/dev/null 2>&1 || true
    fi
  fi
  if [[ ! -f "$key" ]]; then
    # fallback mínimo (openssl) se adb keygen falhar
    openssl genrsa -out "$key" 2048 2>/dev/null || true
    chmod 600 "$key" 2>/dev/null || true
  fi
  if [[ -f "$key" ]]; then
    export ADBKEY
    ADBKEY="$(cat "$key")"
  else
    echo "Aviso: sem ~/.android/adbkey — ADB no container pode rejeitar o host."
  fi
}

_docker_avd_slug() {
  echo "${1:-default}" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/^$/default/'
}

# Porta host 5655–5754 — mesmo algoritmo que docker-avd-instance.js
_docker_avd_port_for_name() {
  local s="${1:-default}"
  if command -v node >/dev/null 2>&1; then
    node -e '
      const s = process.argv[1] || "default";
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
      console.log(5655 + (h % 100));
    ' "$s"
    return 0
  fi
  echo 5655
}

_docker_avd_apply_name() {
  DOCKER_AVD_NAME="${DOCKER_AVD_NAME:-}"
  if [[ -z "$DOCKER_AVD_NAME" ]]; then
    export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-docker-avd-default}"
    export DOCKER_AVD_CONTAINER_NAME="${DOCKER_AVD_CONTAINER_NAME:-docker-avd-default}"
    export ADB_PORT="${ADB_PORT:-5655}"
    export GRPC_PORT="${GRPC_PORT:-8655}"
    return 0
  fi
  local slug
  slug="$(_docker_avd_slug "$DOCKER_AVD_NAME")"
  export COMPOSE_PROJECT_NAME="docker-avd-${slug}"
  export DOCKER_AVD_CONTAINER_NAME="docker-avd-${slug}"
  export DOCKER_AVD_NAME
  export ADB_PORT="${ADB_PORT:-$(_docker_avd_port_for_name "$DOCKER_AVD_NAME")}"
  export GRPC_PORT="${GRPC_PORT:-$((ADB_PORT + 3000))}"
}

_docker_avd_volume_name() {
  # compose v2: <project>_avd-data
  echo "${COMPOSE_PROJECT_NAME}_avd-data"
}

_docker_avd_ensure
_docker_avd_ensure_adbkey
