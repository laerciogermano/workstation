# BDDs — EP-03 Instalar APKs

**Por quê:** aceite Gherkin das US/SC do épico (fonte: [`../4.scenarios/EP-03-instalar-apks.md`](../4.scenarios/EP-03-instalar-apks.md)).  
**Índice:** [`README.md`](README.md) · **Plano:** [`../implementation-plan/EP-03-instalar-apks.md`](../implementation-plan/EP-03-instalar-apks.md).

**US:** US-06 · **SC:** SC-08..10.

Cada bloco: Dado / Quando / Então alinhado a Entradas / Execução / Saídas.

---

## US-06 — Instalar APKs

```gherkin
Cenário: US-06 Apps da config ficam instalados na versão definida
  Dado o agent provisionado e a lista de apps/versões na config
  Quando cada pacote é lido, baixado e instalado
  Então os apps estão instalados nas versões definidas
```

### SC-08 — Ler versão na config do dispositivo

```gherkin
Cenário: SC-08 Versão e package são lidos da config
  Dado o arquivo device.config.json
  Quando apps.*.version e package são parseados
  Então a versão e o package alvo estão disponíveis para download
```

### SC-09 — Baixar APK na versão definida

```gherkin
Cenário: SC-09 APK da versão pedida é baixado
  Dado package, versão e ferramenta de download (ex. apkeep)
  Quando o download da versão definida é executado
  Então o artefato APK/XAPK existe no disco
```

### SC-10 — Instalar pacote no agent

```gherkin
Cenário: SC-10 Pacote é instalado no agent
  Dado serial online e caminho do APK
  Quando adb install (ou equivalente) é executado
  Então o pacote está instalado no agent
```

## Próximos passos

→ [`../implementation-plan/EP-03-instalar-apks.md`](../implementation-plan/EP-03-instalar-apks.md)
