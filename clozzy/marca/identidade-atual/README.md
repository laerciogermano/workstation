# Clozzy — Identidade visual as-is

Kit da marca **atual** (código + site), no formato RoleGo v4. Insumo para Clozzy 2028 — **não** é o redesign do card “Criar identidade visual (nova)”.

| Fonte | O quê |
|---|---|
| [`../benchmarking-concorrentes/clozzy/performer/`](../benchmarking-concorrentes/clozzy/performer/) | App: `#FF0065`, Montserrat, mark geométrico |
| [`../benchmarking-concorrentes/clozzy/front/`](../benchmarking-concorrentes/clozzy/front/) | Fã: `#FE2C55`, Proxima Nova |
| clozzy.com.br / clozzy.link | Site: `#7651E9` + estrela · prints em [`refs/`](refs/) |

| Arquivo | O que é |
|---|---|
| [`identidade-visual-clozzy-atual.pdf`](identidade-visual-clozzy-atual.pdf) | Manual 12 págs. A4 paisagem |
| `identidade-visual-clozzy-atual.html` | Mesmo manual |
| [`BRAND.md`](BRAND.md) | One-pager |
| [`tokens.css`](tokens.css) | Tokens |
| [`logos/`](logos/) | Masters copiados do performer |

## Gerar de novo

```bash
cd clozzy/marca/identidade-atual && python3 _build.py
```

## Rollback

```bash
rm -rf clozzy/marca/identidade-atual
```
