# Configurações para a IA — Plans

Anotações e regras pré-determinadas que a IA deve seguir ao trabalhar neste projeto.

Fontes da esteira: [`README.md`](README.md).

---

## Regras

### Cascata de próximos passos

**Para toda alteração em um arquivo da esteira de documentação, seguir os `Próximos passos` do documento até finalizar a árvore de execução.**

Isso significa:

1. Identificar o arquivo alterado na árvore abaixo.
2. Abrir a seção **Próximos passos** desse arquivo.
3. Propagar o impacto no documento seguinte (atualizar, alinhar ou validar).
4. Repetir até chegar ao **último nó** da árvore (`prototype.html`).
5. Não encerrar a tarefa com a esteira pela metade.

Exemplo: alteração em `user-stories.md` → atualizar `bdd.md` → `screens.md` → `screens-bdd.md` → `components.md` → `prototype.html`.

---

## Árvore de execução

```text
README.md
└── user-stories.md
    └── bdd.md
        └── screens.md
            └── screens-bdd.md
                └── components.md
                    └── prototype.html
```

| Ordem | Artefato | Próximo |
|-------|----------|---------|
| 1 | [`README.md`](README.md) | [`user-stories.md`](user-stories.md) |
| 2 | [`user-stories.md`](user-stories.md) | [`bdd.md`](bdd.md) |
| 3 | [`bdd.md`](bdd.md) | [`screens.md`](screens.md) |
| 4 | [`screens.md`](screens.md) | [`screens-bdd.md`](screens-bdd.md) |
| 5 | [`screens-bdd.md`](screens-bdd.md) | [`components.md`](components.md) |
| 6 | [`components.md`](components.md) | [`prototype.html`](prototype.html) |
| 7 | [`prototype.html`](prototype.html) | *(fim da árvore)* |
