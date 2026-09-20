# TSK 017 type

| Campo | Valor |
|-------|--------|
| Pasta | `TSK-017-type` |
| TSK | [`TSK-017`](../../7.tasks.md) |
| Origem | US-09 · SC-13 |
| Pai | [`TSK-014`](../README.md) |

## Entradas

- Texto a digitar (ex. dígitos do telefone)
- Frame com o **teclado visível** na imagem
- Opcional: região de atuação `{ x, y, width, height }` (teclados com tamanho/posição fixos)

## Execução

- `handle.type(text, opts?)`:
  1. Captura o **frame** (screenshot)
  2. OCR **só na imagem do teclado** (região opcional se configurada)
  3. Recupera a posição (center) de **cada tecla**
  4. Digita **tocando** cada tecla em sequência (`tap`)
- **Proibido:** `adb input text`, ADBKeyboard/IME inject ou qualquer injeção que não seja tap na imagem

## Saídas

- Texto na UI via taps nas teclas · aceite SC-13
