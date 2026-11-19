# 009 — Controle: rolagem = mesmo evento no CDP

| Campo | Valor |
|-------|--------|
| Número | 009 |
| Data | 2026-11-19 |
| Origem | Chat no Cursor (workstation) |
| Título | Controle: wheel da UI → mouseWheel idêntico no CDP |

## Prompt original

```
Ao controlar o browser, quando eu rolar, deve emitir exatamente o mesmo evento de rolagem pro CDP.
```

## Interpretação

No modal Controlar, `wheel` sobre o print deve ir para o CDP como `Input.dispatchMouseEvent` `mouseWheel` com os mesmos `deltaX`/`deltaY` (em CSS px), após trajetória até o ponto sob o cursor via `human-cdp` `scroll`.

## O que foi feito

- `session.scroll`: aceita `x`/`y`/`dx`/`exact` (um wheel com deltas dados)
- API `POST …/input` `type: scroll|wheel`
- UI: listener `wheel` no stage (coalesce se busy); `deltaMode` linhas/páginas → px

## Antes → depois

Rolagem na UI não fazia nada → espelha deltas no CDP. Rollback: remover handler + `type: scroll` + campos novos de `scroll`.
