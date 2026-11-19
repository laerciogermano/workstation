# PRD — Flow Component

| Campo | Valor |
|---|---|
| Produto | **Flow Component** — lib front-end de operações no grafo Flow |
| Código | `works/flow-component` |
| Status | rascunho v0.1 (2026-11-19) |
| Relacionados | [`flow-language`](../../flow-language/README.md) · [`flow-dev`](../../flow-dev/README.md) · [`flow`](../../flow/README.md) |

---

## 1. Definição (o quê)

**Flow Component** é uma **biblioteca front-end** que expõe **interfaces de operação** sobre o modelo visual Flow: criar função, criar entrada, criar saída, criar filho, criar irmão — e demais comandos equivalentes.

Cada comando é uma **opção de operar**: a lib define o contrato e o efeito; o consumidor (editor, IDE, app) decide **se** e **quando** aplica.

## 2. Problema

Hoje as operações de edição do fluxo (função, I/O, composição filho/irmão) ficam **embutidas** em editores concretos (`flow-language/editor`, Flow.dev). Não há superfície reutilizável de API/UI para:

- o mesmo conjunto de comandos em mais de um host;
- testar operações sem acoplar ao canvas inteiro;
- trocar a camada visual sem reescrever a semântica das operações.

## 3. Objetivo

Entregar uma lib com:

1. **Interfaces** tipadas das operações do grafo.
2. **Comandos** invocáveis (API) com efeito documentado no modelo.
3. **Opção de operar** — host pode registrar, habilitar/desabilitar ou só observar, sem fork da semântica.

## 4. Personas

| Persona | Job |
|---------|-----|
| **Autor do editor** | Consome a lib no canvas (Flow Language, Flow.dev, Plans) |
| **Autor de host** | Liga UI própria aos mesmos comandos |
| **Testador** | Invoca operações sem subir o IDE completo |

## 5. Capacidades-alvo (must / should)

### 5.1 Operações de criação — *must*

| Operação | Efeito |
|----------|--------|
| **Criar função** | Insere função no modelo (IDR, rótulo, posição/contexto conforme contrato) |
| **Criar entrada** | Adiciona porta de entrada à função alvo |
| **Criar saída** | Adiciona porta de saída à função alvo |
| **Criar filho** | Cria função filha sob o pai (composição) |
| **Criar irmão** | Cria função irmã (mesmo nível / sequência) |

### 5.2 Superfície de comando — *must*

- Cada operação é um **comando** com nome estável, payload e resultado (sucesso / erro tipado).
- Comandos são **opcionais de operar**: o host pode:
  - expor na UI;
  - chamar só via API;
  - desabilitar sem remover o contrato.
- Sem side-effect fora do modelo Flow acordado (sem navegar browser, sem persistência própria obrigatória).

### 5.3 Contrato de modelo — *must*

- Operações referenciam elementos por **IDR** (alinhado ao PRD Flow.dev), não só por nome.
- Entrada/saída e pai/filho usam as mesmas regras de composição FOP (camada, endereço).

### 5.4 Empacotamento — *should*

- Pacote consumível por apps front (ESM).
- Tipos TypeScript públicos das interfaces e comandos.
- Zero dependência obrigatória de um canvas específico.

### 5.5 UI de comando — *should* (v0.2+)

- Componentes opcionais (botões/menus) que disparam os comandos — host pode usar só a API.

## 6. Não-objetivos (v0.1)

- Persistência / sync de projeto
- Exportação JS/Python (fica em Flow Language / Flow.dev)
- Board, Gantt, Explorar, responsáveis
- Runtime de execução de agentes
- Paridade visual completa com o editor atual

## 7. Critérios de sucesso (MVP)

1. Host cria função, entrada, saída, filho e irmão **só** via interfaces da lib.
2. Desabilitar um comando na UI não remove o contrato da API.
3. Dois hosts distintos podem consumir o mesmo pacote sem fork da semântica.
4. Operações resolvem alvo por IDR; renomear não quebra referências.

## 8. Relação no ecossistema

```text
FOP → Flow Language (linguagem/editor)
         ↓ consome
    Flow Component (interfaces + comandos de operação)
         ↑ consome
    Flow.dev / Plans / outros hosts
```

## 9. Antes → depois

| Antes | Depois |
|-------|--------|
| Operações só no código do editor | Contrato reutilizável na lib |
| Host reimplementa criar filho/irmão | Mesmos comandos, UI opcional |

**Voltar:** operações só no host (sem pacote `flow-component`).

## 10. Próximos passos

1. Fechar contratos TypeScript das 5 operações *must*.
2. Spike de consumo no [`flow-language/editor`](../../flow-language/editor/README.md).
3. Pacote ESM + README de uso.
