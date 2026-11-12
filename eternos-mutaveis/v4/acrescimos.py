"""Eternos Mutáveis 4.0 — acréscimos ao texto da 3.0.

Fontes: ../fora-do-livro.md (pontos ausentes e parciais), ../inputs/obras-a-adicionar.md (obras BR e internacionais)
e ../inputs/threads-instagram-mapa.md (frases dos threads). Os pontos da tabela "Decisões do autor" de fora-do-livro.md
NÃO entram (Messias, "Deus é uma negra", Bíblia/Jesus, reencarnação, relatividade, anticristo, frase atribuída a Einstein).

Operações (aplicadas por _build_v4.py sobre ../v3/capitulo-N.md):
  ("after",  n, prefixo, texto)   insere parágrafos depois da linha que começa com `prefixo` (única)
  ("before", n, "## Título", txt)  insere uma seção nova antes da seção `## Título`
  ("sub",    n, antigo, novo)      troca um trecho (único)
EPI[n] = epígrafe do autor, posta logo abaixo da epígrafe da 3.0.
"""

AUTOR = "Laércio Germano"

EPI = {
    1: "Neste fruto, nesta terra, ainda somos analfabetos espirituais.",
    2: "O universo é estruturado como linguagem.",
    3: "Para toda decisão, um ciclo.",
    4: "O conceito de abstrato e sólido, encontrado na programação, é a chave da metafísica.",
    5: "A forma não pertence à matéria.",
    6: "A dualidade é a história do contraste.",
    7: "Apegue-se aos eventos, não aos indivíduos.\nApegue-se aos eternos, não aos mutáveis.",
}

OPS = []
def after(n, a, t): OPS.append(("after", n, a, t.strip()))
def before(n, h, t): OPS.append(("before", n, h, t.strip()))
def sub(n, a, b): OPS.append(("sub", n, a, b))


# ───────────────────────────── Capítulo 1 · A Era Adâmica ─────────────────────────────

after(1, "A palavra *metafísica* vem do grego", '''
Carlos Drummond de Andrade escreveu um poema sobre o instante em que esse plano se oferece por inteiro. Em *A máquina do mundo*, de 1951, o poeta caminha no fim da tarde por "uma estrada de Minas, pedregosa", cansado, sem esperar nada. E a máquina do mundo se abre diante dele: a explicação total, a ordem de todas as coisas, tudo o que ele havia procurado. Ele baixa os olhos. Recusa o presente e segue andando, "de mãos pensas". O poema não diz se a recusa foi sabedoria ou cansaço. Diz que é possível estar diante da estrutura do real e continuar pela estrada como se nada tivesse acontecido. O homem adâmico não é só aquele a quem a geometria falta. É também aquele que, quando ela se abre, está cansado demais para olhar.
''')

after(1, "Quando a criança cresce, entrega o mesmo mapa", '''
O mapa não vem solto. Vem amarrado a um grupo. Toda família, toda igreja, toda profissão, todo bairro tem a sua tabela de crenças: o que se pode desejar, o que dá vergonha, como se trata um estranho, o que se faz com a raiva. A tradição esotérica chama de egrégora essa mente coletiva, e o capítulo 3 voltará a ela. Aqui basta notar o seu efeito. Quem cresce dentro de uma egrégora recebe, junto com as crenças, as habilidades e os medos que combinam com elas, e passa a chamar o conjunto de personalidade. Por isso mudar de crença raramente é só mudar de ideia. É quase uma cirurgia.

Diante de Deus, o mapa herdado produz posturas que qualquer um reconhece. Há quem permaneça na fé em que nasceu e a pratique sem perguntar. Há quem tente seguir e não consiga, porque as respostas não fecham, e fique com culpa. Há quem nem tente e diga que tanto faz. Há quem creia e não frequente, e guarde Deus numa gaveta para as horas difíceis. Há quem tenha abandonado tudo com raiva. São posturas diferentes diante do mesmo mapa. Nenhuma delas foi escolhida com todas as letras na mão. O que nos ensinaram sobre Deus e o mundo espiritual está incompleto. Não está errado em tudo, mas está incompleto.
''')

after(1, "Esse quadro descreve com precisão o nosso último problema.", '''
Quatro anos antes, Magritte tinha pintado um cachimbo grande e nítido sobre um fundo liso e escrito embaixo, com letra de caderno escolar: *Ceci n'est pas une pipe*, isto não é um cachimbo. O quadro se chama *A traição das imagens*. Muita gente ri na primeira vez. Depois percebe que a frase está certa: ninguém consegue encher aquele cachimbo de fumo. É a imagem de um cachimbo. Com as palavras acontece o mesmo. A palavra "Deus" não é Deus, e quem discute a palavra pensando que discute a coisa nunca chega a um acordo.
''')

after(1, "É a mesma imagem do nosso banner: lá embaixo", '''
Clarice Lispector escreveu um romance inteiro sobre um desses instantes. Em *A paixão segundo G.H.*, de 1964, uma mulher de vida arrumada entra no quarto da empregada que acabou de ir embora, vê uma barata saindo do armário e a esmaga na porta. Depois olha para ela. Durante horas, diante daquela vida mínima, perde a montagem com que se apresentava ao mundo: o nome, as iniciais gravadas no couro das malas, o apartamento, a pessoa que achava ser. O livro começa assim: "estou procurando, estou procurando. Estou tentando entender." É o grito de Munch sem barulho. Alguém descobre, num quarto vazio, que o eu que carregava era uma construção, e que por baixo dele há algo mais vasto, que ainda não sabe nomear.
''')


# ───────────────────────────── Capítulo 2 · A Busca ─────────────────────────────

after(2, "A Idade Média não destruiu todo o saber antigo", '''
Também não calou todos os que buscavam por dentro. Na Espanha muçulmana do século XII nasceu Ibn Arabi, um místico que passou a vida entre Múrcia, Sevilha, Fez, Meca e Damasco. No *Fusus al-Hikam*, os "engastes da sabedoria", escreveu que só há um ser verdadeiro e que todas as coisas são as suas manifestações, como um mesmo rosto refletido em muitos espelhos. Os seus comentadores deram a essa doutrina o nome de unidade do ser. Um século depois, na Alemanha, o dominicano Mestre Eckhart pregava em língua comum, para monjas e leigos, que Deus não é um objeto a ser visto de fora: "o olho com que vejo Deus é o mesmo olho com que Deus me vê". Pouco depois da sua morte, o papa condenou vinte e oito proposições tiradas dos seus sermões. Os dois falavam línguas diferentes, em religiões diferentes, e diziam o que os *Upanishads* tinham dito: tu és isso.
''')

