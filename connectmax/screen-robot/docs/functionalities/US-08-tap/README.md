# US-08 — tap

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Toque em coords ou bounds.

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Coordenadas x,y ou bounds do elemento | Toque na tela | UI refletindo o tap |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-12 | Toque na tela | Coordenadas x,y ou bounds do elemento | Tap no alvo | UI refletindo o toque |

## BDD

```gherkin
Funcionalidade: US-08 tap
  Cenário: UI reflete o toque
    Dado coordenadas x,y ou bounds do elemento
    Quando o toque na tela é executado
    Então a UI reflete o tap
```

### SC-12 Toque na tela

```gherkin
Cenário: SC-12 Toque na tela
  Dado coordenadas x,y ou bounds do elemento
  Quando tap é executado nesse alvo
  Então a UI reflete o toque
```

