# US-16 — Recuperar sessão

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Recupera o contexto da sessão a partir do arquivo em disco.

Lê o arquivo de sessão e reaplica o estado no runtime (device, apps, etapa, paths, etc.).

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Arquivo de sessão existente | Ler e reaplicar contexto | Estado restaurado no runtime |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-20 | Recuperar sessão do arquivo | Arquivo de sessão existente | Ler e reaplicar contexto | Estado restaurado no runtime |

## BDD

```gherkin
Funcionalidade: US-16 Recuperar sessão
  Cenário: Sessão é recuperada
    Dado um arquivo de sessão existente
    Quando a leitura reaplica o contexto
    Então o runtime possui o estado restaurado
```

### SC-20 Recuperar sessão do arquivo

```gherkin
Cenário: SC-20 Sessão é recuperada
  Dado um arquivo de sessão existente
  Quando a leitura reaplica o contexto
  Então o runtime possui o estado restaurado
```
