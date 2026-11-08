# E04 — Cesta, split e gestão financeira

Objetivo: permitir que o comprador monte listas de compras (cesta), cote o valor total da lista em cada supermercado da sua região, descubra a divisão ótima (split) entre 2 ou mais estabelecimentos para maximizar a economia e acompanhe sua gestão financeira pessoal (extrato, gastos mensais e ranking de lojas) a partir das notas fiscais depositadas.

| ID | História | RF | Prio | Pts | Telas |
|---|---|---|---|---|---|
| US-04.01 | Adicionar produtos à cesta de compras | RF-E04-01 | S | 2 | T-14, T-40 |
| US-04.02 | Cotar cesta total por mercado com cobertura | RF-E04-02 | S | 3 | T-40 |
| US-04.03 | Sugerir split inteligente da cesta entre lojas | RF-E04-03 | S | 5 | T-41 |
| US-04.04 | Extrato pessoal de compras extraído das notas | RF-E04-04 | S | 3 | T-50 |
| US-04.05 | Relatório de gasto mensal e evolução temporal | RF-E04-05 | S | 3 | T-50 |
| US-04.06 | Ranking pessoal de gastos por loja | RF-E04-06 | S | 2 | T-50 |

---

## US-04.01 — Adicionar produtos à cesta de compras
**Como** comprador planejando a feira ou compra do mês,  
**quero** adicionar produtos com quantidades específicas a uma cesta virtual,  
**para** cotar a lista completa de uma só vez.

**Regras de negócio:**
- Na tela de detalhe do produto (`T-14`) ou na busca, o usuário pode tocar em "Adicionar à Cesta".
- Permite definir a quantidade desejada de cada item (mínimo 1 unidade).
- Na tela "Cesta" (`T-40`), é possível:
  - Incrementar ou decrementar a quantidade de cada produto.
  - Excluir itens da lista.
  - Limpar toda a cesta.
- Os itens da cesta são referenciados pelo código universal `EAN`.
- Cesta sincroniza no backend (`cestas` / `cesta_itens`) também para visitante: posse por **fingerprint** até criar conta; depois merge para `usuario_id` ([REQ-050](../../docs/requisitos.md), [identidade-anonima-fingerprint.md](../../docs/identidade-anonima-fingerprint.md)). localStorage só como cache de UX, não fonte de verdade.

```gherkin
# language: pt
Funcionalidade: Adicionar produtos à cesta de compras

  Cenário: Adicionar produto e gerenciar quantidade na cesta
    Dado que estou na tela "Detalhe produto" (T-14) do "Leite Integral Piracanjuba 1L"
    Quando toco em "Adicionar à Cesta"
    E navego para a tela "Cesta" (T-40)
    Então vejo o "Leite Integral Piracanjuba 1L" com quantidade inicial igual a 1
    Quando toco 3 vezes no botão "+" de incremento
    Então a quantidade é atualizada para 4 unidades

  Cenário: Remover produto da cesta
    Dado que possuo 3 itens adicionados na tela "Cesta" (T-40)
    Quando arrasto o card do "Açúcar Refinado 1kg" e toco em "Remover"
    Então o item é excluído da lista e a cesta passa a ter 2 itens
```

---

## US-04.02 — Cotar cesta total por mercado com cobertura
**Como** consumidor com uma lista de compras definida,  
**quero** cotar o valor total da cesta em cada supermercado da minha cidade,  
**para** escolher em qual loja fazer toda a compra pagando menos.

**Regras de negócio:**
- Tela `T-40`.
- O motor de cotação busca o preço mais recente de cada item da cesta em cada estabelecimento do raio do usuário.
- Apresenta a lista consolidada dos mercados ordenada do menor custo total para o maior.
- **Índice de Cobertura:** indica quantos itens da lista foram efetivamente encontrados com preço recente naquele mercado (ex.: "18 de 20 itens encontrados - 90%").
- Para itens sem preço registrado na loja, o sistema **não inventa valores**:
  - Exibe os itens faltantes explicitamente.
  - O total acumulado é calculado sobre a base comparável ou apresenta aviso de itens não cotados.
- Destaca em verde o mercado com o menor valor total e maior cobertura.

```gherkin
# language: pt
Funcionalidade: Cotar cesta total por mercado com cobertura

  Cenário: Cotação de cesta com 5 itens em múltiplos supermercados
    Dado que minha cesta possui 5 itens com quantidades definidas
    Quando toco em "Cotar cesta nos mercados" na tela "Cesta" (T-40)
    Então o sistema calcula o valor total da compra em cada loja no raio de 10 km
    E exibe o "Atacadão Curitiba" em 1º lugar com total de R$ 89,40 (cobertura 5/5 itens)
    E exibe o "Supermercado Condor" em 2º lugar com total de R$ 98,20 (cobertura 5/5 itens)
    E exibe o "Mercado Muffato" em 3º lugar com total de R$ 104,10 (cobertura 5/5 itens)
    E vejo que comprar no Atacadão gera uma economia de R$ 14,70 frente ao Muffato
```

---

## US-04.03 — Sugerir split inteligente da cesta entre lojas
**Como** comprador focado na economia máxima,  
**quero** que o sistema sugira uma divisão (split) da minha lista entre 2 ou 3 mercados próximos,  
**para** saber se vale a pena comprar uma parte dos itens em um lugar e o restante em outro.

