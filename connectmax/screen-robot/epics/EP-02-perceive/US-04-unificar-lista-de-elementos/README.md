# US-04 — Unificar lista de elementos

| Campo | Valor |
|-------|--------|
| ID | US-04 |
| Épico | [EP-02 Perceive](../README.md) |
| Status | Todo |
| Esforço IA | 36m |
| Recorte de | Percepção frame → lista de elementos |
| Depende de | [US-02](../US-02-extrair-textos-ocr/README.md), [US-03](../US-03-detectar-controles-visuais/README.md) |

## História

Como agente do screen-robot, quero **unir OCR e vision numa única lista `Element[]`**, para Decide escolher alvos sem duplicatas conflitantes.

## Cenários

### SC-01 — Ids únicos

Quando OCR e vision **sobreõem regiões**, então o merge **produz ids únicos**.

### SC-02 — Source merged

Quando um elemento **combina** as duas fontes, então `source` pode ser **"merged"** (ou manter a fonte dominante documentada).

### SC-03 — Schema pós-merge

Quando o merge **termina**, então **todos** os elementos passam na validação da US-01.
