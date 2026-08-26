# REF-EP00-US02 — Atribuir responsável tipado

| Campo | Valor |
|-------|-------|
| História | [`US-02`](../../stories/user-stories.md) · rastreio [`epics.md`](../../epics.md) |
| Versão | v1 |
| Status | ready-for-dev |

## Escopo técnico

Atribuir, trocar ou remover **um** responsável por unidade, somente a partir do catálogo. Filho nasce sem responsável (sem herança). Flag/comportamento “máquina como linguagem” só como marcador de tipo em v1 (execução real em versões futuras).

## Modelo de dados (sugerido)

```text
WorkUnit (extensão)
  assigneeId: UUID | null   # CatalogEntry.id
  assigneeType: person | ai | provider | machine | null  # desnormalizado opcional
```

## API / comandos

- `AssignResponsible({ workUnitId, catalogEntryId })` — valida catálogo; substitui anterior
- `ClearResponsible({ workUnitId })`
- Ao criar filho: `assigneeId = null` (garantir no create com parent)

## Tarefas

- [ ] Campo(s) de assignee em `WorkUnit`
- [ ] Assign com validação de existência no catálogo
- [ ] Reject se entry inexistente/inativa
- [ ] Replace (troca A→B) atômico
- [ ] Clear responsável
- [ ] Create child sem herdar assignee do pai
- [ ] Expor tipo máquina na leitura (para UI/feature flag futura)
- [ ] Testes US-02

## Dependências

- **US-03** (catálogo) — ordem sugerida: US-03 antes de US-02
- US-01 (WorkUnit)

## Riscos

- Inconsistência se entry for removida do catálogo sem limpar assignees (US-03 bloqueia remoção)

## Fora de escopo

- Múltiplos responsáveis
- Herança pai→filho
- Execução IA/máquina/prestador
