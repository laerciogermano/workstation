# Prompts e comandos reutilizáveis

Salve cada bloco como `.claude/commands/<nome>.md` no monorepo. `$ARGUMENTS` é o que vier depois do comando.

## `/task` — implementar uma task do plano
```markdown
Implemente a task $ARGUMENTS do RoleGo Beta.

1. Leia em docs/11-plano-de-implementacao.md a linha da task (dependências, US, tamanho, nível de IA).
2. Leia as histórias e os cenários Gherkin citados em docs/02-historias/, os endpoints em docs/06-contratos-api.md,
   os diagramas em docs/07-diagramas.md e as telas T-xx em docs/12-prototipos.md.
3. Leia o código vizinho do módulo/feature para seguir os padrões existentes.
4. Se a task for 🟡 ou 🔴, ou se faltar alguma decisão: escreva um plano com arquivos, testes e perguntas e PARE.
5. Implemente na ordem: contracts → testes falhando (Gherkin) → domain → application → infra → http → web.
6. Rode `pnpm verify`.
7. Responda com: arquivos alterados, cenários cobertos (com o nome), suposições, pendências e riscos.
Não altere nada fora do escopo da task.
```

## `/new-endpoint` — novo endpoint contract-first
```markdown
Crie o endpoint $ARGUMENTS seguindo docs/06-contratos-api.md:
- schemas Zod de request/response em packages/contracts (+ códigos de erro novos, se houver);
- caso de uso com policy explícita e `viewer` recebido por parâmetro;
- controller fino com ZodValidationPipe e presenter;
- teste de integração (Testcontainers) e teste de contrato que valida a resposta no schema;
- atualização da tabela em docs/06-contratos-api.md.
```

## `/review-privacy` — revisão de privacidade do diff
```markdown
Revise o diff atual procurando vazamento de dados do RoleGo:
1. Algum evento é serializado sem passar pelo EventPresenter?
2. Algum caminho devolve street/number/cep/location de evento privado para quem não tem RSVP aprovado?
3. A distância de evento privado sai arredondada a 1 km?
4. Algum log, métrica, span ou payload do Faro/PostHog contém e-mail, nome, coordenadas, JWT ou refresh token?
5. Há checagem de autorização no caso de uso (não só no guard)?
Liste cada achado com arquivo:linha, cenário de exploração e correção sugerida.
```

## `/gherkin-to-tests` — cenários em testes
```markdown
Converta os cenários Gherkin de $ARGUMENTS em testes:
- regra pura → unit em domain;
- regra com banco/concorrência → integração;
- fluxo de usuário → Playwright em e2e/, com tag @US-xx.yy.
Use o mesmo título do cenário em cada teste. Os testes devem falhar antes da implementação.
```

## `/docs-drift` — divergência entre docs e código
```markdown
Compare docs/ com o código atual e liste as divergências em: rotas (06), tabelas/colunas (05), estados (E03),
erros (06 §10), telas (12). Para cada uma, diga qual lado parece correto e proponha a correção. Não altere nada.
```
