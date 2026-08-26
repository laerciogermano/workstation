# User Stories — Bluetti MAP

Stories derived from documents in [`../inputs/`](../inputs/):

- `Descritivo_Plataforma_Monitoramento_Precos_Bluetti.pdf`
- `conversa.txt` (meeting summary)
- `transcricao.txt` (meet transcript)
- `Central de dados Bluetti - EQP.xlsx` (SKUs and Premium/Classic prices)

Description only in the **Como… quero… para…** format. Scenarios / acceptance criteria come in a later refinement.

---

## US-01 — Register products

Como **analista comercial**, quero **cadastrar produtos com nome, SKU, EAN, modelo, categoria, código interno, variações, palavras-chave, PMA, preço recomendado, status e data de início do monitoramento**, para que **a plataforma tenha a base correta dos itens a fiscalizar**.

## US-02 — Import and update the data hub

Como **analista comercial**, quero **importar e reimportar a planilha com SKUs 127V/220V e valores Premium e Clássico**, para que **eu alimente e atualize o monitoramento sem recadastro manual**.

## US-03 — Configure monitoring channels

Como **gestor comercial**, quero **definir quais marketplaces e URLs de sites próprios serão monitorados**, para que **a varredura cubra exatamente os canais acordados**.

## US-04 — Automatic ad search

Como **analista comercial**, quero **que o sistema busque automaticamente nos canais configurados por SKU, nome, modelo, EAN e palavras-chave**, para que **eu não precise pesquisar manualmente e anúncios sem SKU no título ainda sejam encontrados**.

## US-05 — Configure monitoring frequency

Como **gestor comercial**, quero **configurar a frequência de pesquisa (1h, 3h, 6h, 12h ou diária) e ativar ou pausar o monitoramento por produto**, para que **a fiscalização seja mais intensa onde há maior risco**.

## US-06 — Apply MAP by channel and modality

Como **analista comercial**, quero **que o sistema reconheça a modalidade do anúncio (ex.: Mercado Livre Premium/Clássico) e aplique o PMA correto — incluindo Shopee com 18%, Magalu no Clássico e o efeito do parcelamento**, para que **a comparação respeite a regra real de cada canal**.

## US-07 — Identify collected ads

Como **analista comercial**, quero **ver cada anúncio com vendedor, empresa, marketplace, produto, preço, promocional, frete, parcelas, URL, data/hora, imagem e status (ativo/pausado/encerrado)**, para que **eu saiba exatamente o que está sendo praticado no mercado**.

## US-08 — Validate match and avoid false positives

Como **analista comercial**, quero **que o sistema valide o anúncio contra o produto cadastrado e ignore acessórios, usados, kits e similares**, para que **só anúncios confirmados gerem irregularidade**.

## US-09 — Compare price with MAP

Como **analista comercial**, quero **que o sistema compare o preço anunciado com o PMA, classifique como regular ou irregular e mostre a diferença absoluta e percentual**, para que **eu priorize as violações mais graves**.

## US-10 — Register violation occurrences

Como **analista comercial**, quero **que cada anúncio abaixo do PMA gere uma ocorrência com produto, SKU, PMA, preço, diferença, marketplace, link, data e status**, para que **eu tenha um registro claro para cobrar o revendedor**.

## US-11 — Link ad to partner or flag parallel channel

Como **analista comercial**, quero **que o sistema associe o vendedor ao parceiro cadastrado (nome, empresa ou CNPJ) ou sinalize quem não está na base**, para que **eu saiba quem cobrar e detecte distribuição não autorizada**.

## US-12 — Periodic irregularity report

Como **analista comercial**, quero **receber automaticamente um relatório periódico (padrão a cada 5 horas), com destinatários e formato configuráveis, totais de anúncios regulares/irregulares, empresas em falta e links diretos**, para que **eu contate no mesmo dia quem está fora do MAP**.

## US-13 — Irregularity alerts

Como **analista comercial**, quero **receber alertas automáticos por e-mail e, futuramente, WhatsApp, Telegram, Microsoft Teams ou CRM**, para que **eu aja rápido nos canais que a equipe já usa**.

## US-14 — Admin dashboard

Como **gestor comercial**, quero **um painel com totais de produtos, anúncios, vendedores, irregulares, reincidentes e evolução das violações, filtrável por produto, marketplace, empresa e período**, para que **eu tenha visão geral e isole onde estão as violações**.

## US-15 — Consolidated market price view

Como **analista comercial**, quero **ver o mapeamento de preços por SKU nas plataformas, os menores preços praticados e a lista de anúncios regulares e irregulares**, para que **eu tenha uma visão tipo Buscapé/Promo além do relatório de violações**.

## US-16 — Search and price history

Como **analista comercial**, quero **consultar o histórico das pesquisas por empresa, produto, marketplace e período**, para que **eu identifique reincidência e tendências de preço**.

## US-17 — Occurrence evidence

Como **analista comercial**, quero **guardar evidências de cada irregularidade (screenshot/imagem, URL, preço, data, horário, produto e vendedor)**, para que **eu comprove a violação mesmo depois que o anúncio mudar**.

## US-18 — Register companies and resellers

Como **analista comercial**, quero **cadastrar parceiros com razão social, CNPJ, contatos, distribuidor, marketplaces, status e produtos comercializados**, para que **eu cruze a base oficial com os anúncios encontrados**.

## US-19 — MAP rules and exceptions

Como **gestor comercial**, quero **definir, atualizar e historiar PMA por produto/SKU/categoria/período, com exceções de campanha ou cliente autorizado**, para que **promoções válidas não gerem falsa irregularidade e eu saiba qual mínimo valia em cada período**.

## US-20 — Warning and collection control

Como **analista comercial**, quero **registrar e acompanhar a cobrança/advertência (fluxo Identificada → Enviada → Aguardando correção → Corrigida ou Reincidente), com responsável, observações, prazo, evidências e número da ocorrência, além de alertas de prazo vencido, reincidência e correção**, para que **cada ação comercial fique auditável e nenhum caso fique parado**.

## US-21 — Automatic reseller warning

Como **gestor comercial**, quero **gerar e enviar automaticamente a comunicação de advertência ao revendedor com prazo de correção**, para que **a fiscalização não dependa só do envio manual**.

## US-22 — Compliance ranking by distributor

Como **gestor comercial**, quero **ver relatórios e ranking de conformidade dos revendedores por distribuidor**, para que **eu acompanhe quem mais viola e quem mantém a política de preço**.

## US-23 — Export filtered data

Como **analista comercial**, quero **exportar ocorrências e anúncios em Excel, CSV ou PDF com filtros por produto, empresa, CNPJ, marketplace, período, status e tipo de ocorrência**, para que **eu compartilhe e analise os dados fora da plataforma**.
