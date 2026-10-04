# POCs — screen-robot

Runtime canônico (Mac / apps de loja): **Android Emulator / AVD**.

| POC | Descrição |
|-----|-----------|
| [`android-studio/`](android-studio/README.md) | **Canônico** — AVD no host (`provision.kind: "avd"`) |
| [`docker-avd/`](docker-avd/README.md) | **Opcional Linux+KVM** — emulador oficial Google em Docker (`kind: "docker-avd"`); estado em volume + export/import |
| [`redroid/`](redroid/README.md) | Legado — Android container sem GMS útil para loja |

Código do robô: [`../src/`](../src/README.md).

## Mascarar identidade do aparelho

**Requisito (US-22 · SC-28):** o Android aparente para apps **não** deve expor o fingerprint do emulador de automação. Deve apresentar-se como **aparelho Android de mercado** (marca, modelo, device).

| O quê | Expectativa |
|-------|-------------|
| `ro.product.brand` / `manufacturer` / `model` / `device` / … | Valores de aparelho comum (ex. Google Pixel, Samsung, …) |
| Nome do vendor do runtime | **Não** deve aparecer em props que apps leem no dia a dia |
| Configuração | Ver *como* aplicar em [`android-studio/README.md`](android-studio/README.md#aplicar-mascaramento-neste-vendor) |

**Limites:** mascara identidade de produto/build; **não** garante bypass de Play Integrity / SafetyNet / attestation de alto nível.

Implementação:

- AVD / Android Studio: [`android-studio/README.md`](android-studio/README.md#aplicar-mascaramento-neste-vendor)
- docker-avd (Linux): props via imagem Google; ver [`docker-avd/README.md`](docker-avd/README.md)
