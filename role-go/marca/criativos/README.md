# RoleGo — Criativos (identidade v1)

Card: https://trello.com/c/Taaxly1i · task: [`../../tasks/6ae6554556166729dd901311/`](../../tasks/6ae6554556166729dd901311/README.md)

| Arquivo | Peça |
|---------|------|
| [`criativos-rolego-v1.html`](criativos-rolego-v1.html) | Fonte (CSS/wordmark/telas copiados do manual v1) |
| [`post-01.png`](post-01.png) | Feed 4:5 — "Chega de sofrer para decidir onde sair." (foto) |
| [`post-02.png`](post-02.png) | Feed 4:5 — "Encontre pessoas que também querem ir!" (celulares) |

Fotos em `img/` recortadas dos prints anexados no card.

## Gerar PNG

```bash
for p in 1 2; do "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir=/tmp/rg-chrome --force-device-scale-factor=2 --window-size=540,675 --virtual-time-budget=8000 \
  --screenshot="$PWD/post-0$p.png" "file://$PWD/criativos-rolego-v1.html?p=$p"; done
```
