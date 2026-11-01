# 005 — Cadastrar empresa, nota e itens (histórico)

| Campo | Valor |
|-------|--------|
| Número | 005 |
| Data | 2026-11-01 |
| Origem | Chat no Cursor (workstation) |
| Título | Persistência empresa/nota/itens |

## Prompt original

```
agora, quando enviar uma url escaneada, deve cadastrara. empresa se n tiver cadastradas com os dados que existem no site, deve cadastrar a nota e deve cadastrar cada item

cada nova nota, cria uma nova tupla do item para sempre vermos o historico 
```

## Interpretação

Ao processar URL: criar empresa se CNPJ novo; criar nota; inserir itens; cada nota nova gera novas linhas de item (histórico).

## O que foi feito

- Parser ampliado (empresa/nota); camada de cadastro; depois migrado para Postgres (prompt 006)
