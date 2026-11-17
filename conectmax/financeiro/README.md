# Financeiro — ConectMax

Contas, crédito, faturamento, indicadores e **provedores** de emissão fiscal / cobrança.

| Artefato | Papel |
|----------|--------|
| [`tecnospeed-plugnotas.md`](tecnospeed-plugnotas.md) | PlugNotas — API JSON que emite NF-e, NFC-e, NFS-e, NFCom, MDF-e |
| [`tecnospeed-sped-xml.md`](tecnospeed-sped-xml.md) | SPED XML — gera SPED a partir dos XMLs (pós-emissão) |
| [`../extratos/README.md`](../extratos/README.md) | Extratos bancários (Inter) |
| [`../portal-api/README.md`](../portal-api/README.md) | Portal: faturas, NF, boletos |

**Linha TecnoSpeed (resumo):** PlugNotas = emitir nota · SPED XML = escriturar · PlugBank = boleto. Portal hoje: NF + CR → `ajax/boletos/*`.
