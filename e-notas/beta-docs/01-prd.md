# notinhas.shop Beta — PRD (Product Requirements Document)

| Campo | Valor |
|---|---|
| Produto | **notinhas.shop** ("O menor preço na ponta da nota") |
| Código / Repositório | `works/e-notas` |
| Versão do documento | 1.0 (2026-11-04) |
| Release alvo | **Beta 1.0** (Laboratório em São José dos Pinhais / Região Metropolitana de Curitiba - PR) |
| Épicos no escopo | **E01** Conta, depósito de NFC-e e vínculo EAN · **E02** Descoberta de preços (comparação, histórico e destaques) · **E03** Geo, ranking e vitrine do estabelecimento · **E04** Cesta de compras, split e gestão financeira pessoal (*Should*) · **ADM** Administração e curadoria |
| Fora do escopo (Beta) | Checkout in-app, gateway de pagamento, operação logística de entrega (CD físico completo), app nativo nas lojas de aplicativos, scraping fora da URL oficial do QR Code da SEFAZ, emissão própria de notas fiscais |
| Fontes canônicas | [Visão geral](../../e-notas/README.md) · [PRD original](../../e-notas/docs/prd.md) · [Requisitos e regras](../../e-notas/docs/requisitos.md) · [DESIGN.md v2](../../e-notas/marca/notinhas.shop.DESIGN.md) · [Identidade visual](../../e-notas/identidade-visual.md) · [App v0.1](../../e-notas/app/README.md) · [Benchmarking de soluções](../../e-notas/marca/benchmarking-solucoes/README.md) · [Comparação com apps de delivery](../../e-notas/marca/comparacao-precos-apps/README.md) |

---

## 1. Resumo executivo

O **notinhas.shop** transforma o **QR Code impresso na nota fiscal de consumidor (NFC-e)** em um **índice público e cooperativo de preços indexado por código de barras (EAN/GTIN)**.

No varejo físico atual, os preços de gôndola são opacos e variam fortemente entre estabelecimentos vizinhos. Os aplicativos de entrega e marketplaces encarecem os produtos com taxas de serviço e intermediação que elevam os preços em 8% a 25% frente ao balcão. Paralelamente, milhões de cupons fiscais são descartados diariamente, contendo preços reais, lojas e datas de emissão.

O desafio central do modelo reside no fato de que **a NFC-e emitida ao consumidor não traz o código de barras (EAN)** dos produtos: a nota contém apenas o código interno da loja, a descrição textual do item e os valores praticados. O **notinhas.shop** resolve essa assimetria através de um **mecanismo colaborativo**:
1. O usuário escaneia ou digita a URL do QR Code da nota fiscal emitida pela SEFAZ;
2. O sistema extrai e deduplica o cupom, estruturando a empresa emissora, a data e os itens;
3. Usuários e lojistas realizam o **vínculo cooperativo do código EAN** via câmera ou digitação, unificando o catálogo entre múltiplos concorrentes;
4. O índice público passa a responder instantaneamente: **onde está o menor preço de balcão de determinado item perto de mim hoje**.

O Beta 1.0 foca na validação do ciclo de ingestão, consolidação do índice geoespacial e engajamento da comunidade no laboratório inicial de **São José dos Pinhais e Curitiba (Paraná)**.

---

## 2. O Problema

1. **Opacidade de preços no varejo físico:** O mesmo produto (ex.: Leite Integral 1L da mesma marca) varia entre R$ 4,19 e R$ 6,89 em supermercados distantes poucas centenas de metros entre si. O comprador só descobre o valor na gôndola ou após passar no caixa.
2. **Dados fiscais subutilizados e descartados:** Cada cupom impresso possui valor legal e atesta uma transação com carimbo de tempo, CNPJ e valor unitário. Esses dados acabam no lixo ou em gavetas sem gerar inteligência coletiva de consumo.
3. **Ausência do código de barras na NFC-e:** Ao contrário da NF-e entre pessoas jurídicas (B2B), o cupom NFC-e ao consumidor final traz apenas o `código interno da unidade` adotado privativamente pelo ERP daquele mercado. Sem uma amarração inteligente a um código universal (EAN-13), é impossível cruzar produtos entre lojas concorrentes de forma automatizada e confiável.
4. **Inflação de canais de marketplace:** Aplicativos como iFood, 99Food, Rappi e similares aplicam margens agressivas sobre os itens de mercearia e restaurante. O consumidor paga mais caro pelo canal digital quando comparado ao preço real praticado na loja física.
5. **Invisibilidade do sortimento do pequeno e médio comércio:** Lojas de bairro, mercearias locais e atacados regionais possuem itens competitivos, mas não têm presença digital ou e-commerce próprio. Suas notas fiscais revelam seu catálogo e seus preços sem que precisem montar operações complexas de TI.

---

## 3. Objetivos do Beta 1.0 e Métricas

O laboratório de validação do Beta 1.0 é estabelecido em **São José dos Pinhais / PR** e na Região Metropolitana de Curitiba, com acompanhamento de metas em uma janela de **8 semanas**:

