"""Eternos Mutáveis 5.0 — mudanças sobre a 4.0.

1. Banners gerados → obras de arte existentes (assets/obras-v5/cap-N.jpg), uma por capítulo, e reescrita dos
   trechos que liam o banner para lerem a obra nova.
2. Frases dos threads: deixam de ser epígrafes assinadas e citações ("escrevi uma vez…") e entram no corpo do texto,
   sem atribuição (o autor do livro é o autor das frases).

Aplicadas por _build_v5.py DEPOIS das operações da 4.0 (../v4/acrescimos.py, sem EPI). Tipos:
  ("line", n, prefixo, novo)  troca a linha (parágrafo) que começa com `prefixo` (única)
  ("sub",  n, antigo, novo)   troca um trecho (único)
  ("all",  n, antigo, novo)   troca todas as ocorrências (pelo menos uma)
"""

OBRAS = {
    1: ("Pintura de paisagem: no centro, um portão aberto numa muralha de rocha, por onde a luz do Éden explode em raios; à direita, o jardim, com palmeiras, árvores e um lago sob um céu dourado; à esquerda, o mundo de fora, com um vulcão em erupção, nuvens de tempestade, cachoeiras, uma árvore morta e um lobo sobre uma presa; duas pequenas figuras nuas caminham para fora, de costas para a luz",
        "Thomas Cole, Expulsão do Jardim do Éden, 1828. Museum of Fine Arts, Boston."),
    2: ("Numa sala escura, um grupo em volta de um planetário mecânico de anéis de metal; a lâmpada que faz as vezes de Sol está escondida atrás de um menino em silhueta, e ilumina os rostos: duas crianças debruçadas sobre os anéis, um homem que toma notas, um jovem pensativo, e ao fundo o filósofo de cabelos brancos que explica",
        "Joseph Wright of Derby, Um filósofo dando aquela palestra sobre o planetário em que se põe uma lâmpada no lugar do Sol, 1766. Derby Museum and Art Gallery."),
    3: ("Num pátio de prisão cercado por muros altos de tijolo, dezenas de homens de uniforme andam em fila, em círculo, quase todos de cabeça baixa; no centro, um homem sem boné, de cabelos claros; à direita, três homens de cartola observam; no alto do muro, duas pequenas borboletas brancas",
        "Vincent van Gogh, A Ronda dos Prisioneiros (segundo Gustave Doré), 1890. Museu Pushkin, Moscou."),
    4: ("Gravura: um viajante de manto e cajado, de joelhos no fim do mundo, passa a cabeça através da abóbada de estrelas e vê, do outro lado, rodas dentro de rodas e círculos de fogo; atrás dele, uma árvore, colinas, uma cidade e o sol",
        "Gravura Flammarion, em Camille Flammarion, L'atmosphère: météorologie populaire, Paris, 1888. Autor desconhecido."),
    5: ("Bloco de mármore inacabado de onde emerge o corpo de um homem: o peito, a barriga, uma coxa dobrada e um braço erguido que esconde o rosto; o resto é pedra bruta, com as marcas do cinzel",
        "Michelangelo Buonarroti, um dos Prisioneiros para o túmulo de Júlio II, c. 1520–1534. Galleria dell'Accademia, Florença. Foto: Jörg Bittner Unna, CC BY-SA 3.0."),
    6: ("Quadro dividido ao meio por uma linha horizontal: em cima, fundo preto, de onde desce de cabeça para baixo um cisne branco de pés azuis; embaixo, fundo branco, de onde sobe um cisne preto; os dois se tocam bico com bico sobre a linha, e as pontas das asas se encontram à esquerda",
        "Hilma af Klint, O Cisne, nº 1, Grupo IX/SUW, 1915. Fundação Hilma af Klint, Estocolmo."),
    7: ("Um jovem nu, de pé sobre um morro escuro, com os braços abertos de ponta a ponta e uma perna lançada para a frente, como quem começa a dançar; atrás dele, raios de ouro, vermelho e azul se abrem como um sol que nasce do seu corpo",
        "William Blake, Albion Rose (Glad Day), c. 1794–1796, impressão a cores de A Large Book of Designs. British Museum, Londres."),
}

OPS = []
def L(n, a, b): OPS.append(("line", n, a, b.strip()))
def S(n, a, b): OPS.append(("sub", n, a, b))
def ALL(n, a, b): OPS.append(("all", n, a, b))


