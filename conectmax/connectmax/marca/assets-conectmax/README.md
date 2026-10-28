# Assets ConectMax (manual)

## Canônicos no manual

| Arquivo | Uso |
|---------|-----|
| [`logo-noite.png`](logo-noite.png) | Assinatura sobre fundo preto |
| [`logo-header.png`](logo-header.png) | Assinatura sobre fundo claro |
| [`logo-branco.png`](logo-branco.png) | Mono claro (sobre azul) |
| [`simbolo-oficial.png`](simbolo-oficial.png) | Só o globo (PNG original) |
| [`icone-512.png`](icone-512.png) | Ícone app |

## Outros insumos

`logo-oficial.png`, `banner-economiza.jpg`, `site-print-01.png`, `icone-noite.png`, `icone-oficial-hi.png`.

## SVGs de rascunho (não usar no manual)

`logo-noite.svg`, `logo-claro.svg`, `simbolo-noite.svg`, `simbolo-claro.svg` — recriações geométricas; ficaram abaixo do PNG oficial. **Caminho inverso:** o HTML usa de novo os PNGs; estes SVG podem ser apagados se não forem necessários.

## Rollback

Voltar o HTML a apontar para os `.svg` e repor o `<img>` do símbolo à direita na capa.

## Globo vetorizado (traçado do PNG oficial)

`globo-rede-preto.svg` (#181818), `globo-rede-branco.svg` (#FFFFFF), `globo-rede-azul.svg` (#0070BC) — só o globo/rede wireframe.

- Formato: um único `<path>` (~92 KB), viewBox 464×554; escala sem perda
- Cor: mudar o `fill` no SVG ou via CSS se inline
- Fiel ao original (nós/hastes do logo); não usar os `simbolo-*.svg` geométricos
- Regenerar: `make_globo_svg.py` (pacote `potracer` em venv temporário)

No IV ConectTech o símbolo isolado aponta para estes SVG (app continua `icone-512.png`).

## Logo CONECTTECH

`logo-tech-noite.png`, `logo-tech-claro.png`, `logo-tech-header.png`, `logo-tech-branco.png`, `logo-tech-wordmark-noite.png` — logo ConectMax com MAX → TECH (`make_logo_tech.py`).

Regenerar a partir dos canônicos:

```bash
python3 make_logo_tech.py logo-noite.png logo-tech-noite.png
python3 make_logo_tech.py logo-header.png logo-tech-claro.png 0.20
python3 make_logo_tech.py logo-branco.png logo-tech-branco.png 0.08
cp logo-tech-claro.png logo-tech-header.png
```

No HTML: classe `.logo-tech` + tamanho (`.xs`/`.sm`/…) por **largura**, igual a `.logo-img` — nunca `height` + `max-width` (distorce nos slides).

**Antes → depois:** fundos escuros do IV ConectTech usavam `#181818` / graphite; agora `--cx-black` e `--cx-graphite` = `#000000`. Rollback: restaurar tokens `#181818` / `#151A26` e as classes de altura inline nas logos.