| # | Objetivo de Negócio | Métrica-Chave e Meta (8 semanas) |
|---|---|---|
| **O1** | Provar a liquidez da ingestão de notas fiscais | ≥ 300 notas fiscais NFC-e válidas ingeridas por semana no lab de SJP. |
| **O2** | Validar o engajamento no vínculo cooperativo de EAN | ≥ 40% dos itens distintos ingeridos associados a um EAN válido via colaboração comunitária. |
| **O3** | Validar a utilidade da busca para o consumidor | ≥ 70% das consultas por texto ou EAN no raio do usuário retornando ≥ 1 ocorrência de preço nos últimos 14 dias. |
| **O4** | Engajar a navegação na vitrine de estabelecimentos | ≥ 1.000 visualizações de páginas de vitrine de lojas locais no período. |
| **O5** | Ativar a retenção de contribuidores | ≥ 25% dos usuários que depositaram 1 nota voltam a depositar outra nota em até 14 dias. |

### North Star Metric (NSM)
> **Notas fiscais ingeridas com ≥ 1 EAN vinculado útil por semana**  
> *(ou alternativamente: Buscas semanais de produtos que entregaram pelo menos um resultado de menor preço no raio).*

### Não-Objetivos do Beta (Won't do)
- **Sem checkout in-app e intermediação financeira:** O Beta não processa pagamentos via Pix, cartão ou boleto. A aplicação informa onde comprar fisicamente e quanto pagar;
- **Sem operação logística de entrega:** Não há contratação ou roteirização de entregadores próprios para entrega domiciliar;
- **Sem aplicativo nativo:** O produto é disponibilizado como **PWA Web responsivo e instalável**, acessível por qualquer navegador moderno sem necessidade de publicação nas lojas Google Play ou Apple App Store;
- **Sem scraping fora da URL do QR Code da SEFAZ:** Não realizamos raspagem não autorizada de sites institucionais de terceiros, folhetos promocionais não estruturados ou redes sociais;
- **Sem emissão ou retificação fiscal:** O sistema é exclusivamente receptor e indexador de consultas já autorizadas pela Fazenda Estadual.

---

## 4. Personas

| Persona | Perfil e Motivação | Papel no Beta | Épicos de Interação |
|---|---|---|---|
| **Contribuinte (Colaborador)** | Cidadão que faz compras rotineiras no supermercado, farmácia ou atacado e recebe o cupom com QR Code. Deseja guardar registro das suas notas, ver quanto gastou e ajudar a comunidade a monitorar os preços da sua vizinhança. | Escaneia o QR Code no app, confere os itens e usa a câmera para ler o código de barras (EAN) das embalagens dos produtos que comprou. | **E01, E04** |
| **Comprador (Consumidor)** | Pessoa que precisa economizar na compra do mês ou na reposição da semana. Busca encontrar o mercado mais barato perto de casa ou do trabalho antes de sair para as compras. | Pesquisa produtos por nome ou código de barras, filtra por proximidade geográfica (raio/bairro), compara preços, consulta o histórico e monta sua cesta de compras. | **E02, E03, E04** |
| **Empresa (Lojista / Parceiro)** | Proprietário ou gerente de supermercado, atacarejo, mercearia ou farmácia local. Quer atrair novos clientes de balcão sem pagar as comissões abusivas dos marketplaces de delivery. | Acompanha sua vitrine gerada pelas notas, verifica sua posição no ranking local de preços e utiliza o feed de destaques para divulgar que seus preços estão mais baixos que a concorrência. | **E02, E03, ADM** |
| **Administrador (Curador)** | Operador da equipe do notinhas.shop responsável pela integridade, confiabilidade e estabilidade da base. | Modera denúncias de preços inconsistentes, audita divergências no vínculo de códigos de barras, unifica cadastros duplicados de empresas e monitora a saúde das integrações com a SEFAZ. | **ADM, E01, E02, E03** |

---

## 5. Escopo Funcional MoSCoW por Épico

A classificação dos requisitos segue o padrão **MoSCoW**:
- **Must (M):** Requisito mandatório para o lançamento do Beta 1.0;
- **Should (S):** Requisito prioritário e de alto valor; entra no Beta se a capacidade técnica permitir ou logo no primeiro patch Beta 1.1;
- **Could (C):** Requisito desejável, mas postergável para releases posteriores;
- **Won't (W):** Fora de cogitação para o ciclo Beta.

---

### 5.1 Épico E01 — Conta, Depósito de NFC-e e Vínculo EAN

Responsável pela entrada de dados no sistema: recebimento do cupom fiscal da SEFAZ, parsing dos dados do XML/HTML da consulta pública, estruturação do emitente e dos itens e criação do vínculo colaborativo com o código de barras internacional (EAN).

