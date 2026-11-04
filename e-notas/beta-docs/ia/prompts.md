# Prompts e comandos reutilizáveis para notinhas.shop

Comandos padronizados para execução de tarefas de desenvolvimento com agentes de IA no ecossistema do **notinhas.shop**. Salve cada bloco como `.cursor/commands/<nome>.md` ou `.claude/commands/<nome>.md` conforme o ambiente. A variável `$ARGUMENTS` recebe os parâmetros passados após o comando.

## `/task` — Implementar uma tarefa do plano `BETA-nnn`
```markdown
Implemente a tarefa $ARGUMENTS do notinhas.shop Beta.

1. Consulte em beta-docs/11-plano-de-implementacao.md a linha da tarefa correspondente (dependências, US, tamanho e nível de IA).
2. Leia a história de usuário e os cenários Gherkin em beta-docs/02-historias/, os endpoints em beta-docs/06-contratos-api.md,
   os diagramas de sequência em beta-docs/07-diagramas.md e o protótipo correspondente T-xx em beta-docs/12-prototipos.md.
3. Inspecione o código vizinho para manter a consistência com a arquitetura Express modular e os padrões do repositório.
4. Se a tarefa estiver categorizada como 🟡 ou 🔴, ou se houver decisão ambígua: escreva um plano sucinto com arquivos a alterar, testes e perguntas antes de modificar o código.
5. Implemente na ordem canônica:
   a) Schemas Zod de entrada/saída em shared/contracts;
   b) Testes de especificação (Gherkin) que falham inicialmente;
   c) Lógica pura de domínio (regras de menor preço, split, ranking);
   d) Casos de uso e adaptadores de banco / SEFAZ / Nominatim;
   e) Handlers Express enxutos e presenters de dados;
   f) Componentes e telas de frontend (respeitando os tokens --nt-* e os protótipos T-xx).
6. Garanta a REGRA SAGRADA da marca: NENHUM texto da UI pode conter o termo "e-notas", exibindo unicamente "notinhas.shop".
7. Execute o comando de validação local: npm run verify.
8. Responda com: resumo dos arquivos alterados, cenários de teste cobertos, suposições assumidas e riscos residuais.
Não modifique arquivos fora do escopo estrito da tarefa.
```

## `/new-endpoint` — Novo endpoint contract-first
```markdown
Crie o endpoint $ARGUMENTS seguindo estritamente as diretrizes de beta-docs/06-contratos-api.md e beta-docs/08-boas-praticas-codigo.md:
- Schemas Zod de request (body, query, params) e response em shared/contracts (+ códigos de erro de negócio específicos);
- Caso de uso isolado com autorização explícita e regras puras de domínio;
- Controller Express fino (≤ 20 linhas) com validação via Zod e serialização via Presenter;
- Descarte imediato de qualquer dado pessoal do consumidor (CPF ou nome de cupom fiscal);
- Teste de integração com PostgreSQL real (schema enotas) e teste de contrato validando a resposta contra o schema Zod;
- Atualização da tabela de endpoints em beta-docs/06-contratos-api.md.
```

## `/review-privacy` — Auditoria de privacidade e LGPD no diff
```markdown
Revise minuciosamente o diff atual procurando potenciais vazamentos de dados ou violações de privacidade no notinhas.shop:
1. Algum dado de consumidor da NFC-e (CPF, nome em cupom) está sendo gravado no banco ou emitido em logs?
2. Algum endpoint do catálogo público (/api/itens, /api/produtos, /api/estabelecimentos) expõe o identificador de quem fez o upload da nota?
3. A rota de extrato financeiro pessoal (/api/extrato) está estritamente protegida por autenticação, impedindo que um usuário veja compras de outro?
4. Coordenadas de geolocalização do usuário estão sendo truncadas a 3 casas decimais e protegidas contra persistência contínua indevida?
5. A URL da nota fiscal enviada no endpoint POST /api/nota é validada contra uma lista branca de domínios oficiais da SEFAZ PR (prevenção de SSRF)?
6. Existe alguma ocorrência inadvertida do termo "e-notas" nas telas ou textos voltados ao consumidor final?
Apresente cada achado no formato arquivo:linha, descrevendo o cenário de vulnerabilidade e sugerindo a correção necessária.
```

## `/gherkin-to-tests` — Converter cenários BDD em testes automatizados
```markdown
Converta os cenários Gherkin de $ARGUMENTS em testes automatizados executáveis:
- Regras puras de cálculo de menor preço, percentual de desconto ou score de ranking → testes unitários rápidos em Vitest;
- Persistência, deduplicação de notas (44 dígitos), constraints UNIQUE ou concorrência em EAN → testes de integração com PostgreSQL real (schema enotas);
- Fluxos de escaneamento de QR Code (ao vivo / foto), navegação entre abas e modal de EAN → testes E2E com Playwright em viewport móvel (390×844), marcados com a tag @US-xx.yy.
Utilize exatamente o mesmo título do cenário BDD em cada caso de teste. Os testes devem falhar antes da implementação da funcionalidade.
```

## `/docs-drift` — Identificar divergências entre documentação e código
```markdown
Compare a documentação canônica em beta-docs/ com a base de código atual e aponte divergências nos seguintes pontos:
1. Endpoints REST implementados no Express versus contratos declarados em 06-contratos-api.md;
2. Tabelas, colunas, chaves estrangeiras e constraints do schema enotas versus 05-modelo-de-dados.md;
3. Tratamento de códigos de erro Problem Details versus catálogo de erros em 06-contratos-api.md;
4. Nomes de componentes e fluxos de tela versus inventário de telas T-xx em 12-prototipos.md;
5. Regras de negócio adicionadas no código que não constam em requisitos.md ou 01-prd.md.
Para cada divergência encontrada, indique qual fonte deve ser considerada correta e proponha o ajuste para eliminação do desvio.
```
