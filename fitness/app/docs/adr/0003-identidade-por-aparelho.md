# ADR-0003 · Identidade sem conta: token opaco por aparelho

- Status: aceito · 2026-11-09 · RF-01..04, RN-01, RN-01b

## Contexto
O PRD pede "fingerprint do dispositivo" sem login. Fingerprinting de navegador (canvas, fontes) é instável e invasivo.

## Decisão
Na primeira abertura o cliente gera um ID aleatório local (rótulo `fp_xxxx·xxxx·xxxx`) e chama `POST /v1/devices`; a API devolve um token aleatório de 256 bits e guarda só o SHA-256. Todas as rotas usam `Authorization: Bearer`. Token desconhecido → `401 DEVICE_UNKNOWN` → tela "Aparelho novo".

## Consequências
+ Sem dado pessoal para identificar; revogável (apagar dados remove o aparelho).
− Limpar o navegador = usuário novo (limitação documentada no onboarding; conta opcional na v2).
