## Objetivo
Criar **documentos de referência** (templates canônicos) da workstation para os artefatos padrão de um projeto novo: benchmark, PRD, arquitetura, boas práticas e protótipo.

Cada doc deve ser reutilizável: estrutura, seções obrigatórias, exemplos e checklist de pronto — alinhado ao processo em `core/processo/` e ao pacote modelo de `role-go/beta-docs/`.

## Destino
`core/referencias/documentos/` (ou path equivalente sob `core/`), com README índice.

## Entregáveis

### 1. Benchmark
- Modelo de ficha (concorrente / app / fluxo)
- Critérios: o que copiar / o que evitar / prints / data
- Como alimentar discovery e protótipo

### 2. PRD
- Template enxuto: problema, objetivos, métricas, MoSCoW, regras, riscos, perguntas em aberto
- Referência viva: `role-go/beta-docs/01-prd.md`

### 3. Arquitetura
- Template C4 + stack + módulos + decisões transversais
- Ligação com ADRs
- Referência viva: `role-go/beta-docs/03-arquitetura.md` · `04-adrs.md`

### 4. Boas práticas
- Regras de código, estrutura de pastas, checklist de PR (stack da workstation)
- Referência viva: `role-go/beta-docs/08-boas-praticas-codigo.md`
- Relacionado: card de insumos `Baixar insumos: boas práticas + apps/sites/referências…`

### 5. Protótipo
- Como documentar telas (índice T-xx), design system, HTML/PDF navegável
- Critérios de fidelidade e handoff para stories
- Referência viva: `role-go/beta-docs/12-prototipos.md` · `core/processo/1.discovery/6.prototype.md`

## Critério de pronto
- [ ] README índice dos 5 templates
- [ ] Um arquivo por tipo (benchmark, PRD, arquitetura, boas práticas, protótipo)
- [ ] Cada template com seções obrigatórias + exemplo mínimo + DoD
- [ ] Links para docs vivos (RoleGo) e para `core/processo/`
- [ ] Commit + push no `works/`

## Relacionados
- Insumos (coleta externa): card “Baixar insumos: boas práticas + apps/sites/referências…”
- Mobbin (galeria UI): card “Mobbin — galeria de prints/fluxos”
