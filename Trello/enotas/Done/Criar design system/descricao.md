## Objetivo
Criar o **design system** do **e-notas**: tokens e componentes reutilizáveis para a UI do app (scan QR, busca por EAN/nome, lista de preços/lojas).

## Princípio da v1
Só o necessário para construir as telas atuais com consistência. Sem biblioteca monstro; evoluir sob demanda.

## Pré-requisito
Identidade visual v1 (logo, cores, tipografia) definida — usar o card **Criar identidade visual** como base.

## Entrega
- Tokens: cor, tipografia, espaçamento, radius, elevação, ícones
- Componentes base: botão, input, lista/item, card de preço/loja, estados vazios/erro/loading, feedback de scan
- Documentação mínima (HTML ou Storybook leve) com exemplos
- Mapeamento para o stack do app atual (`e-notas/app`)

## Como será feito
1. Partir da identidade visual aprovada
2. Inventariar telas/fluxos existentes (scan, cadastro, busca, detalhe)
3. Definir tokens + componentes usados de fato
4. Documentar + aplicar no app só onde couber sem reescrever tudo

## Fora de escopo (neste card)
- Redesign completo do produto
- Brand book / PDF de marca (fica no card de identidade)
- Biblioteca de ícones custom completa

## Relacionados
- Identidade visual (card irmão neste board)