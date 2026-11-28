# Flow Editor — criar e alterar fluxos

**O quê:** lib front-end que edita um fluxo na notação do [flow-oriented-programming.com](https://flow-oriented-programming.com/), desenhado pelo [Flow View](../flow-view/README.md).
**Origem:** atividade “Criar Flow Component” (Plans).

```bash
cd flow-component/flow-editor
npm install
npm run app       # http://localhost:5295/app/
npm run verify    # typecheck + testes + Chrome
```

## Uso

```ts
import { fn, mountFlowEditor } from '@flow/editor';

const handle = mountFlowEditor(document.getElementById('host')!, {
  tree: fn('main'),
  theme: 'dark',
  onChange: (tree) => salvar(tree),
});
handle.destroy();
```

O elemento hospedeiro precisa ter altura. Sem tela, os comandos valem sozinhos:

```ts
import { createEditor, fn, generateCode } from '@flow/editor';

const editor = createEditor(fn('main'));
editor.run({ type: 'insert', target: editor.state.tree.id, where: 'inside', kind: 'fn' }); // { ok: true }
editor.undo();
generateCode(editor.state.tree); // JavaScript
```

## O que dá para fazer

| Conceito do FOP | Como |
|------|------|
| Função, filha, irmã, paralela | **Adicionar**: Dentro, Antes, Depois ou Paralelo |
| Entrada e saída | **+ entrada**, **+ saída**; várias formam o objeto `input_…` / `output_…` |
| Dado (variável) | **+ dado** na função |
| Tipos | abstrato, texto, número, booleano, nulo, função, objeto chaveado e posicional (com campos aninhados) |
| `if`, `else`, `else if`, `switch`, `case` | **Adicionar** e os botões do próprio bloco |
| `for`, `while`, `do-while` | **Adicionar**; item e coleção ou condição no painel |
| `try` / `catch` | **Adicionar** |
| Condição no estado | **Declarar**, quando a variável do bloco ainda não existe |
| Use case, composição | **Dentro**, **Envolver em → uma função**, setas → e ← |
| Responsável | arquivo, pessoa, IA, máquina, objeto, herdado ou abstrato |
| Sólido × abstrato | dado com ou sem valor; função com ou sem responsável |
| Público e privado | **Visibilidade** (pública vira `export`; sem forma própria no desenho) |
| Exemplos | menu **Exemplos do FOP**: 48 pontos de partida editáveis, com as regras de cada um |
| Código | JavaScript gerado ao vivo; JSON para copiar, editar e aplicar |

Organizar: mover, duplicar, envolver, desfazer bloco, remover, desfazer e refazer.

**Atalhos:** `F` função · `Delete` remover · `⌘Z` / `⇧⌘Z` · `Alt ↑↓` mover · duplo clique ou `Enter` no desenho edita o nome.

## Regras garantidas

`else` fica logo depois do `if`, `catch` depois do `try`, `case` só dentro de `switch`; mover ou remover leva o par junto. Antes e Depois não partem um grupo de paralelas. Nomes de dados não se repetem na mesma lista. Comando impossível não altera nada e explica o motivo.

## Camadas

| Arquivo | Papel |
|---|---|
| `src/model.ts` | Árvore editável (funções, blocos, dados) |
| `src/ops.ts` | Comandos puros |
| `src/editor.ts` | Seleção e histórico, sem tela |
| `src/view-tree.ts` | Modelo → entrada do Flow View |
| `src/code.ts` | Fluxo → JavaScript |
| `src/serialize.ts` | JSON com validação |
| `src/ui.ts`, `panel.ts`, `morph.ts`, `styles.ts` | Tela |

No Flow View entraram só acréscimos: `onSelect`, `select`, `reveal`, a linha destacada, o dado declarado (`data`) e a função como dado.

## Limites desta versão

- Expressões de condição são texto livre: não são conferidas.
- O código gerado é de leitura; condições e valores abstratos precisam ser completados para executar. Só há JavaScript.
- Arquivo como objeto e padrões de projeto não têm forma própria no desenho.
- O fluxo é guardado no navegador (no aplicativo de teste), sem servidor.
- Para fluxos muito grandes, cada mudança recalcula tudo.

Não substitui os comandos de [`../src`](../src/) (`@flow/component`), que operam o grafo do Flow IDE.
