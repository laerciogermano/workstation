# Serial ADB online

| Campo | Valor |
|-------|--------|
| TSK | [`TSK-003`](../../../7.tasks.md) |
| Origem | SC-02 |
| Pai | [`provisionar-agente`](../README.md) |
| Estado | `Reachable` → `AdbOnline` |
| Depende | [`subir-e-conectar`](../subir-e-conectar/README.md) |

## Entradas

- Agent alcançável (subir-e-conectar)
- Serial esperado na config (`cfg.provision.serial` / `cfg.device` / `ANDROID_SERIAL`)
- `connectTimeoutMs` (default 120000)

## Execução

- Interno: `ensureAdbOnline` — `adb connect` / listagem até o serial aparecer como `device`
- Loop com timeout; não exportar o helper

## Saídas

- Serial ADB online (`AdbOnline`)
- Erros típicos: `PROVISION_NO_SERIAL` · `PROVISION_ADB_TIMEOUT`

## Documentação

- Cenário: [`4.scenarios.md`](../../../4.scenarios.md#ep-01--provisionar-agente)
- BDD:

```gherkin
Cenário: SC-02 Serial ADB fica online
  Dado o agent alcançável e o serial esperado na config
  Quando adb connect / listagem de devices é repetida até o serial aparecer como device
  Então o serial ADB está online
```

- Plano: passos #7–#14 em [`EP-01-provisionar-agente.md`](../../../implementation-plan/EP-01-provisionar-agente.md)
