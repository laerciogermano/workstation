# Copiar Markdown do card

Botão no topo do card (árvore, Kanban e card aberto) copia o MD completo (`serializeActivity` = conteúdo de `activities/<id>.md`).

- Árvore/Kanban: ícone na barra `.tools` (hover)
- Card aberto: **Copiar** no header (usa rascunho da descrição se houver)
- Arquivos: `CopyMdButton.tsx`, `Icon.tsx` (`copy`), `Tree.tsx`, `Kanban.tsx`, `NodePanel.tsx`, `styles.css`, `README.md`
- Verificado: `npm run verify`
