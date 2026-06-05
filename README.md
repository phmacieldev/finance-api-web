# Financeiro Web

> Interface de um SaaS financeiro multi-tenant — gestão completa de extratos, DRE, conciliação e previsões de fluxo de caixa, com dashboard rico e suporte a tema escuro.

**Produção:** https://finance-api-web.vercel.app  
**Backend:** https://github.com/phmacieldev/finance-api

---

## Por que eu construí isso

Queria construir um frontend que fosse além de renderizar listas. Um SaaS financeiro exige decisões reais: como manter o estado global de mês/ano sincronizado entre páginas, como lidar com erros de validação campo a campo vindos da API, como estruturar queries com cache sem causar flickering.

Usei Next.js App Router com React 19 — não porque é novidade, mas porque o modelo mental de layouts aninhados e route groups encaixa naturalmente com a separação entre área pública (auth) e área protegida (dashboard).

---

## Stack

| Tecnologia | Versão | Por que |
|---|---|---|
| Next.js | 16.2.7 | App Router, layouts aninhados, server components |
| React | 19.2.4 | Actions, melhorias de concurrent mode |
| TypeScript | 5.x | Contratos fortes com a API, sem surpresas em runtime |
| Tailwind CSS | 4.x | Dark mode nativo, sem CSS extra |
| TanStack Query | 5.101.0 | Cache declarativo, deduplicação de requests, staleTime |
| React Hook Form | 7.77.0 | Formulários performáticos sem re-render no keystroke |
| Zod | 4.4.3 | Validação no cliente espelhando o backend |
| Axios | 1.17.0 | Interceptores para auth e logout automático no 401 |
| Recharts | 3.8.1 | AreaChart, BarChart, LineChart — responsivos e composable |
| Radix UI | — | Primitivos de acessibilidade sem estilo forçado |
| date-fns | 4.4.0 | Manipulação de datas sem moment.js |

---

## Decisões técnicas

### JWT em cookie, não em localStorage

O token é salvo via `js-cookie` com `sameSite: strict`. Sem acesso via `document.cookie` para scripts externos. O interceptor do Axios lê o cookie e injeta o `Authorization: Bearer` em cada request — o componente de UI nunca toca no token.

### Estado de mês/ano como contexto compartilhado

O seletor de mês/ano (`MonthNav`) atualiza um contexto global via `useMesSelecionado`. Todas as queries das páginas do dashboard dependem desse valor como chave do cache — mudar o mês invalida e refaz exatamente as queries certas, sem polling, sem estado duplicado.

### Erros de validação por campo

O backend retorna um mapa `campo → mensagem` nos erros 422. O frontend usa `setError` do React Hook Form para posicionar cada mensagem diretamente no input correspondente, sem nenhum parse de string.

```typescript
Object.entries(err.campos).forEach(([campo, msg]) =>
  form.setError(campo as keyof FormData, { message: msg })
)
```

### staleTime nas queries de dados estáticos

Categorias, contas bancárias e previsões raramente mudam. Essas queries usam `staleTime: 5 * 60 * 1000` para não refazer requests desnecessários enquanto o usuário navega entre abas.

### Dashboard sem requests extras

O endpoint `/dashboard` já retorna os últimos 5 lançamentos e o saldo total acumulado — informações que ficariam em requests separados. Isso foi uma decisão do backend pensando no frontend: uma única chamada popula todos os cards da página inicial.

---

## Funcionalidades

- **Dashboard rico** — saldo total acumulado, KPIs do mês com variação percentual, gráfico de tendência 6 meses, fluxo diário, top categorias por despesa/receita, últimos lançamentos, previsões dos próximos 7 dias
- **Extratos** — listagem paginada com filtros, import CSV/XLSX, criação manual, categorização em massa
- **DRE** — Demonstração de Resultado do Exercício por mês com drill-down por categoria
- **Conciliação** — previsto × realizado com visualização diária e por período
- **Previsões** — cadastro de receitas e despesas recorrentes com 8 frequências
- **Relatório** — série histórica mensal comparativa
- **Export** — download CSV ou XLSX com filtros aplicados
- **Usuários** — gestão de membros com roles (CEO, OWNER, USER)
- **Configurações** — dados do perfil e da empresa (suporte a PF e PJ)
- **Painel Admin** — gestão de empresas e usuários da plataforma (`PLATFORM_ADMIN`)
- **Tema escuro** — modo claro/escuro persistido, sem flash no carregamento

---

## Rodando localmente

**Pré-requisitos:** Node.js 18+ e o [backend](https://github.com/phmacieldev/finance-api) rodando em `localhost:8080`

```bash
# 1. Instalar dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env.local
# edite .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# 3. Rodar
npm run dev
# → http://localhost:3000
```

```bash
npm run dev      # desenvolvimento com hot reload
npm run build    # build de produção
npm start        # servidor de produção
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
| `/dashboard` | Visão geral: saldo total, KPIs, tendência 6m, últimos lançamentos, próximas previsões |
| `/extratos` | Lançamentos bancários com paginação e filtros |
| `/categorias` | Categorias de receita/despesa |
| `/contas` | Contas bancárias |
| `/previsoes` | Previsões de fluxo de caixa |
| `/conciliacao` | Conciliação previsto × realizado |
| `/dre` | Demonstração de Resultado do Exercício |
| `/relatorio` | Relatório mensal histórico |
| `/export` | Exportar dados (CSV/XLSX) |
| `/usuarios` | Gestão de usuários da empresa |
| `/configuracoes` | Perfil e dados da empresa |
| `/painel-admin` | Painel da plataforma (PLATFORM_ADMIN) |
| `/admin-usuarios` | Gestão de usuários da plataforma (PLATFORM_ADMIN) |

---

## Autenticação

JWT em cookie (`financeiro_token`, 1 dia, `sameSite: strict`).

1. Login → backend retorna JWT
2. Token salvo via `js-cookie`
3. Interceptor Axios injeta `Authorization: Bearer {token}` em todas as requests
4. Resposta 401 → token removido + redirect para `/login`

Roles:
- `PLATFORM_ADMIN` — acesso ao painel e gestão da plataforma
- `CEO` / `OWNER` — acesso completo à empresa
- `USER` — somente leitura (dashboard, DRE, relatório)

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

components/
├── providers.tsx        # QueryClientProvider + ThemeProvider
├── theme.tsx            # Contexto de tema escuro/claro
└── MonthNav.tsx         # Seletor de mês/ano compartilhado

hooks/
└── useMesSelecionado.ts # Estado global de mês/ano para as queries

lib/
├── api.ts               # Instância Axios com interceptores de auth
├── auth.ts              # Gerenciamento de token via cookie
├── queryClient.ts       # Configuração do TanStack Query
└── utils.ts             # Formatadores e utilitários

types/
└── index.ts             # Interfaces TypeScript dos domínios
```

---

## Deploy

**Vercel (recomendado):**

1. Conecte o repositório no Vercel
2. Configure `NEXT_PUBLIC_API_URL` nas variáveis de ambiente de produção
3. Deploy automático a cada push na `main`

O projeto usa `output: "standalone"` no `next.config.ts`, então também funciona em container Docker se necessário.
