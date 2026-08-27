# Cenários BDD — Bluetti MAP

Critérios de aceite em formato **Dado / Quando / Então** para as histórias em [`user-stories.md`](user-stories.md).

Fontes: [`../inputs/`](../inputs/) (PDF descritivo, reunião, transcrição, planilha de SKUs).

---

## US-01 — Cadastrar produtos

Como **analista comercial**, quero **cadastrar produtos com nome, SKU, EAN, modelo, categoria, código interno, variações, palavras-chave, PMA, preço recomendado, status e data de início do monitoramento**, para que **a plataforma tenha a base correta dos itens a fiscalizar**.

### Cenários

- [ ] Dado que informo nome, SKU, PMA, status e data de início do monitoramento, quando cadastro o produto, então ele fica disponível para pesquisa e comparação.
- [ ] Dado que informo EAN, modelo, categoria, código interno, variações, palavras-chave e preço recomendado, quando salvo o cadastro, então todos os campos ficam persistidos e consultáveis.
- [ ] Dado que não informo SKU ou PMA, quando tento cadastrar, então o sistema rejeita o cadastro e indica os campos obrigatórios.
- [ ] Dado que um produto já está cadastrado, quando atualizo PMA, palavras-chave ou status, então a nova configuração passa a valer nas próximas pesquisas.
- [ ] Dado que cadastro duas variantes com SKUs distintos (ex.: 127V e 220V), quando consulto a base, então cada SKU aparece como produto independente no monitoramento.

---

## US-02 — Importar e atualizar a central de dados

Como **analista comercial**, quero **importar e reimportar a planilha com SKUs 127V/220V e valores Premium e Clássico**, para que **eu alimente e atualize o monitoramento sem recadastro manual**.

### Cenários

- [ ] Dado um arquivo válido da central de dados, quando importo pela primeira vez, então os SKUs, voltagens e PMAs Premium/Clássico são criados ou atualizados em lote.
- [ ] Dado que a planilha contém SKUs já existentes, quando reimporto, então os PMAs e demais campos mapeados são atualizados sem duplicar registros.
- [ ] Dado que a planilha traz SKUs 127V e 220V na mesma linha ou em linhas distintas conforme o layout acordado, quando importo, então cada voltagem fica associada ao SKU e PMA corretos.
- [ ] Dado um arquivo com colunas ausentes ou formato inválido, quando tento importar, então a operação falha com mensagem clara e nenhum dado parcial inconsistente é persistido.
- [ ] Dado uma importação concluída, quando consulto o log ou resumo da operação, então vejo quantos registros foram criados, atualizados e ignorados.

---

## US-03 — Configurar canais de monitoramento

Como **gestor comercial**, quero **definir quais marketplaces e URLs de sites próprios serão monitorados**, para que **a varredura cubra exatamente os canais acordados**.

### Cenários

- [ ] Dado a lista de marketplaces suportados (Mercado Livre, Amazon, Shopee, Magalu, entre outros), quando ativo ou desativo um canal, então apenas os canais ativos entram na próxima varredura.
- [ ] Dado que informo a URL de um site próprio de revendedor, quando salvo a configuração, então o canal customizado passa a ser incluído nas buscas automáticas.
- [ ] Dado que nenhum marketplace está ativo, quando disparo uma pesquisa, então o sistema não executa varredura externa e informa que não há canais configurados.
- [ ] Dado canais previamente configurados, quando altero a seleção, então a mudança vale imediatamente para os agendamentos futuros, sem reprocessar histórico passado.

---

## US-04 — Pesquisa automática de anúncios

Como **analista comercial**, quero **que o sistema busque automaticamente nos canais configurados por SKU, nome, modelo, EAN e palavras-chave**, para que **eu não precise pesquisar manualmente e anúncios sem SKU no título ainda sejam encontrados**.

### Cenários

