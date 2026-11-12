# Clozzy — C no canto, traços de tamanhos diferentes (rodada 10)

Parte da “1 · dois traços” da rodada 9 ([`../logo-c-canto/`](../logo-c-canto/README.md)): C com as **duas pontas inteiras** e tracejado no **canto superior esquerdo**. Mudanças pedidas:
- os dois traços com tamanhos diferentes, **um só um pouco maior que o outro** (16° e 22°);
- **estrela um pouco menor**: R 18 em vez de 20,5, com a mesma forma.

| Arquivo | O que é |
|---|---|
| [`c-canto-tracos-diferentes-clozzy.pdf`](c-canto-tracos-diferentes-clozzy.pdf) · `.html` | Documento com 17 páginas: referências, ideia, construção, 6 variações, teste em 16 px, espessura, 24 combinações de cor, destaque branco + estrela rosa no preto, lockups e ícones, roxo com rosa, utilizações (app, web/vídeo, redes, impresso) |
| `svg/` | Por variação (`d1`…`d6`): cores, `-16`, apps em 12 combinações, `-uso-<combinação>{,-16,-lockup,-vertical}` |
| `_canto.py` · `_build.py` | Geradores |

| # | Variação | Traços (baixo → cima) |
|---|---|---|
| **1** | **Um pouco maior em cima** (recomendada) | 16° · 22° · vão 10° |
| 2 | Um pouco maior embaixo | 22° · 16° |
| 3 | Diferença leve | 17° · 21° |
| 4 | Diferença média | 14° · 24° |
| 5 | Curto → longo | 12° · 28° |
| 6 | Um pouco maior · vãos largos | 16° · 22° · vão 13° |

```bash
cd clozzy/marca/logo-c-canto-v2 && python3 _canto.py && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/logo-c-canto-v2
```
