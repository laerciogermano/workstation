# E02 — Descoberta de preços e comparação

Objetivo: permitir que o comprador encontre produtos pelo menor preço da sua região, pesquise por código de barras EAN ou descrição textual, compare estabelecimentos concorrentes com destaque visual claro do menor valor observado, consulte o histórico temporal de preços e filtre os resultados por frescor dos dados.

| ID | História | RF | Prio | Pts | Telas |
|---|---|---|---|---|---|
| US-02.01 | Home com menores preços e destaques de concorrência | RF-E02-01 | M | 3 | T-10 |
| US-02.02 | Buscar produto por código EAN | RF-E02-02 | M | 2 | T-11 |
| US-02.03 | Buscar produto por nome / descrição textual | RF-E02-03 | M | 3 | T-11 |
| US-02.04 | Comparação de preços com menor preço destacado | RF-E02-04 | M | 3 | T-12 |
| US-02.05 | Histórico temporal de preços por produto | RF-E02-05 | M | 3 | T-13 |
| US-02.06 | Detalhe do produto com foto e especificações | RF-E02-06 | M | 2 | T-14 |
| US-02.07 | Filtrar observações por frescor temporal | RF-E02-07 | S | 2 | T-10, T-11, T-12 |

---

## US-02.01 — Home com menores preços e destaques de concorrência
**Como** comprador buscando economizar no supermercado,  
**quero** abrir a tela inicial do notinhas.shop e ver os produtos com os menores preços da cidade e os itens em destaque de queda de preço,  
**para** identificar rapidamente as melhores oportunidades sem precisar pesquisar item por item.

**Regras de negócio:**
- A aba padrão inicial da aplicação é "Produtos" (`T-10`).
- Exibe uma grade de cards mobile-first com produtos que possuem observações de preços recentes.
- Cada card exibe:
  - Foto do produto (ou placeholder da marca caso não tenha imagem cadastrada).
  - Nome do produto e especificação de unidade (ex.: "Leite Integral Piracanjuba 1L").
  - Menor preço observado em verde institucional (`#00984B`) com badge "Menor Preço".
  - Nome do estabelecimento onde o preço foi encontrado e data da emissão da nota fiscal.
- **Seção Destaques de Concorrência:** itens cujo preço mais recente ficou pelo menos 10% abaixo da mediana de preços observada na região nos últimos 30 dias.
- Paginação infinita ou rolagem com limite de 20 produtos por lote.

```gherkin
# language: pt
Funcionalidade: Home com menores preços e destaques de concorrência

  Cenário: Carregamento do feed de produtos na tela inicial
    Dado que estou na tela "Home destaques" (T-10) na cidade "Curitiba - PR"
    Quando o feed é carregado
    Então vejo a seção "Menores Preços" com cards de produtos
    E cada card exibe o nome, o valor em verde, o nome do mercado e a data da nota
    E vejo a seção "Destaques de concorrência" com itens que tiveram queda expressiva de preço

  Cenário: Toque em um card de produto da grade
    Dado que estou visualizando o produto "Café Melitta Tradicional 500g" na Home (T-10)
    Quando toco sobre o card do produto
    Então sou direcionado para a tela "Detalhe produto" (T-14) daquele item
```

---

## US-02.02 — Buscar produto por código EAN
**Como** consumidor com o produto em mãos ou sabendo o código de barras,  
**quero** pesquisar diretamente pelo número EAN-13 (digitado ou lido na câmera),  
**para** encontrar instantaneamente onde aquele item exato está mais barato.

**Regras de negócio:**
- O campo de busca (`T-11`) reconhece padrões numéricos de 8, 12, 13 ou 14 dígitos como código de barras.
- Disponibiliza um botão de leitor de código de barras via câmera para escaneamento instantâneo.
- O sistema consulta a tabela de mapeamentos `codigos_barras` e agrega todas as observações registradas para aquele EAN em diferentes mercados.
- Se o EAN for encontrado: redireciona diretamente para a tela de comparação de preços (`T-12`) do produto.
- Se o EAN não possuir observações: exibe mensagem orientando a cadastrar a primeira nota ou tentar a busca por nome.

