# Motion guidelines — RolêGo v4

Atributos → comportamento: **na hora** (rápido, sem enrolar) · **descolada** (desacelera forte, sem firula) · **segura** (nunca pisca, sempre tem alternativa sem movimento).

## Princípios

1. Motion explica estado (swipe, match, chegou) — não decora.
2. O logo assentado fica parado. O pin drop roda uma vez, no load ou no splash.
3. Toda animação tem versão `prefers-reduced-motion`.

## Movimento-assinatura: o pin cai

| Tempo | O que acontece | Easing |
|---|---|---|
| 0–220 ms | “Rolê” entra da esquerda (x −16 px → 0, opacidade 0 → 1) | `--ease-standard` |
| 120–400 ms | O Go cai de cima (y −40% → 0) e assenta **sem quicar** | `--ease-emphasized` |
| 400–600 ms | Um anel ciano sai do furo do pin, uma vez (escala 0 → 1,8, opacidade → 0) | `--ease-standard` |
| 600 ms | End frame = lockup estático canônico | — |

Demo: [`motion/logo-reveal.html`](motion/logo-reveal.html) (clique para repetir).

## Tokens

| Token | Valor | Uso |
|---|---|---|
| `--dur-instant` | 100 ms | press do botão (escala .97), toggle |
| `--dur-fast` | 140 ms | hover, chip |
| `--dur-default` | 220 ms | swipe do card saindo, sheet |
| `--dur-slow` | 400 ms | match, entrada de tela |
| `--dur-logo` | 600 ms | pin drop |
| `--ease-standard` | `cubic-bezier(.2,0,0,1)` | padrão |
| `--ease-emphasized` | `cubic-bezier(.16,1,.3,1)` | entradas, pin drop |
| `--ease-exit` | `cubic-bezier(.7,0,.84,0)` | saídas |

## Na interface

- **Swipe:** o card segue o dedo; ao soltar, sai em 220 ms com `--ease-exit`. Volta ao centro com `--ease-emphasized`.
- **Match:** o Go cai sobre o card (400 ms) + um ping ciano. Texto “Seu grupo deu match!” aparece junto — o motion não é o único sinal.
- **Notificação de “tá rolando”:** sem animação própria; usa a do sistema.
- **Stagger** de listas: no máx. 40 ms entre itens, até 6 itens.

## Logo

| Pode | Não pode |
|---|---|
| Pin drop único no load (≤ 600 ms) | Girar, quicar, esticar ou achatar o Go |
| Morph símbolo ↔ lockup (mesma geometria) | Loop infinito, glow pulsando |
| Ping ciano uma vez no furo | Recolorir fora da paleta durante a animação |
| End frame = lockup estático | Piscar mais de 3× por segundo · animar a cada scroll |

## Reduced motion

Mostrar o end frame direto. O ping vira troca de cor (furo do pin fica ciano por 600 ms). Swipe vira fade de 0 ms + mudança de card.

## Entrega

SVG masters em `../logo-v4/`. Para vídeo (Reels, abertura): exportar o HTML de demo com gravação de tela em 60 fps, 1080 × 1080 e 1080 × 1920, fundo roxo. Lottie/Rive quando o app pedir.
