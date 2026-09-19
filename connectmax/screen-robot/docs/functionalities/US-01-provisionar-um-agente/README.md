# US-01 — Provisionar um agente

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Sobe/conecta o Android e deixa o device pronto para ADB.

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Config do device (`device.config.json`), runtime Android disponível | Orquestrar subir/conectar, serial online e boot completo | Agent pronto para ADB (serial online, boot ok) |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-01 | Subir / conectar o Android (agent) | Host, imagem/runtime, script de start | Subir o agent e estabelecer conexão | Processo do agent em execução e alcançável |
| SC-02 | Garantir serial ADB online | Agent alcançável, serial esperado na config | `adb connect` / listar devices até serial `device` | Serial ADB online |
| SC-03 | Aguardar boot completo | Serial online | Poll de boot/sys.boot_completed (ou equivalente) | Device com boot completo |

## BDD

```gherkin
Funcionalidade: US-01 Provisionar um agente
  Cenário: Agent fica pronto para ADB
    Dado a config do dispositivo (device.config.json) e o runtime Android disponíveis
    Quando o provisionamento sobe/conecta o agent, garante serial online e aguarda boot completo
    Então o agent está pronto para ADB (serial online e boot ok)
```

### SC-01 Subir / conectar o Android (agent)

```gherkin
Cenário: SC-01 Agent sobe e fica alcançável
  Dado host, imagem/runtime e script de start
  Quando o agent é iniciado e a conexão é estabelecida
  Então o processo do agent está em execução e alcançável
```

### SC-02 Garantir serial ADB online

```gherkin
Cenário: SC-02 Serial ADB fica online
  Dado o agent alcançável e o serial esperado na config
  Quando adb connect / listagem de devices é repetida até o serial aparecer como device
  Então o serial ADB está online
```

### SC-03 Aguardar boot completo

```gherkin
Cenário: SC-03 Boot completo no device
  Dado o serial ADB online
  Quando o sistema faz poll de boot (ex. sys.boot_completed)
  Então o device reporta boot completo
```

