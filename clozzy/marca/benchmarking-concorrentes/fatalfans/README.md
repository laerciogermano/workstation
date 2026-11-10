# FatalFans — inspeção (Clozzy benchmarking)

Site: https://fatalfans.com/ · ranking Clozzy #11 / #3 BR · escopo **só público** (sem login/cadastro submetido).

## Conta lab

| Campo | Valor |
|-------|--------|
| Escopo | Público (age gate + landing + modais + legal + perfil + awards + campanha creator) |
| CDP | `fatalfans` · `:9265` · `~/chrome-profiles/fatalfans` |
| Operadora | FF Tecnologia Ltda. · CNPJ 63.400.101/0001-70 |
| Suporte | `suporte@fatalfans.com` |

## Escopo

Público apenas. Sem submit de signup/login, sem KYC, sem checkout.

## Prints desktop

Pasta [`prints/desktop/`](prints/desktop/)

| Print | Tela |
|-------|------|
| `00` | Age gate 18+ |
| `01` / `01b` / `01c` | Landing · Awards · rankings |
| `02` | Modal Entrar (e-mail/CPF + senha · Google · X) |
| `03` | Modal Criar conta (apelido · e-mail · senha · Google · X) |
| `04` / `05` | Termos · Política de privacidade |
| `06` / `07` | Perfis públicos (`emmewhite`, `bad_mi`) |
| `08` | Creator Awards (votação) |
| `09` / `10` | Filtro Mulheres · busca |
| `11` | Campanha creator Fatal Model |

## Prints mobile

Pasta [`prints/mobile/`](prints/mobile/) — iPhone `390×844 @3x`.

| Print | Tela |
|-------|------|
| `01` / `01b` | Landing |
| `02` / `03` | Login · Signup |
| `04` / `05` | Termos · Privacidade |
| `06` | Perfil |
| `11` | Campanha creator |

## Docs

- [`benchmarking-fatalfans.html`](benchmarking-fatalfans.html) / [`benchmarking-fatalfans.pdf`](benchmarking-fatalfans.pdf)
- [`funcionalidades.md`](funcionalidades.md) · [`ia.md`](ia.md)

## vs CloseFans / Privacy

- Taxa **15%** (Termos 6.3) — menor que CloseFans 20%+fixo / Privacy 20%
- Pix explícito na política de privacidade; integração **Fatal Model**
- Age gate + CPF + biometria creator (Termos); sem suite GenAI anunciada
- IA nos Termos: ban de conteúdo de menor (inclusive gerado por IA) — não ban genérico de conta IA

## Rollback

```bash
rm -rf clozzy/marca/benchmarking-concorrentes/fatalfans
# removeCdp('fatalfans',{deleteProfile:true})
```
