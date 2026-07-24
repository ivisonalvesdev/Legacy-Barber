-- ═══════════════════════════════════════════════════════════════════════
-- LEGACY BARBER — LIKES DOS BARBEIROS + HORÁRIOS OCUPADOS (privacidade)
--
-- Rode este script UMA vez no Supabase Dashboard → SQL Editor (depois do
-- setup_final.sql). É idempotente: pode reexecutar sem duplicar nada.
--
-- O que ele entrega:
--   1. Tabela booking_likes — o cliente dá 1 "like" por corte concluído; a
--      soma dos likes eleva a nota (estrelas) do barbeiro gradativamente.
--   2. RPC barber_like_counts(shop) — devolve a contagem de likes por barbeiro
--      da barbearia (SECURITY DEFINER: some as notas sem expor quem curtiu).
--   3. RPC taken_slots(barber, date) — devolve SÓ os horários já reservados de
--      um barbeiro. Sem isto o cliente não enxerga os slots ocupados por
--      OUTROS clientes (a RLS de bookings esconde agendamentos alheios), e só
--      descobria o conflito na hora de confirmar.
-- ═══════════════════════════════════════════════════════════════════════

SET check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. TABELA booking_likes
--    PK em booking_id garante no banco: 1 like por corte (não dá pra spammar).
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_likes (
  booking_id UUID        PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  barber_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_likes_barber_idx ON public.booking_likes (barber_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. RLS
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.booking_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client reads own likes"        ON public.booking_likes;
DROP POLICY IF EXISTS "client likes own done booking" ON public.booking_likes;
DROP POLICY IF EXISTS "client removes own like"       ON public.booking_likes;

-- O cliente vê os likes que ELE deu (para o app saber quais cortes já curtiu).
CREATE POLICY "client reads own likes" ON public.booking_likes
  FOR SELECT USING (client_id = auth.uid());

-- O cliente só curte o PRÓPRIO corte, e só depois de CONCLUÍDO. O barber_id
-- precisa bater com o do agendamento — sem isso daria pra creditar o like a
-- outro barbeiro chamando a API na mão.
CREATE POLICY "client likes own done booking" ON public.booking_likes
  FOR INSERT WITH CHECK (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id        = booking_likes.booking_id
        AND b.client_id = auth.uid()
        AND b.barber_id = booking_likes.barber_id
        AND b.status    = 'done'
    )
  );

-- Pode desfazer o próprio like (descurtir).
CREATE POLICY "client removes own like" ON public.booking_likes
  FOR DELETE USING (client_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- 3. RPC — contagem de likes por barbeiro de uma barbearia
--    SECURITY DEFINER: devolve só os números agregados, nunca as linhas.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.barber_like_counts(p_shop UUID)
RETURNS TABLE (barber_id UUID, likes BIGINT)
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT bl.barber_id, count(*)::bigint AS likes
  FROM public.booking_likes bl
  JOIN public.profiles p ON p.id = bl.barber_id
  WHERE p.barbershop_id = p_shop
  GROUP BY bl.barber_id
$$;

GRANT EXECUTE ON FUNCTION public.barber_like_counts(UUID) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. RPC — horários já reservados de um barbeiro numa data
--    Devolve SÓ o horário (sem cliente/serviço) — o cliente vê o slot ocupado
--    e riscado, mas não quem reservou. SECURITY DEFINER fura a RLS de bookings
--    de propósito, expondo apenas o mínimo necessário.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.taken_slots(p_barber UUID, p_date DATE)
RETURNS TABLE ("time" TEXT)
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT b.time FROM public.bookings b
  WHERE b.barber_id = p_barber
    AND b.date      = p_date
    AND b.status   <> 'cancelled'
$$;

GRANT EXECUTE ON FUNCTION public.taken_slots(UUID, DATE) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. VERIFICAÇÃO
-- ─────────────────────────────────────────────────────────────────────────
SELECT 'tabela booking_likes' AS item,
       count(*)::text AS resultado, 'esperado: 1' AS esperado
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'booking_likes'
UNION ALL
SELECT 'policies booking_likes', count(*)::text, 'esperado: 3'
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'booking_likes'
UNION ALL
SELECT 'rpc barber_like_counts', count(*)::text, 'esperado: 1'
FROM pg_proc WHERE proname = 'barber_like_counts'
UNION ALL
SELECT 'rpc taken_slots', count(*)::text, 'esperado: 1'
FROM pg_proc WHERE proname = 'taken_slots';
