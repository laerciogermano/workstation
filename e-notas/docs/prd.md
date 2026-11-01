# PRD — notinhas.shop (e-notas)

**Produto:** notinhas.shop · código / repo: e-notas  
**Status:** rascunho pós-benchmarking (2026-11-01)  
**Card:** [Benchmarking soluções similares](https://trello.com/c/1fMjqGdR)  
**Visão:** [`../README.md`](../README.md) · **REQ:** [`requisitos.md`](requisitos.md) · **Benchmarking:** [`../marca/benchmarking-solucoes/README.md`](../marca/benchmarking-solucoes/README.md)

---

## 1. Definição (o quê)

O **notinhas.shop** é um **sistema cooperativo de notinhas** para:

- **comparar preço** entre estabelecimentos;
- **simular economia** (quanto se paga a menos com a escolha / split);
- **pesquisar item em local próximo** (GPS, centro, bairro);
- **listar estabelecimentos perto** que **menos cobram** ou **mais cobram** (nível de preço agregado no raio);
- **destaques de concorrência de preços** — quando uma observação/publicação fica **abaixo** do preço de referência do item, o item entra no feed de destaques;
- **vitrine de lojas** — catálogo público do estabelecimento (itens observados / e-commerce read-only), inclusive o que **não está anunciado na internet**;
- **dar visibilidade ao comércio local** — exposição ao público do sortimento de balcão (descoberta → loja física);
- **comprar produtos sem a margem** típica de apps de e-commerce / delivery (ex.: iFood, 99) — preço do balcão/NFC-e, não do marketplace;
- **separar compras** entre lojas para **menor custo total**;
- **delivery / Full** (trilha futura): cada loja pode operar como **depósito de vendas** (fulfillment no sentido Mercado Livre **Full** — estoque na origem, pedido + entrega a partir da vitrine/cesta).

Cooperativo: quem contribui deposita a NFC-e; quem consulta usa o índice coletivo. Marca pública **notinhas.shop** · código/repo **e-notas**.

## 2. Problema

Preço de mercado é opaco; a NFC-e traz preço, loja, data e código interno do item — **não o EAN** (o vínculo EAN é scan cooperativo). Sem índice consumer, o sinal de preço físico não vira comparação coletiva. Falta comparação, histórico, cesta (inclusive apartada), **vitrine do estabelecimento**, **visibilidade pública do sortimento local (itens fora da web)**, **busca “onde comprar perto de mim”**, **ranking de lojas perto (mais baratas / mais caras)**, **gestão do que comprou / quando / quanto gasta** (análise financeira pessoal) e **API B2B**. Apps de marketplace encarecem o mesmo item com margem de canal — o índice NFC-e + EAN colaborativo expõe o **preço físico** e o comércio local.

## 3. Como (mecanismo)

Ler o QR/URL da NFC-e (preço, estabelecimento, data, cód. interno), vincular EAN por contribuição cooperativa e servir:

- menor preço e ocorrências;
- histórico;
- simulação de economia (cesta cotada / split);
- cesta com montagem apartada;
- tela do estabelecimento (catálogo público / vitrine — sortimento local, inclusive fora da web);
- busca de item com **estabelecimentos físicos próximos** (ex.: “no centro”);
- **ranking de estabelecimentos próximos** (os que menos cobram / mais cobram no raio);
- **destaques** (itens com preço abaixo do mercado / referência);
- **gestão de compras pessoais** (o que comprou, quando, gasto mensal, análise financeira);
- API para empresas;
- **futuro:** **delivery / Full** — loja como depósito de vendas (pedido + entrega a partir da vitrine/cesta).

## 4. Personas

| Persona | Job |
|---------|-----|
| **Contribuinte** | Cola o QR da nota e vincula EAN (scan cooperativo) quando a nota só traz cód. interno |
| **Comprador** | Busca EAN/nome, compara estabelecimentos, monta cesta, vê vitrine, descobre **onde comprar perto**, vê **quais lojas perto cobram menos ou mais**, **acompanha o próprio gasto**; no futuro, pede **delivery** |
| **Empresa / parceiro** | Ganha **vitrine pública**; aparece no **ranking** (mais/menos cobra) e nos **destaques** se o preço publicado estiver abaixo do mercado; consome/alimenta via API; no futuro, opera a loja como depósito (**Full**) |

## 5. Capacidades-alvo (must / should)

### 5.1 Comparação de preços — *must*
- Mesmo produto (EAN preferencial) entre estabelecimentos.
- Menor preço explícito com **loja + data**.
- Sem EAN: busca por descrição com confiança menor.

### 5.2 Histórico de preços — *must*
- Série temporal por produto (e por loja quando houver dados).
- Cada ponto = observação de nota (valor, estabelecimento, data).

### 5.3 Montagem apartada — *should*
- Cesta cotada **por mercado** (total + cobertura “com preço”).
- Sugestão de **divisão entre 2+ estabelecimentos** quando reduzir o custo total.
- “Sem preço” não inventa valor.
- Opcional: custo/rota de deslocamento.

### 5.4 Tela da loja (vitrine e-commerce) — *should*
- Página do estabelecimento com **grade/lista de itens** observados naquela loja (catálogo/e-commerce, **sem checkout**).
- **Visibilidade do comércio local:** expor ao público o sortimento de balcão — inclusive itens que **não estão anunciados na internet** / marketplaces — a partir das notas (e, no futuro, catálogo oficial via API).
- Por item: nome, EAN (se houver), último preço, data, link para histórico/comparação.
- Filtro/busca na loja; ordenação preço / frescor / nome.
- Entrada: pin no mapa, resultado de busca geo, comparação ou nota ingerida.
- Não é marketplace: sortimento **inferido das notas** (vitrine de descoberta, não checkout).

### 5.5 Busca geo — “onde comprar perto” — *must*
- Pesquisar um **item** (nome ou EAN) e ver **estabelecimentos físicos** que o têm no índice, ordenados por **proximidade** e/ou preço.
- Âncora geográfica: GPS do usuário **ou** ponto/região escolhida (ex.: **centro** da cidade, bairro, endereço).
- Resultado por loja: distância, preço observado, data, link para vitrine da loja e para o mapa.
- Filtros: raio (km), ordenar por distância vs menor preço, frescor máximo (ex.: só notas dos últimos N dias).
- Caso de uso: “estou / vou ao centro — onde compro este item fisicamente mais perto (e barato)?”.

### 5.6 Ranking de estabelecimentos perto — *must*
- Listar **lojas no raio** (GPS ou região: centro, bairro, endereço) ordenadas pelas que **menos cobram** ou **mais cobram**.
- Nível de preço **agregado da loja** (não um único item): índice derivado das observações NFC-e no período (ex. mediana / desvio vs média da região nos EANs com cobertura).
- Resultado por loja: posição no ranking, score/nível (“mais barata” ↔ “mais cara”), distância, nº de itens observados / frescor, link para vitrine.
- Filtros: raio (km), ordenar por **mais baratas** ou **mais caras**, frescor máximo, cobertura mínima (ex. ≥N EANs no período).
- Distinto da §5.5: aqui a pergunta é “**quais mercados perto de mim são mais baratos / caros?**”, não “onde acho este item”.
- Transparência: mostrar janela de dados e que o score é observação de nota (não tabela oficial da loja).

### 5.7 Destaques / concorrência de preços — *must*
- Quando uma observação (nota depositada ou publicação da loja) fica **abaixo** do preço de referência do mesmo produto (EAN preferencial) na região/raio, o item **entra nos destaques**.
- Feed público de concorrência: produto, preço novo, loja, data, Δ% vs referência (ex. mediana / menor anterior / média do raio).
- Critérios: limiar mínimo de queda (ex. ≥X% ou ≥R$ Y abaixo); frescor; cobertura EAN; anti-spam (dedupe por loja+EAN numa janela).
- Entrada: home / “perto de mim” / vitrine da loja (selo “destaque”).
- Incentivo à loja: preço competitivo = **visibilidade**; ao comprador: atalho para as melhores ofertas recentes.
- Distinto da §5.1 (comparação sob demanda) e da §5.6 (ranking agregado da loja): aqui o gatilho é **preço abaixo → destaque automático**.

### 5.8 Integrações via API para empresas — *should* (B2B)
- API autenticada: consulta de preços / posição; vínculo EAN ↔ código de unidade; (futuro) catálogo oficial da loja.
- Separar consumer (público/rate-limit) de B2B (chave, contrato, LGPD).

### 5.9 Sistema de delivery / Full — *future*
- Evolução da vitrine/cesta para **pedido com entrega** (não só “onde comprar fisicamente”).
- Cada loja física pode tornar-se também um **depósito de vendas** — no jargão do Mercado Livre: **Full** (**Mercado Envios Full** / **fulfillment**): estoque na origem (ou CD parceiro), preparação e envio a partir da venda.
- Escopo futuro típico: carrinho → checkout → pagamento → logística (própria, parceira ou da loja-depósito) → status do pedido.
- Pré-requisitos: vitrine estável, API empresas, acordo com estabelecimentos (estoque/preço oficial — não só observação de NFC-e).
- **Fora da v1:** delivery/Full não bloqueia comparação, geo, histórico, ranking, destaques, vitrine nem montagem apartada.
- **Gap vs apps (literatura):** preço em iFood/99/marketplaces costuma ficar acima do balcão (ordens típicas ~+8% a +22% em mercado; ~+17% a +30% em restaurante — ver [`../marca/comparacao-precos-apps/`](../marca/comparacao-precos-apps/README.md)). O índice NFC-e permanece fonte de **preço físico**; não misturar séries sem rótulo de canal.

### 5.10 Gestão de compras e análise financeira — *should*
- A partir das **notas que o usuário depositou** (conta / sessão autenticada), expor o **extrato pessoal** de compras — distinto do índice público de preços.
- **O que comprou:** lista de itens (nome, EAN se houver, quantidade, valor) agrupáveis por nota ou por produto.
- **Quando comprou:** data/hora da nota (emissão NFC-e); filtros por período (dia, semana, mês, intervalo).
- **Onde comprou:** estabelecimento (nome, CNPJ) por nota/item.
- **Gasto por mês:** total mensal (e opcionalmente por semana); comparação mês a mês (variação %).
- **Análise financeira (MVP):**
  - total no período; ticket médio por nota; nº de notas / itens;
  - ranking de estabelecimentos por gasto;
  - ranking de produtos / categorias (quando houver classificação; senão por descrição/EAN);
  - tendência simples (últimos N meses) — sem assessoria de investimento.
- Privacidade: só o dono da conta vê o extrato; notas no índice público continuam sem vincular identidade do contribuinte nas buscas de preço.
- **Não é:** open banking completo, orçamento prescritivo, nem cartão de crédito — o insumo canônico é a NFC-e depositada.

## 6. Fora de escopo (PRD v1)

- Checkout / pagamento / **delivery** (planejado em §5.9 *future*, não nesta versão)
- Emissão de NF-e/NFS-e
- Scraping fora da URL do QR (exceto fontes oficiais explícitas no futuro)
- App nativo obrigatório (web HTTPS primeiro)
- Substituir o Menor Preço Nota Paraná como “fonte SEFAZ”
- Navegação turn-by-turn completa (link para mapa externo basta no início)

## 7. Métricas de sucesso (orientação)

| Métrica | Sinal |
|---------|--------|
| Notas ingeridas / semana | Liquidez do índice |
| Buscas com ≥1 ocorrência EAN | Utilidade da comparação |
| Buscas geo com resultado em raio | “Onde comprar perto” |
| Sessões no ranking lojas perto (baratas/caras) | Nível de preço por estabelecimento |
| % cestas com split usado | Montagem apartada |
| Sessões na vitrine do estabelecimento | Engajamento por loja |
| Usuários com extrato / gasto mensal visto | Ativação da gestão financeira pessoal |
| Parceiros API ativos | Trilha B2B |
| (futuro) Pedidos delivery concluídos | Ativação da trilha entrega |

## 8. Prioridade sugerida

1. Comparação EAN + menor preço  
2. Busca geo (item → estabelecimentos perto / no centro)  
3. **Ranking de lojas perto** (menos cobram / mais cobram)  
4. **Destaques** (preço abaixo do mercado → feed de concorrência)  
5. Histórico por produto/estabelecimento  
6. Vitrine do estabelecimento (e-commerce read-only)  
7. **Gestão de compras + gasto mensal / análise financeira** (extrato das notas do usuário)  
8. Montagem apartada (cesta + split)  
9. API empresas (MVP: leitura + vínculo EAN)  
10. **Delivery / Full** — loja como depósito de vendas (após vitrine + API + parceria)

## 9. Concorrência (síntese)

Ver matriz em [`../marca/benchmarking-solucoes/00-curadoria.html`](../marca/benchmarking-solucoes/00-curadoria.html) · apresentação [`../marca/apresentacao-notinhas-v1.html`](../marca/apresentacao-notinhas-v1.html).

### 9.1 Alcance geográfico (fontes públicas · 2026-11)

| Solução | Alcance | Tipo |
|---------|---------|------|
| Busca Preço | **MG, SP, RJ** (expande) | Consumer colab. |
| Nota Preço | **RM Rio (RJ)** | Consumer (redes) |
| Mercado Certo | **Por cidade** (liquidez colab.) | Consumer colab. |
| GoMarket | **Por cidade** (liquidez colab.) | Consumer colab. |
| Qual o Preço | **Perto de você** (app em breve) | Consumer colab. |
| PoupApp | **Nacional** (26 UF + DF declarados; liquidez por cidade) | Consumer colab. |
| Nota Paraná | **PR** | Gov SEFAZ |
| Menor Preço Brasil | **~15–16 UFs** (adesão; lista muda; SP tipicamente fora) — *não é nacional* | Gov multi-UF |
| Economiza AL | **AL** | Gov SEFAZ + API |
| Quantto | **B2B contratual** (não consumer nacional) | B2B |
| **notinhas.shop** | **Lab PR** (ex. São José dos Pinhais) → expansão por liquidez NFC-e | Consumer cooperativo + B2B |

### 9.2 Matriz de comparação (todas as capacidades)

| Solução | Comp | Hist | Apart | Vitr | Geo | Rank | Dest | API | Deliv |
|---------|------|------|-------|------|-----|------|------|-----|-------|
| Busca Preço | Sim | Sim | Parc. | Parc. | Parc. | Não | Não | Não | Não |
| Nota Preço | Sim | Sim | **Sim** | Não | Parc. | Não | Não | Não | Não |
| Mercado Certo | Sim | Parc. | **Sim** | Não | **Sim** | Parc. | Não | Não | Não |
| GoMarket | Sim | Sim | Não | **Sim** | **Sim** | Parc. | Não | Não | Não |
| Qual o Preço | Sim | Parc. | Parc. | **Sim** | **Sim** | Parc. | Não | Não | Não |
| PoupApp | Sim | Parc. | Não | Não | Parc. | Não | Não | Não | Não |
| Nota Paraná | Sim | Parc. | Não | Não | **Sim** | Parc. | Não | Parc. | Não |
| MP Brasil | Sim | Parc. | Não | Não | **Sim** | Parc. | Não | Não | Não |
| Economiza AL | Sim | Parc. | Via 3º | Não | **Sim** | Parc. | Não | **Sim** | Não |
| Quantto | Sim | Sim | N/A | N/A | Reg. | N/A | N/A | **Sim** | Não |
| **notinhas.shop** | Alvo | Alvo | Alvo | Alvo | Alvo | Alvo | Alvo | Alvo | **Fut.** |

Comp=comparar · Hist=histórico · Apart=split/economia · Vitr=vitrine + itens fora da web · Geo=item perto · Rank=lojas baratas/caras · Dest=destaques (preço abaixo) · API=B2B · Deliv=delivery/Full. Gasto pessoal = alvo notinhas (fora desta grade).

### 9.3 Capacidade × gap da proposta

| Capacidade | Quem já faz bem | Gap / proposta notinhas |
|------------|-----------------|-------------------------|
| Comparação | Todos + gov | Paridade + UX |
| Histórico | Busca Preço, Nota Preço, GoMarket | Expor série das observações |
| Simular economia / apartada | Nota Preço, Mercado Certo | Poucos fazem split explícito |
| Vitrine estabelecimento | GoMarket, Qual o Preço | Poucos como e-commerce da loja |
| Visibilidade itens fora da web | Quase ninguém no consumer NFC-e | Sortimento de balcão → público |
| Busca geo / perto | Nota Paraná, MP Brasil, apps geo | Âncora “centro/bairro” + vitrine |
| Ranking lojas baratas/caras perto | Gov/apps (parcial, por item) | Lista agregada da loja no raio |
| Destaques (preço abaixo → feed) | Quase ninguém no NFC-e | Concorrência automática nos destaques |
| Sem margem de app (iFood/99) | Quase ninguém posiciona assim | Preço balcão/NFC-e explícito |
| Comércio local | Implícito nos geo | Job explícito + exposição pública |
| Gestão de compras / gasto | Extratos / finanças | NFC-e depositada → extrato |
| API empresas | Quantto, Economiza AL | B2B no eixo consumer NFC-e |
| Delivery / Full (loja-depósito) | Marketplaces (com margem) | Futuro: loja física = depósito (estilo Full) |

**Leitura:** ninguém no consumer junta o pacote da §1 (comparar + simular + perto + ranking + vitrine + gasto + local + split + API + delivery futuro) com preço sem margem de marketplace. Gov cobre geo bem, mas sem vitrine/split/UX de compra. Alcance amplo (PoupApp / MP Brasil) ≠ pacote completo.

## 10. Rollback / caminho inverso

- PRD: remover ou marcar seções como *revogado*; §1 definição e §9 alcance são o “antes” desta clarificação.
- §3 mecanismo (antes): setas / “indexar produto (EAN)…”; depois: NFC-e traz preço/loja/data/cód. interno; EAN = vínculo cooperativo (não vem na nota).
- §2 (antes): “NFC-e já traz EAN…”; depois: nota **não** traz EAN.  
- REQ-014 em `requisitos.md` espelha as capacidades.  
- Card Trello e pasta de benchmarking: ver READMEs locais.  
- Apresentação: slides 03 = o quê, 04–05 = como, 06–07 = matriz/alcance.
- §5.6 ranking / §5.7 destaques: remover seções e correlatos em §1–§3, prioridade, matriz e slides.
- Visibilidade comércio local / itens fora da web: reverter bullets §1, §5.4 e cards da apresentação.
- §5.9 Full: reverter nomenclatura “Delivery / Full” e menção a loja-depósito.
