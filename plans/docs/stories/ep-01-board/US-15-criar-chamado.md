# US-15 — Criar chamado

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário final |

## História

Como **usuário final**, quero **criar um card (chamado) descrevendo a necessidade e o serviço desejado**, para **solicitar atendimento por prestadores**.

## Critérios de aceite

- [ ] Dado que sou usuário final, quando crio um card chamado com necessidade e serviço desejado, então o chamado fica disponível para prestadores.
- [ ] Dado que um chamado foi criado sem descrição da necessidade ou do serviço, quando tento concluí-lo como chamado válido, então o sistema impede ou sinaliza a incompletude.
- [ ] Dado que não sou usuário final autorizado, quando tento criar chamado, então a operação é negada.

## Notas

- Campos obrigatórios exatos do chamado e visibilidade para quais prestadores ainda abertos.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
