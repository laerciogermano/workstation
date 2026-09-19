# Funcionalidades — screen-robot

**Por quê:** capacidades observáveis do robô de tela (sem regras de vendas).  
**Origem:** [visão](../README.md).  
**Planos:** [`plano-percepcao-imagem-hardware.md`](plano-percepcao-imagem-hardware.md) · [`plano-implementacao-percepcao.md`](plano-implementacao-percepcao.md).

## Como usar

- Cada bullet é uma capacidade do robô.
- Critérios de aceite técnicos: BDD nos planos de implementação (`@f0`…`@f4`).
- Negócio ConnectMax (fila, cadência, faturamento) vive em [`../../vendas/`](../../vendas/).

---

## Captura

- Capturar o frame atual da tela do device como PNG + width/height/ts.
- Expor interface `Capture` com backends plugáveis (ADB, agent).

## Percepção (imagem → lista)

- Extrair textos e bboxes via OCR.
- Detectar ícones, botões, fotos e cards via vision.
- Mesclar OCR + vision em uma lista `Element[]` com ids estáveis.
- Validar schema de cada elemento (kind, bbox, center, label/text, score, source).
- Expor CLI `perceive` sobre um PNG (fixture ou frame vivo).
- Gerar overlay de debug opcional sobre o frame.

## Decisão

- Selecionar elemento da lista por label, kind ou índice (matcher).
- Decidir ação via LLM opcional a partir de goal/step em linguagem natural.
- Produzir `Action` tipada: tap, swipe, type, copy_text, shot_region — sem coordenadas hardcoded no goal.

## Atuação

- Executar tap, swipe e type no device via `Actuate` (ADB ou agent).
- Mapear center do elemento para coordenadas do actuator (calibração de resolução).

## Goals e orquestração

- Rodar goals JSON (steps: perceive → choose → act / wait / scroll).
- Aguardar até um elemento aparecer (poll + timeout).
- Rolar lista e re-perceive até achar o alvo.
- Registrar métricas (acerto, latência, custo) por etapa.

## Device / runtime

- Operar no redroid e no emulador Android Studio via ADB.
- Preparar caminho hardware com backend agent sem reescrever Perceive/Decide.

---

## Fora do escopo (este projeto)

- Cadência LinkedIn, fila de leads, distribuição, faturamento, papéis vendedor/gestor/investidor.
- Fechamento de venda.

## Próximos passos

→ Implementar F0–F4 conforme [`plano-implementacao-percepcao.md`](plano-implementacao-percepcao.md)
