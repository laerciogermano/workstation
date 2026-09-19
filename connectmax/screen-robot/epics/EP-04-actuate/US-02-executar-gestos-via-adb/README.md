# US-02 — Executar gestos via ADB

| Campo | Valor |
|-------|--------|
| ID | US-02 |
| Épico | [EP-04 Actuate](../README.md) |
| Status | Todo |
| Esforço IA | 24m |
| Recorte de | Atuação no device |
| Depende de | [US-01](../US-01-definir-contrato-de-atuacao/README.md) |

## História

Como agente do screen-robot, quero **executar tap, swipe e type via ADB**, para manipular o redroid/emulador a partir das Actions do Decide.

## Cenários

### SC-01 — Tap

Quando Action é **tap(x,y)**, então o device **recebe** `input tap` nessas coordenadas.

### SC-02 — Swipe

Quando Action é **swipe**, então o device **recebe** gesto com duração configurável.

### SC-03 — Type (unicode)

Quando Action é **type** com acentos, então o texto **é inserido** (ADBKeyBoard / caminho já suportado no android-control).
