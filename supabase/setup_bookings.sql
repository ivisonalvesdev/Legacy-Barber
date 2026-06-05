-- ═══════════════════════════════════════════════════════════════════════
-- SETUP: Cria tabela `bookings` (seguro re-rodar com IF NOT EXISTS)
-- Rodar ANTES de migration_multi_tenant.sql se a tabela não existir.
-- Dashboard → SQL Editor → New query → colar tudo → Run
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.bookings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  barber_id     UUID        NOT NULL REFERENCES auth.users(id),
  barbershop_id UUID        REFERENCES public.barbershops(id)   ON DELETE SET NULL,
  service_name  TEXT        NOT NULL,
  service_price NUMERIC     NOT NULL DEFAULT 0,
  date          DATE        NOT NULL,
  time          TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'upcoming'
                CHECK (status IN ('upcoming', 'current', 'done', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Índices para as queries mais comuns ──────────────────────────────
CREATE INDEX IF NOT EXISTS bookings_barber_date_idx      ON public.bookings (barber_id, date);
CREATE INDEX IF NOT EXISTS bookings_barbershop_date_idx  ON public.bookings (barbershop_id, date);
CREATE INDEX IF NOT EXISTS bookings_client_idx           ON public.bookings (client_id);

-- ── Verificação ───────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings' AND table_schema = 'public'
ORDER BY ordinal_position;
