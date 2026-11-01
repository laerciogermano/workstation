# Logo — notinhas.shop

Entrega do card [Criar logo do notinhas.shop](https://trello.com/c/26aOrY0z).

## Canônico

| Arquivo | Uso |
|---------|-----|
| [`simbolo-gradiente.svg`](simbolo-gradiente.svg) / [`simbolo-512.png`](simbolo-512.png) | Ícone app / splash (padrão) |
| [`simbolo-192.png`](simbolo-192.png) · [`simbolo-32.png`](simbolo-32.png) · [`simbolo-16.png`](simbolo-16.png) | PWA / favicon |
| [`simbolo-azul.svg`](simbolo-azul.svg) · [`simbolo-verde.svg`](simbolo-verde.svg) | Variantes de fundo sólido |
| [`simbolo-outline.svg`](simbolo-outline.svg) · [`simbolo-mono.svg`](simbolo-mono.svg) · [`simbolo-negativo.svg`](simbolo-negativo.svg) | Sobre claro / 1 cor / sobre escuro |
| [`simbolo-mark.svg`](simbolo-mark.svg) | Marca branca (sobre gradiente/azul/verde) |
| [`wordmark-cor.svg`](wordmark-cor.svg) / [`wordmark-cor.png`](wordmark-cor.png) | Assinatura principal |
| [`wordmark-branco.*`](wordmark-branco.svg) · [`wordmark-mono.*`](wordmark-mono.svg) | Sobre escuro / 1 cor |
| [`logo-horizontal.png`](logo-horizontal.png) | Ícone + wordmark |

**Regras:** Plus Jakarta ExtraBold; `notinhas` `#014380` · `.shop` `#00984B`; símbolo = recibo + QR + seta ↓ verde; nunca “e-notas” no wordmark público.  
**Mínimos:** wordmark 120 px · símbolo 24 px.

## Antes → depois

Rascunho tipográfico só no HTML de identidade → kit SVG/PNG em `marca/logo/` (+ seta ↓ mais legível no `#nt-mark` dos manuais).

## Rollback

```bash
rm -rf e-notas/marca/logo
# restaurar path da seta nos manuais se necessário (git checkout)
```
