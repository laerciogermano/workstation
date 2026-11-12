# Clozzy — Manual de uso da marca · Estrela macia · v2

Versão mais estruturada do [manual v1](../uso-da-marca-estrela-macia/README.md), com **muito mais utilizações** e **fotos no tom TikTok**: criadoras de 18 a 22 anos com ring light, selfie, dancinha, make e amigas. Nada sensual: o lado exclusivo da Clozzy fica no ar, não na foto. **Um rosa só: Pink Deep `#E0005A`** (o `#FF0065` saiu da paleta).

| Arquivo | O que é |
|---|---|
| [`manual-uso-estrela-macia-v2.pdf`](manual-uso-estrela-macia-v2.pdf) · `.html` | O manual, 42 páginas em 7 capítulos |
| [`tokens.css`](tokens.css) · [`tokens.json`](tokens.json) | Cores por superfície (preto, branco, Pink Deep, roxo) |
| [`_build.py`](_build.py) | Gerador. Reaproveita as peças do v1 trocando a cor e as fotos |
| [`../fotos-criadoras/`](../fotos-criadoras/README.md) | As 22 fotos usadas (banco Pexels). São pessoas reais **sem autorização de imagem para a Clozzy**: só para uso interno |

## Capítulos

1. **Fundamentos** — marca, proteção, cores, quatro superfícies, combinações, tipografia, elementos gráficos, stickers e ícones
2. **Linguagem** — fotografia (direção e com a marca), voz, legendas e microcopy
3. **Produto** — telas do app, seis temas, virar criadora, perfil e link na bio, compartilhar o perfil, ícone e notificações
4. **Redes sociais** — TikTok/Reels (vídeo, perfil e capas), stories, posts do feed, carrossel, Instagram, kit da criadora
5. **Site e marketing** — landing no desktop e no celular, anúncios, e-mail
6. **Mundo físico** — impressos e brindes, evento e pop-up
7. **Regras** — não fazer e checklist

## Gerar de novo

```bash
cd clozzy/marca/uso-da-marca-estrela-macia-v2 && python3 _build.py
```

`fotos/` e `_preview.py` nesta pasta vieram de outra sessão e não são usados por este gerador.
