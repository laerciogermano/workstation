# Histórias de usuário — Bluetti MAP

Histórias derivadas dos documentos em [`../inputs/`](../inputs/):

- `Descritivo_Plataforma_Monitoramento_Precos_Bluetti.pdf`
- `conversa.txt` (resumo da reunião)
- `transcricao.txt` (transcrição do meet)
- `Central de dados Bluetti - EQP.xlsx` (SKUs e preços Premium/Clássico)

Apenas a descrição no formato **Como… quero… para…**. Cenários / critérios de aceite ficam para um refinamento posterior.

---

## ST-01 — Cadastrar produtos com SKU e PMA

Como **analista comercial**, quero **cadastrar produtos com nome, SKU, EAN, modelo, categoria, PMA e status de monitoramento**, para que **a plataforma tenha a base correta dos itens a fiscalizar**.

## ST-02 — Importar central de dados de SKUs e preços

Como **analista comercial**, quero **importar a planilha central de dados com SKUs (127V/220V) e valores Premium e Clássico**, para que **eu alimente o monitoramento sem cadastrar cada produto manualmente**.

## ST-03 — Pesquisa automática nos marketplaces

Como **analista comercial**, quero **que o sistema varra automaticamente Mercado Livre, Shopee, Magalu, Amazon e demais marketplaces relevantes com base nos SKUs cadastrados**, para que **eu não precise pesquisar preços manualmente todos os dias**.

## ST-04 — PMA distinto por marketplace e modalidade

Como **analista comercial**, quero **aplicar o valor Premium no Mercado Livre Premium, o Clássico no Mercado Livre Clássico/Magalu e o Clássico com tolerância de 18% na Shopee**, para que **a comparação de preço respeite as regras comerciais de cada canal**.

## ST-05 — Identificar anúncios e vendedores

Como **analista comercial**, quero **ver cada anúncio encontrado com vendedor, empresa, marketplace, produto, preço, URL e data/hora da coleta**, para que **eu saiba exatamente onde e por quem o preço está sendo praticado**.

## ST-06 — Comparar preço encontrado com o PMA

Como **analista comercial**, quero **que o sistema compare automaticamente o preço anunciado com o PMA e classifique como regular ou irregular**, para que **eu priorize apenas os anúncios abaixo do mínimo**.

## ST-07 — Registrar violações / ocorrências

Como **analista comercial**, quero **que cada anúncio abaixo do PMA gere uma ocorrência com produto, SKU, PMA, preço encontrado, diferença, marketplace, link e data**, para que **eu tenha um registro claro para cobrar o revendedor**.

## ST-08 — Relatório periódico de irregularidades

Como **analista comercial**, quero **receber automaticamente um relatório periódico (ex.: a cada 5 horas ou diário) listando empresas e preços abaixo do MAP, com data e horário**, para que **eu consiga entrar em contato com quem está fora da política**.

## ST-09 — Painel administrativo / dashboard

Como **gestor comercial**, quero **um painel com totais de produtos, anúncios, vendedores, irregulares, reincidentes e evolução das violações**, para que **eu tenha visão geral da fiscalização de mercado**.

## ST-10 — Histórico de preços e pesquisas

Como **analista comercial**, quero **consultar o histórico das pesquisas por empresa, produto, marketplace e período**, para que **eu identifique reincidência e tendências de preço**.

## ST-11 — Controle de advertências

Como **analista comercial**, quero **acompanhar o fluxo de advertência (Identificada → Advertência enviada → Aguardando correção → Corrigida ou Reincidente)**, para que **eu saiba o status de cada cobrança e o prazo de correção**.

## ST-12 — Cadastrar empresas / revendedores

Como **analista comercial**, quero **cadastrar parceiros com razão social, CNPJ, contatos, distribuidor responsável e marketplaces**, para que **eu relacione anúncios encontrados à base oficial de revendedores**.

## ST-13 — Sinalizar vendedores não cadastrados

Como **analista comercial**, quero **que o sistema sinalize vendedores que vendem Bluetti sem estar na base de parceiros**, para que **eu detecte canal paralelo ou distribuição não autorizada**.

## ST-14 — Regras de preço e exceções promocionais

Como **gestor comercial**, quero **definir PMA por produto/SKU/categoria/período e exceções de campanha ou cliente autorizado**, para que **promoções válidas não gerem falsa irregularidade**.

## ST-15 — Configurar frequência de monitoramento

Como **gestor comercial**, quero **configurar a frequência de pesquisa (1h, 3h, 6h, 12h ou diária) conforme a importância do produto**, para que **a fiscalização seja mais intensa onde há maior risco**.

## ST-16 — Alertas automáticos de irregularidade

Como **analista comercial**, quero **receber alertas automáticos por e-mail quando houver preço abaixo do PMA**, para que **eu aja rápido sem depender só do relatório consolidado**.

## ST-17 — Exportar dados filtrados

Como **analista comercial**, quero **exportar ocorrências e anúncios em Excel, CSV ou PDF com filtros por produto, empresa, marketplace, período e status**, para que **eu compartilhe e analise os dados fora da plataforma**.

## ST-18 — Evitar falsos positivos na identificação

Como **analista comercial**, quero **que a busca valide modelo/SKU/EAN e ignore acessórios, usados, kits e produtos similares**, para que **eu fiscalize apenas o produto correto**.

## ST-19 — Armazenar evidências das ocorrências

Como **analista comercial**, quero **guardar evidências de cada irregularidade (screenshot, URL, preço, data, horário, produto e vendedor)**, para que **eu comprove a violação mesmo depois que o anúncio mudar**.
