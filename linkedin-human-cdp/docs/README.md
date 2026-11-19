# Docs — LinkedIn Human CDP

**Por quê:** índice da esteira a partir da visão.  
**No fluxo:** [`visão`](../README.md) → **este índice** → PRD → …

| Artefato | Status |
|----------|--------|
| Visão | [`../README.md`](../README.md) |
| Código lib | [`../src/`](../src/) (`createLinkedInHumanCdp`) |
| Ops UI (ponte) | [`../../screen-robot/src/lib/cdp/README.md`](../../screen-robot/src/lib/cdp/README.md) |
| PRD | A produzir |

## API (v0.1)

| Export | Papel |
|--------|--------|
| `createLinkedInHumanCdp(opts)` | Cliente com métodos das ops |
| `withLinkedInPage` / `resolveLinkedInPage` | Sessão (Chrome fica up) |
| `humanCdp` | Import lazy de `@screen-robot/human-cdp` |
| `workerOps` | Funções cruas do worker (bridge) |

## Caminho inverso

1. Parar de importar `@works/linkedin-human-cdp`
2. Voltar a `import { … } from 'screen-robot/src/lib/cdp/…'`
3. Remover pasta `linkedin-human-cdp/` se não houver consumidores

## Próximos passos

→ Extrair DOM LinkedIn para dentro desta lib · workers só consomem a fachada · HTTP opcional.
