## Objetivo
Criar e **publicar a versão 0.1** do RoleGo: **autenticação e onboarding** (épico E01), acessível em produção.

## Escopo (v0.1)
### Conta e autenticação
- Criar conta (e-mail, senha, confirmar senha — sem celular no cadastro)
- Entrar com Google e Apple
- Login com conta existente (e-mail ou social)
- Recuperar / redefinir senha (fluxo e-mail)
- Logout

### Onboarding
- Preferências de tipo de evento
- Cidade
- Permissão de localização
- Raio de busca (1–100 km)
- Concluir onboarding e entrar no app com preferências aplicadas

### Perfil (mínimo)
- Foto, nome completo, e-mail

### Publicação
- Build e deploy em https://rolego.com.br (substituir “em breve” pelo app v0.1)
- Confirmar HTTPS e rotas SPA

## Contexto
Épico E01 priorizado no MVP. Já existem: escopo em `epics.md`, protótipo React em `web/` (estado em memória), identidade visual v1 e fluxo de deploy Contabo em `deploy/README.md`. A v0.1 fecha o ciclo: app navegável publicado, não só protótipo local.

## Insumos
- Escopo: `role-go/epics.md` § E01
- Protótipo: `role-go/web/`
- Deploy: `role-go/deploy/README.md`
- Marca: `role-go/marca/` · cards [identidade](https://trello.com/c/gU37I2lg) / [logo](https://trello.com/c/S7jWwUbC)
- Wireframes: `role-go/input/rolego_mvp_completo_dark.pdf`

## Entrega
- App v0.1 (auth + onboarding + perfil mínimo) publicado em rolego.com.br
- Documentação de deploy / rollback atualizada se o fluxo mudar
- Pasta local da task com card ID e links

## Fora de escopo (v0.1)
- Descoberta/publicação de eventos (E02+)
- API real / persistência (protótipo pode permanecer em memória se acordado; backend autenticação real = follow-up se necessário)
- Social, ingressos, gamificação, premium

## Critérios de aceite
- [ ] Fluxos de cadastro, login, recuperar senha e logout utilizáveis no ambiente publicado
- [ ] Onboarding completo (preferências → cidade → localização → raio) leva à home stub
- [ ] Perfil: ver/editar nome, e-mail e foto
- [ ] Visual alinhado à identidade v1
- [ ] https://rolego.com.br serve a v0.1 (não a página “em breve”)