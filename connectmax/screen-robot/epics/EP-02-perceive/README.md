# EP-02 — Perceive

| Campo | Valor |
|-------|--------|
| ID | EP-02 |
| Status | Todo |
| Projeto | [screen-robot](../../README.md) |

## Intenção

Transformar **frame → `Element[]`**: textos (OCR), ícones/botões/cards (vision), merge com ids estáveis e CLI de debug.

## Histórias

| ID | História | Esforço IA | Notas |
|----|----------|------------|-------|
| US-01 | Schema `Element` + validação JSON | 24m | kind, bbox, center, label, score, source |
| US-02 | OCR → textos + bboxes | 60m | Paralelo a US-03 |
| US-03 | Vision → botões/fotos/cards | 90m | Paralelo a US-02 |
| US-04 | Merge OCR + vision → `Element[]` | 36m | Após US-02 e US-03 |
| US-05 | CLI `perceive` + overlay debug | 30m | Fixture ou frame vivo |

## Critério de pronto

- `perceive frame.png` → JSON com ≥1 elemento útil.
- Overlay opcional para inspeção visual.

## Dependências

- Requer: [EP-01 Capture](../EP-01-capture/README.md) (frame)
- Desbloqueia: [EP-03 Decide](../EP-03-decide/README.md)
