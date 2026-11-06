## Nomenclatura

| Onde | Nome certo | Não confundir com |
|---|---|---|
| Portal Franqueado (`?page=orcamentos`) | **Orçamento** | Cotação (linguagem comercial com o cliente) |
| Portal após pedido | **Faturamento** / NF / Contas a receber | Orçamento |
| PNCP | **Pesquisa de preços** / preços homologados (contratos, atas) | “Orçamento do PNCP” |
| Compras.gov / órgão | **Relatório de cotação** (pesquisa de preço) | Orçamento ConectMax |

No funil ConectMax: **Orçamento → Pedido → NF / Faturamento**.  
“Cotação” = o que se diz ao cliente; no sistema o artefato é **orçamento**.

## Objetivo

Sistema que **sugere/preenche preços** ao criar orçamento no portal, cruzando:

1. **Histórico do portal** — itens e valores já praticados (orçamentos aprovados, pedidos, faturamento/NF)
2. **PNCP** ([pncp.gov.br](https://www.gov.br/pncp/pt-br)) — preços de contratos, atas de registro e pesquisas públicas do mesmo objeto

## Escopo (v1)

- Indexar preços unitários do portal (produto/SKU/descrição → valor + data + cliente)
- Consultar PNCP (API/dados abertos) por objeto/CATMAT quando aplicável
- Na criação de orçamento: sugerir faixa (mín / mediana / último praticado) e origem da referência
- Documentar antes → depois e como desligar a sugestão

## Fora de escopo (neste card)

- Otimizar UX de cliques do formulário de orçamento ([card irmão](../../Priorizados/Otimizar%20cria%C3%A7%C3%A3o%20de%20or%C3%A7amento/descricao.md))
- Cadastro SICAF / habilitação em licitação
- Publicar proposta no PNCP / Compras.gov

## Aceite

- Dado um item conhecido no histórico do portal, o sistema devolve referência de preço com fonte
- Dado um item pesquisável no PNCP, o sistema devolve amostra de preços homologados (ou deixa claro que não achou)
- Orçamento gerado/sugerido permanece editável pelo vendedor antes do envio
