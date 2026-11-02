# Prompt — novo vendedor (LinkedIn CDP)

Colar no chat quando for criar um vendedor novo.

---

```text
Crie um novo vendedor LinkedIn (1 conta):

1. Identidade BR nova (nome+sobrenome) e mailbox @clozzy.com.br (Mailcow).
2. CDP novo via human-cdp (createCdp + startCdp), porta livre, perfil ~/chrome-profiles/<id>.
3. Fingerprint totalmente novo e coerente — distinto dos CDPs existentes.
   Em createCdp({ fingerprint }) preencher só:
   - userAgent
   - platform
   - lang
   - acceptLanguage
   - timezone
   - locale
   - geolocation { latitude, longitude, accuracy }
   - hardwareConcurrency
   - deviceMemory
   - maxTouchPoints
   - colorScheme
   - reducedMotion
   - touch
   - webrtcIpHandling
   - userAgentMetadata {
       platform, platformVersion, architecture, model, mobile, bitness,
       brands[], fullVersionList[]
     }
   - permissions (origin linkedin.com → geolocation granted)
   Proibido: viewport (não colocar em fingerprint).
4. IP de egress no submit: curl -sS https://api.ipify.org → coluna ip.
5. Signup LinkedIn completo via CDP (senha LI in@12345678; PIN Mailcow).
6. Gravar tudo em screen-robot/pocs/android-studio/contas-linkedin-clozzy.csv
   (incluir colunas do fingerprint usado) + credenciais.md + contas-facebook-chrome.csv.
7. Browser só CDP/human-cdp. Sem AVD.
```

Rollback: apagar linha CSV; mailbox Mailcow; linha em credenciais.md; `removeCdp('<id>', { deleteProfile: true })`.
