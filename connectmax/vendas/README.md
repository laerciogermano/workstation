# ConnectMax vendas — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto de **vendas / prospecção** antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do processo comercial — sem ela, derivados divergem.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`).  
**Umbrella:** [`../README.md`](../README.md).  
**Infra de tela (robô):** [`../screen-robot/`](../screen-robot/README.md) — captura, lista de elementos, cliques e digitação; este projeto **não** reimplementa o robô.

Derivados: [`docs/`](docs/README.md).  
Timeline de prompts: [`../prompts/`](../prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

---

## Visão

O **ConnectMax** otimiza e automatiza a **prospecção via LinkedIn**, para que a operação de vendas deixe de depender do esforço manual de cada vendedor. Com a prospecção rodando de forma contínua, dá para **aumentar o número de vendedores**, **elevar o faturamento** e abrir a unidade (ou o modelo) como **fonte de renda para novos investidores**.

## Problema

Hoje a operação vende, mas o teto é o tamanho do time — e o time é limitado pelo que cada pessoa consegue prospectar no LinkedIn.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Prospecção 100% LinkedIn e manual** | Toda a busca de cliente passa pelo LinkedIn. Cada vendedor pesquisa, aborda e acompanha na mão. O canal existe; o processo não escala. |
| **Time pequeno, faturamento travado** | São **cinco vendedores**, com **faturamento médio mensal de R$ 200 mil**. O volume de pipeline cabe nesse time. |
| **Franqueados com mais vendedores faturam mais** | Outros franqueados tiram em média **R$ 600 mil por mês** porque têm **mais vendedores**. O faturamento acompanha o tamanho da equipe, não um “segredo” de oferta. |
| **Investidor sem alavanca** | Quem poderia entrar como investidor vê uma unidade limitada pela capacidade manual de prospectar. Falta um motor repetível de geração de leads para tratar a operação como **fonte de renda**. |

O mercado e o produto já vendem. O que falta é um jeito de **automatizar a prospecção no LinkedIn** para **adicionar vendedores** com demanda na mesa — e, com isso, **subir o faturamento** na direção (e além) do que os franqueados maiores já tiram.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Vendedor** | Quem hoje prospecta no LinkedIn e fecha venda | Receber fila contínua de leads qualificados, em vez de gastar o dia só buscando contato |
| **Gestor / franqueado** | Quem opera a unidade (hoje ~5 vendedores, ~R$ 200 mil/mês) | Escalar o time rumo ao patamar dos franqueados de ~R$ 600 mil/mês, sem o gargalo da prospecção manual |
| **Investidor** | Quem avalia entrar na operação como fonte de renda | Um modelo em que a geração de leads não depende só de contratar gente para ficar no LinkedIn |

## Objetivo

Automatizar e otimizar a **prospecção via LinkedIn** para que a operação **aumente o número de vendedores** com pipeline suficiente, **suba o faturamento** (do patamar de R$ 200 mil em direção aos R$ 600 mil dos franqueados com time maior) e se torne **atrativa para novos investidores** como fonte de renda.

## Proposta de valor

O ConnectMax trata a prospecção no LinkedIn como um **sistema operacional**, não como talento individual de cada vendedor. A máquina gera e organiza o contato; o vendedor conversa e fecha; o gestor escala o time; o investidor enxerga receita previsível.

| Necessidade | O que o ConnectMax faz |
|-------------|------------------------|
| Parar de prospectar só na mão | Automatizar etapas repetíveis da prospecção no LinkedIn (lista, abordagem, follow-up, handoff) |
| Alimentar mais vendedores | Distribuir leads para um time maior do que os cinco atuais, com fila visível |
| Subir o faturamento | Ligar volume de prospecção → vendedores ativos → receita, rumo ao patamar dos franqueados de ~R$ 600 mil/mês |
| Ver o gargalo | Mostrar quanto pipeline existe por vendedor e o que falta para contratar o próximo |
| Abrir para investidor | Tornar a geração de demanda um processo repetível, não um ofício preso a cinco pessoas |

### Exemplos

**Unidade hoje** — Cinco vendedores. Cada um passa boa parte do dia no LinkedIn. O mês fecha perto de **R$ 200 mil**. Não falta oferta; falta volume de conversa iniciada.

**Franqueado maior** — Outra unidade tem mais vendedores e fatura cerca de **R$ 600 mil/mês**. A diferença visível é **capacidade comercial**, não um produto diferente. Sem mais prospecção, copiar esse time na unidade atual não se sustenta.

**Motor de prospecção** — O ConnectMax monta e opera a cadência no LinkedIn: quem abordar, em que ordem, o que já foi dito, quem respondeu. O vendedor entra quando há conversa ou lead pronto — não quando ainda está vasculhando perfil.

**Sexto vendedor** — Com fila de leads sobrando, o gestor contrata. O novo vendedor recebe carteira do motor, em vez de começar do zero no LinkedIn. O faturamento sobe com a cadeira nova, não só com “trabalhar mais os cinco”.

**Tese para investidor** — A unidade deixa de ser “cinco pessoas boas no LinkedIn” e passa a ser operação com **prospecção automatizada + time comercial expansível**. Isso é o que torna o negócio uma **fonte de renda** replicável, não só o salário de quem já está na ponta.

## Princípios

1. **LinkedIn é o canal; o processo é o produto** — a prospecção já acontece lá; o ConnectMax existe para otimizar e automatizar esse processo, não para inventar outro canal no lugar.
2. **Mais vendedores, mais faturamento** — o teto atual (~R$ 200 mil, 5 pessoas) versus o dos franqueados maiores (~R$ 600 mil) mostra que escala de time é a alavanca; a prospecção tem que acompanhar.
3. **Automação serve o vendedor** — o sistema pesquisa, organiza e dispara o repetível; a conversa comercial continua humana.
4. **Pipeline antes da cadeira** — só faz sentido aumentar o time quando há demanda gerada para ocupar o novo vendedor.
5. **Operação investível** — sucesso também é a unidade (ou o modelo) ser compreensível e repetível para quem entra como investidor.
6. **Respeito ao canal** — automação no LinkedIn opera de forma sustentável (cadência, limites, rastreio), sem tratar a plataforma como terra sem regra.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Conta e papéis** | Acesso para vendedor, gestor e (visão) investidor |
| **Motor LinkedIn** | Organizar e automatizar o fluxo de prospecção: público-alvo, cadência, follow-up, registro do que já foi feito |
| **Fila de leads** | Leads gerados e prontos para o vendedor trabalhar |
| **Distribuição** | Repassar leads entre vendedores; enxergar carga de cada um |
| **Time comercial** | Acompanhar os vendedores atuais e o efeito de **adicionar** pessoas ao time |
| **Faturamento** | Visão do faturamento da unidade (referência atual: ~R$ 200 mil/mês com 5 vendedores; referência de escala: ~R$ 600 mil/mês com time maior) |
| **Prontidão para contratar** | Indicar se a prospecção já sustenta mais uma cadeira |
| **Visão para investidor** | Números simples: time, pipeline, faturamento — tese de renda da operação |

### Fora de escopo (v1)

- CRM completo de pós-venda / CS
- Automação de canais que não sejam LinkedIn (e-mail frio em massa, WhatsApp como motor principal, ads)
- Substituição do vendedor por robô que fecha a venda sozinho
- Marketplace de franquias ou captação pública de investimento
- Integração bancária / conciliação financeira da unidade
- Scraping ou bypass de autenticação da plataforma (a automação segue o uso legítimo do canal)

## Modelo conceitual

### Unidade

A operação comercial de um franqueado (ou equivalente): time de vendedores, faturamento do mês e capacidade de prospecção. Referência inicial: **5 vendedores**, **~R$ 200 mil/mês**.

### Vendedor

Pessoa que conversa e fecha. No modelo atual, também prospecta no LinkedIn. No ConnectMax, recebe **leads** do motor e registra o andamento até a venda.

### Prospecção LinkedIn

O processo de encontrar, abordar e aquecer contato no LinkedIn até virar conversa comercial. É o gargalo que o produto automatiza e otimiza.

### Motor de prospecção

O sistema que executa o repetível da prospecção (lista, cadência, follow-up, estado de cada contato) e entrega **leads** para o time.

### Lead

Contato em andamento ou pronto para um vendedor. Tem origem no LinkedIn, status na cadência e dono no time.

### Fila

Leads disponíveis ou em trabalho, por vendedor e para a unidade. É o que mostra se dá para **adicionar vendedor**.

### Faturamento

Receita da unidade no período. Sobe quando há mais vendedores **alimentados** por prospecção, no rumo do que franqueados com time maior já praticam (~R$ 600 mil/mês).

### Tese de investidor

Leitura da unidade como **fonte de renda**: time, capacidade de gerar demanda e faturamento — não só o desempenho isolado de um vendedor.

## Critérios de sucesso

- A prospecção no LinkedIn deixa de ser 100% artesanal: há motor, fila e histórico por contato.
- O gestor vê, com clareza, a carga de cada um dos **cinco vendedores** e se já dá para contratar o próximo.
- Adicionar vendedor aumenta faturamento, em vez de só dividir o mesmo pipeline.
- A unidade se aproxima do patamar dos franqueados com mais time (**~R$ 600 mil/mês**), saindo do teto atual (**~R$ 200 mil/mês**).
- Um investidor consegue entender a operação como fonte de renda (time + prospecção + faturamento), sem depender de “quem é bom no LinkedIn”.

## Glossário

| Termo | Significado |
|-------|-------------|
| **Prospecção** | Buscar e abordar potencial cliente até virar conversa de venda |
| **LinkedIn** | Canal onde toda a prospecção atual acontece |
| **Motor** | Automação/otimização do processo de prospecção |
| **Lead** | Contato gerado ou em cadência, pronto ou quase pronto para o vendedor |
| **Fila** | Conjunto de leads por vendedor ou da unidade |
| **Unidade** | Operação do franqueado (time + faturamento) |
| **Franqueado** | Quem opera uma unidade; alguns faturam ~R$ 600 mil/mês com mais vendedores |
| **Faturamento** | Receita mensal da unidade (referência atual: ~R$ 200 mil com 5 vendedores) |
| **Investidor** | Quem entra no modelo visando a unidade (ou o sistema) como fonte de renda |
| **Handoff** | Passagem do contato do motor para o vendedor |

## Regras de negócio (v1)

- Toda prospecção considerada pelo produto tem origem (ou etapa principal) no **LinkedIn**.
- Um lead tem no máximo um vendedor dono por vez; redistribuição é ação explícita do gestor (ou regra combinada).
- Aumentar o time só é recomendado quando a **fila** indica capacidade ociosa de leads, não só vontade de contratar.
- Faturamento da unidade é o indicador de escala; o número de vendedores é a alavanca, desde que alimentados pelo motor.
- Papel de investidor é **leitura** da operação (time, pipeline, faturamento); não opera a fila no lugar do vendedor.
- Cadências e volumes de abordagem respeitam limites configuráveis para não quebrar o canal.
- O vendedor permanece responsável pelo fechamento; o motor não marca venda sozinho.

## Próximos passos

→ [`docs/functionalities.md`](docs/functionalities.md) → `user-stories.md` (a produzir)
