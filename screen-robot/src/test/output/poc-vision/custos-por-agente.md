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

## 3. Custo de IA — modelos Gemini elegíveis (US$ + R$)

Elegíveis = multimodal (texto+imagem), família Flash, aptos a decidir tap/scroll na jornada.  
Preços oficiais paid tier — [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) · **câmbio US$ 1 = R$ 5,50** (todo valor em dólar traz o equivalente em real).  
\* 3.6 / 3.7 / **3.8** Flash: preço introdutório até 31/12/2026 (depois US$ 1,50 / R$ 8,25 in · US$ 7,50 / R$ 41,25 out por 1M tok).

**Modelo aprovado (testado nesta POC visão LinkedIn):** ***Gemini 3.8 Flash*** — em negrito nas tabelas.

Tokens/op usados no cálculo (seção 2): Imagem ~20 KB = 538 in + 300 out · OCR = 894 in + 120 out · 40 ops/dia · 280/sem · 1.200/mês.

### Preço por modelo (por 1M tokens)

| Modelo | In | Out | Status |
|--------|----|-----|--------|
| Gemini 2.5 Flash-Lite | US$ 0,10 (R$ 0,55) | US$ 0,40 (R$ 2,20) | elegível (mais barato) |
| Gemini 3.1 Flash-Lite | US$ 0,25 (R$ 1,38) | US$ 1,50 (R$ 8,25) | elegível |
| Gemini 2.5 Flash | US$ 0,30 (R$ 1,65) | US$ 2,50 (R$ 13,75) | elegível |
| Gemini 3 Flash | US$ 0,50 (R$ 2,75) | US$ 3,00 (R$ 16,50) | elegível |
| Gemini 3.6 Flash\* | US$ 0,75 (R$ 4,12) | US$ 3,75 (R$ 20,62) | elegível |
| Gemini 3.7 Flash\* | US$ 0,75 (R$ 4,12) | US$ 3,75 (R$ 20,62) | elegível |
| **Gemini 3.8 Flash\*** | **US$ 0,75 (R$ 4,12)** | **US$ 3,75 (R$ 20,62)** | **testado e aprovado** |
| Gemini 3.5 Flash | US$ 1,50 (R$ 8,25) | US$ 9,00 (R$ 49,50) | elegível (mais caro) |

### Custo / agente — modo Imagem ~20 KB (recomendado)

| Modelo | /op | /dia | /semana | /mês |
|--------|-----|------|---------|------|
| Gemini 2.5 Flash-Lite | US$ 0,000174 (R$ 0,001) | US$ 0,007 (R$ 0,04) | US$ 0,049 (R$ 0,27) | US$ 0,21 (R$ 1,15) |
| Gemini 3.1 Flash-Lite | US$ 0,000584 (R$ 0,003) | US$ 0,023 (R$ 0,13) | US$ 0,164 (R$ 0,90) | US$ 0,70 (R$ 3,86) |
| Gemini 2.5 Flash | US$ 0,000911 (R$ 0,005) | US$ 0,036 (R$ 0,20) | US$ 0,255 (R$ 1,40) | US$ 1,09 (R$ 6,02) |
| Gemini 3 Flash | US$ 0,001169 (R$ 0,006) | US$ 0,047 (R$ 0,26) | US$ 0,327 (R$ 1,80) | US$ 1,40 (R$ 7,72) |
| Gemini 3.6 Flash\* | US$ 0,001528 (R$ 0,008) | US$ 0,061 (R$ 0,34) | US$ 0,428 (R$ 2,35) | US$ 1,83 (R$ 10,09) |
| Gemini 3.7 Flash\* | US$ 0,001528 (R$ 0,008) | US$ 0,061 (R$ 0,34) | US$ 0,428 (R$ 2,35) | US$ 1,83 (R$ 10,09) |
| **Gemini 3.8 Flash\*** | **US$ 0,001528 (R$ 0,008)** | **US$ 0,061 (R$ 0,34)** | **US$ 0,428 (R$ 2,35)** | **US$ 1,83 (R$ 10,09)** |
| Gemini 3.5 Flash | US$ 0,003507 (R$ 0,019) | US$ 0,140 (R$ 0,77) | US$ 0,982 (R$ 5,40) | US$ 4,21 (R$ 23,15) |

### Custo / agente — modo OCR JSON (comparativo)

