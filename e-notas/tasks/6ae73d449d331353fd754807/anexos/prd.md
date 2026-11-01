# PRD — notinhas.org (e-notas)

**Produto:** notinhas.org · código / repo: e-notas  
**Status:** rascunho pós-benchmarking (2026-11-01)  
**Card:** [Benchmarking soluções similares](https://trello.com/c/1fMjqGdR)  
**Visão:** [`../README.md`](../README.md) · **REQ:** [`requisitos.md`](requisitos.md) · **Benchmarking:** [`../marca/benchmarking-solucoes/README.md`](../marca/benchmarking-solucoes/README.md)

---

## 1. Problema

Preço de mercado é opaco; a NFC-e já traz EAN, preço, loja e data, mas o dado some após a compra. Falta um índice consumer com comparação, histórico, cesta (inclusive apartada), **vitrine da loja**, **busca “onde comprar perto de mim”** e **API B2B**.

## 2. Proposta

Transformar o QR/URL da NFC-e em índice EAN → preço → estabelecimento → data, e servir:

- menor preço e ocorrências;
- histórico;
- cesta com montagem apartada;
- tela da loja (catálogo read-only);
- busca de item com **lojas físicas próximas** (ex.: “no centro”);
- API para empresas.

## 3. Personas

| Persona | Job |
|---------|-----|
| **Contribuinte** | Escaneia/cola o QR e alimenta o índice |
| **Comprador** | Busca EAN/nome, compara lojas, monta cesta, vê vitrine, descobre **onde comprar perto** |
| **Empresa / parceiro** | Consome ou alimenta o índice via API |

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

## 5. Fora de escopo (PRD v1)

- Checkout / pagamento / entrega
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
| Sessões na vitrine da loja | Engajamento por estabelecimento |
| Parceiros API ativos | Trilha B2B |

## 7. Prioridade sugerida

1. Comparação EAN + menor preço  
2. Busca geo (item → lojas perto / no centro)  
3. Histórico por produto/loja  
4. Vitrine da loja (e-commerce read-only)  
5. Montagem apartada (cesta + split)  
6. API empresas (MVP: leitura + vínculo EAN)

## 8. Concorrência (síntese)

Ver matriz em [`../marca/benchmarking-solucoes/00-curadoria.html`](../marca/benchmarking-solucoes/00-curadoria.html).

| Capacidade | Quem já faz bem | Gap notinhas |
|------------|-----------------|--------------|
| Comparação | Todos + Nota Paraná | Paridade + UX |
| Histórico | Busca Preço, Nota Preço | Expor série das observações |
| Montagem apartada | Nota Preço, Mercado Certo | Poucos fazem split |
| Vitrine loja | GoMarket, Qual o Preço | Poucos como e-commerce |
| Busca geo / perto | Nota Paraná, MP Brasil, Qual o Preço, Mercado Certo | Âncora “centro” + vitrine |
| API empresas | Quantto, Economiza AL | Quase oceano azul no consumer NFC-e |

## 9. Rollback / caminho inverso

- PRD: remover ou marcar seções como *revogado*.  
- REQ-014 em `requisitos.md` espelha as capacidades.  
- Card Trello e pasta de benchmarking: ver READMEs locais.
