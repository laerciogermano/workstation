# AVDs por conta LinkedIn (Clozzy)

SOP para criar um AVD local (Mac) **1:1 com uma caixa `@clozzy.com.br`**, com imagem Google Play e LinkedIn instalado — sem derrubar os AVDs já no ar.

Credenciais das caixas: [`credenciais.md`](../../../../credenciais.md) (§ Caixas `@clozzy.com.br`).

CSV (data, nome, e-mail, status, senha_li, obs): [`contas-linkedin-clozzy.csv`](contas-linkedin-clozzy.csv).  
**Antes → depois:** 5 cols → 6 cols (`senha_li` entre `status` e `obs`); reverter = dropar `senha_li`.

**Antes → depois (Roberta):** CSV `experiencia_longevidade` sem senha → `senha_li=in@12345678` (LI). Rollback: limpar `senha_li` da linha Roberta.

## Inventário atual

| Conta | AVD (`AVD_NAME`) | Porta console (serial) | Notas |
|-------|------------------|------------------------|-------|
| (lab ConnectMax) | `ConnectMax_Cam` | `5554` → `emulator-5554` | baseline / fonte de APKs |
| Jacqueline Lima | `Jacqueline_Lima` | `5556` → `emulator-5556` | **restrita** (pediu nº) |
| Pamela Gomes | `Pamela_Gomes` | `5558` → `emulator-5558` | **restrita** |
| Gabriel Manfred | `Gabriel_Manfred` | `5560` → `emulator-5560` | signup incompleto — **pediu nº** (SMS) |
| Alex Romão | `Alex_Romao` | `5562` → `emulator-5562` | **restrita**; identidade Pixel 4 / flame |
| Fernando Breda | `Fernando_Breda` | `5564` → `emulator-5564` | **restrita**; Pixel 4 / flame; worker `start-worker-fernando.sh` |
| Roberta Machado | `Roberta_Machado` | `5566` → `emulator-5566` | **experiencia_longevidade**; máscara Pixel 4 (`pixel_4`); about+email only-me; medir tempo até restrição |
| Ana Letícia (`teste@`) | `Ana_Leticia` | `5568` → `emulator-5568` | **restrita** (pediu nº); login `teste@clozzy.com.br` |

Convenção: `Nome_Sobrenome` = `First_Last` sem acento; porta = `5554 + 2×índice` (console; ADB usa `porta+1` no protocolo do emulator).

## Pré-requisitos

- `ANDROID_HOME=/opt/homebrew/share/android-commandlinetools`
- Imagem já no SDK: `system-images;android-30;google_apis_playstore;arm64-v8a` (o `setup-avd.sh` instala se faltar)
- Disco livre ≥ 5 GB; RAM host: cada AVD extra ~1–2 GB RSS — **não mate** processos de outros AVDs para liberar espaço
- LinkedIn no lab (`ConnectMax_Cam` ou outro AVD com o app) **ou** splits já em `/tmp/linkedin-apks-*`
- `screen-robot/src/apks/ADBKeyboard.apk` (para signup/type)

## Criar (exemplo: próximo = Gabriel)

```bash
cd screen-robot/pocs/android-studio
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export JAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

# 1) AVD (imagem Play + Pixel 4)
AVD_NAME=Gabriel_Manfred ./scripts/setup-avd.sh

# 2) Escolher porta LIVRE (não usar a de AVDs já rodando)
#    adb devices -l  → portas em uso
PORT=5560

# 3) Subir SEM matar os outros — via Terminal.app (sessão gráfica)
#    1º boot: -wipe-data + -memory 2048 + câmera none (estável com multi-AVD)
osascript <<EOF
tell application "Terminal"
  activate
  do script "export JAVA_HOME=$JAVA_HOME; export ANDROID_HOME=$ANDROID_HOME; export PATH=\\\"\$JAVA_HOME/bin:\$ANDROID_HOME/emulator:\$ANDROID_HOME/platform-tools:\\\$PATH\\\"; emulator -avd Gabriel_Manfred -port $PORT -wipe-data -camera-back none -camera-front none -memory 2048 -cores 2 -gpu swiftshader_indirect -no-snapshot -no-boot-anim -no-audio -no-metrics 2>&1 | tee /tmp/emu-Gabriel_Manfred.log"
end tell
EOF

# 4) Esperar boot (serial = emulator-<PORT>)
SERIAL=emulator-$PORT
for i in $(seq 1 60); do
  boot=$(adb -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
  [[ "$boot" == "1" ]] && break
  sleep 3
done
adb -s "$SERIAL" get-state   # deve ser: device

# 5) LinkedIn: puxar splits de um AVD que já tem o app (não use o XAPK sozinho se o install-multiple dos splits já funciona)
SRC=emulator-5556   # ou 5554
TMP=/tmp/linkedin-apks-novo
rm -rf "$TMP" && mkdir -p "$TMP"
BASE=$(adb -s "$SRC" shell pm path com.linkedin.android | head -1 | sed 's/package://;s|/base.apk||' | tr -d '\r')
for f in base.apk split_config.arm64_v8a.apk split_config.en.apk split_config.xxhdpi.apk; do
  adb -s "$SRC" pull "$BASE/$f" "$TMP/$f"
done
adb -s "$SERIAL" install-multiple "$TMP"/base.apk "$TMP"/split_config.arm64_v8a.apk "$TMP"/split_config.en.apk "$TMP"/split_config.xxhdpi.apk

# 6) ADBKeyboard
adb -s "$SERIAL" install -r ../../src/apks/ADBKeyboard.apk
# IME id (confira com: adb -s $SERIAL shell ime list -a | rg -i adb)
adb -s "$SERIAL" shell ime enable com.android.adbkeyboard/.AdbIME || true

# 7) Conferir
adb -s "$SERIAL" shell pm path com.linkedin.android
```

Atualize a tabela **Inventário** neste arquivo após criar.

## Subir de novo (sem wipe)

Não use `pkill` genérico em `qemu-system`. Só inicie o AVD faltante na porta dele:

```bash
emulator -avd Pamela_Gomes -port 5558 \
  -camera-back none -camera-front none \
  -memory 2048 -cores 2 -gpu swiftshader_indirect \
  -no-snapshot -no-boot-anim -no-audio -no-metrics
```

## Signup LinkedIn (depois do AVD pronto)

```bash
cd screen-robot/src
npm run linkedin-signup -- --device emulator-5558 \
  --firstname Pamela --lastname Gomes \
  --email pamela.gomes@clozzy.com.br \
  --password '<ver credenciais.md>' \
  --job-title 'Especialista em suprimentos e itens corporativos' \
  --company ConectMax
```

## Regras para a IA / operador

1. **Nunca** `pkill`/kill de AVDs que o usuário pediu para manter — se faltou RAM, avise; não derrube os outros.
2. Portas distintas por AVD; `adb devices` antes de escolher a próxima.
3. 1º boot multi-AVD: `-wipe-data`, `-memory 2048`, `-camera-back/front none`.
4. Subir pela sessão gráfica (`Terminal.app` / `osascript`), não só no sandbox do agent (crash frequente).
5. LinkedIn: `install-multiple` dos splits puxados de outro AVD — caminho canônico; XAPK em `src/apks/` é fallback.
6. Documentar a nova linha no inventário deste arquivo no mesmo commit das mudanças de script/README.

## Rollback

- Apagar AVD: `avdmanager delete avd -n Nome_Sobrenome` e remover `~/.android/avd/Nome_Sobrenome.*`
- Parar só um: `pkill -f "qemu-system.*Nome_Sobrenome"` (nome específico — nunca `qemu-system-aarch64` sozinho)
