# notinhas.shop — contexto para agentes de IA

> Modelo de contexto essencial para agentes de IA. Mantenha estritamente com ≤ 150 linhas.

## O que é
notinhas.shop (repositório `e-notas`): aplicação web/mobile-first para comparação colaborativa de preços de balcão a partir de NFC-e (cupons fiscais). Permite encontrar o menor preço de produtos, consultar histórico temporal, descobrir itens em mercados próximos via geolocalização, visualizar o ranking de lojas no raio (mais baratas e mais caras), acompanhar feed de concorrência/destaques, cotar cestas com divisão inteligente (split) e gerenciar extrato financeiro pessoal de compras. **Escopo do Beta: SEM checkout ou entrega nativa (vitrines são e-commerce read-only de descoberta).**

## Marca e identidade (REGRA SAGRADA)
- **Marca na UI:** A marca pública voltada ao consumidor é **exclusivamente notinhas.shop** (ou "notinhas").
- **PROIBIDO:** É expressamente proibido exibir o termo "e-notas" em qualquer texto, tela, modal ou componente visível ao usuário. "e-notas" é restrito ao nome do repositório, schema PostgreSQL (`enotas`) e serviço systemd (`enotas.service`).
- **Design Tokens:** Fundo Light Mist (`#F5F7FA`), azul principal (`#0069B4`), azul escuro (`#014380`), **menor preço em verde (`#00984B`)** e fonte Plus Jakarta Sans. Proibido hex solto no CSS (usar `--nt-*`).

## Documentação canônica (leia conforme a demanda da task)
- PRD e Escopo: `beta-docs/01-prd.md` · Histórias e BDD: `beta-docs/02-historias/`
- Arquitetura: `beta-docs/03-arquitetura.md` · ADRs: `beta-docs/04-adrs.md`
- Modelo de Dados: `beta-docs/05-modelo-de-dados.md` · Contratos de API: `beta-docs/06-contratos-api.md`
- Diagramas: `beta-docs/07-diagramas.md` · Boas Práticas: `beta-docs/08-boas-praticas-codigo.md`
- Testes e Riscos: `beta-docs/09-estrategia-de-testes.md` · Segurança/LGPD: `beta-docs/10-seguranca-privacidade-lgpd.md`
- Plano e Tarefas: `beta-docs/11-plano-de-implementacao.md` · Protótipos: `beta-docs/12-prototipos.md` (telas T-xx)
- Operação e Deploy: `beta-docs/14-operacao-deploy.md` · Glossário: `beta-docs/15-glossario.md`

## Stack e infraestrutura
Node.js + Express (porta `:4174`) · PostgreSQL local (banco `connectmax`, schema `enotas`) · Scraper Cheerio (Fazenda PR) · Geocoding Nominatim (OpenStreetMap com cache) · Nginx host (`https://notinhas.shop/`) · E-mail transacional Mailcow (`contato@notinhas.shop`).

## Comandos essenciais
```bash
npm install            # Instalação de dependências
npm run dev            # Servidor de desenvolvimento (:4174)
npm run db:migrate     # Executa migrations pendentes do schema enotas
npm test               # Testes unitários (Vitest)
npm run test:int       # Testes de integração (PostgreSQL real)
npm run test:e2e       # Testes ponta a ponta (Playwright mobile 390x844)
npm run verify         # Lint + typecheck + stylelint + testes (obrigatório antes de finalizar)
```

## Regras inegociáveis
1. **Contrato primeiro:** Toda modificação de API inicia nos schemas Zod de `beta-docs/06-contratos-api.md`.
2. **Zero PII da NFC-e:** O parser da SEFAZ PR deve descartar imediatamente CPF e nome do consumidor no ato da leitura da DANFE. Jamais persistir ou logar CPF.
3. **Deduplicação garantida:** Chave de acesso de 44 dígitos é única (`notas.chave_acesso UNIQUE`). Itens são únicos por nota (`(nota_id, codigo) UNIQUE`).
4. **Vínculo colaborativo EAN:** Chave natural `(empresa_id, codigo_unidade) UNIQUE`. Atualização determinística via UPSERT.
5. **Menor preço padronizado:** Exibir sempre em verde `#00984B`, acompanhado do chip de menor preço, nome do estabelecimento e data da nota fiscal.
6. **Geocoding com respeito à API:** Endereços da DANFE devem ser limpos de complementos vazios (ex.: `, 0,`) antes do Nominatim. Cache persistente obrigatório.
7. **Dinheiro em centavos:** Manipulação e persistência de valores monetários como inteiros (`Cents = number`). Formatação R$ somente na UI.
8. **Privacidade do Extrato:** O endpoint `/api/extrato` é estritamente isolado por usuário autenticado. O catálogo público não possui vínculo com quem depositou a nota.
9. **Código em inglês, UI em pt-BR:** Nomes de variáveis, funções e arquivos em inglês; textos de interface e mensagens ao usuário exclusivamente em português (Brasil).
10. **Documentar caminho inverso:** Toda alteração de infraestrutura ou banco deve conter script de rollback.

## Como trabalhar em uma tarefa
1. Leia a tarefa `BETA-nnn` em `beta-docs/11-plano-de-implementacao.md`, a história `US-xx.yy` correspondente e os contratos em `06-contratos-api.md`.
2. Se a tarefa envolver regras críticas (🟡 ou 🔴): apresente um plano sucinto com arquivos, testes e dúvidas, aguardando aprovação.
3. Implemente na ordem: contratos Zod → testes Gherkin falhando → domínio puro → use cases → repositório Postgres → controllers Express → frontend.
4. Execute `npm run verify` localmente.
5. Conclua com um resumo objetivo: arquivos alterados, cenários de teste cobertos e riscos identificados.

## Commits
Conventional Commits em português indicando o ID da tarefa:
`feat(ingestao): deduplicacao de notas fiscais pela chave de 44 digitos (US-01.02, BETA-104)`
