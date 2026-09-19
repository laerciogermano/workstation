# Documento de BDDs

Artefato **3** do [discovery](README.md). Critérios de aceite em Gherkin (Dado / Quando / Então) por US e SC — arquivo único `bdds.md`.

**Antes:** [`scenarios.md`](scenarios.md). **Depois:** [`prototype.md`](prototype.md).

## Regras

1. Só depois do catálogo de cenários fechado.
2. Cada US e cada SC do [`scenarios.md`](scenarios.md) tem bloco alinhado a Entradas / Execução / Saídas.
3. Não inventar SC que não exista no catálogo.

## Formato

```gherkin
Funcionalidade: US-NN <título>
  Cenário: …
    Dado …
    Quando …
    Então …
```

```gherkin
Cenário: SC-NN <título>
  Dado …
  Quando …
  Então …
```

## Próximo passo

→ [`prototype.md`](prototype.md)
