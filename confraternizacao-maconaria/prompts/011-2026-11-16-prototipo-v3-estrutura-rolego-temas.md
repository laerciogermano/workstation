# 011 — Protótipo v3: estrutura do protótipo RoleGo, temas, sem preto

| Campo | Valor |
|-------|--------|
| Número | 011 |
| Data | 2026-11-16 |

## Prompt original

```
nao faca preto, faca com diferentes temas, e faca no estilo do rolego o prototipo
```

Complemento enviado durante a execução:

```
nao o estio, mas o padrao de estrutura
```

## Interpretação

Seguir o padrão de estrutura de `role-go/beta/docs/prototipos/index.html` (galeria de telas por fluxo com códigos T-xx, casos de uso e setas; modo navegável com lista, celular e notas; atalhos ← → Backspace H Esc; abrir tela pela URL), sem copiar o visual do RoleGo. Tirar o preto (modo escuro e moldura) e oferecer vários temas.

## Feito

- `prototipo/index.html` v3; v2 guardada em `prototipo/v2/index.html`.
- Galeria: 6 fluxos (Acesso, Eventos, Inscrições, Chat, Menu e conta, Organização), 20 telas T-01 a T-52, cada uma com CU da visão.
- Modo navegável: lista de telas | celular interativo | notas (código, nome, CU, regras) + atalhos; `#T-xx` abre a tela.
- Temas: Bordô (padrão GOP), Azul, Dourado e Marinho (escuro em azul-marinho, sem preto). Moldura do celular clara. O modo escuro automático pelo sistema foi removido.
- Publicado na mesma URL: https://claude.ai/artifact/WMtjucnpRCA19myY7mskVQ
