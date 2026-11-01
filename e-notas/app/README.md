# e-notas — app (scan QR)

Front de uma tela: escaneia o QR da nota, imprime a URL no console do browser e envia `POST /api/nota`. O backend só imprime a URL no terminal.

## Subir

```bash
cd e-notas/app
npm install
npm start
```

Sobe em `0.0.0.0:4173` (rede local). No log aparece `http://<ip-lan>:4173`.

Variável opcional: `PORT=4173`.

## Câmera na rede

Browser exige origem segura para câmera. Em LAN via `http://IP` pode falhar (Safari/Chrome). Alternativas: abrir no mesmo device com túnel HTTPS, ou usar `localhost` no desktop com webcam.

## API

`POST /api/nota` body `{ "url": "https://..." }` → log `[nota] <url>` e `{ ok: true }`.

## Reverter

Remover `e-notas/app/` ou voltar o commit que a introduziu; parar o processo na porta `4173`.
