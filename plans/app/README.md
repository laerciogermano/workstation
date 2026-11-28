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
2. Crie atividades (a árvore parte do nó **root**: o **+** dele cria no primeiro nível, e soltar um cartão em cima dele o leva para lá), defina status (To do, Doing, Done) e responsável (no cartão aberto, uma opção com ícone para cada um: pessoa, IA, máquina ou sem responsável). **Clicar num cartão**, na árvore ou no Kanban (ou **Espaço** na árvore), abre-o em **tela cheia**: os campos à esquerda, a descrição já em **Dividido** (edição e visualização lado a lado) e, abaixo, o system prompt e os comandos; **Fechar** ou **Esc** voltam. Na árvore, o clique no título espera um instante antes de abrir, porque dois cliques ali renomeiam. O cartão aberto tem duas seções: **Input** (descrição e anexos) e **Output** (comentários, para a resposta ou o retorno, e anexos). Anexe pelo botão ou arrastando arquivos para a seção; cada um aparece com a miniatura (ou um selo com a extensão); clique num anexo para ver (imagem, vídeo, áudio, PDF, Markdown, DOCX sem formatação e texto) ou baixar. **Planilhas** (CSV, TSV, XLSX, XLSM, XLS e ODS) abrem numa grade editável: dois cliques ou digite para mudar uma célula, cole blocos de outra planilha, desfaça e salve com **Salvar** ou ⌘S; a versão anterior vai para a lixeira e um arquivo mudado por fora não é sobrescrito. CSV e TSV permitem inserir e excluir linhas e colunas; XLSX e XLSM mantêm a formatação e recebem linhas e colunas só no fim; XLS e ODS são salvos como uma cópia `.xlsx`, sem formatação. Fórmulas não são calculadas na tela (o Excel recalcula ao abrir). Os arquivos ficam em `attachments/<id>/input|output/` e `comments/<id>/`: um agente responde gravando ali. A descrição aceita Markdown, nos modos **Ler**, **Editar** e **Dividido**, com um botão **Tela cheia** que amplia só o campo (abre em **Dividido**); salva ao sair do editor ou com ⌘S. **Regenerar descrição** pede à IA um texto novo com todo o contexto do cartão (título, descrição atual, pais, subatividades, irmãs, system prompt, comentários e anexos do cartão e dos pais; lê anexos em texto, `.xlsx` ou `.docx`, e dos demais só o nome), mostra o resultado para conferir e só troca a descrição em **Substituir descrição**. A engrenagem no nó **root** abre as **configurações do projeto** com o **system prompt** (instruções padrão, em `system-prompt.md`), que aparece abaixo da descrição de toda atividade e pode ser lido e editado ali, valendo para todas. Cada arquivo de atividade abre com a referência `SYSTEM PROMPT` / `/system-prompt.md`. Na árvore, role para aproximar ou afastar, arraste o fundo para mover e use − / % / + / Ajustar. O botão **−** na borda de um nó minimiza o ramo; **+N** expande. No rodapé, **Minimizar tudo** e **Expandir tudo**. Dois cliques no título (ou F2) renomeiam. Clicar no fundo tira a seleção. Arraste um cartão para cima ou para baixo de outro para reordenar, ou para o meio dele para virar filho; **Esc** cancela. No topo, **Árvore** e **Kanban** trocam a visão: o Kanban mostra só as atividades sem filhas, em uma coluna por status, com o caminho dos pais; arraste o cartão para outra coluna (ou clique no status) para mudar. Acima da árvore e do quadro, os filtros (os mesmos nas duas visões) mostram só o que você procura. **Responsável**: cada pessoa, IA ou máquina de `assignees.json`, **Sem responsável** e, se houver, ids fora do catálogo. **Status**: To do (inclui os cartões sem status no arquivo), Doing e Done. Marque uma ou mais opções; dentro de um grupo vale qualquer uma, entre os grupos valem todos; nenhuma marcada mostra tudo, e **Limpar filtros** desmarca. Na árvore, ficam os cartões que casam e os pais deles (apagados quando não casam), com os ramos abertos; **−**, **Minimizar tudo** e **Expandir tudo** voltam ao limpar, e o que estava minimizado continua assim. O cartão selecionado depois de escolher o filtro (um recém-criado, por exemplo) continua à vista, apagado, mesmo sem casar. No Kanban, a coluna de um status não marcado fica vazia, com o aviso **Fora do filtro de status**, e ainda aceita cartões. O filtro não muda as atividades e some ao recarregar a página ou trocar de pasta. **Etiquetas**: nas configurações do projeto, crie, renomeie, troque a cor ou remova (o catálogo fica em `labels.json`); marque no cartão aberto, e elas aparecem no Kanban. No arquivo da atividade, `labels` guarda os ids, que não mudam ao renomear; remover tira a etiqueta dos cartões e deixa uma cópia em `.plans/trash/`. A **prioridade** vai de 1 (muito baixa) a 5 (urgente), é escolhida no cartão aberto (**–** tira) e fica no campo `priority` do arquivo; no Kanban cada coluna vem da maior para a menor, sem prioridade no fim. O cartão aberto mostra a data em **Criado em** (campo `createdAt`), preenchida na criação; escolher outro dia mantém a hora e a posição do cartão entre as irmãs. Em **Entrega** (campo `dueDate`, `AAAA-MM-DD`; **Tirar** remove) fica a data combinada; o cartão do Kanban a mostra, com destaque quando é hoje ou está atrasada (em Done não atrasa), e ela vai no contexto enviado à IA. As bolinhas no topo trocam o tema (salvo em `.plans/ui.json`). O painel lateral fica com as configurações do projeto e os comandos; o botão no canto da árvore o minimiza.
3. Clique em **Client não pareado**, informe o caminho da pasta e rode no terminal os dois comandos mostrados (`pair` e `run`).
4. Execute um comando numa atividade; no terminal do client, responda `u` (uma vez), `s` (sempre) ou `n` (negar).

