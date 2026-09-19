# Testes

Validar que o software faz o combinado.

## Entradas

- Código entregue pelo desenvolvimento
- Cenários de aceite do [documento de BDD](../discovery/bdds.md) (fonte: [`scenarios.md`](../discovery/scenarios.md))
- Ambiente de teste configurado
- Casos de regressão conhecidos

## Execução

- Executar unitários, integração e E2E (conforme risco)
- Validar cada cenário de aceite como unidade (mudança de estado; em paralelo quando independente)
- Rodar regressão
- Verificar qualidade (performance, segurança, acessibilidade quando aplicável)
- Registrar e priorizar defeitos

## Saídas

- Evidência de aceite (aprovado / rejeitado)
- Bugs priorizados
- Relatório de cobertura / resultados
- Próximo passo: implantação (se aprovado)
