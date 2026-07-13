-- ═══════════════════════════════════════════════════════════════════════
-- TRIGGER: Cria linha em `profiles` automaticamente quando usuário
--          é criado em auth.users (via cadastro ou script de demo).
--
-- RODAR NO SUPABASE:
--   Dashboard → SQL Editor → New query → colar tudo → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Função que gera o perfil ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER           -- contorna RLS para poder fazer INSERT
SET search_path = public
AS $$
DECLARE
  v_name      TEXT;
  v_initials  TEXT;
  v_first     TEXT;
  v_second    TEXT;
BEGIN
  v_name    := COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário');
  v_first   := upper(left(v_name, 1));
  v_second  := upper(left(split_part(v_name, ' ', 2), 1));
  v_initials := v_first || COALESCE(NULLIF(v_second, ''), '');

  INSERT INTO public.profiles (id, name, phone, role, specialty, avatar)
  VALUES (
    NEW.id,
    v_name,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role',  'client'),
    NULLIF(NEW.raw_user_meta_data->>'specialty', ''),
    v_initials
  )
  ON CONFLICT (id) DO NOTHING;   -- seguro re-rodar sem duplicar

  RETURN NEW;
END;
$$;

-- ── 2. Trigger que dispara após cada INSERT em auth.users ───────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rode após criar o trigger para confirmar):
--   SELECT routine_name FROM information_schema.routines
--   WHERE routine_name = 'handle_new_user';
--
--   SELECT trigger_name FROM information_schema.triggers
--   WHERE trigger_name = 'on_auth_user_created';
-- ═══════════════════════════════════════════════════════════════════════
