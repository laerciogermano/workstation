# Bluetti MAP — Frontend

Prototype React com todas as telas e componentes descritos em [`../docs/screens.md`](../docs/screens.md) e [`../docs/components.md`](../docs/components.md).

## Executar (desenvolvimento)

```bash
cd chines/frontend
npm install
npm run dev
```

Abrir http://localhost:5173

## Gerar HTML único para o cliente

Um único arquivo com todo o JS/CSS embutido — abre direto no navegador (duplo clique):

```bash
cd chines/frontend
npm run build:single
```

Saída:
- `frontend/dist-single/index.html`
- `docs/bluetti-map.html` (cópia pronta para envio)

O cliente abre `bluetti-map.html` no Chrome/Safari. As rotas usam `#` (ex.: `bluetti-map.html#/produtos`).

## Telas (TELA-01 a TELA-18)

| Rota | Tela |
|------|------|
| `/` | Dashboard |
| `/produtos` | Lista de produtos |
| `/produtos/novo`, `/produtos/:id` | Cadastro / edição |
| `/produtos/importacao` | Importação EQP |
| `/monitoramento/anuncios` | Anúncios coletados |
| `/monitoramento/anuncios/:id` | Detalhe do anúncio |
| `/monitoramento/mapeamento` | Mapeamento de preços |
| `/monitoramento/historico` | Histórico |
| `/monitoramento/log` | Log de varreduras |
| `/fiscalizacao/ocorrencias` | Ocorrências |
| `/fiscalizacao/ocorrencias/:id` | Detalhe ocorrência |
| `/fiscalizacao/nao-cadastrados` | Não cadastrados |
| `/parceiros` | Parceiros |
| `/parceiros/novo`, `/parceiros/:id` | Cadastro parceiro |
| `/relatorios/ranking` | Ranking conformidade |
| `/configuracoes/canais` | Canais |
| `/configuracoes/pma` | Regras PMA |
| `/configuracoes/alertas` | Relatórios e alertas |

## Stack

- React 19 + TypeScript + Vite
- React Router
- Dados mock em `src/data/mockData.ts`
- Componentes compartilhados em `src/components/ui/`

## Componentes transversais

- Exportação (modal Excel/CSV/PDF)
- Notificações in-app (header)
- Layout com sidebar e breadcrumb
