# Lib — controle do device (IA)

Único arquivo que a IA precisa. Cwd: `screen-robot/src`. Sem `adb`, sem script JS, sem print, sem `ui_stable`. Loop: extract → decidir → uma ação → extract.

Serial: `device.config.json` (`provision.serial` / `device`). Override: `--device SERIAL`.

Stdout de toda ação: JSON `{ ok, action, serial, result }`. Extract também: `engine`, `icons`.

---

## Loop

1. `npm run extract -- --engine all --icons true` (ícones da UI sem OCR)
2. Se textos de loading (`Loading`, `…`, tela vazia) → `npm run wait -- 1500` e extract de novo
3. Decidir pelo `result`: `text` (tem `text`) ou `icon` (só `x,y`)
4. Uma ação (`tap` / `type` / `scroll` / `launch` / `key`)
5. Extract de novo até o objetivo

`type`: escrever o texto inteiro de uma vez; só depois extract para conferir.

---

## Ações

### `extract`

```bash
npm run extract
npm run extract -- --engine all --icons true
npm run extract -- --icons
npm run extract -- --no-icons
npm run extract -- --engine rapidocr --icons false
```

| Flag / env | Default | Efeito |
|------------|---------|--------|
| `--engine all\|rapidocr\|macos-vision\|tesseract\|paddleocr\|easyocr` | `all` (CLI) | OCR |
| `--icons` / `--icons true\|1\|on\|yes` | off | anexa blobs `{ type:"icon", x, y }` no fim |
| `--icons false\|0\|off\|no` / `--no-icons` | | só OCR |
| `SCREEN_ROBOT_ICONS=1` | | mesmo que `--icons true` se a flag não vier |

`text`: `{ type, text, x, y }`. `icon`: `{ type, x, y }` — sem `text`, sem crop, sem IA. Blob que já contém um hit OCR é omitido. Falha de blob → só textos. Tap sempre em `x,y`.

```json
{
  "ok": true,
  "action": "extract",
  "serial": "emulator-5554",
  "engine": "all",
  "icons": true,
  "result": [
    { "type": "text", "text": "People", "x": 360, "y": 120 },
    { "type": "icon", "x": 80, "y": 140 }
  ]
}
```

Ícone = Search, overflow, avatar, Connect gráfico. Sem `--icons` a lista não tem esses pontos.

---

### `find`

```bash
npm run find -- "Sign in with Email"
```

`result`: `{ elements, score, text, x, y }` ou `null`.

---

### `tap`

```bash
npm run tap -- 360 640
```

---

### `type`

```bash
npm run type -- "Campinas"
```

Campo já focado. Default ADB (texto inteiro). Proibido tap tecla a tecla.

---

### `scroll`

```bash
npm run scroll -- down
npm run scroll -- up
```

`down` = ver itens abaixo.

---

### `launch`

```bash
npm run launch -- linkedin
npm run launch -- com.linkedin.android
```

Alias em `device.config.json` → `apps.<nome>.package` (`linkedin`, `instagram`, `tinder`, `gmail`).

---

### `key`

```bash
npm run key -- KEYCODE_BACK
npm run key -- KEYCODE_HOME
npm run key -- KEYCODE_ENTER
npm run key -- KEYCODE_DEL
```

Shade/notificação aberta → `KEYCODE_BACK`.

---

### `wait`

```bash
npm run wait -- 1500
```

Só se o extract indicar loading. Sem `on` / `ui_stable`.

---

## Flag extra

`--device emulator-5554` · `--engine all|rapidocr|macos-vision|tesseract|paddleocr|easyocr` · `--icons` / `--icons true|false` / `--no-icons` · `--method adb|ocr` (só `type`) · `--config path`

---

## Proibido

- `adb …`
- `npm run print` / screenshot para analisar imagem
- `on({ event: "ui_stable" })`
- arquivo JS / `node -e`
- outro arquivo deste repo além deste README

---

## Packages úteis

| Alias | Package |
|-------|---------|
| `linkedin` | `com.linkedin.android` |
| `instagram` | `com.instagram.android` |
| `tinder` | `com.tinder` |
| `gmail` | `com.google.android.gm` |

Launcher/home: `npm run key -- KEYCODE_HOME`

---

## Antes → depois

Antes: IA importava `lib/*.js` ou usava `cli.js` (adb cru). Depois: `npm run <acao>` → [`run-action.js`](run-action.js) → `extract` / `operate`. Ícones: sempre on → opt-in `--icons true` (default só OCR). Rollback: `"run": "node cli.js"`; omitir `--icons`.
