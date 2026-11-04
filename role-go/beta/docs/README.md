# RoleGo Beta 1.0 — Documentação para construir do zero

Pacote de documentos para implementar a **primeira versão (Beta)** do RoleGo com apoio de IA. Escopo: **E01** Conta, onboarding e perfil · **E02** Publicação e descoberta de eventos · **E03** Ciclo de vida do evento.

Origem: [visão](../README.md), [épicos](../epics.md), [identidade visual](../identidade-visual.md), [wireframes MVP](../input/rolego_mvp_completo_dark.pdf), [slides](../input/rolego_slides_publico.pdf) e o aprendizado do [app v0.1](../app/README.md).

## Ordem de leitura

| # | Documento | Para quê | Quem lê |
|---|---|---|---|
| 01 | [PRD](01-prd.md) | Problema, objetivos e métricas, escopo MoSCoW, regras de negócio, riscos, perguntas em aberto | todos |
| 02 | [Histórias + Gherkin](02-historias/README.md) | 49 histórias com critérios de aceite executáveis | produto, dev, QA |
| 12 | [Protótipos](12-prototipos.md) → [**abrir protótipo**](prototipos/index.html) | 40 telas navegáveis (T-xx) + design system | produto, design, dev |
| 03 | [Arquitetura](03-arquitetura.md) | C4, stack, módulos, decisões transversais | dev |
| 04 | [ADRs](04-adrs.md) | 15 decisões com contexto e alternativas | dev |
| 05 | [Modelo de dados](05-modelo-de-dados.md) | ERD, constraints, índices, SQL das consultas críticas | dev |
| 06 | [Contratos de API](06-contratos-api.md) | Endpoints, DTOs, códigos de erro | dev |
| 07 | [Diagramas](07-diagramas.md) | Classes, sequência (auth, descoberta, RSVP, privado, OG…), estados, atividade, deploy, navegação | dev |
| 08 | [Boas práticas de código](08-boas-praticas-codigo.md) | Regras, estrutura de pastas, checklist de PR | dev, IA |
| 09 | [Estratégia de testes](09-estrategia-de-testes.md) | Pirâmide, testes obrigatórios por risco, gates, analytics | dev, QA |
| 10 | [Segurança, privacidade e LGPD](10-seguranca-privacidade-lgpd.md) | Inventário de dados, STRIDE, controles | dev, jurídico |
| 11 | [Plano de implementação](11-plano-de-implementacao.md) | 7 marcos, cerca de 75 tasks BETA-nnn com dependências, caminho crítico, DoD | todos |
| 13 | [Guia de desenvolvimento com IA](13-guia-desenvolvimento-com-ia.md) | Fluxo por task, antipadrões, docs vivos · [CLAUDE.md](ia/CLAUDE.md) · [prompts](ia/prompts.md) | dev |
| 14 | [Operação e deploy](14-operacao-deploy.md) | Ambientes, compose, env, runbooks de Mailcow e Grafana, CI/CD, backup | dev/ops |
| 15 | [Glossário](15-glossario.md) | Termos de domínio ↔ código | todos |

## Decisões-chave já tomadas

- **Beta sem venda de ingresso:** valores informativos + link externo; confirmação de presença gratuita (RSVP) ([ADR-014](04-adrs.md#adr-014)).
- **PWA mobile-first** antes do app nativo ([ADR-001](04-adrs.md#adr-001)).
- **Monólito modular TypeScript:** NestJS + React + PostgreSQL/PostGIS + Drizzle + pg-boss, em monorepo pnpm/Turborepo.
- **Autenticação:** JWT EdDSA de 10 min + refresh token rotativo com detecção de reuso + **passkeys** (WebAuthn) ([ADR-008](04-adrs.md#adr-008)).
- **E-mail transacional:** **Mailcow** próprio em `mail.rolego.com.br` ([ADR-011](04-adrs.md#adr-011)).
- **Observabilidade:** **Grafana** (Loki, Prometheus, Tempo, Faro) com OpenTelemetry ([ADR-012](04-adrs.md#adr-012)).
- **Privacidade do evento privado** garantida num único ponto (`EventPresenter`) e por testes de contrato.

## Perguntas em aberto (precisam de dono)

Ver [PRD §11](01-prd.md#11-perguntas-em-aberto). As mais importantes: **Q1** match coletivo/chat no Beta (proposta: release 1.1), **Q2** mapa (proposta: fora), **Q4** presença visível por padrão (proposta: sim, com aviso).

## Próximo passo

Começar o **M0 (Fundação)** do [plano](11-plano-de-implementacao.md): BETA-001 → BETA-012. Em paralelo, **BETA-011 (Mailcow)** deve começar já na semana 1, porque DNS/PTR e o aquecimento do IP levam tempo.
