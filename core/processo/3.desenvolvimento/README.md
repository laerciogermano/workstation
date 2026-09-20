# Desenvolvimento

Implementar **por IA** o que foi refinado — uma atividade (`tasks/`) por vez.

## Entradas

- Atividade da pasta [`tasks/`](../2.refinamento-tecnico/README.md) (EP → US → SC com Entradas · Execução · Saídas)
- Critérios de aceite (scenarios / BDDs)
- Desenho técnico / ADRs
- Repositório remoto do projeto
- Board / kanban do projeto ([`core/tasks`](../../tasks/README.md))

## Quem executa

**Tudo por IA.** Não há passo manual de código neste fluxo; a IA conduz clone → branch → TDD → implementação → teste → PR → status no board.

## Padrão de branch

```text
task/<ID>-<slug>
```

| Parte | Regra | Exemplo |
|-------|--------|---------|
| Prefixo | sempre `task/` | `task/` |
| `<ID>` | ID da atividade em execução (preferir SC-; senão US-/EP-/TSK-) | `SC-01` |
| `<slug>` | kebab-case do nome da atividade | `subir-conectar-android` |

Exemplos: `task/SC-01-subir-conectar-android` · `task/US-01-provisionar-um-agente` · `task/TSK-002-subir-e-conectar`

## Execução (por atividade)

Ordem **obrigatória** — não pular nem inverter:

1. **Baixar o projeto** — clone (ou worktree) limpo a partir do remoto, isolado para esta task
2. **Criar a branch** — nome no [padrão](#padrão-de-branch); publicar upstream quando houver push
3. **Criar os TDDs** — testes que falham e cobrem o aceite da atividade (Entradas · Execução · Saídas / BDD)
4. **Implementar a funcionalidade** — código mínimo para os TDDs passarem e o aceite fechar
5. **Testar** — rodar a suíte relevante; só seguir com testes verdes
6. **Concluir no board** — abrir **pull request** da branch e mudar o status da atividade para **Pendente aprovação**

Regras transversais:

- Preferência: uma SC (ou atividade folha) por ciclo
- Lote: primeiro um caso, validar; só então escalar
- Commits pequenos e revisáveis; CI do projeto deve passar no PR

## Status no board

| Status | Quando |
|--------|--------|
| Todo | Ainda não iniciada |
| Doing | IA em clone/branch/TDD/implementação/teste |
| **Pendente aprovação** | PR aberto; aguarda review / merge |
| Done | PR aprovado e mergeado |

## Saídas

- Branch no padrão `task/<ID>-<slug>`
- TDDs + implementação + evidência de testes verdes
- Pull request aberto
- Atividade no board em **Pendente aprovação**
- Próximo passo: revisão / [testes](../4.testes/README.md) conforme o ciclo do projeto
