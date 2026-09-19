# US-02 — Extrair textos da tela (OCR)

| Campo | Valor |
|-------|--------|
| ID | US-02 |
| Épico | [EP-02 Perceive](../README.md) |
| Status | Todo |
| Esforço IA | 60m |
| Recorte de | Percepção frame → lista de elementos |
| Depende de | [US-01](../US-01-validar-schema-de-elemento/README.md) |
| Paralelo com | [US-03](../US-03-detectar-controles-visuais/README.md) |

## História

Como agente do screen-robot, quero **extrair textos visíveis do frame via OCR** (com bboxes), para localizar labels e conteúdos sem depender de acessibilidade.

## Cenários

### SC-01 — Texto encontrado

Dado um PNG de fixture com o texto "Seguir", quando **rodo OCR**, então existe Element com `text`/`label` contendo "Seguir" e bbox válida.

### SC-02 — Source OCR

Quando o elemento **vem do OCR**, então `source` indica **"ocr"** (ou equivalente).

### SC-03 — Centro calculado

Quando o OCR **devolve bbox**, então `center` é o **ponto médio** da caixa.
