# Configurações para a IA — Cupido

**Por quê:** rastreio de prompts e limites de escopo.  
**Fontes:** [`../docs/`](../docs/README.md).  
**Timeline:** [`../prompts/timeline.md`](../prompts/timeline.md).

---

## Regras

### Salvar todos os prompts

Todo prompt neste projeto → `../prompts/NNN-AAAA-MM-DD-slug.md` + linha em [`timeline.md`](../prompts/timeline.md).

### Cascata

Mudança de escopo → visão → PRD → identidade/protótipo antes de código.

### Escopo bloqueado sem pedido explícito

- Implementar app / API / workers
- Integração real com WhatsApp/Instagram/Tinder
- Pagamentos / premium
- Conteúdo sexual explícito / CSAM
- Substituir Hurble ou low-chat por este produto

### Escopo obrigatório nesta fase

- PRD com loop agente + histórico + match + encontro
- Identidade + benchmarking
- Protótipo **alta fidelidade** HTML

### Stack (futuro)

A definir em ADR após validar protótipo. Preferir PWA; local-first no lab.

## Árvore (resumo)

```text
README (visão)
  → docs/prd.md
  → docs/prototipos/
  → identidade-visual.md + marca/
  → (depois) discovery / arquitetura / código
```

## Próximos passos

→ Manter prompts · validar protótipo · discovery
