# Referências de segurança (espelhos)

Baixados em **2026-11-09**. Cada `.md` tem `source_url` / Source no topo. Abrir **on-demand** — não despejar a pasta no prompt.

## Pastas

| Pasta | Uso | Quando abrir |
|---|---|---|
| [`backend/`](backend/) | Authn/authz, REST, JWT, inject, Node/TS, DB, Nest | API, sessões, SQL, webhooks |
| [`frontend/`](frontend/) | XSS, CSRF, CSP, headers, cookies | UI React, browser |
| [`infra/`](infra/) | Docker, K8s, CI/CD, TLS, supply chain | Deploy, pipelines, rede |
| [`geral/`](geral/) | Threat model, review, privacy, AI/LLM/MCP, Top 10 | Design, audit, agentes |
| [`asvs/`](asvs/) | Indexes ASVS / Top Ten / Proactive Controls | Mapear requisito → cheat sheet |

## Contagens (aprox.)

- backend ~49 · frontend ~17 · infra ~17 · geral (+ Top10) · asvs 4

## Caminho inverso

Rebaixar: abrir `source_url` e substituir mantendo o cabeçalho. Remover esta árvore não altera o contrato do produto.
