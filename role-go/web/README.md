# RoleGo Web — Protótipo E01

Frontend React (Vite) com as telas do épico **E01 — Conta, onboarding e perfil**.

Estado só em memória (sem API). Visual alinhado a [`../identidade-visual.md`](../identidade-visual.md). Escopo: [`../epics.md`](../epics.md#e01--conta-onboarding-e-perfil).

## Rodar

```bash
cd web
npm install --cache /tmp/npm-cache-rolego   # se o cache npm padrão falhar por permissão
npm run dev
```

Abre em http://localhost:5173 — menu lateral para pular entre telas.

## Telas

| Rota | Tela |
|------|------|
| `/` | Splash |
| `/cadastro` | Criar conta (e-mail + Google/Apple) |
| `/login` | Login |
| `/recuperar-senha` | Recuperar senha |
| `/onboarding/preferencias` | Tipos de evento |
| `/onboarding/cidade` | Cidade |
| `/onboarding/localizacao` | Permissão de localização |
| `/onboarding/raio` | Raio de busca |
| `/home` | Stub pós-onboarding (descoberta = E02) |
| `/perfil` | Perfil + logout |
| `/perfil/editar` | Nome, e-mail, telefone |
| `/perfil/foto` | Foto de perfil |
| `/amigos` | Lista/contagem de amigos |

## Antes → depois / rollback

- **Antes:** só docs/wireframes do E01, sem app web.
- **Depois:** protótipo navegável em `web/`.
- **Voltar:** remover a pasta `web/` (ou reverter o commit que a introduziu).
