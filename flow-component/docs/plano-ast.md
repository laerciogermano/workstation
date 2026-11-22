# Plano de implementação — Árvore de componentes (Flow AST)

Escopo (item do `todo`): **código → AST**, **AST → código**, **AST → visão**, **visão → AST**.
Status: rascunho v0.1 (2026-11-22). Baseado na leitura de `flow-component/{src,novo,docs}`, `flow-language/README`, `flow-dev/docs` e `flow-dev/app/packages/shared`.

---

## 1. Recomendação (resumo)

1. **Uma AST só, no centro (hub-and-spoke).** Nenhum conversor fala com outro: `código ⇄ AST ⇄ visão`. São 4 conversores, todos contra o mesmo schema.
2. **A AST é a árvore do `flow-component/novo/model.ts`**, promovida a pacote público (`src/ast/`). Ela já é uma árvore (`Fn | IfB | ForB | TryB`, cada bloco com listas `kids`/`elseKids`/`catchKids`), já tem `apply(Project, Command)` e já tem codegen TS com mapa `id → linhas`. O modelo relacional antigo (`src/types.ts` `Snapshot`: `links`, `structs`, `inLoop`, `inCatch`, `onError`) vira só um **adapter** para o Flow.dev. Não criar um terceiro modelo.
3. **Visão nunca edita a AST diretamente**: todo gesto no canvas é um `Command` → `apply` devolve `{ ast, patch, inverse }`. Isso dá undo/redo, log, sincronia com o editor de código e o mesmo contrato do PRD (§7).
4. **Código → AST nunca falha**: o que o parser não entende vira nó `raw` (texto original preservado), exibido como função abstrata/opaca. Subconjunto cresce por fases.
5. **Parser: TypeScript Compiler API** (já é `devDependency`; cobre JS e TS, que são os alvos do codegen) atrás de uma interface `Parser`, para trocar/adicionar Python depois sem tocar a AST.
6. **Garantia de round-trip só para o “dialeto Flow”** (código gerado pelo próprio Flow). Para código arbitrário, `parse → print` **não** devolve o mesmo texto (o codegen impõe `state`, wrappers, `await`, etc.). Preservar o texto original exige a fase 5 (reimpressão por trechos). Esta é a decisão de produto mais importante — ver §8.

## 2. O que já existe (reaproveitar)

| Peça | Onde | Papel na AST |
|---|---|---|
| Modelo em árvore (`Fn`/`IfB`/`ForB`/`TryB`, `Project`) | `novo/model.ts` | **Schema base da AST** |
| Comandos tipados + `apply` | `novo/model.ts` (`Command`), `src/commands.ts`, `src/execute.ts` | Visão → AST |
| Codegen TS/JS com `map: id → [linhaIni, linhaFim]` | `novo/codegen.ts` (`generate`) | AST → código (+ sincronia código↔visão) |
| Layout/cena sem DOM | `novo/layout.ts`, `src/view/scene.ts` (`buildScene`) | AST → visão |
| Render | `novo/view.ts`, `src/view/flow-view.ts` | Só desenha a cena |
| Expressão ⇄ rascunho (`buildArg`/`inferArg`, `from:file#name`) | `novo/args.ts` | Mini-parser de expressão; substituir por parse real |
| Contratos de lib (`Contract`, `contracts`) | `novo/model.ts`, `example/contracts.js` | Resolver `lib.task(...)` → agente/ins/outs |
| Projetos de exemplo | `novo/sample.ts` (11 funções), `novo/docs-examples.ts` | **Corpus de testes** |
| Testes de codegen, typecheck do código gerado, execução | `test/novo/{codegen,typecheck,run,e2e}` | Base do teste de round-trip |
| Export IR/JS/TS/PY (modelo relacional) | `flow-dev/app/packages/shared/src/codegen.ts` | Referência para o alvo Python e para o adapter |
| Contratos Zod | `flow-dev/app/packages/shared/src/contracts.ts` | Espelhar validação do schema |

**Lacuna principal:** não existe nada de código → AST. O codegen não é injetivo (`let`/`const`, `Promise.all`, wrappers de lib, `humans.ask`), então o parser não é “o codegen ao contrário”: precisa de uma fase de **reconhecimento** (§5).

**Lote 1 entregue:** `novo/ast/fn-svg.ts` — `renderFnSvg(Fn) → SVG` (só funções). Demo: [`indice-ast.html`](indice-ast.html) (função `main`). Bundle: `docs/fn-svg.js` via `npm run example:build`.

## 3. Arquitetura

