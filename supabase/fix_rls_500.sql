-- ═══════════════════════════════════════════════════════════════════════
-- FIX 500: Recria função get_my_barbershop_id() + todas as RLS policies
-- Rodar no Supabase: SQL Editor → New query → colar tudo → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Recria a função helper (causa raiz do erro 500) ─────────────────
CREATE OR REPLACE FUNCTION public.get_my_barbershop_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT barbershop_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ── 2. Garante RLS habilitado ──────────────────────────────────────────
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings  ENABLE ROW LEVEL SECURITY;

-- ── 3. Limpa e recria policies de profiles ────────────────────────────
DROP POLICY IF EXISTS "read own profile"         ON public.profiles;
DROP POLICY IF EXISTS "update own profile"        ON public.profiles;
DROP POLICY IF EXISTS "read barber profiles"      ON public.profiles;
DROP POLICY IF EXISTS "staff reads shop profiles" ON public.profiles;

-- Cada usuário lê o próprio perfil
CREATE POLICY "read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- Cada usuário edita o próprio perfil
CREATE POLICY "update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Qualquer autenticado vê barbeiros (cliente precisa escolher um)
CREATE POLICY "read barber profiles" ON public.profiles
  FOR SELECT USING (role = 'barber');

-- Admin/barbeiro vê todos da mesma barbearia
CREATE POLICY "staff reads shop profiles" ON public.profiles
  FOR SELECT USING (
    barbershop_id IS NOT NULL AND
    barbershop_id = public.get_my_barbershop_id()
  );

-- ── 4. Limpa e recria policies de barbershops ─────────────────────────
DROP POLICY IF EXISTS "public read barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "owner manage barbershop" ON public.barbershops;

CREATE POLICY "public read barbershops" ON public.barbershops
  FOR SELECT USING (true);

CREATE POLICY "owner manage barbershop" ON public.barbershops
  FOR ALL
  USING     (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ── 5. Limpa e recria policies de bookings ────────────────────────────
DROP POLICY IF EXISTS "staff see shop bookings"  ON public.bookings;
DROP POLICY IF EXISTS "staff update bookings"    ON public.bookings;
DROP POLICY IF EXISTS "client see own bookings"  ON public.bookings;
DROP POLICY IF EXISTS "client insert bookings"   ON public.bookings;

CREATE POLICY "staff see shop bookings" ON public.bookings
  FOR SELECT USING (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "staff update bookings" ON public.bookings
  FOR UPDATE USING (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "client see own bookings" ON public.bookings
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "client insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- ── 6. Verificação final ──────────────────────────────────────────────
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('profiles', 'barbershops', 'bookings')
ORDER BY tablename, policyname;
