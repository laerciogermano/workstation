# e-notas — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → pacote **[`beta-docs/`](beta-docs/README.md)** (PRD MoSCoW, histórias Gherkin, protótipos T-xx, plano BETA-nnn). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/README.md).  
**Beta 1.0 (construir do zero):** [`beta-docs/README.md`](beta-docs/README.md) · [protótipos](beta-docs/prototipos/index.html) · card [jhxFUqLz](https://trello.com/c/jhxFUqLz).  
Requisitos / regras: [`docs/requisitos.md`](docs/requisitos.md).  
Categorias canônicas: [`docs/categorias-produtos.md`](docs/categorias-produtos.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).  
App (scan QR + cadastro Postgres Contabo / schema `enotas`): [`app/`](app/README.md).  
Serviço EAN via descritivo (SERP + SI5, porta 4180): [`ean-serp/`](ean-serp/README.md).  
Deploy Contabo (`/enotas/`): [`deploy/`](deploy/README.md).  
Marca **notinhas.shop**: [`marca/README.md`](marca/README.md) · **DESIGN.md v2** [`marca/notinhas.shop.DESIGN.md`](marca/notinhas.shop.DESIGN.md) · print [`marca/marca-notinhas-shop-v2.html`](marca/marca-notinhas-shop-v2.html) · identidade [`marca/identidade-visual-notinhas-v1.html`](marca/identidade-visual-notinhas-v1.html) · DS [`marca/design-system-notinhas-v1.html`](marca/design-system-notinhas-v1.html) · tokens [`identidade-visual.md`](identidade-visual.md) · [`design-system.md`](design-system.md) · refs [`../core/shadcn-design/README.md`](../core/shadcn-design/README.md) · [identidade](https://trello.com/c/qUI3Rb9a) · [DS](https://trello.com/c/qdH95gZX).  
Refs identidade: [`marca/referencias-identidade/README.md`](marca/referencias-identidade/README.md).  
Benchmarking soluções similares: [`marca/benchmarking-solucoes/README.md`](marca/benchmarking-solucoes/README.md) · [card](https://trello.com/c/1fMjqGdR).  
Comparar preços NFC-e vs iFood/99Food/outros: [`marca/comparacao-precos-apps/`](marca/comparacao-precos-apps/README.md) · [card](https://trello.com/c/fapxKp3l).  
Documento de apresentação (produto + benchmarking + DS): [`marca/apresentacao-notinhas-v1.html`](marca/apresentacao-notinhas-v1.html) · [card](https://trello.com/c/hfGuzfMs) · [`tasks/6ae742a63b9ee278c2a0cc7e/`](tasks/6ae742a63b9ee278c2a0cc7e/README.md).
Logo (card + benchmarking logos): [`marca/benchmarking-logos/README.md`](marca/benchmarking-logos/README.md) · [card](https://trello.com/c/26aOrY0z) · [`tasks/6ae7ae51f0d412693108b6ad/`](tasks/6ae7ae51f0d412693108b6ad/README.md).  
PRD notinhas.shop: [`docs/prd.md`](docs/prd.md).

---

## Visão

O **e-notas** transforma o **QR Code da nota fiscal** (NFC-e / NF-e ao consumidor) em um **índice de preços por código de barras**: quem contribui escaneia a URL da nota; quem compra busca o produto e vê **onde está o menor preço** entre as notas já ingeridas.

## Problema

Comprar no dia a dia concentra três dores:

| Dor | O que acontece hoje |
|-----|---------------------|
| **Preço opaco** | O mesmo EAN custa valores diferentes em lojas próximas; o comprador só descobre depois de ir até o caixa. |
| **Comparação manual** | Apps e folhetos listam promoções genéricas; falta cruzar o **código de barras real** da compra com ocorrências recentes. |
| **Dado descartado** | A nota traz descrição, preço, loja, data e código interno — **sem EAN**; o cupom vai para a gaveta/PDF sem virar índice. |

As notas **já existem** com preço–lugar–data. O que falta é **ingerir a URL do QR**, **vincular EAN em colaboração** (a nota não traz código de barras) e servir a busca do **menor preço**.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Contribuinte** | Quem compra e guarda (ou escaneia) o cupom fiscal | Depositar a nota via QR e, quando faltar, **escanear o EAN** para vincular ao código interno da loja |
| **Comprador** | Quem quer pagar menos no próximo item | Buscar por EAN ou nome e ver o menor preço, loja e data |

## Objetivo

Ser a **fonte de busca de menor preço** alimentada por notas fiscais reais: QR → itens (cód. interno + preço) → **vínculo EAN cooperativo** → índice consultável.

## Proposta de valor

O e-notas trata a nota fiscal como **sensor coletivo de preço**: cada QR lido + vínculo EAN reforça o mapa produto → preço → estabelecimento → data.

| Necessidade | O que o e-notas faz |
|-------------|---------------------|
| Entrar a nota sem digitação | Aceitar a **URL do QR** da NFC-e / NF-e consumidor |
| Saber o que foi comprado | Extrair itens com **código interno**, descrição e preço unitário |
| Cruzar o mesmo produto entre lojas | **Vincular EAN** (scan cooperativo) a `(empresa, cód. unidade)` — a nota **não traz** código de barras |
| Saber onde e quando | Registrar **estabelecimento** e **data** da nota |
| Evitar lixo no índice | **Deduplicar** a mesma nota (chave de acesso / id da consulta) |
| Achar o barato | Buscar por EAN ou descrição e listar o **menor preço** e as ocorrências |

### Exemplos

**Contribuir** — Ana sai do mercado, escaneia o QR do cupom e cola a URL. O e-notas lê itens (cód. interno, preço, loja, data). Depois ela (ou outra pessoa) escaneia o código de barras e vincula o EAN.

**Buscar o menor** — Bruno quer o mesmo leite (EAN `789…`). A busca mostra R$ 4,29 no Mercado X (ontem) e R$ 4,89 no Mercado Y (hoje) — o menor preço em destaque.

**Sem EAN ainda** — Item só com descrição/cód. interno: entra no índice da loja; até haver vínculo EAN, a comparação cross-loja fica pela descrição (confiança menor).

## Princípios

1. **QR primeiro** — a entrada canônica é a URL do cupom, não cadastro manual de preço.
2. **EAN é a chave** — vem do **vínculo cooperativo** (não da nota); quando existe, amarra o mesmo produto entre lojas.
3. **Preço contextualizado** — todo preço carrega loja e data; número solto não basta.
4. **Nota única** — a mesma nota não reconta; deduplicação protege o índice.
5. **Menor preço explícito** — a busca responde com o mínimo observado e as demais ocorrências.
6. **Dado da nota, não inventário oficial** — o produto é o que a SEFAZ/consulta da nota devolveu, não um catálogo GS1.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Ingestão** | Receber URL do QR; validar que é URL de consulta de nota; buscar o conteúdo da consulta |
| **Extração** | Ler itens (cód. interno, descrição, quantidade, preço unitário), estabelecimento e data — **sem EAN na NFC-e** |
| **Vínculo EAN** | Cadastrar EAN por `(empresa, cód. unidade)` via scan/manual cooperativo |
| **Deduplicação** | Identificar nota já ingerida e ignorar reprocessamento |
| **Índice** | Mapear EAN (quando vinculado) e descrição → observações de preço (loja, data, valor) |
| **Busca** | Consultar por EAN ou texto; retornar menor preço e lista de ocorrências |
| **Contribuinte / comprador** | Fluxos distintos de depositar nota e de buscar preço (conta mínima se necessário) |

### Fora de escopo (v1)

- App nativo completo (câmera/SDK) além do necessário para colar/ler URL
- Pagamento, cupom de desconto ou marketplace
- Scraping ou coleta fora da URL do QR da nota
- Catálogo oficial GS1 / ANVISA / sincronização com redes varejistas
- Histórico financeiro pessoal completo (extrato de gastos do usuário)
- Moderação avançada / antifraude além de deduplicação e validação básica de URL

## Modelo conceitual

### Nota

Documento fiscal consultável pela **URL do QR**. Tem identificador de acesso, estabelecimento, data/hora e lista de itens. Unidade de ingestão.

### Item

Linha da nota: **código interno** da loja, descrição, quantidade e **preço unitário**. O **EAN/GTIN** não vem na NFC-e; entra depois via vínculo cooperativo.

### Estabelecimento

Loja/emitente da nota (nome, documento quando disponível, UF/cidade se a consulta trouxer).

### Observação de preço

Registro derivado de um item: EAN (ou chave por descrição), valor, estabelecimento, data da nota, referência à nota de origem.

### Consulta de menor preço

Busca por EAN ou texto que devolve o **menor valor** entre observações e a lista ordenada de ocorrências.

## Critérios de sucesso

- Contribuinte deposita nota **só com a URL do QR**, sem digitar itens.
- Itens com EAN entram no índice e aparecem na busca pelo código.
- Comprador vê **menor preço**, loja e data de forma clara.
- Nota reenviada **não duplica** observações.
- Itens sem EAN ainda são buscáveis por descrição, com limitação explícita de match.

## Glossário

| Termo | Significado |
|-------|-------------|
| **QR / URL do QR** | Conteúdo do QR Code impresso no cupom — URL de consulta da nota na SEFAZ (ou portal equivalente) |
| **NFC-e / NF-e consumidor** | Nota fiscal eletrônica ao consumidor cujo cupom traz o QR |
| **EAN / GTIN** | Código de barras do produto usado como chave preferencial no índice |
| **Ingestão** | Processo de ler a URL, extrair dados e gravar no índice |
| **Observação de preço** | Uma ocorrência de preço de um produto em uma loja numa data |
| **Menor preço** | Menor valor unitário observado para a chave buscada no conjunto ingerido |
| **Deduplicação** | Garantia de que a mesma nota não gera observações repetidas |

## Regras de negócio (v1)

- Só processar URL reconhecida como consulta de nota fiscal (QR); URL inválida ou fora do padrão é rejeitada.
- Quando o item tiver EAN/GTIN, ele é a **chave primária** de produto no índice.
- Sem EAN, a observação usa descrição normalizada; a busca por texto pode retornar, mas não afirma identidade de produto com a mesma força do EAN.
- Toda observação de preço exige **valor**, **estabelecimento** e **data** (da nota).
- Nota já ingerida (mesma chave de acesso / id da consulta) não gera novas observações.
- A busca por menor preço considera o conjunto de observações ingeridas; não inventa preços fora das notas.
- O e-notas não substitui a consulta oficial da SEFAZ; é índice derivado das notas depositadas.

## Próximos passos

→ [`docs/README.md`](docs/README.md) → inventário de funcionalidades (a produzir)
