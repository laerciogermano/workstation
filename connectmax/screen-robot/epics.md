# Épicos — screen-robot

**Por quê:** fatia entregável do robô (capacidades Node → US).  
**Visão:** [`README.md`](README.md).  
**US / cenários:** [`scenarios.md`](scenarios.md). **BDDs:** [`bdds.md`](bdds.md).  
**Árvore / Gantt:** [`tasks.md`](tasks.md).

**IDs:** **EP-** = épico · **US-** = história ([`scenarios.md`](scenarios.md)).

---

## EP-01 — Provisionar agente

Sobe/conecta o Android e deixa o device pronto para ADB.

| US | Título |
|----|--------|
| US-01 | Provisionar um agente (SC-01..03) |

---

## EP-02 — Eventos de UI

Sinais que o código espera antes de instalar, operar ou extrair.

| US | Título |
|----|--------|
| US-02 | Evento de boot |
| US-03 | Evento de app aberta |
| US-04 | Evento de tela estável |
| US-05 | Evento de mudança de dump |

---

## EP-03 — Instalar APKs

Baixa (versão na config) e instala pacotes no agent.

| US | Título |
|----|--------|
| US-06 | Instalar APKs (SC-08..10) |

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

---

## EP-05 — Extrair elementos

Lê a tela como elementos tipados e árvore DOM.

| US | Título |
|----|--------|
| US-13 | Extrair elementos (SC-17) |

---

## EP-06 — Sessão

Persiste e restaura estado do robô em disco.

| US | Título |
|----|--------|
| US-14 | Salvar sessão |
| US-15 | Remover sessão |
| US-16 | Recuperar sessão |

---

## Próximos passos

→ Implementar em [`sources/android-control`](sources/android-control/README.md)  
→ Aceite: [`bdds.md`](bdds.md)
