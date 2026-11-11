# Clozzy — Referências de apps + modelos + logo “Story”

**Paleta fechada (só estas):** Pink Clozzy `#FF0065` · Pink Deep `#E0005A` · Roxo v1 `#7C48C4` · Ink `#14090F` · Cream `#FFF6F0` · Branco.
**Palavras-chave:** vídeos, stories, chat, videochat, fechado, privado, close, close friends, estrela.

| Arquivo | O que é |
|---|---|
| [`referencias-e-modelos-clozzy.pdf`](referencias-e-modelos-clozzy.pdf) | Documento com 12 páginas A4 paisagem: brief, 3 páginas de referências, comparação v1 × Story, 10 telas-modelo |
| `referencias-e-modelos-clozzy.html` | Mesmo documento (self-contained) |
| `refs/<app>/1-5.jpg` + `meta.json` | Capturas da App Store (API iTunes lookup) de 17 apps. **Uso interno, só como referência** |
| `logo-atual/logo-v1.svg` | Logo atual baixada de hml.clozzy.com.br/assets/images/logo.svg |
| `logos/` | Story (anel fino + estrela menor), Story + disco v1, Círculo próximo: cor, dark, 16 px, mono, lockups (Gabarito e wordmark v1) |
| `modelos/img/` | Fotos-placeholder abstratas em duotone da paleta, sem pessoas reais |
| `_fotos.py` · `_logos_story.py` · `_build.py` | Geradores |

Apps: Instagram, Snapchat, TikTok, BeReal, Locket, Telegram, Discord, Substack, Patreon, Partiful, Luma, SNKRS, Cash App, Revolut, Spotify, Depop, Airbnb.

## Gerar de novo

```bash
cd clozzy/marca/referencias-apps && python3 _fotos.py && python3 _logos_story.py && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/referencias-apps
```
