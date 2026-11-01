# 015 — Layout do app conforme design system

| Campo | Valor |
|-------|--------|
| Número | 015 |
| Data | 2026-11-01 |
| Origem | Chat no Cursor (workstation) |
| Título | Ajustar layout do app ao DESIGN.md |

## Prompt original

```
ajuste o layout do app de acordo com o odcumento de design system do notas
```

## Interpretação

Alinhar shell/layout de `e-notas/app` a `marca/notinhas.shop.DESIGN.md` (e design-system.md): light shell, wordmark, FAB Nota, larguras, hairlines; gradiente só na apresentação.

## O que foi feito

- Header light + CTA secondary; gradiente só `.apresentacao-hero`
- FAB com label Nota; `--nt-read` 720 / `--nt-data` 1100; cards/tabelas hairline-first
- Docs: `design-system.md` mapeamento atualizado
