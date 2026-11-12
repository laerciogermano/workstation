## Objetivo
Partir da **lista de 12 vendedores** e, para cada um, buscar no Unsplash uma foto **business headshot** mais condizente com a aparência/`avatar_style`, depois gerar um **novo documento** a partir do último playbook de vendedores (v1).

## Fonte Unsplash
https://unsplash.com/pt-br/s/fotografias/business-headshot

## Dependências
- Lista vendedores: https://trello.com/c/1KXbnbBZ
- CSV: `screen-robot/tasks/6ae9ca1e215a10fb339d26e4/vendedores.csv`
- PDF base (último gerado): `screen-robot/tasks/6ae9ca1e215a10fb339d26e4/reports/Vendedores-avatares.pdf`
- Fontes avatar: https://trello.com/c/NCDEjRXo · `screen-robot/src/assets/avatars/fontes-avatar.md`

## Escopo
1. Ler os 12 vendedores (`v01`–`v12`) com `aparencia` / `avatar_style` / persona.
2. Para cada um: buscar e baixar 1 foto Unsplash (business headshot) que melhor case gênero, faixa etária, vestimenta (blazer/polo), expressão e fundo.
3. Registrar por vendedor: URL Unsplash, autor, licença, path local da foto.
4. Atualizar `avatar_file` (e anotar fonte Unsplash) sem scrapear LinkedIn.
5. Gerar **novo documento** (PDF v2) a partir do playbook atual, trocando as fotos TPDNE pelas do Unsplash e mantendo estudo + checklist + perfis.

## Aceite
- 12 fotos Unsplash atribuídas (1 por vendedor), condizentes com a descrição
- Metadados de fonte/licença por foto
- Novo PDF (v2) derivado de `Vendedores-avatares.pdf`, com as novas fotos
- Anexos no card (CSV atualizado + PDF v2)

## Fora de escopo
- Criar contas LinkedIn neste card
- Scrapear fotos de pessoas reais no LinkedIn

## Relacionados
- Vendedores (lista + PDF v1): https://trello.com/c/1KXbnbBZ
- Fontes imagens corporativas: https://trello.com/c/NCDEjRXo
- Personas: https://trello.com/c/WAZ9CciT