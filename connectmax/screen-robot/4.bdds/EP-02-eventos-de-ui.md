# BDDs — EP-02 Eventos de UI

**Por quê:** aceite Gherkin das US/SC do épico (fonte: [`../3.scenarios/EP-02-eventos-de-ui.md`](../3.scenarios/EP-02-eventos-de-ui.md)).  
**Índice:** [`README.md`](README.md) · **Plano:** [`../implementation-plan/EP-02-eventos-de-ui.md`](../implementation-plan/EP-02-eventos-de-ui.md).

**US:** US-02..05 · **SC:** SC-04..07.

Cada bloco: Dado / Quando / Então alinhado a Entradas / Execução / Saídas.

---

## US-02 — Evento de boot

```gherkin
Cenário: US-02 Boot do device é sinalizado
  Dado o serial online
  Quando o sistema espera o sinal de boot
  Então o boot é sinalizado
```

### SC-04 — Sinal de boot é recebido

```gherkin
Cenário: SC-04 Sinal de boot é recebido
  Dado o serial online
  Quando o listener aguarda o evento de boot
  Então o boot é sinalizado
```

## US-03 — Evento de app aberta

```gherkin
Cenário: US-03 App aberta é confirmada
  Dado o package em foreground esperado
  Quando o sistema espera a app em foreground
  Então a app aberta está confirmada
```

### SC-05 — App em foreground é confirmada

```gherkin
Cenário: SC-05 App em foreground é confirmada
  Dado o package esperado em foreground
  Quando o sistema aguarda a app aberta
  Então a app está em foreground
```

## US-04 — Evento de tela estável

```gherkin
Cenário: US-04 Tela estável é confirmada
  Dado a app em foreground
  Quando o sistema espera UI estável (sem transição)
  Então a tela está estável
```

### SC-06 — Tela fica estável

```gherkin
Cenário: SC-06 Tela fica estável
  Dado a app em foreground
  Quando o sistema aguarda ausência de transição de UI
  Então a tela está estável
```

## US-05 — Evento de mudança de dump

```gherkin
Cenário: US-05 Dump atualizado fica disponível
  Dado um dump anterior (opcional) e serial online
  Quando o sistema detecta mudança no dump de UI
  Então um dump atualizado está disponível
```

### SC-07 — Dump de UI muda

```gherkin
Cenário: SC-07 Dump de UI muda
  Dado um dump anterior (ou ausência) e serial online
  Quando a hierarquia UI (uiautomator dump) muda em relação ao anterior
  Então um dump atualizado está disponível
```

## Próximos passos

→ [`../implementation-plan/EP-02-eventos-de-ui.md`](../implementation-plan/EP-02-eventos-de-ui.md)
