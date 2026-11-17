# TecnoSpeed — PlugNotas (PlugDFe)

**Fonte:** [tecnospeed.com.br/plugdfe/plugnotas](https://tecnospeed.com.br/plugdfe/plugnotas/)  
**Capturado:** 2026-11-17  
**Para quem:** software houses / ERPs que precisam emitir documentos fiscais sem manter XML, SEFAZ e prefeituras.

## O que é

API REST fiscal da TecnoSpeed: **o software envia JSON de negócio; o PlugNotas emite a nota**.

Cobre montagem do XML, assinatura (certificado A1), transmissão à SEFAZ/prefeitura, webhook de status e download de PDF/XML — sem o ERP lidar com schemas, layouts por estado/município ou NTs.

**É o emissor de DF-e.** Diferente do [SPED XML](tecnospeed-sped-xml.md) (escrituração a partir de XMLs já emitidos) e do **PlugBank** (boleto).

## Documentos suportados

| Documento | Uso |
|-----------|-----|
| **NF-e** (mod. 55) | Produtos / operações — impostos, CC-e, cancelamento, prévia DANFE, consulta DF-e |
| **NFC-e** (mod. 65) | Varejo/PDV — emissão rápida; contingência offline (**NeverStop**) |
| **NFS-e** | Serviço municipal + **Padrão Nacional** (flag); ISS; IBS/CBS |
| **NFCom** | Comunicação (telecom, internet, TV) |
| **MDF-e** | Manifesto de cargas (consolida NF-e/NFC-e/CT-e) |

## Fluxo (assíncrono)

1. App envia JSON (venda/serviço) com `idIntegracao` (idempotência)
2. PlugNotas: cadastro da empresa → numeração → impostos → XML assinado
3. Transmite SEFAZ/prefeitura; devolve **ID + protocolo** na hora
4. Webhook com status final (`CONCLUÍDO` / `REJEITADO` / `CANCELADO`); PDF e XML via GET

Emissão em **lote** (array numa HTTP) também assíncrona.

## Problemas que tira do time

- Labirinto de prefeituras (ABRASF, DSF, +150 sistemas próprios)
- XML, schemas, assinatura A1, layouts por UF
- Reforma Tributária (IBS, CBS, NFS-e Nacional, novos layouts)
- Certificado A1 vencendo sem aviso
- PDV parado quando SEFAZ/internet cai → NeverStop (NFC-e offline)
- Notas destinadas / Ciência da Operação / NSU — gestão automática + webhook

## Reforma Tributária (claims do site)

- NFS-e Nacional com IBS/CBS (NT 1.01+) — ativa no cadastro da empresa
- **Calculadora oficial do governo** integrada (NF-e / NFC-e; NFCom conforme liberação): IBS/CBS item a item no XML
- Monitoramento contínuo de NTs SEFAZ e portarias municipais

## Cobertura (claims)

- NF-e / NFC-e: **todos os estados**
- NFS-e: **+2.200 municípios**
- Multi-CNPJ: um integração, vários clientes (perfis cliente/dev/admin)

## Sandbox / teste

Sandbox público com token fixo (sem cadastro); retornos mockados (não chega SEFAZ). Homologação e produção no mesmo endpoint (troca por config da empresa). Coleção Postman disponível no site.

## Exemplo (NFS-e — site)

```http
POST /nfse
```

```json
{
  "idIntegracao": "nfse-2026-001",
  "prestador": { "cpfCnpj": "29062609000177" },
  "tomador": {
    "cpfCnpj": "12345678000190",
    "razaoSocial": "Empresa ABC"
  },
  "servico": {
    "valor": { "servico": 1500.00 },
    "discriminacao": "Consultoria de software",
    "cnae": "6201501",
    "codigo": "0107"
  }
}
```

## Posição na ConectMax

Candidato a **substituir/encapsular a emissão de NF** do portal (hoje: Notas fiscais no franqueado) se a Conect quiser API JSON única multi-documento em vez de stack própria SEFAZ/prefeitura.

Relacionados:

- SPED (pós-emissão): [`tecnospeed-sped-xml.md`](tecnospeed-sped-xml.md)
- Portal NF / CR: [`../connectmax/docs/portal-franqueado.md`](../connectmax/docs/portal-franqueado.md)
- Mapa Notas fiscais: [`../connectmax/docs/portal-mapa/README.md`](../connectmax/docs/portal-mapa/README.md)

## Contato

- comercial@tecnospeed.com.br · atendimento@tecnospeed.com.br  
- 0800 006 9500 · Maringá–PR · CNPJ 08.187.168/0001-60
