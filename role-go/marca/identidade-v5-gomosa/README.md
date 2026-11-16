# RolêGo · Identidade visual v5 (logo gomosa + fotos de festa)

Manual completo da marca com a **logo gomosa** (opção E de [`../logo-v4-macia/`](../logo-v4-macia/README.md): mesmo desenho do v4, cantos arredondados por fora e por dentro) e **fotografia de festa**: meninas de 18 a 22 anos, loiras, em luz neon roxa/azul/ciano. Base: [`../identidade-v4/`](../identidade-v4/README.md).

| Arquivo | O que é |
|---|---|
| [`identidade-visual-rolego-v5.pdf`](identidade-visual-rolego-v5.pdf) · `.html` | Manual, 33 págs. A4 paisagem |
| `v4-*.svg` | Logo gomosa (lockups, símbolo, ícones, empilhado). Mesmos nomes do v4 |
| `posts/` · `stories/` | 9 posts e 3 stories em PNG (já com as fotos novas) |
| `_festa.py` | As 7 págs. novas de foto (18–24) |
| `BRAND.md` · `tokens.css` · `motion/` | Iguais ao v4 |

## O que é novo em relação ao v4

- Logo gomosa em todas as páginas e peças.
- Pág. 12 com regras de foto novas (quem aparece, luz, nada sensual).
- 18 Fotografia · quem aparece (mosaico + casting) · 19 Tratamento (original, degradê roxo, duotone, fade) · 20 Feed com foto (6 posts) · 21 Stories com foto (enquete, contagem, quem vai, moldura “Eu fui”) · 22 Look do rolê (cropped, regata, baby look, bucket, boné, bolsinha, tattoo, pulseira) · 23 Na festa (telão, pulseira, photo point, backdrop, copo) · 24 Campanha (outdoor, banners, anúncio 4:5, ingresso).
- Fotos das págs. reaproveitadas (redes, app, rua) trocadas pelas de festa.

## Fotos

Em [`../fotos-festa/`](../fotos-festa/README.md): banco Pexels, **só uso interno** (manual e protótipo). Para campanha publicada, fotografar com contrato de imagem.

## Gerar de novo

```bash
cd role-go/marca/identidade-v5-gomosa
python3 _posts.py && python3 _motion.py && python3 _build.py
```
