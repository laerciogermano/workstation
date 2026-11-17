# Configurações para a IA — Gestão de CDPs

**Por quê:** rastreio de prompts e cascata da esteira.  
**No fluxo:** regra operacional ao editar artefatos da Gestão de CDPs.

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

- Web/CDP: **somente** via [`human-cdp`](../../screen-robot/pocs/chrome-cdp/human-cdp/README.md) — foco lógico + trajetória; sem `el.click()` / press solto
- Perfis: contrato da lib (`~/chrome-profiles`, `createCdp` / `listCdps` / `connectCdp` / `stopCdp` / `updateCdp` / `removeCdp`)
- **Não** misturar com automações de negócio (OmTV, Connect, CRM) salvo consumo de CDP já existente

## Árvore (resumo)

```text
README (visão)
  → docs/README
    → PRD / discovery (a produzir)
```

## Próximos passos

→ Manter prompts em dia · refinar visão até validação · depois PRD.
