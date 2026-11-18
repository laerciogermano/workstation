# PRD — Flow.dev

| Campo | Valor |
|---|---|
| Produto | **Flow.dev** — Flow IDE (Explorar + Flow) |
| Código | `works/flow-dev` |
| Fonte de visão | [`../README.md`](../README.md) |
| Versão | 1.17 |

## IDR — identificador único

**Requisito:** cada elemento do modelo possui um **ID único (IDR)**. O nome é rótulo e **pode ser igual** ao de outro elemento, desde que o ID seja diferente.

### Escopo do IDR

| Elemento | Obrigatório |
|---|---|
| Função | sim |
| Dado | sim |
| Arquivo | sim |
| Agente (IA / biblioteca) | sim |
| Pessoa | sim |

### Regras

1. Criar elemento → gerar IDR imediatamente; não reutilizar ID de elemento removido no mesmo projeto.
2. Renomear altera só o rótulo; o IDR permanece.
3. Ligações (pai/filho, agente da etapa, entradas/saídas entre nós, export FOP-IR) referenciam **IDR**, não nome.
4. UI pode mostrar nomes duplicados; busca/seleção interna resolve por IDR.
5. Endereço FOP (símbolo no `state` / camada) é contrato de composição — distinto do IDR do elemento; colisão de endereço na mesma camada continua inválida.

### Aceite

- Dois elementos com o mesmo nome e IDs diferentes coexistem sem conflito.
- Trocar o nome de um não quebra referências que usam o IDR.
- Export e protótipo resolvem entidades por ID.

### Antes → depois

| Antes | Depois |
|---|---|
| Identidade implícita pelo nome / título | Identidade explícita por IDR; nome livre |
| Risco de colisão ao reusar rótulos | Colisão de nome permitida |

**Voltar:** tratar nome como chave única (não recomendado; quebra reuso de rótulos).

## Flow — mover / criar só pelos ícones (sem setas)

As setas **não fazem nada** no Flow. Criar, posicionar e editar funções é só pelos ícones (no hover da linha): **editar**, **+ filho** e **irmão abaixo**. Sem atalhos `C`, `⇧C`, `Enter`, `Tab`, `E` nem setas entre telas.

| Antes | Depois |
|---|---|
| ← → ↑ ↓ reordenavam / paralelizavam (`fnKeyMove`) e bugavam depois de muitos movimentos | setas removidas; só ícones de filho e irmão |

**Voltar:** restaurar `fnKeyMove` do commit `be6d180c`.

## Estados `sN` e marcas de dado

| Antes | Depois |
|---|---|
| Eixo rotulado `e0…eN` (estado) | `s0…sN` (*state*) |
| Todo dado sob o eixo = □ | Folha = □ · árvore (`dKids`) = cubo |

**Voltar:** rótulos `e${i}` no SVG do Flow; `fdMark` só com `<rect>`.

## Toolbar Remover + abstrata só borda

| Antes | Depois |
|---|---|
| bar-tools / fl-tools / Explorar: editar · filho · irmão | + **Remover** (`ask-rm` / trash) |
| Função abstrata sem agente (`nag`): borda **tracejada** | borda **sólida**, fill transparente |

**Voltar:** tirar botão `ask-rm` das toolbars; `.sv-fn.nag` / `.fbar.nag` com `stroke-dasharray` / `border-style: dashed`.

## Sanfona Flow + menu perto do cursor

| Antes | Depois |
|---|---|
| Seta `.car` na coluna Nome só visual | `flow-toggle` + `FLOW_CLOSED` esconde filhos na lista e no SVG |
| `bar-tools` fixo em `left: g.x1` | ao entrar no hover: ancora no X do mouse e **fica parado** |

**Voltar:** remover `FLOW_CLOSED` / `flow-toggle`; `setBarHov` sem `clientX`; `::after` com `left: 10px`.

## Estados filhos + painel dado + raiz limpa

| Antes | Depois |
|---|---|
| sN lista só o dado raiz (cubo) | `stExpand`: filhos indentados com □ sob o cubo |
| select Tipo: `Texto · TS string · C char*` | só o nome (`Texto`) |
| Valor texto = `<textarea>` | linha `Tipo e valor` (select + input) |
| — | seed `u24` “Fazer nova função” raiz vazia (sem agente/I/O) |

**Voltar:** foot sem `stExpand`; options com TS/C; textarea de valor; remover `u24`.

## Funções: só pais até abrir

| Antes | Depois |
|---|---|
| Clique na linha da composição toggleava `OPEN` (filhas apareciam ao selecionar) | Clique na linha só seleciona; filhas só com a seta (`toggle`) |
| Flow começava com todas as composições abertas | `FLOW_CLOSED` inicia com todas as composições (só pais na coluna Nome) |

**Voltar:** restaurar toggle de `OPEN` no clique do `data-node`; `FLOW_CLOSED = new Set()`.

## Root = uma visualização · senão sem seta

| Antes | Depois |
|---|---|
| Flow misturava todos os roots do plano no mesmo eixo sN | `flowRoot`: só a árvore do root ativo (`ganttRows`/`flowLayout` filtrados) |
| Senão = path tracejado `fback` no canvas | Sem seta; texto `· senão → …` na linha/pill do `if` |

