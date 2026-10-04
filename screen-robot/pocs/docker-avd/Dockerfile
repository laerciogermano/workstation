# Tag local do emulador oficial Google (Play Store) para o screen-robot.
# Host: Linux + /dev/kvm — macOS/Colima não suportado.
#
# Default = API 28 playstore (única Play hospedada no Artifact Registry público).
# API 30 playstore: gerar com ./scripts/build-image.sh e apontar DOCKER_AVD_IMAGE.
ARG BASE=us-docker.pkg.dev/android-emulator-268719/images/28-playstore-x64-no-metrics:30.1.2
FROM ${BASE}
