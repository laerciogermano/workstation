# EP-04 — Actuate

| Campo | Valor |
|-------|--------|
| ID | EP-04 |
| Status | Todo |
| Projeto | [screen-robot](../../README.md) |

## Intenção

Executar **`Action`** no device (tap, swipe, type, scroll) via interface `Actuate`, com calibração frame ↔ coordenadas e backends plugáveis (ADB / agent).

## Histórias

| ID | História | Esforço IA | Notas |
|----|----------|------------|-------|
| US-01 | Contratos `Actuate.run(Action)` | 12m | Parte dos contratos F0 |
| US-02 | AdbActuate (wrap cli: tap/swipe/type) | 24m | Backend ADB |
| US-03 | Smoke: frame → tap(cx,cy) | 9m | Com Capture |
| US-04 | Scroll + re-perceive (listas) | 36m | Fora da viewport |
| US-05 | Calibração resolução frame ↔ actuator | 30m | |
| US-06 | Actuate agent | 90m | Hardware-ready |
| US-07 | Flag `backend=adb\|agent` (lado actuate) | 24m | Factory + regressão |

## Critério de pronto

- Tap/swipe/type estáveis no redroid.
- Backend agent compila + smoke em 1 device (quando houver).

## Dependências

- Paralelo com: [EP-01 Capture](../EP-01-capture/README.md) (smoke)
- Consumido por: [EP-03 Decide](../EP-03-decide/README.md)
