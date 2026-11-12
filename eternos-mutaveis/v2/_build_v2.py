#!/usr/bin/env python3
"""Eternos Mutáveis — versão 2.0.

Lê os capítulos 1.0 (../novo-capitulo-N-claude.md, que não são alterados) e gera v2/capitulo-N.md com:
  1. títulos novos (A Era Adâmica · A Busca · O Inferno Cíclico · O Insight · O Erro · A Gnose · A Superação Adâmica);
  2. a gravura renascentista no lugar do banner colorido (assets/gravuras/cap-N.jpg), com crédito;
  3. os trechos que liam o banner antigo reescritos para ler a gravura ("a gravura que abre este capítulo");
  4. sem imagens repetidas: cada obra aparece uma vez; quando o texto volta a ela, remete ao capítulo onde apareceu.
Depois gera v2/eternos-mutaveis-v2.html (capa D + sumário + 7 capítulos) e o PDF.

Uso: PYTHONPATH=<dir com o pacote markdown> python3 v2/_build_v2.py
"""
import os, re, sys, subprocess, html as H
import markdown

V2 = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(V2)

TITLES = {1: "A Era Adâmica", 2: "A Busca", 3: "O Inferno Cíclico", 4: "O Insight", 5: "O Erro", 6: "A Gnose", 7: "A Superação Adâmica"}

PLATES = {
    1: ("Adão e Eva de pé, nus, entre as árvores de uma floresta escura; a serpente, enrolada no tronco, põe um fruto na mão de Eva; Adão estende a mão aberta para ela e, com a outra, segura um ramo; aos pés, um gato espreita um rato; ao fundo, uma cabra-montês no alto de um penhasco",
        "Albrecht Dürer, Adão e Eva, 1504. Gravura a buril. National Gallery of Art, Washington."),
    2: ("São Jerônimo escreve, curvado sobre uma mesa, no fundo de um estúdio iluminado por janelas de vidro redondo; em primeiro plano dormem um leão e um cão; no parapeito, um crânio; na parede, uma ampulheta",
        "Albrecht Dürer, São Jerônimo no estúdio, 1514. Gravura a buril. National Gallery of Art, Washington."),
    3: ("Gravura redonda: Íxion despenca de cabeça entre nuvens e chamas, os braços abertos, a boca aberta; embaixo, água parada e rochas em fogo; uma inscrição em latim corre pela borda do círculo",
        "Hendrick Goltzius, segundo Cornelis van Haarlem, Íxion, da série Os quatro que caíram, 1588. Gravura a buril. National Gallery of Art, Washington."),
    4: ("Um viajante de manto e cajado, de joelhos no fim do mundo, passa a cabeça através da abóbada de estrelas e vê, do outro lado, rodas dentro de rodas e círculos de fogo; atrás dele, árvores, uma cidade, o sol e a lua",
        "Gravura Flammarion, em Camille Flammarion, L'atmosphère: météorologie populaire, Paris, 1888. Xilogravura à maneira antiga."),
    5: ("Uma mulher deitada sobre uma mesa comprida; do outro lado, um homem a desenha olhando por uma haste e por uma grade de fios esticados numa moldura, e passa o que vê para um papel quadriculado; ao fundo, uma janela aberta para o mar",
        "Albrecht Dürer, Desenhista fazendo um desenho em perspectiva de uma mulher deitada, de Instrução sobre a medida (1525), edição de 1538. Xilogravura. Metropolitan Museum of Art, Nova York."),
    6: ("Gravura redonda de uma grande sala em perspectiva, de chão quadriculado: à esquerda, uma tenda onde um homem reza de joelhos diante de uma mesa; à direita, fornos, alambiques e prateleiras de frascos; no centro, uma mesa com instrumentos de música; ao fundo, uma porta aberta",
        "Heinrich Khunrath, Oratório e laboratório, em Anfiteatro da Sabedoria Eterna, 1595. Gravura de Paullus van der Doort segundo Hans Vredeman de Vries."),
    7: ("Um cavaleiro de armadura segue a cavalo por um caminho estreito entre rochas; ao lado, a Morte, coroada de serpentes, ergue uma ampulheta; atrás, o Diabo, de chifres e focinho; um cão corre junto ao cavalo; no alto da colina, ao fundo, uma cidade",
        "Albrecht Dürer, O Cavaleiro, a Morte e o Diabo, 1513. Gravura a buril. National Gallery of Art, Washington."),
}

# (capítulo, tipo, alvo, novo): tipo "line" troca a linha que começa com o alvo; "sub" troca o trecho exato.
E = []
def L(n, start, new): E.append((n, "line", start, new))
def S(n, old, new): E.append((n, "sub", old, new))

