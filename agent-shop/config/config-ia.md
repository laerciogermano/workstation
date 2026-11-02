# Configurações para a IA — Agent Shop

**Por quê:** garantir rastreio dos prompts e que alterações na documentação propaguem até o fim da esteira.  
**Importante:** evita perder o histórico da conversa e evita entregas pela metade.  
**No fluxo:** acompanha toda a árvore — regra operacional para quem edita os artefatos.

Fontes: [`../docs/README.md`](../docs/README.md).  
Timeline: [`../prompts/timeline.md`](../prompts/timeline.md).

---

## Regras

### Salvar todos os prompts

**Todo prompt recebido neste projeto deve ser gravado na timeline antes (ou junto) da entrega.**

1. Copiar o texto **integral** do usuário.
2. Criar `../prompts/NNN-AAAA-MM-DD-slug.md` com o próximo número.
3. Acrescentar linha em [`../prompts/timeline.md`](../prompts/timeline.md).
4. Metadados, original, interpretação e o que foi feito.
5. Não pular prompts curtos ou de correção.

### Cascata de próximos passos

Para alteração na esteira: seguir **Próximos passos** do arquivo até o próximo nó existente; não inventar app/API fora do mapa de discovery sem atualizar visão + stories.

### Stack de execução (não reinventar)

- Conversa / persona: preferir contrato mental de [`../../low-chat/README.md`](../../low-chat/README.md)
- Web: Chrome + CDP + [`human-cdp`](../../screen-robot/pocs/chrome-cdp/human-cdp/README.md) (foco + trajetória)
- App: [`screen-robot`](../../screen-robot/README.md)
- **Não** misturar com funil ConnectMax vendas salvo pedido explícito

## Árvore (resumo)

```text
README (visão)
  → docs/README
    → docs/discovery/1.stories → 2.epics → 3.roadmap
      → 4.scenarios → 5.bdds → (código / protótipo)
```

## Próximos passos

→ Manter prompts em dia · seguir roadmap a partir de `US-01`
