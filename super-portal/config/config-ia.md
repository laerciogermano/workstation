# Configurações para a IA — Super Portal

**Por quê:** rastreio de prompts e cascata da esteira.  
**No fluxo:** regra operacional ao editar artefatos do Super Portal.

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

- Domínio do portal legado: [`../../conectmax/connectmax/docs/portal-franqueado.md`](../../conectmax/connectmax/docs/portal-franqueado.md), [`portal-mapa`](../../conectmax/connectmax/docs/portal-mapa/README.md), [`portal-api`](../../conectmax/portal-api/README.md) = **referência / migração**, não o produto
- ConnectMax LinkedIn / vendas e Connect Tech = **adjacências**, não o núcleo do Super Portal
- **White-label + automação first + templates configuráveis** — não hardcodar marca ConnectMax no produto

## Árvore (resumo)

```text
README (visão)
  → docs/README
    → PRD / discovery (a produzir)
```

## Próximos passos

→ Visão estável → PRD (substituição, white-label, automação, templates, handoff).
