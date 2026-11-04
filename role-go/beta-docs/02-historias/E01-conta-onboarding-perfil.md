# E01 — Conta, onboarding e perfil

Objetivo: o usuário cria a conta, configura a descoberta em menos de **60 segundos** e mantém um perfil básico.

| ID | História | RF | Prio | Pts | Telas |
|---|---|---|---|---|---|
| US-01.01 | Criar conta com e-mail | RF-E01-01 | M | 3 | T-02 |
| US-01.02 | Entrar com Google | RF-E01-02 | M | 3 | T-02, T-03 |
| US-01.03 | Entrar com Apple | RF-E01-03 | S | 3 | T-02, T-03 |
| US-01.04 | Login com e-mail | RF-E01-04 | M | 2 | T-03 |
| US-01.05 | Recuperar senha | RF-E01-05 | M | 3 | T-04 |
| US-01.06 | Logout | RF-E01-06 | M | 1 | T-31 |
| US-01.07 | Escolher tipos de evento | RF-E01-07 | M | 2 | T-05 |
| US-01.08 | Escolher cidade | RF-E01-08 | M | 2 | T-06 |
| US-01.09 | Permitir localização | RF-E01-09 | M | 3 | T-07 |
| US-01.10 | Definir raio e concluir onboarding | RF-E01-10/11 | M | 2 | T-08 |
| US-01.11 | Editar perfil e foto | RF-E01-12 | M | 3 | T-32 |
| US-01.12 | Editar preferências e privacidade | RF-E01-13/14 | M | 2 | T-33 |
| US-01.13 | Excluir conta | RF-E01-15 | M | 3 | T-33 |
| US-01.14 | Verificar e-mail | RF-E01-16 | S | 2 | T-02 |
| US-01.15 | Entrar com passkey | RF-E01-18 | S | 5 | T-03, T-09 |

---

## US-01.01 — Criar conta com e-mail
**Como** visitante, **quero** criar uma conta com e-mail e senha **para** usar o RoleGo sem depender de rede social.

