# 011 — Protótipo do Super Portal em desktop e celular

| Campo | Valor |
|-------|--------|
| Número | 011 |
| Data | 2026-11-27 |
| Origem | Claude Code |
| Título | Protótipo com todas as funcionalidades, desktop e mobile, com tendências atuais de design |

## Prompt original

```
com base nas refs super-portal/refs e no super-portal/inputs crie o prototipo do super-portal contendo todas as funconalidades, tanto em formato desktop como em formato mobile
```

Complemento durante a execução:

```
pesquise na net o que há de mais moderno de design, tendencias e use para gerar o prottiopo, as telas, as funcionalidaes
```

## Interpretação

Protótipo navegável em HTML puro, no padrão das refs (apresentação, galeria, player, temas, cenários, rastreio), cobrindo os 20 prints do legado, o mapa de processos, a identidade visual e a visão. “Mobile” = web responsiva (app nativo está fora do escopo da visão). Design e funcionalidades informados por pesquisa na web.

## O que foi feito

- [`prototipo/`](../prototipo/README.md): 75 telas em desktop e celular, com estado em memória.
- White-label (3 tenants, claro e escuro), motor de regras, fila “Precisa de você”, portal do cliente e do investidor.
- Links na visão e no índice de docs.
- Verificação em navegador headless: todas as telas nos dois formatos sem erro e sem estouro horizontal; 44 fluxos com clique.
