-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Cria profiles manualmente para as contas demo + dev
-- Rodar no Supabase: SQL Editor → New query → colar tudo → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Cria profiles para todos os usuários demo (se não existirem) ────
INSERT INTO public.profiles (id, name, phone, role, specialty, avatar)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', 'Usuário')  AS name,
  COALESCE(u.raw_user_meta_data->>'phone', '')         AS phone,
  COALESCE(u.raw_user_meta_data->>'role',  'client')   AS role,
  NULLIF(u.raw_user_meta_data->>'specialty', '')        AS specialty,
  upper(left(COALESCE(u.raw_user_meta_data->>'name','U'), 1)) ||
  COALESCE(upper(left(NULLIF(split_part(u.raw_user_meta_data->>'name', ' ', 2), ''), 1)), '')
    AS avatar
FROM auth.users u
WHERE u.email IN (
  'admin@legacybarber.com',
  'admin.demo@legacybarber.com',
  'barber.demo@legacybarber.com',
  'client.demo@legacybarber.com'
)
ON CONFLICT (id) DO UPDATE SET
  name      = EXCLUDED.name,
  phone     = EXCLUDED.phone,
  role      = EXCLUDED.role,
  specialty = EXCLUDED.specialty,
  avatar    = EXCLUDED.avatar;

-- ── 2. Vincula conta dev à barbearia "Legacy Barber" ──────────────────
UPDATE public.profiles p
SET barbershop_id = b.id
FROM public.barbershops b
JOIN auth.users u ON b.owner_id = u.id
WHERE u.email = 'admin@legacybarber.com'
  AND b.name  = 'Legacy Barber'
  AND p.id    = u.id;

-- ── 3. Vincula admin demo à barbearia "Legacy Barber Demo" ────────────
UPDATE public.profiles p
SET barbershop_id = b.id
FROM public.barbershops b
JOIN auth.users u ON b.owner_id = u.id
WHERE u.email = 'admin.demo@legacybarber.com'
  AND b.name  = 'Legacy Barber Demo'
  AND p.id    = u.id;

-- ── 4. Vincula barbeiro demo à barbearia "Legacy Barber Demo" ─────────
UPDATE public.profiles p
SET barbershop_id = b.id
FROM public.barbershops b
JOIN auth.users admin_u ON b.owner_id = admin_u.id
JOIN auth.users barber_u ON barber_u.email = 'barber.demo@legacybarber.com'
WHERE admin_u.email = 'admin.demo@legacybarber.com'
  AND p.id = barber_u.id;

-- ── 5. Verificação final — deve mostrar 4 linhas com dados corretos ────
SELECT
  u.email,
  p.name,
  p.role,
  p.avatar,
  b.name AS barbearia
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN public.barbershops b ON b.id = p.barbershop_id
WHERE u.email IN (
  'admin@legacybarber.com',
  'admin.demo@legacybarber.com',
  'barber.demo@legacybarber.com',
  'client.demo@legacybarber.com'
)
ORDER BY p.role;
