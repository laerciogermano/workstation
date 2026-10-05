# Custo por agente / mês — OCR vs imagem

Premissas: Gemini Flash · 14.400 ops/dia · 30 dias · 1 agente = 1 emulador 24/7  
Preço: input US$ 0,075/1M · output US$ 0,30/1M · câmbio US$ 1 = R$ 5,50  
1 op = 1 tela analisada + 1 resposta.

---

## Por agente

Uso fixo por agente: **14.400 operações/dia** · **432.000 operações/mês** (×30).

| Modo | Ops/dia | US$/dia | R$/dia | Ops/mês | US$/mês | R$/mês |
|------|---------|---------|--------|---------|---------|--------|
| Imagem ~20 KB (1 tile) | 14.400 | 1,88 | 10,34 | 432.000 | **56** | **309** |
| Imagem ~31 KB (2 tiles) | 14.400 | 2,16 | 11,88 | 432.000 | **65** | **357** |
| OCR JSON | 14.400 | 1,48 | 8,14 | 432.000 | **44** | **244** |

Detalhe por op: Imagem 20 KB ≈ US$ 0,000130 · Imagem 31 KB ≈ US$ 0,000150 · OCR ≈ US$ 0,000103.

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

## Ops reais para 100 conexões (logs jornada)

Fonte: `src/logs/jornada-comprador/` · 1 op = 1 passo com extract/OCR + decisão.

| Run | Conexões | Ops (passos) | Ops / conexão |
|-----|----------|--------------|---------------|
| 2026-10-04T19-04-51 | 106 | 319 | 3,01 |
| 2026-10-04T18-50-27 | 45 | 113 | 2,51 |
| 2026-10-04T19-42-45 | 8 | 15 | 1,88 |
| **Média ponderada** | **159** | **447** | **2,81** |

**Para 100 conexões (média):** ~**280 operações** (~172 scrolls + passos Connect/Skip; setup ~5 ops/run).

Runs ruins (OCR sem Connect, muito scroll): 10–24 ops/conexão — fora da média estável.

Com ~280 ops para 100 connects (não 14.400/dia):

| Modo | US$ / 100 connects | R$ / 100 connects |
|------|--------------------|-------------------|
| Imagem ~20 KB | 0,036 | 0,20 |
| Imagem ~31 KB | 0,042 | 0,23 |
| OCR JSON | 0,029 | 0,16 |

---

## Notas

- Bytes ≠ tokens: WebP ~20 KB nesta resolução = 1 tile (~258 tok imagem).
- Subir para 540px pode voltar a 2 tiles (~516 tok) mesmo com KB parecido.
- OCR = JSON da fixture People (~84 textos). Telas densas encarecem o OCR; telas vazias o barateiam.
- Valor real: `usageMetadata` da API Gemini.

**Antes → depois:** simulação só em canvas Cursor → este MD versionado junto da POC; incluída média de ops dos logs da jornada. Rollback: apagar este arquivo.
