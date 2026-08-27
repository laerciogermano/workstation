# Telas do sistema — Bluetti MAP

Descrição funcional das telas derivadas das histórias em [`user-stories.md`](user-stories.md) e cenários em [`bdd.md`](bdd.md). Componentes: [`components.md`](components.md).

Personas principais: **analista comercial**, **gestor comercial**.

---

## Mapa de navegação

```
Dashboard
├── Produtos
│   ├── Lista de produtos
│   ├── Cadastro / edição de produto
│   └── Importação da central de dados
├── Monitoramento
│   ├── Anúncios coletados
│   ├── Detalhe do anúncio
│   ├── Mapeamento de preços (visão consolidada)
│   ├── Histórico de pesquisas
│   └── Log de varreduras
├── Fiscalização
│   ├── Ocorrências
│   ├── Detalhe da ocorrência
│   └── Vendedores não cadastrados
├── Parceiros
│   ├── Lista de parceiros
│   └── Cadastro / edição de parceiro
├── Relatórios
│   └── Ranking de conformidade
└── Configurações
    ├── Canais de monitoramento
    ├── Regras de PMA e exceções
    └── Relatórios, alertas e advertências
```

**Componente transversal:** exportação (Excel, CSV, PDF) disponível nas listas de anúncios, ocorrências, histórico e ranking — US-23.

---

## Índice — telas e histórias

| Tela | Histórias contempladas |
|------|------------------------|
| TELA-01 — Dashboard | US-14 |
| TELA-02 — Lista de produtos | US-01, US-05, US-23 |
| TELA-03 — Cadastro / edição de produto | US-01, US-05 |
| TELA-04 — Importação da central de dados | US-02 |
| TELA-05 — Canais de monitoramento | US-03 |
| TELA-06 — Regras de PMA e exceções | US-06, US-19 |
| TELA-07 — Relatórios, alertas e advertências | US-12, US-13, US-21 |
| TELA-08 — Anúncios coletados | US-04, US-07, US-08, US-09, US-11, US-23 |
| TELA-09 — Detalhe do anúncio | US-06, US-07, US-08, US-09, US-11 |
| TELA-10 — Mapeamento de preços | US-09, US-15, US-23 |
| TELA-11 — Histórico de pesquisas e preços | US-16, US-23 |
| TELA-12 — Lista de ocorrências | US-10, US-11, US-20, US-23 |
| TELA-13 — Detalhe da ocorrência | US-10, US-17, US-20, US-21 |
| TELA-14 — Lista de parceiros | US-11, US-18, US-23 |
| TELA-15 — Cadastro / edição de parceiro | US-18 |
| TELA-16 — Vendedores não cadastrados | US-11 |
| TELA-17 — Ranking de conformidade | US-22, US-23 |
| TELA-18 — Log de varreduras | US-04, US-05 |
| Exportação (transversal) | US-23 |
| Notificações in-app (transversal) | US-12, US-13, US-20 |

---

## TELA-01 — Dashboard

- **Personas:** Gestor comercial, analista comercial
- **Objetivo:** Visão geral do monitoramento e das violações em andamento.

### Conteúdo

- **Cards de totais:** produtos monitorados, anúncios encontrados, vendedores distintos, anúncios regulares, anúncios irregulares, ocorrências abertas, ocorrências resolvidas, empresas reincidentes.
- **Gráficos:** evolução de violações ao longo do tempo; marketplaces com mais irregularidades; produtos com mais violações.
- **Listas rápidas:** últimas irregularidades; casos com prazo de correção vencido; vendedores não cadastrados recentes.
- **Filtros globais:** produto, SKU, marketplace, empresa, distribuidor, período.

### Ações

- Aplicar filtros e atualizar indicadores.
- Clicar em card ou item de lista para ir à tela correspondente (anúncio, ocorrência, parceiro).

### Navegação

- Ponto de entrada após login.
- Atalhos para Produtos, Ocorrências, Mapeamento de preços e Ranking.

---

## TELA-02 — Lista de produtos

- **Personas:** Analista comercial, gestor comercial
- **Objetivo:** Consultar e gerenciar a base de produtos monitorados.

