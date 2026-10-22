# Postmortem — limite comercial de busca/visualização de perfis (LinkedIn)

**Quando:** 2026-10-21 ~23:19 UTC → 2026-10-22 ~00:42 UTC  
**Severidade:** alta (conta LinkedIn bloqueada para novas buscas/visualizações de perfis na sessão)  
**Serviço / fluxo:** `login-extract-profile-detail` (screen-robot → API ConnectMax / profiles)  
**Decisão:** o “ban” observado **não** é ban genérico de conta; é o **limite comercial de *profile search / people browsing*** do LinkedIn, acelerado por um burst de aberturas rasas.

**Relacionado:** runtime AVD — [`postmortem.md`](postmortem.md) · script — [`src/scripts/login-extract-profile-detail.js`](src/scripts/login-extract-profile-detail.js) · evidência visual — `src/screenshots/login-extract-profile-detail/2026-10-22T00-36-29-630Z/`

---

## Resumo executivo

Em uma sessão de ~84 min foram persistidos **33** perfis (`extractedAt`). O OCR de vários perfis com scroll completo já trazia o paywall LinkedIn (*You've approached your profile search limit* / upgrade Premium · Sales Navigator · Recruiter). O pico de risco foi **00:18–00:32 UTC**: **16** aberturas em ~14 min (~1 a cada 35–50 s), em geral **só cabeçalho** (`company` / `about` / `experience` null). Cada open ainda conta como view; o burst após dezenas de views profundas esgotou (ou consolidou) o limite comercial.

---

## Impacto

| Área | Efeito |
|------|--------|
| Conta LinkedIn | Paywall de *people browsing* / *profile search limit*; novos perfis da busca ficam inutilizáveis até reset do quota (tipicamente semanal) ou upgrade |
| Pipeline de extração | Sessão continua abrindo cards, mas qualidade cai (rasa / falso positivo) e risco de reforçar o limite |
| Dados | 33 registros; ruído: duplicata (Damaris ×2) e 1 não-pessoa (“Quem vai ser dono do fornecedor?”) |
| Produto | Prospectar sem throttle/threshold de views por conta é frágil |

---

## Linha do tempo (UTC)

| Hora | Evento |
|------|--------|
| 23:19:11 | Primeiro `extractedAt` (Aline Emanuelle) — OCR completo |
| 23:19–23:59 | 3 perfis · ritmo ~1 / 12–20 min · OCR completo |
| 00:01–00:15 | 8 perfis · ~1 / 1–2 min · OCR completo; paywall já no fim do scroll |
| **00:18–00:32** | **16 perfis · ~1 / 35–50 s · extração rasa** — **gatilho principal** |
| 00:28:36 / 00:29:11 | Damaris duplicada (mesmo URL) |
| 00:37–00:42 | 6 perfis · ~1 / min · misto; 1 falso positivo |
| 00:42:48 | Último `extractedAt` (Gilcimar) |

**Janela total:** primeiro `2026-10-21T23:19:11Z` → último `2026-10-22T00:42:48Z` · **~83,6 min** · **33** itens · média ~0,39/min (~1 a cada ~2,5 min).

---

## Detecção / evidência

### 1. Texto explícito no OCR (causa declarada pelo LinkedIn)

Em `rawOcr` de perfis com scroll completo (ex.: Alyson ~00:15, Aline Conceição ~00:13, Alexander ~00:12, Agda, Adriana, Paula, Frederico, Diogo, Bruna…):

- *You've approached your profile **search limit***
- *For unlimited people browsing, upgrade to* (Premium / Sales Navigator / Recruiter)
- *Learn more about why we limit profile searches*

O limite já estava ativo **durante** a sessão (meio do run), não só no último item.

### 2. Cadência por bloco

| Período (UTC) | Qtd | Ritmo | Qualidade típica |
|---------------|----:|-------|------------------|
| 23:19–23:59 | 3 | ~1 / 12–20 min | OCR completo (`rawOcr` grande) |
| 00:01–00:15 | 8 | ~1 / 1–2 min | OCR completo |
| **00:18–00:32** | **16** | **~1 / 35–50 s** | **Só cabeçalho** |
| 00:37–00:42 | 6 | ~1 / 1 min | Misto; 1 falso positivo |

Antes do burst, perfis “ricos” levavam **1–2+ min**. No burst, gaps ~35–40 s — típico de open → volta à lista sem scroll profundo.

### 3. Extração rasa ainda conta como view

No bloco 00:18–00:32 quase só `name` + `location` + `connectionDegree`. Abrir o card/lista sem scroll completo **não evita** o contador comercial de visualização.

### 4. Ruído operacional

- Duplicata Damaris (`00:28:36` e `00:29:11`, mesmo URL)
- Item de newsletter/post tratado como perfil

---

## Causa raiz

**Causa raiz:** estouro / consolidação do **limite comercial LinkedIn de busca e visualização de perfis** (*commercial profile search / people browsing limit*).

**Mecanismo:** acumular views na mesma conta (OCR profundo 23:19–00:15) e em seguida **acelerar** com ~16 opens em ~14 min (~40 s/perfil). O LinkedIn já sinalizava o paywall no OCR; o burst aumentou a taxa de views e tornou o bloqueio operacionalmente visível.

**Não é:** falha de AVD/OCR/proxy como causa primária do texto de limite; o app reportou o quota comercial de forma explícita.

---

## Fatores contribuintes

1. **Sem teto de views por conta/sessão** — script/API seguem abrindo enquanto houver cards.
2. **Sem detecção do paywall** — OCR já trazia *profile search limit*; o fluxo não parou.
3. **Burst raso após sessão profunda** — pior combinação: quota já consumida + ritmo alto.
4. **Duplicatas / não-pessoas** — consomem view sem valor.
5. **Uma conta, um device, um run longo** — ~33 views em ~84 min na mesma identidade.

---

## O que funcionou / o que falhou

| Funcionou | Falhou |
|-----------|--------|
| Persistência de `extractedAt` + `rawOcr` permitiu forense por tempo | Sem circuit-breaker ao detectar paywall |
| OCR capturou a mensagem oficial do LinkedIn | Ritmo sem throttle no bloco 00:18–00:32 |
| Screenshots por card (`…/2026-10-22T00-36-29-630Z/`) | Deduplicação de URL insuficiente |

---

## Ações corretivas (recomendadas)

| # | Ação | Por quê |
|---|------|---------|
| 1 | **Parar** ao OCR conter *profile search limit* / *unlimited people browsing* / *limit profile searches* | Evita gastar quota e tempo após o paywall |
| 2 | **Throttle** por conta: teto de opens/hora e gap mínimo (ex. ≥ 2–3 min entre views profundas; sem burst &lt; 1 min) | Alinha ao padrão humano e ao quota semanal |
| 3 | **Threshold de sessão** — `profiles_extraidos >= N` → pausa / troca de responsabilidade (ver `todo` Screen Robot) | Primeira versão operacional com limites |
| 4 | **Dedup por URL** antes de abrir | Elimina views duplicadas (caso Damaris) |
| 5 | **Filtro de card** — rejeitar não-pessoa (newsletter/post) | Não consumir view em falso positivo |
| 6 | Separar agentes: listar 24/7 vs detalhar com quota | Lista barata; detalhe caro e limitado |

### Antes → depois (operacional)

| Antes | Depois (alvo) |
|-------|----------------|
| Abrir perfis em sequência sem teto | Teto + gap + stop no paywall |
| Burst ~40 s/perfil após OCR profundo | Detalhe só com budget restante; senão só listar |
| Continuar com paywall no OCR | Abort da sessão de detalhe; alerta |

### Rollback / caminho inverso

- Reverter throttle/stop: remover gates no script ou config de limites.
- Conta: aguardar reset do quota LinkedIn (ciclo comercial típico) ou upgrade; não “desbanir” via script.
- Dados da sessão: registros já na API permanecem; filtrar duplicatas/falsos positivos na leitura.

---

## Lições

1. Mensagem de *profile search limit* no OCR **é** o diagnóstico — tratar como hard stop, não como texto de rodapé.
2. Extração rasa **não** é “barata” para o LinkedIn: open = view.
3. Forense por `extractedAt` + qualidade do payload (null vs `rawOcr` cheio) identifica burst melhor que olhar só o total da sessão.
4. Limite comercial ≠ ban permanente; operação precisa de **budget semanal por conta**, não só “até acabar a lista”.

---

## Apêndice — números da sessão

| Métrica | Valor |
|---------|------:|
| Perfis persistidos | 33 |
| Duração | ~83,6 min |
| Média global | ~1 / 2,5 min |
| Pico (00:18–00:32) | 16 em ~14 min (~1 / 40 s) |
| Views após 00:00 | ~25+ |
| Evidência OCR | *You've approached your profile search limit* |

Fonte: payload JSON da API de profiles da sessão (campos `extractedAt`, `rawOcr`, campos de detalhe null no burst).
