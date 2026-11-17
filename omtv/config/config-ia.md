# Configurações para a IA — OmTV

**Por quê:** rastreio de prompts e cascata da esteira.  
**No fluxo:** regra operacional ao editar artefatos do OmTV.

Fontes: [`../docs/README.md`](../docs/README.md).  
Timeline: [`../prompts/timeline.md`](../prompts/timeline.md).

---

## Regras

### Salvar todos os prompts

1. Texto integral do usuário.
2. Arquivo `../prompts/NNN-AAAA-MM-DD-slug.md`.
3. Linha em [`../prompts/timeline.md`](../prompts/timeline.md).
4. Metadados, original, interpretação, o que foi feito.

### Cascata

Alteração na esteira → seguir **Próximos passos** até o próximo nó existente. Não inventar app fora da visão sem atualizar o README.

### Stack (não reinventar)

- Contas OmeTV: [`../../ov/README.md`](../../ov/README.md)
- Conversa / persona: preferir contrato de [`../../low-chat/README.md`](../../low-chat/README.md)
- Web: Chrome + CDP + [`human-cdp`](../../screen-robot/pocs/chrome-cdp/human-cdp/README.md)
- **Não** misturar com funil ConnectMax salvo pedido explícito

## Árvore (resumo)

```text
README (visão)
  → docs/README
    → PRD / discovery (a produzir)
```

## Próximos passos

→ Manter prompts em dia · refinar visão até validação · depois PRD.
