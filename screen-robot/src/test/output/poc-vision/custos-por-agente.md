# Utilização e custo por agente — limite LinkedIn

1 op = 1 tela analisada + 1 decisão · média logs: **2,81 ops/conexão** → **280 ops / 100 conexões**.

---

## 1. Utilização (primeiro)

Limite LinkedIn ≈ **100 conexões / 7 dias** por conta (agente).

| Métrica | Valor | Como calcula |
|---------|-------|--------------|
| Conexões / semana (limite) | **100** | teto LinkedIn em 7 dias |
| Ops para 100 conexões | **280** | 100 × 2,81 (média ponderada dos logs) |
| Janela | **7 dias** | ciclo do limite semanal |
| Conexões / dia | **~14,3** | 100 ÷ 7 |
| Ops / dia | **~40** | 280 ÷ 7 |
| Conexões / mês (30 d) | **~429** | 100 × (30 ÷ 7) |
| Ops / mês (30 d) | **~1.200** | 280 × (30 ÷ 7) |

| Período | Conexões | Operações |
|---------|----------|-----------|
| 1 dia | 14 | 40 |
| 7 dias (limite) | **100** | **280** |
| 30 dias (mês) | **429** | **1.200** |

Base dos logs (`src/logs/jornada-comprador/`):

| Run | Conexões | Ops | Ops / conexão |
|-----|----------|-----|---------------|
| 2026-10-04T19-04-51 | 106 | 319 | 3,01 |
| 2026-10-04T18-50-27 | 45 | 113 | 2,51 |
| 2026-10-04T19-42-45 | 8 | 15 | 1,88 |
| **Média ponderada** | **159** | **447** | **2,81** |

---

## 2. Custo de IA (Gemini Flash)

Preço: in US$ 0,075/1M · out US$ 0,30/1M · câmbio US$ 1 = R$ 5,50  
US$/op: Imagem 20 KB ≈ 0,000130 · Imagem 31 KB ≈ 0,000150 · OCR ≈ 0,000103

| Modo | Ops/dia | US$/dia | Ops/sem (280) | US$/sem | Ops/mês (1.200) | US$/mês | R$/mês |
|------|---------|---------|---------------|---------|-----------------|---------|--------|
| Imagem ~20 KB | 40 | 0,005 | 280 | **0,036** | 1.200 | **0,16** | 0,86 |
| Imagem ~31 KB | 40 | 0,006 | 280 | **0,042** | 1.200 | **0,18** | 0,99 |
| OCR JSON | 40 | 0,004 | 280 | **0,029** | 1.200 | **0,12** | 0,68 |

Arquivo ~20 KB: [`compressed-20kb.webp`](compressed-20kb.webp) · [`meta-20kb.json`](meta-20kb.json)

### N agentes / mês — custo monetário da API (dólares)

Sim: valores em **US$** (quanto se paga à API Gemini no mês). Não é quantidade de operações.

| Agentes | Conexões/mês | Custo Imagem 20 KB | Custo Imagem 31 KB | Custo OCR |
|---------|--------------|--------------------|--------------------|-----------|
| 1 | 429 | US$ 0,16 | US$ 0,18 | US$ 0,12 |
| 5 | 2.143 | US$ 0,78 | US$ 0,90 | US$ 0,62 |
| 10 | 4.286 | US$ 1,56 | US$ 1,80 | US$ 1,24 |
| 50 | 21.429 | US$ 7,81 | US$ 9,00 | US$ 6,18 |

---

## Notas

- Gargalo = limite semanal LinkedIn (100/7d), não tokens.
- Runs ruins (OCR sem Connect): 10–24 ops/conexão — fora desta média.
- Valor real de tokens: `usageMetadata` da API.

**Antes → depois:** custo misturado com uso → seção **Utilização** primeiro (100 connects / 280 ops / 7d → dia e mês), depois custo. Rollback: estrutura anterior do MD.
