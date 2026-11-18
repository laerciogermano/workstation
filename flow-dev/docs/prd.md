# PRD — Flow.dev

| Campo | Valor |
|---|---|
| Produto | **Flow.dev** — Flow IDE (Explorar + Flow) |
| Código | `works/flow-dev` |
| Fonte de visão | [`../README.md`](../README.md) |
| Versão | 1.4 |

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

## Teclado — setas no Flow (reordenar / paralelizar)

Com um elemento de função selecionado, as setas **movem a estrutura** (não o foco de seleção). Cada direção tem regra própria; a primeira condição que bater vale.

### ← esquerda

1. Se existir **irmão sequencial à esquerda** → fica **paralelo** a ele.
2. Senão → vira **irmão esquerdo** do elemento pai.
3. Sem pai elegível → não faz nada.

### → direita

1. Se existir **irmão paralelo** → passa a ser **irmão sequencial direito** desse irmão.
2. Senão, se existir **irmão sequencial à direita** → **troca de lugar** com ele.
3. Senão → **não faz nada**.

### ↑ cima

1. Se existir **irmão sequencial à esquerda** → fica **paralelo** a ele.
2. Senão, se existir **irmão paralelo** → **inverte a ordem** com o de cima.
3. Senão → vira **irmão sequencial esquerdo** do elemento pai.
4. Sem alvo elegível → não faz nada.

### ↓ baixo

1. Se existir **irmão paralelo embaixo** → **troca a ordem** e vai para baixo.
2. Senão, se existir **irmão sequencial à direita** → vira o **primeiro filho** desse irmão.
3. Senão, se estiver paralelo com o de cima → vira **irmão sequencial direito** do de cima.
4. Senão (sem irmão sequencial à direita) → vira **irmão sequencial direito** do pai.
5. Sem alvo elegível → não faz nada.

### Aceite

| Tecla | 1ª | 2ª | 3ª / 4ª |
|---|---|---|---|
| ← | paralelo ao sequencial esquerdo | irmão esquerdo do pai | noop |
| → | sequencial direito do paralelo | troca com sequencial direito | noop |
| ↑ | paralelo ao sequencial esquerdo | inverte com paralelo de cima | irmão sequencial esquerdo do pai |
| ↓ | troca com paralelo embaixo | seq. direito → 1º filho | seq. direito do de cima; senão seq. direito do pai |

### Antes → depois

| Antes | Depois |
|---|---|
| ↓: unParallel com o de cima antes de seq. direito → filho | ↓: seq. direito → 1º filho **antes** do unParallel |
| ↓ com sequencial à direita entrava como **último** filho | entra como **primeiro** filho (antes do 1º filho existente) |
| → troca com sequencial direito só reordenava a lista | troca também a sequência (DEPS/PARS): o Flow mostra a ordem nova |
| ←/↑ paralelo juntava só u ao grupo do irmão | une os dois grupos de paralelo (ninguém perde o par ao sair) |

**Voltar:** em `fnKeyMove` ↓, testar `parLeft`/`unParallel` antes de `seqRight`→`child`.
