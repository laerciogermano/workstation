# Refinamento técnico

Transformar o discovery em plano executável.

## Entradas

- [Documento de cenários](../discovery/scenarios.md) (épicos → estórias → cenários = estado + unidade testável/paralelizável)
- BDDs do [discovery](../discovery/bdd.md)
- Protótipo validado ([prototype](../discovery/prototype.md))
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
