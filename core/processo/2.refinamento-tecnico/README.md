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
- **No final:** criar a pasta `tasks/` do projeto com uma atividade documentada para **cada task** do Gantt (pasta = `task-<nn>-<titulo>`)

## Saídas

- Desenho técnico (ou ADR)
- Critérios de pronto
- Backlog priorizado
- Pasta `tasks/` no projeto — pastas `task-<nn>-<titulo>` (hierarquia do Gantt); cada uma com **Entradas · Execução · Saídas** e documentação
- Próximo passo: desenvolvimento

## Pasta `tasks/` (obrigatória ao fechar o refinamento)

Pastas no padrão **`task-<nn>-<titulo>`** (kebab-case), alinhado ao Gantt [`7.tasks.md`](../1.discovery/7.tasks.md) — **não** usar `EP-` / `US-` / `SC-` no nome da pasta. Origem (EP/US/SC) fica só no README da atividade.

```text
tasks/
├── README.md
└── task-001-provisionar-agente/
    ├── README.md
    ├── task-002-subir-e-conectar/
    ├── task-003-serial-adb-online/
    └── task-004-boot-completo/
```

| Parte | Regra | Exemplo |
|-------|--------|---------|
| Prefixo | `task-` | `task-` |
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
