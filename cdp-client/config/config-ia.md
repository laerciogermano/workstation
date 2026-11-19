# Configurações para a IA — CDP Client

**Por quê:** rastreio de prompts e cascata da esteira.  
**No fluxo:** regra operacional ao editar artefatos do CDP Client.

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

- Browser: **somente** Chrome com CDP (`--remote-debugging-port`); sem cursor-ide-browser / Claude-in-Chrome salvo pedido explícito
- Input humano: **somente** via [`human-cdp`](../../screen-robot/pocs/chrome-cdp/human-cdp/README.md) — foco lógico + trajetória; sem `el.click()` / press solto / `Page.bringToFront` / activate SO na lib
- Boot/serviço: nativo por SO (LaunchAgent / systemd / Windows Service); não depender de terminal aberto
- **Não** misturar com Gestão de CDPs (UI lab) nem LinkedIn Human CDP salvo consumo do canal já exposto

## Árvore (resumo)

```text
README (visão)
  → docs/README
    → docs/plano-implementacao.md
    → PRD / arquitetura (a produzir)
```

## Próximos passos

→ Manter prompts em dia · validar visão · Fase 1 do plano (daemon + decisão runtime).