- [ ] Dado produtos com monitoramento ativo e canais configurados, quando chega o horário agendado, então o sistema executa buscas automáticas em todos os canais habilitados.
- [ ] Dado um produto com SKU cadastrado, quando a varredura roda, então anúncios cujo título ou descrição contenham o SKU são coletados.
- [ ] Dado um anúncio sem SKU no título, mas com EAN, modelo ou palavra-chave cadastrada correspondente, quando a varredura roda, então o anúncio ainda assim é encontrado e associado ao produto.
- [ ] Dado um produto pausado ou sem data de início de monitoramento atingida, quando chega o horário agendado, então ele é ignorado na varredura.
- [ ] Dado que a busca em um canal falha por indisponibilidade temporária, quando a varredura termina, então o sistema registra a falha e reprocessa ou alerta conforme política definida, sem perder as demais coletas.

---

## US-05 — Configurar frequência de monitoramento

Como **gestor comercial**, quero **configurar a frequência de pesquisa (1h, 3h, 6h, 12h ou diária) e ativar ou pausar o monitoramento por produto**, para que **a fiscalização seja mais intensa onde há maior risco**.

### Cenários

- [ ] Dado um produto monitorado, quando defino a frequência como 1h, 3h, 6h, 12h ou diária, então as próximas execuções respeitam o intervalo escolhido.
- [ ] Dado um produto com monitoramento ativo, quando pauso o monitoramento, então ele deixa de entrar nas varreduras até ser reativado.
- [ ] Dado um produto pausado, quando reativo o monitoramento, então ele volta a ser incluído no próximo ciclo conforme a frequência configurada.
- [ ] Dado produtos com frequências diferentes, quando consulto o agendamento, então cada produto exibe sua próxima execução prevista de forma independente.

---

## US-06 — Aplicar PMA por canal e modalidade

Como **analista comercial**, quero **que o sistema reconheça a modalidade do anúncio (ex.: Mercado Livre Premium/Clássico) e aplique o PMA correto — incluindo Shopee com 8%, Magalu no Clássico e o efeito do parcelamento**, para que **a comparação respeite a regra real de cada canal**.

### Cenários

- [ ] Dado um anúncio no Mercado Livre identificado como Premium, quando comparo o preço, então uso o PMA Premium cadastrado para aquele SKU.
- [ ] Dado um anúncio no Mercado Livre identificado como Clássico, quando comparo o preço, então uso o PMA Clássico cadastrado para aquele SKU.
- [ ] Dado um anúncio na Shopee, quando calculo o PMA aplicável, então aplico o desconto de 8% sobre o PMA base conforme regra do canal.
- [ ] Dado um anúncio no Magalu na modalidade Clássico, quando comparo o preço, então uso o PMA Clássico correspondente ao produto.
- [ ] Dado um anúncio com parcelamento que altera o preço efetivo praticado, quando classifico regularidade, então considero o efeito do parcelamento na regra configurada para aquele canal.
- [ ] Dado um anúncio em canal ou modalidade não reconhecida, quando comparo o preço, então o sistema sinaliza a modalidade indefinida e não classifica como irregular sem PMA aplicável.

---

## US-07 — Identificar anúncios coletados

Como **analista comercial**, quero **ver cada anúncio com vendedor, empresa, marketplace, produto, preço, promocional, frete, parcelas, URL, data/hora, imagem e status (ativo/pausado/encerrado)**, para que **eu saiba exatamente o que está sendo praticado no mercado**.

### Cenários

- [ ] Dado um anúncio coletado na varredura, quando abro o detalhe, então vejo vendedor, marketplace, produto, preço anunciado, URL e data/hora da coleta.
- [ ] Dado um anúncio com preço promocional, frete ou parcelas informados pelo marketplace, quando consulto o registro, então esses campos aparecem quando disponíveis na coleta.
- [ ] Dado um anúncio com imagem capturável, quando consulto o registro, então a imagem ou thumbnail fica associada ao anúncio.
- [ ] Dado um anúncio ativo, pausado ou encerrado no marketplace, quando sincronizo ou recolet, então o status refletido no sistema corresponde ao status atual do anúncio.
- [ ] Dado múltiplos anúncios coletados, quando listo os resultados, então consigo distinguir cada oferta por marketplace, vendedor e URL.

