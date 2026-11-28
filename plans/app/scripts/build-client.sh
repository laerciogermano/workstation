#!/usr/bin/env bash
# Gera os pacotes do client para Windows, macOS e Linux em dist/client/, com somas SHA-256.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION="${VERSION:-0.2.0}"
OUT="$PWD/dist/client"
rm -rf "$OUT"
mkdir -p "$OUT"
for target in darwin/arm64 darwin/amd64 linux/amd64 linux/arm64 windows/amd64 windows/arm64; do
  os="${target%/*}" arch="${target#*/}"
  stage="$(mktemp -d)"
  bin=plans-client
  [[ $os == windows ]] && bin=plans-client.exe
  (cd apps/client && CGO_ENABLED=0 GOOS=$os GOARCH=$arch go build -trimpath -ldflags="-s -w -X main.version=$VERSION" -o "$stage/$bin" ./cmd/plans-client)
  name="plans-client_${VERSION}_${os}_${arch}"
  if [[ $os == windows ]]; then
    cp installers/install.ps1 "$stage/"
    (cd "$stage" && zip -q -X "$OUT/$name.zip" "$bin" install.ps1)
  else
    cp installers/install.sh "$stage/"
    tar -czf "$OUT/$name.tar.gz" -C "$stage" "$bin" install.sh
  fi
  rm -rf "$stage"
done
(cd "$OUT" && shasum -a 256 plans-client_* > SHA256SUMS)
ls -lh "$OUT"