| ID | Descrição do Requisito Funcional | Prio |
|---|---|---|
| **RF-E01-01** | **Scan de QR Code via câmera:** O usuário abre o leitor e aponta a câmera do celular para o QR Code da NFC-e, capturando a URL automaticamente sem necessidade de digitação. | **M** |
| **RF-E01-02** | **Depósito por foto ou arquivo:** Permitir upload de imagem da galeria ou captura fotográfica (`capture=environment`) para decodificação offline do QR Code pelo motor do cliente. | **M** |
| **RF-E01-03** | **Depósito por digitação da URL / Chave:** Input manual para colar a URL completa da SEFAZ ou digitar a chave de acesso de 44 dígitos da NFC-e. | **M** |
| **RF-E01-04** | **Validação e sanitização da URL SEFAZ-PR:** O backend valida se a URL pertence aos domínios oficiais da Fazenda Estadual (`fazenda.pr.gov.br/nfce/qrcode`) e rejeita URLs malformadas ou suspeitas. | **M** |
| **RF-E01-05** | **Extração de dados fiscais (Parser Fazenda):** Obtenção do HTML da DANFE da NFC-e e extração de: CNPJ, Razão Social, Nome Fantasia, Endereço, Número da Nota, Série, Data e Hora de Emissão, Chave de Acesso e totais financeiros. | **M** |
| **RF-E01-06** | **Extração dos itens da nota:** Leitura de cada linha de produto: código interno da loja (`codigo_unidade`), descrição textual, quantidade comercial, unidade (UN, KG, CX), valor unitário e valor total. | **M** |
| **RF-E01-07** | **Deduplicação de nota fiscal:** Identificar notas já ingeridas através da `chave_acesso` única; se a nota já existir, não reprocessar nem duplicar observações, retornando status informativo `{ ok: true, created: false }`. | **M** |
| **RF-E01-08** | **Histórico transacional por item:** Cada nova nota de um mesmo estabelecimento gera novas linhas de itens com seus respectivos valores unitários e carimbo da data da nota, garantindo série histórica de preços. | **M** |
| **RF-E01-09** | **Unicidade do item dentro da nota:** Garantir que o par `(nota_id, codigo_unidade)` seja único em banco de dados (`ON CONFLICT DO NOTHING`), evitando duplicatas acidentais na mesma nota. | **M** |
| **RF-E01-10** | **Vínculo cooperativo de EAN (Modal de vinculação):** Permitir que qualquer usuário selecione um item cadastrado na loja e associe o código de barras EAN-13/GTIN lido por leitor de código de barras na câmera ou digitado manualmente. | **M** |
| **RF-E01-11** | **Persistência de mapeamento EAN por loja:** Gravar o vínculo na entidade `codigos_barras` pela chave natural `(empresa_id, codigo_unidade) ↔ codigo_barras`; reenvios atualizam o mapeamento (`UPSERT`). | **M** |
| **RF-E01-12** | **Propagação de EAN retroativo:** Ao vincular um EAN a um par `(empresa_id, codigo_unidade)`, todos os itens históricos já registrados daquela loja com aquele código interno herdam imediatamente a identificação do EAN para efeito de busca. | **M** |
| **RF-E01-13** | **Galeria de fotos do produto por EAN:** Exibir foto padronizada associada ao EAN indexada no repositório de mídia (`/media/ean-fotos/{ean}.jpg`). Se a foto existir, exibi-la nas listas e nos cards de preço. | **M** |
| **RF-E01-14** | **Conta básica de usuário (Auth):** Cadastro e autenticação via e-mail e senha com JWT para permitir ao contribuinte associar suas notas depositadas à sua conta pessoal. | **S** |
| **RF-E01-15** | **Anonimização estrita no índice público:** O índice público de preços e as telas de busca nunca exibem o nome, e-mail ou dados pessoais do usuário que depositou a nota, nem o CPF impresso no cupom. | **M** |
| **RF-E01-16** | **Envio de foto de produto pelo usuário:** Permitir ao usuário enviar uma fotografia da embalagem do produto para compor o acervo do EAN quando não houver foto prévia cadastrada. | **S** |
| **RF-E01-17** | **Feedback em tempo real do processamento:** Indicador de progresso ("Baixando dados da SEFAZ...", "Extraindo itens...", "Nota salva!") na interface durante o depósito. | **M** |
| **RF-E01-18** | **Tratamento de indisponibilidade da SEFAZ:** Notificação clara e amigável em caso de instabilidade, timeout ou bloqueio temporário do portal da Fazenda PR, com opção de enfileirar para reprocessamento. | **S** |
| **RF-E01-19** | **Pontos por contribuição:** Conta cadastrada acumula pontos ao depositar NFC-e e ao vincular EAN (duas contribuições principais; demais ações de retenção conforme regras). | **S** |
| **RF-E01-22** | **Cadastro de IP público:** Em toda operação (depósito, vínculo EAN, listas, auth, etc.), persistir o IP público visto pelo servidor; não confiar em IP informado pelo cliente. | **M** |
| **RF-E01-20** | **Contribuição como crédito de uso:** Saldo/quota de contribuição limita o uso sustentado de listas, cotação, split e menor preço — quem não contribui é pedido a depositar notas e/ou vincular códigos de barras para continuar. | **S** |
| **RF-E01-21** | **Visibilidade e bonificação no estabelecimento:** Com opt-in, a loja vê o que o cliente com conta já comprou ali (via notas) e o saldo de pontos, habilitando bonificação/fidelidade acordada com o estabelecimento. | **S** |

