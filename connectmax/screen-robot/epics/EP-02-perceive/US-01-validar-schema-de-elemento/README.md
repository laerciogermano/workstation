# US-01 — Validar schema de elemento

| Campo | Valor |
|-------|--------|
| ID | US-01 |
| Épico | [EP-02 Perceive](../README.md) |
| Status | Todo |
| Esforço IA | 24m |
| Recorte de | Percepção frame → lista de elementos |

## História

Como agente do screen-robot, quero **validar cada elemento percebido contra um schema**, para garantir que Decide sempre recebe `kind`, `bbox`, `center`, `label`/`text`, `score` e `source` coerentes.

## Cenários

### SC-01 — Elemento válido passa

Quando um Element **cumpre o schema**, então a validação **aceita** sem erro.

### SC-02 — Elemento incompleto falha

Quando faltam `bbox` ou `center`, então a validação **rejeita** com erro explícito.

### SC-03 — kinds conhecidos

Quando `kind` é um dos valores permitidos (`button`, `text`, `image`, `list_item`, `icon`, `unknown`), então o elemento **é aceito**.
