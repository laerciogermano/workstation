# Fotos por EAN

Uma imagem por código de barras cadastrado (`{EAN}.jpg`), baixada na ordem de fonte mais confiável:

1. Open Food Facts  
2. Open Beauty Facts  
3. Open Products Facts  
4. UPCitemdb  
5. Catálogos BR (Kodebar / SI5 / Blendo / EncontraProduto / PreçoMelhor) — só se as anteriores falharem  

`manifest.json` registra EAN → arquivo → URL/fonte usada.

No banco: `enotas.codigos_barras.foto_url` = caminho relativo (ex. `ean-fotos/7894900701517.jpg`), preenchido no boot e no upsert do EAN.
