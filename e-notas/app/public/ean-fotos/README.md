# Fotos por EAN

## Runtime (REQ-032)

Ao cadastrar/vincular um EAN (`POST /api/codigos-barras`), o app busca até ~5 candidatas e grava em `enotas.ean_imagens` + arquivos em `{EAN}/NN.ext`.

Ordem de fontes:

1. Open Food Facts  
2. Open Beauty Facts  
3. Open Products Facts  
4. UPCitemdb  
5. Google Custom Search (imagens) — **só se** `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_CX` no `.env`

A candidata selecionada alimenta `codigos_barras.foto_url` (feed). Troca na UI do detalhe do produto.

## Legado

Arquivos flat `{EAN}.jpg` ainda funcionam: no boot/upsert e na 1ª busca sem linhas, viram candidata `fonte=local` selecionada.

`manifest.json` é histórico de downloads manuais anteriores (não é mais o pipeline).
