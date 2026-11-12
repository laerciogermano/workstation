## Objetivo
Analisar **ordens de compra** e **emissão de boleto temp**, com foco nos casos **em atraso**, para decidir o que liberar, cobrar ou regularizar.

## Contexto
Há OCs e boletos temporários pendentes de análise; parte já passou do prazo e está sem follow-up claro. Sem fila priorizada, atraso acumula e o caixa/fornecedor fica no escuro.

## Entrega (v1)
- Levantamento das OCs abertas + boletos temp emitidos (status, valor, data, responsável)
- Separar: no prazo vs. **em atraso** (critério de atraso explícito)
- Fila priorizada só dos atrasados para análise (mais crítico primeiro: valor / dias de atraso)
- Para cada item atrasado: decisão registrada (aprovar / emitir / cancelar / cobrar / aguardar) + próximo passo e dono
- Resumo do que ficou bloqueado e por quê

## Fora de escopo (v1)
- Automação de emissão/aprovação
- Mudança de regra de crédito no ERP