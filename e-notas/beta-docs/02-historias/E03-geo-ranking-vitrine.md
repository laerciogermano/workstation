# E03 — Estabelecimentos (geo, ranking e vitrine)

Objetivo: permitir que o comprador abra **Estabelecimentos** já nas lojas **mais baratas** perto (ranking na listagem), busque mercados, explore o mapa e a vitrine, e — a partir do detalhe de um item — veja onde comprar perto no raio.

| ID | História | RF | Prio | Pts | Telas |
|---|---|---|---|---|---|
| US-03.01 | Buscar item perto da minha localização (raio em km) | RF-E03-01 | M | 3 | T-30 |
| US-03.02 | Ranking de estabelecimentos no raio (mais baratas na lista) | RF-E03-02 | M | 5 | T-31 |
| US-03.03 | Mapa de estabelecimentos com pins e popup de status | RF-E03-03 | M | 3 | T-32 |
| US-03.04 | Vitrine da loja em grade com sortimento observado | RF-E03-04 | S | 3 | T-33 |
| US-03.05 | Detalhe do item observado na vitrine da loja | RF-E03-05 | S | 2 | T-14, T-33 |
| US-03.06 | Vincular ou editar EAN direto a partir da vitrine | RF-E03-06 | S | 2 | T-23, T-33 |

---

## US-03.01 — Buscar item perto da minha localização (raio em km)
**Como** consumidor que precisa comprar um produto agora,  
**quero** buscar um item e ver os estabelecimentos físicos próximos que o comercializam dentro de um raio configurável,  
**para** não me deslocar até um mercado distante se posso encontrar o produto no meu próprio bairro.

**Regras de negócio:**
- A busca por proximidade (`T-30`) utiliza as coordenadas de referência do usuário (GPS ativo ou ponto central da cidade/bairro).
- O seletor de raio permite escolher distâncias entre 1 km, 3 km, 5 km, 10 km e 20 km.
- O cálculo espacial utiliza fórmula Haversine ou funções PostGIS (`ST_DWithin` / `ST_Distance`).
- Para cada loja no raio contendo o item, exibe:
  - Nome do estabelecimento e endereço simplificado.
  - Distância em linha reta calculada em metros ou quilômetros (ex.: "850 m" ou "2,4 km").
  - Último preço unitário registrado no estabelecimento.
  - Data de emissão da nota mais recente daquele produto na loja.
- Permite alternar a ordenação do resultado: "Mais próximo primeiro" vs "Mais barato primeiro".

```gherkin
# language: pt
Funcionalidade: Buscar item perto da minha localização

  Cenário: Busca de item com ordenação por proximidade
    Dado que minha localização atual está no bairro "Batel" em Curitiba
    E estou na tela "Perto" (T-30) buscando pelo produto "Fralda Pampers Confort Sec G"
    Quando defino o raio para "3 km" e seleciono a ordenação "Mais próximo primeiro"
    Então vejo a lista de estabelecimentos contendo o produto
    E o primeiro resultado é a "Farmácia Nissei Batel" a 400 m por R$ 89,90
    E o segundo resultado é o "Supermercado Pão de Açúcar" a 1,1 km por R$ 79,90

  Cenário: Alternância para menor preço no raio
    Dado que estou visualizando os resultados no raio de 3 km
    Quando altero a ordenação para "Menor preço primeiro"
    Então o "Supermercado Pão de Açúcar" a 1,1 km por R$ 79,90 passa para o topo da lista com destaque verde
```

---

## US-03.02 — Ranking de estabelecimentos no raio (mais baratas na lista)
**Como** consumidor curioso sobre a competitividade dos mercados da minha região,  
**quero** abrir Estabelecimentos já na lista das lojas **mais baratas** perto, com ranking em cada linha (incluindo posição entre as mais caras),  
**para** escolher o meu mercado preferencial para compras volumosas do mês.

