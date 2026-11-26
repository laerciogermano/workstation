# Schema — réplica normalizada Portal Franqueado

Fonte: HTML/ajax de `franqueado.conectmax.com`.  
Postgres: schema **`portal_franqueado`** — host atual `185.250.37.82` (`DB_HOST` em `../connectmax/vendas/api/.env`; legado `144.126.154.90` offline).  
Sync: `node scripts/sync-campinas-postgres.mjs [--franquia=9]`  
Ordem por volume de faturamento (maior→menor): **3 → 2 → 8 → 1 → 5 → 9 → 4 → 12 → 13**.  
Ex.: maior (Curitiba): `--franquia=3` · segunda (JV): `--franquia=2`  
DDL: [`sql/schema-normalizado.sql`](sql/schema-normalizado.sql)  
Credenciais: `../connectmax/vendas/api/.env` + `credenciais.md`

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

## Diagrama de classes

```mermaid
classDiagram
  direction TB

  class franquia {
    +int id PK
    +text razao_social
    +text cnpj
    +text nome
    +timestamptz synced_at
  }

  class vendedor {
    +bigint id PK
    +int franquia_id FK
    +int portal_id
    +text nome
  }

  class cliente {
    +bigint id PK
    +int franquia_id FK
    +text cnpj
    +text nome
    +text email
    +text telefone
    +text whatsapp
  }

  class orcamento {
    +bigint id PK
    +int franquia_id PK_FK
    +bigint vendedor_id FK
    +bigint cliente_id FK
    +int numero
    +text data
    +text status
    +text cliente_nome
    +text vendedor_nome
    +float total
    +text total_texto
    +timestamptz synced_at
  }

  class pedido {
    +bigint id PK
    +int franquia_id FK
    +bigint orcamento_id FK
    +bigint vendedor_id FK
    +bigint cliente_id FK
    +int numero
    +text data
    +text status
    +text cliente_nome
    +text vendedor_nome
    +text cnpj
    +text email
    +text telefone
    +text whatsapp
    +float total
    +text total_texto
    +timestamptz synced_at
  }

  class pedido_item {
    +bigint pedido_id PK_FK
    +int seq PK
    +int franquia_id FK
    +int id_produto
    +text produto
    +text ncm
    +float quantidade
    +float valor_unitario
    +float lucro_percentual
    +float valor_extra
    +float total
    +float total_unidade
  }

  class nota_fiscal {
    +bigint id PK
    +int franquia_id FK
    +bigint cliente_id FK
    +int numero
    +text status
    +text tipo
    +text cliente_nome
    +text data
    +text transportadora
    +float total
    +text total_texto
    +text pdf
    +text xml_url
    +timestamptz synced_at
  }

  class nota_fiscal_xml {
    +bigint nota_id PK_FK
    +text xml
    +timestamptz synced_at
  }

  class conta_receber {
    +bigint id PK
    +int franquia_id FK
    +bigint nota_id FK
    +bigint pedido_id FK
    +bigint cliente_id FK
    +text status
    +text vencimento
    +text titulo
    +int fatura_n
    +int nf_numero
    +text cliente_nome
    +text cnpj
    +text descricao
    +float valor
    +text valor_texto
    +text email
    +text telefone
    +text whatsapp
    +timestamptz synced_at
  }

  class faturamento_linha {
    +bigint id PK
    +int franquia_id FK
    +text vendedor_nome
    +text nota
    +text pedido
    +text data
    +float total
  }

  class chamado {
    +bigint id PK
    +int franquia_id FK
    +text status
    +text assunto
    +text envolvidos
    +text criado_em
    +text editado_por
    +text ultima_interacao
    +jsonb payload
    +timestamptz synced_at
  }

  class notificacao {
    +bigint id PK
    +int franquia_id FK
    +text assunto
    +text enviado_por
    +text data
    +jsonb payload
    +timestamptz synced_at
  }

  franquia "1" --> "*" vendedor : tem
  franquia "1" --> "*" cliente : tem
  franquia "1" --> "*" orcamento : tem
  franquia "1" --> "*" pedido : tem
  franquia "1" --> "*" pedido_item : tem
  franquia "1" --> "*" nota_fiscal : tem
  franquia "1" --> "*" conta_receber : tem
  franquia "1" --> "*" faturamento_linha : tem
  franquia "1" --> "*" chamado : tem
  franquia "1" --> "*" notificacao : tem

  vendedor "1" --> "*" orcamento : vende
  vendedor "1" --> "*" pedido : vende
  cliente "1" --> "*" orcamento : compra
  cliente "1" --> "*" pedido : compra
  cliente "1" --> "*" nota_fiscal : recebe
  cliente "1" --> "*" conta_receber : deve

  orcamento "1" --> "*" pedido : vira
  pedido "1" --> "*" pedido_item : contem
  pedido "1" --> "*" conta_receber : gera
  nota_fiscal "1" --> "0..1" nota_fiscal_xml : xml
  nota_fiscal "1" --> "*" conta_receber : fatura
```

