# Documento de cenários

Artefato **2** do [discovery](README.md). Fonte de verdade do *quê* do produto (EP → US → SC), **sem** Gherkin — tabelas **por estória**.

**Antes:** [`vision.md`](vision.md). **Depois:** [`bdd.md`](bdd.md).

## Regras

1. Organizar o produto em **épicos → estórias → cenários**.
2. Cada **épico** (EP-) é um conjunto de estórias que, juntas, entregam **valor**.
3. Cada **estória** (US-) é uma **função / operação completa** do usuário.
4. Cada estória tem **cenários** (SC-): mudanças de **estado** (obrigatório ≥1).
5. **Todo cenário** tem ID `SC-XX` (sequencial no produto).
6. Um **cenário** é mudança de estado + unidade testável + unidade paralelizável.
7. Em cada US: tabela da estória (Entradas · Execução · Saídas) + tabela dos SC.

## Formato

```markdown
## EP-NN — <Valor>

| ID | História |
|----|----------|
| US-… | … |

### US-NN — <Operação completa>

| Entradas | Execução | Saídas |
|----------|----------|--------|
| … | … | … |

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-… | … | … | … | … |
```

## Exemplo

## EP-01 — Autenticação

| ID | História |
|----|----------|
| US-01 | Cadastrar |
| US-02 | Fazer login |

### US-01 — Cadastrar

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Dados de conta | Criar conta | Conta criada |

| ID | Cenário | Mudança de estado |
|----|---------|-------------------|
| SC-01 | Abrir cadastro | Home → formulário de cadastro |
| SC-02 | Preencher dados | Formulário vazio → campos preenchidos |
| SC-03 | Confirmar | Botão ativo → conta criada / redirecionamento |

### US-02 — Fazer login

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Credenciais | Autenticar | Sessão autenticada |

| ID | Cenário | Mudança de estado |
|----|---------|-------------------|
| SC-04 | Abrir login | Home → formulário de login |
| SC-05 | Preencher credenciais | Formulário vazio → campos preenchidos |
| SC-06 | Confirmar | Formulário → sessão autenticada |

## Fora do escopo

| Item | Vai para |
|------|----------|
| Gherkin / Dado-Quando-Então | [`bdd.md`](bdd.md) |
| Protótipo visual | [`prototype.md`](prototype.md) |
| Arquitetura, tasks, implementação | [refinamento técnico](../refinamento-tecnico/README.md) |

## Próximo passo

→ [`bdd.md`](bdd.md)
