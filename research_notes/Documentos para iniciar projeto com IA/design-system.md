# Modern design system documentation standards (2024–2026)

## What docs and artifacts should a product/UI prototype start with?

### Takeaway
Mature systems treat documentation as a multi-artifact stack: human-readable foundations + components + patterns, brand guidelines (or a link), machine-readable tokens (Figma variables / DTCG JSON), and a living code sandbox (Storybook or equivalent)—not a single PDF.

### Cited Findings
- Effective documentation commonly hierarchicalizes: Getting Started → Principles → Foundations/Primitives → Components → Patterns & Flows → Tokens Reference → Contribution/Governance → Changelog/Roadmap — [Ramotion Design System Guide, Ch. 7](https://www.ramotion.com/blog/design-system-guide-chapter-7-documentation-and-tools/)
- Top-level IA usually follows foundations-first, components-first, or (rarer) use-case-first; most teams should start foundations-first or components-first; GOV.UK is the canonical use-case-first example — [zeroheight: How to structure your design system documentation](https://zeroheight.com/learn/how-to-structure-your-design-system-documentation/) (Aug 21, 2026)
- Mature systems combine: dedicated docs site (human guidance) + Storybook (component sandbox) + in-code docs (props/types as source of truth); scattering foundations/components/patterns/tokens across unrelated tools is an anti-pattern — [zeroheight structure guide](https://zeroheight.com/learn/how-to-structure-your-design-system-documentation/)
- Material 3 organizes Material.io into Foundations, Styles, and Components (design guidance + tools to customize/build) — [Material Design 3 Get started](https://m3.material.io/get-started)
- Atlassian Design System groups Foundations (tokens, guidelines, visual styles), Components, and Patterns; also role-based getting started for designers, developers, and content designers — [Atlassian Design System](https://atlassian.design/design-system/); [Foundations](https://atlassian.design/foundations/); [Patterns](https://atlassian.design/patterns/)
- IBM Carbon surfaces Building blocks as Foundations, Components, Patterns, Data visualization, plus AI experiences and Carbon MCP for AI apps — [Carbon Design System](https://carbondesignsystem.com/)
- USWDS frames the system as design tokens + components + utilities + implementations; publishes an `llms.txt` index of authoritative docs for agents — [USWDS documentation overview (GitHub)](https://github.com/uswds/uswds-site/blob/main/pages/documentation/overview.md); [designsystem.digital.gov/llms.txt](https://designsystem.digital.gov/llms.txt)
- Figma positions variables as the design-side implementation of design tokens, with modes for themes; styles still needed for gradients/composites — [Figma: Update 1 Tokens, variables, and styles](https://help.figma.com/hc/en-us/articles/18490793776023-Update-1-Tokens-variables-and-styles); [Figma Guide to variables](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
- Storybook Autodocs generates baseline docs from stories/metadata; MDX/Doc Blocks expand into design-system sites and usage guidelines — [Storybook: How to document components](https://storybook.js.org/docs/writing-docs)
- Brand books (2024 examples) remain a separate artifact covering logo, color, typography, imagery, voice, applications—often linked from DS foundations rather than fully duplicated — [Brandbooks template (12 parts)](https://www.brandbooks.app/brand-guidelines-template); [UNICEF Brand Book 4.0 (2024)](https://grafisk-portal.unicef.dk/wp-content/uploads/2024/09/brandguide-4.0.pdf); [Zabbix Brandbook 2024](https://assets.zabbix.com/files/Brochures/Zabbix_Brandbook_2024.pdf)

### Inferences
- For a prototype kickoff aimed at designers **and** AI coding agents, the practical artifact set is: (1) Foundations MD / site (tokens + rules), (2) Brand slice relevant to UI (logo, color, type, voice), (3) Figma variables library or DTCG `tokens.json`, (4) Component inventory with usage + a11y, (5) Storybook or open-code components (shadcn-style) as executable truth, (6) optional agent surface (`llms.txt` / MCP / `AGENTS.md`).
- Brand book ≠ design system: brand owns identity/voice; DS owns interactive UI decisions, states, and code contracts.

### Gaps
- `designsystems.digital.gov` returned HTTP 500 during this research pass; USWDS content was taken from `designsystem.digital.gov` and GitHub instead.
- Shopify Polaris public site currently emphasizes multi-surface app architecture and Polaris web components more than a classic foundations/components IA landing page; deeper Polaris pattern-page inventory was not fully crawled — [polaris.shopify.com](https://polaris.shopify.com/)

---

## What sections must each artifact have?

### Takeaway
Each artifact type has a predictable required section set; component pages converge on purpose → when to use → anatomy → variants/states → content → behavior → accessibility → code → do/don’t; foundations and brand have distinct non-overlapping section mandates.

### Cited Findings

#### Design system site / foundations
- Foundations typically cover: semantic color roles & tokens; typography scale & usage; spacing & sizing; grid/breakpoints/layout; motion presets; icon rules — [Ramotion Ch. 7](https://www.ramotion.com/blog/design-system-guide-chapter-7-documentation-and-tools/)
- Material Foundations include: accessibility, content design, customization, design tokens, interaction states, layout — [Material Foundations](https://m3.material.io/foundations)
- Material Styles cover: color, elevation, icons, motion, shape, typography — [Material Styles](https://m3.material.io/styles)
- Atlassian Foundations include: tokens; accessibility; content; spacing; grid; color; typography; iconography; illustrations; logos; elevation; border; radius — [Atlassian Foundations](https://atlassian.design/foundations/)
- Adobe Spectrum guidance recommends docs include: Fundamentals (history/principles/goals); Information for designers (hierarchy, icons, color, type, spacing, motion); Information for developers (platforms, adaptation, customization impact); Support (FAQ, migration, libraries, contacts) — [Adobe Design: Designing design systems](https://adobe.design/ideas/designing-design-systems-supporting-implementation-and-adoption)
- Base UI case study Foundations section: overview/why; principles; brand guidelines links; tokens 101; naming; design↔code connection; versioning; concepts (props/slots) for non-engineers — [Belle Lee: Design System Documentation as a Product](https://bellelee.me/blog/design-system-documentation-as-a-product)

#### Component library documentation (per component)
- Recommended component page structure: name/role; when to use / not; anatomy; variants & states; content guidelines; behavior/interaction; accessibility (ARIA, keyboard, SR); code example; do’s/don’ts; related components/patterns — [Ramotion Ch. 7](https://www.ramotion.com/blog/design-system-guide-chapter-7-documentation-and-tools/); [UXPin: 9 Steps to Document Your Design System](https://www.uxpin.com/studio/blog/design-system-documentation-guide/)
- Spectrum Web Components required README structure: Overview → Usage → Anatomy → Options → States → Behaviors → Accessibility — [Spectrum Web Components: Developing a Component](https://opensource.adobe.com/spectrum-web-components/guides/adding-component/)
- Component pages in practice also include: live Storybook examples, responsive behavior notes, props/API, token annotations, linked related components — [Belle Lee](https://bellelee.me/blog/design-system-documentation-as-a-product)
- Storybook minimum per component: default story; every named variant; relevant states (Disabled/Loading/Error/Empty); edge cases; docs description for when/when-not — [Linkit: Storybook for Design System Documentation FAQ](https://linkit.sh/blog/storybook-design-system-documentation-faq)
- Autodocs alone documents props, not usage context, unsupported cases, or a11y guarantees—those need written description — [Linkit FAQ](https://linkit.sh/blog/storybook-design-system-documentation-faq)

#### Patterns
- Patterns document multi-component scenarios: form validation/errors; empty/loading/error; confirmation/destructive; navigation; data density — [Ramotion Ch. 7](https://www.ramotion.com/blog/design-system-guide-chapter-7-documentation-and-tools/)
- Atlassian Patterns include AI interaction guidelines and pattern libraries combining components + foundations — [Atlassian Patterns](https://atlassian.design/patterns/)

#### Brand book / brand guidelines
- Common 2024 brand-book outline (12 parts): foundation; audience/positioning; personality; logo; colour (with HEX/RGB/CMYK/Pantone + contrast); typography; graphic language; photography; tone of voice; layout; applications; files & governance — [Brandbooks guidelines template](https://www.brandbooks.app/brand-guidelines-template)
- Real 2024 brand books prioritize logo versions/misuse, core/secondary colors with multi-format codes, primary/secondary type roles, imagery, and channel applications — [Taylor Brand Guidelines 2024](https://6858527.fs1.hubspotusercontent-na1.net/hubfs/6858527/__Taylor.com%20-%20All%20files%20connected%20to%20main%20site%20and%20blogs/04%20Company/About/2024%20Taylor%20Brand%20Guidelines_Small.pdf); [UNICEF Brand Book 4.0](https://grafisk-portal.unicef.dk/wp-content/uploads/2024/09/brandguide-4.0.pdf)

#### Figma variables / tokens artifact
- Standard three-layer token model: Primitive → Semantic (alias) → Component-specific — [Figma resource library: Design Tokens](https://www.figma.com/resource-library/design-tokens/); [Figma Update 1](https://help.figma.com/hc/en-us/articles/18490793776023-Update-1-Tokens-variables-and-styles)
- Recommended Figma setup: separate collections for Primitives / Semantic / optional Component; modes for one concern per collection (e.g. light/dark **or** brand A/B, not mixed) — [zeroheight: Setting up design tokens in Figma](https://zeroheight.com/learn/setting-up-design-tokens-in-figma-variables-collections-and-modes/)
- Figma recommends prioritizing color, spacing, and typography first when creating primitives — [Figma Design Tokens resource](https://www.figma.com/resource-library/design-tokens/)
- Carbon documents Theme vs Token vs Role vs Value, core token groups (Background, Layer, Field, Border, Text, Link, Icon, Support, Focus, Skeleton), component tokens, and interaction states (hover/active/selected/focus/disabled) with a11y contrast guidance — [Carbon Color guidelines](https://carbondesignsystem.com/guidelines/color/overview/) (updated Sep 25, 2026)

#### Storybook
- Use Autodocs + MDX for prose; deploy on every main merge; generate prop tables from types; add a11y addon (axe covers ~30–40%; rest needs manual keyboard/SR stories) — [Storybook writing-docs](https://storybook.js.org/docs/writing-docs); [Linkit FAQ](https://linkit.sh/blog/storybook-design-system-documentation-faq); [Storybook a11y pipeline blog](https://storybook.js.org/blog/the-accessibility-pipeline-for-frontend-teams/)

### Inferences
- Actionable checklist for “must have” sections when starting a prototype:
  - **Foundations:** color roles, type scale, spacing, radius, breakpoints; interaction states defined once; a11y contrast rules; naming shared with code.
  - **Brand (UI-relevant):** logo rules, primary/secondary palette with HEX, typefaces + roles, voice/tone for UI copy.
  - **Tokens file / Figma:** primitives + semantic aliases (+ modes if dark/multi-brand); export path to CSS/JSON.
  - **Each component:** purpose, use/not, anatomy, variants, states, a11y, code/example, do/don’t.
  - **Patterns (as needed):** forms, empty/loading/error, destructive confirm.
  - **Storybook:** default + variants + states stories; Autodocs; a11y checks.

### Gaps
- No single industry ISO-style mandatory section list; section sets above are consensus from leading systems and documentation platforms, not a formal standard.

---

## How do modern systems (Material 3, Polaris, Radix/shadcn, Spectrum, Atlassian, Carbon) structure documentation?

### Takeaway
Leading systems converge on Foundations (+ Styles/Tokens) → Components → Patterns, with platform-specific extras (Material Styles & dynamic color; Carbon themes/layering & MCP; Spectrum machine-readable Design Data + AI; shadcn open-code/theming tokens; Atlassian content + AI patterns; USWDS tokens/utilities/`llms.txt`).

### Cited Findings

#### Material Design 3
- Organized in three main parts: Foundations & customization; Styles (color, type, icons, motion, shape); Components (by purpose: action, containment, communication, navigation, selection, text input) — [m3.material.io/get-started](https://m3.material.io/get-started); [Components](https://m3.material.io/components); [Styles](https://m3.material.io/styles)
- Foundations explicitly include design tokens and interaction states — [Foundations](https://m3.material.io/foundations)
- M3 Expressive extends with more components, emphasized typography, spring motion, expanded shape library — [Get started](https://m3.material.io/get-started)

#### Shopify Polaris
- Current public entry emphasizes Polaris as unified UI framework on web components across App Home and surface-specific UI extensions (Admin, Checkout, Customer account, POS) — [polaris.shopify.com](https://polaris.shopify.com/)
- Structure is surface/API-oriented for Shopify app builders more than a classic brand-foundations landing IA (as of fetch time)

#### Radix / shadcn
- Radix Primitives: unstyled, accessible behavior layer (WAI-ARIA patterns, focus, keyboard); intended as base of a design system — [Radix Primitives Introduction](https://www.radix-ui.com/primitives/docs/overview/introduction)
- shadcn/ui: not an npm library but open-code distribution; principles include Open Code, Composition, Distribution schema/CLI, Beautiful Defaults, **AI-Ready**; predictable composable APIs for humans and LLMs — [ui.shadcn.com/docs](https://ui.shadcn.com/docs)
- Theming via semantic CSS variables (`background`/`foreground`/`primary`/…/`radius`) under `:root` and `.dark` — [shadcn Theming](https://ui.shadcn.com/docs/theming)

#### Adobe Spectrum
- Human docs guidance: Fundamentals; designer info; developer info; support — [Adobe Design article](https://adobe.design/ideas/designing-design-systems-supporting-implementation-and-adoption)
- Component README standard: Overview, Usage, Anatomy, Options, States, Behaviors, Accessibility — [SWC adding-component](https://opensource.adobe.com/spectrum-web-components/guides/adding-component/)
- Spectrum Design Data (machine-readable): Components API schemas; Tokens; Registry (sizes/states/variants/glossary); **AI** (MCP, Cursor, llms.txt, generated markdown) — [Spectrum Design Data](https://opensource.adobe.com/spectrum-design-data/)
- Design Data Spec covers token format, taxonomy, registry, component format (options/slots/anatomy/states), cascade, mode sets, platform manifests, accessibility vocabulary, document blocks, agent-readable surface — [Design Data Specification](https://opensource.adobe.com/spectrum-design-data/spec/)

#### Atlassian Design System
- Explore IA: Foundations; Components; Rovo UI (AI moments); get-started by craft (designers / developers / content designers) — [atlassian.design/design-system](https://atlassian.design/design-system/)
- Foundations = tokens + guidelines (a11y, content) + styles (spacing, grid, color, type, icons, etc.) — [Foundations](https://atlassian.design/foundations/)
- Components categorized by Forms/inputs, Layout, Messaging, Navigation, Overlays, Text/data, Primitives — [Components](https://atlassian.design/components/)
- Patterns include AI interaction guidelines and Rovo/AI patterns — [Patterns](https://atlassian.design/patterns/)

#### IBM Carbon
- Home IA: Foundations, Components, Patterns, Data visualization; Universal Experiences; AI guidance; Carbon MCP connecting AI apps to components/tokens/icons/guidance/code; Carbon v12 evolution — [carbondesignsystem.com](https://carbondesignsystem.com/)
- Color docs exemplify deep foundation pages: anatomy, layering model, themes (White/Gray 10/90/100), token taxonomy, core vs component tokens, interaction states, accessibility contrast — [Carbon Color](https://carbondesignsystem.com/guidelines/color/overview/)

#### USWDS (government reference)
- Tokens + Components + Utilities + Implementations; component pages include usage, accessibility, implementation, and a11y tests; lifecycle/status pages; `llms.txt` for agent indexing — [USWDS overview](https://github.com/uswds/uswds-site/blob/main/pages/documentation/overview.md); [llms.txt](https://designsystem.digital.gov/llms.txt); [Design tokens](https://designsystem.digital.gov/design-tokens/)

### Inferences
- Cross-system template for structuring your own docs:
  1. Getting started (install Figma + code)
  2. Foundations/styles/tokens
  3. Components (categorized by UI job, not atomic design jargon)
  4. Patterns (incl. empty/error/AI if relevant)
  5. Content/voice
  6. Accessibility
  7. Contribution + status/changelog
  8. Machine/agent surface (tokens JSON, MCP, llms.txt)
- Prefer purpose-based component categories (“Forms”, “Feedback”) over Atoms/Molecules — [zeroheight structure guide](https://zeroheight.com/learn/how-to-structure-your-design-system-documentation/)

### Gaps
- Full Polaris foundations/component page templates were not fully retrieved from the current multi-surface Polaris site.
- Detailed Atlassian/Carbon individual component page templates were inferred from overview IAs and peer systems rather than exhaustively sampled page-by-page.

---

## What is the minimum viable design system for a prototype?

### Takeaway
An MVDS for a prototype is tokens (semantic color, type, spacing) + a handful of core components with real states + thin usage/a11y notes + shared naming in design and code—not a full pattern library or governance bureaucracy.

### Cited Findings
- Startup MVDS (≈1–2 weeks): Tokens—5–10 semantic colors, 8-point spacing scale, 4–5 text styles; Core components—Button (all states), Input (label/error/helper), Modal, Card, Badge/tag — [Tequity: Design system for startups](https://tequity.tech/insights/design-system-for-startups)
- Copy/paste minimum checklist: design tokens; core components (buttons, inputs, links, one layout primitive); usage guidelines; accessibility; code implementation; ownership — [Unicorn Club: Design Systems](https://unicornclub.dev/glossary/product-design-strategy/design-systems/)
- Four-layer checklist order: foundations as roles (not swatches) → interactive states defined once → components demanded by real screens → documentation/governance — [Shaban Rasheed: Design system checklist](https://shabanrasheed.com/writing/design-system-checklist)
- States to name before components: default, hover, focus, active, disabled, loading, error, empty — [Rasheed checklist](https://shabanrasheed.com/writing/design-system-checklist)
- Lean Design System MVDS: start today; solve today’s problems; validate continuously; lightweight knowledge hub documenting repos/external resources — [Lean Design System: Minimum Viable Design System](https://docs.leandesignsystem.org/tactics/principles/minimum-viable-design-system/)
- Prototype readiness checklist: every control maps to existing component or explicit new pattern; primary/secondary/destructive distinguished; loading/empty/error/disabled/success where flow needs them; intentional breakpoints; tokens used; engineer can infer interaction without guessing — [MUI Recipes: Design system-aligned prototyping](https://recipes.mui.com/blog/guide-to-design-system-aligned-prototyping)
- Figma primitive priority for new systems: color, spacing, typography first — [Figma Design Tokens](https://www.figma.com/resource-library/design-tokens/)
- shadcn path to MVDS: semantic CSS theme tokens + Radix-backed accessible open-code components installed into the repo — [shadcn Introduction](https://ui.shadcn.com/docs); [Theming](https://ui.shadcn.com/docs/theming)

### Inferences
- **Prototype MVDS checklist (actionable):**
  1. Semantic tokens: `primary`, `secondary`, `surface`, `text`, `border`, `danger`/`warning`/`success`; spacing scale; type roles; radius; focus ring.
  2. Figma variables (primitives + semantic) **or** CSS variables / DTCG JSON with the same names.
  3. Components only as screens need them—typically Button, Text field, Card, Modal/Dialog, Link, one Stack/Grid.
  4. Document once: state matrix; when primary vs secondary vs destructive; empty/loading/error for data views.
  5. A11y baseline: contrast pairs; focus visible; keyboard for dialogs/menus (Radix/shadcn helps).
  6. One discoverable doc (markdown site, Notion, or Storybook Docs) + owner.
  7. Defer: full icon set, motion system, multi-brand theming, contribution RFC process—until reuse pain appears.

### Gaps
- Published “1–2 week / 80% benefit” estimates are practitioner guidance (Tequity), not controlled studies.
- No universal component count for MVDS; screen demand should drive the set (Lean/Rasheed).

---

## Trends 2024–2026: design tokens (W3C DTCG), multi-brand tokens, AI-consumable design specs?

### Takeaway
2025 delivered the first stable DTCG Design Tokens Specification (2025.10) with explicit theming/multi-brand support; in parallel, major systems and vendors are shipping AI-consumable surfaces (MCP, `llms.txt`, agent markdown, open-code schemas) so coding agents implement from the same source of truth as humans.

### Cited Findings

#### W3C / DTCG design tokens
- First stable Design Tokens Specification version **2025.10** announced Oct 28, 2025 (Final Community Group Report; **not** a W3C Standards Track Recommendation) — [DTCG announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/); [Technical Reports 2025.10](https://www.designtokens.org/tr/2025.10/); [W3C CG page](https://www.w3.org/community/design-tokens/)
- Stable modules listed: Format Module, Color Module, Resolver Module (2025-10-28) — [W3C Design Tokens CG](https://www.w3.org/community/design-tokens/)
- FAQ: safe for production; still evolving; core format stable; many tools already implementing — [designtokens.org FAQ](https://www.designtokens.org/faq/)
- 2025.10 highlights: theming and multi-brand support without file duplication; modern color spaces (Display P3, Oklch, CSS Color 4); inheritance/aliases/component-level references; cross-platform generation — [Stable version announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- Tooling cited as supporting the spec includes Figma, Penpot, Sketch, Tokens Studio, Style Dictionary, Terrazzo, Framer, Knapsack, Supernova, zeroheight (per DTCG posts) — [Announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/); [June 2026 CG note](https://www.w3.org/community/design-tokens/)

#### Multi-brand / multi-mode tokens
- DTCG positions theming/multi-brand as a first-class stable capability — [Announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- Figma modes implement theme/brand switching; zeroheight advises **one concern per collection’s modes** (don’t mix light/dark and Brand A/B in the same mode axis) — [zeroheight Figma tokens setup](https://zeroheight.com/learn/setting-up-design-tokens-in-figma-variables-collections-and-modes/)
- Carbon demonstrates mature multi-theme token roles (same token names, theme-specific values; layering models differ light vs dark) — [Carbon Color](https://carbondesignsystem.com/guidelines/color/overview/)
- Spectrum Design Data specifies Mode Sets, cascade/resolution across foundation/platform/product layers, and platform manifests — [Spectrum Design Data Spec](https://opensource.adobe.com/spectrum-design-data/spec/)

#### AI-consumable design specs / codegen guidance
- Carbon ships **Carbon MCP** for real-time AI access to components, tokens, icons, guidance, and code — [Carbon home](https://carbondesignsystem.com/)
- Spectrum Design Data has an explicit **AI** section (MCP, Cursor, llms.txt, generated markdown) — [Spectrum Design Data](https://opensource.adobe.com/spectrum-design-data/)
- USWDS publishes [`llms.txt`](https://designsystem.digital.gov/llms.txt) indexing authoritative documentation for LLM/agent consumption
- shadcn markets **AI-Ready** open code + consistent APIs so models can read/improve/generate components; schema/CLI supports distribution and AI generation — [shadcn docs](https://ui.shadcn.com/docs)
- zeroheight AI product: keep docs current, then deliver component/guidance context into Figma Make, Cursor, Claude, VS Code via MCP — [zeroheight AI](https://zeroheight.com/ai/)
- Layout.design extracts tokens/components from Figma/sites into agent context files (`layout.md`, `AGENTS.md`, `.cursorrules`, `tokens.json` DTCG-compatible, CSS vars, Tailwind config) + MCP tools — [Layout docs](https://layout.design/docs)
- Astryx generates agent docs + MCP `search`/`get` for components/templates/examples; enforces template-first workflows and anti-patterns (no raw divs, use tokens) — [Astryx Working with AI](https://astryx.atmeta.com/docs/working-with-ai)
- Prodular UI targets AI-built SaaS: screens with states, component rules as `llms.txt`, CLI + MCP — [Prodular UI](https://ui.prodular.co/)
- distill-ui reverse-engineers codebases into tokens, component registry, and agent instructions (`SYSTEM.md` / `CLAUDE.md`) — [distill-ui README](https://github.com/hazlijohar95/distill-ui/blob/main/README.md)

### Inferences
- For new prototypes in 2026: prefer **semantic tokens with stable names**, store them in DTCG-friendly JSON and/or Figma variables, and expose a thin **agent pack** (`llms.txt` or `AGENTS.md` + token CSS + component usage rules + anti-patterns).
- Multi-brand should be modeled as **modes/themes over shared semantic roles**, not duplicated component libraries.
- AI-consumable docs work best when: (1) naming is consistent design↔code, (2) props/examples are generated from code, (3) do/don’t and a11y are explicit prose agents can retrieve, (4) MCP/`llms.txt` points at the same canonical docs humans use.

### Gaps
- DTCG is a Community Group Final Report, not a W3C Recommendation—long-term Standards Track status remains open ([FAQ](https://www.designtokens.org/faq/)).
- Vendor AI/MCP offerings (zeroheight, Layout, Astryx, Prodular) are product claims; independent comparative eval of codegen fidelity was not found in this pass.
- Best practices for “how much prose vs structured schema” in agent packs are emerging, not settled; Spectrum’s Design Data Spec is among the most formal machine-readable models found.
)
