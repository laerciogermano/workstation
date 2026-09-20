# Testes

Validar que o software faz o combinado.

## Entradas

- Código entregue pelo desenvolvimento
- Cenários de aceite do [documento de BDD](../1.discovery/5.bdds.md) (fonte: [`4.scenarios.md`](../1.discovery/4.scenarios.md))
- Ambiente de teste configurado
- Casos de regressão conhecidos

## Execução

- **SC** → unitários; **US** / **EP** → BDD e2e (mesmo critério do [desenvolvimento](../3.desenvolvimento/README.md#tipo-de-teste-por-origem))
- Validar cada cenário de aceite conforme o tipo (SC isolado; US/EP integrado)
- Rodar regressão
- Verificar qualidade (performance, segurança, acessibilidade quando aplicável)
- Registrar e priorizar defeitos

## Saídas

- Evidência de aceite (aprovado / rejeitado)
- Bugs priorizados
- Relatório de cobertura / resultados
- Próximo passo: implantação (se aprovado)
