# US-11 — screenshot

**Índice:** [`../README.md`](../README.md) · **Tasks:** [`../../tasks.md`](../../tasks.md) · **BDD:** abaixo

Capturar frame da tela.

## Entradas · Execução · Saídas

| Entradas | Execução | Saídas |
|----------|----------|--------|
| Serial, path de saída | Capturar frame da tela | Arquivo de imagem |

## Cenários

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-15 | Print da tela é salvo | Serial, path de saída | Capturar screenshot | Arquivo de imagem no path |

## BDD

```gherkin
Funcionalidade: US-11 screenshot
  Cenário: Frame da tela é capturado
    Dado serial e path de saída
    Quando o frame da tela é capturado
    Então o arquivo de imagem existe
```

### SC-15 Print da tela é salvo

```gherkin
Cenário: SC-15 Print da tela é salvo
  Dado serial e path de saída
  Quando screenshot é capturado
  Então o arquivo de imagem existe no path
```

