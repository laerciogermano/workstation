# E01 — Conta, depósito NFC-e e vínculo EAN

Objetivo: permitir que o usuário crie sua conta e configure seu acesso local, deposite suas notas fiscais de consumidor eletrônicas (NFC-e) por câmera ao vivo ou upload de imagem, evite duplicidades e participe do índice cooperativo associando códigos de barras EAN aos itens adquiridos.

| ID | História | RF | Prio | Pts | Telas |
|---|---|---|---|---|---|
| US-01.01 | Criar conta com e-mail | RF-E01-01 | M | 3 | T-02 |
| US-01.02 | Login com e-mail e senha | RF-E01-02 | M | 2 | T-03 |
| US-01.03 | Logout e revogação de sessão | RF-E01-03 | M | 1 | T-51 |
| US-01.04 | Recuperar senha | RF-E01-04 | M | 3 | T-04 |
| US-01.05 | Onboarding de localização (cidade / GPS) | RF-E01-05 | M | 2 | T-05 |
| US-01.06 | Depositar nota fiscal por QR câmera ao vivo | RF-E01-06 | M | 5 | T-20, T-22 |
| US-01.07 | Depositar nota fiscal por foto ou imagem | RF-E01-07 | M | 3 | T-21, T-22 |
| US-01.08 | Tratamento de nota duplicada | RF-E01-08 | M | 2 | T-20, T-21, T-22 |
| US-01.09 | Listar minhas notas depositadas | RF-E01-09 | S | 2 | T-50 |
| US-01.10 | Vincular EAN cooperativo (câmera, foto ou digitação) | RF-E01-10 | M | 3 | T-23 |
| US-01.11 | Escolher foto representativa do produto | RF-E01-11 | S | 3 | T-24 |
| US-01.12 | Excluir conta e dados pessoais (LGPD) | RF-E01-12 | M | 3 | T-51 |

---

## US-01.01 — Criar conta com e-mail
**Como** consumidor,  
**quero** criar uma conta com e-mail e senha no notinhas.shop,  
**para** manter meu histórico de notas fiscais salvas e colaborar com a comunidade.

**Regras de negócio:**
- O e-mail deve ser normalizado (remoção de espaços e conversão para minúsculas).
- Senha obrigatória com no mínimo 8 caracteres, contendo pelo menos uma letra e um número.
- O aceite dos Termos de Uso e Política de Privacidade é obrigatório antes da criação.
- Caso o e-mail já esteja cadastrado, retornar erro HTTP 409 com mensagem neutra orientando para a tela de login.
- A criação da conta emite um par de tokens: JWT de acesso de curta duração (15 min) e refresh token em cookie seguro `HttpOnly` com rotação automática.

```gherkin
# language: pt
Funcionalidade: Criar conta com e-mail

  Cenário: Cadastro com dados válidos
    Dado que estou na tela "Criar conta" (T-02)
    Quando preencho o e-mail "Carlos.Silva@Exemplo.com"
    E preencho a senha "senhaForte2026"
    E preencho a confirmação de senha "senhaForte2026"
    E marco o aceite de Termos de Uso e Política de Privacidade
    E toco no botão "Criar conta"
    Então minha conta é registrada com o e-mail "carlos.silva@exemplo.com"
    E recebo cookies de sessão autenticada
    E sou direcionado para a tela "Onboarding local" (T-05)

  Cenário: Confirmação de senha divergente
    Dado que estou na tela "Criar conta" (T-02)
    Quando preencho a senha "senhaForte2026"
    E preencho a confirmação com "senhaDiferente2026"
    Então vejo a mensagem "As senhas não conferem"
    E o botão "Criar conta" permanece desabilitado

  Cenário: E-mail já existente na base
    Dado que já existe um usuário cadastrado com "carlos.silva@exemplo.com"
    Quando submeto o cadastro com o e-mail "carlos.silva@exemplo.com"
    Então recebo a mensagem "Este e-mail já possui cadastro. Faça login para continuar."
    E vejo um atalho direto para a tela "Entrar" (T-03)
```

---

## US-01.02 — Login com e-mail e senha
**Como** usuário cadastrado,  
**quero** entrar na minha conta informando e-mail e senha,  
**para** acessar meu painel financeiro e minhas notas salvas.

