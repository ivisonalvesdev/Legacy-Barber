# Supabase — Setup do Banco

## ⚡ Início rápido (único passo obrigatório)

1. Abra o **Supabase Dashboard → SQL Editor → New query**
2. Cole o conteúdo inteiro de [`setup_final.sql`](setup_final.sql)
3. Clique em **Run**
4. Confira a tabela de verificação no resultado — todos os itens devem bater com o esperado:

| item | esperado |
|---|---|
| tabelas | 5 |
| policies | 19 |
| trigger profiles | 1 |
| trigger serviços | 1 |
| índice anti agendamento duplo | 1 |

O script é **idempotente**: pode rodar de novo a qualquer momento sem duplicar nem apagar dados. Ele substitui todos os scripts antigos (que agora vivem em [`historico/`](historico/)).

## O que o script cria

| Tabela | Função |
|---|---|
| `barbershops` | Cada barbearia é um tenant, com `invite_code` para convidar barbeiros |
| `profiles` | Perfil de cada usuário (admin/barber/client) + coluna `active` |
| `bookings` | Agendamentos — com índice único que impede dois agendamentos ativos no mesmo barbeiro/data/horário |
| `products` | Estoque por barbearia (novo) |
| `services` | Catálogo de serviços por barbearia (novo) — semeado automaticamente ao criar barbearia |

## Regras de acesso (RLS)

- **Cliente**: lista barbeiros e serviços, cria agendamentos próprios, vê e cancela apenas os seus.
- **Barbeiro**: vê agenda e perfis da própria barbearia, conclui atendimentos, dá baixa de insumos.
- **Admin (dono)**: tudo da própria barbearia — equipe (ativar/desativar), estoque (CRUD), serviços, agendamentos manuais (walk-in).
- Tudo isolado por barbearia via `get_my_barbershop_id()` (SECURITY DEFINER, sem recursão de RLS).

## Dados de demonstração (opcional)

- `node scripts/create-demo-users.mjs` — cria usuários demo (precisa de `SUPABASE_SERVICE_ROLE_KEY` no `.env`)
- `historico/seed_demo.sql` — agendamentos fake para filmagem/demonstração
