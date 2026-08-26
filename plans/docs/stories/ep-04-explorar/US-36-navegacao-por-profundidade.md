# US-36 — Navegação por profundidade

| Campo | Valor |
|-------|-------|
| Épico | EP-04 — Explorar |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **navegar por profundidade no explorador**, para **percorrer a hierarquia infinita das unidades**.

## Critérios de aceite

- [ ] Dado que existem unidades aninhadas, quando navego por profundidade no Explorar, então consigo entrar e sair dos níveis da hierarquia.
- [ ] Dado que a hierarquia possui profundidade arbitrária, quando navego até um nível profundo, então o explorador permite percorrer sem limite imposto de profundidade.
- [ ] Dado que tento navegar para um caminho inexistente, quando a navegação é solicitada, então o sistema informa que o destino não existe.

## Notas

- Breadcrumb vs. drill-down é detalhe de UI; a regra é navegação por profundidade na hierarquia infinita.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
