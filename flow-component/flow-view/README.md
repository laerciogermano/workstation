# Flow View — desenho de um fluxo a partir de uma árvore

**O quê:** lib front-end que recebe uma árvore e desenha o fluxo na notação do [flow-oriented-programming.com](https://flow-oriented-programming.com/).
**Regras:** só leitura (as ações são navegar e minimizar) · testes automatizados · desempenho, preparada para carregamento sob demanda.
**Origem:** atividade “Criar Flow View” (Plans). Não substitui a vista interativa de [`../src/view`](../src/view/), que opera por comandos.

```bash
cd flow-component/flow-view
npm install
npm run demo          # http://localhost:5290/example/ (casos reais, conceitos e fluxo grande)
npm run verify        # typecheck + testes + Chrome
```

## Uso

```ts
import { mountFlow } from '@flow/view';

const view = mountFlow(document.getElementById('host')!, {
  name: 'main',
  children: [
    { name: 'receber', out: ['pedido'] },
    { name: 'cobrar', in: ['pedido'], out: ['pagamento'], source: { kind: 'machine', name: 'node' } },
    { type: 'if', label: 'pago', children: [{ name: 'enviar', in: ['pagamento'] }] },
    { type: 'else', children: [{ name: 'avisar' }] },
  ],
});
view.update(outraArvore);
view.destroy();
```

O elemento hospedeiro precisa ter altura. Para a mesma fonte do site (IBM Plex), carregue também `@flow/view/fonts.css` (gerado no `npm run build`; sem pedidos a terceiros). Sem ela, vale a monoespaçada do sistema; troque com as variáveis CSS `--flow-font` (desenho) e `--flow-ui-font` (botões).

## Navegação

| Ação | Como |
|------|------|
| Zoom (10% a 300%) | Rolar sobre o desenho (ou pinça), mantendo o ponto sob o cursor; botões **−** e **+**; teclas `+` e `-` |
| Voltar a 100% | Botão com a porcentagem |
| Ver tudo | **Ajustar à tela** ou tecla `0` (em fluxo enorme para em 10%, no começo) |
| Mover | Arrastar; setas, PageUp, PageDown, Home e End |

## Minimizar

| Ação | Como |
|------|------|
| Uma função ou bloco | Seta ao lado do nome (clique, ou Enter e espaço com foco); mostra `+N` com o que ficou escondido |
| Todas | Botão **Minimizar tudo**: a raiz fica aberta e o resto fechado |
| Voltar | Botão **Expandir tudo** |

A linha minimizada continua cobrindo os mesmos passos, e o estado não muda. No código: `view.toggle(linha)`, `view.collapseAll()`, `view.expandAll()`; `collapsible: false` desliga. Para manter o que está minimizado quando `update` recebe objetos novos, dê um `id` aos nós.

Abaixo de 40% a vista mostra só barras, blocos e guias. No código: `view.zoomTo(1.5)`, `view.fit()`, `view.panTo(x, y)`; `controls: false` esconde os botões.

Seleção (usada pelo [Flow Editor](../flow-editor/README.md)): `onSelect` avisa o clique numa linha, `view.select(linha)` destaca e `view.reveal(linha)` rola até ela.

 Sem navegador: `renderSvg(layoutFlow(tree))` devolve o SVG completo (ou só uma janela, com `view`).

## Árvore de entrada

| Nó | Campos |
|----|--------|
| Função | `name`, `in`, `out`, `source`, `parallel`, `children` |
| Bloco | `type` (`if`, `else`, `switch`, `case`, `for`, `while`, `do-while`, `try`, `catch`), `label`, `parallel`, `children` |

- **Dado:** `'pedido'` ou `{ name: 'valor', value: 21 }`. Com `function: true`, é uma função usada como dado.
- **`data`:** dados declarados na função; entram no estado quando ela começa.
- **Objeto:** `{ name: 'parcelas', fields: ['dobro', 'triplo'] }`. Ao lado da barra aparece só o nome; os campos ficam como filhos no estado, cada um com seu valor. Várias entradas (ou saídas) sem nome formam o objeto `input_<função>` (ou `output_<função>`).
- **`source`:** `{ kind: 'file' | 'person' | 'ai' | 'machine' | 'object', name }`. Ausente = o arquivo mais próximo acima (na raiz, o nome dela); `null` = função abstrata.
- Uma árvore só com `name` e `children` já vale: vira um fluxo sequencial.
- Árvore inválida (sem nome, tipo desconhecido, `else` sem `if`, `catch` sem `try`, ciclo) lança `FlowError` com o caminho do nó.

## Regras do Flow aplicadas

| Conceito | No desenho |
|----------|------------|
| Só a folha ocupa um passo | Barra em pílula entre `sN` e `sN+1` |
| Caso de uso (função com filhas) | Barra com pontas, cobrindo o tempo das filhas |
| Sequencial · paralelo | Passos consecutivos · mesmo passo; o seguinte espera a paralela mais longa |
| `if`/`else` · `switch` · `try`/`catch` | Mesmo passo · casos em paralelo · `catch` depois do `try` |
| Bloco | Faixa colorida com rótulo, marca e guia vertical |
| Dado | Quadrado no limite do passo; cheio se sólido, vazado se abstrato |
| Objeto | Um cubo com o nome; os campos recuados abaixo dele no estado |
| Função como dado | Círculo |
| Sólida · abstrata | Barra preenchida · só contorno, origem “abstrato” |
| Estado | Lista abaixo de cada passo: o novo em destaque, o anterior apagado |

## Desempenho

- **Cálculo:** uma passada, sem recursão (aguenta árvore muito funda).
- **Desenho:** só linhas, passos e estado visíveis; cabeçalho e colunas fixos. O custo depende do tamanho da tela e do zoom.
- **Medido** no Chrome deste Mac com 20 mil funções (30 mil linhas, 15 mil passos), nos zooms de 10%, 40% e 100%: acompanha o ritmo da tela. `npm run test:browser` mostra os números.

## Carregamento sob demanda (ainda não feito)

O desenho já pede só o intervalo visível. Para carregar a árvore aos poucos faltam:

1. Um nó poder declarar quantas linhas e passos ocupa sem trazer os filhos.
2. Um carregador chamado quando esse nó entrar na janela.
3. Recalcular só o trecho afetado (hoje `update` recalcula tudo).

## Limites desta versão

- “Arquivo como objeto”, público e privado e padrões de projeto não têm forma própria.
- Sem busca nem edição (fora do escopo).
- Largura do passo fixa; nomes longos são cortados, com o nome completo na dica.
- O estado lista todas as funções em cada passo, como no site; em fluxos enormes use `state: false`.

## Voltar atrás

Apagar `flow-component/flow-view/` e a linha dele no [README](../README.md).
