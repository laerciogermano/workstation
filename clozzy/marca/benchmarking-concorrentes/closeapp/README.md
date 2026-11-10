# closeapp — clones (GitLab)

Grupo real: [`gitlab.com/clozzy-app`](https://gitlab.com/clozzy-app) (não existe `gitlab.com/closeapp`; GitHub `closeapp`/`clozzy-app` não tinha estes repos).

Pasta local: `clozzy/marca/benchmarking-concorrentes/closeapp/`

| Local | Remoto GitLab | Status |
|-------|---------------|--------|
| [`schedule/`](schedule/) | `clozzy-app/clozzy-schedule` | OK |
| [`performer/`](performer/) | `clozzy-app/clozzy-performer` | OK |
| [`robot/`](robot/) | `clozzy-app/clozzy-robot` | OK |
| [`api/`](api/) | `clozzy-app/clozzy-api` | OK |
| [`front/`](front/) | `clozzy-app/clozzy-front` | OK |

Clone: `git clone --depth 1` via sessão Germano CDP `:9230` (PAT legado temp `read_repository`, remotes sem token).

## Rollback

```bash
rm -rf clozzy/marca/benchmarking-concorrentes/closeapp
```
