# 004 — Fingerprint + backups + visão por prints

| Campo | Valor |
|-------|--------|
| Número | 004 |
| Data | 2026-11-17 |
| Origem | Chat no Cursor (workstation) |
| Título | Fingerprint no criar, backups e visão/controle |

## Prompt original

```
No criar o CDP, no formulário tem que ter as opções do, do fingerprint disponíveis na lib, e uma CDP pra gente definir, e já deixe sempre, e aí deixa um botão pra gerar, gerar, de acordo com, as opções ali.

Adicione também a opção de fazer backup. E nessa opção de fazer backup, o que que ele deve fazer? Ele deve copiar a pasta do CDP em algum lugar. E deve ter uma seção aqui pra gerenciar os backups também. E daí eu posso selecionar a parte de qual backup eu quero executar, então sempre que eu vou executar um um um CDP ele deve remover o estado atual e deve copiar do backup. Pra sempre que ele for executar ele executar do... do último backup selecionado. E nunca guardar informações ali. Né, de cache, dentre outras coisas. Então sempre tem que ser resgatado o snapshot copiando ali do backup. Eu quero ter uma gestão de backup com datas. Dentre outras coisas. Tudo via arquivo, que ele é onde eu possa ler. Dos caminhos.

Eu quero ter uma opção também de ver a tela, então eu quero assistir ou controlar, na verdade controlar, e aparece a tela que no CDP ele fica tirando print a cada segundo e eu consigo ver a imagem, a última imagem atualizando o tempo inteiro como se fosse um vídeo. Então eu coloco pra tirar um print em qualidades menores ali, a mais baixa possível. É... se não tiver no UMA CDP, cria essa interface onde você possa adicionar, configurar a qualidade do print, enfim. E aí tire prints e fique salvando isso pra que eu possa no front-end ver cada momento.
```

## Interpretação

1. Formulário de criar: opções de fingerprint da lib sempre visíveis + botão Gerar.
2. Backups por cópia de pasta, gestão com datas, seleção; executar = wipe + restore do selecionado.
3. Controlar: stream de screenshots JPEG low-quality salvos em disco + UI atualizando.

## O que foi feito

- `fingerprint-catalog.mjs` + API Gerar na UI
- `backup.mjs` → `~/chrome-cdp-backups/`; `startCdp` restaura selecionado
- `view.mjs` → `~/chrome-cdp-view/`; Controlar na UI
