# PRD — Flow.dev

| Campo | Valor |
|---|---|
| Produto | **Flow.dev** — Flow IDE (Explorar + Flow) |
| Código | `works/flow-dev` |
| Fonte de visão | [`../README.md`](../README.md) |
| Versão | 1.2 |

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

Com um elemento de função selecionado, as setas **movem a estrutura** (não o foco de seleção). Cada direção tem regra própria.

### ← esquerda

1. Se existir **irmão sequencial à esquerda** → fica **paralelo** a ele.
2. Se não existir → vira **irmão esquerdo** do elemento pai.
3. Sem pai elegível → não faz nada.

### → direita

1. Se existir **irmão paralelo** → passa a ser **irmão sequencial direito** desse irmão.
2. Se não existir → **não faz nada**.

### ↑ cima

1. Se existir **irmão sequencial à esquerda** → fica **paralelo** a ele.
2. Se não existir → vira **irmão sequencial esquerdo** do elemento pai.
3. Sem pai elegível → não faz nada.

### ↓ baixo

1. Se existir **irmão paralelo** → **troca a ordem** e vai para **baixo** (fica sequencial abaixo do irmão).
2. Se não existir → **não faz nada**.

### Aceite

| Tecla | Com irmão adequado | Sem irmão adequado |
|---|---|---|
| ← | paralelo ao sequencial esquerdo | irmão esquerdo do pai |
| → | sequencial direito do paralelo | noop |
| ↑ | paralelo ao sequencial esquerdo | irmão sequencial esquerdo do pai |
| ↓ | ordem invertida / abaixo do paralelo | noop |

### Antes → depois

| Antes | Depois |
|---|---|
| ←/↑ e →/↓ simétricos (paralelo ↔ sequência) | quatro direções com regras distintas |
| →/↓ sempre tentavam “voltar à sequência” | → = sequencial direito; ↓ = troca ordem e desce; sem paralelo = noop |

**Voltar:** tratar ←/↑ juntos e →/↓ juntos como no protótipo antigo (`fnKeyMove` simétrico).
