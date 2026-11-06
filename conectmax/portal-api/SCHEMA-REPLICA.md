# Schema inferido — réplica da base do Portal Franqueado

Fonte: HTML/ajax de `franqueado.conectmax.com` (não há dump SQL oficial).  
**Postgres Contabo (visualizações):** schema `portal_franqueado` — sync Campinas:  
`node scripts/sync-campinas-postgres.mjs` (credenciais `../connectmax/vendas/api/.env`).  
Colunas + `payload jsonb` = mesmo objeto dos GETs do [`dashboard.html`](dashboard.html).  
Views: `v_dashboard_orcamentos|pedidos|notas|faturas|atrasados`.  
Dump JSONL local (opcional): `scripts/dump-replica.mjs`  
Segurança: [`SEGURANCA-ISOLAMENTO-FRANQUIAS.md`](SEGURANCA-ISOLAMENTO-FRANQUIAS.md)

## Funil (domínio)

```text
franquia ─┬─ vendedor
          ├─ cliente (CNPJ/CPF)
          │
          └─ orcamento ──► pedido ─┬─ pedido_item (produto)
                                   ├─ nota_fiscal (+ XML/PDF)
                                   └─ conta_receber ──► boleto
```

## Tabelas

| Tabela | PK | FK / ligação | Campos principais | Fonte |
|---|---|---|---|---|
| `franquia` | `id` | — | razao_social, cnpj | NF XML emitente + id |
| `vendedor` | `id` (portal) | `franquia_id` | nome | select / faturamento / pedido |
| `cliente` | `cnpj` (natural) | — | nome, email, telefone | pedido detalhe / listagens |
| `orcamento` | `id` | franquia?, vendedor, cliente | numero, data, status, total | `page=orcamentos` |
| `pedido` | `id` | `orcamento`, vendedor, cliente, franquia | data, status, total, email, tel | lista + `pedidos_edicao` |
| `pedido_item` | (pedido_id, seq) | `pedido`, `id_produto?` | produto, ncm, qtd, valores, lucro | POST `ajax/pedidos/produtos.php` |
| `nota_fiscal` | `id` | pedido? (via título/faturamento) | numero, status, cliente, data, total, transportadora | `page=notas_fiscais` |
| `nota_fiscal_xml` | `nota_id` | `nota_fiscal` | xml (NF-e) | `ajax/notas_fiscais/xml.php` |
| `conta_receber` | `id` | nota, pedido, cliente | status, vencimento, valor, fatura_n | `page=contasareceber` |
| `faturamento_linha` | — | franquia, vendedor, nota, pedido | data, total | excel faturamento |
| `chamado` | `id` | — | status, assunto… | `page=chamados` (só sessão) |
| `notificacao` | `id` | — | — | inbox sessão |

## Status (enums observados)

- orcamento: Em aberto, Aprovado, Reprovado, Contra proposta, Cancelado, Enviado  
- pedido: Rascunho, Em análise, Aprovado, Reprovado, Cancelado, Faturado  
- nota: aguardando, cancelado, rejeitado, enviado  
- conta: Aberta, Quitada, Vencida, Próxima ao vencimento, Estornada, Falta arquivo  

## O que dá para replicar bem

- Listagens comerciais/financeiras por franquia (`id_franqueado` / `id_franqueado_rel`)
- Detalhe de pedido (contato) + itens
- Totais de faturamento por vendedor/NF×pedido
- Emitente (franquia) via XML

## Lacunas (não vêm do portal franqueado)

- Cadastro mestre de produtos/estoque/preço de tabela completo  
- Usuários, senhas, permissões, funcionários  
- Bancos / planos de conta / conciliação além do título  
- Histórico completo de status / auditoria  
- Orçamento itens (formulário `orcamentos_edicao` — não parseado ainda)  
- Transportadoras / CFOPs como tabelas mestre  
- Anexos além de PDF/XML/boleto pontuais  

## Caminho inverso

- Remover réplica: apagar `SCHEMA-REPLICA.md`, `scripts/dump-replica.mjs`, link no README e pasta `~/.config/conectmax-franqueado/replica-base/`