after(2, "Essas imagens nasceram da boa vontade de explicar", '''
Há um motivo para isso. O desconhecido dá espaço para a imaginação. Quando ninguém sabe ao certo o que é a espiritualidade, a conversa sobre ela escorrega para um de dois lados: o lúdico, de anjinhos, cristais e mensagens do universo, ou o sombrio, de possessões, maldições e filmes de terror. Os dois lados preenchem o mesmo vazio. E os dois perdem a força pelo mesmo motivo: enxergar as coisas como elas são dissolve a fantasia que a imaginação tinha posto no lugar delas.
''')

after(2, "Enquanto a ciência avançou sobre o particular, a metafísica ficou parada.", '''
O cinema deu a esse trono uma imagem que quase todos conhecem. Em *Matrix*, de 1999, o protagonista precisa escolher entre duas pílulas. A azul o devolve ao mundo confortável de antes; a vermelha mostra a verdade, que se revela um deserto de máquinas e de corpos ligados a fios. O público saiu do cinema convencido de que a pílula vermelha é a escolha corajosa. Há uma leitura platônica que inverte o filme. A pílula vermelha não leva para fora da caverna. Leva mais fundo na matéria: canos, carne, sobrevivência. O que o filme chama de verdade é o mundo físico sem disfarce. A saída da caverna de Platão não dá no porão da máquina. Dá no plano das formas, que nenhuma pílula mostra e que só o intelecto alcança.
''')

after(2, "Se os mesmos símbolos aparecem em povos que nunca", '''
Em 1945, o escritor inglês Aldous Huxley reuniu num livro trechos de místicos do Oriente e do Ocidente, de Lao-Tsé a Eckhart, dos *Upanishads* aos sufis, e chamou o conjunto de *A Filosofia Perene*. A tese cabia numa linha: por baixo das religiões há uma mesma metafísica, que reconhece uma realidade divina no fundo das coisas, das vidas e das mentes. Huxley não explicou essa metafísica. Mostrou que ela se repete.

No Brasil, poucos anos depois, um filósofo paulista que construiu a obra fora da universidade tentou o caminho oposto ao dos que mataram a metafísica. Mário Ferreira dos Santos publicou em 1957 a *Filosofia Concreta*, em que procurou demonstrar, tese após tese, como se faz em geometria, verdades que valeriam sempre e em qualquer lugar. O ponto de partida é uma frase simples: alguma coisa há, e o nada absoluto não há. A academia quase o ignorou. É, até hoje, a tentativa brasileira mais ambiciosa de escrever uma metafísica sistemática.
''')

after(2, "O linguista suíço Ferdinand de Saussure", '''
Antes dele, em 1892, o matemático alemão Gottlob Frege tinha notado um problema vizinho. "A estrela da manhã" e "a estrela da tarde" são dois nomes, e por muito tempo se pensou que nomeavam dois astros. Nomeiam o mesmo: o planeta Vênus. Frege separou o sentido de uma expressão daquilo a que ela se refere, e mostrou que muitas confusões nascem de tomar sentidos diferentes por coisas diferentes, ou a mesma palavra pela mesma coisa. Na Inglaterra, George Edward Moore insistia que a filosofia devia começar pelo que o senso comum já sabe, e só depois perguntar o que exatamente queremos dizer quando dizemos o que sabemos.
''')

sub(2, "O segundo Wittgenstein descreveu bem como a linguagem comum funciona, mas desistiu cedo demais.",
    "O segundo Wittgenstein descreveu bem como a linguagem comum funciona, mas desistiu cedo demais. Olhou com atenção para os estados, as palavras e os seus usos, e esqueceu o verbo: aquilo que se repete em todos os jogos e permite traduzir um jogo no outro.")

sub(2, "Todos avançaram. Nenhum fechou o livro.",
    "Todos avançaram. Nenhum fechou o livro. O apêndice C reúne essa travessia numa linha do tempo.")


# ───────────────────────────── Capítulo 3 · O Inferno Cíclico ─────────────────────────────

after(3, "Desce primeiro para o indivíduo, como vida sem sentido.", '''
Esse sofrimento tem nomes que todos conhecem e que raramente ligamos a uma leitura do real. A ansiedade de quem vive no estado seguinte, sempre antecipando o que pode dar errado. A depressão de quem não vê para onde ir. A briga de família que se repete em todo almoço de domingo. O trabalho que esgota sem sentido. O relacionamento em que os dois se tratam como posses. A dívida de quem compra para preencher um espaço que nenhum objeto preenche. Nada disso se resolve só com leitura, e seria leviano dizer o contrário. Mas quase tudo isso piora quando se lê errado o que se é e o que é o outro.
''')

after(3, "Nesse cenário floresce o que chamo de baile de máscaras.", '''
As relações são interpretativas. Não basta ser, há de parecer. Fernando Pessoa fez dessa condição uma obra. Inventou poetas inteiros, com biografia, data de nascimento, estilo e filosofia próprios: Alberto Caeiro, o mestre que só acreditava no que via; Ricardo Reis, o clássico sereno; Álvaro de Campos, o engenheiro inquieto. E deixou, em 1932, quatro versos que muita gente sabe de cor: "O poeta é um fingidor. / Finge tão completamente / Que chega a fingir que é dor / A dor que deveras sente." Pessoa sabia que fingia, e por isso a sua obra não é um baile, mas uma aula sobre ele. O baile de máscaras começa quando o fingidor esquece que finge.
''')

after(3, "Assim o fingimento se torna coletivo", '''
Machado de Assis encontrou um jeito irônico de tirar a máscara: matar o narrador antes de começar. Brás Cubas escreve as suas memórias depois de morto e as dedica ao verme que primeiro roeu as frias carnes do seu cadáver. Só um defunto, explica ele, pode enfim sacudir a capa e jogar fora as lantejoulas, confessar o que foi e o que deixou de ser, porque já não tem opinião alheia a temer. O livro é de 1881 e continua atual, porque descreve uma vida inteira gasta em parecer: na política, no amor, na família, na filosofia de ocasião. A máscara só caiu quando já não havia rosto embaixo dela.
''')

