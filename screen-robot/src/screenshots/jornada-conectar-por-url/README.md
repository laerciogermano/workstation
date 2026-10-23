# Jornada: conectar por URL

Fluxo capturado no AVD (`emulator-5554`).

| # | Arquivo | Estado |
|---|---------|--------|
| 00 | `00-receber-url-antes.png` | Home do device (antes do deep link) |
| 01 | `01b-linkedin-apos-cold-start.png` | LinkedIn feed (app warm) |
| 02 | `02-perfil-via-url.png` | Sheet More (ex.: já nos ⋮) |
| 03 | `03-perfil-so-follow.png` | Perfil com **Follow** + Message (sem Connect no header) |
| 04 | `04-apos-tres-pontos.png` | Sheet More após tap no ícone ⋮ (`icon` ~x=492 y=652) |
| 05 | `05-apos-connect.png` | Dialog **Add a note** / **Skip** |
| 06 | `06-apos-skip.png` | Após Skip (convite enviado / Pending) |

## Regras

1. `am start VIEW` URL `linkedin.com/in/…` com `-p com.linkedin.android`
2. Se OCR tem text EXATO `Connect` (não `connections`) → tap Connect
3. Senão, se só `Follow` → tap ícone ⋮ (direita de Message, ~icon x=492 y=652) → tap `Connect` no sheet
4. Se `Add a note` / `Skip` → tap `Skip` (nunca Add a note)
5. **Sucesso só se `Pending` aparecer depois do Skip.** Sem Pending → falha.
6. Em sucesso → `POST …/client-connections-linkedin` `{ profileUrl, agentId, status: 1 }`

Proibido: tap `Message`, `Follow`, `Personalize invite`, `Add a note`.
