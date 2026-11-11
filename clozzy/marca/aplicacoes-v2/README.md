# Clozzy — aplicações da marca (v2)

Documento de 15 páginas (16:9) mostrando a [`identidade-oficial-v2`](../identidade-oficial-v2/README.md) em uso: landing, app, posts, carrossel, stories, perfil, e-mail, avisos e peças físicas.

| Arquivo | O que é |
|---|---|
| [`aplicacoes-marca-clozzy-v2.pdf`](aplicacoes-marca-clozzy-v2.pdf) · `.html` | O documento |
| `fotos/` | 4 fotos geradas (costas, boca, tecido, pescoço) — recortes sem rosto, luz rosa/violeta |
| `_build.py` | Gera o HTML |
| `shot.mjs` | PDF ou PNG por página via Chrome CDP (:9290) |

**Direção:** sensual por recorte e luz baixa, não explícito. Fundo escuro por padrão; superfícies claras em **#FFFFFF** (o creme #FFF6F0 não é usado). Regras de cor da identidade mantidas (rosa só com branco, preto com anel rosa, roxo sem rosa em cima, rosa e roxo nunca vizinhos).

```bash
cd clozzy/marca/aplicacoes-v2
python3 _build.py
node shot.mjs aplicacoes-marca-clozzy-v2.html --pdf aplicacoes-marca-clozzy-v2.pdf
node shot.mjs aplicacoes-marca-clozzy-v2.html --pages _pages   # conferir cada página
```

Depende de `../identidade-oficial-v2/svg/` e `../identidade-nova/fonts/`.

## Antes → depois
- Antes: um piloto de landing page (`landing/index.html`, fundo creme) — pedido era documento. Removido; fica no commit `5c9d3f4c`. A landing agora é as páginas 4–5 do documento, sobre fundo escuro/branco.

## Caminho inverso
- Landing antiga: `git checkout 5c9d3f4c -- clozzy/marca/aplicacoes-v2/landing`.
- Tudo: `rm -rf clozzy/marca/aplicacoes-v2`; Chrome da :9290 e `~/chrome-profiles/clozzy-mockups` podem ser apagados.
