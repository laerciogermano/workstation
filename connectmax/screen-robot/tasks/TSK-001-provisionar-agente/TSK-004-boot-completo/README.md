# Boot completo

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-004-boot-completo` |
| TSK | [`TSK-004`](../../../7.tasks.md) |
| Origem | SC-03 |
| Pai | [`TSK-001-provisionar-agente`](../README.md) |
| Estado | `AdbOnline` → `Booted` |
| Depende | [`TSK-003-serial-adb-online`](../TSK-003-serial-adb-online/README.md) |

## Entradas

- Serial ADB online (TSK-003)
- Timeout de boot alinhado à config de provisionamento

## Execução

- Interno: `waitBootCompleted` — poll de `sys.boot_completed` (ou equivalente) via `adb shell getprop`
- Loop até `1` ou timeout; não exportar o helper

## Saídas

- Device com boot completo (`Booted`) → `AgentHandle` com `bootCompleted: true`
- Erro típico: `PROVISION_BOOT_TIMEOUT`

## Documentação

- Cenário: [`4.scenarios.md`](../../../4.scenarios.md#ep-01--provisionar-agente)
- BDD:

```gherkin
Cenário: SC-03 Boot completo no device
  Dado o serial ADB online
  Quando o sistema faz poll de boot (ex. sys.boot_completed)
  Então o device reporta boot completo
```

- Plano: passos #15–#19 em [`EP-01-provisionar-agente.md`](../../../implementation-plan/EP-01-provisionar-agente.md)
