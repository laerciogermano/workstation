# 020 — Protótipo mobile (fã + criador), no padrão de apresentação RoleGo/Notinhas

| Campo | Valor |
|-------|--------|
| Data | 2026-11-11 |
| Origem | Chat (4 mensagens) |

## Prompt original

```text
agora crie um outro prototipo, mas crie agora um protitpo mobile, com as telas de navegacao do cliente e do criador de conteudo, a parte de login, cadastro, publicacao e etc... chat... feed, stories, e etc.. tudo que tem no projeto de ufncionalidade que sera desenvolvida
```

```text
faca no padrao de front apresentcao do rolego prototipo que voce cirou anterirmente, do mesmo jeito o notinhas, crie o prototipo no mesmo estilo de apresentacao
```

```text
para criar o prototipo,use como referncia as boas praticas do /Users/laerciogermano/Documents/works/core/definir-projeto-moderno
```

```text
nao use creme e nem esse escuro quase preto, use preto mesmo #000 nessa cor escura que voce ta fazendo para substituir o preto
```

## Interpretação

- Formato igual a `role-go/beta-docs/prototipos/index.html`: hero, nav de fluxos, galeria de celulares com setas, modo navegável (lista · tela · notas), atalhos de teclado, PDF da galeria.
- Conteúdo: P01–P15 de [`docs/functionalities.md`](../docs/functionalities.md) no mobile, para fã e criador.
- Feed, stories e chat (com mensagem paga) entram **a pedido**, mesmo estando em “Não fazer na v1”; ficam marcados como `pós-v1` em cada tela. `functionalities.md` não foi alterado: mudar o escopo da v1 é decisão de produto.
- Boas práticas de `core/definir-projeto-moderno/03-design-ui-motion`: marca do produto vence o default; sem pill/eyebrow acima do H1; sem narração de UI; números tabulares; motion só como feedback (toque, troca de tela por View Transitions, sheet) com `prefers-reduced-motion`.
- Preto puro `#000` no lugar do ink e cinzas neutros; sem creme.

## Entrega

- [`docs/prototipo-mobile/index.html`](../docs/prototipo-mobile/index.html) + [`prototipo-mobile-clozzy.pdf`](../docs/prototipo-mobile/prototipo-mobile-clozzy.pdf): 44 telas em 7 fluxos (F01 conta · F02 início/stories/explorar · F03 vitrine/compra · F04 biblioteca/chat/conta · F05 ativar criador · F06 painel/publicar · F07 ofertas/conteúdo/fãs/financeiro).
