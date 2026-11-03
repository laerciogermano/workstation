# Prompt — novo vendedor (LinkedIn CDP)

Colar no chat quando for criar um vendedor novo.

Scripts: [`linkedin-create-account/`](linkedin-create-account/README.md) · copy: [`COPY-HUMANA.md`](linkedin-create-account/COPY-HUMANA.md)

---

```text
Crie um novo vendedor LinkedIn (1 conta) seguindo o card/doc do vendedor (não inventar perfil):

## Conta / CDP
1. Identidade = nome do doc/card. Mailbox @brsupply.email (Mailcow) — NÃO @clozzy.com.br.
2. CDP novo via human-cdp (createCdp + startCdp), porta livre, perfil ~/chrome-profiles/<id>, debug: true.
   Abrir o Chrome/CDP num terminal à parte (não no terminal do chat/agent).
3. Fingerprint totalmente novo e coerente — distinto dos CDPs existentes.
   Em createCdp({ fingerprint }) preencher só (alta/média p/ LinkedIn):
   - userAgent
   - userAgentMetadata {
       platform, platformVersion, architecture, model, mobile, bitness,
       brands[], fullVersionList[]
     }
   - platform, maxTouchPoints, touch, lang, acceptLanguage, locale, timezone
   - geolocation { latitude, longitude, accuracy }
   - webrtcIpHandling, hardwareConcurrency, deviceMemory
   Proibido: viewport (e não precisa colorScheme / reducedMotion / permissions).
4. IP de egress no submit: curl -sS https://api.ipify.org → coluna ip.
5. Signup LinkedIn completo via CDP/human-cdp (senha LI in@12345678; PIN Mailcow).
   Browser só CDP/human-cdp. Sem AVD. Cliques com trajetória (nunca el.click / Input press solto).

## Perfil (pós-signup) — dados do doc escolhidos / card Trello
6. Foto: avatar do doc escolhidos-v2.1 (tasks/6ae9def6a28b279ac20b6ffc/avatars/…),
   NÃO a lista Unsplash nova (6ae9def02d6e0ab7a0ab0737) se o card apontar o v2.1.
   Script: upload-profile-photo.mjs — se já tem foto: Atualizar (não Editar/crop) → Carregar foto.
7. Banner: BR Supply COM logo (br-supply-01-caixas ou 02-fachada em src/assets/banners/).
   NÃO usar br-supply-03-logistica (sem logo). Script: upload-profile-banner.mjs.
8. Sobre + experiências: textos do doc; tom FORMAL do doc, só remover cacoetes de IA
   (COPY-HUMANA.md). Não casualizar.
   Evitar: travessão —, setas →, “ciclo completo”, “alinhado a”, “correlatas”, “vamos conversar?”.
9. Typeahead (cargo/empresa/local): SEMPRE a 1ª sugestão da lista — nunca a 2ª+ por match de texto.
10. Experiências:
    - Cargo atual = o do doc/card (ex. KAM Industrial | Especialista em biorremediantes @ BR Supply).
    - Empresa/cidade/job do card (ex. BR Supply), não default ConectMax/Caxias se o card disser outra.
    - Datas com meses VARIADOS (não sempre jan–dez). Ex.: mar–ago, out–mai, jun–presente.
    - Descrições um pouco mais densas, ainda formais e sem cacoete.
    - Scripts: upload-profile-experience.mjs (--file / --edit).
    - Forms SPA: clicar o <a> /edit/forms/… (Page.navigate no form NÃO hidrata).

## Planilha / credenciais
11. Gravar em contas-linkedin-clozzy.csv + credenciais.md (§ @brsupply.email) + contas-facebook-chrome.csv.
    Incluir: cidade, company, fingerprint (fp_*), ip, e colunas LinkedIn:
    li_url, li_headline, li_cargo, li_about, li_foto, li_banner,
    li_exp1_* … li_exp3_* (titulo, empresa, inicio, fim, atual, desc).
    Helper: updateLinkedinProfileCsv em save-csv.mjs.
```

Rollback: apagar linha CSV; mailbox Mailcow; linha em credenciais.md; `removeCdp('<id>', { deleteProfile: true })`.
