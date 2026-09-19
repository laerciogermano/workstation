# Discovery

Entender o problema e fechar o *quê* do produto antes do refinamento técnico.

## Ordem dos artefatos

Ordem **obrigatória** — não pular nem inverter:

1. **Stories** — [`1.stories.md`](1.stories.md): US com título + descrição de como funciona.
2. **Epics** — [`2.epics.md`](2.epics.md): EP que agrupam US e entregam valor.
3. **Cenários** — [`3.scenarios.md`](3.scenarios.md): catálogo EP → US → SC (sem Gherkin).
4. **BDDs** — [`4.bdds.md`](4.bdds.md): Dado / Quando / Então por **US** e por **SC**.
5. **Protótipo** — [`5.prototype.md`](5.prototype.md): validação visual/interativa do que foi especificado.
6. **Roadmap** — [`6.roadmap.md`](6.roadmap.md): Gantt EP → US (sem SC nas barras).
7. **Tasks** — `tasks.md` do projeto: Gantt TSK (inclui SC) + inventário.

A **visão do produto** (problema, para quem, objetivo, fora de escopo) fica no `README.md` do projeto.

Só depois disso: **separar cada estória** e seguir, **por estória**, os passos do [processo](../README.md): refinamento técnico → desenvolvimento → testes → implantação → manutenção.

Não atravessar o ciclo completo no produto inteiro de uma vez. O discovery fecha o mapa; a execução do processo é **por estória**.

## Hierarquia (no artefato de cenários)

| Nível | ID | O que é | Critério |
|-------|-----|---------|----------|
| **Épico** | EP- | Conjunto de estórias | Entrega **valor** observável ao usuário/negócio |
| **Estória** | US- | Função / operação **completa** do usuário | Uma capacidade fechada (início → fim) |
| **Cenário** | SC- | Mudança de **estado** + unidade **testável** e **paralelizável** | Estado A → ação → estado B; aceite e trabalho isoláveis. Toda US tem ≥1 SC (pode ser só um) |

Uma estória sozinha pode não entregar valor. O épico é o recorte mínimo em que o conjunto de estórias passa a entregar.

```text
EP-01 — Autenticação          ← valor (entrar no produto)
├── US-01 — Cadastrar         ← operação completa
│   ├── SC-01 Abrir formulário
│   ├── SC-02 Preencher dados
│   └── SC-03 Confirmar cadastro
└── US-02 — Fazer login       ← operação completa
    ├── SC-04 Abrir formulário
    ├── SC-05 Preencher credenciais
    └── SC-06 Sessão autenticada
```

## Entradas

- Demanda, ideia ou problema reportado
- Contexto de negócio e restrições conhecidas
- Stakeholders e usuários envolvidos
- Dados existentes (métricas, feedback, concorrência)

## Execução

1. Escrever as **stories** (US título + como funciona)
2. Agrupar em **epics** (valor por EP)
3. Derivar **cenários** (EP → US → SC com entradas/execução/saídas)
4. Escrever **BDDs** (Gherkin alinhado a cada US/SC)
5. Produzir o **protótipo** (validar o *quê* com stakeholders)
6. Montar o **roadmap** (EP/US)
7. Montar as **tasks** (TSK + SC no Gantt)

## Saídas

| Ordem | Artefato | Conteúdo |
|-------|----------|----------|
| 1 | [`1.stories.md`](1.stories.md) | US título + descrição |
| 2 | [`2.epics.md`](2.epics.md) | EP → lista de US |
| 3 | [`3.scenarios.md`](3.scenarios.md) | EP → US → SC |
| 4 | [`4.bdds.md`](4.bdds.md) | Aceite Gherkin por US e SC |
| 5 | [`5.prototype.md`](5.prototype.md) / protótipo do projeto | Validação visual/interativa |
| 6 | [`6.roadmap.md`](6.roadmap.md) / roadmap do projeto | Gantt EP/US |
| 7 | `tasks.md` do projeto | Gantt TSK + inventário |

## Próximo passo

Com stories → epics → cenários → BDDs → protótipo → roadmap → tasks fechados: **uma estória por vez** → [Refinamento técnico](../2.refinamento-tecnico/README.md) (e demais fases do [processo](../README.md)).
