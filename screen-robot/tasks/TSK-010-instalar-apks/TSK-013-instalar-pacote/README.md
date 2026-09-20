# Instalar pacote

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-013-instalar-pacote` |
| TSK | [`TSK-013`](../../../7.tasks.md) |
| Origem | SC-10 |
| Pai | [`TSK-010-instalar-apks`](../README.md) |
| Depende | [`TSK-012`](../TSK-012-baixar-apk/README.md) |

## Entradas

- Serial no handle; path do artefato

## Execução

- Componente `installPackage` + orquestração `createInstallApk` (skip se versão ok)

## Saídas

- `InstallResult` · `APK_INSTALL_FAILED`
