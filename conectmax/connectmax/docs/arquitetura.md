# Arquitetura — ConnectMax (extract → vendas/api → Postgres)

**Por quê:** desenho estático e dinâmico do fluxo extract LinkedIn → Nest → Postgres.  
**API:** [`../vendas/api/README.md`](../vendas/api/README.md) · **Extract:** [`../../screen-robot/src/scripts/login-extract-profiles.js`](../../screen-robot/src/scripts/login-extract-profiles.js) · **Umbrella:** [`../README.md`](../README.md) · **Plano:** [`plano-implementacao-prospeccao-scripts.md`](plano-implementacao-prospeccao-scripts.md)

**Antes → depois:** não havia diagrama; persistência era só JSON local.  
**Rollback:** ignore este doc; remova `PROFILES_API_URL` e pare a API.

---

## 1. Visão de contexto (C4 L1)

```mermaid
C4Context
    title Persistência de perfis LinkedIn

    Person(ops, "Operador", "CLI ou GET /extract/start")
    System_Boundary(cm, "ConnectMax") {
        System(sr, "screen-robot", "ADB + OCR + script extract")
        System(api, "vendas/api", "NestJS /profiles + /profile-details + /dashboard + /extract")
        SystemDb(pg, "PostgreSQL", "clientes + cliente_linkedin + client_connection_linkedin + messages")
    }
    System_Ext(li, "LinkedIn app", "UI no emulador/device")

    Rel(ops, api, "GET /extract/start · CRUD /clientes · conexões")
    Rel(ops, sr, "PROFILES_API_URL + npm run")
    Rel(api, sr, "spawn login-extract-profiles")
    Rel(sr, li, "launch / extract / scroll / tap / connect")
    Rel(sr, api, "POST /profiles · POST /client-connections-linkedin")
    Rel(api, pg, "upsert TypeORM")
```

**Modelo de dados:** `clientes` (identidade) + `cliente_linkedin` (canal LinkedIn **e** extract: URL, foto, OCR, inviteStatus). `client_connection_linkedin` liga agente ↔ `cliente_linkedin` (status 0/1/2). Rotas `/profiles` e `/profile-details` são fachada sobre `cliente_linkedin`.

---

## 2. Contêineres (C4 L2)

```mermaid
C4Container
    title Camadas do fluxo

    Container(script, "login-extract-profiles.js", "Node ESM", "OCR list → onProfile")
    Container(api, "Nest App", "Node / Nest 11", "ValidationPipe + TypeORM")
    ContainerDb(pg, "Postgres 16", "SQL", "cliente_linkedin (+ clientes)")
    Container(disk, "screenshots/…", "FS", "profiles.json + profile-NNN.json")

    Rel(script, disk, "sempre grava")
    Rel(script, api, "se PROFILES_API_URL", "HTTP JSON")
    Rel(api, pg, "upsert por URL / nome")
```

---

## 3. Diagrama de classes — Nest (API)

