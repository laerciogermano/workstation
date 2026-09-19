# US-12 — Resgatar coordenadas x,y

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Localizar alvo na tela a partir de imagem de entrada.

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Imagem template, frame/tela atual | Template match / visão na tela | Coordenadas x,y (e confiança) |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-16 | Coordenadas a partir de imagem template | Imagem template, frame/tela atual | Match por visão/template | Coordenadas x,y (e confiança) |

## BDD

```gherkin
Funcionalidade: US-12 Resgatar coordenadas x,y
  Cenário: Coordenadas do alvo são devolvidas
    Dado imagem template e frame/tela atual
    Quando template match / visão na tela é executado
    Então coordenadas x,y (e confiança) são devolvidas
```

### SC-16 Coordenadas a partir de imagem template

```gherkin
Cenário: SC-16 Coordenadas a partir de imagem template
  Dado uma imagem de entrada (template) e o frame/tela atual
  Quando o match por visão/template é executado
  Então coordenadas x,y (e confiança) são devolvidas
```

