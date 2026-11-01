# e-notas — app (scan QR)

Front: escaneia o QR da nota e envia a URL. Backend consulta a DANFE na **Fazenda PR** (`fazenda.pr.gov.br/nfce/qrcode`), extrai todos os itens e imprime no terminal.

Serve **HTTPS** (certificado autoassinado em `certs/`, gerado na 1ª subida se faltar).

## Subir

```bash
cd e-notas/app
npm install
npm start
```

Sobe em `0.0.0.0:4173`. No log: `https://<ip-lan>:4173`.

Variável opcional: `PORT=4173`.

## Câmera na rede

1. Abra `https://<ip-lan>:4173` no celular
2. Aceite o certificado autoassinado
3. Permita a câmera

Se o IP mudar: apague `certs/` e suba de novo.

## API

`POST /api/nota` body `{ "url": "http://www.fazenda.pr.gov.br/nfce/qrcode?p=..." }`

- Busca o HTML da consulta pública
- Extrai `estabelecimento` + `itens[]` (`nome`, `codigo`, `quantidade`, `unidade`, `valorUnitario`, `valorTotal`)
- Loga cada item no terminal
- Responde `{ ok, url, estabelecimento, itens }`

Só aceita host `fazenda.pr.gov.br` e path `/nfce/qrcode`.

## Reverter

Parar porta `4173`. Remover `fazenda-pr.js` e voltar `POST /api/nota` só imprimindo a URL (commit anterior). Apagar `certs/` se quiser regenerar HTTPS.
