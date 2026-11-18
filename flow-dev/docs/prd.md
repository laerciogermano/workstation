# PRD — Flow.dev

| Campo | Valor |
|---|---|
| Produto | **Flow.dev** — Flow IDE (Explorar + Flow) |
| Código | `works/flow-dev` |
| Fonte de visão | [`../README.md`](../README.md) |
| Versão | 1.6 |

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

Com um elemento de função selecionado, as setas **movem a estrutura** (ordem em `U` + `PARS`). A **primeira** condição que bater vale. Layout e conectores leem essa ordem — não DEPS antigos.

### ← esquerda

1. Se existir **irmão sequencial à esquerda** → fica **paralelo** a ele (junta ao passo da esquerda).
2. Senão → vira **irmão esquerdo** do elemento pai.
3. Sem pai elegível → não faz nada.

### → direita

1. Se existir **irmão paralelo** → sai do paralelo e vira **irmão sequencial direito** do grupo.
2. Senão, se existir **irmão sequencial à direita** → **troca de lugar** com ele (passo inteiro, se o da direita for um grupo paralelo).
3. Senão → **não faz nada** (→ **não** vira filho).

### ↑ cima

1. Se existir **irmão sequencial à esquerda** → fica **paralelo** a ele.
2. Senão, se existir **irmão paralelo acima** → **inverte a ordem** com o de cima.
3. Senão → vira **irmão sequencial esquerdo** do elemento pai.
4. Sem alvo elegível → não faz nada.

### ↓ baixo

1. Se existir **irmão paralelo embaixo** → **troca a ordem** e vai para baixo.
2. Senão, se existir **irmão sequencial à direita** → vira o **primeiro filho** desse irmão.
3. Senão, se estiver paralelo com o de cima → vira **irmão sequencial direito** do de cima (sai do paralelo).
4. Senão → vira **irmão sequencial direito** do pai.
5. Sem alvo elegível → não faz nada.

### Aceite

| Tecla | 1ª | 2ª | 3ª / 4ª |
|---|---|---|---|
| ← | paralelo ao sequencial esquerdo | irmão esquerdo do pai | noop |
| → | sequencial direito do paralelo | **troca** com sequencial direito | noop |
| ↑ | paralelo ao sequencial esquerdo | inverte com paralelo de cima | irmão sequencial esquerdo do pai |
| ↓ | troca com paralelo embaixo | seq. direito → **1º filho** | seq. direito do de cima; senão seq. direito do pai |

### Antes → depois

| Antes | Depois |
|---|---|
| → com sequencial à direita virava **1º filho** | → **troca** de lugar com o sequencial à direita |
| ↓ sem ramo “sai do paralelo com o de cima” | ↓: sem paralelo embaixo e sem direita → unParallel |
| setas acumulavam DEPS/PARS inconsistentes | setas só tocam `U` + `PARS`; desenho ignora DEPS velhos |

**Voltar:** em `fnKeyMove` →, ramo `rightG` → `put(..., "first")` (filho); ↓ sem `inPar`/`unPar`.

## Estados `sN` e marcas de dado

| Antes | Depois |
|---|---|
| Eixo rotulado `e0…eN` (estado) | `s0…sN` (*state*) |
| Todo dado sob o eixo = □ | Folha = □ · árvore (`dKids`) = cubo |

**Voltar:** rótulos `e${i}` no SVG do Flow; `fdMark` só com `<rect>`.
