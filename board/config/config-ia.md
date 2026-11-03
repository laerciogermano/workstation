# Configurações para a IA — Board

**Por quê:** garantir rastreio dos prompts e que alterações na documentação propaguem até o fim da esteira.  
**Importante:** evita perder o histórico da conversa e evita entregas pela metade.  
**No fluxo:** acompanha toda a árvore — regra operacional para quem edita os artefatos.

Fontes: [`../docs/`](../docs/README.md).  
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

Para alteração na esteira: seguir **Próximos passos** do arquivo até o próximo nó existente.  
Não implementar código de app/API sem atualizar visão + PRD + discovery quando o escopo mudar.

### Paridade Trello (v1)

Implementar só o núcleo documentado no PRD (board / lista / card / move / label / due / checklist / comentário / arquivo / busca).  
Não adicionar Power-Ups, Butler ou Gantt sem pedido explícito + atualização do PRD.

### Stack

- Web: Vite + React  
- API: NestJS  
- DB: PostgreSQL  
- UI: [`../docs/design-system.md`](../docs/design-system.md)  
- Browser de lab: Chrome CDP + human-cdp (nunca cursor-ide-browser), se houver E2E automatizado no lab

## Árvore (resumo)

```text
README (visão)
  → docs/README
    → docs/prd.md
    → docs/arquitetura.md
    → docs/design-system.md
    → docs/discovery/1.stories → 2.epics → 3.roadmap
      → 4.scenarios → 5.bdds → (código / protótipo)
```

## Próximos passos

→ Manter prompts em dia · refinar US-01 do roadmap em scenarios → BDDs