# ───────────────────── Capítulo 1 · Thomas Cole, Expulsão do Jardim do Éden ─────────────────────

S(1, "## Um homem de joelhos", "## O portão de luz")
L(1, "No centro da imagem que abre este capítulo há um homem ajoelhado", '''
No centro da imagem que abre este capítulo há uma muralha de rocha, e na rocha um portão por onde a luz sai como uma enchente. Do lado de lá, à direita, está o jardim: palmeiras, árvores carregadas, um lago parado, montanhas azuladas sob um céu dourado de fim de tarde. Do lado de cá, à esquerda, começa o mundo: um vulcão em erupção, nuvens de tempestade, cachoeiras que caem no escuro, uma árvore morta torcida pelo vento e, sobre as pedras, um lobo debruçado sobre uma presa. Thomas Cole pintou a cena em 1828 e lhe deu o nome de *Expulsão do Jardim do Éden*.
''')
L(1, "O resto da cena conta outra história.", '''
É preciso procurar para encontrar os personagens. São pequenos, quase perdidos na paisagem: dois corpos nus que acabam de cruzar o portão e caminham, de costas para a luz, rumo à tempestade. A luz que sai do jardim ainda os alcança pelas costas e desenha a sombra deles no chão. Nenhum dos dois se vira. Entre os dois mundos há um abismo, com água caindo no escuro. E ao fundo, à direita, o jardim continua aceso. Ninguém foi apagá-lo. Ele só deixou de ser olhado.
''')
S(1, "E carrega nas mãos uma luz que, em pouco tempo, não saberá mais de onde veio.",
     "E traz nas costas uma luz que, em pouco tempo, não saberá mais de onde veio.")
L(1, "No banner deste capítulo, é o jovem do lado direito.", '''
No quadro de Cole, são as duas figuras pequenas na saída do portão. Receberam a mesma luz que ainda brilha atrás delas, mas já não olham para ela. Deram as costas ao jardim e caminham, decididas, em direção ao mundo, onde terão um nome, uma casa, uma função e uma imagem de si.
''')
S(1, "No lado direito do banner, a cidade aonde o jovem se dirige tem torres, muralhas, casas empilhadas, a obra das mãos humanas.",
     "No quadro de Cole, o mundo para onde os dois caminham ainda é selvagem: vulcão, tempestade, lobo. Bastaram alguns milênios para que o homem o cobrisse de torres, muralhas, casas empilhadas, a obra das próprias mãos.")
L(1, "No céu do banner, no alto à direita,", '''
No quadro de Cole, ao fundo, à direita, quase confundido com a bruma dourada, o jardim continua: árvores, água, montanhas, uma luz de fim de tarde que não acaba. Ele está lá o tempo todo. Nenhuma das duas figuras olha para ele.
''')
S(1, "O homem adâmico não é só aquele a quem a geometria falta.", "O homem adâmico não é só aquele a quem a ordem do mundo falta.")
L(1, "A geometria do banner está incompleta", '''
O jardim de Cole não sumiu da paisagem. O que falta não está no fundo do quadro; está em quem caminha: as letras para lê-lo. Comemos o fruto e ganhamos a terra. Mas, neste fruto, nesta terra, ainda somos analfabetos espirituais.
''')
S(1, "É a mesma imagem do nosso banner: lá embaixo, a vida ordinária; lá em cima, uma ordem viva que quase ninguém vê.",
     "É a mesma divisão do quadro de Cole: de um lado, a vida ordinária, com as suas tempestades; do outro, uma ordem viva que quase ninguém vê.")
L(1, "No banner, o homem continua ajoelhado.", '''
No quadro, as duas figuras continuam andando. A tempestade continua à esquerda; o vulcão, ao fundo; o abismo, entre os dois mundos. Nada mudou na cena. E, no entanto, ela guarda dois detalhes fáceis de passar.
''')
L(1, "O primeiro: a centelha não se apagou.", '''
O primeiro: a luz não se apagou. Ela atravessa o portão e acompanha os dois pelas costas até a beira do caminho. O véu cobre a origem, mas não a extingue. Aquilo que encarnou continua presente em cada um de nós, e o mesmo intelecto que o homem adâmico usa apenas para lidar com a matéria está disponível, inteiro, para ler o que está além dela.
''')
L(1, "O segundo: a caverna tem uma abertura.", '''
O segundo: o portão ficou aberto. O Gênesis põe na entrada do jardim querubins com uma espada de fogo. Cole não pintou guarda nenhum. Pintou só a luz, saindo. Nenhuma das duas figuras a vê ainda. Mas ela está ali, a um giro de cabeça.
''')


