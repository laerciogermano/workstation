# Custo por agente / mês — OCR vs imagem

Premissas: Gemini Flash · 14.400 ops/dia · 30 dias · 1 agente = 1 emulador 24/7  
Preço: input US$ 0,075/1M · output US$ 0,30/1M · câmbio US$ 1 = R$ 5,50  
1 op = 1 tela analisada + 1 resposta.

---

## Por agente / mês

| Modo | Tok in | Tok out | US$/op | US$/dia | US$/mês | R$/mês |
|------|--------|---------|--------|---------|---------|--------|
| Imagem ~20 KB (1 tile) | 538 | 300 | 0,000130 | 1,88 | **56** | **309** |
| Imagem ~31 KB (2 tiles) | 796 | 300 | 0,000150 | 2,16 | **65** | **357** |
| OCR JSON | 894 | 120 | 0,000103 | 1,48 | **44** | **244** |

Arquivo ~20 KB: [`compressed-20kb.webp`](compressed-20kb.webp) · meta: [`meta-20kb.json`](meta-20kb.json)

---

## N agentes / mês (US$)

| Agentes | Imagem 20 KB | Imagem 31 KB | OCR |
|---------|--------------|--------------|-----|
| 1 | 56 | 65 | 44 |
| 5 | 282 | 324 | 222 |
| 10 | 563 | 648 | 445 |
| 50 | 2.813 | 3.240 | 2.224 |

---

## Notas

- Bytes ≠ tokens: WebP ~20 KB nesta resolução = 1 tile (~258 tok imagem).
- Subir para 540px pode voltar a 2 tiles (~516 tok) mesmo com KB parecido.
- OCR = JSON da fixture People (~84 textos). Telas densas encarecem o OCR; telas vazias o barateiam.
- Valor real: `usageMetadata` da API Gemini.

**Antes → depois:** simulação só em canvas Cursor → este MD versionado junto da POC. Rollback: apagar este arquivo.
