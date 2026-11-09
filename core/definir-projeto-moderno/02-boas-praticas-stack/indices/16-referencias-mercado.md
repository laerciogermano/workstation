# notinhas.shop Beta — Referências de mercado para desenvolvimento com IA

Pacote de **espelhos oficiais** (Node/TS, React, PostgreSQL, arquitetura, filas, specs para agentes, OWASP) baixados para leitura on-demand por humanos e IAs. Complementa — não substitui — `01`–`15`.

| Artefato | Caminho |
|---|---|
| Índice operacional dos espelhos | [`referencias/README.md`](referencias/README.md) |
| Relatório da pesquisa (síntese + ordem de leitura) | [`reports/Boas praticas stack moderna.md`](reports/Boas%20praticas%20stack%20moderna.md) |
| Notas por domínio | [`research_notes/Boas praticas stack moderna/`](research_notes/Boas%20praticas%20stack%20moderna/) |

## Como a IA deve usar

1. **Always-on:** [`ia/CLAUDE.md`](ia/CLAUDE.md) + [`13-guia-desenvolvimento-com-ia.md`](13-guia-desenvolvimento-com-ia.md) + docs da task (`02` US, `06`, `08`, `10`).
2. **On-demand:** abrir **um** espelho em [`referencias/`](referencias/README.md) alinhado à dúvida (ex.: índice Postgres, BullMQ idempotente, TS `strict`).
3. **Precedência:** em conflito, vence o contrato Beta (`03`/`04`/`08`). Mercado informa; ADR decide.
4. **Gap conhecido:** worker + fila + outbox (Nominatim/SEFAZ/Mailcow) ainda sem ADR Aceito — ver relatório § filas antes de introduzir Redis/BullMQ.

## Mapa rápido mercado → Beta

| Prática de mercado | Doc Beta |
|---|---|
| AGENTS.md lean + SDD | `13`, `ia/CLAUDE.md`, `02` Gherkin, `06` Zod |
| Monólito modular / hexagonal / C4 / ADR | `03`, `04`, `07` |
| TS strict + Express produção | `08`, trechos Node em `03` |
| Postgres índices/migrations | `05` |
| Segurança / LGPD | `10` + [`../../07-seguranca/`](../../07-seguranca/README.md) (ponteiro em `referencias/seguranca/`) |
| Twelve-Factor / deploy | `14` |
| Jobs confiáveis | Drivers em `03` → ADR novo → `referencias/filas/` |

## Caminho inverso

Antes deste pacote: só `01`–`15` + `ia/`. Remover `referencias/`, `reports/Boas praticas stack moderna.md`, `research_notes/Boas praticas stack moderna/` e esta entrada `16` restaura o estado anterior; o contrato de produto permanece intacto.
