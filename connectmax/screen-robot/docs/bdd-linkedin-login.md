# BDD — Login LinkedIn via agent (Node)

**Por quê:** critério de aceite da funcionalidade maior que usa **cada** recorte de [`functionalities/`](functionalities/README.md).  
**Script:** [`../sources/android-control/scripts/linkedin-login.js`](../sources/android-control/scripts/linkedin-login.js)  
**Config do device:** [`../sources/android-control/device.config.json`](../sources/android-control/device.config.json)

```gherkin
Funcionalidade: Login no LinkedIn com agent Android via Node
  Como operador do screen-robot
  Quero provisionar o agent, instalar APKs, ler a tela e autenticar no LinkedIn
  Para validar o pipeline Node (US-01 → eventos US-02..05 → US-06 → operações US-07..12 → US-13)

  Contexto:
    Dado a config do dispositivo em device.config.json
    E as credenciais LINKEDIN_USER e LINKEDIN_PASSWORD no ambiente
    E a versão do Instagram definida em apps.instagram.version

  @provisionar @apks @eventos @operacoes @extrair @sessao
  Cenário: Login a partir da home ou já na tela de login
    Dado que o agente Android é provisionado e fica online
    E o APK do Instagram na versão da config é baixado e instalado
    E o APK do LinkedIn é instalado (se ainda não estiver)
    Quando o LinkedIn é aberto no agent
    E o sistema recebe o evento de UI estável (dump disponível)
    E um print da tela é salvo
    E os elementos e informações da tela são extraídos como árvore de componentes (textos, ícones, imagens/fotos, listas e containers)
    Então a árvore contém o botão de login (ex.: "Entrar" / "Sign in")
       ou a tela já é a de login (campos de usuário/senha)
    Quando as operações digitam usuário e senha e tocam em Entrar
    Então o estado da sessão é guardado em disco
    E a sessão registra device, apps, caminho do print e etapa "login_submitted"
```

### Mapeamento recorte → passo

| Recorte | Passo BDD / script |
|---------|-------------------|
| Provisionar um agente | `Dado que o agente Android é provisionado` → `provisionAgent()` |
| Instalar APKs | `E o APK do Instagram…` → `installApk(instagram)` (+ LinkedIn) |
| Receber eventos | `Quando… evento de UI estável` → `waitForUiReady()` |
| Executar operações | abrir aplicativo, screenshot, type, tap Entrar, scroll, resgatar x,y por imagem → `operate.*` |
| Extrair elementos e guardar sessão | `E os elementos…` → `extractElements()`; `Então o estado da sessão…` → `saveSession()` |
