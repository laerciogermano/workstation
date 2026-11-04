# 035 — Card ajustes protótipo: ícones + km na busca

| Campo | Valor |
|-------|--------|
| Número | 035 |
| Data | 2026-11-04 |
| Origem | Chat no Cursor (workstation) |
| Título | Card Trello: ícones + distância (km) na busca do protótipo |

## Prompt original

```
Cria um card local, no Trello local, do Notinhas, pra gente ajustar os ícones do, do protótipo, não tão aparecendo. E quando pesquisar, tem que aparecer também o quão perto de mim está. É... quantos quilômetros de mim. A lente integral L, quatro e vinte e nove beleza, mas quantos quilômetros? Tem que aparecer. Também tem que ter a rolagem nos protótipos. Ah não, já tem, já tem. Quando clica aqui, aparece. O comparação entre lojas... já seria o... onde comprar? Ah, onde comprar perto. Não, não, não, deixa os dois mesmo. Tá ótimo. Esse comparar aqui, de onde ele tá tirando? Porque aí você tem aqui. Uma comparar, quer dizer. Quando clica no produto. Ué, no Epic, no Epic Z01, tem um comparar aqui, mas como que chega nele?
```

## Interpretação

1. Card no board **enotas** (espelho em `Trello/enotas/`) para ajustes do protótipo: ícones sumidos + distância (km) nos resultados de busca.
2. Não incluir rolagem (já ok). Manter **Comparação entre lojas** e **Onde comprar perto** no detalhe.
3. Responder como se chega no **Comparar (T-12)** no fluxo E01 da galeria — sem implementar neste turno.

## O que foi feito

- Card Backlog: https://trello.com/c/xwTPpIUZ
- Task: `e-notas/tasks/6aeb25e8975016bbe7d13d6e/`
- Espelho: `Trello/enotas/Backlog/Ajustes protótipo- ícones + distância (km) na busca/`
- Achado: T-12 não tem entrada por `data-go` a partir de home/busca/detalhe; comparação útil está no T-14 expandido.