**Voltar:** `ganttRows`/`flowLayout` sem `rootId`; redesenhar bloco `fback`; remover `setFlowRootFrom`.

## Fluxos de exemplo visíveis

| Antes | Depois |
|---|---|
| `FLOW_CLOSED` iniciava com todas as composições → canvas só com barra-resumo | `FLOW_CLOSED` vazio + `openFlowView(root)` ao trocar root |
| Default sem `flowRoot` (podia cair na raiz vazia) | `DEF.flowRoot = "u9"` (Onboarding) e preferência por root com filhos |

**Voltar:** seed antigo de `FLOW_CLOSED` com todas as composições; `DEF` sem `flowRoot`.

## Toggle do painel de notas (T-xx)

| Antes | Depois |
|---|---|
| Painel direito (T-32…) sempre aberto no player | Toggle **dentro** do painel de notas; fechado = faixa 44px só com ícone no topo · tecla **N** · `localStorage` |

**Voltar:** remover `data-notes`, `notes-off`, `toggleNotes` e atalho `N`.

## Flow UI — pan, tipografia, composição, filhos, dado folha, aresta

| Antes | Depois |
|---|---|
| Pan só no fundo vazio do `zcanvas` | Arrastar textos/elementos também move o mapa (limiar 5px; clique curto mantém ação) |
| Fonte ~10–13px sans no diagrama | Mono ~9px (densidade tipo VS Code) |
| Barra de composição (`fsum` / `sv-sum`) com “pontas” | Retângulo arredondado (`rx`), mesma altura 7px |
| Sem toggle de filhos no menu transversal / bar-tools | `flow-kids` no `vdock` + ícone sanfona em `bar-tools`/`fl-tools` |
| Folha □ podia listar `a, b` no mesmo rótulo | Um nome por □; várias folhas = várias marcas |
| Clique na aresta de sequência sem ação | Menu: seleção (`edge-if`) ou repetição (`edge-loop`) |

**Voltar:** pointerdown antigo (bloqueio em `[data-act]`/`.grow`); fontes anteriores; `::before/::after` do `.fsum` + path das pontas no SVG; remover `flow-kids`/`edge-*`/`dnames` com marca por folha.

## Terminal + Hello World

| Antes | Depois |
|---|---|
| Logs só no painel `mach` / toast | Barra **Terminal** (`TERM`) no rodapé da janela; botão na toolbar |
| `run-plan` só IA pendente | Também roda máquinas com JS puro (`execCode` / `node:console`) |
| — | Plano seed `hello` · pasta Hello World · `Imprimir Hello World` |

**Voltar:** remover `TERM`/`termPanel`/`execCode`/`m6`/`hello`/`u200`/`u201`; `run-plan` só IA.

## Indentação do corpo for / if

| Antes | Depois |
|---|---|
| Linha `for`/`if` e a task no mesmo recuo | Cabeçalho no nível atual; corpo (+ I/O) +16 px (`nestOf`) |

**Voltar:** remover `nestOf` / `NEST` e o padding extra em `leftRow`/`ioLeft`.

## Um dado ou um cubo por porta (entrada/saída)

| Antes | Depois |
|---|---|
| Função com vários `outs`/`ins` → várias marcas na mesma junção | Saída multi: cubo real (`propostas`, `pacote_contrato`); entrada multi: cubo visual `entrada_<fn>` (`SYNTH_IN`) |
| Saídas soltas + entrada multi = 3+ cubos na junção | Absorb: remove outs que batem com os kids e uma linha `entrada · saída` compartilhada (`shared`/`fromIds`) |
| Clique no cubo sintético sem painel | `revealDado` + `dadoPanel` listam os dados reais; export JS/Py usa `propostas`/`pacote_contrato` |

**Voltar:** `newIns = u => u.ins \|\| []`; remover `SYNTH_IN`/`synthIn`/absorb/`shared`; export com `proposta_en`/`contrato` soltos.

## Responsável → Task (ordem e catálogo)

| Antes | Depois |
|---|---|
| Colunas Flow: Nome · Responsável | **Responsável · Task** (nome = task) |
| Título livre em qualquer etapa | Cada item do `CAT` tem `tasks[]` obrigatórias; lib Node = métodos (`node:http` → `get`/`post`/…) |
| — | `taskPick` / `data-task` + `syncTaskTitle` ao trocar responsável |

**Voltar:** grid `minmax(0,1fr) 130px` + header Nome/Responsável; remover `tasks`/`taskPick`/`syncTaskTitle`; títulos em português livre.

## App React (:5180) · mesma regra Responsável → Task

| Antes | Depois |
|---|---|
| FlowView Nome · Responsável | Responsável · Task (`agentTasksOf` / `DEFAULT_LIB_TASKS`) |
| Agentes sem `tasks` no banco | Migration `004_agent_tasks` + seed |

**Voltar:** dropar coluna `tasks`; reverter FlowView/Drawer/CSS; migration down.