**Regras de negócio:**
- Tela `T-41`.
- O algoritmo de otimização analisa o menor preço de cada item individualmente e calcula:
  1. Custo comprando 100% no melhor mercado único.
  2. Custo dividindo a compra entre os 2 mercados mais vantajosos (split em 2 lojas).
  3. Custo comprando cada item onde for mais barato (split irrestrito).
- Limite prático: o algoritmo foca em sugerir split em no máximo **2 estabelecimentos** para que a logística de deslocamento faça sentido ao consumidor.
- Exibe o valor total economizado com a divisão (ex.: "Economize R$ 38,50 dividindo sua compra").
- Lista detalhada de quais itens comprar na "Loja A" e quais comprar na "Loja B".

```gherkin
# language: pt
Funcionalidade: Sugerir split inteligente da cesta entre lojas

  Cenário: Geração de sugestão de split entre dois supermercados
    Dado que possuo uma cesta com 12 itens avaliada em R$ 320,00 no melhor mercado único
    Quando toco em "Ver sugestão de economia (Split)" na tela "Split" (T-41)
    Então o sistema analisa a combinação ideal entre duas lojas no raio de 5 km
    E sugere comprar 7 itens no "Atacadão" (Total: R$ 145,00)
    E comprar 5 itens no "Condor" (Total: R$ 132,00)
    E indica um custo final de R$ 277,00 com economia líquida de R$ 43,00 (13,4%)
```

---

## US-04.04 — Extrato pessoal de compras extraído das notas
**Como** usuário que deposita seus cupons fiscais no app,  
**quero** ver meu extrato pessoal de despesas com todas as compras detalhadas,  
**para** manter controle das minhas finanças domésticas sem esforço manual de digitação.

**Regras de negócio:**
- Tela `T-50`.
- O extrato pessoal é derivado das notas fiscais vinculadas ao `usuario_id` logado.
- Permite filtrar por período: mês corrente, mês anterior ou intervalo customizado.
- Lista cronológica das compras contendo: data da compra, nome e CNPJ do mercado, quantidade de produtos e valor total pago.
- Ao clicar em uma compra, exibe o espelho da nota fiscal com todos os itens, valores unitários e formas de pagamento.

```gherkin
# language: pt
Funcionalidade: Extrato pessoal de compras extraído das notas

  Cenário: Consulta do extrato de compras do mês atual
    Dado que estou autenticado na aba "Extrato" da tela "Extrato financeiro" (T-50)
    Quando seleciono o filtro "Novembro/2026"
    Então vejo a listagem das 4 compras realizadas no mês totalizando R$ 684,30
    Quando toco na compra do dia 03/11 no "Supermercado Condor"
    Então vejo os 14 itens detalhados com quantidade e valor unitário
```

---

## US-04.05 — Relatório de gasto mensal e evolução temporal
**Como** chefe de família gerenciando o orçamento,  
**quero** visualizar gráficos do meu gasto mensal em supermercado e a comparação com meses anteriores,  
**para** identificar se meus gastos com alimentação estão dentro do previsto.

**Regras de negócio:**
- Tela `T-50` (Visão Mensal).
- Gráfico de barras com o total desembolsado mês a mês nos últimos 6 ou 12 meses.
- Indicador percentual de variação em relação ao mês anterior (ex.: "+5,2% em relação a outubro").
- Média semanal de gasto no mês corrente.
- Projeção de fechamento do mês baseada no ritmo dos dias já decorridos.

```gherkin
# language: pt
Funcionalidade: Relatório de gasto mensal e evolução temporal

  Cenário: Visualização dos gastos mensais consolidados
    Dado que possuo notas fiscais registradas desde agosto de 2026
    Quando acesso a aba "Gasto Mensal" na tela "Extrato financeiro" (T-50)
    Então vejo o gráfico de barras dos últimos 4 meses
    E vejo o total de R$ 1.250,00 em Outubro e R$ 420,00 acumulados em Novembro
    E vejo a média de gasto semanal estimada em R$ 310,00
```

---

## US-04.06 — Ranking pessoal de gastos por loja
**Como** usuário que deseja saber onde deixa a maior fatia do seu dinheiro,  
**quero** ver um ranking das redes e lojas onde mais gastei nos últimos meses,  
**para** avaliar se devo trocar de estabelecimento habitual.

**Regras de negócio:**
- Tela `T-50` (Visão por Loja).
- Agrupamento dos gastos pessoais por estabelecimento (`empresas.id`).
- Exibe tabela ou gráfico de pizza/rosca contendo:
  - Nome do estabelecimento.
  - Valor total acumulado gasto na loja no período.
  - Percentual que a loja representa no orçamento total de compras do usuário.
  - Quantidade de visitas/notas registradas naquela unidade.

```gherkin
# language: pt
Funcionalidade: Ranking pessoal de gastos por loja

  Cenário: Visualização da distribuição de gastos por estabelecimento
    Dado que realizei compras em 3 supermercados diferentes no último trimestre
    Quando acesso a aba "Por Loja" na tela "Extrato financeiro" (T-50)
    Então vejo o "Supermercado Condor" no topo com R$ 1.850,00 (52% do total)
    E vejo o "Atacadão" em 2º lugar com R$ 1.100,00 (31% do total)
    E vejo a "Feira do Produtor" em 3º lugar com R$ 600,00 (17% do total)
```
