# Entrega — system prompt colado no card

## Antes → depois
- Antes: `SYSTEM PROMPT` + `/system-prompt.md` (referência)
- Depois: texto completo de `system-prompt.md` colado no topo do `.md` da atividade (snapshot)

## Comportamento
- Criação: copia o texto atual de `system-prompt.md`
- Regravação de arquivo legado (path): preenche com o texto atual
- Editar `system-prompt.md` depois: não altera cartões já gravados
- Play: pedido manda seguir o bloco embutido no arquivo da atividade

## Arquivos
- `plans/app/packages/domain/src/format.ts`
- `plans/app/apps/web/src/folder/project.ts`
- `plans/app/apps/web/src/features/SystemPrompt.tsx`
- `plans/app/apps/web/src/features/CopyMdButton.tsx`
- `plans/app/apps/client/internal/exec/play.go`
- docs: `plans/app/README.md`, `plans/docs/plano-implementacao.md`, `plans/docs/functionalities.md`

## Voltar
Reverter `systemPromptPrefix` / `serializeActivity` e o `withPromptSnapshot` em `project.ts`.
