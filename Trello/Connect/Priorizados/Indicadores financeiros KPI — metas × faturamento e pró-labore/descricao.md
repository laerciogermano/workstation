## Objetivo
Criar **indicadores financeiros (KPI)** que mostrem as **metas** da unidade em função do **faturamento** e do **pró-labore** permitido/realizado — leitura rápida da saúde e do gap até a meta.

## Contexto
Já existe o card de ajustar valores e pró-labore conforme o faturamento ([MIgyuCRt](https://trello.com/c/MIgyuCRt)). Falta o painel de KPIs: meta de faturamento, break-even (~R$ 112k/mês), pró-labore máximo da faixa vs. retirado, e quanto falta para subir de faixa. Sem isso, a regra não vira acompanhamento mensal.

Relacionado: dashboard executivo de faturamento ([DwkWgoK2](https://trello.com/c/DwkWgoK2)) como fonte de faturamento.

## Entrega (v1)
- KPIs do período (mês / média recente):
  - Faturamento atual vs. **meta** (e vs. break-even)
  - **Pró-labore** permitido (faixa) vs. realizado vs. gap
  - % do faturamento comprometido com pró-labore / retiradas
  - Distância até a próxima faixa (gatilho de aumento)
- Cards com valor + hint (ex.: “meta 200k · break-even 112k · faixa atual”)
- Tabela ou faixa visual: faturamento → pró-labore máximo (espelho da regra do card MIgyuCRt)
- Onde viver: extensão de `/executivo` (já tem faturamento) ou view financeira dedicada — decisão na implementação

## Fora de escopo (v1)
- Definir/negociar a tabela de faixas (fica no card MIgyuCRt)
- Contabilidade, folha ou integração bancária
- Projeção MRR de agentes do `/dashboard` (outro domínio)

## Critério de pronto
Com o faturamento do mês, os KPIs respondem em segundos: estamos na meta? quanto de pró-labore pode sair? quanto falta para a próxima faixa?