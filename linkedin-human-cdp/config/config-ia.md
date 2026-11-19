# Configurações para a IA — LinkedIn Human CDP

**Por quê:** rastreio de prompts e cascata da esteira.  
**No fluxo:** regra operacional ao editar artefatos desta lib.

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

Alteração na esteira → seguir **Próximos passos** até o próximo nó existente.

### Stack (não reinventar)

- Input: **somente** [`human-cdp`](../../screen-robot/pocs/chrome-cdp/human-cdp/README.md)
- Ops LinkedIn: métodos em `createLinkedInHumanCdp`; fluxo UI ainda via ponte `worker-bridge` → `screen-robot/src/lib/cdp/`
- Sem `el.click()` / press solto / activate SO
- Default `notifyApi: false`

## Árvore (resumo)

```text
README (visão)
  → docs/README
    → src/ (lib)
    → PRD (a produzir)
```

## Próximos passos

→ Manter prompts · extrair DOM para a lib · workers migrarem imports.
