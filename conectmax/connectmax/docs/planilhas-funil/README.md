# Planilhas funil (snapshot local)

**Por quê:** cópia `.xlsx` das planilhas Drive (funil 2025–2026) + catálogo de empresas com CNPJ para o app.  
**Fonte de verdade:** portal franqueado / Drive — estes arquivos são snapshot.

| Arquivo | Drive / origem |
|---|---|
| [`Funil-Orcamentos-2025-2026.xlsx`](Funil-Orcamentos-2025-2026.xlsx) | [Orçamentos](https://docs.google.com/spreadsheets/d/1yj1o76FmsVTDBii59WILNbjmujh8ckeifbkDs830rZ0/edit) |
| [`Funil-Pedidos-2025-2026.xlsx`](Funil-Pedidos-2025-2026.xlsx) | [Pedidos](https://docs.google.com/spreadsheets/d/1vmumcYEVe--9E97sd-ViEBGnqP220PXhcSOl0pmlrts/edit) |
| [`Funil-Faturamento-2025-2026.xlsx`](Funil-Faturamento-2025-2026.xlsx) | [Faturamento](https://docs.google.com/spreadsheets/d/1Q0tj17N0AhVRDOgF-LPG3aMFCCCmlbkVBJn-zlyhBxg/edit) |
| [`Funil-ContasAReceber-2025-2026.xlsx`](Funil-ContasAReceber-2025-2026.xlsx) | [Contas a receber](https://docs.google.com/spreadsheets/d/14INvpLdNiGQg9M_wsiHQCiPVrCpreoZIxIm6OpQ3ubs/edit) (CNPJ truncado no export) |
| [`Funil-NotasFiscais-2025-2026.xlsx`](Funil-NotasFiscais-2025-2026.xlsx) | [Notas fiscais](https://docs.google.com/spreadsheets/d/1S81Mo5JuO_1irrHAJWkLrZIEJTEX714AMLjrlBxBqoc/edit) |
| [`empresas.json`](empresas.json) | Gerado: portal CR (CNPJ completo) + Pedidos/Orçamentos |

Mapa e links: [`../portal-franqueado.md`](../portal-franqueado.md).

## Empresas (CNPJ)

As planilhas Drive de CR cortam o CNPJ no texto do resumo. O catálogo usa o **portal** (`?page=contasareceber` com `data_inicial`/`data_final`) para CNPJ 14 dígitos e cruza nomes com Pedidos/Orçamentos.

```bash
# regenerar empresas.json (login em ~/.config/conectmax-franqueado/)
python3 build-empresas.py --fetch-portal

# importar na API (tabela empresas)
cd ../../vendas/api && npm run start:dev   # outro terminal
npm run seed:empresas
```

UI: `http://localhost:5173/empresas` · API: `GET /empresas`, `POST /empresas/import`.

**Antes → depois:** só nomes em Pedidos → tabela `empresas` + CNPJ do portal + tela `/empresas`.  
**Rollback:** `DROP TABLE empresas;`; remova `EmpresasModule` / `src/empresas.jsx` / proxy `/empresas`; apague `empresas.json` se não quiser o snapshot.

## Rebaixar (caminho inverso)

Com `google-drive-cli` autenticado (`~/.config/google-drive-cli/token.json`):

```bash
python3 - <<'PY'
from pathlib import Path
import io
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

TOKEN = Path.home()/".config/google-drive-cli/token.json"
SCOPES = ["https://www.googleapis.com/auth/drive"]
creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
if creds.expired and creds.refresh_token: creds.refresh(Request())
drive = build("drive", "v3", credentials=creds)
OUT = Path(__file__).resolve().parent if False else Path("connectmax/docs/planilhas-funil")
MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
for fid, name in [
  ("1yj1o76FmsVTDBii59WILNbjmujh8ckeifbkDs830rZ0", "Funil-Orcamentos-2025-2026.xlsx"),
  ("1vmumcYEVe--9E97sd-ViEBGnqP220PXhcSOl0pmlrts", "Funil-Pedidos-2025-2026.xlsx"),
  ("1Q0tj17N0AhVRDOgF-LPG3aMFCCCmlbkVBJn-zlyhBxg", "Funil-Faturamento-2025-2026.xlsx"),
  ("14INvpLdNiGQg9M_wsiHQCiPVrCpreoZIxIm6OpQ3ubs", "Funil-ContasAReceber-2025-2026.xlsx"),
  ("1S81Mo5JuO_1irrHAJWkLrZIEJTEX714AMLjrlBxBqoc", "Funil-NotasFiscais-2025-2026.xlsx"),
]:
  buf = io.BytesIO()
  dl = MediaIoBaseDownload(buf, drive.files().export_media(fileId=fid, mimeType=MIME))
  done = False
  while not done: _, done = dl.next_chunk()
  (OUT/name).write_bytes(buf.getvalue())
  print("ok", name)
PY
```

Remover snapshots: apagar os `.xlsx` / `empresas.json` (e esta pasta se vazia). O Drive permanece intacto.
