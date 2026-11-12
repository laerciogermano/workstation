# 018 — Protótipo de alta fidelidade do sistema

| Campo | Valor |
|-------|--------|
| Data | 2026-11-11 |
| Origem | Chat |

## Prompt original

```text
com base no clozzy/marca/uso-da-marca/manual-uso-marca-clozzy.pdf crie o protipo de alta fidelidade do sistema com base em todo o contexto do clozzy
```

## Interpretação

Último nó da esteira (`docs/prototype.html`): protótipo navegável do site v1, cobrindo as 15 superfícies de [`docs/functionalities.md`](../docs/functionalities.md) (P01–P15), desenhado com as regras do manual de uso da marca (quatro temas, papéis de cor, botão pílula, Gabarito/Figtree, “momentos de cor”) e a voz da marca (“Seu close, seu preço.”, “Entrar no close”, “Pago no Pix. Liberado na hora.”).

Onde o manual e o escopo da v1 divergem, vale o escopo: as telas de app do manual mostram stories e “Mandar mensagem”, mas a visão e `functionalities.md` tiram chat, stories e feed da v1 — o protótipo não tem nenhum dos três.

## Entrega

- [`docs/prototype.html`](../docs/prototype.html) — arquivo único, responsivo (desktop e 390 px), rotas por `#/`, estado no `localStorage`.
- Temas por superfície: app e vitrine no preto; conta, legal e carteira no branco; “Abrir meu close” no roxo (sem rosa); pagamento aprovado no rosa. Landing alterna preto → branco → rosa → preto → roxo → branco → preto (rosa e roxo nunca vizinhos).
- Fluxo canônico P03 → P04 → P05 → P06 funciona de ponta a ponta (Pix com QR, contador de 15 min e botões para simular pago/expirado/falhou).
- Botão “Telas” (canto inferior direito) lista P01–P15 e troca entre visitante, fã (Rafa) e criadora (Lara).
- Depende de `../marca/identidade-nova/fonts/` e `../marca/aplicacoes-v2/fotos/`.
- `user-stories.md`, `bdd.md`, `screens.md`, `screens-bdd.md` e `components.md` continuam a produzir; o protótipo saiu direto de `functionalities.md` + manual.
