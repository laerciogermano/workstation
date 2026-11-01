# 002 — Front scan QR + backend na rede

| Campo | Valor |
|-------|--------|
| Número | 002 |
| Data | 2026-11-01 |
| Origem | Chat no Cursor (workstation) |
| Título | Front que escaneia QR e sobe na rede |

## Prompt original

```
no projeto notas, crie um front que escaneia o qrcode da nota e imprime a url no console

suba o front para que eu possa acessar via web em rede

o backend vai receber a url e vai imprimir

o front so tem uma tela que abre pra scanear o qrcode url
```

## Interpretação

Criar app no e-notas: uma tela de scan, URL no console, servidor acessível na LAN; backend recebe URL e imprime.

## O que foi feito

- `e-notas/app/` Express + front html5-qrcode; `POST /api/nota`
- Servidor em `0.0.0.0:4173`
