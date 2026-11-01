---
version: alpha
name: notinhas.shop
website: "https://notinhas.shop"
description: >-
  Consumer brand for a cooperative NFC-e price index. Light mist canvas, deep navy
  ink (never pure black), institutional blue as the single filled CTA voltage, and
  green reserved for “menor preço” / success — never as a second filled button.
  Plus Jakarta Sans ExtraBold wordmark (notinhas in deep blue, .shop in green);
  tabular figures on every price. Craft borrows Stripe’s light-fintech discipline,
  Linear’s accent scarcity, and Vercel’s hairline precision — without copying their
  palettes.

seo:
  title: "notinhas.shop Design System: Blue CTA, Green Price, Mist Canvas"
  metaDescription: "DESIGN.md for notinhas.shop — #0069B4 CTA, #00984B menor preço, Plus Jakarta Sans, tabular prices. For Cursor, Claude and Tailwind."
  tags:
    - "E-commerce & Retail"
    - "Productivity & SaaS"
    - "Fintech & Crypto"
  highlights:
    - "Single voltage CTA — blue #0069B4 is the only filled primary button per band"
    - "Green #00984B is semantic only — menor preço, success, wordmark TLD — never a second filled CTA"
    - "Tabular figures (tnum) on every price cell — financial-data signal borrowed from Stripe"
    - "Mist canvas #F5F7FA + white surfaces + hairline #D5DEE8 — hierarchy without heavy shadows"
    - "Wordmark = domain: notinhas (deep blue) + .shop (green); never “e-notas” in consumer UI"
  lastUpdated: "2026-11-01"
  author:
    name: "Laercio Germano"
  opening: |
    notinhas.shop turns the NFC-e QR into a shared price index: who contributes scans;
    who shops compares. The brand must feel public-utility trustworthy (Nota Paraná /
    Menor Preço blue+green DNA) and product-modern (Stripe light canvas + Linear accent
    scarcity + Vercel hairlines).

    One filled CTA color: blue #0069B4. One semantic accent: green #00984B for the
    lowest price and success. Deep ink #0B1F33 for body — never #000. Mist background
    #F5F7FA, white cards, soft hairlines. Plus Jakarta Sans carries UI and the ExtraBold
    wordmark. Prices always use tabular figures and always show store + date beside them.

    Feed this file to Cursor or Claude to build React/Tailwind screens that match the
    consumer app — not a generic SaaS theme and not a dark Linear clone.
  related:
    - href: "../../core/shadcn-design/README.md"
      title: "Referências shadcn.io/design (clássicos)"
      description: "Stripe, Linear, Apple, GitHub, Vercel, Claude, Figma, Framer — craft sources."
    - href: "identidade-visual-notinhas-v1.html"
      title: "Manual identidade visual v1 (print)"
      description: "A4 paisagem HTML — logo, cores, tipografia, aplicações."
    - href: "design-system-notinhas-v1.html"
      title: "Design system v1 (print)"
      description: "Componentes UI print-ready."
    - href: "https://github.com/google-labs-code/design.md"
      title: "The DESIGN.md specification"
      description: "Google Labs open format this file follows."
  questions:
    - id: "primary-color"
      title: "Qual é a cor primária do notinhas.shop?"
      answer: "Azul institucional #0069B4 — único fill de botão primário. Hover/ênfase #014380. Verde #00984B não é CTA; é semântica de menor preço, sucesso e o TLD “.shop” no wordmark."
    - id: "why-not-dark"
      title: "Por que light e não dark como Linear?"
      answer: "O produto é utilitário público (preço de nota fiscal). Light + mist transmite clareza e confiança de programa estadual (Nota Paraná). Dark só no viewport de scan (câmera)."
    - id: "typography"
      title: "Qual tipografia usar?"
      answer: "Plus Jakarta Sans 400–800. Wordmark ExtraBold. Preços com font-variant-numeric: tabular-nums (tnum). Fallback: system-ui / Segoe UI."
    - id: "wordmark"
      title: "Como escrever a marca?"
      answer: "notinhas.shop — “notinhas” em #014380, “.shop” em #00984B. Nunca “e-notas” na UI consumer (e-notas é só repo/código)."
    - id: "price-rule"
      title: "Regra do menor preço?"
      answer: "Preço mínimo sempre verde + chip “menor”; toda ocorrência mostra loja + data. Sem preço órfão."
    - id: "known-gaps"
      title: "O que ainda falta neste DESIGN.md?"
      answer: "Motion detalhado, dark mode de produto (só scan), tokens de mapa Leaflet, e estados de skeleton animados. Sub-marcas B2B futuras ficam fora deste arquivo."

colors:
  primary: "#0069B4"
  primary-deep: "#014380"
  primary-soft: "#E3F2FB"
  on-primary: "#ffffff"
  accent: "#00984B"
  accent-deep: "#007A3D"
  accent-soft: "#E6F6EE"
  ink: "#0B1F33"
  ink-muted: "#5A6B7D"
  canvas: "#F5F7FA"
  surface: "#ffffff"
  hairline: "#D5DEE8"
  err: "#C62828"
  err-soft: "#FDECEC"
  warn: "#D97706"
  warn-soft: "#FEF3C7"
  scan-viewport: "#0B1F33"
  gradient-brand: "linear-gradient(135deg, #014380 0%, #0069B4 48%, #00984B 100%)"

