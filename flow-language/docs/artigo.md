# Flow — Artigo (estrutura)

> “Nada é permanente, exceto a mudança.” — Heráclito  ·  “Uma imagem vale mais que mil palavras.”

Estrutura derivada de [`roteiro.md`](../../flow-component/docs/roteiro.md) (12 capítulos). Versão visual: [`artigo.html`](artigo.html).

| Parte | Capítulos | Tema |
|---|---|---|
| I — O conceito | 1–2 | Por que existe e o que muda no olhar |
| II — A linguagem | 3–9 | Funções, estados, objetos, estruturas e camadas |
| III — O produto | 10 | Linguagem universal, IDE e plataforma |
| IV — A técnica e o contexto | 11–12 | Método de escrita e o lugar do Flow n’O Código |

---

# Parte I — O conceito

_Por que existe e o que muda no olhar_

## 1. O que é Flow

**Ideia:** O que o Flow é: uma linguagem visual que transforma código em visão.  
**Fontes:** roteiro · índice

- linguagem de programação visual
- orquestrador de processos (similar a n8n)
- visão logística de todos os fluxos
- código → visão (facilita análise)
- estrutura física do software / plano das ideias
- epígrafes: panta rei (Heráclito); “a picture is worth a thousand words”
- Flow nasce de “panta rei”: escrever Flow é vigiar a intenção (Logos driver design) _(Meditações)_
- Flow como linguagem da estória: o plano das mudanças, isomórfico à linguagem e ao pensamento _(Meditações)_

## 2. Por que Flow (paradigma)

**Ideia:** O paradigma: olhar a ordem dos eventos, não os objetos.  
**Fontes:** Meditações · FOP bullets

- olhar a ordem dos eventos, não os objetos
- menor unidade: mudança de estado (mônada)
- eternos (verbo) × mutáveis (estado)
- ouro está no que e no quando, não no quem
- roteiro abstrato → concreto (sem sujeito como substância)
- contraste com OO: OO acopla dado + comportamento; Flow separa função e dado
- objeto = acúmulo de atributos entre verbos/fluxos (ex.: bola de boliche)
- Duas substâncias: estado/objeto (visível, mutável) × movimento/verbo (invisível, eterno) _(Meditações)_
- Erro ontológico de Aristóteles: unir característica e mudança deu a OOP e o MER _(Meditações)_
- História = unidade de ação: estado inicial → verbo → estado final; histórias se repetem, mudam os elementos _(Meditações)_
- Heráclito (muda) e Parmênides (constante) unificados; forma é o espaço, matéria é o que preenche _(Meditações)_
- Declarativo × imperativo (pendência anotada para o artigo) _(Meditações)_

# Parte II — A linguagem

_Funções, estados, objetos, estruturas e camadas_

## 3. Funções

**Ideia:** A unidade de mudança de estado, com n entradas e n saídas.  
**Fontes:** FOP bullets

- unidade de mudança de estado
- n entradas e n saídas (endereços)
- podem conter outras (sequência, paralelo)
- componentes substituíveis / desacoplamento em nível de serviço
- Mônada = estado + movimento; verbo = estória; história = verbo acionado _(Meditações)_
- Toda mônada tem sua antagônica: cai(João) ↔ levanta(João) _(Meditações)_
- Movimentos com os mesmos estados inicial e final são correspondentes (porta e tampa: abrir/fechar) _(Meditações)_
- Mesmo ato pode estar contido em mônadas diferentes; mônadas compatíveis se relacionam (sequencial ou paralelo) _(Meditações)_

## 4. Estados

**Ideia:** Dados, entradas, saídas e contexto: estado como fatos condensados.  
**Fontes:** índice

- dados
- input
- output
- estado / contexto
- estado = conjunto de fatos condensados
- todo ato liga estado inicial → movimento → estado final
- Todo estado é precedido da execução de um verbo; todo verbo gera um novo estado _(Meditações)_
- Atenção ao side effect ao passar objeto de dados por referência _(Meditações)_
- Pensar como stateless (exemplo do porteiro): não guardar estado _(Meditações)_

## 5. Objetos

**Ideia:** O objeto como ponte cognitiva, e seu lugar entre verbo e estado.  
**Fontes:** índice · Meditações

- seres com dados e funções (visão legada / ponte cognitiva)
- coleções, posição
- hashmap (chave–valor)
- no Flow: objeto não é ator; preenche espaço entre verbo e estado
- atributos com responsabilidade por movimento
- Objeto = acúmulo de características acopladas usadas em mônadas diferentes _(Meditações)_
- Modelagem relativa ao movimento: o acúmulo de movimentos a uma referência define o objeto _(Meditações)_
- Identidade polimórfica: valores diferentes para perspectivas diferentes (arquétipos) _(Meditações)_
- Menos acoplamento, mais coesão por objetivo: papéis com uma única função _(Meditações)_

