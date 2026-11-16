# Clozzy — Protótipo v2

**Por quê:** ver o Clozzy inteiro funcionando no celular, na identidade mais recente, antes de escrever histórias e telas.
**Importante:** cobre todas as páginas de [`functionalities.md`](../functionalities.md) (P01–P15) e marca feed, stories e conversas como pós-v1.
**No fluxo:** visão → funcionalidades → **protótipo** → histórias → BDD.

**URL:** https://clozzy.laerciogermano.com/prototipo/ · home: https://clozzy.laerciogermano.com/ · marca: https://clozzy.laerciogermano.com/marca/ · deploy: [`../../deploy/README.md`](../../deploy/README.md)  
Local: `index.html` (servir a pasta, ex.: `python3 -m http.server` e abrir `http://localhost:8000/`).

## O que tem

- **40 telas em 6 fluxos** (C-01 a C-58): chegada e conta · descobrir · vitrine e compra (perfil → resumo → Pix → liberado → conteúdo, mais Pix expirado) · área do fã (biblioteca, passe do close, avisos, conversas, conta, ajuda, denúncia) · virar criadora (dados, selfie com documento, chave Pix, análise) · Clozzy Studio (resumo, perfil, ofertas, editar oferta, conteúdos, publicar, fãs, financeiro, saque).
- **Estado de verdade:** comprar libera na biblioteca, cancelar mantém acesso até o fim do período, compra repetida não cobra, sem conta vai para Entrar e volta para a compra, Studio só abre com a conta ativa, saque entra como “processando”.
- **Cenários** no painel de notas: logado / sem conta, assina ou não o close da Lara, Pix confirma / expira, biblioteca vazia, criadora (só fã, em análise, ativa), tema, movimento reduzido.
- **Padrão de apresentação** dos protótipos Fitness / Confraternização / RoleGo: abertura com ações, temas e números; navegação por fluxos; galeria com códigos; temas em cards com miniaturas; decisões; rastreabilidade; modo navegável (lista · celular · notas). Atalhos `← →` telas, `⌫` voltar, `H` áreas clicáveis, `T` próximo tema, `Esc` fechar. Link direto `#C-20`, tema pela URL `?tema=meia-rosa`.

## Marca

[`marca/identidade-verde-letras-redondas/`](../../marca/identidade-verde-letras-redondas/README.md): arco + estrela macia (sem ponto dentro do arco, com ponto quando sozinha), “clozzy” com cantos redondos, símbolo sempre ao lado da palavra. `js/brand.js` foi gerado dos SVGs dessa pasta.

Cores: Pink Deep `#E0005A` (único rosa), roxo `#7C48C4` (lado da criadora), preto `#000`, branco, cinzas neutros, verde `#69C353` só no close. Regras: no preto o rosa é detalhe (arco, ponto de não lida, progresso do story, curtida) e o botão é branco; no rosa e no roxo tudo branco (sem preto e sem verde); rosa e roxo nunca um sobre o outro; roxo nunca em texto no preto. Tipo: Gabarito + Figtree.

## Temas

| Tema | Fundo | Botão | Acento |
|---|---|---|---|
| Noite (padrão) | preto `#000` | branco | arco rosa; Studio roxo |
| Dia | branco | Pink Deep; Studio roxo | rosa |
| Neblina | cinza `#F1F1F1` + cartões brancos | preto | arco rosa; Studio roxo |
| Meia-noite | preto `#000` | branco | arco roxo em tudo |
| Meia-rosa | preto `#000` | branco | arco pink em tudo (sem roxo) |
| Pink | Pink Deep | branco | tudo branco |
| Roxo | roxo | branco | tudo branco |

“Liberado” (C-24) é sempre Pink Deep; telas de foto e câmera (C-01, C-11, C-25, C-42) não mudam com o tema.

Antes → depois: 6 temas → 7 (`meia-rosa`). Voltar: remover o item `meia-rosa` em `js/data.js`, as regras `data-t="meia-rosa"` em `styles.css` e as menções a “sete” nos textos.

## Tendências e o que evitamos

Pesquisa em 2026-11-16 (fontes na seção “Decisões” do protótipo). Entraram: tipo grande como imagem, foto primeiro, ações na zona do polegar e folhas inferiores, vidro só na barra de abas e nos botões sobre foto, bento no Studio, passe de carteira, View Transitions e mola no toque. Saíram os sinais de “cara de IA”: degradê roxo-azul, brilhos, rótulo em caixa alta acima dos títulos, três cards iguais, borda colorida lateral, emoji como ícone, frases de narrador.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | Apresentação + player |
| `styles.css` | Apresentação, tokens dos 7 temas e telas |
| `js/brand.js` | Sprite SVG da marca (gerado) |
| `js/data.js` | Criadoras, ofertas, biblioteca, fluxos, metadados das telas, temas |
| `js/ui.js` | Ícones de linha próprios, marca, avatar, selo do close, QR, gráfico |
| `js/screens.js` | As 40 telas |
| `js/app.js` | Estado, navegação, ações, galeria, temas, rastreio |
| `img/` | Cópia de [`marca/fotos-criadoras/`](../../marca/fotos-criadoras/README.md) — Pexels, só uso interno |

Pessoas, números e fotos são ilustrativos. As fotos não têm autorização de imagem para peça pública.

## Rollback

```bash
rm -rf clozzy/docs/prototipo-v2
git checkout -- clozzy/docs/README.md clozzy/prompts/timeline.md
rm clozzy/prompts/025-2026-11-16-prototipo-v2-tendencias-temas.md
```
