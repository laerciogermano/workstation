# RolêGo macio · possibilidades

Logo v4 ([`../logo-v4/`](../logo-v4/README.md)) com as bordas suavizadas, no nome e no símbolo, como foi feito no “clozzy” de letras redondas. O desenho, o peso e as cores não mudam: só as quinas viram curva.

| Opção | Raio fora / dentro* | |
|---|---|---|
| A · Sutil | 5 / 0 | só tira o fio das quinas |
| B · Macia | 11 / 0 | equivalente ao raio do clozzy |
| C · Bem macia | 18 / 0 | pontas bem redondas |
| D · Macia por inteiro | 12 / 10 | cantos de dentro também |
| E · Gomosa | 28 / 18 | raio máximo |

\* unidades do lockup (altura do R ≈ 196). Cada quina vira uma curva com recuo limitado pela quina vizinha, então traço fino (acento, barra do “e”, canal do Go) nunca some.

| Arquivo | O que é |
|---|---|
| [`possibilidades-rolego-macio.pdf`](possibilidades-rolego-macio.pdf) · `.html` | Folha de escolha, 3 págs. (comparação, de perto, tamanho de uso) |
| `opcao-A/` … `opcao-E/` | Os 18 SVGs de cada opção, com os mesmos nomes do `logo-v4` |
| `_macia.py` · `_gerar.py` · `_folha.py` | Arredondamento, gerador dos SVGs, folha |

```bash
cd role-go/marca/logo-v4-macia && python3 _gerar.py && python3 _folha.py
```

Escolhida a opção, o manual `identidade-v4` é gerado de novo com os SVGs dela (o `_common.path_of` procura primeiro na pasta do manual).
