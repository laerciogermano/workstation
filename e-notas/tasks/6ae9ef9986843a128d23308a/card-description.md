## Problema
Na vitrine do estabelecimento não há como cadastrar/vincular o código de barras (EAN) do produto da loja.

## Objetivo
Dentro do estabelecimento, em cada item: leitor com câmera, foto/imagem e digitação; vincular EAN via `empresa_id` + `codigo_unidade`.

## Critérios de aceite
- [x] Botão Código de barras / Editar EAN na vitrine (itens com código de unidade)
- [x] Modal: câmera + Tirar foto + Escolher imagem + input + Salvar
- [x] Foto/imagem decodifica e salva como o scan/digitação
- [x] Feedback se imagem sem código; câmera volta
- [x] UPSERT `codigos_barras` e UI atualiza
