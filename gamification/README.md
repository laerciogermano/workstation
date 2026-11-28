# Gamification — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de histórias, telas ou código.  
**Importante:** fonte de verdade do produto — sem ela, derivados divergem.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → PRD / discovery → implementação.

Derivados: [`docs/`](docs/README.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

**Não confundir com** [`Fitness`](../fitness/README.md) (gamificação de treino pessoal) nem com dashboards genéricos de KPI. O Gamification é o sistema de **metas, conduta e bônus** da **operação comercial** — para elevar qualidade e vender mais.

---

## Visão

O **Gamification** cria **metas** e **bônus**, **acompanha a performance** dos profissionais e **bonifica** quem mantém **boa conduta**: cumprir o que é **obrigatório**, o que é **diário** e o restante das regras da operação — para a equipe prospectar leads, fazer follow-up, rodar campanhas e **vender mais**.

## Problema

A operação comercial depende de disciplina repetível (prospecção, follow-up, campanhas). Sem sistema que torne a conduta **visível, mensurável e recompensada**, o cumprimento cai e a qualidade da operação (e o volume de vendas) sofre.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Conduta invisível** | Obrigatórios e diários existem, mas não ficam claros nem auditáveis no dia a dia. |
| **Performance sem feedback** | Quem performa bem e quem falha nas regras não recebe sinal rápido nem justo. |
| **Bônus desconectado** | Bonificação, quando existe, não amarra meta + conduta + resultado operacional. |
| **Operação irregular** | Prospecção, follow-up e campanhas oscilam — sem elevação estável da qualidade. |
| **Vendas abaixo do potencial** | Sem disciplina nas etapas obrigatórias, o funil gera menos leads e menos fechamento. |

Já existe vontade de **elevar a operação**. Falta o produto que **mede conduta**, **premia boa execução** e **empurra o time a fazer o que é obrigatório** para vender mais.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Profissional** | Quem executa prospecção, follow-up, campanhas | Ver metas, obrigações diárias, progresso e bônus claros |
| **Gestor / líder** | Quem define regras e acompanha o time | Criar metas/bônus, ver performance e conduta, bonificar com critério |
| **Operação / dono** | Quem quer vender mais com qualidade | Elevar cumprimento das regras e resultado comercial |

## Objetivo

**Elevar a qualidade da operação e o volume de vendas** bonificando profissionais com **boa conduta** — cumprimento de obrigações, rotinas diárias e metas — para o time **prospectar leads**, fazer **follow-up**, rodar **campanhas** e fechar com disciplina.

## Proposta de valor

O Gamification trata **conduta operacional** como o motor da bonificação: não só “bateu número”, mas **fez o que era obrigatório e diário** para a máquina de vendas funcionar.

| Necessidade | O que o Gamification faz |
|-------------|--------------------------|
| Definir o jogo | **Metas**, regras obrigatórias, diárias e demais condutas |
| Acompanhar | **Performance** por profissional (cumprimento + resultado) |
| Bonificar | **Bônus** amarrados a conduta e/ou meta |
| Elevar a operação | Sinal claro do que fazer todo dia para prospectar, follow-up e campanhas |
| Vender mais | Disciplina nas etapas → mais leads tratados → mais vendas |

### Exemplos

**Meta + diário** — Gestor define: X leads prospectados/dia + follow-up em Yh + checklist de campanha. Quem cumpre acumula pontos/bônus.

**Conduta obrigatória** — Antes de liberar bônus de fechamento, o sistema exige que as obrigações do período (ex.: registro de contato, follow-up no prazo) estejam cumpridas.

**Painel do profissional** — Ver o que falta hoje, o progresso da meta e o bônus estimado.

**Painel do gestor** — Ranking/visão de conduta e performance; ajustar metas e regras de bonificação.

## Princípios

1. **Conduta primeiro** — bônus premia quem faz o obrigatório e o diário, não só o resultado final solto.
2. **Operação → venda** — regras existem para prospectar, follow-up e campanhas com qualidade.
3. **Visível e justo** — o profissional sabe o que conta; o gestor vê o mesmo critério.
4. **Metas + rotina** — número (meta) e hábito (diário/obrigatório) andam juntos.
5. **Escopo comercial** — foco na operação de vendas/ops; não é app de fitness ou RH genérico.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Metas** | Criar e atribuir metas a profissionais / times |
| **Condutas** | Regras obrigatórias, diárias e demais |
| **Performance** | Acompanhar cumprimento e indicadores |
| **Bônus** | Regras de bonificação ligadas a conduta/meta |
| **Painéis** | Vista do profissional e do gestor |

### Fora de escopo (v1)

- App de fitness / hábitos pessoais (ver [`Fitness`](../fitness/README.md))
- Folha de pagamento completa / eSocial
- CRM multi-canal (ver [`CRM`](../crm/README.md)) — o Gamification **consome** evidência de conduta, não substitui o CRM
- Substituição do funil ConnectMax — integração pode vir depois
- Marketplace de “jogos” / gamificação genérica B2C

## Modelo conceitual

### Profissional

Quem executa e recebe acompanhamento / bônus.

### Meta

Alvo mensurável no período (ex.: leads, follow-ups, campanhas, vendas).

### Conduta

Regra de comportamento operacional: **obrigatória**, **diária** ou outra frequência/tipo.

### Evidência / cumprimento

Registro de que a conduta ou a meta foi atendida (manual, checklist ou integração futura).

### Bônus

Recompensa condicionada a meta e/ou conduta no período.

### Regra de bonificação

Política que liga cumprimento → elegibilidade → valor/pontos.

## Critérios de sucesso (visão)

- Dá para **criar metas** e **regras de conduta** (obrigatórias e diárias).
- Profissional e gestor **vêem performance** e cumprimento no período.
- É possível **bonificar** com critério amarrado a conduta/meta.
- O discurso do produto fica claro: **boa conduta → operação melhor → mais vendas**.

## Fora / adjacências

| Projeto | Papel |
|---------|--------|
| Connect / ConnectMax | Funil LinkedIn / vendas — fonte futura de evidências (leads, follow-up) |
| [`CRM`](../crm/README.md) | Pessoa/canal — não é o núcleo de bônus |
| [`Fitness`](../fitness/README.md) | Gamificação pessoal de treino — outro domínio |
| [`Board`](../board/README.md) | Kanban de trabalho — não substitui metas/bônus |

## Próximos passos

1. Validar e refinar **este** documento de visão.
2. [`docs/`](docs/README.md) → PRD (metas, condutas, performance, bônus).
3. Discovery (épicos / stories) só depois da visão estável.
