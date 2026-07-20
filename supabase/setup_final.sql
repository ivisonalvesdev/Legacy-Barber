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
--
-- Cria também o bucket de imagens (fotos de perfil e logo) e as policies de
-- Storage — não é preciso configurar nada pelo Dashboard.
-- ═══════════════════════════════════════════════════════════════════════

-- Evita validação antecipada do corpo de funções SQL (ordem-independente)
SET check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────────────────
-- 0. BUSCA DE BARBEARIAS — normalização de acentos
-- ─────────────────────────────────────────────────────────────────────────

-- Tira acentos e caixa para que "cabeleireiro jose" ache "Cabeleireiro José".
-- translate() em vez da extensão unaccent: é IMMUTABLE de verdade (logo pode
-- alimentar coluna gerada e índice) e não depende de dicionário instalado.
-- O front normaliza o termo digitado do mesmo jeito antes de consultar.
CREATE OR REPLACE FUNCTION public.normalize_search(TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT lower(translate($1,
    'áàâãäéèêëíìîïóòôõöúùûüñçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÑÇ',
    'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'))
$$;

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
  -- Vitrine: o cliente escolhe a barbearia por nome/endereço antes do barbeiro
  description      TEXT,
  phone            TEXT,
  logo_url         TEXT,
  -- Empresa (opcional): preenchidos via BrasilAPI a partir do CNPJ
  cnpj             TEXT,
  legal_name       TEXT,
  address_street   TEXT,
  address_number   TEXT,
  address_district TEXT,
  address_city     TEXT,
  address_state    TEXT,
  address_zip      TEXT,
  -- Só aparece para clientes depois que o dono completa o cadastro
  published   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL DEFAULT 'Usuário',
  phone         TEXT        NOT NULL DEFAULT '',
  role          TEXT        NOT NULL DEFAULT 'client',
  specialty     TEXT,
  avatar        TEXT        NOT NULL DEFAULT '',  -- iniciais (fallback visual)
  avatar_url    TEXT,                             -- foto no Storage; NULL → usa as iniciais
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

-- Livro-caixa de insumos: cada compra (in) e cada consumo (out) vira uma
-- linha com o custo da época. O estoque atual vive em products.stock; esta
-- tabela é o histórico que alimenta o relatório financeiro (quanto entra ×
-- quanto sai). Imutável de propósito: sem policy de UPDATE/DELETE, corrigir
-- é lançar um movimento contrário — como num caixa de verdade.
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID          NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  -- SET NULL + product_name: apagar o produto não pode apagar o gasto que
  -- ele gerou no relatório do mês.
  product_id    UUID          REFERENCES public.products(id) ON DELETE SET NULL,
  product_name  TEXT          NOT NULL,
  profile_id    UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
  type          TEXT          NOT NULL CHECK (type IN ('in', 'out')),
  qty           INTEGER       NOT NULL CHECK (qty > 0),
  unit_cost     NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────────────────
-- 2. COMPATIBILIDADE — completa colunas em tabelas que JÁ existiam
--    (cada linha é segura de re-rodar; nada é sobrescrito)
-- ─────────────────────────────────────────────────────────────────────────

-- barbershops
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS invite_code TEXT DEFAULT upper(left(replace(gen_random_uuid()::text, '-', ''), 6));
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS plan        TEXT NOT NULL DEFAULT 'basic';
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS description      TEXT;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS phone            TEXT;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS logo_url         TEXT;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS cnpj             TEXT;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS legal_name       TEXT;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS address_street   TEXT;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS address_number   TEXT;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS address_district TEXT;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS address_city     TEXT;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS address_state    TEXT;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS address_zip      TEXT;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS published        BOOLEAN NOT NULL DEFAULT false;
UPDATE public.barbershops
  SET invite_code = upper(left(replace(gen_random_uuid()::text, '-', ''), 6))
  WHERE invite_code IS NULL;

-- Coluna gerada que concentra o texto pesquisável (nome + bairro + cidade + UF)
-- já sem acento. STORED = calculada na escrita, então a busca só lê e usa índice.
-- Precisa vir DEPOIS das colunas de endereço acima.
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS search_text TEXT
  GENERATED ALWAYS AS (
    public.normalize_search(
      coalesce(name, '')             || ' ' ||
      coalesce(address_district, '') || ' ' ||
      coalesce(address_city, '')     || ' ' ||
      coalesce(address_state, '')
    )
  ) STORED;

-- profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name          TEXT NOT NULL DEFAULT 'Usuário';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone         TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role          TEXT NOT NULL DEFAULT 'client';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty     TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar        TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url    TEXT;
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
CREATE INDEX IF NOT EXISTS profiles_shop_role_idx       ON public.profiles (barbershop_id, role);
-- O relatório sempre pergunta "movimentos desta barbearia nos últimos N meses"
CREATE INDEX IF NOT EXISTS stock_movements_shop_date_idx ON public.stock_movements (barbershop_id, created_at);

-- Busca da vitrine: ILIKE '%termo%' não usa índice B-tree comum, por isso o
-- índice de trigramas. É otimização — se pg_trgm não estiver disponível, a
-- busca continua correta (só varre a tabela, aceitável nesta escala).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS barbershops_search_idx
    ON public.barbershops USING GIN (search_text gin_trgm_ops);
EXCEPTION WHEN undefined_object OR insufficient_privilege THEN
  RAISE NOTICE 'pg_trgm indisponível — busca segue funcionando sem índice.';
END $$;

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

-- Detecta contas de demonstração (…demo@legacybarber.com).
-- Usada para deixar os dados mock APENAS para visualização: as policies
-- restritivas mais abaixo bloqueiam escrita quando esta função retorna true.
-- SECURITY DEFINER: precisa ler auth.users, invisível ao usuário comum.
-- Obs.: a conta do dev (admin@legacybarber.com, SEM ".demo") NÃO é afetada.
CREATE OR REPLACE FUNCTION public.is_demo_user()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND email LIKE '%.demo@legacybarber.com'
  )
