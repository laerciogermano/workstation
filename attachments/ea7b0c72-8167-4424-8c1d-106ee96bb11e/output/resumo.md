# Filtrar cards por status

**Filtro por status pronto na árvore e no Kanban.** Em **Status**, marque To do (inclui cartões sem status), Doing ou Done; soma com o filtro por responsável, que agora vale também na árvore. Na árvore ficam os cartões que casam e os pais deles (apagados); no Kanban, a coluna de um status não marcado avisa **Fora do filtro de status**.

Verificado: `npm run verify` (lint, typecheck, testes TypeScript e Go) e roteiro no Chrome headless na pasta de demonstração. Não verificado: `npm run e2e` e arrastar com o mouse numa árvore filtrada (só teste unitário).

Arquivos em `plans/app/`: `apps/web/src/features/{filters.ts,FilterBar.tsx,Tree.tsx,Kanban.tsx,dnd.ts}`, `apps/web/src/store/app.ts`, `apps/web/src/ui/styles.css`, `apps/web/test/status-filter.test.ts`, `README.md`.
