# US-14 — Salvar sessão

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Persiste o contexto da sessão em arquivo.

Serializa o estado em memória (device, apps, etapa, paths, etc.) e grava no path da sessão.

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Estado em memória, path da sessão | Serializar e gravar | Arquivo de sessão |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-18 | Salvar sessão em arquivo | Estado em memória, path da sessão | Serializar e gravar | Arquivo de sessão |

## BDD

```gherkin
Funcionalidade: US-14 Salvar sessão
  Cenário: Sessão é gravada em disco
    Dado estado em memória e path da sessão
    Quando a serialização grava o arquivo
    Então o arquivo de sessão existe
```

### SC-18 Salvar sessão em arquivo

```gherkin
Cenário: SC-18 Sessão é gravada
  Dado estado em memória e path da sessão
  Quando a serialização grava o arquivo
  Então o arquivo de sessão existe
```