---

### 5.2 Épico E02 — Descoberta de Preços (Comparação, Histórico e Destaques)

Responsável pelo motor de consultas, agregação do menor preço praticado no mercado, rastreabilidade temporal e feed proativo de ofertas competitivas.

| ID | Descrição do Requisito Funcional | Prio |
|---|---|---|
| **RF-E02-01** | **Busca de produtos por texto:** Busca textual com normalização de acentos, minúsculas e pontuação nos nomes dos produtos no catálogo, retornando lista agregada por produto. | **M** |
| **RF-E02-02** | **Busca direta por código de barras (EAN):** Leitura via scanner óptico na busca ou digitação numérica do EAN, retornando a ficha exata do produto e os preços praticados no mercado. | **M** |
| **RF-E02-03** | **Identificação do menor preço global:** Na lista de resultados e na tela do produto, o menor preço observado no raio é destacado com tipografia de destaque, cor verde institucional (`#00984B`) e badge "Menor Preço". | **M** |
| **RF-E02-04** | **Exibição contextualizada (Loja + Data da Nota):** Toda ocorrência de preço exibida na interface é obrigatoriamente acompanhada do Nome do Estabelecimento e da Data/Hora de Emissão da nota original. | **M** |
| **RF-E02-05** | **Comparação cross-loja por EAN:** Exibição lado a lado de todos os estabelecimentos que venderam aquele EAN na janela de tempo ativa (últimos 14 dias), ordenados do menor para o maior preço. | **M** |
| **RF-E02-06** | **Busca secundária por descrição (sem EAN):** Quando o item ainda não possuir EAN vinculado, permitir a busca por descrição textual na loja, exibindo aviso de "preço da loja / sem vínculo universal confirmado". | **M** |
| **RF-E02-07** | **Histórico de preços temporal:** Gráfico ou linha do tempo de evolução do preço unitário de um determinado EAN ao longo do tempo (por estabelecimento ou média de mercado). | **M** |
| **RF-E02-08** | **Filtro de frescor da informação:** Filtro rápido por período da observação fiscal: "Últimas 24h", "Últimos 7 dias", "Últimos 14 dias" (padrão) e "Últimos 30 dias". | **M** |
| **RF-E02-09** | **Feed de Destaques de Concorrência:** Seção pública na página inicial exibindo itens cujo preço registrado recentemente ficou expressivamente abaixo do preço de referência da região (concorrência agressiva). | **M** |
| **RF-E02-10** | **Cálculo automático do gatilho de destaque:** O sistema aciona o selo "Destaque" se o preço registrado for no mínimo 5% E pelo menos R$ 0,50 inferior à mediana de preços daquele EAN nos últimos 14 dias no raio. | **M** |
| **RF-E02-11** | **Filtro por categoria de produto:** Navegação simplificada por categorias básicas deduzidas da descrição dos itens (Mercearia, Bebidas, Laticínios, Limpeza, Hortifruti, Açougue). | **S** |
| **RF-E02-12** | **Alerta de variação abusiva:** Indicação visual caso um preço registrado esteja com valor fora do padrão estatístico do produto (possível erro de digitação de unidade ou quilo vs grama). | **S** |
| **RF-E02-13** | **Compartilhamento de preço (WhatsApp / Redes):** Geração de link canônico com metatags Open Graph (título, foto, menor preço, loja) para prévia visual rica em compartilhamentos no WhatsApp. | **M** |
| **RF-E02-14** | **Ordenação por menor preço vs distância:** Na tela de resultados da busca, permitir alternar a ordenação entre menor valor financeiro absoluto ou menor distância física em quilômetros. | **M** |
| **RF-E02-15** | **Preço de balcão declarado:** Indicação visual explicativa de que os preços exibidos refletem notas fiscais de balcão físico, sem taxas adicionais de entrega ou sobretaxas de aplicativos de terceiros. | **M** |

---

### 5.3 Épico E03 — Geo, Ranking e Vitrine do Estabelecimento

Responsável pela dimensão territorial do consumo: visualização espacial dos estabelecimentos, catálogo de sortimento local gerado pelas notas e classificação de estabelecimentos mais baratos e mais caros da região.

