# Cenários — EP-04 Operar tela

**Por quê:** US e cenários (SC) do épico, expostos via **código Node**.  
**Índice:** [`README.md`](README.md) · **BDDs:** [`../5.bdds/EP-04-operar-tela.md`](../5.bdds/EP-04-operar-tela.md).  
**Épico:** [`../2.epics.md`](../2.epics.md) · **Plano:** [`../implementation-plan/EP-04-operar-tela.md`](../implementation-plan/EP-04-operar-tela.md).

**US:** US-07..12 · **SC:** SC-11..16.

---

## US-07 — Abrir aplicativo

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-11 | App é aberta no agent | Package (e activity opcional) | Launch do app no agent | App em foreground |

## US-08 — tap

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-12 | Toque na tela | Coordenadas x,y ou bounds do elemento | Tap no alvo | UI refletindo o toque |

## US-09 — type

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-13 | Texto é digitado | Texto, campo focado ou coords | Type injeta o texto | Texto na UI |

## US-10 — scroll

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-14 | Conteúdo é rolado | Direção, distância ou bounds da área | Scroll/swipe | Conteúdo rolado; novos itens visíveis |

## US-11 — screenshot

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-15 | Print da tela é salvo | Serial, path de saída | Capturar screenshot | Arquivo de imagem no path |

## US-12 — Resgatar coordenadas x,y a partir de uma imagem

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-16 | Coordenadas a partir de imagem template | Imagem template, frame/tela atual | Match por visão/template | Coordenadas x,y (e confiança) |

## Próximos passos

→ [`../5.bdds/EP-04-operar-tela.md`](../5.bdds/EP-04-operar-tela.md) · [`../implementation-plan/EP-04-operar-tela.md`](../implementation-plan/EP-04-operar-tela.md)