## Tabelas

| Tabela | PK | FKs | Conteúdo |
|---|---|---|---|
| `franquia` | `id` | — | razao_social, cnpj, nome |
| `vendedor` | `id` serial | `franquia_id` | nome, `portal_id` |
| `cliente` | `id` serial | `franquia_id` | cnpj, nome, email, tel, whatsapp |
| `orcamento` | `(franquia_id, id)` portal | franquia, vendedor, cliente | numero, data, status, total |
| `pedido` | `id` portal | franquia, **(franquia_id, orcamento_id)→orcamento**, vendedor, cliente | data, status, total, contato |
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
# completo (listas + itens de pedido — demora; apaga e regrava a franquia)
node scripts/sync-campinas-postgres.mjs

# só listas / FKs (rápido)
node scripts/sync-campinas-postgres.mjs --skip-itens

# incremental: não apaga pedidos/itens; INSERT ON CONFLICT + itens faltantes
node scripts/sync-campinas-postgres.mjs --franquia=3 --delta

# só completar itens de pedidos sem linha
node scripts/sync-campinas-postgres.mjs --franquia=1 --only-itens

# orçamentos por franquia (stubs via pedidos; PK composta evita colisão de id)
node scripts/sync-campinas-postgres.mjs --franquia=2 --only-orcamentos

# atrasados com email/whatsapp
node scripts/sync-campinas-postgres.mjs --contato --skip-itens
```

**Orçamentos cross-franquia:** a lista HTML `page=orcamentos` ignora `id_franqueado_rel` (só a franquia da sessão — default Campinas/`9`). Por isso Campinas fica com ~4× mais orçamentos que pedidos; nas outras o sync antigo só criava stubs dos pedidos (~1:1).

- Pedido HTML: `Orçamento: {numeroLocal}` + href `/orcamento/{idGlobal}` (`parse-pedidos` → `orcamento` + `orcamentoId`).
- Lista completa: `python3 scripts/scan-orcamentos-pdf.py --from=1 --to=66000` (PDF público traz CNPJ da EMPRESA → franquia). Status opcional: `--with-status` via `orcamentos_edicao`.
- Detalhe: `page=orcamentos_edicao&id_orcamento={idGlobal}`.

Antes → depois:
- Sync full limpava tudo da franquia (incluindo itens). Com `--delta`, pedidos/itens existentes ficam; só entram registros novos e itens que faltavam.
- `orcamento.id` era PK global → colisão entre franquias (`ON CONFLICT DO NOTHING` deixava orçamentos=0). Agora PK `(franquia_id, id)` + FK composta em `pedido`. Rollback: restaurar PK só em `id` e FK `pedido.orcamento_id → orcamento(id)` (quebra inserts cross-franquia de novo).
- Stubs de orçamento vinham com `total`/`status` null → dashboard “desconhecido” e R$ 0. Agora herdam do pedido ligado. Rollback: `stubsFromPedidos` com `status/total` null de novo.

## Caminho inverso

- Remover schema: `DROP SCHEMA portal_franqueado CASCADE;`
- Remover código: `sql/schema-normalizado.sql`, `scripts/sync-campinas-postgres.mjs`, `src/db*.js`, rotas `/db` em `src/index.js`
- Voltar sync só full: omitir `--delta` (comportamento antigo)
