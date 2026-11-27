# Modelagem de dados — Super Portal

**Por quê:** fixar o núcleo do domínio antes do PRD.  
**Base:** réplica [`portal_franqueado`](../../conectmax/portal-api/SCHEMA-REPLICA.md) + funil orçamento → pedido → NF → receber; white-label da [visão](../README.md).  
**Regra:** só o **indispensável** — sem espelho 1:1 do legado, sem agregados, sem blobs/suporte.

## Funil

```text
Tenant ─┬─ Vendedor
        ├─ Cliente
        └─ Orcamento ──► Pedido ─┬─ PedidoItem
                                 ├─ NotaFiscal
                                 └─ ContaReceber
```

## Diagrama de classes

```mermaid
classDiagram
  direction TB

  class Tenant {
    +id
    +nome
    +cnpj
    +marca
  }

  class Vendedor {
    +id
    +tenantId
    +nome
  }

  class Cliente {
    +id
    +tenantId
    +cnpj
    +nome
    +contato
  }

  class Orcamento {
    +id
    +tenantId
    +vendedorId
    +clienteId
    +numero
    +data
    +status
    +total
  }

  class Pedido {
    +id
    +tenantId
    +orcamentoId
    +vendedorId
    +clienteId
    +numero
    +data
    +status
    +total
  }

  class PedidoItem {
    +pedidoId
    +seq
    +produto
    +quantidade
    +valorUnitario
    +total
  }

  class NotaFiscal {
    +id
    +tenantId
    +clienteId
    +pedidoId
    +numero
    +data
    +status
    +total
  }

  class ContaReceber {
    +id
    +tenantId
    +clienteId
    +pedidoId
    +notaFiscalId
    +vencimento
    +status
    +valor
  }

  Tenant "1" --> "*" Vendedor
  Tenant "1" --> "*" Cliente
  Tenant "1" --> "*" Orcamento
  Tenant "1" --> "*" Pedido
  Tenant "1" --> "*" NotaFiscal
  Tenant "1" --> "*" ContaReceber

  Vendedor "1" --> "*" Orcamento
  Vendedor "1" --> "*" Pedido
  Cliente "1" --> "*" Orcamento
  Cliente "1" --> "*" Pedido
  Cliente "1" --> "*" NotaFiscal
  Cliente "1" --> "*" ContaReceber

  Orcamento "1" --> "*" Pedido : vira
  Pedido "1" --> "*" PedidoItem : contem
  Pedido "1" --> "*" NotaFiscal : fatura
  Pedido "1" --> "*" ContaReceber : gera
  NotaFiscal "1" --> "*" ContaReceber : fatura
```

## Entidades (só núcleo)

| Classe | Papel | Campos essenciais |
|--------|-------|-------------------|
| **Tenant** | Isolamento white-label (equiv. franquia) | id, nome, cnpj, marca |
| **Vendedor** | Quem vende no tenant | id, tenantId, nome |
| **Cliente** | Comprador | id, tenantId, cnpj, nome, contato |
| **Orcamento** | Proposta | id, tenantId, vendedor/cliente, numero, data, status, total |
| **Pedido** | Venda a partir do orçamento | id, tenantId, orcamentoId, vendedor/cliente, numero, data, status, total |
| **PedidoItem** | Linha do pedido | pedidoId+seq, produto, qtd, valor unitário, total |
| **NotaFiscal** | Documento fiscal | id, tenantId, cliente, pedido, numero, data, status, total |
| **ContaReceber** | Cobrança | id, tenantId, cliente, pedido, nota, vencimento, status, valor |

`marca` no Tenant = identidade white-label mínima (nome/tema/logo — detalhe no PRD).

## Fora deste diagrama (de propósito)

| Legado / tema | Por quê fica de fora |
|---------------|----------------------|
| `faturamento_linha` | Agregado / relatório |
| `chamado`, `notificacao` | Suporte / inbox — não são o funil |
| `nota_fiscal_xml` | Blob opcional |
| Campos denormalizados (`*_nome`, `*_texto`, `synced_at`) | Espelho de sync do portal PHP |
| Templates, filas, handoff humano | Automação — modelo operacional no PRD, não neste núcleo |

## Fontes

- Schema: [`SCHEMA-REPLICA.md`](../../conectmax/portal-api/SCHEMA-REPLICA.md) · [`schema-normalizado.sql`](../../conectmax/portal-api/sql/schema-normalizado.sql)
- Mapa UI: [`portal-mapa`](../../conectmax/connectmax/docs/portal-mapa/README.md) · prints em [`../inputs/portal-conectmax-prints/`](../inputs/portal-conectmax-prints/)
- Processos: [`../inputs/conectmax-processos(4).html`](../inputs/conectmax-processos(4).html)

## Caminho inverso

Voltar ao modelo espelho do legado: usar o diagrama completo em [`SCHEMA-REPLICA.md`](../../conectmax/portal-api/SCHEMA-REPLICA.md) (inclui faturamento, chamado, notificação, XML e denormalizações).
