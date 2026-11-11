# Clozzy — Identidade visual oficial

Documento de identidade com o **lockup equilibrado** do [`logo-letreiro-v2/`](../logo-letreiro-v2/README.md) como logo oficial (símbolo da rodada 10 + Gabarito 800), em quatro versões: **preto, branco, roxo e rosa**. Refs: `refs/melhores/` (`86609c0e`, `14.03.10`, `14.34.45`, `14.35.14`, `14.43.41`; tipografia branca grande em fundo preto da `14.50.17`).

## Regras de cor

| Versão | Fundo | Palavra | Anel | Estrela |
|---|---|---|---|---|
| Preto | `#14090F` | branco | **rosa** | **branco** |
| Rosa | `#FF0065` | branco | branco | branco |
| Roxo | `#7C48C4` | branco | branco | branco |
| Branco | `#FFFFFF` | ink | Pink Deep | Pink Deep |

- Círculo rosa só no preto, **sempre com estrela branca**.
- Nunca preto sobre o rosa. Nunca rosa sobre o roxo (nem roxo sobre o rosa).
- Preto e roxo sobre fundos escuros ficam fora por contraste (3,3:1).

## Cores
Principais: Rosa `#FF0065`, Preto `#14090F`, Roxo `#7C48C4`, Branco. Apoio: Pink Deep `#E0005A`, Cream `#FFF6F0`, Rosa suave `#FFD9E7`, Lavanda `#EBE3FA` (nova, tint do roxo), Muted `#6B5A62`. Rosa e roxo são vizinhos na roda (337° e 266°), progressão análoga rosa → violeta (mycolourtaste.com/colors/violet, zaps.design/colors/magenta); ficam sempre em superfícies separadas.

## Arquivos

| Arquivo | O que é |
|---|---|
| [`identidade-clozzy-oficial.pdf`](identidade-clozzy-oficial.pdf) · `.html` | 16 páginas: essência, logo, construção, família, 4 versões, regra do círculo rosa, matriz logo × fundo, paleta, cor nas peças, tipografia, respiro e mínimos, usos incorretos, aplicações, voz, kit |
| `svg/` | Horizontal, empilhado, palavra e símbolo nas 4 versões (com e sem placa), 1 cor (ink, branco, roxo, rosa), corte pequeno, app-icon e favicon |
| `_marca.py` | Regras de cor (`VERSOES`, `UMA_COR`) e exportação |
| `_build.py` | Gerador do documento |

```bash
cd clozzy/marca/identidade-oficial && python3 _marca.py && python3 _build.py
```

Depende de `../logo-letreiro-v2/` (lockup e símbolo) e `../identidade-nova/fonts/`.

## Caminho inverso
- **Antes:** o `logo-letreiro-v2` usava símbolo ink no rosa, rosa no roxo e anel branco + estrela rosa no preto. **Depois:** nada preto no rosa, nada rosa no roxo, e no preto anel rosa + estrela branca.
- Para voltar: [`../logo-letreiro-v2/`](../logo-letreiro-v2/README.md) (não foi alterado). Para mudar uma versão, edite `VERSOES` em `_marca.py` e rode os dois scripts.

## Rollback

```bash
rm -rf clozzy/marca/identidade-oficial
```
