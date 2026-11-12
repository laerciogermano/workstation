## Objetivo
Identificar e documentar os **melhores serviços de exposição de imagens corporativas** (headshot B2B) para prospecção LinkedIn / vendedores ConectMax — ranqueados pelos critérios dos prompts anteriores (realismo + fit recrutador de vendas).

## Critérios (prompts anteriores)
- Foto **bem realista** (câmera real > IA fotorealista)
- Headshot corporativo alinhado ao `avatar_style` das personas (blazer / polo / fundo limpo)
- Licença ok para download + uso em perfil
- **Não** scrapear fotos reais de LinkedIn/empresas

## Ranking (aprovado nos prompts)

1. **Unsplash — business headshot** (aprovado pelo usuário)
   - https://unsplash.com/pt-br/s/fotografias/business-headshot
   - Foto real; licença Unsplash (comercial OK). Caveat: direito de imagem da pessoa.

2. **Pexels — business portrait** (aprovado pelo usuário — “mto bom”)
   - https://www.pexels.com/search/business%20portrait/
   - Foto real; Pexels License (comercial OK). Mesmo caveat de imagem.

3. **This Person Does Not Exist**
   - https://thispersondoesnotexist.com/
   - StyleGAN fotorealista; pool local em `screen-robot/src/assets/avatars/thispersondoesnotexist/`. Filtrar artefatos.

4. **Generated.photos**
   - https://generated.photos/faces
   - IA fotorealista; free = não-comercial + atribuição — preferir pago/API se uso comercial.

5. **Open Pravatar** (secundário)
   - https://openpravatar.com/
   - Sintético + API; comercial OK; realismo abaixo de Unsplash/Pexels.

## Por persona
- **Mariana** (consultiva): Unsplash/Pexels — mulher, blazer, sorriso acolhedor, fundo cinza/pastel
- **Carlos** (KAM técnico): Unsplash/Pexels — homem, blazer/camisa social, postura séria, fundo escritório
- **Lucas** (inside sales): Pexels/Unsplash — polo/business casual, sorriso energético, open space

## Aceite
- Fontes documentadas e ranqueadas no card
- Curadoria/pool baixado (ou links) por persona, com licença anotada
- Atualizar `screen-robot/src/assets/avatars/fontes-avatar.md` com o ranking final

## Relacionados
- Personas: https://trello.com/c/WAZ9CciT
- Lista vendedores + aparência: https://trello.com/c/1KXbnbBZ
- Empresas BR (experiência): https://trello.com/c/W1XpTjvv
- Fontes: `screen-robot/src/assets/avatars/fontes-avatar.md`