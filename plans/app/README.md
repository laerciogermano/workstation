# Plans — aplicação

**Por quê:** implementação do [plano](../docs/plano-implementacao.md): front sobre uma pasta local, hub WebSocket e client que executa comandos.
**Estado:** fases 0 a 4 funcionando no macOS; instaladores parciais (ver [o que falta](#o-que-falta)).

| Parte | Pasta | O quê |
|-------|-------|-------|
| Front | `apps/web` | React; lê e grava a pasta (File System Access API) |
| Hub | `apps/hub` | Node + `ws`; repassa mensagens cifradas |
| Client | `apps/client` | Go; executa o que foi liberado |
| Protocolo | `packages/protocol` | Mensagens, cifra e vetores de teste |
| Domínio | `packages/domain` | Formato dos arquivos e árvore |

## Rodar

Precisa de Node 22+, Go 1.27+ e Chrome ou Edge no computador.

```bash
cd plans/app
npm install
npm run client:build   # gera bin/plans-client
npm run dev            # hub em :4780 e front em http://localhost:5280
```

1. Abra <http://localhost:5280>, escolha uma pasta e crie o projeto.
2. Crie atividades, defina status (To do, Doing, Done), responsável e descrição. Na árvore, role para aproximar ou afastar, arraste o fundo para mover e use − / % / + / Ajustar. O botão **−** na borda de um nó minimiza o ramo; **+N** expande. No rodapé, **Minimizar tudo** e **Expandir tudo**. Dois cliques no título (ou F2) renomeiam. Clicar no fundo tira a seleção. Arraste um cartão para cima ou para baixo de outro para reordenar, ou para o meio dele para virar filho; **Esc** cancela. As bolinhas no topo trocam o tema (salvo em `.plans/ui.json`). O botão no canto da árvore minimiza o painel lateral.
3. Clique em **Client não pareado**, informe o caminho da pasta e rode no terminal os dois comandos mostrados (`pair` e `run`).
4. Execute um comando numa atividade; no terminal do client, responda `u` (uma vez), `s` (sempre) ou `n` (negar).

Sem escolher pasta: <http://localhost:5280/?demo> usa um armazenamento do próprio navegador.

## Client

```text
plans-client pair <código> --dir <pasta> [--hub <url>]
plans-client run [--no-prompt]
plans-client allow -- <programa> [argumentos]     | --any-args -- <programa> | --script <texto> | --list | --clear
plans-client start | stop | status | unpair | version
```

Pacotes para os três sistemas: `npm run client:release` (saída em `dist/client/`, com `install.sh` ou `install.ps1`).

## Verificar

```bash
npm run verify   # lint, typecheck, testes TypeScript e Go
npm run e2e      # Chrome + hub + client de verdade (macOS ou Linux, com expect)
```

## Segurança

- Mensagens cifradas de ponta a ponta; o hub só vê o id da sala.
- Nada executa sem liberação no computador.
- **Atenção ao liberar comandos que rodam arquivos do projeto** (`npm test`, `make`, `python script.py`): o front grava na pasta, então quem controlasse o front poderia mudar o arquivo e rodar o comando liberado.
- Sem sandbox: o comando tem as permissões da pessoa.

## O que falta

- Instaladores `.exe`, `.pkg`, `.deb` e `.rpm`, assinatura e página de download (fase 5).
- Testar o client em Windows e Linux de verdade: aqui só houve compilação cruzada e `go vet`; o workflow de CI roda os testes nos três.
- `plans-client start/stop` (início no login) não foi executado em nenhum sistema.
- Publicar o hub e o front no servidor (fase 6).
- Saída de comandos no Windows em páginas de código antigas pode vir com caracteres trocados.

## Voltar atrás

Parar o `npm run dev`, apagar `plans/app/` e `.github/workflows/plans-app.yml`; no computador, `plans-client unpair`.
