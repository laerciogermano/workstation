# Logo e identidade visual — veredito para IA

Pacote canônico para criar logos de projetos. Preferir SVG hand-authored / auditado; modelos de imagem geram **conceito**, não master de produção.

**Sistema moderno 2026** (responsive + motion + guidelines AI-ready): [`modern-2026/IDENTIDADE-MODERNA.md`](modern-2026/IDENTIDADE-MODERNA.md).

## 1. O que uma logo é (e não é)

Síntese de Paul Rand + prática contemporânea (Adobe, Figma, skills):

| É | Não é |
|---|---|
| Identificador / bandeira / assinatura | Explicação do negócio |
| Deriva significado da qualidade do produto no tempo | Magia que “salva” produto ruim |
| Distintivo, visível, usável, memorável, universal, durável, atemporal | Ilustração detalhada / poster / mockup |
| Funciona em 1 cor e em ~16 px | Dependente de gradiente, glow, textura ou foto |

> “A logo doesn’t sell (directly), it identifies.” — Paul Rand, *Logos, Flags, and Escutcheons* (1991)

**Logo ≠ identidade ≠ marca**

- **Logo**: o mark (símbolo, wordmark ou ambos)
- **Identidade**: logo + tipo + cor + imagery + regras de uso
- **Marca**: percepção acumulada no público

## 2. Princípios operacionais (checklist)

1. **Brief antes do pixel** — nome exato, o quê, para quem, 3–5 adjetivos, concorrentes, restrições
2. **Uma ideia clara** — se não cabe numa frase, sobra ruído
3. **Identificar, não ilustrar** — metáfora única; evitar “produto + cidade + história” no mesmo desenho
4. **Simplicidade como subproduto** — de ideia boa + expectativa modesta (Rand), não de “minimalismo vazio”
5. **Distinção vs. categoria** — listar clichês do setor (fintech: seta/azul/escudo) e evitá-los
6. **Legível em 16 px** — favicon/app icon é o teste duro
7. **Monocromático primeiro** — preto e branco (e invertido) antes da cor
8. **Sistema, não desenho único** — variantes: full color, mono, reversed, icon-only, horizontal, stacked
9. **Longevidade > tendência** — decisão estrutural/perceptual, não efeito da moda
10. **Gestalt / silhueta** — blur/squint: o todo ainda lê?

Detalhe expandido: [`skills/logo-design/references/principles.md`](skills/logo-design/references/principles.md)

## 3. Tipos de marca (escolher ≥2 rotas)

| Tipo | Quando |
|---|---|
| **Wordmark** | Nome curto/único; tipografia carrega tudo |
| **Lettermark / monograma** | Nome longo; iniciais fortes |
| **Pictorial** | Objeto reconhecível simplificado |
| **Abstract** | Forma própria; proteção e diferenciação |
| **Combination** | Default para marca nova (ícone + nome) |
| **Emblem / badge** | Tradição, selo; cuidado com detalhe em pequeno |
| **Mascot** | Personalidade forte; raro em B2B SaaS |

Guia: [`skills/logo-design/references/mark-types.md`](skills/logo-design/references/mark-types.md)

## 4. Fluxo padrão (IA)

```text
Brief → pesquisa categoria/clichês → word map → 3 conceitos (tipos diferentes)
  → checkpoint (usuário escolhe) → SVG limpo → testes → kit (variantes + guidelines)
```

1. Discovery: [`skills/logo-design/references/discovery-brief.md`](skills/logo-design/references/discovery-brief.md)
2. Construção SVG: [`skills/logo-design/references/svg-construction.md`](skills/logo-design/references/svg-construction.md)
3. Testes: [`sintese/checklist-producao.md`](sintese/checklist-producao.md)
4. Prompts (raster/conceito): [`prompts/FORMULAS-E-TEMPLATES.md`](prompts/FORMULAS-E-TEMPLATES.md)

**Regra:** não entregar kit completo antes do usuário escolher a direção (salvo pedido explícito).

## 5. Skill preferida neste pacote

| Prioridade | Skill | Uso |
|---|---|---|
| 1 | [`skills/logo-design/`](skills/logo-design/SKILL.md) | Processo completo + lib SVG + audit/test sheets |
| 2 | [`skills/logo-creation/`](skills/logo-creation/SKILL.md) | Pipeline 8 fases + validação 16px/grayscale/blur/recall |
| 3 | [`skills/brand-identity/`](skills/brand-identity/SKILL.md) | Logo + tipo + cor como um sistema medido |
| 4 | [`skills/visual-identity/`](skills/visual-identity/SKILL.md) | Vocabulário visual + motion antes do código |
| 5 | [`skills/brand-motion-guidelines/`](skills/brand-motion-guidelines/SKILL.md) | Tokens e regras de motion da marca |
| 6 | [`skills/logo-kit-svg/`](skills/logo-kit-svg/SKILL.md) · svg-logo-system · brand-motion-agent | Kit SVG / φ / animar mark aprovado |

Índice: [`skills/README.md`](skills/README.md)

## 6. Anti-padrões (IA / “logo slop”)

- Gradiente purple, glow, 3D glossy, sombra de mockup, textura de papel
- Mais de 3 cores “porque premium”
- Texto ilegível gerado por modelo de imagem (gerar mark sem texto; wordmark tipográfico à parte)
- Emblema com anel de microtexto
- Cópia de marca famosa “inspirada em”
- Entregar só PNG; master deve ser SVG com `viewBox`, paths editáveis, sem raster embutido

## 7. Entregáveis mínimos de um projeto

- `icon.svg` (mark só)
- `lockup-horizontal.svg` / `lockup-stacked.svg` (se combination)
- `mono-black.svg` / `mono-white.svg`
- Favicon / app icon set (16–512)
- `BRAND.md` ou guidelines curtas: clear space, mínimo, cores hex, usos proibidos
- Tokens CSS opcionais se a identidade alimentar o produto

## 8. Caminho inverso

- Voltar ao DS Editorial Bold sem nova marca: não usar este pacote; usar `03-design-ui-motion/DESIGN-SYSTEM.md`
- Remover pacote: ver [`README.md`](README.md) → Rollback
