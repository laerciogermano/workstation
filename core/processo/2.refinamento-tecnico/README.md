# Refinamento técnico

Transformar o discovery em plano executável.

## Entradas

- [Documento de epics](../1.discovery/2.epics.md)
- [Documento de cenários](../1.discovery/4.scenarios.md) (estórias → cenários = estado + unidade testável/paralelizável)
- BDDs do [discovery](../1.discovery/5.bdds.md)
- Protótipo validado ([prototype](../1.discovery/6.prototype.md))
- Restrições técnicas e de negócio
- Stack e padrões já adotados no projeto

## Execução

- Desenhar arquitetura, contratos e dados a partir de épicos, estórias e cenários
- Identificar riscos e mitigações
- Consolidar critérios de pronto (aceite por cenário do discovery)
- Estimar esforço e dependências; tratar cada cenário como unidade paralelizável quando não houver dependência
- Quebrar em tarefas priorizadas (preferência: 1 tarefa ↔ 1 cenário)
- **Plano de implementação** por épico (ex.: `implementation-plan/EP-….md`): sequências · agentes · contratos · classes · modelos · BDDs — **como utilizar** (exemplos de chamadas) — e **árvore de arquivos** do que o épico cria/altera
- **No final:** criar a pasta `tasks/` do projeto com uma atividade documentada para **cada task** do Gantt (pasta = `TSK-<nn>-<titulo>`)

## Saídas

- Desenho técnico (ou ADR)
- Planos de implementação (com **Como utilizar** + **árvore de arquivos** por épico)
- Critérios de pronto
- Backlog priorizado
- Pasta `tasks/` no projeto — pastas `TSK-<nn>-<titulo>` (hierarquia do Gantt); cada uma com **Entradas · Execução · Saídas** e documentação
- Próximo passo: desenvolvimento

## Plano de implementação (por épico)

Cada plano (ex. `implementation-plan/EP-01-….md`) deve incluir sequências / contratos / classes / BDDs e, obrigatoriamente:

### Como utilizar

Seção **`## Como utilizar`** com **exemplos de chamadas** dos métodos públicos do épico (imports + snippets). Quem for implementar ou consumir a API deve conseguir copiar o exemplo sem caçar o contrato no meio do plano.

Conteúdo mínimo:

- Import(s) do módulo / handle
- Uma chamada típica por método público do épico
- Retorno esperado em comentário curto quando não for óbvio
- Pré-condição breve se houver (ex.: “após `provisionEmulator`”)

Exemplo de forma:

````markdown
## Como utilizar

```js
import { provisionEmulator } from "./lib/provision.js";

const handle = await provisionEmulator({
  provision: { name: "agent-a", kind: "avd" },
});
// → { serial, kind, bootCompleted: true, … }
```
````

Colocar a seção cedo no plano (após **Escopo** / antes dos diagramas longos). Atualizar os exemplos quando a API pública mudar.

### Árvore de arquivos

Seção **Árvore de arquivos** mostrando pastas e arquivos que o épico introduz ou altera (código, testes colocados ao lado do módulo, configs).

Exemplo de forma:

```text
src/
├── lib/
│   ├── provision.js
│   ├── start-runtime.js
│   ├── start-runtime.test.js
│   ├── ensure-adb-online.js
│   ├── ensure-adb-online.test.js
│   ├── wait-boot-completed.js
│   └── wait-boot-completed.test.js
└── test/
    └── bdd/
        ├── ep-01-provisionar-agente.test.js
        └── us-01-agent-fica-pronto-para-adb.test.js
```

Regras:

- Mostrar só o recorte relevante ao épico (não o monorepo inteiro)
- Unitários **ao lado** do arquivo que testam (`módulo.test.js` na mesma pasta)
- BDD e2e (US/EP) sob a pasta de e2e do projeto (ex. `test/bdd/`)
- Atualizar a árvore quando o desenho mudar no refinamento

## Pasta `tasks/` (obrigatória ao fechar o refinamento)

Pastas no padrão **`TSK-<nn>-<titulo>`** (kebab-case), alinhado ao Gantt [`7.tasks.md`](../1.discovery/7.tasks.md) — **não** usar `EP-` / `US-` / `SC-` no nome da pasta. Origem (EP/US/SC) fica só no README da atividade.

```text
tasks/
├── README.md
└── TSK-001-provisionar-agente/
    ├── README.md
    ├── TSK-002-subir-e-conectar/
    ├── TSK-003-serial-adb-online/
    └── TSK-004-boot-completo/
```

| Parte | Regra | Exemplo |
|-------|--------|---------|
| Prefixo | `TSK-` | `TSK-` |
| `<nn>` | número da task no Gantt (zero-pad 2+ dígitos) | `001` |
| `<titulo>` | kebab-case do nome da atividade | `subir-e-conectar` |

Hierarquia = árvore/Gantt das tasks (pai → filhas). Cada `README.md` documenta:

| Seção | Conteúdo |
|-------|----------|
| Entradas | Pré-condições, artefatos e dependências |
| Execução | O que fazer (passos / critérios técnicos) |
| Saídas | Resultado observável / aceite |
| Documentação | Links a scenarios, BDDs, implementation-plan (e código, se houver); IDs EP/US/SC/TSK como metadado |

Lote: primeiro um épico completo (suas tasks); validar o formato; só então escalar aos demais.
