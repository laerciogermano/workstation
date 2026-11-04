# Notinhas Beta — Diagramas de sequência, estados e navegação

Todos os diagramas utilizam sintaxe **Mermaid** compatível com renderização nativa no GitHub, Cursor e visualizadores Markdown. Eles modelam a arquitetura de processamento assíncrono, a máquina de estados das notas fiscais e do usuário, e o mapa de transição das telas do app.

---

## 1. Diagramas de Sequência

### 1.1 Ingestão de NFC-e (Câmera ao Vivo e Upload de Foto)
Cobre os fluxos de captura, consulta à SEFAZ Paraná, parse da DANFE e idempotência para notas duplicadas.

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário
  participant W as Web / PWA (T-20 / T-21)
  participant QR as Leitor QR (Html5Qrcode)
  participant API as Backend (POST /api/v1/notas)
  participant SFZ as Portal SEFAZ PR
  participant DB as PostgreSQL (enotas)
  participant Q as Fila Background (Worker)

  U->>W: Aponta câmera (T-20) ou envia foto do cupom (T-21)
  W->>QR: Decodifica imagem / frame de vídeo
  QR-->>W: URL do QR Code (fazenda.pr.gov.br/nfce/qrcode?p=...)
  W->>API: POST /api/v1/notas { url }
  
  API->>API: Extrai chave de acesso (44 dígitos) da URL
  API->>DB: SELECT id, emissao FROM enotas.notas WHERE chave_acesso = $1
  
  alt Nota já existente na base (Duplicada)
    DB-->>API: Registro encontrado (id, emissao)
    opt Usuário logado e nota sem dono anterior
      API->>DB: UPDATE enotas.notas SET usuario_id = $userId WHERE id = $id AND usuario_id IS NULL
    end
    API-->>W: 200 OK { ok: true, duplicada: true, notaId, mensagem: "Nota já registrada" }
    W-->>U: Redireciona para T-22 com badge "Nota já registrada anteriormente"
  else Nota inédita
    API->>SFZ: HTTP GET URL da consulta pública (timeout 10s)
    alt SEFAZ responde 200 com HTML da DANFE
      SFZ-->>API: HTML completo da nota fiscal
      API->>API: Cheerio / Parser HTML: extrai Empresa, Totais e Itens
      
      API->>DB: BEGIN TRANSACTION
      API->>DB: INSERT INTO empresas (cnpj, nome, endereco) ON CONFLICT (cnpj) DO UPDATE ... RETURNING id
      API->>DB: INSERT INTO notas (chave_acesso, empresa_id, usuario_id, ...) RETURNING id
      API->>DB: INSERT INTO itens (nota_id, empresa_id, codigo, nome, preco_unitario, ...) ON CONFLICT DO NOTHING
      API->>DB: COMMIT
      
      API->>Q: Enfileira jobs assíncronos: Geocodificar empresa pendente + Atualizar destaques
      API-->>W: 201 Created { ok: true, duplicada: false, empresa, nota, itens }
      W-->>U: Exibe tela T-22 com resumo da compra e produtos importados
    else Falha de rede / Timeout / Erro SEFAZ
      SFZ-->>API: 504 Gateway Timeout ou CAPTCHA
      API->>DB: INSERT INTO notas_falhas (url, chave_acesso, erro_codigo, status) VALUES (...)
      API-->>W: 502 Bad Gateway ProblemDetails (SEFAZ_PARSER_ERROR)
      W-->>U: Alerta amigável: "A Fazenda Estadual está instável. Guardamos sua nota para reprocessar em breve!"
    end
  end
```

---

### 1.2 Vínculo Cooperativo de EAN e Busca de Imagens
Modela a associação colaborativa do código de barras ao item e o disparo assíncrono para obter imagens de embalagens.

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário Colaborador
  participant W as Modal Vincular EAN (T-23)
  participant API as Backend (POST /api/v1/codigos-barras)
  participant DB as PostgreSQL (enotas)
  participant WKR as Worker Imagens EAN
  participant EXT as APIs Externas (OpenFoodFacts / UPCitemdb)

  U->>W: Escaneia código na embalagem ou digita EAN (ex.: 7891000100103)
  W->>W: Valida algoritmo Módulo 10 (dígito verificador)
  W->>API: POST /api/v1/codigos-barras { empresaId, codigoUnidade, codigoBarras }
  
  API->>DB: INSERT INTO codigos_barras (empresa_id, codigo_unidade, codigo_barras) VALUES (...) ON CONFLICT (empresa_id, codigo_unidade) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras
  API->>DB: INSERT INTO ean_catalogo (codigo_barras, nome_referencia) VALUES (...) ON CONFLICT DO NOTHING
  
  API->>WKR: Enfileira job: BuscarImagensEAN(codigoBarras)
  API-->>W: 200 OK { ok: true, codigoBarras, fotoUrl: atualOuPlaceholder }
  W-->>U: Fecha modal T-23 e atualiza card na vitrine/lista com selo de EAN vinculado

  Note over WKR,EXT: Processamento em segundo plano (Assíncrono)
  WKR->>EXT: Consulta metadados e fotos do EAN
  EXT-->>WKR: Retorna URLs de fotos candidatas da embalagem
  WKR->>DB: INSERT INTO ean_imagens (codigo_barras, url_origem, path_local, fonte, ordem, selecionada)
  WKR->>DB: UPDATE ean_catalogo SET foto_url = primeiraImagem WHERE foto_url IS NULL
```

