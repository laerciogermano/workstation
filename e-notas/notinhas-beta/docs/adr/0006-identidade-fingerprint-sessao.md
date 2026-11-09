# 0006 — Visitante por HMAC do fingerprint; JWT curto + refresh rotativo

**Data:** 2026-11-09 · **Status:** Aceita · implementa REQ-050 e `beta-docs` ADR de sessão

## Contexto
REQ-050: usar sem login, com os dados do visitante na base (não no localStorage), IP registrado pelo servidor e merge ao criar conta. Fingerprint é dado pessoal sob LGPD.

## Decisão
- O navegador envia `X-Client-Fingerprint` (SHA-256 de sinais do aparelho + semente aleatória local). O servidor guarda **só** `HMAC-SHA256(pepper, fingerprint)` em `visitors`, com primeiro/último IP (de `req.ip` com `trust proxy` no loopback).
- Conta: senha com scrypt; access token JWT HS256 de 15 min em memória no front; refresh opaco em cookie `nt_rt` HttpOnly/SameSite=Lax/path `/api/v1/auth`, rotacionado a cada uso; reuso de um refresh já trocado revoga a família inteira.
- Registro e login no mesmo navegador fazem o merge (`mergeVisitorIntoUser`) numa transação.
- CSRF: toda mutação exige `X-Requested-With: notinhas` (formulário de outro site não consegue mandar).

## Consequências
+ Sem tabela de sessão quente para cada request; logout em todos os aparelhos possível.
− Trocar de navegador sem conta perde o histórico anônimo (comunicado no Perfil e em Minhas notas).