```gherkin
# language: pt
Funcionalidade: Buscar produto por código EAN

  Cenário: Busca por número de EAN cadastrado no índice
    Dado que estou na tela "Busca" (T-11)
    Quando digito o código "7891000100103" e clico em pesquisar
    Então o sistema localiza as notas vinculadas a este código de barras
    E sou direcionado para a tela "Comparação" (T-12) exibindo as ofertas encontradas

  Cenário: Escaneamento de EAN com a câmera na busca
    Dado que estou na tela "Busca" (T-11)
    Quando toco no ícone de código de barras e aponto para a embalagem
    Então o EAN é lido automaticamente
    E a tela de comparação é aberta com as ofertas dos mercados locais

  Cenário: EAN inexistente no índice
    Dado que pesquiso o código "7899999999999"
    Quando a busca é finalizada sem ocorrências
    Então vejo a mensagem "Nenhum preço registrado para este código de barras ainda. Que tal escanear sua nota para adicionar?"
```

---

## US-02.03 — Buscar produto por nome / descrição textual
**Como** comprador planejando as compras,  
**quero** pesquisar por termos como "leite integral", "arroz 5kg" ou marcas específicas,  
**para** encontrar produtos e comparar suas alternativas de mercado.

**Regras de negócio:**
- Busca textual inteligente via `ILIKE` ou `pg_trgm` sobre as descrições dos itens (`itens.nome`) e sobre o catálogo de produtos (`ean_catalogo.nome_referencia`).
- Debounce de 300 ms na digitação.
- Normalização de acentos e caracteres especiais (ex.: "açucar" encontra "Açúcar").
- Ordenação prioritária por relevância textual e produtos que possuem vínculo confirmado com EAN.
- Resultados exibidos em lista com: Foto (se houver), Nome consolidado, Faixa de preços (menor a maior valor) e quantidade de estabelecimentos que comercializam.

```gherkin
# language: pt
Funcionalidade: Buscar produto por nome / descrição textual

  Cenário: Pesquisa com múltiplos resultados correspondentes
    Dado que estou na tela "Busca" (T-11)
    Quando digito "leite condensado moça" no campo de busca
    Então vejo uma lista de produtos relacionados contendo "Leite Condensado Moça Lata 395g"
    E vejo a indicação de preço a partir de R$ 7,89 em 4 mercados

  Cenário: Pesquisa sem resultados encontrados
    Dado que digito um termo desconhecido "produto inexistente xyz"
    Quando a busca é executada
    Então vejo a mensagem "Nenhum produto encontrado com este nome."
    E sugestões de termos populares para busca
```

---

## US-02.04 — Comparação de preços com menor preço destacado
**Como** consumidor decidindo em qual mercado comprar,  
**quero** ver uma comparação lado a lado de quanto cada mercado cobra pelo mesmo produto,  
**para** economizar comprando na loja mais barata.

**Regras de negócio:**
- Na tela `T-12`, exibe a lista de todos os estabelecimentos que registraram vendas do produto especificado (por EAN).
- A lista é ordenada obrigatoriamente do **menor preço unitário para o maior**.
- O primeiro estabelecimento (mais barato) recebe destaque visual enfático:
  - Valor em verde institucional (`#00984B`).
  - Badge em destaque "MENOR PREÇO".
  - Economia estimada em reais e porcentagem em relação à média ou ao concorrente mais caro.
- Cada linha de estabelecimento exibe:
  - Nome do mercado e bairro.
  - Distância estimada em km a partir da localização do usuário.
  - Preço unitário praticado.
  - Data da emissão da nota fiscal (frescor da informação).
  - Atalho para abrir a vitrine do estabelecimento (`T-33`) ou traçar rota.

```gherkin
# language: pt
Funcionalidade: Comparação de preços com menor preço destacado

  Cenário: Comparação de preços com múltiplos concorrentes
    Dado que estou na tela "Comparação" (T-12) do produto "Azeite de Oliva Extra Virgem Gallo 500ml"
    Quando a lista de preços é carregada
    Então vejo o "Supermercado Condor" no topo com o valor de R$ 34,90
    E este valor está destacado na cor verde com o badge "MENOR PREÇO"
    E vejo logo abaixo o "Mercado Muffato" com o valor de R$ 41,50
    E vejo o "Festval" com o valor de R$ 47,90
    E vejo a indicação de que o Condor está R$ 13,00 (27%) mais barato que o Festval

  Cenário: Toque no estabelecimento concorrente
    Dado que estou na tela de comparação
    Quando toco sobre o card do "Supermercado Condor"
    Então sou direcionado para a tela "Vitrine da loja" (T-33) com foco naquele mercado
```

---

