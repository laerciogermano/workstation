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

Tokens **por operação** — **OCR gpt-4o-mini = medido** nos 3 últimos `usage-2.0` (2026-10-07; `resposta.usage.prompt_tokens` / `completion_tokens`).  
Imagem = estimativa POC curta (sem usage de agent com o roteiro completo).

| Modo | Fonte | Tok in / op | Tok out / op | Tok total / op |
|------|-------|-------------|--------------|----------------|
| **OCR JSON (gpt-4o-mini)** | **usage-2.0 real** | **3.189** | **51** | **3.241** |
| Imagem ~20 KB (1 tile) | estimativa POC | 538 | 300 | **838** |
| Imagem ~31 KB (2 tiles) | estimativa POC | 796 | 300 | **1.096** |

Composição OCR (medido): system + jornada LinkedIn 1→12 + OCR JSON da tela · min in 3.008 · max in 3.468 · out ~49–55.  
Composição imagem (estimativa): Imagem 20 KB = 258 (tile) + 280 (prompt curto) · Imagem 31 KB = 516 + 280 — **não** inclui o roteiro agent; com o mesmo prompt do agent o in sobe para a faixa do OCR + tiles.

### Tokens × ops — por período (OCR medido + imagem estimada)

#### Dia (40 ops)

| Métrica | OCR JSON (medido) | Imagem ~20 KB\* | Imagem ~31 KB\* |
|---------|-------------------|-----------------|-----------------|
| Ops | 40 | 40 | 40 |
| Tok in | 127.560 | 21.520 | 31.840 |
| Tok out | 2.040 | 12.000 | 12.000 |
| Tok total | **129.640** | **33.520** | **43.840** |

#### Semana (280 ops · 100 conexões)

| Métrica | OCR JSON (medido) | Imagem ~20 KB\* | Imagem ~31 KB\* |
|---------|-------------------|-----------------|-----------------|
| Ops | 280 | 280 | 280 |
| Tok in | 892.920 | 150.640 | 222.880 |
| Tok out | 14.280 | 84.000 | 84.000 |
| Tok total | **907.480** | **234.640** | **306.880** |

#### Mês (1.200 ops · ~429 conexões)

| Métrica | OCR JSON (medido) | Imagem ~20 KB\* | Imagem ~31 KB\* |
|---------|-------------------|-----------------|-----------------|
| Ops | 1.200 | 1.200 | 1.200 |
| Tok in | 3.826.800 | 645.600 | 955.200 |
| Tok out | 61.200 | 360.000 | 360.000 |
| Tok total | **3.889.200** | **1.005.600** | **1.315.200** |

\* Estimativa POC — sem `usage-2.0` de agent com imagem.

Base usage OCR gpt-4o-mini (últimos 3 logs `usage-2.0/`):

| Arquivo | Passo | In | Out | Total |
|---------|-------|----|-----|-------|
| `2026-10-07T16-47-12-051.json` | 1 Search | 3.468 | 55 | 3.523 |
| `2026-10-07T16-47-32-034.json` | 2 type | 3.008 | 49 | 3.057 |
| `2026-10-07T16-47-52-662.json` | 3 BACK | 3.092 | 50 | 3.142 |
| **Média** | — | **3.189** | **51** | **3.241** |

Modelo API: `gpt-4o-mini` / `gpt-4o-mini-2024-07-18` · `cached_tokens` = 0 nos 3 samples.

---

## 3. Custo de IA — gpt-4o-mini (real) + Gemini (simulação no mesmo tok/op)

