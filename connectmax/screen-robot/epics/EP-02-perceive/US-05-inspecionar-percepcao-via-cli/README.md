# US-05 — Inspecionar percepção via CLI

| Campo | Valor |
|-------|--------|
| ID | US-05 |
| Épico | [EP-02 Perceive](../README.md) |
| Status | Todo |
| Esforço IA | 30m |
| Recorte de | Percepção frame → lista de elementos |
| Depende de | [US-04](../US-04-unificar-lista-de-elementos/README.md) |

## História

Como desenvolvedor do screen-robot, quero **rodar perceive por CLI num PNG** e opcionalmente ver overlay, para inspecionar o que o robô “enxerga” antes de automatizar cliques.

## Cenários

### SC-01 — JSON na saída

Quando executo `perceive` sobre um frame, então a saída é **JSON com `Element[]`**.

### SC-02 — Overlay opcional

Quando peço **overlay**, então o sistema gera imagem com **bboxes desenhadas** sobre o frame.

### SC-03 — Fixture ou frame vivo

Quando informo **caminho de PNG** ou peço captura viva, então perceive **aceita ambas** as entradas.
