# RoleGo — Marca

## Identidade visual v1

Manual completo, 16 páginas em A4 paisagem, no estilo dos banners de [`../epics.pdf`](../epics.pdf) (fundo preto com estrelas e ondas neon, chip numerado, títulos gigantes com barra em gradiente, celulares com contorno neon, CTA ciano → violeta): capa-banner, essência, tom de voz, logo e símbolo, versões e usos incorretos, paleta, código de cores e contraste, tipografia (Poppins + Inter), elementos gráficos, componentes, app (splash/swipe/match), template de banner de épico 16:9, ingresso/Wallet/push, redes sociais, impressos de guerrilha e contracapa.

| Arquivo | Uso |
|---------|-----|
| [`identidade-visual-rolego-v1.html`](identidade-visual-rolego-v1.html) | Manual (abrir no browser / imprimir PDF) |
| [`identidade-visual-rolego-v1.pdf`](identidade-visual-rolego-v1.pdf) | PDF gerado do HTML |
| [`identidade-visual-rolego-v1.zip`](identidade-visual-rolego-v1.zip) | Pacote HTML + PDF |

Tokens e regras: [`../identidade-visual.md`](../identidade-visual.md) · molde: [`../input/referencia-marca/README.md`](../input/referencia-marca/README.md) · card: https://trello.com/c/gU37I2lg

O wordmark e as telas do app são montados por script no fim do HTML (`buildLogos`, `SCREENS`). Texto em gradiente vira SVG no carregamento: `background-clip:text` gera uma caixa fina em volta das letras no PDF do Chrome.

## Gerar PDF de novo

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
  --print-to-pdf=role-go/marca/identidade-visual-rolego-v1.pdf \
  "file://$(pwd)/role-go/marca/identidade-visual-rolego-v1.html"
```

## Rollback

```bash
rm -rf role-go/marca
```
