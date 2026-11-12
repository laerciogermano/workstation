# ADR-0005 · Fotos de progresso ficam só no aparelho

- Status: aceito · 2026-11-09 · RF-31, RN-18, RNF-01

## Decisão
Fotos são capturadas (getUserMedia ou galeria) e salvas em IndexedDB; nunca trafegam para a API. A vitrine não oferece publicar foto nem peso no v1.

## Consequências
+ O dado mais sensível nunca sai do aparelho.
− Sem backup: trocar de aparelho perde as fotos (mesma limitação da identidade).
