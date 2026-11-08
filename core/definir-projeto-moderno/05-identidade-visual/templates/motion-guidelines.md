# Motion guidelines — [NOME]

Mapear cada atributo de marca → comportamento → número.

## Princípios

1. Motion explica estado / guia atenção / confirma ação — não decora  
2. Logo settled permanece estável; motion do mark é raro e intencional  
3. Reduced-motion sempre tem alternativa  

## Tokens

| Token | Valor | Uso |
|-------|-------|-----|
| `--dur-instant` | 100ms | Press / toggle |
| `--dur-fast` | 140ms | Hover |
| `--dur-default` | 220ms | Menu / sheet |
| `--dur-slow` | 400ms | Logo reveal / hero |
| `--ease-standard` | … | Default |
| `--ease-emphasized` | … | Entradas |
| `--ease-exit` | … | Saídas |

Ajustar aos adjetivos: *precise* → settles curtos sem overshoot; *playful* → overshoot só em micro-UI, nunca no wordmark settled.

## Logo

| Permitido | Proibido |
|-----------|----------|
| Reveal único no load (≤ [--dur-slow]) | Stretch / squash do mark |
| Idle loop muito sutil (opacity/translate ≤2px) | Rotação contínua / rainbow |
| Morph entre lockup↔icon se geometria compartilhada | Recolor não aprovado |
| End frame = lockup canônico estático | Trigger a cada scroll/hover agressivo |

**Reduced-motion:** mostrar end frame estático imediatamente.

## Coreografia

- Entrance: [direção / stagger?]  
- Exit: [o que sai primeiro]  
- Stagger max: [ms entre itens]  

## Estados UI

loading · success · error · hover · focus — motion **não** é o único sinal (ícone/texto também).

## Entrega

- Lottie/JSON ou Rive + MP4/WebM + GIF + SVG static masters  
- Checklist: contraste, no flash, reduced-motion testado  

Skill: `skills/brand-motion-guidelines/`.
