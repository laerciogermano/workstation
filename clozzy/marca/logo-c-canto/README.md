# Clozzy — C com tracejado no canto (rodada 9)

O C do Círculo próximo com a **estrela original** e **as duas pontas inteiras**. O tracejado de story fica no **canto superior esquerdo** (≈ 228°): discreto, com vãos um pouco maiores (10° no master, 20° no corte ≤ 24 px) para continuar visível em tamanho pequeno. Traço 9 (os prints 14.03/14.05 mostram o traço fino).
Referência: `../refs/` (20 prints). Pasta e nome próprios, sem sobrescrever as rodadas anteriores.

| Arquivo | O que é |
|---|---|
| [`c-tracejado-canto-clozzy.pdf`](c-tracejado-canto-clozzy.pdf) · `.html` | Documento com 17 páginas: referências, ideia, construção, 6 variações, teste em 16 px, espessura, cores, destaque “círculo branco + estrela rosa no preto”, mais variações, lockups e ícones, roxo com rosa, e utilizações (app, web/vídeo, redes, impresso) |
| `svg/` | Por variação (`k1`…`k6`): `-color`, `-dark`, `-16`, apps em 12 combinações, e `-uso-<combinação>{,-16,-lockup,-vertical}` em 24 combinações de cor |
| `_canto.py` · `_build.py` | Geradores |

| # | Variação |
|---|---|
| **1** | **Dois traços** (recomendada): 2 × 18°, vãos de 10° |
| 2 | Um traço |
| 3 | Três pontos (“…”) |
| 4 | Ponto → traço |
| 5 | Três traços |
| 6 | Vãos largos (14°): a mais legível em favicon |

```bash
cd clozzy/marca/logo-c-canto && python3 _canto.py && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/logo-c-canto
```