### Conteúdo

- **Tabela:** nome, SKU, EAN, modelo, categoria, PMA Premium, PMA Clássico, preço recomendado, status do monitoramento (ativo / pausado), frequência, data de início, próxima varredura prevista.
- **Filtros:** nome, SKU, categoria, status, frequência.
- **Busca** por SKU, EAN ou palavra-chave.

### Ações

- Novo produto → TELA-03.
- Editar produto → TELA-03.
- Pausar / reativar monitoramento em lote ou por linha — US-05.
- Importar planilha → TELA-04.
- Exportar lista filtrada — US-23.

### Navegação

- Menu **Produtos**.
- Links para anúncios e ocorrências filtrados por SKU.

---

## TELA-03 — Cadastro / edição de produto

- **Personas:** Analista comercial
- **Objetivo:** Cadastrar ou atualizar um produto e sua configuração de monitoramento.

### Conteúdo

- **Identificação:** nome, SKU, código interno, EAN/GTIN, modelo, categoria.
- **Variações e busca:** variações (ex.: 127V / 220V), palavras-chave relacionadas.
- **Preços:** PMA Premium, PMA Clássico, preço recomendado (opcional).
- **Monitoramento:** status (ativo / pausado), data de início, frequência (1h, 3h, 6h, 12h, diária) — US-05.
- **Resumo read-only (edição):** total de anúncios coletados, ocorrências abertas, última varredura.

### Ações

- Salvar / cancelar.
- Validação de campos obrigatórios (SKU, PMA).
- Pausar ou reativar monitoramento.

### Navegação

- Acessada a partir da TELA-02.
- Link para anúncios e histórico do SKU.

---

## TELA-04 — Importação da central de dados

- **Personas:** Analista comercial
- **Objetivo:** Importar ou reimportar a planilha de SKUs, voltagens e PMAs Premium/Clássico.

### Conteúdo

- **Upload:** seleção do arquivo (planilha EQP).
- **Pré-visualização:** amostra das linhas mapeadas (SKU, voltagem, PMA Premium, PMA Clássico).
- **Resumo pós-importação:** registros criados, atualizados, ignorados e erros por linha.
- **Histórico de importações:** data, usuário, arquivo, resultado.

### Ações

- Enviar arquivo, validar layout, confirmar importação.
- Baixar modelo ou instruções de colunas esperadas.
- Corrigir erros e reimportar.

### Navegação

- Acessada a partir da TELA-02 (botão **Importar**).

---

## TELA-05 — Canais de monitoramento

- **Personas:** Gestor comercial
- **Objetivo:** Definir onde o sistema deve pesquisar anúncios.

### Conteúdo

- **Marketplaces suportados:** Mercado Livre, Amazon, Shopee, Magalu, Carrefour, Casas Bahia/Via, KaBuM, AliExpress, Google Shopping e demais listados no descritivo — toggle ativo/inativo por canal.
- **Sites próprios:** lista de URLs customizadas de revendedores com nome, URL, status e parceiro associado (opcional).
- **Indicador:** quantidade de canais ativos; aviso se nenhum canal estiver habilitado.

### Ações

- Ativar / desativar marketplace.
- Adicionar, editar ou remover URL de site próprio.
- Salvar configuração.

### Navegação

- Menu **Configurações → Canais**.

---

## TELA-06 — Regras de PMA e exceções

- **Personas:** Gestor comercial, analista comercial
- **Objetivo:** Configurar PMA por contexto e exceções que evitem falsas irregularidades.

### Conteúdo

- **Regras por canal e modalidade:** Mercado Livre Premium/Clássico; Shopee (−8%); Magalu Clássico; efeito do parcelamento por canal — US-06.
- **PMA por escopo:** produto, SKU, categoria, período de vigência.
- **Exceções:** campanhas promocionais autorizadas; clientes/parceiros com tolerância específica; intervalo de validade.
- **Histórico de regras:** versões anteriores de PMA e exceções com data efetiva.
- **Tabela de regras ativas** com filtros por produto, canal, tipo.

### Ações

- Criar, editar ou encerrar regra/exceção.
- Consultar qual PMA vigorava em uma data passada.
- Simular PMA aplicável para produto + canal + modalidade.

