## Objetivo
Montar uma **lista de vendedores** (candidatos a perfil LinkedIn) com características alinhadas às **personas que mais vendem** no nosso contexto (suprimentos corporativos / ConectMax / BR Supply), incluindo **descrição de aparência** de cada pessoa para orientar avatar/foto.

## Dependência
- Card personas (pesquisa na net): https://trello.com/c/WAZ9CciT
- Notas: `screen-robot/tasks/6ae9c89d7f2951914a023746/`

## Escopo
1. Partir das personas validadas (ex.: Especialista consultivo de suprimentos, KAM técnico MRO, Inside Sales alta performance — ajustar ao catálogo final do card de personas).
2. Para cada vendedor da lista, preencher:
   - **persona_id** (qual persona atende)
   - nome / sobrenome sugeridos
   - cargo (`job`), empresa, cidade/UF
   - headline + about (tom da persona)
   - **aparência** (texto): gênero aparente, faixa etária, fenótipo/estilo, cabelo, barba, óculos, vestimenta (ex. blazer / camisa social), fundo da foto (estúdio / corporativo), expressão (sorriso acessível vs. sério consultivo)
   - avatar_style (tags curtas para geração/seleção de foto)
3. Entregar lista versionada (CSV + MD) com ≥ 8–12 vendedores cobrindo ≥ 3 personas do nosso contexto.
4. Ligar a lista ao fluxo de criação de conta (`contas-linkedin-clozzy.csv` / signup CDP / `profile-defaults`).

## Aceite
- Lista acionável com campos de signup + **aparência** por pessoa
- Cada linha mapeada a uma persona do nosso contexto
- Pronto para gerar/selecionar avatar sem scrapear fotos reais sem licença

## Fora de escopo
- Criar as contas LinkedIn neste card
- Usar fotos de pessoas reais sem consentimento/licença

## Relacionados
- Personas: https://trello.com/c/WAZ9CciT
- Contas: `screen-robot/pocs/android-studio/contas-linkedin-clozzy.csv`
- Fontes avatar: `screen-robot/src/assets/avatars/fontes-avatar.md`
- Signup: `screen-robot/pocs/chrome-cdp/linkedin-create-account/`