**Regras de negócio:**
- Validação estrita de hash seguro de senha (argon2id ou bcrypt).
- Rate limit de 5 tentativas consecutivas incorretas por IP/e-mail em janela de 10 minutos (HTTP 429).
- Mensagem de credenciais incorretas genérica para evitar enumeração de contas.
- Se o usuário não tiver concluído o onboarding de localização, redirecionar para `T-05`; caso contrário, ir para `T-10` (Home).

```gherkin
# language: pt
Funcionalidade: Login com e-mail e senha

  Cenário: Login bem-sucedido com onboarding concluído
    Dado que possuo cadastro ativo com "carlos.silva@exemplo.com" e onboarding concluído
    Quando estou na tela "Entrar" (T-03)
    E preencho "carlos.silva@exemplo.com" e minha senha correta
    E toco em "Entrar"
    Então sou autenticado com sucesso
    E sou redirecionado para a tela "Home destaques" (T-10)

  Cenário: Tentativa com senha incorreta
    Dado que possuo cadastro ativo
    Quando informo uma senha incorreta
    Então vejo o aviso "E-mail ou senha incorretos"
    E não recebo tokens de sessão

  Cenário: Bloqueio temporário por rate limit
    Dado que errei a senha 5 vezes consecutivas no último minuto
    Quando tento submeter o formulário de login novamente
    Então vejo "Muitas tentativas sem sucesso. Aguarde 10 minutos para tentar novamente." (HTTP 429)
```

---

## US-01.03 — Logout e revogação de sessão
**Como** usuário autenticado,  
**quero** sair da minha conta ou revogar todas as sessões ativas,  
**para** garantir que aparelhos compartilhados não continuem com acesso.

**Regras de negócio:**
- Logout individual invalida o refresh token atual no banco e apaga cookies do cliente.
- Logout global invalida toda a família de refresh tokens do usuário.
- Redirecionamento obrigatório para a home anônima (`T-10`).

```gherkin
# language: pt
Funcionalidade: Logout e revogação de sessão

  Cenário: Logout no dispositivo atual
    Dado que estou logado na tela "Perfil" (T-51)
    Quando toco em "Sair da conta" e confirmo a ação
    Então meu refresh token atual é marcado como revogado no banco
    E meus cookies de autenticação são destruídos
    E sou redirecionado para a tela "Home · Destaques" (T-10)

  Cenário: Logout de todos os dispositivos
    Dado que estou logado no meu celular
    Quando toco em "Desconectar todos os aparelhos"
    Então todas as sessões ativas vinculadas à minha conta são revogadas
```

---

## US-01.04 — Recuperar senha
**Como** usuário que esqueceu as credenciais,  
**quero** solicitar um link de redefinição para meu e-mail,  
**para** criar uma nova senha e retomar meu acesso.

**Regras de negócio:**
- O formulário solicita apenas o e-mail cadastrado.
- A resposta da API é sempre positiva e idêntica ("Se o e-mail estiver cadastrado, enviamos as instruções") para mitigar enumeração de contas.
- O token enviado tem validade máxima de 60 minutos e uso único.
- Ao redefinir a senha com sucesso, todas as sessões ativas anteriores são invalidadas.

```gherkin
# language: pt
Funcionalidade: Recuperar senha

  Cenário: Solicitação de redefinição com e-mail cadastrado
    Dado que estou na tela "Recuperar senha" (T-04)
    Quando informo o e-mail "carlos.silva@exemplo.com" e toco em "Enviar link"
    Então vejo a mensagem "Se o e-mail estiver cadastrado, enviamos as instruções de recuperação."
    E um e-mail com token temporário de 60 minutos é despachado

  Cenário: Redefinição com token válido
    Dado que acessei o link de redefinição recebido por e-mail
    Quando informo a nova senha "novaSenha2026" com confirmação idêntica
    Então minha senha é atualizada com sucesso
    E todas as sessões anteriores são invalidadas
    E sou direcionado para a tela "Entrar" (T-03) com aviso de sucesso
```

---

## US-01.05 — Onboarding de localização (cidade / GPS)
**Como** novo usuário,  
**quero** definir minha localização via GPS ou selecionar minha cidade,  
**para** visualizar ofertas, estabelecimentos e comparações relevantes para o meu raio físico.

