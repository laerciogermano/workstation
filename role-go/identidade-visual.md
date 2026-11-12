# RoleGo — Identidade Visual

Extraído dos mockups em [`input/rolego_mvp_completo_dark.pdf`](input/rolego_mvp_completo_dark.pdf) (telas do app) e [`input/rolego_slides_publico.pdf`](input/rolego_slides_publico.pdf) (slides públicos do produto). Serve de referência rápida de cor, tipografia e padrões de UI para telas, protótipo e componentes.

**Estrutura de card/manual (insumo):** modelo ConectTech v1 em [`input/referencia-marca/README.md`](input/referencia-marca/README.md) — layout A4 e seções; cores/logo RoleGo ficam neste documento.

**Kit atual (v4, 2026-11-10):** [`marca/identidade-v4/`](marca/identidade-v4/README.md) — manual 26 págs., `BRAND.md`, `tokens.css`, motion, posts e stories. Onde este documento divergir do v4, vale o v4.

**Manual HTML/PDF v1:** [`marca/README.md`](marca/README.md) · [card Trello](https://trello.com/c/gU37I2lg) · [card logo](https://trello.com/c/S7jWwUbC) · [card benchmarking](https://trello.com/c/pXPmdI7g)

---

## 1. Conceito

Tema **dark** (fundo quase preto/azul-marinho), com **acentos neon** em gradiente roxo→azul (marca) e cores neon de apoio (ciano, magenta, verde, amarelo) para diferenciar categorias de feature — visual de app de vida noturna: contraste alto, brilho (glow), bordas finas coloridas.

---

## 2. Paleta de cores

### Fundo e superfícies

| Uso | Hex (amostra) | Observação |
|-----|----------------|------------|
| Fundo principal (telas do app) | `#050716` – `#0A0F22` | Quase preto, com leve tom azulado |
| Fundo principal (slides) | `#09091A` | Mesma família, tela cheia |
| Superfície / card | `#000000` (card), `#0F0F13`, `#1A1A20` | Cards em preto sólido com fio neutro `#1E1E25`; dentro do app, telas e cards em preto `#000` com contorno neon |
| Texto principal | `#FFFFFF` | Títulos e labels |
| Texto secundário | cinza claro (~`#9CA3AF`) | Subtítulos, descrições, placeholders |

### Gradiente de marca (logo e CTA primário)

| Uso | Hex (amostra) | Observação |
|-----|----------------|------------|
| Roxo/violeta (início do gradiente) | `#8749FF`, `#9E19E9`, `#6539CB` | Lado “Role” do logo; base dos botões primários |
| Azul (fim do gradiente) | `#452EFF`, `#3333FF`, `#3B82F6` | Lado “Go” do logo; base dos botões primários |

O logo **“RoleGo”** e os **botões de ação primária** (“Começar”, “Criar Conta”, “Entrar”, “Permitir sempre”) usam esse gradiente diagonal roxo → azul, em negrito, cantos bem arredondados.

### Cores neon de apoio (por categoria)

| Cor | Hex (amostra) | Uso |
|-----|----------------|-----|
| **Ciano / turquesa** | `#00FFFF`, `#06B9BE`, `#03D0D3` | Links, destaque de texto (“segundos”), alertas inteligentes, ícones de localização/app, bordas de botões sociais (Google/Apple) |
| **Magenta / rosa** | `#FF004C`, `#FF00D1`, `#EC4899` | Barra de destaque de títulos de seção, ícones de chat/social, Instagram, rankings, ênfases fortes |
| **Verde neon** | `#00FF00` | Modo de Segurança (escudo “SEGURANÇA ATIVA”, localização em tempo real) |
| **Amarelo / dourado** | `#FFCC00` | Gamificação, selo VIP, coroa, transporte seguro |

Cada categoria de feature usa uma cor neon fixa como “assinatura” (barra lateral do card + ícone), o que funciona como código de cores por tema (segurança = verde, alertas = ciano, gamificação = amarelo, social = magenta).

---

## 3. Tipografia

- Fonte única: **Poppins** (títulos, textos, botões e legendas). Itálico pesado (800/900) nos títulos para dar movimento.
- **Títulos de seção**: caixa alta, Poppins ExtraBold Itálico, branco, com uma barra vertical colorida (magenta/ciano/verde/amarelo) à esquerda.
- **Hero/logo**: texto grande, bold, com preenchimento em gradiente (roxo → azul).
- **Ênfase dentro de parágrafo**: uma palavra-chave em cor neon (ex.: “segundos” em ciano, “descontos em bares parceiros” em ciano-bold) dentro de texto branco/cinza normal.
- **Corpo de texto**: branco ou cinza claro, peso regular, tamanho menor.
- **Labels/legendas** (tabs, badges, categorias): caixa alta, peso semibold, tamanho pequeno.

---

## 4. Padrões de UI

- **Botão primário**: fundo em gradiente ciano → violeta (`#00E5E5 → #8749FF`, como nos banners de `epics.pdf`), texto branco bold, cantos totalmente arredondados (pill). O gradiente roxo → azul fica para logo, ícone do app e chip ativo.
- **Botão secundário / login social** (Google, Apple): fundo escuro (transparente/surface), borda fina neon (ciano ou magenta), texto branco.
- **Chips / filtros** (tipo de evento, cidade): formato pill; estado **ativo** = fundo roxo sólido; estado **inativo** = apenas borda cinza fina, fundo transparente.
- **Cards de feature** (ex.: telas de segurança, gamificação): fundo surface escuro, barra de acento colorida na borda esquerda, ícone na cor do acento.
- **Cards de destaque** (“VIP Member”, “Segurança Ativa”, “O RoleGo resolve isso”): fundo com leve gradiente/glow, borda neon fina, conteúdo centralizado.
- **Frames de tela (mockup)**: contorno fino em gradiente neon (rosa/roxo/ciano) simulando borda de smartphone.
- **Ícones**: estilo flat/outline, sempre na cor neon da categoria (localização = ciano/verde, emergência = magenta, transporte = amarelo).
- **Divisores**: linha fina, geralmente com leve gradiente ou cor neon sutil, separando header de conteúdo.

---

## 5. Logo

> Atualizado para o logo v4 ([`marca/logo-v4/`](marca/logo-v4/README.md)); o texto antigo (anel com ping no “o”) ficou para trás.

- Nome escrito **RolêGo**, com acento. O **Go** é sempre o símbolo (G + pin numa peça só), nunca “Go” digitado.
- **Rolê e Go nunca na mesma cor** (exceto versões de uma cor). No roxo: Rolê branco + Go ciano `#00E5E5`. No preto: Rolê branco + Go ciano → azul (`#00E5E5 → #3B82F6`), sem letras roxas. No claro: Rolê `#05070F` + Go roxo.
- Estilo principal: superfície roxa `#9E19E9 → #6539CB → #452EFF` com marca branca. Ícone do app: Go branco no roxo.
- Slogan: **“Viva o rolê.”** (Poppins ExtraBold itálico, “rolê” na cor do Go).
- Linha de apoio (proposta de valor): *“Chega de sofrer para decidir onde sair.”*
- Botão primário: degradê roxo (substitui o ciano → violeta da seção 4).
- Domínio oficial: **rolego.com.br** · Instagram: **@rolego**

---

## 6. Aplicação rápida (resumo para dev/design)

```
Fundo:              #04050B (telas/banners)  /  #09091A (slides)
Card:               #000000 (borda #1E1E25) · campos #0F0F13
Gradiente primário: #8749FF → #452EFF (roxo → azul) — logo/ícone
Gradiente de ação:  #00E5E5 → #8749FF (ciano → violeta) — botões
Acento ciano:       #00E5E5 (aprox.)
Acento magenta:     #FF1F7A (aprox.)
Acento verde:       #00FF00
Acento amarelo:     #FFCC00
Texto principal:    #FFFFFF
Texto secundário:   #9CA3AF
```

> Os valores exatos de hex podem variar levemente por ferramenta/exportação (mockup vs. slide); use as faixas acima como referência de tokens de cor a serem fixados no design system.