before(3, "## Quem anda no anel", '''
## A moeda de duas faces

A pergunta que o autômato provoca é velha: então não há livre-arbítrio?

Este livro não precisa fechar essa questão para seguir adiante, e é mais honesto dizer isso do que fingir uma certeza. Mas pode mostrar onde ela fica.

Einstein escreveu numa carta, em 1926, que Deus não joga dados. Falava de física, mas a frase serve aqui com um acréscimo: Deus não joga dados, nós jogamos. O universo não conhece o "se". Cada estado leva ao próximo segundo uma regra. O "se" é uma condição humana e aparece sempre que alguém não sabe qual será o próximo estado. A ignorância é a variável imprevisível do sistema. Quem não conhece a tabela vive cercado de possibilidades e chama de escolha a sensação de estar diante delas.

Faça um teste. Imagine uma máquina que conhecesse toda a sua história, as suas crenças, o seu corpo e os seus medos, e respondesse no seu lugar a um questionário sobre o que você faria em cem situações. Se ela acertasse quase todas, onde estaria a escolha? E, se errasse, o erro seria liberdade ou apenas falta de dados?

A existência do livre-arbítrio é uma moeda de duas faces iguais: qualquer que seja o lado, o resultado é o mesmo. Se a liberdade existe, ela só se exerce por quem conhece as regras do próprio autômato. Se não existe, conhecer essas regras é, ainda assim, o novo estado que muda os movimentos seguintes. Nos dois casos o trabalho é o mesmo: estudar a tabela. É o caminho que os próximos capítulos seguem.
''')

after(3, "O mesmo mecanismo que apaga a roupa e o ruído", '''
E o tempo trabalha nesse silêncio. Age como um cupim: não faz barulho, não avisa e corrói tudo o que é estado. O corpo, as relações, os bairros, as famílias, a esperança, a inocência. Ninguém vê o cupim trabalhando. Vê-se, um dia, a viga que cede. O nosso erro é viver como se o hoje fosse durar para sempre.
''')

after(3, "Logo abaixo da imagem, no mesmo pergaminho", '''
Sete séculos antes, um homem tinha escrito sobre essa roda numa prisão. Boécio, filósofo e alto funcionário de Roma, foi acusado de traição e encarcerado em Pavia à espera da execução, por volta de 524. Ali escreveu *A Consolação da Filosofia*. No livro, a Filosofia aparece como uma mulher e empresta a voz à Fortuna, que se defende: girar é a sua natureza, e quem aceita subir na roda não pode chamar de injustiça a descida. A consolação de Boécio não está em sair da roda, e sim em saber que o que ela dá e tira nunca foi dele. O que é seu de verdade, diz a Filosofia, ninguém pode tomar.
''')

after(3, "O Eclesiastes, que abre este capítulo, disse isso", '''
Cada indivíduo é único, mas os eventos foram, são e serão, para sempre, os mesmos. O historiador das religiões Mircea Eliade mostrou, em *O Mito do Eterno Retorno*, de 1949, que os povos antigos sabiam disso e faziam da repetição um rito. O que o homem arcaico considerava real era o gesto que repetia um gesto primordial: plantar como os deuses plantaram, casar como os heróis casaram. Fora desses gestos, o tempo era só desgaste. A repetição, para eles, não era prisão. Era o modo de tocar o que não passa. O homem moderno repete do mesmo jeito, mas sem saber o que repete, e por isso vive a repetição como tédio.
''')

after(3, "Sísifo é o trabalhador que trabalha o mês inteiro", '''
O cinema contou a mesma história com outro final. Em *Feitiço do Tempo*, de 1993, um repórter de televisão arrogante acorda todos os dias no mesmo 2 de fevereiro, numa cidadezinha da Pensilvânia, com a mesma música no rádio. Primeiro aproveita, depois se desespera, depois tenta morrer e acorda de novo na mesma cama. O dia só termina quando ele para de usar a repetição para si e passa a conhecer cada pessoa da cidade, cada acidente que vai acontecer, cada história que se repete, e a agir dentro delas. O anel não se rompe pelo esforço. Rompe-se quando ele aprende o roteiro.
''')

after(3, "Em 1667, John Milton publicou", '''
A mesma figura pode ser lida mais de perto. Satanás, na tradição, é o adversário e o pai da mentira. Lido com as letras deste livro, ele é o nome da individualidade separada: a voz da mente que diz eu, meu, contra, primeiro. A mentira original não é uma frase falsa. É a crença de que somos coisas isoladas. E o Éden não ficou para trás. Já vivemos nele e não o vemos, porque olhamos com os olhos dessa voz. A nossa penitência é encontrar em todas as presenças apenas a nossa ausência.
''')

after(3, "Céu e inferno são estados, e são vividos aqui e agora.", '''
José Saramago imaginou uma cidade inteira caindo nesse estado. Em *Ensaio sobre a Cegueira*, de 1995, uma epidemia de cegueira branca atinge todos, menos uma mulher, que passa a ver o que os outros fazem quando acham que ninguém os vê. Em poucos dias, sem olhos e sem máscaras, as pessoas se tornam capazes do pior. No fim, quando a visão volta, ouve-se a frase que resume o livro: "Penso que não cegámos, penso que estamos cegos, Cegos que vêem, Cegos que, vendo, não vêem." O inferno do romance não veio de fora. Estava em cada um, à espera de que as luzes se apagassem.
''')

after(3, "Para tratar esses sintomas, a indústria criou boas práticas", '''
O catálogo mais famoso é de 1994. Quatro engenheiros, que ficaram conhecidos como a Gangue dos Quatro, reuniram em *Padrões de Projeto* vinte e três soluções que se repetiam nos bons sistemas orientados a objetos. O livro é excelente, e o curioso é o que ele revela: os bons programadores já intuíam que o valor estava no que se repete, nas estruturas que servem a muitos casos, e não nos objetos de cada caso. Mas os padrões foram ensinados como receitas, sem a base filosófica que explicaria por que funcionam. E receita sem princípio vira mais uma camada de jargão.
''')


# ───────────────────────────── Capítulo 4 · O Insight ─────────────────────────────

after(4, "Persegui essa pergunta por cerca de quinze anos.", '''
Nos últimos três anos dessa busca, parei quase tudo para estudar. Foram anos sabáticos, dedicados às mesmas perguntas, agora sem a desculpa do software: o *Caibalion* e os herméticos, os gregos, os místicos, os filósofos da linguagem, as tradições do Oriente. Não foi um retiro de iluminação. Foi trabalho de leitura, de caderno e de dúvida.
''')

