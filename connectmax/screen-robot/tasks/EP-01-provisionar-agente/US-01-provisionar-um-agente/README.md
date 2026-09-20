# US-01 — Provisionar um agente

| Campo | Valor |
|-------|--------|
| ID | US-01 |
| Pai | [`EP-01`](../README.md) |
| Filhas | [`SC-01`](SC-01-subir-conectar-android/README.md) · [`SC-02`](SC-02-garantir-serial-adb-online/README.md) · [`SC-03`](SC-03-aguardar-boot-completo/README.md) |
| Story | [`1.stories.md`](../../../1.stories.md) |

## Entradas

- Config (`ProvisionConfig`: serial, kind, timeouts) e runtime Android (redroid/AVD)
- Host com `adb` e scripts de start do runtime

## Execução

- Caller invoca **só** `provisionEmulator(cfg)`
- A lib orquestra internamente: subir/conectar (SC-01) → serial online (SC-02) → boot completo (SC-03)
- Não exportar helpers (`resolveConfig`, `startRuntime`, `ensureAdbOnline`, `waitBootCompleted`)

## Saídas

- `AgentHandle` com serial online e `bootCompleted: true`
- Aceite: agent pronto para ADB — sem isso, nenhuma operação seguinte roda

## Documentação

- Cenários: [`4.scenarios.md`](../../../4.scenarios.md#us-01--provisionar-um-agente)
- BDD:

```gherkin
Cenário: US-01 Agent fica pronto para ADB
  Dado o config e o runtime Android disponíveis
  Quando o provisionamento sobe/conecta o agent, garante serial online e aguarda boot completo
  Então o agent está pronto para ADB (serial online e boot ok)
```

- Plano (sequência US-01): [`implementation-plan/EP-01-provisionar-agente.md`](../../../implementation-plan/EP-01-provisionar-agente.md)
- Código: [`lib/provision.js`](../../../sources/android-control/lib/provision.js) — `provisionEmulator`
