# POCs — screen-robot

Runtime do ConnectMax: **Android Emulator / AVD**.

| POC | Descrição |
|-----|-----------|
| [`android-studio/`](android-studio/README.md) | **Único runtime documentado** — AVD (`provision.kind: "avd"`); scripts start/stop/wait-boot; `reset.sh` planejado |

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