# ---------------- 1 · Era Adâmica (Dürer, Adão e Eva) ----------------
L(1, "## Um homem de joelhos", "## Um instante antes")
L(1, "No centro da imagem que abre este capítulo", "Na gravura que abre este capítulo há um homem e uma mulher de pé, nus, no meio de uma floresta escura. Albrecht Dürer a gravou em cobre em 1504, com linhas tão finas que de perto parecem pele. À esquerda está Adão; à direita, Eva. Entre os dois, enrolada no tronco de uma árvore, a serpente põe um fruto na mão de Eva. Adão estende para ela a mão aberta. Com a outra, ainda segura um ramo de outra árvore, a árvore da vida. É o instante antes. Nada aconteceu ainda.")
L(1, "O resto da cena conta outra história.", "O resto da cena conta o que vai acontecer. Aos pés do casal, um gato espreita um rato e ainda não saltou. Em volta estão um coelho, um boi e um alce, animais que os sábios daquele tempo ligavam aos temperamentos do homem, por enquanto em equilíbrio. No alto de um penhasco, ao fundo, uma cabra-montês se equilibra na beira do abismo, e ninguém olha para ela. E há uma coisa que nenhuma figura da cena vê. Os dois corpos foram construídos com régua e compasso. Dürer passou anos estudando as proporções do corpo humano, e Adão e Eva são o resultado: por baixo da pele há uma geometria inteira, invisível a quem olha, como um desenho que ainda espera ser lido.")
L(1, "No banner deste capítulo, é o jovem do lado direito.", "Na gravura de Dürer, é o Adão de mão estendida. Ele ainda segura o ramo da árvore da vida, mas já não olha para ele. Olha para Eva e para o fruto, e o passo seguinte o levará para fora do jardim, onde terá um nome, uma casa, uma função e uma imagem de si.")
S(1, "No lado direito do banner, a cidade aonde o jovem se dirige tem torres, muralhas, casas empilhadas, a obra das mãos humanas.", "Fora do jardim, o que espera Adão é a terra que ele vai cultivar e, depois dela, as cidades: torres, muralhas, casas empilhadas, a obra das mãos humanas.")
L(1, "No céu do banner, no alto à direita", "Nos corpos de Adão e Eva, por baixo da pele, há uma geometria: círculos, linhas, proporções que Dürer traçou com o compasso antes de gravar o primeiro músculo. Ela está lá o tempo todo. Nenhuma figura da cena a vê.")
L(1, "A geometria do banner está incompleta", "A geometria da gravura fica invisível não porque falte algo nos corpos, mas porque falta algo em quem olha: as letras para lê-la.")
S(1, "É a mesma imagem do nosso banner: lá embaixo, a vida ordinária; lá em cima, uma ordem viva que quase ninguém vê.", "É a mesma lição da gravura de Dürer: à vista, a vida ordinária; por baixo dela, uma ordem viva que quase ninguém vê.")
L(1, "## A centelha na mão", "## O ramo na mão")
L(1, "No banner, o homem continua ajoelhado.", "Na gravura, nada aconteceu ainda. Eva recebe o fruto, Adão estende a mão, o gato espreita o rato sem saltar. E, no entanto, a cena guarda dois detalhes fáceis de passar.")
L(1, "O primeiro: a centelha não se apagou.", "O primeiro: Adão não soltou o ramo. Enquanto uma das mãos se estende para o fruto, a outra continua segurando a árvore da vida. O véu cobre a origem, mas não a extingue. Aquilo que encarnou continua presente em cada um de nós, e o mesmo intelecto que o homem adâmico usa apenas para lidar com a matéria está disponível, inteiro, para ler o que está além dela.")
L(1, "O segundo: a caverna tem uma abertura.", "O segundo: no alto do penhasco, ao fundo, a cabra-montês está de pé na beira da rocha, acima da floresta. Nenhuma figura da cena olha para lá. Mas o alto está ali, a um giro de cabeça.")

