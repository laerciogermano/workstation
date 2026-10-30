# Assets de perfil LinkedIn (ConectMax)

Canônico: [`profile-defaults.json`](profile-defaults.json) — company, jobTitle, avatar, banner, about, profileUrl.

| Path | Função |
|------|--------|
| [`avatars/conectmax-black.jpg`](avatars/conectmax-black.jpg) | Foto de perfil (sem BH) |
| [`banners/conectmax-banner.jpg`](banners/conectmax-banner.jpg) | Capa |
| `about` no JSON | Texto do About/summary |

```bash
cd screen-robot/src
# após conta criada / logada: avatar + capa + about via /me
npm run linkedin-setup -- --device emulator-5556 --defaults
# pedaços:
npm run linkedin-setup -- --device emulator-5556 --banner-only
npm run linkedin-setup -- --device emulator-5556 --about-only
npm run linkedin-setup -- --device emulator-5556 --avatar-only   # /me → Add photo (também serve pós-signup)
```

**Antes → depois:** `--defaults` só banner+about → também avatar via `/me` (Add photo → Add profile photo). Picker DocumentsUI: a11y-click com `uiautomator2` (`pip3 install --user uiautomator2`) se `input tap` falhar. Rollback: omitir `--avatar` / editar o JSON / flags `*-only`.

E-mail no perfil: Settings → Visibility → Email visibility → **Only visible to me** (+ export desligado).
