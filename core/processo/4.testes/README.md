# Testes

Validar que o software faz o combinado.

## Entradas

- Código entregue pelo desenvolvimento
- Cenários de aceite do [documento de BDD](../1.discovery/5.bdds.md) (fonte: [`4.scenarios.md`](../1.discovery/4.scenarios.md))
- Ambiente de teste configurado
- Casos de regressão conhecidos

## Execução

- **SC** → não testados como cenário; **unitários** com **mock/stub**; **US** / **EP** → BDD e2e **sem** mock/stub, app inteira ([desenvolvimento](../3.desenvolvimento/README.md#tipo-de-teste-por-origem) · [unitários](../3.desenvolvimento/README.md#unitários-isolados) · [e2e](../3.desenvolvimento/README.md#bdd-e2e-sem-doubles))
- Validar aceite US/EP no sistema real; componentes via unitário isolado
- Rodar regressão
- Verificar qualidade (performance, segurança, acessibilidade quando aplicável)
- Registrar e priorizar defeitos

## Saídas

- Evidência de aceite (aprovado / rejeitado)
- Bugs priorizados
- Relatório de cobertura / resultados
- Próximo passo: implantação (se aprovado)
