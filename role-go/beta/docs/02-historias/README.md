# Histórias de usuário e critérios de aceite — Beta

Cada história segue o formato **Como / Quero / Para** e traz critérios de aceite em **Gherkin** (pt-BR). Esses cenários são a fonte dos testes e2e ([09-estrategia-de-testes](../09-estrategia-de-testes.md)).

| Arquivo | Épico | Histórias |
|---|---|---|
| [E01-conta-onboarding-perfil.md](E01-conta-onboarding-perfil.md) | E01 | US-01.01 → US-01.15 |
| [E02-publicacao-descoberta.md](E02-publicacao-descoberta.md) | E02 | US-02.01 → US-02.16 |
| [E03-ciclo-de-vida.md](E03-ciclo-de-vida.md) | E03 | US-03.01 → US-03.14 |
| [ADM-backoffice.md](ADM-backoffice.md) | Backoffice | US-ADM.01 → US-ADM.04 |

## Convenções

- **ID:** `US-<épico>.<nn>`, ligado aos requisitos `RF-*` do [PRD](../01-prd.md).
- **Prioridade:** M/S/C, igual ao PRD.
- **Estimativa:** pontos relativos (1, 2, 3, 5, 8). Uma história com mais de 8 pontos precisa ser quebrada.
- **Telas:** códigos do [protótipo](../12-prototipos.md) (`T-xx`).
- **Definition of Ready:** critérios escritos, tela identificada no protótipo, endpoint em [06-contratos-api](../06-contratos-api.md), dependências resolvidas.
- **Definition of Done:** ver [11-plano-de-implementacao §DoD](../11-plano-de-implementacao.md#definition-of-done).

## Contexto Gherkin comum

```gherkin
# language: pt
Contexto:
  Dado que hoje é "2026-11-20 18:00" no fuso "America/Sao_Paulo"
  E existe a cidade "Curitiba" com centro em (-25.4284, -49.2733)
```
