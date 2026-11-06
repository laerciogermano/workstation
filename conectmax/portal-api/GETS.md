# GETs de busca de dados — Portal Franqueado

**Contrato OpenAPI (entradas/saídas):** [`openapi.yaml`](openapi.yaml) · UI [`/docs`](http://127.0.0.1:4175/docs) · [`openapi.json`](openapi.json)

Fonte viva: `https://franqueado.conectmax.com/franqueado/?page=…` (HTML + sessão `PHPSESSID`).  
Não há REST JSON oficial; a “API” prática é **GET na página** (ou export ajax). Mutações (status, quitar, duplicar) ficam de fora deste mapa.

Base: `GET /franqueado/?page=<tela>&…`

## Catálogo (listagens)

| Tela UI | `page` | O que retorna | Filtros GET | Paginação | Export GET (ajax) | API local |
|---|---|---|---|---|---|---|
| Contas a receber | `contasareceber` | Faturas / títulos (status, vencimento, NF, pedido, cliente, CNPJ, valor) | `data_inicial`, `data_final`, `status`, `id_franqueado_rel`, `contato` | 1 página (lista grande no HTML) | `ajax/contasareceber/relatorio_excel.php` | **`GET /faturas`** (`contato=1` → email/tel) |
| Pedido detalhe | `pedidos_edicao` | Contato da venda (`email`, `telefone`) | `id_pedido`, `action=visualizar` | — | — | **`GET /pedidos/:id`** |
| Pedido itens | `ajax/pedidos/produtos.php` (POST) | Linhas: produto, NCM, qtd, valor, lucro, total | `id_pedido` | — | — | embutido em **`GET /pedidos/:id`** e `GET /pedidos?itens=1` |
| Orçamentos | `orcamentos` | Orçamentos (status, cliente, vendedor, total) | `data_inicial`, `data_final`, `status`, `id_vendedor`, `cliente`, `cnpj_cpf`, `orcamento`, `nome`, `valor` | `current_page` / `all` | — | **`GET /orcamentos`** |
| Pedidos | `pedidos` | Pedidos (status, cliente, vendedor, total) | `data_inicial`, `data_final`, `status`, `id_vendedor`, `id_pedido`, `cliente`, `cnpj`, `ordem_compra`, `valor`, `id_franqueado_rel` | `current_page` / `all` | — | **`GET /pedidos`** |
| Notas fiscais | `notas_fiscais` | NFs (status, nº, cliente, data, transportadora, total) | `data_inicial`, `data_final`, `status`, `tipo`, `id_vendedor`, `id_transportadora`, `cfop[]`, `uf`, `entrada_saida`, `natureza`, `finalidade`, `id_franqueado_rel` | `current_page` / `all` | `ajax/notas_fiscais/pdf.php`, `xml.php`, `exportar_pdf.php`, `exportar_xml.php`, `relatorio.php` | **`GET /notas-fiscais`** |
| Faturamento | `faturamento` | Totais por vendedor (HTML); detalhe NF×pedido no Excel | `data_inicial`, `data_final`, `id_vendedor`, `id_franqueado_rel` | — | `ajax/faturamento/relatorio_excel.php`, `relatorio_pdf.php` | **`GET /faturamento`** |
| Fluxo previsto | `fluxo_previsto` | Projeção do mês | `data` (`YYYY-MM`) | — | — | **`GET /fluxo-previsto`** |
| Chamados | `chamados` | Chamados de suporte | `data_inicial`, `data_final`, `status`, `assunto`, `chamado`, `envolvidos` | — | — | **`GET /chamados`** |
| Notificações | `notificacoes` | Inbox | `data_inicial`, `data_final` | — | `painel/ajax/notificacao.php` (poll) | **`GET /notificacoes`** |
| Dashboard | `dashboard` | Home / shell (sem grid de dados) | — | — | — | só navegação |

## Valores de `status` (quando aplicável)

| `page` | Valores |
|---|---|
| `orcamentos` | Em aberto, Aprovado, Reprovado, Contra proposta, Cancelado, Enviado |
| `pedidos` | Rascunho, Em análise, Aprovado, Reprovado, Cancelado, Faturado |
| `notas_fiscais` | aguardando, cancelado, rejeitado, enviado |
| `contasareceber` | Aberta, Quitada, Vencida, Próxima ao vencimento, Estornada, Falta arquivo |
| `chamados` | iniciado, em andamento, finalizado |

## Detalhe (GET por id)

| `page` | Params | Uso |
|---|---|---|
| `orcamentos_edicao` | (edição) | formulário de orçamento |
| `orcamento_historico` | `id_orcamento` | histórico |
| `pedidos_edicao` | `id_pedido`, `action=visualizar` | detalhe pedido |
| `pedidos_cancelamento` | — | fluxo cancelamento |
| `contasareceber_edicao` | `id_conta` | detalhe título/fatura |
| `chamados_edicao` | — | detalhe chamado |
| `notas_fiscais` + links | `id_nota` via ajax PDF/XML | arquivo da NF |

## Ajax GET só de leitura (busca / arquivo)

| Endpoint | Dados |
|---|---|
| `/franqueado/ajax/contasareceber/relatorio_excel.php` | XLS(HTML) contas a receber |
| `/franqueado/ajax/faturamento/relatorio_excel.php` | XLS: totais por vendedor **+** linhas Nota/Pedido/Data/Total |
| `/franqueado/ajax/faturamento/relatorio_pdf.php` | PDF faturamento |
| `/franqueado/ajax/notas_fiscais/pdf.php?id_nota=` | PDF DANFE |
| `/franqueado/ajax/notas_fiscais/xml.php?id_nota=` | XML NF-e |
| `/franqueado/ajax/notas_fiscais/exportar_pdf.php` | export lote PDF |
| `/franqueado/ajax/notas_fiscais/exportar_xml.php` | export lote XML |
| `/franqueado/ajax/notas_fiscais/relatorio.php` | relatório NF |
| `/franqueado/ajax/boletos/boleto.php?id_boleto=` | boleto (a partir da linha em CR) |
| `/painel/ajax/notificacao.php` | poll de notificações |

## Fora do mapa (não são busca)

POST/ações: `ajax/login.php`, `orcamentos/status|duplicar|gerarpedido`, `pedidos/status|cancelar|duplicar`, `contasareceber/quitar|status`, `notas_fiscais/gerar_pedido|deletar_arquivos`, `active.php`, `salvar_ordem_registros.php`, `notificacao_ler.php`, `painel/ajax/chamados/*`.

## Exemplo curl (portal direto)

```bash
# sessão
curl -c ~/.config/conectmax-franqueado/cookies.txt -b ~/.config/conectmax-franqueado/cookies.txt \
  -X POST -d 'usuario=…&senha=…' \
  https://franqueado.conectmax.com/franqueado/ajax/login.php

# faturas
curl -b ~/.config/conectmax-franqueado/cookies.txt -G \
  --data-urlencode 'page=contasareceber' \
  --data-urlencode 'data_inicial=01/01/2026' \
  --data-urlencode 'data_final=06/11/2026' \
  'https://franqueado.conectmax.com/franqueado/'
```

## Caminho inverso

- Remover este mapa: apagar `GETS.md` e links no README / `portal-franqueado.md`
- Remover só um GET: tire a rota em `src/index.js` + linha neste mapa / `catalog.js`