# ───────────────────── Capítulo 2 · Wright of Derby, O planetário ─────────────────────

S(2, "## Uma lanterna no rochedo", "## Uma lâmpada no lugar do Sol")
L(2, "O capítulo anterior terminou com um homem de pé no alto de um rochedo", '''
O capítulo anterior terminou com um homem de pé no alto de um rochedo, de costas para nós, diante de um mar de névoa. A imagem que abre este capítulo leva a pergunta para dentro de casa. É noite, numa sala escura da Inglaterra do século XVIII. Em volta de uma mesa, um grupo olha para um planetário mecânico: anéis de metal que se cruzam como um céu de arame, pequenas esferas que giram em volta de um centro. Joseph Wright of Derby pintou a cena em 1766 e lhe deu um título comprido: *Um filósofo dando aquela palestra sobre o planetário em que se põe uma lâmpada no lugar do Sol*.
''')
L(2, "O fio não vai direto a lugar nenhum.", '''
A lâmpada não aparece. Está escondida atrás de um menino sentado de costas, em primeiro plano, que vemos só como silhueta. Mas tudo na sala é iluminado por ela. Duas crianças se debruçam sobre os anéis, com o rosto aceso de espanto. Um homem toma notas. Um jovem apoia a cabeça na mão e pensa. Ao fundo, o filósofo de cabelos brancos explica. Cada um recebe a luz no próprio rosto, e cada um a recebe de um ângulo diferente. Ninguém olha diretamente para a fonte.
''')
L(2, "Nos cantos da cena, quase invisíveis, há de novo círculos e linhas", '''
Os anéis do planetário são uma geometria: círculos, eixos, órbitas que se cruzam. São o modelo de uma ordem que ninguém na sala consegue ver no céu de verdade. Ali ela cabe sobre uma mesa, e ainda assim cada um a entende pela metade.
''')
L(2, "Este capítulo é a travessia desse fio.", '''
Este capítulo é uma volta em torno dessa mesa. Durante milênios, civilizações que nunca se conheceram sentaram-se diante da mesma luz escondida e a descreveram, cada uma do seu ângulo. Deixaram símbolos: uma chama, o yin-yang, uma roda de oito raios, um olho egípcio, um bastão com duas serpentes e asas, uma coluna grega, um triângulo, um cubo, uma serpente que morde a própria cauda, uma cruz, um esquadro cruzado com um compasso, um livro aberto. Cada símbolo é uma tentativa de resposta às perguntas que fecharam o capítulo 1: do que é feita a realidade, se Deus existe, o que há depois da morte, o que somos. O percurso é rápido e não pretende ser um tratado de história das religiões. Serve como mapa, para mostrar que essas civilizações tocaram, cada uma com as próprias mãos, partes da mesma estrutura.
''')
S(2, "O primeiro símbolo no fio dourado é uma chama.", "O primeiro símbolo da travessia é uma chama.")
ALL(2, "símbolo do fio", "símbolo da travessia")
S(2, "O cubo dourado do banner vem daí.", "O cubo da lista de símbolos vem daí.")
S(2, "No banner, ela representa outra corrente", "Aqui, ela representa outra corrente")
S(2, "O fio dourado do banner passa pela China,", "A travessia deste capítulo passa pela China,")
S(2, "porque o próprio real tem estrutura, e os símbolos",
     "porque o universo é estruturado como linguagem, e os símbolos")
S(2, "E aqui o fio dourado chega a mim.", "E aqui a travessia chega a mim.")
L(2, "No alto do banner, o fio dourado termina num livro aberto.", '''
Na sala de Wright, a lâmpada continua escondida. Todos os rostos estão acesos por ela, e ninguém a vê. O último símbolo desta travessia é parecido: um livro aberto cujas páginas brilham, mas onde não se pode ler o que está escrito.
''')
S(2, "Cada símbolo que o fio atravessou deixou uma contribuição.", "Cada símbolo desta travessia deixou uma contribuição.")


