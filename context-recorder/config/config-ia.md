# Configurações para a IA — Context Recorder

**Por quê:** rastreio de prompts e limites de escopo.  
**Fontes:** [`../docs/`](../docs/README.md).  
**Timeline:** [`../prompts/timeline.md`](../prompts/timeline.md).

---

## Regras

### Salvar todos os prompts

Todo prompt neste projeto → arquivo em `../prompts/NNN-AAAA-MM-DD-slug.md` + linha em [`timeline.md`](../prompts/timeline.md).

### Cascata

Mudança de escopo → atualizar visão → PRD → arquitetura → plano (nessa ordem) antes de código fora da fase atual.

### Escopo bloqueado sem pedido explícito

- Keylogger / captura de teclas
- Mobile como capturador principal
- Cloud sync / SaaS público de gravações
- Diarização multi-speaker fina (só após v1.1 no PRD)
- Substituir `screen-robot` (AVD/CDP) por este produto

### Escopo obrigatório no MVP

- Trilhas `mic` e `desktop` **separadas**
- OCR em **mudança de tela** (+ debounce)
- Retrieval temporal para harness

### Stack

Ver [`../docs/arquitetura.md`](../docs/arquitetura.md). Preferir local-first; API em localhost.

## Árvore (resumo)

```text
README (visão)
  → docs/README
    → docs/prd.md
    → docs/arquitetura.md
    → docs/plano-implementacao.md
    → docs/discovery/ (depois)
      → capture / workers / api / cli
```

## Próximos passos

→ Manter prompts · PoC Fase 1