# ---------------- 2 · A Busca (Dürer, São Jerônimo) ----------------
L(2, "## Uma lanterna no rochedo", "## Um homem à mesa")
L(2, "O capítulo anterior terminou com um homem de pé", "O capítulo anterior terminou com um homem de pé no alto de um rochedo, de costas para nós, diante de um mar de névoa. A gravura que abre este capítulo leva a mesma busca para dentro de casa. Em 1514, Albrecht Dürer gravou Jerônimo, o homem que passou a vida traduzindo para o latim os livros sagrados escritos em hebraico e em grego. Ele está sentado no fundo de um estúdio, curvado sobre uma mesa pequena, escrevendo. A luz entra pelas janelas de vidro redondo e desenha no chão e na parede a forma dos caixilhos.")
L(2, "O fio não vai direto a lugar nenhum.", "Tudo na sala está em ordem e em silêncio. Em primeiro plano, um leão dorme estendido no chão, ao lado de um cão. Na parede, uma ampulheta mede o tempo. No parapeito da janela há um crânio. Jerônimo não levanta os olhos. Está ocupado com as palavras.")
L(2, "Nos cantos da cena, quase invisíveis", "A ampulheta e o crânio são as perguntas que fecharam o capítulo 1, penduradas na parede: o tempo que passa, a morte que vem. Jerônimo não foge delas. Trabalha embaixo delas, e o trabalho dele é de linguagem: passar o sentido de uma língua para outra sem perdê-lo no caminho.")
S(2, "Este capítulo é a travessia desse fio. Cada símbolo é uma tentativa", "Este capítulo é uma busca do mesmo tipo. Segue uma trilha de símbolos que a humanidade desenhou ao longo de milênios: uma chama, o yin-yang, uma roda de oito raios, um olho egípcio, um bastão com duas serpentes e asas, uma coluna grega, um triângulo, um cubo, uma serpente que morde a própria cauda, uma cruz, um esquadro cruzado com um compasso e, no fim, um livro aberto. Cada símbolo é uma tentativa")
S(2, "O primeiro símbolo no fio dourado é uma chama.", "O primeiro símbolo da trilha é uma chama.")
S(2, "no começo do fio,", "no começo da trilha,")
S(2, "O quarto símbolo do fio é", "O quarto símbolo da trilha é")
S(2, "O décimo símbolo do fio é uma cruz.", "O décimo símbolo da trilha é uma cruz.")
L(2, "O nono símbolo, antes da cruz", "O nono símbolo da trilha, antes da cruz, é de novo a serpente que morde a própria cauda. Aqui ela representa outra corrente, que cresceu ao lado do cristianismo e foi quase apagada por ele.")
S(2, "O penúltimo símbolo do fio é", "O penúltimo símbolo da trilha é")
S(2, "O fio dourado do banner passa pela China", "A trilha deste capítulo passa pela China")
S(2, "E aqui o fio dourado chega a mim.", "E aqui a trilha chega a mim.")
L(2, "No alto do banner, o fio dourado termina num livro aberto.", "A trilha termina num livro aberto, como o de Jerônimo na gravura que abre este capítulo. Ele escreve nele há horas, à luz da janela, e de onde estamos não se pode ler o que está escrito.")
S(2, "Cada símbolo que o fio atravessou deixou", "Cada símbolo da trilha deixou")

# ---------------- 3 · Inferno Cíclico (Goltzius, Íxion) ----------------
L(3, "## Um anel de passos", "## Um homem que cai")
S(3, "A imagem que abre este capítulo mostra esse homem multiplicado.", "A gravura que abre este capítulo mostra esse homem no meio da queda.")
L(3, "Há dezenas deles.", "É Íxion, gravado por Hendrick Goltzius em 1588. O corpo enorme despenca de cabeça entre nuvens e chamas, com os braços abertos, a boca aberta e as pernas ainda no alto. Embaixo há uma água parada e rochas em fogo. A gravura é redonda, e pela borda do círculo corre uma inscrição em latim que dá a volta inteira na cena, sem começo nem fim.")
L(3, "No centro do anel, no vazio, há um pêndulo.", "O mito conta que Íxion desejou Hera, a mulher de Zeus. Zeus moldou uma nuvem com a forma dela, e Íxion abraçou a nuvem acreditando abraçar a deusa. Como castigo, foi amarrado a uma roda de fogo que gira para sempre. A inscrição da borda tira a lição: quem tem o coração ardendo por aplauso, quem se alegra com a glória vazia da fama, que se lembre de Íxion, a quem Júpiter deu uma nuvem escura no lugar de Juno.")
L(3, "Do alto, de fora do anel", "O castigo veio de tomar a nuvem pela deusa, a forma pela coisa, a imagem pelo que ela representa. E combina com o erro. Quem abraça uma ilusão volta a abraçá-la, e a roda devolve sempre ao mesmo ponto.")
L(3, "## Quem anda no anel", "## Quem gira na roda")
L(3, "No banner, cada figura caminha sozinha", "A gravura de Goltzius mostra um homem só, e é assim que cada um vive a própria queda: como se fosse o único a cair. Mas Íxion é um nome para todos. A roda em que ele gira é a mesma em que giram os outros, no mesmo passo. Cada um se sente único. Visto de fora, são todos o mesmo.")
L(3, "No centro do anel, o pêndulo continua", "Dentro da roda há outro movimento, menor e mais rápido: de um lado para o outro, como um pêndulo.")
S(3, "As brasas nos cantos do banner não estão debaixo da terra, num mundo futuro. Estão logo ali, abaixo do anel, ao lado do caminho de todos os dias.", "As chamas da gravura de Goltzius não estão debaixo da terra, num mundo futuro. Estão em volta do homem enquanto ele vive, na mesma altura das nuvens que ele abraçou.")
L(3, "## Os raios sobre o anel", "## A borda do círculo")
L(3, "No banner, as figuras continuam caminhando.", "Na gravura, Íxion continua caindo. As nuvens continuam em volta dele, e as chamas continuam acesas embaixo.")
L(3, "Mas a imagem guarda, como as dos capítulos anteriores", "Mas a imagem guarda, como as dos capítulos anteriores, um detalhe fácil de perder. A inscrição não está dentro da cena. Corre pela borda, do lado de fora do círculo onde Íxion cai, e só pode ser lida por quem está fora dele. Quem está dentro vê nuvem e fogo. Quem está fora lê a história inteira.")
L(3, "O que falta às figuras não é a luz.", "O que falta a Íxion não é a lição. Ela está escrita em volta dele. Falta sair do círculo para lê-la.")

