# AGENTS.md — plans/app

Leia antes: [README](README.md), [plano](../docs/plano-implementacao.md) e [decisões](docs/ADRs.md).

## Comandos

```bash
npm install && npm run verify
npm run dev            # hub + front
npm run client:build   # bin/plans-client
npm run e2e
```

## Regras

- Só `apps/web/src/folder` toca nos arquivos do projeto; só `apps/client/internal/exec` cria processos.
- Mudou mensagem ou cifra: altere TypeScript **e** Go, rode `npm run vectors` e os testes dos dois.
- Nenhum dado do projeto fica no navegador nem no hub.
- Toda entrada externa é validada (Zod no front e no hub; no client, `policy.Normalize`).
- Comando nunca passa por shell sem pedido explícito; nada executa sem liberação local.
- Código e chaves em inglês; telas e mensagens em português.
