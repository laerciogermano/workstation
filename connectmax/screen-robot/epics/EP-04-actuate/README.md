# EP-04 — Actuate

| Campo | Valor |
|-------|--------|
| ID | EP-04 |
| Status | Todo |
| Projeto | [screen-robot](../../README.md) |

## Intenção

Executar **`Action`** no device (tap, swipe, type, scroll) via `Actuate` **por agent** (padrão único neste momento), com calibração frame ↔ coordenadas.

## Premissa

**Neste momento todos os devices são agents.** Não há US de ADB nem de troca de backend no Actuate.

## Funcionalidades maiores

- **Atuação no device** via agent
- **Orquestração de listas** (scroll até achar)

## Histórias

| ID | História | Descrição | Por quê | Esforço IA | Pasta |
|----|----------|-----------|---------|------------|-------|
| US-01 | Executar gestos via agent | Executar tap/swipe/type via agent com contrato `Actuate.run(Action)` | Sem gesto no device a Action não altera a tela; agent é o único actuator agora | 102m | [`US-01-executar-gestos-via-agent/`](US-01-executar-gestos-via-agent/README.md) |
| US-02 | Rolar lista até achar alvo | Swipe via agent + re-perceive até o alvo entrar na viewport | Itens fora da viewport são inacessíveis sem scroll | 36m | [`US-02-rolar-lista-ate-achar-alvo/`](US-02-rolar-lista-ate-achar-alvo/README.md) |
| US-03 | Calibrar resolução frame ↔ actuator | Mapear center do frame para coords do agent | Clique erra se PNG e device tiverem resoluções diferentes | 30m | [`US-03-calibrar-resolucao/`](US-03-calibrar-resolucao/README.md) |

## Critério de pronto

- Tap/swipe/type estáveis via agent.
- Scroll e calibração cobertos pelos cenários das US.

## Dependências

- Paralelo com: [EP-01 Capture](../EP-01-capture/README.md)
- Consumido por: [EP-03 Decide](../EP-03-decide/README.md)
