# Documento de funcionalidades

Artefato do [discovery](README.md). Fonte de verdade do *quê* do produto.

## Regras

1. Organizar o produto em **épicos → estórias → cenários**.
2. Cada **épico** (EP-) é um conjunto de estórias que, juntas, entregam **valor**. Uma estória isolada pode não bastar (ex.: login sem cadastro).
3. Cada **estória** (US-) é uma **função / operação completa** do usuário (ex.: cadastrar, fazer login, provisionar agente).
4. Cada estória lista **cenários** (SC-): as mudanças de **estado** necessárias para completar a operação.
5. Toda estória **deve ter cenários** — no mínimo um. Uma estória pode conter **apenas um** cenário quando a operação for uma única mudança de estado.
6. Um **cenário** é, ao mesmo tempo:
   - uma **mudança de estado** (estado anterior → ação → estado resultante, em geral visual na UI);
   - uma **unidade testável** (aceite isolável: Dado/Quando/Então próprio);
   - uma **unidade paralelizável** (pode ser desenvolvida/testada em paralelo com outros SC da mesma estória, salvo dependência explícita).

## Formato

```markdown
## EP-NN — <Valor do épico>

<Por que esse conjunto de estórias entrega valor.>

### US-NN — <Operação completa>

<Descrição breve: o que o usuário faz, para quem / por quê.>

| # | Cenário | Mudança de estado |
|---|---------|-------------------|
| 1 | … | estado A → estado B |
| 2 | … | estado B → estado C |
```

Cada linha de cenário é unidade de aceite e de paralelismo (salvo dependência explícita).
## Exemplo

## EP-01 — Autenticação

Permitir que o usuário entre no produto: criar conta e autenticar. Login sozinho não entrega valor; cadastro + login juntos entregam.

### US-01 — Cadastrar

Permite criar uma nova conta.

| # | Cenário | Mudança de estado |
|---|---------|-------------------|
| 1 | Abrir cadastro | Home → formulário de cadastro |
| 2 | Preencher dados | Formulário vazio → campos preenchidos |
| 3 | Confirmar | Botão ativo → conta criada / redirecionamento |

### US-02 — Fazer login

Permite autenticar com credenciais existentes.

| # | Cenário | Mudança de estado |
|---|---------|-------------------|
| 1 | Abrir login | Home → formulário de login |
| 2 | Preencher credenciais | Formulário vazio → campos preenchidos |
| 3 | Confirmar | Formulário → sessão autenticada (área logada) |

## Fora do escopo

- Detalhe de arquitetura, tasks e implementação (vão para [refinamento técnico](../refinamento-tecnico/README.md)).
