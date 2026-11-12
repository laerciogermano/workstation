# 021 — Temas no protótipo mobile (padrão notinhas)

| Campo | Valor |
|-------|--------|
| Data | 2026-11-11 |
| Origem | Chat |

## Prompt original

```text
crie da mesma forma do notinhas crie tbm temas no clozzy
```

## Interpretação

Repetir o sistema de temas de `e-notas/beta-docs/prototipos/v2`: seção “Temas para escolher” com cards (amostras, descrição, duas telas em miniatura escolhidas por chips, “Usar este tema”), bolinhas de tema no hero, seletor ao lado do celular no modo navegável, tecla T, escolha salva no navegador e troca com View Transition. Os temas ficam dentro da paleta fechada da marca (rosa, Pink Deep, roxo, preto #000, branco) e das regras de combinação: nada preto no rosa, rosa e roxo nunca um sobre o outro, símbolo Pink Deep no claro.

## Entrega

- [`docs/prototipo-mobile/index.html`](../docs/prototipo-mobile/index.html): 6 temas (Preto + rosa · atual, Preto + roxo, Branco + rosa, Branco + roxo, Rosa total, Roxo total). As telas viraram variáveis (`--tx`, `--pb`, `--ac`, `--act`, `--cta`, `--cr`…) por `data-t` em cada `.scr`; telas de foto/câmera (`t-foto`) e de momento (`t-branco`, `t-roxo`, `t-rosa`) não mudam. Link direto: `?tema=rosa#T-41`.
- PDF regerado com a página de temas (14 páginas).
