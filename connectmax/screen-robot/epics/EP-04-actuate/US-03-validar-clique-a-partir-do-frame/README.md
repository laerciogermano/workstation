# US-03 — Validar clique a partir do frame

| Campo | Valor |
|-------|--------|
| ID | US-03 |
| Épico | [EP-04 Actuate](../README.md) |
| Status | Todo |
| Esforço IA | 9m |
| Recorte de | Atuação no device |
| Depende de | [US-02](../US-02-executar-gestos-via-adb/README.md), EP-01 US-03 |

## História

Como desenvolvedor do screen-robot, quero **validar smoke frame → tap no centro**, para garantir Capture + Actuate juntos no redroid.

## Cenários

### SC-01 — Tap no centro

Dado frame capturado, quando o smoke **toca o center** do frame, então o adb tap usa coordenadas **dentro** de width×height.

### SC-02 — Sucesso observável

Quando o smoke **termina**, então o status é **success** com device online.
