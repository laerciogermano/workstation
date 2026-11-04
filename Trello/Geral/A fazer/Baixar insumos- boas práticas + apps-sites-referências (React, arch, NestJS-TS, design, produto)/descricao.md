## Objetivo
Baixar e consolidar **documentos e referências** (boas práticas + apps/sites/produtos de referência) para serem **insumo padrão** na criação de qualquer projeto novo da workstation.

## Entregáveis
- `core/boas-praticas/` — README índice + docs por tema (regras, anti-padrões, checklist)
- `core/referencias/` — apps, sites e demais referências com ficha curta (“o que copiar / o que evitar”)

### 1. Front-end React
- Boas práticas React 19 / Vite / TypeScript strict
- Estado (TanStack Query vs UI state), formulários (RHF + Zod), roteamento, performance, a11y, PWA
- Componentização, CSS Modules / tokens, testes (RTL / Playwright)
- Fontes oficiais (react.dev, TanStack, Vite) + guias consolidados 2025–2026

### 2. Arquitetura
- Monólito modular, ports/adapters, C4, ADRs
- Bounded contexts, contratos tipados, observabilidade, segurança na borda
- Padrões da workstation: Nest modular + `packages/contracts` (RoleGo / e-notas)

### 3. Back-end NestJS + TypeScript
- NestJS 11: módulos, DI, validation (Zod), OpenAPI, Problem Details
- Domínio puro vs application vs infra; Result/errors; jobs/filas
- Persistência (Drizzle/Postgres), auth, logging (pino), testes
- TypeScript strict: branded IDs, sem `any`, boundaries de import

### 4. Design de apps modernos / futuristas
- Referências visuais de apps recentes (mobile-first, PWA, gestos, motion)
- Sistemas em `core/shadcn-design/` + novos
- Tokens, tipografia, dark/light com intenção — evitar “AI slop”
- Extrair princípios reutilizáveis (não só moodboard)

### 5. Produto
- Discovery, PRD enxuto, métricas, onboarding, retenção
- Histórias / BDD / priorização
- UX de produto (fluxos), não só visual

### 6. Apps de referência
Catalogar apps (web / mobile / PWA / desktop) como benchmark de UX, motion, onboarding e densidade. Em cada ficha: URL, plataforma, o que copiar, o que evitar, capturas/links, data.

Sugestões iniciais (expandir na coleta):
- Produtividade / SaaS: Linear, Notion, Raycast, Superhuman, Loom, Height, Arc
- Design / build: Figma, Framer, Webflow, v0, Cursor
- AI: Claude.ai, ChatGPT, Perplexity, Midjourney, Groq Cloud
- Dev / infra UX: Vercel Dashboard, Stripe Dashboard/Checkout, GitHub, Railway, Resend
- Finanças / consumer BR+global: Nubank, Revolut, Wise, Mercado Pago
- Lifestyle / social: Duolingo, Strava, BeReal, Letterboxd
- Verticais dos nossos produtos: apps de eventos, notas fiscais / fiscal, dating, LinkedIn-like, CRM leve

### 7. Sites de referência
Catalogar landings, docs e design systems. Em cada ficha: URL, categoria, o que aprender.

Sugestões iniciais:
- Marketing / brand: stripe.com, linear.app, vercel.com, apple.com, claude.com, framer.com
- Design systems raw: shadcn.io/design (+ `core/shadcn-design/`), radix-ui.com, ui.shadcn.com
- Docs técnicas (UX de docs): react.dev, nestjs.com, typescriptlang.org, tanstack.com, drizzle.team
- Galerias (curadoria, não dump): [Mobbin](https://mobbin.com/) (card https://trello.com/c/zxdKCYTJ), Godly, Landingfolio, SaaSFrame, Refero, Dribbble (seleção)
- Fundamentos: Laws of UX, heurísticas Nielsen, WCAG, Apple HIG, Material 3 (como contraste)

### 8. Demais referências
- Libs/kits alinhados à stack (motion, charts, forms, e-mail)
- Artigos / ADRs externos com data de coleta
- Newsletters / contas curtas de produto e design
- Benchmarks de concorrentes por vertical (quando abrir projeto novo)
- Qualquer outro artefato útil: playbooks, checklists, screenshots anotados, repos exemplo

## Critério de pronto
- [ ] `core/boas-praticas/README.md` indexando práticas
- [ ] `core/referencias/README.md` indexando apps + sites + outros
- [ ] Docs por tema (front, arch, back, design, produto) com fontes e data
- [ ] Catálogo de apps/sites com “o que aprender de cada um”
- [ ] Checklist “como usar em projeto novo” (kickoff)
- [ ] Commit + push no `works/`

## Stack alvo da workstation
React + Vite + TypeScript · NestJS · Zod · TanStack Query · Drizzle/Postgres · monorepo pnpm — alinhar tudo a isso.