### Navegação

- Menu **Configurações → Regras de PMA**.

---

## TELA-07 — Relatórios, alertas e advertências

- **Personas:** Gestor comercial, analista comercial
- **Objetivo:** Configurar envios automáticos de relatório, alertas e advertências.

### Conteúdo

- **Relatório periódico:** intervalo padrão (5 horas), destinatários, formato (e-mail HTML, anexo Excel/PDF), horários de envio — US-12.
- **Alertas imediatos:** canais habilitados (e-mail na v1); canais futuros (WhatsApp, Telegram, Teams, CRM) exibidos como indisponíveis — US-13.
- **Advertência automática:** template da comunicação, prazo padrão de correção, remetente, critérios de disparo automático — US-21.
- **Pré-visualização** do e-mail de relatório, alerta e advertência.

### Ações

- Salvar configurações.
- Enviar teste para destinatário.
- Ativar / desativar relatório, alerta ou advertência automática.

### Navegação

- Menu **Configurações → Relatórios e alertas**.

---

## TELA-08 — Anúncios coletados

- **Personas:** Analista comercial
- **Objetivo:** Listar e filtrar todos os anúncios encontrados na varredura.

### Conteúdo

- **Tabela:** imagem (thumbnail), produto/SKU associado, título do anúncio, vendedor, empresa, marketplace, modalidade (Premium/Clássico etc.), preço, preço promocional, frete, parcelas, PMA aplicado, diferença absoluta e percentual, classificação (regular / irregular / pendente validação / descartado), status do anúncio (ativo / pausado / encerrado), parceiro vinculado ou sinalização de canal paralelo, data/hora da coleta.
- **Filtros:** produto, SKU, marketplace, classificação, status do anúncio, status de match, parceiro, período.
- **Indicadores:** total coletado, confirmados, descartados, irregulares.

### Ações

- Abrir detalhe → TELA-09.
- Confirmar ou descartar match manualmente — US-08.
- Exportar lista filtrada — US-23.
- Abrir URL do anúncio no marketplace.

### Navegação

- Menu **Monitoramento → Anúncios**.
- Atalhos a partir do Dashboard e do Mapeamento de preços.

---

## TELA-09 — Detalhe do anúncio

- **Personas:** Analista comercial
- **Objetivo:** Inspecionar um anúncio coletado e entender a classificação de PMA.

### Conteúdo

- **Cabeçalho:** título, marketplace, URL, status do anúncio, data/hora da coleta, imagem ampliada.
- **Vendedor:** nome, empresa, CNPJ (quando disponível), parceiro vinculado ou badge **não cadastrado** — US-11.
- **Produto associado:** SKU, EAN, modelo, score de match, motivo de descarte (acessório, usado, kit, similar) — US-08.
- **Preços:** preço anunciado, promocional, frete, parcelas, preço efetivo considerado.
- **Comparação PMA:** PMA base, regra de canal/modalidade aplicada (Premium, Clássico, Shopee −8%, parcelamento), PMA final, diferença absoluta e percentual, classificação — US-06, US-09.
- **Histórico do anúncio:** coletas anteriores com evolução de preço e status.

### Ações

- Confirmar ou rejeitar match.
- Registrar ocorrência manualmente (se irregular e ainda não registrada).
- Ir para parceiro vinculado ou cadastrar novo parceiro.
- Abrir ocorrência associada, se existir.

### Navegação

- Acessada a partir da TELA-08, TELA-10, TELA-12 ou Dashboard.

---

## TELA-10 — Mapeamento de preços (visão consolidada)

- **Personas:** Analista comercial, gestor comercial
- **Objetivo:** Visão tipo Buscapé/Promo dos preços praticados por SKU no mercado.

### Conteúdo

- **Seletor de produto/SKU** com busca.
- **Grade por marketplace:** menor preço, preço médio, quantidade de anúncios, destaque do vendedor com menor preço.
- **Listas:** anúncios regulares e irregulares do SKU selecionado.
- **Comparativo visual:** PMA vs menor preço encontrado vs preço recomendado.
- **Atualização:** data/hora da última coleta por canal.

