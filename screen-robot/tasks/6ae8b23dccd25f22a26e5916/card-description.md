## Objetivo
Expor na **lib** (`human-cdp`) um **contrato de CRUD de CDPs** — listar, criar, atualizar e remover registros de instâncias Chrome/debug — **sem UI HTML**. A interface é programática: o programador usa a lib, não um frontend.

## Contrato (API da lib)
```
listCdps(): CdpRecord[]
getCdp(id | port | name): CdpRecord | null
createCdp(input): CdpRecord
updateCdp(id, patch): CdpRecord
removeCdp(id): boolean
statusCdp(id): CdpStatus
startCdp(id, { url? }): CdpStatus
stopCdp(id): CdpStatus
connectCdp(id): Promise<HumanCdpSession>
```

### Modelo `CdpRecord`
`id`, `name`, `userDataDir`, `port`, `startScript`, `platform?`, `defaultUrl?`, `obs?`, `createdAt`, `updatedAt`

Persistência **no disco**: `start-*.sh` + `~/chrome-profiles`. **Sem JSON, sem CSV, sem UI.**

## Entrega
- Módulo na `human-cdp` (`listCdps` lê scripts existentes; `createCdp` só adiciona)
- README do contrato + exemplos
- Aceite: list (existentes) → create temp → remove temp (lab intacto)
- **Não apagar** CDPs/scripts/perfis já existentes no lab

## Fora de escopo
- Frontend CRUD
- JSON/CSV store
- Cloud / multi-host

## Relacionados
- Lib humana: https://trello.com/c/5tt5ZTeN
- Lab: https://trello.com/c/XcjfqioO
