# RolêGo — Logo v4 (roxo + branco, Rolê e Go separados)

Mesma geometria do **L1 “ligadura na base”** (`../logo-v2/ligadura/`). Ajustes pedidos em 08/11/2026:

1. **Rolê** com circunflexo (acento desenhado no mesmo itálico das letras).
2. O **Go** do nome é sempre o símbolo Go — inclusive no empilhado (sai o “Go” em texto).
3. **Rolê e Go nunca na mesma cor** (exceto versões de uma cor para impressão).
4. Estilo principal = **superfície roxa** do ícone B do v3 (`#9E19E9 → #6539CB → #452EFF`) com a marca em branco; no roxo, Go em ciano `#00E5E5`.
5. **Sem letras roxas no preto**: no preto, Rolê branco e Go ciano → azul (`#00E5E5 → #3B82F6`).

| Arquivo | Uso |
|---|---|
| `v4-lockup-{purple,dark,light}.svg` | Rolê + Go no roxo / preto / claro |
| `v4-stacked-{purple,dark,light}.svg` | Símbolo em cima + lockup |
| `v4-go-{white,dark,light,ink}.svg` | Só o símbolo |
| `v4-lockup-{white,ink}.svg` | Uma cor |
| `v4-icon-{app,avatar,fav}.svg` | Roxo + Go branco (principal) |
| `v4-icon-{app,avatar,fav}-dark.svg` | Preto + Go ciano → azul |
| `apresentacao-logo-v4.html` / `.pdf` | 9 págs.: capa, três fundos, usos, **slogan “Viva o rolê.”**, redes sociais, app, no rolê (pulseira, ingresso, crachá, copo, camiseta, adesivos, palco, ecobag), rua (outdoor, mupi, cartaz, vitrine, wind banner), institucional (cartão, e-mail, slides, capas, newsletter) |
| `_usos.py` | Gera as págs. 4–9 (chamado por `_build_apresentacao.py`) |
| `foto-multidao-{1,2}.jpg` | Recorte de `../criativos/img/multidao*.png` sem o texto queimado, para os mockups |

Slogan: **Viva o rolê.** — Poppins ExtraBold itálico, com ponto; “Viva o” na cor do texto e “rolê” na cor do Go (ciano no roxo/preto, roxo no claro).

Gerar: `python3 _build_v4.py && python3 _build_apresentacao.py` (precisa de `../logo-v2/ligadura/`).

Rollback: `rm -rf role-go/marca/logo-v4`
