# RoleGo Web — Protótipo E01

Frontend React (Vite) com as telas do épico **E01 — Conta, onboarding e perfil**.

Estado só em memória (sem API). Visual segue o manual [`../marca/identidade-visual-rolego-v1.html`](../marca/identidade-visual-rolego-v1.html) (tokens `--rg-*` em `src/styles/tokens.css`). Escopo: [`../epics.md`](../epics.md#e01--conta-onboarding-e-perfil).

## Rodar

```bash
cd web
npm install --cache /tmp/npm-cache-rolego   # se o cache npm padrão falhar por permissão
npm run dev
```

Abre em http://localhost:5173 — menu lateral para pular entre telas.

Produção Contabo: https://rolego.com.br — build (`npm run build`) → rsync `dist/` em `/opt/rolego/web`. Passos: [`../deploy/README.md`](../deploy/README.md).

## Telas

| Rota | Tela |
|------|------|
| `/` | Splash |
| `/cadastro` | Criar conta (e-mail, senha, confirmar senha; + Google/Apple) |
| `/login` | Login (e-mail + senha) |
| `/recuperar-senha` | Recuperar senha |
| `/onboarding/preferencias` | Tipos de evento |
| `/onboarding/cidade` | Cidade |
| `/onboarding/localizacao` | Permissão de localização |
| `/onboarding/raio` | Raio de busca (slider 1–100 km) |
| `/home` | Stub pós-onboarding (descoberta = E02) |
| `/perfil` | Perfil + logout |
| `/perfil/editar` | Nome, e-mail |
| `/perfil/foto` | Foto de perfil |

## Antes → depois / rollback

- **Antes:** só docs/wireframes do E01, sem app web.
- **Depois:** protótipo navegável em `web/`.
- **Cadastro:** e-mail + senha + confirmar senha; sem nome/celular no formulário (antes: nome + telefone opcional).
- **Raio:** slider contínuo 1–100 km (antes: chips 5 / 20 / 50 km).
- **Amigos:** removidos do E01/perfil (antes: lista e contagem no perfil); social fica fora de escopo.
- **Telefone:** removido da edição de perfil (antes: campo opcional).
- **Identidade visual v1 (ajustada):** tokens `--rg-*` do manual; só Poppins (títulos itálico 800); wordmark “Role” branco + “Go” neon com o “o” virando pin de localização (ping ciano no miolo); telas e cards em preto com contorno neon; CTA ciano → violeta; celular com contorno neon por categoria e barra de status com ícones; ícones outline; radar na localização; slider com glow ciano (antes: CTA roxo → azul, Poppins + Inter, wordmark em gradiente roxo, cards azulados, emoji 📍). Página `../deploy/embreve` com o mesmo logo. Voltar: `git revert` do commit.
- **Voltar:** remover a pasta `web/` (ou reverter o commit); no cadastro, restaurar campos nome/telefone; no raio, voltar aos chips fixos; restaurar rota `/amigos` / campo telefone no editar perfil se necessário.
