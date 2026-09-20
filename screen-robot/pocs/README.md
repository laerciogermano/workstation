# POCs — screen-robot

Provas de conceito e runtimes auxiliares (não são a API Node).

| POC | Descrição |
|-----|-----------|
| [`redroid/`](redroid/README.md) | Android em Docker/Colima — **1 container por `name`**; `reset.sh` / `resetInstance` |
| [`android-studio/`](android-studio/README.md) | Emulador oficial (AVD) |

Código do robô: [`../src/`](../src/README.md).

## Mascarar identidade do aparelho

**Requisito (qualquer vendor):** o Android aparente para apps **não** deve expor o nome/fingerprint do runtime de automação (emulador, container, cloud device, etc.). Deve apresentar-se como **aparelho Android de mercado** (marca, modelo, device), para reduzir sinais de que é robô.

Aplica-se a **todo** `provision.kind` / POC — não é regra de um vendor só.

| O quê | Expectativa |
|-------|-------------|
| `ro.product.brand` / `manufacturer` / `model` / `device` / … | Valores de aparelho comum (ex. Google Pixel, Samsung, …) |
| Nome do vendor do runtime | **Não** deve aparecer em props que apps leem no dia a dia |
| Configuração | Cada POC/vendor documenta *como* aplica (env, AVD config, imagem custom) |

**Limites:** mascara identidade de produto/build; **não** garante bypass de Play Integrity / SafetyNet / attestation de alto nível.

Implementação por vendor:

- Container Docker: [`redroid/README.md`](redroid/README.md#aplicar-mascaramento-neste-vendor)
- AVD / Android Studio: [`android-studio/README.md`](android-studio/README.md#aplicar-mascaramento-neste-vendor)
