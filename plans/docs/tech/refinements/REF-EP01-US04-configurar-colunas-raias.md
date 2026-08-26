# REF-EP01-US04 — Configurar colunas e raias

| Campo | Valor |
|-------|-------|
| História | [`US-04`](../../stories/user-stories.md) · rastreio [`epics.md`](../../epics.md) |
| Versão | v1 |
| Status | ready-for-dev |

## Escopo técnico

Configuração do board: colunas e raias em quantidade livre, reordenação, remoção só se vazias.

## Modelo de dados (sugerido)

```text
Board
  id: UUID
  projectId: UUID

BoardColumn
  id: UUID
  boardId: UUID
  name: string
  position: int
  # isExecution: false em v1 (US-07)

BoardLane
  id: UUID
  boardId: UUID
  name: string
  position: int
```

## API / comandos

- `EnsureDefaultBoard({ projectId })` — board utilizável vazio
- `AddColumn` / `AddLane` / `ReorderColumns` / `ReorderLanes`
- `RemoveColumn` / `RemoveLane` — erro se houver cards na célula

## Tarefas

- [ ] Schema Board + Column + Lane
- [ ] Bootstrap board vazio / primeira coluna e raia
- [ ] CRUD add/reorder/remove
- [ ] Contagem de cards por coluna/raia antes de remove
- [ ] Bloquear remove se count > 0
- [ ] UI mínima de configuração (ou API-first + UI stub)
- [ ] Testes US-04

## Dependências

- Projeto/contexto de board
- US-05 preenche cards (validação de “vazia” precisa do modelo de posição do card)

## Riscos

- Definir se “vazio” = zero cards na coluna **ou** na interseção coluna×raia (recomenda-se: bloquear se qualquer card referencia a coluna ou a raia)

## Fora de escopo

- Colunas de execução (US-07)
- WIP limits