# ---------------- 4 · O Insight (Gravura Flammarion) ----------------
L(4, "## Uma porta no rochedo", "## O ponto onde o céu toca a terra")
L(4, "O rochedo ainda é o mesmo.", "No fim do primeiro capítulo, um homem estava de pé num rochedo, diante de um mar de névoa. No segundo, Jerônimo escrevia num livro que não conseguíamos ler. No terceiro, Íxion caía sem fim dentro de um círculo.")
L(4, "Na imagem que abre este capítulo, a névoa baixou", "A gravura que abre este capítulo mostra um viajante que chegou ao fim do mundo. A legenda com que ela foi publicada, em Paris, conta que um missionário da Idade Média dizia ter encontrado o ponto onde o céu e a terra se tocam. Atrás do homem está o mundo que ele conhece: árvores, colinas, uma cidade com torres, o sol e a lua com rostos, as estrelas pregadas numa abóbada. Na frente dele, essa abóbada termina. Ela desce até o chão como um pano, e o homem, de joelhos, com o cajado ainda na mão, passou a cabeça e um braço através dela.")
L(4, "O homem não usa túnica nem manto.", "Do outro lado não há estrelas pregadas. Há rodas dentro de rodas, nuvens em espiral, círculos de fogo: o mecanismo que move, por trás, o céu que ele conhecia. O homem não quebrou nada para chegar ali. Não há martelo, nem escada, nem guarda com a chave. A abóbada que parecia o limite do mundo cedeu quando ele a tocou.")
L(4, "No céu, à direita, está de novo a geometria", "Desde o primeiro capítulo, este livro fala de uma geometria que está diante de todos e que ninguém lê. Na gravura de Dürer, ela estava escondida nos corpos de Adão e Eva. Aqui ela aparece pela primeira vez como aquilo que é: a estrutura que move o que se vê. O céu continua o mesmo. Mudou o lugar de onde o homem olha.")
L(4, "Este capítulo trata dessas três coisas", "Este capítulo trata dessas três coisas: a passagem, a prisão sem grades e o mecanismo do outro lado.")
L(4, "## Uma corrente sem ferro", "## Uma prisão sem grades")
L(4, "## A corrente em faíscas", "## Do outro lado da abóbada")
S(4, "Mas a corrente do banner não é de ferro. Ela é feita", "Mas a abóbada da gravura não é de pedra. Ela é feita")
S(4, "os elos perdem o sentido, e o que era ferro vira faísca.", "a abóbada perde a firmeza, e o que parecia o fim do mundo vira um pano que se pode atravessar.")
L(4, "No banner, o homem ainda não atravessou a porta.", "Na gravura, o viajante ainda não atravessou. Está de joelhos no limiar, com metade do corpo de cada lado: os pés na terra que conhece, a cabeça no mecanismo que move o céu. Vê as rodas, mas ainda não sabe lê-las.")
L(4, "Antes de atravessar, ele precisa olhar para os elos", "Antes de atravessar, ele precisa saber quem pintou aquela abóbada e por que todos a tomaram pelo fim do mundo. Uma parte dela foi traçada há vinte e quatro séculos, num gesto que Rafael pintou no centro da Escola de Atenas: a mão aberta de um homem de azul, voltada para o chão.")

