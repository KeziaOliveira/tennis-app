# 🏆 ScoreboardBT

> **Gestão profissional de placares para transmissões ao vivo.**

Sistema web para operadores de placar criarem e controlarem partidas em tempo real, com overlay pronto para captura no OBS via browser source.

---

## Funcionalidades

**Gerenciamento de partidas**
- Criação e edição de partidas com times, bandeiras e placares
- Controle de tempo de jogo com cronômetro integrado
- Estatísticas detalhadas por partida com gráficos

**Overlay para OBS**
- URL pública por partida, sem necessidade de login
- Atualização em tempo real via Supabase Realtime
- 5 temas visuais: Padrão, P&B, Verde, Roxo, Laranja
- Chroma key configurável (verde, magenta, azul, ciano, rosa)
- Posicionamento livre na tela (4 cantos + centro)

**Conta e personalização**
- Autenticação com e-mail e senha (Supabase Auth)
- 6 temas de cor da interface: Sky, Emerald, Violet, Rose, Amber, Slate
- Modo claro / escuro
- Preferências salvas por usuário

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Estilização | Tailwind CSS v4 |
| Roteamento | React Router v7 |
| Estado global | Zustand |
| Backend / Auth | Supabase |
| Storage | Firebase Storage |
| Gráficos | Recharts |
| Toasts | Sonner |

---

## Rodando localmente

**Pré-requisitos:** Node.js 18+ e npm

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/347-bttv.git
cd 347-bttv

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves do Supabase e Firebase

# 4. Suba o servidor de desenvolvimento
npm run dev
```

**Variáveis necessárias no `.env`:**

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_STORAGE_BUCKET=
```

---

## Usando o overlay no OBS

1. Acesse o Dashboard e inicie uma partida
2. Copie o link de overlay gerado para aquela partida
3. No OBS, adicione uma fonte **Browser** e cole o link
4. Configure chroma key ou posição pela URL com os parâmetros `?bg=green&position=top-left`

Qualquer atualização feita no placar reflete no overlay em tempo real, sem precisar recarregar.

---

## Scripts disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
npm run lint     # Verificação de lint
```
