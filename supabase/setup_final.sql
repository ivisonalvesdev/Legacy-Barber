-- ═══════════════════════════════════════════════════════════════════════
-- LEGACY BARBER — SETUP FINAL CONSOLIDADO
--
-- Este é o ÚNICO script que você precisa rodar. Ele é idempotente:
-- pode ser executado quantas vezes quiser sem duplicar ou destruir dados.
-- Se alguma tabela já existir com colunas faltando, ele completa o formato.
--
-- COMO RODAR:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Cole ESTE ARQUIVO INTEIRO (do início ao fim)
--   3. Clique em Run
--   4. A última query mostra um resumo de verificação
-- ═══════════════════════════════════════════════════════════════════════

-- Evita validação antecipada do corpo de funções SQL (ordem-independente)
SET check_function_bodies = off;

-- ⚠️ APENAS se você tinha tabelas antigas de TESTE chamadas products/services
--    (de experimentos anteriores, sem relação com este app), descomente:
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.services CASCADE;


-- ─────────────────────────────────────────────────────────────────────────
-- 1. TABELAS BASE (cria se não existir)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.barbershops (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  owner_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT        UNIQUE NOT NULL
              DEFAULT     upper(left(replace(gen_random_uuid()::text, '-', ''), 6)),
  plan        TEXT        NOT NULL DEFAULT 'basic',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL DEFAULT 'Usuário',
  phone         TEXT        NOT NULL DEFAULT '',
  role          TEXT        NOT NULL DEFAULT 'client',
  specialty     TEXT,
  avatar        TEXT        NOT NULL DEFAULT '',
  barbershop_id UUID        REFERENCES public.barbershops(id) ON DELETE SET NULL,
  active        BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name   TEXT,
  barber_id     UUID        NOT NULL REFERENCES auth.users(id),
  barbershop_id UUID        REFERENCES public.barbershops(id) ON DELETE SET NULL,
  service_name  TEXT        NOT NULL,
  service_price NUMERIC     NOT NULL DEFAULT 0,
  date          DATE        NOT NULL,
  time          TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'upcoming'
                CHECK (status IN ('upcoming', 'current', 'done', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID        REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL DEFAULT '',
  category      TEXT        NOT NULL DEFAULT 'Finalizador',
  stock         INTEGER     NOT NULL DEFAULT 0,
  max_stock     INTEGER     NOT NULL DEFAULT 100,
  unit          TEXT        NOT NULL DEFAULT 'un',
  cost          NUMERIC     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID        REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL DEFAULT '',
  duration_min  INTEGER     NOT NULL DEFAULT 30,
  price         NUMERIC     NOT NULL DEFAULT 0,
  emoji         TEXT        NOT NULL DEFAULT '✂️',
  popular       BOOLEAN     NOT NULL DEFAULT false,
  active        BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────────────────
-- 2. COMPATIBILIDADE — completa colunas em tabelas que JÁ existiam
--    (cada linha é segura de re-rodar; nada é sobrescrito)
-- ─────────────────────────────────────────────────────────────────────────

-- barbershops
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS invite_code TEXT DEFAULT upper(left(replace(gen_random_uuid()::text, '-', ''), 6));
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS plan        TEXT NOT NULL DEFAULT 'basic';
UPDATE public.barbershops
  SET invite_code = upper(left(replace(gen_random_uuid()::text, '-', ''), 6))
  WHERE invite_code IS NULL;

-- profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name          TEXT NOT NULL DEFAULT 'Usuário';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone         TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role          TEXT NOT NULL DEFAULT 'client';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty     TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar        TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active        BOOLEAN NOT NULL DEFAULT true;

-- bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_name   TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_name  TEXT NOT NULL DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_price NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status        TEXT NOT NULL DEFAULT 'upcoming';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS created_at    TIMESTAMPTZ NOT NULL DEFAULT now();
-- client_id vira opcional (walk-ins não têm conta)
ALTER TABLE public.bookings ALTER COLUMN client_id DROP NOT NULL;

-- products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name          TEXT NOT NULL DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category      TEXT NOT NULL DEFAULT 'Finalizador';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock         INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_stock     INTEGER NOT NULL DEFAULT 100;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit          TEXT NOT NULL DEFAULT 'un';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost          NUMERIC NOT NULL DEFAULT 0;

-- services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS name          TEXT NOT NULL DEFAULT '';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duration_min  INTEGER NOT NULL DEFAULT 30;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS price         NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS emoji         TEXT NOT NULL DEFAULT '✂️';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS popular       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS active        BOOLEAN NOT NULL DEFAULT true;


-- ─────────────────────────────────────────────────────────────────────────
-- 3. ÍNDICES + PROTEÇÃO CONTRA AGENDAMENTO DUPLO
-- ─────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS bookings_barber_date_idx     ON public.bookings (barber_id, date);
CREATE INDEX IF NOT EXISTS bookings_barbershop_date_idx ON public.bookings (barbershop_id, date);
CREATE INDEX IF NOT EXISTS bookings_client_idx          ON public.bookings (client_id);
CREATE INDEX IF NOT EXISTS products_shop_idx            ON public.products (barbershop_id);
CREATE INDEX IF NOT EXISTS services_shop_idx            ON public.services (barbershop_id);

-- Remove duplicatas existentes (mantém o agendamento mais antigo de cada slot)
DELETE FROM public.bookings a
USING public.bookings b
WHERE a.barber_id = b.barber_id
  AND a.date      = b.date
  AND a.time      = b.time
  AND a.status   <> 'cancelled'
  AND b.status   <> 'cancelled'
  AND (a.created_at > b.created_at
       OR (a.created_at = b.created_at AND a.ctid > b.ctid));

-- Garante no banco: um barbeiro só tem UM agendamento ativo por slot
CREATE UNIQUE INDEX IF NOT EXISTS bookings_slot_unique
  ON public.bookings (barber_id, date, time)
  WHERE status <> 'cancelled';


-- ─────────────────────────────────────────────────────────────────────────
-- 4. FUNÇÕES E TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────

-- Helper usada nas policies (SECURITY DEFINER evita recursão de RLS)
CREATE OR REPLACE FUNCTION public.get_my_barbershop_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT barbershop_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Cria o profile automaticamente quando o usuário confirma o cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_name     TEXT;
  v_initials TEXT;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário');
  v_initials := upper(left(v_name, 1))
             || COALESCE(NULLIF(upper(left(split_part(v_name, ' ', 2), 1)), ''), '');

  INSERT INTO public.profiles (id, name, phone, role, specialty, avatar)
  VALUES (
    NEW.id,
    v_name,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NULLIF(NEW.raw_user_meta_data->>'specialty', ''),
    v_initials
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Semeia o catálogo padrão de serviços quando uma barbearia nova é criada
CREATE OR REPLACE FUNCTION public.seed_default_services()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.services (barbershop_id, name, duration_min, price, emoji, popular) VALUES
    (NEW.id, 'Corte Clássico',      30, 30,  '✂️', false),
    (NEW.id, 'Barba Completa',      20, 20,  '🧔', false),
    (NEW.id, 'Sobrancelha + Barba', 30, 40,  '⚡', true),
    (NEW.id, 'Corte + Barba',       45, 80,  '👑', true),
    (NEW.id, 'Tratamento Capilar',  60, 110, '✨', false);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_barbershop_created ON public.barbershops;
CREATE TRIGGER on_barbershop_created
  AFTER INSERT ON public.barbershops
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_services();


-- ─────────────────────────────────────────────────────────────────────────
-- 5. SEED PARA BARBEARIAS JÁ EXISTENTES (só insere se ainda não tiver)
-- ─────────────────────────────────────────────────────────────────────────

-- Serviços padrão
INSERT INTO public.services (barbershop_id, name, duration_min, price, emoji, popular)
SELECT b.id, s.name, s.dur, s.price, s.emoji, s.pop
FROM public.barbershops b
CROSS JOIN (VALUES
  ('Corte Clássico',      30, 30::numeric,  '✂️', false),
  ('Barba Completa',      20, 20::numeric,  '🧔', false),
  ('Sobrancelha + Barba', 30, 40::numeric,  '⚡', true),
  ('Corte + Barba',       45, 80::numeric,  '👑', true),
  ('Tratamento Capilar',  60, 110::numeric, '✨', false)
) AS s(name, dur, price, emoji, pop)
WHERE NOT EXISTS (
  SELECT 1 FROM public.services sv WHERE sv.barbershop_id = b.id
);

-- Kit inicial de estoque
INSERT INTO public.products (barbershop_id, name, category, stock, max_stock, unit, cost)
SELECT b.id, p.name, p.category, p.stock, p.max_stock, p.unit, p.cost
FROM public.barbershops b
CROSS JOIN (VALUES
  ('Pomada Matte',         'Finalizador',  8,  120, 'un', 45::numeric),
  ('Óleo de Barba',        'Barba',        3,  100, 'un', 38::numeric),
  ('Shampoo Profissional', 'Cabelo',       12, 150, 'un', 55::numeric),
  ('Navalha Descartável',  'Instrumental', 45, 500, 'cx', 12::numeric),
  ('Cera Modeladora',      'Finalizador',  2,  80,  'un', 42::numeric),
  ('Condicionador',        'Cabelo',       7,  120, 'un', 48::numeric)
) AS p(name, category, stock, max_stock, unit, cost)
WHERE NOT EXISTS (
  SELECT 1 FROM public.products pr WHERE pr.barbershop_id = b.id
);


-- ─────────────────────────────────────────────────────────────────────────
-- 6. RLS — remove TODAS as policies antigas e recria do zero
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  t TEXT;
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles', 'barbershops', 'bookings', 'products', 'services']
  LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services    ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────────────────
CREATE POLICY "read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Cliente precisa listar barbeiros para agendar
CREATE POLICY "read barber profiles" ON public.profiles
  FOR SELECT USING (role = 'barber');

-- Admin/barbeiro vê perfis da mesma barbearia
CREATE POLICY "staff reads shop profiles" ON public.profiles
  FOR SELECT USING (
    barbershop_id IS NOT NULL AND
    barbershop_id = public.get_my_barbershop_id()
  );

-- Dono da barbearia ativa/desativa barbeiros da equipe
CREATE POLICY "owner updates shop profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = profiles.barbershop_id AND b.owner_id = auth.uid()
    )
  );

-- ── barbershops ──────────────────────────────────────────────────────────
CREATE POLICY "public read barbershops" ON public.barbershops
  FOR SELECT USING (true);

CREATE POLICY "owner manage barbershop" ON public.barbershops
  FOR ALL
  USING      (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ── bookings ─────────────────────────────────────────────────────────────
CREATE POLICY "staff see shop bookings" ON public.bookings
  FOR SELECT USING (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "staff update shop bookings" ON public.bookings
  FOR UPDATE USING (barbershop_id = public.get_my_barbershop_id());

-- Staff cria agendamento manual (walk-in / telefone)
CREATE POLICY "staff insert shop bookings" ON public.bookings
  FOR INSERT WITH CHECK (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "client see own bookings" ON public.bookings
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "client insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- Cliente só pode alterar o próprio agendamento E somente para cancelar
CREATE POLICY "client cancel own bookings" ON public.bookings
  FOR UPDATE
  USING      (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid() AND status = 'cancelled');

-- ── products (estoque) ───────────────────────────────────────────────────
CREATE POLICY "staff read shop products" ON public.products
  FOR SELECT USING (barbershop_id = public.get_my_barbershop_id());

-- Barbeiro dá baixa de insumo; admin ajusta quantidades
CREATE POLICY "staff update shop products" ON public.products
  FOR UPDATE USING (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "owner insert products" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = barbershop_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "owner delete products" ON public.products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = barbershop_id AND b.owner_id = auth.uid()
    )
  );

-- ── services (catálogo) ──────────────────────────────────────────────────
-- Qualquer autenticado lê (cliente vê o catálogo de qualquer barbearia)
CREATE POLICY "anyone reads services" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "owner manages services" ON public.services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = barbershop_id AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = barbershop_id AND b.owner_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────
-- 7. VERIFICAÇÃO FINAL — rode e confira o resultado
-- ─────────────────────────────────────────────────────────────────────────

SELECT 'tabelas' AS item,
       count(*)::text AS resultado,
       'esperado: 5' AS esperado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('barbershops', 'profiles', 'bookings', 'products', 'services')

UNION ALL

SELECT 'policies',
       count(*)::text,
       'esperado: 19'
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'barbershops', 'bookings', 'products', 'services')

UNION ALL

SELECT 'trigger profiles',
       count(*)::text,
       'esperado: 1'
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'

UNION ALL

SELECT 'trigger serviços',
       count(*)::text,
       'esperado: 1'
FROM information_schema.triggers
WHERE trigger_name = 'on_barbershop_created'

UNION ALL

SELECT 'índice anti agendamento duplo',
       count(*)::text,
       'esperado: 1'
FROM pg_indexes
WHERE indexname = 'bookings_slot_unique';
