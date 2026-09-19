# Documento de cenários

Artefato **2** do [discovery](README.md). Fonte de verdade do *quê* do produto (EP → US → SC), **sem** Gherkin — **só tabelas**.

**Antes:** [`vision.md`](vision.md). **Depois:** [`bdd.md`](bdd.md).

## Regras

1. Organizar o produto em **épicos → estórias → cenários**, todos em tabela.
2. Cada **épico** (EP-) é um conjunto de estórias que, juntas, entregam **valor**.
3. Cada **estória** (US-) é uma **função / operação completa** do usuário.
4. Cada estória tem **cenários** (SC-): mudanças de **estado** (obrigatório ≥1).
5. **Todo cenário** tem ID `SC-XX` (sequencial no produto).
6. Um **cenário** é mudança de estado + unidade testável + unidade paralelizável.

## Formato

Duas tabelas (sem seções narradas por US):

```markdown
## Épicos

| ID | Épico | Valor |

## Histórias (US)

| EP | ID | História | Entradas | Execução | Saídas |

## Cenários (SC)

| US | ID | Cenário | Entradas | Execução | Saídas |
```

(Alternativa UI: coluna **Mudança de estado** no lugar de Entradas/Execução/Saídas.)

## Exemplo

### Épicos

| ID | Épico | Valor |
|----|-------|-------|
| EP-01 | Autenticação | Entrar no produto (cadastro + login) |

### Histórias (US)

| EP | ID | História | Entradas | Execução | Saídas |
|----|----|----------|----------|----------|--------|
| EP-01 | US-01 | Cadastrar | Dados de conta | Criar conta | Conta criada |
| EP-01 | US-02 | Fazer login | Credenciais | Autenticar | Sessão autenticada |

### Cenários (SC)

| US | ID | Cenário | Mudança de estado |
|----|----|---------|-------------------|
| US-01 | SC-01 | Abrir cadastro | Home → formulário de cadastro |
| US-01 | SC-02 | Preencher dados | Formulário vazio → campos preenchidos |
| US-01 | SC-03 | Confirmar | Botão ativo → conta criada / redirecionamento |
| US-02 | SC-04 | Abrir login | Home → formulário de login |
| US-02 | SC-05 | Preencher credenciais | Formulário vazio → campos preenchidos |
| US-02 | SC-06 | Confirmar | Formulário → sessão autenticada |

## Fora do escopo

| Item | Vai para |
|------|----------|
| Gherkin / Dado-Quando-Então | [`bdd.md`](bdd.md) |
| Protótipo visual | [`prototype.md`](prototype.md) |
| Arquitetura, tasks, implementação | [refinamento técnico](../refinamento-tecnico/README.md) |

## Próximo passo

→ [`bdd.md`](bdd.md)
