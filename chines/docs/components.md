# Componentes por tela — Bluetti MAP

Inventário de telas e componentes de interface derivado de [`screens.md`](screens.md).

Legenda de tipos: **Filtro** · **Tabela** · **Card** · **Gráfico** · **Formulário** · **Lista** · **Indicador** · **Badge** · **Ação** · **Modal** · **Upload** · **Timeline** · **Preview** · **Seletor** · **Grade** · **Navegação**

---

## Índice

| Tela | Componentes |
|------|-------------|
| [TELA-01](#tela-01--dashboard) | 4 filtros/cards, 3 gráficos, 3 listas, navegação |
| [TELA-02](#tela-02--lista-de-produtos) | busca, filtros, tabela, ações, exportação |
| [TELA-03](#tela-03--cadastro--edição-de-produto) | 4 seções de formulário, resumo, ações |
| [TELA-04](#tela-04--importação-da-central-de-dados) | upload, preview, resumo, histórico |
| [TELA-05](#tela-05--canais-de-monitoramento) | toggles, tabela sites, indicador, ações |
| [TELA-06](#tela-06--regras-de-pma-e-exceções) | formulários regra, tabela, histórico, simulador |
| [TELA-07](#tela-07--relatórios-alertas-e-advertências) | 3 painéis config, previews, ações |
| [TELA-08](#tela-08--anúncios-coletados) | filtros, indicadores, tabela, ações, exportação |
| [TELA-09](#tela-09--detalhe-do-anúncio) | cabeçalho, 5 painéis detalhe, histórico, ações |
| [TELA-10](#tela-10--mapeamento-de-preços) | seletor, grade, listas, comparativo, exportação |
| [TELA-11](#tela-11--histórico-de-pesquisas-e-preços) | filtros, gráfico, tabela, destaques, exportação |
| [TELA-12](#tela-12--lista-de-ocorrências) | filtros, visões, tabela, ações, exportação |
| [TELA-13](#tela-13--detalhe-da-ocorrência) | resumo, fluxo, cobrança, evidências, timeline, advertência |
| [TELA-14](#tela-14--lista-de-parceiros) | filtros, indicadores, tabela, ações, exportação |
| [TELA-15](#tela-15--cadastro--edição-de-parceiro) | 4 seções formulário, resumo, ações |
| [TELA-16](#tela-16--vendedores-não-cadastrados) | filtros, tabela, destaques, ações |
| [TELA-17](#tela-17--ranking-de-conformidade) | filtros, ranking, gráficos, detalhe, exportação |
| [TELA-18](#tela-18--log-de-varreduras) | filtros, tabela, agenda, ações |
| [Transversais](#componentes-transversais) | exportação, notificações, menu, layout |

---

## TELA-01 — Dashboard

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Filtros globais | Filtro | Produto, SKU, marketplace, empresa, distribuidor, período |
| Cards de totais | Card | Produtos monitorados, anúncios, vendedores, regulares, irregulares, ocorrências abertas/resolvidas, reincidentes |
| Gráfico de evolução | Gráfico | Violações ao longo do tempo |
| Gráfico por marketplace | Gráfico | Marketplaces com mais irregularidades |
| Gráfico por produto | Gráfico | Produtos com mais violações |
| Lista de irregularidades recentes | Lista | Atalho para anúncios/ocorrências |
| Lista de prazos vencidos | Lista | Casos aguardando correção fora do prazo |
| Lista de não cadastrados | Lista | Vendedores detectados recentemente |
| Atalhos de navegação | Navegação | Produtos, Ocorrências, Mapeamento de preços, Ranking |

---

## TELA-02 — Lista de produtos

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Busca | Filtro | Por SKU, EAN ou palavra-chave |
| Filtros | Filtro | Nome, SKU, categoria, status, frequência |
| Tabela de produtos | Tabela | Nome, SKU, EAN, modelo, categoria, PMA Premium/Clássico, preço recomendado, status, frequência, data início, próxima varredura |
| Botão novo produto | Ação | Abre TELA-03 |
| Botão editar | Ação | Abre TELA-03 por linha |
| Toggle pausar/reativar | Ação | Por linha ou em lote |
| Botão importar | Ação | Abre TELA-04 |
| Botão exportar | Ação | Abre modal de exportação (US-23) |
| Links contextuais | Navegação | Anúncios e ocorrências filtrados por SKU |

---

## TELA-03 — Cadastro / edição de produto

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Seção identificação | Formulário | Nome, SKU, código interno, EAN/GTIN, modelo, categoria |
| Seção variações e busca | Formulário | Variações (127V/220V), palavras-chave |
| Seção preços | Formulário | PMA Premium, PMA Clássico, preço recomendado |
| Seção monitoramento | Formulário | Status ativo/pausado, data início, frequência (1h–diária) |
| Painel resumo | Indicador | Anúncios coletados, ocorrências abertas, última varredura (somente edição) |
| Botões salvar / cancelar | Ação | Persiste ou descarta alterações |
| Validação inline | Indicador | Campos obrigatórios SKU e PMA |
| Links relacionados | Navegação | Anúncios e histórico do SKU |

---

## TELA-04 — Importação da central de dados

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Área de upload | Upload | Seleção da planilha EQP |
| Pré-visualização | Tabela | Amostra: SKU, voltagem, PMA Premium, PMA Clássico |
| Resumo pós-importação | Indicador | Criados, atualizados, ignorados, erros por linha |
| Histórico de importações | Tabela | Data, usuário, arquivo, resultado |
| Botão validar / confirmar | Ação | Processa importação |
| Link modelo de planilha | Ação | Download de layout esperado |

---

## TELA-05 — Canais de monitoramento

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Lista de marketplaces | Formulário | Toggle ativo/inativo por canal (ML, Amazon, Shopee, Magalu, etc.) |
| Tabela de sites próprios | Tabela | Nome, URL, status, parceiro associado |
| Indicador de canais ativos | Indicador | Total habilitado; aviso se zero |
| Botão adicionar site | Ação | Novo URL customizado |
| Botões editar / remover site | Ação | Manutenção de sites próprios |
| Botão salvar | Ação | Persiste configuração |

---

## TELA-06 — Regras de PMA e exceções

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Painel regras por canal | Formulário | ML Premium/Clássico, Shopee −8%, Magalu Clássico, parcelamento |
| Formulário PMA por escopo | Formulário | Produto, SKU, categoria, período de vigência |
| Formulário de exceções | Formulário | Campanha, cliente autorizado, intervalo de validade |
| Tabela de regras ativas | Tabela | Filtros por produto, canal, tipo |
| Histórico de regras | Tabela | Versões anteriores com data efetiva |
| Simulador de PMA | Formulário | Produto + canal + modalidade → PMA aplicável |
| Botões criar / editar / encerrar | Ação | CRUD de regras e exceções |

---

## TELA-07 — Relatórios, alertas e advertências

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Painel relatório periódico | Formulário | Intervalo (5h padrão), destinatários, formato, horários |
| Painel alertas imediatos | Formulário | Canais e-mail (v1); WhatsApp/Telegram/Teams/CRM desabilitados |
| Painel advertência automática | Formulário | Template, prazo padrão, remetente, critérios de disparo |
| Preview de e-mail | Preview | Relatório, alerta e advertência |
| Botão salvar configurações | Ação | Persiste preferências |
| Botão enviar teste | Ação | Dispara e-mail de teste |
| Toggles ativar/desativar | Ação | Por tipo de envio automático |

---

## TELA-08 — Anúncios coletados

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Filtros | Filtro | Produto, SKU, marketplace, classificação, status anúncio, match, parceiro, período |
| Indicadores | Indicador | Total coletado, confirmados, descartados, irregulares |
| Tabela de anúncios | Tabela | Thumbnail, produto/SKU, título, vendedor, empresa, marketplace, modalidade, preços, frete, parcelas, PMA, diferença, classificação, status, parceiro/canal paralelo, data coleta |
| Botão confirmar match | Ação | Validação manual (US-08) |
| Botão descartar match | Ação | Rejeita falso positivo |
| Botão exportar | Ação | Modal exportação (US-23) |
| Link externo | Ação | Abre URL no marketplace |
| Link detalhe | Navegação | Abre TELA-09 |

---

## TELA-09 — Detalhe do anúncio

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Cabeçalho | Indicador | Título, marketplace, URL, status, data/hora coleta |
| Imagem ampliada | Preview | Foto do anúncio |
| Painel vendedor | Formulário | Nome, empresa, CNPJ, parceiro ou badge não cadastrado |
| Painel produto associado | Formulário | SKU, EAN, modelo, score match, motivo descarte |
| Painel preços | Indicador | Anunciado, promocional, frete, parcelas, preço efetivo |
| Painel comparação PMA | Indicador | PMA base, regra canal/modalidade, PMA final, diferença, classificação |
| Histórico do anúncio | Tabela | Coletas anteriores, evolução preço e status |
| Botões confirmar/rejeitar match | Ação | Validação manual |
| Botão registrar ocorrência | Ação | Cria violação se irregular |
| Links parceiro / ocorrência | Navegação | TELA-15, TELA-13 |

---

## TELA-10 — Mapeamento de preços

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Seletor produto/SKU | Seletor | Busca e seleção de SKU |
| Filtro marketplace | Filtro | Recorte por canal |
| Grade por marketplace | Grade | Menor preço, médio, qtd anúncios, vendedor destaque |
| Lista anúncios regulares | Lista | Ofertas dentro do PMA |
| Lista anúncios irregulares | Lista | Ofertas abaixo do PMA |
| Comparativo visual | Gráfico | PMA vs menor preço vs preço recomendado |
| Indicador atualização | Indicador | Última coleta por canal |
| Botão exportar | Ação | Exportação do mapeamento (US-23) |
| Link detalhe anúncio | Navegação | Abre TELA-09 |

---

## TELA-11 — Histórico de pesquisas e preços

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Filtros | Filtro | Empresa/parceiro, produto/SKU, marketplace, período, classificação |
| Seletor granularidade | Filtro | Dia, semana, mês |
| Gráfico de linha | Gráfico | Preço mínimo, médio e PMA no período |
| Tabela histórica | Tabela | Data coleta, anúncio, preço, PMA, classificação, vendedor |
| Destaques | Lista | Reincidências; quedas abruptas de preço |
| Botão exportar | Ação | Exportação do histórico (US-23) |
| Links anúncio/ocorrência | Navegação | TELA-09, TELA-13 |

---

## TELA-12 — Lista de ocorrências

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Filtros | Filtro | Produto, SKU, empresa, CNPJ, marketplace, status, tipo, responsável, período |
| Visões salvas | Filtro | Abertas, aguardando correção, vencidas, reincidentes |
| Tabela de ocorrências | Tabela | Número, produto, SKU, PMA, preço, diferença %, marketplace, vendedor, parceiro, status fluxo, responsável, prazo, data, alertas |
| Botão atribuir responsável | Ação | Por linha ou lote |
| Botão advertência em lote | Ação | Disparo quando elegível |
| Botão exportar | Ação | Modal exportação (US-23) |
| Link detalhe | Navegação | Abre TELA-13 |

---

## TELA-13 — Detalhe da ocorrência

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Resumo da violação | Indicador | Produto, SKU, PMA, preço, diferença, marketplace, link, vendedor, parceiro |
| Stepper / fluxo de status | Formulário | Identificada → Enviada → Aguardando → Corrigida / Reincidente |
| Formulário de cobrança | Formulário | Responsável, observações, prazo, data correção, nº ocorrência |
| Galeria de evidências | Preview | Screenshots por coleta; URL, preço, data, produto, vendedor |
| Linha do tempo | Timeline | Identificação, advertências, status, coletas, correção |
| Painel advertência | Preview | Preview e-mail; histórico envios; comprovante |
| Badges de alerta | Badge | Prazo vencido; reincidência |
| Botões status / advertência | Ação | Alterar status, enviar/reenviar, anexar evidência |
| Links anúncio / parceiro | Navegação | TELA-09, TELA-15 |

---

## TELA-14 — Lista de parceiros

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Filtros | Filtro | Nome, CNPJ, distribuidor, marketplace, status |
| Indicadores | Indicador | Ativos, inativos, com ocorrências abertas |
| Tabela de parceiros | Tabela | Razão social, fantasia, CNPJ, contatos, distribuidor, marketplaces, status, ocorrências abertas, conformidade |
| Botão novo parceiro | Ação | Abre TELA-15 |
| Botão editar | Ação | Abre TELA-15 |
| Links ocorrências/anúncios | Navegação | Listas filtradas do parceiro |
| Botão exportar | Ação | Modal exportação (US-23) |

---

## TELA-15 — Cadastro / edição de parceiro

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Seção dados cadastrais | Formulário | Razão social, fantasia, CNPJ, e-mail, telefone |
| Seção relacionamento | Formulário | Distribuidor responsável, status |
| Seção canais | Formulário | Marketplaces utilizados |
| Seção portfólio | Formulário | Produtos/SKUs comercializados |
| Painel resumo | Indicador | Ocorrências, anúncios, advertências (edição) |
| Botões salvar / cancelar | Ação | Persiste ou descarta |
| Validação CNPJ | Indicador | Duplicidade e formato |
| Botão inativar | Ação | Altera status do parceiro |

---

## TELA-16 — Vendedores não cadastrados

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Filtros | Filtro | Marketplace, produto, período, com/sem irregularidade |
| Tabela de vendedores | Tabela | Vendedor, empresa, CNPJ, marketplace, produtos, qtd anúncios, irregularidades, 1ª/última detecção |
| Destaque visual | Badge | Recorrentes; múltiplos SKUs Bluetti |
| Botão cadastrar parceiro | Ação | Abre TELA-15 pré-preenchida |
| Botão vincular existente | Ação | Associa a parceiro da base |
| Botão ignorar / analisado | Ação | Marca tratamento |
| Link anúncios | Navegação | TELA-08 filtrada |

---

## TELA-17 — Ranking de conformidade

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Filtros | Filtro | Distribuidor, período, marketplace, produto |
| Tabela ranking | Tabela | Revendedor, distribuidor, anúncios, irregularidades, taxa conformidade, reincidências, última violação |
| Gráfico top violadores | Gráfico | Maiores infratores no período |
| Gráfico evolução | Gráfico | Conformidade por distribuidor |
| Detalhe expandível | Lista | Ocorrências do revendedor no período |
| Botão exportar | Ação | Exportação do ranking (US-23) |
| Links parceiro/ocorrências | Navegação | TELA-15, TELA-12 |

---

## TELA-18 — Log de varreduras

| Componente | Tipo | Descrição |
|------------|------|-----------|
| Filtros | Filtro | Período, produto, canal, status |
| Tabela de execuções | Tabela | Data/hora, SKU, canais, duração, anúncios novos/atualizados, status, erro por canal |
| Agenda de varreduras | Lista | Próximas execuções por produto e frequência |
| Botão reprocessar | Ação | Varredura manual por produto/canal |
| Link anúncios | Navegação | TELA-08 com resultados |
| Link pausar produto | Navegação | TELA-03 |

---

## Componentes transversais

### Layout global

| Componente | Tipo | Telas |
|------------|------|-------|
| Menu principal | Navegação | Todas |
| Breadcrumb | Navegação | Telas internas |
| Cabeçalho com persona/logout | Navegação | Todas |

### Exportação (US-23)

| Componente | Tipo | Telas |
|------------|------|-------|
| Botão exportar | Ação | TELA-02, 08, 10, 11, 12, 14, 17 |
| Modal / drawer de exportação | Modal | Herda filtros da tela atual |
| Seletor de formato | Formulário | Excel, CSV, PDF |
| Barra de progresso | Indicador | Durante geração do arquivo |
| Link de download | Ação | Ao concluir exportação |

### Notificações in-app (US-12, US-13, US-20)

| Componente | Tipo | Telas |
|------------|------|-------|
| Badge no menu | Badge | Layout global |
| Centro de notificações | Lista | Ocorrências novas, prazos vencidos, falhas varredura |
| Link contextual | Navegação | TELA-13, TELA-18 |

### Componentes reutilizados

| Componente | Tipo | Onde aparece |
|------------|------|--------------|
| Filtro por período | Filtro | Dashboard, anúncios, histórico, ocorrências, ranking, log |
| Filtro por marketplace | Filtro | Dashboard, anúncios, mapeamento, histórico, ocorrências, ranking |
| Filtro por produto/SKU | Filtro | Dashboard, produtos, anúncios, mapeamento, histórico, ocorrências |
| Tabela paginada | Tabela | Listas (produtos, anúncios, ocorrências, parceiros, log, etc.) |
| Badge de status | Badge | Anúncios, ocorrências, parceiros, match |
| Badge canal paralelo | Badge | Anúncios, vendedores não cadastrados |
| Modal de confirmação | Modal | Ações destrutivas e envio em lote |
| Empty state | Indicador | Listas sem resultados |
| Toast / snackbar | Indicador | Feedback de salvar, exportar, erro |

## Próximos passos

→ [`prototype.html`](prototype.html)