**Regras:** e-mail normalizado (trim + minúsculas); senha com ≥ 8 caracteres, letras e números; confirmação igual à senha; aceite de Termos/Privacidade e autodeclaração 18+ obrigatórios; e-mail já cadastrado devolve 409 com mensagem neutra; a autenticação usa um JWT de acesso de 10 min + refresh token rotativo, ambos em cookies httpOnly ([ADR-008](../04-adrs.md#adr-008)).

```gherkin
Funcionalidade: Criar conta com e-mail

  Cenário: Cadastro válido
    Dado que estou na tela "Criar conta"
    Quando preencho e-mail "Ana@Exemplo.com " e senha "rolê2026ok" duas vezes
    E marco "Li e aceito os Termos e a Política de Privacidade"
    E marco "Tenho 18 anos ou mais"
    E toco em "Criar conta"
    Então minha conta é criada com e-mail "ana@exemplo.com"
    E sou levado para "Onboarding — o que você curte?"

  Cenário: Senhas diferentes
    Quando preencho senha "rolê2026ok" e confirmação "rolê2026no"
    Então vejo "As senhas não conferem." abaixo da confirmação
    E o botão "Criar conta" continua desabilitado

  Cenário: E-mail já cadastrado
    Dado que existe conta com "ana@exemplo.com"
    Quando tento criar conta com "ana@exemplo.com"
    Então vejo "Este e-mail já tem conta. Quer entrar?" com link para o login

  Cenário: Sem aceite dos termos
    Quando não marco o aceite dos termos
    Então o botão "Criar conta" fica desabilitado
```

## US-01.02 — Entrar com Google
**Como** visitante, **quero** entrar com minha conta Google **para** começar sem criar senha.

**Regras:** fluxo OAuth com o code no backend; procura a conta pelo `googleSub`; se não achar, vincula pelo e-mail **verificado**; se também não houver conta, cria uma e pede aceite de termos + 18+ numa etapa curta antes do onboarding.

```gherkin
  Cenário: Primeiro acesso com Google
    Dado que não tenho conta
    Quando autorizo o RoleGo no Google com e-mail verificado "bia@gmail.com"
    Então vejo a etapa "Só mais uma coisa" com termos e 18+
    E ao confirmar sou levado para o onboarding

  Cenário: Conta existente por e-mail
    Dado que existe conta por senha com "bia@gmail.com"
    Quando entro com Google usando "bia@gmail.com" verificado
    Então a conta Google é vinculada à conta existente
    E entro direto no feed

  Cenário: Provedor não configurado
    Dado que o login Google está desligado no servidor
    Então o botão "Continuar com Google" não aparece
```

## US-01.03 — Entrar com Apple
Igual à US-01.02, mas com `id_token` validado no JWKS da Apple. O e-mail de relay (`privaterelay.appleid.com`) é aceito como e-mail da conta. O nome só chega no primeiro login, então deve ser gravado nesse momento.

## US-01.04 — Login com e-mail
```gherkin
  Cenário: Credenciais válidas com onboarding feito
    Dado que tenho conta com onboarding concluído
    Quando entro com e-mail e senha corretos
    Então vou para o feed

  Cenário: Credenciais válidas com onboarding pendente
    Então vou para o primeiro passo pendente do onboarding

  Cenário: Credenciais inválidas
    Quando erro a senha
    Então vejo "E-mail ou senha incorretos."
    E a mensagem é a mesma se o e-mail não existir

  Cenário: Rate limit
    Quando faço 11 tentativas em 1 minuto do mesmo IP
    Então recebo "Muitas tentativas. Tente de novo em instantes." (HTTP 429)

  Cenário: Usuário bloqueado
    Dado que minha conta foi bloqueada pela moderação
    Quando tento entrar
    Então vejo "Sua conta está suspensa. Fale com suporte@rolego.com.br"
```

## US-01.05 — Recuperar senha
```gherkin
  Cenário: Pedido de redefinição
    Quando informo "ana@exemplo.com" em "Esqueci minha senha"
    Então vejo "Se existir uma conta, enviamos um link." (mesma resposta com ou sem conta)
    E um e-mail com link válido por 1 hora é enviado

  Cenário: Redefinir com token válido
    Dado que abri o link recebido
    Quando defino uma nova senha válida
    Então a senha é alterada, o token é invalidado
    E todos os meus refresh tokens anteriores são revogados (os outros aparelhos saem)
    E entro logado

  Cenário: Token expirado ou já usado
    Então vejo "Este link expirou. Peça um novo." com botão para pedir de novo
```

## US-01.06 — Logout
```gherkin
  Cenário: Sair
    Quando toco em "Sair" no perfil e confirmo
    Então a família do meu refresh token é revogada, os cookies são apagados e vou para o Splash

  Cenário: Sair de todos os aparelhos
    Quando toco em "Sair de todos os aparelhos"
    Então todos os meus refresh tokens são revogados
    E os outros aparelhos são deslogados em até 10 minutos (vida do access token)
```

## US-01.07 — Escolher tipos de evento
Catálogo do Beta: **Festas, Shows, Bares, Eletrônica, Sertanejo, Pagode/Samba, Rock, Cultural, Festivais, Eventos privados**. É configurável pelo seed.
```gherkin
  Cenário: Escolha mínima
    Dado que estou em "O que você curte?"
    Quando não seleciono nenhum tipo
    Então "Continuar" fica desabilitado
    Quando seleciono "Festas" e "Eletrônica"
    Então "Continuar" fica habilitado e grava as preferências ao avançar
```

## US-01.08 — Escolher cidade
```gherkin
  Cenário: Cidade sugerida
    Quando toco em "Curitiba"
    Então a cidade fica selecionada e posso continuar

  Cenário: Busca de cidade
    Quando digito "flori"
    Então vejo "Florianópolis — SC" nas sugestões
    E cidades ainda sem eventos mostram o selo "em breve"
```

## US-01.09 — Permitir localização
**Regras:** explicar o porquê **antes** do prompt nativo; gravar lat/lng com 3 casas decimais (cerca de 100 m, minimização de dados); se negar, usar o centro da cidade; dá para mudar isso depois.
```gherkin
  Cenário: Permite
    Quando toco em "Usar minha localização" e o navegador concede
    Então minha origem de busca passa a ser "localização atual"

  Cenário: Nega
    Quando o navegador nega a permissão
    Então vejo "Tudo bem! Vamos usar o centro de Curitiba." e posso continuar

  Cenário: Pular
    Quando toco em "Agora não"
    Então a origem passa a ser o centro da cidade escolhida
```

## US-01.10 — Definir raio e concluir
```gherkin
  Cenário: Raio contínuo
    Dado que estou em "Até onde você vai?"
    Quando arrasto o slider para 35
    Então vejo "35 km" e uma prévia "~ 48 eventos nessa área"
    Quando toco em "Bora explorar"
    Então o onboarding é concluído e vou para o feed já filtrado por 35 km

  Cenário: Onboarding incompleto
    Dado que não escolhi cidade
    Quando a API recebe "concluir onboarding"
    Então responde 422 com "Escolha sua cidade."
```

## US-01.11 — Editar perfil e foto
```gherkin
  Cenário: Trocar foto com editor de recorte
    Quando escolho um PNG de 3 MB
    Então vejo o editor de recorte com moldura quadrada
    E posso arrastar, ajustar o zoom e girar 90°
    Quando confirmo o recorte
    Então a foto é convertida para WebP 512px e exibida
    E a foto antiga é apagada

  Cenário: Cancelar recorte
    Dado que o editor de recorte está aberto
    Quando cancelo
    Então a foto do perfil não muda

  Cenário: Arquivo inválido
    Quando envio um PDF renomeado para .jpg
    Então vejo "Envie uma imagem JPG, PNG ou WebP de até 5 MB." (verificação pelos bytes)

  Cenário: Trocar e-mail
    Quando altero o e-mail para um já usado
    Então vejo "Este e-mail já está em uso."
```

## US-01.12 — Editar preferências e privacidade
```gherkin
  Cenário: Ocultar presença
    Dado que "Mostrar minha presença nos eventos" está ligado
    Quando desligo
    Então meu avatar deixa de aparecer em interessados/confirmados de qualquer evento
    E continuo sendo contado nos números agregados
```

## US-01.13 — Excluir conta
```gherkin
  Cenário: Exclusão
    Quando toco em "Excluir minha conta", digito "EXCLUIR" e confirmo
    Então meus dados pessoais são anonimizados, minhas fotos apagadas
    E meus eventos futuros como organizador são cancelados com aviso aos confirmados
    E sou deslogado
    E não consigo mais entrar com aquele e-mail/Google sem criar uma nova conta
```

## US-01.14 — Verificar e-mail (S)
```gherkin
  Cenário: Publicar sem e-mail verificado
    Dado que meu e-mail não foi verificado
    Quando tento publicar um evento
    Então vejo "Confirme seu e-mail para publicar" com botão "Reenviar link"
```

## US-01.15 — Entrar com passkey (S)
**Como** usuário, **quero** entrar com Face ID/digital **para** não depender de senha e ter mais segurança.

**Regras:** WebAuthn com `userVerification=required`, `rpId=rolego.com.br`; até 10 passkeys por conta; o convite para criar aparece uma vez ao fim do onboarding (T-09) e fica disponível em Preferências e privacidade; remover uma passkey exige estar autenticado; `signCount` menor que o salvo = rejeitar (possível clone).
```gherkin
  Cenário: Criar passkey depois do onboarding
    Dado que concluí o onboarding num iPhone com Face ID
    Quando toco em "Ativar Face ID"
    E confirmo a biometria
    Então uma passkey "iPhone" é salva na minha conta

  Cenário: Entrar com passkey pelo autofill
    Dado que tenho uma passkey neste aparelho
    Quando toco no campo de e-mail na tela "Entrar"
    Então o sistema sugere "Entrar com passkey — ana@exemplo.com"
    E ao confirmar a biometria entro direto em Explorar

  Cenário: Navegador sem suporte
    Dado um navegador sem WebAuthn
    Então o botão "Entrar com passkey" não aparece
```
