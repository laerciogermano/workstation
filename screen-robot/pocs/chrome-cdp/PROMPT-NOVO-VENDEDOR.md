# Prompt — novo vendedor (LinkedIn CDP)

Colar no chat quando for criar um vendedor novo.

---

```text
Crie um novo vendedor LinkedIn (1 conta):

1. Identidade BR nova (nome+sobrenome) e mailbox @brsupply.email (Mailcow).
2. CDP novo via human-cdp (createCdp + startCdp), porta livre, perfil ~/chrome-profiles/<id>, debug: true.
   Abrir o Chrome/CDP num terminal à parte (não no terminal do chat/agent).
3. Fingerprint totalmente novo e coerente — distinto dos CDPs existentes.
   Em createCdp({ fingerprint }) preencher só (alta/média p/ LinkedIn):
   - userAgent
   - userAgentMetadata {
       platform, platformVersion, architecture, model, mobile, bitness,
       brands[], fullVersionList[]
     }
   - platform
   - maxTouchPoints
   - touch
   - lang
   - acceptLanguage
   - locale
   - timezone
   - geolocation { latitude, longitude, accuracy }
   - webrtcIpHandling
   - hardwareConcurrency
   - deviceMemory
   Proibido: viewport (e não precisa colorScheme / reducedMotion / permissions).
4. IP de egress no submit: curl -sS https://api.ipify.org → coluna ip.
5. Signup LinkedIn completo via CDP (senha LI in@12345678; PIN Mailcow).
6. Pós-signup: foto, banner, Sobre e experiências do doc do vendedor.
   Copy: formalismo do doc, sem cacoete de IA (linkedin-create-account/COPY-HUMANA.md).
7. Gravar tudo em screen-robot/pocs/android-studio/contas-linkedin-clozzy.csv
   (incluir cidade, company e colunas do fingerprint usado) + credenciais.md + contas-facebook-chrome.csv.
8. Browser só CDP/human-cdp. Sem AVD.
```

Rollback: apagar linha CSV; mailbox Mailcow; linha em credenciais.md; `removeCdp('<id>', { deleteProfile: true })`.
