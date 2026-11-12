## Objetivo
**Pesquisar na net** os **perfis LinkedIn que mais vendem** (personas de vendedores de alto desempenho) e documentá-los como referência para **gerar novos vendedores** com o mesmo padrão.

## Por quê
Hoje criamos contas/vendedores com cargo/empresa genéricos. Sem um mapa das personas que realmente convertem, a geração de perfis fica às cegas. Precisamos das características dos que mais vendem — encontradas por pesquisa pública na web — para replicar cargo, seniority, tom, foto, background e narrativa.

## Escopo
1. **Pesquisa na net** (artigos, rankings, cases, posts, listas de top sellers / SDR / AE / closer B2B no LinkedIn; benchmarks de prospecção social).
2. Definir critério de “quem mais vende” com base nas fontes (ex.: volume declarado, prêmios, cases públicos, influência + prova social de fechamento).
3. Levantar perfis públicos de referência (URLs LinkedIn / menções) dos top performers encontrados.
4. Extrair e consolidar **personas**: cargo, seniority, setor, cidade, empresa (ou “parece trabalhar em”), headline, about, foto/estilo, histórico, sinais de autoridade, tom de posts/mensagens.
5. Entregar catálogo versionado (MD/CSV/JSON) com 1 persona por linha + campos usáveis no signup/setup (job, company, location, about, avatar style) + **fonte/URL da pesquisa**.
6. Ligar o catálogo ao fluxo de criação de conta (defaults / geração de vendedores), para novos perfis saírem baseados nas personas.

## Aceite
- Pesquisa documentada (fontes + links) dos perfis/personas que mais vendem
- ≥ 3 personas documentadas com campos acionáveis para geração
- Caminho claro: persona → parâmetros de criação de vendedor

## Fora de escopo
- Criar as contas neste card (só pesquisar e documentar personas)
- Scrapear fotos de pessoas reais sem licença/consentimento
- Usar só dados internos da operação (o ponto é a net)

## Relacionados
- Contas Clozzy: `screen-robot/pocs/android-studio/contas-linkedin-clozzy.csv`
- Signup CDP: `screen-robot/pocs/chrome-cdp/linkedin-create-account/`
- Fontes de avatar: `screen-robot/src/assets/avatars/fontes-avatar.md`