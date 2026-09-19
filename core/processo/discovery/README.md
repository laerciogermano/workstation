# Discovery

Entender o problema e fechar o *quê* do produto antes do refinamento técnico.

Artefato único: o [documento de funcionalidades](funcionalidades.md).

## Hierarquia

| Nível | ID | O que é | Critério |
|-------|-----|---------|----------|
| **Épico** | EP- | Conjunto de estórias | Entrega **valor** observável ao usuário/negócio |
| **Estória** | US- | Função / operação **completa** do usuário | Uma capacidade fechada (início → fim) |
| **Cenário** | SC- | Mudança de **estado** + unidade **testável** e **paralelizável** | Estado A → ação → estado B; aceite e trabalho isoláveis. Toda US tem ≥1 SC (pode ser só um) |

Uma estória sozinha pode não entregar valor. O épico é o recorte mínimo em que o conjunto de estórias passa a entregar.

Exemplo — **épico Autenticação**: login isolado não entrega valor (não há como criar conta); login + cadastro juntos formam o épico.

```text
EP-01 — Autenticação          ← valor (entrar no produto)
├── US-01 — Cadastrar         ← operação completa
│   ├── SC-01.1 Abrir formulário
│   ├── SC-01.2 Preencher dados
│   └── SC-01.3 Confirmar cadastro
└── US-02 — Fazer login       ← operação completa
    ├── SC-02.1 Abrir formulário
    ├── SC-02.2 Preencher credenciais
    └── SC-02.3 Sessão autenticada
```

## Entradas

- Demanda, ideia ou problema reportado
- Contexto de negócio e restrições conhecidas
- Stakeholders e usuários envolvidos
- Dados existentes (métricas, feedback, concorrência)

## Execução

- Mapear problema, usuários e valor esperado
- Delimitar escopo (in / out)
- Recortar **épicos** (conjuntos de estórias que entregam valor)
- Para cada épico, listar as **estórias** (operações completas do usuário)
- Para cada estória, listar os **cenários** (obrigatório; no mínimo um — pode ser só um se a operação for uma única mudança de estado)
- Validar o conjunto com stakeholders

## Saídas

### Documento de funcionalidades

Catálogo organizado em **épicos → estórias → cenários**.

| Campo | Conteúdo |
|-------|----------|
| **Épico** | Valor entregue pelo conjunto de estórias |
| **Estória** | Operação completa do usuário (ex.: criar usuário, fazer login) |
| **Cenários** | ID `SC-<US>.<n>` + mudança de estado (obrigatório ≥1; pode ser só um); cada um é unidade de teste e de paralelismo |

**Cenário** = mudança de estado (estado anterior → ação → estado resultante) **e** unidade testável/paralelizável exigida para completar a estória.

Exemplo — estória **Criar usuário** (no épico Autenticação ou equivalente):

| ID | Cenário | Mudança de estado |
|----|---------|-------------------|
| SC-01.1 | Clicar no botão criar | Lista → modal aberto |
| SC-01.2 | Digitar o nome | Modal sem nome → modal com nome visível |
| SC-01.3 | Clicar em salvar | Botão ativo → carregando/inativado → janela fechada e unidade salva na lista |

Modelo e regras: [`funcionalidades.md`](funcionalidades.md).

## Próximo passo

→ [Refinamento técnico](../refinamento-tecnico/README.md) — arquitetura, riscos e backlog técnico a partir do documento de funcionalidades
