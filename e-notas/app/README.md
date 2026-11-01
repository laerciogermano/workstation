# e-notas — app (scan QR)

Front de uma tela: escaneia o QR da nota, imprime a URL no console do browser e envia `POST /api/nota`. O backend só imprime a URL no terminal.

Serve **HTTPS** (certificado autoassinado em `certs/`, gerado na 1ª subida se faltar).

## Subir

```bash
cd e-notas/app
npm install
npm start
```

Sobe em `0.0.0.0:4173`. No log aparece `https://<ip-lan>:4173`.

Variável opcional: `PORT=4173`.

## Câmera na rede

1. Abra `https://<ip-lan>:4173` no celular (mesma rede)
2. Aceite o aviso de certificado (avançar / confiar)
3. Permita a câmera

Se o IP da máquina mudar e a câmera falhar por SAN, apague `certs/` e suba de novo (regenera com os IPs atuais).

## API

`POST /api/nota` body `{ "url": "https://..." }` → log `[nota] <url>` e `{ ok: true }`.

## Reverter

Parar o processo na porta `4173`. Remover `certs/` para forçar novo certificado. Código HTTPS: voltar o commit anterior de `server.js` / este README.
