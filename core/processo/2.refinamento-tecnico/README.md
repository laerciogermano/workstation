# Refinamento técnico

Transformar o discovery em plano executável.

## Entradas

- [Documento de epics](../1.discovery/2.epics.md)
- [Documento de cenários](../1.discovery/3.scenarios.md) (estórias → cenários = estado + unidade testável/paralelizável)
- BDDs do [discovery](../1.discovery/4.bdds.md)
- Protótipo validado ([prototype](../1.discovery/5.prototype.md))
- Restrições técnicas e de negócio
- Stack e padrões já adotados no projeto

## Execução

- Desenhar arquitetura, contratos e dados a partir de épicos, estórias e cenários
- Identificar riscos e mitigações
- Consolidar critérios de pronto (aceite por cenário do discovery)
- Estimar esforço e dependências; tratar cada cenário como unidade paralelizável quando não houver dependência
- Quebrar em tarefas priorizadas (preferência: 1 tarefa ↔ 1 cenário)

## Saídas

- Desenho técnico (ou ADR)
- Critérios de pronto
- Backlog priorizado
- Próximo passo: desenvolvimento
