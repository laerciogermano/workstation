# REF-EP04-US18 — Persistir e abrir no Explorar

| Campo | Valor |
|-------|-------|
| História | [`US-18`](../../stories/user-stories.md) · rastreio [`epics.md`](../../epics.md) |
| Versão | v1 |
| Status | ready-for-dev |

## Escopo técnico

Toda `WorkUnit` é um **arquivo** lógico no Explorar (mesmo UUID). Abrir unidade a partir do board (e depois outras visões) no Explorar e o caminho inverso. Unidades arquivadas permanecem listáveis no Explorar. Falha de persistência deve ser sinalizada sem sucesso falso.

## Modelo de dados (sugerido)

```text
# Sem entidade duplicada: Explorar lista WorkUnit
# Opcional:
FileViewIndex
  workUnitId: UUID
  pathHint: string   # futuro (US-19); v1 pode ser flat
```

## API / comandos

- `ListExploreFiles({ includeArchived: true })` — por padrão inclui archived; fluxo ativo exclui
- `OpenInExplore({ workUnitId })`
- `OpenInBoard({ workUnitId })` — navega para placement se existir
- Persistência: create/update retornam erro tipado se falhar I/O

## Tarefas

- [ ] Endpoint/lista Explorar baseada em WorkUnit (mesmo id)
- [ ] Incluir `archived` no Explorar; excluir do board ativo
- [ ] Navegação Board → Explorar (deep link / route por UUID)
- [ ] Navegação Explorar → Board
- [ ] Propagar falha de persistência à UI
- [ ] Garantir create card/unidade sempre materializa no Explorar
- [ ] Testes US-18

## Dependências

- **US-01** (WorkUnit + archive)
- US-05 (cards no board para deep link)

## Riscos

- Rotas de UI ainda sem Gantt/árvore — stubs `OpenInGantt`/`OpenInTree` podem retornar “não disponível na v1”

## Fora de escopo

- Ordenação/busca/breadcrumb (US-19)
- Formato físico de arquivo em disco (detalhe de storage)
