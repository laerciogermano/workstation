# Documento de funcionalidades

Artefato do [discovery](README.md). Fonte de verdade do *quê* do produto.

## Regras

1. Organizar o produto em **épicos → estórias → cenários**.
2. Cada **épico** (EP-) é um conjunto de estórias que, juntas, entregam **valor**. Uma estória isolada pode não bastar (ex.: login sem cadastro).
3. Cada **estória** (US-) é uma **função / operação completa** do usuário (ex.: cadastrar, fazer login, provisionar agente).
4. Cada estória lista **cenários** (SC-): as mudanças de **estado visual** necessárias para completar a operação.
5. Um **cenário** descreve estado visual anterior → ação → estado visual resultante.

## Formato

```markdown
## EP-NN — <Valor do épico>

<Por que esse conjunto de estórias entrega valor.>

### US-NN — <Operação completa>

<Descrição breve: o que o usuário faz, para quem / por quê.>

| # | Cenário | Mudança de estado visual |
|---|---------|--------------------------|
| 1 | … | estado A → estado B |
| 2 | … | estado B → estado C |
```

## Exemplo

## EP-01 — Autenticação

Permitir que o usuário entre no produto: criar conta e autenticar. Login sozinho não entrega valor; cadastro + login juntos entregam.

### US-01 — Cadastrar

Permite criar uma nova conta.

| # | Cenário | Mudança de estado visual |
|---|---------|--------------------------|
| 1 | Abrir cadastro | Home → formulário de cadastro |
| 2 | Preencher dados | Formulário vazio → campos preenchidos |
| 3 | Confirmar | Botão ativo → conta criada / redirecionamento |

### US-02 — Fazer login

Permite autenticar com credenciais existentes.

| # | Cenário | Mudança de estado visual |
|---|---------|--------------------------|
| 1 | Abrir login | Home → formulário de login |
| 2 | Preencher credenciais | Formulário vazio → campos preenchidos |
| 3 | Confirmar | Formulário → sessão autenticada (área logada) |

## Fora do escopo

- Detalhe de arquitetura, tasks e implementação (vão para [refinamento técnico](../refinamento-tecnico/README.md)).
