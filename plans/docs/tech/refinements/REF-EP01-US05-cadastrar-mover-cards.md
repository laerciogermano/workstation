# REF-EP01-US05 — Cadastrar e mover cards

| Campo | Valor |
|-------|-------|
| História | [`US-05`](../../stories/user-stories.md) · rastreio [`epics.md`](../../epics.md) |
| Versão | v1 |
| Status | ready-for-dev |

## Escopo técnico

Criar card (= `WorkUnit` + posição no board), validar título, atualizar título, mover entre coluna/raia válidas. Sem WIP.

## Modelo de dados (sugerido)

```text
BoardPlacement
  workUnitId: UUID (FK WorkUnit)
  boardId: UUID
  columnId: UUID
  laneId: UUID
  positionInCell: int (opcional)
```

Card **é** a unidade com projeção board + `BoardPlacement`.

## API / comandos

- `CreateCard({ title, columnId, laneId })` — cria WorkUnit + placement
- `UpdateCardTitle({ workUnitId, title })` — delega a UpdateWorkUnitTitle
- `MoveCard({ workUnitId, columnId, laneId })` — valida ids; senão no-op/erro e mantém origem

## Tarefas

- [ ] Schema `BoardPlacement`
- [ ] Create card com título obrigatório
- [ ] Reject create sem título
- [ ] Update título refletido em qualquer leitura de WorkUnit
- [ ] Move para coluna/raia existentes
- [ ] Reject/keep position se destino inválido
- [ ] Listar cards por board (grid coluna × raia)
- [ ] Testes US-05

## Dependências

- US-01 (WorkUnit)
- US-04 (colunas/raias)
- US-02 opcional na mesma tela (atribuir) — não bloqueia create/move

## Riscos

- Cards órfãos se coluna removida — mitigado por US-04 (bloqueio)

## Fora de escopo

- Aninhar cards (US-06)
- Coluna de execução / IA (US-07)
- Chamado (US-08)
