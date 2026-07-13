# 💈 Legacy Barber

SaaS multi-tenant de gestão para barbearias: agendamento online, gestão de equipe, controle de estoque e relatórios — cada barbearia é um tenant isolado.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS · Framer Motion · Supabase (Auth + Postgres com RLS)

## 🚀 Rodando o projeto

```bash
# 1. Instale as dependências
npm install

# 2. Configure o ambiente (crie um .env na raiz)
#    VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
#    VITE_SUPABASE_ANON_KEY=sua-anon-key

# 3. Configure o banco (passo único)
#    Supabase Dashboard → SQL Editor → cole supabase/setup_final.sql → Run
#    Instruções detalhadas em supabase/README.md

# 4. Rode
npm run dev
```

## 👥 Papéis e funcionalidades

| Papel | O que faz |
|---|---|
| **Cliente** | Agenda em 4 passos (profissional → serviço → data/hora → confirmação), vê horários já ocupados bloqueados, acompanha e cancela agendamentos, edita o perfil |
| **Barbeiro** | Entra na barbearia via código de convite, vê a agenda do dia, conclui atendimentos, dá baixa de insumos |
| **Admin (dono)** | Dashboard com KPIs e gráfico de receita, agendamento manual (walk-in), estoque com CRUD completo, equipe (convite + ativar/desativar), relatórios com dados reais |

## 🏗️ Arquitetura

```
src/
├── App.tsx                     # Sessão, roteamento por papel e tabs
├── lib/supabase.ts             # Cliente Supabase
├── types/                      # AppUser, Service, Product, BookingStatus…
├── data/
│   ├── defaults.ts             # Grade de horários + fallback de serviços
│   └── landing.ts              # Conteúdo estático da landing page
└── components/
    ├── landing/                # Landing page (marketing)
    ├── auth/                   # Login/cadastro com Supabase Auth
    ├── dashboard/              # Views por papel (Client/Barber/Admin)
    └── ui/                     # Componentes visuais reutilizáveis

supabase/
├── setup_final.sql             # ÚNICO script necessário (idempotente)
├── README.md                   # Instruções e modelo de dados
└── historico/                  # Scripts antigos já aplicados
```

### Multi-tenancy

Cada barbearia (`barbershops`) tem um `invite_code`. O admin cria a barbearia no cadastro; barbeiros entram com o código. Todas as queries são isoladas por `barbershop_id` via Row Level Security — a função `get_my_barbershop_id()` (SECURITY DEFINER) evita recursão nas policies.

### Proteções no banco

- Índice único impede dois agendamentos ativos no mesmo barbeiro/data/horário (o app trata o erro `23505` com mensagem amigável).
- Cliente só consegue atualizar o próprio agendamento **para cancelar** (policy com `WITH CHECK status = 'cancelled'`).
- Trigger cria o `profile` automaticamente no cadastro; outro trigger semeia o catálogo de serviços padrão em cada barbearia nova.

## 🧪 Qualidade

```bash
npm run lint    # ESLint
npx tsc -b      # Typecheck
npm run build   # Build de produção
```

CI roda typecheck + lint + build em cada push/PR (`.github/workflows/ci.yml`).

## 📌 Próximos passos sugeridos

- Horários de funcionamento configuráveis por barbearia (hoje a grade é fixa em `src/data/defaults.ts`)
- CRUD de serviços na UI do admin (o banco já suporta — tabela `services`)
- Notificações WhatsApp (prometido na landing)
- Avaliações reais de barbeiros (hoje o rating é fixo em 4.9)
- Testes automatizados (Vitest + Testing Library)
