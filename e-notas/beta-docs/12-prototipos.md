# notinhas.shop Beta — Protótipos

**Protótipo navegável:** [`prototipos/index.html`](prototipos/index.html) · no app: [notinhas.shop/#prototipo](https://notinhas.shop/#prototipo) → `prototipos.html` · PDF: [`prototipos/prototipos-notinhas-beta.pdf`](prototipos/prototipos-notinhas-beta.pdf). Abra no navegador, sem build.

- **Galeria:** telas agrupadas por fluxo (E01–E04; sem ADM/backoffice neste momento), celulares com contorno azul/verde e setas entre passos.
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
| T-02 | Criar conta (fora do onboarding; via Perfil) | E01 | US-01.01, 01.02 | azul |
| T-03 | Entrar (fora do onboarding; via Perfil) | E01 | US-01.03, 01.04 | azul |
| T-04 | Recuperar senha | E01 | US-01.05 | azul |
| T-05 | Localização (opcional / banner) | E01 | US-01.06, 01.07 | azul |
| T-10 | Home · Destaques + busca/filtros | E01 | US-02.01, 02.02 | verde |
| T-11 | Busca + categorias | E01 | US-02.03, 02.04 | azul |
| T-12 | Comparação | E01 | US-02.05 | verde |
| T-13 | Histórico | E01 | US-02.06 | verde |
| T-14 | Detalhe expandido (comp./hist./perto) | E01 | US-02.07 | verde |
| T-20 | Scan QR · câmera | E02 | US-01.08 | azul |
| T-21 | Scan QR · foto | E02 | US-01.09 | azul |
| T-22 | Nota ingerida | E02 | US-01.08, 01.10 | verde |
| T-23 | Vincular EAN (câmera já aberta) | E02 | US-01.11 | azul |
| T-24 | Escolher foto EAN | E02 | US-01.12 | azul |
| T-30 | Onde comprar perto (item) | E03 | US-03.01 | verde |
| T-31 | Mais baratas (entrada Estabelecimentos) | E03 | US-03.02 | verde |
| T-32 | Mapa | E03 | US-03.03 | azul |
| T-33 | Vitrine da loja | E03 | US-03.04–06 | verde |
| T-40 | Minhas listas (várias) | E04 | US-04.01 · REQ-051 | verde |
| T-42 | Lista · sem split (por loja) | E04 | US-04.02 · REQ-051 | verde |
| T-41 | Lista · com split + redução | E04 | US-04.03 · REQ-051 | verde |
| T-50 | Minhas notas | E04 | US-04.04 · REQ-051 | azul |
| T-55 | Detalhe da nota | E04 | US-04.04 | azul |
| T-52 | Gastos do mês | E04 | US-04.05–06 | azul |
| T-53 | Pontos e contribuição | E01 | RF-E01-19..21 · REQ-052 | azul |
| T-54 | Gate · contribuir | E01 | RF-E01-20 · REQ-052 | azul |
| T-51 | Perfil (fingerprint + IP) | E01 | US-01.13 · REQ-050 | azul |
| T-61 | Admin · Métricas | — (fora da galeria neste momento) | US-ADM.01–03 | azul (desktop) |

## 3. Navegação

Tab bar: **Destaques** (T-10) · **Lojas** (T-31) · **Nota** FAB (T-20) · **Listas** (T-40) · **Perfil** (T-51). Minhas notas / pontos via Perfil (e pós-scan). Entrada = home anônima. Mapa em [07-diagramas](07-diagramas.md).

### Ajustes UX (2026-11-04) — card [BXKZ55Wb](https://trello.com/c/BXKZ55Wb)

- Home sem login; conta só para recursos autenticados
- Destaque = preço bem abaixo da média; busca + categorias na home
- Banner GPS opcional (não bloqueia)
- Detalhe com comparação / histórico / perto já abertos
- Vincular EAN com câmera aberta; várias cestas

### Onboarding sem conta (2026-11-04)

- Conta (T-02/03/04) fora do onboarding, só pelo Perfil neste momento
- Galeria sem fluxo “Conta e onboarding” / ADM

### Sem splash (2026-11-04)

- Sem tela `T-01`; entrada = home anônima (`T-10`)

### Épicos na galeria (2026-11-04)

- **E01** Descoberta de preços · **E02** Contribuir nota e EAN · **E03** Estabelecimentos · **E04** Listas, notas e pontos
- Backoffice (T-61) fora da galeria neste momento

### PRD 2026-11-08 (REQ-050..052)

- Fingerprint + IP no Perfil / Minhas notas; merge na Criar conta
- Minhas listas com toggle sem split / com split (redução R$/%)
- Minhas notas + detalhe; gastos derivados
- Pontos/contribuição (NFC-e + EAN) e gate de crédito de uso

### Estabelecimentos (2026-11-04)

- Fluxo E03 renomeado para **Estabelecimentos**; tela inicial = **Mais baratas** (T-31), não “Perto de mim”
- Sem tabs baratas/caras: lista ordenada das mais baratas no raio; cada linha mostra **Nª mais barata** e **Mª mais cara da região**
- Busca de estabelecimento + chips de raio; T-30 permanece como perto por item (detalhe)

## 4. Componentes do design system

| Componente | Variações | Telas |
|---|---|---|
| `Wordmark` | sm / md / xl | T-03, T-10, T-51, T-61 |
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
