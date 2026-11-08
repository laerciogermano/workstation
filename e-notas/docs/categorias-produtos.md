# Categorias canônicas de produto (notinhas)

Taxonomia comercial para `produtos_ean.categorias` e filtros do app.  
Não é classificação fiscal (NCM/CEST) nem a DAG do Open Food Facts.

## Princípio

- **2 níveis** no produto: categoria principal (obrigatória quando houver) + subcategoria opcional.
- Fonte de decisão: afinidade de uso no supermercado BR (árvore mercadológica), não layout de gôndola.
- Enrich: mapear PreçoMelhor / OFF / heurística → **uma** das categorias nível 1 abaixo; subcategoria quando houver match claro.

## Nível 1 — categorias (lista fechada)

| id | Nome |
|----|------|
| `hortifruti` | Hortifruti |
| `acougue-peixaria` | Açougue e peixaria |
| `frios-laticinios` | Frios e laticínios |
| `padaria` | Padaria |
| `mercearia` | Mercearia / alimentos básicos |
| `matinais` | Matinais |
| `doces-bomboniere` | Doces e bomboniere |
| `salgados-snacks` | Salgados e snacks |
| `congelados` | Congelados |
| `bebidas-nao-alcoolicas` | Bebidas não alcoólicas |
| `bebidas-alcoolicas` | Bebidas alcoólicas |
| `higiene-beleza` | Higiene e beleza |
| `limpeza` | Limpeza |
| `bebe` | Bebê |
| `pet` | Pet |
| `bazar` | Bazar / utilidades |
| `farmacia-suplementos` | Farmácia / suplementos |
| `outros` | Outros |

## Nível 2 — subcategorias (opcional)

### Bebidas não alcoólicas
- Refrigerantes  
- Águas  
- Sucos e refrescos  
- Energéticos e isotônicos  
- Chás e ready-to-drink  

### Bebidas alcoólicas
- Cervejas  
- Vinhos e espumantes  
- Destilados e drinks  

### Salgados e snacks
- Batatas  
- Salgadinhos  
- Pipocas  

### Doces e bomboniere
- Balas e pirulitos  
- Chocolates  
- Biscoitos doces  
- Doces em geral  

### Mercearia / alimentos básicos
- Arroz e feijão  
- Óleos e azeites  
- Massas  
- Conservas  
- Farinhas e grãos  

### Frios e laticínios
- Leites  
- Iogurtes e bebidas lácteas  
- Queijos  
- Embutidos e frios  

### Limpeza
- Roupas  
- Cozinha  
- Banheiro e casa  

### Higiene e beleza
- Cabelo  
- Corpo e banho  
- Oral  
- Desodorantes  

## Ordem de preenchimento (enrich)

1. PreçoMelhor `category_name` / `category_path` → mapear para nível 1 (+ 2 se possível)  
2. Open Food Facts `categories_tags` → mapear tags conhecidas  
3. Heurística no título (ex.: Monster → Bebidas não alcoólicas › Energéticos)  
4. Fallback → `Outros`

## O que não usar como lista do app

- Tags OFF cruas (`en:plant-based-foods-and-beverages`, …)  
- Árvore ERP 4–5 níveis completa  
- NCM/CEST como “categoria” de UI (ficam em colunas fiscais próprias)

## Referências

- Árvore mercadológica varejo BR ([InfoPrice](https://www.infoprice.co/blog/arvore-mercadologica/), [Ágil Fiscal](https://agilfiscal.com.br/solucoes/revisao-mercadologica))  
- Departamentos de supermercado (ex. [Supermercado SA](https://supermercadosa.com.br/departamentos), [CadastroProduto](https://cadastroproduto.com.br/categorias/))  
- GS1 GPC / OFF: referência de indústria, não lista de UI  

## Código

Constantes espelhadas em [`../app/categorias-produtos.js`](../app/categorias-produtos.js).

## Rollback

Remover este doc + módulo JS; categorias livres em `produtos_ean.categorias` voltam a ser texto livre do enrich.
