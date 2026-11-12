# RoleGo — Logo v3 (cores do projeto original)

Mesma geometria do **L1 “ligadura na base”** escolhido no v2 (`../logo-v2/ligadura/`): os paths são lidos dos SVGs do v2 e só o preenchimento muda. O ciano chapado do v2 (que lia como marca de esporte) dá lugar aos gradientes dos banners de `epics.pdf` e do manual v1 (`../../identidade-visual.md`).

| Direção | Gradiente no preto | No claro |
|---|---|---|
| **A — Neon do banner** (recomendada) | `#E23DF5 → #8749FF → #00C8FF` no RoleGo inteiro | `#C21FD6 → #6539CB → #2563EB` |
| B — Roxo → azul | `#A24BFF → #7A4DFF → #3B82F6` | `#8749FF → #6539CB → #452EFF` |
| C — Role branco + Go neon | Role `#FFF`, Go `#C04BFF → #8749FF → #00E5E5` | Role `#05070F`, Go `#9E19E9 → #6539CB → #2563EB` |

| Arquivo | Uso |
|---|---|
| `v3{a,b,c}-{lockup,go,stacked}-{color,light}.svg` | `color` = sobre preto, `light` = sobre fundo claro |
| `v3-lockup-white.svg`, `v3-lockup-ink.svg`, `v3-go-white.svg` | Uma cor |
| `v3{a,b}-icon-{app,avatar,fav}.svg`, `v3{a,c}-icon-app-dark.svg` | Ícones (fundo em gradiente + Go branco; ou fundo preto + Go em gradiente) |
| `apresentacao-logo-v3.html` / `.pdf` | 4 págs.: capa, no preto, no claro, usos |
| `_build_v3.py` → `_build_apresentacao.py` | Geram os SVGs e o HTML (precisam de `../logo-v2/ligadura/`) |

PDF: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 --print-to-pdf=apresentacao-logo-v3.pdf "file://$PWD/apresentacao-logo-v3.html"`

Rollback: `rm -rf role-go/marca/logo-v3`
