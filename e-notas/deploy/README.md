# e-notas — Deploy Contabo

Convive com **conect tec** (HTTP `:80`) e **mailcow** (HTTPS `:443`).

| App | URL |
|-----|-----|
| conect tec | http://144.126.154.90/ |
| e-notas (HTTPS) | **https://144.126.154.90/enotas/** |
| e-notas (HTTPS porta) | **https://144.126.154.90:4173/** |

HTTP `http://…/enotas/` redireciona para HTTPS. Certificado em `:4173` é autoassinado (aceitar aviso no browser — necessário p/ câmera). Em `/enotas/` no `:443` usa o cert do mailcow (também pode avisar no IP).

| Item | Valor |
|------|--------|
| Código | `/opt/e-notas` |
| Unit | `enotas.service` |
| Node | `127.0.0.1:4174` (`USE_HTTP=1`) |
| nginx `:4173` SSL | [`nginx-enotas.conf`](nginx-enotas.conf) |
| nginx `:443` path | snippet no mailcow ([`nginx-enotas.snippet.conf`](nginx-enotas.snippet.conf)) |
| Certs `:4173` | `/opt/e-notas/certs/` |

## Rollback

1. `systemctl disable --now enotas`
2. Remover locations `/enotas` do mailcow + connectmax; `rm` site `enotas`
3. `nginx -t && systemctl reload nginx`
4. Opcional: `rm -rf /opt/e-notas`

**Antes → depois:** e-notas só HTTP → HTTPS em `/enotas/` (`:443`) e `:4173`; conect tec permanece em `http://IP/`.
