# Identidade visual moderna (2026) — referência operacional

**Uso:** complementar [LOGO-IDENTIDADE.md](../LOGO-IDENTIDADE.md).  
Logo continua sendo o núcleo estático; este pacote define **o sistema de identidade** que o mercado 2026 espera: responsivo, motion-aware, acessível, anti-slop de IA.

Atualizado: 2026-11-08

---

## 1. Veredito do mercado (2026)

Tendência dominante **não** é “logo neon 3D com glow purple”. É:

| Eixo | Direção 2026 |
|------|----------------|
| Logo | De carimbo fixo → **sistema de estados** (lockups + mono + glyph 16px + 1 movimento assinatura) |
| Identidade | Frameworks / toolkits (cliente varia dentro de regras), não só PDF estático |
| Atmosfera | Gradientes soft/cinematográficos, fundos “vivos”, textura táctil / imperfeição humana |
| Tipo | Tipografia **expressiva** como voz; slant/itálico pontual; custom letterforms quando o nome carrega |
| Motion | Asset de marca (não afterthought); Lottie/Rive + regras de reduced-motion |
| Acessibilidade | WCAG AA mínimo; contraste em light/dark; motion que não é o único sinal de estado |
| Anti-tendência | AI slop genérico, sans-serif sameness, “rebrand total” sem equity |

**“Identidade moderna de bom gosto”** neste lab = mark forte em 1 cor e 16px + família responsiva + 1 motion Level 1 + guidelines machine-readable (`BRAND.md` / tokens) — **sem** theater generativo Level 3 salvo brief explícito.

---

## 2. O que baixar / usar neste pacote

| Camada | Onde |
|--------|------|
| Veredito + fluxo | este arquivo |
| Tendências síntese | [`articles/`](articles/README.md) |
| Prompts de kit / sistema | [`prompts/`](prompts/README.md) |
| Templates fill-in | [`templates/`](templates/README.md) |
| Skills novas | [`../skills/brand-motion-guidelines/`](../skills/brand-motion-guidelines/SKILL.md), [`../skills/brand-motion-agent-skill/`](../skills/brand-motion-agent-skill/SKILL.md), [`../skills/visual-identity/`](../skills/visual-identity/SKILL.md) |
| Logo master | [`../LOGO-IDENTIDADE.md`](../LOGO-IDENTIDADE.md) + skill `logo-design` |
| UI product | [`../../03-design-ui-motion/`](../../03-design-ui-motion/README.md) |

---

## 3. Fluxo padrão (IA) — identidade completa

```text
Brief (nome, quem, 3–5 adjetivos, clichês a matar, equity a guardar)
  → 3 direções de logo (tipos diferentes) + checkpoint
  → SVG master + lockups + mono + 16px
  → Cor (primary/secondary/accent + neutros + dark) com WCAG
  → Tipo (display + body + escala) mapeado aos adjetivos
  → Art direction / imagery / icon rules (1 página)
  → Motion Level 1+2 (reveal/loop + collapse responsivo) + reduced-motion
  → BRAND.md / one-pager HTML + tokens CSS
```

**Regra:** não animar mark fraco. Motion amplifica; não conserta.

---

## 4. Níveis de “kinetic” (Malbar / mercado)

| Nível | O quê | Default lab |
|-------|--------|-------------|
| **1 Micro-motion** | Reveal + loop idle; geometria fixa | ✅ quase sempre |
| **2 Responsive** | Wordmark → monogram → glyph 16px | ✅ obrigatório |
| **3 Living system** | Generativo / data-reactive / XR | ❌ só com brief + orçamento |

Formatos: SVG master + Lottie/JSON (ou Rive) + MP4/WebM + GIF fallback.

---

## 5. Tendências a **conhecer** (não copiar)

### A. Sistema / comportamento (Creative Bloq, LogoLounge, Envato)

1. **Unfixed / living identities** — mark como portal; flex por contexto  
2. **Responsive logo family** — família com mesma ideia, detalhe ajustado por escala  
3. **Kinetic logos** — motion como camada de diferenciação pós-AI-static  
4. **Playful / childlike anarchy** — anti-blandificação; só se a categoria aguentar  
5. **Organic earthmarks** — curvas suaves, terra; evitar folha genérica  
6. **Tactile 3D** — bevel/sombra leve; **não** skeuo 2012; usar em app icon / herói, master flat permanece  
7. **Subtle iteration** — evolução com equity > rebrand teatral  
8. **Belief / belonging** — significado cultural > efeito visual

### B. Identidade além do logo (Threerooms)

- Motion-first · imperfeição hand-crafted · tipo expressivo · hybrid human+AI · acessível · soft-glow gradients · nostalgic layering · sonic/haptic

### C. Motivos formais LogoLounge 2026 (sinais de saturação)

V Balls · Slip Knots · Slant Break · Piano · Faders · Crack · Breezy · Roll Over · Slash Bar · Echo Arcs · Colorforms · Quad Quivers · Open Axis · Phasers · Tri-Link  

**Uso:** saber o que o mercado está saturando → **evitar clichê** ou usar só com intenção clara.

---

## 6. Anti-padrões (identity slop 2026)

- Purple gradient SaaS + Inter/Geist + orb Midjourney  
- Mark só legível em full color / full size  
- “Animated logo” = fade-in de 3s cobrado como sistema  
- Guidelines sem seção motion, dark mode, AA, nem regras de IA  
- Copiar tendência LogoLounge nomeada (watermelon, feather L, etc.)  
- Entregar PNG como master; ou Lottie sem SVG estático

---

## 7. Entregáveis mínimos (identidade de projeto)

Além dos SVGs de [`LOGO-IDENTIDADE.md`](../LOGO-IDENTIDADE.md) §7:

- `BRAND.md` (ou HTML one-pager): logo rules + cor + tipo + voz + motion + do/don’t + AI rules  
- Tokens CSS (`--color-*`, `--font-*`, `--ease-*`, `--dur-*`) light/dark  
- 1 signature motion (Lottie ou SVG SMIL/CSS) + estado reduced-motion  
- Clear-space + minimum size + 4 misuses  
- Opcional: sonic note (1 frase) se produto digital com UX sonora

Template: [`templates/BRAND.md`](templates/BRAND.md)

---

## 8. Caminho inverso

- Só logo sem sistema moderno → usar só `../LOGO-IDENTIDADE.md`  
- Só UI sem marca → `../../03-design-ui-motion/`  
- Remover tendência 2026: apagar `modern-2026/`; skills novas listadas em [`../SOURCES.md`](../SOURCES.md)
