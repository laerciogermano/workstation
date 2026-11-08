# 003 — PRD com funcionalidades e regras do Fitness

| Campo | Valor |
|-------|--------|
| Número | 003 |
| Data | 2026-11-08 |
| Origem | Chat no Cursor (workstation) |
| Título | Definir PRD com todas as regras e funcionalidades |

## Prompt original

```
No aplicativo Fitness, as funcionalidades principais serão: primeiro, você não precisará de uma conta, então a gente vai utilizar o fingerprint pra vincular todos os dados. Segundo ponto. Ao entrar no aplicativo primeira coisa que ele vai pedir pra você é os dados pra calcular a taxa metabólica basal, gasto calórico diário e tudo mais, que é idade, altura gênero. E peso. Dentre outras questões. Então, o onboarding ele tem que ser esse cadastro. E aí as funcionalidades serão, a pessoa vai colocar essas informações no onboarding, ele vai calcular todo o gasto calórico diário, você vai colocar o seu, o seu objetivo, seu PDPs, definição, enfim, todos os objetivos, objetivos ali. E com base nos objetivos ele, ah, se for é... aumento de músculo, a gente vai ter que fazer um superávit, se for perda de gordura, a gente vai ter que fazer um déficit. E aí, a ideia é que o aplicativo ele calcule de acordo com objetivos macronutrientes necessários, pra você chegar nesse objetivo, com uma projeção. Então vai ter todo um dashboard de projeções. É então, cálculo, gasto calórico diário, depois ele vai montar os, os macronutrientes de acordo com o desafio, montando os macronutrientes a gente vai calcular a dieta de acordo com, com os ingredientes que nós temos. E aí montando com esses ingredientes a gente define toda a alimentação, onde a gente vai poder também acompanhar, então todas as alimentações, todas as refeições a gente vai poder marcar se a gente fez ou não. Após isso a gente vai definir também treinos. Então, todos os... o que que você vai fazer por dia, quais são os exercícios, marcar os exercícios que você fez, montar toda a montagem de treino, treino acompanhamento com visualização de movimentações, de como fazer o exercício. É... e detalhes do exercício como um todo. Depois disso, a gente vai ter a parte de avaliação física. Então a parte de avaliação física você vai ter com uma uma fita métrica, ao qual você vai medir, tirar suas medidas e acompanhar o progresso. No uma espécie de timeline, você vai poder também tirar fotos. Pra acompanhar numa timeline. Ah, a mudança do corpo. E aí de acordo com com acompanhamento terão insights. E mas basicamente seriam esses, os, as funcionalidades. Defina tudo isso num PRD. Todas essas regras.
```

## Interpretação

Produzir o PRD canônico do Fitness cobrindo: identidade por fingerprint (sem conta); onboarding = cadastro metabólico + objetivos; TMB/gasto; déficit/superávit; macros + projeções; dieta por ingredientes + check de refeições; treinos com detalhe/visualização + check; avaliação com fita + fotos em timeline + insights. Alinhar visão e registrar o prompt.

## O que foi feito

- Criado [`../docs/prd.md`](../docs/prd.md) com RFs, RNs, jornadas e glossário (base; ampliado no 004).
- Visão, índice de docs e config-ia alinhados na esteira.
