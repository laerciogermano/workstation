# 043 — Botão de tema com bolinha (como no protótipo)

| Campo | Valor |
|-------|--------|
| Número | 043 |
| Data | 2026-11-09 |
| Origem | Claude Code (workstation) |
| Título | Seletor de tema por bolinha no app `notinhas-beta` |

## Prompt original

```
crie um  botao conforme no prototipo om umabolinha para escolher o tema
```

## Entrega

- `notinhas-beta/apps/web/src/ui/ThemePicker.tsx`: botão-bolinha (metade cor de ação, metade cor de menor preço, como `.tdot` do protótipo v2) que abre a lista dos 6 temas (Popover API: Esc/toque fora fecham).
- No topo da home (celular), na barra lateral (desktop) e no Perfil (fileira de bolinhas).
- 6 temas do protótipo em `styles/tokens.css`; troca com View Transition (círculo), respeita movimento reduzido; escolha salva no aparelho; sem escolha segue o sistema (escuro = preto).
- REQ-060.
