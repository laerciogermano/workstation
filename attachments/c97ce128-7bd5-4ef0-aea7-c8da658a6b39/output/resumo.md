# Filtrar por responsável — entrega

## O que mudou
- No **Kanban**, uma barra **Responsável** acima do quadro: um botão por item de `assignees.json` (pessoa, IA, máquina), **Sem responsável** e, se houver, ids fora do catálogo.
- Dá para marcar vários (vale qualquer um deles). Nenhum marcado mostra tudo; **Limpar filtros** desmarca.
- As contagens das colunas seguem o filtro. Um pai não vira cartão por causa do filtro.
- O filtro fica só na memória: não grava em arquivo e some ao recarregar a página ou trocar de pasta.
- Nesta entrega a barra está no Kanban. Árvore e filtro por status são da atividade “Filtrar cards”, sobre a mesma base.

## Arquivos (em `plans/app`)
- `apps/web/src/features/filters.ts` (novo): estado e regra, puros e extensíveis.
- `apps/web/src/features/FilterBar.tsx` (novo): a barra.
- `apps/web/src/store/app.ts`: `filters`, `setFilters`, `clearFilters`.
- `apps/web/src/features/Kanban.tsx`: aplica o filtro e mostra a barra.
- `apps/web/src/ui/styles.css`: estilos da barra.
- `apps/web/test/filters.test.ts` (novo) e `README.md`.

## Verificação
- Lint, typecheck, testes TypeScript e `test:client` (Go): passaram.
- Chrome headless em `?demo=filtro-resp` (perfil novo, sem dados reais): cada tipo de responsável, vários ao mesmo tempo, limpar, teclado, arrastar e mudar status com filtro, reatribuir no cartão aberto, recarregar, tema preto, 600 px de largura, sem erros no console.
- Não executado: `npm run e2e`; Safari, Firefox ou Edge.

Imagens: `filtro-responsavel-kanban.png`, `filtro-responsavel-tema-preto.png`, `filtro-responsavel-tela-estreita.png`.