**Regras de negócio:**
- Tela `T-31` = **entrada** do fluxo Estabelecimentos (aba **Lojas**); título **Mais baratas**.
- Lista ordenada das mais baratas no raio (sem tabs “Mais baratas / Mais caras”).
- Cada linha exibe: posição **Nª mais barata** e **Mª mais cara da região**, desvio vs mediana e distância.
- Campo de **busca** de estabelecimento + chips de raio.
- O score não é de um único produto: **índice ponderado de desvio relativo** sobre cesta comum (EANs com ≥3 concorrentes) nos últimos 30 dias.
- Critério de elegibilidade: ≥15 itens com notas recentes (protótipo: ≥20 EANs / mediana 14d).
- Transparência: amostra e critério visíveis no subtítulo.

```gherkin
# language: pt
Funcionalidade: Ranking de estabelecimentos no raio

  Cenário: Entrada em Estabelecimentos nas mais baratas
    Dado que abro a aba "Lojas" (T-31) com raio de 5 km
    Então vejo a lista ordenada das mais baratas perto
    E o "Condor Centro" está na 1ª posição com "1ª mais barata · 3ª mais cara da região"
    E o "Super Muffato" na 2ª com "2ª mais barata · 2ª mais cara da região"
    E há campo de busca de estabelecimento

  Cenário: Sem toggle baratas/caras
    Dado que estou na tela "Mais baratas" (T-31)
    Então não vejo tabs "Mais baratas" / "Mais caras"
    E a posição cara aparece na própria linha do ranking
```

---

## US-03.03 — Mapa de estabelecimentos com pins e popup de status
**Como** usuário explorando visualmente a cidade,  
**quero** visualizar um mapa com pins de todos os supermercados cadastrados,  
**para** identificar geograficamente onde estão os mercados e tocar em qualquer um para ver preços.

**Regras de negócio:**
- Tela `T-32`, integrando biblioteca de mapas (Leaflet / OpenStreetMap).
- Exibe a localização atual do usuário como um marcador azul pulsante.
- Plota pins dos estabelecimentos que possuem coordenadas geocodificadas válidas (`empresas.lat` e `empresas.lng`).
- Ao tocar em um pin:
  - Abre um popup inferior contendo o nome da empresa, endereço, distância e quantidade de itens na vitrine.
  - Botão de ação "Ver vitrine da loja" que direciona para a tela `T-33`.
- Se o usuário navegar no mapa, permite o botão "Pesquisar nesta área" para recarregar as lojas do enquadramento atual.

```gherkin
# language: pt
Funcionalidade: Mapa de estabelecimentos com pins

  Cenário: Interação com pin de estabelecimento no mapa
    Dado que estou na tela "Mapa" (T-32) visualizando a região central
    Quando toco no pin do "Supermercado Nacional Centro"
    Então o mapa centraliza suavemente no pin selecionado
    E surge o popup inferior com o nome "Supermercado Nacional", endereço "Rua Marechal Deodoro, 450"
    E a informação "184 produtos cadastrados"
    E toco no botão "Ver vitrine"
    Então sou direcionado para a tela "Vitrine da loja" (T-33) daquela unidade
```

---

## US-03.04 — Vitrine da loja em grade com sortimento observado
**Como** cliente de um supermercado específico,  
**quero** abrir a página da loja e ver seu sortimento de produtos em grade no formato catálogo/e-commerce,  
**para** explorar o que a loja vende e conferir os preços de balcão antes de ir presencialmente.

**Regras de negócio:**
- Tela `T-33`.
- Não se trata de um marketplace transacional tradicional (sem carrinho nem checkout de delivery na loja física). É um **catálogo público derivado das notas fiscais emitidas**.
- O layout segue grade mobile-first inspirada em aplicativos de delivery e redes sociais (cards compactos com foto, nome, preço e data da última nota).
- Se o preço praticado pela loja for o **menor preço registrado na cidade inteira para aquele produto**, o card exibe o selo verde "Menor Preço".
- Campo de busca interna na vitrine permitindo filtrar produtos daquela loja específica por nome ou EAN.
- Ordenações disponíveis: "Mais recentes", "Menor preço" e "Alfabética".

