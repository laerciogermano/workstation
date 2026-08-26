# Histórias de usuário — Bluetti MAP

Histórias derivadas dos documentos em [`../inputs/`](../inputs/):

- `Descritivo_Plataforma_Monitoramento_Precos_Bluetti.pdf`
- `conversa.txt` (resumo da reunião)
- `transcricao.txt` (transcrição do meet)
- `Central de dados Bluetti - EQP.xlsx` (SKUs e preços Premium/Clássico)

Apenas a descrição no formato **Como… quero… para…**. Cenários / critérios de aceite ficam para um refinamento posterior.

---

## ST-01 — Cadastrar produtos

Como **analista comercial**, quero **cadastrar produtos com nome, SKU, EAN, modelo, categoria, código interno, variações, palavras-chave, PMA, preço recomendado, status e data de início do monitoramento**, para que **a plataforma tenha a base correta dos itens a fiscalizar**.

## ST-02 — Importar e atualizar a central de dados

Como **analista comercial**, quero **importar e reimportar a planilha com SKUs 127V/220V e valores Premium e Clássico**, para que **eu alimente e atualize o monitoramento sem recadastro manual**.

## ST-03 — Configurar canais de monitoramento

Como **gestor comercial**, quero **definir quais marketplaces e URLs de sites próprios serão monitorados**, para que **a varredura cubra exatamente os canais acordados**.

## ST-04 — Pesquisa automática de anúncios

Como **analista comercial**, quero **que o sistema busque automaticamente nos canais configurados por SKU, nome, modelo, EAN e palavras-chave**, para que **eu não precise pesquisar manualmente e anúncios sem SKU no título ainda sejam encontrados**.

## ST-05 — Configurar frequência de monitoramento

Como **gestor comercial**, quero **configurar a frequência de pesquisa (1h, 3h, 6h, 12h ou diária) e ativar ou pausar o monitoramento por produto**, para que **a fiscalização seja mais intensa onde há maior risco**.

## ST-06 — Aplicar PMA por canal e modalidade

Como **analista comercial**, quero **que o sistema reconheça a modalidade do anúncio (ex.: Mercado Livre Premium/Clássico) e aplique o PMA correto — incluindo Shopee com 18%, Magalu no Clássico e o efeito do parcelamento**, para que **a comparação respeite a regra real de cada canal**.

## ST-07 — Identificar anúncios coletados

Como **analista comercial**, quero **ver cada anúncio com vendedor, empresa, marketplace, produto, preço, promocional, frete, parcelas, URL, data/hora, imagem e status (ativo/pausado/encerrado)**, para que **eu saiba exatamente o que está sendo praticado no mercado**.

## ST-08 — Validar match e evitar falsos positivos

Como **analista comercial**, quero **que o sistema valide o anúncio contra o produto cadastrado e ignore acessórios, usados, kits e similares**, para que **só anúncios confirmados gerem irregularidade**.

## ST-09 — Comparar preço com o PMA

Como **analista comercial**, quero **que o sistema compare o preço anunciado com o PMA, classifique como regular ou irregular e mostre a diferença absoluta e percentual**, para que **eu priorize as violações mais graves**.

## ST-10 — Registrar ocorrências de violação

Como **analista comercial**, quero **que cada anúncio abaixo do PMA gere uma ocorrência com produto, SKU, PMA, preço, diferença, marketplace, link, data e status**, para que **eu tenha um registro claro para cobrar o revendedor**.

## ST-11 — Vincular anúncio ao parceiro ou sinalizar canal paralelo

Como **analista comercial**, quero **que o sistema associe o vendedor ao parceiro cadastrado (nome, empresa ou CNPJ) ou sinalize quem não está na base**, para que **eu saiba quem cobrar e detecte distribuição não autorizada**.

## ST-12 — Relatório periódico de irregularidades

Como **analista comercial**, quero **receber automaticamente um relatório periódico (padrão a cada 5 horas), com destinatários e formato configuráveis, totais de anúncios regulares/irregulares, empresas em falta e links diretos**, para que **eu contate no mesmo dia quem está fora do MAP**.

## ST-13 — Alertas de irregularidade

Como **analista comercial**, quero **receber alertas automáticos por e-mail e, futuramente, WhatsApp, Telegram, Microsoft Teams ou CRM**, para que **eu aja rápido nos canais que a equipe já usa**.

## ST-14 — Painel administrativo

Como **gestor comercial**, quero **um painel com totais de produtos, anúncios, vendedores, irregulares, reincidentes e evolução das violações, filtrável por produto, marketplace, empresa e período**, para que **eu tenha visão geral e isole onde estão as violações**.

## ST-15 — Visão consolidada de preços no mercado

Como **analista comercial**, quero **ver o mapeamento de preços por SKU nas plataformas, os menores preços praticados e a lista de anúncios regulares e irregulares**, para que **eu tenha uma visão tipo Buscapé/Promo além do relatório de violações**.

## ST-16 — Histórico de pesquisas e preços

Como **analista comercial**, quero **consultar o histórico das pesquisas por empresa, produto, marketplace e período**, para que **eu identifique reincidência e tendências de preço**.

## ST-17 — Evidências das ocorrências

Como **analista comercial**, quero **guardar evidências de cada irregularidade (screenshot/imagem, URL, preço, data, horário, produto e vendedor)**, para que **eu comprove a violação mesmo depois que o anúncio mudar**.

## ST-18 — Cadastrar empresas e revendedores

Como **analista comercial**, quero **cadastrar parceiros com razão social, CNPJ, contatos, distribuidor, marketplaces, status e produtos comercializados**, para que **eu cruze a base oficial com os anúncios encontrados**.

## ST-19 — Regras de PMA e exceções

Como **gestor comercial**, quero **definir, atualizar e historiar PMA por produto/SKU/categoria/período, com exceções de campanha ou cliente autorizado**, para que **promoções válidas não gerem falsa irregularidade e eu saiba qual mínimo valia em cada período**.

## ST-20 — Controle de advertências e cobrança

Como **analista comercial**, quero **registrar e acompanhar a cobrança/advertência (fluxo Identificada → Enviada → Aguardando correção → Corrigida ou Reincidente), com responsável, observações, prazo, evidências e número da ocorrência, além de alertas de prazo vencido, reincidência e correção**, para que **cada ação comercial fique auditável e nenhum caso fique parado**.

## ST-21 — Advertência automática ao revendedor

Como **gestor comercial**, quero **gerar e enviar automaticamente a comunicação de advertência ao revendedor com prazo de correção**, para que **a fiscalização não dependa só do envio manual**.

## ST-22 — Ranking de conformidade por distribuidor

Como **gestor comercial**, quero **ver relatórios e ranking de conformidade dos revendedores por distribuidor**, para que **eu acompanhe quem mais viola e quem mantém a política de preço**.

## ST-23 — Exportar dados filtrados

Como **analista comercial**, quero **exportar ocorrências e anúncios em Excel, CSV ou PDF com filtros por produto, empresa, CNPJ, marketplace, período, status e tipo de ocorrência**, para que **eu compartilhe e analise os dados fora da plataforma**.
