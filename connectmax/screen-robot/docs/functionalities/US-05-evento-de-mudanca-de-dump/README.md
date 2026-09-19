# US-05 — Evento de mudança de dump

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Detecta mudança no dump de UI (uiautomator).

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Dump anterior (opcional), serial | Detectar mudança no dump de UI | Dump atualizado disponível |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-07 | Dump de UI muda | Dump anterior (ou ausência), serial online | Detectar mudança no dump (uiautomator) | Dump atualizado disponível |

## BDD

```gherkin
Funcionalidade: US-05 Evento de mudança de dump
  Cenário: Dump atualizado fica disponível
    Dado um dump anterior (opcional) e serial online
    Quando o sistema detecta mudança no dump de UI
    Então um dump atualizado está disponível
```

### SC-07 Dump de UI muda

```gherkin
Cenário: SC-07 Dump de UI muda
  Dado um dump anterior (ou ausência) e serial online
  Quando a hierarquia UI (uiautomator dump) muda em relação ao anterior
  Então um dump atualizado está disponível
```

