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

## ST-20 — Pesquisar por nome, modelo, EAN e palavras-chave

Como **analista comercial**, quero **que a busca use também nome do produto, modelo, EAN e palavras-chave — não só o SKU**, para que **anúncios sem SKU no título ainda sejam encontrados**.

## ST-21 — Atualizar valores de PMA/MAP

Como **gestor comercial**, quero **atualizar o preço mínimo de um produto ou SKU quando a política de preço mudar**, para que **as próximas comparações usem o valor vigente**.

## ST-22 — Configurar marketplaces monitorados

Como **gestor comercial**, quero **definir quais canais serão monitorados (Mercado Livre, Shopee, Magalu, Amazon, Carrefour, Casas Bahia, KaBuM, AliExpress, Google Shopping, sites próprios etc.)**, para que **a varredura cubra exatamente os marketplaces acordados**.

## ST-23 — Configurar destinatários e formato do relatório

Como **gestor comercial**, quero **definir para quais e-mails o relatório vai e em qual formato**, para que **a equipe certa receba a informação no formato útil para a cobrança**.

## ST-24 — Visão consolidada de preços por produto

Como **analista comercial**, quero **ver um mapeamento consolidado dos preços encontrados por SKU em cada plataforma (visão tipo Buscapé)**, para que **eu entenda o panorama do mercado além das irregularidades**.

## ST-25 — Considerar frete e parcelamento no anúncio

Como **analista comercial**, quero **ver frete, preço promocional e parcelamento junto ao preço anunciado**, para que **eu avalie corretamente casos como Mercado Livre Clássico vs Premium ao parcelar**.

## ST-26 — Cadastrar variações e palavras-chave do produto

Como **analista comercial**, quero **cadastrar variações, código interno, preço recomendado e palavras-chave de cada produto**, para que **a identificação dos anúncios seja mais precisa**.

## ST-27 — Ativar, pausar e agendar o monitoramento por produto

Como **gestor comercial**, quero **ativar ou pausar o monitoramento de um produto e definir a data de início**, para que **eu controle quais SKUs entram na varredura e quando**.

## ST-28 — Detectar reincidência após correção

Como **analista comercial**, quero **que o sistema marque a ocorrência como corrigida e detecte automaticamente se o mesmo vendedor voltar a anunciar abaixo do PMA**, para que **eu escale reincidentes com base em histórico**.

## ST-29 — Registrar cobrança a partir da ocorrência

Como **analista comercial**, quero **registrar o contato/cobrança feito a um revendedor a partir de uma irregularidade do relatório**, para que **a ação comercial fique vinculada à ocorrência encontrada**.

## ST-30 — Gerar e enviar advertência automaticamente

Como **gestor comercial**, quero **gerar e enviar automaticamente a comunicação de advertência ao revendedor com prazo de correção**, para que **a fiscalização não dependa só do envio manual**.

## ST-31 — Relatório e ranking de conformidade por distribuidor

Como **gestor comercial**, quero **ver relatórios e ranking de conformidade dos revendedores por distribuidor**, para que **eu acompanhe quem mais viola e quem mantém a política de preço**.

## ST-32 — Integrar alertas com WhatsApp, Teams ou CRM

Como **analista comercial**, quero **receber alertas e acompanhar ocorrências também via WhatsApp, Telegram, Microsoft Teams ou CRM**, para que **a fiscalização rode nos canais que a equipe já usa no dia a dia**.

## ST-33 — Monitorar SKUs 127V e 220V separadamente

Como **analista comercial**, quero **tratar as variantes 127V e 220V como SKUs distintos no monitoramento**, para que **cada voltagem seja pesquisada e comparada com o PMA correto**.

## ST-34 — Identificar modalidade Premium ou Clássico no Mercado Livre

Como **analista comercial**, quero **que o sistema reconheça se o anúncio do Mercado Livre é Premium ou Clássico**, para que **o PMA aplicado seja o da modalidade correta**.

## ST-35 — Vincular anúncio ao revendedor cadastrado

Como **analista comercial**, quero **que o sistema associe automaticamente o vendedor do anúncio ao parceiro cadastrado (nome, empresa ou CNPJ)**, para que **eu saiba quem cobrar sem identificar manualmente cada loja**.

## ST-36 — Cadastrar sites próprios de revendedores

