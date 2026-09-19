# US-03 — Executar goal sem coordenadas fixas

| Campo | Valor |
|-------|--------|
| ID | US-03 |
| Épico | [EP-03 Decide](../README.md) |
| Status | Todo |
| Esforço IA | 72m |
| Recorte de | Decisão elementos + goal → ação · Orquestração de goals |
| Depende de | [US-01](../US-01-selecionar-elemento-da-lista/README.md) |

## História

Como operador do screen-robot, quero **rodar um goal JSON** (perceive → choose → act/copy) **sem coordenadas hardcoded**, para automatizar fluxos só com intenção e elementos da tela.

## Cenários

### SC-01 — Tap por label

Dado goal com choose label="Seguir" e act tap, quando **run-goal executa**, então Actuate recebe tap no **center** do elemento escolhido.

### SC-02 — Copiar texto

Dado step `copy_text`, quando o runner **executa**, então `RunResult.extracted` contém o **texto** do elemento.

### SC-03 — Example E2E

Quando rodo `goals/example.json` no ambiente de smoke, então o goal termina **success** (device online).
