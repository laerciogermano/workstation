# Clozzy — Manual de uso da marca

Feito a partir da [`identidade-oficial-v2/`](../identidade-oficial-v2/README.md) (mesmo símbolo, lockup Gabarito 800, cores e fontes). Aprofunda a página "Cor nas peças": **quatro temas** (preto, branco, roxo, rosa), cada um com a cor de cada papel (superfície, título, texto, apoio, destaque, botão, secundário, link, chip, linha) e aplicações.

| Arquivo | O que é |
|---|---|
| [`manual-uso-marca-clozzy.pdf`](manual-uso-marca-clozzy.pdf) · `.html` | O manual, 30 páginas |
| `tokens.css` | Variáveis por tema: `data-tema="preto \| branco \| roxo \| rosa"` |
| `tokens.json` | Os mesmos papéis em JSON |
| `_build.py` | Gerador; os temas ficam no dicionário `TEMAS` |

```bash
cd clozzy/marca/uso-da-marca && python3 _build.py
```

## Páginas
Capa · sumário · os quatro temas · anatomia · tema preto / branco / roxo / rosa · tokens lado a lado · contraste · proporção e vizinhança · botões · componentes · tipografia · posts do feed · formatos de post · carrossel · stories · perfil e destaques · landing desktop · landing no celular · app escuro · app claro · momentos de cor · e-mail, push e link · anúncios · impressos · não fazer · checklist e tokens · arquivos.

## Temas (superfície · título · apoio · destaque · botão)
| Tema | Superfície | Título | Apoio | Destaque | Botão (fundo/texto) |
|---|---|---|---|---|---|
| Preto | `#14090F` | branco | branco 68% | rosa `#FF0065` | branco / ink |
| Branco | `#FFFFFF` | ink | Muted | Pink Deep | Pink Deep / branco |
| Roxo | `#7C48C4` | branco | Lavanda | Lavanda | branco / roxo |
| Rosa | `#FF0065` | branco | branco | branco | branco / Pink Deep |

Regras: nada preto no rosa, nada rosa no roxo, rosa e roxo nunca encostados (sempre preto ou branco entre eles); no branco o rosa é Pink Deep; no rosa nenhum texto abaixo de 20 px (3,9:1).

## Rollback

```bash
rm -rf clozzy/marca/uso-da-marca
```
