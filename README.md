# Financeiro Web

Frontend de um SaaS financeiro multi-tenant construído com Next.js 16 e React 19. Interface completa para gestão de extratos, categorias, contas bancárias, previsões de fluxo de caixa, DRE, conciliação e relatórios.

**Produção:** https://finance-api-web.vercel.app  
**Backend:** https://github.com/phmacieldev/finance-api

---

## Stack

| Tecnologia | Versão |
|---|---|
| Next.js | 16.2.7 |
| React | 19.2.4 |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| TanStack Query | 5.101.0 |
| React Hook Form | 7.77.0 |
| Zod | 4.4.3 |
| Axios | 1.17.0 |
| Recharts | 3.8.1 |
| Radix UI | — |
| date-fns | 4.4.0 |
| Lucide React | — |

---

## Rodando localmente

### Pré-requisitos

- Node.js 18+
- Backend rodando em `http://localhost:8080`

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

`.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### 3. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`.

### Scripts disponíveis

```bash
npm run dev      # Servidor de desenvolvimento com hot reload
npm run build    # Build de produção
npm start        # Servidor de produção
npm run lint     # ESLint
```

---

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API | `http://localhost:8080/api/v1` |

---

## Rotas

### Públicas — grupo `(auth)`

| Rota | Descrição |
|---|---|
| `/login` | Login |
| `/register` | Cadastro de empresa |
| `/esqueci-senha` | Solicitar reset de senha |
| `/resetar-senha` | Redefinir senha via token |
| `/verificar-email` | Confirmar email |
| `/verificar-pendente` | Aguardando aprovação da empresa |

### Protegidas — grupo `(dashboard)`

| Rota | Descrição |
|---|---|
| `/dashboard` | KPIs e gráfico de fluxo de caixa |
| `/extratos` | Lançamentos bancários |
| `/categorias` | Categorias de receita/despesa |
| `/contas` | Contas bancárias |
| `/previsoes` | Previsões de fluxo de caixa |
| `/conciliacao` | Conciliação previsto × realizado |
| `/dre` | Demonstração de Resultado do Exercício |
| `/relatorio` | Relatório mensal |
| `/export` | Exportar dados (CSV/XLSX) |
| `/usuarios` | Gestão de usuários da empresa |
| `/configuracoes` | Perfil e configurações da empresa |
| `/painel-admin` | Painel da plataforma (PLATFORM_ADMIN) |
| `/admin-usuarios` | Gestão de usuários da plataforma (PLATFORM_ADMIN) |

---

## Autenticação

Baseada em JWT armazenado em cookie (`financeiro_token`, 1 dia, `sameSite: strict`).

**Fluxo:**
1. Login → backend retorna JWT
2. Token salvo em cookie via `js-cookie`
3. Interceptor do Axios adiciona `Authorization: Bearer {token}` em todas as requisições
4. Resposta 401 → token removido + redirect para `/login`

**Roles:**
- `PLATFORM_ADMIN` — acesso ao painel e gestão da plataforma
- `CEO` / `OWNER` — acesso completo à empresa
- `USER` — acesso somente leitura (dashboard, DRE, relatório)

---

## Estrutura do projeto

```
app/
├── (auth)/              # Páginas públicas de autenticação
├── (dashboard)/         # Páginas protegidas do dashboard
├── layout.tsx           # Layout raiz com providers
├── page.tsx             # Redirect raiz
├── error.tsx            # Error boundary global
└── not-found.tsx        # Página 404

components/              # Componentes reutilizáveis
├── providers.tsx        # QueryClientProvider + ThemeProvider
├── theme.tsx            # Contexto de tema escuro/claro
└── MonthNav.tsx         # Seletor de mês/ano

hooks/
└── useMesSelecionado.ts # Estado de mês/ano selecionado

lib/
├── api.ts               # Instância Axios com interceptores de auth
├── auth.ts              # Gerenciamento de token via cookie
├── queryClient.ts       # Configuração do React Query
└── utils.ts             # Formatadores e utilitários

types/
└── index.ts             # Interfaces TypeScript dos domínios
```

---

## Deploy

Configurado com `output: "standalone"` no `next.config.ts`, pronto para deploy no Vercel ou container Docker.

**Vercel:**
1. Conecte o repositório no Vercel
2. Configure `NEXT_PUBLIC_API_URL` nas variáveis de ambiente de produção
3. Deploy automático a cada push na `main`
