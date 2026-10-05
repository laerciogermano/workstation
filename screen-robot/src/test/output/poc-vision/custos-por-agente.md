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

Tokens **por operação** — **OCR = medido** em `src/usage/` (66 calls, 9 runs, 2026-10-05; `usageMetadata` Gemini; out = `candidates` + `thoughts`).  
Imagem = estimativa POC curta (sem usage de agent com o roteiro completo).

| Modo | Fonte | Tok in / op | Tok out / op | Tok total / op |
|------|-------|-------------|--------------|----------------|
| **OCR JSON (agent)** | **usage real** | **2.657** | **373** | **3.030** |
| Imagem ~20 KB (1 tile) | estimativa POC | 538 | 300 | **838** |
| Imagem ~31 KB (2 tiles) | estimativa POC | 796 | 300 | **1.096** |

Composição OCR (medido): prompt = roteiro completo + OCR compacto + histórico · mediana in ≈ 2.779 · mediana out ≈ 359.  
Composição imagem (estimativa): Imagem 20 KB = 258 (tile) + 280 (prompt curto) · Imagem 31 KB = 516 + 280 — **não** inclui o roteiro agent; com o mesmo prompt do agent o in sobe para a faixa do OCR + tiles.

### Tokens × ops — por período (OCR medido + imagem estimada)

#### Dia (40 ops)

| Métrica | OCR JSON (medido) | Imagem ~20 KB\* | Imagem ~31 KB\* |
|---------|-------------------|-----------------|-----------------|
| Ops | 40 | 40 | 40 |
| Tok in | 106.280 | 21.520 | 31.840 |
| Tok out | 14.920 | 12.000 | 12.000 |
| Tok total | **121.200** | **33.520** | **43.840** |

#### Semana (280 ops · 100 conexões)

| Métrica | OCR JSON (medido) | Imagem ~20 KB\* | Imagem ~31 KB\* |
|---------|-------------------|-----------------|-----------------|
| Ops | 280 | 280 | 280 |
| Tok in | 743.960 | 150.640 | 222.880 |
| Tok out | 104.440 | 84.000 | 84.000 |
| Tok total | **848.400** | **234.640** | **306.880** |

#### Mês (1.200 ops · ~429 conexões)

| Métrica | OCR JSON (medido) | Imagem ~20 KB\* | Imagem ~31 KB\* |
|---------|-------------------|-----------------|-----------------|
| Ops | 1.200 | 1.200 | 1.200 |
| Tok in | 3.188.400 | 645.600 | 955.200 |
| Tok out | 447.600 | 360.000 | 360.000 |
| Tok total | **3.636.000** | **1.005.600** | **1.315.200** |

\* Estimativa POC — sem `src/usage/` de agent com imagem.

Base usage OCR (amostra):

| Modelo | Calls | Avg in | Avg out† | Avg total |
|--------|-------|--------|----------|-----------|
| gemini-3.5-flash-lite | 44 | 2.935 | 398 | 3.333 |
| gemini-3.8-flash | 13 | 1.697 | 299 | 1.995 |
| gemini-2.5-flash-lite | 9 | 2.688 | 358 | 3.046 |
| **Todas** | **66** | **2.657** | **373** | **3.030** |

† out billable = `candidatesTokenCount` + `thoughtsTokenCount`.

---

## 3. Custo de IA — modelos Gemini elegíveis (US$ + R$)

Elegíveis = multimodal (texto+imagem), família Flash, aptos a decidir tap/scroll na jornada.  
Preços oficiais paid tier — [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) · **câmbio US$ 1 = R$ 5,50** (todo valor em dólar traz o equivalente em real).  
\* 3.6 / 3.7 / **3.8** Flash: preço introdutório até 31/12/2026 (depois US$ 1,50 / R$ 8,25 in · US$ 7,50 / R$ 41,25 out por 1M tok).

**Modelo aprovado (testado nesta POC visão LinkedIn):** ***Gemini 3.8 Flash*** — em negrito nas tabelas.

Tokens/op no cálculo: **OCR medido** = 2.657 in + 373 out · Imagem ~20 KB\* = 538 in + 300 out · 40 ops/dia · 280/sem · 1.200/mês.

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

### Custo / agente — modo OCR JSON (**medido** · runtime atual)

