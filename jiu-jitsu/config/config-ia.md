# Configurações para a IA — Jiu-jitsu

**Por quê:** garantir rastreio dos prompts e que alterações na documentação propaguem até o fim da esteira.  
**Importante:** evita perder o histórico da conversa e evita entregas pela metade.  
**No fluxo:** acompanha toda a árvore — não é um passo de produto; é a regra operacional para quem (humano ou IA) edita os artefatos.

Fontes da esteira: [`../docs/README.md`](../docs/README.md).  
Timeline de prompts: [`../prompts/timeline.md`](../prompts/timeline.md).

---

## Regras

### Salvar todos os prompts

**Todo prompt recebido neste projeto deve ser gravado na timeline antes (ou junto) da entrega.**

Isso significa:

1. Copiar o texto **integral** do usuário, sem corrigir digitação nem resumir no lugar do original.
2. Criar `../prompts/NNN-AAAA-MM-DD-slug.md` com o próximo número da sequência.
3. Acrescentar a linha correspondente em [`../prompts/timeline.md`](../prompts/timeline.md).
4. No arquivo do prompt: metadados, bloco do original, interpretação e o que foi feito.
5. Não pular prompts curtos, de correção, de continuação ou de “só isso”.

Detalhe do formato: [`../prompts/README.md`](../prompts/README.md).

### Cascata de próximos passos

**Para toda alteração em um arquivo da esteira de documentação, seguir os `Próximos passos` do documento até finalizar a árvore de execução.**

Isso significa:

1. Identificar o arquivo alterado na árvore abaixo.
2. Abrir a seção **Próximos passos** desse arquivo.
3. Propagar o impacto no documento seguinte (atualizar, alinhar ou validar).
4. Repetir até chegar ao **último nó** da árvore (`prototype.html`).
5. Não encerrar a tarefa com a esteira pela metade.
6. Artefatos ainda **a produzir** só entram na cascata quando o passo anterior for pedido ou criado.

---

## Árvore de execução

```text
README.md (visão)
└── docs/README.md
    └── functionalities.md
        └── user-stories.md
            └── bdd.md
                └── screens.md
                    └── screens-bdd.md
                        └── components.md
                            └── prototype.html
```

| Ordem | Artefato | Próximo |
|-------|----------|---------|
| 0 | [`../README.md`](../README.md) (visão) | [`../docs/README.md`](../docs/README.md) |
| 1 | [`../docs/README.md`](../docs/README.md) | `../docs/functionalities.md` |
| 2 | `functionalities.md` | `user-stories.md` |
| 3 | `user-stories.md` | `bdd.md` |
| 4 | `bdd.md` | `screens.md` |
| 5 | `screens.md` | `screens-bdd.md` |
| 6 | `screens-bdd.md` | `components.md` |
| 7 | `components.md` | `prototype.html` |
| 8 | `prototype.html` | *(fim da árvore)* |
