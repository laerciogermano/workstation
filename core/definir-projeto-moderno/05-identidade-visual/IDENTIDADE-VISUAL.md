# Identidade visual — veredito para IA

Pacote do **sistema de marca** (não só o mark). Logo master: [`../04-logos/LOGO.md`](../04-logos/LOGO.md).

Atualizado: 2026-11-08

---

## 1. Logo ≠ identidade ≠ marca

| | |
|---|---|
| **Logo** | Mark / wordmark / lockup — pacote [`04-logos/`](../04-logos/README.md) |
| **Identidade** | Logo + tipo + cor + imagery + motion + regras — **este** pacote |
| **Marca** | Percepção acumulada no público |

Mercado 2026 espera identidade como **sistema de estados** (responsivo, motion-aware, acessível, machine-readable) — não PDF estático nem PNG único.

---

## 2. Veredito 2026

| Eixo | Direção |
|------|---------|
| Sistema | Framework/toolkit; cliente varia dentro de regras |
| Atmosfera | Soft gradients, textura humana; anti AI-slop |
| Tipo | Expressivo como voz; custom quando o nome carrega |
| Motion | Asset de marca; Lottie/Rive + reduced-motion |
| A11y | AA; light/dark; motion ≠ único sinal de estado |

**Default lab:** mark forte (1 cor / 16px) + família responsiva + motion Level 1 + `BRAND.md` / tokens — sem theater Level 3.

Detalhe de tendências: [`modern-2026/`](modern-2026/README.md).

---

## 3. Fluxo

```text
Brief → 3 logos (checkpoint em 04-logos) → SVG kit
  → Cor (+ dark, WCAG) → Tipo → Art direction
  → Motion L1+L2 → BRAND.md + tokens.css
```

Não animar mark fraco.

---

## 4. Kinetic (níveis)

| Nível | Default |
|-------|---------|
| 1 Micro-motion | ✅ |
| 2 Responsive family | ✅ |
| 3 Living/generative | ❌ salvo brief |

→ [`modern-2026/articles/kinetic-responsive-niveis.md`](modern-2026/articles/kinetic-responsive-niveis.md)

---

## 5. Skills

| Prioridade | Skill |
|---|---|
| 1 | [`skills/visual-identity/`](skills/visual-identity/SKILL.md) |
| 2 | [`skills/brand-identity/`](skills/brand-identity/SKILL.md) |
| 3 | [`skills/brand-motion-guidelines/`](skills/brand-motion-guidelines/SKILL.md) |
| 4 | [`skills/brand-motion-agent-skill/`](skills/brand-motion-agent-skill/SKILL.md) |

Logo SVG: [`../04-logos/skills/logo-design/`](../04-logos/skills/logo-design/SKILL.md).

---

## 6. Entregáveis

Além dos SVGs de [`../04-logos/LOGO.md`](../04-logos/LOGO.md) §7:

- [`templates/BRAND.md`](templates/BRAND.md)
- [`templates/tokens.css`](templates/tokens.css)
- [`templates/motion-guidelines.md`](templates/motion-guidelines.md)
- 1 signature motion + reduced-motion
- Clear-space, mínimo, 4 misuses, AI content rules

Prompts: [`prompts/KIT-IDENTIDADE.md`](prompts/KIT-IDENTIDADE.md)

---

## 7. Anti-padrões

Purple SaaS + orb Midjourney · mark só em full color · fade-in vendido como sistema · guidelines sem motion/dark/AA/AI rules · copiar motivo LogoLounge · PNG/Lottie sem SVG master

---

## 8. Caminho inverso

- Só logo → [`../04-logos/`](../04-logos/README.md)
- Só UI → [`../03-design-ui-motion/`](../03-design-ui-motion/README.md)
- Remover pacote → ver [`README.md`](README.md) Rollback
