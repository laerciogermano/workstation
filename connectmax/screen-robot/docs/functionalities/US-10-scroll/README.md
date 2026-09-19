# US-10 — scroll

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Swipe / scroll na tela ou lista.

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Direção (up/down/left/right), distância ou bounds da área | Swipe / scroll na tela ou na lista | Conteúdo rolado; novos itens visíveis |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-14 | Conteúdo é rolado | Direção, distância ou bounds da área | Scroll/swipe | Conteúdo rolado; novos itens visíveis |

## BDD

```gherkin
Funcionalidade: US-10 scroll
  Cenário: Conteúdo da tela ou lista é rolado
    Dado direção (up/down/left/right), distância ou bounds da área
    Quando swipe / scroll é executado
    Então o conteúdo rolou e novos itens podem ficar visíveis
```

### SC-14 Conteúdo é rolado

```gherkin
Cenário: SC-14 Conteúdo é rolado
  Dado direção, distância ou bounds da área
  Quando scroll/swipe é executado
  Então o conteúdo rolou e novos itens podem ficar visíveis
```

