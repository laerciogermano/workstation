# notinhas.shop Beta — Boas práticas de código

Regras obrigatórias para desenvolvedores humanos **e agentes de IA**. Cada regra deve ser preferencialmente verificada por ferramentas automatizadas (lint, typecheck, testes ou pipeline de CI). O que a automação não cobre vira item mandatário do checklist de PR (§12).

## 1. Princípios

1. **Simples antes de esperto.** Resolver as necessidades reais do Beta do notinhas.shop, sem antecipar abstrações para cenários remotos. Sem camadas indiretas com um único uso (exceção: portas e adaptadores de I/O externo descritos na arquitetura).
2. **Contrato primeiro.** Qualquer adição ou alteração de endpoint começa na especificação de schemas Zod e contratos em [`06-contratos-api.md`](06-contratos-api.md).
3. **Marca na interface é sagrada.** É **expressamente proibido** exibir o termo "e-notas" na interface do usuário (consumer UI). A marca pública visível ao consumidor é sempre **notinhas.shop** (ou "notinhas"). O termo "e-notas" existe unicamente como nome interno do repositório, serviço systemd (`enotas.service`) e schema do banco de dados (`enotas`).
4. **Domínio puro e isolado.** Cálculos de menor preço, percentual de economia, índices agregados de ranking de lojas, desvios de concorrência e normalização de DANFE residem em funções puras sem dependência direta do Express ou I/O.
5. **Explícito > implícito.** Sem middlewares mágicos que mutam silenciosamente o objeto de requisição; regras de negócio e autorização são explícitas.
6. **Pequeno e reversível.** Cada pull request deve conter ≤ 400 linhas alteradas (excluindo migrations e arquivos estáticos gerados), cobrindo uma única user story (`US-xx.yy`) ou task (`BETA-nnn`).
7. **Teste é especificação viva.** Cada cenário de negócio Gherkin mapeia diretamente para um teste automatizado rastreável com o mesmo identificador.

## 2. TypeScript / JavaScript moderno

- Configuração com `strict: true`, `noUncheckedIndexedAccess: true` e `exactOptionalPropertyTypes: true`.
- **Proibido expressamente:** uso de `any` sem narrowing imediato, type assertions forçadas (`as UnknownType`) para mascarar erros de tipo, `!` (non-null assertion) fora de arquivos de teste, e `enum` nativo do TypeScript (utilizar union de literais com `as const`).
- **IDs e chaves com branded types:**
  ```typescript
  export type NotaId = string & { readonly __brand: unique symbol };
  export type Ean = string & { readonly __brand: unique symbol };
  export type Cnpj = string & { readonly __brand: unique symbol };
  export type EmpresaId = string & { readonly __brand: unique symbol };
  ```
- **Dinheiro sempre em centavos:** valores monetários devem ser tratados internamente como inteiros no tipo `Cents` (`type Cents = number`), evitando erros de arredondamento de ponto flutuante em somas de itens, descontos e divisões de cestas. A formatação para `R$ 0,00` ocorre unicamente na camada de apresentação visual.
- **Tratamento funcional de erros:** funções de domínio e casos de uso retornam tipos `Result<T, DomainError>`. Exceções (`throw`) ficam restritas a falhas inesperadas de infraestrutura (queda de conexão com Postgres, timeout fatal de rede).
- **Datas e relógio:** todas as datas são manipuladas e persistidas em **UTC** (ISO 8601). A conversão para o fuso local (`America/Sao_Paulo`, formato `dd/mm/aaaa às HH:mm`) ocorre unicamente na borda de renderização. O código nunca invoca `new Date()` diretamente no domínio; utiliza-se uma porta de relógio (`ClockPort.now()`) para garantir testes determinísticos.
- Imports estruturados por alias de caminho (`@app/…`, `@domain/…`, `@infra/…`, `@contracts/…`).

## 3. Arquitetura de pastas

A estrutura do projeto adota modularidade por contexto de negócio no backend (Express) e organização por feature no frontend consumidor:

