# RolêGo — Identidade visual v4 (kit completo)

Sistema de marca montado sobre o **logo v4** ([`../logo-v4/`](../logo-v4/README.md): Rolê com acento, Go = símbolo, superfície roxa com marca branca) e seguindo o pacote [`core/definir-projeto-moderno/05-identidade-visual`](../../../core/definir-projeto-moderno/05-identidade-visual/README.md) (essência → logo system → cor + AA → tipo → imagery → voz → motion → BRAND.md + tokens → aplicações).

| Arquivo | O que é |
|---|---|
| [`identidade-visual-rolego-v4.pdf`](identidade-visual-rolego-v4.pdf) | Manual, 26 págs. A4 paisagem |
| `identidade-visual-rolego-v4.html` | Mesmo manual, HTML self-contained (imagens embutidas) |
| [`BRAND.md`](BRAND.md) | Guia de uma página (regras, cores, tipo, voz, motion, IA) |
| [`tokens.css`](tokens.css) | Tokens de cor, tipo, raio e motion + componentes base |
| [`motion-guidelines.md`](motion-guidelines.md) · [`motion/logo-reveal.html`](motion/logo-reveal.html) | Movimento-assinatura “o pin cai” + demo |
| `posts/*.png` | 9 templates de post 1080 × 1080 |
| `stories/*.png` | 3 templates de story 1080 × 1920 |
| `_src/*.html` | HTML de cada post/story (gerado; editar em `_posts.py`) |

## Páginas do manual

1 capa · 2 sumário · 3 essência · 4 logo system · 5 construção, área de proteção e mínimos · 6 usos incorretos · 7 slogan · 8 cores principais · 9 cores de apoio + tabela de contraste WCAG · 10 tipografia · 11 elementos gráficos · 12 fotografia e ícones · 13 voz e tom · 14 motion · 15 interface · 16 feed (9 posts) · 17 stories · 18 redes (perfil, anúncio, WhatsApp, carrossel) · 19 app · 20 merch: camisetas, moletom, boné · 21 merch: canecas, garrafa, capinha, chaveiro-abridor, bottons, caderno · 22 no rolê: pulseira, ingresso, crachá, copo, adesivos, backdrop, ecobag · 23 rua: outdoor, mupi, lambe, selo, wind banner · 24 institucional · 25 acessibilidade, IA e checklist · 26 contracapa.

As págs. 7, 18, 19, 22, 23 e 24 vêm de [`../logo-v4/_usos.py`](../logo-v4/_usos.py) (mesmo código, renumerado; domínio trocado para rolego.com.br).

## Gerar de novo

```bash
cd role-go/marca/identidade-v4
python3 _posts.py    # posts/ e stories/ (Chrome headless)
python3 _motion.py   # motion/logo-reveal.html
python3 _build.py    # manual HTML + PDF
```

Precisa do Google Chrome em `/Applications` e de internet para a Poppins (Google Fonts).

## Rollback

```bash
rm -rf role-go/marca/identidade-v4
```
