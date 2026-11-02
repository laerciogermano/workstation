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

Persistência JSON local + seed a partir de `contas-facebook-chrome.csv`.

## Entrega
- Módulo na `human-cdp`
- README do contrato + exemplos
- Aceite: seed → list → create → start → connect → stop → remove
- **Sem** painel HTML / servidor de UI

## Fora de escopo
- Frontend CRUD
- Cloud / multi-host

## Relacionados
- Lib humana: https://trello.com/c/5tt5ZTeN
- Lab: https://trello.com/c/XcjfqioO
- CSV: `screen-robot/pocs/android-studio/contas-facebook-chrome.csv`
