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
