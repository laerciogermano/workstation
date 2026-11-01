# notinhas.org — Identidade visual

Tokens e regras da marca consumer do produto e-notas. Manual print-ready: [`marca/identidade-visual-notinhas-v1.html`](marca/identidade-visual-notinhas-v1.html) · card [Criar identidade visual](https://trello.com/c/qUI3Rb9a).

**Referência de cor:** Nota Paraná / Menor Preço (azul + verde).  
**Molde de estrutura:** RoleGo v1 (seções A4) — não copiar neon/dark.

---

## 1. Conceito

Produto **claro e utilitário**: a NFC-e vira índice de preço. Confiança (dado da nota), clareza (menor preço + loja + data) e contribuição fácil (QR). Visual **light**, azul institucional + verde de “economia/ok”.

**Nome de marca:** `notinhas.org` (domínio = wordmark). Código/repo continua `e-notas`.

---

## 2. Paleta

| Token | Hex | Uso |
|-------|-----|-----|
| `--nt-blue` | `#0069B4` | Primária, links, botão principal |
| `--nt-blue-deep` | `#014380` | Títulos fortes, header |
| `--nt-blue-soft` | `#E3F2FB` | Fundo de destaque / chip |
| `--nt-green` | `#00984B` | Menor preço, sucesso, acento “.org” |
| `--nt-green-deep` | `#007A3D` | Hover / ênfase verde |
| `--nt-green-soft` | `#E6F6EE` | Badge “menor preço” |
| `--nt-ink` | `#0B1F33` | Texto |
| `--nt-muted` | `#5A6B7D` | Secundário |
| `--nt-line` | `#D5DEE8` | Bordas |
| `--nt-bg` | `#F5F7FA` | Fundo app / mist |
| `--nt-white` | `#FFFFFF` | Superfície |
| `--nt-err` | `#C62828` | Erro |

Gradiente de marca (capa, splash): `#014380 → #0069B4 → #00984B` (135°).

---

## 3. Tipografia

- **UI / corpo:** Plus Jakarta Sans (400–800)
- **Wordmark:** Plus Jakarta Sans ExtraBold; “notinhas” em azul profundo; “.org” em verde
- Títulos: peso 800, tracking leve negativo
- Preços: tabular / mono opcional (`ui-monospace`) para alinhamento

---

## 4. Logo

- **Wordmark:** `notinhas.org` (nunca “e-notas” na UI consumer)
- **Símbolo:** recibo arredondado + QR canto + seta verde de preço ↓ (ícone app / favicon)
- Respiro mínimo = altura da letra “n”
- Mínimo digital: wordmark 120 px · símbolo 24 px
- Não esticar, não recolorir fora da paleta, não usar “e-notas” como marca pública

---

## 5. Tom

Direto, útil, sem hype. Destacar **menor preço**, **loja** e **data**. Evitar jargão SEFAZ na UI; “nota” e “QR” bastam.

---

## 6. Redes sociais

Feed 1:1 e stories 9:16 — exemplos no manual HTML (seção *Publicações*).

| Tipo | Conteúdo |
|------|----------|
| Menor preço | Produto + preço verde + loja/data + CTA buscar |
| Contribuir | “Sua nota vira índice” + CTA colar URL do QR |
| Geo / perto | Lista curta loja + distância + preço |
| Story | Um preço do dia + “Abrir busca” |

Regras: wordmark uma vez; preço em verde; loja+data; 1 CTA; hashtag `#notinhas`; bio `notinhas.org` (nunca “e-notas”).

---

## 7. Rollback

```bash
rm -f e-notas/identidade-visual.md \
      e-notas/marca/identidade-visual-notinhas-v1.html \
      e-notas/marca/README.md
```
