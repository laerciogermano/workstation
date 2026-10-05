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

## 2. Tokens por período (1 agente)

Tokens **por operação** (estimativa Gemini Flash):

| Modo | Tok in / op | Tok out / op | Tok total / op |
|------|-------------|--------------|----------------|
| Imagem ~20 KB (1 tile) | 538 | 300 | **838** |
| Imagem ~31 KB (2 tiles) | 796 | 300 | **1.096** |
| OCR JSON | 894 | 120 | **1.014** |

Composição in: Imagem 20 KB = 258 (tile) + 280 (prompt) · Imagem 31 KB = 516 + 280 · OCR = 694 (JSON) + 200 (prompt).

### Tokens × ops (40/dia · 280/sem · 1.200/mês)

| Modo | Período | Ops | Tok in | Tok out | Tok total |
|------|---------|-----|--------|---------|-----------|
| Imagem ~20 KB | dia | 40 | 21.520 | 12.000 | **33.520** |
| Imagem ~20 KB | semana | 280 | 150.640 | 84.000 | **234.640** |
| Imagem ~20 KB | mês | 1.200 | 645.600 | 360.000 | **1.005.600** |
| Imagem ~31 KB | dia | 40 | 31.840 | 12.000 | **43.840** |
| Imagem ~31 KB | semana | 280 | 222.880 | 84.000 | **306.880** |
| Imagem ~31 KB | mês | 1.200 | 955.200 | 360.000 | **1.315.200** |
| OCR JSON | dia | 40 | 35.760 | 4.800 | **40.560** |
| OCR JSON | semana | 280 | 250.320 | 33.600 | **283.920** |
| OCR JSON | mês | 1.200 | 1.072.800 | 144.000 | **1.216.800** |

Resumo (tok total / agente):

| Modo | Dia | Semana | Mês |
|------|-----|--------|-----|
| Imagem ~20 KB | 33.520 | 234.640 | **1,01 M** |
| Imagem ~31 KB | 43.840 | 306.880 | **1,32 M** |
| OCR JSON | 40.560 | 283.920 | **1,22 M** |

---

## 3. Custo de IA (Gemini Flash) — valor em US$

Preço: in US$ 0,075/1M · out US$ 0,30/1M · câmbio US$ 1 = R$ 5,50  
US$/op: Imagem 20 KB ≈ 0,000130 · Imagem 31 KB ≈ 0,000150 · OCR ≈ 0,000103

| Métrica | Imagem ~20 KB | Imagem ~31 KB | OCR JSON |
|---------|---------------|---------------|----------|
| Ops/dia | 40 | 40 | 40 |
| US$/dia | 0,005 | 0,006 | 0,004 |
| Ops/semana | 280 | 280 | 280 |
| US$/semana | **0,036** | **0,042** | **0,029** |
| Ops/mês | 1.200 | 1.200 | 1.200 |
| US$/mês | **0,16** | **0,18** | **0,12** |
| R$/mês | 0,86 | 0,99 | 0,68 |

Arquivo ~20 KB: [`compressed-20kb.webp`](compressed-20kb.webp) · [`meta-20kb.json`](meta-20kb.json)

### N agentes / mês — custo monetário da API (dólares)

Sim: valores em **US$** (quanto se paga à API Gemini no mês). Não é quantidade de operações nem de tokens.

| Agentes | Conexões/mês | Custo Imagem 20 KB | Custo Imagem 31 KB | Custo OCR |
|---------|--------------|--------------------|--------------------|-----------|
| 1 | 429 | US$ 0,16 | US$ 0,18 | US$ 0,12 |
| 5 | 2.143 | US$ 0,78 | US$ 0,90 | US$ 0,62 |
| 10 | 4.286 | US$ 1,56 | US$ 1,80 | US$ 1,24 |
| 50 | 21.429 | US$ 7,81 | US$ 9,00 | US$ 6,18 |

---

## 4. Prós e contras — OCR vs imagem

| Critério | OCR (texto local → IA) | Imagem comprimida (visão) |
|----------|------------------------|---------------------------|
| **Prós** | Coords de texto precisas (pixel OCR); input previsível em telas simples; output pode ser só a ação (~120 tok); RapidOCR já no screen-robot; barato em telas com pouco texto | Vê ícones sem texto (lupa, back, Connect gráfico); entende layout/estado (modal, pill, disabled); input estável em lista densa (~1 tile se ≤360–400px); menos frágil a falha de OCR no pill Connect |
| **Contras** | Não vê ícones/imagens; Connect às vezes some no OCR (histórico da jornada); input cresce com tela densa (~700+ tok JSON); depende do engine (tesseract vs rapidocr) | Coords aproximadas (precisa `scaleToDevice`); qualidade baixa demais illegible; 540px pode virar 2 tiles; se pedir “descrever tudo”, output sobe (~300 tok); depende de API multimodal |
| **Custo (100 connects/sem)** | ~US$ 0,12/mês · ~1,22 M tok/mês | ~US$ 0,16/mês (20 KB) · ~1,01 M tok/mês |
| **Melhor quando** | UI só texto, CTA legível no OCR, latência local importa | CTA visual, ícones, sheets, OCR instável no pill |
| **Pior quando** | Pill Connect invisível no OCR → scroll infinito / tap errado | Compressão extrema (q1) ou pedir JSON enorme a cada frame |

**Sugestão prática:** default **imagem ~20 KB (1 tile)** na lista People; OCR como fallback ou híbrido (OCR para validar texto do campo Search; visão para Connect/ícones).

---

## Notas

- Gargalo = limite semanal LinkedIn (100/7d), não tokens.
- Runs ruins (OCR sem Connect): 10–24 ops/conexão — fora desta média.
- Valor real de tokens: `usageMetadata` da API.

**Antes → depois:** após Utilização + Tokens + Custo, seção **4. Prós e contras**. Rollback: remover seção 4.
