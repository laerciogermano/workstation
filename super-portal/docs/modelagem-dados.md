# Modelagem de dados — Super Portal

**Por quê:** espelhar no Super Portal **todos os campos** das tabelas da base e dos docs de domínio.  
**Base:** [`SCHEMA-REPLICA.md`](../../conectmax/portal-api/SCHEMA-REPLICA.md) · [`schema-normalizado.sql`](../../conectmax/portal-api/sql/schema-normalizado.sql) · [visão](../README.md) (Tenant white-label ≡ `franquia`).

## Funil

```text
Tenant (franquia) ─┬─ Vendedor
                   ├─ Cliente
                   ├─ Orcamento ──► Pedido ─┬─ PedidoItem
                   │                        ├─ NotaFiscal (+ NotaFiscalXml)
                   │                        └─ ContaReceber
                   ├─ FaturamentoLinha
                   ├─ Chamado
                   └─ Notificacao
```

## Diagrama de classes

Campos = colunas da base (`portal_franqueado`). `Tenant.marca` vem da visão white-label (não existe no legado).

```mermaid
classDiagram
  direction TB

  class Tenant {
    +int id PK
    +text razao_social
    +text cnpj
    +text nome
    +timestamptz synced_at
    +marca
  }

  class Vendedor {
    +bigint id PK
    +int franquia_id FK
    +int portal_id
    +text nome
  }

  class Cliente {
    +bigint id PK
    +int franquia_id FK
    +text cnpj
    +text nome
    +text email
    +text telefone
    +text whatsapp
  }

  class Orcamento {
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

  class Pedido {
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

  class PedidoItem {
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

  class NotaFiscal {
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

  class NotaFiscalXml {
    +bigint nota_id PK_FK
    +text xml
    +timestamptz synced_at
  }

  class ContaReceber {
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

  class FaturamentoLinha {
    +bigint id PK
    +int franquia_id FK
    +text vendedor_nome
    +text nota
    +text pedido
    +text data
    +float total
  }

  class Chamado {
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

  class Notificacao {
    +bigint id PK
    +int franquia_id FK
    +text assunto
    +text enviado_por
    +text data
    +jsonb payload
    +timestamptz synced_at
  }

  Tenant "1" --> "*" Vendedor : tem
  Tenant "1" --> "*" Cliente : tem
  Tenant "1" --> "*" Orcamento : tem
  Tenant "1" --> "*" Pedido : tem
  Tenant "1" --> "*" PedidoItem : tem
  Tenant "1" --> "*" NotaFiscal : tem
  Tenant "1" --> "*" ContaReceber : tem
  Tenant "1" --> "*" FaturamentoLinha : tem
  Tenant "1" --> "*" Chamado : tem
  Tenant "1" --> "*" Notificacao : tem

  Vendedor "1" --> "*" Orcamento : vende
  Vendedor "1" --> "*" Pedido : vende
  Cliente "1" --> "*" Orcamento : compra
  Cliente "1" --> "*" Pedido : compra
  Cliente "1" --> "*" NotaFiscal : recebe
  Cliente "1" --> "*" ContaReceber : deve

  Orcamento "1" --> "*" Pedido : vira
  Pedido "1" --> "*" PedidoItem : contem
  Pedido "1" --> "*" ContaReceber : gera
  NotaFiscal "1" --> "0..1" NotaFiscalXml : xml
  NotaFiscal "1" --> "*" ContaReceber : fatura
```

## Tabelas / campos

| Classe (tabela) | PK | Campos |
|-----------------|----|--------|
| **Tenant** (`franquia`) | `id` | `razao_social`, `cnpj`, `nome`, `synced_at` + **`marca`** (visão WL) |
| **Vendedor** | `id` | `franquia_id`, `portal_id`, `nome` |
| **Cliente** | `id` | `franquia_id`, `cnpj`, `nome`, `email`, `telefone`, `whatsapp` |
| **Orcamento** | `(franquia_id, id)` | `vendedor_id`, `cliente_id`, `numero`, `data`, `status`, `cliente_nome`, `vendedor_nome`, `total`, `total_texto`, `synced_at` |
| **Pedido** | `id` | `franquia_id`, `orcamento_id`, `vendedor_id`, `cliente_id`, `numero`, `data`, `status`, `cliente_nome`, `vendedor_nome`, `cnpj`, `email`, `telefone`, `whatsapp`, `total`, `total_texto`, `synced_at` |
| **PedidoItem** | `(pedido_id, seq)` | `franquia_id`, `id_produto`, `produto`, `ncm`, `quantidade`, `valor_unitario`, `lucro_percentual`, `valor_extra`, `total`, `total_unidade` |
| **NotaFiscal** | `id` | `franquia_id`, `cliente_id`, `numero`, `status`, `tipo`, `cliente_nome`, `data`, `transportadora`, `total`, `total_texto`, `pdf`, `xml_url`, `synced_at` |
| **NotaFiscalXml** | `nota_id` | `xml`, `synced_at` |
| **ContaReceber** | `id` | `franquia_id`, `nota_id`, `pedido_id`, `cliente_id`, `status`, `vencimento`, `titulo`, `fatura_n`, `nf_numero`, `cliente_nome`, `cnpj`, `descricao`, `valor`, `valor_texto`, `email`, `telefone`, `whatsapp`, `synced_at` |
| **FaturamentoLinha** | `id` | `franquia_id`, `vendedor_nome`, `nota`, `pedido`, `data`, `total` |
| **Chamado** | `id` | `franquia_id`, `status`, `assunto`, `envolvidos`, `criado_em`, `editado_por`, `ultima_interacao`, `payload`, `synced_at` |
| **Notificacao** | `id` | `franquia_id`, `assunto`, `enviado_por`, `data`, `payload`, `synced_at` |

## Fontes

- Schema: [`SCHEMA-REPLICA.md`](../../conectmax/portal-api/SCHEMA-REPLICA.md) · [`schema-normalizado.sql`](../../conectmax/portal-api/sql/schema-normalizado.sql)
- Mapa UI: [`portal-mapa`](../../conectmax/connectmax/docs/portal-mapa/README.md) · prints [`../inputs/portal-conectmax-prints/`](../inputs/portal-conectmax-prints/)
- Processos: [`../inputs/conectmax-processos(4).html`](../inputs/conectmax-processos(4).html)
- Visão (Tenant / marca): [`../README.md`](../README.md)

## Caminho inverso

Versão enxuta (só funil sem agregados/suporte/blobs): ver commit anterior deste arquivo ou cortar `FaturamentoLinha`, `Chamado`, `Notificacao`, `NotaFiscalXml` e campos denormalizados.
