# RoleGo Beta — Segurança, privacidade e LGPD

> Isto não substitui revisão jurídica. Termos de Uso e Política de Privacidade precisam de validação por advogado antes do beta aberto.

## 1. Inventário de dados pessoais

| Dado | Finalidade | Base legal (LGPD art. 7º) | Quem vê | Retenção |
|---|---|---|---|---|
| E-mail, senha (hash) | Conta e login | Execução de contrato (V) | Só o titular/sistema | Enquanto a conta existir |
| Nome, foto | Perfil e prova social | Execução de contrato (V) | Usuários (se a presença for visível) | Idem |
| Localização (lat/lng com 3 casas) | Calcular a distância dos eventos | **Consentimento** (I), pedido no onboarding | Ninguém (só o servidor) | Só a última; apagada ao revogar |
| Cidade, preferências | Personalizar a descoberta | Execução de contrato (V) | Só o titular | Idem |
| Interesses e presenças | Funcionalidade + prova social | Execução de contrato (V) + legítimo interesse (IX) para a exibição, com opt-out | Contagem para todos; avatar se `showPresence` | Idem |
| Avaliações/comentários | Comunidade | Execução de contrato (V) | Público | Mantidas anonimizadas após exclusão |
| Autodeclaração 18+ | Restringir eventos 18+ | Cumprimento de obrigação/legítimo interesse | Ninguém | Idem |
| Endereço de evento privado (do anfitrião) | Revelar aos aprovados | Execução de contrato (V) | Anfitrião + aprovados | Até a exclusão do evento/conta |
| Logs técnicos (IP truncado, UA) | Segurança | Legítimo interesse (IX) | Time técnico | 30 dias |
| Analytics pseudônimo | Melhorar o produto | Consentimento (cookies) | Time | 12 meses |

**Direitos do titular (art. 18)** no Beta: acesso (perfil + "Baixar meus dados" em JSON, prioridade S), correção (editar perfil), eliminação (excluir conta), revogação do consentimento de localização (preferências) e informação (Política). Canal: `privacidade@rolego.com.br`, com resposta em até 15 dias.

**Menores:** o serviço é para quem tem 18 anos ou mais (autodeclaração). Conta com indício de menoridade é encerrada a partir de denúncia.

## 2. Modelo de ameaças (STRIDE resumido)

| Ameaça | Vetor | Controle |
|---|---|---|
| **S**poofing | Credential stuffing | argon2id, rate limit por IP+e-mail, mensagem genérica, OAuth |
| **S**poofing | Roubo de token | JWT EdDSA de 10 min em cookie httpOnly (inacessível a JS); refresh rotativo com detecção de reuso (revoga a família); denylist para revogação imediata; passkeys resistentes a phishing |
| **S**poofing | Falsificação de JWT | Algoritmo fixo EdDSA (rejeita `none`/HS*), `kid` validado contra o JWKS, `iss`/`aud`/`exp` obrigatórios, chave privada cifrada em repouso (`JWT_KEK`) e rotação a cada 90 dias |
| **S**poofing | E-mail forjado em nome do RoleGo | SPF `-all`, DKIM 2048, DMARC `quarantine` → `reject` após 30 dias, MTA-STS |
| **T**ampering | Alterar evento de terceiro (IDOR) | Policy `canManage` em **todo** caso de uso de organizador; IDs UUID; testes de authz |
| **R**epudiation | Admin remove conteúdo | `audit_log` imutável (sem UPDATE/DELETE pela aplicação) |
| **I**nfo disclosure | Endereço privado via API/OG/logs | `EventPresenter` único, OG sem endereço, logs sem endereço/coordenadas, testes de contrato |
| **I**nfo disclosure | Triangulação de usuário pela distância | Distância só do evento (nunca do usuário); localização do usuário nunca é exposta; privado arredondado a 1 km |
| **I**nfo disclosure | Enumeração de contas | Respostas iguais em forgot/register (o register retorna 409, aceito por UX, mas com rate limit) |
| **I**nfo disclosure | Força bruta no código de acesso | 6 caracteres alfanuméricos sem ambíguos (≈ 1 bi combinações) + 5 tentativas/10 min |
| **D**oS | Abuso de feed/uploads | Throttler, limites de payload (nginx 10 MB), jobs com concorrência limitada |
| **E**levation | Virar admin | Papel só via CLI/seed; `@Roles('admin')` + checagem no caso de uso |
| XSS | Descrição/comentário | React escapa; sem HTML; links sanitizados com `rel="noopener nofollow ugc"`; CSP |
| SSRF | Link externo de ingresso | Só validação de formato `https://`; o servidor **não** busca a URL |
| Upload | Polyglot/EXIF | Magic bytes + reencode via sharp (remove metadados, incluindo GPS) |

