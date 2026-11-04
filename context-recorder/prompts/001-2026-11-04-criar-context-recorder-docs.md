# 001 — Criar Context Recorder (docs + board)

**Data:** 2026-11-04  
**Projeto:** Context Recorder

## Original

```text
Cria um novo bot, deixa como favoritos pra voice recorder. Cria uma task. Pra... analisar. Criar o PRD e como seria o plano de implementação e arquitetura dessa solução.

Basicamente a solução é preciso, é, escutar, né, preciso na verdade registrar tudo que eu falo, na hora que eu falo, pra que eu possa usar isso como contexto. Então tudo que eu falar, eu utilizar, é, e conseguir pesquisar e conseguir usar como contexto pra IA, futuramente usar um harness, é, pra buscar isso, e, e eu consiga utilizar isso como contexto pra IA.

Um exemplo básico de funcionamento, eu tô olhando agora o Notches.shop, o protótipo gerado, e eu tô meio que falando aqui coisas que serão perdidas. Se eu tivesse agora com um sistema gravando, seja aplicativo ou no MacBook ou em qualquer dispositivo gravando, e cadastrando a hora e o, tudo que eu falo, eu poderia usar isso pra, pra não precisar escrever novamente ou falar novamente o que eu preciso alterar.

Outra utilização disso é, eu preciso que ele recorde também o áudio do, do desktop, se tiver falando alguma coisa, né, se ele conseguir extrair alguma conversa, e separar isso em linhas diferentes, né, o que é desktop, o que é, o que foi gravado no microfone, pra que a gente também em reuniões eu poss, eu possa saber o que alguém falou, enfim, o que foi falado, que não grave só o que eu falo, mas que nas reuniões grave o que as outras pessoas também falam.

Esse sistema não será apenas voice recorder, ele será um recorder como tudo, né? Ele também vai ficar tirando print da tela, extraindo OCR, e sempre que mudar a tela, ele extrai também o OCR da tela e manda novamente. Então, ele fica tirando snapshots de OCR e gravando na base. Então vai ter essa opção também no sistema. Crie, deixe tudo isso no PRD e nos documentos necessários.
```

## Interpretação

- “bot” / “favoritos” = **board Trello** starred (padrão lab).
- Produto evoluiu de “voice recorder” → **Context Recorder**: mic + desktop (trilhas) + screenshot/OCR on change + busca + contexto para IA/harness.
- Exemplo âncora: feedback oral no protótipo Notinhas.shop sem redigitar.
- Entregar docs (visão, PRD, arquitetura, plano) + board + card de análise.

## Feito

- Board [Context Recorder](https://trello.com/b/lH0lCxXE/context-recorder) (favorito) + card PRD/arquitetura/plano
- Fechou board **Homologação** para liberar vaga no plano Free
- Pasta `context-recorder/` com visão, PRD, arquitetura, plano, config-ia, prompts
- Entrada no README da workstation
