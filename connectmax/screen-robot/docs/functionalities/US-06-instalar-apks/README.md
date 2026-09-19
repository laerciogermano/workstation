# US-06 — Instalar APKs

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Baixa (versão na config) e instala pacotes no agent.

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Agent provisionado, lista de apps e versões na config | Ler versão, baixar e instalar cada pacote | Apps instalados nas versões definidas |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-08 | Ler versão na config do dispositivo | `device.config.json` | Parsear `apps.*.version` / package | Versão e package alvo |
| SC-09 | Baixar APK na versão definida | Package + versão, ferramenta de download (ex. apkeep) | Baixar APK/XAPK da versão pedida | Artefato APK no disco |
| SC-10 | Instalar pacote no agent | Serial online, caminho do APK | `adb install` (ou equivalente) | Pacote instalado no agent |

## BDD

```gherkin
Funcionalidade: US-06 Instalar APKs
  Cenário: Apps da config ficam instalados na versão definida
    Dado o agent provisionado e a lista de apps/versões na config
    Quando cada pacote é lido, baixado e instalado
    Então os apps estão instalados nas versões definidas
```

### SC-08 Ler versão na config do dispositivo

```gherkin
Cenário: SC-08 Versão e package são lidos da config
  Dado o arquivo device.config.json
  Quando apps.*.version e package são parseados
  Então a versão e o package alvo estão disponíveis para download
```

### SC-09 Baixar APK na versão definida

```gherkin
Cenário: SC-09 APK da versão pedida é baixado
  Dado package, versão e ferramenta de download (ex. apkeep)
  Quando o download da versão definida é executado
  Então o artefato APK/XAPK existe no disco
```

### SC-10 Instalar pacote no agent

```gherkin
Cenário: SC-10 Pacote é instalado no agent
  Dado serial online e caminho do APK
  Quando adb install (ou equivalente) é executado
  Então o pacote está instalado no agent
```

