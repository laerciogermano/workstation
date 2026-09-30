# e-notas — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem e o time perde o norte.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) (`functionalities` → `user-stories` → `bdd` → `screens` → `screens-bdd` → `components` → `prototype`). Orienta toda a esteira; não substitui BDD nem UI.

Derivados: [`docs/`](docs/README.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

---

## Visão

O **e-notas** transforma o **QR Code da nota fiscal** (NFC-e / NF-e ao consumidor) em um **índice de preços por código de barras**: quem contribui escaneia a URL da nota; quem compra busca o produto e vê **onde está o menor preço** entre as notas já ingeridas.

## Problema

Comprar no dia a dia concentra três dores:

| Dor | O que acontece hoje |
|-----|---------------------|
| **Preço opaco** | O mesmo EAN custa valores diferentes em lojas próximas; o comprador só descobre depois de ir até o caixa. |
| **Comparação manual** | Apps e folhetos listam promoções genéricas; falta cruzar o **código de barras real** da compra com ocorrências recentes. |
| **Dado descartado** | Toda nota fiscal já traz EAN, descrição, preço, loja e data no QR — e esse dado some na gaveta ou no PDF. |

As notas **já existem** e já carregam o mapa produto–preço–lugar. O que falta é **ingerir a URL do QR**, indexar por código de barras e servir a busca do **menor preço**.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Contribuinte** | Quem compra e guarda (ou escaneia) o cupom fiscal | Depositar a nota via QR e alimentar o índice sem digitar item a item |
| **Comprador** | Quem quer pagar menos no próximo item | Buscar por EAN ou nome e ver o menor preço, loja e data |

## Objetivo

Ser a **fonte de busca de menor preço** alimentada por notas fiscais reais: QR → itens com código de barras → índice consultável.

## Proposta de valor

O e-notas trata a nota fiscal como **sensor coletivo de preço**: cada QR lido reforça o mapa EAN → preço → estabelecimento → data.

| Necessidade | O que o e-notas faz |
|-------------|---------------------|
| Entrar a nota sem digitação | Aceitar a **URL do QR** da NFC-e / NF-e consumidor |
| Saber o que foi comprado | Extrair itens com **EAN/GTIN**, descrição e preço unitário |
| Saber onde e quando | Registrar **estabelecimento** e **data** da nota |
| Evitar lixo no índice | **Deduplicar** a mesma nota (chave de acesso / id da consulta) |
| Achar o barato | Buscar por EAN ou descrição e listar o **menor preço** e as ocorrências |

### Exemplos

**Contribuir** — Ana sai do mercado, escaneia o QR do cupom e cola a URL. O e-notas lê os itens, grava cada EAN com preço, loja e data.

**Buscar o menor** — Bruno quer o mesmo leite (EAN `789…`). A busca mostra R$ 4,29 no Mercado X (ontem) e R$ 4,89 no Mercado Y (hoje) — o menor preço em destaque.

**Sem EAN** — Um item só veio com descrição interna da loja. Entra no índice pela descrição normalizada; a busca por nome ainda encontra, mas com menor confiança de match.

## Princípios

1. **QR primeiro** — a entrada canônica é a URL do cupom, não cadastro manual de preço.
2. **EAN é a chave** — quando existe código de barras, ele amarra ocorrências do mesmo produto.
3. **Preço contextualizado** — todo preço carrega loja e data; número solto não basta.
4. **Nota única** — a mesma nota não reconta; deduplicação protege o índice.
5. **Menor preço explícito** — a busca responde com o mínimo observado e as demais ocorrências.
6. **Dado da nota, não inventário oficial** — o produto é o que a SEFAZ/consulta da nota devolveu, não um catálogo GS1.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Ingestão** | Receber URL do QR; validar que é URL de consulta de nota; buscar o conteúdo da consulta |
| **Extração** | Ler itens (EAN quando houver, descrição, quantidade, preço unitário), estabelecimento e data |
| **Deduplicação** | Identificar nota já ingerida e ignorar reprocessamento |
| **Índice** | Mapear EAN (e descrição) → observações de preço (loja, data, valor) |
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

Linha da nota: **código de barras (EAN/GTIN)** quando presente, descrição, quantidade e **preço unitário**.

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
