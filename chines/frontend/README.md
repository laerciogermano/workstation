# Bluetti MAP — Frontend

Prototype React com todas as telas e componentes descritos em [`../docs/screens.md`](../docs/screens.md) e [`../docs/components.md`](../docs/components.md).

## Desenvolvimento

```bash
cd chines/frontend
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

Rotas via hash: `prototype.html#/produtos`, `prototype.html#/monitoramento/anuncios`, etc.

## Telas (TELA-01 a TELA-18)

| Rota | Tela |
|------|------|
| `#/` | Dashboard |
| `#/produtos` | Lista de produtos |
| `#/produtos/novo`, `#/produtos/:id` | Cadastro / edição |
| `#/produtos/importacao` | Importação EQP |
| `#/monitoramento/anuncios` | Anúncios coletados |
| `#/monitoramento/anuncios/:id` | Detalhe do anúncio |
| `#/monitoramento/mapeamento` | Mapeamento de preços |
| `#/monitoramento/historico` | Histórico |
| `#/monitoramento/log` | Log de varreduras |
| `#/fiscalizacao/ocorrencias` | Ocorrências |
| `#/fiscalizacao/ocorrencias/:id` | Detalhe ocorrência |
| `#/fiscalizacao/nao-cadastrados` | Não cadastrados |
| `#/parceiros` | Parceiros |
| `#/parceiros/novo`, `#/parceiros/:id` | Cadastro parceiro |
| `#/relatorios/ranking` | Ranking conformidade |
| `#/configuracoes/canais` | Canais |
| `#/configuracoes/pma` | Regras PMA |
| `#/configuracoes/alertas` | Relatórios e alertas |

## Stack

- React + TypeScript + Vite
- React Router (HashRouter no build de protótipo)
- Dados mock em `src/data/mockData.ts`
