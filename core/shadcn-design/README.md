# shadcn.io/design — clássicos (home)

Fonte: [https://www.shadcn.io/design](https://www.shadcn.io/design) · seção **The classics / Popular design systems**.

Só os 8 sistemas em destaque na frente (não o catálogo completo de ~500).

| Slug | Nome | Site | Arquivo |
|------|------|------|---------|
| `stripe` | Stripe Inspired | https://stripe.com | [`stripe.DESIGN.md`](stripe.DESIGN.md) |
| `linear` | Linear | https://linear.app | [`linear.DESIGN.md`](linear.DESIGN.md) |
| `apple` | Apple | https://www.apple.com | [`apple.DESIGN.md`](apple.DESIGN.md) |
| `github` | GitHub | https://github.com | [`github.DESIGN.md`](github.DESIGN.md) |
| `vercel` | Vercel Inspired | https://vercel.com | [`vercel.DESIGN.md`](vercel.DESIGN.md) |
| `claude` | Claude | https://claude.com | [`claude.DESIGN.md`](claude.DESIGN.md) |
| `figma` | Figma | https://www.figma.com | [`figma.DESIGN.md`](figma.DESIGN.md) |
| `framer` | Framer | https://www.framer.com | [`framer.DESIGN.md`](framer.DESIGN.md) |

## Uso

Abrir o `.DESIGN.md` no Cursor/Claude e pedir UI no estilo do arquivo (tokens → React/Tailwind).

## Atualizar

```bash
cd core/shadcn-design
for k in stripe linear apple github vercel claude figma framer; do
  curl -sS -f "https://www.shadcn.io/design/$k/raw" -o "$k.DESIGN.md"
done
```

## Rollback

```bash
rm -rf core/shadcn-design
```

