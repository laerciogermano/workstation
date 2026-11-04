# Benchmarking — concorrentes (Cupido)

Matriz vs **dating**, **blind/anon match** e **IA wingman / matchmaker**.

- **Board local:** [`../../../Trello/Cupido/`](../../../Trello/Cupido/)
- **Visão:** [`../../README.md`](../../README.md)
- **Entrada:** [`00-curadoria.html`](00-curadoria.html)

## Ordem (mais → menos relevantes ao posicionamento)

| # | Produto | Tipo | vs Cupido |
|---|---------|------|-----------|
| 1 | **Tinder** | Swipe massivo | Volume sem agente nem histórico profundo |
| 2 | **Bumble** | Swipe + mulher inicia | Ainda chat humano; pouco anonimato intermediário |
| 3 | **Hinge** | Prompts / “designed to be deleted” | Contexto em perfil, não agente operando |
| 4 | **Rizz / wingman apps** | IA escreve mensagem | Frase pronta; não opera funil até encontro |
| 5 | **YourMove / AI dating coaches** | Coach de chat | Assiste você; não conversa anônimo pelo outro lado |
| 6 | **Teaser / slow dating** | Revelação gradual | Anonimato parcial; sem ingestão de histórico |
| 7 | **Blind dating / S’Match afins** | Match cego | Fit sem agente + histórico |
| 8 | **Match.com / eHarmony** | Matchmaking clássico | Questionário, não chats reais |
| 9 | **Hurble (lab)** | Roulette + social | Acaso social; não agente dating |

## Insights p/ identidade

- Dating dominante = foto-first, purple/pink dark ou amarelo Bumble — **não clonar**.
- Wingman IA = utilitário/chat bubble — Cupido precisa parecer **agente de confiança**, não gerador de pickup lines.
- Oportunidade: coral + teal (conexão + agente), light canvas, anonimato até o fit.

## Gerar PDF

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
  --print-to-pdf=cupido/marca/benchmarking-concorrentes/00-curadoria.pdf \
  "file://$(pwd)/cupido/marca/benchmarking-concorrentes/00-curadoria.html"
```

## Rollback

```bash
rm -rf cupido/marca/benchmarking-concorrentes
```
