# Arquitetura de Autenticação do E-commerce: Correção de Redirecionamentos e Sessões

Este documento detalha o que causou as inconsistências do fluxo de login/logout no módulo de e-commerce e descreve minuciosamente as alterações feitas para estabilizar a navegação, as requisições duplas e evitar o cancelamento prematuro das rotas de compras. 

---

## 1. Problema de Login Duplo e "Interceptador" Assasino

### O que acontecia?
Quando o usuário tentava acessar `/e-commerce/vitrine`, preenchia usuário e senha, clicando em logar:
1. O formulário fazia o envio (Request 1) e o botão, de forma independente, engatilhava a função de envio **novamente** via clique de mouse (Request 2).
2. A própria lógica principal do e-commerce executava o post para o servidor, recebia um token (Status: 200) e **imediatamente** realizava uma segunda requisição acessória (`GET` em `/usuario`) para capturar "perfil" e "foto" do usuário recém-logado.
3. No exato instante dessa busca final, o nosso agente de segurança no código (`AuthInterceptor`) abortava a ação da interface e gritava que a sessão estava morta, forçando um deslogamento forçado que estragava o ciclo final.

### Por que isso acontecia?
A chamada para buscar a "foto e o perfil" do cliente no servidor estava sendo disparada **antes** de ordenarmos o navegador a "salvar" o token (`this.setCurrentUser()`).
Sem o token salvo na memória (`localStorage`), o `AuthInterceptor` identificava a requisição despida de credenciais, achava tratar-se de um roubo ou sessão violada e "mandava bala": ejetava o usuário num gatilho imediato de sessão deslogada (ativando um `/logout` precoce).

### Como corrigimos:
* **Remoção de Duplo Disparo (`ecommerce-login.component`)**: O método auxiliar redundante `(onClick)` foi arrancado da View de HTML e bloqueamos a possibilidade dupla através da condicional `if (this.loading()) return`. Se estiver enviando os dados, novos requests são ignorados.
* **Salvamento Prévio de Token (`ecommerce-auth.service.ts`)**: Inserimos um disparo tático para salvar o usuário `this.setCurrentUser(data)` em memória RAM e em disco **alguns microssegundos antes** do serviço invocar o GET de foto do perfil. Como o token agora se aloja previamente na memória, o Interceptor verifica presencialmente a sessão, vê o token regular e abençoa a conexão (libera a renderização da vitrine).

---

## 2. A Ilusão Ótica da URL (`/e-commerce/vitrine`) Sem Estar Logado

### O que acontecia?
Ao clicar puramente na rota `/e-commerce`, a arquitetura te jogava direto num buraco negro para a rota visual `/e-commerce/vitrine`. Na tela aparecia uma caixinha de logar (`app-ecommerce-login`), mas o usuário reclamava: *"Eu quero estar na tela de login, por que em cima está escrito vitrine na URL?"*

### Como corrigimos:
* A responsabilidade de manter as URLs visualmente arrumadas foi passada para `app.routes.ts`. 
* Declarou-se explicitamente uma sub-rota filha batizada de `login`. Substituímos o redirecionamento vazio. Antes: `/e-commerce` → `/vitrine`. Agora: `/e-commerce` te desloca polidamente pra a rota limpa `/e-commerce/login` na navegação padrão.

---

## 3. "Acordo de Divórcio": O Componente de E-commerce Que Recusava Desmontar 

### O que acontecia ao clicar em "Sair"?
A lógica de logout que existia antes não deslogava de fato (o endpoint local não era chamado e a memória não era limpa). Ela apenas aplicava um esparadrapo fazendo *redirect* com um chuta-balde para fora do e-commerce: `router.navigate(['/home/dashboard'])`. 
Isso causava um erro crasso: o status do componente de controle visual (chamado `EcommerceComponent` e cujo estado chamamos de *Wizard Passo a Passo*) era completamente ignorado. Se você clicasse em recuar ou fosse repuxado pra trás no histórico do seu browser, a interface da loja ainda achava que seu passo era `"vitrine"` (você estava tecnicamente na aba de loja).

### Como corrigimos:
**Implementação da Escuta de Observables**:
Foi injetato um `BehaviorSubject` sensível às variações de autenticação diretamente no `e-commerce.component.ts`: 

```typescript
this.authSub = this.authService.currentUser.subscribe(user => {
  if (!user) {
    this.step.set('login'); // Retorno de estado imediato do visual
    this.loggedUser.set(null); 
    this.ecommerceForm.reset({}, { emitEvent: false });
  }
});
```
Sempre que a API retornar `200 OK` na intenção de desconexão, o nosso componente mãe **reagirar magicamente na hora**, zerando o step do Wizard pra aba `Login`, além de esvaziar todo o cache do carrinho salvaguardado no `ecommerceForm` e nas definições do `localStorage`. 

### Destruição Remota da Sessão
Caso o usuário simplesmente abandone e suma da página visualizando o sistema antigo ERP ou portal dos alunos (`/home/` ou `/matricula`), nós precisamos limpar os resíduos de cache do carrinho de e-commerce e dizer pro servidor e-Commerce da Eskolaweb dar *logout*.

Fizemos isso programando o clássico momento Angular do "canto do cisne", ou seja, o `ngOnDestroy`.

```typescript
ngOnDestroy(): void {
  // Se a rota do URL recém acessada ao matar este componente NÃO constar "/e-commerce"...
  if (!this.router.url.includes('/e-commerce')) { 
     // Força um cancelamento seguro, mata token de e-commerce e emite deslogamento real
     this.authService.logout().subscribe();
  }
}
```

### Sumário Prático das Camadas Limpas
Graças as intervenções a arquitetura se comporta como um *State Flow Seguro*:
* Sucesso? Token primeiro, perfis depois. Acesso bloquea múltiplos cliques via travas e semântica nativa para evitar Request HTTP Loops.
* Sair da Vitrine propositalmente? Executa o logout via `EcommerceAuthService`, que mata o *Behaviour Subject*, fazendo com que `step === 'vitrine'` volte a ser `step === 'login'`. A URL respeita o layout chamando as rotas da raiz do e-commerce mapeada à sua área respectiva.
* Fuga pela porta dos fundos? Bate no `ngOnDestroy()`, que apaga os resquícios em banco de memória e no cache interno do navegador e despacha o seu log de saída à API do Backend. 