$$;

-- Valida o código de convite no cadastro do barbeiro, devolvendo só id e nome.
-- Roda anônima (antes do signUp) e nunca expõe o código de volta.
CREATE OR REPLACE FUNCTION public.find_shop_by_invite(p_code TEXT)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT b.id, b.name FROM public.barbershops b
  WHERE b.invite_code = upper(trim(p_code))
  LIMIT 1
$$;

-- Único caminho para ler um invite_code, e só o do próprio dono.
CREATE OR REPLACE FUNCTION public.my_invite_code()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT invite_code FROM public.barbershops WHERE owner_id = auth.uid() LIMIT 1
$$;

-- Barbearia à qual um barbeiro pertence. Usada no WITH CHECK do agendamento
-- para impedir que o cliente monte um booking com barbeiro de uma barbearia e
-- barbershop_id de outra (o front deriva certo, mas a API aceitaria na mão).
-- SECURITY DEFINER: a checagem não pode depender do que o cliente enxerga.
-- Admin também conta: o dono pode atender clientes como barbeiro.
CREATE OR REPLACE FUNCTION public.barber_shop_id(p_barber UUID)
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT barbershop_id FROM public.profiles
  WHERE id = p_barber AND role IN ('barber', 'admin') AND active
$$;

-- Confere que nome e preço batem com um serviço ativo do catálogo da barbearia.
-- Sem isto o cliente escolhe o preço que quiser via API e distorce o
-- faturamento do dono — o valor nunca deve vir de quem paga.
CREATE OR REPLACE FUNCTION public.service_matches(p_shop UUID, p_name TEXT, p_price NUMERIC)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.services
    WHERE barbershop_id = p_shop
      AND name  = p_name
      AND price = p_price
      AND active
  )
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

-- (O antigo "kit inicial de estoque" foi removido de propósito: barbearia
-- nova nasce com o estoque VAZIO — o dono cadastra os insumos reais dele.
-- Dados fictícios são papel do scripts/seed-demo-data.mjs, só na demo.)


-- ─────────────────────────────────────────────────────────────────────────
-- 6. RLS — remove TODAS as policies antigas e recria do zero
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  t TEXT;
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles', 'barbershops', 'bookings', 'products', 'services', 'stock_movements']
  LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershops     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────────────────
CREATE POLICY "read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Cliente precisa listar barbeiros para agendar. O dono (admin) também
-- aparece: muitas vezes ele é um dos barbeiros da própria barbearia.
CREATE POLICY "read barber profiles" ON public.profiles
  FOR SELECT USING (
    role = 'barber'
    OR (role = 'admin' AND barbershop_id IS NOT NULL)
  );

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
-- Vitrine: só barbearia publicada aparece na busca do cliente. O dono
-- continua enxergando a própria (policy abaixo) mesmo antes de publicar, e o
-- barbeiro precisa ler a dele para validar o código de convite no cadastro.
CREATE POLICY "read published barbershops" ON public.barbershops
  FOR SELECT USING (
    published
    OR owner_id = auth.uid()
    OR id = public.get_my_barbershop_id()
  );

CREATE POLICY "owner manage barbershop" ON public.barbershops
  FOR ALL
  USING      (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ⚠️ Escalonamento de privilégio: a vitrine é pública, e RLS filtra LINHAS,
-- não COLUNAS. Sem isto, qualquer um lê o invite_code de qualquer barbearia e
-- se cadastra como barbeiro dela — ganhando agenda e estoque. Quem precisa do
-- código usa find_shop_by_invite() (cadastro) ou my_invite_code() (dono).
--
-- "REVOKE SELECT (invite_code)" sozinho NÃO funciona: no Postgres o privilégio
-- de tabela se sobrepõe ao de coluna, e o Supabase concede SELECT na tabela
-- inteira para anon/authenticated por padrão. O revoke de coluna vira no-op
-- silencioso. É preciso tirar o SELECT da TABELA e reconceder coluna a coluna.
--
-- A lista é montada por consulta (deny-list) em vez de escrita à mão: coluna
-- nova entra sozinha e o app não quebra ao adicionar campo na vitrine. Para
-- esconder outro campo no futuro, some-o ao NOT IN.
DO $$
DECLARE cols TEXT;
BEGIN
  SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum) INTO cols
  FROM pg_attribute
  WHERE attrelid = 'public.barbershops'::regclass
    AND attnum > 0 AND NOT attisdropped
    AND attname NOT IN ('invite_code');

  REVOKE SELECT ON public.barbershops FROM anon, authenticated;
  EXECUTE format('GRANT SELECT (%s) ON public.barbershops TO anon, authenticated', cols);
