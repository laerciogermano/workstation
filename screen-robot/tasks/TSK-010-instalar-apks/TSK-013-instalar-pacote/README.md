# Instalar pacote

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-013-instalar-pacote` |
| TSK | [`TSK-013`](../../../7.tasks.md) |
| Origem | SC-10 |
| Pai | [`TSK-010-instalar-apks`](../README.md) |
| Depende | [`TSK-012`](../TSK-012-baixar-apk/README.md) |

## Entradas

- `serial`; path do artefato

## Execução

- Componente `installPackage` + orquestração `installApk({ serial, … })` (skip se versão ok)

## Saídas

- `InstallResult` · `APK_INSTALL_FAILED`