Sem escolher pasta: <http://localhost:5280/?demo> usa um armazenamento do próprio navegador.

**Chave de API da IA:** clique em **IA sem chave** no topo, escolha o provedor (Google Gemini, Anthropic Claude ou OpenAI), cole a chave e, se quiser, informe o modelo. A chave fica salva só neste navegador, nunca na pasta do projeto; o mesmo botão troca ou remove.

## Descrição por IA

Com a chave configurada, **criar um card pelo título já preenche a descrição** (dá para cancelar; só preenche se continuar vazia). Sem chave, nada é enviado. O contexto do card, inclusive o dos cards acima e o texto dos anexos, vai para o provedor sem nova confirmação, e o plano gratuito do Gemini usa esse conteúdo para melhorar os produtos do Google. Modelo padrão: `gemini-3.5-flash-lite`, `claude-opus-5-5` ou `gpt-6-luna` (`apps/web/src/ai/providers.ts`). Comparação, custos e limites no [estudo](../../attachments/71f529d6-ecc7-458e-99f7-3e3732e8b294/output/estudo-ia.md).

## Play: executar a atividade com a IA

Quando o responsável é uma IA, o cartão ganha um botão **▶** (na árvore, no Kanban e no cartão aberto). Ele abre uma janela de terminal à parte, no seu computador, com a IA trabalhando na atividade: o **Claude** (`claude "<pedido>"`) ou o **Gemini** (`gemini --prompt-interactive "<pedido>"`). A sessão é interativa e usa as permissões normais da IA: acompanhe e aprove as ações por lá.

- **Quem é IA:** responsável de tipo `ai` em `assignees.json` com a palavra `claude` ou `gemini` no id ou no nome. Projetos novos já trazem os dois; num projeto antigo, acrescente `{ "id": "gemini", "name": "Gemini", "type": "ai" }` em `items`. Outras IAs não têm o botão.
- **Preparar:** instale os comandos (`claude`; Gemini com `npm install -g @google/gemini-cli`), com login feito; recompile o client (`npm run client:build`) e rode `plans-client run` de novo num terminal que os enxergue no `PATH`.
- **Liberar:** como qualquer comando, o play pergunta no terminal do client (`u` uma vez, `s` sempre para aquela atividade e IA, `n` negar). Para não perguntar em nenhuma atividade: `plans-client allow --any-args -- plans-play`.
- **Botão:** sem client, abre o pareamento; pulsando, espera a sua aprovação; vermelho, o último play não abriu (o motivo aparece ao passar o mouse e na lista de comandos). Sem client rodando num terminal, só funciona o que já foi liberado.
- **O que vai no comando:** `plans-play <claude|gemini> <id>`, e só. O client monta o pedido (um texto fixo que manda ler `activities/<id>.md`, os pais, os anexos e o `system-prompt.md`); título e descrição nunca entram numa linha de comando. A saída da execução registra só a abertura do terminal, não o trabalho da IA, e cancelar ali não fecha a janela.
- **Sistemas:** testado no macOS (app Terminal). No Linux usa o primeiro emulador encontrado (não testado); no Windows ainda não abre.

## Client

```text
plans-client pair <código> --dir <pasta> [--hub <url>]
plans-client run [--no-prompt]
plans-client allow -- <programa> [argumentos]     | --any-args -- <programa> | --script <texto> | --list | --clear
plans-client play <claude|gemini> <id>            (o que o botão ▶ executa; também serve à mão)
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
- **Play:** a IA lê o que está na pasta, que o front grava: a atividade, o `system-prompt.md` e também as configurações da IA no projeto (`CLAUDE.md`, `GEMINI.md`, `.claude/`, `.gemini/`). Quem controlasse o front poderia mudar as instruções antes do play. O client não passa opções que pulem permissões; leia o que a IA pede antes de aprovar, e só libere com `--any-args` se aceitar que o front abra a IA sem perguntar.

## O que falta

- Instaladores `.exe`, `.pkg`, `.deb` e `.rpm`, assinatura e página de download (fase 5).
- Testar o client em Windows e Linux de verdade: aqui só houve compilação cruzada e `go vet`; o workflow de CI roda os testes nos três.
- `plans-client start/stop` (início no login) não foi executado em nenhum sistema.
- Publicar o hub e o front no servidor (fase 6).
- Saída de comandos no Windows em páginas de código antigas pode vir com caracteres trocados.

## Voltar atrás

Parar o `npm run dev`, apagar `plans/app/` e `.github/workflows/plans-app.yml`; no computador, `plans-client unpair`.