Como **gestor comercial**, quero **cadastrar URLs de sites próprios de revendedores para monitoramento**, para que **a varredura não fique só nos marketplaces**.

## ST-37 — Associar produtos comercializados ao parceiro

Como **analista comercial**, quero **vincular quais produtos cada revendedor comercializa e o status do parceiro**, para que **eu cruze o portfólio oficial com os anúncios encontrados**.

## ST-38 — Validar o match do anúncio com o produto cadastrado

Como **analista comercial**, quero **que o sistema valide o anúncio contra o produto cadastrado antes de classificar o preço**, para que **só anúncios confirmados gerem irregularidade**.

## ST-39 — Ver diferença percentual e absoluta em relação ao PMA

Como **analista comercial**, quero **ver a diferença absoluta e percentual entre o preço anunciado e o PMA em cada ocorrência**, para que **eu priorize as violações mais graves**.

## ST-40 — Relatório com resumo quantitativo e links

Como **analista comercial**, quero **um relatório com totais de anúncios encontrados, regulares e irregulares, empresas em falta e links diretos para cada anúncio**, para que **eu abra e aja a partir do próprio relatório**.

## ST-41 — Alertar vencimento de prazo e escalonar reincidência

Como **analista comercial**, quero **ser alertado quando o prazo de correção vencer sem ajuste e escalonar reincidências**, para que **casos sem resposta não fiquem parados**.

## ST-42 — Histórico de alterações de PMA

Como **gestor comercial**, quero **consultar o histórico de alterações dos valores de PMA**, para que **eu saiba qual mínimo valia em cada período analisado**.

## ST-43 — Capturar imagem do anúncio na coleta

Como **analista comercial**, quero **que a coleta registre a imagem do anúncio sempre que possível**, para que **eu tenha evidência visual imediata do preço praticado**.

## ST-44 — Ver menores preços praticados no mercado

Como **analista comercial**, quero **identificar os menores preços praticados por produto entre as plataformas**, para que **eu tenha a mesma visão rápida de ferramentas como Promo/Buscapé**.

## ST-45 — Relatório padrão a cada 5 horas

Como **analista comercial**, quero **receber o relatório de irregularidades a cada 5 horas por padrão**, para que **eu consiga contatar as empresas ainda no mesmo dia em que o preço irregular aparecer**.

## ST-46 — Registrar status do anúncio

Como **analista comercial**, quero **ver se o anúncio coletado está ativo, pausado ou encerrado**, para que **eu não cobre irregularidade de anúncio que já saiu do ar**.

## ST-47 — Registrar detalhes da advertência

Como **analista comercial**, quero **registrar na advertência a data, o responsável, as observações, o prazo, a data de correção, as evidências e o número da ocorrência**, para que **cada cobrança fique auditável de ponta a ponta**.

## ST-48 — Exportar por CNPJ e tipo de ocorrência

Como **analista comercial**, quero **exportar dados filtrando também por CNPJ e tipo de ocorrência**, para que **eu separe irregularidades, reincidentes e casos resolvidos por empresa**.

## ST-49 — Consultar anúncios regulares e irregulares

Como **analista comercial**, quero **consultar a lista completa de anúncios classificados como regulares e irregulares**, para que **eu analise o mercado além das violações do relatório**.

## ST-50 — Reimportar e atualizar a central de dados

Como **analista comercial**, quero **reimportar a planilha central de dados para atualizar SKUs e preços Premium/Clássico**, para que **mudanças de tabela reflitam no monitoramento sem recadastro manual**.

## ST-51 — Classificar irregularidade considerando o parcelamento

Como **analista comercial**, quero **que a comparação de preço no Mercado Livre considere o efeito do parcelamento (Clássico parcelado equivalendo ao Premium)**, para que **a irregularidade reflita a regra real do canal**.

## ST-52 — Filtrar o dashboard por produto, marketplace e período

Como **gestor comercial**, quero **filtrar o painel por produto, marketplace, empresa e período**, para que **eu isole onde estão concentradas as violações**.

## ST-53 — Notificar quando a irregularidade for corrigida

Como **analista comercial**, quero **ser notificado quando um anúncio irregular voltar ao PMA**, para que **eu feche a ocorrência e pare de cobrar o revendedor**.