| ID | Descrição do Requisito Funcional | Prio |
|---|---|---|
| **RF-E03-01** | **Geocodificação de endereços fiscais:** O sistema normaliza o endereço cadastrado da empresa na DANFE e consulta o Nominatim/OSM em segundo plano, gravando latitude e longitude no registro da empresa. | **M** |
| **RF-E03-02** | **Busca geoespacial "Onde comprar perto":** Pesquisar produto informando a localização atual do usuário (via GPS do navegador) ou um ponto de referência manual (bairro, centro da cidade). | **M** |
| **RF-E03-03** | **Filtro por raio de distância:** Seletor de raio de busca dinâmico (ex.: 2 km, 5 km, 10 km, 20 km) a partir do ponto central selecionado. | **M** |
| **RF-E03-04** | **Mapa interativo de estabelecimentos:** Exibição de mapa baseado em Leaflet / OpenStreetMap com pins marcando a localização geográfica dos estabelecimentos que possuem notas registradas. | **M** |
| **RF-E03-05** | **Foco e enquadramento dinâmico no mapa:** Ao selecionar uma loja específica, o mapa aplica zoom suave e centraliza no pin correspondente, abrindo popup com detalhes e atalho para vitrine. | **M** |
| **RF-E03-06** | **Vitrine digital do estabelecimento (Página da Loja):** Página pública dedicada ao estabelecimento contendo endereço completo, CNPJ, distância, mapa e grade completa de produtos observados naquelas notas. | **M** |
| **RF-E03-07** | **Exposição do sortimento local fora da web:** Apresentar na vitrine os itens físicos de balcão que não estão anunciados na internet, categorizados e pesquisáveis dentro do acervo daquela loja. | **M** |
| **RF-E03-08** | **Card de produto na vitrine:** Cada produto na vitrine exibe nome, EAN, último preço praticado, data da nota mais recente e badge "Menor Preço da Região" caso a loja lidere a oferta daquele item. | **M** |
| **RF-E03-09** | **Busca interna na vitrine da loja:** Campo de filtro instantâneo para pesquisar rapidamente itens dentro da vitrine de uma empresa específica. | **M** |
| **RF-E03-10** | **Ranking de lojas no raio (Mais Baratas / Mais Caras):** Tela dedicada que lista todos os supermercados dentro do raio selecionado ordenados pelo seu índice agregado de preços. | **M** |
| **RF-E03-11** | **Cálculo do Score de Preço Agregado:** O score da loja é computado calculando a razão média ponderada entre o preço praticado pela loja e a mediana regional para todos os EANs com dados nos últimos 14 dias. | **M** |
| **RF-E03-12** | **Filtro de cobertura mínima no ranking:** Excluir do ranking lojas que tenham menos de N itens distintos observados no período (ex.: mínimo de 5 EANs comuns), garantindo relevância estatística. | **M** |
| **RF-E03-13** | **Transparência metodológica do ranking:** Exibição de texto explicativo no ranking informando a quantidade de notas analisadas, o período considerado e a nota metodológica de que se trata de observações fiscais. | **M** |
| **RF-E03-14** | **Rota no mapa externo:** Botão "Como chegar" na vitrine que abre a localização da loja diretamente no Google Maps, Apple Maps ou Waze instalado no dispositivo do usuário. | **M** |
| **RF-E03-15** | **Horário e status de funcionamento (quando disponível):** Exibição de dados operacionais básicos obtidos via cadastro da empresa. | **C** |
| **RF-E03-16** | **Badge de verificação de empresa parceira:** Selo diferenciado para estabelecimentos que validaram seu cadastro institucional com o suporte do notinhas.shop. | **S** |
| **RF-E03-17** | **Progresso da loja (notas / itens / EAN):** Em cards da lista, popup do mapa e cabeçalho da vitrine: barra e contagens do que já foi concluído (notas ingeridas, itens com EAN) e do que falta (itens sem código de barras). REQ-046. | **M** |

---

### 5.4 Épico E04 — Cesta de Compras, Split e Gestão Financeira Pessoal (Should)

Recursos avançados para maximizar a economia do consumidor, permitindo cotar listas completas de compras, simular economia dividindo itens entre lojas e gerenciar o orçamento doméstico a partir das notas fiscais arquivadas.

| ID | Descrição do Requisito Funcional | Prio |
|---|---|---|
| **RF-E04-01** | **Minhas listas (várias):** O usuário cria e mantém **múltiplas** listas de compras; em cada uma adiciona produtos com quantidades. Persistência no servidor (fingerprint se anônimo; conta após merge — REQ-050). | **S** |
| **RF-E04-02** | **Cotação sem split (por loja):** Para a lista ativa, calcular o total em cada estabelecimento com cobertura; comparar lojas lado a lado (totais e ranking do mais barato ao mais caro levando tudo numa só loja). | **S** |
| **RF-E04-03** | **Indicador de cobertura da lista:** Mostrar quantos itens foram encontrados em cada mercado (ex.: "12 de 15 — Total R$ 142,30"). | **S** |
| **RF-E04-04** | **Cotação com split:** Algoritmo de montagem apartada dividindo a lista entre 2+ estabelecimentos para o menor custo global. | **S** |
| **RF-E04-05** | **Redução com split:** Exibir o cenário mais barato com split e a **redução** (R$ e %) vs melhor loja única sem split; deixar explícito o que vai em cada loja. | **S** |
| **RF-E04-06** | **Itens sem preço:** Não inventar valores; alertar ausência de cotação e total parcial com cobertura real. | **S** |
| **RF-E04-07** | **Minhas notas / minhas compras:** Toda nota lida/depositada fica no histórico pessoal (fingerprint ou `usuario_id`); listagem cronológica acessível na seção Minhas notas — login **não** obrigatório. | **S** |
| **RF-E04-08** | **Detalhe da nota:** Abrir o cupom com itens, quantidades e valores da época. | **S** |
| **RF-E04-09** | **Gasto mensal consolidado:** Totais por mês a partir das notas registradas para aquele visitante/usuário. | **S** |
| **RF-E04-10** | **Ranking de lojas onde mais gasta:** Distribuição percentual das despesas entre estabelecimentos visitados. | **S** |
| **RF-E04-11** | **Exportação do extrato:** CSV/JSON das compras pessoais. | **C** |
| **RF-E04-12** | **Isolamento:** Extrato e listas só do titular (fingerprint ou sessão); índice público sem identidade do contribuinte. | **S** |