### Ações

- Trocar SKU/produto.
- Filtrar por marketplace.
- Abrir detalhe do anúncio → TELA-09.
- Exportar mapeamento do SKU — US-23.

### Navegação

- Menu **Monitoramento → Mapeamento de preços**.
- Link a partir da TELA-02 (por SKU) e do Dashboard.

---

## TELA-11 — Histórico de pesquisas e preços

- **Personas:** Analista comercial, gestor comercial
- **Objetivo:** Analisar tendências, reincidência e evolução de preços no tempo.

### Conteúdo

- **Filtros:** empresa/parceiro, produto/SKU, marketplace, período, classificação.
- **Gráfico de linha:** evolução de preço mínimo, médio e PMA no período.
- **Tabela histórica:** data da coleta, anúncio, preço, PMA aplicado, classificação, vendedor.
- **Destaques:** reincidências do mesmo vendedor; quedas abruptas de preço.

### Ações

- Aplicar filtros e alternar granularidade (dia, semana, mês).
- Abrir anúncio ou ocorrência relacionada.
- Exportar histórico filtrado — US-23.

### Navegação

- Menu **Monitoramento → Histórico**.
- Links a partir de TELA-03, TELA-09, TELA-13 e TELA-15.

---

## TELA-12 — Lista de ocorrências

- **Personas:** Analista comercial, gestor comercial
- **Objetivo:** Acompanhar todas as violações de MAP identificadas.

### Conteúdo

- **Tabela:** número da ocorrência, produto, SKU, PMA, preço encontrado, diferença (%), marketplace, vendedor/empresa, parceiro vinculado, status do fluxo (Identificada → Enviada → Aguardando correção → Corrigida / Reincidente), responsável, prazo, data de identificação, alertas (prazo vencido, reincidente).
- **Filtros:** produto, SKU, empresa, CNPJ, marketplace, status, tipo, responsável, período.
- **Visões salvas:** abertas, aguardando correção, vencidas, reincidentes.

### Ações

- Abrir detalhe → TELA-13.
- Atribuir responsável.
- Exportar ocorrências filtradas — US-23.
- Iniciar advertência em lote (quando elegível).

### Navegação

- Menu **Fiscalização → Ocorrências**.
- Atalhos a partir do Dashboard e de anúncios irregulares.

---

## TELA-13 — Detalhe da ocorrência

- **Personas:** Analista comercial, gestor comercial
- **Objetivo:** Conduzir a cobrança/advertência com trilha auditável.

### Conteúdo

- **Resumo da violação:** produto, SKU, PMA aplicado, preço, diferença, marketplace, link do anúncio, vendedor, parceiro.
- **Fluxo de status:** Identificada → Enviada → Aguardando correção → Corrigida / Reincidente — US-20.
- **Cobrança:** responsável, observações, prazo para correção, data da correção, número da ocorrência.
- **Evidências:** screenshots, URL, preço, data/hora, produto e vendedor por coleta — US-17.
- **Linha do tempo:** identificação, advertências, alterações de status, novas coletas, correção ou reincidência.
- **Advertência:** preview do e-mail, histórico de envios automáticos ou manuais, comprovante — US-21.
- **Alertas visuais:** prazo vencido; nova violação após correção.

### Ações

- Alterar status e registrar observação.
- Enviar ou reenviar advertência (manual ou automática).
- Anexar evidência manual.
- Marcar como corrigida ou reincidente.
- Abrir anúncio → TELA-09; abrir parceiro → TELA-15.

### Navegação

- Acessada a partir da TELA-12, TELA-09 ou alertas/e-mail.

---

## TELA-14 — Lista de parceiros

- **Personas:** Analista comercial
- **Objetivo:** Manter a base oficial de revendedores e parceiros.

### Conteúdo

- **Tabela:** razão social, nome fantasia, CNPJ, e-mail, telefone, distribuidor responsável, marketplaces, status (ativo / inativo), quantidade de ocorrências abertas, índice de conformidade recente.
- **Filtros:** nome, CNPJ, distribuidor, marketplace, status.
- **Indicadores:** parceiros ativos, inativos, com ocorrências abertas.

