# RoleGo Beta — Protótipos

**Protótipo navegável:** [`prototipos/index.html`](prototipos/index.html). Abra no navegador, sem build nem servidor.

- **Galeria:** todas as telas agrupadas por fluxo, no estilo dos banners de épico (fundo preto, celulares com contorno neon, setas entre os passos).
- **Modo navegável:** clique em qualquer tela (ou em "▶ Navegar no protótipo"). Os elementos com `data-go` levam à próxima tela. Atalhos: `←/→` anterior/próxima, `Backspace` voltar, `H` mostra as áreas clicáveis, `Esc` fecha. Dá para abrir uma tela direto pela URL: `index.html#T-20`.
- **Notas por tela:** o painel direito mostra as histórias (US) e as regras que a tela precisa cumprir.

> Criado do zero a partir do PRD, das histórias, dos wireframes MVP (`input/rolego_mvp_completo_dark.pdf`), dos slides e da identidade visual (`identidade-visual.md`, banners do `epics.pdf`). Não reaproveita o layout do front atual. Fidelidade: **média/alta** (visual final, conteúdo fictício, capas geradas em CSS no lugar de fotos).

## 1. Princípios de design aplicados

| Princípio | Como aparece |
|---|---|
| Identidade v1 | Fundo preto (`#000` nas telas, `#04050B` na página), Poppins única, títulos **800 itálico em caixa alta** com barra vertical em gradiente, wordmark "Role" branco + "Go" neon com o **"o" como pin** de localização |
| Código de cor por categoria | ciano = descoberta/ação/conta · violeta = marca/navegação · magenta = social/prova social · amarelo = privado/avaliação · verde = ao vivo |
| CTA único por tela | Botão pill em gradiente ciano → violeta; secundário com contorno neon; terciário como link ciano |
| Decidir em segundos | Card com data, distância, preço e prova social (vão/interesse) visíveis sem abrir o evento |
| Polegar primeiro | Ações principais no rodapé fixo (`foot`) ou na tab bar; alvos ≥ 44 px |
| Acessibilidade | Swipe sempre com botões ✕ / ↺ / ♥; contraste AA; estados vazios com ação |

## 2. Inventário de telas

| Código | Tela | Épico | Histórias | Contorno |
|---|---|---|---|---|
| T-01 | Splash | E01 | US-01.01, 01.04 | violeta |
| T-02 | Criar conta | E01 | US-01.01–03, 01.14 | ciano |
| T-03 | Entrar (e-mail, Google, Apple, passkey) | E01 | US-01.02–04, 01.15 | ciano |
| T-04 | Recuperar senha | E01 | US-01.05 | ciano |
| T-05 | Onboarding · O que você curte? | E01 | US-01.07 | violeta |
| T-06 | Onboarding · Cidade | E01 | US-01.08 | violeta |
| T-07 | Onboarding · Localização | E01 | US-01.09 | ciano |
| T-08 | Onboarding · Raio | E01 | US-01.10 | ciano |
| T-09 | Entrar mais rápido (passkey) | E01 | US-01.15 | violeta |
| T-10 | Explorar · Feed | E02 | US-02.11, 03.03, 03.10 | violeta |
| T-11 | Explorar · Swipe | E02 | US-02.12 | magenta |
| T-12 | Explorar · Lista | E02 | US-02.13 | violeta |
| T-13 | Filtros (sheet) | E02 | US-02.14 | violeta |
| T-14 | Explorar onde? | E02 | US-02.15 | ciano |
| T-15 | Busca | E02 | US-02.16 | ciano |
| T-20 | Página do evento | E03 | US-03.01–04, 03.11, 03.12 | violeta |
| T-20b | Evento ao vivo | E03 | US-03.08 | verde |
| T-21 | Quem vai | E03 | US-03.02, 01.12 | magenta |
| T-22 | Você vai! | E03 | US-03.04 | ciano |
| T-23 | Evento privado (bloqueado) | E03 | US-03.05, 02.05 | amarelo |
| T-24 | Compartilhar (sheet + prévia OG) | E03 | US-03.07 | ciano |
| T-25 | Como foi? (avaliação) | E03 | US-03.10 | amarelo |
| T-26 | Organizador (público) | E03 | US-03.13, 03.11 | violeta |
| T-27 | Denunciar (sheet) | E03 | US-03.14 | magenta |
| T-30 | Meus rolês | E01/E03 | US-01.17, 03.04, 03.05, 03.10 | violeta |
| T-31 | Perfil | E01 | US-01.06, 01.11, 01.12, 02.01 | violeta |
| T-32 | Editar perfil | E01 | US-01.11 | violeta |
| T-33 | Preferências e privacidade | E01 | US-01.12, 01.13, 01.15, 02.14 | violeta |
| T-40 | Ativar modo organizador | E02 | US-02.01 | ciano |
| T-41 | Novo rolê · 1 Básico | E02 | US-02.02 | ciano |
| T-42 | Novo rolê · 2 Quando | E02 | US-02.03 | ciano |
| T-42B | Novo rolê · 3 Onde | E02 | US-02.03 | ciano |
| T-43 | Novo rolê · 4 Acesso | E02 | US-02.04, 02.05 | amarelo |
| T-44 | Novo rolê · 5 Valores | E02 | US-02.05 | amarelo |
| T-45 | Novo rolê · 6 Revisão | E02 | US-02.06, 01.14 | ciano |
| T-46 | Organizar · Meus eventos | E02 | US-02.07, 02.08, 02.10, 03.06, 03.09 | ciano |
| T-47 | Galeria do evento | E02/E03 | US-02.09, 03.12 | ciano |
| T-48 | Lista de convidados | E03 | US-03.06 | amarelo |
| T-49 | Cancelar evento (sheet) | E03 | US-03.09 | magenta |
| T-61 | Admin · Denúncias (desktop) | ADM | US-ADM.01–04 | violeta |