---

## US-08 — Validar match e evitar falsos positivos

Como **analista comercial**, quero **que o sistema valide o anúncio contra o produto cadastrado e ignore acessórios, usados, kits e similares**, para que **só anúncios confirmados gerem irregularidade**.

### Cenários

- [ ] Dado um anúncio cujo SKU, EAN ou modelo confere com o produto cadastrado, quando valido o match, então o anúncio é confirmado para comparação de PMA.
- [ ] Dado um anúncio de acessório, peça ou cabo compatível, quando valido o match, então o anúncio é descartado e não gera ocorrência.
- [ ] Dado um anúncio de produto usado, recondicionado ou seminovo, quando valido o match, então o anúncio é ignorado para fins de MAP.
- [ ] Dado um anúncio de kit, bundle ou modelo similar porém distinto, quando valido o match, então o anúncio não é associado ao SKU cadastrado.
- [ ] Dado um anúncio ambíguo sem confirmação de SKU/EAN/modelo, quando valido o match, então o anúncio fica pendente ou descartado, sem classificação automática como irregular.

---

## US-09 — Comparar preço com o PMA

Como **analista comercial**, quero **que o sistema compare o preço anunciado com o PMA, classifique como regular ou irregular e mostre a diferença absoluta e percentual**, para que **eu priorize as violações mais graves**.

### Cenários

- [ ] Dado um anúncio confirmado com preço igual ou acima do PMA aplicável, quando comparo, então classifico como **regular**.
- [ ] Dado um anúncio confirmado com preço abaixo do PMA aplicável, quando comparo, então classifico como **irregular**.
- [ ] Dado um anúncio irregular, quando exibo o resultado, então mostro a diferença absoluta em reais e a diferença percentual em relação ao PMA.
- [ ] Dado um anúncio com preço promocional menor que o preço de lista, quando comparo, então uso o preço efetivo praticado conforme regra do canal para a classificação.
- [ ] Dado exceção de campanha ou cliente autorizado vigente para aquele anúncio (US-19), quando comparo, então aplico o PMA ou tolerância da exceção antes de classificar.

---

## US-10 — Registrar ocorrências de violação

Como **analista comercial**, quero **que cada anúncio abaixo do PMA gere uma ocorrência com produto, SKU, PMA, preço, diferença, marketplace, link, data e status**, para que **eu tenha um registro claro para cobrar o revendedor**.

### Cenários

- [ ] Dado um anúncio classificado como irregular, quando registro a violação, então crio uma ocorrência com produto, SKU, PMA aplicado, preço encontrado e diferença calculada.
- [ ] Dado uma ocorrência criada, quando consulto o registro, então vejo marketplace, link do anúncio, data da identificação e status inicial da ocorrência.
- [ ] Dado a mesma irregularidade detectada novamente na varredura seguinte, quando o anúncio continua abaixo do PMA, então atualizo ou vinculo a ocorrência existente sem duplicar indevidamente o mesmo caso aberto.
- [ ] Dado um anúncio que deixa de ser irregular, quando uma nova coleta confirma preço regular, então a ocorrência aberta pode ser encerrada ou marcada como corrigida conforme o fluxo comercial.

---

## US-11 — Vincular anúncio ao parceiro ou sinalizar canal paralelo

Como **analista comercial**, quero **que o sistema associe o vendedor ao parceiro cadastrado (nome, empresa ou CNPJ) ou sinalize quem não está na base**, para que **eu saiba quem cobrar e detecte distribuição não autorizada**.

### Cenários

- [ ] Dado um vendedor cujo CNPJ consta na base de parceiros, quando associo o anúncio, então a ocorrência fica vinculada ao parceiro correspondente.
- [ ] Dado um vendedor identificado por razão social ou nome fantasia compatível com a base, quando associo o anúncio, então o vínculo ao parceiro é sugerido ou confirmado.
- [ ] Dado um vendedor de produto Bluetti sem cadastro na base, quando processa a coleta, então o sistema sinaliza **canal paralelo / não cadastrado** para análise.
- [ ] Dado um parceiro inativo ou bloqueado, quando encontro anúncio seu, então o vínculo exibe o status do parceiro junto à ocorrência.

