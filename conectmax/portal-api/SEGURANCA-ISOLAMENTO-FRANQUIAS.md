# Segurança — isolamento entre franquias (Portal Franqueado)

**Alvo:** `https://franqueado.conectmax.com/`  
**Data do teste:** 2026-11-06  
**Sessão usada:** franquia autenticada `id_franqueado = 9` (PHPSESSID válido)  
**Escopo:** somente leitura (GET / POST de poll). Nenhuma mutação de status, quitar, active, etc.

Relacionado: mapa de GETs em [`GETS.md`](GETS.md) · API local [`README.md`](README.md).

---

## Resumo

O portal **não isola dados por franquia no servidor**. Parâmetros de franquia e IDs de objeto enviados pelo cliente são confiados. Com uma conta de franqueado é possível ler faturamento, pedidos, NFs (PDF/XML), boletos e listagens de **outras franquias**.

Severidade geral: **crítica** (vazamento multi-tenant + documentos fiscais/financeiros).

---

## Achados

### 1. Crítico — `id_franqueado` nos relatórios de faturamento

**Endpoints**

- `GET /franqueado/ajax/faturamento/relatorio_excel.php?id_franqueado={N}&…`
- `GET /franqueado/ajax/faturamento/relatorio_pdf.php?id_franqueado={N}&…`

**Comportamento**

Sessão da franquia 9 consegue baixar Excel/PDF de outras unidades apenas trocando `id_franqueado`.

| `id_franqueado` | HTTP | Tamanho aprox. Excel | Observação |
|---|---|---|---|
| 9 (própria) | 200 | ~142 KB | Baseline (ex.: vendedores Bruno, Erickson, Gabriele, Guilherme, Marcello, Olívia) |
| 1 | 200 | ~235 KB | Outro conjunto de vendedores / totais |
| 2 | 200 | ~392 KB | Totais da ordem de R$ 5,7M no período |
| 3 | 200 | ~408 KB | Dados de outra unidade |
| 4 | 200 | ~113 KB | |
| 5 | 200 | ~178 KB | |
| 8 | 200 | ~314 KB | |
| 12 | 200 | ~44 KB | |
| 6, 7, 10, 11, 15… | 200 | vazio ou mínimo | Conta inexistente / sem movimento |

PDF reproduziu o mesmo vazamento (ex.: ids 9, 1, 2, 8 com PDFs distintos e não vazios).

**Causa raiz provável:** filtro de franquia vem do query string, sem checar se a sessão pode ver aquele `id_franqueado`.

---

### 2. Crítico — `id_franqueado_rel` nas listagens HTML

**Telas** (`GET /franqueado/?page=…`)

- `contasareceber`
- `pedidos`
- `notas_fiscais`
- `faturamento`

UI mostra `<select name="id_franqueado_rel">` (para a conta 9 só opção “Nenhum”), mas o **param GET ainda é honrado**.

| `id_franqueado_rel` | Contas a receber (bytes / IDs `id_conta`) | Pedidos (bytes) | Faturamento page (bytes) |
|---|---|---|---|
| 9 | ~2,5 MB / ~745 | ~225 KB | ~29 KB |
| 1 | ~3,9 MB / ~1254 | ~242 KB | ~31 KB |
| 2 | ~7,8 MB / ~2546 | ~239 KB | ~28 KB |
| 8 | ~4,9 MB | ~232 KB | ~28 KB |

Trocar o param muda o volume e o conjunto de títulos — acesso à carteira de outras franquias.

---

### 3. Crítico — IDOR por ID de objeto

Autorização parece ser “está logado?”, não “o recurso pertence à minha franquia?”.

#### Pedidos

`GET /franqueado/?page=pedidos_edicao&id_pedido={id}&action=visualizar`

| `id_pedido` | `id_franqueado` no formulário | Exemplo de cliente (evidência) |
|---|---|---|
| 16840 | 9 | próprio |
| 16790 | **12** | outro tenant |
| 100 | **2** | outro tenant |
| 1000 | **6** | outro tenant |
| 5000 | **8** | outro tenant |
| 10000 | **3** | outro tenant |
| 15000 | 9 | próprio |
| 16000 | **4** | outro tenant |