```text
                 ┌───────────── Parser (ts / py) ─────────────┐
 código-fonte ──►│ parse → normalize → lift → resolve → diag  │──┐
                 └────────────────────────────────────────────┘  │
                                                                 ▼
                      ┌─────────────────────────────────────────────┐
  Comandos da UI ───► │  Flow AST  (JSON, versionado, ids estáveis) │ ◄── adapter Snapshot (flow-dev)
  (apply → patch)     └─────────────────────────────────────────────┘
                          │                         │
                          ▼                         ▼
                 Printer (ts / js / py)        Scene builder (puro)
                 + map id ⇄ ranges             layout + ids → Scene
                          │                         │
                          ▼                         ▼
                      código-fonte             render (SVG/DOM, host)
```

Pacote (zero DOM, conforme PRD §8): `flow-component/src/ast/`

```text
ast/
  schema.ts      tipos + zod + versão do schema ("flow-ast/1")
  ids.ts         política de ids (estáveis, determinísticos no parse)
  walk.ts        visit / map / locate / path ⇄ id
  patch.ts       Patch, inverse, applyPatch, diff(astA, astB)
  commands.ts    Command → Patch   (vem de novo/model.ts `apply`)
  print/         emitter por linguagem (ts.ts, js.ts, py.ts) + map de ranges
  parse/         parser por linguagem  (ts.ts, py.ts) + lift/ resolve/ diag
  view/          buildScene(ast, flags) → Scene (já existe em src/view)
  corpus/        fixtures: samples, docs-examples, flows do editor
```

## 4. Schema da AST (decisões)

- Nós: `fn` (função: raiz, filha, abstrata, de lib, de pessoa, de arquivo), `if`, `for`, `try`; **extensível por registro** (`NodeKind` + handler de parse/print/scene) para entrar `while`, `switch`, `do-while` (todos no `todo`).
- Novo nó **`raw`**: `{ t: "raw", id, text, lang, ins, outs }` — trecho que o parser não lifta. Imprime verbatim; na visão, função abstrata com indicação “código”.
- Cada nó guarda `src?: { file, start, end }` (offsets do texto de origem) e `trivia?` (comentários) — só o necessário para a fase 5; opcional no schema desde já.
- `ins`/`outs`/`args` como já estão (`args[name]` = expressão TS; `from:file#name` para import). Trocar a string por `Expr` estruturado só se a fase 3 mostrar necessidade (começar com string + validação via parse).
- **Ids**: no `apply`, mantêm o gerador atual. No parse, ids **determinísticos** (`hash(caminho + título + ordinal)`) e **reaproveitados por diff** na reparse: editar uma linha não pode trocar o id do resto (senão seleção, zoom e `map` na visão se perdem).
- `Project` serializa em JSON puro (`flow-ast/1`), com `migrate(v→v+1)`. Contrato Zod espelha `contracts.ts`.
- Invariantes validáveis (`validate(ast): Diagnostic[]`): ids únicos; raiz com `file`; `outs` sem colisão no fluxo; nome de função ≠ nome de dado (regra já existente no codegen); `try` só com `catchKids` quando há tratamento.

## 5. Os quatro conversores

### 5.1 AST → código (printer)
Refatorar `generate()` em 3 etapas, sem mudar a saída (testes atuais são a rede de segurança):
1. **Análise** (pura): nomes únicos, `produced/needed`, `declAt`, `writers`, `fromState` → estrutura `Plan`.
2. **Emissão**: `Emitter` por linguagem recebe o `Plan` e produz linhas + `map`.
3. **Mapa**: `id → { lines, cols }` (hoje só linhas) para destacar na visão e navegar visão → código.

Python entra como segundo `Emitter` reaproveitando a análise (referência: `flow-dev/.../shared/codegen.ts` `py`).

### 5.2 Código → AST (parser) — a parte nova e difícil
Pipeline, cada estágio testável isolado:

| Estágio | O que faz |
|---|---|
| **parse** | `Parser.parse(text, lang)` → árvore da linguagem + posições (TS Compiler API). Erros de sintaxe viram `Diagnostic`, mantendo a última AST boa. |
| **normalize** | Remove andaime do próprio Flow (imports de `lib`, `state`, wrappers, stubs, `humans`, `Promise.all` de grupo) — é o que torna o dialeto reconhecível 1:1. |
| **lift** | Tabela de padrões → nós (abaixo). |
| **resolve** | Dados: variáveis livres → `ins`; destructuring/atribuição → `outs`; `import` → agente `file:`/`lib` e `from:file#name`; `import * as x` / globais (`console`, `Math`) → agentes de lib conhecidos (`contracts`). |
| **fallback** | O que sobra vira `raw` com os dados que tocam (ins/outs aproximados por identificadores livres — `exprIdents` já existe). |

