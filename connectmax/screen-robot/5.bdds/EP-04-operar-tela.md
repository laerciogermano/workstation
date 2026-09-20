# BDDs — EP-04 Operar tela

**Por quê:** aceite Gherkin das US/SC do épico (fonte: [`../4.scenarios/EP-04-operar-tela.md`](../4.scenarios/EP-04-operar-tela.md)).  
**Índice:** [`README.md`](README.md) · **Plano:** [`../implementation-plan/EP-04-operar-tela.md`](../implementation-plan/EP-04-operar-tela.md).

**US:** US-07..12 · **SC:** SC-11..16.

Cada bloco: Dado / Quando / Então alinhado a Entradas / Execução / Saídas.

---

## US-07 — Abrir aplicativo

```gherkin
Cenário: US-07 App fica em foreground no agent
  Dado package (e activity opcional)
  Quando o launch do app é executado no agent
  Então a app está em foreground
```

### SC-11 — App é aberta no agent

```gherkin
Cenário: SC-11 App é aberta no agent
  Dado package (e activity opcional)
  Quando launch é executado
  Então a app está em foreground
```

## US-08 — tap

```gherkin
Cenário: US-08 UI reflete o toque
  Dado coordenadas x,y ou bounds do elemento
  Quando o toque na tela é executado
  Então a UI reflete o tap
```

### SC-12 — Toque na tela

```gherkin
Cenário: SC-12 Toque na tela
  Dado coordenadas x,y ou bounds do elemento
  Quando tap é executado nesse alvo
  Então a UI reflete o toque
```

## US-09 — type

```gherkin
Cenário: US-09 Texto aparece na UI
  Dado um texto e campo focado ou coords
  Quando digitar / injetar texto é executado
  Então o texto aparece na UI
```

### SC-13 — Texto é digitado

```gherkin
Cenário: SC-13 Texto é digitado
  Dado um texto e campo focado ou coords
  Quando type injeta o texto
  Então o texto aparece na UI
```

## US-10 — scroll

```gherkin
Cenário: US-10 Conteúdo da tela ou lista é rolado
  Dado direção (up/down/left/right), distância ou bounds da área
  Quando swipe / scroll é executado
  Então o conteúdo rolou e novos itens podem ficar visíveis
```

### SC-14 — Conteúdo é rolado

```gherkin
Cenário: SC-14 Conteúdo é rolado
  Dado direção, distância ou bounds da área
  Quando scroll/swipe é executado
  Então o conteúdo rolou e novos itens podem ficar visíveis
```

## US-11 — screenshot

```gherkin
Cenário: US-11 Frame da tela é capturado
  Dado serial e path de saída
  Quando o frame da tela é capturado
  Então o arquivo de imagem existe
```

### SC-15 — Print da tela é salvo

```gherkin
Cenário: SC-15 Print da tela é salvo
  Dado serial e path de saída
  Quando screenshot é capturado
  Então o arquivo de imagem existe no path
```

## US-12 — Resgatar coordenadas x,y a partir de uma imagem

```gherkin
Cenário: US-12 Coordenadas do alvo são devolvidas
  Dado uma imagem de entrada e o frame/tela atual
  Quando o match por visão/template é executado
  Então as coordenadas x,y (e confiança) são devolvidas
```

### SC-16 — Coordenadas a partir de imagem template

```gherkin
Cenário: SC-16 Coordenadas a partir de imagem template
  Dado uma imagem de entrada (template) e o frame/tela atual
  Quando o match por visão/template é executado
  Então coordenadas x,y (e confiança) são devolvidas
```

## Próximos passos

→ [`../implementation-plan/EP-04-operar-tela.md`](../implementation-plan/EP-04-operar-tela.md)