---

### 1.3 Busca e Comparação de Menor Preço por EAN
Mostra a agregação de observações do mesmo código de barras entre estabelecimentos concorrentes com ordenação por menor preço e frescor.

```mermaid
sequenceDiagram
  autonumber
  actor C as Comprador
  participant W as Web (Busca T-11 / Comparação T-12)
  participant API as Backend (GET /api/v1/produtos/:ean)
  participant DB as PostgreSQL (enotas)

  C->>W: Digita EAN ou pesquisa por nome na Busca (T-11)
  W->>API: GET /api/v1/produtos/7891000100103?frescorDias=30&lat=-25.42&lng=-49.27
  
  API->>DB: Executa CTE de agregação de preços por loja nos últimos 30 dias
  DB-->>API: Lista de observações (Condor: R$ 34,90; Muffato: R$ 41,50; Festval: R$ 47,90)
  
  API->>API: Identifica o menor preço (Condor R$ 34,90) e calcula economia vs concorrentes
  API-->>W: 200 OK ProdutoDetalheDTO { resumoPrecos, comparacaoLojas }
  
  W-->>C: Renderiza tela T-12 destacando o Condor em VERDE (#00984B) com badge "MENOR PREÇO"
```

---

### 1.4 Busca Geográfica de Item Perto e Ranking de Mercados
Demonstra a consulta de lojas físicas no raio do usuário e a computação do ranking de competitividade.

```mermaid
sequenceDiagram
  autonumber
  actor C as Comprador
  participant W as Web (Perto T-30 / Ranking T-31)
  participant API as Backend (/api/v1/geo/*)
  participant DB as PostgreSQL (enotas)

  alt Busca de Item no Raio (T-30)
    C->>W: Define raio de 5 km e busca "Leite Piracanjuba 1L"
    W->>API: GET /api/v1/geo/produtos/perto?ean=...&lat=-25.42&lng=-49.27&raioKm=5
    API->>DB: Calcula distância Haversine / PostGIS entre coordenadas da empresa e do usuário
    DB-->>API: Lojas no raio com distância em km e preço unitário
    API-->>W: 200 OK { lojasPerto: [ { nome, distanciaKm: 0.8, preco: 4.89 }, ... ] }
    W-->>C: Exibe lista ordenada por proximidade física com tag de menor preço
  else Consulta ao Ranking de Competitividade (T-31)
    C->>W: Seleciona "Mais baratas" no raio de 5 km
    W->>API: GET /api/v1/geo/ranking-lojas?lat=-25.42&lng=-49.27&raioKm=5&visao=baratas
    API->>DB: Calcula desvio médio percentual dos preços das lojas contra a mediana local
    DB-->>API: Lista de mercados classificados pelo score de economia
    API-->>W: 200 OK RankingLojasDTO
    W-->>C: Renderiza tabela com Atacadão (-14% da média) em 1º lugar
  end
```

---

### 1.5 Atualização do Cache de Destaques de Concorrência
Gatilho e processamento da esteira que popula as oportunidades da Home.

```mermaid
sequenceDiagram
  autonumber
  participant CRON as Cron / Ingestion Trigger
  participant JOB as DestaquesService
  participant DB as PostgreSQL (enotas)
  participant CACHE as Tabela destaques_cache

  CRON->>JOB: Dispara avaliação de concorrência (após lote de notas ou a cada 1 hora)
  JOB->>DB: Consulta itens emitidos nas últimas 48h cujo preço esteja ≥ 10% abaixo da mediana regional
  DB-->>JOB: Lista de itens qualificados como oportunidade real
  
  JOB->>CACHE: DELETE FROM destaques_cache WHERE expira_em < now()
  loop Para cada item qualificado
    JOB->>CACHE: INSERT INTO destaques_cache (codigo_barras, empresa_id, item_id, preco_observado, preco_referencia, perc_desconto, expira_em) VALUES (...) ON CONFLICT DO UPDATE ...
  end
  
  JOB-->>CRON: Concluído: Feed de Destaques atualizado
```

---

## 2. Máquinas de Estado

### 2.1 Ciclo de Vida da Ingestão de Nota Fiscal

