# 006 — Snapshot obrigatório + file picker na galeria

| Campo | Valor |
|-------|--------|
| Número | 006 |
| Data | 2026-11-17 |
| Origem | Chat no Cursor (workstation) |
| Título | Snapshot no create/start + seletor de arquivo |

## Prompt original

```
Mesmo fazendo o backup, ele não, primeiro, sempre tem que ter o backup, no momento da criação já deve ter um snapshot, chame de snapshot ao invés de backup. Quando criar um CDP já tem o snapshot da criação. Aí sempre que, eu iniciar o CDP, ele deve copiar do backup, remover do original e jogar no original o backup. … tá mantendo no histórico, ou seja, tá salvando, não deveria.

Inu. Inu Mids, ali no editar, deve ter o quê? Deve ter... Quando for adicionar uma galeria, deve ter o input pra selecionar o arquivo, pra você escolher.
```

## Interpretação

1. Renomear backup → snapshot; criar snapshot na criação; todo start restaura (para se up; apaga perfil; copia snapshot) — sem manter histórico.
2. Galeria: `<input type="file">` para escolher o vídeo.

## O que foi feito

- `snapshot.mjs`; `createCdp` gera snapshot criação; `startCdp` sempre stop→restore→start
- Galeria: seletor de arquivo + `POST /api/media/upload`
