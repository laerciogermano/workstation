# EP-02 — Perceive

| Campo | Valor |
|-------|--------|
| ID | EP-02 |
| Status | Todo |
| Projeto | [screen-robot](../../README.md) |

## Intenção

Transformar **frame → `Element[]`**: textos (OCR), ícones/botões/cards (vision), merge com ids estáveis e CLI de debug.

## Funcionalidade maior

**Percepção frame → lista de elementos** — recortada nas histórias abaixo.

## Histórias

| ID | História | Funcionalidade | Esforço IA | Pasta |
|----|----------|----------------|------------|-------|
| US-01 | Validar schema de elemento | Garantir que cada item da lista tem kind, bbox, center, label/text, score e source válidos | 24m | [`US-01-validar-schema-de-elemento/`](US-01-validar-schema-de-elemento/README.md) |
| US-02 | Extrair textos da tela (OCR) | Ler textos do PNG e devolver elementos com bbox/center para achar labels na tela | 60m | [`US-02-extrair-textos-ocr/`](US-02-extrair-textos-ocr/README.md) |
| US-03 | Detectar controles visuais | Detectar botões, ícones, fotos e cards na imagem quando o OCR sozinho não basta | 90m | [`US-03-detectar-controles-visuais/`](US-03-detectar-controles-visuais/README.md) |
| US-04 | Unificar lista de elementos | Mesclar OCR + vision em um único `Element[]` com ids estáveis e sem conflito | 36m | [`US-04-unificar-lista-de-elementos/`](US-04-unificar-lista-de-elementos/README.md) |
| US-05 | Inspecionar percepção via CLI | Rodar perceive num PNG (ou frame vivo) e opcionalmente gerar overlay de debug | 30m | [`US-05-inspecionar-percepcao-via-cli/`](US-05-inspecionar-percepcao-via-cli/README.md) |

## Critério de pronto

- `perceive frame.png` → JSON com ≥1 elemento útil.
- Overlay opcional para inspeção visual.

## Dependências

- Requer: [EP-01 Capture](../EP-01-capture/README.md) (frame)
- Desbloqueia: [EP-03 Decide](../EP-03-decide/README.md)
