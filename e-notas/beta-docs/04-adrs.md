# Architecture Decision Records (ADRs) — notinhas.shop Beta 1.0

Registro canônico de decisões de arquitetura e engenharia tomadas para a construção do **notinhas.shop Beta 1.0** (código e repositório: `e-notas`).

Formato adotado: **Contexto → Decisão → Consequências → Alternativas descartadas**.  
Novas decisões devem ser adicionadas como novos ADRs, mantendo o histórico de decisões imutável.

---

## Índice de Decisões

| # | Título da Decisão | Status |
|---|---|---|
| [ADR-001](#adr-001) | PWA mobile-first no tema Light institucional (rejeição do Dark RoleGo) | Aceito |
| [ADR-002](#adr-002) | Manutenção do PostgreSQL Contabo no schema dedicado `enotas` | Aceito |
| [ADR-003](#adr-003) | Monólito modular Express + Node.js (ESM) para o Beta (sem reescrita imediata em NestJS) | Aceito |
| [ADR-004](#adr-004) | Ingestão de NFC-e estritamente via URL canônica do QR Code (Fazenda PR prioritária) | Aceito |
| [ADR-005](#adr-005) | Vínculo cooperativo do código de barras (EAN) dissociado do arquivo da nota fiscal | Aceito |
| [ADR-006](#adr-006) | Autenticação simples baseada em JWT e Refresh Token rotativo para o Beta | Aceito |
| [ADR-007](#adr-007) | Servidor de e-mail transacional dedicado com Mailcow em `mail.notinhas.shop` | Aceito |
| [ADR-008](#adr-008) | Índice público de preços 100% dissociado da identidade do contribuinte | Aceito |
| [ADR-009](#adr-009) | Ausência de checkout in-app e intermediação logística no Beta 1.0 | Aceito |
| [ADR-010](#adr-010) | Geolocalização via Nominatim com normalização de endereço e coordenadas `lat`/`lng` | Aceito |
| [ADR-011](#adr-011) | Ranking agregado de estabelecimentos por desvio da mediana regional | Aceito |
| [ADR-012](#adr-012) | Feed de destaques ativado por limiar estatístico de preço abaixo da referência | Aceito |
| [ADR-013](#adr-013) | Armazenamento local de fotografias de produtos indexadas por EAN (`ean-fotos`) | Aceito |
| [ADR-014](#adr-014) | Resoluções e comportamentos padrão para as perguntas em aberto do PRD | Aceito |

---

<a id="adr-001"></a>
## ADR-001 — PWA mobile-first no tema Light institucional (rejeição do Dark RoleGo)

- **Contexto:** O notinhas.shop é um serviço utilitário voltado a cidadãos e consumidores cotidianos de supermercado e farmácia. Enquanto projetos como o RoleGo adotam estética noturna, dark mode carregado e detalhes neon voltados a entretenimento e baladas, o notinhas.shop lida com dados de consumo, finanças domésticas e notas fiscais públicas, onde a clareza visual, a legibilidade sob luz solar intensa e a sobriedade transmitem credibilidade.
- **Decisão:** Construir a interface do Beta 1.0 como uma **Progressive Web App (PWA) mobile-first**, com layout estritamente no **tema Light institucional** normatizado no [`notinhas.shop.DESIGN.md`](../marca/notinhas.shop.DESIGN.md): canvas em tom névoa (`#F5F7FA`), superfícies em branco puro (`#FFFFFF`), bordas ultra-finas (`#D5DEE8`), tipografia Plus Jakarta Sans com numerais tabulares em valores monetários, azul institucional (`#0069B4`) como única voltagem de botão de ação (CTA) e verde semântico (`#00984B`) reservado exclusivamente para o Menor Preço e estados de sucesso. O viewport escuro é tolerado unicamente na tela de captura contínua da câmera no leitor óptico.
- **Consequências:**
  - *(+) Positivas:* Alta confiança institucional semelhante a portais públicos governamentais (Nota Paraná / Menor Preço); perfeita leitura sob luz ambiente de supermercado; facilidade de uso em celulares de entrada sem dependência de instalação via app stores.
  - *(−) Negativas:* Requer cuidado na gestão de contraste de elementos claros e abandona apelo estético para usuários que preferem dark mode global no sistema operacional.
- **Alternativas descartadas:**
  - *Tema escuro/futurista com gradientes neon (estilo RoleGo/Linear):* Testado no laboratório (commit pré-`cb9b0d4`) e expressamente revogado pelo REQ-028 devido à inadequação com o perfil utilitário do produto.
  - *App nativo em Flutter / React Native:* Rejeitado para o Beta devido aos custos de publicação nas lojas (Apple/Google) e atrito de download.

---

<a id="adr-002"></a>
## ADR-002 — Manutenção do PostgreSQL Contabo no schema dedicado `enotas`

- **Contexto:** A infraestrutura de produção na VPS Contabo já conta com uma instância do PostgreSQL 16 ativa atendendo ao ecossistema corporativo. O laboratório de desenvolvimento validou com sucesso a coexistência pacífica do banco criando um schema isolado denominado `enotas`.
- **Decisão:** Manter a persistência de dados do Beta 1.0 no **PostgreSQL da Contabo**, operando dentro do schema dedicado **`enotas`** no banco de dados corporativo `connectmax`. Manter e evoluir a estrutura relacional das tabelas `empresas`, `notas`, `itens` e `codigos_barras`, utilizando o driver nativo `pg` (node-postgres) com pool de conexões gerenciado.
- **Consequências:**
  - *(+) Positivas:* Custo zero adicional de infraestrutura; confiabilidade transacional ACID comprovada; facilidade de rotinas de backup unificadas na VPS; isolamento total das tabelas de outros sistemas corporativos via schema; queries com joins relacionais eficientes para cruzamento de itens e lojas.
  - *(−) Negativas:* Compartilhamento de recursos de CPU e I/O com outros serviços na mesma VPS Contabo, exigindo monitoramento preventivo de consultas lentas e manutenção de índices B-Tree adequados.
- **Alternativas descartadas:**
  - *Bancos NoSQL (MongoDB / DynamoDB):* Descartados pela necessidade de integridade referencial rígida entre notas fiscais, estabelecimentos e itens, além da facilidade de agregação matemática em SQL.
  - *Migração para SQLite local:* Descartada por inviabilizar concorrência robusta de conexões e histórico corporativo multi-usuário.

---

<a id="adr-003"></a>
## ADR-003 — Monólito modular Express + Node.js (ESM) para o Beta (sem reescrita imediata em NestJS)

- **Contexto:** O protótipo funcional de laboratório (`app/server.js`) foi escrito em Node.js com Express e ES Modules (ESM), demonstrando alta velocidade de execução, simplicidade de deploy e baixo consumo de memória. Surgiu a proposta de refatorar a aplicação inteira para o framework NestJS (como no RoleGo).
- **Decisão:** Manter o **Express.js em Node.js (ESM)** como monólito modular para o Beta 1.0, organizando o código da aplicação em módulos funcionais isolados (`src/modules/{ingest, barcode, search, geo, ranking, highlights, basket, finance, auth, admin}`) com separação clara de responsabilidades (rotas, controllers, services e repositórios SQL). A migração estrutural para NestJS é postergada para a release pós-Beta (versão 1.1/2.0), caso surja necessidade comprovada de injeção de dependência complexa ou suporte corporativo a múltiplos microsserviços.
- **Consequências:**
  - *(+) Positivas:* Aproveitamento imediato de 100% da lógica de negócio já testada e homologada no lab; ciclo de inicialização quase instantâneo; consumo de memória RAM inferior a 80 MB (essencial para a VPS compartilhada); ausência de complexidade com decorators ou TypeScript compilation overhead durante o piloto.
  - *(−) Negativas:* Exige disciplina manual rigorosa da equipe e dos agentes de IA para não acoplar código entre módulos e respeitar as fronteiras arquiteturais sem a imposição de regras rígidas de compilação do NestJS.
- **Alternativas descartadas:**
  - *Reescrita imediata em NestJS 11:* Descartada por representar atraso de várias semanas no cronograma de validação de mercado em São José dos Pinhais sem ganho funcional perceptível para o usuário final.
  - *Frameworks serverless (AWS Lambda / Cloudflare Workers):* Incompatíveis com a infraestrutura dedicada fixa já contratada na Contabo e com a gestão de estado do pool de conexões PostgreSQL.

---

<a id="adr-004"></a>
## ADR-004 — Ingestão de NFC-e estritamente via URL canônica do QR Code (Fazenda PR prioritária)

- **Contexto:** Para criar o índice de preços, o sistema precisa de dados fiscais reais e fidedignos. A digitação manual de preços por usuários abriria brecha incontrolável para vandalismo, spams e erros. Por outro lado, fazer scraping de e-commerces violaria termos de serviço e geraria preços inflacionados de canal digital.
- **Decisão:** Definir que a **URL oficial do QR Code da NFC-e** emitida pelos portais estaduais da SEFAZ é o único canal de entrada de preços no Beta 1.0. Priorizar no piloto o suporte completo ao portal da **Fazenda do Estado do Paraná** (`fazenda.pr.gov.br/nfce/qrcode`). O backend busca diretamente o HTML da consulta pública e extrai os dados oficiais via Cheerio.
- **Consequências:**
  - *(+) Positivas:* 100% dos preços do sistema são legalmente comprovados por uma nota fiscal real autorizada pela Fazenda; risco nulo de dados fraudados na origem; ingestão instantânea de dezenas de itens com um único scan.
  - *(−) Negativas:* Dependência da estabilidade dos servidores da SEFAZ-PR; vulnerabilidade a eventuais mudanças de leiaute do HTML da DANFE da Fazenda Estadual; restrição territorial inicial ao estado do Paraná.
- **Alternativas descartadas:**
  - *Cadastro manual de preços por usuários:* Rejeitado pela impossibilidade de auditar a veracidade dos dados sem o documento fiscal.
  - *Scraping de folhetos ou redes sociais de supermercados:* Rejeitado pela falta de padronização, fragilidade jurídica e ausência de identificação precisa da loja e da data.

---

<a id="adr-005"></a>
## ADR-005 — Vínculo cooperativo do código de barras (EAN) dissociado do arquivo da nota fiscal

- **Contexto:** O modelo de dados fiscal da NFC-e (ao contrário da NF-e entre empresas) não contém o código de barras internacional (EAN-13/GTIN) dos produtos comercializados. O cupom apresenta apenas uma descrição textual livre e um código interno numérico adotado privativamente pelo ERP daquele mercado (`codigo_unidade`).
- **Decisão:** Implementar o **vínculo cooperativo de EAN** como uma camada independente de dados mantida em colaboração comunitária. Persistir em `enotas.codigos_barras` o mapeamento entre `(empresa_id, codigo_unidade)` e o `codigo_barras` EAN-13. Quando um usuário vincula o código de barras de um produto via leitor óptico ou formulário, essa associação enriquece retroativamente e prospectivamente todos os itens cadastrados daquela loja.
- **Consequências:**
  - *(+) Positivas:* Permite comparar o mesmo produto físico entre supermercados concorrentes com precisão cirúrgica de código universal; dispensa acordos formais com departamentos de TI dos varejistas; transforma a base de usuários em agentes ativos de catalogação.
  - *(−) Negativas:* Possibilidade de usuários vincularem códigos de barras errados por desatenção, exigindo ferramentas de moderação e auditoria posterior.
- **Alternativas descartadas:**
  - *Matching de produtos exclusivamente por similaridade de texto:* Descartada devido à enorme divergência de abreviações usadas pelos supermercados (ex.: "LEIT INT PIRAC 1L" vs "LT PIRACANJ IN 1000ML"), o que geraria falsos positivos e comparações inconsistentes.

---

<a id="adr-006"></a>
## ADR-006 — Autenticação simples baseada em JWT e Refresh Token rotativo para o Beta

- **Contexto:** A navegação básica, busca de preços e o próprio escaneamento de notas fiscais são recursos públicos no Beta 1.0. No entanto, funcionalidades como Cesta de Compras e Gestão Financeira Pessoal (extrato de notas) exigem identificação de usuário.
- **Decisão:** Implementar autenticação enxuta e segura baseada em **Access Token JWT de curta duração (15 minutos)** e **Refresh Token opaco persistido no banco com rotação a cada renovação**. O envio do Access Token é suportado via cabeçalho `Authorization: Bearer` ou cookie seguro httpOnly. Senhas armazenadas com hash criptográfico bcrypt (salt rounds = 12).
- **Consequências:**
  - *(+) Positivas:* Implementação limpa sem dependência de serviços externos pagos (Auth0/Clerk); compatibilidade nativa com requisições REST da SPA/PWA; proteção efetiva contra interceptação e roubo de sessão através da rotação de tokens.
  - *(−) Negativas:* Exige manutenção do ciclo de vida dos tokens pelo próprio backend e criação de tabelas de refresh tokens na base de dados.
- **Alternativas descartadas:**
  - *Sessões puras em memória/Redis:* Descartadas para evitar a necessidade de gerenciar um serviço Redis dedicado na VPS do Beta.
  - *Obrigatoriedade de autenticação para busca:* Rejeitada categoricamente para não gerar barreiras de entrada aos novos visitantes.

---

<a id="adr-007"></a>
## ADR-007 — Servidor de e-mail transacional dedicado com Mailcow em `mail.notinhas.shop`

- **Contexto:** A aplicação necessita disparar e-mails transacionais (boas-vindas, recuperação de senha de acesso, alertas de preço). Serviços terceirizados de e-mail (Resend, SendGrid, Amazon SES) geram custos variáveis e dependência externa de fornecedores internacionais.
- **Decisão:** Utilizar a pilha de e-mail **Mailcow (dockerized)** já instalada e operacional na VPS Contabo, configurando o domínio oficial **`notinhas.shop`** com hostname dedicado **`mail.notinhas.shop`**. A API Express conecta-se diretamente ao Mailcow via SMTP submission seguro na porta **587 (STARTTLS)** utilizando credenciais da caixa `contato@notinhas.shop`.
- **Consequências:**
  - *(+) Positivas:* Custo marginal zero de disparo; autonomia total sobre a infraestrutura e conformidade com privacidade; registros SPF, DKIM e DMARC configurados no DNS da Hostinger garantindo alta entregabilidade nas caixas de entrada.
  - *(−) Negativas:* A reputação do IP da Contabo precisa ser monitorada ativamente contra blocklists de spam.
- **Alternativas descartadas:**
  - *Uso de contas gratuitas do Gmail/Outlook via SMTP:* Descartadas por bloqueios frequentes de segurança do Google e limites severos de disparo diário.

---

<a id="adr-008"></a>
## ADR-008 — Índice público de preços 100% dissociado da identidade do contribuinte

- **Contexto:** Cupons fiscais de consumidores frequentemente contêm o CPF do comprador ou dados de cartão de pagamento. Além disso, a lei brasileira de proteção de dados (LGPD) impõe restrições rígidas sobre a exposição de perfis de consumo individual.
- **Decisão:** Aplicar **anonimização estrita e irreversível** em todas as observações fiscais que alimentam o índice público de preços. Qualquer identificação do consumidor (CPF na nota, nome constante na consulta da Fazenda, ID do usuário que fez o upload) é limpa e permanentemente excluída das tabelas de consulta pública. O vínculo da nota com a conta do usuário existe exclusivamente no escopo privativo do módulo `finance` para exibição em seu extrato pessoal.
- **Consequências:**
  - *(+) Positivas:* Total conformidade com a LGPD; segurança jurídica plena para os usuários que colaboram depositando suas notas fiscais; proteção contra vazamento de padrões de compra de cidadãos.
  - *(−) Negativas:* Impossibilidade de rastrear publicamente quem foi o usuário específico que encontrou determinado preço barato.
- **Alternativas descartadas:**
  - *Gamificação com exibição pública de rankings de colaboradores:* Descartada no Beta para evitar qualquer risco de correlação entre usuário e cupom fiscal.

---

<a id="adr-009"></a>
## ADR-009 — Ausência de checkout in-app e intermediação logística no Beta 1.0

- **Contexto:** O posicionamento de longo prazo do notinhas.shop contempla a transformação de cada estabelecimento comercial em um centro de distribuição local (loja como estoque de vendas online). Contudo, a implementação de uma esteira completa de e-commerce envolve processamento de cartões, prevenção a fraudes de estorno (chargeback), split bancário com lojistas e contratação de malha logística.
- **Decisão:** No escopo do Beta 1.0, o notinhas.shop opera **estritamente como um índice de descoberta, comparação de preços e vitrine física**, mantendo **checkout e pagamentos in-app expressamente fora do escopo funcional**. O produto informa onde o item está mais barato, qual a distância e disponibiliza a rota no mapa para que o comprador faça a compra física diretamente no balcão da loja.
- **Consequências:**
  - *(+) Positivas:* Foco absoluto na validação da densidade de dados e utilidade do índice de preços em São José dos Pinhais; isenção de riscos regulatórios financeiros com o Banco Central e responsabilidades sobre entrega de mercadorias no piloto.
  - *(−) Negativas:* O produto não monetiza sobre a transação no Beta e o usuário precisa se deslocar fisicamente para concretizar a economia.
- **Alternativas descartadas:**
  - *Integração com gateways de pagamento (Stripe / Mercado Pago / Asaas):* Rejeitada para o Beta por desviar o foco da liquidez do índice cooperativo.

---

<a id="adr-010"></a>
## ADR-010 — Geolocalização via Nominatim com normalização de endereço e coordenadas `lat`/`lng`

- **Contexto:** O endereço das empresas obtido na consulta pública da SEFAZ muitas vezes contém formatação suja gerada por sistemas fiscais legados (ex.: abreviações caóticas, vírgulas duplicadas, complemento `, 0,` indicando ausência de número predial). Consultar a API do Google Geocoding geraria custos proibitivos e a consulta direta do endereço bruto no Nominatim frequentemente retornava coordenadas nulas.
- **Decisão:** Adotar a API pública **OpenStreetMap / Nominatim** operando com rotina de **normalização prévia de endereço** implementada no backend. A normalização higieniza a string (removendo caracteres especiais e complementos inúteis como `, 0,`), adiciona a cidade e o estado e consulta o serviço respeitando a política de uso de 1 requisição por segundo. As coordenadas resultantes (`lat` e `lng`) são salvas de forma definitiva na tabela `enotas.empresas`, servindo de base para o mapa Leaflet e cálculos de distância por Haversine.
- **Consequências:**
  - *(+) Positivas:* Custo zero de geocodificação; mapa com 100% de precisão para estabelecimentos reais no Paraná; independência de fornecedores proprietários.
  - *(−) Negativas:* Necessidade de enfileiramento com espaçamento temporal para não violar os termos de uso do Nominatim e necessidade de tratamento para endereços rurais não mapeados.
- **Alternativas descartadas:**
  - *Google Places / Geocoding API:* Descartada pelo custo por requisição em um projeto piloto de utilidade pública.

---

<a id="adr-011"></a>
## ADR-011 — Ranking agregado de estabelecimentos por desvio da mediana regional

- **Contexto:** Consumidores querem saber com clareza quais supermercados na sua vizinhança são geralmente mais baratos ou mais caros. Um cálculo ingênuo baseado em média aritmética de itens seria facilmente distorcido por produtos caros (ex.: bebidas alcoólicas) ou lojas com poucos itens cadastrados.
- **Decisão:** Calcular o **Score de Preço Agregado** do estabelecimento utilizando a **mediana de mercado por EAN** em uma janela móvel de 14 dias dentro do raio geográfico. Para cada produto vendido pela loja com correspondência no mercado, calcula-se a razão `(preco_loja / mediana_regional)`. O índice da loja é a média aritmética dessas razões para produtos com concorrência ativa. Estabelecimentos com score < 1.00 são classificados entre os que "menos cobram" e aqueles com score > 1.00 entre os que "mais cobram". Exige-se cobertura mínima de 5 EANs comuns para inclusão no ranking.
- **Consequências:**
  - *(+) Positivas:* Imunidade estatística contra produtos extremos (outliers); comparabilidade justa entre atacarejos e pequenos mercados; transparência metodológica para lojistas e clientes.
  - *(−) Negativas:* Estabelecimentos com sortimento de nicho que vendem itens sem concorrentes no raio não têm esses itens considerados no cálculo do score agregado.
- **Alternativas descartadas:**
  - *Soma de preços brutos:* Inviável porque lojas que vendem itens mais caros por natureza pareceriam infinitamente mais caras.

---

<a id="adr-012"></a>
## ADR-012 — Feed de destaques ativado por limiar estatístico de preço abaixo da referência

- **Contexto:** Supermercados frequentemente realizam promoções agressivas em itens de alto giro (café, leite, cerveja, carnes) para atrair fluxo de pedestres. O comprador quer ser alertado imediatamente quando uma oferta real acontecer perto dele.
- **Decisão:** Implementar um **gatilho automatizado de Destaques de Concorrência**. Sempre que a ingestão de uma nova nota fiscal registrar para um determinado EAN um preço que seja **ao menos 5% inferior E no mínimo R$ 0,50 mais barato** que a mediana regional dos últimos 14 dias, o item é automaticamente promovido ao Feed de Destaques da página inicial e recebe um selo comemorativo na vitrine do mercado.
- **Consequências:**
  - *(+) Positivas:* Feed dinâmico e sempre atualizado baseado em fatos fiscais comprovados; atratividade imediata na abertura do app; estímulo à concorrência saudável no comércio local.
  - *(−) Negativas:* Promoções relâmpago de curta duração podem esgotar nas gôndolas antes que o comprador chegue ao local.
- **Alternativas descartadas:**
  - *Destaques pagos por lojistas (anúncios patrocinados):* Rejeitados no Beta para preservar a integridade e credibilidade orgânica das recomendações de preço.

---

<a id="adr-013"></a>
## ADR-013 — Armazenamento local de fotografias de produtos indexadas por EAN (`ean-fotos`)

- **Contexto:** A exibição visual das embalagens de produtos melhora drasticamente a usabilidade nas listas de compras e na vitrine das lojas. A NFC-e traz apenas descrições textuais abreviadas, sem imagens.
- **Decisão:** Estruturar um acervo de imagens estáticas hospedadas no sistema de arquivos local da VPS sob o diretório `/opt/e-notas/public/ean-fotos/` e servidas diretamente pelo Nginx com cache longo. As imagens são nomeadas rigorosamente pelo seu código de barras internacional (ex.: `7891000457368.jpg`) e registradas em um arquivo `manifest.json`. O backend e a API verificam a existência do arquivo correspondente ao EAN e retornam a URL pública `/ean-fotos/{ean}.jpg`.
- **Consequências:**
  - *(+) Positivas:* Velocidade máxima de entrega de imagens através do Nginx; custo zero de serviços de CDN externa no Beta; associação universal instantânea: uma única foto cadastrada beneficia todas as lojas que vendem aquele EAN no Brasil.
  - *(−) Negativas:* Exige rotina de backup do diretório de mídia junto com os dados do banco de dados.
- **Alternativas descartadas:**
  - *Hospedagem em buckets S3 / AWS:* Descartada no momento para simplificar a operação de infraestrutura no piloto da Contabo.

---

<a id="adr-014"></a>
## ADR-014 — Resoluções e comportamentos padrão para as perguntas em aberto do PRD

- **Contexto:** O desenvolvimento do Beta requer respostas objetivas e padronizadas para as incertezas de produto identificadas na seção de perguntas em aberto do PRD (§8).
- **Decisão:** Fixar formalmente as seguintes definições padrão no código e nas regras de negócio da aplicação:
  1. *Q1 (Login):* **Opcional para consumo e depósito;** obrigatório apenas para a área de finanças pessoais e cesta salva.
  2. *Q2 (Governança de EAN):* **Último vínculo tem prevalência com log de auditoria;** conflitos recorrentes são encaminhados para a fila do administrador.
  3. *Q3 (Janela Ativa):* **14 dias para o índice quente;** observações mais antigas permanecem para histórico, mas recebem aviso de preço não confirmado.
  4. *Q4 (Cálculo Espacial):* **Haversine matemático padrão no Postgres/Node;** dispensando a exigência da extensão PostGIS no Beta 1.0.
  5. *Q5 (Gatilho de Destaque):* **Queda ≥ 5% e ≥ R$ 0,50** frente à mediana regional de 14 dias.
  6. *Q6 (Itens sem EAN):* **Exibição secundária por texto** com selo convocando a comunidade a escanear a embalagem do produto.
- **Consequências:**
  - *(+) Positivas:* Elimina ambiguidades de implementação entre os desenvolvedores e agentes de IA; garante consistência e previsibilidade no comportamento de todas as telas do sistema.
  - *(−) Negativas:* Algumas métricas (como a janela de 14 dias) podem exigir ajustes empíricos após a coleta de métricas de uso real no laboratório de São José dos Pinhais.
- **Alternativas descartadas:**
  - *Deixar parâmetros em aberto ou hardcoded sem documentação canônica:* Rejeitado por gerar inconsistências entre regras de negócio e testes de aceitação.