---

## US-12 — Relatório periódico de irregularidades

Como **analista comercial**, quero **receber automaticamente um relatório periódico (padrão a cada 5 horas), com destinatários e formato configuráveis, totais de anúncios regulares/irregulares, empresas em falta e links diretos**, para que **eu contate no mesmo dia quem está fora do MAP**.

### Cenários

- [ ] Dado o intervalo padrão de 5 horas, quando há novas coletas no período, então envio automaticamente um relatório consolidado aos destinatários configurados.
- [ ] Dado destinatários e formato (ex.: e-mail HTML, anexo Excel) configurados, quando o relatório é gerado, então respeita a lista de e-mails e o formato escolhido.
- [ ] Dado coletas no período, quando abro o relatório, então vejo totais de anúncios encontrados, regulares, irregulares e empresas com violação.
- [ ] Dado irregularidades no relatório, quando consulto a lista detalhada, então cada item traz link direto para o anúncio, produto, vendedor e diferença de preço.
- [ ] Dado um período sem novas irregularidades, quando o relatório é gerado, então informo explicitamente que não houve novas violações, mantendo os totais do período.

---

## US-13 — Alertas de irregularidade

Como **analista comercial**, quero **receber alertas automáticos por e-mail e, futuramente, WhatsApp, Telegram, Microsoft Teams ou CRM**, para que **eu aja rápido nos canais que a equipe já usa**.

### Cenários

- [ ] Dado uma nova irregularidade identificada, quando a ocorrência é registrada, então disparo alerta por e-mail aos destinatários configurados.
- [ ] Dado um alerta por e-mail, quando o recebo, então contém produto, SKU, PMA, preço praticado, marketplace, vendedor e link do anúncio.
- [ ] Dado integração futura com WhatsApp, Telegram, Teams ou CRM ainda não habilitada, quando configuro canais de alerta, então apenas os canais disponíveis na versão atual podem ser ativados.
- [ ] Dado alertas repetidos para a mesma ocorrência aberta, quando a irregularidade persiste sem alteração relevante, então consolido ou suprimo duplicatas conforme política de antispam definida.

---

## US-14 — Painel administrativo

Como **gestor comercial**, quero **um painel com totais de produtos, anúncios, vendedores, irregulares, reincidentes e evolução das violações, filtrável por produto, marketplace, empresa e período**, para que **eu tenha visão geral e isole onde estão as violações**.

### Cenários

- [ ] Dado dados de monitoramento existentes, quando abro o painel, então vejo totais de produtos monitorados, anúncios encontrados, vendedores e anúncios irregulares.
- [ ] Dado histórico de ocorrências, quando consulto o painel, então vejo violações abertas, resolvidas, empresas reincidentes e evolução das violações ao longo do tempo.
- [ ] Dado filtros por produto, marketplace, empresa ou período, quando aplico a combinação, então todos os indicadores e listas do painel refletem apenas o recorte selecionado.
- [ ] Dado um marketplace com maior concentração de violações, quando ordeno ou destaco rankings no painel, então identifico rapidamente onde estão os maiores focos de irregularidade.

---

## US-15 — Visão consolidada de preços no mercado

Como **analista comercial**, quero **ver o mapeamento de preços por SKU nas plataformas, os menores preços praticados e a lista de anúncios regulares e irregulares**, para que **eu tenha uma visão tipo Buscapé/Promo além do relatório de violações**.

### Cenários

- [ ] Dado um SKU monitorado, quando abro a visão consolidada, então vejo os preços praticados em cada marketplace onde há anúncios coletados.
- [ ] Dado múltiplos anúncios para o mesmo SKU, quando consulto a visão, então identifico o menor preço praticado e em qual canal/vendedor ele ocorre.
- [ ] Dado anúncios regulares e irregulares para o SKU, quando listo a visão consolidada, então consigo alternar ou filtrar entre listas regulares e irregulares.
- [ ] Dado uma atualização recente de coleta, quando abro a visão, então os preços exibidos correspondem à última varredura disponível por canal.

