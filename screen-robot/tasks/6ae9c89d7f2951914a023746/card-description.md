## Objetivo
Identificar os **perfis LinkedIn que mais vendem** (personas de vendedores de alto desempenho) e documentá-los como referência para **gerar novos vendedores** com o mesmo padrão.

## Por quê
Hoje criamos contas/vendedores com cargo/empresa genéricos. Sem um mapa das personas que realmente convertem, a geração de perfis fica às cegas. Precisamos das características dos que mais vendem para replicar cargo, seniority, tom, foto, background e narrativa.

## Escopo
1. Definir critério de “quem mais vende” (ex.: faturamento, conversão, volume de deals fechados no período).
2. Levantar os perfis LinkedIn dos top performers (vendedores reais da operação / franqueados de referência).
3. Extrair e consolidar **personas**: cargo, seniority, setor, cidade, empresa (ou “parece trabalhar em”), headline, about, foto/estilo, histórico, sinais de autoridade, tom de posts/mensagens.
4. Entregar catálogo versionado (MD/CSV/JSON) com 1 persona por linha + campos usáveis no signup/setup (job, company, location, about, avatar style).
5. Ligar o catálogo ao fluxo de criação de conta (defaults / geração de vendedores), para novos perfis saírem baseados nas personas.

## Aceite
- Lista ranqueada dos perfis que mais vendem + critério usado
- ≥ 3 personas documentadas com campos acionáveis para geração
- Caminho claro: persona → parâmetros de criação de vendedor

## Fora de escopo
- Criar as contas neste card (só identificar e documentar personas)
- Scrapear fotos de pessoas reais sem licença/consentimento

## Relacionados
- Contas Clozzy: `screen-robot/pocs/android-studio/contas-linkedin-clozzy.csv`
- Signup CDP: `screen-robot/pocs/chrome-cdp/linkedin-create-account/`
- Fontes de avatar: `screen-robot/src/assets/avatars/fontes-avatar.md`
