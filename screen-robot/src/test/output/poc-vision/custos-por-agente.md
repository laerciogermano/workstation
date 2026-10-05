# Custo por agente — 100 conexões / semana

Premissas:
- Gemini Flash · input US$ 0,075/1M · output US$ 0,30/1M · câmbio US$ 1 = R$ 5,50
- 1 op = 1 tela (extract/OCR ou imagem) + 1 decisão
- **Meta por agente:** 100 conexões / semana
- Ops por 100 conexões (média logs jornada): **280** → **~2,8 ops/conexão**
- Mês = 30 dias ≈ **4,286 semanas** → ~**429 conexões/mês** · **~1.200 ops/mês**
- Ops/dia médio: 280 / 7 ≈ **40**

US$/op: Imagem 20 KB ≈ 0,000130 · Imagem 31 KB ≈ 0,000150 · OCR ≈ 0,000103

---

## Por agente

| Modo | Ops/dia | Conexões/sem | Ops/sem | US$/sem | R$/sem | Ops/mês | Conexões/mês | US$/mês | R$/mês |
|------|---------|--------------|---------|---------|--------|---------|--------------|---------|--------|
| Imagem ~20 KB (1 tile) | 40 | 100 | 280 | **0,036** | 0,20 | 1.200 | 429 | **0,16** | **0,86** |
| Imagem ~31 KB (2 tiles) | 40 | 100 | 280 | **0,042** | 0,23 | 1.200 | 429 | **0,18** | **0,99** |
| OCR JSON | 40 | 100 | 280 | **0,029** | 0,16 | 1.200 | 429 | **0,12** | **0,68** |

Arquivo ~20 KB: [`compressed-20kb.webp`](compressed-20kb.webp) · meta: [`meta-20kb.json`](meta-20kb.json)

---

## N agentes / mês (US$) — 100 connects/sem cada

| Agentes | Conexões/mês | Imagem 20 KB | Imagem 31 KB | OCR |
|---------|--------------|--------------|--------------|-----|
| 1 | 429 | 0,16 | 0,18 | 0,12 |
| 5 | 2.143 | 0,78 | 0,90 | 0,62 |
| 10 | 4.286 | 1,56 | 1,80 | 1,24 |
| 50 | 21.429 | 7,81 | 9,00 | 6,18 |

---

## Base dos logs (ops / 100 conexões)

Fonte: `src/logs/jornada-comprador/`

| Run | Conexões | Ops | Ops / conexão |
|-----|----------|-----|---------------|
| 2026-10-04T19-04-51 | 106 | 319 | 3,01 |
| 2026-10-04T18-50-27 | 45 | 113 | 2,51 |
| 2026-10-04T19-42-45 | 8 | 15 | 1,88 |
| **Média ponderada** | **159** | **447** | **2,81** |

**100 conexões ≈ 280 ops.** Runs ruins (sem Connect no OCR): 10–24 ops/conexão — fora desta simulação.

---

## Notas

- Custo de IA por agente nesta meta é **centavos de dólar/mês** — o gargalo é limite semanal do LinkedIn / tempo de tela, não tokens.
- Bytes ≠ tokens: ~20 KB WebP = 1 tile (~258 tok); 540px pode ser 2 tiles.
- Valor real: `usageMetadata` da API Gemini.

**Antes → depois:** simulação 24/7 (14.400 ops/dia) → meta **100 conexões/semana** com 280 ops/100 connects dos logs. Rollback: voltar às premissas 14.400 ops/dia do commit anterior.
