# Testes

Validar que o software faz o combinado.

## Entradas

- Código entregue pelo desenvolvimento
- Cenários de aceite do [documento de BDD](../1.discovery/5.bdds.md) (fonte: [`4.scenarios.md`](../1.discovery/4.scenarios.md))
- Ambiente de teste configurado
- Casos de regressão conhecidos

## Execução

- **SC** → não testados como cenário; **unitários dos componentes** com deps **mock/stub** (sem app inteira); **US** / **EP** → BDD e2e ([desenvolvimento](../3.desenvolvimento/README.md#tipo-de-teste-por-origem) · [unitários isolados](../3.desenvolvimento/README.md#unitários-isolados))
- Validar aceite US/EP integrado; componentes via unitário isolado
- Rodar regressão
- Verificar qualidade (performance, segurança, acessibilidade quando aplicável)
- Registrar e priorizar defeitos

## Saídas

- Evidência de aceite (aprovado / rejeitado)
- Bugs priorizados
- Relatório de cobertura / resultados
- Próximo passo: implantação (se aprovado)