```mermaid
stateDiagram-v2
  [*] --> Recebida: Scan do QR ou Upload de Imagem
  Recebida --> ConsultandoSEFAZ: Envia URL para parser
  
  ConsultandoSEFAZ --> Ingerida: HTML válido da DANFE
  ConsultandoSEFAZ --> Duplicada: Chave de acesso já existente no banco
  ConsultandoSEFAZ --> FalhaConexao: Timeout / Erro 5xx SEFAZ
  ConsultandoSEFAZ --> FalhaFormato: URL não reconhecida como SEFAZ
  
  FalhaConexao --> NaFilaFalhas: Salvo em notas_falhas
  NaFilaFalhas --> Reprocessando: Acionamento via Backoffice (US-ADM.01)
  Reprocessando --> Ingerida: SEFAZ respondeu com sucesso
  Reprocessando --> FalhaPersistente: Esgotou limite de 3 tentativas
  
  Duplicada --> [*]: Exibe tela Nota OK (T-22) sem duplicar registros
  Ingerida --> [*]: Empresas, notas e itens registrados
  FalhaFormato --> [*]: Notifica usuário com erro 400
  FalhaPersistente --> [*]: Aguarda análise técnica do moderador
```

---

### 2.2 Ciclo de Vida da Observação de Preço do Item

```mermaid
stateDiagram-v2
  [*] --> Ativo: Nota fiscal importada com sucesso
  
  Ativo --> EmDestaque: Preço fica ≥ 10% abaixo da referência regional
  EmDestaque --> Ativo: Expiração da janela de 72h do destaque
  
  Ativo --> Oculto: Moderador marca como spam / erro PDV (US-ADM.02)
  EmDestaque --> Oculto: Moderador oculta item anômalo
  
  Oculto --> Ativo: Moderador revisa e restaura o item
  Ativo --> HistoricoAntigo: Nota ultrapassa janela de frescor de 90 dias
  
  HistoricoAntigo --> [*]: Permanece em gráficos de série temporal
```

---

### 2.3 Ciclo de Vida da Conta de Usuário e Sessão

```mermaid
stateDiagram-v2
  [*] --> Registrado: Cadastro com e-mail e senha (T-02)
  Registrado --> PendenteOnboarding: Criou conta mas não definiu cidade/GPS
  PendenteOnboarding --> Ativo: Concluiu onboarding local (T-05)
  
  Ativo --> Bloqueado: Administrador suspende por conduta abusiva
  Bloqueado --> Ativo: Administrador desbloqueia conta
  
  Ativo --> AnonimizadoLGPD: Usuário solicita exclusão (US-01.12)
  AnonimizadoLGPD --> [*]: Credenciais destruídas e notas desvinculadas
```

---

## 3. Mapa de Navegação da Aplicação

```mermaid
flowchart TD
  %% Telas de Acesso e Conta
  SPL[T-01 Splash / Início] --> CAD[T-02 Criar Conta]
  SPL --> LOG[T-03 Entrar / Login]
  LOG --> REC[T-04 Recuperar Senha]
  CAD --> ONB[T-05 Onboarding Local]
  LOG --> ONB
  ONB --> HOME[T-10 Home Destaques]
  LOG --> HOME

  %% Abas e Descoberta Principal
  subgraph Principais [Navegação e Descoberta]
    HOME[T-10 Home Destaques]
    BUS[T-11 Busca Produtos]
    PER[T-30 Perto de Mim]
    RNK[T-31 Ranking de Lojas]
    MAP[T-32 Mapa de Estabelecimentos]
    VIT[T-33 Vitrine da Loja]
  end

  HOME <--> BUS
  HOME <--> PER
  PER <--> RNK
  PER <--> MAP
  MAP --> VIT

  %% Comparação e Produtos
  subgraph ProdutoFlow [Fluxo de Produto]
    CMP[T-12 Comparação de Preços]
    HIS[T-13 Histórico Temporal]
    DET[T-14 Detalhe do Produto]
  end

  HOME --> DET
  BUS --> CMP
  CMP --> DET
  DET --> HIS
  VIT --> DET

  %% Depósito e Vínculo de Notas (FAB)
  subgraph IngestaoFlow [Depósito NFC-e e Vínculo EAN]
    FAB((FAB + Nota)) --> SCL[T-20 Scan QR Live]
    SCL --> SCF[T-21 Scan QR Foto]
    SCF --> SCL
    SCL --> NOK[T-22 Nota OK]
    SCF --> NOK
    NOK --> EAN[T-23 Vincular EAN]
    VIT --> EAN
    EAN --> FTO[T-24 Foto EAN]
  end

  %% Cestas e Split
  subgraph CestaFlow [Cesta e Split]
    CES[T-40 Cesta de Compras]
    SPLIT[T-41 Sugestão de Split]
  end

  DET --> CES
  CES --> SPLIT

  %% Gestão Financeira e Perfil
  subgraph PerfilFlow [Perfil e Finanças]
    EXT[T-50 Extrato Financeiro Pessoal]
    PRF[T-51 Perfil e Preferências]
  end

  HOME --> PRF
  PRF --> EXT
  PRF --> SPL

  %% Backoffice
  subgraph AdminFlow [Administração]
    ADM[T-61 Painel Admin]
  end

  PRF -.Acesso Restrito.-> ADM
```
