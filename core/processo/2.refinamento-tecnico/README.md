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
- **No final:** criar a pasta `tasks/` do projeto com uma atividade documentada para **cada EP**, **cada US** e **cada SC**

## Saídas

- Desenho técnico (ou ADR)
- Critérios de pronto
- Backlog priorizado
- Pasta `tasks/` no projeto — hierarquia EP → US → SC; cada atividade com **Entradas · Execução · Saídas** e documentação (links a scenarios, BDDs, plano)
- Próximo passo: desenvolvimento

## Pasta `tasks/` (obrigatória ao fechar o refinamento)

```text
tasks/
├── README.md
└── EP-NN-<slug>/
    ├── README.md                 # atividade do épico
    └── US-NN-<slug>/
        ├── README.md             # atividade da estória
        └── SC-NN-<slug>/
            └── README.md         # atividade do cenário
```

Cada `README.md` de atividade documenta:

| Seção | Conteúdo |
|-------|----------|
| Entradas | Pré-condições, artefatos e dependências |
| Execução | O que fazer (passos / critérios técnicos) |
| Saídas | Resultado observável / aceite |
| Documentação | Links a scenarios, BDDs, implementation-plan (e código, se houver) |

Lote: primeiro um épico completo; validar o formato; só então escalar aos demais.
