# Plans — Frontend

Protótipo React com as telas e componentes descritos em [`../docs/screens.md`](../docs/screens.md) e [`../docs/components.md`](../docs/components.md).

## Desenvolvimento

```bash
cd plans/frontend
npm install
npm run dev
```

Abrir http://localhost:5173

## Protótipo navegável (HTML único)

```bash
npm run build:prototype
```

Saída: **`../docs/prototype.html`**

## Telas

| Rota | Tela |
|------|------|
| `#/` | Board |
| `#/gantt` | Plano / Gantt |
| `#/arvore` | Árvore de execução |
| `#/configuracoes/catalogo` | Configurações (fixo sob Explorar) |

O **Explorar** não tem rota própria: é o painel da sidebar com a lista em árvore embutida (estilo IDE), sempre visível.