# ───────────────────── Capítulo 3 · Van Gogh, A Ronda dos Prisioneiros ─────────────────────

S(3, "## Um anel de passos", "## Uma roda de passos")
L(3, "Há dezenas deles. Caminham um atrás do outro sobre um anel", '''
Há dezenas deles. Num pátio de prisão fechado por muros altos de tijolo, homens de uniforme andam em fila, um atrás do outro, em círculo, todos no mesmo passo, quase todos de cabeça baixa, alguns com as mãos atrás das costas. Nenhum vai a lugar nenhum. O caminho se fecha e, se continuar andando, cada um passará de novo exatamente pelo ponto onde está agora. A roda não tem começo nem fim. Por isso cada um acredita que está indo para algum lugar.
''')
L(3, "No centro do anel, no vazio, há um pêndulo.", '''
Van Gogh pintou esta cena em 1890, internado num asilo em Saint-Rémy, copiando uma gravura de Gustave Doré sobre o pátio da prisão de Newgate, em Londres. Deu ao homem do centro, o único sem boné, cabelos claros como os seus. Ao lado, três homens de cartola observam a roda com as mãos para trás. Também eles estão dentro do pátio.
''')
L(3, "Do alto, de fora do anel, caem raios de luz em linha reta.", '''
Lá em cima, perto de onde o muro termina, voam duas pequenas borboletas brancas, do tamanho de uma pincelada. Ninguém no pátio levanta os olhos para elas. As janelas são altas e gradeadas, o chão é de pedra fria, e não há fogo nem demônio. O inferno desta imagem é feito só de muro e de repetição.
''')
S(3, "## Quem anda no anel", "## Quem anda na roda")
L(3, "No banner, cada figura caminha sozinha,", '''
No quadro, cada prisioneiro caminha sozinho, embora estejam todos no mesmo círculo, no mesmo passo, a poucos centímetros uns dos outros. Cada um se sente único. Vistos do alto, como os vê o pintor, são todos o mesmo.
''')
L(3, "No centro do anel, o pêndulo continua oscilando", '''
Dentro de cada um que anda na roda há ainda um segundo movimento, que a pintura não mostra: um pêndulo que oscila entre dois polos, sem parar em nenhum.
''')
S(3, "Basta uma decisão diferente no ponto certo do ciclo para que ele se rompa.",
     "Para toda decisão, um ciclo; e basta uma decisão diferente no ponto certo do ciclo para que ele se rompa.")
S(3, "As brasas nos cantos do banner não estão debaixo da terra, num mundo futuro. Estão logo ali, abaixo do anel, ao lado do caminho de todos os dias.",
     "O pátio de Van Gogh não fica debaixo da terra, num mundo futuro. Fica logo ali, atrás de um muro de tijolos, no caminho de todos os dias.")
S(3, "## Os raios sobre o anel", "## As borboletas sobre o muro")
L(3, "No banner, as figuras continuam caminhando.", '''
No quadro, os prisioneiros continuam andando. Os homens de cartola continuam olhando. O muro continua alto.
''')
L(3, "Mas a imagem guarda, como as dos capítulos anteriores, um detalhe fácil de perder.", '''
Mas a imagem guarda, como as dos capítulos anteriores, um detalhe fácil de perder. As duas borboletas no alto do muro não são decoração. Vêm de fora do pátio, de onde a roda não alcança, e se movem como nada lá embaixo se move: livres, sem fila, sem volta marcada. Não há posição no círculo de onde não possam ser vistas.
''')
L(3, "O que falta às figuras não é a luz. É levantar os olhos.", "O que falta aos homens do pátio não é o céu. É levantar os olhos.")


# ───────────────────── Capítulo 4 · Gravura Flammarion ─────────────────────

