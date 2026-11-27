# Aplicativo — Confraternização Maçônica

Implementação do [documento de visão](../docs/documento-de-visao.md) v4.0 com a stack do [documento de implementação](../docs/documento-de-implementacao.md): React + Vite, NestJS + TypeScript, PostgreSQL. Disposição do protótipo v4, com cores chapadas: sem degradê, borda ou sombra.

## Rodar

Precisa de Node 22, pnpm e Docker (ou Colima).

```bash
./scripts/up.sh          # cria o .env, sobe o banco, instala, compila, popula e inicia
```

Abra **http://localhost:3333**. Pare com `Ctrl+C`; o banco segue no contêiner (`docker compose down` para parar).

## Contas de exemplo

A senha é o `SEED_PASSWORD` do `.env` (padrão `Confrat@125`).

| E-mail | Papel |
|--------|-------|
| `paulo.ribeiro@exemplo.com` | Irmão, organização e leiloeiro; verificação em duas etapas por e-mail |
| `roberto.almeida@exemplo.com` | Irmão |
| `ana.ribeiro@exemplo.com` | Familiar (vê menos módulos) |

Para ver o tempo real (chat e leilão), abra duas janelas (uma anônima) com contas diferentes.

## Comandos

| Comando | O que faz |
|---------|-----------|
| `pnpm db:reset` | Apaga o banco local e recria os dados de exemplo |
| `pnpm build && pnpm start` | Compila e inicia |
| `pnpm dev:web` | Interface com recarga automática em `:5173` (com a API rodando) |
| `pnpm test` | Testes de integração da API, num banco separado (`confrat_test`) |

## Estrutura

```text
api/  db/migrations · src/auth (login, MFA) · src/features (um arquivo por domínio) · test
web/  src/screens (uma por área) · src/ui.tsx · src/styles.css
```

## Segurança

- Senha com Argon2id; sessão JWT em cookie `HttpOnly` + `SameSite=Strict`, com checagem de origem em escritas.
- Verificação em duas etapas: autenticador (TOTP, segredo cifrado), SMS, e-mail e códigos reserva; 5 tentativas por código; confirmação antes de mudar.
- Cada rota confere no servidor: participação no evento, módulo ligado, papel e dono do recurso.
- SQL sempre parametrizado, validação com Zod, CSP e limite de requisições.
- Vagas e lances travam a linha no banco, para não haver corrida.

## O que é simulado ou falta

| Item | Situação |
|------|----------|
| SMS e e-mail | Sem provedor. Com `DEV_TOOLS=true` o código aparece na tela |
| Pix | Sem meio de pagamento. “Simular pagamento” só existe em desenvolvimento |
| Reconhecimento facial | Registra apenas a autorização; não captura imagem |
| Recuperar senha | Não implementado |
| Mapa | Desenho de Curitiba; local novo fica com posição aproximada |
| Backoffice web | Não feito (a gestão é pelo próprio app) |
| Sair | Apaga o cookie; uma cópia do token vale até 12 h. `POST /api/auth/logout-all` encerra todas |
| Produção (Contabo) | Publicado: https://confraternizacao.laerciogermano.com/ · protótipo em `/prototipo/` |

**Demo Contabo:** `DEV_TOOLS=true` + `ALLOW_SEED=true` (códigos MFA na tela). Produção “real”: tirar `DEV_TOOLS`/`ALLOW_SEED`, provedor SMS/e-mail e sem seed.

## Rollback

Parar o processo, `docker compose down -v` e remover a pasta `app/`.
