# notinhas.shop Beta — Protótipos

**Protótipo navegável:** [`prototipos/index.html`](prototipos/index.html) · no app: [notinhas.shop/#prototipo](https://notinhas.shop/#prototipo) → `prototipos.html` · PDF: [`prototipos/prototipos-notinhas-beta.pdf`](prototipos/prototipos-notinhas-beta.pdf). Abra no navegador, sem build.

- **Galeria:** telas agrupadas por fluxo (E01–E04 + ADM), celulares com contorno azul/verde e setas entre passos.
- **Modo navegável:** clique em qualquer tela ou em “▶ Navegar”. Elementos com `data-go` avançam. Atalhos: `←/→`, `Backspace`, `H` (áreas clicáveis), `Esc`. Deep-link: `index.html#T-12`.
- **Notas por tela:** painel direito com histórias (US) e regras.

> Criado a partir do [PRD](01-prd.md), [histórias](02-historias/README.md), [identidade](../identidade-visual.md) e [DESIGN.md](../marca/notinhas.shop.DESIGN.md). Fidelidade **média/alta** (visual final, conteúdo fictício SJP/PR).

## 1. Princípios de design aplicados

| Princípio | Como aparece |
|---|---|
| Identidade light | Canvas `#F5F7FA`, superfície branca, ink `#0B1F33`, Plus Jakarta Sans |
| CTA único | Botão preenchido só `#0069B4` — verde nunca é segundo CTA |
| Verde semântico | `#00984B` só em menor preço, sucesso, “.shop” e chip destaque |
| Preço contextualizado | Sempre **valor + loja + data**; `tabular-nums` |
| Wordmark = domínio | `notinhas` deep blue + `.shop` verde — nunca “e-notas” |
| Polegar primeiro | Tab bar + FAB Nota no centro; alvos ≥ 44 px |
| Scan | Viewport dark `#0B1F33` (exceção) |

## 2. Inventário de telas

| Código | Tela | Épico | Histórias | Contorno |
|---|---|---|---|---|
| T-01 | Splash (CTA → home anônima) | E01 | US-01.01 | azul |
| T-02 | Criar conta (opcional) | E01 | US-01.01, 01.02 | azul |
| T-03 | Entrar | E01 | US-01.03, 01.04 | azul |
| T-04 | Recuperar senha | E01 | US-01.05 | azul |
| T-05 | Localização (opcional / banner) | E01 | US-01.06, 01.07 | azul |
| T-10 | Home · Destaques + busca/filtros | E02 | US-02.01, 02.02 | verde |
| T-11 | Busca + categorias | E02 | US-02.03, 02.04 | azul |
| T-12 | Comparação | E02 | US-02.05 | verde |
| T-13 | Histórico | E02 | US-02.06 | verde |
| T-14 | Detalhe expandido (comp./hist./perto) | E02 | US-02.07 | verde |
| T-20 | Scan QR · câmera | E01 | US-01.08 | azul |
| T-21 | Scan QR · foto | E01 | US-01.09 | azul |
| T-22 | Nota ingerida | E01 | US-01.08, 01.10 | verde |
| T-23 | Vincular EAN (câmera já aberta) | E01 | US-01.11 | azul |
| T-24 | Escolher foto EAN | E01 | US-01.12 | azul |
| T-30 | Onde comprar perto | E03 | US-03.01 | verde |
| T-31 | Ranking lojas | E03 | US-03.02 | verde |
| T-32 | Mapa | E03 | US-03.03 | azul |
| T-33 | Vitrine da loja | E03 | US-03.04–06 | verde |
| T-40 | Cestas (várias) | E04 | US-04.01, 04.02 | verde |
| T-41 | Split · economia | E04 | US-04.03 | verde |
| T-50 | Extrato · gastos | E04 | US-04.04–06 | azul |
| T-51 | Perfil | E01 | US-01.13, 01.14 | azul |
| T-61 | Admin · Métricas | ADM | US-ADM.01–03 | azul (desktop) |

## 3. Navegação

Tab bar: **Destaques** (T-10) · **Perto** (T-30/31) · **Nota** FAB (T-20) · **Cestas** (T-40) · **Perfil** (T-51). Entrada default = home anônima. Mapa em [07-diagramas](07-diagramas.md).

### Ajustes UX (2026-11-04) — card [BXKZ55Wb](https://trello.com/c/BXKZ55Wb)

- Home sem login; conta só para recursos autenticados
- Destaque = preço bem abaixo da média; busca + categorias na home
- Banner GPS opcional (não bloqueia)
- Detalhe com comparação / histórico / perto já abertos
- Vincular EAN com câmera aberta; várias cestas

## 4. Componentes do design system

| Componente | Variações | Telas |
|---|---|---|
| `Wordmark` | sm / md / xl | T-01, T-03, T-10, T-51, T-61 |
| `Button` | `primary` (azul), `secondary`, `ghost`, `sm` | todas |
| `Chip` / `Badge` | default, on, `menor`/destaque verde | T-05, T-10, T-12 |
| `ProductCard` | grade 2 colunas, foto, preço, loja+data | T-10, T-33 |
| `Price` | tabular + verde quando menor | T-10–14, T-30 |
| `TabBar` + `FabNota` | 5 slots | telas principais |
| `ScanViewport` | dark + viewfinder | T-20 |
| `RankRow` | posição + score | T-31 |
| `Sheet` / mapa fake | pins | T-32 |

## 5. Como evoluir o HTML

1. Novo `<template data-id="T-xx" …>` com `data-us` e `data-notes`
2. Incluir o id em `FLOWS[].steps`
3. Atualizar esta tabela e o mapa em `07-diagramas.md`
4. Regenerar o PDF (Chrome headless) e anexar no card Trello

## 6. Pendências de design

- Fotos reais de produto (hoje placeholders em gradiente)
- Microinterações / skeleton
- Estados de erro de câmera e offline PWA
- Publicar galeria em `notinhas.shop` (opcional, card separado)
