# Clozzy — Manual de identidade visual v2.0

Mesmas 26 páginas e a mesma estrutura da [v1](../apresentacao-identidade/README.md); muda **só cor e tom**. Nome em Gabarito 650.

| Arquivo | O que é |
|---|---|
| [`manual-identidade-clozzy-v2.0.pdf`](manual-identidade-clozzy-v2.0.pdf) · `.html` | O manual |
| `svg/` | 53 SVGs da marca (nome em Gabarito 650) |
| `_apresentacao.py` | Gerador (reaproveita `../identidade-oficial/` e a troca de fonte de `../identidade-oficial-fontes/`) |

```bash
cd clozzy/marca/apresentacao-identidade-v2 && python3 _apresentacao.py
```

## O que mudou (v1 → v2.0)
| | v1 | v2.0 |
|---|---|---|
| Degradês (Pop, Aurora, Névoa) | sim | **nenhum**; tudo chapado |
| Creme, rosa suave, lavanda, muted | sim | **fora**; só rosa, preto, roxo, branco (+ Pink Deep para rosa em fundo branco) |
| Páginas de "não fazer" (usos incorretos, regra do círculo com ✕, degradê, "não fala assim") | sim | **fora**; viraram Temas, Pares de cor, Cor nas peças e voz só positiva |
| Fundo das páginas | quase sempre branco | **um tema por página**: rosa, preto, roxo ou branco |
| Tom | casual | **íntimo e sedutor, nunca explícito**: "Chega mais perto.", "Só quem entra, vê.", "O resto fica entre a gente." |
| Site e app | claro | **tema preto** com rosa e roxo chapados |

Temas (fundo · texto · destaque · botão): rosa `#FF0065` · branco · branco · branco/Pink Deep; preto `#14090F` · branco · rosa · rosa; roxo `#7C48C4` · branco · branco · branco/roxo; branco · ink · Pink Deep · Pink Deep. Rosa e roxo nunca se tocam: ficam separados por preto ou branco.

## Caminho inverso
- Voltar à v1 (com degradês e creme): [`../apresentacao-identidade/`](../apresentacao-identidade/README.md), não alterada.
- Mudar o tema de uma página: argumento `bg` da chamada `page(...)` em `_apresentacao.py`. Botões, símbolo e logo por tema: `BTN`, `SIM`, `LOGO`.

## Rollback

```bash
rm -rf clozzy/marca/apresentacao-identidade-v2
```
