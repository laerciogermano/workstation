# BDDs — EP-06 Sessão

**Por quê:** aceite Gherkin das US/SC do épico (fonte: [`../4.scenarios.md#ep-06--sessao`](../4.scenarios.md#ep-06--sessao)).  
**Índice:** [`README.md`](README.md) · **Plano:** [`../implementation-plan/EP-06-sessao.md`](../implementation-plan/EP-06-sessao.md).

**US:** US-17..19 · **SC:** SC-22..24.

Cada bloco: Dado / Quando / Então alinhado a Entradas / Execução / Saídas.

---

## US-17 — Salvar sessão

```gherkin
Cenário: US-17 Sessão é gravada em disco
  Dado estado em memória e path da sessão
  Quando a serialização grava o arquivo
  Então o arquivo de sessão existe
```

### SC-22 — Salvar sessão

```gherkin
Cenário: SC-22 Sessão é gravada
  Dado estado em memória e path da sessão
  Quando a serialização grava o arquivo
  Então o arquivo de sessão existe
```

## US-18 — Remover sessão

```gherkin
Cenário: US-18 Sessão é removida
  Dado um path de sessão
  Quando a remoção da sessão é executada
  Então o arquivo de sessão não existe
  E o runtime não mantém o contexto daquela sessão
```

### SC-23 — Remover sessão

```gherkin
Cenário: SC-23 Sessão é removida do disco
  Dado um path de sessão
  Quando o arquivo de sessão é apagado
  Então o arquivo de sessão não existe
  E o runtime não mantém o contexto daquela sessão
```

## US-19 — Recuperar sessão

```gherkin
Cenário: US-19 Sessão é recuperada
  Dado um arquivo de sessão existente
  Quando a leitura reaplica o contexto
  Então o runtime possui o estado restaurado
```

### SC-24 — Recuperar sessão

```gherkin
Cenário: SC-24 Sessão é recuperada
  Dado um arquivo de sessão existente
  Quando a leitura reaplica o contexto
  Então o runtime possui o estado restaurado
```

---


## Próximos passos

→ [`../implementation-plan/EP-06-sessao.md`](../implementation-plan/EP-06-sessao.md)
