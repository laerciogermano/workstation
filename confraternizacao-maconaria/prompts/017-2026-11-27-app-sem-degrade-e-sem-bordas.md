# 017 — App sem degradê e sem bordas

| Campo | Valor |
|-------|--------|
| Número | 017 |
| Data | 2026-11-27 |

## Prompt original

```
implmrnte conforme o prorotipo, vi muitos degrades, deixe como esta no prototipo
```

Complemento enviado durante a execução:

```
remova as bordas tbm
```

## Interpretação

Tirar do app os degradês (introduzidos na v4) e as bordas, voltando ao acabamento chapado do protótipo anterior, sem mudar a disposição das telas.

## Feito

- `app/web/src/styles.css`: sem degradê, borda, sombra ou linhas decorativas; cores do protótipo v3. Ficam os divisores de lista, o picote do ingresso e o contorno de foco dos campos.
- Roteiro de 75 passos no navegador, em instância separada, passando.
- `prototipo/index.html` não foi alterado.