after(4, "O meu caminho, olhando para trás, foi o inverso", '''
Não fui o primeiro a chegar à metafísica pela oficina. Em 1974, Robert Pirsig publicou *Zen e a Arte da Manutenção de Motocicletas*, o relato de uma viagem de moto com o filho pelos Estados Unidos que é também um tratado sobre o que ele chamava de Qualidade. Consertando motores, Pirsig percebeu que a qualidade de um trabalho não está no objeto nem em quem o observa: está no encontro dos dois, e vem antes deles. Foi a porta de entrada para uma crítica da separação entre sujeito e objeto que, segundo ele, tinha vindo dos gregos. Ele também começou por uma máquina.
''')

after(4, "O fio, a usina, a luminária são sólidos.", '''
A regra tem nome: princípio da inversão de dependência, o D da sigla. No dia a dia, os programadores o praticam com uma técnica chamada injeção de dependência. Em vez de uma parte do sistema criar sozinha aquilo de que precisa, ela declara um espaço, e alguém de fora o preenche. Foi esse conceito que destravou tudo para mim. Toda abstração está para uma função: o espaço só existe porque há algo que acontece nele. E, quando percebi que as entradas de uma função são exatamente esses espaços, deixei de ver objetos no código e passei a ver lugares esperando para ser ocupados.
''')

after(4, "E é aí que a coisa se complica.", '''
Alguns perceberam. Em 1979, o cientista Douglas Hofstadter publicou *Gödel, Escher, Bach*, um livro enorme que entrelaça um teorema de lógica, as gravuras de mãos que desenham mãos e as fugas de Bach. A ideia que o atravessa é a do laço estranho: um sistema que, ao subir de nível em nível, volta a si mesmo. Hofstadter sugeria que o eu é um laço desse tipo, um padrão que se reconhece, e não uma substância guardada em algum ponto do cérebro. O livro ganhou o Pulitzer e foi lido por gerações de programadores. Quase nenhum deles levou a ideia para o modo como escreve código.
''')

after(4, "E a gnose, por sua vez, reordena tudo o que veio antes.", '''
A cadeia também anda no sentido contrário, e foi assim que andou comigo. A mentalidade vem antes da técnica, mas a técnica também forma a mentalidade. Quem aprende a projetar software separando o que muda do que não muda começa, sem querer, a olhar a vida do mesmo jeito. O modo de construir um sistema pode mudar o modo de ver a realidade.
''')

after(4, "A quarta é uma resposta sobre a eternidade.", '''
Nos primeiros cadernos dei um nome ao que essas quatro coisas, juntas, poderiam produzir: unanimidade religiosa. Não uma religião única, nem uma fé obrigatória para todos. Um conhecimento que leve a Deus por um caminho que qualquer um possa verificar, como todos verificam que três mais três são seis, e no qual as tradições possam se reconhecer sem abrir mão das suas imagens. Se esse conhecimento existe, não será inventado. Será revelado o que estava diante dos nossos olhos.
''')

after(4, "A gnose não pode ser recebida de fora.", '''
Talvez seja até o contrário do que se espera. Muitos aguardam que Deus desça dos céus para pôr ordem no mundo. Pode ser que a consciência de Deus não venha de cima, e sim nasça daqui, da terra, em cada pessoa que aprende a ler o que sempre esteve escrito. Nesse sentido, Deus estaria nascendo: não o Verbo, que é eterno, mas o reconhecimento dele em nós.
''')


# ───────────────────────────── Capítulo 5 · O Erro ─────────────────────────────

after(5, "É aqui que está o erro que dá nome a este capítulo.", '''
A correção pode ser dita de modo seco. A matéria não gera movimento. A matéria apenas responde a instruções estruturais da realidade. O movimento não nasce do objeto, mas da lógica que processa o objeto.
''')

after(5, "Essa regra não pertence à maçã.", '''
O mesmo vale para as três leis que levam o nome de Newton. Um corpo mantém o seu estado de movimento até que algo o altere; a alteração é proporcional à força que a causa; e toda força vem acompanhada de outra, igual e contrária. Lidas juntas, as três dizem quase uma coisa só: o movimento é uma relação entre estados, e não uma propriedade guardada dentro de um corpo. E toda ordem desse tipo tem uma consequência prática que os físicos conhecem bem. Quanto mais padrões se conhecem, mais se prevê o que vai acontecer. Não porque o futuro esteja escrito numa pedra, mas porque as regras não mudam de um dia para o outro.
''')

after(5, "Na prática, isso cobra um preço que todo programador conhece.", '''
Há um sintoma técnico que mostra o erro em pequena escala. Em muitas linguagens, quando se passa um objeto para uma função, passa-se o próprio objeto, e não uma cópia do seu estado. A função recebe as chaves da casa. Se mudar alguma coisa lá dentro, a mudança aparece em todo lugar onde aquele objeto estiver sendo usado, sem que ninguém tenha pedido. Os programadores chamam isso de efeito colateral, e boa parte dos erros mais difíceis de encontrar nasce dele. É a substância de novo: uma coisa com identidade, que todos compartilham e que qualquer um pode alterar.

Alguns programadores já disseram isso com todas as letras. Rich Hickey, criador da linguagem Clojure, fez em 2009 uma palestra sobre identidade e tempo. Disse que a orientação a objetos confunde duas coisas que deveriam estar separadas: o valor, que nunca muda, e a identidade, que é só o nome que damos a uma sequência de valores ao longo do tempo. É o rio de Heráclito dito por um engenheiro. Dois anos depois, numa palestra chamada *Simple Made Easy*, Hickey resgatou um verbo antigo do inglês, *complect*, entrelaçar, para descrever o vício de trançar num só lugar coisas que deveriam estar separadas. Nunca citou Aristóteles. Não precisava.

Bem antes, em 1985, um livro usado por décadas no MIT, *Estrutura e Interpretação de Programas de Computador*, de Harold Abelson e Gerald Sussman, já tinha observado que os problemas começam no momento em que se permite que um objeto mude por dentro. A partir daí o programa precisa se preocupar com o tempo, com o antes e o depois de cada mudança, e raciocinar sobre ele fica muito mais difícil.
''')

