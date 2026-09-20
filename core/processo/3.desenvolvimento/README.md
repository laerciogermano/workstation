# Desenvolvimento

Implementar **por IA** o que foi refinado — uma atividade (`tasks/`) por vez, na ordem do Gantt.

## Entradas

- Atividade da pasta [`tasks/`](../2.refinamento-tecnico/README.md) (nome da task; Entradas · Execução · Saídas)
- **Gantt das tasks** do projeto (ex.: [`7.tasks.md`](../../../connectmax/screen-robot/7.tasks.md)) — ordem e dependências da árvore de execução
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

```text
task/<ID>-<slug>
```

| Parte | Regra | Exemplo |
|-------|--------|---------|
| Prefixo | sempre `task/` | `task/` |
| `<ID>` | ID da atividade em execução (preferir SC-; senão US-/EP-/TSK-) | `SC-01` |
| `<slug>` | kebab-case do nome da atividade | `subir-conectar-android` |

Exemplos: `task/SC-01-subir-conectar-android` · `task/US-01-provisionar-um-agente` · `task/TSK-002-subir-e-conectar`

## Execução (por atividade / por robô)

Ordem **obrigatória** — não pular nem inverter:

1. **Baixar o projeto** — clone (ou worktree) limpo **dentro da pasta da atividade** em `tasks/` (ex.: `tasks/provisionar-agente/subir-e-conectar/`), isolado para esta task; o `README.md` da atividade permanece na pasta; o código do repo fica como subpasta do clone nessa mesma pasta
2. **Criar a branch** — nome no [padrão](#padrão-de-branch); publicar upstream quando houver push
3. **Criar os TDDs** — testes que falham e cobrem o aceite da atividade (Entradas · Execução · Saídas / BDD)
4. **Implementar a funcionalidade** — código mínimo para os TDDs passarem e o aceite fechar
5. **Testar** — rodar a suíte relevante; só seguir com testes verdes
6. **Concluir no board** — abrir **pull request** da branch e mudar o status da atividade para **Pendente aprovação**
7. **Parar** — aguardar validação humana; **não** iniciar a próxima atividade do Gantt até essa aprovação

### Onde fica o clone

```text
tasks/
└── <nome-da-task>/              # ex.: provisionar-agente
    └── <nome-da-filha>/         # ex.: subir-e-conectar  ← pasta da atividade
        ├── README.md
        └── <repo>/              ← projeto baixado aqui (clone/worktree)
```

Regras transversais:

- Preferência: uma SC (ou atividade folha) por robô / ciclo
- Lote: primeiro um caso, validar; só então escalar
- Commits pequenos e revisáveis; CI do projeto deve passar no PR

## Status no board

| Status | Quando |
|--------|--------|
| Todo | Ainda não iniciada (ou bloqueada por predecessor) |
| Doing | Robô em clone/branch/TDD/implementação/teste |
| **Pendente aprovação** | PR aberto; **aguarda validação humana** |
| Done | Humano aprovou; PR mergeado — libera sucessores no Gantt |

## Saídas

- Branch no padrão `task/<ID>-<slug>`
- TDDs + implementação + evidência de testes verdes
- Pull request aberto
- Atividade no board em **Pendente aprovação**
- Próximo robô / próximo passo do Gantt: **somente após validação humana**
