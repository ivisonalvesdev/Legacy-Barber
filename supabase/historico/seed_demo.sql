-- ═══════════════════════════════════════════════════════════════════════
-- SEED: Dados de demonstração para as contas demo
-- Seguro re-rodar (limpa e recria os bookings demo a cada execução).
-- Dashboard → SQL Editor → New query → colar tudo → Run
-- ═══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_admin_id      UUID;
  v_barber_id     UUID;
  v_client_id     UUID;
  v_barbershop_id UUID;
BEGIN

  -- ── 1. Resolve IDs pelas contas demo ──────────────────────────────
  SELECT id INTO v_admin_id  FROM auth.users WHERE email = 'admin.demo@legacybarber.com'  LIMIT 1;
  SELECT id INTO v_barber_id FROM auth.users WHERE email = 'barber.demo@legacybarber.com' LIMIT 1;
  SELECT id INTO v_client_id FROM auth.users WHERE email = 'client.demo@legacybarber.com' LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'ERRO: admin.demo não encontrado — confira se a conta existe em auth.users';
    RETURN;
  END IF;
  IF v_barber_id IS NULL THEN
    RAISE NOTICE 'ERRO: barber.demo não encontrado — confira se a conta existe em auth.users';
    RETURN;
  END IF;
  IF v_client_id IS NULL THEN
    RAISE NOTICE 'ERRO: client.demo não encontrado — confira se a conta existe em auth.users';
    RETURN;
  END IF;

  -- ── 2. Garante que a barbearia demo existe ─────────────────────────
  INSERT INTO public.barbershops (name, owner_id, invite_code)
  VALUES ('Legacy Barber Demo', v_admin_id, 'LGCDEMO')
  ON CONFLICT (invite_code) DO NOTHING;

  SELECT id INTO v_barbershop_id
  FROM public.barbershops
  WHERE owner_id = v_admin_id
  LIMIT 1;

  IF v_barbershop_id IS NULL THEN
    RAISE NOTICE 'ERRO: não foi possível criar/encontrar a barbearia demo';
    RETURN;
  END IF;

  -- ── 3. Vincula admin e barbeiro à barbearia ────────────────────────
  UPDATE public.profiles SET barbershop_id = v_barbershop_id WHERE id = v_admin_id;
  UPDATE public.profiles SET barbershop_id = v_barbershop_id WHERE id = v_barber_id;

  -- ── 4. Limpa bookings antigos desta barbearia (re-run seguro) ──────
  DELETE FROM public.bookings WHERE barbershop_id = v_barbershop_id;

  -- ══════════════════════════════════════════════════════════════════
  -- AGENDA DE HOJE — 8 atendimentos, 6 done + 1 current + 1 upcoming
  -- Faturamento hoje (done): R$ 400
  -- Ocupação: 75%
  -- ══════════════════════════════════════════════════════════════════
  INSERT INTO public.bookings
    (client_id, barber_id, barbershop_id, service_name, service_price, date, time, status)
  VALUES
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte Clássico',     55, CURRENT_DATE, '08:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte + Barba',      75, CURRENT_DATE, '09:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Barba Completa',     45, CURRENT_DATE, '10:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte + Barba',      75, CURRENT_DATE, '11:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Tratamento Capilar', 90, CURRENT_DATE, '12:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte Clássico',     55, CURRENT_DATE, '13:30', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte + Barba',      75, CURRENT_DATE, '15:00', 'current'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Barba Completa',     45, CURRENT_DATE, '16:30', 'upcoming');

  -- ══════════════════════════════════════════════════════════════════
  -- ÚLTIMOS 6 DIAS — para o gráfico de receita e KPI do mês
  -- Tendência crescente para o delta semanal aparecer positivo
  -- ══════════════════════════════════════════════════════════════════

  -- Dia -6 (menor volume — início da semana passada)
  INSERT INTO public.bookings
    (client_id, barber_id, barbershop_id, service_name, service_price, date, time, status)
  VALUES
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte Clássico',     55, CURRENT_DATE - 6, '09:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Barba Completa',     45, CURRENT_DATE - 6, '11:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte + Barba',      75, CURRENT_DATE - 6, '14:00', 'done');

  -- Dia -5
  INSERT INTO public.bookings
    (client_id, barber_id, barbershop_id, service_name, service_price, date, time, status)
  VALUES
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte + Barba',      75, CURRENT_DATE - 5, '09:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte Clássico',     55, CURRENT_DATE - 5, '10:30', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Tratamento Capilar', 90, CURRENT_DATE - 5, '14:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Barba Completa',     45, CURRENT_DATE - 5, '16:00', 'done');

  -- Dia -4
  INSERT INTO public.bookings
    (client_id, barber_id, barbershop_id, service_name, service_price, date, time, status)
  VALUES
    (v_client_id, v_barber_id, v_barbershop_id, 'Barba Completa',     45, CURRENT_DATE - 4, '08:30', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte Clássico',     55, CURRENT_DATE - 4, '10:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte + Barba',      75, CURRENT_DATE - 4, '13:00', 'done');

  -- Dia -3
  INSERT INTO public.bookings
    (client_id, barber_id, barbershop_id, service_name, service_price, date, time, status)
  VALUES
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte + Barba',      75, CURRENT_DATE - 3, '09:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Tratamento Capilar', 90, CURRENT_DATE - 3, '11:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte Clássico',     55, CURRENT_DATE - 3, '14:30', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte + Barba',      75, CURRENT_DATE - 3, '16:00', 'done');

  -- Dia -2
  INSERT INTO public.bookings
    (client_id, barber_id, barbershop_id, service_name, service_price, date, time, status)
  VALUES
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte Clássico',     55, CURRENT_DATE - 2, '09:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte + Barba',      75, CURRENT_DATE - 2, '10:30', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Barba Completa',     45, CURRENT_DATE - 2, '13:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte + Barba',      75, CURRENT_DATE - 2, '15:30', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Tratamento Capilar', 90, CURRENT_DATE - 2, '17:00', 'done');

  -- Dia -1 (ontem — volume alto)
  INSERT INTO public.bookings
    (client_id, barber_id, barbershop_id, service_name, service_price, date, time, status)
  VALUES
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte + Barba',      75, CURRENT_DATE - 1, '08:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte Clássico',     55, CURRENT_DATE - 1, '09:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Barba Completa',     45, CURRENT_DATE - 1, '10:30', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte + Barba',      75, CURRENT_DATE - 1, '11:30', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte + Barba',      75, CURRENT_DATE - 1, '13:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Tratamento Capilar', 90, CURRENT_DATE - 1, '15:00', 'done'),
    (v_client_id, v_barber_id, v_barbershop_id, 'Corte Clássico',     55, CURRENT_DATE - 1, '16:30', 'done');

  RAISE NOTICE 'Seed OK — barbershop: %, admin: %, barber: %, client: %',
    v_barbershop_id, v_admin_id, v_barber_id, v_client_id;

END $$;

-- ── Verificação final ──────────────────────────────────────────────────
SELECT
  COUNT(*)                                                           AS total_bookings,
  COUNT(*) FILTER (WHERE date = CURRENT_DATE)                       AS bookings_hoje,
  SUM(service_price) FILTER (WHERE status = 'done' AND date = CURRENT_DATE)
                                                                     AS receita_hoje,
  SUM(service_price) FILTER (WHERE status = 'done')                 AS receita_7_dias,
  COUNT(*) FILTER (WHERE status = 'done' AND date = CURRENT_DATE)   AS done_hoje,
  COUNT(*) FILTER (WHERE status = 'current' AND date = CURRENT_DATE) AS current_hoje,
  COUNT(*) FILTER (WHERE status = 'upcoming' AND date = CURRENT_DATE) AS upcoming_hoje
FROM public.bookings;
