# 049 — Trocar lib de scan do QR

**Data:** 2026-11-09

## Prompt

A leitura do QR code tá muito ruim. Use alguma outra lib. Vamos testando diferentes libs pra escanear. Essa atual não tá escaneando bem. Vamos pra uma próxima.

## Entrega

- QR: `@zxing/browser` → **`qr-scanner` (Nimiq)** (câmera + foto)
- EAN: permanece zxing + tesseract
- REQ-072 · deploy Contabo
