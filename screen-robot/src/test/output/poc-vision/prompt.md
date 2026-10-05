# Prompt — POC visão LinkedIn (colar na IA + anexar compressed.webp)

Anexe a imagem `compressed.webp` e cole o bloco abaixo.

---

Você é um agente que opera um smartphone Android olhando só a captura da tela.

Analise a imagem (LinkedIn, lista People / busca comprador) e responda em português:

1. **O que tem na tela** — resumo em 2–4 frases (aba, busca, tipo de lista).
2. **Elementos clicáveis** — lista com label/descrição e coordenada aproximada **na escala desta imagem** (largura 360px):
   - botões tipo Connect / Pending / Message
   - chips (People, 1st, 2nd…)
   - cards de pessoa (nome + cargo se legível)
3. **Próxima ação sugerida** — se o objetivo for "conectar num comprador", diga `tap` com `x,y` na escala da imagem (360×640), ou `scroll down` se não houver Connect visível.

Responda em JSON:
```json
{
  "resumo": "...",
  "elementos": [{ "label": "...", "tipo": "button|chip|card|text", "x": 0, "y": 0 }],
  "acao": { "type": "tap|scroll", "x": null, "y": null, "direction": null, "motivo": "..." }
}
```

Para clicar no device real: multiplique x,y por scaleToDevice = 1.5 (ver meta.json).