```mermaid
classDiagram
    direction TB

    class AppModule {
        +imports ConfigModule
        +imports TypeOrmModule
        +imports ProfilesModule
        +imports ProfileDetailsModule
        +imports ClientesModule
        +imports ExtractModule
    }

    class ClientesModule {
        +controllers ClientesController
        +providers ClientesService
    }

    class Cliente {
        +id uuid
        +nome email telefone
        +empresa cargo cidade notas
    }

    class ClienteLinkedin {
        +id uuid
        +clienteId uuid
        +profileUrl headline about
        +linkedinProfileId uuid
    }

    class ClientConnectionLinkedin {
        +id uuid
        +clienteLinkedinId uuid
        +agentId string
        +status smallint
        +invitedAt connectedAt
    }

    Cliente "1" --> "0..1" ClienteLinkedin : canal LinkedIn
    ClienteLinkedin "1" --> "*" ClientConnectionLinkedin : conexões por agente

    class ProfilesModule {
        +imports TypeOrmModule.forFeature(Profile)
        +controllers ProfilesController
        +providers ProfilesService
    }

    class ProfilesController {
        -profilesService ProfilesService
        +findAll() meta_data
        +create(dto CreateProfileDto) Profile
        +createBatch(body CreateProfilesBatchDto) saved
    }

    class ProfilesService {
        -profiles Repository~Profile~
        +findAll() meta_data
        +upsertOne(dto) Profile
        +upsertMany(dtos) saved
        -toEntity(dto) Partial~Profile~
    }

    class ProfileDetailsModule {
        +controllers ProfileDetailsController
        +providers ProfileDetailsService
    }

    class ProfileDetailsController {
        +findAll() meta_data
        +findOne(profileId) ProfileDetail
        +create(dto) ProfileDetail
    }

    class ProfileDetailsService {
        +findAll() meta_data
        +findByProfileId(id) ProfileDetail
        +upsertOne(dto) ProfileDetail
    }

    class ProfileDetail {
        +id uuid
        +profileId uuid
        +name headline location
        +about experience education
        +rawOcr jsonb
    }

    class ExtractModule {
        +controllers ExtractController
        +providers ExtractService
    }

    class ExtractController {
        -extractService ExtractService
        +start() ExtractStatus
        +status() ExtractStatus
    }

    class ExtractService {
        -child ChildProcess
        +start() ExtractStatus
        +status() ExtractStatus
    }

    AppModule --> ProfileDetailsModule
    AppModule --> ExtractModule
    ProfileDetailsModule --> ProfileDetailsController
    ProfileDetailsModule --> ProfileDetailsService
    ProfileDetailsService --> ProfileDetail
    ExtractModule --> ExtractController
    ExtractModule --> ExtractService
    ExtractController --> ExtractService

    class CreateProfileDto {
        +name string
        +title string?
        +level string?
        +connection string?
        +city string?
        +mutualConnections string?
        +current string?
        +past string?
        +extractedAt string?
        +round number?
    }

    class CreateProfilesBatchDto {
        +profiles CreateProfileDto[]
    }

    class Profile {
        +id uuid
        +name string
        +title string?
        +level string?
        +connection string?
        +city string?
        +mutualConnections string?
        +current string?
        +past string?
        +extractedAt Date?
        +round number?
        +createdAt Date
        +updatedAt Date
    }

    class Repository~Profile~ {
        <<TypeORM>>
        +upsert()
        +findOneByOrFail()
    }

    AppModule --> ProfilesModule
    ProfilesModule --> ProfilesController
    ProfilesModule --> ProfilesService
    ProfilesModule --> Profile : forFeature
    ProfilesController --> ProfilesService
    ProfilesController ..> CreateProfileDto : POST /
    ProfilesController ..> CreateProfilesBatchDto : POST /batch
    CreateProfilesBatchDto o-- CreateProfileDto
    ProfilesService --> Repository~Profile~
    Repository~Profile~ --> Profile
    ProfilesService ..> CreateProfileDto : toEntity
```

### Mapeamento entidade ↔ tabela

| Classe / campo | Coluna SQL |
|----------------|------------|
| `Cliente` | `clientes` (`nome`) |
| `ClienteLinkedin` | `cliente_linkedin` |
| `profileUrl` | `profile_url` (unique parcial) |
| `inviteStatus` | `invite_status` |
| `mutualConnections` | `mutual_connections` |
| `extractedAt` / `deletedAt` | `extracted_at` / `deleted_at` |
| `rawOcr` | `raw_ocr` jsonb |
| Fachada `/profiles/:id` | `cliente_linkedin.id` |

---

## 4. Diagrama de classes — extract (lado cliente)

Funções do script (não são classes Nest; modeladas como módulos lógicos):

```mermaid
classDiagram
    direction LR

    class LoginExtractProfiles {
        <<script>>
        +main()
        +extractProfilesLoop()
        +defaultOnProfile()
        +profileRow()
        +profileApiPayload()
        +postProfileToApi()
    }

    class ScreenRobotLib {
        <<lib>>
        +provisionEmulator()
        +extract()
        +profilesFromExtract()
        +operate tap/scroll/type
    }

    class ProfilePayload {
        <<DTO HTTP>>
        +name
        +title
        +level
        +connection
        +city
        +mutualConnections
        +current
        +past
        +extractedAt
        +round
    }

    class VendasApi {
        <<HTTP>>
        +POST /profiles
        +POST /profiles/batch
    }

    LoginExtractProfiles --> ScreenRobotLib : OCR + gestos
    LoginExtractProfiles --> ProfilePayload : profileApiPayload
    LoginExtractProfiles --> VendasApi : fetch se PROFILES_API_URL
    ProfilePayload ..> VendasApi : body JSON
```

---

## 5. Sequência — bootstrap da API