**Regras de negócio:**
- O app tenta obter as coordenadas do GPS com consentimento explícito do navegador.
- Se a permissão for concedida, armazena `lat` e `lng` e define o modo de origem como `gps`.
- Se a permissão for negada, o usuário escolhe a cidade base em uma lista (ex.: Curitiba, Londrina, Maringá) e o modo de origem vira `city`.
- O raio padrão inicial é de 5 km (ajustável de 1 km a 50 km).
- Grava o estado de onboarding concluído no perfil.

```gherkin
# language: pt
Funcionalidade: Onboarding de localização

  Cenário: Concessão de permissão de geolocalização via GPS
    Dado que estou na tela "Onboarding local" (T-05)
    Quando toco em "Usar minha localização atual"
    E autorizo a permissão de GPS no navegador
    Então o sistema captura minhas coordenadas geográficas
    E define o raio padrão de busca em 5 km
    E sou direcionado para a tela "Home destaques" (T-10)

  Cenário: Recusa do GPS e escolha manual de cidade
    Dado que estou na tela "Onboarding local" (T-05)
    Quando nego a permissão de localização do navegador
    Então vejo a seleção manual de cidades atendidas
    Quando seleciono "Curitiba - PR" e confirmo
    Então minha localização base é associada às coordenadas centrais de Curitiba
    E avanço para a tela "Home destaques" (T-10)
```

---

## US-01.06 — Depositar nota fiscal por QR câmera ao vivo
**Como** consumidor com uma nota fiscal impressa,  
**quero** apontar a câmera do celular para o QR Code da NFC-e,  
**para** que o sistema capture a URL da Fazenda, extraia os produtos e registre os preços no índice coletivo.

**Regras de negócio:**
- Acesso à câmera traseira em modo contínuo via HTTPS obrigatório (`T-20`).
- Reconhecimento automático de URL padrão SEFAZ Paraná (`fazenda.pr.gov.br/nfce/qrcode?p=...`).
- O backend consulta o portal público da SEFAZ, realiza o parse do HTML da DANFE e extrai:
  1. Empresa (CNPJ, Razão Social, Endereço).
  2. Nota (Chave de Acesso de 44 dígitos, Número, Série, Data/Hora de emissão, Totais).
  3. Itens (Código do produto na loja, Descrição, Quantidade, Unidade, Valor Unitário, Valor Total).
- Se a nota pertencer a uma empresa inédita, a empresa é cadastrada e enfileirada para geocodificação.
- Cada item é associado à nota respeitando a unicidade `(nota_id, codigo)`.
- Se o usuário estiver autenticado, a nota fica associada ao seu `usuario_id` para fins de extrato financeiro pessoal.

```gherkin
# language: pt
Funcionalidade: Depositar nota fiscal por QR câmera ao vivo

  Cenário: Leitura de QR Code válido da SEFAZ Paraná com sucesso
    Dado que estou na tela "Scan QR live" (T-20)
    Quando aponto a câmera para o QR Code de uma nota com chave "41261175315333000109650010000123451000123456"
    Então o leitor decodifica a URL da Fazenda PR
    E o sistema faz a requisição para "POST /api/nota"
    E a nota é importada com sucesso registrando empresa e 12 itens
    E sou direcionado para a tela "Nota ok" (T-22) exibindo o total de R$ 145,80 e a lista de produtos
```

---

## US-01.07 — Depositar nota fiscal por foto ou imagem
**Como** usuário que fotografou a nota fiscal ou possui o cupom salvo na galeria,  
**quero** fazer upload da imagem do QR Code,  
**para** depositar a nota mesmo quando não puder escanear em tempo real.

**Regras de negócio:**
- A tela de scan (`T-21`) disponibiliza os botões "Tirar foto" (`capture=environment`) e "Escolher da galeria".
- O arquivo é decodificado localmente pelo motor de QR Code no navegador (`Html5Qrcode.scanFile`).
- Se um QR Code válido for detectado, o payload segue o mesmo fluxo de ingestão `POST /api/nota`.
- Se a imagem estiver desfocada, cortada ou sem QR Code legível, exibir mensagem amigável instruindo nova captura e manter a câmera ao vivo disponível.

