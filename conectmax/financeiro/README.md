# Financeiro — ConectMax

Contas, crédito, faturamento, indicadores e **provedores** de emissão fiscal / cobrança.

| Artefato | Papel |
|----------|--------|
| [`tecnospeed-plugnotas.md`](tecnospeed-plugnotas.md) | PlugNotas — API JSON que emite NF-e, NFC-e, NFS-e, NFCom, MDF-e |
| [`tecnospeed-sped-xml.md`](tecnospeed-sped-xml.md) | SPED XML — gera SPED a partir dos XMLs (pós-emissão) |
| [`../extratos/README.md`](../extratos/README.md) | Extratos bancários (Inter) |
| [`../portal-api/README.md`](../portal-api/README.md) | Portal: faturas, NF, boletos |
| `certificado/` (gitignored) | A1 e-CNPJ CWB — `Certificado Digital - CNPJ CWB.pfx` + `senha.txt`. CNPJ `62248210000150`, válido até 2027-09-14. Fora do git. |
| [`sebrae-listar-notas.mjs`](sebrae-listar-notas.mjs) | Lista NF do Emissor Sebrae via `POST …/v1/NewInvoice/GetPagedList` (auth do Chrome Germano CDP `:9230`) |

**Linha TecnoSpeed (resumo):** PlugNotas = emitir nota · SPED XML = escriturar · PlugBank = boleto. Portal hoje: NF + CR → `ajax/boletos/*`.

### Sebrae — listar notas

```bash
# Chrome Germano logado em emissornfe.sebrae.com.br (CDP :9230)
node conectmax/financeiro/sebrae-listar-notas.mjs
node conectmax/financeiro/sebrae-listar-notas.mjs 2   # página 2
```

**Antes → depois:** só UI `#/invoice` → script lê token no CDP e imprime JSON. **Rollback:** apagar `sebrae-listar-notas.mjs` + linha da tabela acima.
