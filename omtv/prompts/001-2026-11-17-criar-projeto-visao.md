# 001 — Criar projeto OmTV e documento de visão

| Campo | Valor |
|-------|--------|
| Número | 001 |
| Data | 2026-11-17 |
| Origem | Chat no Cursor (workstation) |
| Título | Criar projeto OmTV e documento de visão |

## Prompt original

```
Adicione um novo projeto no centralizador, e localmente também, que é o projeto do OmTV, que é um robô de market pra OmTV, com possibilidade de, de adição de câmera, é, vídeo na verdade, você pode selecionar o vídeo ali, é, mensagens automáticas, conversas automáticas pedida por IA, enfim essas questões. Crie primeiro o documento de visão, daí crie lá o link, publique no centralizador, e vamos trabalhar primeiro no documento de visão. E quando clicar no, no projeto, tem que ter a página do projeto contendo o contexto e o objetivo.
```

## Interpretação

Criar o projeto **OmTV** no workstation e no centralizador: robô de marketing no OmeTV com seleção de vídeo, mensagens automáticas e conversas por IA. Primeiro artefato = documento de visão. Página do projeto (`project.html?p=omtv`) com contexto e objetivo. Publicar o centralizador com o card.

## O que foi feito

- Pasta `omtv/` com visão, docs, config IA e timeline de prompts.
- Entrada em `boards/data.json`, `index.html`, `board.html`, `project.html` (seções Contexto / Objetivo).
- Card no `centralizador/site/` + republicação.
- Link na tabela de projetos do `README.md` da raiz.
