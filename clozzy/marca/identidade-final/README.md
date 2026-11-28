# Clozzy — identidade visual final (1.0)

**Por quê:** fechar uma identidade só, a partir do [documento de visão](../../README.md) e dos [insumos](../insumos-identidade-final.md).
**Importante:** passa a ser a referência de marca para protótipo, site e peças. Os kits anteriores viram histórico.
**No fluxo:** visão → **identidade** → protótipo → desenvolvimento → divulgação.

| Arquivo | O que é |
|---|---|
| [`identidade-clozzy-final.pdf`](identidade-clozzy-final.pdf) · `.html` | Manual, 22 páginas |
| [`BRAND.md`](BRAND.md) | Resumo operacional para pessoas e IA |
| [`tokens.css`](tokens.css) · [`tokens.json`](tokens.json) | Cor por tema, tipo, espaço, raio, controle, movimento |
| [`svg/`](svg/) | Logos, símbolo, ícones e close |
| [`_build.py`](_build.py) | Gerador de tudo acima |

```bash
cd clozzy/marca/identidade-final && python3 _build.py
```

Depende de `../identidade-verde-letras-redondas/` (geometria e peças, que puxa os kits anteriores), `../logo-final-v3/fonts/` e `../fotos-criadoras/` (**banco Pexels, uso interno apenas**). Precisa de Google Chrome, Pillow e shapely.

## Decisões

| Questão aberta | Decisão |
|---|---|
| Símbolo | Estrela macia + arco; a linhagem C + anel vira histórico |
| Ponto de câmera | só na estrela sozinha |
| Preto | `#000` |
| Rosa | só Pink Deep `#E0005A` |
| Creme, lavanda, soft | fora |
| Verde `#69C353` | só o close: detalhe, selo e ícone; sem logo sobre verde |
| Nome | letras redondas sobre Gabarito 800 |
| Degradê | proibido |
| No preto | arco rosa (marca) ou roxo (criadora), estrela branca |
| Frase de capa | “Chega mais perto.” (“Seu close, seu preço.” fica para criadora) |

## Antes → depois

Base: [`../identidade-verde-letras-redondas/`](../identidade-verde-letras-redondas/README.md). Desenho da marca e paleta não mudaram.

| Tema | Antes | Depois |
|---|---|---|
| Posicionamento | close friends pago | rede para desconhecidos; close no privado |
| Capa e anúncios | “Close friends que pagam”, preço | encontro, sem preço, Pix, pack ou verde |
| Perfil público | botão com preço | “Entrar no close”; preço um toque depois |
| Três apps | não tratados | mesmo logo; mudam conteúdo e quantidade de cor |
| Logo sobre verde | existia como versão | removido (fica ícone e selo do close) |
| Conteúdo trancado no PDF | o desfoque não saía | foto borrada de verdade |
| Movimento | loader com arco girando em kits antigos | arco parado |

## Pendências

- Aprovar o perfil público sem preço; o [protótipo v2](../../docs/prototipo-v2/README.md) e `/marca/` publicados **ainda não foram alterados**.
- Tema padrão do protótipo (Meia-rosa) usa arco rosa também no Studio; o manual usa roxo para a criadora. Definir se o Meia-rosa fica como exceção.
- Fotos próprias com autorização de imagem, incluindo homens e pessoas comuns.

## Caminho inverso

Apagar esta pasta e voltar a usar `../identidade-verde-letras-redondas/` (não foi alterada).

## Rollback

```bash
rm -rf clozzy/marca/identidade-final
```