### Backend — Express modular
```text
app/
├── src/
│   ├── modules/
│   │   ├── notas/
│   │   │   ├── domain/              # Lógica de negócio da NFC-e, itens e deduplicação
│   │   │   │   ├── nota.ts          # Entidade Nota e regras de validação
│   │   │   │   ├── item-nota.ts     # Entidade Item (chave natural: nota_id + codigo)
│   │   │   │   └── nota.errors.ts   # Erros de domínio do módulo
│   │   │   ├── application/         # Casos de uso
│   │   │   │   ├── ports/           # Interfaces (NotaRepository, SefazScraperPort)
│   │   │   │   ├── ingest-nota.ts   # Caso de uso: ingestão e extração da DANFE
│   │   │   │   └── presenters/      # Serialização e mascaramento de dados da nota
│   │   │   ├── infra/               # Adaptadores concretos
│   │   │   │   ├── postgres-nota.repository.ts
│   │   │   │   └── sefaz-pr-scraper.adapter.ts # Scraping da Fazenda PR via Cheerio
│   │   │   └── http/                # Borda HTTP
│   │   │       ├── notas.controller.ts # Handlers enxutos
│   │   │       └── notas.routes.ts
│   │   ├── ean/                     # Vínculo colaborativo EAN ↔ código interno
│   │   ├── precos/                  # Menor preço, histórico e timeline
│   │   ├── geo/                     # Geolocalização, Nominatim e ranking de lojas
│   │   ├── cesta/                   # Cesta comparada e split de compras
│   │   └── extrato/                 # Gestão financeira pessoal do usuário autenticado
│   ├── shared/                      # Kernel compartilhado (Clock, Result, Logger, DbPool)
│   └── server.ts                    # Bootstrap do Express na porta 4174
```

### Frontend — Organização por feature
```text
app/public/
├── src/
│   ├── features/
│   │   ├── produtos/                # Aba Produtos, grid menores preços, timeline
│   │   │   ├── components/          # ProdutoCard, PrecoTag, TimelineHistorico
│   │   │   ├── hooks/               # useProdutos, useProdutoDetalhe
│   │   │   └── produtos.view.ts
│   │   ├── estabelecimentos/        # Aba Estabelecimentos, mapa Leaflet, vitrine
│   │   │   ├── components/          # LojaCard, VitrineGrid, MapaPins
│   │   │   └── estabelecimentos.view.ts
│   │   ├── scan/                    # Leitura de QR Code (câmera ao vivo + foto)
│   │   │   ├── qr-scanner.ts        # Integração Html5Qrcode com fallback de imagem
│   │   │   └── scan.view.ts
│   │   ├── ean-modal/               # Modal de vínculo EAN (scan 1D + foto + manual)
│   │   └── extrato/                 # Extrato financeiro pessoal e gastos do mês
│   ├── ui/                          # Componentes base do Design System notinhas.shop
│   │   ├── button.css, chip.css, card.css, modal.css
│   │   └── tokens.css               # Variáveis CSS --nt-*
│   └── styles.css                   # Layout global Light Mist
```

**Regras estritas de fronteiras:**
- O código em `domain/` não importa Express, pg, bibliotecas de scraping ou requisições HTTP.
- O controller HTTP é apenas um tradutor: valida entrada via Zod → delega ao caso de uso → formata saída via presenter.
- Uma feature do frontend não pode acessar o estado interno privado de outra feature; o compartilhamento de UI e helpers ocorre através de `ui/` e `shared/`.

## 4. Nomenclatura e convenções

| Elemento | Padrão | Exemplo |
|---|---|---|
| Arquivos de código | `kebab-case` + sufixo do papel | `ingest-nota.use-case.ts`, `produto.presenter.ts` |
| Componentes / Views | `PascalCase` ou `kebab-case.html` | `ProdutoCard.ts`, `scan.html`, `index.html` |
| Funções e métodos | `camelCase`, verbo indicando ação | `calculateLowestPrice`, `normalizeAddress` |
| Constantes e Enums | `SCREAMING_SNAKE` | `SEFAZ_SCRAPER_TIMEOUT_MS`, `EARTH_RADIUS_KM` |
| Tabelas e colunas | `snake_case` | `enotas.codigos_barras`, `valor_unitario` |
| Rotas da API | plural, `kebab-case` minúsculo | `/api/estabelecimentos`, `/api/codigos-barras` |
| Códigos de erro da API | `SCREAMING_SNAKE` | `RECEIPT_ALREADY_EXISTS`, `INVALID_EAN_CHECKSUM` |
| **Idioma do código** | **Inglês** em todo código interno | `findLowestPrice`, `ReceiptRepository` |
| **Idioma da interface (UI)** | **Português (pt-BR)** exclusivo | "Menor preço", "Escanear nota", "Estabelecimentos" |
| **Marca pública na UI** | **notinhas.shop** (sempre minúsculo) | "Adicionar ao notinhas.shop", "notinhas.shop" |

> **Aviso Crítico:** O termo "e-notas" é restrito aos metadados internos de engenharia. Nenhuma tela, modal, título de página, e-mail transacional ou mensagem visível ao consumidor final pode conter "e-notas".

## 5. Backend (Express modular e adaptadores)

