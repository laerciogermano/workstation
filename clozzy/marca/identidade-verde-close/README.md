# Clozzy — Identidade Estrela macia + verde close (estudo de variações)

Entra uma cor nova na marca: o **verde do selo de close friends**, medido no print [`../refs/Captura de Tela 2026-11-11 às 16.00.35.png`](../refs/) como **#69C353**. Esse verde não aguenta texto branco (2,2:1) e tem quase a mesma luminância do Pink Deep, então vem junto um **Verde Deep #13803A** para superfície com texto branco (5,0:1). É a mesma lógica do Pink Deep.

| Arquivo | O que é |
|---|---|
| [`identidade-verde-close.pdf`](identidade-verde-close.pdf) · `.html` | O estudo, 16 páginas |
| `svg/` | Símbolo e logo de cada variação em cada superfície (60 arquivos) |
| [`_build.py`](_build.py) | Gerador. Reaproveita a identidade Estrela macia e as peças do manual v2 |

## As cinco variações

| | Variação | Paleta | Ideia |
|---|---|---|---|
| A | **Verde no lugar do roxo** | Pink Deep, verde, Verde Deep, preto, branco | O lado da criadora (convite, painel) vira verde; o roxo sai |
| B | **Estrela verde** | Paleta atual + verde só no close | Verde só na estrela do close: selo, anel ativo e conteúdo trancado |
| C | **Verde protagonista** | Verde, Verde Deep, Pink Deep só na compra | Anel verde no preto; o rosa vive só no botão de compra |
| D | **Close friends puro** | Verde, Verde Deep, preto, branco | Sem rosa e sem roxo |
| E | **Quatro cores** | Pink Deep, roxo, verde, Verde Deep | Rosa é a fã, roxo é a criadora, verde é o close |

Cada variação tem uma página de paleta, marca nas superfícies, logo, ícone de app e regras, e uma página com 10 peças: feed 4:5, capa tipográfica, story com close ativo, conteúdo trancado, convite de criadora, tela do app, anúncio 1,91:1, destaques do perfil, notificação e selo do close. No fim vêm comparações lado a lado e uma recomendação.

## Regras novas que valem para todas

- Pink Deep e verde nunca um sobre o outro nem encostados: sempre com preto ou branco entre eles.
- Sobre o verde close, texto e palavra em preto. Branco só na estrela, como no selo.
- No branco, o verde vira Verde Deep.

## Gerar de novo

```bash
cd clozzy/marca/identidade-verde-close && python3 _build.py
```

Depende de `../uso-da-marca-estrela-macia-v2/_build.py`, que puxa o v1, a identidade, as fontes e `../fotos-criadoras/` (Pexels, só uso interno).

## Caminho inverso

Apagar esta pasta. Nada fora dela depende dela, e a identidade atual não foi alterada.
