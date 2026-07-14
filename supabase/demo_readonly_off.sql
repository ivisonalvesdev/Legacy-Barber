-- ═══════════════════════════════════════════════════════════════════════
-- DESLIGA O MODO SOMENTE-LEITURA DAS CONTAS DEMO
--
-- Use ANTES de gravar a tela / demonstrar ao vivo: libera as contas demo
-- para criar agendamento, concluir atendimento, mexer no estoque etc.
--
-- ⚠️  Enquanto isso estiver desligado, qualquer pessoa com as credenciais
--     demo pode alterar ou apagar os dados. Depois de gravar, rode
--     supabase/demo_readonly.sql para travar de novo.
--
-- COMO RODAR:
--   Supabase Dashboard → SQL Editor → New query → colar tudo → Run
--
-- Seguro re-rodar (idempotente).
-- ═══════════════════════════════════════════════════════════════════════

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles', 'barbershops', 'bookings', 'products', 'services']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "demo readonly no insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "demo readonly no update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "demo readonly no delete" ON public.%I', t);
  END LOOP;
END $$;

-- ── Verificação ──────────────────────────────────────────────────────────
SELECT 'policies restritivas demo' AS item,
       count(*)::text              AS resultado,
       'esperado: 0 (destravado)'  AS esperado
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'demo readonly%';
