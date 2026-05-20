# Arquitetura de Autenticação Paralela: Global vs E-commerce

A plataforma emprega uma topologia de **Autenticação Multi-Contexto** (Multi-Context Authentication). Isso significa que, em vez de compartilhar um *Single Sign-On* monolítico que exporia permissões e sessões de forma horizontal, o sistema isola contextos.

Existe o **Painel Administrativo/Portal (Global)** e o **Módulo E-commerce**. Ambos consultam as mesmas APIs base de validação, mas instauram tokens e gerenciam o ciclo de vida da persistência em contêineres e variáveis estritamente paralelos e separados. 

Abaixo detalhamos tecnicamente as responsabilidades e vetores de implementação.

---

## 1. Topologia e Serviços (The Storage Layer)

Ambos os logins utilizam o mesmo *endpoint* primário de verificação e concessão (`POST /api/v1/autenticacao/login`), porém a canalização do *Payload* após o `200 OK` dita como eles passam a existir.

### Autenticação Global (`auth.service.ts`)
* **Storage Key**: Persiste o objeto da classe `CurrentUser` no `localStorage` sob a chave `"currentUser"`.
* **State Management**: Levanta a sessão via um `BehaviorSubject` central injetado em toda a malha de roteamento da aplicação de gestão (ERP/Portal).
* **Renovação (Refresh Token)**: Intervencionada globalmente. Se o token expira, o acesso principal tranca. O Global também orquestra a sessão em "Saved Accounts", suportando o salvamento/troca de contas entre múltiplos usuários da mesma máquina.

### Autenticação E-commerce (`ecommerce-auth.service.ts`)
* **Storage Key**: O *payload* (Token + Refresh Token + metadados estendidos como `PessoaId`, perfil agregado do aluno) é guardado em `"ecommerceCurrentUser"`. Outra chave própria `"ecommerceSelection"` isola estados da loja vitrine, separando a persistência.
* **State Management**: Fica recluso no BehaviorSubject interno que monitora apenas injeções dentro do `EcommerceComponent` e em componentes estritos das filhas `vitrine`, `pedidos` e `cartões`.
* **Segurança e Destruição (Auto-Teardown)**: Enquanto o "Login Global" permanece rodando vivo até um logout explícito, o de e-commerce é volátil. Possui uma trava comportamental via `OnDestroy` em sua super-classe `e-commerce.component.ts` — ele aniquila ativamente seu próprio token (`clearSession()`) assim que o roteador escapa das rotas `/e-commerce/*`.

---

## 2. A Mágica do Roteamento Reverso: O Papel do `AuthInterceptor`

Um dos maiores desafios técnicos em um modelo *"Dual Auth"* é como construir os cabeçalhos de autorizações (`Authorization: Bearer <token>`) de forma automática nas centenas de requisições subsequentes sem errar qual token anexar. 

O `auth.interceptor.ts` funciona como um árbitro (`HttpInterceptor` de rede):

```typescript
const isEcommerce = this.router.url.includes('/e-commerce');
const storageKey = isEcommerce ? 'ecommerceCurrentUser' : 'currentUser';
```

1. **Context-Aware Inference**: Diferente de injetar interceptadores separados dependendo da injeção de dependência Módulo-a-Módulo, usamos o Padrão *Flyweight*. O `AuthInterceptor` único intercepta a `HttpRequest` e analisa reflexivamente `this.router.url`. O contexto da *URL da Action no painel do navegador* comanda em tempo-real qual "caixa-forte" de sessão será lida.
2. **User Cache Transitório**: Para evitar que a cada requisição (ex: carregar imagens, produtos, etc.) o software gaste ciclos de I/O bloqueantes lendo do `localStorage`, implementamos um buffer interno (Memory Cache `userCache` validado por uma janela `USER_CACHE_TTL` de 1000ms). Se 4 requisições saem quase juntas, apenas a primeira lê o drive. 
3. **Múltiplos Fail-Safes**: Se o E-commerce sofre um *Status 401: Unauthorized* por token expirado, o sistema executa o `handleSessionExpired`. Lá, ele valida via condicional *qual* a origem (`isEcommerce`). Caso sim, injeta o deslogamento apenas na instância `this.ecommerceAuthService.logout()`, limpando exclusivamente o contexto de venda sem pisar na sessão do usuário principal que talvez esteja assistindo num painel background (ou vice-versa).

---

## 3. O Tokens `IS_PUBLIC_API` via HttpContext

Para evitar que as rotas de `login` e `logout` acabem pegando resíduos do interceptor ou causando loops (ex: interceptador abortar o pedido de logout porque ele acha que não há token logado validando a saída), nós contornamos as travas padrão usando um construto moderno do Http Client Angular 12+: **HttpContext**.

Tanto no Global quanto E-commerce:
```typescript
 { context: new HttpContext().set(IS_PUBLIC_API, true) }
```
O Token de Injeção `is-public-api.token.ts` permite a travessia de bordas. Sempre que uma função dispara `logout()` ou `login()`, o Context manda o token paramétrico para verdadeiro. 
Quando o HTTP Request vai fluir no `auth.interceptor`, as primeiras linhas ditam:

```typescript
  if (req.context.get(IS_PUBLIC_API)) {
    return next.handle(req); // Bypass Completo
  }
```

Isso garante que fluxos críticos de entrada ou destruição de ambas autenticações transitem limpos, aliviando *Overheads* de cabeçalho e impedindo que o mecanismo de *auto-refresh* interfira numa saída deliberada do E-commerce.
