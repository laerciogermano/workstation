# 003 — UI: lista com status + editar na entrada

| Campo | Valor |
|-------|--------|
| Número | 003 |
| Data | 2026-11-17 |
| Origem | Chat no Cursor (workstation) |
| Título | UI lista com status e CRUD em :18770 |

## Prompt original

```
Atualize no projeto. É tem que ter uma ge stão completa. http://127.0.0.1:18770/ \

Eu quero entrar já mostrar toda a lista, e eu quero... poder ter a opção de editar, ver se tá, se tá, subiu ou não, se tá, enfim.
```

## Interpretação

A UI em `http://127.0.0.1:18770/` deve abrir já na **lista completa de CDPs**, com **status** (up/down) e opções de **editar** (e gestão: criar/remover/executar/parar).

## O que foi feito

- `human-cdp/camera-ui`: lista na home; status; criar/editar/remover; start/stop; câmera no editar.
- API: `POST/PATCH/DELETE /api/cdps`, `POST …/start|stop`.
- Visão `gestao-cdps` aponta o console v1 nessa URL.