after(5, "O mesmo vale para os rótulos que pomos em nós mesmos.", '''
Mário de Andrade escreveu, em 1928, um romance cujo subtítulo é uma provocação a essa ontologia: *Macunaíma, o herói sem nenhum caráter*. Macunaíma nasce preto, fica branco depois de se banhar numa água encantada, vira um príncipe lindo quando quer, muda conforme a história em que entra, e o livro inteiro se recusa a lhe dar uma essência. Muitos leram nele um retrato do Brasil, e é. Mas é também a figura de um sólido sem substância fixa: alguém que é o que a situação faz dele.

Kafka contou o avesso dessa história. Em *A Metamorfose*, de 1915, Gregor Samsa, o caixeiro-viajante que sustenta a família, acorda transformado num inseto. O horror do livro não está só no corpo novo. Está no que a família faz com ele quando Gregor já não pode ocupar o lugar de quem sustenta a casa. A identidade que todos lhe davam era um papel numa história. Quando o papel se esvazia, ninguém sabe mais quem ele é, nem ele mesmo.

Não existem defeitos. Existem ambientes errados. A frase exagera de propósito, mas aponta para o lugar certo: o que chamamos de defeito numa história pode ser virtude em outra. A teimosia que atrapalha numa reunião salva numa travessia. Se é qualidade ou defeito, quem define é o contexto.
''')

before(5, "## A fissura", '''
## Quatro frases

Antes de passar ao alfabeto, vale deixar escrita, em forma de quadro, a pequena gramática que este capítulo usou sem dizer o nome.

| Frase | O que quer dizer |
|---|---|
| A forma é o produto dos critérios. | A história pergunta: tem massa? está no alto? O conjunto dessas perguntas é a forma. |
| A qualidade é a capacidade de ocupar um critério. | Ter massa, estar no alto: cada resposta é uma qualidade. |
| A substância é o produto das qualidades. | Juntam-se as respostas sob um nome, e o resultado é chamado de coisa. |
| O produto das qualidades cria o particular. | Esta laranja, este João: um conjunto de respostas num lugar e num tempo. |

Lida de cima para baixo, a tabela vai do que permanece ao que passa. A forma não pertence a nenhuma coisa: é a pergunta. A coisa é só a soma das respostas que algo deu, num instante, às perguntas das histórias em que entrou. Não confunda critério com qualidade. O critério não muda; a qualidade, sim. Aristóteles inverteu a tabela e pôs a substância no topo.
''')


# ───────────────────────────── Capítulo 6 · A Gnose ─────────────────────────────

after(6, "O Gênesis conta que, antes de qualquer coisa", '''
Uma vez escrevi essa cena como poema, tentando dizer o que o painel mostra:

> Deus, sozinho em sua eternidade, decidiu-se repartir.
> Do uno, fez-se o outro.
> Do que era igual, surgiu o oposto.
> Do unânime, o contraste.
> Do constante, o mutável.
> Da eternidade, o tempo.
> Da luz, a escuridão.
> Do bem, o mal.
> Da ordem, o caos.
> Da paz, a guerra.
> Do alívio, a dor.
> Da felicidade, a tristeza.
> Da sabedoria, a ignorância.
> Do destino, a escolha.
> Do tédio, o desejo.
> Da potência, o ato.
> Do princípio, o fim.
> O que era um Todo único partiu-se e formou todas as coisas.

Cada verso é um par. O poema inteiro é uma lista do que este capítulo vai chamar de letras.
''')

after(6, "A Tábua de Esmeralda, que apareceu no capítulo 2, diz:", '''
Certa vez escrevi esse princípio de outro modo, em duas linhas: não há nada acima que já não esteja abaixo; nem acima, nem abaixo, entre. A correspondência não descreve dois andares que se imitam. Descreve uma mesma estrutura que atravessa todos os níveis e que se encontra no meio, no intervalo, onde as coisas mudam.

A imagem que uso para pensar nisso é a de uma árvore. Do tronco saem galhos, dos galhos, galhos menores, e assim por diante, sempre com a mesma forma, até as pontas, onde estão os frutos. O universo pode ser lido como uma árvore assim, fractal, de galhos que se repetem em todas as escalas. A Terra seria um desses frutos, na ponta de um galho, sem contato com os outros frutos. E nós, nessa ponta, carregamos a forma da árvore inteira.
''')

after(6, "O movimento não está nas fotos.", '''
Em 1907, o filósofo francês Henri Bergson usou essa mesma imagem para criticar o modo como pensamos. Em *A Evolução Criadora*, chamou de mecanismo cinematográfico do pensamento o hábito da inteligência de tirar fotografias instantâneas do que muda e depois tentar reconstruir o movimento juntando as fotografias. Nunca consegue, dizia ele, porque o movimento não é uma soma de posições. Bergson era um crítico duro da substância e defendia que o real é duração, fluxo vivo. Este livro aceita o diagnóstico e tira dele uma consequência que Bergson não tirou: se o movimento não está nas fotos, ele tem de estar numa regra que não é foto nenhuma.
''')

after(6, "E há entre eles uma diferença decisiva.", '''
O início e o fim pertencem ao mundo material, ao tempo. Deus pertence ao outro plano, porque é o próprio processo que transforma o antes no depois. Não é o primeiro quadro nem o último. É o que está entre eles. Deus não é o começo nem o fim: é o meio.
''')

after(6, "É assim que os quadros se encadeiam na fita.", '''
O universo tem os seus relógios visíveis. Os astros giram com tanta regularidade que foram para os homens o primeiro relógio: o dia, o mês, o ano, as estações. Um programador reconhece neles o *clock* de um processador, o pulso que marca quando cada estado deve ser recalculado. E o estado do universo, a cada pulso, não é a posição de um objeto. É o todo das relações entre todos eles. Os verbos não enxergam elementos; enxergam características.

O físico John Wheeler, um dos grandes nomes da física do século XX, resumiu uma intuição parecida em três palavras: *it from bit*. Cada coisa, propôs ele em 1989, deriva a sua existência de respostas a perguntas de sim ou não. A matéria seria, no fundo, informação. Wheeler não falava de Deus. Mas a frase diz, na língua da física, que a matéria é computada.
''')

after(6, "Leibniz, que o capítulo 2 deixou maravilhado", '''
Dentro da mônada, causa e efeito ganham outro desenho. Costumamos pensar as causas como empurrões: uma bola parada recebe o golpe de outra e se move. Mas o que se vê, olhando bem, é sempre um ambiente que perdeu o equilíbrio e o recupera. A água desce porque há desnível. O calor passa porque há diferença de temperatura. A conversa explode porque havia uma tensão acumulada. O movimento é a reação de equilíbrio do ambiente, e não o choque entre objetos parados. Vistos assim, vários estados e movimentos que pareciam separados se revelam um único fenômeno.

Há uma lei popular que os engenheiros repetem rindo e que, nesse quadro, deixa de ser piada: se algo pode dar errado, vai dar. A lei de Murphy é a versão pessimista de uma regra mais geral. Se uma história é possível, isto é, se os seus espaços podem ser preenchidos, cedo ou tarde ela acontece.
''')