```gherkin
# language: pt
Funcionalidade: Vitrine da loja em grade com sortimento observado

  Cenário: Navegação pelo catálogo de balcão de um supermercado
    Dado que estou na tela "Vitrine da loja" (T-33) do "Mercado Jacomar"
    Quando a página é carregada
    Então vejo o cabeçalho com nome, endereço e total de produtos registrados
    E vejo a grade de produtos contendo foto, nome e preço mais recente praticado
    E observo que o "Arroz 5kg" está com o selo verde "Menor Preço da Cidade"

  Cenário: Filtragem interna de produtos na vitrine
    Dado que estou na vitrine do "Mercado Jacomar"
    Quando digito "detergente" na busca da vitrine
    Então a grade é filtrada instantaneamente exibindo apenas os detergentes comercializados naquele estabelecimento
```

---

## US-03.05 — Detalhe do item observado na vitrine da loja
**Como** comprador navegando na vitrine de um mercado,  
**quero** tocar em um produto da vitrine para ver o histórico de preços daquele item naquela loja e a concorrência geral,  
**para** saber se o preço atual está bom em comparação com outras semanas e outras redes.

**Regras de negócio:**
- O toque no card de qualquer produto na vitrine (`T-33`) abre a ficha detalhada do produto (`T-14`).
- A tela de detalhe é contextualizada com o estabelecimento de origem:
  - Destaca o preço vigente naquela loja específica.
  - Apresenta o comparativo imediato com o menor preço concorrente (se houver mais barato em outro lugar, indica qual loja e a diferença de valor).
  - Exibe a linha do tempo das notas daquele estabelecimento para aquele item.

```gherkin
# language: pt
Funcionalidade: Detalhe do item observado na vitrine da loja

  Cenário: Abertura do detalhe a partir de um item da vitrine
    Dado que estou na tela "Vitrine da loja" (T-33) do "Festval Batel"
    Quando toco no card do "Vinho Tinto Chileno Casillero del Diablo 750ml"
    Então sou direcionado para a tela "Detalhe produto" (T-14)
    E vejo o preço no Festval de R$ 59,90
    E vejo o comparativo informando que o "Muffato" vende o mesmo item por R$ 49,90 (R$ 10,00 mais barato)
```

---

## US-03.06 — Vincular ou editar EAN direto a partir da vitrine
**Como** colaborador navegando pela vitrine de uma loja,  
**quero** tocar na ação "Vincular EAN" em um item que ainda não possui código de barras associado,  
**para** enriquecer o catálogo coletivo sem precisar sair da tela do mercado.

**Regras de negócio:**
- Na vitrine (`T-33`), cada item que ainda não possui EAN mapeado apresenta o botão ou ícone sutil "Adicionar EAN" (ou "Editar EAN" caso queira corrigir).
- O clique abre o modal `T-23` com o contexto pré-preenchido:
  - `empresa_id` fixado na loja atual.
  - `codigo_unidade` fixado no código interno do produto na nota.
- O usuário pode ler o código de barras com a câmera, enviar foto ou digitar o código.
- Após salvar o vínculo com sucesso:
  - O modal é fechado.
  - O card na vitrine atualiza dinamicamente exibindo o código EAN e a foto correspondente.
  - O produto é imediatamente indexado para a busca universal de preços.

```gherkin
# language: pt
Funcionalidade: Vincular ou editar EAN direto a partir da vitrine

  Cenário: Vínculo cooperativo realizado com sucesso na vitrine
    Dado que estou na tela "Vitrine da loja" (T-33) do mercado "Stilo Central"
    E vejo o produto interno "Cód 4410 - Biscoito Recheado 140g" sem EAN
    Quando toco no botão "Adicionar EAN" no card do produto
    Então o modal "Vincular EAN" (T-23) se abre com o item pré-selecionado
    Quando digito o código EAN "7891000245678" e toco em "Salvar"
    Então o vínculo é persistido na base de dados
    E o card do biscoito na vitrine passa a exibir a foto oficial e o código EAN associado
```