END $$;

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

-- O cliente monta o payload inteiro, então o banco confere o que ele não pode
-- escolher: que o barbeiro realmente trabalha na barbearia informada e que o
-- preço é o do catálogo. Sem isso dá para agendar com barbeiro de outra
-- barbearia ou por R$ 0 chamando a API direto.
CREATE POLICY "client insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    client_id     = auth.uid()
    AND barbershop_id = public.barber_shop_id(barber_id)
    AND public.service_matches(barbershop_id, service_name, service_price)
  );

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

-- ── stock_movements (livro-caixa de insumos) ─────────────────────────────
CREATE POLICY "staff read shop movements" ON public.stock_movements
  FOR SELECT USING (barbershop_id = public.get_my_barbershop_id());

-- Barbeiro registra consumo, dono registra compra — sempre em nome próprio
-- e na própria barbearia. Sem UPDATE/DELETE: o histórico não se reescreve.
CREATE POLICY "staff insert shop movements" ON public.stock_movements
  FOR INSERT WITH CHECK (
    barbershop_id = public.get_my_barbershop_id()
    AND profile_id = auth.uid()
  );

-- Obs.: o modo somente-leitura das contas demo NÃO faz parte deste script —
-- ele é opcional e vive em supabase/demo_readonly.sql (e _off.sql para
-- destravar). Assim rodar o setup de novo nunca trava a demo sem querer.


-- ─────────────────────────────────────────────────────────────────────────
-- 7. STORAGE — fotos de perfil e logo da barbearia
-- ─────────────────────────────────────────────────────────────────────────

-- Bucket público na leitura (a foto aparece para qualquer visitante) e
-- limitado a 2 MB / imagens — o limite vive aqui porque validação de front
-- não impede upload direto pela API.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Caminhos: users/{user_id}/…  e  shops/{barbershop_id}/…
-- A pasta é o dono do arquivo; storage.foldername() lê esse prefixo.
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname IN ('avatars public read', 'avatars user writes own',
                         'avatars owner writes shop')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "avatars public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Cada usuário só escreve dentro da própria pasta
CREATE POLICY "avatars user writes own" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Logo da barbearia: o dono dela. Aceita o vínculo por DUAS vias — owner_id
-- da barbearia OU admin com profiles.barbershop_id apontando para ela. A
-- segunda via cobre barbearias antigas/demo cujo owner_id ficou nulo ou
-- dessincronizado (era a causa do "erro de policy" ao trocar a logo).
CREATE POLICY "avatars owner writes shop" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'shops'
    AND (
      EXISTS (
        SELECT 1 FROM public.barbershops b
        WHERE b.id::text = (storage.foldername(name))[2]
          AND b.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
          AND p.barbershop_id::text = (storage.foldername(name))[2]
      )
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'shops'
    AND (
      EXISTS (
        SELECT 1 FROM public.barbershops b
        WHERE b.id::text = (storage.foldername(name))[2]
          AND b.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
          AND p.barbershop_id::text = (storage.foldername(name))[2]
      )
    )
  );


-- ─────────────────────────────────────────────────────────────────────────
-- 8. VERIFICAÇÃO FINAL — rode e confira o resultado
-- ─────────────────────────────────────────────────────────────────────────

SELECT 'tabelas' AS item,
       count(*)::text AS resultado,
       'esperado: 6' AS esperado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('barbershops', 'profiles', 'bookings', 'products', 'services', 'stock_movements')

UNION ALL

SELECT 'policies',
       count(*)::text,
       'esperado: 21'
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'barbershops', 'bookings', 'products', 'services', 'stock_movements')

UNION ALL

SELECT 'bucket de imagens',
       count(*)::text,
       'esperado: 1'
FROM storage.buckets WHERE id = 'avatars'

UNION ALL

SELECT 'policies do storage',
       count(*)::text,
       'esperado: 3'
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE 'avatars %'

UNION ALL

-- Confere o fechamento do escalonamento de privilégio: nenhum dos dois papéis
-- pode ler invite_code direto da tabela.
SELECT 'invite_code protegido',
       CASE WHEN count(*) = 0 THEN 'sim' ELSE 'NÃO — revogue!' END,
       'esperado: sim'
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'barbershops'
  AND column_name = 'invite_code' AND privilege_type = 'SELECT'
  AND grantee IN ('anon', 'authenticated')

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
