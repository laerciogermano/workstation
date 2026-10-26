# Referência de marca (insumo)

Modelo de estrutura/layout para o card de identidade visual do RoleGo.

## Fonte

Cópia do manual **ConectTech v1** (último documento de identidade da linha ConectMax/ConectTech em `conectmax/connectmax/marca/`).

| Arquivo | Uso |
|---------|-----|
| [`identidade-visual-conect-tech-v1.html`](identidade-visual-conect-tech-v1.html) | Manual navegável (abrir no browser; assets locais) |
| [`assets-conectmax/`](assets-conectmax/) | Logos/ícones usados pelo HTML |
| [`identidade-visual-conect-tech-v1.pdf`](identidade-visual-conect-tech-v1.pdf) | PDF do manual |
| [`identidade-visual-conect-tech-v1.zip`](identidade-visual-conect-tech-v1.zip) | Pacote HTML + assets |

Origem: [`conectmax/connectmax/marca/identidade-visual-conect-tech-v1.html`](../../../conectmax/connectmax/marca/identidade-visual-conect-tech-v1.html) (e PDF/ZIP irmãos).

## O que reaproveitar no RoleGo

- Formato de páginas A4 paisagem (HTML → PDF)
- Seções típicas: conceito, logo, paleta, tipografia, aplicações, usos incorretos
- Tokens CSS em `:root` + cards de amostra

**Não** copiar cores/logo ConectTech — só a estrutura do manual. Tokens RoleGo: [`../../identidade-visual.md`](../../identidade-visual.md).

## Rollback

```bash
rm -rf role-go/input/referencia-marca
```
