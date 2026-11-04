# notinhas.shop Beta 1.0 — Documentação para construir do zero

Pacote canônico de documentos de produto, engenharia e arquitetura para implementar e consolidar a versão **Beta 1.0** do **notinhas.shop** (código e repositório: `e-notas`).

- **Produto público:** [notinhas.shop](https://notinhas.shop)
- **Repositório:** `works/e-notas`
- **Card no Trello:** [Fundação Beta Docs e Implementação](https://trello.com/c/jhxFUqLz)
- **Fontes de referência:** [Visão geral](../README.md) · [PRD canônico anterior](../docs/prd.md) · [Requisitos e regras](../docs/requisitos.md) · [Identidade visual](../identidade-visual.md) · [DESIGN.md v2](../marca/notinhas.shop.DESIGN.md) · [App lab v0.1](../app/README.md) · [Deploy Contabo](../deploy/README.md) · Padrão de documentação [RoleGo Beta](../../role-go/beta-docs/README.md).

---

## Ordem de leitura recomendada

| # | Documento | Para quê | Quem lê |
|---|---|---|---|
| 01 | [01-prd.md](01-prd.md) | Problema, objetivos e métricas (Lab SJP/PR), escopo MoSCoW por épicos (E01–E04 + ADM), personas, regras de negócio (RN-01 a RN-15), riscos e perguntas em aberto | Todos |
| 02 | [`02-historias/`](02-historias/README.md) | 34 histórias de usuário com critérios de aceite executáveis em formato Gherkin (BDD) cobrindo E01 a E04 e ADM | Produto, dev, QA |
| 03 | [03-arquitetura.md](03-arquitetura.md) | C4 Mermaid (contexto C1, containers C2, componentes C3), stack modular Express/Postgres, fronteiras de módulos e decisões transversais | Dev, arquitetura |
| 04 | [04-adrs.md](04-adrs.md) | 14 Architecture Decision Records registrando justificativas, trade-offs e alternativas descartadas | Dev, arquitetura |
| 05 | [`05-modelo-de-dados.md`](05-modelo-de-dados.md) *(planejado)* | Diagrama ERD físico, schemas PostgreSQL `enotas`, DDL, índices de busca e queries SQL críticas | Dev, DBA |
| 06 | [`06-contratos-api.md`](06-contratos-api.md) *(planejado)* | Endpoints REST, schemas JSON Request/Response, DTOs tipados e catálogo de erros padronizados | Dev, QA |
| 07 | [`07-diagramas.md`](07-diagramas.md) *(planejado)* | Diagramas de sequência (ingestão QR, vínculo EAN, ranking geo, busca), estados e fluxo de dados | Dev |
| 08 | [08-boas-praticas-codigo.md](08-boas-praticas-codigo.md) | Padrões de código em Node.js ESM, convenções de nomenclatura, checklist de Pull Requests | Dev, IA |
| 09 | [09-estrategia-de-testes.md](09-estrategia-de-testes.md) | Pirâmide de testes (unitário, integração, SEFAZ mock parser, E2E de scan) e esteira de qualidade | Dev, QA |
| 10 | [`10-seguranca-privacidade-lgpd.md`](10-seguranca-privacidade-lgpd.md) *(planejado)* | Inventário de dados pessoais, anonimização estrita do índice público de preços, análise STRIDE e LGPD | Dev, segurança, jurídico |
| 11 | [`11-plano-de-implementacao.md`](11-plano-de-implementacao.md) *(planejado)* | Roteiro de marcos M0 a M6 com tarefas sequenciadas, dependências e critérios de Definition of Done | Todos |
| 12 | [`12-prototipos.md`](12-prototipos.md) *(planejado)* | Catálogo de telas navegáveis mobile-first, design system em tokens CSS e componentes de interface | Produto, design, dev |
| 13 | [`13-guia-desenvolvimento-com-ia.md`](13-guia-desenvolvimento-com-ia.md) *(planejado)* | Orientações e prompts canônicos para aceleração do ciclo de desenvolvimento assistido por agentes de IA | Dev |
| 14 | [`14-operacao-deploy.md`](14-operacao-deploy.md) *(planejado)* | Guia de operação na VPS Contabo, Nginx HTTPS, systemd, automação de backups e integração com Mailcow | Dev, DevOps |
| 15 | [15-glossario.md](15-glossario.md) | Dicionário de equivalência formal entre termos de domínio tributário/comercial (pt-BR) e identificadores de código (inglês) | Todos |

---

## Decisões-chave já consolidadas

1. **PWA mobile-first com identidade visual institucional clara (Light):**
   - Canvas em tom névoa (`#F5F7FA`), superfícies brancas com bordas sutis (`#D5DEE8`), tipografia Plus Jakarta Sans com numerais tabulares em valores monetários.
   - O azul institucional (`#0069B4`) é a voltagem única de botão de ação (CTA).
   - O verde semântico (`#00984B`) é de uso exclusivo para o "menor preço" e estados de sucesso — rejeitando explicitamente o visual dark/neon do RoleGo ([ADR-001](04-adrs.md#adr-001)).

2. **Evolução modular do monólito Express + Node.js (ESM) no Beta:**
   - Aproveita a validação funcional já executada no lab (`app/server.js`), estruturando o código em módulos desacoplados com separação de rotas, regras de negócio e acesso a dados.
   - Evita o custo de reescrita prematura em NestJS durante a validação da primeira versão de mercado ([ADR-003](04-adrs.md#adr-003)).

3. **Preservação do schema dedicado `enotas` no PostgreSQL Contabo:**
   - Mantém as tabelas `empresas`, `notas`, `itens` e `codigos_barras` no banco de dados corporativo existente, garantindo persistência robusta, índices B-Tree e histórico transacional entre notas ([ADR-002](04-adrs.md#adr-002)).

4. **NFC-e exclusivamente via URL do QR Code (SEFAZ Paraná):**
   - A entrada canônica de dados no Beta é a leitura da URL do QR Code da consulta pública (`fazenda.pr.gov.br/nfce/qrcode`). O backend busca a DANFE HTML e extrai dados de emissão, emitente e itens ([ADR-004](04-adrs.md#adr-004)).

5. **Vínculo cooperativo do código de barras (EAN/GTIN):**
   - A NFC-e emitida ao consumidor **não contém** o código de barras do produto (apenas código interno da loja e descrição). O vínculo `(empresa_id, codigo_unidade) ↔ EAN` é estabelecido de forma colaborativa pelos usuários via leitura óptica de código de barras ou digitação manual ([ADR-005](04-adrs.md#adr-005)).

6. **Índice público de preços 100% anonimizado:**
   - Nenhum dado do consumidor/contribuinte (CPF na nota, nome, identificador de usuário que realizou o upload) é propagado para as tabelas públicas de observações de preço ou endpoints de busca ([ADR-008](04-adrs.md#adr-008)).

7. **Sem checkout, transações financeiras ou delivery no Beta:**
   - O produto posiciona os estabelecimentos físicos como estoques e vitrines locais do mundo real (preço de balcão). Compras diretas, pagamentos in-app e frete ficam expressamente fora do Beta 1.0 ([ADR-009](04-adrs.md#adr-009)).

8. **Geolocalização via Nominatim com cache e Leaflet:**
   - Normalização dos endereços fiscais da DANFE e geocodificação em segundo plano via OpenStreetMap/Nominatim, armazenando `lat`/`lng` na tabela de empresas para exibição em mapas interativos e cálculo de raio de proximidade ([ADR-010](04-adrs.md#adr-010)).

9. **Ranking de estabelecimentos por mediana relativa agregada:**
   - Algoritmo que classifica supermercados e comércios no raio geográfico selecionado entre os que "menos cobram" e os que "mais cobram", comparando os preços praticados frente à mediana regional dos mesmos EANs ([ADR-011](04-adrs.md#adr-011)).

10. **Feed automático de Destaques de Concorrência:**
    - Gatilho disparado sempre que uma nova observação de preço para determinado EAN ficar abaixo do limiar de referência regional (ex.: ≥ 5% ou ≥ R$ 0,50 abaixo da mediana), destacando a oferta na home e na vitrine da loja ([ADR-012](04-adrs.md#adr-012)).

11. **Servidor de e-mail Mailcow dedicado em `mail.notinhas.shop`:**
    - Infraestrutura própria já provisionada na VPS Contabo com suporte multi-tenant para disparo de e-mails transacionais (boas-vindas, recuperação de senha, alertas de preço) com conformidade SPF, DKIM e DMARC ([ADR-007](04-adrs.md#adr-007)).

---

## Perguntas em aberto e propostas padrão

As decisões operacionais detalhadas no [PRD §8](01-prd.md#8-perguntas-em-aberto-e-propostas-padrão) possuem as seguintes propostas padrão adotadas no Beta 1.0:

| ID | Tema | Pergunta central | Proposta padrão adotada no Beta |
|---|---|---|---|
| **Q1** | Obrigatoriedade de autenticação | O usuário precisa de conta para escanear a nota ou buscar preços? | **Não.** Busca, vitrine e depósito de QR Code são públicos no Beta. A conta é exigida apenas para salvar cestas de compras e acessar o extrato de gestão financeira pessoal. |
| **Q2** | Moderação de vínculos EAN | Como evitar cadastros incorretos ou maliciosos de códigos de barras? | **Vínculo colaborativo com auditoria pós-fato.** No Beta, o primeiro vínculo vincula o produto; reenvios por outros usuários com divergência geram um flag de pendência para revisão do administrador. |
| **Q3** | Janela temporal de validade de preço | Por quanto tempo uma observação de preço é considerada ativa no índice? | **Janela padrão de 14 dias para o índice quente.** Observações mais antigas continuam registradas para séries históricas, mas recebem badge de desatualização nas buscas cotidianas. |
| **Q4** | Geometria espacial e geocodificação | PostGIS completo ou cálculo Haversine em código/Postgres padrão? | **Haversine no Postgres/Node no Beta.** Com dezenas de lojas no lab inicial de São José dos Pinhais, a fórmula matemática indexada supre perfeitamente o raio de 1 a 30 km sem dependência obrigatória da extensão PostGIS. |
| **Q5** | Limiar de ativação dos destaques | Qual o percentual de desconto para classificar um item como "Destaque"? | **Queda ≥ 5% e ≥ R$ 0,50** em relação à mediana dos últimos 14 dias para o mesmo EAN na região geográfica. |
| **Q6** | Deduplicação de itens sem EAN | Como comparar produtos que ainda não receberam código de barras? | **Exibição por similaridade textual estrita na mesma loja;** comparação cross-loja sem EAN fica restrita a alerta explícito de menor confiança para o consumidor. |

---

## Próximos passos

1. **Consolidar os contratos e schemas:** Desenvolver [`05-modelo-de-dados.md`](05-modelo-de-dados.md) e [`06-contratos-api.md`](06-contratos-api.md) a partir das especificações do PRD e da Arquitetura.
2. **Implementar a esteira M0/M1:** Estruturar as pastas modulares da API Express no repositório `e-notas/app/` e configurar a suíte de testes com mocks da Fazenda PR.
3. **Validar a ingestão no piloto:** Expandir a coleta de notas fiscais reais do comércio de São José dos Pinhais / PR para aferir a robustez dos cálculos de ranking agregado e destaques.
