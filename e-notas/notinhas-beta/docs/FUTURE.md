# Explorações futuras

## NFC-e de outros estados (além do PR)

Hoje a ingestão é **SEFAZ-PR** (`sefaz-pr.adapter`, allow-list `fazenda.pr.gov.br`, RN-01).

Cada UF tem SEFAZ própria, URL de autorização e regras de validação distintas; o layout nacional do XML é parecido, mas o HTML/consulta pública e o parser não são plug-and-play. Expandir = porta por UF (URL + fetch + parse) sem misturar regras no mesmo adapter.
