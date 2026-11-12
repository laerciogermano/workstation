# Clozzy — Manual de uso da marca · Estrela macia

Manual feito a partir da [identidade Estrela macia](../identidade-estrela-macia/README.md): o ícone (estrela macia com o ponto da câmera), o símbolo (estrela no anel do story carregando), a palavra Gabarito 800 e as mesmas cores. **Só preto `#000`, branco `#fff`, rosa `#FF0065`, Pink Deep `#E0005A`, roxo `#7C48C4` e cinzas neutros. Sem creme e sem quase-preto.**

| Arquivo | O que é |
|---|---|
| [`manual-uso-estrela-macia.pdf`](manual-uso-estrela-macia.pdf) · `.html` | O manual, 25 páginas |
| [`tokens.css`](tokens.css) | Variáveis por superfície: `data-tema="preto | branco | rosa | roxo"` |
| [`tokens.json`](tokens.json) | Os mesmos papéis em JSON |
| [`_build.py`](_build.py) | Gerador. As superfícies ficam no dicionário `TEMAS`; as marcas vêm de `../identidade-estrela-macia/_marca.py` |

## Páginas

Capa · sumário · a marca · proteção e tamanhos · cores · quatro superfícies · combinações · tipografia · elementos gráficos · fotografia · voz · app (telas) · app (seis temas) · ícone na tela inicial e push · landing no desktop · landing no celular · posts do feed · carrossel · stories · perfil e destaques · anúncios · e-mail · impressos e brindes · não fazer · checklist e arquivos.

## Superfícies

| Superfície | Fundo | Título | Destaque | Botão | Compra |
|---|---|---|---|---|---|
| Preto | `#000000` | branco | rosa | branco / preto | Pink Deep / branco |
| Branco | `#FFFFFF` | preto | Pink Deep | Pink Deep / branco | Pink Deep / branco |
| Rosa | `#FF0065` | branco | branco | branco / Pink Deep | branco / Pink Deep |
| Roxo | `#7C48C4` | branco | branco | branco / roxo | branco / roxo |

Regras: nada preto sobre o rosa; rosa e roxo nunca um sobre o outro (sempre preto ou branco entre eles); no branco, o rosa vira Pink Deep; no rosa, texto a partir de 20 px; ícone **ou** símbolo, nunca os dois; palavra sempre separada do símbolo.

## Gerar de novo

```bash
cd clozzy/marca/uso-da-marca-estrela-macia && python3 _build.py
```