| Modelo | /op | /dia | /semana | /mês |
|--------|-----|------|---------|------|
| Gemini 2.5 Flash-Lite | US$ 0,000415 (R$ 0,002) | US$ 0,017 (R$ 0,09) | US$ 0,116 (R$ 0,64) | US$ 0,50 (R$ 2,74) |
| Gemini 3.1 Flash-Lite | US$ 0,001224 (R$ 0,007) | US$ 0,049 (R$ 0,27) | US$ 0,343 (R$ 1,88) | US$ 1,47 (R$ 8,08) |
| Gemini 2.5 Flash | US$ 0,001730 (R$ 0,010) | US$ 0,069 (R$ 0,38) | US$ 0,484 (R$ 2,66) | US$ 2,08 (R$ 11,42) |
| Gemini 3 Flash | US$ 0,002448 (R$ 0,013) | US$ 0,098 (R$ 0,54) | US$ 0,685 (R$ 3,77) | US$ 2,94 (R$ 16,15) |
| Gemini 3.6 Flash\* | US$ 0,003392 (R$ 0,019) | US$ 0,136 (R$ 0,75) | US$ 0,950 (R$ 5,22) | US$ 4,07 (R$ 22,38) |
| Gemini 3.7 Flash\* | US$ 0,003392 (R$ 0,019) | US$ 0,136 (R$ 0,75) | US$ 0,950 (R$ 5,22) | US$ 4,07 (R$ 22,38) |
| **Gemini 3.8 Flash\*** | **US$ 0,003392 (R$ 0,019)** | **US$ 0,136 (R$ 0,75)** | **US$ 0,950 (R$ 5,22)** | **US$ 4,07 (R$ 22,38)** |
| Gemini 3.5 Flash | US$ 0,007343 (R$ 0,040) | US$ 0,294 (R$ 1,62) | US$ 2,06 (R$ 11,31) | US$ 8,81 (R$ 48,46) |

### Custo / agente — modo Imagem ~20 KB (\*estimativa POC · sem usage agent)

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

Arquivo ~20 KB: [`compressed-20kb.webp`](compressed-20kb.webp) · [`meta-20kb.json`](meta-20kb.json)

### N agentes / mês — OCR medido × Imagem estimada (US$ + R$)

Custo monetário da API · ~429 conexões/mês por agente · câmbio US$ 1 = R$ 5,50.  
***Gemini 3.8 Flash*** = testado e aprovado.

#### Modo OCR JSON (**medido**)

| Modelo | 1 agente | 5 agentes | 10 agentes | 50 agentes |
|--------|----------|-----------|------------|------------|
| Gemini 2.5 Flash-Lite | US$ 0,50 (R$ 2,74) | US$ 2,49 (R$ 13,69) | US$ 4,98 (R$ 27,38) | US$ 24,89 (R$ 136,92) |
| Gemini 3.1 Flash-Lite | US$ 1,47 (R$ 8,08) | US$ 7,34 (R$ 40,38) | US$ 14,68 (R$ 80,77) | US$ 73,42 (R$ 403,84) |
| Gemini 2.5 Flash | US$ 2,08 (R$ 11,42) | US$ 10,38 (R$ 57,08) | US$ 20,76 (R$ 114,15) | US$ 103,78 (R$ 570,77) |
| Gemini 3 Flash | US$ 2,94 (R$ 16,15) | US$ 14,68 (R$ 80,77) | US$ 29,37 (R$ 161,53) | US$ 146,85 (R$ 807,67) |
| Gemini 3.6 Flash\* | US$ 4,07 (R$ 22,38) | US$ 20,35 (R$ 111,92) | US$ 40,70 (R$ 223,84) | US$ 203,49 (R$ 1.119,20) |
| Gemini 3.7 Flash\* | US$ 4,07 (R$ 22,38) | US$ 20,35 (R$ 111,92) | US$ 40,70 (R$ 223,84) | US$ 203,49 (R$ 1.119,20) |
| **Gemini 3.8 Flash\*** | **US$ 4,07 (R$ 22,38)** | **US$ 20,35 (R$ 111,92)** | **US$ 40,70 (R$ 223,84)** | **US$ 203,49 (R$ 1.119,20)** |
| Gemini 3.5 Flash | US$ 8,81 (R$ 48,46) | US$ 44,05 (R$ 242,30) | US$ 88,11 (R$ 484,61) | US$ 440,55 (R$ 2.423,03) |

#### Modo Imagem ~20 KB (\*estimativa POC)