S(4, "## Uma porta no rochedo", "## O ponto onde o céu toca a terra")
L(4, "O rochedo ainda é o mesmo.", '''
No fim do primeiro capítulo, um homem estava de pé num rochedo, diante de um mar de névoa. No segundo, um grupo olhava, numa sala escura, para um planetário aceso por uma lâmpada que ninguém via. No terceiro, prisioneiros andavam em roda num pátio fechado, e só duas borboletas estavam do lado de fora.
''')
L(4, "Na imagem que abre este capítulo, a névoa baixou", '''
A gravura que abre este capítulo mostra um viajante que chegou ao fim do mundo. A legenda com que ela foi publicada, em Paris, em 1888, conta que um missionário da Idade Média dizia ter encontrado o ponto onde o céu e a terra se tocam. Atrás do homem está o mundo que ele conhece: uma árvore, colinas, uma cidade com torres, o sol com rosto, as estrelas pregadas numa abóbada. Na frente dele, essa abóbada termina. Ela desce até o chão como um pano, e o homem, de joelhos, com o cajado ainda na mão, passou a cabeça e um braço através dela.
''')
L(4, "O homem não usa túnica nem manto.", '''
Do outro lado não há estrelas pregadas. Há rodas dentro de rodas, nuvens em faixas, círculos de fogo: o mecanismo que move, por trás, o céu que ele conhecia. O homem não quebrou nada para chegar ali. Não há martelo, nem escada, nem guarda com a chave. A abóbada que parecia o limite do mundo cedeu quando ele a tocou.
''')
L(4, "No céu, à direita, está de novo a geometria", '''
Desde o primeiro capítulo, este livro fala de uma ordem que está diante de todos e que ninguém lê. No quadro de Cole, era o jardim que ficava para trás, aceso. No planetário de Wright, era um modelo de metal sobre a mesa, iluminado por uma luz escondida. Aqui ela aparece pela primeira vez como aquilo que é: a estrutura que move o que se vê. O céu continua o mesmo. Mudou o lugar de onde o homem olha.
''')
L(4, "Este capítulo trata dessas três coisas: a porta, a corrente e o desenho no céu.",
  "Este capítulo trata dessas três coisas: a passagem, a prisão sem grades e o mecanismo do outro lado.")
S(4, "## Uma corrente sem ferro", "## Uma prisão sem grades")
L(4, "Mas a corrente do banner não é de ferro.", '''
Mas a abóbada da gravura não é de pedra. Ela é feita da mesma matéria que o capítulo 1 descreveu: um mapa herdado sem exame, uma linguagem torta, uma leitura do real que toma o cisco pelo todo. Uma prisão feita de ignorância tem uma propriedade estranha. Ela não cede à força. Ninguém deixa de ignorar porque se esforçou mais, nem porque foi castigado, nem porque obedeceu. Mas cede inteira à compreensão. No momento em que o homem entende o que o prendia, a abóbada perde a firmeza, e o que parecia o fim do mundo vira um pano que se pode atravessar.
''')
L(4, "A chave foi uma distinção que todo arquiteto de software conhece", '''
A chave da metafísica estava guardada na programação. Era uma distinção que todo arquiteto de software conhece e quase ninguém leva até o fim: a diferença entre o sólido e o abstrato.
''')
S(4, "## A corrente em faíscas", "## Do outro lado da abóbada")
L(4, "No banner, o homem ainda não atravessou a porta.", '''
Na gravura, o viajante ainda não atravessou. Está de joelhos no limiar, com metade do corpo de cada lado: os pés na terra que conhece, a cabeça no mecanismo que move o céu. Vê as rodas, mas ainda não sabe lê-las.
''')
L(4, "Antes de atravessar, ele precisa olhar para os elos que ainda restam", '''
Antes de atravessar, ele precisa saber quem pintou aquela abóbada e por que todos a tomaram pelo fim do mundo. Uma parte dela foi traçada há vinte e quatro séculos, num gesto que Rafael pintou no centro da Escola de Atenas: a mão aberta de um homem de azul, voltada para o chão.
''')


# ───────────────────── Capítulo 5 · Michelangelo, Prisioneiro ─────────────────────

