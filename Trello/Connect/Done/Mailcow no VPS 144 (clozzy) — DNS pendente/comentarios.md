### 1. laerciogermano — 2026-10-26T15:31:33.885Z

**Execução iniciada** (card → Doing)

**Achados Fase 0 (DNS):**
- Domínio `conecttech.com.br` registrado (Registro.br), owner CONECTTECH CONSULTORIAS / Jeferson
- NS: `b.sec.dns.br` / `c.sec.dns.br`
- **MX já em Zoho** (`mx.zoho.com` …), SPF Zoho, DMARC ativo (`rua=jeferson@conecttech.com.br`)
- Link Google Admin informado aponta para **`clozzy.com.br`** (Workspace Google), não para conecttech

**Próximo:** confirmar se o caminho é (A) migrar Zoho → Google Workspace, (B) manter/usar Zoho já existente, ou (C) self-host Mailcow (exige VPS + trocar MX).

### 2. laerciogermano — 2026-10-26T15:32:28.659Z

**Pivot:** domínio de e-mail = `clozzy.com.br` via Google Workspace (MX já Google). `conecttech.com.br` fora do escopo (Zoho).

### 3. laerciogermano — 2026-10-26T15:32:56.840Z

**DNS clozzy.com.br**
- MX Google: OK
- SPF: **ausente**
- DKIM: **não publicado** (sem TXT `_domainkey`)
- DMARC: **ausente**

**Bloqueio:** login no Google Admin necessário no browser do Cursor para criar usuários/aliases e gerar DKIM.
Painel DNS: Redehost/Umbler (para SPF/DKIM/DMARC).

### 4. laerciogermano — 2026-10-26T15:34:11.822Z

**Status Admin (usuário):**
- MX: Concluída ✅
- SPF: Ausente → gravar \`v=spf1 include:_spf.google.com ~all\`
- DKIM: Ausente → gerar no Admin e publicar TXT

### 5. laerciogermano — 2026-10-26T16:52:37.841Z

**DKIM:** Admin status = autenticando e-mails com DKIM. SPF + DKIM no DNS OK. Próximo opcional: DMARC; depois usuários/aliases.

### 6. laerciogermano — 2026-10-26T16:54:19.500Z

**Decisão:** Opção **A** — Mailcow self-host na Contabo (substitui Google no MX de `clozzy.com.br`).

**Atenção:** VDS atual `185.250.37.82` já roda docker-avd (LinkedIn). Ideal: VPS Contabo **dedicada** a e-mail + liberar porta 25 no painel Contabo.

### 7. laerciogermano — 2026-10-26T16:56:32.095Z

**Execução A no VDS \`185.250.37.82\`:** nginx (redirect) parado; instalando Mailcow \`mail.clozzy.com.br\`.

**DNS urgente (Umbler):**
- A \`mail\` → \`185.250.37.82\`
- Depois: MX \`@\` → \`mail.clozzy.com.br\` (prio 10) e remover MX Google
- SPF: \`v=spf1 mx a:mail.clozzy.com.br ~all\`
- Contabo: PTR → \`mail.clozzy.com.br\`

### 8. laerciogermano — 2026-10-26T17:04:06.940Z

**Mailcow UP** em `185.250.37.82` (portas 25/80/443/587/993). nginx host desligado. **Próximo:** DNS A `mail` → IP na Umbler, depois MX/SPF e login `https://mail.clozzy.com.br` (admin/moohoo — trocar senha).

### 9. laerciogermano — 2026-10-26T17:20:36.737Z

**Diagnóstico acesso painel:** Contabo OK (teste com Python nas portas 80/443 respondeu). Falha era **docker-proxy/DNAT do Mailcow** (SYN chega, sem SYN-ACK).

**Incidente:** após ajuste `userland-proxy: false` + restart Docker, VPS ficou **unreachable** (SSH/Tailscale offline). Precisa **console Contabo (VNC)** para recuperar rede/SSH e depois proxy nginx no host → Mailcow.

### 10. laerciogermano — 2026-10-26T17:40:59.003Z

**VDS `vmi3645369` / `185.250.37.82` não existe mais no painel Contabo.** Mailcow + docker-avd dessa máquina perdidos (sem snapshot). Postgres/API em `144.126.154.90` intactos. Próximo: nova VPS/VDS se quiser Mailcow de novo, ou ficar só no Google Workspace.

### 11. laerciogermano — 2026-10-26T17:41:42.123Z

Confirmado no painel: **All(1)** só `vmi3645318` / `144.126.154.90`. VDS `185` sumiu. Card → Impedidos.

### 12. laerciogermano — 2026-10-26T17:45:18.086Z

**Backup Postgres feito** (antes de instalar Mailcow no `144`):\n- `conectmax/backups/connectmax-20261026-144353.dump` (31M)\n- `.sql` (41M) + schema\n- pasta `backups/` no gitignore

### 13. laerciogermano — 2026-10-26T17:50:01.110Z

Mailcow instalado no `144` com proxy nginx. SSH 22 + Postgres OK. **Próximo:** DNS A `mail` → `144.126.154.90` na Umbler; login admin/moohoo e trocar senha.

### 14. laerciogermano — 2026-10-26T17:54:27.454Z

Senha admin Mailcow resetada. User `admin` / senha nova no chat (não `moohoo`).

### 15. laerciogermano — 2026-10-26T18:04:15.109Z

DNS ok: A `mail`→144 + DKIM. MX ainda Google. Próximo: mailboxes; cutover MX/SPF quando pronto.

### 16. laerciogermano — 2026-10-26T18:13:42.426Z

MX autoritativo: `mail.clozzy.com.br` ✅. Cache público ainda pode mostrar Google por alguns minutos/horas. SMTP :25 aberto no 144.
