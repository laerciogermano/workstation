# Boot completo

| Campo | Valor |
|-------|--------|
| TSK | [`TSK-004`](../../../7.tasks.md) |
| Origem | SC-03 |
| Pai | [`provisionar-agente`](../README.md) |
| Estado | `AdbOnline` → `Booted` |
| Depende | [`serial-adb-online`](../serial-adb-online/README.md) |

## Entradas

- Serial ADB online (serial-adb-online)
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
