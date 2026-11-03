# Avatars LinkedIn

| Arquivo | Uso |
|---------|-----|
| [`conectmax-black.jpg`](conectmax-black.jpg) | Default `--avatar` (logo ConectMax preta, sem “BELO HORIZONTE - MG”) |
| [`thispersondoesnotexist/`](thispersondoesnotexist/) | 110 faces sintéticas (`person-YYYYMMDD-*.jpg`) de [thispersondoesnotexist.com](https://thispersondoesnotexist.com/) — pool de avatar LI |
| [`fontes-avatar.md`](fontes-avatar.md) | Curadoria de sites (TPDNE, Open Pravatar, Unsplash, headshot IA…) para pesquisar depois |

**Antes → depois (TPDNE):** sem pool local → 10 JPGs → **110** JPGs únicos (`01`–`10` + `011`–`110`). Rollback: `rm -rf src/assets/avatars/thispersondoesnotexist`.

**Antes → depois:** foto Marcelo (LinkedIn) com BH → retângulo preto cobrindo a linha BH; só CONECTMAX + tagline.

**Antes → depois (ângulo):** crop torto no perfil → JPG/PNG regenerados do logo oficial (`Logo_Oficial-CONECTMAX_branco.png`) em 640×640 nivelado; reaplicado no LI via CDP `--avatar-only`. Rollback: `git checkout HEAD~1 -- src/assets/avatars/conectmax-black.*` ou `conectmax-black.prev.*`.

Rollback: trocar `--avatar` por outro path ou restaurar o JPG a partir do histórico git.
