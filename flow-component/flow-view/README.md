# Flow View — desenho de um fluxo a partir de uma árvore

**O quê:** lib front-end que recebe uma árvore e desenha o fluxo na notação do [flow-oriented-programming.com](https://flow-oriented-programming.com/).
**Regras:** a biblioteca só desenha (as ações dela são navegar e minimizar; quem quiser editar usa os avisos de ponteiro) · testes automatizados · desempenho, preparada para carregamento sob demanda.
**Origem:** atividade “Criar Flow View” (Plans). Não substitui a vista interativa de [`../src/view`](../src/view/), que opera por comandos.

```bash
cd flow-component/flow-view
npm install
npm run demo          # http://localhost:5290/example/?ex=checkout
npm run verify        # typecheck + testes + Chrome
```

## Página de demonstração

Segue a estrutura, as funções e os textos do editor FOP ([`../example/flow-novo.html`](../example/flow-novo.html)), com as cores do Flow View: topo, **Explorer** (os exemplos como arquivos e as funções do aberto; clicar leva até a linha), barra de ferramentas, cartão do fluxo e legenda. Textos em inglês; os nomes dentro dos exemplos são o conteúdo deles.

| Ação | Como |
|------|------|
| Opções | Passar o mouse numa linha, barra, faixa ou dado do estado: adicionar filha ou irmã, envolver em `if`, `for` ou `try`, paralelo, sair do bloco, incluir ou tirar do bloco, declarar dado, remover |
| Dado | Clicar na marca, no nome ou no item do estado: nome, tipo, valor e campos de objeto. Trocar o nome onde o dado nasce troca todos os usos. “+” cria a entrada ou saída que falta |
| Nome · condição · responsável | Clicar no nome (edita no lugar) · na faixa ou no texto do bloco · na coluna SOURCE |
| Tamanho do bloco | Arrastar a ponta da faixa |
| Desfazer · refazer | Botões, `Ctrl+Z` e `Ctrl+Shift+Z` |
| Vista | Nome dentro ou ao lado da barra; estados com tudo que existe ou só o novo; `Ctrl+B` esconde o Explorer |

As mudanças de cada exemplo ficam no navegador (menos as do fluxo grande); o botão de restaurar volta ao original e pede confirmação. As operações são as do [Flow Editor](../flow-editor/README.md) (`example/edit-core.ts`). Ficaram de fora executar o fluxo e o terminal.

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
| Zoom (20% a 250%, passos de 15%) | Rolar sobre o desenho (ou pinça), mantendo o ponto sob o cursor; botões **−** e **+**; teclas `+` e `-` |
| Ajustar à tela | **Fit to screen** ou tecla `0`: tudo à vista, sem passar de 100%, centralizado |
| Mover | Clicar e puxar em qualquer lugar (ou com o botão do meio); setas, PageUp, PageDown, Home e End; no toque, um dedo move e dois fazem a pinça |

Como no editor FOP, **nada fica fixo**: tabela, cabeçalho, plano e estados andam e ampliam juntos, e o desenho anda livre.

## Minimizar

| Ação | Como |
|------|------|
| Uma função ou bloco | Seta ao lado do nome (clique, ou Enter e espaço com foco); mostra `+N` com o que ficou escondido |
| Todas | Botão **Collapse all**: a raiz fica aberta e o resto fechado |
| Voltar | Botão **Expand all** |

A linha minimizada continua cobrindo os mesmos passos. Os estados de dentro dela somem: fica o que alguma linha à vista produz, recebe ou declara. No código: `view.toggle(linha)`, `view.collapseAll()`, `view.expandAll()`; `collapsible: false` desliga. Para manter o que está minimizado quando `update` recebe objetos novos, dê um `id` aos nós.

Em fluxos com mais de 500 linhas, abaixo de 40% a vista mostra só barras, blocos e marcas. No código: `view.zoomTo(1.5)`, `view.fit()`, `view.panTo(x, y)`; `controls: false` esconde os botões.

## Opções do desenho

| Opção | Efeito (padrão em primeiro) |
|-------|--------|
| `names` | `inside`: nome dentro da barra, o passo cresce até caber · `outside`: a função vira um círculo, com o nome ao lado |
| `states` | `all`: cada passo mostra tudo que já existe · `new`: só o que chega nele |
| `stateFunctions` | `false` · `true`: lista também as funções do fluxo no estado |
| `card` | `false` · `true`: moldura com o arquivo e a função, centralizada quando sobra largura |
| `autoFit` | `false` · `true`: ajusta à tela até alguém mexer no zoom ou na posição |
| `editable` | `false` · `true`: marcas “+” de entrada e saída e a alça dos blocos |
| `onHover`, `onActivate`, `onResize` | avisam o alvo sob o ponteiro, o clique nele e a alça arrastada; a edição é de quem hospeda |
| `onDraw` | avisa zoom e o que dá para minimizar, para botões de fora |
| `elseParallel` | `false`: o `else` vem depois do `if` · `true`: mesmo passo |

Seleção (usada pelo [Flow Editor](../flow-editor/README.md)): `onSelect` avisa o clique numa linha, `view.select(linha)` destaca e `view.reveal(linha)` rola até ela.

 Sem navegador: `renderSvg(layoutFlow(tree))` devolve o SVG completo (ou só uma janela, com `view`).

## Árvore de entrada

| Nó | Campos |
|----|--------|
| Função | `name`, `in`, `out`, `source`, `visibility`, `pattern`, `parallel`, `children` |
| Bloco | `type` (`if`, `else`, `switch`, `case`, `for`, `while`, `do-while`, `try`, `catch`), `label`, `parallel`, `children` |

- **Dado:** `'pedido'` ou `{ name: 'valor', value: 21 }`. Com `function: true`, é uma função usada como dado.
- **`data`:** dados declarados na função; entram no estado quando ela começa.
- **Objeto:** `{ name: 'parcelas', fields: ['dobro', 'triplo'] }`. Ao lado da barra aparece só o nome; os campos ficam como filhos no estado, cada um com seu valor. Várias entradas (ou saídas) sem nome formam o objeto `input_<função>` (ou `output_<função>`).
- **`source`:** `{ kind: 'file' | 'person' | 'ai' | 'machine' | 'object', name }`. Ausente = o arquivo mais próximo acima (na raiz, o nome dela); `null` = função abstrata. Em `file`, `asObject: true` desenha o arquivo como objeto.
- Uma árvore só com `name` e `children` já vale: vira um fluxo sequencial.
- Árvore inválida (sem nome, tipo desconhecido, `else` sem `if`, `catch` sem `try`, ciclo) lança `FlowError` com o caminho do nó.

## Regras do Flow aplicadas

| Conceito | No desenho |
|----------|------------|
| Só a folha ocupa um passo | Barra em pílula entre `sN` e `sN+1` |
| Caso de uso (função com filhas) | Barra com pontas, cobrindo o tempo das filhas |
| Sequencial · paralelo | Passos consecutivos · mesmo passo, com `∥`; o seguinte espera a paralela mais longa |
| `if`/`else` · `try`/`catch` | `else` e `catch` depois do bloco; um bloco aninhado logo no começo deles entra um passo depois |
| `switch` | Casos no mesmo passo |
| Bloco | Faixa colorida com rótulo e marca; barra vertical na coluna em que começa, sobre as linhas de dentro (como no site) |
| Dado entre vizinhas | Linha da saída de uma folha até a entrada da folha do passo seguinte |
| Dado | Quadrado no limite do passo; cheio se sólido, vazado se abstrato |
| Objeto | Um cubo com o nome; os campos recuados abaixo dele no estado |
| Função como dado | Círculo |
| Sólida · abstrata | Barra preenchida · só contorno, origem “abstract” |
| Estado | Lista de dados abaixo de cada passo: o novo em destaque, o anterior apagado |
| Pública · privada (`visibility`) | Seta que sai da caixa · cadeado, ao lado do nome |
| Arquivo como objeto (`asObject`) | Cubo na origem; no estado, uma caixa com as funções e os dados declarados nele |
| Factory · singleton (`pattern`) | Cubo no fim da barra · contorno duplo na barra e no dado de saída |

As três últimas linhas são formas deste projeto: o site não define um desenho para elas.

## Desempenho

- **Cálculo:** uma passada, sem recursão (aguenta árvore muito funda).
- **Desenho:** só linhas, passos e estado visíveis; nada fica fixo. O custo depende do tamanho da tela e do zoom.
- **Medido** no Chrome deste Mac com 20 mil funções (30 mil linhas, 15 mil passos), nos zooms de 20%, 40% e 100%: acompanha o ritmo da tela. `npm run test:browser` mostra os números.

## Carregamento sob demanda (ainda não feito)

O desenho já pede só o intervalo visível. Para carregar a árvore aos poucos faltam:

1. Um nó poder declarar quantas linhas e passos ocupa sem trazer os filhos.
2. Um carregador chamado quando esse nó entrar na janela.
3. Recalcular só o trecho afetado (hoje `update` recalcula tudo).

## Limites desta versão

- Na visão de longe de um fluxo grande, as marcas de visibilidade e de padrão não aparecem.
- Sem busca. A biblioteca não edita: a edição da demonstração fica na página.
- O passo tem a mesma largura no fluxo todo, até 400 px; nomes maiores são cortados, com o nome completo na dica.
- O estado lista todos os dados em cada passo; em fluxos enormes use `states: 'new'` ou `state: false`.

## Voltar atrás

Apagar `flow-component/flow-view/` e a linha dele no [README](../README.md).