| Modelo | /op | /dia | /semana | /mês |
|--------|-----|------|---------|------|
| Gemini 2.5 Flash-Lite | US$ 0,000137 (R$ 0,001) | US$ 0,005 (R$ 0,03) | US$ 0,038 (R$ 0,21) | US$ 0,16 (R$ 0,91) |
| Gemini 3.1 Flash-Lite | US$ 0,000404 (R$ 0,002) | US$ 0,016 (R$ 0,09) | US$ 0,113 (R$ 0,62) | US$ 0,48 (R$ 2,66) |
| Gemini 2.5 Flash | US$ 0,000568 (R$ 0,003) | US$ 0,023 (R$ 0,13) | US$ 0,159 (R$ 0,88) | US$ 0,68 (R$ 3,75) |
| Gemini 3 Flash | US$ 0,000807 (R$ 0,004) | US$ 0,032 (R$ 0,18) | US$ 0,226 (R$ 1,24) | US$ 0,97 (R$ 5,33) |
| Gemini 3.6 Flash\* | US$ 0,001121 (R$ 0,006) | US$ 0,045 (R$ 0,25) | US$ 0,314 (R$ 1,73) | US$ 1,34 (R$ 7,40) |
| Gemini 3.7 Flash\* | US$ 0,001121 (R$ 0,006) | US$ 0,045 (R$ 0,25) | US$ 0,314 (R$ 1,73) | US$ 1,34 (R$ 7,40) |
| **Gemini 3.8 Flash\*** | **US$ 0,001121 (R$ 0,006)** | **US$ 0,045 (R$ 0,25)** | **US$ 0,314 (R$ 1,73)** | **US$ 1,34 (R$ 7,40)** |
| Gemini 3.5 Flash | US$ 0,002421 (R$ 0,013) | US$ 0,097 (R$ 0,53) | US$ 0,678 (R$ 3,73) | US$ 2,91 (R$ 15,98) |

Arquivo ~20 KB: [`compressed-20kb.webp`](compressed-20kb.webp) · [`meta-20kb.json`](meta-20kb.json)

### N agentes / mês — **Gemini 3.8 Flash** aprovado (US$ + R$)

Custo monetário da API · modo Imagem ~20 KB (padrão aprovado na POC).

| Agentes | Conexões/mês | **Gemini 3.8 Flash** (img 20 KB) | Gemini 3.8 Flash (OCR) |
|---------|--------------|----------------------------------|------------------------|
| 1 | 429 | **US$ 1,83 (R$ 10,09)** | US$ 1,34 (R$ 7,40) |
| 5 | 2.143 | **US$ 9,17 (R$ 50,44)** | US$ 6,72 (R$ 36,98) |
| 10 | 4.286 | **US$ 18,34 (R$ 100,88)** | US$ 13,45 (R$ 73,95) |
| 50 | 21.429 | **US$ 91,71 (R$ 504,41)** | US$ 67,23 (R$ 369,77) |

---

## 4. Prós e contras — OCR vs imagem

| Critério | OCR (texto local → IA) | Imagem comprimida (visão) |
|----------|------------------------|---------------------------|
| **Prós** | Coords de texto precisas (pixel OCR); input previsível em telas simples; output pode ser só a ação (~120 tok); RapidOCR já no screen-robot; barato em telas com pouco texto | Vê ícones sem texto (lupa, back, Connect gráfico); entende layout/estado (modal, pill, disabled); input estável em lista densa (~1 tile se ≤360–400px); menos frágil a falha de OCR no pill Connect |
| **Contras** | Não vê ícones/imagens; Connect às vezes some no OCR (histórico da jornada); input cresce com tela densa (~700+ tok JSON); depende do engine (tesseract vs rapidocr) | Coords aproximadas (precisa `scaleToDevice`); qualidade baixa demais illegible; 540px pode virar 2 tiles; se pedir “descrever tudo”, output sobe (~300 tok); depende de API multimodal |
| **Custo (100 connects/sem · Gemini 3.8 Flash)** | ~US$ 1,34 (R$ 7,40)/mês · ~1,22 M tok/mês | ~US$ 1,83 (R$ 10,09)/mês (20 KB) · ~1,01 M tok/mês |
| **Melhor quando** | UI só texto, CTA legível no OCR, latência local importa | CTA visual, ícones, sheets, OCR instável no pill |
| **Pior quando** | Pill Connect invisível no OCR → scroll infinito / tap errado | Compressão extrema (q1) ou pedir JSON enorme a cada frame |

**Sugestão prática:** default **imagem ~20 KB (1 tile)** na lista People; OCR como fallback ou híbrido (OCR para validar texto do campo Search; visão para Connect/ícones).

---

## Notas

- Gargalo = limite semanal LinkedIn (100/7d), não tokens.
- Runs ruins (OCR sem Connect): 10–24 ops/conexão — fora desta média.
- Valor real de tokens/custo: `usageMetadata` da API + fatura Google.
- **Gemini 3.8 Flash** = testado e aprovado na POC visão; demais Flash = elegíveis (multimodal).

**Antes → depois:** seção 3 com preço genérico → tabela de **Gemini Flash elegíveis** (preço oficial) e **3.8 em negrito (aprovado)**; seção 4 prós/contras mantida. Rollback: tabela única com preço antigo.
