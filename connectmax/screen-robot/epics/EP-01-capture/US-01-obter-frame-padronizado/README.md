# US-01 — Obter frame padronizado

| Campo | Valor |
|-------|--------|
| ID | US-01 |
| Épico | [EP-01 Capture](../README.md) |
| Status | Todo |
| Esforço IA | 12m |
| Recorte de | Captura de tela do device |

## História

Como agente do screen-robot, quero **obter o frame atual da tela num formato padronizado** (PNG + width/height/ts), para que Perceive e Decide consumam a mesma estrutura independentemente do backend.

## Cenários

### SC-01 — Contrato getFrame

Quando o sistema **solicita um frame** via interface `Capture`, então deve **receber um objeto** com caminho ou buffer PNG, `width`, `height` e `ts`.

### SC-02 — Dimensões coerentes

Quando o frame **é devolvido**, então `width` e `height` devem ser **maiores que zero** e compatíveis com o PNG.

### SC-03 — Sem acoplamento a ADB

Quando o consumidor **usa só a interface Capture**, então **não precisa conhecer** detalhes de ADB ou agent.
