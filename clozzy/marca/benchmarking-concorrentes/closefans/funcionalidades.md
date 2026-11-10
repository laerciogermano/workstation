# CloseFans — inventário de funcionalidades

Fonte: inspeção CDP `closefans` :9264 (2026-11-10) + [Central de ajuda](https://ajuda.close.fans/pt-br/) + [Termos](https://close.fans/termos-de-uso) + [blog](https://blog.close.fans/).

## Cadastro / acesso

- Landing: Entrar · Cadastre-se · “Venda seu conteúdo” · “Indique e ganhe”
- Login (`/login`): e-mail + senha · Lembrar de mim · Esqueceu a senha · OAuth (“ou usando”)
- Signup fan (`/signin`): e-mail + senha · 18+ implícito nos Termos · Cadastrar-se
- Onboarding creator (`/onboarding`): mesmo form “Venda seu conteúdo / Cadastre-se agora”
- Pós-login creator (help): menu ☰ → “Venda seu conteúdo” → dados + docs
- Age gate 18+ (Termos); KYC docs por e-mail `documentos@close.fans` (CNH/RG, endereço, selfie + doc, conta bancária; PJ: contrato social)

## Produto (pitch)

- **3 em 1:** Site exclusivo + Bot Telegram + Integração automática
- Alegação landing: **+1 milhão de usuários mensais**
- CNPJ 49.425.086/0001-93 · SP

## Discovery / fan (help + UI pública)

- Busca / “Encontre criadores” (`/search` — gate login se deslogado)
- Assinar conteúdo; acesso ao conteúdo assinado
- Acesso compra via **Telegram** (canal VIP integrado)
- Chat com criador (mensagens livres **ou** após mimo — config do criador)
- Mimos/presentes (limite 3 criadores/dia; cartão até R$ 250/criador/mês; Pix sem limite valor; sem reembolso de mimo)
- Cancelar assinatura · reembolso · excluir conta (assinante)
- Web App “Instalar o App”

## Creator (help + Termos — KYC não executado)

- Perfil público na Plataforma Própria + upload de conteúdo
- Assinatura (valores editáveis)
- Packs / conteúdos avulsos pelo chat
- Pedidos especiais · **Videochamada 1:1** (preço/duração/agenda no chat; link pós-pagamento)
- Lives (citadas no blog de monetização)
- CloseBot: assinatura Telegram sem perfil público obrigatório
- Integração Telegram (grupo vs canal)
- **CloseMatch:** troca de divulgação · contratar divulgação · agenda · materiais salvos
- Ocultar perfil das buscas · remover fã · inserir fãs manualmente
- Links de divulgação · Creator Close
- Carteira: saldo disponível/pendente · saques · chargebacks
- Conta bancária PF/PJ · alteração titularidade · estrangeiros
- Clientes de fora do BR · % / vendas via chat

## CloseBot (produto Telegram)

- Cobrar assinatura mensal / trimestral / anual em canal VIP
- Controle automático entrada/saída
- Pix ou cartão; repasse Close Fans
- Personalizar bot + mensagens automáticas
- Pode coexistir com perfil Close Fans tradicional

## Pagamentos / taxas

- Help: **20%** em cartão e Pix (só cobra quando vende)
- Termos 7.1–7.2: **20% receita bruta** + tarifa fixa por venda (ex.: R$ 0,90 cartão; trecho Pix/boleto no Termos)
- Liberação (Termos 6.3): Pix **1 dia útil**; boleto **3**; cartão **30 dias úteis**
- Saque: 1/dia; mesmo CPF/CNPJ; validações em contas novas
- Métodos: Pix, cartão, boleto, transferência (conforme serviço)

## App (“app”)

- **Sem app nativo** (App Store / Play Store)
- Web App / atalho (Android, iPhone, Windows, Mac) — help “Instalar o App”

## Institucional / legal

- Termos de uso · Aviso de privacidade
- Ajuda (Crisp Knowledge) · Blog Close News
- Redes: Instagram · Telegram · TikTok · YouTube
- Proíbe promover Privacy/OnlyFans/concorrentes na plataforma (Termos 3.6)

## Área logada fan (CDP 2026-11-10)

- Signup: e-mail + senha + aceite 18+/Termos → direto `/my-feed` (sem gate de confirmação)
- Nav: **Feed** · **Descobrir**
- Feed: tabs Para você / Seguindo; cards com Seguir Grátis, Chat, Enviar presente; rail Black Friday Top N
- **Descobrir:** Perfis recomendados · Top Videochamadas · Em Alta · Top Assinaturas · Top Packs; filtros Todas / Black Friday / Disponível para chamada / Online / Novidades / Mais Seguidores / TOP Telegram / Mais Ativas
- Busca / highlights: ranking Top 1…N
- Settings: Minha conta / Edite seus dados
- `/wallet` → onboarding creator (Dados pessoais → Endereço → Monetização → Customize → Documentos)
- Rotas `/chat` `/messages` `/notifications` `/profile` `/subscriptions` → “LINK ANTIGO” + fallback Descobrir

## Pendente

- KYC creator completo + painel saque
- Checkout Pix real
- Rota canônica de chat/inbox (URLs antigas 404)
