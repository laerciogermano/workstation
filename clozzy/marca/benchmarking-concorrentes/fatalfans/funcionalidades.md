# FatalFans — inventário de funcionalidades

Fonte: inspeção CDP `fatalfans` :9265 (2026-11-10, **só público**) + [Termos](https://fatalfans.com/terms) + [Privacidade](https://fatalfans.com/privacy-policy) + campanha [Fatal Model](https://campanha.fatalmodel.com/cadastro-fatal-fans).

## Cadastro / acesso

- Age gate na entrada: “Tenho +18 anos, quero entrar” / sair
- Header: **Entrar** · **Criar conta** (modais SPA — rotas `/login` `/signup` etc. caem em 404 de “creator”)
- Login: e-mail **ou CPF** + senha · Esqueci minha senha · OAuth **Google** · **X**
- Signup: apelido + e-mail + senha · Google · X (não submetido nesta sessão)
- 18+ + Termos; ECA Digital (Lei 15.211/2025) citada; CPF em base oficial (quem publica e quem compra); biometria do creator

## Discovery / fan (UI pública)

- Home: carrossel de criadores · busca por nome/@ (mín. 3 chars)
- Filtros: **Mulheres · Casais · Homens · Trans**
- Rankings / seções: Mais vendidos · Top criadores · Influenciadores · Com mais curtidas · Bombando no chat · Maiores promoções · Postam todo dia
- **Creator Awards Fatal Fans 2026** (votação aberta até 26/nov)
- Perfil público (`/{username}`): bio, online, indicação Awards, oferta/assinatura com cupom, pacotes 3/6 meses, Presente, posts/mídias, CTA Assinar
- Ex.: Emme White — promo R$ 20→R$ 5/mês + cupom; packs 3m/6m

## Produto (Termos + UI)

- **Assinatura** (planos/periodicidade)
- **Conteúdo avulso** (perfil/feed ou DM)
- **Chamada de vídeo** (pago, acordado entre creator e fan)
- Presente / oferta / cupom de 1ª compra (UI perfil)
- Sem pitch Telegram / bot tipo CloseBot na superfície pública

## Creator

- Campanha Fatal Model: taxa “mais barata”, renda 24h, suporte humanizado
- Integração Fatal Model: acompanhante cadastrado + 100 vídeos → botão no perfil FM
- KYC: docs + biometria (Termos); não executado
- Desativação com assinaturas ativas (perfil some p/ novos; assinantes até fim do período)

## Pagamentos / taxas

- Termos **6.3**: taxa de transação **15%** (pode variar)
- Privacidade: processamento via **PIX** (análise/fraude/comprovantes)
- Retenção extra possível p/ chargeback / fraude / violação (6.4)
- Sem direito de arrependimento pós-pagamento (disponibilização imediata — 6.5)

## App

- Sem app nativo observado na inspeção pública (web)

## Institucional / legal

- Termos · Política de privacidade
- CNPJ 63.400.101/0001-70 · FF Tecnologia Ltda.
- Canal denúncia: `suporte@fatalfans.com`
- Ligação de marca com **Fatal Model**

## Fora de escopo (esta sessão)

- Submit login/signup · área logada · checkout · KYC creator · chat pago