S(5, "## A luz no bloco", "## O corpo na pedra")
L(5, "À esquerda da imagem que abre este capítulo há uma figura de pedra.", '''
A imagem que abre este capítulo é um bloco de mármore que não chegou a ser estátua. De dentro dele sai um corpo de homem: o peito, a barriga, uma coxa dobrada, um braço erguido que esconde o rosto. O resto ainda é pedra bruta, com as marcas do cinzel à vista. A cabeça não saiu. As pernas não saíram. O homem parece querer se soltar, e o bloco não deixa.
''')
L(5, "No centro, de cima a baixo, uma fissura de luz racha a cena.", '''
Michelangelo começou uma série dessas figuras para o túmulo do papa Júlio II e as deixou inacabadas. Hoje elas estão em Florença, na Galleria dell'Accademia, ao longo do corredor que leva ao *Davi*. São chamadas de *Prisioneiros*, ou *Escravos*. Os visitantes passam por elas a caminho da estátua perfeita, e muitos saem achando os blocos mais fortes do que ela. No *Davi*, a forma venceu a pedra. Nos *Prisioneiros*, vê-se a luta.
''')
L(5, "À direita da fissura, a pedra desaparece.", '''
Atribui-se a Michelangelo uma ideia sobre o seu ofício: a figura já está dentro do bloco, e o trabalho do escultor é só tirar o que sobra. A frase é provavelmente lendária, mas resume com exatidão uma filosofia. Ela diz que a forma mora dentro da matéria, presa nela, à espera de ser libertada pelo cinzel.
''')
L(5, "O capítulo 2 deixou dois homens caminhando lado a lado no centro da *Escola de Atenas*", '''
O capítulo 2 deixou dois homens caminhando lado a lado no centro da *Escola de Atenas*, um apontando para o alto e outro com a mão espalmada para o chão, e prometeu dizer por que este livro discorda da mão espalmada. O prisioneiro de Michelangelo mostra, em mármore, o que aquela mão ensinou: a forma não está acima das coisas. Está trancada dentro de uma delas.
''')
L(5, "Os cubos do lado direito são a mesma operação", '''
Os programadores repetem a mesma operação, dois mil e trezentos anos depois, cada vez que fecham um comportamento dentro de um objeto.
''')
L(5, "A figura de pedra do banner é, por isso, uma escolha exata.", '''
O prisioneiro de Michelangelo é, por isso, uma imagem exata do que Aristóteles pensava: uma estátua, forma presa numa matéria, o exemplo que ele próprio preferia. Só que inacabada, e por isso honesta. Deixa ver o esforço de uma forma que não cabe no bloco.
''')
L(5, "Os cubos do banner estão trancados.", '''
O prisioneiro de mármore tem um parente no código. Cada objeto de um programa é um bloco com o seu cadeado, que os programadores chamam de encapsulamento. E o comportamento que deveria correr livre entre eles é obrigado a entrar e sair de cada caixa, passando pelos cadeados, para chegar a qualquer lugar.
''')
S(5, "## A fissura\n", "## O que o cinzel tira\n")
L(5, "No banner, a fissura de luz desce do céu", '''
Diante do prisioneiro, a primeira impressão é de derrota: a pedra venceu, o corpo ficou preso. Mas basta olhar de novo para ver outra coisa. O que sai do bloco não é pedra. É movimento: o braço que se ergue, o tronco que gira, a perna que dobra. A figura não está no mármore como um objeto numa caixa. Está nele como um gesto que ainda não terminou. O cinzel não fabrica a forma; só tira o que a escondia. A forma não pertence à matéria. Passa por ela.
''')
S(5, "Quando a linha é refeita, a luz que estava presa no bloco não some.",
     "Quando a linha é refeita, a forma que parecia presa no bloco não some.")


# ───────────────────── Capítulo 6 · Hilma af Klint, O Cisne nº 1 ─────────────────────

S(6, "## Um ponto de luz", "## Dois cisnes")
L(6, "A imagem que abre este capítulo é quase vazia.", '''
A imagem que abre este capítulo tem quase só duas cores. Uma linha reta a divide ao meio. Em cima, o fundo é preto, e dele desce, de cabeça para baixo, um cisne branco, de asas abertas e pés azuis. Embaixo, o fundo é branco, e dele sobe um cisne preto, de asas também abertas. Os dois pescoços se curvam um para o outro, e os bicos se tocam exatamente sobre a linha. À esquerda, a ponta de uma asa encosta na ponta da outra.
''')
L(6, "Uma linha reta corta a cena na horizontal.", '''
A pintora sueca Hilma af Klint, que reaparece mais adiante neste capítulo, fez este quadro em 1915. É o primeiro de uma série chamada *O Cisne*. Ao longo dela, os dois pássaros vão perdendo a plumagem e virando formas: círculos, quadrados, metades de cores opostas que se encaixam. É como ver alguém passar do sólido ao abstrato diante dos nossos olhos. Desta vez, a imagem vai ser lida.
''')
L(6, "O capítulo 1 terminou dizendo que a geometria do céu estava incompleta", '''
O capítulo 1 terminou dizendo que o jardim continuava aceso diante de todos e que faltavam, em quem caminhava, as letras para lê-lo. O capítulo 2 percorreu as civilizações que tentaram escrever essas letras e mostrou que nenhuma fechou o livro. Os capítulos seguintes nomearam o preço dessa falta, a chave que permite abri-lo e o erro que o manteve fechado. Este é o capítulo das letras.
''')
S(6, "Uma vez escrevi essa cena como poema, tentando dizer o que o painel mostra:",
     "Dito em versos, o que o painel mostra é isto:")
