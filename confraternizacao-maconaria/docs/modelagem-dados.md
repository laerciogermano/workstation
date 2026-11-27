# Modelagem de dados — Confraternização Maçônica

Fonte: [`documento-de-visao.md`](documento-de-visao.md) · stack: [`documento-de-implementacao.md`](documento-de-implementacao.md)

PostgreSQL. IDs `uuid`. Timestamps `created_at` / `updated_at` implícitos onde fizer sentido. **Nomes de tabelas, colunas, enums e flags em inglês.**

```mermaid
classDiagram
  direction TB

  class Organization {
    +uuid id PK
    +text name
    +text acronym
  }

  class Event {
    +uuid id PK
    +uuid organization_id FK
    +text name
    +text slug
    +date starts_on
    +date ends_on
    +text city
    +text status
    +jsonb modules
  }

  class User {
    +uuid id PK
    +text email UK
    +text password_hash
    +text name
    +text phone
    +text city
    +text country
    +bool mfa_enabled
  }

  class MfaFactor {
    +uuid id PK
    +uuid user_id FK
    +text method
    +text secret
    +bool active
  }

  class BackupCode {
    +uuid id PK
    +uuid user_id FK
    +text code_hash
    +bool used
  }

  class TrustedDevice {
    +uuid id PK
    +uuid user_id FK
    +text token_hash
    +timestamptz expires_at
  }

  class Attendee {
    +uuid id PK
    +uuid event_id FK
    +uuid user_id FK
    +text lodge
    +text obedience
    +text cim
    +text office
    +text role
    +int points
  }

  class Venue {
    +uuid id PK
    +uuid event_id FK
    +text name
    +text address
    +float lat
    +float lng
  }

  class Room {
    +uuid id PK
    +uuid venue_id FK
    +text name
    +int capacity
  }

  class Session {
    +uuid id PK
    +uuid event_id FK
    +uuid venue_id FK
    +uuid room_id FK
    +text title
    +text description
    +timestamptz starts_at
    +timestamptz ends_at
    +text image_url
  }

  class Registration {
    +uuid id PK
    +uuid session_id FK
    +uuid attendee_id FK
    +text status
  }

  class CheckIn {
    +uuid id PK
    +uuid registration_id FK
    +timestamptz at
  }

  class TicketType {
    +uuid id PK
    +uuid event_id FK
    +text name
    +float price
  }

  class Ticket {
    +uuid id PK
    +uuid ticket_type_id FK
    +uuid attendee_id FK
    +text status
    +text code
  }

  class GroupChat {
    +uuid id PK
    +uuid session_id FK
  }

  class DirectChat {
    +uuid id PK
    +uuid event_id FK
  }

  class ChatMember {
    +uuid chat_id PK
    +uuid attendee_id PK_FK
    +text chat_type
  }

  class Message {
    +uuid id PK
    +uuid chat_id FK
    +uuid author_id FK
    +text chat_type
    +text body
    +timestamptz sent_at
  }

  class Order {
    +uuid id PK
    +uuid event_id FK
    +uuid attendee_id FK
    +text source
    +text status
    +float total
  }

  class OrderItem {
    +uuid order_id PK_FK
    +int seq PK
    +text description
    +float quantity
    +float unit_price
    +uuid ref_id
  }

  class Product {
    +uuid id PK
    +uuid event_id FK
    +text name
    +float price
    +int stock
  }

  class Auction {
    +uuid id PK
    +uuid event_id FK
    +uuid session_id FK
    +text status
    +timestamptz called_at
  }

  class Lot {
    +uuid id PK
    +uuid auction_id FK
    +text title
    +text description
    +float starting_bid
    +text status
    +uuid winner_id FK
  }

  class Bid {
    +uuid id PK
    +uuid lot_id FK
    +uuid attendee_id FK
    +float amount
    +timestamptz at
  }

  class Voucher {
    +uuid id PK
    +uuid attendee_id FK
    +text type
    +text status
  }

  class ParkingSpot {
    +uuid id PK
    +uuid event_id FK
    +uuid attendee_id FK
    +text code
  }

  class Membership {
    +uuid id PK
    +uuid attendee_id FK
    +text status
    +date valid_until
  }

  class CostShare {
    +uuid id PK
    +uuid event_id FK
    +text title
    +float total
  }

  class CostShareMember {
    +uuid cost_share_id PK_FK
    +uuid attendee_id PK_FK
    +float amount
    +bool paid
  }

  class NetworkCompany {
    +uuid id PK
    +uuid event_id FK
    +uuid attendee_id FK
    +text name
    +text industry
  }

  class News {
    +uuid id PK
    +uuid event_id FK
    +text title
    +text body
    +timestamptz published_at
  }

  class Notification {
    +uuid id PK
    +uuid attendee_id FK
    +text title
    +text body
    +text target
    +bool read
  }

  class CollectionItem {
    +uuid id PK
    +uuid event_id FK
    +text category
    +text title
    +text conservation
    +text security
  }

  class Risk {
    +uuid id PK
    +uuid event_id FK
    +text title
    +text level
    +uuid owner_id FK
    +text plan
    +text status
  }

  class Consent {
    +uuid id PK
    +uuid user_id FK
    +text type
    +bool accepted
    +timestamptz at
  }

  class FacialOptIn {
    +uuid id PK
    +uuid attendee_id FK
    +text template_ref
    +bool active
  }

  Organization "1" --> "*" Event
  Event "1" --> "*" Attendee
  Event "1" --> "*" Venue
  Event "1" --> "*" Session
  Event "1" --> "*" TicketType
  Event "1" --> "*" Product
  Event "1" --> "*" Auction
  Event "1" --> "*" News
  Event "1" --> "*" CostShare
  Event "1" --> "*" NetworkCompany
  Event "1" --> "*" CollectionItem
  Event "1" --> "*" Risk
  Event "1" --> "*" Order
  Event "1" --> "*" ParkingSpot
  Event "1" --> "*" DirectChat

  User "1" --> "*" Attendee
  User "1" --> "*" MfaFactor
  User "1" --> "*" BackupCode
  User "1" --> "*" TrustedDevice
  User "1" --> "*" Consent

  Attendee "1" --> "*" Registration
  Attendee "1" --> "*" Ticket
  Attendee "1" --> "*" Order
  Attendee "1" --> "*" Voucher
  Attendee "1" --> "*" Membership
  Attendee "1" --> "*" Notification
  Attendee "1" --> "0..1" FacialOptIn
  Attendee "1" --> "*" Bid
  Attendee "1" --> "*" NetworkCompany

  Venue "1" --> "*" Room
  Venue "1" --> "*" Session
  Room "0..1" --> "*" Session
  Session "1" --> "*" Registration
  Session "1" --> "0..1" GroupChat
  Session "1" --> "0..1" Auction
  Registration "1" --> "*" CheckIn
  TicketType "1" --> "*" Ticket

  GroupChat "1" --> "*" Message
  DirectChat "1" --> "*" Message
  GroupChat "1" --> "*" ChatMember
  DirectChat "1" --> "*" ChatMember
  Attendee "1" --> "*" Message

  Order "1" --> "*" OrderItem
  Product "1" --> "*" OrderItem

  Auction "1" --> "*" Lot
  Lot "1" --> "*" Bid
  Lot "0..1" --> "0..1" Order
  Attendee "0..1" --> "*" Lot : winner

  CostShare "1" --> "*" CostShareMember
  Attendee "1" --> "*" CostShareMember
  Risk "*" --> "0..1" Attendee : owner
```

## Roles (`Attendee.role`)

| Valor | Uso |
|-------|-----|
| `attendee` | Irmão / inscrito |
| `family` | Visibilidade restrita de módulos |
| `organizer` | Criador / gestão do evento |
| `auctioneer` | Chama leilão e lotes |

## Modules (`Event.modules` jsonb)

Flags plugáveis: `auction`, `membership_card`, `tickets`, `orders`, `news`, `vouchers`, `parking`, `membership`, `cost_shares`, `network`, `ranking`, `support`, `products`, `rooms`, `museum`, `risks`.

## Order source (`Order.source`)

`shop` · `auction` · `ticket`

## Rollback

Remover este arquivo e o link em [`documento-de-implementacao.md`](documento-de-implementacao.md) / [`README.md`](README.md).
