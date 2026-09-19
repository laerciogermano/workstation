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

| ID | História | Por quê | Esforço IA | Pasta |
|----|----------|---------|------------|-------|
| US-01 | Validar schema de elemento | Decide quebra se a lista vier inconsistente; o schema evita lixo na decisão | 24m | [`US-01-validar-schema-de-elemento/`](US-01-validar-schema-de-elemento/README.md) |
| US-02 | Extrair textos da tela (OCR) | Sem ler o texto da imagem não dá para achar labels (“Seguir”, nomes) só pelo PNG | 60m | [`US-02-extrair-textos-ocr/`](US-02-extrair-textos-ocr/README.md) |
| US-03 | Detectar controles visuais | Ícones/botões sem texto legível no OCR precisam de vision para serem clicáveis | 90m | [`US-03-detectar-controles-visuais/`](US-03-detectar-controles-visuais/README.md) |
| US-04 | Unificar lista de elementos | OCR e vision sozinhos geram listas paralelas; o merge entrega um alvo único ao Decide | 36m | [`US-04-unificar-lista-de-elementos/`](US-04-unificar-lista-de-elementos/README.md) |
| US-05 | Inspecionar percepção via CLI | Sem ver o que o robô enxerga, debug de clique/label fica às cegas | 30m | [`US-05-inspecionar-percepcao-via-cli/`](US-05-inspecionar-percepcao-via-cli/README.md) |

## Critério de pronto

- `perceive frame.png` → JSON com ≥1 elemento útil.
- Overlay opcional para inspeção visual.

## Dependências

- Requer: [EP-01 Capture](../EP-01-capture/README.md) (frame)
- Desbloqueia: [EP-03 Decide](../EP-03-decide/README.md)
