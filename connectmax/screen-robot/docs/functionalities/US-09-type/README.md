# US-09 — type

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Digitar / injetar texto.

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Texto, campo focado ou coords | Digitar / injetar texto | Texto na UI |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-13 | Texto é digitado | Texto, campo focado ou coords | Type injeta o texto | Texto na UI |

## BDD

```gherkin
Funcionalidade: US-09 type
  Cenário: Texto aparece na UI
    Dado um texto e campo focado ou coords
    Quando digitar / injetar texto é executado
    Então o texto aparece na UI
```

### SC-13 Texto é digitado

```gherkin
Cenário: SC-13 Texto é digitado
  Dado um texto e campo focado ou coords
  Quando type injeta o texto
  Então o texto aparece na UI
```

