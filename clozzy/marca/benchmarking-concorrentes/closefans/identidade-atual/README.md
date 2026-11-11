# CloseFans — Identidade visual as-is

Auditoria da marca **atual** em produção ([close.fans](https://close.fans/)), no formato do kit RoleGo v4. Insumo de benchmarking Clozzy — **não** é identidade da Clozzy nem licença de uso da marca alheia.

**Nota:** [close.com.br](https://close.com.br/) é produtora de vídeo (Uberlândia) — marca distinta; não usada neste kit.

| Arquivo | O que é |
|---|---|
| [`identidade-visual-closefans-atual.pdf`](identidade-visual-closefans-atual.pdf) | Manual A4 paisagem (12 págs.) |
| `identidade-visual-closefans-atual.html` | Mesmo manual, HTML self-contained |
| [`BRAND.md`](BRAND.md) | One-pager operacional |
| [`tokens.css`](tokens.css) | Tokens extraídos do CSS/meta |
| [`logos/`](logos/) | Lockups + mark chave baixados |
| [`refs/`](refs/) | Prints landing / login / feed |
| [`_build.py`](_build.py) | Regenera HTML + PDF |

## Páginas do manual

1 capa · 2 sumário · 3 essência · 4 logo system · 5 mark chave · 6 cores + AA · 7 tipografia · 8 UI · 9 voz/canais/IA · 10 referências · 11 inconsistências · 12 contracapa.

## Gerar de novo

```bash
cd clozzy/marca/benchmarking-concorrentes/closefans/identidade-atual
python3 _build.py
```

Precisa do Google Chrome em `/Applications` e rede para a Archivo (Google Fonts) no print.

## Antes → depois

| Antes | Depois |
|---|---|
| Só prints/funcionalidades no benchmarking | Kit de identidade as-is (cores, logos, BRAND, manual) |

## Rollback

```bash
rm -rf clozzy/marca/benchmarking-concorrentes/closefans/identidade-atual
```
