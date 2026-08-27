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

Gera um arquivo de **alta fidelidade** com JS/CSS embutidos, exportado para `docs/`:

```bash
npm run build:prototype
```

Saída:
- **`../docs/prototype.html`** — enviar ao cliente (abre com duplo clique)
- `prototype/index.html` — cópia intermediária do build

Rotas via hash: `prototype.html#/`, `prototype.html#/gantt`, `prototype.html#/explorar`, etc.

## Telas (TELA-01 a TELA-11)

| Rota | Tela |
|------|------|
| `#/` | Board (kanban) |
| `#/board/config` | Configuração de colunas e raias |
| `#/gantt` | Plano / Gantt |
| `#/gantt/fop` | Editor FOP |
| `#/gantt/maquina` | Editor máquina |
| `#/gantt/exportar` | Exportar código |
| `#/arvore` | Árvore de execução |
| `#/explorar` | Explorar (lista) |
| `#/explorar/:id` | Detalhe do arquivo |
| `#/configuracoes/catalogo` | Catálogo de responsáveis |

## Stack

- React + TypeScript + Vite
- React Router (HashRouter no build de protótipo)
- Dados mock em `src/data/mockData.ts`