# ---------------- 5 · O Erro (Dürer, o desenhista) ----------------
L(5, "## A luz no bloco", "## A grade")
L(5, "À esquerda da imagem que abre este capítulo", "Albrecht Dürer gravou a cena que abre este capítulo para um manual de geometria destinado a pintores. Uma mulher está deitada sobre uma mesa comprida, apoiada em almofadas, o corpo meio coberto por um pano. Do outro lado da mesa, sentado, um homem a desenha. Entre os dois, de pé sobre a mesa, há uma moldura de madeira com uma grade de fios esticados.")
L(5, "No centro, de cima a baixo, uma fissura", "O homem não olha a mulher diretamente. Olha por cima de uma haste fina, que prende o seu olho num único ponto, e através da grade. Cada quadrado recorta um pedaço do corpo. Na mesa, à frente dele, há um papel riscado com a mesma grade, e ele passa para ali, quadrado por quadrado, o que vê. O corpo que respira do outro lado vira, no papel, um conjunto de casas preenchidas.")
L(5, "À direita da fissura, a pedra desaparece.", "Atrás dos dois, uma janela aberta mostra o mar, colinas e uma cidade ao longe. Nenhum deles olha para fora.")
S(5, "A figura de pedra do banner é o mesmo homem, Aristóteles, e o gesto é quase o mesmo. Só que agora vemos o que a mão faz. Ela pega o que vinha do alto e tranca dentro de uma coisa.", "O desenhista de Dürer faz, com madeira e fios, o que aquela mão faz com conceitos. Pega algo vivo, que se move e muda de posição, fixa o olho num só ponto e o reparte em casas que podem ser preenchidas, contadas e guardadas.")
L(5, "Os cubos do lado direito são a mesma operação", "Os programadores fazem a mesma operação, dois mil e trezentos anos depois de Aristóteles, quando traduzem o mundo em tabelas e classes.")
L(5, "A figura de pedra do banner é, por isso, uma escolha exata.", "A grade de Dürer faz com a mulher deitada o que o exemplo preferido de Aristóteles faz com o bronze: prende uma forma numa coisa e a fixa ali. O que estava deitado e respirando vira figura parada no papel.")
L(5, "Os cubos do banner estão trancados.", "Na gravura de Dürer, cada quadrado da grade guarda o seu pedaço do corpo, e nenhum pedaço passa para o quadrado vizinho. Os programadores chamam isso de encapsulamento. O movimento, que deveria correr livre pelo corpo inteiro, só chega a qualquer lugar entrando e saindo de casa em casa.")
L(5, "## A fissura", "## A janela")
L(5, "No banner, a fissura de luz desce do céu", "Na gravura, atrás do desenhista e da mulher, há uma janela aberta. Por ela se veem o mar, as colinas, uma cidade, um céu inteiro, sem grade nenhuma. Nas primeiras vezes em que se olha a cena, a janela parece só fundo, um detalhe de cenário. Mas é a única parte da imagem que não foi recortada em quadrados. Por ela o mundo continua entrando inteiro na sala.")
L(5, "Quando a linha é refeita, a luz que estava presa no bloco não some.", "Quando a linha é refeita, a grade não precisa ser jogada fora. Continua servindo para medir, desenhar e construir. Só deixa de ser confundida com o corpo que está do outro lado. Os cadeados se tornam desnecessários. O homem deixa de ser a soma dos seus rótulos e passa a ser alguém que atravessa histórias. E as histórias passam a poder ser lidas.")

# ---------------- 6 · A Gnose (Khunrath, oratório e laboratório) ----------------
L(6, "## Um ponto de luz", "## O oratório e o laboratório")
L(6, "A imagem que abre este capítulo é quase vazia.", "A gravura que abre este capítulo é uma sala. Heinrich Khunrath, médico e alquimista alemão, mandou gravá-la para o seu *Anfiteatro da Sabedoria Eterna*, no fim do século XVI. A sala é ampla, com arcos ao fundo e um teto de vigas, e foi desenhada com uma perspectiva tão rigorosa que todas as linhas do chão e das paredes correm para um único ponto, no vão de uma porta aberta ao fundo.")
L(6, "Uma linha reta corta a cena na horizontal.", "Do lado esquerdo há uma tenda, e dentro dela um homem reza de joelhos diante de uma mesa. É o oratório. Do lado direito há fornos, alambiques e prateleiras cheias de frascos. É o laboratório. Os dois ocupam a mesma sala, sob o mesmo teto, e entre eles há uma mesa com instrumentos de música. O chão inteiro, de ponta a ponta, é um tabuleiro de casas claras e escuras. A geometria que acompanha este livro desde o primeiro capítulo está aqui no chão, à vista. Desta vez, ela vai ser lida.")
S(6, "O capítulo 1 terminou dizendo que a geometria do céu estava incompleta porque faltavam, em quem olhava, as letras para lê-la.", "O capítulo 1 terminou dizendo que a geometria escondida nos corpos de Adão e Eva só aparece para quem tem as letras para lê-la.")
L(6, "Chamo-o de conhecimento secreto", "Os antigos chamaram esse conhecimento de gnose, e muitos o trataram como segredo. Mas o segredo aqui não é de seita. Ninguém o esconde. Ele foi escrito em pedra no Egito, pintado no teto da Capela Sistina, desenhado no yin-yang, dito na primeira frase do Evangelho de João. É secreto do mesmo modo que a caveira de Holbein é secreta: está no centro da cena, e só aparece para quem muda o ângulo.")
L(6, "Há ainda a linha horizontal do banner.", "Há ainda o modo como a sala de Khunrath está dividida. O que se faz à esquerda, de joelhos, e o que se faz à direita, diante do fogo, acontece sob o mesmo teto e sobre o mesmo chão. Khunrath não pôs a oração num andar de cima e o trabalho num porão. Pôs os dois no mesmo plano, um diante do outro.")
L(6, "O centro do banner é ocupado por uma fita de cinema.", "No centro da sala de Khunrath há uma mesa com instrumentos de música. A música é o exemplo mais simples de algo que só existe enquanto passa: nenhuma nota, sozinha, é a melodia. O cinema mostra a mesma coisa de outro modo.")
L(6, "William Blake abriu o seu livro mais longo com a imagem de um homem atravessando uma porta.", "Volto ao homem de Blake que o capítulo 4 mostrou atravessando uma porta de pedra, com um globo de luz na mão. É Los, a figura que, na mitologia de Blake, representa a imaginação criadora. À frente dele, o interior é escuro. Ele não sabe o que vai encontrar. Mas já está passando.")
S(6, "Na fita do banner, é como se em cada quadro houvesse um recorte", "Numa fita de cinema, é como se em cada quadro houvesse um recorte")
S(6, "Em 1913, Wassily Kandinsky pintou uma tela de dois metros por três em que não há nenhum objeto reconhecível.", "Volto à tela que Kandinsky pintou em 1913 e que o capítulo 4 mostrou: dois metros por três sem nenhum objeto reconhecível.")
S(6, "As palavras sobre o céu estão invertidas, como o reflexo do banner deste capítulo.", "As palavras sobre o céu estão invertidas, como num espelho.")
L(6, "## O cubo de arestas", "## O ponto de fuga")
L(6, "No banner, à direita dos dois círculos, há um cubo", "Na gravura de Khunrath, todas as linhas da sala correm para um único ponto, no fundo, no vão de uma porta aberta. Os pintores chamam esse ponto de ponto de fuga. Ele não é um objeto. Não tem cor, nem peso, nem tamanho, e ninguém o desenhou como coisa. No entanto, é ele que organiza tudo o que há na sala: a tenda, os fornos, a mesa, cada casa do chão.")
S(6, "Esse cubo é o que sobra quando se aprende a ler.", "Esse ponto é o que se começa a ver quando se aprende a ler.")
L(6, "O ponto branco do canto esquerdo e o cubo do canto direito", "O tabuleiro do chão e o ponto de fuga são o começo e o fim desta travessia. Começamos pela diferença mínima que faz algo existir, a casa clara ao lado da escura. Terminamos pela forma pura que permanece quando as coisas passam. Entre os dois, a música: os estados que mudam e o verbo invisível que os move.")
L(6, "E embaixo da linha do horizonte, tudo se repete.", "E o que vale para a sala vale para a vida de cada um. O Adão do primeiro capítulo, que estendia uma mão para o fruto e segurava com a outra um ramo da árvore da vida sem saber o que segurava, agora tem as palavras para dizer o que segura. A centelha é da natureza do Verbo. Ela não se apagou porque não pode se apagar.")