- **Handlers enxutos:** controladores não acumulam regras de negócio. O handler típico possui ≤ 20 linhas:
  ```typescript
  export async function postNotaHandler(req: Request, res: Response, next: NextFunction) {
    const parseResult = IngestNotaInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', errors: parseResult.error.issues });
    }
    const result = await ingestNotaUseCase.execute(parseResult.data);
    if (result.isErr()) {
      return res.status(result.error.statusCode).json(result.error.toProblemDetails());
    }
    return res.status(201).json(NotaPresenter.toHttp(result.value));
  }
  ```
- **Isolamento do Scraper da Fazenda PR:**
  - Extração baseada em Cheerio isolada em adaptador de infraestrutura.
  - Timeout rigoroso de 8 segundos por requisição externa.
  - Sanitização obrigatória dos campos extraídos da DANFE (remoção de tags, espaços extras e quebras de linha).
  - **Descarte de PII no momento da extração:** CPF ou nome do consumidor impresso na nota fiscal é descartado imediatamente na leitura do HTML e **nunca** gravado no banco ou logs.
- **Geocoding Nominatim (OpenStreetMap):**
  - Normalização prévia de endereços: higienizar segmentos residuais e lixo de cadastro (ex.: remover `, 0,` ou complementos vazios que quebram a busca no Nominatim).
  - Cache persistente obrigatório em tabela local (`enotas.empresas.lat` e `lng` ou `geocode_cache`). Nunca consultar o Nominatim se a coordenada já estiver calculada.
  - Respeito estrito à política de uso: rate limit de 1 requisição por segundo e envio do cabeçalho `User-Agent: notinhas.shop/1.0 (contato@notinhas.shop)`.
- **Configuração e variáveis de ambiente:**
  - Toda configuração externa é validada no boot através de schema Zod (`env.ts`). A aplicação encerra o processo (`process.exit(1)`) caso qualquer variável mandatória esteja ausente ou malformada.
- **Logs estruturados:**
  - Logs formatados em JSON utilizando Pino.
  - Nunca emitir em log: CPF, senhas, tokens de autenticação, URLs brutas com tokens de sessão ou coordenadas de alta precisão de usuários logados.

## 6. Banco de dados e migrations (PostgreSQL)

- **Schema dedicado:** todas as tabelas residem no schema `enotas` do banco de dados `connectmax`.
- **Migrations versionadas e imutáveis:**
  - Nenhuma migration aplicada em produção ou staging pode ser editada. Alterações demandam uma nova migration numerada sequencialmente.
  - Migrations aplicadas via script automatizado com trava transacional (`BEGIN ... COMMIT`).
- **Chaves naturais e restrições de unicidade:**
  - Deduplicação de itens dentro da mesma nota: constraint UNIQUE `(nota_id, codigo)`.
  - Deduplicação de nota fiscal: chave natural pela chave de acesso de 44 dígitos da NFC-e (`chave_acesso UNIQUE`).
  - Vínculo de EAN: chave natural `(empresa_id, codigo_unidade) UNIQUE`.
- **Performance e consultas críticas:**
  - Toda foreign key possui índice explícito.
  - Consultas de ranking de lojas e busca geo por proximidade devem ser auditadas com `EXPLAIN ANALYZE` sobre volume de dados sintéticos antes da aprovação do PR.
  - Proibido uso de `SELECT *` em código de produção: liste explicitamente as colunas necessárias.
  - Transações curtas: nenhuma chamada de rede externa (scraping da SEFAZ, Nominatim, envio de e-mail via Mailcow) pode ser executada dentro de um bloco transacional do banco de dados.

## 7. Frontend e Design System

- **Paleta oficial Light Mist:**
  - Fundo principal: `--nt-bg: #F5F7FA`
  - Superfícies e cards: `--nt-surface: #FFFFFF`
  - Azul principal (CTA / Header): `--nt-blue-primary: #0069B4`
  - Azul escuro (ênfase): `--nt-blue-dark: #014380`
  - **Verde Menor Preço:** `--nt-green-price: #00984B`
  - Texto primário: `--nt-text-primary: #1A1D20`
  - Texto secundário / meta: `--nt-text-secondary: #6B7280`
- **Regra dos tokens:** É terminantemente proibido o uso de valores hexadecimais soltos em arquivos CSS de componentes. Qualquer cor deve consumir variáveis `--nt-*`.
- **Apresentação do Menor Preço:** toda ocorrência de menor preço deve ser renderizada na cor verde oficial (`#00984B`), acompanhada do chip correspondente, nome do estabelecimento e data da nota fiscal de observação.
- **Experiência móvel (App-like):**
  - Alvos de toque (touch targets) com dimensões mínimas de 44×44 px.
  - Meta viewport restrito (`maximum-scale=1, user-scalable=no, viewport-fit=cover`) evitando zoom acidental.
  - Respeito a safe-area insets (`env(safe-area-inset-bottom)`).
  - Estados de carregamento com skeleton loaders e tratamento visual amigável para estados vazios (*empty states*).
