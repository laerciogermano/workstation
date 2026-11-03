## Problema
Hoje o scan do QR da nota depende só da câmera ao vivo. Em alguns aparelhos/ângulos a leitura falha ou é inconveniente (papel amassado, luz ruim, sem permissão contínua de câmera).

## Objetivo
Na tela de scan do QR (`scan.html`), oferecer **também** a opção de **tirar foto** (ou escolher imagem da galeria) e decodificar o QR a partir dessa imagem — sem remover o fluxo de escanear ao vivo.

## Contexto
- Fluxo atual: câmera contínua via Html5Qrcode em `app/public/scan.html` → URL → `POST /api/nota`
- Html5Qrcode já tem `scanFile` / file input para imagem estática
- Relacionado (EAN, não QR): https://trello.com/c/xdeWAy5y

## Critérios de aceite (rascunho)
- [ ] Na UI de scan: ação clara “Tirar foto” / “Escolher imagem” além do scan ao vivo
- [ ] Foto da câmera (`capture`) e/ou arquivo da galeria decodificam o QR e seguem o mesmo pipeline da URL
- [ ] Feedback claro se a imagem não tiver QR legível
- [ ] Não regressar o scan ao vivo nem o `POST /api/nota`