# ---------------- 7 · Superação Adâmica (Dürer, O Cavaleiro, a Morte e o Diabo) ----------------
L(7, "## Um homem de braços abertos", "## Um cavaleiro na estrada")
L(7, "No primeiro capítulo havia um homem ajoelhado", "No primeiro capítulo, Adão estendia a mão para o fruto e segurava com a outra um ramo da árvore da vida. No segundo, Jerônimo traduzia sozinho, à mesa, sob a ampulheta e o crânio. No terceiro, Íxion caía sem fim entre nuvens e fogo. No quarto, um viajante atravessava com a cabeça a abóbada do céu. No quinto, um desenhista prendia um corpo vivo numa grade. No sexto, a oração e o laboratório dividiam a mesma sala. A gravura que abre este capítulo põe um homem na estrada.")
L(7, "É noite de novo.", "Albrecht Dürer a gravou em 1513. Um cavaleiro de armadura completa segue a passo, montado num cavalo forte, por um caminho estreito entre rochas e árvores secas. Ao lado dele, num cavalo magro, vai a Morte: sem nariz, com serpentes enroladas na coroa, ela ergue diante do rosto do cavaleiro uma ampulheta. Atrás vem o Diabo, com chifres, focinho de porco e uma lança curva. No chão há um crânio. Um cão corre junto às patas do cavalo. No alto da colina, ao fundo, há uma cidade.")
L(7, "Debaixo dela cresce uma árvore.", "O cavaleiro não olha para a Morte nem para o Diabo. Não acelera, não desembainha a espada, não muda de caminho. Olha para a frente, com o rosto calmo, e segue.")
L(7, "Aos pés do homem, no chão, há três máscaras.", "A Morte e o Diabo vêm vestidos de horror: serpentes, chifres, ampulheta, focinho. São máscaras do medo. O cavaleiro passa entre elas como quem passa entre figuras pintadas.")
L(7, "Este capítulo é sobre o que separa esse homem do homem ajoelhado do começo.", "Este capítulo é sobre o que separa esse homem do Adão do começo. Nada mudou no mundo em volta dele: a estrada continua escura, a Morte continua ao lado, a matéria continua ali. O que mudou foi a leitura. Ele aprendeu as letras. E, ao aprendê-las, descobriu que a firmeza que procurava lá fora vinha dele mesmo.")
L(7, "Ghiberti passou vinte e sete anos fundindo", "Volto ao painel de Ghiberti que o capítulo 4 mostrou, nas portas que Michelangelo teria chamado de portas do Paraíso.")
S(7, "Num manuscrito copiado no século XIII, que reúne canções de estudantes e clérigos errantes, há uma página com uma roda.", "Volto à roda da Fortuna do *Carmina Burana*, que apareceu no capítulo 3.")
L(7, "Blake abriu o seu último grande livro com um homem entrando por uma porta.", "Volto uma última vez ao homem de Blake que o capítulo 4 mostrou entrando por uma porta de pedra, na primeira prancha de *Jerusalem*, com um globo de luz na mão.")
L(7, "O banner deste capítulo mostra a mesma coisa de outro jeito.", "A gravura que abre este capítulo mostra a mesma coisa de outro jeito. O cavaleiro de Dürer não leva tocha nem lanterna. Segue pela mesma estrada escura que a Morte e o Diabo, e o que o faz seguir não está em nada que ele carregue. O que ele leva não é um objeto que possa perder; é aquilo que ele é.")
S(7, "As máscaras do banner estão no chão porque o homem descobriu que eram máscaras.", "O cavaleiro passa pela Morte e pelo Diabo sem se virar porque descobriu que eram máscaras.")
S(7, "Leonardo desenhou num caderno, a tinta, um homem nu com dois corpos sobrepostos.", "O Homem Vitruviano, que o capítulo 5 mostrou, tem dois corpos sobrepostos.")
S(7, "A árvore do banner não nasceu pronta.", "Nenhuma árvore nasce pronta.")
L(7, "É a mesma postura do homem do banner.", "É o mesmo olhar do cavaleiro de Dürer, que segue para a frente sem se virar para a Morte. E embaixo, no lugar da Morte, um túmulo vazio. O que ficou para trás era só o que podia ficar.")
L(7, "## A geometria acesa", "## A cidade no alto")
L(7, "No banner, a luz sai do peito do homem", "Na gravura de Dürer, no alto da colina, ao fundo, há uma cidade. O caminho do cavaleiro leva até ela. É fácil não vê-la: está pequena, quase apagada, no canto de cima, como a geometria escondida nos corpos de Adão e Eva no primeiro capítulo, que ninguém na cena via e que só aparecia, como dissemos então, para quem tivesse as letras para lê-la.")
L(7, "Agora ela está acesa.", "O cavaleiro não precisa olhar para a cidade para saber que ela está lá. É ela que dá direção ao caminho. O que está em cima organiza o que está embaixo, e o homem que sabe disso atravessa a estrada escura sem pressa. Assim em cima como embaixo.")
S(7, "Ele continua no rochedo, na noite, à beira da mesma água.", "Ele continua na estrada, entre as mesmas pedras, com a Morte ao lado.")
S(7, "Mas deixou as máscaras no chão.", "Mas já não se assusta com as máscaras.")

