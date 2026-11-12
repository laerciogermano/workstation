# 039 — Home em seções da altura da tela + seletor de tema no player + escuro preto

| Campo | Valor |
|-------|--------|
| Número | 039 |
| Data | 2026-11-08 |
| Origem | Claude Code (workstation) — mensagens enviadas durante a execução do 038 |
| Título | Home por seções, temas ao lado do celular, modo escuro só preto |

## Prompts originais

```
os destaques ja sao os enores precos, deixe tanto o tamanho ocupando a altura da tela , pra quando arrastar pra lateral, ficar vendo os proximos produtos, do mesmo jeito que esta agora, porem maior, com o a altura do tamanho da tla, e quando arrastar pra baixo, ir para todos os produtos arrastando para baixo ao inves de ser os menores precos, pode colocar os mais comprados, primiero os desaques que sao os menores precos, ou promocoes, e em baixo os mais comprados
```
```
em uma lista infinite scroll
```
```
na verdade, deixe sempre cada secao a altura do dispositvo
```
```
e deixe da seguinte forma, primieor vem as promocoes, que sao os destauqes, depois vem os mais comprados, depois vem cada categoria  sempre cada secao ocupando a altura da janela e possuindo uma rolagem horizontal
```
```
em cada secao os cards ficam menores do tamanho que estavam anteriormente, porem possuem mais cards na tela, pois a secao ocupa a altura do dispositivo
```
```
e deixe a opcao de tema facil quando tiver no modo visualizacao navegacao, coloque ao lado as opcoes de temas para transitarmos
```
```
e no modo escuro, o fundo tem que ser todo preto, jamais use azul no fundo
```

## Entrega

- T-10: seções Promoções → Mais comprados → uma por categoria; cada seção = altura da tela, grade de 2 linhas de cards no tamanho normal com rolagem horizontal; Mais comprados infinita na lateral; chips do topo pulam entre seções e acompanham; roda do mouse = uma seção por gesto; cabeçalho fixo
- Seletor de temas ao lado do celular no modo navegável (+ atalho `T`), troca com fade
- Escuro: fundo #000, superfícies cinza neutro, azul só em ação/texto/ícone; estados ativos em branco/preto
- REQ-056 · REQ-055 atualizado
