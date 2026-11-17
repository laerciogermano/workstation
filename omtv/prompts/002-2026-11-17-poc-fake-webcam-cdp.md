# 002 — POC vídeo local como webcam via CDP

| Campo | Valor |
|-------|--------|
| Número | 002 |
| Data | 2026-11-17 |
| Origem | Chat no Cursor (workstation) |
| Título | POC fake webcam CDP (sem OBS) no OmTV |

## Prompt original

```
Dentro do projeto do Home TV, a gente vai precisar abrir um browser via CDP e colocar um vídeo, e a gente já fez isso anteriormente. Só que não colocar via OBS, colocar via, via, tem uma propriedade no Chrome que você consegue colocar um vídeo. Cria uma pequena POC, você já criou antes, veja se já existe, se não existir, cria uma POC, onde a gente vai abrir um site de webcam e vai colocar um vídeo, que seja local e vai aparecer aparecer na webcam lá, com um smoothie de, se eu não me engano, de de vídeo, né, pra aparecer um nome específico que a gente escolha. Então, que eles, veja se já existe ou cria o sistema.
```

## Interpretação

No **OmTV** (OmeTV): POC de Chrome/CDP alimentando a webcam com **arquivo local** via flags Chrome (`--use-file-for-fake-video-capture`), **sem OBS**, abrindo página de teste de webcam, com **spoof** do label da câmera para um nome escolhido. Reusar o que já existia no lab se houver; senão criar.

## O que foi feito

- Confirmação: não havia POC versionada (só testes ad-hoc + OBS + `camera-spoof`).
- Criada [`../pocs/fake-webcam-cdp/`](../pocs/fake-webcam-cdp/README.md) (`run.mjs`, `to-y4m.sh`, fixture HTML).
- `cameraLabel` no normalize do fingerprint; match `fake`/`y4m` no spoof.
- Links na visão OmTV e docs human-cdp.
