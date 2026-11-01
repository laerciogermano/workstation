## Objetivo
Mapear **soluções similares** ao **notinhas.shop** / e-notas e comparar nos requisitos do PRD.

## PRD
`e-notas/docs/prd.md`

## Requisitos de produto (comparar no benchmarking)
- **Comparação de preços** — EAN entre estabelecimentos; menor preço com loja + data
- **Histórico de preços** — evolução por produto e por mercado
- **Montagem apartada** — cesta por mercado + divisão 2+ lojas
- **Tela da loja (vitrine e-commerce)** — itens da loja como catálogo read-only
- **Busca geo / onde comprar perto** — pesquisar item e ver lojas físicas próximas (GPS ou região, ex. **centro**)
- **Integrações via API para empresas** — API B2B consulta/alimentação

## Contexto do produto
- Entrada: URL/QR da NFC-e (hoje Fazenda PR)
- Índice: EAN/GTIN + descrição → preço + loja + data
- Personas: contribuinte, comprador, empresa/parceiro

## Entrega
- Curadoria HTML/PDF em `e-notas/marca/benchmarking-solucoes/`
- PRD em `e-notas/docs/prd.md`
- REQ-014 em `e-notas/docs/requisitos.md`

## Relacionados
- Visão: `e-notas/README.md`
- Identidade: https://trello.com/c/qUI3Rb9a
