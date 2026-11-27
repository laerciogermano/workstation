# Auditoria visual do protótipo — 2026-11-27

**Escopo:** as 64 telas e a página do protótipo. A versão anterior está em [`../prototipo/v3/`](../prototipo/v3/index.html).

**Mantido:** serifa nos títulos, números condensados, ingresso picotado, quatro temas sem preto, telas, textos e casos de uso. O estilo tinha sido aprovado pelo cliente em 18/11.

## O que estava fora do padrão e o que mudou

| Problema na v3 | Mudança na v4 |
|---|---|
| Títulos a 20 px da borda e cartões a 16 px | Margem lateral única de 20 px |
| 24 tamanhos de texto e 17 raios | 17 tamanhos e 8 raios, saindo de escalas de texto, espaço (4/8) e raios concêntricos |
| Blocos cinza chapados sobre branco | Fundo tonal por tema, cartões claros com borda fina e sombra suave |
| Seta solta e avatar repetido em toda tela | Barra superior que vira vidro ao rolar, com título compacto; avatar só nas telas com abas e na home |
| Barra de abas por cima do conteúdo | Barra flutuante com esmaecimento na borda, que encolhe ao rolar |
| Quadrados multicoloridos e caixa com ícone no lugar das imagens | Arte abstrata gerada na cor do tema (marcador até chegar o material) |
| Avatares em seis cores | Tons da própria marca |
| Pinos do mapa sob os botões | Pinos reposicionados abaixo da barra |
| Selos quebrando em duas linhas na home | Bloco duplo: contagem regressiva e situação |
| Menus em listas longas | Menu em grade; Conta com atalhos e grupos por assunto |
| Botão de ação no meio da tela em formulários | Ação ancorada embaixo, ao alcance do polegar |
| Campos nativos de seleção e arquivo | Campos desenhados, com foco visível |
| No aviso de cookies, recusar pesava menos que aceitar | Recusar e aceitar com o mesmo peso |
| Alvos de toque abaixo de 44 px | Área de toque ampliada |
| Trocar o dia na home voltava ao topo | A rolagem é mantida |
| Sem movimento de entrada | Entrada em sequência, desligada com “reduzir movimento” |

Também respeita as preferências do sistema de reduzir transparência e aumentar contraste. Texto secundário e botões ficam com contraste de pelo menos 4,5:1 nos quatro temas.

## Referências consultadas

São, na maioria, artigos de agências e blogs: indicam direção, não são norma.

- [Mobile App UI Trends 2027 (Originux)](https://www.originux.com/resources/blog/mobile-app-ui-trends-2027-what-designers-and-product-teams-should-know/): passkeys, widgets, consentimento com recusa tão fácil quanto o aceite, acessibilidade como padrão.
- [UI Design Trends 2027 (Smartters)](https://smartters.in/blog/ui-design-trends-2027): vidro legível, ações principais maiores, movimento como parte do projeto.
- [Mudanças do Liquid Glass no iOS 27 (Liquid Glass Design)](https://liquidglassdesign.com/blog/ios-27-liquid-glass-changes): material mais difuso, borda mais escura, barra uniforme sobre conteúdo rolando.
- [Apple testa transição mais suave no vidro (MacRumors)](https://www.macrumors.com/2026/11/17/apple-tests-softer-side-of-liquid-glass/): esmaecimento gradual sob a barra (ainda em teste).
- [Barra de abas que encolhe ao rolar (Apple, WWDC25)](https://developer.apple.com/videos/play/wwdc2025/284/).
- [WCAG 2.2 em apps nativos (Deque)](https://www.deque.com/blog/what-wcag-2-2-means-for-native-mobile-accessibility/): tamanho de alvo.

## Não feito nesta rodada

- Entrar com chave de acesso (passkey, Face ID): é funcionalidade nova, não ajuste visual.
- Widgets e avisos na tela bloqueada: dependem de app nativo.
- Fotos reais dos eventos e logomarca do GOB: não recebidas.
