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

| ID | História | Esforço IA | Pasta |
|----|----------|------------|-------|
| US-01 | Definir contrato de atuação | 12m | [`US-01-definir-contrato-de-atuacao/`](US-01-definir-contrato-de-atuacao/README.md) |
| US-02 | Executar gestos via ADB | 24m | [`US-02-executar-gestos-via-adb/`](US-02-executar-gestos-via-adb/README.md) |
| US-03 | Validar clique a partir do frame | 9m | [`US-03-validar-clique-a-partir-do-frame/`](US-03-validar-clique-a-partir-do-frame/README.md) |
| US-04 | Rolar lista até achar alvo | 36m | [`US-04-rolar-lista-ate-achar-alvo/`](US-04-rolar-lista-ate-achar-alvo/README.md) |
| US-05 | Calibrar resolução frame ↔ actuator | 30m | [`US-05-calibrar-resolucao/`](US-05-calibrar-resolucao/README.md) |
| US-06 | Executar gestos via agent | 90m | [`US-06-executar-gestos-via-agent/`](US-06-executar-gestos-via-agent/README.md) |
| US-07 | Escolher backend de atuação | 24m | [`US-07-escolher-backend-de-atuacao/`](US-07-escolher-backend-de-atuacao/README.md) |

## Critério de pronto

- Tap/swipe/type estáveis no redroid.
- Backend agent compila + smoke em 1 device (quando houver).

## Dependências

- Paralelo com: [EP-01 Capture](../EP-01-capture/README.md) (smoke)
- Consumido por: [EP-03 Decide](../EP-03-decide/README.md)