---

## US-16 — Histórico de pesquisas e preços

Como **analista comercial**, quero **consultar o histórico das pesquisas por empresa, produto, marketplace e período**, para que **eu identifique reincidência e tendências de preço**.

### Cenários

- [ ] Dado coletas anteriores armazenadas, quando filtro por produto e período, então vejo a série histórica de preços encontrados e classificações.
- [ ] Dado um parceiro ou empresa, quando filtro o histórico por CNPJ ou razão social, então vejo todas as pesquisas e ocorrências associadas àquela empresa no intervalo.
- [ ] Dado um marketplace específico, quando filtro o histórico, então vejo a evolução de preços e violações apenas naquele canal.
- [ ] Dado um revendedor reincidente, quando analiso o histórico, então identifico repetição de irregularidades após correções anteriores.

---

## US-17 — Evidências das ocorrências

Como **analista comercial**, quero **guardar evidências de cada irregularidade (screenshot/imagem, URL, preço, data, horário, produto e vendedor)**, para que **eu comprove a violação mesmo depois que o anúncio mudar**.

### Cenários

- [ ] Dado uma ocorrência registrada, quando capturo evidência na coleta, então armazeno screenshot ou imagem, URL, preço, data, horário, produto e vendedor vinculados ao caso.
- [ ] Dado evidência armazenada, quando o anúncio muda de preço ou sai do ar no marketplace, então a evidência original permanece consultável na ocorrência.
- [ ] Dado uma ocorrência sem captura automática de imagem, quando registro manualmente a evidência, então consigo anexar screenshot ou referência externa ao caso.
- [ ] Dado múltiplas coletas do mesmo anúncio irregular, quando consulto a ocorrência, então vejo o histórico de evidências por data/hora de coleta.

---

## US-18 — Cadastrar empresas e revendedores

Como **analista comercial**, quero **cadastrar parceiros com razão social, CNPJ, contatos, distribuidor, marketplaces, status e produtos comercializados**, para que **eu cruze a base oficial com os anúncios encontrados**.

### Cenários

- [ ] Dado razão social, CNPJ e contatos válidos, quando cadastro um parceiro, então ele fica disponível para vínculo automático com anúncios coletados.
- [ ] Dado um parceiro cadastrado, quando associo distribuidor responsável, marketplaces utilizados e produtos comercializados, então essas informações aparecem no cruzamento com ocorrências.
- [ ] Dado um CNPJ já existente na base, quando tento cadastrar duplicado, então o sistema impede duplicidade ou direciona para edição do registro existente.
- [ ] Dado um parceiro com status inativo, quando encontro novos anúncios seus, então o vínculo mantém visível o status inativo para análise comercial.

---

## US-19 — Regras de PMA e exceções

Como **gestor comercial**, quero **definir, atualizar e historiar PMA por produto/SKU/categoria/período, com exceções de campanha ou cliente autorizado**, para que **promoções válidas não gerem falsa irregularidade e eu saiba qual mínimo valia em cada período**.

### Cenários

- [ ] Dado um PMA por produto ou SKU, quando atualizo o valor, então a nova regra passa a valer a partir da data efetiva configurada, preservando histórico anterior.
- [ ] Dado uma exceção de campanha promocional autorizada com vigência definida, quando comparo preços no período, então anúncios dentro da tolerância acordada não geram irregularidade.
- [ ] Dado uma exceção para cliente ou parceiro específico, quando encontro anúncio seu abaixo do PMA padrão porém dentro da exceção, então classifico como regular ou isento conforme a regra.
- [ ] Dado PMA por categoria ou período histórico, quando consulto ocorrências passadas, então consigo ver qual PMA estava vigente na data da identificação.

---

