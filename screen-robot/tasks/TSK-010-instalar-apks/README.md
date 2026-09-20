# Instalar APKs

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-010-instalar-apks` |
| TSK | [`TSK-010`](../../7.tasks.md) |
| Origem | EP-03 · US-06 |
| Filhas | [`TSK-011`](TSK-011-ler-versao/README.md) · [`TSK-012`](TSK-012-baixar-apk/README.md) · [`TSK-013`](TSK-013-instalar-pacote/README.md) |
| Plano | [`implementation-plan/EP-03-instalar-apks.md`](../../implementation-plan/EP-03-instalar-apks.md) |

## Entradas

- Handle EP-01; specs em `device.config.json` (`apps.*`)

## Execução

- API: `handle.installApk(app)` (SC-08→10 encapsulados)
- Unitários isolados; BDD e2e US-06 / EP-03

## Saídas

- Apps instalados (ou skip se já na versão)