S(6, "É o ponto solitário do canto esquerdo do banner.",
     "A dualidade é a história do contraste. Hilma af Klint pintou isso em escala maior: o cisne branco só aparece porque desce sobre o preto, e o preto só porque sobe sobre o branco.")
L(6, "Há ainda a linha horizontal do banner.", '''
Há ainda a linha horizontal do quadro. Acima dela, o fundo é preto e o cisne é branco; abaixo, o fundo é branco e o cisne é preto. Um é o reflexo invertido do outro, e os dois se tocam exatamente sobre a linha, bico com bico.
''')
S(6, "Certa vez escrevi esse princípio de outro modo, em duas linhas: não há nada acima",
     "Dito de outro modo: não há nada acima")
L(6, "O centro do banner é ocupado por uma fita de cinema.", "Imagine agora uma fita de cinema.")
S(6, "Na fita do banner, é como se em cada quadro", "Numa fita assim, é como se em cada quadro")
S(6, "As palavras sobre o céu estão invertidas, como o reflexo do banner deste capítulo.",
     "As palavras sobre o céu estão invertidas, como os cisnes do quadro que abre este capítulo.")
L(6, "No banner, à direita dos dois círculos, há um cubo", '''
O capítulo 2 encontrou, entre os símbolos das tradições, um cubo: o cubo do *Timeu*. Imagine-o agora desenhado só pelas arestas. Ele não tem faces, nem cor, nem peso. É uma forma vazia, à espera de quem a preencha.
''')
S(6, "O ponto branco do canto esquerdo e o cubo do canto direito são o começo e o fim desta travessia.",
     "O ponto branco sobre o fundo preto e o cubo de arestas são o começo e o fim desta travessia.")
L(6, "E embaixo da linha do horizonte, tudo se repete.", '''
E, como no quadro dos cisnes, embaixo da linha tudo se repete. O que vale para o cosmos vale para a vida de cada um. As figuras que saíram do jardim no primeiro capítulo, com a luz nas costas e sem saber de onde ela vinha, agora têm as palavras para dizer o que carregam. Essa luz é da natureza do Verbo. Ela não se apagou porque não pode se apagar.
''')


# ───────────────────── Capítulo 7 · Blake, Albion Rose ─────────────────────

S(7, "## Um homem de braços abertos", "## Albion se levanta")
L(7, "No primeiro capítulo havia um homem ajoelhado", '''
No primeiro capítulo, duas figuras pequenas deixavam um jardim de luz e caminhavam, de costas para ele, rumo à tempestade. No terceiro, homens andavam em roda num pátio fechado, de cabeça baixa. No quarto, um viajante passava a cabeça através do céu e via as rodas que o movem. A imagem que abre este capítulo mostra um homem que não anda mais em roda.
''')
L(7, "É noite de novo. O homem está de pé na pedra", '''
Ele está de pé sobre um morro escuro, nu, com os braços abertos de ponta a ponta do quadro e uma perna lançada para a frente, como quem começa uma dança. Não segura nada. A luz não vem de trás dele, nem de uma janela, nem de uma lâmpada escondida: irradia dele. Em volta do corpo, raios de ouro, de vermelho e de azul se abrem como um sol que nasce do próprio peito.
''')
L(7, "Debaixo dela cresce uma árvore.", '''
William Blake imprimiu essa figura em cores por volta de 1795 e lhe deu o nome de Albion, o homem primordial da sua mitologia, aquele em quem toda a humanidade está contida. Anos depois, numa versão gravada em linha, escreveu embaixo: Albion levantou-se de onde trabalhava no moinho com escravos. E desenhou, aos pés dele, um verme e uma mariposa de asas de morcego.
''')
L(7, "Aos pés do homem, no chão, há três máscaras.", '''
O moinho é a roda do capítulo 3. O verme e a mariposa são as formas que o homem teve enquanto girava nela. Ficaram no chão. Ninguém as usa mais.
''')
L(7, "Este capítulo é sobre o que separa esse homem do homem ajoelhado do começo.", '''
Este capítulo é sobre o que separa esse homem das figuras que saíram do jardim no começo. Nada mudou no mundo em volta dele: o chão continua escuro, a matéria continua ali. O que mudou foi a leitura. Ele aprendeu as letras. E, ao aprendê-las, descobriu que a luz que procurava lá fora vinha do mesmo lugar de onde agora irradia.
''')
S(7, 'Escrevi uma vez, num caderno público, um parágrafo que resume esta seção melhor do que eu conseguiria agora: "Você não possui um espírito.',
     "Você não possui um espírito.")
