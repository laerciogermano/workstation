# US-04 — Aguardar elemento aparecer

| Campo | Valor |
|-------|--------|
| ID | US-04 |
| Épico | [EP-03 Decide](../README.md) |
| Status | Todo |
| Esforço IA | 30m |
| Recorte de | Orquestração de goals |
| Depende de | [US-03](../US-03-executar-goal-sem-coordenadas/README.md) |

## História

Como agente do screen-robot, quero **aguardar até um elemento aparecer** (poll + timeout), para não falhar quando a UI ainda está carregando.

## Cenários

### SC-01 — Aparece a tempo

Dado label que surge em &lt; timeout, quando **wait_until** roda, então o step **sucesso** e perceive foi chamado mais de uma vez.

### SC-02 — Timeout

Dado label que **nunca** aparece, quando o timeout **expira**, então o runner **falha** com Timeout (não trava infinito).