## 6. Seleção

**Ideia:** Caminhos possíveis para cada estado.  
**Fontes:** índice

- if / else
- switch
- caminhos possíveis para cada estado
- Dualidade: para todo ser, o não ser; cada símbolo é um sim ou não com seu oposto _(Meditações)_
- Caminho feliz e o próximo caminho feliz (plano B) para cada estado _(Meditações)_

## 7. Repetição

**Ideia:** Repetir uma mudança de estado: for, while, do-while.  
**Fontes:** índice

- for
- while
- do-while
- Padrões se repetem: reconhece o padrão quem já percorreu o caminho _(Meditações)_
- Mônadas em sequência e em paralelo formam as estórias _(Meditações)_

## 8. Files (Layers) e endereços

**Ideia:** Todo dado, função e abstração tem um endereço; camadas se conhecem.  
**Fontes:** FOP bullets

- todo dado tem um endereço
- toda função tem um endereço
- toda abstração tem um endereço
- quem se conhece = mesma camada; quem não = camadas distintas
- entrada = camada de contexto; camada completa → execução
- inputs como injeção de dependência / parâmetros substituíveis
- O endereço surge na contraposição dos seres; perspectiva é endereço _(Meditações)_
- Todos somos o mesmo, só mudamos de endereço _(Meditações)_
- Anotar cria referência: o que não se anota perde o endereço _(Meditações)_

## 9. Sólidos × abstratos

**Ideia:** O que tem endereço físico e o que ainda é espaço a preencher.  
**Fontes:** FOP bullets

- sólido: tem endereço físico
- abstrato: não possui endereço físico
- no plano das ideias, elementos viram planos
- funções podem receber endereços abstratos e devolver concretos
- Forma é espaço/molde abstrato; matéria preenche; identidade está na forma (navio de Teseu) _(Meditações)_
- Para todo espaço, preenchimento; para todo preenchimento, novos espaços _(Meditações)_
- Linguagem, pensamento e realidade são isomórficos _(Meditações)_

# Parte III — O produto

_Linguagem universal, IDE e plataforma_

## 10. Linguagem universal e produto

**Ideia:** Transpila para qualquer linguagem; da página à plataforma.  
**Fontes:** índice · FOP bullets

- transpila para qualquer linguagem
- features das linguagens de programação
- gerenciador de tarefas
- superfície: Artigo · View · IDE · plataforma · WorkFlow
- one way of development; camadas homogêneas e substituíveis
- Jogos de linguagem atrapalham a filosofia e a construção de software: uma linguagem sem ambiguidade _(Meditações)_
- Quanto maior a categorização, maior a abstração e a reutilização de histórias _(Meditações)_
- Criar o artigo Flow, comunidade e metas do bloco FLOW (livros, cursos, vender Flow) _(Meditações)_

# Parte IV — A técnica e o contexto

_Método de escrita e o lugar do Flow n’O Código_

## 11. Técnica Flow (método)

**Ideia:** Escrever todo dia sobre a tarefa: o método para manter o plano.  
**Fontes:** Meditações

- escrever diariamente sobre o tema/tarefa
- documento cresce → engajamento e retorno ao estado
- diário cronológico para retomar concentração
- vigiar a intenção (Logos driver design)
- focar no plano, não em pessoas
- Escrever Flow: autenticidade da criação, centralizar a atenção, conseguir recursos _(Meditações)_
- Pensar sempre na intenção; a ação vem da intenção _(Meditações)_
- Trabalhar em cima da obra, sem desperdiçar tempo com rascunhos _(Meditações)_
- Escrever, clusterizar, refinar; não se exaltar _(Meditações)_
- Gerar referências enquanto fala _(Meditações)_
- Não comentar motivos: ordenar o ato (e0 → e1) _(Meditações)_

## 12. Promessa e dores (contexto O Código / bloco FLOW)

**Ideia:** A promessa, as dores e a diferenciação do paradigma.  
**Fontes:** Livro: O Código

- promessa: manual da vida + novo paradigma de realidade
- dores: excesso de informação, ansiedade, depressão, família, trabalho, relacionamento, finanças, violência
- diferenciação: paradigma extraído da computação
- (opcional no roteiro técnico) metas de produto e comunidade
- Objetivo: tornar o Brasil um país de primeiro mundo _(Meditações)_
- Audiência: match do Tinder / profissional de TI _(Meditações)_
- Felicidade é o ato de não estar preocupado _(Meditações)_
- Foco na produção e no resultado _(Meditações)_

---

Contato: laerciogermanoo@gmail.com · Licença MIT · Repo: https://github.com/laerciogermano/flow-oriented-programming
