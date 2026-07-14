-- ═══════════════════════════════════════════════════════════════════════
-- PATCH: MODO SOMENTE-LEITURA PARA CONTAS DEMO
--
-- Deixa os dados mock (agenda, estoque, serviços…) APENAS para visualização
-- nas contas demo — qualquer tentativa de INSERT/UPDATE/DELETE feita por
-- admin.demo / barber.demo / client.demo é bloqueada no banco (RLS), mesmo
-- via API/Postman. Contas normais (inclusive admin@legacybarber.com) não são
-- afetadas. Já embutido no setup_final.sql; este arquivo é só o atalho para
-- aplicar sem re-rodar tudo.
--
-- COMO RODAR:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Cole ESTE ARQUIVO INTEIRO → Run
--   3. A última query deve mostrar 15 policies restritivas
--
-- Seguro re-rodar (idempotente).
-- ═══════════════════════════════════════════════════════════════════════

SET check_function_bodies = off;

-- ── 1. Função que identifica contas demo ─────────────────────────────────
-- SECURITY DEFINER: precisa ler auth.users (invisível ao usuário comum).
-- A conta do dev (admin@legacybarber.com, SEM ".demo") NÃO é considerada demo.
CREATE OR REPLACE FUNCTION public.is_demo_user()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND email LIKE '%.demo@legacybarber.com'
  )
$$;

-- ── 2. Policies RESTRICTIVE (combinadas com AND sobre as permissivas) ─────
-- Bloqueiam escrita das contas demo sem tocar no SELECT.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles', 'barbershops', 'bookings', 'products', 'services']
  LOOP
    -- limpa versões anteriores (re-run seguro)
    EXECUTE format('DROP POLICY IF EXISTS "demo readonly no insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "demo readonly no update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "demo readonly no delete" ON public.%I', t);

    EXECUTE format(
      'CREATE POLICY "demo readonly no insert" ON public.%I '
      'AS RESTRICTIVE FOR INSERT WITH CHECK (NOT public.is_demo_user())', t);
    EXECUTE format(
      'CREATE POLICY "demo readonly no update" ON public.%I '
      'AS RESTRICTIVE FOR UPDATE USING (NOT public.is_demo_user())', t);
    EXECUTE format(
      'CREATE POLICY "demo readonly no delete" ON public.%I '
      'AS RESTRICTIVE FOR DELETE USING (NOT public.is_demo_user())', t);
  END LOOP;
END $$;

-- ── 3. Verificação ───────────────────────────────────────────────────────
SELECT 'policies restritivas demo' AS item,
       count(*)::text              AS resultado,
       'esperado: 15'              AS esperado
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = 'RESTRICTIVE'
  AND policyname LIKE 'demo readonly%';
