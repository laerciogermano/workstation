# Postmortem — runtime Android (redroid → Android Studio)

**Quando:** set/2026  
**Contexto:** automação de apps de loja (LinkedIn, Instagram, Tinder) no screen-robot.  
**Decisão:** runtime canônico = **AVD / Android Studio** ([`pocs/android-studio/`](pocs/android-studio/README.md)). Detalhe técnico: [`implementation-plan/EP-01-provisionar-agente.md`](implementation-plan/EP-01-provisionar-agente.md#decisões-de-runtime-avd).

---

## O que tentamos

Usar **redroid** (Android em Docker/Colima) como runtime padrão: barato de subir, fácil de resetar (`down -v`), multi-agent por container.

---

## Problemas com o redroid

| Problema | Efeito |
|----------|--------|
| **Sem Google Play Services (GMS)** | LinkedIn / Instagram / Tinder sobem a Activity, mas a UI não pinta de verdade |
| **GPU só software** (`guest` / SwiftShader) | Compose/Flutter/filmes falham ou ficam em branco |
| **Tela branca** | Status/nav OK; miolo vazio — Activity viva, conteúdo não renderiza |
| **Tela/print preto** | Em login, frequentemente `FLAG_SECURE` (captura bloqueada) **ou** falha de render; misturava com “app quebrado” |
| **ABI / imagens** | APKs arm64-only vs imagens incompletas; Tinder da loja Huawei vs GMS |
| **Colima no Mac** | Disco/VM pesados; binderfs; disco cheio derrubava o host e o AVD |
| **Custo de debug** | Sintoma genérico (branco/preto) escondia causa (GMS/GPU), atrasava o piloto |

O que **funcionava** no redroid: provision ADB, install de alguns APKs, telas muito simples (ex. diálogo ALLOW do sistema). O que **não** sustentava o produto: fluxos reais de apps de loja.

---

## Por que Android Studio (AVD)

| Critério | AVD com **Google APIs / Play Store** |
|----------|--------------------------------------|
| GMS | Presente — auth, maps, serviços que as apps esperam |
| GPU | Aceitável no Apple Silicon (melhor que SwiftShader puro no container) |
| Compatibilidade | Caminho oficial para desenvolver/testar apps Play |
| Observabilidade | Janela nativa do emulator; serial `emulator-5554` estável |
| Reset | `scripts/reset.sh` (`-wipe-data`) alinhado a `resetInstance` |

**Trade-off aceito:** multi-agent fica mais pesado (vários AVDs) do que N containers; priorizamos UI real das apps de loja.

---

## Lições

1. Runtime de automação de **apps de loja** ≠ runtime “Android mínimo em container”.
2. Tela branca/preta deve ser diagnosticada como **GMS / GPU / FLAG_SECURE**, não só “bug do script”.
3. Documentar a decisão no plano (EP-01) e no postmortem evita voltar ao redroid por inércia.
4. Disco no Mac é pré-requisito do AVD (≥ ~8 GB livres); Colima+redroid + AVD juntos esgotam o volume.
5. **Tinder Huawei vs Play:** APKPure costuma entregar só `armeabi-v7a` (não instala no AVD `arm64-v8a`). A App Gallery Huawei entrega arm64, mas o Location Kit falha no AVD Google com **10808 AGC_CHECK_FAIL** (“Unable to fetch location…”). Mitigação: XAPK **universal GMS** (ex. APKCombo, com split `arm64-v8a`) em `apks/com.tinder.xapk` + `geo fix` antes do launch.

---

## Estado atual

- Docs e config: `provision.kind: "avd"` · [`pocs/android-studio/`](pocs/android-studio/README.md)
- `pocs/redroid/`: legado (stub) — não é runtime do ConnectMax
- Código JS pode ainda ter referências internas a `redroid`; produto documentado é só AVD