| Modelo | 1 agente | 5 agentes | 10 agentes | 50 agentes |
|--------|----------|-----------|------------|------------|
| Gemini 2.5 Flash-Lite | US$ 0,21 (R$ 1,15) | US$ 1,04 (R$ 5,74) | US$ 2,09 (R$ 11,47) | US$ 10,43 (R$ 57,35) |
| Gemini 3.1 Flash-Lite | US$ 0,70 (R$ 3,86) | US$ 3,51 (R$ 19,29) | US$ 7,01 (R$ 38,58) | US$ 35,07 (R$ 192,88) |
| Gemini 2.5 Flash | US$ 1,09 (R$ 6,02) | US$ 5,47 (R$ 30,08) | US$ 10,94 (R$ 60,15) | US$ 54,68 (R$ 300,76) |
| Gemini 3 Flash | US$ 1,40 (R$ 7,72) | US$ 7,01 (R$ 38,58) | US$ 14,03 (R$ 77,15) | US$ 70,14 (R$ 385,77) |
| Gemini 3.6 Flash\* | US$ 1,83 (R$ 10,09) | US$ 9,17 (R$ 50,44) | US$ 18,34 (R$ 100,88) | US$ 91,71 (R$ 504,41) |
| Gemini 3.7 Flash\* | US$ 1,83 (R$ 10,09) | US$ 9,17 (R$ 50,44) | US$ 18,34 (R$ 100,88) | US$ 91,71 (R$ 504,41) |
| **Gemini 3.8 Flash\*** | **US$ 1,83 (R$ 10,09)** | **US$ 9,17 (R$ 50,44)** | **US$ 18,34 (R$ 100,88)** | **US$ 91,71 (R$ 504,41)** |
| Gemini 3.5 Flash | US$ 4,21 (R$ 23,15) | US$ 21,04 (R$ 115,73) | US$ 42,08 (R$ 231,46) | US$ 210,42 (R$ 1.157,31) |

---

## 4. Prós e contras — OCR vs imagem

| Critério | OCR (texto local → IA) | Imagem comprimida (visão) |
|----------|------------------------|---------------------------|
| **Prós** | Coords de texto precisas (pixel OCR); input previsível em telas simples; RapidOCR já no screen-robot; runtime atual medido | Vê ícones sem texto (lupa, back, Connect gráfico); entende layout/estado (modal, pill, disabled); input estável em lista densa (~1 tile se ≤360–400px); menos frágil a falha de OCR no pill Connect |
| **Contras** | Não vê ícones/imagens; Connect às vezes some no OCR; **in real ~2,7 k tok/op** (roteiro + OCR + histórico); depende do engine | Coords aproximadas (`scaleToDevice`); qualidade baixa illegible; 540px pode virar 2 tiles; usage agent com imagem **ainda não medido**; se pedir “descrever tudo”, out sobe |
| **Custo (100 connects/sem · Gemini 3.8 Flash)** | **~US$ 4,07 (R$ 22,38)/mês · ~3,64 M tok/mês** (medido) | ~US$ 1,83 (R$ 10,09)/mês (20 KB, estimativa POC) · ~1,01 M tok/mês — **subestima** se o agent mandar o mesmo roteiro |
| **Melhor quando** | UI só texto, CTA legível no OCR, latência local importa | CTA visual, ícones, sheets, OCR instável no pill |
| **Pior quando** | Pill Connect invisível no OCR → scroll infinito / tap errado | Compressão extrema (q1) ou pedir JSON enorme a cada frame |

**Sugestão prática:** default atual = **OCR** (custo medido ~US$ 4/mês · 3.8 Flash). Imagem ~20 KB só vira default de custo depois de `usage` agent com o mesmo roteiro.

---

## Notas

- Gargalo = limite semanal LinkedIn (100/7d), não tokens.
- Runs ruins (OCR sem Connect): 10–24 ops/conexão — fora desta média.
- Tokens OCR: média de `src/usage/**/req-*.json` / `run.json` (`promptTokenCount` / `candidatesTokenCount` + `thoughtsTokenCount`).
- **Gemini 3.8 Flash** = testado e aprovado na POC visão; demais Flash = elegíveis (multimodal).

**Antes → depois:** OCR in/out **894/120 (estimativa)** → **2.657/373 (usage real, 66 ops)**; custo 3.8 Flash OCR /mês **US$ 1,34 → US$ 4,07**. Imagem mantida como estimativa POC até haver usage agent. Rollback: valores estimados da revisão anterior deste arquivo.
