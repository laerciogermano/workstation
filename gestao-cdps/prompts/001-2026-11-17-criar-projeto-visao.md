# 001 — Criar projeto Gestão de CDPs e documento de visão

| Campo | Valor |
|-------|--------|
| Número | 001 |
| Data | 2026-11-17 |
| Origem | Chat no Cursor (workstation) |
| Título | Criar projeto Gestão de CDPs e documento de visão |

## Prompt original

```
Crio um novo projeto chamado Gestão de CDPs, Gestão de Human CDPs, que vai usar libpwbash human CDP, que é um projeto que vai ter uma interface gráfica ali, aonde você vai poder criar CDPs, remover, editar, é, cada CDP na criação vão ter lá os, os, os dados de, de criação né, do formulário, do CDP, daí você vai poder executar, parar, você vai poder controlar, via tela, clicar no mouse, mexer no mouse, e aí todo, todo evento que for mexer ele deve reproduzir lá no via CDP, como humano, todo clique, todo meximento do mouse, todo dígito, é, basicamente isso. Crio o documento de visão primeiro.
```

## Interpretação

Criar o projeto **Gestão de CDPs** (alias **Gestão de Human CDPs**) no workstation e no centralizador: UI sobre a lib **human-cdp** com CRUD (formulário de criação), executar/parar e controle remoto por tela (mouse move, clique, digitação → reprodução humana no CDP). Primeiro artefato = documento de visão. Página do projeto com contexto e objetivo. Publicar o centralizador com o card.

## O que foi feito

- Pasta `gestao-cdps/` com visão, docs, config IA e timeline de prompts.
- Entrada em `boards/data.json`, `index.html`, `board.html`, `project.html` (seções Contexto / Objetivo).
- Card no `centralizador/site/` + republicação.
- Link na tabela de projetos do `README.md` da raiz.
