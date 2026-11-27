# 020 — Menu, bordas e memória dos cenários

| Campo | Valor |
|-------|--------|
| Número | 020 |
| Data | 2026-11-27 |
| Origem | Claude Code |
| Título | Menu limpo, sem bordas, Personas e escolhas lembradas |

## Prompt original

```
remova esse menu gigante nocenttro da tela, deixe a tela limpa sem nada dizendo que n tem nada e ese minha conta e sair talvez em marina alves ali em cima na parte de configiracoes da conta
```

```
e remova essas bordas tanto do branco cmoo do escuro
```

```
Quem está usando sao personas e nao qm eta usando
```

Resposta à pergunta “Quais bordas?”: `As duas coisas`.

```
deixe o menu mesmo
```

```
e deixe as configuracoes na local storage para nao ficar clicando sempre no e01 e investidr semp rque eu escolher tem que lembrar
```

```
esse minha conta e sair fica apenas na minha conta e e abert na parte ali em cima hela duarte
```

## Interpretação

O menu do centro continua; no desktop, “Minha conta” e “Sair” saem dele e ficam no menu do nome, no topo. Saem os contornos dos blocos e as molduras dos aparelhos. As escolhas de Cenários passam a ser lembradas.

## O que foi feito

- [`prototipo/js/screens/inicio.js`](../prototipo/js/screens/inicio.js): botões de conta e saída só no celular.
- [`prototipo/styles/`](../prototipo/styles/portal.css): blocos sem contorno, no claro e no escuro; sem moldura de navegador e de aparelho.
- [`prototipo/js/app.js`](../prototipo/js/app.js): rótulo “Personas” e cenários guardados no `localStorage` (`sp.cenario`).
