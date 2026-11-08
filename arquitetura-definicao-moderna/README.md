# Definição moderna de arquitetura (docs + prompts)

Coleção baixada em **2026-11-08** dos padrões e prompts mais usados hoje para definir arquitetura de software — sobretudo Markdown no repo, C4, ADR e agentes de IA.

## O que é “moderno” aqui

| Camada | Padrão dominante (2024–2026) | Quando usar |
|---|---|---|
| Documento do sistema | **arc42** (completo) ou **lean C4** (9 seções) | arc42 em enterprise/regulado; lean quando o risco é “não documentar” |
| Decisões | **MADR 4.0** (estruturado) ou **Nygard** (mínimo) | MADR com opções/trade-offs; Nygard para decisão rápida |
| Decisão em 1 linha | **Y-statement** | PR / review / chat |
| Diagramas | **C4** (contexto → container → componente) + Mermaid | Sempre; container é o mínimo útil |
| Agentes de código | **AGENTS.md** + regras/prompts de system-architect | Entrada estável para Cursor/Claude/Copilot |
| ADR agent-first | **Vercel AI adr-skill** (Implementation Plan + Verification) | Quando o agente deve executar e checar a decisão |

Fluxo típico com IA: constraints → Plan Mode / system-architect → ADR → regra no repo → fitness checks.

## Pasta

```text
01-adr/                 ADRs (MADR 4, Nygard, Y-statement)
02-arc42/               Template oficial EN (plain + with-help) — release 2026.10
03-c4-e-lean/           Lean architecture.md + SAD/C4 (EN + pt-BR)
04-prompts-agentes/     Prompts de system-architect / design
05-agents-md/           Formato AGENTS.md
06-agent-first-adr/     Skill ADR da Vercel AI (templates agent-first)
fontes.md               URLs e versões baixadas
```

## Começar por aqui

1. Prompt de design: [`04-prompts-agentes/system-architect-agentscamp.md`](04-prompts-agentes/system-architect-agentscamp.md)
2. Doc vivo do sistema: [`03-c4-e-lean/architecture-lean-template.md`](03-c4-e-lean/architecture-lean-template.md)
3. Decisão: [`01-adr/madr-4/adr-template.md`](01-adr/madr-4/adr-template.md) (ou `nygard/` se for mínimo)
4. Se precisar do pacote completo: [`02-arc42/with-help/arc42-template-EN.md`](02-arc42/with-help/arc42-template-EN.md)
5. Entrada para agentes: [`05-agents-md/repo/AGENTS.md`](05-agents-md/repo/AGENTS.md)

## Fontes

Lista completa em [`fontes.md`](fontes.md).
