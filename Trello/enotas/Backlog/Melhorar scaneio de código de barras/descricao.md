## Problema
O scaneio de código de barras (EAN) está demorando e muitos códigos não são lidos.

## Objetivo
Deixar a leitura mais rápida e aumentar a taxa de sucesso (menos falhas / “não pega”).

## Contexto
- Fluxo atual: Html5Qrcode no cadastro/edição de EAN (lista / detalhe nota).
- Relato: latência alta e vários códigos que não decodificam.

## Critérios de aceite (rascunho)
- [ ] Tempo até 1ª leitura perceptivelmente menor no uso típico (celular)
- [ ] Taxa de leitura melhor em códigos comuns de mercado (EAN-13 / UPC)
- [ ] Feedback claro quando a câmera está ativa / falhou / leu
- [ ] Não regressar o fluxo de cadastro de `codigos_barras`

## Investigar / opções
- Config do Html5Qrcode (fps, qrbox, formatos, facingMode)
- Alternativas (BarcodeDetector nativo, ZXing, etc.)
- UX: foco/guia, iluminação, retry, entrada manual sempre à mão