S(2, "O cubo dourado do banner vem daí. ", "O cubo da trilha vem daí. ")
S(6, " É o ponto solitário do canto esquerdo do banner.", " É a casa clara ao lado da escura, no chão da sala de Khunrath.")
S(7, "A cidade do primeiro banner, com suas torres e muralhas, é o retrato dessa leitura.", "As cidades que esperam Adão fora do jardim, com suas torres e muralhas, são o retrato dessa leitura.")

# imagens repetidas: cada obra fica onde aparece primeiro com a leitura mais completa
DROP = {5: ["02-michelangelo-separacao-luz-trevas"], 6: ["10b-blake-albion-frontispiece", "17-kandinsky-composition-vii"],
        7: ["19-ghiberti-porta-do-paraiso", "21b-roda-da-fortuna-completa", "10b-blake-albion-frontispiece", "06-leonardo-homem-vitruviano"]}


def build_md(n):
    src = open(os.path.join(ROOT, f"novo-capitulo-{n}-claude.md"), encoding="utf-8").read()
    lines = src.split("\n")
    lines[0] = f"# {n}. {TITLES[n]}"
    alt, credit = PLATES[n]
    for i, ln in enumerate(lines):
        if ln.startswith("![Banner do capítulo"):
            lines[i] = f"![{alt}](../assets/gravuras/cap-{n}.jpg)\n\n*{credit}*"
            break
    else:
        raise SystemExit(f"cap {n}: banner não encontrado")
    for (c, kind, a, b) in E:
        if c != n:
            continue
        if kind == "line":
            idx = [i for i, ln in enumerate(lines) if ln.startswith(a)]
            assert len(idx) == 1, (n, a, len(idx))
            lines[idx[0]] = b
        else:
            txt = "\n".join(lines)
            assert txt.count(a) == 1, (n, a[:60], txt.count(a))
            lines = txt.replace(a, b).split("\n")
    out, skip = [], 0
    for i, ln in enumerate(lines):
        if skip:
            skip -= 1
            if ln.strip() == "" or (ln.startswith("*") and ln.rstrip().endswith("*")):
                continue
        if ln.startswith("![") and any(k in ln for k in DROP.get(n, [])):
            skip = 2   # a linha em branco e o crédito em itálico que seguem
            continue
        out.append(ln)
    txt = "\n".join(out).replace("](inputs/", "](../inputs/").replace("](assets/", "](../assets/")
    txt = re.sub(r"\n{3,}", "\n\n", txt)
    left = [w for w in ("banner",) if w in txt.lower()]
    assert not left, (n, "ainda cita banner")
    open(os.path.join(V2, f"capitulo-{n}.md"), "w", encoding="utf-8").write(txt)
    return txt