Preços oficiais — [OpenAI pricing](https://openai.com/api/pricing/) · [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) · **câmbio US$ 1 = R$ 5,50**.  
\* 3.6 / 3.7 / **3.8** Flash: preço introdutório até 31/12/2026 (depois US$ 1,50 / R$ 8,25 in · US$ 7,50 / R$ 41,25 out por 1M tok).

**Modelo medido (usage-2.0):** ***gpt-4o-mini*** — em negrito nas tabelas OCR.  
Gemini = simulação no **mesmo** tok/op medido (3.189 in + 51 out), para comparar preço no workload atual.

Tokens/op no cálculo: **OCR medido** = 3.189 in + 51 out · Imagem ~20 KB\* = 538 in + 300 out · 40 ops/dia · 280/sem · 1.200/mês.

### Preço por modelo (por 1M tokens)

| Modelo | In | Out | Status |
|--------|----|-----|--------|
| Gemini 2.5 Flash-Lite | US$ 0,10 (R$ 0,55) | US$ 0,40 (R$ 2,20) | elegível (mais barato Gemini) |
| **gpt-4o-mini** | **US$ 0,15 (R$ 0,82)** | **US$ 0,60 (R$ 3,30)** | **medido usage-2.0** |
| Gemini 3.1 Flash-Lite | US$ 0,25 (R$ 1,38) | US$ 1,50 (R$ 8,25) | elegível |
| Gemini 2.5 Flash | US$ 0,30 (R$ 1,65) | US$ 2,50 (R$ 13,75) | elegível |
| Gemini 3 Flash | US$ 0,50 (R$ 2,75) | US$ 3,00 (R$ 16,50) | elegível |
| Gemini 3.6 Flash\* | US$ 0,75 (R$ 4,12) | US$ 3,75 (R$ 20,62) | elegível |
| Gemini 3.7 Flash\* | US$ 0,75 (R$ 4,12) | US$ 3,75 (R$ 20,62) | elegível |
| Gemini 3.8 Flash\* | US$ 0,75 (R$ 4,12) | US$ 3,75 (R$ 20,62) | elegível (POC visão) |
| Gemini 3.5 Flash | US$ 1,50 (R$ 8,25) | US$ 9,00 (R$ 49,50) | elegível (mais caro) |

### Custo / agente — modo OCR JSON (**medido gpt-4o-mini** · tok/op real)

| Modelo | /op | /dia | /semana | /mês |
|--------|-----|------|---------|------|
| Gemini 2.5 Flash-Lite | US$ 0,000339 (R$ 0,002) | US$ 0,014 (R$ 0,07) | US$ 0,095 (R$ 0,52) | US$ 0,41 (R$ 2,24) |
| **gpt-4o-mini** | **US$ 0,000509 (R$ 0,003)** | **US$ 0,020 (R$ 0,11)** | **US$ 0,143 (R$ 0,78)** | **US$ 0,61 (R$ 3,36)** |
| Gemini 3.1 Flash-Lite | US$ 0,000874 (R$ 0,005) | US$ 0,035 (R$ 0,19) | US$ 0,245 (R$ 1,35) | US$ 1,05 (R$ 5,77) |
| Gemini 2.5 Flash | US$ 0,001084 (R$ 0,006) | US$ 0,043 (R$ 0,24) | US$ 0,304 (R$ 1,67) | US$ 1,30 (R$ 7,16) |
| Gemini 3 Flash | US$ 0,001747 (R$ 0,010) | US$ 0,070 (R$ 0,38) | US$ 0,489 (R$ 2,69) | US$ 2,10 (R$ 11,53) |
| Gemini 3.6 Flash\* | US$ 0,002583 (R$ 0,014) | US$ 0,103 (R$ 0,57) | US$ 0,723 (R$ 3,98) | US$ 3,10 (R$ 17,05) |
| Gemini 3.7 Flash\* | US$ 0,002583 (R$ 0,014) | US$ 0,103 (R$ 0,57) | US$ 0,723 (R$ 3,98) | US$ 3,10 (R$ 17,05) |
| Gemini 3.8 Flash\* | US$ 0,002583 (R$ 0,014) | US$ 0,103 (R$ 0,57) | US$ 0,723 (R$ 3,98) | US$ 3,10 (R$ 17,05) |
| Gemini 3.5 Flash | US$ 0,005242 (R$ 0,029) | US$ 0,210 (R$ 1,15) | US$ 1,47 (R$ 8,07) | US$ 6,29 (R$ 34,60) |

### Custo / agente — modo Imagem ~20 KB (\*estimativa POC · sem usage agent)

| Modelo | /op | /dia | /semana | /mês |
|--------|-----|------|---------|------|
| Gemini 2.5 Flash-Lite | US$ 0,000174 (R$ 0,001) | US$ 0,007 (R$ 0,04) | US$ 0,049 (R$ 0,27) | US$ 0,21 (R$ 1,15) |
| **gpt-4o-mini** | **US$ 0,000261 (R$ 0,001)** | **US$ 0,010 (R$ 0,06)** | **US$ 0,073 (R$ 0,40)** | **US$ 0,31 (R$ 1,72)** |
| Gemini 3.1 Flash-Lite | US$ 0,000584 (R$ 0,003) | US$ 0,023 (R$ 0,13) | US$ 0,164 (R$ 0,90) | US$ 0,70 (R$ 3,86) |
| Gemini 2.5 Flash | US$ 0,000911 (R$ 0,005) | US$ 0,036 (R$ 0,20) | US$ 0,255 (R$ 1,40) | US$ 1,09 (R$ 6,02) |
| Gemini 3 Flash | US$ 0,001169 (R$ 0,006) | US$ 0,047 (R$ 0,26) | US$ 0,327 (R$ 1,80) | US$ 1,40 (R$ 7,72) |
| Gemini 3.6 Flash\* | US$ 0,001528 (R$ 0,008) | US$ 0,061 (R$ 0,34) | US$ 0,428 (R$ 2,35) | US$ 1,83 (R$ 10,09) |
| Gemini 3.7 Flash\* | US$ 0,001528 (R$ 0,008) | US$ 0,061 (R$ 0,34) | US$ 0,428 (R$ 2,35) | US$ 1,83 (R$ 10,09) |
| Gemini 3.8 Flash\* | US$ 0,001528 (R$ 0,008) | US$ 0,061 (R$ 0,34) | US$ 0,428 (R$ 2,35) | US$ 1,83 (R$ 10,09) |
| Gemini 3.5 Flash | US$ 0,003507 (R$ 0,019) | US$ 0,140 (R$ 0,77) | US$ 0,982 (R$ 5,40) | US$ 4,21 (R$ 23,15) |

Arquivo ~20 KB: [`compressed-20kb.webp`](compressed-20kb.webp) · [`meta-20kb.json`](meta-20kb.json)

### N agentes / mês — OCR medido × Imagem estimada (US$ + R$)

Custo monetário da API · ~429 conexões/mês por agente · câmbio US$ 1 = R$ 5,50.  
***gpt-4o-mini*** = medido nos logs · Gemini = simulação no mesmo tok/op.

#### Modo OCR JSON (**medido**)

| Modelo | 1 agente | 5 agentes | 10 agentes | 50 agentes |
|--------|----------|-----------|------------|------------|
| Gemini 2.5 Flash-Lite | US$ 0,41 (R$ 2,24) | US$ 2,04 (R$ 11,20) | US$ 4,07 (R$ 22,39) | US$ 20,36 (R$ 111,97) |
| **gpt-4o-mini** | **US$ 0,61 (R$ 3,36)** | **US$ 3,05 (R$ 16,80)** | **US$ 6,11 (R$ 33,59)** | **US$ 30,54 (R$ 167,95)** |
| Gemini 3.1 Flash-Lite | US$ 1,05 (R$ 5,77) | US$ 5,24 (R$ 28,83) | US$ 10,48 (R$ 57,67) | US$ 52,42 (R$ 288,34) |
| Gemini 2.5 Flash | US$ 1,30 (R$ 7,16) | US$ 6,51 (R$ 35,78) | US$ 13,01 (R$ 71,56) | US$ 65,05 (R$ 357,79) |
| Gemini 3 Flash | US$ 2,10 (R$ 11,53) | US$ 10,48 (R$ 57,67) | US$ 20,97 (R$ 115,33) | US$ 104,85 (R$ 576,67) |
| Gemini 3.6 Flash\* | US$ 3,10 (R$ 17,05) | US$ 15,50 (R$ 85,24) | US$ 31,00 (R$ 170,48) | US$ 154,98 (R$ 852,39) |
| Gemini 3.7 Flash\* | US$ 3,10 (R$ 17,05) | US$ 15,50 (R$ 85,24) | US$ 31,00 (R$ 170,48) | US$ 154,98 (R$ 852,39) |
| Gemini 3.8 Flash\* | US$ 3,10 (R$ 17,05) | US$ 15,50 (R$ 85,24) | US$ 31,00 (R$ 170,48) | US$ 154,98 (R$ 852,39) |
| Gemini 3.5 Flash | US$ 6,29 (R$ 34,60) | US$ 31,45 (R$ 173,00) | US$ 62,91 (R$ 346,00) | US$ 314,55 (R$ 1.730,02) |

#### Modo Imagem ~20 KB (\*estimativa POC)

| Modelo | 1 agente | 5 agentes | 10 agentes | 50 agentes |
|--------|----------|-----------|------------|------------|
| Gemini 2.5 Flash-Lite | US$ 0,21 (R$ 1,15) | US$ 1,04 (R$ 5,74) | US$ 2,09 (R$ 11,47) | US$ 10,43 (R$ 57,35) |
| **gpt-4o-mini** | **US$ 0,31 (R$ 1,72)** | **US$ 1,57 (R$ 8,61)** | **US$ 3,13 (R$ 17,22)** | **US$ 15,65 (R$ 86,08)** |
| Gemini 3.1 Flash-Lite | US$ 0,70 (R$ 3,86) | US$ 3,51 (R$ 19,29) | US$ 7,01 (R$ 38,58) | US$ 35,07 (R$ 192,88) |
| Gemini 2.5 Flash | US$ 1,09 (R$ 6,02) | US$ 5,47 (R$ 30,08) | US$ 10,94 (R$ 60,15) | US$ 54,68 (R$ 300,76) |
| Gemini 3 Flash | US$ 1,40 (R$ 7,72) | US$ 7,01 (R$ 38,58) | US$ 14,03 (R$ 77,15) | US$ 70,14 (R$ 385,77) |
| Gemini 3.6 Flash\* | US$ 1,83 (R$ 10,09) | US$ 9,17 (R$ 50,44) | US$ 18,34 (R$ 100,88) | US$ 91,71 (R$ 504,41) |
| Gemini 3.7 Flash\* | US$ 1,83 (R$ 10,09) | US$ 9,17 (R$ 50,44) | US$ 18,34 (R$ 100,88) | US$ 91,71 (R$ 504,41) |
| Gemini 3.8 Flash\* | US$ 1,83 (R$ 10,09) | US$ 9,17 (R$ 50,44) | US$ 18,34 (R$ 100,88) | US$ 91,71 (R$ 504,41) |
| Gemini 3.5 Flash | US$ 4,21 (R$ 23,15) | US$ 21,04 (R$ 115,73) | US$ 42,08 (R$ 231,46) | US$ 210,42 (R$ 1.157,31) |

---

## 4. Prós e contras — OCR vs imagem

| Critério | OCR (texto local → IA) | Imagem comprimida (visão) |
|----------|------------------------|---------------------------|
| **Prós** | Coords de texto precisas (pixel OCR); input previsível em telas simples; RapidOCR já no screen-robot; runtime atual medido em gpt-4o-mini | Vê ícones sem texto (lupa, back, Connect gráfico); entende layout/estado (modal, pill, disabled); input estável em lista densa (~1 tile se ≤360–400px); menos frágil a falha de OCR no pill Connect |
| **Contras** | Não vê ícones/imagens; Connect às vezes some no OCR; **in real ~3,2 k tok/op** (roteiro + OCR); out baixo (~51) no raw-gpt | Coords aproximadas (`scaleToDevice`); qualidade baixa illegible; 540px pode virar 2 tiles; usage agent com imagem **ainda não medido**; se pedir “descrever tudo”, out sobe |
| **Custo (100 connects/sem · gpt-4o-mini)** | **~US$ 0,61 (R$ 3,36)/mês · ~3,89 M tok/mês** (medido) | ~US$ 0,31 (R$ 1,72)/mês (20 KB, estimativa POC) · ~1,01 M tok/mês — **subestima** se o agent mandar o mesmo roteiro |
| **Melhor quando** | UI só texto, CTA legível no OCR, latência local importa | CTA visual, ícones, sheets, OCR instável no pill |
| **Pior quando** | Pill Connect invisível no OCR → scroll infinito / tap errado | Compressão extrema (q1) ou pedir JSON enorme a cada frame |

**Sugestão prática:** default atual = **OCR + gpt-4o-mini** (custo medido ~US$ 0,61/mês). Imagem ~20 KB só vira default de custo depois de `usage-2.0` agent com o mesmo roteiro.

---

## Notas

- Gargalo = limite semanal LinkedIn (100/7d), não tokens.
- Runs ruins (OCR sem Connect): 10–24 ops/conexão — fora desta média.
- Tokens OCR: média dos 3 últimos `usage-2.0/*.json` gpt-4o-mini (`prompt_tokens` / `completion_tokens`).
- **gpt-4o-mini** = medido e base do custo real; Gemini = simulação no mesmo tok/op.

**Antes → depois:** OCR in/out **2.657/373 (Gemini `usage/`, 66 ops)** → **3.189/51 (gpt-4o-mini `usage-2.0`, 3 ops)**; custo OCR /mês **US$ 4,07 (3.8 Flash)** → **US$ 0,61 (gpt-4o-mini)**. Imagem mantida como estimativa POC. Rollback: valores Gemini-only da revisão anterior deste arquivo.
