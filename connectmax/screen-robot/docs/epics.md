# Épicos — screen-robot

**Por quê:** fatia entregável do robô (capacidades Node → US).  
**Visão:** [`../README.md`](../README.md).  
**US / cenários:** [`scenarios.md`](scenarios.md). **BDD:** [`bdd-nos.md`](bdd-nos.md).  
**Árvore / Gantt:** [`tasks.md`](tasks.md).  
**Aceite piloto:** [`bdd-linkedin-login.md`](bdd-linkedin-login.md).

**IDs:** **EP-** = épico · **US-** = história ([`scenarios.md`](scenarios.md)).

---

## Índice

| ID | Épico | US | Entrega |
|----|-------|-----|---------|
| [EP-01](#ep-01--provisionar-agente) | Provisionar agente | US-01 | Agent ADB online e boot ok |
| [EP-02](#ep-02--eventos-de-ui) | Eventos de UI | US-02..05 | Boot, app aberta, tela estável, dump mudou |
| [EP-03](#ep-03--instalar-apks) | Instalar APKs | US-06 | Apps na versão da config |
| [EP-04](#ep-04--operar-tela) | Operar tela | US-07..12 | Abrir, tap, type, scroll, screenshot, coords por imagem |
| [EP-05](#ep-05--extrair-elementos) | Extrair elementos | US-13 | Elementos tipados + árvore DOM |
| [EP-06](#ep-06--sessão) | Sessão | US-14..16 | Salvar, remover e recuperar sessão |

Esforço (minutos IA, de [`tasks.md`](tasks.md)): **408 min** no total.

---

## Fases entregáveis

Cada fase fecha um incremento usável em Node. Dependências são estritas: a fase N assume as anteriores disponíveis via API.

| Fase | Nome | Épicos | Critério de pronto | Min |
|------|------|--------|--------------------|-----|
| **F1** | Device pronto | EP-01 | `provisionAgent()` deixa serial online e boot completo | 60 |
| **F2** | Apps no device | EP-03 | APKs da config baixados e instalados na versão pedida | 45 |
| **F3** | Observar UI | EP-02 | Listeners: boot, app foreground, tela estável, mudança de dump | 48 |
| **F4** | Atuar na tela | EP-04 | Abrir app + tap/type/scroll/screenshot + coords por template | 90 |
| **F5** | Ler a tela | EP-05 | Extração tipada (textos, ícones, imagens, listas, containers) + árvore | 120 |
| **F6** | Sessão + piloto | EP-06 | Persistência de sessão + [`bdd-linkedin-login.md`](bdd-linkedin-login.md) verde | 45 + aceite |

```text
F1 Device ──► F2 APKs ──► F3 Eventos ──► F4 Operar ──► F5 Extrair ──► F6 Sessão + piloto
```

**Piloto (F6):** `npm run linkedin-login` exercita o pipeline US-01 → US-16 (ver mapeamento em [`bdd-linkedin-login.md`](bdd-linkedin-login.md)).

### O que cada fase desbloqueia

| Fase | Desbloqueia |
|------|-------------|
| F1 | Qualquer script que precise de device vivo |
| F2 | Fluxos com apps na versão certa (ex. Instagram + LinkedIn) |
| F3 | Esperas confiáveis antes de gesto/extração (sem race na UI) |
| F4 | Automações de gesto e evidência visual |
| F5 | Decisão por estrutura de tela (ex. achar “Entrar”) |
| F6 | Retomada de estado e aceite do cenário LinkedIn |

---

## EP-01 — Provisionar agente

Sobe/conecta o Android e deixa o device pronto para ADB.

| US | Título |
|----|--------|
| US-01 | Provisionar um agente (SC-01..03) |

**Fase:** F1 · **Min:** 60

---

## EP-02 — Eventos de UI

Sinais que o código espera antes de instalar, operar ou extrair.

| US | Título |
|----|--------|
| US-02 | Evento de boot |
| US-03 | Evento de app aberta |
| US-04 | Evento de tela estável |
| US-05 | Evento de mudança de dump |

**Fase:** F3 · **Min:** 48

---

## EP-03 — Instalar APKs

Baixa (versão na config) e instala pacotes no agent.

| US | Título |
|----|--------|
| US-06 | Instalar APKs (SC-08..10) |

**Fase:** F2 · **Min:** 45

---

## EP-04 — Operar tela

Gestos, captura e localização visual.

| US | Título |
|----|--------|
| US-07 | Abrir aplicativo |
| US-08 | tap |
| US-09 | type |
| US-10 | scroll |
| US-11 | screenshot |
| US-12 | Resgatar coordenadas x,y a partir de uma imagem |

**Fase:** F4 · **Min:** 90

---

## EP-05 — Extrair elementos

Lê a tela como elementos tipados e árvore DOM.

| US | Título |
|----|--------|
| US-13 | Extrair elementos (SC-17) |

**Fase:** F5 · **Min:** 120

---

## EP-06 — Sessão

Persiste e restaura estado do robô em disco.

| US | Título |
|----|--------|
| US-14 | Salvar sessão |
| US-15 | Remover sessão |
| US-16 | Recuperar sessão |

**Fase:** F6 · **Min:** 45

---

## Fora de escopo (v1)

- Domínio LinkedIn / prospecção — [`../../linkedin-agent/`](../../linkedin-agent/README.md) · [`../../vendas/`](../../vendas/README.md)
- Bypass de autenticação ou scraping fora do uso legítimo do device

## Próximos passos

→ Implementar por fase em [`../sources/android-control`](../sources/android-control/README.md)  
→ Aceite F6: [`bdd-linkedin-login.md`](bdd-linkedin-login.md)
