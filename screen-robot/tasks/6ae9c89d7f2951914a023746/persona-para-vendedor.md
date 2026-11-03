# Persona → parâmetros de criação de vendedor

Catálogo: [`personas.csv`](personas.csv) · relatório: [`reports/Personas LinkedIn que mais vendem.md`](reports/Personas%20LinkedIn%20que%20mais%20vendem.md)

## Mapeamento

| Campo persona | Uso no signup / setup |
|---|---|
| `job` | `create-mailbox.mjs --job "…"` / `fillSignupJob` |
| `company` | `--company` / `fillSignupCompany` (default ConectMax) |
| `location` | `--location` / `fillSignupLocation` |
| `headline` / `about` | pós-feed: `linkedin-setup-about-cdp` / `profile-defaults.json` `about` |
| `avatar_style` | brief para gerar/selecionar avatar ([`fontes-avatar.md`](../../../src/assets/avatars/fontes-avatar.md)); **não** scrapear fotos reais |
| nome_persona | `--first` / `--last` (ou variante na lista de vendedores) |

## Exemplo

```bash
cd screen-robot/pocs/chrome-cdp/linkedin-create-account
node create-mailbox.mjs --first Mariana --last Medeiros --write-credenciais \
  --location "São Paulo" \
  --job "Executiva de Contas B2B | Especialista em Suprimentos Indiretos" \
  --company ConectMax
```

Defaults genéricos atuais: [`src/assets/profile-defaults.json`](../../../src/assets/profile-defaults.json).  
**Antes → depois:** um único job/about genérico → escolher linha de `personas.csv` por `id` e passar job/location/about/avatar_style. Rollback: voltar aos defaults do JSON.

Próximo card (lista com aparência): https://trello.com/c/1KXbnbBZ
