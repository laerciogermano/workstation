# Documento de BDDs

Artefato **3** do [discovery](README.md). Critérios de aceite em Gherkin — **um por US** e **um por SC** — arquivo único `bdds.md`.

**Antes:** [`scenarios.md`](scenarios.md). **Depois:** [`prototype.md`](prototype.md).

## Regras

1. Só depois do catálogo de cenários fechado.
2. **Um bloco Gherkin por US** (Entradas / Execução / Saídas da estória).
3. **Um bloco Gherkin por SC** (Entradas / Execução / Saídas do cenário).
4. Não inventar US/SC que não existam no catálogo.

## Formato

```markdown
## US-NN — <título>

### US-NN

```gherkin
Cenário: US-NN …
  Dado …
  Quando …
  Então …
```

### SC-NN

**\<título do cenário\>**

```gherkin
Cenário: SC-NN …
  Dado …
  Quando …
  Então …
```
```

## Próximo passo

→ [`prototype.md`](prototype.md)
