# US-13 — Extrair elementos

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Extrai elementos tipados a partir da tela e monta a árvore DOM.

A partir de uma imagem/frame ou dump, reconhece textos (OCR), ícones, imagens/fotos, listas e containers e compõe a hierarquia raiz → filhos (estilo DOM).

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Imagem da tela (screenshot/frame) ou dump | OCR e reconhecimento de elementos; compor hierarquia | Elementos tipados + árvore DOM navegável |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-17 | Extrair elementos tipados e árvore DOM | Imagem/frame ou dump | OCR + reconhecimento; compor hierarquia | Elementos tipados + árvore DOM |

## BDD

```gherkin
Funcionalidade: US-13 Extrair elementos
  Cenário: Elementos tipados e árvore DOM
    Dado uma imagem da tela (screenshot/frame) ou dump
    Quando OCR e reconhecimento extraem elementos tipados
    E a hierarquia raiz → filhos (árvore DOM) é composta
    Então elementos tipados existem com string/tipo, bounds e metadados
    E a árvore DOM navegável é devolvida
```

### SC-17 Extrair elementos tipados e árvore DOM

```gherkin
Cenário: SC-17 Elementos tipados e árvore DOM
  Dado uma imagem da tela (screenshot/frame) ou dump
  Quando OCR e reconhecimento extraem elementos tipados
  E a hierarquia raiz → filhos é composta
  Então elementos tipados existem com string/tipo, bounds e metadados
  E a árvore DOM navegável é devolvida
```
