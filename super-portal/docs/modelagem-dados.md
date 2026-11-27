# Modelagem de dados — Super Portal

```mermaid
classDiagram
  direction TB

  class Tenant {
    +int id PK
    +text razao_social
    +text cnpj
    +text nome
    +marca
    +timestamptz synced_at
  }

  class Vendedor {
    +bigint id PK
    +int tenant_id FK
    +int portal_id
    +text nome
  }

  class Cliente {
    +bigint id PK
    +int tenant_id FK
    +text cnpj
    +text nome
    +text email
    +text telefone
    +text whatsapp
  }

  class Orcamento {
    +bigint id PK
    +int tenant_id PK_FK
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
    +int tenant_id FK
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
    +int tenant_id FK
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
    +int tenant_id FK
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
    +int tenant_id FK
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
    +int tenant_id FK
    +text vendedor_nome
    +text nota
    +text pedido
    +text data
    +float total
  }

  class Chamado {
    +bigint id PK
    +int tenant_id FK
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
    +int tenant_id FK
    +text assunto
    +text enviado_por
    +text data
    +jsonb payload
    +timestamptz synced_at
  }

  Tenant "1" --> "*" Vendedor
  Tenant "1" --> "*" Cliente
  Tenant "1" --> "*" Orcamento
  Tenant "1" --> "*" Pedido
  Tenant "1" --> "*" PedidoItem
  Tenant "1" --> "*" NotaFiscal
  Tenant "1" --> "*" ContaReceber
  Tenant "1" --> "*" FaturamentoLinha
  Tenant "1" --> "*" Chamado
  Tenant "1" --> "*" Notificacao

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
