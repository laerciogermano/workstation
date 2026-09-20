# Desenvolvimento

Implementar **por IA** o que foi refinado — uma atividade (`tasks/`) por vez, na ordem do Gantt.

## Entradas

- Atividade da pasta [`tasks/`](../2.refinamento-tecnico/README.md) (nome da task; Entradas · Execução · Saídas)
- **Gantt das tasks** do projeto (ex.: [`7.tasks.md`](../../../screen-robot/7.tasks.md)) — ordem e dependências da árvore de execução
- Critérios de aceite (scenarios / BDDs)
- Desenho técnico / ADRs
- Repositório remoto do projeto
- Board / kanban do projeto ([`core/tasks`](../../tasks/README.md))

## Quem executa

**Tudo por IA (robôs).** Não há passo manual de código neste fluxo; a IA conduz clone → branch → TDD → implementação → teste → PR → status no board.

**Humano:** só valida (aprova / rejeita) a atividade em **Pendente aprovação**. O próximo robô **só entra em ação** depois dessa validação.

## Ordem: Gantt e árvore de execução

O desenvolvimento é **guiado pela ordem das atividades do Gantt das tasks** (e pela árvore de execução espelhada nele):

- Não pular barras / nós fora da sequência ou do paralelo permitido
- O “próximo passo” da árvore/Gantt só libera após validação humana da(s) atividade(s) predecessora(s)

### Sequencial vs paralelo

| Dependência no Gantt / árvore | Comportamento dos robôs |
|-------------------------------|-------------------------|
| **Sequencial** (`after …` / predecessor obrigatório) | Um robô **espera** o outro: só inicia quando a atividade anterior estiver **validada pelo humano** (Done após aprovação) |
| **Paralelo** (mesmo início / sem dependência entre si) | Robôs **podem paralelizar**: cada um faz seu ciclo e sobe **PRs separados**; cada um fica em Pendente aprovação; o **próximo** passo da árvore/Gantt só roda depois da aprovação humana necessária para destravar esse passo |

Em paralelo: vários PRs podem aguardar ao mesmo tempo; nenhum robô avança para o próximo nó da árvore/Gantt sem a validação humana que libera esse avanço.

## Padrão de branch

Igual ao nome da pasta da atividade:

```text
TSK-<nn>-<titulo>
```

| Parte | Regra | Exemplo |
|-------|--------|---------|
| Prefixo | `TSK-` | `TSK-` |
| `<nn>` | número da task (zero-pad) | `002` |
| `<titulo>` | kebab-case do nome | `subir-e-conectar` |

Exemplos: `TSK-002-subir-e-conectar` · `TSK-001-provisionar-agente`

## Padrão de escrita do pull request

O corpo do PR usa **sempre** estas duas seções (nesta ordem). Título do PR = mesmo padrão da branch, com espaço legível: `TSK-<nn> <titulo em palavras>`.

| Seção | O que precisa ter |
|-------|-------------------|
| **Summary** | 1–3 bullets: o *porquê* / efeito da mudança; referência à atividade (`TSK-…`); aceite coberto (SC/BDD) se houver |
| **Test plan** | Checklist acionável para o humano validar (comandos, cenários BDD, evidência esperada); itens marcáveis `- [ ]` |

Regras:

- Sem preâmbulo; sem listar arquivos sem motivo
- Summary = efeito; Test plan = como o revisor prova que fechou o aceite
- Um PR por atividade (paralelo → PRs separados)

### Exemplo

**Título:** `TSK-002 Subir e conectar`

```markdown
## Summary

- Fecha SC-01: sobe o runtime do agent e deixa o processo alcançável (`Reachable`)
- TDD unitário de `startRuntime` (origem SC-01) cobrindo `Absent` / `Starting` → `Reachable`
- Atividade: `TSK-002-subir-e-conectar` (pai `TSK-001`)

## Test plan

- [ ] Suíte unitária da SC verde no clone da pasta da task
- [ ] Casos: start a partir de ausente; já alcançável; falha `PROVISION_START_FAILED`
- [ ] Branch `TSK-002-subir-e-conectar`; card no board em **Pendente aprovação**
```

## Execução (por atividade / por robô)

Ordem **obrigatória** — não pular nem inverter:

1. **Baixar o projeto** — **clone** limpo (`git clone`) **dentro da pasta da atividade** em `tasks/` (ex.: `tasks/TSK-001-provisionar-agente/TSK-002-subir-e-conectar/`), isolado para esta task; o `README.md` da atividade permanece na pasta; o código do repo fica como subpasta do clone nessa mesma pasta. **Não** usar `git worktree`
2. **Criar a branch** — nome no [padrão](#padrão-de-branch) (= nome da pasta); publicar upstream quando houver push
3. **Criar os TDDs** — testes que falham e cobrem o aceite da atividade ([tipo por origem](#tipo-de-teste-por-origem))
4. **Implementar a funcionalidade** — código mínimo para os TDDs passarem e o aceite fechar
5. **Testar** — rodar a suíte relevante; só seguir com testes verdes
6. **Concluir no board** — abrir **pull request** da branch no [padrão de escrita](#padrão-de-escrita-do-pull-request) e mudar o status da atividade para **Pendente aprovação**
7. **Parar** — aguardar validação humana; **não** iniciar a próxima atividade do Gantt até essa aprovação

### Tipo de teste por origem

| Origem da atividade | Tipo de teste | Como |
|---------------------|---------------|------|
| **SC-** (cenário / mudança de estado) | **Unitário** | Isola o helper/módulo (deps mockáveis); sem runtime real / e2e |
| **US-** (história) | **BDD e2e** | Gherkin Dado/Quando/Então contra o sistema integrado |
| **EP-** (épico) | **BDD e2e** | Gherkin de ponta a ponta do aceite do épico |

Regras:

- Task cuja origem é **SC** → só unitários (TDD no módulo interno)
- Task cuja origem é **US** ou **EP** → BDD e2e (aceite integrado)
- Não misturar: SC não sobe e2e; US/EP não fecham só com unitário

### Onde fica o clone

```text
tasks/
└── TSK-001-provisionar-agente/
    └── TSK-002-subir-e-conectar/   ← pasta da atividade
        ├── README.md
        └── <repo>/                  ← clone do projeto (`git clone`; sem worktree)
```

Regras transversais:

- Preferência: uma SC (ou atividade folha) por robô / ciclo
- Lote: primeiro um caso, validar; só então escalar
- Commits pequenos e revisáveis; CI do projeto deve passar no PR
- Testes: [tipo por origem](#tipo-de-teste-por-origem) (SC = unitário · US/EP = BDD e2e)

## Status no board

| Status | Quando |
|--------|--------|
| Todo | Ainda não iniciada (ou bloqueada por predecessor) |
| Doing | Robô em clone/branch/TDD/implementação/teste |
| **Pendente aprovação** | PR aberto; **aguarda validação humana** |
| Done | Humano aprovou; PR mergeado — libera sucessores no Gantt |

## Saídas

- Branch no padrão `TSK-<nn>-<titulo>`
- TDDs no [tipo por origem](#tipo-de-teste-por-origem) + implementação + evidência de testes verdes
- Pull request aberto
- Atividade no board em **Pendente aprovação**
- Próximo robô / próximo passo do Gantt: **somente após validação humana**
