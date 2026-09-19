# US-03 — Detectar controles visuais

| Campo | Valor |
|-------|--------|
| ID | US-03 |
| Épico | [EP-02 Perceive](../README.md) |
| Status | Todo |
| Esforço IA | 90m |
| Recorte de | Percepção frame → lista de elementos |
| Depende de | [US-01](../US-01-validar-schema-de-elemento/README.md) |
| Paralelo com | [US-02](../US-02-extrair-textos-ocr/README.md) |

## História

Como agente do screen-robot, quero **detectar botões, ícones, fotos e cards na imagem**, para clicar em controles que não têm texto acessível via OCR sozinho.

## Cenários

### SC-01 — Botão detectado

Dado fixture com botão visível, quando **rodo vision**, então há Element com `kind` adequado (`button`/`icon`/…) e bbox.

### SC-02 — Foto/card

Dado fixture com imagem/card, quando **rodo vision**, então há Element `kind` `image` ou `list_item` (conforme modelo).

### SC-03 — Source vision

Quando o elemento **vem da vision**, então `source` indica **"vision"**.
