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

### Tokens × ops — por período (modos em colunas)

#### Dia (40 ops)

| Métrica | Imagem ~20 KB | Imagem ~31 KB | OCR JSON |
|---------|---------------|---------------|----------|
| Ops | 40 | 40 | 40 |
| Tok in | 21.520 | 31.840 | 35.760 |
| Tok out | 12.000 | 12.000 | 4.800 |
| Tok total | **33.520** | **43.840** | **40.560** |

#### Semana (280 ops · 100 conexões)

| Métrica | Imagem ~20 KB | Imagem ~31 KB | OCR JSON |
|---------|---------------|---------------|----------|
| Ops | 280 | 280 | 280 |
| Tok in | 150.640 | 222.880 | 250.320 |
| Tok out | 84.000 | 84.000 | 33.600 |
| Tok total | **234.640** | **306.880** | **283.920** |

#### Mês (1.200 ops · ~429 conexões)

| Métrica | Imagem ~20 KB | Imagem ~31 KB | OCR JSON |
|---------|---------------|---------------|----------|
| Ops | 1.200 | 1.200 | 1.200 |
| Tok in | 645.600 | 955.200 | 1.072.800 |
| Tok out | 360.000 | 360.000 | 144.000 |
| Tok total | **1.005.600** | **1.315.200** | **1.216.800** |

---

## 3. Custo de IA — modelos Gemini elegíveis (US$)

Elegíveis = multimodal (texto+imagem), família Flash, aptos a decidir tap/scroll na jornada.  
Preços oficiais paid tier (US$ / 1M tokens) — [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) · câmbio US$ 1 = R$ 5,50.  
\* 3.6 / 3.7 / **3.8** Flash: preço introdutório até 31/12/2026 (depois in US$ 1,50 · out US$ 7,50).

**Modelo aprovado (testado nesta POC visão LinkedIn):** ***Gemini 3.8 Flash*** — em negrito nas tabelas.

Tokens/op usados no cálculo (seção 2): Imagem ~20 KB = 538 in + 300 out · OCR = 894 in + 120 out · 40 ops/dia · 280/sem · 1.200/mês.

### Preço por modelo

| Modelo | US$/1M in | US$/1M out | Status |
|--------|-----------|------------|--------|
| Gemini 2.5 Flash-Lite | 0,10 | 0,40 | elegível (mais barato) |
| Gemini 3.1 Flash-Lite | 0,25 | 1,50 | elegível |
| Gemini 2.5 Flash | 0,30 | 2,50 | elegível |
| Gemini 3 Flash | 0,50 | 3,00 | elegível |
| Gemini 3.6 Flash\* | 0,75 | 3,75 | elegível |
| Gemini 3.7 Flash\* | 0,75 | 3,75 | elegível |
| **Gemini 3.8 Flash\*** | **0,75** | **3,75** | **testado e aprovado** |
| Gemini 3.5 Flash | 1,50 | 9,00 | elegível (mais caro) |

### Custo / agente — modo Imagem ~20 KB (recomendado)

| Modelo | US$/op | US$/dia | US$/sem | US$/mês | R$/mês |
|--------|--------|---------|---------|---------|--------|
| Gemini 2.5 Flash-Lite | 0,000174 | 0,007 | 0,049 | 0,21 | 1,15 |
| Gemini 3.1 Flash-Lite | 0,000584 | 0,023 | 0,164 | 0,70 | 3,86 |
| Gemini 2.5 Flash | 0,000911 | 0,036 | 0,255 | 1,09 | 6,02 |
| Gemini 3 Flash | 0,001169 | 0,047 | 0,327 | 1,40 | 7,72 |
| Gemini 3.6 Flash\* | 0,001528 | 0,061 | 0,428 | 1,83 | 10,09 |
| Gemini 3.7 Flash\* | 0,001528 | 0,061 | 0,428 | 1,83 | 10,09 |
| **Gemini 3.8 Flash\*** | **0,001528** | **0,061** | **0,428** | **1,83** | **10,09** |
| Gemini 3.5 Flash | 0,003507 | 0,140 | 0,982 | 4,21 | 23,15 |

