# REF-EP00-US03 — Catálogo de responsáveis

| Campo | Valor |
|-------|-------|
| História | [`US-03`](../../stories/user-stories.md) · rastreio [`epics.md`](../../epics.md) |
| Versão | v1 |
| Status | ready-for-dev |

## Escopo técnico

CRUD do **catálogo do projeto** por tipo: pessoa, IA, prestador, máquina. Remoção bloqueada se o item ainda for responsável de alguma unidade.

## Modelo de dados (sugerido)

```text
CatalogEntry
  id: UUID
  projectId: UUID
  type: person | ai | provider | machine
  displayName: string
  active: boolean
  metadata: json (opcional)
```

## API / comandos

- `AddCatalogEntry({ type, displayName, metadata? })`
- `RemoveCatalogEntry({ id })` — falha se referenciado como responsável
- `ListCatalogEntries({ type? })`

## Tarefas

- [ ] Schema + repositório de `CatalogEntry`
- [ ] Incluir entradas por tipo
- [ ] Listar para UI de atribuição
- [ ] Remover quando sem referências
- [ ] Bloquear remoção se `WorkUnit.assigneeId == entry.id`
- [ ] Catálogo vazio por tipo → lista vazia (atribuição impossível)
- [ ] Testes US-03

## Dependências

- US-01 (`WorkUnit` para checar referências) — pode implementar catálogo antes e validar referência quando assignee existir
- Consumido por US-02

## Riscos

- Ordem de bootstrap: seed mínimo de catálogo em ambiente de demo

## Fora de escopo

- Autenticação real / SSO de pessoas
- Runtime de IA ou máquina
