# Cenários — EP-03 Instalar APKs

**Por quê:** US e cenários (SC) do épico, expostos via **código Node**.  
**Índice:** [`README.md`](README.md) · **BDDs:** [`../5.bdds/EP-03-instalar-apks.md`](../5.bdds/EP-03-instalar-apks.md).  
**Épico:** [`../2.epics.md`](../2.epics.md) · **Plano:** [`../implementation-plan/EP-03-instalar-apks.md`](../implementation-plan/EP-03-instalar-apks.md).

**US:** US-06 · **SC:** SC-08..10.

---

## US-06 — Instalar APKs

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-08 | Ler versão na config do dispositivo | `device.config.json` | Parsear `apps.*.version` / package | Versão e package alvo |
| SC-09 | Baixar APK na versão definida | Package + versão, ferramenta de download (ex. apkeep) | Baixar APK/XAPK da versão pedida | Artefato APK no disco |
| SC-10 | Instalar pacote no agent | Serial online, caminho do APK | `adb install` (ou equivalente) | Pacote instalado no agent |

## Próximos passos

→ [`../5.bdds/EP-03-instalar-apks.md`](../5.bdds/EP-03-instalar-apks.md) · [`../implementation-plan/EP-03-instalar-apks.md`](../implementation-plan/EP-03-instalar-apks.md)
