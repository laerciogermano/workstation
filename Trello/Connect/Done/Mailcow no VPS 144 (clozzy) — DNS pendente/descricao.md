## Status
Mailcow **UP** em `144.126.154.90` **sem derrubar SSH/Postgres**.

- Web bind: `127.0.0.1:8080` / `8443`
- Nginx: `mail.clozzy.com.br` → proxy HTTPS
- SMTP/IMAP: 25/587/993 publicados
- Postgres `connectmax` healthy; dump local em `conectmax/backups/connectmax-20261026-144353.*`
- **Não** reiniciamos o daemon Docker; IPv6 do Mailcow desligado

## Acesso
- Painel: `https://mail.clozzy.com.br` (após DNS A) ou `https://144.126.154.90` com Host/`/etc/hosts`
- Login inicial Mailcow: `admin` / `moohoo` (**trocar**)
- Certificado snakeoil (aviso no browser) até Let's Encrypt

## DNS Umbler (fazer)
1. **A** `mail` → `144.126.154.90`
2. Só depois trocar **MX** para `mail.clozzy.com.br` (hoje ainda Google)
3. SPF → `v=spf1 mx a:mail.clozzy.com.br include:_spf.google.com ~all` (transitório) ou só mailcow após cutover
4. DKIM no painel Mailcow + TXT
5. PTR Contabo → `mail.clozzy.com.br` (se possível no VPS)

## Path
`/opt/mailcow-dockerized`