S(7, 'Bem-vindo ao mundo espiritual."', "Bem-vindo ao mundo espiritual.")
L(7, "O banner deste capítulo mostra a mesma coisa de outro jeito.", '''
A imagem deste capítulo mostra a mesma coisa de outro jeito. Albion não segura a luz. Ela sai dele. O que ele carrega não é um objeto que possa perder; é aquilo que ele é.
''')
S(7, "Escrevi esse mandamento, uma vez, de modo mais seco: reconheça", "Esse mandamento pode ser dito de modo mais seco: reconheça")
S(7, "A árvore do banner não nasceu pronta.", "Nenhuma árvore nasce pronta.")
S(7, "É a mesma postura do homem do banner. E embaixo, no lugar das máscaras, um túmulo vazio.",
     "É a mesma postura de Albion. E embaixo, no lugar do verme e da mariposa, um túmulo vazio.")
S(7, "## A geometria acesa", "## O jardim por dentro")
L(7, "No banner, a luz sai do peito do homem", '''
No primeiro capítulo, o jardim continuava aceso atrás das duas figuras, e nenhuma delas se virava. Dissemos então que ele não estava longe porque tivesse se afastado, mas porque faltava algo em quem caminhava: as letras para lê-lo.
''')
L(7, "Agora ela está acesa. A luz que a acende vem do próprio homem.", '''
Na imagem de Blake não há jardim ao fundo. Não precisa haver. A luz que no começo ficava para trás, do outro lado do portão, agora sai do próprio homem. O que estava fora passou a ser lido por dentro. Assim em cima como embaixo; assim fora como dentro.
''')
L(7, "Ler não tira o homem do mundo.", '''
Ler não tira o homem do mundo. Ele continua sobre o mesmo chão escuro, na mesma terra. Continua com fome, com cansaço, com histórias para viver. Mas deixou no chão o verme, a mariposa e as máscaras. Sabe que é o mesmo que os outros. Sabe que o que muda passa e que o que não muda permanece, e por isso se apega aos eventos, não aos indivíduos; aos eternos, não aos mutáveis. Sabe que é as duas coisas ao mesmo tempo.
''')
L(7, "O homem do banner está no mesmo rochedo do primeiro capítulo.", '''
Albion pisa a mesma terra para onde as figuras de Cole caminhavam no primeiro capítulo. Conhece-a pela primeira vez.
''')
S(7, "A cidade do primeiro banner, com suas torres e muralhas, é o retrato dessa leitura.",
     "As torres e muralhas que o homem ergueu no mundo para onde as figuras de Cole caminhavam são o retrato dessa leitura.")
S(7, "As máscaras do banner estão no chão porque o homem descobriu que eram máscaras.",
     "O verme e a mariposa ficam no chão, aos pés de Albion, porque o homem descobriu que eram só formas de passagem.")
S(3, "Falta dizer qual é o conhecimento capaz de romper o anel.", "Falta dizer qual é o conhecimento capaz de romper a roda.")
S(1, "## A centelha na mão", "## A luz que acompanha")
S(4, "O capítulo 1 terminou lembrando que a centelha que caiu nas mãos de Adão não se apagou.",
     "O capítulo 1 terminou lembrando que a luz que acompanhou Adão para fora do jardim não se apagou.")
S(6, "Em 1907, uma pintora sueca chamada Hilma af Klint pintou", "Em 1907, oito anos antes dos cisnes, Hilma af Klint pintou")
