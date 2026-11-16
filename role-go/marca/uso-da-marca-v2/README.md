# RolêGo — Manual de uso da marca · v2

Manual de **uso** da marca (como aplicar em cada peça), no mesmo formato dos manuais de uso do Clozzy: capítulos com página de abertura, superfícies com a cor de cada papel, tokens e muitas aplicações. A identidade é a da RolêGo de hoje: **logo gomoso**, roxo `#9E19E9 → #6539CB → #452EFF` como superfície, ciano `#00E5E5` no Go, preto, branco, Poppins (títulos em itálico ExtraBold) e fotos de festa.

| Arquivo | O que é |
|---|---|
| [`manual-uso-marca-rolego-v2.pdf`](manual-uso-marca-rolego-v2.pdf) · `.html` | O manual, 56 páginas em 7 capítulos |
| [`tokens.css`](tokens.css) · [`tokens.json`](tokens.json) | Cores por superfície: `data-tema="roxo \| preto \| branco"` |
| [`_build.py`](_build.py) | Gerador. As superfícies ficam no dicionário `SURF` |
| [`_dia.py`](_dia.py) | Camada de dia (sol, pôr do sol, ícones de praia/bike/trilha), rodada pelo `_build.py` |

## Capítulos

1. **Fundamentos**: logo, proteção, cores, três superfícies, combinações, apoio e contraste, tipografia, elementos gráficos, slogan
2. **Linguagem**: quem aparece na foto, tratamento, fotografia e ícones, voz, legendas e microcopy, motion
3. **Produto**: interface, app, ícone e notificações, compartilhar o rolê (link, sticker, card com QR)
4. **Redes sociais**: templates de feed, feed com foto, carrossel, stories, stories com foto, perfil e destaques, perfil/anúncio/WhatsApp
5. **Site e marketing**: landing no desktop e no celular, campanha, e-mail
6. **Mundo físico**: look do rolê, merch (vestir e levar), na festa, evento, rua, kit do parceiro, institucional
7. **Regras**: usos incorretos, acessibilidade e IA, checklist e arquivos

## Dia e noite (v2: laranja chapado)

A noite não muda (logo gomoso, roxo, ciano, preto, Poppins). O dia usa o **laranja sol `#FF7A2F` chapado, sem degradê**, como no estudo `../cores-por-do-sol` “1 · Laranja · dia chapado”:

- Laranja vira **superfície** das peças de dia (post, story, capa de rolê, merch). No laranja: **Rolê branco + Go roxo `#6539CB`**, título branco grande, texto pequeno e destaque em ink `#05070F`. Ciano não entra no laranja.
- Foto de dia fica limpa; o laranja chega em **faixa** ou **moldura**, nunca como filtro/degradê por cima.
- **O sol** é um círculo de uma cor só: branco no laranja, laranja no preto.
- Páginas: 07 Cor do dia, 13 Dia e noite, 19 Rolês de dia, 26 App de dia, 35 Feed e stories de dia, 49 Merch e praia. Tokens: `--rg-laranja`, `data-tema="laranja"`.
- A v1 (laranja só como detalhe + degradê pôr do sol) está em `../uso-da-marca/`.

## Superfícies

| Superfície | Fundo | Título | Destaque | Logo (Rolê / Go) | Botão |
|---|---|---|---|---|---|
| Roxo | degradê roxo | branco | ciano (só título grande) | branco / ciano | branco + texto roxo |
| Preto | `#000` | branco | ciano | branco / ciano → azul | roxo + texto branco |
| Branco | `#FFF` | `#05070F` | `#6539CB` | ink / roxo | roxo + texto branco |

## De onde vem cada coisa

Páginas de marca, cor, tipografia, fotografia, posts, stories, merch e rua vêm do manual de identidade [`../identidade-v5-gomosa/`](../identidade-v5-gomosa/README.md): o build roda o `_build.py` de lá sem gravar a saída e pega as páginas pelo título. As 17 páginas novas (capa, organização, aberturas, superfícies, combinações, microcopy, ícone/push, compartilhar, perfil, carrossel, landings, e-mail, kit do parceiro, checklist) estão aqui. Fotos: [`../fotos-festa/`](../fotos-festa/README.md) (Pexels, só uso interno).

## Gerar de novo

```bash
cd role-go/marca/uso-da-marca-v2 && python3 _build.py
```

Se o manual v5 mudar, este muda junto.
