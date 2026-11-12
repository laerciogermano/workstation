# 038 — Opções de tema no protótipo v2.0

| Campo | Valor |
|-------|--------|
| Número | 038 |
| Data | 2026-11-08 |
| Origem | Claude Code (workstation) |
| Título | Temas com combinações de cores para escolher |

## Prompt original

```
crie opcoes de temas para esoclhermos e vermos qual fica melhor com diferntes combinacoes de cores
```

## Entrega

- 6 temas em `beta-docs/prototipos/v2/styles.css` (`[data-theme]`): Institucional (atual), Escuro, Petróleo + lima, Grafite + esmeralda, Feira (laranja + verde), Papel de nota
- Cores fixas do app viraram tokens `--nt-*` (mapa, barras, skeleton, logo V9, vidro); preto da câmera/toast mantido
- Seção “Temas para escolher” com as mesmas telas lado a lado em cada tema (até 2 telas escolhidas), bolinhas de tema no topo e linha “Tema” nos cenários do modo navegável; escolha salva no navegador
- REQ-055
