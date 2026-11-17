# Configurações para a IA — Flow.dev

**Por quê:** não reintroduzir Board/Gantt/pessoas nem sair do Node na v1.  
**Importante:** o produto é **só Explorar + Flow**; agentes = **IA** e **bibliotecas Node.js**.

## Regras

1. Protótipo navegável: contrato [`.cursor/rules/prototipo-player-navegar.mdc`](../../.cursor/rules/prototipo-player-navegar.mdc) (`.player.open { display: grid }`, grid `stage` em foco/mobile).
2. Não adicionar visões do Plans (Board, Gantt, Fluxograma, Árvore, Estados, Metas, Copiloto) sem pedido explícito.
3. Bibliotecas = módulos Node (`node:fs`, `node:http`, …) — não inventar runtime Python/Go na v1.
4. Tema Gantt alinhado a [`../inputs/gantt-sample.png`](../inputs/gantt-sample.png).
5. Docs do caminho inverso: atualizar README/deploy no mesmo commit da mudança.
6. **IDR:** função, dado, arquivo, agente e pessoa têm ID único; nome pode repetir; referências usam ID ([`../docs/prd.md`](../docs/prd.md)).

## Fontes

- Visão: [`../README.md`](../README.md)
- Teoria: [`../../aulas/README.md`](../../aulas/README.md)
- Origem UI: [`../../plans/prototipo/`](../../plans/prototipo/)
