# E-mail marketing — Documento de visão

Sistema simples de e-mail marketing da Connect.

## Contexto

Na Connect, é necessário um sistema de e-mail marketing do zero, bem simples, com front-end para campanhas e cadastro de base de e-mails em listas. A base é usada para enviar os e-mails das campanhas: configura-se para qual lista vai o envio e acompanha-se o progresso. Em essência: campanhas, listas e o envio de e-mails para essas listas.

## Objetivo

Disponibilizar um front-end em que se cadastram listas (base de e-mails), criam-se campanhas, configura-se a lista de destino de cada campanha, dispara-se o envio e se acompanha o progresso do envio — apenas isso.

## Casos de uso

**Persona:** operador de marketing da Connect — quem usa o front-end para montar listas, campanhas e disparos.

| ID | Caso de uso | Persona | Descrição |
|----|-------------|---------|-----------|
| CU-01 | Cadastrar base de e-mails em listas | Operador de marketing | Cadastra e-mails organizados em listas. |
| CU-02 | Criar campanhas | Operador de marketing | Cria e mantém campanhas no front-end. |
| CU-03 | Configurar lista da campanha | Operador de marketing | Define para qual lista a campanha envia. |
| CU-04 | Enviar e-mails da campanha | Operador de marketing | Dispara o envio da campanha para a lista configurada. |
| CU-05 | Acompanhar progresso do envio | Operador de marketing | Vê o progresso do envio de e-mails da campanha. |
| CU-06 | Saber quem abriu | Operador de marketing | Vê quais destinatários abriram o e-mail da campanha, quando e quantas vezes. |

## Produção

**URL:** https://marketing.conectmax.email  
Deploy Contabo: [`deploy/README.md`](deploy/README.md)

## Implementação

| Pasta | O quê |
|---|---|
| [`api/`](api/) | Express 5 + TypeScript strict + PostgreSQL — HTTP (`src/server.ts`) e worker de envio (`src/worker.ts`) |
| [`web/`](web/) | React 19 + Vite — telas de campanhas e listas (marca Connect) |
| [`deploy/`](deploy/README.md) | Contabo: rsync, systemd, nginx, SMTP Mailcow |
| [`docs/arquitetura.md`](docs/arquitetura.md) | Containers, módulos, fluxo de envio, dados, segurança |
| [`docs/adr/`](docs/adr/) | Decisões (monólito modular; fila no Postgres) |
| [`AGENTS.md`](AGENTS.md) | Comandos e regras para quem mexer no código |

### Rodar local

```bash
npm install
npm run infra:up                 # Postgres :5434 + Mailpit (caixa de e-mails de teste em http://localhost:8025)
cp .env.example api/.env
npm run migrate
npm run seed:operator -- voce@connect.com.br 'senha-com-12+'
npm run dev:api                  # :4000
npm run dev:worker               # envia a fila
npm run dev:web                  # http://localhost:5173
```

Testes: `npm test` (unitários + integração no Postgres do compose).
