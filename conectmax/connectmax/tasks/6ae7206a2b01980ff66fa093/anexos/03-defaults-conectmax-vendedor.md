# Defaults — perfil vendedor ConectMax no LinkedIn

Insumo para configurar as contas. Ajustar nome/cidade/e-mail por persona; manter a estrutura.

**Cargo sugerido (atual):** Especialista em suprimentos e itens corporativos  
**Empresa:** ConectMax

---

## Must — textos-modelo

### Headline (escolher 1 e personalizar)

```text
Ajudo empresas a comprar suprimentos corporativos com menos fricção e melhor prazo | ConectMax
```

```text
Suprimentos e itens corporativos para times de compras e facilities | ConectMax
```

```text
Do material do dia a dia à tecnologia — ajudo compradores a simplificar o processo de compras | ConectMax
```

### Sobre (modelo A — hook + prova + CTA)

```text
Comprar para a empresa não deveria ser lento nem opaco.

Trabalho com times de compras, facilities e administrative que precisam de materiais do dia a dia até itens de tecnologia — com prazo claro e menos idas e vindas.

Na ConectMax, ajudo a empresa a encontrar o que precisa num processo mais simples: variedade ampla, orientação no que faz sentido para o uso, e acompanhamento até a entrega.

Se você está revisando fornecedores ou montando um pedido, me chama no LinkedIn — respondo e te ajudo a destravar o próximo passo.
```

### Sobre (modelo B — mais curto, ≤ ~600 chars)

```text
Ajudo empresas a descomplicar a compra de suprimentos corporativos — do básico do dia a dia aos itens de tecnologia.

Na ConectMax, o foco é processo mais simples: entender a necessidade, indicar o caminho certo e acompanhar até chegar.

Me manda mensagem com o que você precisa comprar ou revisar — a gente conversa sem enrolação.
```

### Experiência atual — descrição

**Título:** Especialista em suprimentos e itens corporativos  
**Empresa:** ConectMax  

```text
Ajudo empresas a estruturar e executar compras de suprimentos corporativos com mais clareza e menos fricção.

• Atendo demandas de materiais de uso contínuo até itens de tecnologia
• Oriento o comprador no que faz sentido para o uso e o prazo
• Acompanho o pedido do alinhamento inicial à entrega
• Trabalho próximo a compras, facilities e áreas administrativas
```

### Contato

- E-mail: `nome.sobrenome@…` (domínio da operação da persona)  
- Não marcar “Open to work”  
- URL: `linkedin.com/in/nome-sobrenome` (criar na hora do setup)

### Localização

Usar a praça comercial real da operação (ex.: cidade da unidade / região atendida). Evitar “Brasil” genérico se houver praça definida.

---

## Should — defaults de setup

### Banner

- Asset de marca ConectMax (já existe base em screen-robot `assets/banners/`)  
- Ideal v2: claim + escopo legível em mobile (“Suprimentos corporativos · do básico à tecnologia”)  
- Tamanho: 1584×396

### Foto

- Headshot realista por persona (rosto ~60%, fundo neutro)  
- Evitar a mesma foto em várias contas (risco de restrição / padrão fake)

### Featured (quando houver asset)

1. PDF apresentação da empresa (card Trello de apresentação / identidade)  
2. One-pager de categorias / como comprar  
3. Post ou print de prova social (quando existir)

### Skills (top 5 sugeridas)

1. Vendas B2B  
2. Prospecção comercial  
3. Relacionamento com clientes  
4. Negociação  
5. Suprimentos corporativos / Compras (o termo que o ICP busca)

Complementares: Atendimento a empresas, Facilities, Gestão de pedidos.

### Atividade mínima pós-criação

- Seguir página ConectMax (se houver)  
- 1 comentário útil ou 1 post leve na 1ª semana (evita perfil “fantasma”)  
- Não bombardear conexão no dia 0 sem perfil mínimo preenchido

---

## Nice — depois do must/should

- 3 recomendações (colegas primeiro; clientes quando houver)  
- Mídia na experiência (PDF institucional)  
- Refresh trimestral: headline, Featured, 1 exemplo no Sobre

---

## Mapeamento → automação atual (screen-robot / CDP)

| Campo LI | Default atual | Ação sugerida |
|----------|---------------|---------------|
| company | ConectMax | manter |
| jobTitle | Especialista em suprimentos… | manter + enriquecer descrição |
| avatar | `conectmax-black.jpg` | trocar por headshot por persona |
| banner | `conectmax-banner.jpg` | manter v1; evoluir claim no visual |
| about | texto institucional curto | substituir por modelo A ou B acima |
| headline | (não no JSON) | **incluir** no setup (must) |
| featured / skills / URL | — | checklist manual ou cards seguintes |

Rollback do About/avatar/banner: reaplicar assets/JSON anteriores do screen-robot (`profile-defaults.json` / scripts CDP `linkedin-setup-about` / `update-avatar` / `update-banner`).
