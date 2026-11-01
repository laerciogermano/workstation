# PRD — notinhas.shop (e-notas)

**Produto:** notinhas.shop · código / repo: e-notas  
**Status:** rascunho pós-benchmarking (2026-11-01)  
**Card:** [Benchmarking soluções similares](https://trello.com/c/1fMjqGdR)  
**Visão:** [`../README.md`](../README.md) · **REQ:** [`requisitos.md`](requisitos.md) · **Benchmarking:** [`../marca/benchmarking-solucoes/README.md`](../marca/benchmarking-solucoes/README.md)

---

## 1. Problema

Preço de mercado é opaco; a NFC-e já traz EAN, preço, loja e data, mas o dado some após a compra. Falta um índice consumer com comparação, histórico, cesta (inclusive apartada), **vitrine do estabelecimento**, **busca “onde comprar perto de mim”**, **gestão do que comprou / quando / quanto gasta** (análise financeira pessoal) e **API B2B**.

## 2. Proposta

Transformar o QR/URL da NFC-e em índice EAN → preço → estabelecimento → data, e servir:

- menor preço e ocorrências;
- histórico;
- cesta com montagem apartada;
- tela do estabelecimento (catálogo read-only);
- busca de item com **estabelecimentos físicos próximos** (ex.: “no centro”);
- **gestão de compras pessoais** (o que comprou, quando, gasto mensal, análise financeira);
- API para empresas;
- **futuro:** sistema de **delivery** (pedido + entrega a partir da vitrine/cesta).

## 3. Personas

| Persona | Job |
|---------|-----|
| **Contribuinte** | Escaneia/cola o QR e alimenta o índice |
| **Comprador** | Busca EAN/nome, compara estabelecimentos, monta cesta, vê vitrine, descobre **onde comprar perto**, **acompanha o próprio gasto**; no futuro, pede **delivery** |
| **Empresa / parceiro** | Consome ou alimenta o índice via API; no futuro, recebe/atende pedidos de entrega |

## 4. Capacidades-alvo (must / should)

### 4.1 Comparação de preços — *must*
- Mesmo produto (EAN preferencial) entre estabelecimentos.
- Menor preço explícito com **loja + data**.
- Sem EAN: busca por descrição com confiança menor.

### 4.2 Histórico de preços — *must*
- Série temporal por produto (e por loja quando houver dados).
- Cada ponto = observação de nota (valor, estabelecimento, data).

### 4.3 Montagem apartada — *should*
- Cesta cotada **por mercado** (total + cobertura “com preço”).
- Sugestão de **divisão entre 2+ estabelecimentos** quando reduzir o custo total.
- “Sem preço” não inventa valor.
- Opcional: custo/rota de deslocamento.

### 4.4 Tela da loja (vitrine e-commerce) — *should*
- Página do estabelecimento com **grade/lista de itens** observados naquela loja (catálogo/e-commerce, **sem checkout**).
- Por item: nome, EAN (se houver), último preço, data, link para histórico/comparação.
- Filtro/busca na loja; ordenação preço / frescor / nome.
- Entrada: pin no mapa, resultado de busca geo, comparação ou nota ingerida.
- Não é marketplace: sortimento **inferido das notas**.

### 4.5 Busca geo — “onde comprar perto” — *must*
- Pesquisar um **item** (nome ou EAN) e ver **estabelecimentos físicos** que o têm no índice, ordenados por **proximidade** e/ou preço.
- Âncora geográfica: GPS do usuário **ou** ponto/região escolhida (ex.: **centro** da cidade, bairro, endereço).
- Resultado por loja: distância, preço observado, data, link para vitrine da loja e para o mapa.
- Filtros: raio (km), ordenar por distância vs menor preço, frescor máximo (ex.: só notas dos últimos N dias).
- Caso de uso: “estou / vou ao centro — onde compro este item fisicamente mais perto (e barato)?”.

### 4.6 Integrações via API para empresas — *should* (B2B)
- API autenticada: consulta de preços / posição; vínculo EAN ↔ código de unidade; (futuro) catálogo oficial da loja.
- Separar consumer (público/rate-limit) de B2B (chave, contrato, LGPD).

### 4.7 Sistema de delivery — *future*
- Evolução da vitrine/cesta para **pedido com entrega** (não só “onde comprar fisicamente”).
- Escopo futuro típico: carrinho → checkout → pagamento → logística (própria, parceira ou da loja) → status do pedido.
- Pré-requisitos: vitrine estável, API empresas, acordo com estabelecimentos (estoque/preço oficial — não só observação de NFC-e).
- **Fora da v1:** delivery não bloqueia comparação, geo, histórico nem montagem apartada.
- **Gap vs apps (literatura):** preço em iFood/99/marketplaces costuma ficar acima do balcão (ordens típicas ~+8% a +22% em mercado; ~+17% a +30% em restaurante — ver [`../marca/comparacao-precos-apps/`](../marca/comparacao-precos-apps/README.md)). O índice NFC-e permanece fonte de **preço físico**; não misturar séries sem rótulo de canal.

### 4.8 Gestão de compras e análise financeira — *should*
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

## 5. Fora de escopo (PRD v1)

- Checkout / pagamento / **delivery** (planejado em §4.7 *future*, não nesta versão)
- Emissão de NF-e/NFS-e
- Scraping fora da URL do QR (exceto fontes oficiais explícitas no futuro)
- App nativo obrigatório (web HTTPS primeiro)
- Substituir o Menor Preço Nota Paraná como “fonte SEFAZ”
- Navegação turn-by-turn completa (link para mapa externo basta no início)

## 6. Métricas de sucesso (orientação)

| Métrica | Sinal |
|---------|--------|
| Notas ingeridas / semana | Liquidez do índice |
| Buscas com ≥1 ocorrência EAN | Utilidade da comparação |
| Buscas geo com resultado em raio | “Onde comprar perto” |
| % cestas com split usado | Montagem apartada |
| Sessões na vitrine do estabelecimento | Engajamento por loja |
| Usuários com extrato / gasto mensal visto | Ativação da gestão financeira pessoal |
| Parceiros API ativos | Trilha B2B |
| (futuro) Pedidos delivery concluídos | Ativação da trilha entrega |

## 7. Prioridade sugerida

1. Comparação EAN + menor preço  
2. Busca geo (item → estabelecimentos perto / no centro)  
3. Histórico por produto/estabelecimento  
4. Vitrine do estabelecimento (e-commerce read-only)  
5. **Gestão de compras + gasto mensal / análise financeira** (extrato das notas do usuário)  
6. Montagem apartada (cesta + split)  
7. API empresas (MVP: leitura + vínculo EAN)  
8. **Sistema de delivery** (após vitrine + API + parceria)

## 8. Concorrência (síntese)

Ver matriz em [`../marca/benchmarking-solucoes/00-curadoria.html`](../marca/benchmarking-solucoes/00-curadoria.html).

| Capacidade | Quem já faz bem | Gap notinhas |
|------------|-----------------|--------------|
| Comparação | Todos + Nota Paraná | Paridade + UX |
| Histórico | Busca Preço, Nota Preço | Expor série das observações |
| Montagem apartada | Nota Preço, Mercado Certo | Poucos fazem split |
| Vitrine estabelecimento | GoMarket, Qual o Preço | Poucos como e-commerce |
| Busca geo / perto | Nota Paraná, MP Brasil, Qual o Preço, Mercado Certo | Âncora “centro” + vitrine |
| Gestão de compras / gasto | Extratos de banco / apps de finanças | Poucos amarram **NFC-e depositada** → extrato + análise |
| API empresas | Quantto, Economiza AL | Quase oceano azul no consumer NFC-e |

## 9. Rollback / caminho inverso

- PRD: remover ou marcar seções como *revogado*.  
- REQ-014 em `requisitos.md` espelha as capacidades.  
- Card Trello e pasta de benchmarking: ver READMEs locais.
