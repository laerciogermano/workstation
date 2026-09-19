# US-13 — Extrair elementos e guardar sessão

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Elementos tipados + árvore DOM a partir da tela; persistir/restaurar sessão.

Extrai elementos tipados **a partir de uma imagem**/frame/dump da tela (textos via OCR, ícones, imagens/fotos, listas, containers), monta a **árvore de componentes** (estilo DOM) e **persiste/restaura** o contexto da sessão.

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Imagem da tela (screenshot/frame) ou dump; contexto (device, apps, etapa, paths) | OCR e reconhecimento de elementos; compor hierarquia; persistir/restaurar sessão | Elementos tipados + árvore DOM; sessão em disco / contexto restaurado |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-17 | Persistir sessão em arquivo | Estado em memória, path da sessão | Serializar e gravar | Arquivo de sessão |
| SC-18 | Restaurar sessão do arquivo | Arquivo de sessão existente | Ler e reaplicar contexto | Estado restaurado no runtime |

## BDD

```gherkin
Funcionalidade: US-13 Extrair elementos e guardar sessão
  Cenário: Elementos tipados, árvore DOM e sessão
    Dado uma imagem da tela (screenshot/frame) ou dump
    E contexto atual (device, apps, etapa, paths)
    Quando OCR e reconhecimento extraem elementos tipados
    E a hierarquia raiz → filhos (árvore DOM) é composta
    E persistir e/ou restaurar sessão é executado
    Então elementos tipados existem com string/tipo, bounds e metadados
    E a árvore DOM navegável é devolvida
    E a sessão está em disco ou o contexto foi restaurado
```

### SC-17 Persistir sessão em arquivo

```gherkin
Cenário: SC-17 Sessão é gravada
  Dado estado em memória e path da sessão
  Quando a serialização grava o arquivo
  Então o arquivo de sessão existe
```

### SC-18 Restaurar sessão do arquivo

```gherkin
Cenário: SC-18 Sessão é restaurada
  Dado um arquivo de sessão existente
  Quando a leitura reaplica o contexto
  Então o runtime possui o estado restaurado
```
