-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Multi-tenancy — cada barbearia é um tenant isolado
-- Rodar no Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Tabela de barbearias ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS barbershops (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  owner_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT        UNIQUE NOT NULL
              DEFAULT     upper(left(replace(gen_random_uuid()::text, '-', ''), 6)),
  plan        TEXT        NOT NULL DEFAULT 'basic',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. barbershop_id em profiles ─────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS barbershop_id UUID REFERENCES barbershops(id) ON DELETE SET NULL;

-- ── 3. barbershop_id em bookings ─────────────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS barbershop_id UUID REFERENCES barbershops(id) ON DELETE SET NULL;

-- ── 4. Função auxiliar (SECURITY DEFINER — evita recursão em RLS) ────
CREATE OR REPLACE FUNCTION get_my_barbershop_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT barbershop_id FROM profiles WHERE id = auth.uid()
$$;

-- ── 5. RLS — barbershops ─────────────────────────────────────────────
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read barbershops"  ON barbershops;
DROP POLICY IF EXISTS "owner manage barbershop"  ON barbershops;

-- Qualquer autenticado pode ler (busca por invite_code no cadastro)
CREATE POLICY "public read barbershops" ON barbershops
  FOR SELECT USING (true);

-- Só o dono cria/edita/deleta a própria barbearia
CREATE POLICY "owner manage barbershop" ON barbershops
  FOR ALL
  USING     (owner_id = auth.uid())
  WITH CHECK(owner_id = auth.uid());

-- ── 6. RLS — profiles ────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own profile"         ON profiles;
DROP POLICY IF EXISTS "update own profile"        ON profiles;
DROP POLICY IF EXISTS "read barber profiles"      ON profiles;
DROP POLICY IF EXISTS "staff reads shop profiles" ON profiles;

-- Cada usuário lê/edita o próprio perfil
CREATE POLICY "read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Qualquer autenticado pode listar barbeiros (cliente precisa escolher)
CREATE POLICY "read barber profiles" ON profiles
  FOR SELECT USING (role = 'barber');

-- Admin/barbeiro vê todos os perfis da mesma barbearia
CREATE POLICY "staff reads shop profiles" ON profiles
  FOR SELECT USING (
    barbershop_id IS NOT NULL AND
    barbershop_id = get_my_barbershop_id()
  );

-- ── 7. RLS — bookings ────────────────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff see shop bookings"  ON bookings;
DROP POLICY IF EXISTS "client see own bookings"  ON bookings;
DROP POLICY IF EXISTS "client insert bookings"   ON bookings;
DROP POLICY IF EXISTS "staff update bookings"    ON bookings;

-- Barbeiro/admin vê e gerencia agendamentos da sua barbearia
CREATE POLICY "staff see shop bookings" ON bookings
  FOR SELECT USING (barbershop_id = get_my_barbershop_id());

CREATE POLICY "staff update bookings" ON bookings
  FOR UPDATE USING (barbershop_id = get_my_barbershop_id());

-- Cliente vê apenas os próprios agendamentos
CREATE POLICY "client see own bookings" ON bookings
  FOR SELECT USING (client_id = auth.uid());

-- Cliente cria agendamento (sem restrição de barbearia — barbershop_id vem do barber)
CREATE POLICY "client insert bookings" ON bookings
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION — cole tudo isso no Supabase SQL Editor e execute
-- ═══════════════════════════════════════════════════════════════════════
