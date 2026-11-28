# ADRs — Plans

Formato Nygard resumido. Todas aceitas em 2026-11-27. Contexto completo no [plano](../../docs/plano-implementacao.md).

| # | Contexto | Decisão | Consequência |
|---|----------|---------|--------------|
| 1 | O client só deve executar comandos | O front grava a pasta | Só Chrome e Edge de computador |
| 2 | Navegador e client só abrem conexões | Hub no servidor | Executar comandos exige o hub no ar |
| 3 | O hub é um canal de execução remota | Cifra ponta a ponta com chave de pareamento; sessão e sequência contra repetição | O hub não lê nem forja |
| 4 | O front pode ser comprometido | Política local: nada executa sem liberação | Um passo a mais por comando novo |
| 5 | Persistência em arquivos | Um Markdown por atividade; sem banco | Consultas em memória |
| 6 | Download pequeno e três sistemas | Client em Go | Protocolo escrito duas vezes, com vetores compartilhados |
| 7 | Gravação entre abas e editores | Web Locks e `rev` (hash do conteúdo) | Conflito é mostrado, nunca sobrescrito |
| 8 | Ver e editar planilhas no front, sob CSP, com anexos que não são confiáveis (2026-11-28) | `react-data-grid` para a grade e SheetJS para ler (pacote oficial de `cdn.sheetjs.com`; o do npm parou numa versão com falhas conhecidas). No XLSX só as células editadas são reescritas no XML. Descartados Jspreadsheet e Fortune-sheet, que executam código dinâmico | Formatação preservada no XLSX; sem cálculo de fórmulas na tela e sem inserir ou excluir linhas no meio; XLS e ODS viram cópia `.xlsx` |
| 9 | Executar uma atividade com uma IA, num terminal, sem abrir brecha de injeção (2026-11-28) | Programa reservado `plans-play <claude\|gemini> <id>`, atendido pelo próprio client: pedido fixo, só o id varia; no macOS um `.command` temporário, fora do projeto, aberto no Terminal. Descartado o front montar `osascript` ou shell com o texto do cartão | Passa pela mesma liberação local, e `--any-args` nele é seguro; IA nova exige mudar o client; sem Windows |
