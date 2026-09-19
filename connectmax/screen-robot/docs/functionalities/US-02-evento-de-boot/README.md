# US-02 — Evento de boot

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Espera e confirma sinal de boot do device.

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial online | Esperar sinal de boot | Boot sinalizado |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-04 | Sinal de boot é recebido | Serial online | Listener aguarda o evento de boot | Boot sinalizado |

## BDD

```gherkin
Funcionalidade: US-02 Evento de boot
  Cenário: Boot do device é sinalizado
    Dado o serial online
    Quando o sistema espera o sinal de boot
    Então o boot é sinalizado
```

### SC-04 Sinal de boot é recebido

```gherkin
Cenário: SC-04 Sinal de boot é recebido
  Dado o serial online
  Quando o listener aguarda o evento de boot
  Então o boot é sinalizado
```