- **Escaneamento (Scan):**
  - Fluxo duplo em `scan.html` e modal de EAN: câmera contínua ao vivo + opções explícitas de "Tirar foto" e "Escolher imagem" da galeria.
  - Feedback tátil e sonoro sutil ao reconhecer código com sucesso.

## 8. Segurança no código

- Validação estrita de toda entrada de dados utilizando Zod (corpo de requisição, query params, route params).
- Cabeçalhos de proteção HTTP configurados via Helmet (`HSTS`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).
- Prevenção de XSS: proibido uso de `innerHTML` sem sanitização via DOMPurify; textos de produtos da SEFAZ são escapados antes da inserção no DOM.
- Prevenção de SSRF: o endpoint de ingestão de notas só aceita URLs com protocolo HTTPS e domínios da SEFAZ expressamente autorizados em lista branca (ex.: `fazenda.pr.gov.br`).
- Gerenciamento de credenciais: nenhuma chave de API, string de conexão de banco de dados ou senha de e-mail pode ser commitada no repositório.

## 9. Estratégia de testes (resumo)

- **Unitários:** 100% de cobertura nos ramos de parsing da DANFE, cálculo de menor preço, percentuais de split e regras de deduplicação.
- **Integração:** use cases exercitados contra PostgreSQL real (schema `enotas`), validando concorrência e constraints de unicidade.
- **Contratos:** verificação automatizada de que as respostas HTTP cumprem os schemas Zod documentados em `06-contratos-api.md`.
- **E2E (Playwright):** jornada completa de escaneamento de nota por QR, vínculo colaborativo de EAN, busca de produtos e navegação no mapa.
- Mais detalhes em [`09-estrategia-de-testes.md`](09-estrategia-de-testes.md).

## 10. Git e fluxo de desenvolvimento

- Modelo baseado em trunk-based development: branch principal `main`, branches de trabalho curtas (`feat/BETA-102-dedupe-nota`, `fix/BETA-204-nominatim-cache`).
- **Mensagens de commit em português (Brasil)** seguindo o padrão Conventional Commits com identificação da tarefa:
  ```text
  feat(ingestao): deduplicar itens na mesma nota com chave natural (US-01.02, BETA-103)
  fix(geo): normalizar complementos vazios antes do Nominatim (US-03.01, BETA-302)
  ```
- Squash merge na branch principal após validação integral.

## 11. Ferramentas e qualidade

| Ferramenta | Finalidade |
|---|---|
| **ESLint** | Validação de sintaxe, regras de fronteiras e padrões JavaScript/TypeScript |
| **Prettier** | Formatação padronizada e automática de código |
| **Stylelint** | Proibição de cores hex soltas e garantia de tokens `--nt-*` |
| **Vitest** | Execução rápida de testes unitários e de integração |
| **Playwright** | Testes ponta a ponta (E2E) simulando dispositivos móveis (390×844) |
| **Zod** | Validação de contratos em runtime e inferência de tipos estáticos |

## 12. Checklist de Pull Request

Antes de submeter ou aprovar qualquer alteração de código no notinhas.shop, confirme:

- [ ] Referencia a tarefa correspondente (`BETA-nnn`) e história de usuário (`US-xx.yy`).
- [ ] **Marca verificada:** nenhuma ocorrência do termo "e-notas" existe na interface do usuário ou telas públicas (somente `notinhas.shop`).
- [ ] Contratos de API em Zod atualizados e sincronizados com [`06-contratos-api.md`](06-contratos-api.md).
- [ ] Testes novos cobrem o caminho feliz e os erros de domínio previstos na especificação Gherkin.
- [ ] Nenhum dado pessoal (CPF do consumidor, nome em cupom fiscal) é gravado no banco ou emitido em logs.
- [ ] Sem valores hexadecimais soltos no CSS dos componentes (apenas variáveis `--nt-*`).
- [ ] Menor preço destacado em verde (`#00984B`) com loja e data de observação explícitas.
- [ ] Migrations do banco revisadas com scripts de reversão (caminho inverso documentado).
- [ ] Validação visual conferida contra os protótipos aprovados `T-xx` nos formatos 390×844 e 360×800.
- [ ] Execução limpa do comando de verificação: `npm run verify` verde sem avisos suprimidos.
