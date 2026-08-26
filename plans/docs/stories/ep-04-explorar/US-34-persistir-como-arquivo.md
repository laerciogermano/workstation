# US-34 — Persistir como arquivo

| Campo | Valor |
|-------|-------|
| Épico | EP-04 — Explorar |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **persistir toda unidade de trabalho como arquivo**, para **ter representação estável e explorável do trabalho**.

## Critérios de aceite

- [ ] Dado que crio uma unidade em qualquer visão, quando consulto o Explorar, então a unidade existe como arquivo.
- [ ] Dado que uma unidade foi persistida como arquivo, quando a reabro depois, então o conteúdo permanece disponível.
- [ ] Dado que a persistência falha, quando a criação/atualização é tentada, então o usuário é informado e a unidade não aparece como gravada com sucesso.

## Notas

- Formato físico do arquivo e local de armazenamento não são regra de negócio neste nível.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
