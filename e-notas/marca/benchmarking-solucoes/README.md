# Benchmarking — soluções similares (notinhas.shop)

Matriz vs **todas** as capacidades do PRD + **alcance geográfico** + gap vs proposta (sistema cooperativo de notinhas).

- **Card Trello:** https://trello.com/c/1fMjqGdR
- **PRD:** [`../../docs/prd.md`](../../docs/prd.md) (§1 definição · §9 concorrência)
- **Entrada:** [`00-curadoria.html`](00-curadoria.html) / [`00-curadoria.pdf`](00-curadoria.pdf)
- **Apresentação:** [`../apresentacao-notinhas-v1.html`](../apresentacao-notinhas-v1.html)
- **REQ:** [`../../docs/requisitos.md`](../../docs/requisitos.md) → REQ-014

## Matriz (resumo)

| Solução | Alcance | Comp | Hist | Apart | Vitr | Geo | Rank | Dest | API | Deliv |
|---------|---------|------|------|-------|------|-----|------|------|-----|-------|
| Busca Preço | MG, SP, RJ | Sim | Sim | Parc. | Parc. | Parc. | Não | Não | Não | Não |
| Nota Preço | RM Rio (RJ) | Sim | Sim | **Sim** | Não | Parc. | Não | Não | Não | Não |
| Mercado Certo | Por cidade | Sim | Parc. | **Sim** | Não | **Sim** | Parc. | Não | Não | Não |
| GoMarket | Por cidade | Sim | Sim | Não | **Sim** | **Sim** | Parc. | Não | Não | Não |
| Qual o Preço | Perto (em breve) | Sim | Parc. | Parc. | **Sim** | **Sim** | Parc. | Não | Não | Não |
| PoupApp | Nacional* | Sim | Parc. | Não | Não | Parc. | Não | Não | Não | Não |
| Nota Paraná | **PR** | Sim | Parc. | Não | Não | **Sim** | Parc. | Não | Parc. | Não |
| MP Brasil | ~15–16 UFs** | Sim | Parc. | Não | Não | **Sim** | Parc. | Não | Não | Não |
| Economiza AL | **AL** | Sim | Parc. | Via 3º | Não | **Sim** | Parc. | Não | **Sim** | Não |
| Quantto | B2B contratual | Sim | Sim | N/A | N/A | Reg. | N/A | N/A | **B2B** | Não |
| **notinhas.shop** | Lab **PR** → expansão*** | Alvo | Alvo | Alvo | Alvo | Alvo | Alvo | Alvo | Alvo | **Fut.** |

**Colunas:** Comp=comparar · Hist=histórico · Apart=split/economia · Vitr=vitrine + itens fora da web · Geo=item perto · Rank=lojas baratas/caras · Dest=destaques (preço abaixo do mercado) · API=B2B · Deliv=delivery/Full (loja-depósito).

\*PoupApp declara monitoramento em 26 UF+DF; liquidez varia por cidade.  
\*\*MP Brasil: adesão SEFAZ (lista muda; SP tipicamente fora) — **não é nacional**.  
\*\*\*Lab São José dos Pinhais/PR; expansão por liquidez NFC-e.

## Rollback

```bash
# reverter pasta (cuidado) ou marcar PRD §9 / curadoria como revogado
git checkout -- e-notas/marca/benchmarking-solucoes
```