---

### 5.5 Épico ADM — Administração, Curadoria e Métricas

Módulos de retaguarda para assegurar a consistência dos dados, moderação de conteúdos e monitoramento da infraestrutura do laboratório Beta.

| ID | Descrição do Requisito Funcional | Prio |
|---|---|---|
| **RF-ADM-01** | **Painel administrativo seguro:** Rota administrativa com autenticação restrita para a equipe interna de operação do notinhas.shop. | **M** |
| **RF-ADM-02** | **Fila de auditoria de divergências de EAN:** Listagem de casos onde usuários reportaram ou registraram múltiplos EANs conflitantes para o mesmo `codigo_unidade` em uma empresa, permitindo mediação. | **M** |
| **RF-ADM-03** | **Unificação e mesclagem de empresas:** Ferramenta para associar filiais ou unificar registros de estabelecimentos criados com pequenas divergências textuais no nome ou endereço. | **M** |
| **RF-ADM-04** | **Moderação de preços e exclusão de anomalias:** Possibilidade de desativar observações de preços corrompidas, decorrentes de notas de devolução, cancelamento ou erro comprovado de leitura da SEFAZ. | **M** |
| **RF-ADM-05** | **Disparo manual de geocodificação pendente:** Endpoint e botão no painel para reprocessar a geocodificação de empresas que falharam na consulta inicial ao Nominatim. | **M** |
| **RF-ADM-06** | **Dashboard de métricas operacionais:** Visualização em tempo real de: notas depositadas no dia/semana, total de itens processados, taxa de cobertura de EAN e status de latência com a SEFAZ-PR. | **M** |
| **RF-ADM-07** | **Gerenciamento do acervo de imagens de EAN:** Visualização e substituição de imagens de produtos armazenadas no repositório de mídia do sistema. | **S** |
| **RF-ADM-08** | **Logs e auditoria de ações sensíveis:** Registro em banco de dados de todas as intervenções manuais executadas por administradores em cadastros de lojas ou exclusões de observações fiscais. | **M** |

---

## 6. Regras de Negócio (RN)

As regras abaixo são de cumprimento mandatório em todas as camadas da aplicação (banco de dados, serviços e interface do usuário):

- **RN-01 — URL Canônica e Origem Fiscal Obrigatória:**  
  Apenas URLs emitidas por portais governamentais de consulta pública de NFC-e autorizados são aceitas para ingestão. No Beta 1.0, o foco é a Fazenda Estadual do Paraná (`fazenda.pr.gov.br/nfce/qrcode`). Qualquer URL de domínio desconhecido ou fora do padrão é sumariamente rejeitada com código `422 Unprocessable Entity`.

- **RN-02 — Ausência de EAN na Nota Fiscal e Desacoplamento do Vínculo:**  
  A aplicação reconhece formalmente que a NFC-e do consumidor **não contém** o código de barras internacional (EAN/GTIN) do produto. O vínculo entre o código interno da loja (`codigo_unidade`) e o `codigo_barras` universal é estabelecido de forma colaborativa por intervenção do usuário ou do lojista. Nenhuma tela ou documentação deve sugerir que o código de barras veio impresso no cupom.

- **RN-03 — Deduplicação Estrita por Chave de Acesso:**  
  A chave primária de identificação unívoca de um documento fiscal é a sua `chave_acesso` de 44 dígitos numéricos. Uma mesma nota jamais é reinserida no banco de dados. Caso um segundo usuário escaneie uma nota já existente, o sistema não gera novos registros nem altera valores passados, retornando mensagem de confirmação de que a nota já integrava o índice.

- **RN-04 — Unicidade do Item na Nota e Série Histórica Confiável:**  
  Dentro de uma mesma nota fiscal, a chave natural de um item é o par `(nota_id, codigo_unidade)`. Não são permitidas tuplas duplicadas na mesma nota. Por outro lado, a ocorrência do mesmo código em notas emitidas em datas ou horários diferentes pelo mesmo estabelecimento é obrigatoriamente persistida, formando a série histórica de flutuação de preço.

- **RN-05 — Menor Preço Obrigatoriamente Contextualizado:**  
  Nenhum preço pode ser exibido isoladamente como valor monetário solto. Todo menor preço divulgado no notinhas.shop é obrigatoriamente acompanhado do **Nome do Estabelecimento Emissor**, do **Bairro/Cidade** e da **Data e Hora de Emissão** constante na nota fiscal.

