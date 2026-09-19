# US-04 — Evento de tela estável

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Espera UI estável (sem transição).

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| App em foreground | Esperar UI estável (sem transição) | Tela estável |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-06 | Tela fica estável | App em foreground | Aguardar ausência de transição de UI | Tela estável |

## BDD

```gherkin
Funcionalidade: US-04 Evento de tela estável
  Cenário: Tela estável é confirmada
    Dado a app em foreground
    Quando o sistema espera UI estável (sem transição)
    Então a tela está estável
```

### SC-06 Tela fica estável

```gherkin
Cenário: SC-06 Tela fica estável
  Dado a app em foreground
  Quando o sistema aguarda ausência de transição de UI
  Então a tela está estável
```

