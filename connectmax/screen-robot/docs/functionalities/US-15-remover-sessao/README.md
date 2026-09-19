# US-15 — Remover sessão

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Remove a sessão persistida em disco (e limpa o contexto em memória quando couber).

Apaga o arquivo de sessão no path configurado e deixa o runtime sem aquele contexto salvo.

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Path da sessão (arquivo existente ou ausente) | Apagar arquivo / limpar contexto | Sessão removida (arquivo inexistente; runtime sem sessão) |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-19 | Remover sessão do disco | Path da sessão | Apagar arquivo de sessão | Arquivo inexistente; contexto limpo |

## BDD

```gherkin
Funcionalidade: US-15 Remover sessão
  Cenário: Sessão é removida
    Dado um path de sessão
    Quando a remoção da sessão é executada
    Então o arquivo de sessão não existe
    E o runtime não mantém o contexto daquela sessão
```

### SC-19 Remover sessão do disco

```gherkin
Cenário: SC-19 Sessão é removida do disco
  Dado um path de sessão
  Quando o arquivo de sessão é apagado
  Então o arquivo de sessão não existe
```