- **RN-06 — Anonimização Completa do Contribuinte no Índice Público:**  
  Os dados pessoais do titular da compra (CPF, nome do consumidor constante na DANFE, identificador de usuário no sistema, endereço residencial) são permanentemente expurgados antes da geração do índice público de preços. Nenhuma consulta pública permite identificar quem comprou o produto.

- **RN-07 — HTTPS Obrigatório de Ponta a Ponta:**  
  Toda a comunicação do cliente com a API deve trafegar exclusivamente sob protocolo seguro TLS/HTTPS. Origens inseguras (HTTP puro) não têm acesso aos recursos de câmera no navegador (HTML5 getUserMedia) e são terminantemente bloqueadas por redirecionamento 301 no servidor proxy reverso.

- **RN-08 — Preço de Balcão Não se Mistura com Canal de Delivery:**  
  O índice de preços do notinhas.shop é lastreado em vendas presenciais de balcão (NFC-e). Dados oriundos de plataformas de entrega de terceiros (iFood, 99Food, Rappi), caso adicionados no futuro para comparação, devem obrigatoriamente carregar etiqueta destacada de canal e jamais podem ser integrados à série histórica de preços físicos sem consentimento explícito.

- **RN-09 — Âncora Geográfica e Raio de Proximidade:**  
  As buscas por proximidade utilizam como âncora a coordenada geográfica fornecida pelo GPS do cliente (com permissão explícita) ou, na ausência desta, as coordenadas centrais do bairro ou município selecionado. Estabelecimentos sem coordenadas cadastradas válidas são omitidos do filtro de proximidade até que ocorra sua geocodificação.

- **RN-10 — Metodologia do Ranking Agregado de Estabelecimentos:**  
  O nível de preço de uma loja no raio de busca não pode ser distorcido por um único item barato ou caro. O cálculo deve comparar os preços praticados pela loja com a mediana regional dos mesmos EANs comercializados em uma janela móvel de 14 dias, exigindo cobertura mínima de pelo menos 5 produtos com ocorrências concorrentes.

- **RN-11 — Gatilho de Ativação de Destaques de Preço:**  
  Um produto entra automaticamente no feed de Destaques de Concorrência quando uma nova observação fiscal apresentar preço unitário no mínimo 5% abaixo e com diferença absoluta de pelo menos R$ 0,50 frente à mediana regional dos últimos 14 dias para o respectivo EAN.

- **RN-12 — Resolução de Vínculo EAN por Loja:**  
  O mapeamento do código interno para o EAN é persistido na entidade `codigos_barras` por `(empresa_id, codigo_unidade)`. Um novo vínculo submetido por usuário substitui o mapeamento local (`UPSERT`). Caso ocorra conflito recorrente entre múltiplos usuários para a mesma unidade, o item é marcado com flag para auditoria administrativa mantendo o vínculo original ativo.

- **RN-13 — Não-Interpolação de Valores na Cesta de Compras:**  
  Ao cotar uma cesta de compras com múltiplos itens, o sistema jamais infere, inventa ou estima preços para produtos que não foram observados recentemente em um determinado mercado. Caso a loja não tenha registro daquele EAN, a interface deve indicar explicitamente "Item não cotado nesta loja", exibindo o total parcial com a cobertura real.

- **RN-14 — Privacidade Estrita do Extrato e das Listas:**  
  Extrato (**Minhas notas**), gasto pessoal e **Minhas listas** só são acessíveis ao titular: sessão autenticada **ou** o mesmo fingerprint que criou os registros. Nenhuma API pública nem outro usuário vê o volume financeiro ou os itens privados de terceiros.

- **RN-15 — Tolerância a Falhas e Timeouts da SEFAZ:**  
  Requisições de consulta pública ao portal da Fazenda PR devem respeitar limite de tempo estrito (timeout de 10 segundos). Se a SEFAZ responder com lentidão excessiva, erro 500 ou tela de captcha inesperada, o sistema deve fornecer resposta clara ao usuário e disponibilizar a opção de tentar novamente sem travar a navegação.

---

## 7. Riscos e Estratégias de Mitigação