Respostas ~60 KB, HTTP 200, **sem** mensagem de “não autorizado”.

#### Notas fiscais (PDF / XML)

- `GET /franqueado/ajax/notas_fiscais/pdf.php?id_nota={id}`
- `GET /franqueado/ajax/notas_fiscais/xml.php?id_nota={id}`

XML de ids arbitrários retornou NFs de **outros CNPJs emitentes** (outras unidades Conect), não só Campinas (franquia 9). Exemplos de padrão observado: emitentes de Curitiba, RS, Joinville, Londrina, etc., para `id_nota` 100, 1000, 5000, 10000, 16924, 17000…

#### Boletos

`GET /franqueado/ajax/boletos/boleto.php?id_boleto={id}`

| `id_boleto` | Resultado |
|---|---|
| 442 (próprio da listagem) | PDF ~97 KB |
| 443, 452 | PDF de outros títulos |
| 50, 100, 500 | PDF (não vazio) |
| 1, 10 | HTML mínimo (~2 B) — id inválido |

#### Orçamentos

`GET /franqueado/?page=orcamentos_edicao&id_orcamento={id}` carrega orçamentos de ids distintos (títulos/números/clientes diferentes) sem bloqueio aparente.

`orcamento_historico` também responde 200 para ids variados (revisar ACL no backend).

#### Contas a receber (detalhe)

`GET /franqueado/?page=contasareceber_edicao&id_conta={id}`

- Id existente → tela “Edição” com valor/título reais (ex.: `id_conta=5000`, fatura quitada).
- Id inexistente → “Novo” com valor 0 — **não** é 403; facilita enumeração.

---

### 4. Alto — cookie de sessão fraco

`Set-Cookie: PHPSESSID=…; path=/`

Ausentes (no login e nas respostas observadas):

- `HttpOnly`
- `Secure`
- `SameSite`

Impacto: XSS ou malware no browser rouba sessão facilmente; cookie pode ir em requests cross-site dependendo do browser.

---

### 5. Alto — CORS permissivo

Respostas autenticadas incluem:

`Access-Control-Allow-Origin: *`

Em app com cookie de sessão, isso amplia superfície (combinado com falta de `SameSite` / CSRF). Restringir ao origin do portal.

---

### 6. Médio — `login_teste.php` (impersonação)

Em **todas** as páginas autenticadas há JS do tipo:

```js
id_franqueado = 9;
$.post('franqueado/ajax/login_teste.php', {
  id_franqueado: id_franqueado,
  id_funcionario: id_funcionario
}, …);
```

No teste, POST com ids 9 e 1 redirecionou para `login.php` (pode estar parcial/desligado para este perfil). Mesmo assim:

- Endpoint de “login como franquia X” **não deve existir em produção**.
- Remover do HTML/JS e do servidor.

---

### 7. Médio — endpoints genéricos de escrita (risco, não explorado)

Presentes no shell das páginas (mapa também em [`GETS.md`](GETS.md)):

| Endpoint | Risco |
|---|---|
| `ajax/active.php` (`table`, `field`, `id_name`, `id_value`, `value`) | update genérico se sem ACL |
| `ajax/salvar_ordem_registros.php` | reorder arbitrário |
| `ajax/…/status`, `quitar`, `duplicar`, `cancelar` | se espelharem o IDOR de leitura → alteração cross-franquia |

**Não foram executadas mutações neste teste.** Validar em staging com a mesma metodologia de IDOR.

---

### 8. Médio/local — `portal-api` (este repositório)

| Item | Detalhe |
|---|---|
| Auth | Nenhuma na API local; usa cookie/credencial do franqueado |
| Bind | Default `127.0.0.1:4175` (reduz exposição de rede) |
| Faturamento | Fallback hard-coded `id_franqueado = '9'` se o HTML não trouxer o id (`src/index.js`) |

A API local **herda** os furos do portal: qualquer chamada que repasse `id_franqueado` / IDs de objeto pode ampliar o abuso. Não usar como API multi-tenant sem correção no portal.