**Telas derivadas** (mesmo layout de uma tela-base, só documentadas aqui): "Redefinir senha" (layout da T-04 com nova senha + confirmação), "Só mais uma coisa" (consentimento pós-OAuth, layout da T-02 só com os dois aceites), "Pedido enviado" (T-23 com o CTA desabilitado "Pedido enviado ✓"), "Lotado" (T-20 com o CTA desabilitado "Lotado"), "Cancelado" (T-20 com a faixa magenta no topo), "Lista vazia" do feed ("Nada rolando em 10 km" + "Ampliar para 25 km").

## 3. Navegação

Tab bar com 4 abas: **Explorar** (T-10/11/12) · **Meus rolês** (T-30) · **Organizar** (T-46; para quem não é organizador, leva à T-40) · **Perfil** (T-31). O mapa completo de navegação está em [07-diagramas §8](07-diagramas.md#8-mapa-de-navegação).

## 4. Componentes do design system (para implementar em `apps/web/src/ui`)

| Componente | Variações | Telas de referência |
|---|---|---|
| `Wordmark` | tamanhos, `glow` | T-01, T-03, T-61 |
| `Button` | `primary` (gradiente CTA), `secondary` (contorno ciano/magenta), `ghost`, `danger`, `sm` | todas |
| `Chip` | `default`, `active` (violeta), `removable`, `sm` | T-05, T-10, T-13 |
| `Tile` | seleção com ícone | T-05, T-40 |
| `Input` / `TextArea` | `focus` (ciano), `error` (magenta), ícone à esquerda/direita, hint | T-02, T-41 |
| `Toggle`, `Radio card`, `Checkbox`, `Stepper`, `Segmented` | — | T-33, T-43, T-02, T-10 |
| `RangeSlider` | com glow ciano e escala | T-08, T-13 |
| `ProgressSteps` | n passos | T-05–08, T-41–45 |
| `NeonCard` | cores por categoria | T-08, T-10, T-45 |
| `EventCard` | `feed`, `mini` (lista), `swipe`, `manage` (organizador com métricas) | T-10, T-12, T-11, T-46 |
| `EventCover` | imagem real com `srcset`; o protótipo usa pôsteres CSS como placeholder | — |
| `Badge` | ciano, magenta, amarelo, verde (com `live`), violeta, neutro, `dark` (sobre imagem) | várias |
| `AvatarStack` | até 5 + contador | T-10, T-20 |
| `Sheet` | bottom sheet com borda neon por categoria | T-13, T-24, T-27, T-49 |
| `TopBar`, `TabBar`, `FooterActions` | — | todas |
| `SectionTitle` | barra colorida por categoria | T-20 |
| `EmptyState`, `Skeleton`, `ErrorState` | não desenhados no protótipo: seguir os tokens; skeleton com shimmer violeta sutil | — |

Tokens: `identidade-visual.md §6` → `packages/tokens` (CSS custom properties `--rg-*`).

## 5. Como evoluir o protótipo

1. Cada tela é um `<template data-id="T-xx" data-name data-us data-notes data-accent>` no `index.html`.
2. Para navegar, marque o elemento com `data-go="T-yy"` (ou `data-go="back"`).
3. Para colocar a tela num fluxo, acrescente `['T-yy','Rótulo']` em `FLOWS` (script no fim do arquivo).
4. Mudou uma regra? Atualize também `data-notes`, a história correspondente e este inventário.

## 6. Pendências de design (para o PAF final)

- Fotos reais das casas parceiras no lugar dos pôsteres CSS (com o consentimento dos parceiros).
- Microinterações: animação do swipe (inclinação + carimbo "BORA!"), confete do "Você vai!", pulso do selo "Ao vivo".
- Telas de erro de rede/offline do PWA e o guia "Adicionar à tela inicial" no iOS.
- Validação com 5 usuários (teste de usabilidade moderado) antes do M3: tarefas "achar um rolê para sábado" e "confirmar presença".
