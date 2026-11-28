# Copiar árvore (pais + cartão)

Botão **Copiar** passa a incluir a cadeia de pais (raiz → nó), cada um no formato `activities/<id>.md`.

- `activityAncestry` + `serializeActivityWithAncestors` em `packages/domain/src/tree.ts`
- `CopyMdButton.tsx` usa a nova serialização (rascunho da descrição no cartão aberto)
- Doc: `plans/app/README.md` (antes → depois + rollback: `serializeActivity`)
- Verificado: `npm run verify`
