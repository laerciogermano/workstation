# Documento de BDDs

Artefato **3** do [discovery](README.md). Critérios de aceite em Gherkin — **um por US** e **um por SC** — arquivo único `bdds.md`.

**Antes:** [`scenarios.md`](scenarios.md). **Depois:** [`prototype.md`](prototype.md).

## Regras

1. Só depois do catálogo de cenários fechado.
2. Título da US (maior); Gherkin da US **logo abaixo**, sem subtítulo repetido.
3. Cada SC: um heading `SC-NN — título` e o Gherkin abaixo (sem negrito duplicado).
4. Não inventar US/SC que não existam no catálogo.

## Formato

```markdown
## US-NN — <título da estória>

```gherkin
Cenário: US-NN …
  Dado …
  Quando …
  Então …
```

### SC-NN — <título do cenário>

```gherkin
Cenário: SC-NN …
  Dado …
  Quando …
  Então …
```
```

## Próximo passo

→ [`prototype.md`](prototype.md)
