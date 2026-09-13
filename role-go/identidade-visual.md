# RoleGo — Identidade Visual

Extraído dos mockups em [`input/rolego_mvp_completo_dark.pdf`](input/rolego_mvp_completo_dark.pdf) (telas do app) e [`input/rolego_slides_publico.pdf`](input/rolego_slides_publico.pdf) (slides públicos do produto). Serve de referência rápida de cor, tipografia e padrões de UI para telas, protótipo e componentes.

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
| Superfície / card | `#10162B`, `#151525`, `#1A1B28` | Cards, inputs, blocos de feature — um tom acima do fundo |
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

- Fonte **sans-serif bold**, estilo geométrico (aparência tipo Inter/Poppins/Montserrat).
- **Títulos de seção**: caixa alta, peso bold, branco, com uma barra vertical colorida (magenta/ciano/verde/amarelo) à esquerda.
- **Hero/logo**: texto grande, bold, com preenchimento em gradiente (roxo → azul).
- **Ênfase dentro de parágrafo**: uma palavra-chave em cor neon (ex.: “segundos” em ciano, “descontos em bares parceiros” em ciano-bold) dentro de texto branco/cinza normal.
- **Corpo de texto**: branco ou cinza claro, peso regular, tamanho menor.
- **Labels/legendas** (tabs, badges, categorias): caixa alta, peso semibold, tamanho pequeno.

---

## 4. Padrões de UI

- **Botão primário**: fundo em gradiente roxo → azul, texto branco bold, cantos totalmente arredondados (pill).
- **Botão secundário / login social** (Google, Apple): fundo escuro (transparente/surface), borda fina neon (ciano ou magenta), texto branco.
- **Chips / filtros** (tipo de evento, cidade): formato pill; estado **ativo** = fundo roxo sólido; estado **inativo** = apenas borda cinza fina, fundo transparente.
- **Cards de feature** (ex.: telas de segurança, gamificação): fundo surface escuro, barra de acento colorida na borda esquerda, ícone na cor do acento.
- **Cards de destaque** (“VIP Member”, “Segurança Ativa”, “O RoleGo resolve isso”): fundo com leve gradiente/glow, borda neon fina, conteúdo centralizado.
- **Frames de tela (mockup)**: contorno fino em gradiente neon (rosa/roxo/ciano) simulando borda de smartphone.
- **Ícones**: estilo flat/outline, sempre na cor neon da categoria (localização = ciano/verde, emergência = magenta, transporte = amarelo).
- **Divisores**: linha fina, geralmente com leve gradiente ou cor neon sutil, separando header de conteúdo.

---

## 5. Logo

- Wordmark **“RoleGo”**, sem serifa, bold.
- “**Role**” em tom roxo/magenta do gradiente; “**Go**” em tom azul/ciano do gradiente — leitura contínua em um único gradiente diagonal.
- Usado sozinho (splash) ou acompanhado do slogan: *“Chega de sofrer para decidir onde sair.”*

---

## 6. Aplicação rápida (resumo para dev/design)

```
Fundo:              #05070F (telas)  /  #09091A (slides)
Surface:            #10162B / #151525
Gradiente primário: #8749FF → #452EFF (roxo → azul)
Acento ciano:       #00E5E5 (aprox.)
Acento magenta:     #FF1F7A (aprox.)
Acento verde:       #00FF00
Acento amarelo:     #FFCC00
Texto principal:    #FFFFFF
Texto secundário:   #9CA3AF
```

> Os valores exatos de hex podem variar levemente por ferramenta/exportação (mockup vs. slide); use as faixas acima como referência de tokens de cor a serem fixados no design system.