## US-20 — Controle de advertências e cobrança

Como **analista comercial**, quero **registrar e acompanhar a cobrança/advertência (fluxo Identificada → Enviada → Aguardando correção → Corrigida ou Reincidente), com responsável, observações, prazo, evidências e número da ocorrência**, para que **cada ação comercial fique auditável e nenhum caso fique parado**.

### Cenários

- [ ] Dado uma ocorrência nova, quando inicio o acompanhamento, então o status inicial é **Identificada** com número de ocorrência e responsável atribuível.
- [ ] Dado uma ocorrência identificada, quando envio advertência ao revendedor, então registro data, responsável, observações, prazo para correção e evidências anexadas, mudando o status para **Enviada** ou **Aguardando correção**.
- [ ] Dado prazo de correção vencido sem regularização, quando consulto o caso, então recebo alerta de prazo vencido e o status permanece pendente até ação comercial.
- [ ] Dado correção confirmada por nova coleta ou registro manual, quando encerro o caso, então marco como **Corrigida** com data da correção.
- [ ] Dado nova violação do mesmo revendedor/produto após correção, quando registro o caso, então marco como **Reincidente** e preservo o histórico da advertência anterior.

---

## US-21 — Advertência automática ao revendedor

Como **gestor comercial**, quero **gerar e enviar automaticamente a comunicação de advertência ao revendedor com prazo de correção**, para que **a fiscalização não dependa só do envio manual**.

### Cenários

- [ ] Dado uma ocorrência elegível à advertência automática, quando aciono ou agendo o envio, então gero a comunicação com dados do anúncio, PMA, preço praticado e prazo de correção.
- [ ] Dado contatos de e-mail do parceiro cadastrados, quando envio automaticamente, então a advertência é entregue ao destinatário configurado e o envio fica registrado na ocorrência.
- [ ] Dado ausência de contato válido para o parceiro, quando tento envio automático, então o sistema não envia silenciosamente e sinaliza pendência de contato manual.
- [ ] Dado advertência enviada automaticamente, quando consulto a ocorrência, então vejo comprovante de envio, template utilizado e prazo informado ao revendedor.

---

## US-22 — Ranking de conformidade por distribuidor

Como **gestor comercial**, quero **ver relatórios e ranking de conformidade dos revendedores por distribuidor**, para que **eu acompanhe quem mais viola e quem mantém a política de preço**.

### Cenários

- [ ] Dado ocorrências registradas por revendedores de um distribuidor, quando abro o ranking, então vejo revendedores ordenados por índice de conformidade ou quantidade de violações.
- [ ] Dado um distribuidor selecionado, quando filtro o relatório, então vejo apenas revendedores vinculados àquele distribuidor.
- [ ] Dado um revendedor sem irregularidades no período, quando consulto o ranking, então ele aparece como conforme ou com zero violações no intervalo analisado.
- [ ] Dado reincidências no período, quando gero o relatório por distribuidor, então destaco revendedores com violações repetidas após advertência.

---

## US-23 — Exportar dados filtrados

Como **analista comercial**, quero **exportar ocorrências e anúncios em Excel, CSV ou PDF com filtros por produto, empresa, CNPJ, marketplace, período, status e tipo de ocorrência**, para que **eu compartilhe e analise os dados fora da plataforma**.

### Cenários

- [ ] Dado ocorrências filtradas por produto, empresa, CNPJ, marketplace, período, status ou tipo, quando exporto, então o arquivo contém somente os registros do recorte aplicado.
- [ ] Dado a escolha de formato Excel, CSV ou PDF, quando confirmo a exportação, então recebo o arquivo no formato selecionado com colunas equivalentes à visão filtrada.
- [ ] Dado um conjunto grande de registros, quando exporto, então a operação conclui com arquivo íntegro ou informa limite/ paginação conforme política do sistema.
- [ ] Dado nenhum registro para os filtros escolhidos, quando exporto, então informo que não há dados e não gero arquivo vazio enganoso.

## Próximos passos

→ [`screens.md`](screens.md)
