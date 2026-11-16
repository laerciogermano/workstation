# 1. Monólito modular: Express + TypeScript strict + PostgreSQL + React

Data: 2026-11-16 · Status: aceito

## Contexto

O sistema é pequeno (5 casos de uso, 1 persona) e precisa ficar pronto rápido. O guia `core/definir-projeto-moderno/02-boas-praticas-stack` recomenda monólito modular com fronteiras claras e só separar em serviços quando escala ou time pedirem.

## Decisão

- Um repositório com dois workspaces: `api/` (Express 5, TS `strict`, `pg`, zod, pino) e `web/` (React 19 + Vite, TanStack Query).
- A API tem dois processos a partir do mesmo código: `server` (HTTP) e `worker` (envio).
- Módulos por funcionalidade (`auth`, `lists`, `campaigns`, `sending`, `unsubscribe`); envio por SMTP atrás da porta `MailSender`.
- SQL direto com `pg` e migrações `.sql` versionadas, sem ORM.

## Consequências

- Um deploy só; sem outro serviço para operar.
- Trocar o provedor de e-mail é escrever outro adaptador de `MailSender`.
- SQL explícito: o esquema segue as convenções do guia de Postgres sem depender de ORM; queries ficam nos repositórios de cada módulo.
