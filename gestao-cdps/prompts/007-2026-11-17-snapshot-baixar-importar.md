# 007 — Snapshot: baixar e importar

| Campo | Valor |
|-------|--------|
| Número | 007 |
| Data | 2026-11-17 |
| Origem | Chat no Cursor (workstation) |
| Título | Baixar / importar snapshot |

## Prompt original

```
adicone uma opcao para baixar o snapshot e importar
```

## Interpretação

Na UI de snapshots (editar CDP): baixar o snapshot como arquivo e importar de volta (outro CDP/máquina).

## O que foi feito

- `packSnapshotStream` / `importSnapshot` (`.tar.gz`)
- `GET …/snapshots/:sid/download` · `POST …/snapshots/import`
- UI: **Baixar** por item · **Importar…** (file picker)