### Ações

- Novo parceiro → TELA-15.
- Editar parceiro → TELA-15.
- Ver ocorrências e anúncios do parceiro.
- Exportar base filtrada — US-23.

### Navegação

- Menu **Parceiros**.

---

## TELA-15 — Cadastro / edição de parceiro

- **Personas:** Analista comercial
- **Objetivo:** Cadastrar ou atualizar dados de revendedor/parceiro.

### Conteúdo

- **Dados cadastrais:** razão social, nome fantasia, CNPJ, e-mail, telefone.
- **Relacionamento comercial:** distribuidor responsável, status do parceiro.
- **Canais:** marketplaces utilizados.
- **Portfólio:** produtos/SKUs comercializados.
- **Resumo (edição):** ocorrências recentes, anúncios coletados, histórico de advertências.

### Ações

- Salvar / cancelar.
- Validar CNPJ e evitar duplicidade.
- Inativar parceiro.

### Navegação

- Acessada a partir da TELA-14 ou ao vincular vendedor não cadastrado.

---

## TELA-16 — Vendedores não cadastrados

- **Personas:** Analista comercial, gestor comercial
- **Objetivo:** Analisar possível canal paralelo ou distribuição não autorizada.

### Conteúdo

- **Tabela:** vendedor, empresa, CNPJ (se coletado), marketplace, produtos anunciados, quantidade de anúncios, irregularidades, primeira e última detecção.
- **Filtros:** marketplace, produto, período, com/sem irregularidade.
- **Destaque visual** para vendedores recorrentes ou com múltiplos SKUs Bluetti.

### Ações

- Cadastrar como parceiro → TELA-15 (pré-preenchido).
- Vincular a parceiro existente.
- Abrir anúncios do vendedor → TELA-08 filtrada.
- Ignorar ou marcar como analisado.

### Navegação

- Menu **Fiscalização → Não cadastrados**.
- Atalho no Dashboard.

---

## TELA-17 — Ranking de conformidade

- **Personas:** Gestor comercial
- **Objetivo:** Comparar revendedores por distribuidor e identificar os mais conformes ou reincidentes.

### Conteúdo

- **Filtros:** distribuidor, período, marketplace, produto.
- **Ranking:** revendedor, distribuidor, total de anúncios, irregularidades, taxa de conformidade, reincidências, última violação.
- **Gráficos:** top violadores; evolução de conformidade por distribuidor.
- **Detalhe expandível:** ocorrências do revendedor no período.

### Ações

- Ordenar por conformidade, violações ou reincidência.
- Abrir parceiro → TELA-15.
- Abrir ocorrências → TELA-12 filtrada.
- Exportar ranking — US-23.

### Navegação

- Menu **Relatórios → Ranking de conformidade**.
- Link a partir do Dashboard.

---

## TELA-18 — Log de varreduras

- **Personas:** Analista comercial, gestor comercial
- **Objetivo:** Auditar execuções automáticas de pesquisa e falhas por canal.

### Conteúdo

- **Tabela:** data/hora, produto/SKU, canais pesquisados, duração, anúncios encontrados, novos vs atualizados, status (sucesso / parcial / falha), mensagem de erro por canal.
- **Filtros:** período, produto, canal, status.
- **Agenda:** próximas varreduras por produto conforme frequência — US-05.

### Ações

- Reprocessar varredura manual para produto ou canal com falha.
- Abrir anúncios resultantes → TELA-08.
- Pausar monitoramento do produto → TELA-03.

### Navegação

- Menu **Monitoramento → Log de varreduras**.
- Link a partir de alertas de falha de coleta.

---

## Componentes transversais

### Exportação

Disponível nas telas de lista (TELA-02, TELA-08, TELA-10, TELA-11, TELA-12, TELA-14, TELA-17):

- **Modal ou drawer** com filtros ativos herdados da tela.
- **Formatos:** Excel, CSV, PDF.
- **Feedback:** progresso e download ao concluir.

### Notificações in-app

- Badge no menu para ocorrências novas, prazos vencidos e falhas de varredura.
- Centro de notificações com link direto para TELA-13 ou TELA-18.