```mermaid
sequenceDiagram
    actor Ops as Operador
    participant Nest as NestFactory
    participant App as AppModule
    participant Cfg as ConfigService
    participant TOR as TypeORM
    participant PG as PostgreSQL

    Ops->>Nest: npm run start:dev
    Nest->>App: create(AppModule)
    App->>Cfg: ConfigModule.forRoot
    App->>TOR: forRootAsync(DB_*)
    TOR->>PG: connect + synchronize (se DB_SYNC=true)
    Nest->>Nest: ValidationPipe global
    Nest-->>Ops: listening :PORT
```

---

## 6. Sequência — extract completo (lista → disco → API)

```mermaid
sequenceDiagram
    actor Ops as Operador
    participant S as login-extract-profiles
    participant Prov as provisionEmulator
    participant OCR as extract / profilesFromExtract
    participant FS as disco (screenshots)
    participant API as vendas/api
    participant PG as PostgreSQL

    Ops->>S: PROFILES_API_URL=… npm run …
    S->>Prov: provisionEmulator(cfg)
    Prov-->>S: serial
    S->>S: stop apps → launch LinkedIn
    S->>OCR: waitForText Search → tap → type comprador → See all
    loop até fim do scroll ou maxProfiles
        S->>OCR: extract({ serial, engine })
        OCR-->>S: elements[]
        S->>OCR: profilesFromExtract(els)
        OCR-->>S: profiles novos
        loop cada perfil fresco
            S->>FS: profile-NNN.json + profiles.json
            alt PROFILES_API_URL definido
                S->>API: POST /profiles (CreateProfileDto)
                API->>PG: upsert (name, current)
                PG-->>API: row
                API-->>S: Profile JSON
            else sem env
                Note over S: só FS
            end
        end
        S->>S: scroll + frameHash (detectar fim)
    end
    S-->>Ops: OK — N perfis
```

---

## 7. Sequência — `POST /profiles` (um card)

```mermaid
sequenceDiagram
    participant Client as extract / curl
    participant Pipe as ValidationPipe
    participant Ctrl as ProfilesController
    participant Svc as ProfilesService
    participant Repo as Repository~Profile~
    participant PG as PostgreSQL

    Client->>Pipe: POST /profiles + JSON
    Pipe->>Pipe: whitelist / transform / class-validator
    alt inválido
        Pipe-->>Client: 400
    else válido
        Pipe->>Ctrl: create(CreateProfileDto)
        Ctrl->>Svc: upsertOne(dto)
        Svc->>Svc: toEntity(dto)
        Svc->>Repo: upsert(row, conflict name+current)
        Repo->>PG: INSERT … ON CONFLICT DO UPDATE
        PG-->>Repo: ok
        Svc->>Repo: findOneByOrFail(name, current|IsNull)
        Repo->>PG: SELECT
        PG-->>Repo: Profile
        Repo-->>Svc: Profile
        Svc-->>Ctrl: Profile
        Ctrl-->>Client: 201 Profile
    end
```

---

## 8. Sequência — `POST /profiles/batch`

```mermaid
sequenceDiagram
    participant Client as cliente
    participant Pipe as ValidationPipe
    participant Ctrl as ProfilesController
    participant Svc as ProfilesService
    participant Repo as Repository~Profile~
    participant PG as PostgreSQL

    Client->>Pipe: POST /profiles/batch { profiles: [...] }
    Pipe->>Ctrl: createBatch(CreateProfilesBatchDto)
    Ctrl->>Svc: upsertMany(profiles)
    alt array vazio
        Svc-->>Ctrl: { saved: 0 }
    else com itens
        Svc->>Svc: map toEntity
        Svc->>Repo: upsert(rows, conflict name+current)
        Repo->>PG: bulk upsert
        PG-->>Repo: ok
        Svc-->>Ctrl: { saved: N }
    end
    Ctrl-->>Client: 201 { saved }
```

---

## 9. Sequência — falha HTTP no extract

```mermaid
sequenceDiagram
    participant S as defaultOnProfile
    participant API as vendas/api

    S->>S: grava FS (já feito)
    S->>API: POST /profiles
    API-->>S: 4xx/5xx
    S-->>S: throw Error(POST url → status)
    Note over S: aborta o loop do extract
```

---

## 10. Contrato de dados

```text
OCR card (fields)
  → profileRow / profileApiPayload
  → POST /profiles (fachada)
  → clientes.nome + cliente_linkedin
```

Campos alinhados: `name`→`clientes.nome`, `title`→`headline`, `level`→`connection_degree`, URL/foto/OCR/`inviteStatus`/`deleted_at` em `cliente_linkedin`.
