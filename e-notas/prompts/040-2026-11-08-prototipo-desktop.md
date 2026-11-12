# 040 — Protótipo web desktop (mesmo modelo)

| Campo | Valor |
|-------|--------|
| Número | 040 |
| Data | 2026-11-08 |
| Origem | Claude Code (workstation) |
| Título | Protótipo desktop no mesmo modelo do celular |

## Prompts originais

```
na pagina de produtos, deixe o grafico de linhas em cima de comparacao
```
```
agora crie o prototipo desktop
```
```
web desktop no mesmo modelo
```

## Entrega

- T-14: histórico (gráfico de linha) acima da comparação
- `beta-docs/prototipos/v2/js/desktop.js`: 18 telas D-xx em quadro de navegador 1440×900, mesmos dados/estado/regras/temas/cenários
- Home desktop no mesmo modelo: seções da altura da janela, 2 linhas de cards com rolagem horizontal, chips + setas, roda = uma seção
- Celular ↔ desktop: botão “Ver no desktop/celular” (tecla `D`); navegação a partir de tela D-xx mapeia destinos de celular para o equivalente
- REQ-057