Tabela de lifting (v1):

| Código | Nó |
|---|---|
| `function f(a, b) { … }` / `export const f = async (…) => {…}` top-level | `fn` raiz (`file` = arquivo; params → `ins`; `return {x}` / `return x` → `outs`) |
| `lib.task(args)` · `console.log(...)` | `fn` filha, agente = lib, `args` por contrato |
| `const { a, b } = await g(x)` · `a = await g(x)` | `fn` com `outs` |
| `f2()` local declarada no mesmo arquivo | `fn` de arquivo (composição se tiver corpo com chamadas) |
| `await Promise.all([a(), b()])` | irmãs com `par: true` |
| `if (t) {…} else {…}` | `if` (`kids` / `elseKids`) |
| `for (const v of c) {…}` | `for` (`v`, `coll`) |
| `try {…} catch (e) {…}` | `try` (`kids` / `catchKids`) |
| `while`, `switch`, `for(;;)`, `do-while`, classes, closures complexas | `raw` (v1) → nós próprios depois |

**Duas camadas de ambição** (decisão do §8): (a) *dialeto Flow* — exato, round-trip garantido; (b) *TS idiomático* — melhor esforço, com `raw` como válvula.

### 5.3 AST → visão
Já existe `buildScene`/`layout`. Trabalho: (1) tornar `buildScene(ast, flags)` a única porta (puro, determinístico, sem DOM); (2) a Scene carrega `id` de AST em todo elemento desenhável (hit-test devolve ids, nunca coordenadas); (3) `raw` e diagnósticos têm representação; (4) `diff(sceneA, sceneB)` por id para atualizar sem redesenhar tudo (necessário para o modo tempo real do `flow-language`).

### 5.4 Visão → AST
Cada gesto da tabela do PRD §5 = um `Command` (`createChild`, `wrap if/for/try`, `setArg`, `move`, `paste`…). Mudança: `apply` passa a devolver `{ ast, patch, inverse }`. A visão só emite comandos; quem decide é a AST (validação com `FlowError`, já existe). “Desenhar” um laço/seleção = `wrap`/`unwrap` sobre listas, que é o que o modelo em árvore já torna uniforme.

### 5.5 Sincronia código ⇄ visão (modo tempo real)
- Visão edita → `apply` → patch → reimprime (fase 2: arquivo todo; fase 5: só o trecho do nó via `src`).
- Código edita (debounce) → parse → `diff` com a AST atual **por id estável** → patch → cena. Erro de sintaxe: mantém a AST anterior e mostra diagnóstico no trecho.
- Fonte da verdade é a **AST**; o painel de código é projeção. Em conflito simultâneo, vence a última edição, sem merge.

## 6. Fases

| Fase | Entrega | Pronto quando | Tamanho |
|---|---|---|---|
| **0 · Spec** | `docs/ast.md`: schema, nós, ids, `raw`, invariantes, matriz de padrões do §5.2; decisão do §8 | Revisada e congelada v1 | S |
| **1 · Núcleo AST** | `src/ast/` com schema+zod, ids, walk, validate, serialização `flow-ast/1`, `Patch`/`inverse`; `apply` devolve patch; `novo/` passa a importar de `ast/` | Testes de `novo/model` verdes sobre o novo pacote; JSON de `sampleProject` faz round-trip exato; undo/redo por inverse | M |
| **2 · AST → código** | `generate` em Análise/Emitter/Mapa; `map` com colunas; modo `js`/`ts` preservados | Saída **byte-idêntica** à atual em todo o corpus; `typecheck.test` e `run.test` verdes | M |
| **3a · Código → AST (dialeto Flow)** | Parser TS: normalize + lift + resolve para o código gerado | **`parse(print(ast)) ≅ ast`** para todo o corpus e para ASTs geradas por propriedade | L |
| **3b · Código → AST (TS idiomático)** | Imports, destructuring, `Promise.all`, libs globais, `raw` | Corpus de “código humano” (samples escritos à mão) vira AST sem exceção; 100% do texto coberto por nó ou `raw` | L |
| **4 · Visão ⇄ AST** | `buildScene` única porta; ids na Scene; comandos de todo o PRD §5.1–5.3 emitindo patch | Cada comando testado sem DOM; `view.test` verde; hit-test devolve ids | M |
| **5 · Tempo real e fidelidade** | Diff de AST por id, diagnósticos, reimpressão por trecho (`src`), preservação de comentários/formatação | Editar 1 linha altera só os nós daquela linha; código fora do trecho permanece verbatim | L |
| **6 · Hosts e linguagens** | Adapter `Snapshot ⇄ AST` (Flow.dev), integração no editor do `flow-language`, CLI `flow parse|print`, emitter/parser Python, nós `while`/`switch` | Dois hosts usam o mesmo pacote sem fork (PRD §9.4) | M–L |

