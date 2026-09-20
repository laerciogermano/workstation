# Subir e conectar

| Campo | Valor |
|-------|--------|
| TSK | [`TSK-002`](../../../7.tasks.md) |
| Origem | SC-01 |
| Pai | [`provisionar-agente`](../README.md) |
| Estado | `Absent` / `Starting` → `Reachable` |

## Entradas

- Host, imagem/runtime e script de start (`kind`, `startScript?`)
- Config resolvida (após `resolveConfig` interno)

## Execução

- Interno: `startRuntime` — sobe o agent se ainda não estiver alcançável
- Materializar Android via script (ex. redroid `start.sh` / AVD)
- Confirmar processo/porta alcançável

## Saídas

- Processo do agent em execução e alcançável (`Reachable`)
- Erro típico: `PROVISION_START_FAILED`

## Documentação

- Cenário: [`4.scenarios.md`](../../../4.scenarios.md#ep-01--provisionar-agente)
- BDD:

```gherkin
Cenário: SC-01 Agent sobe e fica alcançável
  Dado host, imagem/runtime e script de start
  Quando o agent é iniciado e a conexão é estabelecida
  Então o processo do agent está em execução e alcançável
```

- Plano: passos #3–#6 em [`EP-01-provisionar-agente.md`](../../../implementation-plan/EP-01-provisionar-agente.md)
- Runtime: [`sources/redroid/`](../../../sources/redroid/README.md) · [`sources/android-studio/`](../../../sources/android-studio/README.md)