| # | Risco Identificado | Severidade | Probabilidade | Estratégia de Mitigação no Beta 1.0 |
|---|---|---|---|---|
| **R1** | **Mudança estrutural no HTML da DANFE da Fazenda PR:** A SEFAZ atualizar o leiaute do portal de consulta pública da NFC-e, quebrando os seletores do parser Cheerio. | Alta | Média | Modularizar o parser `fazenda-pr.js` atrás de uma interface isolada com testes automatizados contra fixtures HTML gravadas. Criar alertas no log para falhas consecutivas de extração. |
| **R2** | **Vínculos incorretos ou maliciosos de EAN:** Usuários cadastrarem códigos de barras errados para códigos internos de produtos, poluindo a comparação de preços. | Média | Alta | Exibir o nome original do produto na nota e o nome oficial do produto no EAN no modal de vínculo para conferência visual. Implementar fila de auditoria administrativa no épico ADM. |
| **R3** | **Bloqueio de IP por taxa excessiva de requisições na SEFAZ:** A Fazenda PR aplicar rate-limit ou bloqueio temporário do IP da VPS Contabo decorrente de picos de consultas públicas. | Alta | Baixa | Adotar cabeçalhos HTTP normatizados de navegador, espaçamento mínimo entre requisições simultâneas e cache inteligente por chave de acesso para nunca consultar a Fazenda duas vezes para a mesma nota. |
| **R4** | **Baixa densidade de dados no início (cold start):** Usuários buscarem produtos na região e encontrarem poucos ou nenhum resultado de preço. | Alta | Alta | Concentrar todo o piloto do Beta no polígono geográfico de São José dos Pinhais / PR, com alimentação ativa da equipe e de parceiros locais nas primeiras 3 semanas para atingir massa crítica. |
| **R5** | **Erros na geocodificação de endereços fiscais:** O Nominatim falhar em localizar com exatidão endereços cadastrados na SEFAZ com complementos abreviados ou numeração predial zero. | Média | Média | Normalização prévia do endereço (remoção de `, 0,` e complementos poluídos) antes da chamada ao Nominatim; permissão de correção manual de coordenadas via painel administrativo. |
| **R6** | **Dificuldade de leitura de QR Code em câmeras de entrada:** Usuários com celulares modestos ou lentes engorduradas terem atrito para ler o QR Code da nota impressa. | Média | Média | Disponibilização paralela do botão "Tirar Foto" e "Escolher Imagem da Galeria", além do campo de entrada de texto para colar a URL ou digitar a chave de 44 dígitos. |

---

## 8. Perguntas em Aberto e Propostas Padrão

| ID | Tema | Pergunta Central | Proposta Padrão Adotada no Beta 1.0 |
|---|---|---|---|
| **Q1** | **Exigência de Login** | O usuário deve ser obrigado a criar conta para escanear notas, consultar preços, ver Minhas notas ou Minhas listas? | **Não no primeiro uso.** Fingerprint cobre posse anônima (REQ-050 / REQ-051). Conta habilita **pontos**, visibilidade na loja e merge. Uso sustentado de listas/menor preço exige **contribuir** (NFC-e + EAN) — REQ-052 / RF-E01-19..21. |
| **Q2** | **Governança de Vínculo EAN** | O que fazer quando dois usuários informarem EANs distintos para o mesmo produto da mesma loja? | **Prevalência do último com flag de divergência.** O sistema aceita a nova vinculação e dispara um registro no painel de administração para que o curador avalie qual código corresponde de fato ao produto físico. |
| **Q3** | **Janela Temporal do Índice** | Qual é o prazo de validade de um preço registrado na nota antes de ser considerado "frio"? | **Janela ativa de 14 dias.** Itens registrados há mais de 14 dias continuam visíveis no histórico da loja, mas recebem etiqueta visual de "Preço não confirmado recentemente" nas buscas principais. |
| **Q4** | **Extensão Espacial no Banco** | É indispensável instalar e operar o PostGIS completo na VPS do Beta? | **Não para o Beta 1.0.** Para as poucas dezenas de estabelecimentos do laboratório de São José dos Pinhais, a fórmula matemática de Haversine executada em SQL ou no código Node.js atende com excelência e menor complexidade operacional. O PostGIS é planejado para a escala nacional. |
| **Q5** | **Calibração dos Destaques** | Qual percentual de desconto qualifica um produto como destaque na home? | **Queda ≥ 5% e valor absoluto ≥ R$ 0,50** frente à mediana dos últimos 14 dias para o mesmo EAN na região geográfica considerada. |
| **Q6** | **Tratamento de Itens Sem EAN** | Como apresentar na busca produtos que ainda não possuem código de barras vinculado? | **Exibição por agrupamento textual de menor confiança.** O produto é exibido com um aviso visual chamando a comunidade para realizar o scan do código de barras ("Ajude a comunidade vinculando o código de barras deste produto"). |

---

## 9. Proposta de Evolução Técnica e Arquitetura

O laboratório de prototipagem funcional foi concebido em uma base enxuta com Node.js (ESM), Express e PostgreSQL no schema `enotas`.

Para o Beta 1.0, adota-se a seguinte estratégia arquitetural (verificada em detalhes no [03-arquitetura.md](03-arquitetura.md) e no [ADR-003](04-adrs.md#adr-003)):
1. **Preservação e Modularização do Express no Beta 1.0:** Em vez de realizar uma reescrita prematura para o framework NestJS, o Beta 1.0 organiza a base existente em um **monólito modular** com módulos bem delimitados (`ingest`, `barcode`, `search`, `geo`, `ranking`, `highlights`, `basket`, `finance`, `auth`, `admin`).
2. **Camadas Claras:** Separação explícita entre rotas HTTP, controladores, casos de uso de aplicação e repositórios de dados no banco.
3. **Persistência Estável:** Manutenção do pool de conexões do driver nativo `pg` conectando ao PostgreSQL da Contabo no schema `enotas`, garantindo transações atômicas na ingestão.
4. **Futuro em NestJS:** A migração completa para NestJS fica mapeada como candidata natural para o ciclo 1.1 / 2.0 caso a equipe técnica necessite de injeção de dependência avançada e contratos OpenAPI gerados por decorators quando do lançamento multi-regional.