Ordem recomendada: **0 → 1 → 2 → 3a → 4 → 3b → 5 → 6**. A 3a antes da 4 fecha o ciclo completo cedo (ASTs geradas por propriedade vão ao código e voltam), e a 4 já roda sobre a AST estabilizada.

## 7. Testes (o que torna isso seguro)

1. **Golden**: AST do corpus → código → snapshot (garante que o refactor da fase 2 não muda nada).
2. **Round-trip AST** (propriedade, `fast-check`): gerador de `Project` válidos; `parse(print(a))` normalizado `≅ a`. Normalizar = ordenar `outs` irrelevantes, descartar ids.
3. **Round-trip código (dialeto)**: `print(parse(c)) === c` para todo `c` gerado.
4. **Corpus**: `novo/sample.ts` (11 funções), `docs-examples.ts`, fluxos do `flow-language/editor/artigo-flows.js`, demo do `flow-dev`, UCs de `flow-language/docs/requisitos`. Todo fluxo de documentação vira fixture.
5. **Semântica preservada**: o código reimpresso passa no `typecheck.test.mjs` e produz a mesma saída no `run.test.mjs` que o original.
6. **Visão**: `buildScene` determinístico (mesma AST → mesma Scene); comandos → patch → inverse devolve a AST original.
7. **Robustez do parser**: fuzz com código TS aleatório/quebrado: nunca lança, sempre devolve AST + diagnósticos.

## 8. Decisões que precisam do seu aval

| # | Decisão | Recomendação | Alternativa / custo |
|---|---|---|---|
| D1 | AST = árvore de `novo/` (em vez do `Snapshot` relacional) | **Sim.** Menos marcas soltas, regras de bloco uniformes | Manter relacional: mais adapters, `inLoop/inCatch/onError` em toda regra |
| D2 | Escopo do parser v1 | **Dialeto Flow exato (3a) primeiro**, TS idiomático depois (3b) | Pular 3a: entrega mais “visível”, mas sem garantia de round-trip |
| D3 | Código de usuário depois de editar na visão | **Fase 5**: reimprimir por trecho preservando o resto | Só regenerar o arquivo todo: simples, mas descarta formatação/comentários do usuário |
| D4 | Parser | **TS Compiler API** atrás de `Parser` | `acorn`/`oxc`/`tree-sitter` se o peso no navegador (~MB) for problema; tree-sitter se Python vier junto |
| D5 | `Expr` (args/test/coll) | Começar como **string validada por parse** | `Expr` estruturado: mais robusto, mexe em `args.ts`, codegen e UI de uma vez |
| D6 | Nome | **“Flow AST”**, schema `flow-ast/1` | — |

## 9. Riscos

| Risco | Mitigação |
|---|---|
| Codegen não injetivo → mesma AST com impressões diferentes | Definir **forma canônica** na fase 0; parse só reconhece a canônica no dialeto |
| Fluxo implícito do código (efeitos colaterais, mutação, closures) não cabe em “dados + funções” | `raw` + diagnóstico “fora do modelo”; não inventar semântica |
| Ids instáveis entre reparse | Ids determinísticos + diff com casamento por caminho/ordem; teste dedicado |
| Parser pesado no navegador | Interface `Parser`; carregamento lazy; rodar no worker |
| Escopo crescer (Python, while, switch) antes do núcleo estabilizar | Fases 0–4 só TS/JS; novos nós via registro (fase 6) |
| Dois modelos vivos (`src` e `novo`) divergirem durante a migração | Fase 1 move `novo` para `ast/` num passo só e deixa `src/types.ts` atrás de adapter |

## 10. Primeiro passo concreto (dias 1–2)

1. Escrever `docs/ast.md` (fase 0) com a matriz do §5.2 preenchida contra o `sample.ts`.
2. Criar `src/ast/schema.ts` movendo os tipos de `novo/model.ts` (sem mudar comportamento) + teste de serialização.
3. Escrever o **teste de round-trip vermelho** (`parse(print(sample)) ≅ sample`) já na fase 1 — ele guia 2 e 3a.
