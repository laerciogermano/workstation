# Modelagem de dados — Super Portal

```mermaid
classDiagram
  direction TB

  class Tenant {
    +uuid id PK
    +text razao_social
    +text cnpj
    +text nome
    +marca
    +timestamptz synced_at
  }

  class Vendedor {
    +uuid id PK
    +uuid tenant_id FK
    +int portal_id
    +text nome
  }

  class Cliente {
    +uuid id PK
    +uuid tenant_id FK
    +text cnpj
    +text nome
    +text email
    +text telefone
    +text whatsapp
  }

  class Orcamento {
    +uuid id PK
    +uuid tenant_id PK_FK
    +uuid vendedor_id FK
    +uuid cliente_id FK
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
    +uuid id PK
    +uuid tenant_id FK
    +uuid orcamento_id FK
    +uuid vendedor_id FK
    +uuid cliente_id FK
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
    +uuid pedido_id PK_FK
    +int seq PK
    +uuid tenant_id FK
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
    +uuid id PK
    +uuid tenant_id FK
    +uuid cliente_id FK
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
    +uuid nota_id PK_FK
    +text xml
    +timestamptz synced_at
  }

  class ContaReceber {
    +uuid id PK
    +uuid tenant_id FK
    +uuid nota_id FK
    +uuid pedido_id FK
    +uuid cliente_id FK
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

  Tenant "1" --> "*" Vendedor
  Tenant "1" --> "*" Cliente
  Tenant "1" --> "*" Orcamento
  Tenant "1" --> "*" Pedido
  Tenant "1" --> "*" PedidoItem
  Tenant "1" --> "*" NotaFiscal
  Tenant "1" --> "*" ContaReceber

  Vendedor "1" --> "*" Orcamento
  Vendedor "1" --> "*" Pedido
  Cliente "1" --> "*" Orcamento
  Cliente "1" --> "*" Pedido
  Cliente "1" --> "*" NotaFiscal
  Cliente "1" --> "*" ContaReceber

  Orcamento "1" --> "*" Pedido
  Pedido "1" --> "*" PedidoItem
  Pedido "1" --> "*" ContaReceber
  NotaFiscal "1" --> "0..1" NotaFiscalXml
  NotaFiscal "1" --> "*" ContaReceber
```
