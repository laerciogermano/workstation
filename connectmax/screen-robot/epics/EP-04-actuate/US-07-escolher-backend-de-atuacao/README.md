# US-07 — Escolher backend de atuação

| Campo | Valor |
|-------|--------|
| ID | US-07 |
| Épico | [EP-04 Actuate](../README.md) |
| Status | Todo |
| Esforço IA | 24m |
| Recorte de | Atuação no device |
| Depende de | [US-02](../US-02-executar-gestos-via-adb/README.md), [US-06](../US-06-executar-gestos-via-agent/README.md) |

## História

Como operador do screen-robot, quero **escolher o backend de atuação** (`adb` ou `agent`) por configuração, para alinhar Capture e Actuate no mesmo ambiente.

## Cenários

### SC-01 — Factory ADB

Dado `BACKEND=adb`, quando a factory **monta Actuate**, então a instância é **AdbActuate**.

### SC-02 — Factory agent

Dado `BACKEND=agent`, quando a factory **monta Actuate**, então a instância é **AgentActuate**.

### SC-03 — Regressão smoke

Quando **troco o backend**, então o smoke tap (ou mock) **continua passando** com o mesmo goal.
