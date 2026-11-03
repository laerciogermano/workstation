# Lista de vendedores alinhados às personas

Fonte personas: [`../6ae9c89d7f2951914a023746/personas.csv`](../6ae9c89d7f2951914a023746/personas.csv)  
CSV acionável: [`vendedores.csv`](vendedores.csv)  
Playbook PDF (estudo + checklist config LinkedIn + fotos): [`reports/Vendedores-avatares.pdf`](reports/Vendedores-avatares.pdf) · avatares: [`avatars/`](avatars/)

**12 vendedores** · **3 personas** · empresa default `ConectMax` · fotos pool `thispersondoesnotexist`  
Experiência: colunas `experiencia_anos` / `experiencia_detalhe` (piso persona: indiretos 12+, KAM 15+, inside 4–7).

## Por persona

| persona_id | Qtd | IDs |
|---|---|---|
| `esp_suprimentos_indiretos` | 4 | v01–v04 |
| `kam_tecnico_mro` | 4 | v05–v08 |
| `inside_sales_alta_performance` | 4 | v09–v12 |

## Resumo + aparência

### esp_suprimentos_indiretos
| id | Nome | Cidade | Aparência (resumo) |
|---|---|---|---|
| v01 | Camila Andrade | São Paulo | Mulher 34–38, castanho ombros, blazer navy, sorriso acolhedor |
| v02 | Renata Figueiredo | Campinas | Mulher 40–45, chanel preto, óculos fino, blazer cinza, senioridade |
| v03 | André Vasconcelos | Curitiba | Homem 36–40, barba curta, camisa azul + blazer charcoal |
| v04 | Juliana Peixoto | Belo Horizonte | Mulher 28–32, cabelo cacheado, blazer verde-musgo, sorriso aberto |

### kam_tecnico_mro
| id | Nome | Cidade | Aparência (resumo) |
|---|---|---|---|
| v05 | Roberto Menezes | Joinville | Homem 42–48, grisalho, barba curta, blazer chumbo, braços cruzados |
| v06 | Daniela Hoffmann | Caxias do Sul | Mulher 38–42, coque, óculos retangular, blazer preto |
| v07 | Fábio Queiroz | Contagem | Homem 35–39, fade + barba cheia curta, camisa cinza |
| v08 | Patrícia Lacerda | Manaus | Mulher 33–37, cabelo longo preto, blazer petróleo |

### inside_sales_alta_performance
| id | Nome | Cidade | Aparência (resumo) |
|---|---|---|---|
| v09 | Thiago Nascimento | Barueri | Homem 26–30, polo navy, sorriso energético, open space |
| v10 | Larissa Campos | Osasco | Mulher 25–29, cabelo acobreado, polo/camisa clara |
| v11 | Gabriel Rocha | Rio de Janeiro | Homem 30–34, limpo de barba, camisa branca / polo |
| v12 | Aline Monteiro | Guarulhos | Mulher 27–31, rabo de cavalo, blazer bege smart casual |

## Persona → signup

```bash
# exemplo v01
cd screen-robot/pocs/chrome-cdp/linkedin-create-account
node create-mailbox.mjs --first Camila --last Andrade --write-credenciais \
  --location "São Paulo" \
  --job "Executiva de Contas B2B | Especialista em Suprimentos Indiretos" \
  --company ConectMax
```

- `aparencia` / `avatar_style` → brief para gerar ou escolher foto ([`fontes-avatar.md`](../../../src/assets/avatars/fontes-avatar.md)); **não** scrapear fotos reais.
- `about` / `headline` → setup pós-feed / `profile-defaults`.
- Mapa personas: [`../6ae9c89d7f2951914a023746/persona-para-vendedor.md`](../6ae9c89d7f2951914a023746/persona-para-vendedor.md)
