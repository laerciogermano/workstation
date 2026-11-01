# Benchmarking — soluções similares (notinhas.org)

Matriz vs requisitos do PRD + **alcance geográfico** + gap vs proposta (sistema cooperativo de notinhas).

- **Card Trello:** https://trello.com/c/1fMjqGdR
- **PRD:** [`../../docs/prd.md`](../../docs/prd.md) (§1 definição · §9 concorrência)
- **Entrada:** [`00-curadoria.html`](00-curadoria.html) / [`00-curadoria.pdf`](00-curadoria.pdf)
- **Apresentação:** [`../apresentacao-notinhas-v1.html`](../apresentacao-notinhas-v1.html)
- **REQ:** [`../../docs/requisitos.md`](../../docs/requisitos.md) → REQ-014

## Matriz (resumo)

| Solução | Alcance | Comp. | Hist. | Apartada | Vitrine | Geo | API | vs notinhas (gap deles) |
|---------|---------|-------|-------|----------|---------|-----|-----|-------------------------|
| Busca Preço | MG, SP, RJ | Sim | Sim | Parcial | Parcial | Parcial | Não | Vitrine · split · API · centro |
| Nota Preço | RM Rio (RJ) | Sim | Sim | **Sim** | Não | Parcial | Não | Vitrine · API · fora RJ |
| Mercado Certo | Por cidade | Sim | Parcial | **Sim** | Não | **Sim** | Não | Vitrine · API · histórico |
| GoMarket | Por cidade | Sim | Sim | Não | **Sim** | **Sim** | Não | Split · API · simular economia |
| Qual o Preço | Perto (em breve) | Sim | Parcial | Parcial | **Sim** | **Sim** | Não | API · split explícito |
| PoupApp | Nacional* | Sim | Parcial | Não | Não | Parcial | Não | Vitrine · split · API |
| Nota Paraná | **PR** | Sim | Parcial | Não | Não | **Sim** | Parcial | Vitrine · split · UX · B2B |
| MP Brasil | ~15–16 UFs** | Sim | Parcial | Não | Não | **Sim** | Não | Vitrine · split · API · não 27 UF |
| Economiza AL | **AL** | Sim | Parcial | Via 3º | Não | **Sim** | **API** | Consumer UX · vitrine · split |
| Quantto | B2B contratual | Sim | Sim | N/A | N/A | Regional | **B2B** | Não é consumer cooperativo |
| **notinhas.org** | Lab **PR** → expansão*** | Alvo | Alvo | Alvo | Alvo | Alvo | Alvo | Pacote §1 + preço sem margem app |

\*PoupApp declara monitoramento em 26 UF+DF; liquidez varia por cidade.  
\*\*MP Brasil: adesão SEFAZ (lista muda; SP tipicamente fora) — **não é nacional**.  
\*\*\*Lab São José dos Pinhais/PR; expansão por liquidez NFC-e.

## Rollback

```bash
# reverter pasta (cuidado) ou marcar PRD §9 / curadoria como revogado
git checkout -- e-notas/marca/benchmarking-solucoes
```
