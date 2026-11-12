# RoleGo — Logo v2 (conceitos)

Apresentação de 3 conceitos de logo seguindo [`core/definir-projeto-moderno/04-logos`](../../../core/definir-projeto-moderno/04-logos/LOGO.md) (referência máxima), com o contexto do produto (`../../README.md`, `../../identidade-visual.md`, manual v1 em `../`). Mesmo formato da apresentação do e-notas (`e-notas/marca/logo-v2/`).

| Arquivo | Uso |
|---|---|
| `apresentacao-logo-v2.html` / `.pdf` | Apresentação A4 paisagem, 14 págs. (3 conceitos + 8 variações + animação + estrutura do Go) |
| `conceitos/{a,b,c}-{symbol,lockup}[-color\|-white\|-light].svg` | SVGs em curvas (sem texto vivo). `-color` = sobre fundo preto |
| `conceitos/a-symbol-16.svg` | Corte do A para 16 px |
| `conceitos/concepts.png` | Folha de conceitos (skill logo-design) |
| `variacoes/v1…v8-*.svg`, `meta.json`, `variacoes.png` | Variações V1–V8 (pin aberto, R pin, match, bloco, Go, pousado, balão, ingresso) |
| `animacao/index.html` + `rolego-logo-animado.svg`, `rolego-icone-animado.svg`, `rolego-loading.svg` | Animação: o pin sai do G, faz um arco e pousa; onda de localização; ~1,7 s; reduced-motion = estática |
| `go/e1…e5-*.svg`, `*-construcao.svg`, `meta.json` | Estudos da estrutura do “Go”: E1 grade comum, E2 encaixe, E3 ligadura, E4 mesma caixa, **E5 canal** (recomendado) |
| `canal/c1…c8-*.svg`, `*-construcao.svg`, `meta.json` | **Escolhido 08/11: E5 canal.** Família: C1 canal (base), C2 canal fino, C3 furo largo, C4 ligadura, C5 à distância, C6 ponta na base, C7 ícone bloco, C8 pin-canal |
| `ligadura/l1…l8-*.svg`, `l1-stacked*.svg`, `icon-app*.svg`, `icon-avatar.svg`, `icon-fav.svg` | **Preferidos 08/11: C4 + C6 → família ligadura.** L1 ligadura na base (recomendado), L2 furo largo, L3 encaixe raso, L4 encaixe fundo, L5 canal fino, L6 fechado (16–24 px), L7 ícone bloco, L8 ícone redondo; ícones opacos e lockup empilhado para os mockups (págs. 21–22) |
| `_build_conceitos.py` → `_build_variacoes.py` → `_build_go.py` → `_build_canal.py` → `_build_ligadura.py` → `_build_animacao.py` → `_build_apresentacao.py` (+ `_apresentacao_ligadura.py`) | Geram os SVGs e o HTML (variações usam `pip install skia-pathops`) |

Conceitos: **A — o pin** (recomendado) · B — R ping · C — pin play. Leitura: A no wordmark, V4 no ícone de app, V1 no favicon.

Cor: no preto, “Go” e pin em ciano `#00E5E5` (roxo no preto foi reprovado em 08/11); violeta `#8749FF` só sobre fundo claro. O pin tem o topo na altura do G e não tem ponto no miolo (só o furo).

PDF: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 --print-to-pdf=apresentacao-logo-v2.pdf "file://$PWD/apresentacao-logo-v2.html"`

Rollback: `rm -rf role-go/marca/logo-v2`
