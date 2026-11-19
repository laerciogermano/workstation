# Flow Language — Editor visual

É o **Flow IDE** (cópia do protótipo em [`../../flow-dev/prototipo/`](../../flow-dev/prototipo/)) aberto direto na tela **Flow**, em tela cheia, com um painel **Código** que acompanha o desenho em tempo real. Mesma interface, mesmas ações, mesmo canvas SVG (s0…sN, barras, dados □/■, if, for).

**Abrir:** `open editor/index.html` (sem build, sem servidor). Na abertura o Flow já vem ajustado à tela (mesmo zoom do ícone **Ajustar à tela**), com o fluxo no topo.

## Como usar

- **Novo fluxo:** `+` ao lado de Arquivos no Explorar (ou menu de contexto).
- **Filho / Irmão / Editar:** toolbar acima da barra selecionada e ícones no Explorar (mesmos do Flow IDE).
- **Responsável, task, entradas e saídas:** colunas do Flow e painel de detalhe.
- **Seleção (if) e repetição (for):** toolbar flutuante do canvas.
- **Código ao vivo:** painel à direita em **JavaScript**; copiar e baixar. Mostra se o contexto está completo. Recolhe/expande pelo ícone `panel-right` (atalho **N**), no mesmo padrão das notas do protótipo Flow IDE; preferência em `localStorage` (`flow-lang-code`).

## Diferenças para o Flow IDE

Removidos para focar na linguagem: galeria/notas do protótipo, barra Fluxos/Novo fluxo/Exportar, botão Executar e Terminal. Mantidos: Explorar, Flow, dados, estados, responsáveis; código JS no painel.

Os dados são em memória (recarregar volta ao Hello World).