## 3. Controles técnicos (baseline ASVS L1)

- **Headers** (nginx + helmet): `Strict-Transport-Security: max-age=31536000; includeSubDomains`, CSP `default-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://faro.rolego.com.br https://eu.i.posthog.com; frame-src https://accounts.google.com https://appleid.apple.com; script-src 'self' https://accounts.google.com https://appleid.cdn-apple.com`, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self), camera=()`.
- **Senhas:** argon2id (m=19 MiB, t=2, p=1); mínimo de 8 caracteres; checagem contra a lista das 10 mil senhas mais comuns.
- **Tokens** (reset/verificação): 32 bytes aleatórios, só o hash no banco, uso único, expiração 1 h / 24 h.
- **JWT/refresh:** ver [ADR-008](04-adrs.md#adr-008); refresh guardado como `sha256`; cookies `__Host-`/`Secure` em produção; 'Sair de todos os aparelhos' disponível.
- **E-mail (Mailcow):** painel admin só por VPN/IP permitido + 2FA; a senha SMTP da aplicação vale só para envio (sem IMAP, exceto a caixa de bounce); fail2ban/rate limit de submission ativos.
- **Observabilidade:** Grafana atrás de SSO/2FA; Faro sem PII (`beforeSend` remove e-mail/URL com token); retenção curta (logs 14 d).
- **CORS:** desligado (mesma origem).
- **Dependências:** Renovate + `pnpm audit` no CI (falha em high/critical); imagem Docker `node:22-alpine` com usuário não-root.
- **Segredos:** env injetada pelo compose a partir de `/srv/rolego/<env>/.env` (permissão 600); rotação documentada em [14](14-operacao-deploy.md).
- **Banco:** usuário da aplicação sem `SUPERUSER`; Postgres sem porta exposta (rede interna do compose).
- **Backups:** criptografados (age/gpg) antes de sair da VPS.

## 4. Conteúdo e moderação

- Termos de Uso proíbem conteúdo ilegal, golpes, discurso de ódio e eventos que exponham menores.
- Denúncia em evento, comentário e perfil; SLA de moderação no beta: 24 h.
- Filtro automático simples nos comentários (lista de palavrões + bloqueio de URLs) → `status=hidden` até revisão quando acionado.
- Marco Civil (art. 19/21): remoção mediante denúncia; preservação de registros de acesso por 6 meses (art. 15). Os logs de acesso guardam IP + timestamp por 6 meses em arquivo separado e criptografado.

## 5. Checklist de lançamento (segurança/privacidade)

- [ ] Política de Privacidade e Termos publicados, versionados (`terms_version`)
- [ ] Banner de consentimento para analytics (PostHog só depois do aceite)
- [ ] Teste de contrato de privacidade verde
- [ ] Pentest leve (OWASP ZAP baseline) em staging sem alertas high
- [ ] Rate limits validados
- [ ] Backup + restore testados
- [ ] Encarregado (DPO) nomeado e e-mail de privacidade funcionando
