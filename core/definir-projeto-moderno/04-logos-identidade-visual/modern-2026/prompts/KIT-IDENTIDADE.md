# Prompts de kit de identidade (2026)

Adaptados de fluxos públicos (Techpresso 50 brand-kit prompts, Malbar, MarqOps, skills locais).  
Preencher colchetes. Preferir HTML self-contained + SVG inline para preview.

---

## 1. Três direções de logo (checkpoint)

```text
Você é brand designer + identity strategist. Gere 3 direções de logo genuinamente diferentes
para preview em UM HTML self-contained (CSS + SVG inline).

- Nome: [NOME]
- O que faz (1 linha): […]
- Audiência: […]
- Personalidade (3 adj.): […]
- Marcas que admiro (opcional): […]
- Hard nos (cores/estilos/clichês): […]
- Tendência 2026 a considerar (ou "nenhuma — atemporal"): […]

Direções: (A) wordmark-led · (B) symbol+text · (C) abstract/conceptual.
Para cada: nome da direção, ideia em 1 frase, racional estratégico, feeling tipográfico, cor primary, SVG flat legível grande e pequeno.
Sem raster, sem glow, sem mockup. Depois: recomendação de 1 direção e por quê.
Usar core/definir-projeto-moderno/04-logos-identidade-visual/ (LOGO-IDENTIDADE + modern-2026/IDENTIDADE-MODERNA).
```

---

## 2. Família responsiva (Level 2)

```text
A partir do mark aprovado [descrever / SVG], produzir família em SVG inline num HTML:
horizontal lockup · stacked · icon-only · glyph 16px · mono black · reversed white.
Mesma DNA geométrica; clear-space em unidade do próprio mark; nota de minimum size.
Sem gradiente nos masters. Listar em quais canais cada variante entra.
```

---

## 3. One-page brand guidelines (HTML)

```text
Montar one-pager HTML self-contained de brand guidelines:
header (nome + essência 1 linha) · logo (lockups + clear-space + 3 don'ts) ·
cores (swatches hex/RGB + uso + pares AA light/dark) ·
tipo (display+body + escala H1→caption) ·
voz (3 adj. + 3 do / 3 don't + 1 before/after) ·
motion (1 signature move + reduced-motion) ·
AI rules (o que pode / o que precisa review).
Fonts: só o necessário (ou system + Google Fonts). Print-friendly.
Inputs: [NOME] [o quê] [adj.] [hex] [fonts/vibe] [logo] [voz 1 frase]
```

---

## 4. Palette from vibe

```text
Traduzir adjetivos [3–5] + mood a evitar […] em palette:
primary · secondary · accent · neutros 5 steps · success/warning/danger.
Para cada: nome, hex, RGB, "use this for".
Mostrar UI strip (botão, badge, card, link) com contraste AA.
Mapear cada cor a um adjetivo. Dark mode espelhado.
```

---

## 5. Motion guidelines (Level 1)

```text
Atributos de marca: [lista].
Escrever brand motion guidelines curtas:
princípios · tokens duração (instant→slow) · easing (cubic-bezier) ·
entrance/exit · regras do logo (o que nunca fazer) · estados UI ·
reduced-motion · 5 do/don't.
Formato: markdown pronto para BRAND.md § Motion.
Skill: brand-motion-guidelines neste pacote.
```

---

## 6. Visual identity pré-código (sites)

```text
Antes de qualquer UI code: personalidade 4–5 keywords → traduzir cada uma em decisão visual →
3 tratamentos de display type → escolher par tipográfico → expandir cor em tokens →
textura (grain/gradient/clean) → 4 signature moves de motion → escrever design-system.md.
Skill: visual-identity. Não começar implementação sem esse doc.
```

---

## 7. Agente — identidade completa do projeto

```text
Criar identidade visual para [PROJETO] seguindo
core/definir-projeto-moderno/04-logos-identidade-visual/modern-2026/IDENTIDADE-MODERNA.md
e LOGO-IDENTIDADE.md.

Ordem: brief → 3 conceitos (checkpoint) → SVG kit → cor/tipo → art direction 1p →
motion L1+L2 → BRAND.md + tokens CSS.
Não copiar marcas famosas nem motivos LogoLounge saturados sem justificativa.
Master SVG; motion só após mark aprovado.
```
