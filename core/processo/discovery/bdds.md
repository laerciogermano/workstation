# Documento de BDDs

Artefato **3** do [discovery](README.md). Critérios de aceite em Gherkin **apenas por cenário (SC)** — arquivo único `bdds.md`.

**Antes:** [`scenarios.md`](scenarios.md). **Depois:** [`prototype.md`](prototype.md).

## Regras

1. Só depois do catálogo de cenários fechado.
2. **Um bloco Gherkin por SC** do [`scenarios.md`](scenarios.md), alinhado a Entradas / Execução / Saídas.
3. Não escrever BDD de nível US (a estória é coberta pela soma dos SC).
4. Não inventar SC que não exista no catálogo.

## Formato

```gherkin
Cenário: SC-NN <título>
  Dado …
  Quando …
  Então …
```

Agrupar sob heading da US só para navegação:

```markdown
## US-NN — <título>

### SC-NN <título>
```

## Próximo passo

→ [`prototype.md`](prototype.md)
