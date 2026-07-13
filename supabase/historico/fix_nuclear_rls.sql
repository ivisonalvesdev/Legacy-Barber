-- ═══════════════════════════════════════════════════════════════════════
-- NUCLEAR FIX: Remove TODAS as policies antigas e recria do zero
-- Rodar no Supabase: SQL Editor → New query → colar tudo → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Remove TODAS as policies de profiles (qualquer nome) ───────────
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- ── 2. Remove TODAS as policies de bookings (qualquer nome) ───────────
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bookings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.bookings', pol.policyname);
  END LOOP;
END $$;

-- ── 3. Remove TODAS as policies de barbershops (qualquer nome) ─────────
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'barbershops'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.barbershops', pol.policyname);
  END LOOP;
END $$;

-- ── 4. Recria a função helper ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_barbershop_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT barbershop_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ── 5. Garante RLS habilitado nas 3 tabelas ───────────────────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings    ENABLE ROW LEVEL SECURITY;

-- ── 6. Policies limpas para profiles ──────────────────────────────────
CREATE POLICY "read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "read barber profiles" ON public.profiles
  FOR SELECT USING (role = 'barber');

CREATE POLICY "staff reads shop profiles" ON public.profiles
  FOR SELECT USING (
    barbershop_id IS NOT NULL AND
    barbershop_id = public.get_my_barbershop_id()
  );

-- ── 7. Policies limpas para barbershops ───────────────────────────────
CREATE POLICY "public read barbershops" ON public.barbershops
  FOR SELECT USING (true);

CREATE POLICY "owner manage barbershop" ON public.barbershops
  FOR ALL
  USING     (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ── 8. Policies limpas para bookings ──────────────────────────────────
CREATE POLICY "staff see shop bookings" ON public.bookings
  FOR SELECT USING (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "staff update bookings" ON public.bookings
  FOR UPDATE USING (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "client see own bookings" ON public.bookings
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "client insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- ── 9. Verificação: deve mostrar exatamente 8 policies no total ───────
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'barbershops', 'bookings')
ORDER BY tablename, policyname;
