# Clozzy — Manual de uso da marca · Estrela macia · edição criadoras

Versão estruturada do [manual de uso da Estrela macia](../uso-da-marca-estrela-macia/README.md), com mais aplicações e fotos de **criadoras de conteúdo de 18 a 22 anos** (tom TikTok, nada sensual). Mesma marca, cores e tokens: [`tokens.css`](../uso-da-marca-estrela-macia/tokens.css) e [`tokens.json`](../uso-da-marca-estrela-macia/tokens.json) continuam os do v1.

| Arquivo | O que é |
|---|---|
| [`manual-uso-estrela-macia-criadoras.pdf`](manual-uso-estrela-macia-criadoras.pdf) · `.html` | O manual, 45 páginas |
| `fotos/` | 7 fotos geradas por IA (selfie, espelho, reação, dupla, rolê, setup, pôr do sol), 760 px |
| [`_build.py`](_build.py) | Gerador. Importa o build do v1 para as páginas que não mudaram |
| [`_preview.py`](_preview.py) | Renderiza páginas do PDF em PNG (`/tmp/clozzy-criadoras`) para conferir |

## Estrutura (9 partes, faixa de navegação em toda página)

01 A marca · 02 Cor e tipografia · 03 Imagem e voz · 04 App · 05 Web · 06 Redes sociais · 07 Mídia e parcerias · 08 Físico e eventos · 09 Regras. O sumário (pág. 2) lista as páginas com número.

**Novas aplicações:** direção de foto, foto com a marca, tratamento, tom de voz, microtextos, onboarding da criadora, componentes, perfil na web, link na bio, prévia de link/QR, vídeo vertical, grade e capas de Reels, lives, figurinhas, capas e banners, convite para criadoras, mídia kit, kit de boas-vindas, mídia exterior, apresentações, brindes, evento.

## Regras novas de imagem

- Criadoras maiores de 18 anos e verificadas; rosto à vista; luz clara; cor vem do cenário.
- Texto sobre foto **sempre em bloco sólido** (legenda de TikTok); marca em **pílula** preta ou branca no canto de cima.
- Sem filtro de cor, degradê, escurecer a foto, recorte de corpo sem rosto ou tarja no conteúdo pago (desfoque + estrela).
- Voz: jovem, direta, divertida, segura; palavras da casa (close, pack, bora, tá dentro) e lista do que fica de fora.

## Antes → depois

- Antes ([v1](../uso-da-marca-estrela-macia/README.md)): 25 páginas, sem partes, fotos de recorte/luz baixa (`aplicacoes-v2/fotos`), texto direto sobre a foto.
- Depois: 45 páginas em 9 partes, fotos de criadoras, texto em bloco, 20+ aplicações novas. Páginas de marca, cor, tipografia, app, landing, perfil, e-mail e impressos vêm do v1 (zoom automático para ocupar a página; fotos trocadas por alias).

## Gerar de novo

```bash
cd clozzy/marca/uso-da-marca-estrela-macia-criadoras && python3 _build.py   # CHECK=1 lista o que estoura a página
python3 _preview.py 10 11            # PNG das páginas pedidas; sem argumento, folhas de 4
```

Depende de `../uso-da-marca-estrela-macia/_build.py`, `../identidade-estrela-macia/` (marcas) e `../logo-final-v3/fonts/` (Gabarito e Figtree). Se o v1 mudar, este manual muda junto.

## Caminho inverso

- Voltar ao manual anterior: usar [`../uso-da-marca-estrela-macia/`](../uso-da-marca-estrela-macia/README.md) (não foi alterado).
- Trocar as fotos: substituir os JPG de `fotos/` mantendo os nomes e rodar `_build.py`; os nomes antigos do v1 (`costas`, `labios`, `cetim`, `homem`) apontam por alias para `selfie`, `espelho`, `cama`, `dupla` (dicionário `ALIAS`).
- Remover tudo: apagar esta pasta; nada fora dela depende dela.
