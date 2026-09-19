# EP-04 — Actuate

| Campo | Valor |
|-------|--------|
| ID | EP-04 |
| Status | Todo |
| Projeto | [screen-robot](../../README.md) |

## Intenção

Executar **`Action`** no device (tap, swipe, type, scroll) via interface `Actuate`, com calibração frame ↔ coordenadas e backends plugáveis (ADB / agent).

## Funcionalidades maiores

- **Atuação no device** (gestos + backends)
- **Orquestração de listas** (scroll até achar)

Recortadas nas histórias abaixo.

## Histórias

| ID | História | Funcionalidade | Esforço IA | Pasta |
|----|----------|----------------|------------|-------|
| US-01 | Definir contrato de atuação | Expor `Actuate.run(Action)` tipada para o Decide não conhecer ADB/agent | 12m | [`US-01-definir-contrato-de-atuacao/`](US-01-definir-contrato-de-atuacao/README.md) |
| US-02 | Executar gestos via ADB | Executar tap, swipe e type no redroid/emulador via ADB | 24m | [`US-02-executar-gestos-via-adb/`](US-02-executar-gestos-via-adb/README.md) |
| US-03 | Validar clique a partir do frame | Smoke Capture+Actuate: capturar frame e tocar no centro com coords válidas | 9m | [`US-03-validar-clique-a-partir-do-frame/`](US-03-validar-clique-a-partir-do-frame/README.md) |
| US-04 | Rolar lista até achar alvo | Swipe + re-perceive até o alvo entrar na viewport (ou esgotar tentativas) | 36m | [`US-04-rolar-lista-ate-achar-alvo/`](US-04-rolar-lista-ate-achar-alvo/README.md) |
| US-05 | Calibrar resolução frame ↔ actuator | Mapear center do frame para coordenadas do actuator quando as resoluções diferem | 30m | [`US-05-calibrar-resolucao/`](US-05-calibrar-resolucao/README.md) |
| US-06 | Executar gestos via agent | Executar as mesmas Actions no hardware via agent, sem mudar o Decide | 90m | [`US-06-executar-gestos-via-agent/`](US-06-executar-gestos-via-agent/README.md) |
| US-07 | Escolher backend de atuação | Selecionar `adb` ou `agent` por config/factory alinhado ao Capture | 24m | [`US-07-escolher-backend-de-atuacao/`](US-07-escolher-backend-de-atuacao/README.md) |

## Critério de pronto

- Tap/swipe/type estáveis no redroid.
- Backend agent compila + smoke em 1 device (quando houver).

## Dependências

- Paralelo com: [EP-01 Capture](../EP-01-capture/README.md) (smoke)
- Consumido por: [EP-03 Decide](../EP-03-decide/README.md)
