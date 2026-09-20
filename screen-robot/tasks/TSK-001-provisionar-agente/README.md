# Provisionar agente

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-001-provisionar-agente` |
| TSK | [`TSK-001`](../../7.tasks.md) |
| Origem | EP-01 · US-01 · US-20 · US-22 |
| Filhas | [`TSK-002`](TSK-002-subir-e-conectar/README.md) · [`TSK-003`](TSK-003-serial-adb-online/README.md) · [`TSK-004`](TSK-004-boot-completo/README.md) · [`TSK-036`](TSK-036-mascarar-identidade/README.md) · [`TSK-032`](TSK-032-resgatar-agente/README.md) |
| Plano | [`implementation-plan/EP-01-provisionar-agente.md`](../../implementation-plan/EP-01-provisionar-agente.md) |

## Entradas

- Stories / épicos: [`1.stories.md`](../../1.stories.md) · [`2.epics.md`](../../2.epics.md)
- Cenários SC-01..03 · SC-25..26 · SC-28 e BDDs
- Host com `adb` + AVD (Google APIs/Play) com identidade mascarada
- Stack: Node ≥ 18 · JS

## Execução

- `provisionEmulator(cfg)` — **nome** obrigatório; sobe **AVD/emulador novo**; resolve serial
- Mesmo `provisionEmulator({ name })` — se o nome já existir, anexa sem criar
- Filhas: TSK-002→004 (create) · TSK-036 (mascarar identidade) · TSK-032→034 (attach)

## Saídas

- Handle com `name`, `serial`, `kind`, `bootCompleted: true`
- Erros tipados: `PROVISION_NAME_TAKEN` · `PROVISION_NAME_NOT_FOUND` · `PROVISION_*`

## Documentação

- Cenários: [`4.scenarios.md#ep-01--provisionar-agente`](../../4.scenarios.md#ep-01--provisionar-agente)
- BDDs: [`5.bdds.md#ep-01--provisionar-agente`](../../5.bdds.md#ep-01--provisionar-agente)
- Plano: [`implementation-plan/EP-01-provisionar-agente.md`](../../implementation-plan/EP-01-provisionar-agente.md)
- Código: [`src/lib/provision.js`](../../src/lib/provision.js)
- Runtime: [`pocs/android-studio/`](../../pocs/android-studio/README.md) · mascaramento [`pocs/`](../../pocs/README.md)