typography:
  display-xl:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.8px
  display-lg:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 30px
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: -0.6px
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.3px
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: -0.2px
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body-sm:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  price:
    fontFamily: "Plus Jakarta Sans, ui-monospace, monospace"
    fontSize: 20px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.4px
    fontFeature: tnum
  price-sm:
    fontFamily: "Plus Jakarta Sans, ui-monospace, monospace"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.2px
    fontFeature: tnum
  button:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0
  caption:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0.02em
  wordmark:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 22px
    fontWeight: 800
    lineHeight: 1
    letterSpacing: -0.66px

rounded:
  sm: 8px
  md: 14px
  lg: 20px
  pill: 999px

spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 24px
  6: 32px
  control-h: 40px
  control-h-sm: 32px
  control-h-lg: 48px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "{spacing.control-h}"
    padding: 0px 20px
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "{spacing.control-h}"
    padding: 0px 20px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "{spacing.control-h}"
    padding: 0px 20px
  button-ok:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "{spacing.control-h}"
    padding: 0px 20px
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 0px 6px
  chip-menor:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-deep}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 0px 12px
    height: 26px
  chip-meta:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-deep}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 0px 12px
    height: 26px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: "{spacing.control-h}"
    padding: 0px 12px
  input-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: "{spacing.control-h}"
    padding: 0px 12px
  card-price:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 16px
  card-price-menor:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent-deep}"
    typography: "{typography.price}"
    rounded: "{rounded.md}"
    padding: 16px
  list-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 12px 16px
  nav-tab-active:
    backgroundColor: "transparent"
    textColor: "{colors.primary-deep}"
    typography: "{typography.title}"
    rounded: "{rounded.xs}"
    padding: 8px 0px
  fab-nota:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    size: 56px
  scan-frame:
    backgroundColor: "{colors.scan-viewport}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 16px
  empty-state:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 32px
---

## Overview

**notinhas.shop** is a cooperative notinha index: scan the NFC-e QR, deposit price + store + date, let others compare. Brand voice is direct and useful — no SEFAZ jargon in the UI (“nota” and “QR” are enough).

**Craft sources** (do not copy palettes):

| Ref | Take |
|-----|------|
| [Stripe](../../core/shadcn-design/stripe.DESIGN.md) | Light canvas, one CTA voltage, `tnum` on money |
| [Linear](../../core/shadcn-design/linear.DESIGN.md) | Accent scarcity — green is rare and meaningful |
| [Vercel](../../core/shadcn-design/vercel.DESIGN.md) | Hairline borders, precise tracking on display |
| [Apple](../../core/shadcn-design/apple.DESIGN.md) | Clarity over decoration |
| [GitHub](../../core/shadcn-design/github.DESIGN.md) | Dense, readable data tables |
| Nota Paraná / Menor Preço | Blue + green public-trust DNA |

Repo/code name stays **e-notas**. Public wordmark is always **notinhas.shop**.

## Colors

- **Primary `#0069B4`:** links, filled primary button, focus rings. Deep `#014380` for titles and hover.
- **Accent `#00984B`:** menor preço, success, “.shop” in the wordmark. Soft `#E6F6EE` behind the “menor” chip.
- **Ink `#0B1F33`:** body text. Muted `#5A6B7D` for secondary. Never pure black.
- **Canvas `#F5F7FA` / surface `#fff` / hairline `#D5DEE8`:** app floor, cards, borders.
- **Brand gradient:** `#014380 → #0069B4 → #00984B` at 135° — covers, splash, symbol fill only.
- **Scan exception:** viewport `#0B1F33` (camera), frame hint in light green.

## Typography

Plus Jakarta Sans end-to-end. Display ExtraBold with slight negative tracking. Body 400/500. **Prices** use tabular figures (`tnum`) and sit in green when they are the minimum. Captions are 11px / 700 for chips and labels.

## Layout

Base unit **4px**. Control height **40px** (sm 32 / lg 48). Content max for reading bands ~640–720px; data tables go full width. One primary CTA per band (Stripe rule). FAB “Nota” bottom-right on home.

## Elevation & Depth

Prefer hairlines and mist/white contrast over drop shadows. When a card needs lift: `0 1px 2px rgba(11,31,51,.06), 0 8px 24px rgba(11,31,51,.06)` — soft, never neon glow.

## Shapes

Controls and chips are **pills** (`999px`). Cards/panels **14px**. Inputs **8px**. Symbol / app icon ~22% of size as corner radius on the gradient tile.

## Components

- **Buttons:** `pri` blue · `sec` outline blue · `ok` green only for confirm-menor / success actions · `ghost` · `danger`.
- **Price card:** green price + chip `menor` + store · date · optional distance.
- **List / table:** no shadow on rows; mono/tnum on EAN and prices; header on mist.
- **Tabs:** underline active in deep blue.
- **Scan:** dark viewport + light status text; success returns to light home.
- **FAB:** primary blue pill, label “Nota”.

## Do's and Don'ts

**Do**

- Show **store + date** next to every price.
- Keep **one** filled blue CTA per section.
- Use green only for menor preço / success / `.shop`.
- Keep consumer UI **light**.

**Don't**

- Put “e-notas” in the consumer wordmark.
- Use green as a second competing filled CTA in the same band.
- Drop prices without context (orphan numbers).
- Copy Linear’s near-black canvas or Stripe’s indigo/mesh literally — borrow discipline, keep our blue+green.
