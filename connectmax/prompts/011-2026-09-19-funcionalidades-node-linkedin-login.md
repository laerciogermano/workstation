# Prompt 011 — Funcionalidades Node + script login LinkedIn + BDD

**Data:** 2026-09-19  
**Projeto:** ConnectMax · screen-robot

## Prompt

as funcionalidades sao

- provisionar um agente
- isntala apks
- receber eventos
- executar extracao dos elementos na tela e informacoes
- executar operacoes
- guardar estado de secao

tudo isso via codigo node

crie um script inicial que  baixa o instagram definindo a versao, isso pode ser nas configuracoes do dispostivio, provisiona um android abre o linkedin e tira um print da tela, identifica o botao de login ou se ja esta na tela de login e diita usuario e senha e depois cica em entrar

crie o cenario bdd de aceitacao dessa funcionalidade maior descrita que utilzacra de cada recorte da apicado descrita

## Resultado

- [`docs/functionalities/`](../screen-robot/docs/functionalities/README.md) com as 6 capacidades.
- Libs Node em `sources/android-control/lib/` + `device.config.json` (versão Instagram).
- Script [`scripts/linkedin-login.js`](../screen-robot/sources/android-control/scripts/linkedin-login.js).
- BDD [`docs/bdd-linkedin-login.md`](../screen-robot/docs/bdd-linkedin-login.md).
