# Discovery

Entender o problema e fechar o *quê* do produto antes do refinamento técnico.

Artefato único: o [documento de funcionalidades](funcionalidades.md).

## Ordem de ataque

1. **Primeiro** — atacar **funcionalidades** e **estórias**: mapear o produto em épicos → estórias → cenários até o catálogo estar fechado e validado.
2. **Depois** — **separar cada estória** e seguir, **por estória**, os passos do [processo](../README.md): discovery (detalhe da US) → refinamento técnico → desenvolvimento → testes → implantação → manutenção.

Não atravessar o ciclo completo no produto inteiro de uma vez. O discovery fecha o mapa; a execução do processo é **por estória**.

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
| **Cenários** | ID `SC-XX` + mudança de estado (obrigatório ≥1; pode ser só um); cada um é unidade de teste e de paralelismo |

**Cenário** = mudança de estado (estado anterior → ação → estado resultante) **e** unidade testável/paralelizável exigida para completar a estória.

Exemplo — estória **Criar usuário** (no épico Autenticação ou equivalente):

| ID | Cenário | Mudança de estado |
|----|---------|-------------------|
| SC-01 | Clicar no botão criar | Lista → modal aberto |
| SC-02 | Digitar o nome | Modal sem nome → modal com nome visível |
| SC-03 | Clicar em salvar | Botão ativo → carregando/inativado → janela fechada e unidade salva na lista |

Modelo e regras: [`funcionalidades.md`](funcionalidades.md).

## Próximo passo

Com o catálogo fechado: **uma estória por vez** → [Refinamento técnico](../refinamento-tecnico/README.md) (e demais fases do [processo](../README.md)).