after(6, "Isomórfico e polimórfico.", '''
Há um terceiro termo da mesma família. Metamórfico é o que pode tomar qualquer forma sem deixar de ser o que é. Nenhum sólido é metamórfico: a laranja não vira porta. O verbo é. Abrir está em todas as portas, todas as cartas e todas as garrafas ao mesmo tempo, sem se dividir. Se há um ser perfeito, ele teria de ser assim, metamórfico e presente em mais de um lugar ao mesmo tempo. É a definição de verbo.
''')

after(6, "Há também os pares que o hermetismo chamou de gênero.", '''
Isso permite uma afirmação que surpreende quem cresceu com um Deus de barba. Se o verbo é o que cria os espaços, e o espaço é o princípio feminino, então o Verbo, Deus ou o Logos, tem algo de feminino. As línguas antigas guardaram vestígios disso. Em hebraico, *ruach*, o sopro que paira sobre as águas no segundo versículo do Gênesis, é uma palavra quase sempre feminina. A *Shekhiná*, a presença de Deus que habita entre os homens, é feminina. A Sabedoria dos Provérbios, que estava presente quando Deus traçou o círculo sobre o abismo, fala como mulher. O divino, lido assim, não é um homem velho. É o espaço que recebe e o movimento que gera.
''')

after(6, "E há os pares que vieram do meu ofício", '''
Um deles merece nome próprio: roteiro e folha. No software, o roteiro orquestra a ordem dos verbos; a folha, o último galho da árvore de chamadas, executa um único verbo simples. O roteiro é o Logos de um sistema. A folha é o gesto.
''')

after(6, "Dois pares merecem uma linha a mais", '''
Um alfabeto assim pede uma escrita própria. As palavras são lineares: uma depois da outra, como os quadros da fita. Os roteiros são paralelos: muitas coisas acontecem ao mesmo tempo. Em *A Chegada*, filme de 2016 baseado num conto de Ted Chiang, uma linguista tenta aprender a língua de visitantes que escrevem em círculos, frases inteiras desenhadas de uma vez, sem começo nem fim. À medida que aprende a escrita, passa a perceber o tempo como eles: inteiro, de uma vez. É ficção. Mas aponta para o que os programadores chamam de linguagem ubíqua, um vocabulário único para um mesmo sistema, e para o que as tradições chamaram, em outro tom, de língua de Deus: símbolos intuitivos e paralelos, que mostram a estrutura em vez de narrá-la. As mandalas, a Árvore da Vida e os diagramas herméticos do capítulo 2 são tentativas dessa escrita.
''')

after(6, "Com as pessoas não é diferente.", '''
O mesmo vale para o princípio que os lógicos chamam de terceiro excluído: algo é ou não é, sem meio-termo. Dentro de uma mesma história, sob o mesmo critério, ele vale sem exceção. A porta não pode estar aberta e fechada ao mesmo tempo. Mas mude de história e a resposta muda. O mesmo homem é alto ao lado de uma criança e baixo ao lado de um jogador de basquete. Não há contradição. Há duas mônadas, duas perspectivas. A identidade de uma coisa não é absoluta: depende da história a partir da qual se pergunta.
''')

after(6, "Daqui sai uma afirmação que pode soar estranha", '''
O argumento cabe em poucas linhas, e a língua portuguesa ajuda. Há uma diferença ontológica entre o ser, que é eterno, e o estar, que é temporário. O que pode ser criado está sob o efeito do tempo, e o que está sob o tempo também pode ser destruído. Isso é a matéria. Se Deus tivesse criado a realidade inteira, ela inteira estaria sob o tempo e poderia acabar. Mas dentro da realidade há coisas que não acabam: o três, o círculo, a regra da queda. Não se pode criar algo que traz dentro de si conceitos eternos. A realidade sempre esteve aqui, porque depende do eterno, e o que depende do eterno não tem a opção de não existir. O que se faz e se desfaz, a cada instante, é o estar.
''')

after(6, "Essas formas eternas são o que Jung chamou", '''
Jorge Luis Borges imaginou um universo feito só de formas. Em *A Biblioteca de Babel*, de 1941, o mundo é uma biblioteca de galerias hexagonais que contém todos os livros possíveis, todas as combinações das mesmas poucas letras. Em alguma estante está a história minuciosa do futuro, e em milhões de outras, livros sem sentido. Nada pode ser escrito que já não esteja ali. Borges escreveu um pesadelo de bibliotecário e escreveu também, sem querer, uma imagem do que este capítulo diz: o que pode acontecer já tem forma antes de acontecer.
''')

after(6, "Os verbos não agem isolados.", '''
Deus mora no comum. O que todos os quadros de todas as fitas têm em comum é a ordem pela qual um passa ao outro. O comum, visto assim, é extraordinário: é a parte da realidade que não muda em lugar nenhum.
''')

after(6, "O universo inteiro, visto assim, é um grande autômato.", '''
Nesse autômato não há lugar para o caos no sentido em que a palavra costuma ser usada. A física chama de entropia a tendência dos sistemas a se desordenarem, e a medida dessa desordem tem a ver, entre outras coisas, com o quanto se pode saber sobre o estado de um sistema. Quanto mais longe está o observador, mais difícil é prever, e mais o mundo parece desordem. O caos, nessa leitura, é o nome que damos ao que não conseguimos prever, ou à ordem que não é a que gostaríamos de impor. Deus não abre exceções.
''')

after(6, "E, se a consciência é uma só, o mal feito ao outro", '''
Isso responde, em parte, à pergunta mais dura que se faz a qualquer teologia: por que Deus permite o mal? Se o mal é o contraste do bem, um mundo sem mal seria um mundo sem bem visível, como um universo só de preto. E se a dor é a justiceira da natureza, como o capítulo 3 propôs, o mal é também o modo pelo qual uma consciência aprende o que fere. Deus dá com uma mão e tira com a outra. Não por crueldade, mas porque dar e tirar são o mesmo verbo visto dos dois lados.

Guimarães Rosa pôs essa pergunta na boca de um jagunço. Em *Grande Sertão: Veredas*, de 1956, Riobaldo passa o livro inteiro contando a vida a um visitante e tentando saber se fez ou não um pacto com o diabo numa encruzilhada, à meia-noite. "Viver é muito perigoso", repete. "Tudo é e não é." Deus e o diabo andam no mesmo sertão, às vezes na mesma pessoa, no meio do redemoinho. Na última página, Riobaldo chega à sua conclusão: o diabo não há. "Existe é homem humano. Travessia." O demônio que ele temia era o nome de uma travessia mal lida.
''')