### Custo / agente — modo OCR JSON (comparativo)

| Modelo | US$/op | US$/dia | US$/sem | US$/mês | R$/mês |
|--------|--------|---------|---------|---------|--------|
| Gemini 2.5 Flash-Lite | 0,000137 | 0,005 | 0,038 | 0,16 | 0,91 |
| Gemini 3.1 Flash-Lite | 0,000404 | 0,016 | 0,113 | 0,48 | 2,66 |
| Gemini 2.5 Flash | 0,000568 | 0,023 | 0,159 | 0,68 | 3,75 |
| Gemini 3 Flash | 0,000807 | 0,032 | 0,226 | 0,97 | 5,33 |
| Gemini 3.6 Flash\* | 0,001121 | 0,045 | 0,314 | 1,34 | 7,40 |
| Gemini 3.7 Flash\* | 0,001121 | 0,045 | 0,314 | 1,34 | 7,40 |
| **Gemini 3.8 Flash\*** | **0,001121** | **0,045** | **0,314** | **1,34** | **7,40** |
| Gemini 3.5 Flash | 0,002421 | 0,097 | 0,678 | 2,91 | 15,98 |

Arquivo ~20 KB: [`compressed-20kb.webp`](compressed-20kb.webp) · [`meta-20kb.json`](meta-20kb.json)

### N agentes / mês — **Gemini 3.8 Flash** aprovado (US$)

Valores em **dólares** da API · modo Imagem ~20 KB (padrão aprovado na POC).

| Agentes | Conexões/mês | **Gemini 3.8 Flash** (img 20 KB) | Gemini 3.8 Flash (OCR) |
|---------|--------------|----------------------------------|------------------------|
| 1 | 429 | **US$ 1,83** | US$ 1,34 |
| 5 | 2.143 | **US$ 9,17** | US$ 6,72 |
| 10 | 4.286 | **US$ 18,34** | US$ 13,45 |
| 50 | 21.429 | **US$ 91,71** | US$ 67,23 |

---

## 4. Prós e contras — OCR vs imagem

| Critério | OCR (texto local → IA) | Imagem comprimida (visão) |
|----------|------------------------|---------------------------|
| **Prós** | Coords de texto precisas (pixel OCR); input previsível em telas simples; output pode ser só a ação (~120 tok); RapidOCR já no screen-robot; barato em telas com pouco texto | Vê ícones sem texto (lupa, back, Connect gráfico); entende layout/estado (modal, pill, disabled); input estável em lista densa (~1 tile se ≤360–400px); menos frágil a falha de OCR no pill Connect |
| **Contras** | Não vê ícones/imagens; Connect às vezes some no OCR (histórico da jornada); input cresce com tela densa (~700+ tok JSON); depende do engine (tesseract vs rapidocr) | Coords aproximadas (precisa `scaleToDevice`); qualidade baixa demais illegible; 540px pode virar 2 tiles; se pedir “descrever tudo”, output sobe (~300 tok); depende de API multimodal |
| **Custo (100 connects/sem · Gemini 3.8 Flash)** | ~US$ 1,34/mês · ~1,22 M tok/mês | ~US$ 1,83/mês (20 KB) · ~1,01 M tok/mês |
| **Melhor quando** | UI só texto, CTA legível no OCR, latência local importa | CTA visual, ícones, sheets, OCR instável no pill |
| **Pior quando** | Pill Connect invisível no OCR → scroll infinito / tap errado | Compressão extrema (q1) ou pedir JSON enorme a cada frame |

**Sugestão prática:** default **imagem ~20 KB (1 tile)** na lista People; OCR como fallback ou híbrido (OCR para validar texto do campo Search; visão para Connect/ícones).

---

## Notas

- Gargalo = limite semanal LinkedIn (100/7d), não tokens.
- Runs ruins (OCR sem Connect): 10–24 ops/conexão — fora desta média.
- Valor real de tokens: `usageMetadata` da API.

**Antes → depois:** após Utilização + Tokens + Custo, seção **4. Prós e contras**. Rollback: remover seção 4.
