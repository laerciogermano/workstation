## Objetivo
Comparar **preços reais** observados em NFC-e (índice notinhas.shop / e-notas) com os preços cobrados em apps de **delivery / marketplace de comida e mercado**, começando por **iFood** e **99Food**, e ampliando para outros relevantes.

## Por quê
O preço de balcão (nota) e o preço no app (taxa de serviço, delivery, markup da loja no canal digital) costumam divergir. Entender o gap ajuda a:
- posicionar o notinhas.shop como índice de **preço físico real**;
- informar a trilha **delivery** do PRD (§4.7) sem misturar fontes;
- decidir se/quando expor “preço na loja vs preço no app”.

## Escopo
1. Amostrar produtos com EAN (ou descrição estável) presentes no índice NFC-e
2. Coletar o preço correspondente em:
   - **iFood** (restaurante e/ou mercado, conforme disponibilidade)
   - **99Food**
   - **outros** (ex.: Rappi, Aiqfome, apps de mercado da própria rede — listar na entrega)
3. Registrar por item: preço NFC-e (loja + data), preço no app, taxas visíveis (entrega/serviço), cidade/região da amostra
4. Sintetizar markup médio, casos extremos e limitações (estoque, promoção, região)

## Entrega
- Planilha ou tabela (CSV/HTML) com amostras lado a lado
- Resumo: metodologia, N amostras, gaps típicos, riscos de comparar fontes diferentes
- Comentário no card com link para artefato em `e-notas/` (pasta a definir na execução)
- Atualizar PRD/REQ só se surgir capacidade de produto (ex. “mostrar gap vs apps”)

## Fora de escopo (neste card)
- Scraping automatizado em escala / bypass de termos dos apps
- Implementar delivery no produto
- Substituir o índice NFC-e por preço de marketplace

## Relacionados
- PRD: `e-notas/docs/prd.md` (§4.7 delivery *future*)
- Benchmarking soluções NFC-e: https://trello.com/c/1fMjqGdR
