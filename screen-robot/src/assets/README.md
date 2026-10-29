# Assets de perfil LinkedIn (ConectMax)

Canônico: [`profile-defaults.json`](profile-defaults.json) — company, jobTitle, avatar, banner, about, profileUrl.

| Path | Função |
|------|--------|
| [`avatars/conectmax-black.jpg`](avatars/conectmax-black.jpg) | Foto de perfil (sem BH) |
| [`banners/conectmax-banner.jpg`](banners/conectmax-banner.jpg) | Capa |
| `about` no JSON | Texto do About/summary |

```bash
cd screen-robot/src
# após conta criada / logada: capa + about via /me
npm run linkedin-setup -- --device emulator-5556 --defaults
# pedaços:
npm run linkedin-setup -- --device emulator-5556 --banner-only
npm run linkedin-setup -- --device emulator-5556 --about-only
# onboarding (tela Add photo):
npm run linkedin-setup -- --device emulator-5556 --avatar-only
```

**Antes → depois:** paths/textos manuais por conta → `--defaults` lê este JSON (banner+about). Rollback: editar o JSON ou flags `*-only`.
