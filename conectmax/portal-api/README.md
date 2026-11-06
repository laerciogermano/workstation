# Portal API — faturas ConectMax

API local que autentica no [Portal do Franqueado](https://franqueado.conectmax.com/) e expõe dados via `GET`.

- Mapa de **todos os GETs de busca** do portal: [`GETS.md`](GETS.md)
- Mapa geral do painel: [`../connectmax/docs/portal-franqueado.md`](../connectmax/docs/portal-franqueado.md)

## Pré-requisito

Credenciais em `~/.config/conectmax-franqueado/credentials.env`:

```env
CONECTMAX_FRANQUEADO_USER=...
CONECTMAX_FRANQUEADO_PASS=...
```

## Subir

```bash
cd conectmax/portal-api
npm start
# http://127.0.0.1:4175
```

`PORT` / `HOST` opcionais.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/` ou `/catalog` | Catálogo de GETs do portal + status da API local |
| `GET` | `/health` | Liveness |
| `GET` | `/faturas` | Lista faturas (contas a receber) — implementado |
| — | `/orcamentos` `/pedidos` `/notas-fiscais` `/faturamento` … | Planejados — ver [`GETS.md`](GETS.md) |

### Query `GET /faturas`

| Param | Default | Nota |
|-------|---------|------|
| `data_inicial` / `from` | `01/01/2025` | filtro do portal |
| `data_final` / `to` | `31/12/2026` | filtro do portal |
| `status` | — | ex.: `Quitada`, `Aberta`, `Vencida` |
| `refresh` | — | `1` força novo login |

### Exemplo

```bash
curl -sS 'http://127.0.0.1:4175/faturas' | head
curl -sS 'http://127.0.0.1:4175/faturas?status=Aberta&data_inicial=01/10/2026&data_final=06/11/2026'
```

Resposta: `{ total, totalValor, porStatus, faturas: [{ id, status, vencimento, titulo, faturaN, nfNumero, idNota, pedido, cliente, cnpj, descricao, valor, valorTexto }] }`.

## Caminho inverso

- Parar: `Ctrl+C` / matar processo na porta `4175`
- Invalidar sessão: `rm ~/.config/conectmax-franqueado/cookies.txt`
- Remover API: apagar `conectmax/portal-api/` e a linha em [`../README.md`](../README.md)
- Antes: só scripts pontuais (`build-empresas.py --fetch-portal`); sem HTTP
