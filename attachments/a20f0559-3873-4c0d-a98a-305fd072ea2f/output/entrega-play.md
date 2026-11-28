# Play: executar a atividade com a IA

## O que faz

- Botão ▶ no cartão (árvore, Kanban e cartão aberto) quando o responsável é Claude ou Gemini.
- O front pede `plans-play <claude|gemini> <id>` pelo caminho já existente (front, hub, client).
- O client pede liberação no computador e abre uma janela do Terminal na pasta do projeto, com `claude "<pedido>"` ou `gemini --prompt-interactive "<pedido>"`.
- O pedido é um texto fixo; só o id varia. Título e descrição não entram em comando. Nenhuma opção que pule permissões.

## Para usar

1. No terminal onde o client está rodando, parar com Ctrl+C.
2. `cd plans/app && npm run client:build`
3. `bin/plans-client run`
4. Para o Gemini: `npm install -g @google/gemini-cli` e fazer login (não estava instalado).
5. Clicar no ▶ e responder `u` ou `s` no terminal do client. Opcional, para não perguntar: `bin/plans-client allow --any-args -- plans-play`.

## Verificação

- `npm run verify` em `plans/app`: lint, tipos, testes TypeScript e Go passaram; `go vet` também para Linux e Windows.
- Chrome headless em `?demo=playtest`, hub e front no ar, client temporário (configuração separada) e IAs falsas: botão só para IA, pareamento, espera de aprovação, negação, recusa sem liberação e duas janelas reais do Terminal (fechadas ao fim).
- Não verificado: Claude e Gemini de verdade, Linux em execução, `npm run e2e` (recompilaria o binário em uso).
- Windows: ainda não abre o terminal (mostra o erro).

## Arquivos

- `plans/app/apps/client/internal/exec/play.go`, `play_darwin.go`, `play_unix.go`, `play_windows.go`, `play_test.go`, `manager.go`
- `plans/app/apps/client/internal/connection/agent.go`, `cmd/plans-client/main.go`
- `plans/app/packages/domain/src/play.ts` (e teste), `index.ts`, `format.ts`
- `plans/app/apps/web/src/features/PlayButton.tsx`, `Kanban.tsx`, `Tree.tsx`, `NodePanel.tsx`, `ui/Icon.tsx`, `ui/styles.css`
- `plans/app/apps/web/test/project.test.ts`, `plans/app/README.md`, `plans/app/docs/ADRs.md`
- `assignees.json` (acrescentado o Gemini)
