## Problema
Hoje o scan do QR da nota depende só da câmera ao vivo. Em alguns aparelhos/ângulos a leitura falha ou é inconveniente (papel amassado, luz ruim, sem permissão contínua de câmera).

## Objetivo
Na tela de scan do QR (`scan.html`), oferecer **também** a opção de **tirar foto** (ou escolher imagem da galeria) e decodificar o QR a partir dessa imagem — sem remover o fluxo de escanear ao vivo.

## Entrega
- `scan.html` / `app.js` / `styles.css` · REQ-030
- Contabo: https://144.126.154.90/enotas/scan.html

## Critérios de aceite
- [x] Na UI de scan: ação clara “Tirar foto” / “Escolher imagem” além do scan ao vivo
- [x] Foto da câmera (`capture`) e/ou arquivo da galeria decodificam o QR e seguem o mesmo pipeline da URL
- [x] Feedback claro se a imagem não tiver QR legível
- [x] Não regressar o scan ao vivo nem o `POST /api/nota`