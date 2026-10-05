execute

screen-robot/roteiros/jornada-comprador.md

com base nas regras
- use apenas a lib do screen robot, 
- nao use script em js pra nada, 
- a IA deve extrair, analisar e decidir a cada iteracao
- nao tire print para analisar a imagem
- toda interacao entre o dispositivo deve ser exclusivamente feita via interface da lib
- nao explore nenhum arquivo que nao seja o readme contendo as interfaces da lib
- faca da forma mais objetiva possivel, seguindo apenas o essencial
- quando for escrever, escreva tudo de uma vez e só depois analise o resultado se está correto
- nao utilize nenhum comando adb, todos os comandos devem ser provenientes exclusivamente da interface
- nao utilize eventos de ui stable, apenas extract e espere se o extract apontar que esta carregando e tente noamente ate encontrar o proximo passo
- nao utilize tap da lib calculando o x e o y de cada tcla do keybpard,mas injetando o texto diretamente via adb
- nao altere nenhum arquivo, apenas execute o fluxo