Nota: `ajax/contasareceber/relatorio_excel.php?id_franqueado={N}` no teste devolveu o **mesmo** tamanho para 9/1/2/8 (~1,2 MB) — parece ignorar o param ou sempre usar a sessão; o vazamento principal de CR foi via `id_franqueado_rel` na página HTML, não neste excel.

---

## Vetores de abuso (cenário)

1. Franqueado (ou sessão vazada) altera `id_franqueado` no link do Excel/PDF de faturamento.
2. Enumera `id_pedido` / `id_nota` / `id_boleto` sequenciais e baixa dados fiscais/financeiros de toda a rede.
3. Usa `id_franqueado_rel` nas listagens para espelhar carteira de outra unidade.
4. (Potencial) Reproduz o mesmo ID em POSTs de status/quitar.

---

## Proteções recomendadas (prioridade)

### P0 — isolamento multi-tenant

1. **Fonte da verdade = sessão**  
   Todo SELECT/arquivo/export deve filtrar por `id_franqueado` (e/ou empresa) da sessão.  
   **Ignorar** `id_franqueado` e `id_franqueado_rel` do client, salvo papel “matriz/admin” com allowlist explícita.

2. **`authorize(recurso, id)` central**  
   Antes de servir pedido, NF, boleto, conta, orçamento, excel, pdf: carregar o dono do recurso e comparar com a sessão. Negar com **403** (não “página vazia de novo registro”).

3. **Audit log** de tentativas cross-tenant (param ≠ sessão) + alerta.

4. Revalidar **todas** as mutações (`status`, `quitar`, `active`, etc.) com a mesma regra.

### P1 — sessão e HTTP

5. Cookie: `HttpOnly; Secure; SameSite=Lax` (ou `Strict` se viável); regenerar `PHPSESSID` no login.  
6. CORS: origin fixo do portal (sem `*`).  
7. CSRF token em POSTs state-changing.  
8. Remover `login_teste.php` e qualquer impersonação de produção.

### P2 — endurecimento

9. Rate-limit / captcha em endpoints por id numérico (anti-enumeração).  
10. Preferir IDs opacos (UUID/hash) em URLs de PDF/boleto.  
11. Headers já presentes (`X-Frame-Options`, `nosniff`) — manter; complementar CSP se possível.  
12. No `portal-api`: nunca aceitar `id_franqueado` de query; sempre o da sessão; remover fallback `'9'`.

---

## Como retestar (caminho inverso / regressão)

Com cookie da franquia A:

```bash
# Deve FALHAR (403/vazio autorizado) para id_franqueado = B
curl -b cookies.txt -o /dev/null -w '%{http_code} %{size_download}\n' \
  'https://franqueado.conectmax.com/franqueado/ajax/faturamento/relatorio_excel.php?id_franqueado=B&page=faturamento&data_inicial=01%2F01%2F2025&data_final=31%2F12%2F2026'

# Deve FALHAR para pedido de outra franquia
curl -b cookies.txt -G \
  --data-urlencode 'page=pedidos_edicao' \
  --data-urlencode 'id_pedido=<id_outra_franquia>' \
  --data-urlencode 'action=visualizar' \
  'https://franqueado.conectmax.com/franqueado/'

# Deve FALHAR NF / boleto de outro tenant
curl -b cookies.txt -o /dev/null -w '%{http_code} %{size_download}\n' \
  'https://franqueado.conectmax.com/franqueado/ajax/notas_fiscais/xml.php?id_nota=<id_outra>'
curl -b cookies.txt -o /dev/null -w '%{http_code} %{size_download}\n' \
  'https://franqueado.conectmax.com/franqueado/ajax/boletos/boleto.php?id_boleto=<id_outro>'
```

Critério de aceite: resposta **não** contém dados de outra franquia; preferencialmente HTTP 403.

---

## Artefatos do teste (máquina local)

Provas brutas geradas em `/tmp/conectmax-sec/` (HTML/Excel/PDF/XML). **Não versionar** — contêm dados reais de clientes e outras franquias. Apagar após análise:

```bash
rm -rf /tmp/conectmax-sec
```

---

## Caminho inverso (este documento)

- Remover o relatório: apagar este arquivo e o link no [`README.md`](README.md).  
- Correção no portal PHP é fora deste repo; este arquivo só documenta o achado e o reteste.
