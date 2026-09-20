# Cenários — EP-05 Extrair elementos

**Por quê:** US e cenários (SC) do épico, expostos via **código Node**.  
**Índice:** [`README.md`](README.md) · **BDDs:** [`../4.bdds/EP-05-extrair-elementos.md`](../4.bdds/EP-05-extrair-elementos.md).  
**Épico:** [`../2.epics.md`](../2.epics.md) · **Plano:** [`../implementation-plan/EP-05-extrair-elementos.md`](../implementation-plan/EP-05-extrair-elementos.md).

**US:** US-13..16 · **SC:** SC-17..21.

---

## US-13 — Extrair árvore DOM com textos

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-17 | Extrair textos (fase 1) | Imagem/frame ou dump | Extrair textos; montar árvore | Árvore de componentes contendo os textos |
| SC-18 | Extrair restante e compor árvore completa | Árvore fase 1; imagem/frame ou dump | Extrair ícones, listas e imagens; compor hierarquia | Árvore de componentes completa (todos os tipos) |

## US-14 — Extrair ícones

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-19 | Extrair ícones | Imagem/frame ou dump | Reconhecer ícones; montar árvore | Árvore de componentes contendo os ícones |

## US-15 — Extrair listas

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-20 | Extrair listas | Imagem/frame ou dump | Reconhecer listas e itens; montar árvore | Árvore de componentes contendo as listas |

## US-16 — Extrair imagens

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-21 | Extrair imagens | Imagem/frame ou dump | Reconhecer imagens/fotos; montar árvore | Árvore de componentes contendo as imagens |

## Próximos passos

→ [`../4.bdds/EP-05-extrair-elementos.md`](../4.bdds/EP-05-extrair-elementos.md) · [`../implementation-plan/EP-05-extrair-elementos.md`](../implementation-plan/EP-05-extrair-elementos.md)
