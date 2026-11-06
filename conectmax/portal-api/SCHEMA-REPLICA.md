# Schema — réplica normalizada Portal Franqueado

Fonte: HTML/ajax de `franqueado.conectmax.com`.  
Postgres Contabo: schema **`portal_franqueado`**.  
Sync Campinas: `node scripts/sync-campinas-postgres.mjs`  
DDL: [`sql/schema-normalizado.sql`](sql/schema-normalizado.sql)  
Credenciais: `../connectmax/vendas/api/.env`

## Funil

```text
franquia ─┬─ vendedor
          ├─ cliente (CNPJ/nome)
          │
          └─ orcamento ──► pedido ─┬─ pedido_item
                                   ├─ nota_fiscal (+ nota_fiscal_xml opcional)
                                   └─ conta_receber
          └─ faturamento_linha
          └─ chamado / notificacao
```

## Tabelas

| Tabela | PK | FKs | Conteúdo |
|---|---|---|---|
| `franquia` | `id` | — | razao_social, cnpj, nome |
| `vendedor` | `id` serial | `franquia_id` | nome, `portal_id` |
| `cliente` | `id` serial | `franquia_id` | cnpj, nome, email, tel, whatsapp |
| `orcamento` | `id` portal | franquia, vendedor, cliente | numero, data, status, total |
| `pedido` | `id` portal | franquia, **orcamento_id**, vendedor, cliente | data, status, total, contato |
| `pedido_item` | `(pedido_id, seq)` | pedido | produto, ncm, qtd, valores |
| `nota_fiscal` | `id` portal | franquia, cliente | numero, status, transportadora, total |
| `nota_fiscal_xml` | `nota_id` | nota_fiscal | xml (só se populado) |
| `conta_receber` | `id` portal | franquia, **nota_id**, **pedido_id**, cliente | vencimento, valor, status |
| `faturamento_linha` | serial | franquia | vendedor, nota, pedido, data, total |
| `chamado` | serial | franquia | suporte |
| `notificacao` | serial | franquia | inbox |

## APIs (`/db/*`) — dashboard + modelo

| GET | Origem | Shape |
|---|---|---|
| `/db/health` | contagens | meta |
| `/db/orcamentos` | `orcamento` | igual dashboard (`orcamentos[]`) |
| `/db/pedidos` | `pedido` | `pedidos[]` |
| `/db/notas-fiscais` | `nota_fiscal` | `notasFiscais[]` |
| `/db/faturas` | `conta_receber` | `faturas[]` |
| `/db/atrasados` | `conta_receber` Vencida | `faturas[]` |
| `/db/vendedores` | `vendedor` | `vendedores[]` |
| `/db/clientes` | `cliente` | `clientes[]` |
| `/db/pedido-itens?pedido_id=` | `pedido_item` | `itens[]` |
| `/db/faturamento-linhas` | `faturamento_linha` | `detalhe[]` |

Query comum: `data_inicial`/`data_final`, `status`, `franquia_id` (default **9**).

## Sync

```bash
# completo (listas + itens de pedido — demora)
node scripts/sync-campinas-postgres.mjs

# só listas / FKs (rápido)
node scripts/sync-campinas-postgres.mjs --skip-itens

# atrasados com email/whatsapp
node scripts/sync-campinas-postgres.mjs --contato --skip-itens
```

## Caminho inverso

- Remover schema: `DROP SCHEMA portal_franqueado CASCADE;`
- Remover código: `sql/schema-normalizado.sql`, `scripts/sync-campinas-postgres.mjs`, `src/db*.js`, rotas `/db` em `src/index.js`