```gherkin
# language: pt
Funcionalidade: Depositar nota fiscal por foto ou imagem

  Cenário: Upload de foto nítida contendo QR Code válido
    Dado que estou na tela "Scan QR foto" (T-21)
    Quando seleciono o arquivo de imagem "recibo_mercado.jpg" da minha galeria
    Então o sistema decodifica com sucesso o QR Code contido na imagem
    E processa a importação dos dados da DANFE na SEFAZ
    E sou encaminhado para a tela "Nota ok" (T-22) com o resumo dos itens

  Cenário: Upload de imagem sem QR Code identificável
    Dado que estou na tela "Scan QR foto" (T-21)
    Quando envio uma imagem borrada ou sem código
    Então o sistema exibe o aviso "Não identificamos um QR Code válido nesta imagem. Tente uma foto mais nítida ou use a câmera ao vivo."
    E permaneço na tela de captura sem perda de contexto
```

---

## US-01.08 — Tratamento de nota duplicada
**Como** usuário que escaneia notas com frequência,  
**quero** que o sistema reconheça se a nota já foi depositada anteriormente,  
**para** não duplicar dados no índice nem inflar meu histórico financeiro.

**Regras de negócio:**
- A chave de acesso de 44 dígitos é o identificador único universal da NFC-e (`chave_acesso UNIQUE`).
- Se a nota já existir no banco:
  - Não criar novos registros nas tabelas `notas` nem `itens`.
  - Se a nota já cadastrada não tinha dono e o usuário atual está logado, associar a nota à sua conta.
  - Retornar status HTTP 200 com indicador `duplicada: true` e a data em que ela foi originalmente importada.
- Na tela `T-22`, apresentar badge informativo "Nota já registrada anteriormente" sem tratar como falha de sistema.

```gherkin
# language: pt
Funcionalidade: Tratamento de nota duplicada

  Cenário: Escaneamento de nota fiscal já existente na base
    Dado que a nota com chave "41261175315333000109650010000123451000123456" já foi depositada em "2026-11-02"
    Quando submeto o QR Code desta mesma nota na tela "Scan QR live" (T-20)
    Então o sistema identifica que a chave de acesso já existe
    E não insere itens repetidos no banco de dados
    E sou direcionado para a tela "Nota ok" (T-22) com a indicação "Esta nota já havia sido registrada em 02/11/2026"
```

---

## US-01.09 — Listar minhas notas depositadas
**Como** usuário logado,  
**quero** visualizar a listagem histórica de todas as notas fiscais que depositei,  
**para** acompanhar minhas compras e auditar o que já foi enviado ao sistema.

**Regras de negócio:**
- Exclusivo para usuários autenticados (`T-50`).
- Exibe cards de notas ordenados da emissão mais recente para a mais antiga (`notas.emissao DESC`).
- Cada card exibe: Nome do estabelecimento, Data e hora da compra, Quantidade de itens e Valor total pago.
- O clique no card da nota expande os detalhes com a lista completa de itens adquiridos e seus respectivos preços.

```gherkin
# language: pt
Funcionalidade: Listar minhas notas depositadas

  Cenário: Visualização da lista de notas com compras registradas
    Dado que estou autenticado e possuo 5 notas cadastradas na minha conta
    Quando acesso a aba "Minhas notas" no "Extrato financeiro" (T-50)
    Então vejo a listagem das 5 notas ordenadas pela data de compra
    E cada nota exibe o nome do mercado, valor total e quantidade de itens

  Cenário: Usuário sem nenhuma nota depositada
    Dado que criei uma conta nova e ainda não escaneei nenhuma nota
    Quando acesso "Minhas notas" (T-50)
    Então vejo o estado vazio com a mensagem "Você ainda não depositou notas fiscais."
    E um botão de ação "Escanear primeira nota" que abre a tela "Scan QR live" (T-20)
```

---

## US-01.10 — Vincular EAN cooperativo (câmera, foto ou digitação)
**Como** colaborador do índice Notinhas,  
**quero** vincular o código de barras (EAN-13) ao código interno do produto em um determinado mercado,  
**para** que aquele item participe da comparação universal de preços entre todas as redes da cidade.

**Regras de negócio:**
- Como a NFC-e só traz a descrição e o código de unidade interno do mercado, o vínculo com o EAN universal é cooperativo.
- A chave única do vínculo é `(empresa_id, codigo_unidade)`.
- O modal `T-23` oferece 3 formas de informar o EAN:
  1. Câmera ao vivo lendo o código de barras impresso na embalagem.
  2. Foto ou imagem do código de barras.
  3. Digitação manual do número do código de barras (8, 12, 13 ou 14 dígitos).
