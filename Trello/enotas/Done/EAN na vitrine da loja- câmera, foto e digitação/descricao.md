## Problema
Na vitrine do estabelecimento não há como cadastrar/vincular o código de barras (EAN) do produto da loja. O modal de EAN existe, mas só era acionado por fluxos antigos (itens/nota); falta entrada no item da loja e opção por foto (além da câmera ao vivo e digitação).

## Objetivo
Dentro do estabelecimento, em cada item do catálogo: botão de leitor de código de barras com:
1. câmera ao vivo
2. tirar foto / escolher imagem
3. digitar o número
e vincular o EAN ao produto da loja (`empresa_id` + `codigo_unidade`).

## Contexto
- Modal: `#modal-ean` em `index.html` + `openCadastroEan` / `POST /api/codigos-barras` em `lista.js`
- Relacionados: https://trello.com/c/xdeWAy5y (melhorar scaneio) · https://trello.com/c/vLJJBkPs (QR por foto)
- REQ-011 (vínculo EAN)

## Critérios de aceite
- [ ] Na vitrine do estabelecimento, cada item com código de unidade tem ação clara de cadastrar/editar EAN
- [ ] Modal: câmera ao vivo + Tirar foto + Escolher imagem + input numérico + Salvar
- [ ] Foto/imagem decodifica EAN e segue o mesmo save do scan/digitação
- [ ] Feedback se a imagem não tiver código legível; câmera volta
- [ ] UPSERT em `codigos_barras` vincula ao produto da loja; UI atualiza