# Motion — Clozzy 2028 (Nível 1)

Atributos: próximo · direto · confiante · discreto. Motion confirma uma ação, não decora.

## Princípios

1. **Confirmar, não entreter.** Animação só onde há mudança de estado (comprou, liberou, publicou).
2. **Uma assinatura por tela.** “Abrir o círculo” não se repete na mesma vista.
3. **Rápido por padrão.** Tudo fora da assinatura fica entre 160 e 240 ms.
4. **Estado nunca só por movimento.** Sempre há texto e ícone junto.

## Tokens (`tokens.css`)

| Token | Valor | Uso |
|---|---|---|
| `--cz-dur-instant` | 100 ms | press, ripple |
| `--cz-dur-fast` | 160 ms | hover, toggle, chip |
| `--cz-dur-default` | 240 ms | sheet, card, troca de página |
| `--cz-dur-signature` | 520 ms | abrir o círculo |
| `--cz-ease-standard` | cubic-bezier(.2,0,0,1) | entradas e transições |
| `--cz-ease-exit` | cubic-bezier(.7,0,.84,0) | saídas |
| `--cz-ease-pop` | cubic-bezier(.34,1.56,.64,1) | só a estrela e a confirmação |

## Signature move — “abrir o círculo”

| Tempo | Anel | Estrela |
|---|---|---|
| 0 ms | fechado, rotação −25° | escala 0,9 |
| 0–280 ms | abre e gira até 0° (`ease-standard`) | — |
| 200–520 ms | — | 0,9 → 1 (`ease-pop`) |

Onde: splash do app · confirmação de pagamento · “acesso liberado”.

```css
.cz-mark-ring { transform-origin: 50% 50%; animation: cz-open var(--cz-dur-signature) var(--cz-ease-standard) both; }
.cz-mark-star { transform-origin: 50% 50%; animation: cz-pop var(--cz-dur-signature) var(--cz-ease-pop) both; }
@keyframes cz-open { from { transform: rotate(-25deg); } to { transform: rotate(0); } }
@keyframes cz-pop  { 0%, 38% { transform: scale(.9); } 100% { transform: scale(1); } }
```

## Entrada / saída

- Entrada: opacidade 0→1 + translateY 8px→0 · `--cz-dur-default` · `ease-standard`.
- Saída: opacidade 1→0 · `--cz-dur-fast` · `ease-exit`.
- Sheet do checkout: sobe 100% → 0 · 240 ms.

## Logo — nunca

Loop de rotação · pulsar · bounce no wordmark · trocar a cor durante a animação · animar sobre foto agitada.

## Reduced motion

`prefers-reduced-motion: reduce` → todas as durações vão a 0 (já em `tokens.css`); a assinatura vira o estado final direto. Progresso do Pix mostra texto (“Aguardando pagamento…”), não só a barra.

## Do / Don't

| Do | Don't |
|---|---|
| Estrela “pop” ao liberar acesso | Confete, partículas |
| 160 ms no hover de card | Parallax no catálogo |
| Barra de progresso no Pix + texto | Spinner infinito sem texto |
| Uma assinatura por tela | Assinatura em todo botão |
| Lottie exportado do SVG master | Lottie desenhado à mão fora do grid |
