# BDDs — EP-05 Extrair elementos

**Por quê:** aceite Gherkin das US/SC do épico (fonte: [`../4.scenarios.md#ep-05--extrair-elementos`](../4.scenarios.md#ep-05--extrair-elementos)).  
**Índice:** [`README.md`](README.md) · **Plano:** [`../implementation-plan/EP-05-extrair-elementos.md`](../implementation-plan/EP-05-extrair-elementos.md).

**US:** US-13..16 · **SC:** SC-17..21.

Cada bloco: Dado / Quando / Então alinhado a Entradas / Execução / Saídas.

---

## US-13 — Extrair árvore DOM com textos

```gherkin
Cenário: US-13 Árvore de componentes é composta em duas fases
  Dado uma imagem da tela (screenshot/frame) ou dump
  Quando primeiro os textos são extraídos e montados na árvore
  E em seguida o restante é extraído e a hierarquia é completa
  Então a árvore de componentes completa é devolvida
```

### SC-17 — Extrair textos (fase 1)

```gherkin
Cenário: SC-17 Árvore de componentes com textos (fase 1)
  Dado uma imagem da tela (screenshot/frame) ou dump
  Quando a fase 1 extrai textos e monta a árvore
  Então a árvore de componentes contendo os textos é devolvida
```

### SC-18 — Extrair restante e compor árvore completa

```gherkin
Cenário: SC-18 Árvore de componentes completa
  Dado a árvore da fase 1 e uma imagem da tela (screenshot/frame) ou dump
  Quando ícones, listas e imagens são extraídos
  E a hierarquia raiz → filhos é composta
  Então a árvore de componentes completa é devolvida
```

## US-14 — Extrair ícones

```gherkin
Cenário: US-14 Árvore de componentes com ícones
  Dado uma imagem da tela (screenshot/frame) ou dump
  Quando o reconhecimento de ícones monta a árvore
  Então a árvore de componentes contendo os ícones é devolvida
```

### SC-19 — Extrair ícones

```gherkin
Cenário: SC-19 Árvore de componentes com ícones
  Dado uma imagem da tela (screenshot/frame) ou dump
  Quando o reconhecimento de ícones monta a árvore
  Então a árvore de componentes contendo os ícones é devolvida
```

## US-15 — Extrair listas

```gherkin
Cenário: US-15 Árvore de componentes com listas
  Dado uma imagem da tela (screenshot/frame) ou dump
  Quando o reconhecimento de listas monta a árvore
  Então a árvore de componentes contendo as listas é devolvida
```

### SC-20 — Extrair listas

```gherkin
Cenário: SC-20 Árvore de componentes com listas
  Dado uma imagem da tela (screenshot/frame) ou dump
  Quando o reconhecimento de listas monta a árvore
  Então a árvore de componentes contendo as listas é devolvida
```

## US-16 — Extrair imagens

```gherkin
Cenário: US-16 Árvore de componentes com imagens
  Dado uma imagem da tela (screenshot/frame) ou dump
  Quando o reconhecimento de imagens/fotos monta a árvore
  Então a árvore de componentes contendo as imagens é devolvida
```

### SC-21 — Extrair imagens

```gherkin
Cenário: SC-21 Árvore de componentes com imagens
  Dado uma imagem da tela (screenshot/frame) ou dump
  Quando o reconhecimento de imagens/fotos monta a árvore
  Então a árvore de componentes contendo as imagens é devolvida
```

## Próximos passos

→ [`../implementation-plan/EP-05-extrair-elementos.md`](../implementation-plan/EP-05-extrair-elementos.md)