- Validação do dígito verificador do EAN (algoritmo Módulo 10).
- Salva o registro em `codigos_barras` via `POST /api/codigos-barras` (upsert).
- Se houver foto catalogada para aquele EAN em `ean-fotos/` ou no catálogo de imagens, atualiza a referência `foto_url` automaticamente.

```gherkin
# language: pt
Funcionalidade: Vincular EAN cooperativo

  Cenário: Vínculo de EAN via leitor de código de barras na embalagem
    Dado que estou visualizando um item com código interno "9871" do mercado "Festval"
    Quando abro o modal "Vincular EAN" (T-23)
    E aponto a câmera para o código de barras "7891000100103" do produto
    Então o número "7891000100103" é reconhecido e validado no dígito verificador
    E toco em "Confirmar vínculo"
    Então o mapeamento do item é gravado com sucesso
    E o produto passa a exibir o selo de comparação universal

  Cenário: Digitação manual de EAN inválido
    Dado que estou no modal "Vincular EAN" (T-23)
    Quando digito manualmente "7891000100109" com dígito verificador incorreto
    E toco em "Confirmar vínculo"
    Então vejo o alerta "Código de barras inválido. Confira os números na embalagem."
    E o vínculo não é salvo no banco
```

---

## US-01.11 — Escolher foto representativa do produto
**Como** usuário ou curador da comunidade,  
**quero** escolher a melhor imagem entre as fotos candidatas encontradas para um EAN,  
**para** que a vitrine e a busca exibam uma embalagem nítida e confiável.

**Regras de negócio:**
- Quando um novo EAN é registrado no sistema, um crawler busca até 5 imagens candidatas em bases públicas de produtos (ex.: Open Food Facts, UPCitemdb).
- As fotos candidatas são salvas em `ean_imagens` e vinculadas ao EAN.
- Na tela `T-24`, o usuário pode visualizar a galeria de candidatas para aquele EAN e selecionar a imagem representativa.
- A imagem marcada como selecionada (`selecionada = true`) passa a alimentar o campo `foto_url` de visualização no feed, nas vitrines e na busca.

```gherkin
# language: pt
Funcionalidade: Escolher foto representativa do produto

  Cenário: Selecionar imagem representativa na galeria de candidatas
    Dado que o produto EAN "7894900011517" possui 3 imagens candidatas carregadas
    Quando abro a tela "Foto EAN" (T-24) para este produto
    E toco na segunda imagem que possui fundo branco e embalagem nítida
    E clico em "Definir como foto principal"
    Então a imagem escolhida é definida como a foto oficial do produto
    E passa a ser exibida imediatamente no card do feed e na vitrine da loja
```

---

## US-01.12 — Excluir conta e dados pessoais (LGPD)
**Como** usuário cadastrado,  
**quero** solicitar a exclusão definitiva da minha conta e anonimização dos meus dados pessoais,  
**para** exercer meus direitos fundamentais de privacidade previstos na LGPD.

**Regras de negócio:**
- O fluxo exige confirmação explícita digitando a palavra "EXCLUIR" na tela `T-51`.
- Ação irreversível:
  - O registro do usuário na tabela `usuarios` recebe `status = 'deleted'`, o e-mail é anonimizado (`anon_<hash>@removido.notinhas.shop`), senha e tokens são destruídos.
  - As notas fiscais e itens depositados permanecem no sistema para manter a integridade histórica dos preços coletivos, porém o campo `usuario_id` é desvinculado (`SET NULL`), eliminando qualquer vínculo entre o indivíduo e a compra.
  - Cestas e preferências pessoais do usuário são removidas fisicamente.
  - Registra a operação no log de auditoria com timestamp UTC.

```gherkin
# language: pt
Funcionalidade: Excluir conta e dados pessoais (LGPD)

  Cenário: Solicitação de exclusão com confirmação válida
    Dado que estou autenticado na tela "Perfil" (T-51)
    Quando toco em "Excluir minha conta"
    E digito "EXCLUIR" no campo de confirmação
    E clico em "Confirmar exclusão definitiva"
    Então meus dados pessoais e credenciais são anonimizados no banco
    E minhas notas fiscais perdem o vínculo com meu usuário
    E minhas sessões ativas são revogadas
    E sou deslogado e redirecionado para a tela "Home · Destaques" (T-10) com a confirmação da exclusão
```