after(6, "Mas eles não estão em lugares diferentes", '''
Em matéria, somos distintos. Em espírito, somos os mesmos. Isso permite dar ao espírito uma definição curta: espíritos são padrões comportamentais. Todo comportamento participa de algo universal. O espírito não mora no corpo; mora no padrão. Quando se diz que alguém está tomado pela raiva, pela inveja ou pela coragem, descreve-se com exatidão o que acontece: um padrão que existia antes daquela pessoa, e que existirá depois dela, ocupou por um tempo aquele corpo. Cada um habita o seu próprio mundo, enquanto compartilha a mesma realidade.

O físico David Bohm, que trabalhou com Einstein em Princeton, chegou por outro caminho a uma imagem parecida. Em *A Totalidade e a Ordem Implicada*, de 1980, propôs que o que vemos, partículas, coisas, eventos separados, é uma ordem explicada, desdobrada, que emerge de uma ordem implicada, dobrada, na qual tudo está envolvido em tudo. Chamou o conjunto de holomovimento. Para Bohm, o fundo do real não é uma coleção de objetos. É um movimento inteiro, do qual os objetos são aspectos passageiros.
''')


# ───────────────────────────── Capítulo 7 · A Superação Adâmica ─────────────────────────────

after(7, "Heráclito já tinha dito que não se entra duas vezes", '''
Hermann Hesse contou essa passagem num romance curto. Em *Sidarta*, de 1922, um jovem brâmane abandona a casa do pai, vive com ascetas, conhece o Buda, enriquece na cidade, se perde no luxo e, no fim, vai trabalhar como barqueiro à beira de um rio. É o rio que lhe ensina o que nenhum mestre ensinou. A água está em todo lugar ao mesmo tempo, na nascente e na foz, na cachoeira e no mar, e para ela só existe o presente. O rio muda a cada instante e é sempre o rio. Sidarta não sai do mundo para encontrar o eterno. Encontra-o olhando para o que passa.
''')

after(7, "É isso que o capítulo 6 chamou de padrão.", '''
Os estudiosos das narrativas chegaram a essa conclusão por conta própria. Em 1928, o russo Vladimir Propp analisou uma centena de contos populares e mostrou que, por baixo dos nomes, das bruxas, dos czares e dos animais falantes, todos eram montados com as mesmas trinta e uma funções, numa ordem fixa: a proibição, a transgressão, a partida, o encontro com o doador, a prova, o retorno. Os personagens mudavam de um conto para o outro. As funções, não. Em 1949, o americano Joseph Campbell foi mais longe em *O Herói de Mil Faces*. Comparou mitos do mundo inteiro e encontrou neles uma única jornada, que chamou de monomito: o chamado, a recusa, a travessia do limiar, as provas, a morte simbólica, o retorno com o que foi encontrado. Mil faces, um só herói.

*A Viagem*, o filme de 2012 baseado no romance *Atlas de Nuvens*, de David Mitchell, levou essa ideia para o elenco. Seis histórias, do século XIX a um futuro distante, são vividas pelos mesmos atores, que trocam de rosto, de idade, de sexo e de época, e reencontram em cada vida os mesmos laços e os mesmos conflitos.

Escrevi uma vez, num caderno público, um parágrafo que resume esta seção melhor do que eu conseguiria agora: "Você não possui um espírito. Espíritos são personagens de histórias já escritas. Você é o ator que decide qual personagem irá interpretar. Nenhuma experiência é particular. Escolha bem seus papéis, pois cada um deles já carrega o seu próprio fim. Bem-vindo ao mundo espiritual."
''')

after(7, "Foi isso que chamei de Flow.", '''
Os conceitos do Flow cabem em poucas linhas, e o apêndice B os reúne. Tudo é dado ou função. Cada coisa no sistema tem um endereço: concreto, quando aponta para uma implementação; abstrato, quando aponta para um espaço. Endereços que se conhecem pertencem à mesma camada; os que não se conhecem estão em camadas diferentes. As entradas de uma função formam o seu contexto e funcionam como injeção de dependência: qualquer coisa que caiba no espaço pode ocupá-lo. Uma camada é uma unidade substituível. A execução acontece quando a camada está completa, isto é, quando todos os seus espaços foram preenchidos, como o verbo cair acontece quando há massa, altura e nada que sustente. E uma camada com o contexto completo passa a ser contexto para outra. É o colapso do movimento do capítulo 6 escrito em código.

O arquiteto Christopher Alexander viu algo parecido na construção de casas e cidades. Em *Uma Linguagem de Padrões*, de 1977, descreveu duzentos e cinquenta e três padrões, da escala de uma região à de um banco junto à janela, que se repetem nos lugares onde as pessoas se sentem vivas. Os padrões não são plantas prontas. São problemas que se repetem e a forma das soluções que funcionam, independentes dos tijolos de cada obra. Os programadores leram Alexander, e foi dele que veio a ideia dos padrões de projeto. Mas guardaram os padrões e esqueceram a lição: o que dura é a forma da história, não o material.

No mundo onde tudo é passageiro, quem busca permanência sem se transformar está fadado à ruína. O software que não envelhece não é o que nunca muda. É o que separou o que muda do que não muda.
''')

after(7, "Los não é o personagem de uma história.", '''
Borges contou o caminho inverso num conto de 1940. Em *As ruínas circulares*, um homem chega a um templo em ruínas com um único propósito: sonhar um outro homem, inteiro, e inseri-lo na realidade. Depois de muitas noites, consegue. No fim, quando o fogo toma o templo e não o queima, ele compreende que também é uma aparência, que outro o está sonhando. O conto dá vertigem porque não tem fundo: todo autor é personagem de alguém. Este livro sugere outra leitura. Num certo nível, o sonhador e o sonhado são o mesmo verbo.
''')

after(7, "Você não é o ator. Você também não é a mente", '''
Uma forma de dizer isso é contar os sentidos de outro modo. Os cinco que todos conhecem recebem o mundo material. A mente seria um sexto: reúne estados, crenças, lembranças e abstrações, e por isso pode ser contaminada, como qualquer sentido pode ser enganado. O observador seria um sétimo, e não se parece com nenhum dos outros. Ele não recebe nada. Apenas vê o que os outros seis trazem. É puro porque não guarda estado, e é por ele que o homem se liga ao que não muda.
''')

