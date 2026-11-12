# Clozzy — Identidade Estrela macia + verde close (branco no verde, sem o ponto)

Identidade feita a partir da [variação verde em detalhe](../identidade-verde-detalhe/README.md), com duas mudanças:

1. **No verde, tudo branco.** Estrela, texto do selo, check e marca em cima do verde `#69C353` são brancos. Nada preto sobre o verde.
2. **Sem o ponto da câmera.** Em **todas** as marcas (ícone, símbolo, logo, app, selos, estrela do trancado) fica só a estrela macia e o arco em volta.

O resto continua como na variação de referência: paleta de hoje (**Pink Deep, roxo, preto e branco**) e um tom só de verde, nos detalhes do close.

| Arquivo | O que é |
|---|---|
| [`identidade-verde-branco.pdf`](identidade-verde-branco.pdf) · `.html` | O documento, 9 páginas |
| `svg/` | Símbolo, ícone, logo e app em preto, branco, Pink Deep, roxo, verde e close no preto (anel verde), mais `estrela-do-close.svg` (25 arquivos) |
| [`_build.py`](_build.py) | Gerador. Reaproveita `../identidade-verde-close/_build.py` e troca a estrela por uma sem o ponto |

## Regras do verde

- Verde = close. Se não é do close, não é verde. Um tom só: `#69C353`.
- Pequeno: até uns 2% da peça. Nunca botão de compra, fundo de peça ou texto verde.
- Aparece direto sobre preto, branco ou foto. Em Pink Deep ou roxo, só dentro de pílula preta.
- **No verde, tudo branco.** Branco no verde dá 2,2:1, abaixo do AA, então o texto branco no verde fica restrito a rótulo curto em peso 800+ (CLOSE, DO CLOSE). Nunca frase.

## Gerar de novo

```bash
cd clozzy/marca/identidade-verde-branco && python3 _build.py
```

## Caminho inverso

Apagar esta pasta. A identidade Estrela macia original (com o ponto) não foi alterada.
