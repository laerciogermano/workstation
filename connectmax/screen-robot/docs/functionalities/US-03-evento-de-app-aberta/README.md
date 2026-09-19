# US-03 — Evento de app aberta

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Espera e confirma app em foreground.

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Package em foreground esperado | Esperar app em foreground | App aberta confirmada |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-05 | App em foreground é confirmada | Package esperado em foreground | Aguardar app aberta | App em foreground |

## BDD

```gherkin
Funcionalidade: US-03 Evento de app aberta
  Cenário: App aberta é confirmada
    Dado o package em foreground esperado
    Quando o sistema espera a app em foreground
    Então a app aberta está confirmada
```

### SC-05 App em foreground é confirmada

```gherkin
Cenário: SC-05 App em foreground é confirmada
  Dado o package esperado em foreground
  Quando o sistema aguarda a app aberta
  Então a app está em foreground
```