def md_to_html(txt):
    h = markdown.markdown(txt, extensions=["extra", "sane_lists", "nl2br"])
    # imagem + crédito em itálico -> <figure> com legenda curta (sem repetir a descrição longa)
    h = re.sub(r'<p><img alt="([^"]*)" src="([^"]*)"\s*/?></p>\s*<p><em>(.*?)</em></p>',
               lambda m: f'<figure><img src="{m.group(2)}" alt="{m.group(1)}"><figcaption>{m.group(3)}</figcaption></figure>', h, flags=re.S)
    h = re.sub(r'<p><img alt="([^"]*)" src="([^"]*)"\s*/?></p>', r'<figure><img src="\2" alt="\1"></figure>', h)
    return h


CSS = """@page { margin: 18mm 16mm; }
@page capa { size: 6in 9in; margin: 0; }
.capa { page: capa; width: 6in; height: 9in; margin: 0 auto; break-after: page; }
.capa img { display: block; width: 6in; height: 9in; max-width: none; max-height: none; }
body { font-family: "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif; font-size: 11.5pt; line-height: 1.55; color: #1a1a1a; max-width: 720px; margin: 0 auto; }
h1 { font-size: 22pt; margin: 0 0 1em; text-align: center; }
h2 { font-size: 14pt; margin: 1.6em 0 0.7em; break-after: avoid; }
p { margin: 0 0 0.85em; text-align: justify; hyphens: auto; }
blockquote { margin: 1em 2em; color: #333; font-style: italic; border-left: 2px solid #bbb; padding-left: 1em; }
figure { margin: 1.2em 0; break-inside: avoid; text-align: center; }
img { max-width: 100%; max-height: 420px; height: auto; }
section.cap > figure:first-of-type img { max-height: 560px; }
figcaption { font-size: 8.5pt; color: #666; margin-top: 0.4em; font-style: italic; }
pre { white-space: pre-wrap; font-size: 9.5pt; background: #f3f1ec; padding: 8px 10px; }
hr { border: none; border-top: 1px solid #ddd; margin: 1.4em 0; }
.rosto { height: 240mm; display: flex; flex-direction: column; justify-content: center; text-align: center; break-after: page; }
.rosto h1 { font-size: 36pt; letter-spacing: 0.04em; margin-bottom: 0.3em; }
.rosto p { text-align: center; color: #555; }
.toc { break-after: page; } .toc h2 { text-align: center; font-size: 18pt; }
.toc ol { list-style: none; margin: 2em 0 0; padding: 0; } .toc li { font-size: 13pt; margin-bottom: 0.7em; }
.toc a { text-decoration: none; color: #1a1a1a; }
section.cap { break-before: page; }"""


def main():
    secs, toc = [], []
    for n in range(1, 8):
        txt = build_md(n)
        secs.append(f'<section class="cap" id="cap{n}">\n{md_to_html(txt)}\n</section>')
        toc.append(f'<li><a href="#cap{n}">{n}. {TITLES[n]}</a></li>')
    page = (f'<!DOCTYPE html>\n<html lang="pt-BR"><head><meta charset="utf-8"/><title>Eternos Mutáveis · 2.0</title><style>\n{CSS}\n</style></head><body>\n'
            f'<div class="capa"><img src="../capa/v2/capa-d-frente.jpg" alt="Capa: Eternos Mutáveis, de Laércio Germano. Peça de dominó em pé: metade de cima preta com bola branca e a palavra ETERNOS; metade de baixo branca com bola preta e a palavra MUTÁVEIS."/></div>\n'
            f'<div class="rosto"><h1>Eternos Mutáveis</h1><p>A superação adâmica</p><p>Laércio Germano</p><p>Versão 2.0</p></div>\n'
            f'<div class="toc"><h2>Sumário</h2><ol>{"".join(toc)}</ol></div>\n' + "\n".join(secs) + "\n</body></html>")
    out = os.path.join(V2, "eternos-mutaveis-v2.html")
    open(out, "w", encoding="utf-8").write(page)
    if "--pdf" in sys.argv:
        subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                        "--virtual-time-budget=20000", f"--print-to-pdf={os.path.join(V2, 'eternos-mutaveis-v2.pdf')}", "file://" + out],
                       check=True, stderr=subprocess.DEVNULL)
    print("ok", out)


if __name__ == "__main__":
    main()
