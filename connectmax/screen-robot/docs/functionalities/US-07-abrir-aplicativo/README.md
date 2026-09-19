# US-07 — Abrir aplicativo

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Launch de package/activity no agent.

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Package (e activity opcional) | Launch do app no agent | App em foreground |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-11 | App é aberta no agent | Package (e activity opcional) | Launch do app no agent | App em foreground |

## BDD

```gherkin
Funcionalidade: US-07 Abrir aplicativo
  Cenário: App fica em foreground no agent
    Dado package (e activity opcional)
    Quando o launch do app é executado no agent
    Então a app está em foreground
```

### SC-11 App é aberta no agent

```gherkin
Cenário: SC-11 App é aberta no agent
  Dado package (e activity opcional)
  Quando launch é executado
  Então a app está em foreground
```

