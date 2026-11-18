# PRD — Flow.dev

| Campo | Valor |
|---|---|
| Produto | **Flow.dev** — Flow IDE (Explorar + Flow) |
| Código | `works/flow-dev` |
| Fonte de visão | [`../README.md`](../README.md) |
| Versão | 1.9 |

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

As setas **não fazem nada** no Flow. Criar e posicionar funções é só pelos ícones da linha selecionada: **+ filho** e **irmão abaixo** (atalhos que continuam: `C` irmão, `⇧C` filho, `Enter`/`Tab`, `E` editar).

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
