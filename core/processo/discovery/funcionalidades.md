# Documento de funcionalidades

Artefato do [discovery](README.md). Fonte de verdade do *quê* do produto.

## Regras

1. Recortar **todas as funcionalidades maiores** do produto neste arquivo (ou no equivalente do projeto).
2. Cada **funcionalidade** é uma **ação** no sistema (ex.: provisionar agente, criar usuário, instalar APK).
3. Cada funcionalidade lista **cenários**: as mudanças de estado necessárias para executar essa ação.
4. Um **cenário** descreve estado anterior → ação → estado resultante.

## Formato por funcionalidade

```markdown
## <Título da ação>

<Descrição breve: o que faz, para quem / por quê.>

| # | Cenário | Mudança de estado |
|---|---------|-------------------|
| 1 | … | estado A → estado B |
| 2 | … | estado B → estado C |
```

## Exemplo

## Criar usuário

Permite cadastrar um novo usuário a partir da lista.

| # | Cenário | Mudança de estado |
|---|---------|-------------------|
| 1 | Clicar no botão criar | Lista → modal aberto |
| 2 | Digitar o nome | Modal sem nome → modal com nome visível |
| 3 | Clicar em salvar | Botão ativo → carregando/inativado → janela fechada e unidade salva na lista |

## Fora do escopo

- Detalhe de arquitetura, tasks e implementação (vão para [refinamento técnico](../refinamento-tecnico/README.md)).