after(7, "É a partir daí que se escreve.", '''
Como imagem e semelhança de Deus, o papel do homem é ordenar. Escrever a própria história começa por coisas pequenas. Uma delas é dizer, com cuidado, o que se é: eu sou amado, eu sou capaz, eu sou próspero, eu sou bondoso. Não por mágica, mas porque o estado em que alguém se define convida os movimentos que combinam com ele. Outra é trocar a voz da mente, que fala em fila, uma palavra depois da outra, por imagens: ver a cena que se quer viver, inteira, de uma vez, como os visitantes de *A Chegada* escrevem. A voz descreve; a imagem mostra o roteiro. Defina-se para que não seja definido.
''')

after(7, "A perfeição, quando vira posse, é só mais um objeto.", '''
Quem quer tudo perfeito para este mundo não foi feito.
''')

after(7, "É uma boa imagem para o equilíbrio que a superação adâmica pede.", '''
Nem tanto, nem tão pouco. Entre um e o outro. O equilíbrio é a morte do pêndulo do capítulo 3: a superação do desejo de ter e do tédio de possuir.
''')

after(7, "Por isso, no fundo, há um só mandamento", '''
Escrevi esse mandamento, uma vez, de modo mais seco: reconheça o próximo como a si mesmo. Não se trata só de amar. Trata-se de reconhecer, no sentido de conhecer de novo, de ver no outro o que já se conhece em si.

O filósofo Martin Buber escreveu em 1923 um livro pequeno sobre isso, *Eu e Tu*. Há, segundo ele, duas atitudes possíveis diante de qualquer coisa ou pessoa. Na relação Eu–Isso, o outro é um objeto: algo que se usa, se mede, se classifica. Na relação Eu–Tu, o outro é encontrado por inteiro, sem ser reduzido aos seus atributos. Buber não falava de Aristóteles, mas descreveu com precisão o que a ontologia da substância faz com as pessoas: transforma cada Tu num Isso.
''')

sub(7, "Quem se irrita com os outros é escravo deles. Basta",
    "Os estoicos sabiam disso. Epicteto, que foi escravo antes de ser filósofo, ensinava que não são as coisas que perturbam os homens, e sim os juízos que eles fazem sobre as coisas. A tradição tira daí uma consequência dura: quem se irrita com os outros é escravo deles. Basta")

after(7, "Os tradicionalistas chamam algumas dessas atitudes de fraqueza.", '''
A matemática chegou a uma conclusão parecida por outro caminho. No início dos anos 1980, o cientista político Robert Axelrod organizou torneios entre programas de computador que jogavam, centenas de vezes seguidas, um jogo em que cada lado podia cooperar ou trair. Venceu uma estratégia simples, chamada olho por olho: cooperar primeiro e depois repetir o que o outro fez. Mas estudos posteriores mostraram que, num mundo com ruído, onde às vezes um gesto é mal interpretado, o olho por olho estrito prende os jogadores em ciclos intermináveis de retaliação. Vence quem perdoa de vez em quando. É o inferno cíclico do capítulo 3 em forma de tabela. Quem joga só para si ganha uma rodada. Quem joga pelo jogo inteiro, por si e pelos outros, ganha a partida.

Que a tua palavra seja o teu comportamento. Que o teu comportamento seja a tua palavra. Palavra, aqui, quer dizer verbo: o que você faz é o que você diz que é.
''')

after(7, "Nada disso funciona como ideia. Funciona como prática.", '''
Sem essa prática, a vida se parece com uma escada rolante que desce. É preciso subir só para ficar no mesmo lugar, e quem para de subir é levado para baixo sem perceber. A consciência sem ordem vive como numa montanha-russa: sobe por esforço, cai por cansaço, sobe de novo. Com uma ordem, a subida pode ser contínua e lenta, como a de quem planta.
''')

after(7, "Ter um plano, ver o plano e seguir o plano.", '''
Ferramentas simples ajudam. Quatro perguntas que os gerentes de projeto conhecem: quem, o quê, quando e por quê. Um cronograma desenhado numa folha, com o que vem antes e o que vem depois. Quem não sabe para onde vai, qualquer caminho serve.
''')

after(7, "Escolher o que pensar.", '''
A felicidade, aliás, costuma ser mais simples do que o desejo promete. Um banho quente, um café, uma conversa sem pressa, uma história conhecida que devolve o ânimo. Felicidade, muitas vezes, é só não estar preocupado. Infeliz o homem que não enxerga no comum o extraordinário e passa a vida buscando o extraordinário, que logo volta a ser comum.
''')

after(7, "Reservar tempo para lembrar.", '''
Simone Weil, a filósofa francesa que morreu em 1943, aos trinta e quatro anos, escreveu que a atenção, no seu grau mais alto, é a mesma coisa que a oração. Rezar, nesse sentido, não é pedir. É prestar atenção à boa história e imaginá-la inteira, até que ela fique nítida. E Deus, quando se manifesta, raramente aparece como fenômeno. Aparece como sabedoria, como uma ideia que chega na hora certa, ou como uma alegria sem motivo aparente, que não se explica pelo que está acontecendo.
''')

after(7, "Por fim, observar a natureza e colher dela as histórias", '''
Não culpe a realidade. Há muita inteligência em cada resultado.
''')

after(7, "Este livro sustenta que esse jogo não é imaginário.", '''
Nenhuma experiência é particular. Seja honesto na sua intenção.
''')

after(7, "E há uma pergunta que não estava na lista", '''
E há uma razão mais funda. A realidade depende do eterno, e o eterno não tem a opção de não existir. Por isso a realidade também não tem.
''')

after(7, "Ler não tira o homem do mundo.", '''
Goethe escreveu, já velho, um poema sobre a mariposa que se lança na chama. Ele termina com versos que se traduzem mal: enquanto não tiveres isto, morre e torna-te, serás só um hóspede sombrio na terra escura. *Stirb und werde*. Morrer e tornar-se é o movimento de todo estado: deixar de ser o que se era para vir a ser o que se é. E T. S. Eliot, nos *Quatro Quartetos*, deixou os versos que talvez descrevam melhor o fim de um livro como este: não deixaremos de explorar, e o fim de toda a nossa exploração será chegar aonde começamos e conhecer o lugar pela primeira vez.

O homem do banner está no mesmo rochedo do primeiro capítulo. Conhece-o pela primeira vez.
''')

after(7, "Os antigos chamaram isso de gnose.", '''
Apaixone-se pelo que o tempo não pode tocar. Apaixone-se pelo que permanece mesmo quando tudo muda. No fim, tudo é espírito.
''')