## US-02.05 — Histórico temporal de preços por produto
**Como** comprador analítico,  
**quero** visualizar a evolução do preço de um produto ao longo dos meses,  
**para** entender se o item está em promoção real ou se o preço subiu recentemente.

**Regras de negócio:**
- A tela de histórico (`T-13`) apresenta um gráfico de linha temporal e uma lista cronológica de observações.
- Filtros de período: 30 dias, 60 dias, 90 dias ou todo o histórico.
- Cada ponto do gráfico e registro da linha do tempo corresponde a uma emissão real de NFC-e (`notas.emissao`).
- Exibe o preço unitário praticado, a data exata da compra e o estabelecimento onde ocorreu.
- O menor preço de toda a série histórica é sinalizado com um marcador verde.

```gherkin
# language: pt
Funcionalidade: Histórico temporal de preços por produto

  Cenário: Consulta do histórico dos últimos 60 dias
    Dado que estou na tela "Histórico" (T-13) do produto "Arroz Branco Tio João 5kg"
    Quando seleciono o filtro de período "Últimos 60 dias"
    Então vejo o gráfico de linha exibindo a variação de preço entre R$ 26,90 e R$ 32,50
    E abaixo vejo a relação ordenada de todas as notas fiscais registradas no período
    E o registro de R$ 26,90 em 18/10/2026 está marcado como a mínima histórica recente
```

---

## US-02.06 — Detalhe do produto com foto e especificações
**Como** usuário navegando pelo catálogo,  
**quero** ver a ficha detalhada do produto com foto ampliada, especificações e resumo de preços,  
**para** ter certeza de qual produto se trata antes de planejar minha compra.

**Regras de negócio:**
- Tela `T-14`.
- Cabeçalho com foto principal do produto. Toque na imagem abre modal lightbox ampliado em tela cheia.
- Metadados: Nome oficial, Código EAN-13, Categoria, Marca, Unidade de medida usual.
- Card de resumo com:
  - Menor preço atual (em verde).
  - Preço médio na região.
  - Maior preço recente.
  - Quantidade total de mercados com oferta nos últimos 30 dias.
- Botão de ação direta: "Adicionar à Cesta" (`T-40`).
- Atalho para abrir a comparação completa de lojas (`T-12`) e o histórico de preços (`T-13`).

```gherkin
# language: pt
Funcionalidade: Detalhe do produto com foto e especificações

  Cenário: Visualização da ficha do produto e abertura de lightbox da imagem
    Dado que estou na tela "Detalhe produto" (T-14) do "Sabão Líquido Omo 3L"
    Quando toco na foto do produto
    Então a imagem é aberta em modo lightbox em alta resolução com opção de fechar
    E ao fechar vejo o resumo de preços indicando mínima de R$ 39,90 e média de R$ 46,20
    E vejo o botão "Adicionar à Cesta" habilitado
```

---

## US-02.07 — Filtrar observações por frescor temporal
**Como** comprador que precisa de preços atuais e válidos hoje,  
**quero** filtrar os preços por frescor (ex.: notas dos últimos 7, 15 ou 30 dias),  
**para** não considerar ofertas antigas ou preços de meses atrás que já sofreram reajuste.

**Regras de negócio:**
- O filtro de frescor está disponível nas telas `T-10` (Home), `T-11` (Busca) e `T-12` (Comparação).
- Opções de frescor:
  - "Últimos 7 dias" (alta confiabilidade de validade).
  - "Últimos 15 dias" (padrão sugerido).
  - "Últimos 30 dias".
  - "Qualquer data" (todo o histórico).
- Ao aplicar o filtro, o cálculo do menor preço e os cards de comparação recalculam considerando exclusivamente as notas emitidas dentro da janela selecionada.
- Se uma loja só tiver notas com mais de 30 dias, ela é ocultada do ranking atual ou exibida com aviso de desatualização.

```gherkin
# language: pt
Funcionalidade: Filtrar observações por frescor temporal

  Cenário: Filtragem por preços dos últimos 7 dias
    Dado que estou na tela "Comparação" (T-12) com o filtro padrão de 30 dias
    Quando altero o seletor de frescor para "Últimos 7 dias"
    Então a lista é atualizada exibindo somente preços de notas emitidas na última semana
    E notas anteriores a 7 dias são desconsideradas do cálculo do menor preço atual
    E a interface indica "Exibindo preços coletados nos últimos 7 dias"
```
