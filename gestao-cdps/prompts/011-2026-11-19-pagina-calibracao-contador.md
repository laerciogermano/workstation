# 011 — Página de calibração com contador

| Campo | Valor |
|-------|--------|
| Número | 011 |
| Data | 2026-11-19 |
| Origem | Chat no Cursor (workstation) |
| Título | Página simples com contador para calibrar visão |

## Prompt original

```
crie uma pagina simples onde tem um contador pra eu testar em quanto em quanto tempo esta aparecendo e ver se esta calibrado
```

## Interpretação

Página local com contador/relógio ms para abrir no CDP e comparar o salto nos prints do Controlar vs o intervalo configurado.

## O que foi feito

- `camera-ui/calib.html` + rota `/calib`
- Botão **Calibração** no Controlar
- Docs

## Antes → depois

Sem página de teste → `/calib` + botão. Rollback: remover `calib.html`, rota e botão.
