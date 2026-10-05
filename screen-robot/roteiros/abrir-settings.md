Objetivo: abrir o app Settings (Configurações) do Android.

Passos (nessa ordem; não invente atalho):
1) Se o OCR tiver "Notifications" / "Clear all" / "AndroidSetup" = painel de notificações. Faça key KEYCODE_BACK (ou KEYCODE_HOME). NÃO scroll.
2) Na tela inicial (OCR só com hora/data, sem lista de apps): faça scroll direction=down UMA vez para abrir a gaveta de apps. NÃO use scroll up (abre notificações de novo).
3) Quando aparecer o texto "Settings" no OCR: tap nas coords x,y desse texto.
4) Quando a tela de Settings abrir (OCR com Search settings / Network / Apps / Battery etc.): done.

Regras:
- Nunca scroll up neste fluxo.
- Não fique repetindo HOME+scroll se Settings já estiver no OCR — só tap.
- done só depois de Settings aberto.
