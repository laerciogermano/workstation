# REF-EP00-US01 — Unidade, vocabulário e ciclo de vida

| Campo | Valor |
|-------|-------|
| História | [`US-01`](../../stories/user-stories.md) · rastreio [`epics.md`](../../epics.md) |
| Versão | v1 |
| Status | ready-for-dev |

## Escopo técnico

Implementar o **núcleo de domínio** da unidade de trabalho: id canônico (UUID), título, ciclo de vida (`active` / `archived` / deleted), vocabulário por visão (rótulo card/tarefa/nó/arquivo só na projeção) e exclusão em cascata da subárvore. Sem merge.

## Modelo de dados (sugerido)

```text
WorkUnit
  id: UUID (canônico, imutável)
  title: string (obrigatório)
  lifecycle: active | archived
  parentId: UUID | null          # hierarquia; v1 pode existir sem UI de aninhar
  deletedAt: datetime | null     # soft ou hard delete conforme ADR
  createdAt, updatedAt
```

Projeções/views **não** duplicam entidade: Board/Gantt/Árvore/Explorar leem o mesmo `WorkUnit`.

## API / comandos

- `CreateWorkUnit({ title }) → WorkUnit`
- `UpdateWorkUnitTitle({ id, title })`
- `ArchiveWorkUnit({ id })` / `UnarchiveWorkUnit({ id })`
- `DeleteWorkUnit({ id })` — remove unidade + descendentes em todas as visões
- `GetWorkUnit({ id })` / `ListWorkUnits({ lifecycle? })`

## Tarefas

- [ ] Definir persistência de `WorkUnit` (schema + repositório)
- [ ] Gerar UUID na criação; garantir imutabilidade do id
- [ ] Validar título obrigatório
- [ ] Implementar archive / unarchive (fluxo ativo vs Explorar)
- [ ] Implementar delete com cascata de filhos
- [ ] Camada de projeção: mapear visão → rótulo (card | tarefa | atividade/nó | arquivo)
- [ ] Rejeitar/omitir operação de merge (fora de escopo v1)
- [ ] Testes alinhados aos critérios de aceite da US-01

## Dependências

- Nenhuma história anterior; **base** das demais US v1
- ADR opcional: soft delete vs hard delete

## Riscos

- Cascata de delete em árvores profundas (performance)
- Consistência se no futuro existirem projeções cacheadas por visão

## Fora de escopo

- Merge de unidades
- Aninhar/desaninhar na UI (US-06)
- Lista/busca no Explorar (US-19)
