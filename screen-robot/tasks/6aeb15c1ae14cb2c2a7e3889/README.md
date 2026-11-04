# Task Trello: Bloquear execução se IP atual = último IP

- **Card:** [Bloquear execução se IP atual = último IP](https://trello.com/c/InSl0Em6)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Backlog`
- **ID:** `6aeb15c1ae14cb2c2a7e3889`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Guardar o último IP de egress usado numa operação; no start da próxima, se o IP atual for igual, abortar e falhar com motivo `IP igual ao último IP` — sem poll contínuo.

## Rollback

```bash
rm -rf screen-robot/tasks/6aeb15c1ae14cb2c2a7e3889
trello card:archive --id 6aeb15c1ae14cb2c2a7e3889
```
